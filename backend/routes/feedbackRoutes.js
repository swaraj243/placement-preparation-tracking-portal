const express = require("express");
const {
  deleteFeedback,
  getAllFeedback,
  getMyFeedback,
  submitFeedback,
  updateFeedback
} = require("../controllers/feedbackController");
const {
  authorizeRoles,
  protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("student"), submitFeedback);
router.get("/my", protect, authorizeRoles("student"), getMyFeedback);
router.get("/", protect, authorizeRoles("admin"), getAllFeedback);
router.put("/:id", protect, authorizeRoles("admin"), updateFeedback);
router.delete("/:id", protect, authorizeRoles("admin"), deleteFeedback);

module.exports = router;
