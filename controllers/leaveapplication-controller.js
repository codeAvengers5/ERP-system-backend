const EmployeeInfo = require("../models/employeeInfo");
const LeaveApplication = require("../models/leaveApplication");
const Notification = require("../models/notification");
const Role = require("../models/role");
async function createLeaveApplication(req, res) {
  try {
    const { full_name, duration, leave_date, detail } = req.body;
    const employee_id = req.user.id;
    const existingLeaveApplication = await LeaveApplication.findOne({
      employee_id,
      status: "pending",
    });
    if (existingLeaveApplication) {
      return res
        .status(400)
        .json({ error: "You already have a pending leave request" });
    }
    const employeeInfo = await EmployeeInfo.findOne({
      employee_id: employee_id,
    });
    if(!employeeInfo){
      return res
        .status(404)
        .json({ error: 'Employee information not found' });
    }
    const currentYear = new Date().getFullYear();
    const existingAnnualLeave = await LeaveApplication.findOne({
      employee_id,
      detail: "annual" || "maternity",
      status: "approved",
      leave_date: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    });

    if (detail === "annual" && existingAnnualLeave) {
      return res.status(400).json({
        error: "You have already been granted annual leave this year",
      });
    }

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
    const hr = await Role.findOne({ role_name: "hradmin" });
    const notification = new Notification({
      recipient: "hradmin",
      message: `${leaveApplication.full_name} is asking for Leave`,
      employeeId: hr.employee_id,
    });
    await notification.save();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
async function getLeaveApplicationById_forEmployee(req, res) {
  try {
    const { id } = req.params;

    const leaveApplication = await LeaveApplication.findById(id);
    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    return res.status(200).json(leaveApplication);
  } catch (error) {
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
    res.status(500).json({ error: "Internal server error" });
  }
}
async function getAllLeaveApplications_forHR(req, res) {
  try {
    const leaveApplications = await LeaveApplication.find();
    res.status(200).json(leaveApplications);
    return res.status(403).json({ message: "Access forbidden" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
async function updateLeaveApplication(req, res) {
  try {
    const { id } = req.params; // leave application ID
    const { full_name, duration, leave_date, detail } = req.body;

    const leaveApplication = await LeaveApplication.findById(id);

    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    if (leaveApplication.status === "approved") {
      return res
        .status(400)
        .json({ error: "Cannot update an approved leave application" });
    }

    leaveApplication.full_name = full_name;
    leaveApplication.duration = duration;
    leaveApplication.leave_date = leave_date;
    leaveApplication.detail = detail;

    await leaveApplication.save();

    res.status(200).json({ message: "Leave application updated successfully" });
  } catch (error) {
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

    res.status(200).json(leaveApplication);
    const notification = new Notification({
      recipient: "employee",
      message: `Your Application has been ${leaveApplication.status}`,
      employeeId: leaveApplication.employee_id,
    });
    await notification.save();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
async function deleteLeaveApplication(req, res) {
  try {
    const { id } = req.params;
    const leaveApplication = await LeaveApplication.findById(id);

    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    if (leaveApplication.status === "approved") {
      return res
        .status(400)
        .json({ error: "Cannot delete an approved leave application" });
    }

    if (req.user.role === "employee") {
      await LeaveApplication.findByIdAndDelete(id);
      res
        .status(200)
        .json({ message: "Leave application deleted successfully" });
    } else {
      return res.status(404).json({ message: "Not authorized" });
    }
  } catch (error) {
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
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  createLeaveApplication,
  getLeaveApplication_forEmployee,
  getLeaveApplicationById_forEmployee,
  filterByStatus,
  updateLeaveApplication,
  updateStatus,
  deleteLeaveApplication,
  getAllLeaveApplications_forHR,
};
