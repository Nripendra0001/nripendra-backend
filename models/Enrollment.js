const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    // free / paid
    type: { type: String, enum: ["free", "paid"], default: "free" },

    // later: razorpay etc
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "success", "failed"],
      default: "none",
    },
  },
  { timestamps: true }
);

// 1 user cannot enroll same batch twice
enrollmentSchema.index({ user: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
