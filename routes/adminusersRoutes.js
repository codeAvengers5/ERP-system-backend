const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
} = require("../controllers/siteuser-contollers");
const {
  RegisterAdminUser,
  LoginAdminUser,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} = require("../controllers/adminuser-controllers");
const upload = require("../config/multer");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeradmins", upload.array("images", 10), RegisterAdminUser);
router.post("/loginadmin", LoginAdminUser);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
router.post("/updatepassword/:id", UpdatePassword);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
module.exports = router;
