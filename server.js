require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* ✅ CORS (API + Socket.IO) */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/* ✅ Routes */
const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

/* ✅ MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

/* ✅ Root */
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀 + Socket.IO Ready ✅");
});

/* ======================================
   Render pe socket chalane ke liye
   http server banana zaruri hai
====================================== */
const server = http.createServer(app);

/* ✅ Socket.IO Setup */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/* ======================================
   SOCKET LOGIC (FINAL STABLE)
====================================== */
io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) return;

      // room me kitne users already hain (official)
      const room = io.sockets.adapter.rooms.get(roomId);
      const usersCount = room ? room.size : 0;

      // max 2
      if (usersCount >= 2) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      socket.roomId = roomId;

      // updated count
      const roomAfter = io.sockets.adapter.rooms.get(roomId);
      const countAfter = roomAfter ? roomAfter.size : 1;

      // joiner ko
      socket.emit("room-joined", { roomId, usersCount: countAfter });

      // dusre ko
      socket.to(roomId).emit("user-joined", { roomId, usersCount: countAfter });

      console.log(`👥 Room ${roomId} users:`, countAfter);
    } catch (e) {
      console.log("❌ join-room error:", e);
    }
  });

  /* WebRTC signaling */
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

    // disconnect pe room ke other user ko call ended
    if (socket.roomId) {
      socket.to(socket.roomId).emit("call-ended");
    }
  });
});

/* ✅ Start */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port:", PORT);
});
