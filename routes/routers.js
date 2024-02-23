const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
  confirmEmail,
} = require("../controllers/siteuser-contollers");
const {
  RegisterAdminUser,
  LoginAdminUser,
} = require("../controllers/adminuser-controllers");
const upload = require("../config/multer");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeruser", RegisterSiteUser);
router.post("/registeradmins", upload.array("images", 10), RegisterAdminUser);
router.post("/loginadmin", LoginAdminUser);
router.post("/loginuser", LoginSiteUser);
router.post("/confirmemail", confirmEmail);
module.exports = router;
