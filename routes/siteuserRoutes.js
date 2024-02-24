const express = require("express");
const {
  RegisterSiteUser,
  LoginSiteUser,
} = require("../controllers/siteuser-contollers");
const router = express.Router();
router.get("/", (req, res) => {
  res.send("Welcome");
});
router.post("/registeruser", RegisterSiteUser);
router.post("/loginuser", LoginSiteUser);
module.exports = router;
