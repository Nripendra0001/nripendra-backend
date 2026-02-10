const Batch = require("../models/Batch");
const Enrollment = require("../models/Enrollment");

// Admin create batch
const createBatch = async (req, res) => {
  try {
    const { title, description, isFree, price } = req.body;

    if (!title) return res.status(400).json({ message: "Title required" });

    const batch = await Batch.create({
      title,
      description: description || "",
      isFree: isFree !== undefined ? isFree : true,
      price: price || 0,
    });

    return res.status(201).json({ message: "Batch created", batch });
  } catch (err) {
    return res.status(500).json({ message: "Create batch failed", error: err.message });
  }
};

// Public list batches
const listBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ batches });
  } catch (err) {
    return res.status(500).json({ message: "Batch list failed", error: err.message });
  }
};

// Student enroll (free)
const enrollBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    if (!batchId) return res.status(400).json({ message: "batchId required" });

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    // free only for now
    if (!batch.isFree) {
      return res.status(403).json({
        message: "This batch is paid. Payment integration required.",
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      batch: batch._id,
      type: "free",
      paymentStatus: "none",
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (err) {
    // duplicate key (already enrolled)
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already enrolled in this batch" });
    }

    return res.status(500).json({ message: "Enroll failed", error: err.message });
  }
};

module.exports = { createBatch, listBatches, enrollBatch };
