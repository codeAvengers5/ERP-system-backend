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
let cookieOptions = {
  httpOnly: true,
  secure: "production",
  sameSite: "strict",
  path: "/",
};
const registerValidator = joi.object({
  username: joi.string().required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$"
      )
    )
    .required(),
});
async function RegisterSiteUser(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await hashPassword(password);

    if (!hashedPassword) {
      return next({ status: 500, message: 'Error hashing password' });
    }

    const validation = registerValidator.validate(req.body);

    if (validation.error) {
      const errorDetails = validation.error.details
        .map((d) => d.message)
        .join('<br>');
      return res.status(400).send(`<h2>Validation Error:</h2>${errorDetails}`);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const confirmationCode = generateConfirmationCode();
    await User.findByIdAndUpdate(newUser._id, { confirmationCode });

    await sendConfirmationEmail(newUser.email, confirmationCode, newUser.username);

    const token = await generateToken({ id: newUser._id });

    if (!token) {
      return next({ status: 500, message: 'Error generating authentication token' });
    }

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      user: newUser,
      message: 'Please confirm/verify your email.',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    console.error(err);
    return next({ status: 500, message: 'An error occurred while registering the user' });
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
    res.status(500).json({ error: "Internal server error" });
  }
}
async function LoginSiteUser(req, res, next) {
  const { email, password, rememberMe } = req.body;
  log
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and Password can not be Empty" });
  const account = await User.findOne({ email: email });
  if (!account)
    return res.status(400).json({ message: "Invalid Email or Password" });
  const validPassword = bcrypt.compareSync(password, account.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }
  try {
    try {
      const accountId = account._id;
      
      const email = account.email;
      const username = account.username;
      const payload = {
        id: accountId,
      };
      const userInfo = { accountId, email, username };
      const token = await generateToken(payload);
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ siteuserInfo: userInfo, message: "LoggedIn" });
    } catch (error) {
      return res.status(500).json({ Error: error });
    }

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    }
    // req.cookie.userId = account._id;
    res.cookie("jwt", token, cookieOptions);
    res.status(200).json({ token: token, message: "LoggedIn" });
  } catch (error) {
    // console.log("Login failed with error : ", error);
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
      if (!token) {
        return res.status(500).json({ error: "Internal server error" });
      }
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
      return res.status(500).json({ error: "Internal server error" });
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
      } catch (error) {
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
  } catch (error) {;
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
