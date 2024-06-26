const express = require("express");
const {
  GetAllUsers,
  FetchById,
  PrintID,
  UpdateEmployeeforItAdmin,
  UpdateEmployeeInfo,
} = require("../controllers/employee-controller");
const {
  isAuthenticated,
  isItAdmin,
} = require("../middleware/auth");
const router = express.Router();
router.get("/users", isAuthenticated, isItAdmin, GetAllUsers);
router.get("/getemployee/:id", FetchById);
router.put(
  "/updateemployee_forit/:id",
  isAuthenticated,
  isItAdmin,
  UpdateEmployeeforItAdmin
);
router.put(
  "/updateemployee/:id",
  isAuthenticated,
  UpdateEmployeeInfo
);
router.get("/users", isAuthenticated, isItAdmin, GetAllUsers);
// router.get("/getemployee/:id",isAuthenticated, isHRAdmin, FetchById);
// router.get("/getemployeeInfo/:id",isAuthenticated, isItAdmin, FetchById);
router.post("/printid", isAuthenticated, isItAdmin, PrintID);
module.exports = router;
