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

/* ============================
   ✅ FINAL CORS CONFIG
============================ */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, Postman, curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ============================
   Middleware
============================ */
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================
   Routes
============================ */
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);

// AI routes
app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);
app.use("/api/ai/generate-question", protect, generateInterviewQuestions);
app.post("/api/ai/analyze-results", protect, analyzeInterviewResults);
app.post("/api/ai/generate-quiz", protect, generateQuizFromMissedConcepts);

// Resume parsing
const multer = require("multer");
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
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
      cb(
        new Error(
          "Invalid file type. Upload PDF, DOC, DOCX, TXT, or image files."
        ),
        false
      );
    }
  },
});

app.post(
  "/api/ai/parse-resume",
  protect,
  resumeUpload.single("resume"),
  parseResume
);

// Voice routes
app.use("/api/voice", voiceRoutes);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ============================
   Server Start
============================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
