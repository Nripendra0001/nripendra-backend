require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err));
const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀");
});

