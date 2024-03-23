const joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const Role = require("../models/role");
const EmployeeInfo = require("../models/employeeInfo");
const hashPassword = require("../middleware/hashPassword");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/coludinary");
const generateToken = require("../middleware/generateToken");

async function GetAllUsers(req, res, next) {
    try {
      const employeeInfo = await EmployeeInfo.find({})
        .populate("employee_id", "employee_id")
        .exec();
  
      const employeeData = await Promise.all(
        employeeInfo.map(async (info) => {
          const employee = await Employee.findOne({ _id: info.employee_id });
          if (!employee) {
            return null;
          }
          const roleId = employee.role_id.toString();
          const role = await Role.findOne({ _id: roleId });
          if (!role) {
            return null;
          }
          return {
            name: employee.full_name,
            email: employee.email,
            role: role.role_name,
            dateAdded: info.start_date,
            image_profile: info.image_profile,
          };
        })
      );
  
      const filteredEmployeeData = employeeData.filter(
        (employee) => employee !== null // Filter out null employees
      );
  
      res.json(filteredEmployeeData);
    } catch (error) {
      console.log(`Error in viewing Users Info: ${error}`);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async function FetchById(req, res, next) {
    const { id } = req.params;
    try {
      const employee = await Employee.findOne({ _id: id });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const employeeInfo = await EmployeeInfo.findOne({ employee_id: id });
      const role = await Role.findOne({ employee_id: id });
      res.status(200).json({ employee, employeeInfo, role });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async function updateEmployeeById (req, res, next){
    try {
      const { id } = req.params;
      const { full_name, email, password,dob, position, role_name, start_date, salary, gender } = req.body;
      const images = req.files && req.files["images"];
      const image_profile = req.files && req.files["image_profile"];
      const uploader = async (path) => await cloudinary.uploads(path, "images");
  
      if (req.method === "PUT") {
        const urls = [];
        const urls_pic = [];
        if (images) {
          for (const file of images) {
            const { path } = file;
            const newPath = await uploader(path);
            urls.push(newPath);
            fs.unlinkSync(path);
          }
        }
        if (image_profile) {
          const file = image_profile[0];
          const { path } = file;
          const newPath = await uploader(path);
          urls_pic.push(newPath);
          fs.unlinkSync(path);
        }
  
        const employee = await Employee.findById(id);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
  
        // Update the employee's information
        employee.full_name = full_name;
        employee.email = email;
  
        if (password) {
          employee.password = await hashPassword(password);
        }
  
        const updatedEmployee = await employee.save();
  
        // Update the employee's role
        const roleId = updatedEmployee.role_id;
        const role = await Role.findByIdAndUpdate(roleId, { role_name });
  
        // Update the employee's information details
        const employeeInfo = await EmployeeInfo.findOneAndUpdate(
          { employee_id: updatedEmployee._id },
          {
            $set: {
              position,
              start_date,
              salary,
              email,
              dob,
              gender,
              images: urls,
              image_profile: urls_pic ? urls_pic[0] : "",
            },
          },
          { new: true, upsert: true }
        );
  
        res.status(200).json({
          message: "Employee account updated successfully",
          value: { employeeInfo,employee,role },
        });
      } else {
        return res.status(405).json({
          err: `${req.method} method not allowed`,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  async function enterEmployeeById (req, res, next){
  try {
    const { id } = req.params;
    const { maritalstatus, address, phone_no } = req.body;

    const employeeInfo = await EmployeeInfo.findOne({ employee_id: id });
    if (!employeeInfo) {
      return res.status(404).json({ message: 'Employee info not found' });
    }
    // Update the employee's data
    employeeInfo.maritalstatus = maritalstatus;
    employeeInfo.address = address;
    employeeInfo.phone_no = phone_no;

    await  employeeInfo.save();

    res.status(200).json({ message: 'Employee data entered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
  module.exports = {
    FetchById,
    GetAllUsers,
    updateEmployeeById,
    enterEmployeeById,
  };
  