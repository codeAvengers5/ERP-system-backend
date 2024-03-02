const express = require("express");
const {
  RegisterAdminUser,
  LoginAdminUser,
  Enable2FA,
  Verify2FA,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} = require("../controllers/adminuser-controllers");
const upload = require("../config/multer");
const { isAuthenticated, isItAdmin } = require("../middleware/auth");
const router = express.Router();
router.get("/itadmin", isAuthenticated,isItAdmin,(req, res) => {
  res.send("Welcome");
});
router.post("/registeradmins", upload.array("images", 10), RegisterAdminUser);
router.post("/loginadmin", LoginAdminUser);
router.post("/enable2fa/:id", Enable2FA);
router.post("/verify2fa/:id", Verify2FA);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
router.post("/updatepassword/:id", UpdatePassword);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
module.exports = router;
