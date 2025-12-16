const parseResumePrompt = (resumeText) => {
  return `You are an expert resume parser. Extract key information from the following resume text and return it as structured JSON.

RESUME TEXT:
${resumeText}

Extract and return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "extractedRole": "The job title or role mentioned in the resume (e.g., 'Frontend Developer', 'Full Stack Engineer')",
  "extractedExperience": "Total years of experience (e.g., '3 years', '5+ years')",
  "extractedSkills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "extractedEducation": "Education details (degree, university, etc.)",
  "extractedProjects": ["Project 1 description", "Project 2 description", ...],
  "rawText": "A cleaned version of the resume text"
}

IMPORTANT:
- Extract all technical skills, programming languages, frameworks, and tools mentioned
- Extract all relevant projects with brief descriptions
- If experience is not explicitly stated, estimate based on work history
- Return ONLY the JSON object, nothing else`;
};

const questionAnswerPrompt = (role, experience, topicToFocus, numberOfQuestions, resumeData = null, interviewType = "interview") => {
  // Add variation to the prompt to ensure different questions each time
  const questionTypes = [
    "conceptual understanding questions",
    "practical implementation questions",
    "problem-solving scenarios",
    "code analysis questions",
    "architecture and design questions",
    "edge cases and error handling",
    "performance optimization questions",
    "real-world application scenarios"
  ];
  
  // Randomly select different question types to encourage variety
  const selectedTypes = questionTypes
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(4, numberOfQuestions));
  
  // Build context with resume data if available
  let resumeContext = "";
  if (resumeData) {
    resumeContext = `
RESUME INFORMATION (use this to personalize questions):
- Role from Resume: ${resumeData.extractedRole || role}
- Experience from Resume: ${resumeData.extractedExperience || experience}
- Skills: ${resumeData.extractedSkills?.join(", ") || "Not specified"}
- Education: ${resumeData.extractedEducation || "Not specified"}
- Projects: ${resumeData.extractedProjects?.join("; ") || "Not specified"}

IMPORTANT: Generate questions that are relevant to the candidate's actual skills and experience from their resume.`;
  }

  const interviewTypeContext = interviewType === "technical interview" 
    ? "Focus on deep technical questions, coding challenges, system design, and problem-solving scenarios."
    : "Include a mix of technical questions, behavioral questions, and practical scenarios.";

  return `You are an expert ${interviewType === "technical interview" ? "technical" : ""} interviewer creating diverse interview questions for a ${role} position.

CONTEXT:
- Role: ${role}
- Candidate Experience Level: ${experience} years
- Focus Topics: ${topicToFocus}
- Number of Questions Needed: ${numberOfQuestions}
- Interview Type: ${interviewType}
${resumeContext}

CRITICAL REQUIREMENTS FOR VARIETY:
1. Generate ${numberOfQuestions} UNIQUE and DIVERSE questions - each question must be different from common interview questions
2. Cover different aspects: ${selectedTypes.join(", ")}
3. Vary difficulty levels appropriately for ${experience} years of experience
4. ${interviewTypeContext}
5. ${resumeData ? "Personalize questions based on the candidate's resume - reference their specific skills, projects, and experience when relevant." : ""}
6. Include a mix of:
   - Theoretical/conceptual questions
   - Practical coding/implementation questions
   - Real-world scenario-based questions
   - Problem-solving questions
   - Design/architecture questions (if applicable)
   ${interviewType === "interview" ? "- Behavioral questions about past experiences\n   - Questions about projects and achievements" : ""}
7. Each question should test different concepts within ${topicToFocus}
8. Avoid generic or commonly repeated interview questions - be creative and specific
9. Questions should be relevant to actual ${role} interview scenarios

QUESTION FORMAT REQUIREMENTS:
- Each question must be clear, specific, and interview-appropriate
- Questions should progressively cover different aspects of ${topicToFocus}
- Make questions practical and applicable to real work scenarios
- Include questions that test both breadth and depth of knowledge

ANSWER FORMAT REQUIREMENTS:
- For each question, provide a comprehensive, detailed answer
- Answers should be beginner-friendly but thorough
- Include code examples where relevant (use proper code blocks)
- Use bullet points for clarity
- Answers should demonstrate the expected level of understanding for ${experience} years of experience

Return ONLY valid JSON (no markdown, no backticks, no extra text) with this exact structure:
[
  {
    "question": "Unique, specific interview question here",
    "answer": "Detailed answer with explanations, examples, and code if needed."
  },
  {
    "question": "Another unique question covering a different aspect",
    "answer": "Comprehensive answer for this question."
  }
  ... (exactly ${numberOfQuestions} questions total)
]

IMPORTANT:
- Generate ${numberOfQuestions} DISTINCT questions - no duplicates or variations of the same question
- Each question must cover different concepts or aspects
- Questions should be diverse in style and focus
- Return ONLY the JSON array, nothing else`;
};

const conceptExplainPrompt = (question) => (
    `You are an AI trained to generate explanation for a given interview question.
    Task:
    - Explain the following interview question and its concept in depth as if you're teaching a developer.
    - Question: "${question}"
    - After the explanation, provide a short and clear title that summarizes the concept for the article or page header.
    - If the explanation includes a code example, provide a small code block.
    - Keep the formatting very clean and clear with bullet points.
    - Return the result as a valid JSON object in the following format:
    {
      "title": "Short title here",
      "explanation": "Explanation here."
    }
    Important: DO NOT add any extra text outside the JSON format. Only return valid  clean, readable text.`
);

module.exports = { questionAnswerPrompt, conceptExplainPrompt, parseResumePrompt };
