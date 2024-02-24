const joi = require("@hapi/joi");
const Employee = require("../models/employee");
const Role = require("../models/role");
const EmployeeInfo = require("../models/employeeInfo");
const hashPassword = require("../middleware/hashPassword");
const generateBase32Secret = require("../helpers/generateSecret");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/coludinary");
const generateToken = require("../middleware/generateToken");
const crypto = require("crypto");
const { encode } = require("hi-base32");
const OTPAuth = require("otpauth");
const QRCode = require("qrcode");
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
        destination: joi.string().required(),
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
        const token = await generateToken({ id: employee._id });
        if (!token) return next({ status: 500 });
        res.cookie("jwt", token, {
          httpOnly: true,
          secure: false,
          maxAge: 7 * 24 * 60 * 60 * 1000,
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
async function LoginAdminUser(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ Error: "Email and Password can not be Empty" });
  const account = await Employee.findOne({ email: email });
  if (!account)
    return res.status(400).json({ Error: "Invalid Email or Password" });
  const validPassword = bcrypt.compareSync(password, account.password);
  if (!validPassword) {
    return res.status(403).send({ auth: false, token: null });
  }
  if (!account.enable2fa) {
    return res.send({msg:"please enable 2fa first"})
  }
  try {
    const token = await generateToken({ id: account._id });
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ token: token, Msg: "LoggedIn" });
  } catch (error) {
    console.log("Login failed with error : ", error);
    return res.status(500).json({ Error: error });
  }
}
async function Enable2FA(req, res, next) {
  const { id } = req.params;

  if (!(await Employee.findOne({ _id: id }))) {
    return res.status(404).json({
      status: "fail",
      message: "User does not exist",
    });
  }
  const base32_secret = generateBase32Secret();
  await Employee.updateOne({ _id: id }, { secrets2fa: base32_secret });
  const totp = new OTPAuth.TOTP({
    issuer: "codeavengers.com",
    label: "codeavengers",
    algorithm: "SHA1",
    digits: 6,
    secret: base32_secret,
  });
  const otpauth_url = totp.toString();

  QRCode.toDataURL(otpauth_url, (err, qrUrl) => {
    if (err) {
      return res.status(500).json({
        status: "fail",
        message: "Error while generating QR Code",
      });
    }

    res.json({
      status: "success",
      data: {
        qrCodeUrl: qrUrl,
        secret: base32_secret,
      },
    });
  });
}
async function Verify2FA(req, res, next) {
  const { id, token } = req.params;
  const user = await Employee.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User does not exist",
    });
  }
  // verify the token
  const totp = new OTPAuth.TOTP({
    issuer: "codeninjainsights.com",
    label: "codeninjainsights",
    algorithm: "SHA1",
    digits: 6,
    secret: user.secrets2fa,
  });
  const delta = totp.validate({ token });

  if (delta === null) {
    return res.status(401).json({
      status: "fail",
      message: "Authentication failed",
    });
  }

  // update the  user status
  if (!user.enable2fa) {
    await Employee.updateOne({ _id: id }, { enable2fa: true });
  }

  res.json({
    status: "success",
    data: {
      otp_valid: true,
    },
  });
}

module.exports = { RegisterAdminUser, LoginAdminUser, Enable2FA, Verify2FA };
