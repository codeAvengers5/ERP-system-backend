const express = require("express");
const {
  RegisterAdminUser,
  LoginAdminUser,
  Enable2FA,
  Verify2FA,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
  LogoutAdminUser,
  ready,
  validate,
  validateBackup,
} = require("../controllers/adminuser-controllers");
const { uploadImages } = require("../config/multer");
const { isAuthenticated, isItAdmin } = require("../middleware/auth");
const router = express.Router();
router.get("/itadmin", isAuthenticated, isItAdmin, (req, res) => {
  res.send("Welcome");
});
router.post(
  "/registeradmins",
  uploadImages.fields([
    { name: "images", maxCount: 10 },
    { name: "image_profile", maxCount: 1 },
  ]),
  RegisterAdminUser
);
router.post("/loginadmin", LoginAdminUser);
router.post("/enable2fa/:id", Enable2FA);
router.post("/verify2fa", Verify2FA);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
router.post("/updatepassword/:id", UpdatePassword);
router.post("/forgotpassword", ForgotPassword);
router.post("/resetpassword/:id/:token", ResetPassword);
router.get("/logout", LogoutAdminUser);
router.post("/ready", ready);
router.post("/validate", validate);
router.post("/validatebackup", validateBackup);

module.exports = router;
