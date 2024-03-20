const bwipjs = require("bwip-js");
async function generateBarcode(id) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128", // Barcode type
        text: id, // Unique ID for the employee
        scale: 3, // Barcode scale factor
        height: 10, // Barcode height in mm
        includetext: true, // Include human-readable text
        textxalign: "center", // Text horizontal alignment
      },
      (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png.toString("base64"));
        }
      }
    );
  });
}
module.exports = generateBarcode;
