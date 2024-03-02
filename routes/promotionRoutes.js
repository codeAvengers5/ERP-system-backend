const express = require("express");
const {
    createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
}=require("../controllers/promotion-controller");
const upload = require("../config/multer");
const router = express.Router();
const { isAuthenticated, isHRAdmin ,isEmployee} = require("../middleware/auth");

router.post('/createPromotion/:id',upload.array("images", 10),createPromotion);
router.get('/getAllPromotions',getAllPromotions);
router.get('/getPromotionById/:id',getPromotionById);
router.put('/updatePromotionById/:id',updatePromotionById);
router.delete('/deletePromotionById/:id',deletePromotionById);
module.exports = router;