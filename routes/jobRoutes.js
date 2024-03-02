const express = require("express");
const {
    createJobPost,
    getAllJobPosts,
    getJobPostById,
    updateJobPostById,
    deleteJobPostById,
}=require("../controllers/jobpost-controller");
const router = express.Router();
const { isAuthenticated, isHRAdmin ,isEmployee} = require("../middleware/auth");

router.post('/createJobPosts/:id',createJobPost);
router.get('/getJobPosts',getAllJobPosts);
router.get('/getJobPostsId/:id',getJobPostById);
router.put('/updateJobPosts/:id',updateJobPostById);
router.delete('/deleteJobPosts/:id',deleteJobPostById);
module.exports = router;