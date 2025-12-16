
const { conceptExplainPrompt, questionAnswerPrompt, parseResumePrompt } = require("../utils/prompts");
const Question = require("../models/Question");

// Use native fetch (Node.js 18+ has fetch globally)
// For Node.js < 18, you can install node-fetch@2, but Node 18+ is recommended
const fetch = globalThis.fetch || (() => {
  try {
    return require("node-fetch");
  } catch (e) {
    throw new Error("fetch is not available. Please use Node.js 18+ (which has native fetch) or install node-fetch: npm install node-fetch@2");
  }
})();

// Helper: call Gemini REST API for text generation
// Uses the v1beta endpoint and a configurable Gemini model.
// Default is gemini-2.0-flash-lite, but you can override with GEMINI_MODEL in .env
// to any model that appears in Google AI Studio for your project.
// Includes retry logic with exponential backoff for rate limiting (429 errors)
async function generateWithGemini(
  prompt,
  model = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
  maxRetries = 2,
  temperature = 0.7
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // Use v1beta generative language endpoint
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: temperature, // Configurable temperature for variety
      maxOutputTokens: 2048,
    },
  };

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retrying (except on first attempt)
      if (attempt > 0) {
        // Exponential backoff: 5s, 10s, 20s (longer waits for persistent rate limits)
        const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Max 30s
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Rate limit hit (429). Waiting ${waitTime}ms before retry... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(text).error || {};
        } catch {
          errorData = {};
        }
        
        // Handle rate limiting (429) with retry
        if (res.status === 429) {
          if (attempt < maxRetries) {
            lastError = new Error(`Gemini API failed: ${res.status} - ${text}`);
            continue; // Will retry on next iteration
          } else {
            // All retries exhausted
            throw new Error(`Gemini API rate limit exceeded after ${maxRetries + 1} attempts. Please wait a few minutes and try again.`);
          }
        }
        
        // For other errors, throw immediately
    throw new Error(`Gemini API failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "";

  return text;
    } catch (error) {
      // If it's a 429 and we haven't exhausted retries, continue to retry
      if (error.message.includes("429") && attempt < maxRetries) {
        lastError = error;
        continue;
      }
      // For other errors or if retries exhausted, throw immediately
      throw error;
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Failed to generate response after retries");
}

// Helper: call OpenRouter API for text generation
// Uses OpenRouter (openrouter.ai) which provides access to various AI models
// Default is openai/gpt-4o-mini, but you can override with OPENAI_MODEL in .env
// Includes retry logic with exponential backoff for rate limiting (429 errors)
async function generateWithOpenAI(
  prompt,
  model = process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
  maxRetries = 2,
  temperature = 0.9
) {
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

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retrying (except on first attempt)
      if (attempt > 0) {
        const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Max 30s
        if (process.env.NODE_ENV !== 'production') {
          console.log(`OpenRouter rate limit hit. Waiting ${waitTime}ms before retry... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: temperature, // Configurable temperature for variety
        max_tokens: 4096, // Increased for longer responses with multiple questions and detailed answers
      });

      const text = completion.choices[0]?.message?.content?.trim() || "";
      return text;
    } catch (error) {
      lastError = error;
      
      // Handle rate limiting (429) with retry
      if (error.status === 429 || error.message?.includes("rate limit")) {
        if (attempt < maxRetries) {
          continue; // Will retry on next iteration
        } else {
          throw new Error(`OpenRouter API rate limit exceeded after ${maxRetries + 1} attempts. Please wait a few minutes and try again.`);
        }
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Failed to generate response after retries");
}

// Specialized function for question generation with higher token limit
async function generateQuestionsWithOpenAI(
  prompt,
  model = process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
  maxRetries = 2,
  temperature = 0.9
) {
  // Support both OPENAI_KEY and OPENAI_API_KEY for flexibility
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or OPENAI_KEY is not configured (used as OpenRouter API key)");
  }

  const OpenAI = require("openai");
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retrying (except on first attempt)
      if (attempt > 0) {
        const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Max 30s
        if (process.env.NODE_ENV !== 'production') {
          console.log(`OpenRouter rate limit hit. Waiting ${waitTime}ms before retry... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: 4096, // Higher limit for question generation with detailed answers
      });

      const text = completion.choices[0]?.message?.content?.trim() || "";
      return text;
    } catch (error) {
      lastError = error;
      
      // Handle rate limiting (429) with retry
      if (error.status === 429 || error.message?.includes("rate limit")) {
        if (attempt < maxRetries) {
          continue; // Will retry on next iteration
        } else {
          throw new Error(`OpenRouter API rate limit exceeded after ${maxRetries + 1} attempts. Please wait a few minutes and try again.`);
        }
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Failed to generate response after retries");
}

const parseResume = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      console.error("No file in request");
      return res.status(400).json({ message: "No resume file provided" });
    }
    
    let resumeText = "";
    const mimeType = req.file.mimetype;
    
    // If it's a text file, read directly
    if (mimeType.includes("text") || mimeType.includes("plain")) {
      resumeText = req.file.buffer.toString("utf-8");
    } else {
      // For PDF files, use pdf-parse library to extract text directly
      if (mimeType.includes("pdf")) {
        try {
          // pdf-parse v2 uses a class-based API
          const { PDFParse } = require("pdf-parse");
          // Create parser instance with buffer
          const parser = new PDFParse({ data: req.file.buffer });
          try {
            // Extract text
            const result = await parser.getText();
            resumeText = result.text || "";
            
            if (!resumeText || resumeText.trim().length < 50) {
              throw new Error("Could not extract sufficient text from PDF. The file might be corrupted or image-based.");
            }
          } finally {
            // Clean up parser resources
            await parser.destroy();
          }
        } catch (pdfError) {
          console.error("Error parsing PDF:", pdfError);
          throw new Error(`Failed to extract text from PDF: ${pdfError.message}`);
        }
      } else if (mimeType.includes("image")) {
        // For images, use OpenAI's vision API
        const base64Data = req.file.buffer.toString("base64");
        const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
        if (!apiKey) {
          console.error("OPENAI_API_KEY is not set in environment variables");
          return res.status(500).json({ 
            message: "OPENAI_API_KEY not configured for resume parsing. Please set it in your .env file." 
          });
        }
        
        const OpenAI = require("openai");
        const client = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: apiKey,
        });

        try {
          // For images, use vision API with proper data URL format
          const imageUrl = `data:${mimeType};base64,${base64Data}`;
          
          const completion = await client.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all text from this resume/document image. Return only the text content, no formatting or explanations. Extract everything including name, contact info, education, work experience, skills, and projects. Be thorough and extract all visible text.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            max_tokens: 4096,
          });

          resumeText = completion.choices[0]?.message?.content?.trim() || "";
            
          if (!resumeText) {
            console.error("No text in OpenAI response");
            throw new Error("No text extracted from resume image. The image might not contain readable text.");
          }
        } catch (openaiError) {
          console.error("Error calling OpenAI API:", openaiError);
          throw new Error(`Failed to extract text from resume image: ${openaiError.message}`);
        }
      } else if (mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("msword") || mimeType.includes("officedocument")) {
        // For DOCX/DOC files, use Gemini to extract text (they're binary files)
        const base64Data = req.file.buffer.toString("base64");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ message: "GEMINI_API_KEY not configured for resume parsing" });
        }

        // Use stable model for DOCX files (multimodal capable)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        
        const body = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                  },
                },
                {
                  text: "Extract all text from this resume/document. Return only the text content, no formatting or explanations.",
                },
              ],
            },
          ],
        };

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to extract text from DOCX resume: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          resumeText = data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join(" ")
            .trim() || "";
        } catch (docxError) {
          console.error("Error extracting text from DOCX:", docxError);
          throw new Error(`Failed to process DOCX file: ${docxError.message}`);
        }
      } else {
        // Unknown file type - try OpenAI anyway
        if (process.env.NODE_ENV !== 'production') {
          console.warn("Unknown file type, attempting to extract with OpenAI:", mimeType);
        }
        const base64Data = req.file.buffer.toString("base64");
        const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
        if (apiKey) {
          const OpenAI = require("openai");
          const client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
          });
          
          try {
            const imageUrl = `data:${mimeType};base64,${base64Data}`;
            const completion = await client.chat.completions.create({
              model: "openai/gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Extract all text from this document. Return only the text content.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageUrl,
                      },
                    },
                  ],
                },
              ],
              max_tokens: 4096,
            });
            
            resumeText = completion.choices[0]?.message?.content?.trim() || "";
          } catch (e) {
            console.error("Failed to extract from unknown file type:", e);
          }
        }
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: "Could not extract sufficient text from resume. Please ensure the file is readable." });
    }

    // Parse resume using AI
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    if (!openaiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      throw new Error("OPENAI_API_KEY not configured. Please set it in your .env file.");
    }
    
    const prompt = parseResumePrompt(resumeText);
    let rawText;
    try {
      rawText = await generateWithOpenAI(prompt, process.env.OPENAI_MODEL || "openai/gpt-4o-mini", 2, 0.3);
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      console.error("Error details:", {
        message: openaiError.message,
        status: openaiError.status,
        response: openaiError.response?.data
      });
      throw new Error(`Failed to parse resume with AI: ${openaiError.message}`);
    }

    // Parse the JSON response
    let cleanedText = String(rawText || "")
      .replace(/^[\s\n]*```(?:json)?/i, "")
      .replace(/```[\s\n]*$/i, "")
      .trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse resume JSON:", parseErr);
      if (process.env.NODE_ENV !== 'production') {
        console.error("Raw response (first 1000 chars):", rawText?.substring(0, 1000));
      }
      return res.status(500).json({ 
        message: "Failed to parse resume data. The AI response was not in the expected format.", 
        error: parseErr.message
      });
    }

    // Validate parsed data structure
    if (!parsedData.extractedRole && !parsedData.extractedSkills) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Parsed resume data missing key fields:", parsedData);
      }
    }

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("=== Error parsing resume ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return more detailed error information
    const errorResponse = {
      message: "Failed to parse resume",
      error: error.message,
    };
    
    // Include additional context if available
    if (error.response) {
      errorResponse.details = `API Error: ${error.response.status} - ${error.response.statusText}`;
    }
    
    res.status(500).json(errorResponse);
  }
};

const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions, resumeData, interviewType } = req.body;
    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numberOfQuestions, resumeData, interviewType || "interview");
    // Use OpenAI/OpenRouter for question generation with higher temperature (0.9) for variety
    // Use a custom function with higher max_tokens for question generation
    const rawText = await generateQuestionsWithOpenAI(prompt, process.env.OPENAI_MODEL || "openai/gpt-4o-mini", 2, 0.9);

    // Strip optional markdown fences
    let cleanedText = String(rawText || "")
      .replace(/^[\s\n]*```(?:json)?/i, "")
      .replace(/```[\s\n]*$/i, "")
      .trim();

    // For questions we expect a top-level JSON array.
    const arrStart = cleanedText.indexOf("[");
    let arrEnd = cleanedText.lastIndexOf("]");
    
    // If no closing bracket found, the response was likely truncated
    if (arrEnd === -1 || arrEnd <= arrStart) {
      // Try to find the last complete question object
      const lastCompleteObj = cleanedText.lastIndexOf('}');
      if (lastCompleteObj > arrStart) {
        // Extract up to the last complete object and try to close the array
        cleanedText = cleanedText.substring(arrStart, lastCompleteObj + 1) + '\n]';
        arrEnd = cleanedText.length - 1;
        console.warn("Response was truncated. Attempting to recover complete questions...");
      } else {
        throw new Error("Response appears to be incomplete or malformed");
      }
    } else {
      cleanedText = cleanedText.slice(arrStart, arrEnd + 1);
    }

    let data;
    try {
      data = JSON.parse(cleanedText);
      
      // Validate that we got the expected number of questions
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Response is not a valid array or is empty");
      }
      
      // Validate each question has required fields
      data = data.filter(q => q && q.question && q.answer);
      
      if (data.length === 0) {
        throw new Error("No valid questions found in response");
      }
      
      // Check if we got fewer questions than requested (might indicate truncation)
      if (data.length < numberOfQuestions) {
        console.warn(`Generated ${data.length} questions instead of requested ${numberOfQuestions}. Response may have been truncated.`);
      }
      
    } catch (parseErr) {
      console.error("Failed to parse questions JSON from OpenAI. Raw text length:", rawText?.length || 0);
      console.error("Parse error:", parseErr.message);
      console.error("Error position:", parseErr.message.match(/position (\d+)/)?.[1] || "unknown");
      
      // Try to fix incomplete JSON by finding complete question objects
      try {
        // Find all complete question objects (those with both question and answer)
        const questionPattern = /"question"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
        const matches = [];
        let match;
        while ((match = questionPattern.exec(cleanedText)) !== null) {
          matches.push(match);
        }
        
        if (matches.length > 0) {
          // Reconstruct JSON from complete matches
          const questions = matches.map((m, idx) => {
            try {
              // Extract the full question object
              const objStart = cleanedText.lastIndexOf('{', m.index);
              const objEnd = cleanedText.indexOf('}', m.index) + 1;
              if (objStart >= 0 && objEnd > objStart) {
                const objText = cleanedText.substring(objStart, objEnd);
                return JSON.parse(objText);
              }
            } catch (e) {
              // If parsing individual object fails, try to construct it
              return {
                question: m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                answer: m[2].replace(/\\"/g, '"').replace(/\\n/g, '\n')
              };
            }
            return null;
          }).filter(q => q !== null);
          
          if (questions.length > 0) {
            data = questions;
            console.warn(`Successfully recovered ${data.length} complete questions from truncated response`);
          } else {
            throw new Error("Could not extract complete questions from response");
          }
        } else {
          // Last resort: try to find and parse individual complete objects
          const objects = [];
          let currentPos = arrStart + 1;
          while (currentPos < cleanedText.length) {
            const objStart = cleanedText.indexOf('{', currentPos);
            if (objStart === -1) break;
            
            // Try to find matching closing brace
            let braceCount = 0;
            let objEnd = -1;
            for (let i = objStart; i < cleanedText.length; i++) {
              if (cleanedText[i] === '{') braceCount++;
              if (cleanedText[i] === '}') braceCount--;
              if (braceCount === 0) {
                objEnd = i + 1;
                break;
              }
            }
            
            if (objEnd > objStart) {
              try {
                const objText = cleanedText.substring(objStart, objEnd);
                const parsed = JSON.parse(objText);
                if (parsed.question && parsed.answer) {
                  objects.push(parsed);
                }
              } catch (e) {
                // Skip this object
              }
              currentPos = objEnd;
            } else {
              break; // Incomplete object
            }
          }
          
          if (objects.length > 0) {
            data = objects;
            console.warn(`Successfully recovered ${data.length} complete questions using object parsing`);
          } else {
            throw parseErr;
          }
        }
      } catch (fixErr) {
        console.error("Could not fix incomplete JSON.");
        console.error("First 500 chars:", rawText?.substring(0, 500));
        console.error("Last 500 chars:", rawText?.substring(Math.max(0, (rawText?.length || 0) - 500)));
        throw new Error(`Failed to parse questions JSON. The response may be incomplete or truncated. Original error: ${parseErr.message}`);
      }
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating questions:", error);
    const errorMessage = error.message.includes("429")
      ? "Rate limit exceeded. Please wait a moment and try again."
      : "Failed to generate questions. Please try again later.";
    res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
};

const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const prompt = conceptExplainPrompt(question);
    const rawText = await generateWithGemini(prompt);

    let cleanedText = String(rawText || "")
      .replace(/^[\s\n]*```(?:json)?/i, "")
      .replace(/```[\s\n]*$/i, "")
      .trim();
    
    const start = cleanedText.indexOf("{");
    const end = cleanedText.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      cleanedText = cleanedText.slice(start, end + 1);
    }

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse explanation JSON from Gemini. Raw text:", rawText);
      throw parseErr;
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating explanation:", error);
    const errorMessage = error.message.includes("429")
      ? "Rate limit exceeded. Please wait a moment and try again."
      : "Failed to generate explanation. Please try again later.";
    res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
};

const analyzeInterviewResults = async (req, res) => {
  try {
    const { questions, answers } = req.body;
    if (!questions || !answers || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Missing required fields: questions and answers" });
    }

    // Build a summary of all questions and answers for AI analysis
    const summary = questions.map((q, idx) => {
      const ans = answers[q.id] || {};
      return {
        questionNumber: idx + 1,
        question: q.text,
        userAnswer: ans.userAnswer || "No answer provided",
        correctAnswer: q.answer || ans.correctAnswer || "",
        score: ans.score || 0,
        keyConceptsMentioned: ans.keyConceptsMentioned || [],
        missingConcepts: ans.missingConcepts || [],
        focusArea: q.focusArea || "General",
      };
    });

    const prompt = `You are an expert interview coach analyzing a complete interview session.

Analyze all the questions and answers provided below. Your task is to:
1. Identify STRONG CONCEPTS - concepts the candidate consistently demonstrated understanding of across multiple answers
2. Identify AREAS FOR IMPROVEMENT - concepts, topics, or skills the candidate missed, struggled with, or needs to work on

Be specific and actionable. Focus on technical concepts, not just general feedback.

Interview Summary:
${JSON.stringify(summary, null, 2)}

Return ONLY valid JSON (no backticks) with this exact structure:
{
  "strongConcepts": ["concept1", "concept2", "concept3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "strongConceptsSuggestions": "2-3 sentences explaining how the candidate can leverage these strengths in future interviews",
  "improvementSuggestions": "2-3 sentences with actionable advice on how to improve in the identified weak areas"
}

Important:
- strongConcepts should be specific technical concepts (e.g., "React Hooks", "Async/Await", "Database Indexing")
- areasForImprovement should be specific topics or concepts that need work
- Keep arrays to 3-5 items each, focusing on the most important ones
- Suggestions should be practical and actionable`;

    // Use OpenAI/OpenRouter instead of Gemini for results analysis
    // Use lower temperature (0.7) for more consistent analysis results
    const rawText = await generateWithOpenAI(prompt, process.env.OPENAI_MODEL || "openai/gpt-4o-mini", 2, 0.7);

    let cleanedText = String(rawText || "")
      .replace(/^[\s\n]*```(?:json)?/i, "")
      .replace(/```[\s\n]*$/i, "")
      .trim();

    const start = cleanedText.indexOf("{");
    const end = cleanedText.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      cleanedText = cleanedText.slice(start, end + 1);
    }

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse analysis JSON from OpenAI. Raw text:", rawText);
      throw parseErr;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error analyzing interview results:", error);
    
    // Return a fallback response instead of failing completely
    // This allows the frontend to still show results even if AI analysis fails
    const isRateLimit = error.message.includes("429") || error.message.includes("rate limit");
    const fallbackResponse = {
      strongConcepts: [],
      areasForImprovement: [],
      strongConceptsSuggestions: isRateLimit 
        ? "AI analysis is temporarily unavailable due to rate limits. Please wait a few minutes and refresh the page to see AI-generated insights."
        : "Unable to generate AI analysis at this time. Please review your answers manually to identify strengths.",
      improvementSuggestions: isRateLimit
        ? "AI analysis is temporarily unavailable due to rate limits. Please review the feedback for each question below to identify areas for improvement."
        : "Unable to generate AI analysis at this time. Please review the feedback for each question to identify areas for improvement.",
      error: isRateLimit
        ? "Rate limit exceeded. The API has temporary usage limits. Please wait 2-3 minutes before trying again."
        : "AI analysis temporarily unavailable. Please try again later."
    };
    
    // Log the error but return success with fallback data
    console.warn("Returning fallback response for interview analysis:", error.message);
    res.status(200).json(fallbackResponse);
  }
};

const generateQuizFromMissedConcepts = async (req, res) => {
  try {
    const { missedConcepts, topics, answers, questions } = req.body;
    if (!missedConcepts || !Array.isArray(missedConcepts) || missedConcepts.length === 0) {
      return res.status(400).json({ message: "Missing required fields: missedConcepts array" });
    }

    // Build context from interview answers and questions
    let interviewContext = "";
    if (questions && Array.isArray(questions) && answers && Object.keys(answers).length > 0) {
      const answerSummaries = questions
        .filter(q => answers[q.id])
        .map(q => {
          const ans = answers[q.id];
          return {
            question: q.text,
            userAnswer: ans.userAnswer || "",
            correctAnswer: q.answer || ans.correctAnswer || "",
            score: ans.score || 0,
            missingConcepts: ans.missingConcepts || [],
            keyConceptsMentioned: ans.keyConceptsMentioned || [],
          };
        })
        .slice(0, 5); // Limit to 5 most relevant for context
      
      interviewContext = `\n\nInterview Context (for reference):
${JSON.stringify(answerSummaries, null, 2)}`;
    }

    const prompt = `You are an expert interview quiz creator. Generate exactly 5 multiple-choice quiz questions based on the user's interview performance.

The user recently completed an interview and missed several concepts. Your task is to create practice questions that:
1. Are directly related to the interview questions they answered
2. Focus on the specific concepts they missed
3. Help them improve for future interviews
4. Test understanding at an interview-appropriate level

Missed Concepts: ${missedConcepts.join(", ")}
Topics: ${topics ? topics.join(", ") : "General"}${interviewContext}

IMPORTANT REQUIREMENTS:
- Generate EXACTLY 5 questions (no more, no less)
- Each question should be interview-style (similar to technical interview questions)
- Questions should test understanding of the missed concepts in practical, interview-relevant scenarios
- Each question must have exactly 4 multiple-choice options (A, B, C, D)
- Each question must have exactly ONE correct answer
- The 3 incorrect options should be plausible distractors that test common misunderstandings
- Questions should be related to the interview context provided above
- Make questions practical and applicable to real interview scenarios

Return ONLY valid JSON (no backticks) with this exact structure:
[
  {
    "question": "Question text here (interview-style, practical scenario)",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A" | "B" | "C" | "D",
    "explanation": "Brief explanation of why the correct answer is correct and how it relates to the interview concept",
    "concept": "The specific concept from the missed concepts list that this question tests"
  },
  ... (exactly 4 more questions)
]`;

    // Use OpenAI instead of Gemini for quiz generation to avoid rate limits
    // Use higher temperature (0.9) for variety in quiz questions
    const rawText = await generateWithOpenAI(prompt, process.env.OPENAI_MODEL || "openai/gpt-4o-mini", 2, 0.9);

    let cleanedText = String(rawText || "")
      .replace(/^[\s\n]*```(?:json)?/i, "")
      .replace(/```[\s\n]*$/i, "")
      .trim();

    const arrStart = cleanedText.indexOf("[");
    const arrEnd = cleanedText.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      cleanedText = cleanedText.slice(arrStart, arrEnd + 1);
    }

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse quiz JSON from OpenAI. Raw text:", rawText);
      throw parseErr;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating quiz:", error);
    
    // Provide a more user-friendly error message
    const isRateLimit = error.message.includes("429") || error.message.includes("rate limit");
    const errorMessage = isRateLimit
      ? "Rate limit exceeded. Please wait 2-3 minutes and try again."
      : error.message.includes("OPENAI_API_KEY") || error.message.includes("OPENAI_KEY")
      ? "AI service is not configured properly. Please add OPENAI_API_KEY or OPENAI_KEY to your .env file."
      : "Failed to generate quiz. Please try again later.";
    
    // Return a fallback response with empty array so frontend doesn't crash
    if (isRateLimit) {
      console.warn("Returning fallback response for quiz generation due to rate limit");
      return res.status(200).json([]);
    }
    
    res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation, analyzeInterviewResults, generateQuizFromMissedConcepts, parseResume };