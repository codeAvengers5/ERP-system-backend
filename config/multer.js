const multer = require("multer");
const DIRimg = "./uploads/images";
const DIRcv = "./uploads/cv";
const path = require("path");
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIRimg);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIRcv);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jepg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};
const cvFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      { message: "Unsupported file format for CV. Please upload a PDF file." },
      false
    );
  }
};
const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
});

const uploadCV = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
});
module.exports = {
  uploadCV,
  uploadImages,
};

