const Company = require("../models/Company");
const Progress = require("../models/Progress");

const createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      message: "Company added successfully",
      company
    });
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.includeInactive !== "true") {
      query.isActive = true;
    }

    const companies = await Company.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      success: true,
      company
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Company deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const getEligibleCompanies = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found for this student"
      });
    }

    const now = new Date();
    const companies = await Company.find({
      isActive: true,
      minCgpa: { $lte: req.user.cgpa || 0 },
      $and: [
        {
          $or: [
            { eligibleDepartments: { $size: 0 } },
            { eligibleDepartments: req.user.department }
          ]
        },
        {
          $or: [
            { applicationDeadline: { $exists: false } },
            { applicationDeadline: null },
            { applicationDeadline: { $gte: now } }
          ]
        }
      ]
    }).sort({ applicationDeadline: 1, name: 1 });

    const eligibleCompanies = companies.filter((company) => {
      return (
        progress.coding.percentage >= company.requiredCodingPercentage &&
        progress.aptitude.percentage >= company.requiredAptitudePercentage &&
        progress.interview.percentage >= company.requiredInterviewPercentage
      );
    });

    res.status(200).json({
      success: true,
      count: eligibleCompanies.length,
      companies: eligibleCompanies
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getEligibleCompanies
};
