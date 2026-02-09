require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* ✅ CORS (API + Socket.IO) */
app.use(cors({
  origin: "*", // later apna domain set kar dena
  methods: ["GET", "POST"]
}));

app.use(express.json());

/* ✅ Routes */
const resultRoutes = require("./routes/resultRoutes");
app.use("/api/results", resultRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

/* ✅ MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

/* ✅ Root */
app.get("/", (req, res) => {
  res.send("SarkariNext Backend is Running 🚀 + Socket.IO Ready ✅");
});

/* ======================================
   IMPORTANT:
   Render pe socket chalane ke liye
   http server banana zaruri hai
====================================== */
const server = http.createServer(app);

/* ✅ Socket.IO Setup */
const io = new Server(server, {
  cors: {
    origin: "*", // later: ["https://nripendra.online"]
    methods: ["GET", "POST"]
  }
});

/* Room Users */
const roomUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("join-room", ({ roomId, role, name }) => {
    socket.join(roomId);

    socket.roomId = roomId;
    socket.role = role;
    socket.name = name;

    if (!roomUsers.has(roomId)) roomUsers.set(roomId, []);
    const users = roomUsers.get(roomId);

    users.push({
      socketId: socket.id,
      role,
      name
    });

    roomUsers.set(roomId, users);

    io.to(roomId).emit("user-joined", { socketId: socket.id, role, name });

    io.to(socket.id).emit("room-joined", {
      roomId,
      usersCount: users.length
    });
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
    io.to(roomId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);

    const roomId = socket.roomId;

    if (roomId && roomUsers.has(roomId)) {
      const users = roomUsers.get(roomId).filter(u => u.socketId !== socket.id);
      roomUsers.set(roomId, users);

      io.to(roomId).emit("call-ended");

      if (users.length === 0) {
        roomUsers.delete(roomId);
      }
    }
  });
});

/* ✅ Start */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port:", PORT);
});
