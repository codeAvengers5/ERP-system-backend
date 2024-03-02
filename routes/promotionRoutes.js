const express = require("express");
const {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
} = require("../controllers/promotion-controller");
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
router.get("/getAllPromotions", isAuthenticated, isHRAdmin, getAllPromotions);
router.get(
  "/getPromotionById/:id",
  isAuthenticated,
  isHRAdmin,
  getPromotionById
);
router.put(
  "/updatePromotionById/:id",
  isAuthenticated,
  isHRAdmin,
  updatePromotionById
);
router.delete("/deletePromotionById/:id", deletePromotionById);
module.exports = router;
