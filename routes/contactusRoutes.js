const express = require("express");
const {
  createContactus,
  getContactUsInfo,
} = require("../controllers/contactus-controllers");
const router = express.Router();
router.post("/contactus", createContactus);
router.get("/getcontactus", getContactUsInfo);
module.exports = router;
