const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    jobRole: {
      type: String,
      required: [true, "Job role is required"],
      trim: true
    },
    packageOffered: {
      type: Number,
      min: [0, "Package cannot be negative"],
      default: 0
    },
    minCgpa: {
      type: Number,
      min: [0, "Minimum CGPA cannot be less than 0"],
      max: [10, "Minimum CGPA cannot be greater than 10"],
      default: 0
    },
    eligibleDepartments: {
      type: [String],
      default: []
    },
    requiredCodingPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    requiredAptitudePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    requiredInterviewPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    applicationDeadline: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Company", companySchema);
