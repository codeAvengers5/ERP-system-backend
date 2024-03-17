const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Policy = mongoose.model("Policy", policySchema);

module.exports = Policy;
