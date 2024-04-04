const express = require("express");
const {
    createPolicy,
    getAllPolicies,
    getPolicyById,
    updatePolicyById,
    deletePolicyById,
} = require("../controllers/policy-controller");
const router = express.Router();
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");

router.post("/createPolicy",isAuthenticated, isHRAdmin,createPolicy);
router.get("/getAllPolicies", isAuthenticated, getAllPolicies);
router.get( "/getPolicyById/:id", isAuthenticated, getPolicyById);
router.put("/updatePolicyById/:id",isAuthenticated, isHRAdmin,updatePolicyById);
router.delete("/deletePolicyById/:id", isAuthenticated, isHRAdmin, deletePolicyById);
module.exports = router;
