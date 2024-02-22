const express = require("express");
const { RegisterSiteUser } = require("../controllers/siteuser-contollers");
const { RegisterAdminUser } = require("../controllers/adminuser-controllers");
const upload = require("../config/multer");
const router = express.Router();
router.get('/',(req,res)=>{
    res.send("Welcome")
})
router.post("/registeruser", RegisterSiteUser);
router.post("/registeradmins",upload.array("images",10), RegisterAdminUser)
module.exports = router;
