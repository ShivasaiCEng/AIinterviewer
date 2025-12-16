// backend/controllers/voiceController.js
const stream = require("stream");

// Use native fetch (Node.js 18+ has fetch globally)
// For Node.js < 18, you can install node-fetch@2, but Node 18+ is recommended
const fetch = globalThis.fetch || (() => {
  try {
    return require("node-fetch");
  } catch (e) {
    throw new Error("fetch is not available. Please use Node.js 18+ (which has native fetch) or install node-fetch: npm install node-fetch@2");
  }
})();

function getModelForAudioSize(sizeInBytes) {
  if (sizeInBytes < 100 * 1024) {
    return "gemini-2.5-flash-lite";
  } else if (sizeInBytes < 500 * 1024) {
    return "gemini-2.5-flash";
  } else {
    return "gemini-2.5-pro";
  }
}

async function retryWithBackoff(fn, maxRetries = 3, initialDelayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const is503 = error.message?.includes("503") || error.message?.includes("overloaded");
      if (is503 && attempt < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed (503 - overloaded). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

async function transcribeWithGemini(buffer, mimeType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = getModelForAudioSize(buffer.length);
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const base64Data = buffer.toString("base64");

  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "audio/webm",
            },
          },
          {
            text: "Transcribe this audio to plain English text only. Do not add any explanation or extra words.",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
    },
  };

  const makeRequest = async () => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini transcription failed: ${res.status} - ${text}`);
    }

    return res.json();
  };

  const data = await retryWithBackoff(makeRequest, 3, 1000);
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "";

  return text;
}

// Helper: call OpenAI/OpenRouter API for answer evaluation
async function evaluateAnswerWithOpenAI(questionText, correctAnswer, userAnswer) {
  // Support both OPENAI_KEY and OPENAI_API_KEY for flexibility
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or OPENAI_KEY is not configured (used as OpenRouter API key)");
  }

  const OpenAI = require("openai");
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey, // This will be your OpenRouter API key
  });

  // Handle empty/skipped answers - still analyze with AI to get specific missed concepts
  const trimmedAnswer = (userAnswer || "").trim();
  const isEmptyOrShort = !trimmedAnswer || trimmedAnswer.length < 10;
  
  // If answer is empty/short, use a special prompt to analyze what should have been covered
  if (isEmptyOrShort) {
    const skipPrompt = `You are an expert interview evaluator analyzing a question that was skipped or had no meaningful answer.

QUESTION: ${questionText}
CORRECT_ANSWER: ${correctAnswer}

The user did not provide an answer or provided a very short/incomplete answer.

Your task:
1. Analyze the CORRECT_ANSWER and identify ALL specific key concepts, topics, and important points that should have been covered
2. Extract specific technical concepts, not generic terms
3. List what the user missed in a detailed, actionable way

Return ONLY valid JSON (no backticks) with this exact structure:
{
  "evaluation": "Skipped",
  "explanation": "No answer was provided. Based on the correct answer, here are the key concepts you should have covered: [list 2-3 main concepts]",
  "categoryScores": {
    "contentAccuracy": 0,
    "clarityStructure": 0,
    "depth": 0,
    "examples": 0,
    "communication": 0
  },
  "totalScore": 0,
  "keyConceptsMentioned": [],
  "missingConcepts": ["specific concept 1", "specific concept 2", "specific concept 3", ...],
  "usedRealLifeExamples": false,
  "isCoherent": false,
  "interviewImpactFeedback": "You skipped this question. The correct answer covers [specific concepts]. In a real interview, skipping questions can signal lack of preparation. Review the correct answer and practice explaining these concepts: [list the specific concepts]."
}

CRITICAL: 
- "missingConcepts" MUST list SPECIFIC technical concepts from the correct answer (e.g., "Closure in JavaScript", "Event Loop mechanism", "Promise chaining", "Async/await error handling", "Memory management", "Time complexity analysis")
- Do NOT use generic phrases like "All key concepts" or "JavaScript concepts"
- Extract at least 3-5 specific concepts/topics from the correct answer
- Be specific and actionable`;

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: skipPrompt,
          },
        ],
      temperature: 0,
        max_tokens: 1000,
      });

      const rawText = completion.choices[0]?.message?.content?.trim() || "";

      // Parse the response
      let parsed = {};
      try {
        const cleaned = String(rawText)
          .replace(/^[\s\n]*```(?:json)?/i, "")
          .replace(/```[\s\n]*$/i, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch (err) {
        console.warn("Could not parse skipped answer evaluation JSON, using fallback. Raw:", rawText);
        // Fallback: extract concepts from correct answer using AI
        parsed = {
          evaluation: "Skipped",
          explanation: "No answer was provided. Review the correct answer below to understand the key concepts.",
          categoryScores: {
            contentAccuracy: 0,
            clarityStructure: 0,
            depth: 0,
            examples: 0,
            communication: 0,
          },
          totalScore: 0,
          keyConceptsMentioned: [],
          missingConcepts: correctAnswer ? ["Key concepts from the correct answer - see details below"] : [],
          usedRealLifeExamples: false,
          isCoherent: false,
          interviewImpactFeedback: "You skipped this question. Review the correct answer below and practice explaining these concepts.",
        };
      }

      return JSON.stringify(parsed);
    } catch (error) {
      console.error("Error analyzing skipped answer with OpenAI:", error);
      // Final fallback
      return JSON.stringify({
        evaluation: "Skipped",
        explanation: "No answer was provided. Review the correct answer below to understand the key concepts.",
        categoryScores: {
          contentAccuracy: 0,
          clarityStructure: 0,
          depth: 0,
          examples: 0,
          communication: 0,
        },
        totalScore: 0,
        keyConceptsMentioned: [],
        missingConcepts: correctAnswer ? ["Key concepts from the correct answer - see details below"] : [],
        usedRealLifeExamples: false,
        isCoherent: false,
        interviewImpactFeedback: "You skipped this question. Review the correct answer below and practice explaining these concepts.",
      });
    }
  }

  const prompt = `You are an expert interview evaluator.
Evaluate the USER_ANSWER primarily on its own quality, using the CORRECT_ANSWER only as a reference for key ideas.
Do NOT do line-by-line or exact-phrase comparison. Give full credit for alternate phrasing or equivalent explanations.
Be lenient: if the meaning is correct, award the points.

IMPORTANT: 
- If USER_ANSWER is completely unrelated to the question or shows fundamental misunderstanding, mark as "Wrong"
- If USER_ANSWER is partially correct but missing key points, mark as "Partially Correct"
- If USER_ANSWER is fully correct (covers all key concepts), mark as "Correct"

Mark strictly using this scheme (max 100):
1. Content Accuracy – 40 max (40 fully correct, 30 mostly correct, 20 partial, 10 minimal, 0 incorrect).
2. Clarity & Structure – 20 max (20 well structured, 10 somewhat clear, 0 confusing).
3. Depth of Explanation – 20 max (20 deep, 10 basic, 0 shallow).
4. Examples / Use Cases – 10 max (10 relevant example, 0 none; simple examples count).
5. Communication & Confidence – 10 max (10 confident/understandable, 0 hesitant; ignore accent/grammar; don't penalize filler words).

Reward:
- Capturing the same meaning even with different wording.
- Relevant real-life or practical examples.
- In-depth reasoning, trade-offs, edge cases.
Penalize only when the concept is misunderstood or very shallow.

QUESTION: ${questionText}
CORRECT_ANSWER (reference only): ${correctAnswer}
USER_ANSWER: ${userAnswer}

Return ONLY valid JSON (no backticks) with this shape.
- CRITICAL: For ALL answers (Correct, Partially Correct, or Wrong), you MUST analyze what specific concepts, points, or details the user missed or could have mentioned. Do NOT give generic feedback.
- "missingConcepts" MUST ALWAYS list SPECIFIC concepts, topics, or key points:
  * For "Wrong" answers: List ALL key concepts from the correct answer that were missing
  * For "Partially Correct" answers: List SPECIFIC concepts/points that were missed (not generic statements)
  * For "Correct" answers: List concepts that could have been mentioned to strengthen the answer further, or additional depth/edge cases that could be discussed. If the answer is truly comprehensive, list at least 1-2 concepts that could add more depth.
- "interviewImpactFeedback" MUST explicitly state what the user missed and why it matters. For example: "You missed [specific concept X] which is critical because [reason]. In an interview, this would show lack of understanding of [topic]."
- IMPORTANT: 
  * "missingConcepts" MUST NEVER be an empty array - always provide at least 1-2 specific concepts, even for correct answers (as improvement suggestions)
  * Examples of specific concepts: "Closure in JavaScript", "Event Loop mechanism", "Promise chaining", "Async/await error handling", "Memory management considerations" - NOT generic terms like "JavaScript concepts"
The JSON shape:
{
  "evaluation": "Correct" | "Partially Correct" | "Wrong",
  "explanation": "Short justification that clearly mentions what was missing if anything was missing. Be specific about what concepts were not covered. For partially correct answers, explicitly state what was good and what was missing.",
  "categoryScores": {
    "contentAccuracy": 0-40,
    "clarityStructure": 0-20,
    "depth": 0-20,
    "examples": 0-10,
    "communication": 0-10
  },
  "totalScore": 0-100,
  "keyConceptsMentioned": ["concept1", "concept2"],
  "missingConcepts": ["specific missing concept 1", "specific missing concept 2"],
  "usedRealLifeExamples": true or false,
  "isCoherent": true or false,
  "interviewImpactFeedback": "2-4 sentences that compare USER_ANSWER vs CORRECT_ANSWER. Explicitly state what specific concepts or points the user missed (e.g., 'You missed [X concept] which is important because [Y reason]'). Explain how this could affect an interview outcome. Be specific and actionable - do not use generic phrases like 'good attempt'."
}`;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const rawText = completion.choices[0]?.message?.content?.trim() || "";
  return rawText;
  } catch (error) {
    console.error("Error evaluating answer with OpenAI:", error);
    throw error;
  }
}

/**
 * POST /api/voice/evaluate
 * Expects multipart/form-data with 'audio' file and fields: questionId, questionText, correctAnswer
 */
const evaluateVoiceAnswer = async (req, res) => {
  try {
    const {
      correctAnswer = "",
      questionText = "",
      questionId = "",
      browserTranscript = "",
    } = req.body;

    if (!req.file || !req.file.buffer) {
      // If there's no audio but we have a browser transcript, still allow evaluation.
      // Also handle empty/skipped answers - analyze them with AI to get specific missed concepts
      if (browserTranscript && browserTranscript.trim()) {
        const userAnswer = browserTranscript.trim();

        // Use Gemini for evaluation
        let raw = "{}";
        try {
          raw = await evaluateAnswerWithOpenAI(questionText, correctAnswer, userAnswer);
        } catch (geminiErr) {
          console.error("Gemini evaluation error (browser transcript only):", geminiErr?.message || geminiErr);
          return res.status(200).json({
            questionId,
            userAnswer,
            correctAnswer,
            evaluation: "Partially Correct",
            score: 2,
            explanation: "Unable to run full AI evaluation; showing browser transcription result.",
            keyConceptsMentioned: [],
            missingConcepts: [],
            isCoherent: true,
            rawTranscription: browserTranscript,
          });
        }
        let parsed = {};
        try {
          const cleaned = String(raw)
            .replace(/^[\s\n]*```(?:json)?/i, "")
            .replace(/```[\s\n]*$/i, "")
            .trim();
          parsed = JSON.parse(cleaned);
        } catch (err) {
          console.warn("Could not parse evaluator JSON (browser transcript only), falling back. Raw:", raw);
          parsed = {
            evaluation: "Partially Correct",
            score: 2,
            explanation: (raw || "").slice(0, 300),
            keyConceptsMentioned: [],
            missingConcepts: [],
            isCoherent: true,
          };
        }

        const categoryScores = parsed.categoryScores || {};
        const evalLabel = parsed.evaluation || "Partially Correct";
        // Score: 0 for Wrong/Skipped, 100 for Correct, 50 for Partially Correct
        const normalizedScore = 
          evalLabel === "Wrong" || evalLabel === "Skipped" ? 0 :
          evalLabel === "Correct" ? 100 : 50;

        // Ensure missingConcepts is always an array (fallback if AI doesn't provide it)
        const missingConcepts = Array.isArray(parsed.missingConcepts) && parsed.missingConcepts.length > 0
          ? parsed.missingConcepts
          : evalLabel === "Correct"
          ? ["Consider adding more depth or edge cases to strengthen your answer"]
          : ["Key concepts from the correct answer"];

        const response = {
          questionId,
          userAnswer,
          correctAnswer,
          evaluation: parsed.evaluation || "Partially Correct",
          score: normalizedScore,
          explanation: parsed.explanation || "",
          keyConceptsMentioned: parsed.keyConceptsMentioned || [],
          missingConcepts: missingConcepts,
          isCoherent: parsed.isCoherent ?? true,
          categoryScores,
          usedRealLifeExamples: parsed.usedRealLifeExamples ?? false,
          interviewImpactFeedback: parsed.interviewImpactFeedback || "",
          rawTranscription: browserTranscript.trim(),
        };

        return res.json(response);
      }

      // If no audio and no transcript, treat as skipped question and analyze with AI
      // This allows the frontend to analyze skipped questions and get specific missed concepts
      if (!browserTranscript || !browserTranscript.trim()) {
        const userAnswer = "";
        try {
          const raw = await evaluateAnswerWithOpenAI(questionText, correctAnswer, userAnswer);
          let parsed = {};
          try {
            const cleaned = String(raw)
              .replace(/^[\s\n]*```(?:json)?/i, "")
              .replace(/```[\s\n]*$/i, "")
              .trim();
            parsed = JSON.parse(cleaned);
          } catch (err) {
            console.warn("Could not parse skipped question evaluation JSON, using fallback. Raw:", raw);
            parsed = {
              evaluation: "Skipped",
              explanation: "No answer was provided. Review the correct answer below to understand the key concepts.",
              categoryScores: {
                contentAccuracy: 0,
                clarityStructure: 0,
                depth: 0,
                examples: 0,
                communication: 0,
              },
              totalScore: 0,
              keyConceptsMentioned: [],
              missingConcepts: correctAnswer ? ["Key concepts from the correct answer - see details below"] : [],
              usedRealLifeExamples: false,
              isCoherent: false,
              interviewImpactFeedback: "You skipped this question. Review the correct answer below and practice explaining these concepts.",
            };
          }

          const categoryScores = parsed.categoryScores || {};
          const evalLabel = parsed.evaluation || "Skipped";
          const normalizedScore = 0;

          // Ensure missingConcepts is always populated
          const missingConcepts = Array.isArray(parsed.missingConcepts) && parsed.missingConcepts.length > 0
            ? parsed.missingConcepts
            : correctAnswer
            ? ["Key concepts from the correct answer - see details below"]
            : [];

          const response = {
            questionId,
            userAnswer: "",
            correctAnswer,
            evaluation: parsed.evaluation || "Skipped",
            score: normalizedScore,
            explanation: parsed.explanation || "",
            keyConceptsMentioned: parsed.keyConceptsMentioned || [],
            missingConcepts: missingConcepts,
            isCoherent: parsed.isCoherent ?? false,
            categoryScores,
            usedRealLifeExamples: parsed.usedRealLifeExamples ?? false,
            interviewImpactFeedback: parsed.interviewImpactFeedback || "",
            rawTranscription: "",
          };

          return res.json(response);
        } catch (geminiErr) {
          console.error("Gemini evaluation error (skipped question):", geminiErr?.message || geminiErr);
          return res.status(200).json({
            questionId,
            userAnswer: "",
            correctAnswer,
            evaluation: "Skipped",
            score: 0,
            explanation: "No answer was provided. Review the correct answer below to understand the key concepts.",
            keyConceptsMentioned: [],
            missingConcepts: correctAnswer ? ["Key concepts from the correct answer - see details below"] : [],
            isCoherent: false,
            rawTranscription: "",
          });
        }
      }

      return res.status(400).json({ message: "No audio file or transcript received" });
    }

    // Debug log
    console.log("Received audio size:", req.file.size);

    // Convert buffer -> Readable stream (some OpenAI SDKs accept streams reliably)
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Use Gemini (via REST API) for audio transcription
    let transcriptionResult;
    try {
      const text = await transcribeWithGemini(
        req.file.buffer,
        req.file.mimetype || "audio/webm"
      );
      transcriptionResult = { text };
    } catch (geminiErr) {
      console.error(
        "Gemini transcription error:",
        geminiErr?.message || geminiErr
      );

      // If Gemini audio transcription fails, but we have browserTranscript,
      // fall back to using that text instead of returning an error.
      if (browserTranscript && browserTranscript.trim()) {
        console.warn("Falling back to browserTranscript due to Gemini transcription error.");
        req.body.browserTranscript = browserTranscript;
        // Re-enter evaluation flow as if we had a successful transcription.
        // We do this by skipping to the "no transcribedText" path below.
        transcriptionResult = null;
      } else {
        // If no fallback text, return a helpful but non-fatal response.
        return res.status(200).json({
          questionId,
          userAnswer: "",
          correctAnswer,
          evaluation: "Unable to transcribe",
          explanation:
            geminiErr?.message?.includes("apiKey") || !process.env.GEMINI_API_KEY
              ? "Transcription service is not configured on the server. Please set GEMINI_API_KEY and restart the backend."
              : "Could not transcribe audio. Try again, speak more clearly, or contact the admin.",
          score: 0,
          keyConceptsMentioned: [],
          missingConcepts: [],
          isCoherent: false,
          rawTranscription: null,
          transcriptionError: geminiErr?.message || String(geminiErr),
        });
      }
    }

    // Different SDK versions return different shapes; normalize to string text
    let transcribedText = "";
    if (!transcriptionResult) transcribedText = "";
    else if (typeof transcriptionResult === "string") transcribedText = transcriptionResult;
    else if (typeof transcriptionResult?.text === "string") transcribedText = transcriptionResult.text;
    else if (Array.isArray(transcriptionResult?.data) && transcriptionResult.data[0]?.text) transcribedText = transcriptionResult.data[0].text;
    else if (transcriptionResult?.results && transcriptionResult.results[0]?.text) transcribedText = transcriptionResult.results[0].text;
    else transcribedText = String(transcriptionResult).slice(0, 2000);

    transcribedText = (transcribedText || "").trim();

    if (!transcribedText && browserTranscript && browserTranscript.trim()) {
      transcribedText = browserTranscript.trim();
    }

    if (!transcribedText) {
      // transcription empty and no fallback text -> return structured JSON so frontend shows feedback
      return res.status(200).json({
        questionId,
        userAnswer: "",
        correctAnswer,
        evaluation: "Unable to transcribe",
        explanation: "Could not transcribe audio. Try speaking more clearly or recording a shorter answer.",
        score: 0,
        keyConceptsMentioned: [],
        missingConcepts: [],
        isCoherent: false,
        rawTranscription: transcriptionResult,
      });
    }

    const userAnswer = transcribedText;

    // Use Gemini for evaluation
    let raw = "{}";
    try {
      raw = await evaluateAnswerWithOpenAI(questionText, correctAnswer, userAnswer);
    } catch (geminiErr) {
      console.error("Gemini evaluation error:", geminiErr?.message || geminiErr);
      // Fallback: return basic response with transcribed text
      return res.status(200).json({
        questionId,
        userAnswer,
        correctAnswer,
        evaluation: "Partially Correct",
        score: 2,
        explanation: "Unable to run full AI evaluation; showing transcription result.",
        keyConceptsMentioned: [],
        missingConcepts: [],
        isCoherent: true,
        rawTranscription: transcribedText,
      });
    }

    // Parse AI response (robust parsing if model wraps in code fences)
    let parsed = {};
    try {
      const cleaned = String(raw)
        .replace(/^[\s\n]*```(?:json)?/i, "")
        .replace(/```[\s\n]*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn("Could not parse evaluator JSON, falling back. Raw:", raw);
      parsed = {
        evaluation: "Partially Correct",
        score: 2,
        explanation: (raw || "").slice(0, 300),
        keyConceptsMentioned: [],
        missingConcepts: [],
        isCoherent: true,
      };
    }

    const categoryScores = parsed.categoryScores || {};
    const evalLabel = parsed.evaluation || "Partially Correct";
    // Score: 0 for Wrong/Skipped, 100 for Correct, 50 for Partially Correct
    const normalizedScore = 
      evalLabel === "Wrong" || evalLabel === "Skipped" ? 0 :
      evalLabel === "Correct" ? 100 : 50;

    // Ensure missingConcepts is always an array (fallback if AI doesn't provide it)
    const missingConcepts = Array.isArray(parsed.missingConcepts) && parsed.missingConcepts.length > 0
      ? parsed.missingConcepts
      : evalLabel === "Correct"
      ? ["Consider adding more depth or edge cases to strengthen your answer"]
      : ["Key concepts from the correct answer"];

    const response = {
      questionId,
      userAnswer,
      correctAnswer,
      evaluation: parsed.evaluation || "Partially Correct",
      score: normalizedScore,
      explanation: parsed.explanation || "",
      keyConceptsMentioned: parsed.keyConceptsMentioned || [],
      missingConcepts: missingConcepts,
      isCoherent: parsed.isCoherent ?? true,
      categoryScores,
      usedRealLifeExamples: parsed.usedRealLifeExamples ?? false,
      interviewImpactFeedback: parsed.interviewImpactFeedback || "",
      rawTranscription: transcribedText,
    };

    return res.json(response);
  } catch (err) {
    console.error("Voice evaluation error:", err);
    return res.status(500).json({
      message: "Voice evaluation error",
      error: err?.message || String(err),
    });
  }
};

module.exports = { evaluateVoiceAnswer };