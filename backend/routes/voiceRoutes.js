// backend/routes/voiceRoutes.js
const express = require("express");
const multer = require("multer");
const { evaluateVoiceAnswer } = require("../controllers/voiceController");

const router = express.Router();

// Use memory storage (we stream buffer to OpenAI). Increase file size limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

router.post("/evaluate", upload.single("audio"), evaluateVoiceAnswer);

module.exports = router;