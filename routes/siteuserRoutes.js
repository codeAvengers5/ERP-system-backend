const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} = require("../controllers/siteuser-contollers");
const { ViewJob, JobApply } = require("../controllers/jobapply-contollers");
const { uploadCV } = require("../config/multer");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeruser", RegisterSiteUser);
router.post("/loginuser", LoginSiteUser);
router.post("/confirmemail", ConfirmEmail);
router.post("/forgot-password", ForgotPassword);
router.post("/reset_password/:id/:token", ResetPassword);
router.post("/update_password/:id", UpdatePassword);
router.get("/joblist", ViewJob);
router.post("/jobapply/:id", uploadCV.single("cv"), JobApply);
module.exports = router;
