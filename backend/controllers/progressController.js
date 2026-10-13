const Progress = require("../models/Progress");
const User = require("../models/User");

const allowedAreas = ["coding", "aptitude", "interview"];
const allowedAreaFields = ["completedTopics", "totalTopics", "percentage", "notes"];

const applyProgressUpdates = (progress, updates) => {
  allowedAreas.forEach((area) => {
    if (!updates[area]) {
      return;
    }

    allowedAreaFields.forEach((field) => {
      if (updates[area][field] !== undefined) {
        progress[area][field] = updates[area][field];
      }
    });
  });
};

const getMyProgress = async (req, res, next) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id }).populate(
      "user",
      "name email rollNumber department cgpa"
    );

    if (!progress) {
      progress = await Progress.create({ user: req.user._id });
      await progress.populate("user", "name email rollNumber department cgpa");
    }

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProgress = async (req, res, next) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });

    if (!progress) {
      progress = await Progress.create({ user: req.user._id });
    }

    applyProgressUpdates(progress, req.body);
    await progress.save();
    await progress.populate("user", "name email rollNumber department cgpa");

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      progress
    });
  } catch (error) {
    next(error);
  }
};

const getAllStudentProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find()
      .populate("user", "name email rollNumber department cgpa graduationYear")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: progress.length,
      progress
    });
  } catch (error) {
    next(error);
  }
};

const getStudentProgressById = async (req, res, next) => {
  try {
    const student = await User.findOne({
      _id: req.params.userId,
      role: "student"
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const progress = await Progress.findOne({ user: student._id }).populate(
      "user",
      "name email rollNumber department cgpa graduationYear"
    );

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProgress,
  updateMyProgress,
  getAllStudentProgress,
  getStudentProgressById
};
