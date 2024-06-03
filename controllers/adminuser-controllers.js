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
// const { authenticator } = require("otplib");
const { sendRestPasswordLink } = require("../helpers/sendConfirmationEmail");
const generateBarcode = require("../helpers/generateBarcode");
const { ideahub } = require("googleapis/build/src/apis/ideahub");
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
    const Verify2FA = account.is2faVerified
    const email = account.email;
    const full_name = account.full_name;
    const payload = {
      id: accountId,
      role: roleName,
    };
    const userInfo = { accountId, email, full_name, roleName, enable2fa, Verify2FA };
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
// async function Enable2FA(req, res) {
//   const secret = speakeasy.generateSecret();
//   const { id } = req.params;
//   const user = await Employee.findByIdAndUpdate(id, {
//     secrets2fa: secret.base32
//     // enable2fa: true,
//   }).exec();
//   if (!user) {
//     return res.status(400).json({ message: "User can not found" });
//   } else {
//     QRCode.toDataURL(secret.otpauth_url, (err, image_data) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Internal Server Error");
//       }
//       req.qr = image_data;
//       res.json({
//         status: "success",
//         data: {
//           qrCodeUrl: req.qr,
//           secret: secret,
//         },
//       });
//     });
//   }
// }
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
// async function Enable2FA(req, res, next) {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res.status(400).json({ message: "User can not found" });
//     }

//     const mfa = {
//       generateQRcode: async () => {
//         const secret = speakeasy.generateSecret({ length: 20 });

//         // Generate a QR code data URL using the secret
//         // const qrCodeUrl = secret.otpauth_url;
//         QRCode.toDataURL(secret.otpauth_url, (err, qrUrl) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).send("Internal Server Error");
//           }
//           req.image = qrUrl;
//           return { qrCodeUrl: req.image, secret: secret.base32 };
//         });
//       },
//     };

//     const response = await mfa.generateQRcode(id);
//     res.locals.data = response;
//     res.json(response);
//   }
//   catch (err) {
//     next(err);
//   }
// }

// try {
//   const { id } = req.body;
//   if (!id) {
//     throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
//   }
//   const mfa = {
//     generateQRcode: (id) => {
//       // Implement the logic to generate the QR code
//       return { qrCode: 'data:image/png;base64,...' };
//     },
//   };
//   const response = await mfa.generateQRcode(id);
//   res.locals.data = response;
//   res.json(response);
// } catch (err) {
//   next(err);
// }

// async function Verify2FA(req, res, next) {
//   try {
//     const { id } = req.params;
//     const { token } = req.body;
//     const user = await Employee.findOne({ _id: id });

//     if (!user) {
//       return res.status(404).json({
//         status: "fail",
//         message: "User does not exist",
//       });
//     }
//     if (!user.enable2fa) {
//       await Employee.updateOne(
//         { _id: id },
//         { enable2fa: true, is2faVerified: true }
//       );
//     }
//     const userSecret = user.secrets2fa;
//     const otpResult = speakeasy.totp.verify({
//       secret: userSecret,
//       encoding: "base32",
//       token: token,
//       window: 1,
//     });
//     if (!otpResult) {
//       return res.status(422).json({ message: "Invalid Code" });
//     }
//     res.json({
//       status: "success",
//       data: {
//         otp_valid: true,
//       },
//     });
//   } catch (error) {
//     console.error("An error occurred during 2FA verification:", error);
//     res.status(500).json({
//       status: "error",
//       message:
//         "An error occurred during 2FA verification. Please try again later.",
//     });
//   }
// }

async function Verify2FA(req, res, next) {
  try {
    const { id, secret, token } = req.body;
    const user = await Employee.findById(id)
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User does not exist",
      });
    }

    const isVerified = mfa.verifyTOTP(secret, token);
    console.log(isVerified)
    if (isVerified) {
      const enable2fa = await mfa.saveMfaRecord(user);
      res.json({
        secret,
        enable2fa
      });
    } else {
      return next(new Error('Invalid Code'));
    }
  } catch (error) {
    next(error);
  }
}

// const crypto = require('crypto');

const mfa = {
  getMfaRecordById: (userId) => {
    return new Promise((resolve, reject) => {

      Employee.findById(userId)
        .then((record) => {
          if (!record) {
            reject(new ApiError(ReasonPhrases.NOT_FOUND, StatusCodes.NOT_FOUND));
          }
          const { _id, enable2fa } = record;
          resolve({
            _id,
            enable2fa
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getOtpSecretById: (userId) => {
    return new Promise((resolve, reject) => {
      Employee.findById({_id: userId})
        .then((record) => {
          console.log(record);
          if (!record?.enable2fa) {
            reject('enable 2fa is not activated');
          }

          resolve(record.secrets2fa);
        }).catch((error) => {
          reject(error);
        });
    });
  },

  verifyTOTP: (secret, token) => {
    try {
      const otpResult = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2, // Increase the time window
      });
  
      console.log('verifyTOTP:', { otpResult, secret, token });
  
      return otpResult;
    } catch (error) {
      console.error('Error in verifyTOTP:', error);
      return false;
    }
  },

  generateBackupCode: () => {
    // Generate a random backup code, e.g., using crypto.randomBytes()
    return crypto.randomBytes(8).toString('hex');
  },

  // verifyTOTP: (secret, token) => {
  //   return authenticator.check(token, secret);
  // },

  saveMfaRecord: async (employee) => {
    try {
      // Update the employee document with the new MFA record
      await Employee.findByIdAndUpdate(employee._id, {
        secrets2fa: employee.secrets2fa,
        enable2fa: true
      });

      // Return a boolean indicating whether the record was saved successfully
      return true;
    } catch (err) {
      console.error('Error saving MFA record:', err);
      return false;
    }
  }
};

// const verify = async (req, res, next) => {
//   try {
//     const { secret, otp, id } = req.body;
//     const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

//     if (!otp || !secret || !id) {
//       throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
//     }

//     if (!ENCRYPTION_KEY) {
//       throw new ApiError(ReasonPhrases.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR);
//     }

//     const isVerified = mfa.verifyTOTP(secret, otp);

//     if (isVerified) {
//       const code = await mfa.generateBackupCode();
//       const record = {
//         code,
//         secret,
//         id
//       };
//       const isActive = await mfa.saveMfaRecord(record, ENCRYPTION_KEY);
//       res.locals.data = {
//         code,
//         isActive
//       };
//       res.json(res.locals.data);
//     } else {
//       throw new ApiError("Invalid OTP", StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED);
//     }
//   } catch (err) {
//     next(err);
//   }
// };

async function validate(req, res, next) {
  try {
    const { otp, id } = req.body;

    if (!otp || !id) {
      throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
    }

    const secret = await mfa.getOtpSecretById(id);
    const verified = mfa.verifyTOTP(secret, otp);
    res.locals.data = {
      verified
    };
    res.json(res.locals.data);
  } catch (err) {
    next(err);
  }
  // try {
  //   // Extract the OTP and employee ID from the request body
  //   const { otp, id } = req.body;
  //   console.log(otp, id)

  //   // Check if the OTP and employee ID are provided
  //   if (!otp || !id) {
  //     throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
  //   }

  //   // Retrieve the secret from the employee's record
  //   const employee = await Employee.findById(id);
  //   const secret = employee.secrets2fa;

  //   // Verify the OTP using the retrieved secret
  //   const verified = speakeasy.totp.verify({
  //     secret: secret,
  //     encoding: 'base32',
  //     token: otp
  //   });

  //   // Store the verification result in the response locals
  //   res.locals.data = {
  //     verified
  //   };

  //   // Send the response
  //   // super.send(res);
  // } catch (err) {
  //   // Pass the error to the next middleware function
  //   next(err);
  // }
}

// async function validate(req, res, next) {
//   try {
//     // Extract the OTP and employee ID from the request body
//     const { otp, id } = req.body;

//     // Check if the OTP and employee ID are provided
//     if (!otp || !id) {
//       throw new ApiError(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST);
//     }

//     // Check if the encryption key is provided
//     const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
//     if (!ENCRYPTION_KEY) {
//       throw new ApiError(ReasonPhrases.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR);
//     }

//     // Retrieve the encrypted secret from the employee's record
//     const employee = await Employee.findById(id);
//     const encryptedSecret = employee.secrets2fa;

//     // Decrypt the secret using the encryption key
//     const decryptedSecret = crypto.createHmac('sha256', ENCRYPTION_KEY)
//       .update(encryptedSecret)
//       .digest('hex');

//     // Verify the OTP using the decrypted secret
//     const verified = speakeasy.totp.verify({
//       secret: decryptedSecret,
//       encoding: 'base32',
//       token: otp
//     });

//     // Store the verification result in the response locals
//     res.locals.data = {
//       verified
//     };

//     // Send the response
//     // super.send(res);
//   } catch (err) {
//     // Pass the error to the next middleware function
//     next(err);
//   }
// }

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
  LogoutAdminUser,
};
