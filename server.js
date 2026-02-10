require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* ===============================
   ✅ CORS (API + Socket.IO)
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
      // Postman / server-to-server requests me origin undefined hota hai
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
   ✅ ROUTES (IMPORTANT)
================================ */
const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

/* ✅ NEW AUTH ROUTES */
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

/* ✅ NEW USER ROUTES */
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

/* ✅ NEW BATCH ROUTES */
const batchRoutes = require("./routes/batchRoutes");
app.use("/api/batches", batchRoutes);

/* ===============================
   ✅ MongoDB
================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

/* ===============================
   ✅ Root
================================ */
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀 + Auth + Dashboard + Socket.IO ✅");
});

/* ======================================
   Render pe socket chalane ke liye
   http server banana zaruri hai
====================================== */
const server = http.createServer(app);

/* ===============================
   ✅ Socket.IO Setup
================================ */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
  },
});

/* ===============================
   SOCKET LOGIC (FINAL STABLE)
================================ */
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
    if (socket.roomId) socket.to(socket.roomId).emit("call-ended");
  });
});

/* ===============================
   ✅ Start
================================ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port:", PORT);
});
