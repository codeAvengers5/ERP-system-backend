const joi = require("joi");
const JobPost = require("../models/jobPost");
const JobSummary = require("../models/jobSummary");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const dotenv = require("dotenv");
const Role = require("../models/role");
const SiteUserNotification = require("../models/siteuserNotification");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  const userId = req.user.id;
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
      async function (err, result) {
        if (err) {
          console.error(err);
          return res.send(
            "File format is wrong! Only pdf files are supported."
          );
        }
        fs.unlinkSync(path);
        const cvUrl = result.url;
        const appliedUser = new JobSummary({
          job_id: id,
          full_name,
          email,
          phone_no,
          cv: cvUrl,
          user_id: userId,
          status: "pending",
        });
        appliedUser.save();
        res.status(201).json({
          message: "You have Successfully applied to the job application",
          value: { appliedUser },
        });
        const job = JobPost.find({ job_id });
        const hr = await Role.findOne({ role_name: "hradmin" });
        const notification = new Notification({
          recipient: "hradmin",
          message: `${appliedUser.full_name} has been applied to ${job.title} application`,
          employee_id: hr.employee_id,
        });
        await notification.save();
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
}
async function ViewJobSummary(req, res) {
  try {
    const jobsummary = await JobSummary.find({});
    res.json(jobsummary);
  } catch (error) {
    console.log(`Error in viewing the job post: ${error}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
async function StatusChange(req, res) {
  try {
    const { id } = req.params; //job id
    const { status } = req.body;
    const jobSummary = await JobSummary.findById(id);
    if (!jobSummary) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    jobSummary.status = status;

    if (status === "rejected") {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const currentTime = new Date().getTime();
      const timeSinceCreation = currentTime - jobSummary.createdAt.getTime();

      if (timeSinceCreation <= twentyFourHours) {
        await JobSummary.findByIdAndDelete(id);
        return res.status(200).json({ message: "Job summary deleted" });
      }
    }
    res.status(200).json(jobSummary);
    await jobSummary.save();
    const notification = new SiteUserNotification({
      userId: jobSummary.user_id,
      message: `You Application has been ${jobSummary.status}`,
    });
    await notification.save();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  ViewJob,
  JobApply,
  ViewJobSummary,
  StatusChange,
};
