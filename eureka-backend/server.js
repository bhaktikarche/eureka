// eureka-backend/server.js (Final Corrected Version)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import routes
const documentRoutes = require("./routes/documents");
const chatRoutes = require("./routes/chat");
const analyticsRoutes = require("./routes/analytics");
const uploadRoutes = require("./routes/upload");
const annotationRoutes = require('./routes/annotations');

const app = express();
const allowedOrigins = [
  "https://eureka-1-ohq1.onrender.com", // your Render frontend
  "http://localhost:5173", // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Ensure text index is created
mongoose.connection.once("open", async () => {
  console.log("✅ MongoDB Connected");
  try {
    const Document = require("./models/Document");
    await Document.createIndexes();
    console.log("✅ Text search indexes created");
  } catch (err) {
    console.log("ℹ️ Text indexes may already exist:", err.message);
  }
});

// Use routes
app.use("/api", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", uploadRoutes);
app.use('/api/documents', annotationRoutes);
// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uploadsDir: uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));