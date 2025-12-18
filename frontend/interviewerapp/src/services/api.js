// client/src/services/api.js
import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths";

const API_BASE_URL = BASE_URL || "http://localhost:8000";

// create instance with 2 minute timeout (whisper + gpt can be slow)
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds
});

// Evaluate voice endpoint
async function evaluateVoice({ audioBlob, questionId, questionText, correctAnswer, filename, browserTranscript }) {
  if (!audioBlob) throw new Error("Audio blob is required");
  const formData = new FormData();
  formData.append("audio", audioBlob, filename || "answer.webm");
  if (questionId) formData.append("questionId", questionId);
  if (questionText) formData.append("questionText", questionText);
  if (correctAnswer) formData.append("correctAnswer", correctAnswer);
  if (browserTranscript) formData.append("browserTranscript", browserTranscript);

  try {
    const resp = await instance.post(API_PATHS.AI.EVALUATE_ANSWER, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return resp.data;
  } catch (err) {
    console.error("API evaluateVoice error:", err);
    const serverMsg = err?.response?.data?.message || err?.message || "Network Error";
    throw new Error(serverMsg);
  }
}

export default { evaluateVoice };