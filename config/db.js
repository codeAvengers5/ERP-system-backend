const mongoose = require("mongoose");
require('dotenv').config('../')
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL);
    console.log(`DB connected Succesfully`);
  } catch (error) {
    console.log(error);
  }
};
module.exports = { connectDB };
