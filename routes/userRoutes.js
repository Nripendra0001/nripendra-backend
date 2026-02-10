const express = require("express");
const { protect } = require("../middleware/auth");
const { myProfile, myDashboard } = require("../controllers/userController");

const router = express.Router();

router.get("/me", protect, myProfile);
router.get("/dashboard", protect, myDashboard);

module.exports = router;
