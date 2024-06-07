const joi = require("joi");
const JobPost = require("../models/jobPost");
const JobSummary = require("../models/jobSummary");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const dotenv = require("dotenv");
const Role = require("../models/role");
const SiteUserNotification = require("../models/siteuserNotification");
const Notification = require("../models/notification");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const jobPostValidator = joi.object({
  full_name: joi.string().required(),
  // email: joi.string().email().required(),
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
async function ViewJobUser(req, res) {
  const userId = req.user.id;
  try {
    const jobVacancies = await JobSummary.find({ user_id: userId });
    console.log(jobVacancies);
    if (jobVacancies.length > 0) {
      const jobs = await Promise.all(jobVacancies.map(async (jobVacancy) => {
        const job = await JobPost.findById(jobVacancy.job_id);
        return { job, jobVacancy };
      }));
      res.status(200).json(jobs);
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  } catch (error) {
    console.log(`Error in viewing the job post: ${error}`);
    res.status(500).json({ error: "An error occurred while fetching the job posts" });
  }
}
async function JobApply(req, res) {
  const { id } = req.params;
  const { full_name, phone_no } = req.body;
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
    phone_no,
    cv,
  });
  console.log("cv",cv);
  if (error) {
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
        console.log("checkkkk",err, result)
        if (err) {
          return res.send("File format is wrong! Only pdf files are supported.");
        }
        fs.unlinkSync(path);
        const cvUrl = result.url;
        const appliedUser = new JobSummary({
          job_id: id,
          full_name,

          phone_no,
          cv: cvUrl,
          user_id: userId,
          status: "pending",
        });
        await appliedUser.save();
        res.status(201).json({
          message: "You have Successfully applied to the job application",
          value: { appliedUser },
        });
        const job = await JobPost.findOne({ _id: id });
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
    console.log("error", error);
    return res.status(500).json({ error: 'Internal server error' });
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
      return res.status(404).json({ message: "job apply not found" });
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
async function searchJobs(req, res) {
  const { title } = req.query;
  try {
    const jobs = await JobPost.find({
      title: { $regex: `^${title}`, $options: "i" },
    });
    return res.status(200).json({
      jobs: jobs,
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  ViewJob,
  ViewJobUser,
  JobApply,
  ViewJobSummary,
  StatusChange,
  searchJobs,
};
