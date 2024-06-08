const express = require("express");
const {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
} = require("../controllers/promotion-controllers");
const {uploadImages} = require("../config/multer");
const router = express.Router();
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");

router.post(
  "/createPromotion",
  isAuthenticated,
  isHRAdmin,
 uploadImages.array("images", 10),
  createPromotion
);
router.get("/getAllPromotions", getAllPromotions);
router.get(
  "/getPromotionById/:id",
  isAuthenticated,
  getPromotionById
);
router.put(
  "/updatePromotionById/:id",
  uploadImages.array("images", 10),
  isAuthenticated,
  isHRAdmin,
  updatePromotionById
);
router.delete("/deletePromotionById/:id",isAuthenticated,
isHRAdmin, deletePromotionById);
module.exports = router;
