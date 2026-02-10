require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* =========================
   CORS (FINAL)
========================= */
const allowedOrigins = [
  process.env.FRONTEND_URL, // https://nripendra.online
  process.env.FRONTEND_URL_2, // https://xxxxx.vercel.app
  process.env.FRONTEND_URL_3, // https://www.nripendra.online

  // local dev
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman / server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

/* =========================
   Routes (OLD)
========================= */
const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

/* =========================
   Routes (NEW)
========================= */
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const batchRoutes = require("./routes/batchRoutes");
app.use("/api/batches", batchRoutes);

/* =========================
   MongoDB
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

/* =========================
   Root
========================= */
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀 + Auth + Dashboard + Socket.IO ✅");
});

/* ======================================
   Render pe socket chalane ke liye
   http server banana zaruri hai
====================================== */
const server = http.createServer(app);

/* =========================
   Socket.IO Setup
========================= */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

/* =========================
   SOCKET LOGIC (FINAL STABLE)
========================= */
io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) return;

      const room = io.sockets.adapter.rooms.get(roomId);
      const usersCount = room ? room.size : 0;

      if (usersCount >= 2) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      socket.roomId = roomId;

      const roomAfter = io.sockets.adapter.rooms.get(roomId);
      const countAfter = roomAfter ? roomAfter.size : 1;

      socket.emit("room-joined", { roomId, usersCount: countAfter });
      socket.to(roomId).emit("user-joined", { roomId, usersCount: countAfter });

      console.log(`👥 Room ${roomId} users:`, countAfter);
    } catch (e) {
      console.log("❌ join-room error:", e);
    }
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("end-call", ({ roomId }) => {
    socket.to(roomId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);

    if (socket.roomId) {
      socket.to(socket.roomId).emit("call-ended");
    }
  });
});

/* =========================
   Start
========================= */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port:", PORT);
});
