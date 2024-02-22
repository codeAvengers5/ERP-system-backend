const joi = require("@hapi/joi");
const hashPassword = require("../middleware/hashPassword");
const User = require("../models/user");
const generateToken = require("../middleware/generateToken");
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
      await siteUser.save();
      if (!siteUser) return res.status(500).json(error.details[0].message);
      const token = await generateToken({ id: siteUser._id });
      if (!token) return next({ status: 500 });
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    console.log("Success", token);
  } catch (error) {
    return res.status(500).json(error);
  }
}
module.exports = {
  RegisterSiteUser,
};
