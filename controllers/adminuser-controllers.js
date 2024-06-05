const joi = require("joi");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const Role = require("../models/role");
const EmployeeInfo = require("../models/employeeInfo");
const Notification = require("../models/notification");
const hashPassword = require("../middleware/hashPassword");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/coludinary");
const generateToken = require("../middleware/generateToken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { sendRestPasswordLink } = require("../helpers/sendConfirmationEmail");
const generateBarcode = require("../helpers/generateBarcode");
const { ideahub } = require("googleapis/build/src/apis/ideahub");
const Crypto = require("../helpers/encryptDecrypt");
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const registerValidator = joi.object({
  full_name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
  dob: joi.string().required(),
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
  image_profile: joi
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
      // })
    )
    .required(),
});
const passwordSchema = joi
  .string()
  .min(8)
  .pattern(
    new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"
    )
  )
  .required();
async function RegisterAdminUser(req, res, next) {
  const {
    full_name,
    email,
    password,
    dob,
    position,
    role_name,
    start_date,
    salary,
    gender,
    phone_no,
  } = req.body;
  const images = req.files["images"];
  const image_profile = req.files["image_profile"];
  const { error } = registerValidator.validate({
    full_name,
    email,
    password,
    dob,
    position,
    role_name,
    start_date,
    salary,
    gender,
    images,
    image_profile,
    phone_no,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const uploader = async (path) => await cloudinary.uploads(path, "images");
  try {
    if (req.method === "POST") {
      const urls = [];
      const urls_pic = [];
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const { path } = file;
          const newPath = await uploader(path);
          urls.push(newPath);
          fs.unlinkSync(path);
        }
      }
      if (req.files["image_profile"]) {
        const file = req.files["image_profile"][0];
        const { path } = file;
        const newPath = await uploader(path);
        urls_pic.push(newPath);
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
          is2faVerified: false,
        });
        const employeeId = employee._id;
        const role = await Role.create({ role_name, employee_id: employeeId });
        const roleId = role._id;
        employee.role_id = roleId;
        await employee.save();
        const barcode = await generateBarcode(employeeId.toString());
        const employeeInfo = await EmployeeInfo.create({
          employee_id: employeeId,
          email,
          dob,
          position,
          start_date,
          salary,
          gender,
          phone_no,
          images: urls,
          image_profile: urls_pic,
          barcode: barcode,
        });
        const token = await generateToken({ id: employee._id });
        if (!token) return next({ status: 500 });
        res.cookie("jwt", token, {
          httpOnly: true,
          secure: false,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
          message: "Employee account created successfully",
          value: { employeeInfo },
        });
        const hr = await Role.findOne({ role_name: "hradmin" });
        const manager = await Role.findOne({ role_name: "manager" });

        const notifications = [];
        const hrNotification = new Notification({
          recipient: "hradmin",
          message: `New Employee has been created ${employee.full_name}`,
          employee_id: hr.employee_id,
        });
        notifications.push(hrNotification);
        const managerNotification = new Notification({
          recipient: "manager",
          message: `New Employee has been created ${employee.full_name}`,
          employee_id: manager.employee_id,
        });
        notifications.push(managerNotification);
        for (const notification of notifications) {
          await notification.save();
        }
      }
    } else {
      return res.status(405).json({
        err: `${req.method} method not allowed`,
      });
    }
  } catch (error) {
    console.error("Error creating employee account:", error);
    return res.status(500).json({ error: error });
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
    return res.status(400).json({ message: "Invalid Email or Password" });
  const validPassword = bcrypt.compareSync(password, account.password);
  if (!validPassword) {
    return res.status(403).send({ message: "Invalid Email or Password" });
  }
  const role = await Role.findOne({ _id: account.role_id });
  if (!role) {
    return res.status(403).json({ message: "Role not found" });
  }
  try {
    const accountId = account._id;
    const roleName = role.role_name;
    const enable2fa = account.enable2fa;
    const Verify2FA = account.is2faVerified;
    const email = account.email;
    const full_name = account.full_name;
    const payload = {
      id: accountId,
      role: roleName,
    };
    const userInfo = {
      accountId,
      email,
      full_name,
      roleName,
      enable2fa,
      Verify2FA,
    };
    const token = await generateToken(payload);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ userInfo: userInfo, message: "LoggedIn" });
  } catch (error) {
    console.log("Login failed with error : ", error);
    return res.status(500).json({ Error: error });
  }
}
async function ready(req, res, next) {
  try {
    const { _id } = req.body;
    if (!_id) {
      throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
    }
    const response = await mfa.getMfaRecordById(_id);
    res.locals.data = response;
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function Enable2FA(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "User can not found" });
    }

    const mfa = {
      generateQRcode: async () => {
        const secret = speakeasy.generateSecret({ length: 20 });

        // Generate a QR code data URL using the secret
        const qrUrl = await new Promise((resolve, reject) => {
          QRCode.toDataURL(secret.otpauth_url, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });

        return { qrCodeUrl: qrUrl, secret: secret.base32 };
      },
    };

    const response = await mfa.generateQRcode();
    res.locals.data = response;
    res.json(response);
  } catch (err) {
    next(err);
  }
}
async function Verify2FA(req, res, next) {
  try {
    const { id, secret, token } = req.body;
    const user = await Employee.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User does not exist",
      });
    }

    const isVerified = mfa.verifyTOTP(secret, token);
    if (isVerified) {
      const code = mfa.generateBackupCode(secret);
      const enable2fa = await mfa.saveMfaRecord(
        user,
        secret,
        code,
        ENCRYPTION_KEY
      );
      res.json({
        code,
        secret,
        enable2fa,
      });
    } else {
      return next(new Error("Invalid Code"));
    }
  } catch (error) {
    next(error);
  }
}
const mfa = {
  getMfaRecordById: (userId) => {
    return new Promise((resolve, reject) => {
      Employee.findById(userId)
        .then((record) => {
          if (!record) {
            reject(
              new ApiError(ReasonPhrases.NOT_FOUND, StatusCodes.NOT_FOUND)
            );
          }
          const { _id, enable2fa } = record;
          resolve({
            _id,
            enable2fa,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getOtpSecretById: (userId, encryptionKey) => {
    return new Promise((resolve, reject) => {
      Employee.findById({ _id: userId })
        .then((record) => {
          if (!record?.enable2fa) {
            reject("enable 2fa is not activated");
          }
          const secret = Crypto.decrypt(record.secrets2fa, encryptionKey);
          resolve(secret);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  verifyTOTP: (secret, token) => {
    try {
      const otpResult = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 3,
      });

      // console.log("verifyTOTP:", { otpResult, secret, token });

      return otpResult;
    } catch (error) {
      console.log("Error in verifyTOTP:", error);
      return false;
    }
  },

  generateBackupCode: (secret) => {
    return Crypto.generateBackupCodes(secret);
  },
  getBackupCodesById: (userId, encryptionKey) => {
    try {
      const user = Employee.findOne({ userId });
      if (!user || !user.backupCodes) {
        return null;
      }

      const decryptedBackupCodes = Crypto.decrypt(
        user.backupCodes,
        encryptionKey
      );
      return decryptedBackupCodes;
    } catch (err) {
      console.error("Error getting backup codes:", err);
      throw err;
    }
  },
  updateBackupCodesById: (userId, updatedBackupCodes, encryptionKey) => {
    try {
      const encryptedBackupCodes = this.encryptBackupCodes(
        updatedBackupCodes,
        encryptionKey
      );
      Employee.updateOne(
        { userId },
        { $set: { backupCodes: encryptedBackupCodes } }
      );
    } catch (err) {
      console.error("Error updating backup codes:", err);
      throw err;
    }
  },
  saveMfaRecord: async (employee, secret, code, encryptionKey) => {
    try {
      const encryptedSecret = Crypto.encrypt(secret, encryptionKey);
      const hashBackupCode = [];
      for (const backupCode of code) {
        const hashedBackupCode = Crypto.getHashString(backupCode.toString());
        hashBackupCode.push(hashedBackupCode);
      }

      await Employee.findByIdAndUpdate(employee._id, {
        backupCode: hashBackupCode,
        secrets2fa: encryptedSecret,
        enable2fa: true,
      });
      return true;
    } catch (err) {
      console.error("Error saving MFA record:", err);
      return false;
    }
  },
};
async function validate(req, res, next) {
  try {
    const { otp, id } = req.body;

    if (!otp || !id) {
      throw new Error(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
    }

    if (!ENCRYPTION_KEY) {
      throw new Error(
        ReasonPhrases.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const secret = await mfa.getOtpSecretById(id, ENCRYPTION_KEY);
    const verified = mfa.verifyTOTP(secret, otp);
    res.locals.data = {
      verified,
    };
    res.json(res.locals.data);
  } catch (err) {
    console.log(err);
    next(err);
  }
}
async function validateBackup(req, res, next) {
  try {
    const { backupCode, userId } = req.body;

    if (!backupCode || !userId) {
      throw new Error(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
    }

    if (!ENCRYPTION_KEY) {
      throw new Error(
        ReasonPhrases.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const backupCodes = mfa.getBackupCodesById(userId, ENCRYPTION_KEY);

    if (!backupCodes || backupCodes.length === 0) {
      throw new Error(ReasonPhrases.NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    const isValidBackupCode = backupCodes.includes(backupCode);

    if (!isValidBackupCode) {
      throw new Error(ReasonPhrases.UNAUTHORIZED, StatusCodes.UNAUTHORIZED);
    }
    const updatedBackupCodes = backupCodes.filter(
      (code) => code !== backupCode
    );
     mfa.updateBackupCodesById(userId, updatedBackupCodes, ENCRYPTION_KEY);

    res.locals.data = {
      verified: true,
    };
    res.json(res.locals.data);
  } catch (err) {
    console.log(err);
    next(err);
  }
}
async function ForgotPassword(req, res, next) {
  const { email } = req.body;
  const user = await Employee.findOne({ email: email });
  if (!user) {
    return res
      .status(400)
      .json({ error: "Employee with this email does not exist" });
  } else {
    try {
      const token = await generateToken({ id: user._id });
      if (!token) return next({ status: 500 });
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      await sendRestPasswordLink(email, user._id, token);
      res
        .status(200)
        .json({ mgs: "verfiy with the link", token: token, id: user._id });
    } catch (err) {
      console.log(err);
    }
  }
}
async function ResetPassword(req, res, next) {
  const { id, token } = req.params;
  const { password } = req.body;

  let hashedpassword = await bcrypt.hash(password, 10);
  jwt.verify(token, process.env.JWT_TOKEN_KEY, async (err, decoded) => {
    if (err) {
      return res.json({ Status: "Error with token" });
    } else {
      try {
        const updatedEmployee = await Employee.findOneAndUpdate(
          { _id: id },
          { $set: { password: hashedpassword } },
          { new: true }
        );
        if (!updatedEmployee) {
          return next(new Error("Employee not found"));
        }
        return res.json("success", updatedEmployee);
      } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: error });
      }
    }
  });
}
async function UpdatePassword(req, res, next) {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return next(new Error("Employee not found"));
    }
    const isPasswordMatch = bcrypt.compareSync(oldPassword, employee.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    const { error } = passwordSchema.validate(newPassword);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedNewPassword;
    await employee.save();
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function LogoutAdminUser(req, res, next) {
  try {
    const userId = req.user.id;
    await Employee.updateOne({ _id: userId }, { is2faVerified: false });
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged Out" });
  } catch (error) {
    console.log("Logout failed with error: ", error);
    return res.status(500).json({ Error: error });
  }
}

module.exports = {
  RegisterAdminUser,
  LoginAdminUser,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
  ready,
  Enable2FA,
  Verify2FA,
  validate,
  validateBackup,
  LogoutAdminUser,
};
