const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const { createOrder } = require("../controllers/payment-controller");
const router = express.Router();
router.post("/payment", createOrder);

module.exports = router;
