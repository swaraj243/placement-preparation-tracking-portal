const mongoose = require("mongoose");

const progressAreaSchema = new mongoose.Schema(
  {
    completedTopics: {
      type: Number,
      min: [0, "Completed topics cannot be negative"],
      default: 0
    },
    totalTopics: {
      type: Number,
      min: [0, "Total topics cannot be negative"],
      default: 0
    },
    percentage: {
      type: Number,
      min: [0, "Percentage cannot be less than 0"],
      max: [100, "Percentage cannot be greater than 100"],
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    coding: {
      type: progressAreaSchema,
      default: () => ({})
    },
    aptitude: {
      type: progressAreaSchema,
      default: () => ({})
    },
    interview: {
      type: progressAreaSchema,
      default: () => ({})
    },
    overallPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const calculateAreaPercentage = (area) => {
  if (!area.totalTopics || area.totalTopics <= 0) {
    return area.percentage || 0;
  }

  return Math.min(
    100,
    Math.round((area.completedTopics / area.totalTopics) * 100)
  );
};

progressSchema.pre("save", function calculateProgress(next) {
  this.coding.percentage = calculateAreaPercentage(this.coding);
  this.aptitude.percentage = calculateAreaPercentage(this.aptitude);
  this.interview.percentage = calculateAreaPercentage(this.interview);

  this.overallPercentage = Math.round(
    (this.coding.percentage +
      this.aptitude.percentage +
      this.interview.percentage) /
      3
  );

  next();
});

module.exports = mongoose.model("Progress", progressSchema);
