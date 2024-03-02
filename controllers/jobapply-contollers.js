const joi = require("@hapi/joi");
const JobPost = require("../models/jobPost");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const JobSummary = require("../models/jobSummary");
const fs = require("fs");
const jobPostValidator = joi.object({
  full_name: joi.string().required(),
  email: joi.string().email().required(),
  phone_no: joi.string().min(6).required(),
  cv: joi
    .object({
      fieldname: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      destination: joi.string().required(),
      mimetype: joi.string().valid("application/pdf").required(),
      size: joi.number().required(),
    })
    .required(),
});

async function ViewJob(req, res) {
  try {
    const jobvacancy = await JobPost.find({});
    res.json(jobvacancy);
  } catch (error) {
    console.log(`Error in viewing the job post: ${error}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
async function JobApply(req, res) {
  const { id } = req.params;
  const { full_name, email, phone_no } = req.body;
  const cv = req.file;
  const userId = req.session.userId;
  if (!userId) {
    return res.status(403).json({ message: "you should be logged in first" });
  }
  if (!(await JobPost.findOne({ _id: id }))) {
    return res.status(404).json({
      status: "fail",
      message: "Job does not exist",
    });
  }
  const { error } = jobPostValidator.validate({
    full_name,
    email,
    phone_no,
    cv,
  });
  if (error) {
    console.log("error is here");
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const existingApplication = await JobSummary.findOne({
      job_id: id,
      user_id: userId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied to this job",
        value: { appliedUser: existingApplication },
      });
    }
    const path = cv.path;
    cloudinary.uploader.upload(
      path,
      { resource_type: "raw" },
      function (err, result) {
        if (err) {
          // Handle the upload error
          console.error(err);
          return res.send(
            "File format is wrong! Only pdf files are supported."
          );
        }
        fs.unlinkSync(path);
        const cvUrl = result.url;
        console.log(result);
        const appliedUser = new JobSummary({
          job_id: "65d8deb6432f60d7d0719971",
          full_name,
          email,
          phone_no,
          cv: cvUrl,
          user_id: userId,
        });
        appliedUser.save();
        res.status(201).json({
          message: "You have Successfully applied to the job application",
          value: { appliedUser },
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
}
async function JobSummary(req, res) {
  try {
    const jobsummary = await JobSummary.find({});
    res.json(jobsummary);
  } catch (error) {
    console.log(`Error in viewing the job post: ${error}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
module.exports = {
  ViewJob,
  JobApply,
  JobSummary,
};
