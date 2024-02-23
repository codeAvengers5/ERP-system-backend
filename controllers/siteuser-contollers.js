const joi = require("@hapi/joi");
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
async function confirmEmail(req, res, next) {
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
  const { email, password } = req.body;
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
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ token: token, msg: "LoggedIn" });
  } catch (error) {
    console.log("Login failed with error : ", error);
    return res.status(500).json({ Error: error });
  }
}
module.exports = {
  RegisterSiteUser,
  LoginSiteUser,
  confirmEmail,
};
