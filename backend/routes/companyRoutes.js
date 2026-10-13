const express = require("express");
const {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  getEligibleCompanies,
  updateCompany
} = require("../controllers/companyController");
const {
  authorizeRoles,
  protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCompanies);
router.post("/", protect, authorizeRoles("admin"), createCompany);

router.get(
  "/eligible",
  protect,
  authorizeRoles("student"),
  getEligibleCompanies
);

router.get("/:id", protect, getCompanyById);
router.put("/:id", protect, authorizeRoles("admin"), updateCompany);
router.delete("/:id", protect, authorizeRoles("admin"), deleteCompany);

module.exports = router;
