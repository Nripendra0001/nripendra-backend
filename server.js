require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

/* ===============================
   ✅ CORS
================================ */
const allowedOrigins = [
  "https://nripendra.online",
  "https://www.nripendra.online",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.FRONTEND_URL_3,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

/* ===============================
   ✅ ROUTES (Existing)
================================ */
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀 + Auth + Dashboard + Socket.IO Chat ✅");
});

app.get("/api", (req, res) => {
  res.json({ ok: true, message: "API is working" });
});

const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const batchRoutes = require("./routes/batchRoutes");
app.use("/api/batches", batchRoutes);

/* ===============================
   ✅ BLOG ROUTES (NEW ✅)
================================ */
const blogRoutes = require("./routes/blogRoutes");
app.use("/api/blogs", blogRoutes);

/* ===============================
   ✅ MongoDB
================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

/* ===============================
   ✅ CHAT MODELS
================================ */
const chatSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    sender: { type: String, enum: ["user", "mentor"], required: true },
    senderName: { type: String, default: "" },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

const mentorSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const Mentor = mongoose.model("Mentor", mentorSchema);

/* ===============================
   ✅ Mentor Auth Middleware
================================ */
function mentorAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sarkarinext_secret");
    req.mentor = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, msg: "Invalid token" });
  }
}

/* ===============================
   ✅ CHAT APIs
================================ */

/* Create Room (User side) */
app.post("/api/chat/create-room", async (req, res) => {
  try {
    const { userName } = req.body;

    const roomId = "room_" + Date.now();

    res.json({
      ok: true,
      roomId,
      userName: userName || "Student",
    });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Room create error", error: e.message });
  }
});

/* Get messages by room */
app.get("/api/chat/messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const msgs = await Chat.find({ roomId }).sort({ createdAt: 1 });
    res.json({ ok: true, msgs });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Messages fetch error", error: e.message });
  }
});

/* Mentor: list rooms */
app.get("/api/chat/mentor/rooms", mentorAuth, async (req, res) => {
  try {
    const rooms = await Chat.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$message" },
          lastTime: { $first: "$createdAt" },
          lastSender: { $first: "$sender" },
        },
      },
      { $sort: { lastTime: -1 } },
    ]);

    res.json({ ok: true, rooms });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Rooms fetch error", error: e.message });
  }
});

/* ===============================
   ✅ Mentor Login APIs
================================ */

/* Create Default Mentor (RUN ONCE) */
app.get("/api/chat/create-mentor", async (req, res) => {
  try {
    const exists = await Mentor.findOne({ username: "mentor" });
    if (exists) {
      return res.json({ ok: true, msg: "Mentor already exists" });
    }

    const passwordHash = await bcrypt.hash("mentor@123", 10);

    await Mentor.create({
      username: "mentor",
      passwordHash,
    });

    res.json({
      ok: true,
      msg: "✅ Mentor created",
      username: "mentor",
      password: "mentor@123",
    });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Mentor create error", error: e.message });
  }
});

/* Mentor Login (FIXED ✅ bcrypt compare) */
app.post("/api/chat/mentor-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, msg: "Username & password required" });
    }

    const mentor = await Mentor.findOne({ username });

    if (!mentor) {
      return res.status(401).json({ ok: false, msg: "Invalid username or password" });
    }

    // ✅ correct password check
    const ok = await bcrypt.compare(password, mentor.passwordHash);

    if (!ok) {
      return res.status(401).json({ ok: false, msg: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: mentor._id, username: mentor.username },
      process.env.JWT_SECRET || "sarkarinext_secret",
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ ok: false, msg: "Mentor login error", error: e.message });
  }
});

/* ===============================
   ✅ Socket Server (Chat Only)
================================ */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("💬 Socket Connected:", socket.id);

  /* Join Room */
  socket.on("joinRoom", (roomId) => {
    try {
      if (!roomId) return;
      socket.join(roomId);
    } catch (e) {
      console.log("❌ joinRoom error:", e.message);
    }
  });

  /* Send Message */
  socket.on("sendMessage", async (data) => {
    try {
      const { roomId, sender, senderName, message } = data;

      if (!roomId || !message) return;

      const saved = await Chat.create({
        roomId,
        sender,
        senderName: senderName || "",
        message,
      });

      io.to(roomId).emit("newMessage", saved);
    } catch (e) {
      console.log("❌ sendMessage error:", e.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

server.on("error", (err) => {
  console.log("❌ SERVER ERROR:", err);
});

/* ===============================
   ✅ START SERVER
================================ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port:", PORT);
});
