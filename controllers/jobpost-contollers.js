const JobPost = require("../models/jobPost");
const joi = require("@hapi/joi");
const jobPostValidator = joi.object({
  title: joi.string().required(),
  description: joi.string().required(),
  requirement: joi.string().required(),
  responsibility: joi.string().required(),
  salary: joi.number().required(),
});
const createJobPost = async (req, res) => {
  try {
    const { title, description, requirement, responsibility, salary } =
      req.body;
    const { error } = jobPostValidator.validate({
      title,
      description,
      requirement,
      responsibility,
      salary,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const jobPost = new JobPost({
      title,
      description,
      requirement,
      responsibility,
      salary,
    });
    await jobPost.save();
    res.status(201).json({ message: "Job post created successfully", jobPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job post" });
  }
};
const getAllJobPosts = async (req, res) => {
  try {
    const jobPosts = await JobPost.find();

    res.json(jobPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job posts" });
  }
};
const getJobPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    res.json(jobPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job post" });
  }
};
const updateJobPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirement, responsibility, salary } =
      req.body;
    const jobPost = await JobPost.findByIdAndUpdate(
      id,
      {
        title,
        description,
        requirement,
        responsibility,
        salary,
      },
      { new: true }
    );

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    res.json({ message: "Job post updated successfully", jobPost });
  } catch (error) {
    res.status(500).json({ error: "Failed to update job post" });
  }
};
const deleteJobPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobPost = await JobPost.findByIdAndDelete(id);

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    res.json({ message: "Job post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job post" });
  }
};

module.exports = {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPostById,
  deleteJobPostById,
};
