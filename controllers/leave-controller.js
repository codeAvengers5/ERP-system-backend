const LeaveApplication = require("../models/leave");

// Controller to create a new leave application
async function createLeaveApplication (req, res) {
  try {
    const {full_name, duration, leave_date, detail } = req.body;
     const {employee_id} = req.user.id;
     const {status}= "pending";
    // Create a new leave application
    const leaveApplication = new LeaveApplication({
      employee_id,
      full_name,
      duration,
      leave_date,
      detail,
      status,
    });

    // Save the leave application to the database
    await leaveApplication.save();

    res.status(201).json({ message: "Leave application created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to get all leave applications
async function getAllLeaveApplications (req, res) {
  try {
    // Fetch all leave applications from the database
    const leaveApplications = await LeaveApplication.find();

    res.status(200).json(leaveApplications);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to get a single leave application
async function getLeaveApplicationById (req, res){
    try {
        const { id } = req.params;
    
        // Check if the user is an HR admin or an employee
        if (req.user.role === 'HR admin') {
          // Logic for HR admin to retrieve the leave application by ID
          const leaveApplication = await LeaveApplication.findById(id);
          if (!leaveApplication) {
            return res.status(404).json({ message: "Leave application not found" });
          }
          return res.status(200).json(leaveApplication);
        } else if (req.user.role === 'employee') {
          // Logic for employee to retrieve their own leave application by ID
          const leaveApplication = await LeaveApplication.findOne({ _id: id, employee_id: req.user.id });
          if (!leaveApplication) {
            return res.status(404).json({ message: "Leave application not found" });
          }
          return res.status(200).json(leaveApplication);
        } else {
          // User role not supported
          return res.status(403).json({ message: "Access forbidden" });
        }
      } catch (error) {
        console.log(error); // Log the specific error
        res.status(500).json({ error: "Internal server error" });
      }
    }
    async function getAllLeaveApplicationsByEmployee(req, res) {
        try {
          const { id } = req.params;
      
          // Check if the user is an HR admin or an employee
          if (req.user.role === 'HR admin' || req.user.role === 'employee') {
            // Retrieve all leave applications for the specified employee
            const leaveApplications = await LeaveApplication.find({ employee_id: id });
      
            res.status(200).json(leaveApplications);
          } else {
            // User role not supported
            return res.status(403).json({ message: "Access forbidden" });
          }
        } catch (error) {
          console.log(error); // Log the specific error
          res.status(500).json({ error: "Internal server error" });
        }
      }
// Controller to update a leave application
async function updateLeaveApplication(req, res) {
    try {
      const { id } = req.params;
      const { status, full_name, duration, leave_date, detail } = req.body;
  
      // Find the leave application by ID in the database
      const leaveApplication = await LeaveApplication.findById(id);
  
      if (!leaveApplication) {
        return res.status(404).json({ message: "Leave application not found" });
      }
  
      // If the user is an HR admin, update the 'status' field
      if (req.user.role === 'HR admin') {
        leaveApplication.status = status || leaveApplication.status;
      }
  
      // Update other fields (full_name, duration, leave_date, detail)
      leaveApplication.full_name = full_name || leaveApplication.full_name;
      leaveApplication.duration = duration || leaveApplication.duration;
      leaveApplication.leave_date = leave_date || leaveApplication.leave_date;
      leaveApplication.detail = detail || leaveApplication.detail;
  
      // Save the updated leave application to the database
      await leaveApplication.save();
  
      res.status(200).json({ message: "Leave application updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

// Controller to delete a leave application
async function deleteLeaveApplication (req, res){
  try {
    const { id } = req.params;
    console.log("id",id);
    // Find the leave application by ID in the database and remove it
    await LeaveApplication.findByIdAndDelete(id);

    res.status(200).json({ message: "Leave application deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
    createLeaveApplication,
    getAllLeaveApplications,
    getLeaveApplicationById,
    updateLeaveApplication,
    deleteLeaveApplication,
    getAllLeaveApplicationsByEmployee,
};