const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  createBatch,
  listBatches,
  enrollBatch,
} = require("../controllers/batchController");

const router = express.Router();

// public
router.get("/", listBatches);

// student
router.post("/enroll", protect, enrollBatch);

// admin
router.post("/create", protect, adminOnly, createBatch);

module.exports = router;
