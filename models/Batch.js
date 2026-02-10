const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // paid / free
    isFree: { type: Boolean, default: true },

    // for paid batches
    price: { type: Number, default: 0 },

    // show/hide
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);
