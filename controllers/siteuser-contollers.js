const joi = require("joi");
const jwt = require("jsonwebtoken");
const hashPassword = require("../middleware/hashPassword");
const User = require("../models/user");
const generateToken = require("../middleware/generateToken");
const bcrypt = require("bcryptjs");
const {
  generateConfirmationCode,
} = require("../helpers/generateConfirmationCode");
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendRestPasswordLink,
} = require("../helpers/sendConfirmationEmail");

const registerValidator = joi.object({
  username: joi.string().required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(6)
    .pattern(
      new RegExp(
        "^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$"
      )
    )
    .required(),
});
async function RegisterSiteUser(req, res, next) {
  const { username, email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  if (!hashedPassword) return next({ status: 500 });
  const validation = registerValidator.validate(req.body);
  if (validation.error) {
    const errorDetails = validation.error.details
      .map((d) => d.message)
      .join("<br>");
    res.send(`<h2>Vaildation Error: </h2>${errorDetails}`);
    return;
  }
  const siteUser = new User({
    username,
    email,
    password: hashedPassword,
  });
  try {
    const userExist = await User.findOne({ email: email });
    if (userExist) throw "Email already exist";
    else {
      const confirmationCode = generateConfirmationCode();
      siteUser.confirmationCode = confirmationCode;
      await siteUser.save();
      // Send confirmation email
      await sendConfirmationEmail(
        siteUser.email,
        confirmationCode,
        siteUser.username
      );
      if (!siteUser) return res.status(500).json(error.details[0].message);
      const token = await generateToken({ id: siteUser._id });
      if (!token) return next({ status: 500 });
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        success: true,
        siteUser,
        message: "Please confirm/verify your email.",
      });
    }
    console.log("Success", token);
  } catch (error) {
    return res.status(500).json(error);
  }
}
async function ConfirmEmail(req, res, next) {
  const { confirmationCode } = req.body;
  try {
    const user = await User.findOne({ confirmationCode });
    if (!user) {
      return next(new Error("Invalid confirmation code/User not found"));
    }
    user.isConfirmed = true;
    user.confirmationCode = "Confirmed";
    await user.save();

    await sendWelcomeEmail(user.email, user.username);

    res
      .status(200)
      .json({ success: true, message: "Your account has been confirmed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function LoginSiteUser(req, res, next) {
  const { email, password, rememberMe } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ Error: "Email and Password can not be Empty" });
  const account = await User.findOne({ email: email });
  if (!account)
    return res.status(400).json({ Error: "Invalid Email or Password" });
  const validPassword = bcrypt.compareSync(password, account.password);
  if (!validPassword) {
    return res.status(403).send({ auth: false, token: null });
  }
  try {
    const token = await generateToken({ id: account._id });
    const cookieOptions = {
      httpOnly: true,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https", // Adjust based on your deployment environment
    };

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    }
    req.session.userId = account._id;
    console.log(req.session);
    res.cookie("jwt", token, cookieOptions);
    res.status(200).json({ token: token, message: "LoggedIn" });
  } catch (error) {
    console.log("Login failed with error : ", error);
    return res.status(500).json({ Error: error });
  }
}
async function ForgotPassword(req, res, next) {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res
      .status(400)
      .json({ error: "User with this email does not exist" });
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
        const updatedEmployee = await User.findOneAndUpdate(
          { _id: id },
          { $set: { password: hashedpassword } },
          { new: true }
        );
        if (!updatedEmployee) {
          return next(new Error("Employee not found"));
        }
        res.status(200).json({ mgs: "Password has been reset successfully" });

        console.log("Password has been reset successfully");
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
    const user = await User.findById(id);

    if (!user) {
      return next(new Error("Employee not found"));
    }
    const isPasswordMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    let hashedNewpassword = await bcrypt.hash(password, 10);
    user.password = hashedNewpassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  RegisterSiteUser,
  LoginSiteUser,
  ConfirmEmail,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
};
