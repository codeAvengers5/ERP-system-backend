const mongoose = require("mongoose");

const jobSummarySchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    cv: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone_no: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    expireAt: {
      type: Date,
      default: Date.now,
      index: { expires: "1m" },
    },
  },
  { timestamps: true }
);

const JobSummary = mongoose.model("JobSummary", jobSummarySchema);

module.exports = JobSummary;