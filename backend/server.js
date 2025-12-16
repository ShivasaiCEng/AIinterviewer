require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Database connection
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const voiceRoutes = require("./routes/voiceRoutes");

const { protect } = require("./middlewares/authMiddleware");

// AI Controllers
const {
  generateInterviewQuestions,
  generateConceptExplanation,
  analyzeInterviewResults,
  generateQuizFromMissedConcepts,
  parseResume,
} = require("./controllers/aiController");

const app = express();

// Middleware
// CORS configuration - update origin in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000']);

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
      ? allowedOrigins
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

// Route Usage
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);

app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);
app.use("/api/ai/generate-question", protect, generateInterviewQuestions);
app.post("/api/ai/analyze-results", protect, analyzeInterviewResults);
app.post("/api/ai/generate-quiz", protect, generateQuizFromMissedConcepts);

// Resume parsing route
const multer = require("multer");
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, DOC, TXT, and image files
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload PDF, DOCX, DOC, TXT, or image files."), false);
    }
  },
});
app.post("/api/ai/parse-resume", protect, resumeUpload.single("resume"), parseResume);

app.use("/api/voice", voiceRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
