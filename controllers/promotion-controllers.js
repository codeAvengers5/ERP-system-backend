const Promotion = require("../models/promotion");
const joi = require("@hapi/joi");
const cloudinary = require("../config/coludinary");
const fs = require("fs");
const promotionValidator = joi.object({
  title: joi.string().required(),
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
async function createPromotion(req, res) {
  const { title, description } = req.body;
  const images = req.files;
  const { error } = promotionValidator.validate({
    title,
    description,
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
      const promotion = new Promotion({
        title,
        description,
        images: urls,
      });
      await promotion.save();

      res.status(201).json({
        message: "Promotion created successfully",
      });
    } else {
      return res.status(405).json({
        err: `${req.method} method not allowed`,
      });
    }
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ error: error });
  }
}
async function getAllPromotions(req, res) {
  try {
    const promotions = await Promotion.find();

    res.status(200).json(promotions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
}
async function getPromotionById(req, res) {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch promotion" });
  }
}
async function updatePromotionById(req, res) {
  console.log(req.body);
  const { id } = req.params;
  const { title, description } = req.body;
  const images = req.files;
  const { error } = promotionValidator.validate({
    title,
    description,
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
      const promotion = await Promotion.findByIdAndUpdate(
        id,
        {
          title: title,
          description: description,
          images: urls,
        },
        { new: true }
      );

      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      res.json({ message: "Promotion updated successfully", promotion });
    } else {
      return res.status(405).json({
        err: `${req.method} method not allowed`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update promotion" });
  }
}
async function deletePromotionById(req, res) {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete promotion" });
  }
}

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
};
