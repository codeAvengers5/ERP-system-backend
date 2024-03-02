const jwt = require("jsonwebtoken");
async function isAuthenticated(req, res, next) {
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log("Here is the token");
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "You must log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error!", error: error.message });
  }
}

async function isItAdmin(req, res, next) {
  // console.log(req.user.role);
  if (req.user.role !== "itadmin") {
    return res.status(401).json({
      success: false,
      message: "Access denied, You must log as an ITAdmin.",
    });
  }
  next();
}
async function isHRAdmin(req, res, next) {
  // console.log(req.user.role);
  if (req.user.role !== "hradmin") {
    return res.status(401).json({
      success: false,
      message: "Access denied, You must log as an HR.",
    });
  }
  next();
}
async function isEmployee(req, res, next) {
  if (req.user.role !== "employee") {
    return res.status(401).json({
      success: false,
      message: "Access denied, You must log as an Employee.",
    });
  }
  next();
}
async function isManager(req,res,next){
  if(req.user.role !== "manager"){
    return res.status(401).json({
      success: false,
      message:"Access denied, You must log as an Manager.",
    })
  }
}
module.exports = {
  isAuthenticated,
  isItAdmin,
  isHRAdmin,
  isEmployee,
  isManager,
};
