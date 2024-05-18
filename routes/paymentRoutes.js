const express = require("express");
const { createOrder } = require("../controllers/payment-controller");
const { isUserAuthenticated } = require("../middleware/auth-user");
const router = express.Router();
router.post("/payment", isUserAuthenticated, createOrder);

module.exports = router;
