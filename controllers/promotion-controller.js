const Promotion = require("../models/promotion");
const joi = require("@hapi/joi");
const cloudinary = require("../config/coludinary");
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
  
// Create a new promotion
const createPromotion = async (req, res) => {
  try{
    const { title, description } = req.body;
    const image = req.files;
    const { error } = promotionValidator.validate({
        title,
        description,
        image,
      });
    const employeeId = req.params.id;
    const promotion = new Promotion({
      title,
      description,
      image,
      employee_id: employeeId,
    });
    if (error) {
        console.log("Having error...");
        return res.status(400).json({ error: error.details[0].message });
      }
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
    await promotion.save();

    res.status(201).json({ message: 'Promotion created successfully', promotion });
    }
    else {
        return res.status(405).json({
          err: `${req.method} method not allowed`,
        });
      }
     } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
};

// Get all promotions
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find();

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
};

// Get a specific promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotion' });
  }
};

// Update a promotion by ID
const updatePromotionById = async (req, res) => {
  try {
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

    const uploader = async (path) => await cloudinary.uploads(path, "Images");
    const urls = [];

    for (const image of images) {
      const { path } = image;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      {
        title,
        description,
        images: urls,
      },
      { new: true }
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ message: 'Promotion updated successfully', promotion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
};

module.exports = updatePromotionById;
// Delete a promotion by ID
const deletePromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
};