require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const xpRoutes = require("./routes/xpRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "smartclass-server", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/xp", xpRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Smart-Class API running on http://localhost:${PORT}`));
}

start();

module.exports = app;
