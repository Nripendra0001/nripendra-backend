const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");

/* ===============================
   ✅ GET: All Blogs (Latest First)
================================ */
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select("slug title excerpt category date views createdAt");

    res.json({ ok: true, blogs });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Blogs fetch error", error: e.message });
  }
});

/* ===============================
   ✅ GET: Single Blog by Slug
================================ */
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ ok: false, msg: "Blog not found" });
    }

    res.json({ ok: true, blog });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Blog fetch error", error: e.message });
  }
});

/* ===============================
   ✅ POST: Create Blog (TEMP)
   (Later admin auth laga dena)
================================ */
router.post("/", async (req, res) => {
  try {
    const { slug, title, excerpt, category, date, content } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ ok: false, msg: "slug and title required" });
    }

    const exists = await Blog.findOne({ slug });
    if (exists) {
      return res.status(409).json({ ok: false, msg: "Slug already exists" });
    }

    const blog = await Blog.create({
      slug,
      title,
      excerpt: excerpt || "",
      category: category || "General",
      date: date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      content: content || ""
    });

    res.json({ ok: true, msg: "Blog created", blog });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Blog create error", error: e.message });
  }
});

/* ===============================
   🔥 POST: Increment View Count
================================ */
router.post("/:slug/view", async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    ).select("slug views");

    if (!blog) {
      return res.status(404).json({ ok: false, msg: "Blog not found" });
    }

    res.json({ ok: true, slug: blog.slug, views: blog.views });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "View update error", error: e.message });
  }
});

module.exports = router;
