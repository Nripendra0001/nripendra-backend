const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: String,
  lastDate: String,
  link: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
