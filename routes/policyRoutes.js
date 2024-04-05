const express = require("express");
const {
    createPolicy,
    getAllPolicies,
    getPolicyById,
    updatePolicyById,
    deletePolicyById,
} = require("../controllers/policy-controller");
const router = express.Router();
const { isAuthenticated, isManager } = require("../middleware/auth");

router.post("/createPolicy",isAuthenticated, isManager,createPolicy);
router.get("/getAllPolicies", isAuthenticated, getAllPolicies);
router.get( "/getPolicyById/:id", isAuthenticated, getPolicyById);
router.put("/updatePolicyById/:id",isAuthenticated, isManager,updatePolicyById);
router.delete("/deletePolicyById/:id", isAuthenticated, isManager, deletePolicyById);
module.exports = router;
