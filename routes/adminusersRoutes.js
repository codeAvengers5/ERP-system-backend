const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
} = require("../controllers/siteuser-contollers");
const {
  RegisterAdminUser,
  LoginAdminUser,
  Enable2FA,
  Verify2FA,
} = require("../controllers/adminuser-controllers");
const upload = require("../config/multer");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeradmins", upload.array("images", 10), RegisterAdminUser);
router.post("/loginadmin", LoginAdminUser);
router.post("/enable2fa/:id", Enable2FA);
router.post("/verify2fa/:id", Verify2FA);
module.exports = router;
