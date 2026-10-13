const express = require("express");
const {
  getAllStudentProgress,
  getMyProgress,
  getStudentProgressById,
  updateMyProgress
} = require("../controllers/progressController");
const {
  authorizeRoles,
  protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, authorizeRoles("student"), getMyProgress);
router.put("/me", protect, authorizeRoles("student"), updateMyProgress);

router.get(
  "/students",
  protect,
  authorizeRoles("admin"),
  getAllStudentProgress
);

router.get(
  "/students/:userId",
  protect,
  authorizeRoles("admin"),
  getStudentProgressById
);

module.exports = router;
