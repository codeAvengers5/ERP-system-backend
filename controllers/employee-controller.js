const Employee = require("../models/employee");
const Role = require("../models/role");
const EmployeeInfo = require("../models/employeeInfo");
const fs = require("fs");
const cloudinary = require("../config/coludinary");
const { PrinterTypes } = require("node-thermal-printer");

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
          id: employee._id,
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
async function UpdateEmployeeforItAdmin(req, res) {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone_no,
      position,
      role_name,
      start_date,
      salary,
      gender,
    } = req.body;
    if (
      !full_name ||
      !email ||
      !phone_no ||
      !gender ||
      !position ||
      !role_name ||
      !start_date ||
      !salary
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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
      const employeeInfo = await EmployeeInfo.findOne({ employee_id: id });
      if (!employeeInfo) {
        return res.status(404).json({ message: "Employee info not found" });
      }
      const employee = await Employee.findByIdAndUpdate(id, {
        full_name: full_name,
        email: email,
      });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const roleId = employee.role_id;
      const role = await Role.findByIdAndUpdate(roleId, { role_name });
      const updatedemployeeInfo = await EmployeeInfo.findByIdAndUpdate(
        employeeInfo._id,
        {
          position: position,
          start_date: start_date,
          salary: salary,
          email: email,
          phone_no: phone_no,
          gender: gender,
          images: urls,
          image_profile: urls_pic[0],
        }
      );
      if (!updatedemployeeInfo) {
        return res.status(404).json({ message: "not found" });
      }
      res.status(200).json({
        message: "Employee account updated successfully",
        value: { updatedemployeeInfo, employee, role },
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
}
async function UpdateEmployeeInfo(req, res) {
  try {
    const { id } = req.params;
    const { maritalstatus, address, phone_no } = req.body;
    if (!maritalstatus || !address || !phone_no) {
      return res.status(400).json({ message: "Missing data!" });
    }
    const employeeInfo = await EmployeeInfo.findOne({ employee_id: id });
    if (!employeeInfo) {
      return res.status(404).json({ message: "Employee info not found" });
    }
    const updatedInfo = await EmployeeInfo.findByIdAndUpdate(
      employeeInfo._id,
      {
        maritalstatus: maritalstatus,
        address: address,
        phone_no: phone_no,
      },
      { new: true }
    );
    if (!updatedInfo) {
      return res.status(404).json({ message: "Employee info not found" });
    }
    res.status(200).json({
      message: "Employee data updated successfully",
      updatedInfo: updatedInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function PrintID(req, res, next) {
  const idCardData = req.body;

  try {
    const printerName = "Your Printer Name"; // Replace with the name of your printer

    const printer = new PrinterTypes({
      type: printerTypes.EPSON, // Replace with the appropriate printer type
      characterSet: "SLOVENIA", // Replace with the appropriate character set
      interface: `printer:${printerName}`, // Specify the printer name as the interface
    });

    printer.alignCenter();
    printer.println(`Name: ${idCardData.name}`);
    printer.cut();

    printer.print(printerName, (err) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Error printing ID card" });
      } else {
        console.log("ID card printed successfully");
        res.json({ success: true, message: "ID card printed successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "No printer found" });
  }
}
module.exports = {
  FetchById,
  GetAllUsers,
  UpdateEmployeeforItAdmin,
  UpdateEmployeeInfo,
  PrintID,
};
