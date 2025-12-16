import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { CheckCircle2, XCircle, AlertCircle, Award, RotateCcw } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import Button from "./Button";

const ResultsDashboard = ({ data, onReset }) => {
  const navigate = useNavigate();
  const { questions = [], answers = {}, skippedQuestionIds = [] } = data || {};
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const hasFetchedAnalysis = useRef(false);

  const skippedSet = new Set(skippedQuestionIds || []);

  const barData = questions.map((q, idx) => ({
    name: `Q${idx + 1}`,
    score: answers[q.id]?.score || 0,
    text: q.text,
  }));
  
  const totalScore = Object.values(answers).reduce((acc, curr) => acc + (curr.score || 0), 0);
  const attemptedCount = Object.values(answers).length || 1;
  const avgScore = attemptedCount > 0 ? Math.round(totalScore / attemptedCount) : 0;

  const allStrongConcepts = new Set();
  const allWeakConcepts = new Set();
  Object.values(answers).forEach((ans) => {
    (ans.keyConceptsMentioned || []).forEach((c) => allStrongConcepts.add(c));
    (ans.missingConcepts || []).forEach((c) => allWeakConcepts.add(c));
  });
  allStrongConcepts.forEach((c) => allWeakConcepts.delete(c));

  // Derive topic-level areas for improvement based on skipped or low-scoring questions
  const weakTopics = new Set();
  questions.forEach((q) => {
    const ans = answers[q.id];
    const score = ans?.score ?? 0;
    const wasSkipped = skippedSet.has(q.id) || !ans;
    if (wasSkipped || score < 60) {
      weakTopics.add(q.focusArea || "General");
    }
  });

  const proficiencyLevel =
    avgScore >= 90 ? "Top Scorer" : avgScore >= 70 ? "Proficient" : avgScore >= 40 ? "General" : "Novice";

  const levelPositionMap = {
    "Novice": 0,
    "General": 33,
    "Proficient": 66,
    "Top Scorer": 100,
  };
  const markerPosition = levelPositionMap[proficiencyLevel];

  // State to store AI-evaluated skipped questions
  const [evaluatedSkippedQuestions, setEvaluatedSkippedQuestions] = useState({});
  const [analyzingSkipped, setAnalyzingSkipped] = useState(false);

  // Track which skipped questions have been analyzed to prevent duplicate API calls
  const hasAnalyzedSkipped = useRef(false);

  // Analyze skipped questions with AI using the evaluation endpoint (only once)
  useEffect(() => {
    // Prevent duplicate calls
    if (hasAnalyzedSkipped.current) {
      return;
    }

    const analyzeSkippedQuestions = async () => {
      const skippedToAnalyze = questions.filter(
        (q) => skippedSet.has(q.id) && !answers[q.id] && !evaluatedSkippedQuestions[q.id]
      );

      if (skippedToAnalyze.length === 0) {
        hasAnalyzedSkipped.current = true;
        return;
      }

      // Mark as analyzing immediately to prevent duplicate calls
      hasAnalyzedSkipped.current = true;
      setAnalyzingSkipped(true);
      
      try {
        // Analyze each skipped question by calling the evaluation endpoint with empty transcript
        const analysisPromises = skippedToAnalyze.map(async (q) => {
          try {
            const formData = new FormData();
            formData.append("questionText", q.text);
            formData.append("correctAnswer", q.answer || "");
            formData.append("questionId", q.id);
            formData.append("browserTranscript", ""); // Empty since question was skipped

            const response = await axiosInstance.post(API_PATHS.AI.EVALUATE_ANSWER, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return { questionId: q.id, evaluation: response.data };
          } catch (error) {
            console.error(`Failed to analyze skipped question ${q.id}:`, error);
            return null;
          }
        });

        const results = await Promise.all(analysisPromises);
        const evaluated = {};
        results.forEach((result) => {
          if (result) {
            evaluated[result.questionId] = result.evaluation;
          }
        });
        setEvaluatedSkippedQuestions((prev) => ({ ...prev, ...evaluated }));
      } catch (error) {
        console.error("Error analyzing skipped questions:", error);
        // Reset flag on error so it can be retried if needed
        hasAnalyzedSkipped.current = false;
      } finally {
        setAnalyzingSkipped(false);
      }
    };

    analyzeSkippedQuestions();
  }, [questions, skippedSet, answers]); // Removed evaluatedSkippedQuestions from deps to prevent re-runs

  // Fetch AI analysis on component mount (only once)
  useEffect(() => {
    // Prevent duplicate calls
    if (hasFetchedAnalysis.current) {
      return;
    }

    const fetchAiAnalysis = async () => {
      // Mark as fetched immediately to prevent duplicate calls
      hasFetchedAnalysis.current = true;
      
      try {
        setLoadingAnalysis(true);
        const response = await axiosInstance.post(API_PATHS.AI.ANALYZE_RESULTS, {
          questions: questions.map((q) => ({
            id: q.id,
            text: q.text,
            answer: answers[q.id]?.correctAnswer || q.answer || "",
            focusArea: q.focusArea || "General",
          })),
          answers: Object.entries(answers).reduce((acc, [qId, ans]) => {
            acc[qId] = {
              userAnswer: ans.userAnswer || "",
              score: ans.score || 0,
              keyConceptsMentioned: ans.keyConceptsMentioned || [],
              missingConcepts: ans.missingConcepts || [],
            };
            return acc;
          }, {}),
        });
        setAiAnalysis(response.data);
      } catch (error) {
        console.error("Failed to fetch AI analysis:", error);
        // Reset flag on error so user can retry if needed
        hasFetchedAnalysis.current = false;
        // Fallback to existing logic if AI analysis fails
      } finally {
        setLoadingAnalysis(false);
      }
    };

    if (questions.length > 0 && Object.keys(answers).length > 0) {
      fetchAiAnalysis();
    } else {
      // Reset flag if conditions aren't met
      hasFetchedAnalysis.current = false;
    }
  }, [questions, answers]);

  // Use AI analysis if available, otherwise fall back to existing logic
  const displayStrongConcepts = aiAnalysis?.strongConcepts || Array.from(allStrongConcepts);
  const displayWeakConcepts = aiAnalysis?.areasForImprovement || Array.from(allWeakConcepts);

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: '#fffdf5' }}>
      <div className="w-full max-w-6xl mx-auto px-4 py-8 pb-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>Interview Results: {data.topic}</h2>
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm font-bold" style={{ color: '#18181b' }}>Overall Score</span>
            <span className={`text-4xl font-black ${avgScore >= 80 ? "text-emerald-600" : avgScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {avgScore}%
            </span>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Proficiency - vertical meter style */}
        <div className="bg-white border-3 border-black p-6 shadow-neo flex flex-col justify-between" style={{ backgroundColor: '#fff' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#18181b' }}>Topic Proficiency</h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Based on correct and in-depth answers</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black shadow-neo-sm" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
              <Award className="w-4 h-4" />
              <span className="text-[11px] font-bold">Mastery Tracker</span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            {/* Vertical track */}
            <div className="relative h-64 w-24 flex items-center justify-center">
              <div className="relative h-full w-1 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-emerald-400 via-indigo-500 to-violet-500 rounded-full opacity-80" />

                {/* Level markers */}
                {[
                  { label: "Top Scorer", value: 100 },
                  { label: "Proficient", value: 66 },
                  { label: "General", value: 33 },
                  { label: "Novice", value: 0 },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
                    style={{ bottom: `${value}%` }}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 ${
                        proficiencyLevel === label ? "border-amber-400 bg-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "border-gray-400 bg-gray-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        proficiencyLevel === label ? "text-amber-600" : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}

                {/* Active marker */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
                  style={{ bottom: `${markerPosition}%` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.9)] border-2 border-amber-600" />
                </div>
              </div>
            </div>

            {/* Score summary */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: '#6b7280' }}>Overall Proficiency</p>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-5xl font-black" style={{ color: '#18181b' }}>
                    {avgScore}
                    <span className="text-2xl align-super" style={{ color: '#6b7280' }}>%</span>
                  </span>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full border-2 border-black shadow-neo-sm" style={{ backgroundColor: '#34d399', color: '#065f46' }}>
                    {proficiencyLevel}
                  </span>
                </div>
                <p className="text-[13px] mt-2" style={{ color: '#6b7280' }}>
                  Your score reflects whether your answers were on-topic and showed understanding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-3 border-black p-6 shadow-neo" style={{ backgroundColor: '#fff' }}>
          <h3 className="text-lg font-black mb-4 flex items-center" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}><AlertCircle className="w-5 h-5 mr-2" style={{ color: '#8b5cf6' }} />Performance per Question</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: "#fff", border: "3px solid #000", color: "#18181b", borderRadius: "4px", boxShadow: "4px 4px 0px 0px #000" }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? "#34d399" : entry.score >= 50 ? "#fbbf24" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-3 border-black p-6 shadow-neo" style={{ backgroundColor: '#fff' }}>
          <h3 className="font-black mb-2 flex items-center" style={{ color: '#34d399', fontFamily: 'Space Grotesk, sans-serif' }}>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Strong Concepts
            {loadingAnalysis && <span className="ml-2 text-xs" style={{ color: '#6b7280' }}>(AI analyzing...)</span>}
          </h3>
          <p className="text-xs mb-3" style={{ color: '#6b7280' }}>Concepts you consistently handled well. Use them as anchors when answering more advanced questions.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {displayStrongConcepts.length > 0 ? (
              displayStrongConcepts.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-sm border-2 border-black shadow-neo-sm font-bold" style={{ backgroundColor: '#34d399', color: '#065f46' }}>
                  {c}
                </span>
              ))
            ) : (
              <span className="italic" style={{ color: '#6b7280' }}>
                No specific strengths identified yet. Keep practicing across topics to build a strong base.
              </span>
            )}
          </div>
          {aiAnalysis?.strongConceptsSuggestions ? (
            <p className="text-xs mt-3 italic border-t-2 border-black pt-3" style={{ color: '#065f46' }}>
              💡 {aiAnalysis.strongConceptsSuggestions}
            </p>
          ) : displayStrongConcepts.length > 0 && (
            <p className="text-xs" style={{ color: '#065f46' }}>
              Tip: In your next interview, try to connect new questions back to{" "}
              {displayStrongConcepts.slice(0, 3).join(", ")}
              {" "}to show how they relate.
            </p>
          )}
        </div>

        <div className="bg-white border-3 border-black p-6 shadow-neo" style={{ backgroundColor: '#fff' }}>
          <h3 className="font-black mb-2 flex items-center" style={{ color: '#ef4444', fontFamily: 'Space Grotesk, sans-serif' }}>
            <XCircle className="w-5 h-5 mr-2" />
            Areas for Improvement
            {loadingAnalysis && <span className="ml-2 text-xs" style={{ color: '#6b7280' }}>(AI analyzing...)</span>}
          </h3>
          <p className="text-xs mb-3" style={{ color: '#6b7280' }}>Topics and concepts where your answers were skipped or need deeper understanding.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(weakTopics).map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm border-2 border-black shadow-neo-sm font-bold"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                {topic}
              </span>
            ))}
            {weakTopics.size === 0 && displayWeakConcepts.length === 0 && (
              <span className="italic" style={{ color: '#6b7280' }}>
                Excellent! No major topic-level gaps detected.
              </span>
            )}
          </div>

          {displayWeakConcepts.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] mb-1 uppercase tracking-[0.18em]" style={{ color: '#6b7280' }}>Key Concepts to Review</p>
              <div className="flex flex-wrap gap-2">
                {displayWeakConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs border-2 border-black shadow-neo-sm font-bold"
                    style={{ backgroundColor: '#000', color: '#fff' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {aiAnalysis?.improvementSuggestions ? (
            <p className="text-xs mt-3 italic border-t-2 border-black pt-3" style={{ color: '#991b1b' }}>
              💡 {aiAnalysis.improvementSuggestions}
            </p>
          ) : displayWeakConcepts.length > 0 && (
            <p className="text-xs mt-2" style={{ color: '#991b1b' }}>
              Suggestion: Revisit docs or notes for these concepts, then practice answering 1–2 short questions aloud for each.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>Detailed Feedback</h3>
        {questions.map((q, idx) => {
          const wasSkipped = skippedSet.has(q.id);
          // Check if we have AI evaluation for this skipped question
          const skippedEvaluation = evaluatedSkippedQuestions[q.id];
          
          // For skipped questions, use AI evaluation if available, otherwise use fallback
          const ans = answers[q.id] || (wasSkipped && skippedEvaluation ? {
            score: skippedEvaluation.score || 0,
            feedback: skippedEvaluation.explanation || "Question was skipped",
            evaluation: skippedEvaluation.evaluation || "Skipped",
            userAnswer: skippedEvaluation.userAnswer || "",
            correctAnswer: skippedEvaluation.correctAnswer || q.answer || "",
            missingConcepts: skippedEvaluation.missingConcepts || [],
            interviewImpactFeedback: skippedEvaluation.interviewImpactFeedback || "You skipped this question.",
            categoryScores: skippedEvaluation.categoryScores || null,
            keyConceptsMentioned: skippedEvaluation.keyConceptsMentioned || [],
          } : {
            score: 0,
            feedback: wasSkipped ? "Question was skipped. Analyzing with AI..." : "No answer provided",
            evaluation: wasSkipped ? "Skipped" : "Wrong",
            userAnswer: "",
            correctAnswer: q.answer || "",
            missingConcepts: [],
            interviewImpactFeedback: wasSkipped 
              ? "You skipped this question. AI is analyzing what concepts you should have covered."
              : "No answer was provided for this question.",
          });
          const missedList = Array.isArray(ans.missingConcepts) ? ans.missingConcepts : [];
          const feedbackText =
            missedList.length > 0
              ? `You missed these important points: ${missedList.join(", ")}`
              : ans.feedback || "Great work — you covered the key ideas for this question.";
          return (
            <div key={q.id} className="bg-white border-3 border-black p-6 shadow-neo mb-6" style={{ backgroundColor: '#fff' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase mb-1 block" style={{ color: '#8b5cf6' }}>Question {idx + 1} — {q.difficulty}</span>
                  <h4 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{q.text}</h4>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold text-sm border-2 border-black shadow-neo-sm ${
                  ans.score >= 80 ? "bg-emerald-500 text-white" : ans.score >= 50 ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {ans.score}/100
                </div>
              </div>
              <div className="space-y-3">
                {/* AI Feedback Section */}
                <div className="border-3 border-black p-6 shadow-neo-sm" style={{ backgroundColor: '#f9fafb' }}>
                  <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase mb-1" style={{ color: '#6b7280' }}>AI Feedback</h4>
                    <h3 className="text-xl font-black mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>
                      {ans.evaluation === "Wrong" || ans.evaluation === "Skipped" 
                        ? "Needs Improvement" 
                        : ans.evaluation === "Correct" 
                        ? "Excellent Answer" 
                        : "Partially Correct"}
                    </h3>
                    {/* Show explanation which contains specific feedback about what was missed */}
                    {ans.explanation && (
                      <p className="text-sm mt-2 italic" style={{ color: '#4b5563' }}>
                        {ans.explanation}
                      </p>
                    )}
                  </div>

                  {ans.userAnswer && (
                    <div className="mt-3">
                      <p className="text-sm" style={{ color: '#18181b' }}>
                        <span className="font-bold">Your Answer:</span>{" "}
                        {ans.userAnswer}
                      </p>
                    </div>
                  )}

                  {ans.correctAnswer && (
                    <div className="mt-5">
                      <h5 className="text-sm font-bold mb-2" style={{ color: '#18181b' }}>Correct Answer</h5>
                      <div className="border-2 border-black p-4 shadow-neo-sm" style={{ backgroundColor: '#fff' }}>
                        <div className="whitespace-pre-wrap text-sm" style={{ color: '#18181b' }}>{ans.correctAnswer}</div>
                      </div>
                    </div>
                  )}

                  {/* AI Interview Feedback - shown below correct answer */}
                  {ans.interviewImpactFeedback && (
                    <div className="mt-5">
                      <h5 className="text-sm font-bold mb-2" style={{ color: '#fbbf24' }}>AI Interview Feedback</h5>
                      <div className="border-2 border-black p-4 shadow-neo-sm" style={{ backgroundColor: '#fff' }}>
                        <div className="whitespace-pre-wrap text-sm" style={{ color: '#18181b' }}>{ans.interviewImpactFeedback}</div>
                      </div>
                    </div>
                  )}

                  {/* Missing concepts - Show for all attempted answers */}
                  {ans.userAnswer !== undefined && ans.userAnswer !== null && (
                    <div className="mt-4">
                      {Array.isArray(ans.missingConcepts) && ans.missingConcepts.length > 0 ? (
                        <>
                          <h5 className={`text-sm font-bold mb-1 ${
                            ans.evaluation === "Correct" 
                              ? "text-amber-600" 
                              : "text-red-600"
                          }`}>
                            {ans.evaluation === "Correct" 
                              ? "Concepts to strengthen your answer" 
                              : "What you missed"}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {ans.missingConcepts.map((c, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-xs border-2 border-black shadow-neo-sm font-bold ${
                                  ans.evaluation === "Correct"
                                    ? "bg-yellow-500 text-black"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm italic" style={{ color: '#6b7280' }}>
                          No specific concepts identified. Your answer covered the key points well.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

        <div className="flex justify-center gap-4 pt-8">
          <Button
            onClick={async () => {
              const topics = Array.from(weakTopics);
              const concepts = Array.from(allWeakConcepts);
              
              // Collect all missed concepts from answers
              const allMissedConcepts = new Set();
              Object.values(answers).forEach((ans) => {
                if (Array.isArray(ans.missingConcepts)) {
                  ans.missingConcepts.forEach((c) => allMissedConcepts.add(c));
                }
              });
              concepts.forEach((c) => allMissedConcepts.add(c));

              if (allMissedConcepts.size === 0) {
                // No missed concepts, just go to dashboard
                onReset();
                return;
              }

              try {
                setGeneratingQuiz(true);
                // Generate quiz from missed concepts and answers
                navigate("/quiz", {
                  state: {
                    missedConcepts: Array.from(allMissedConcepts),
                    topics: topics.length > 0 ? topics : [data.topic || "General"],
                    answers: answers, // Pass answers data for context
                    questions: questions, // Pass questions for context
                  },
                });
              } catch (e) {
                console.error("Error navigating to quiz:", e);
                onReset();
              } finally {
                setGeneratingQuiz(false);
              }
            }}
            disabled={generatingQuiz}
            isLoading={generatingQuiz}
            icon={!generatingQuiz && <RotateCcw className="w-5 h-5" />}
            className="px-8 py-3"
          >
            {generatingQuiz ? "Generating Quiz..." : "Practice Quiz on Missed Concepts"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
