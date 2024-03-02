const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
});

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
