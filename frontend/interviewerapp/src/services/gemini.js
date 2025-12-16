const API_BASE = import.meta.env.VITE_API_URL || "";

async function handleResponse(res) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    // fallback to raw text if JSON parsing fails
    return text;
  }
}

export async function generateQuestions(topic, count = 6) {
  if (!topic) throw new Error("Missing topic");
  const res = await fetch(`${API_BASE}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, count }),
  });
  const data = await handleResponse(res);
  return data?.questions || [];
}

export async function evaluateVoice({ audioBlob, questionId, questionText, correctAnswer, filename = "response.webm" }) {
  if (!audioBlob) throw new Error("Missing audio blob");
  const form = new FormData();
  form.append("audio", audioBlob, filename);
  if (questionId) form.append("questionId", questionId);
  if (questionText) form.append("questionText", questionText);
  if (correctAnswer) form.append("correctAnswer", correctAnswer);

  const res = await fetch(`${API_BASE}/api/voice/evaluate`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}

export default { generateQuestions, evaluateVoice };
