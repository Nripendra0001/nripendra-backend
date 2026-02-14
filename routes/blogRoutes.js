const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const jwt = require("jsonwebtoken");

/* ===============================
   ✅ Admin Auth (Mentor Token)
================================ */
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sarkarinext_secret");
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, msg: "Invalid token" });
  }
}

/* ===============================
   ✅ GET: All Blogs (Public)
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
   ✅ GET: Single Blog (Public)
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
   ✅ POST: Create Blog (Admin)
================================ */
router.post("/", adminAuth, async (req, res) => {
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
      date:
        date ||
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      content: content || "",
    });

    res.json({ ok: true, msg: "Blog created", blog });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Blog create error", error: e.message });
  }
});

/* ===============================
   ✅ PUT: Update Blog (Admin)
================================ */
router.put("/:slug", adminAuth, async (req, res) => {
  try {
    const updated = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      {
        title: req.body.title,
        excerpt: req.body.excerpt,
        category: req.body.category,
        date: req.body.date,
        content: req.body.content,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, msg: "Blog not found" });
    }

    res.json({ ok: true, msg: "Blog updated", blog: updated });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Update error", error: e.message });
  }
});

/* ===============================
   ✅ DELETE: Delete Blog (Admin)
================================ */
router.delete("/:slug", adminAuth, async (req, res) => {
  try {
    const deleted = await Blog.findOneAndDelete({ slug: req.params.slug });

    if (!deleted) {
      return res.status(404).json({ ok: false, msg: "Blog not found" });
    }

    res.json({ ok: true, msg: "Blog deleted" });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Delete error", error: e.message });
  }
});

/* ===============================
   🔥 POST: Increment View Count (Public)
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
