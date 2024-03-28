const EmployeeInfo = require("../models/employeeInfo");
const LeaveApplication = require("../models/leaveApplication");
async function createLeaveApplication(req, res) {
  try {
    const { full_name, duration, leave_date, detail } = req.body;
    const employee_id = req.user.id; //employee_id
    const employeeInfo = await EmployeeInfo.findOne({employee_id: employee_id});
    const leaveApplication = new LeaveApplication({
      employee_id,
      position: employeeInfo.position,
      full_name,
      duration,
      leave_date,
      detail,
      status: "pending",
    });
    await leaveApplication.save();
    res.status(201).json({ message: "Leave application created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function getLeaveApplication_forEmployee(req, res) {
  try {
    const leaveApplication = await LeaveApplication.find({
      employee_id: req.user.id,
    });
    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    return res.status(200).json(leaveApplication);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function getAllLeaveApplications_forHR(req, res) {
  try {
    const leaveApplications = await LeaveApplication.find();
    res.status(200).json(leaveApplications);
    return res.status(403).json({ message: "Access forbidden" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function updateLeaveApplication(req, res) {
  try {
    const { id } = req.params; //leaveappliction
    const { full_name, duration, leave_date, detail } = req.body;

    const updatedApplication = await LeaveApplication.findByIdAndUpdate(id, {
      full_name: full_name,
      duration: duration,
      leave_date: leave_date,
      detail: detail,
    });
    if (!updatedApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    res.status(200).json({ message: "Leave application updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function updateStatus(req, res) {
  try {
    const { id } = req.params; //leave_application_id
    const { status } = req.body;
    const leaveApplication = await LeaveApplication.findById(id);
    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    leaveApplication.status = status;
    await leaveApplication.save();

    return res.status(200).json(leaveApplication);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function deleteLeaveApplication(req, res) {
  try {
    const { id } = req.params;
    if (req.user.role === "employee") {
      await LeaveApplication.findByIdAndDelete(id);
      res
        .status(200)
        .json({ message: "Leave application deleted successfully" });
    } else {
      return res.status(404).json({ message: "Not authorized" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function filterByStatus(req, res) {
  try {
    const { status } = req.query;

    let leaveApplications;
    if (status) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      leaveApplications = await LeaveApplication.find({ status });
    } else {
      leaveApplications = await LeaveApplication.find();
    }

    return res.status(200).json(leaveApplications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  createLeaveApplication,
  getLeaveApplication_forEmployee,
  filterByStatus,
  updateLeaveApplication,
  updateStatus,
  deleteLeaveApplication,
  getAllLeaveApplications_forHR,
};
