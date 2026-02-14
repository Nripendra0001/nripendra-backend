const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    category: { type: String, default: "General" },
    date: { type: String, default: "" },

    // Blog HTML content
    content: { type: String, default: "" },

    // 🔥 Visit Counter
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
