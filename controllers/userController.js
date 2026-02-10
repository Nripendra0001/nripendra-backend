const Enrollment = require("../models/Enrollment");

const myProfile = async (req, res) => {
  return res.json({
    user: req.user,
  });
};

// Personalized Dashboard
const myDashboard = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("batch")
      .sort({ createdAt: -1 });

    const myBatches = enrollments.map((e) => ({
      enrollmentId: e._id,
      type: e.type,
      paymentStatus: e.paymentStatus,
      enrolledAt: e.createdAt,
      batch: e.batch,
    }));

    return res.json({
      user: req.user,
      totalBatches: myBatches.length,
      myBatches,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Dashboard load failed",
      error: err.message,
    });
  }
};

module.exports = { myProfile, myDashboard };
