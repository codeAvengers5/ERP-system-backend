const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
  ForgotPassword,
  ResetPassword,
} = require("../controllers/siteuser-contollers");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeruser", RegisterSiteUser);
router.post("/loginuser", LoginSiteUser);
router.post("/confirmemail", ConfirmEmail);
router.post("/forgot-password", ForgotPassword);
router.post("/reset_password/:id/:token", ResetPassword);
module.exports = router;
