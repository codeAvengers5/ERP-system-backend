const express = require("express");
const {
    deleteNewsById,
    updateNewsById,
    getNewsById,
    getAllNews,
    createNews,
} = require("../controllers/news-controller");
const {uploadImages} = require("../config/multer");
const router = express.Router();
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");

router.post(
  "/createNews",
  isAuthenticated,
  isHRAdmin,
 uploadImages.array("images", 10),
 createNews
);
router.get("/getAllNews", isAuthenticated, getAllNews);
router.get(
  "/getNewsById/:id",
  isAuthenticated,
  getNewsById
);
router.put(
  "/updateNewsById/:id",
  uploadImages.array("images", 10),
  isAuthenticated,
  isHRAdmin,
  updateNewsById
);
router.delete("/deleteNewsById/:id",isAuthenticated,isHRAdmin, deleteNewsById);
module.exports = router;
