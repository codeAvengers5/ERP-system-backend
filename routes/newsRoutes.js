const express = require("express");
const {
    deleteNewsById,
    updateNewsById,
    getNewsById,
    getAllNews,
    createNews,
    searchNews,
} = require("../controllers/news-controller");
const {uploadImages} = require("../config/multer");
const router = express.Router();
const { isAuthenticated, isManager } = require("../middleware/auth");

router.get("/searchnews", searchNews);

router.post(
  "/createNews",
  isAuthenticated,
  isManager,
 uploadImages.array("images", 10),
 createNews
);
router.get("/getAllNews", getAllNews);
router.get(
  "/getNewsById/:id",
  getNewsById
);
router.put(
  "/updateNewsById/:id",
  uploadImages.array("images", 10),
  isAuthenticated,
  isManager,
  updateNewsById
);
router.delete("/deleteNewsById/:id",isAuthenticated,isManager, deleteNewsById);
module.exports = router;
