const News = require("../models/news");
const joi = require("joi");
const cloudinary = require("../config/coludinary");
const fs = require("fs");
const newsValidator = joi.object({
  title: joi.string().required(),
  for_all: joi.boolean().required(),
  description: joi.string().required(),
  images: joi
    .array()
    .items(
      joi.object({
        fieldname: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().valid("image/jpeg", "image/png").required(),
        size: joi.number().required(),
      })
    )
    .min(1)
    .required(),
});
async function createNews(req, res) {
    const { title,for_all, description } = req.body;
    const images = req.files;
    const { error } = newsValidator.validate({
      title,
      description,
      for_all,
      images,
    });
    if (error) {
      console.log("Having error...");
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      const uploader = async (path) => await cloudinary.uploads(path, "Images");
      if (req.method === "POST") {
        const urls = [];
        const files = req.files;
        for (const file of files) {
          const { path } = file;
          const newPath = await uploader(path);
          urls.push(newPath);
          fs.unlinkSync(path);
        }
        const news = new News({
          title,
          description,
          for_all,
          images: urls,
        });
        await news.save();
  
        res.status(201).json({
          message: "News created successfully",
        });
      } else {
        return res.status(405).json({
          err: `${req.method} method not allowed`,
        });
      }
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ error: error });
    }
  }
  async function getAllNews(req, res) {
    try {
        let news;
        if (req.user && req.user.role === 'employee') {
        // If the user is an employee, fetch all news
        news = await News.find();
        } else {
        // If the user is not an employee, fetch only news with for_all set to true
        news = await News.find({ for_all: true });
        }
  
      res.status(200).json(news);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  }
  async function getNewsById(req, res) {
    try {
      const { id } = req.params;
      const news = await News.findById(id);
      if (!news) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  }
  async function updateNewsById(req, res) {
    console.log(req.body);
    const { id } = req.params;
    const { title, description,for_all } = req.body;
    const images = req.files;
    const { error } = newsValidator.validate({
      title,
      description,
      for_all,
      images,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      const uploader = async (path) => await cloudinary.uploads(path, "Images");
      if (req.method === "PUT") {
        const urls = []; // Declare and initialize the urls array
        console.log(req.files);
        const files = req.files;
        for (const file of files) {
          const { path } = file;
          const newPath = await uploader(path);
          urls.push(newPath);
          fs.unlinkSync(path);
        }
        const news = await News.findByIdAndUpdate(
          id,
          {
            title: title,
            description: description,
            for_all: for_all,
            images: urls,
          },
          { new: true }
        );
  
        if (!news) {
          return res.status(404).json({ error: "News not found" });
        }
        res.json({ message: "News updated successfully", news });
      } else {
        return res.status(405).json({
          err: `${req.method} method not allowed`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update news" });
    }
  }
  async function deleteNewsById(req, res) {
    try {
      const { id } = req.params;
  
      const news = await News.findByIdAndDelete(id);
  
      if (!news) {
        return res.status(404).json({ error: "News not found" });
      }
  
      res.json({ message: "News deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete news" });
    }
  }
  module.exports={
    deleteNewsById,
    updateNewsById,
    getNewsById,
    getAllNews,
    createNews,
  }