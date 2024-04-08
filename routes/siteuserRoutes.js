const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} = require("../controllers/siteuser-contollers");
const router = express.Router();
router.post("/registeruser", RegisterSiteUser);
router.post("/loginuser", LoginSiteUser);
router.post("/confirmemail", ConfirmEmail);
router.post("/forgot-password", ForgotPassword);
router.post("/reset_password/:id/:token", ResetPassword);
router.post("/update_password/:id", UpdatePassword);
module.exports = router;
