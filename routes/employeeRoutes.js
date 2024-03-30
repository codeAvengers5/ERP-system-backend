const express = require("express");
const {
  GetAllUsers,
  FetchById,
  UpdateEmployeeforItAdmin,
  UpdateEmployeeInfo,
} = require("../controllers/employee-controller");
const {
  isAuthenticated,
  isItAdmin,
  isEmployee,
} = require("../middleware/auth");
const router = express.Router();
router.get("/users", isAuthenticated, isItAdmin, GetAllUsers);
router.get("/getemployee/:id", FetchById);
router.put(
  "/updateemployee/:id",
  isAuthenticated,
  isItAdmin,
  UpdateEmployeeforItAdmin
);
router.post(
  "/updateemployee/:id",
  isAuthenticated,
  isEmployee,
  UpdateEmployeeInfo
);
module.exports = router;
