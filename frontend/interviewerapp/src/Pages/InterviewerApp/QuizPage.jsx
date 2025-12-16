import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";

const QuizPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        setLoading(true);
        const { missedConcepts, topics, answers, questions } = location.state || {};
        
        if (!missedConcepts || missedConcepts.length === 0) {
          setError("No missed concepts found. Please complete an interview first.");
          setLoading(false);
          return;
        }

        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, {
          missedConcepts,
          topics: topics || [],
          answers: answers || {},
          questions: questions || [],
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setQuizQuestions(response.data);
        } else if (response.data && Array.isArray(response.data) && response.data.length === 0) {
          setError("No quiz questions were generated. Please try again.");
        } else {
          setError("Failed to generate quiz questions. The response format was unexpected.");
        }
      } catch (err) {
        console.error("Error generating quiz:", err);
        const errorMsg = err.response?.data?.message || err.message || "Failed to generate quiz. Please try again.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    generateQuiz();
  }, [location.state]);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer,
    });
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: quizQuestions.length, percentage: Math.round((correct / quizQuestions.length) * 100) };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#fffdf5' }}>
          <SpinnerLoader />
          <p className="mt-4 font-medium" style={{ color: '#6b7280' }}>Generating quiz based on your missed concepts...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#fffdf5' }}>
          <p className="mb-4 font-bold" style={{ color: '#ef4444' }}>{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 border-3 border-black shadow-neo font-bold transition-all hover:-translate-y-1 hover:shadow-neo-hover"
            style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
          >
            Go to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-slate-400 mb-4">No quiz questions available.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            Go to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const q = quizQuestions[currentQuestion];
  const score = showResults ? calculateScore() : null;

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto px-4 py-8 pb-20" style={{ backgroundColor: '#fffdf5', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>Practice Quiz: Missed Concepts</h2>
          <div className="text-sm font-bold" style={{ color: '#6b7280' }}>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </div>
        </div>

        {!showResults ? (
          <div className="bg-white border-3 border-black p-8 shadow-neo">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 border-2 border-black rounded-full text-xs font-bold shadow-neo-sm" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                  {q.concept || "General"}
                </span>
              </div>
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{q.question}</h3>
            </div>

            <div className="space-y-3 mb-6">
              {Object.entries(q.options || {}).map(([key, value]) => {
                const isSelected = selectedAnswers[currentQuestion] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(currentQuestion, key)}
                    className={`w-full text-left p-4 border-3 border-black transition-all font-bold ${
                      isSelected
                        ? "shadow-neo"
                        : "shadow-neo-sm hover:shadow-neo"
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#8b5cf6' : '#fff',
                      color: isSelected ? '#fff' : '#18181b'
                    }}
                  >
                    <span className="mr-3">{key}:</span>
                    {value}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 border-3 border-black shadow-neo-sm font-bold transition-all hover:-translate-y-1 hover:shadow-neo disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#fff', color: '#18181b' }}
              >
                Previous
              </button>

              {currentQuestion < quizQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="px-6 py-2 border-3 border-black shadow-neo font-bold transition-all hover:-translate-y-1 hover:shadow-neo-hover flex items-center gap-2"
                  style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 border-3 border-black shadow-neo font-bold transition-all hover:-translate-y-1 hover:shadow-neo-hover"
                  style={{ backgroundColor: '#34d399', color: '#fff' }}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border-3 border-black p-8 shadow-neo text-center">
              <h3 className="text-2xl font-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>Quiz Results</h3>
              <div className="text-5xl font-black mb-2">
                <span style={{ color: score.percentage >= 70 ? "#34d399" : score.percentage >= 50 ? "#fbbf24" : "#ef4444" }}>
                  {score.percentage}%
                </span>
              </div>
              <p className="font-medium" style={{ color: '#6b7280' }}>
                You got {score.correct} out of {score.total} questions correct
              </p>
            </div>

            {quizQuestions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <div
                  key={idx}
                  className={`bg-white border-3 p-6 shadow-neo ${
                    isCorrect ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{q.question}</h4>
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#34d399' }} />
                    ) : (
                      <XCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#ef4444' }} />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {Object.entries(q.options || {}).map(([key, value]) => {
                      let bgColor = "#fff";
                      let borderColor = "#000";
                      let textColor = "#18181b";

                      if (key === q.correctAnswer) {
                        bgColor = "#d1fae5";
                        borderColor = "#34d399";
                        textColor = "#065f46";
                      } else if (key === userAnswer && !isCorrect) {
                        bgColor = "#fee2e2";
                        borderColor = "#ef4444";
                        textColor = "#991b1b";
                      }

                      return (
                        <div
                          key={key}
                          className="p-3 border-2 font-bold shadow-neo-sm"
                          style={{ backgroundColor: bgColor, borderColor: borderColor, color: textColor }}
                        >
                          <span className="mr-2">{key}:</span>
                          {value}
                          {key === q.correctAnswer && (
                            <span className="ml-2 text-xs" style={{ color: '#065f46' }}>✓ Correct</span>
                          )}
                          {key === userAnswer && !isCorrect && (
                            <span className="ml-2 text-xs" style={{ color: '#991b1b' }}>✗ Your Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-4 p-4 border-2 border-black shadow-neo-sm" style={{ backgroundColor: '#f9fafb' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: '#18181b' }}>Explanation:</p>
                      <p className="text-sm font-medium" style={{ color: '#4b5563' }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-center gap-4 pt-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-8 py-3 border-3 border-black shadow-neo font-bold transition-all hover:-translate-y-1 hover:shadow-neo-hover"
                style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
              >
                <RotateCcw className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizPage;

