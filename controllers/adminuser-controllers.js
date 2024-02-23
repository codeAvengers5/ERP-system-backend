const joi = require("@hapi/joi");
const Employee = require("../models/employee");
const Role = require("../models/role");
const EmployeeInfo = require("../models/employeeInfo");
const hashPassword = require("../middleware/hashPassword");
const fs = require("fs");
const cloudinary = require("../config/coludinary");
const registerValidator = joi.object({
  full_name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
  position: joi.string().required(),
  role_name: joi.string().required(),
  start_date: joi.date().required(),
  salary: joi.number().required(),
  gender: joi.string().required(),
  images: joi
    .array()
    .items(
      joi.object({
        fieldname: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        destination:joi.string().required(),
        mimetype: joi.string().valid("image/jpeg", "image/png").required(),
        size: joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

async function RegisterAdminUser(req, res, next) {
  const {
    full_name,
    email,
    password,
    position,
    role_name,
    start_date,
    salary,
    gender,
  } = req.body;
  const images = req.files;

  // for (const file of images) {
  //   const { filename, mimetype, size } = file;}
    const { error } = registerValidator.validate({
      full_name,
      email,
      password,
      position,
      role_name,
      start_date,
      salary,
      gender,
      images,
    });

    if (error) {
      console.log("Having error...");
      return res.status(400).json({ error: error.details[0].message });
    }
  
  const uploader = async (path) => await cloudinary.uploads(path, "Images");

  try {
    if (req.method === "POST") {
      const urls = [];
      const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newPath = await uploader(path);
        urls.push(newPath);
        fs.unlinkSync(path);
      }
      const userExist = await Employee.findOne({ email: email });
      if (userExist) throw "Email already exist";
      else {
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) return next({ status: 500 });
        const employee = await Employee.create({
          full_name,
          email,
          password: hashedPassword,
        });
        const employeeId = employee._id;
        const role = await Role.create({ role_name, employee_id: employeeId });
        const roleId = role._id;
        employee.role_id = roleId;
        await employee.save();
        const employeeInfo = await EmployeeInfo.create({
          employee_id: employeeId,
          email,
          position,
          start_date,
          salary,
          gender,
          images: urls,
        });
        res.status(201).json({
          message: "Employee account created successfully",
          value: { employeeInfo },
        });
      }
    } else {
      return res.status(405).json({
        err: `${req.method} method not allowed`,
      });
    }
  } catch (error) {
    console.error("Error creating employee account:", error);
    res.status(500).json({ error: error });
  }
}
module.exports = { RegisterAdminUser };
