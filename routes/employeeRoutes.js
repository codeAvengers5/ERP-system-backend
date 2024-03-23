const express = require("express");
const {
  GetAllUsers,
  FetchById,
  updateEmployeeById,
  enterEmployeeById,
} = require("../controllers/employee-controller");
const { isAuthenticated, isItAdmin } = require("../middleware/auth");
const router = express.Router();
router.get("/users", isAuthenticated, isItAdmin, GetAllUsers);
router.get("/getemployee/:id",FetchById);
router.put("/updateemployee/:id",updateEmployeeById);
router.post("/enteremployee/:id",enterEmployeeById);
module.exports = router;