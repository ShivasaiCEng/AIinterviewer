import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import { LuListCollapse } from "react-icons/lu";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import RoleInfoHeader from "./RoleInfoHeader";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import QuestionCard from "../../components/Cards/QuestionCard";

const InterviewApp = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateLoader, setIsUpdateLoader] = useState(false);

  // only show first 5 questions initially
  const [visibleCount, setVisibleCount] = useState(5);

  // store per-question voice evaluation results
  const [voiceAnswers, setVoiceAnswers] = useState({}); // { [questionId]: evaluationResponse }
  const [skippedQuestions, setSkippedQuestions] = useState({}); // { [questionId]: true }

  const fetchSessionDetailsById = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.SESSION.GET_ONE(sessionId));
      if (response.data && response.data.session) {
        setSessionData(response.data.session);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  useEffect(() => {
    if (sessionId) fetchSessionDetailsById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);


  const uploadMoreQuestions = async () => {
    // existing behavior: ask backend to generate more and add to session
    try {
      setIsUpdateLoader(true);
      const aiResp = await axiosInstance.post(API_PATHS.AI.GENERATE_QUESTIONS, {
        role: sessionData?.role,
        experience: sessionData?.experience,
        topicsToFocus: sessionData?.topicsToFocus,
        numberOfQuestions: 5, // generate 5 when Load More is clicked
      });

      const generatedQuestions = aiResp.data;
      if (generatedQuestions && generatedQuestions.length) {
        // add them to session
        await axiosInstance.post(API_PATHS.QUESTION.ADD_TO_SESSION, {
          sessionId,
          questions: generatedQuestions,
        });
        toast.success("Added More Q&A!!");
        fetchSessionDetailsById();
      } else {
        toast.error("No questions generated.");
      }
    } catch (error) {
      console.error("Error uploading more questions:", error);
    } finally {
      setIsUpdateLoader(false);
    }
  };

  // Called when a question's audio has been evaluated by the backend.
  // We store the result and grey out the mic for that question.
  const handleVoiceAnswer = (question, evaluation) => {
    // clear skipped flag if user finally answered
    setSkippedQuestions((prev) => {
      const copy = { ...prev };
      delete copy[question._id];
      return copy;
    });

    setVoiceAnswers((prev) => {
      return { ...prev, [question._id]: evaluation };
    });
  };

  const handleSkipQuestion = (question) => {
    setSkippedQuestions((prev) => ({
      ...prev,
      [question._id]: true,
    }));
    toast("Question skipped. You can answer it later or submit when ready.", {
      icon: "⚠️",
    });
  };

  const handleNextQuestion = (index) => {
    const nextId = `question-${index + 2}`; // current is 1-based
    const el = document.getElementById(nextId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Build results payload and navigate to the Results page
  const handleSubmitInterview = () => {
    const totalQuestions = sessionData?.questions?.length || 0;
    const answeredCount = Object.keys(voiceAnswers).length;

    if (!totalQuestions) {
      toast.error("No questions found for this session.");
      return;
    }

    if (answeredCount === 0) {
      toast.error("Please answer at least one question before submitting.");
      return;
    }

    if (answeredCount < totalQuestions) {
      const confirmed = window.confirm(
        "Not every question has been attempted. Do you still want to submit your answers?"
      );
      if (!confirmed) return;
    }

    const questionsForResults = sessionData.questions.map((q) => ({
      id: q._id,
      text: q.question,
      difficulty: q.difficulty || "easy",
      focusArea: q.topicsToFocus || "General",
      answer: q.answer || "", // Include answer so skipped questions can show correct answer
    }));

    const answersForResults = {};
    Object.entries(voiceAnswers).forEach(([qId, evalResp]) => {
      const rawScore = typeof evalResp.score === "number" ? evalResp.score : 0;
      const normalizedScore =
        rawScore > 5 ? rawScore : Math.max(0, Math.min(100, Math.round(rawScore * 20)));
      const question = sessionData.questions.find((q) => q._id === qId);
      answersForResults[qId] = {
        score: Math.max(0, Math.min(100, normalizedScore)),
        feedback: evalResp.explanation || evalResp.evaluation || "",
        evaluation: evalResp.evaluation || "Partially Correct",
        keyConceptsMentioned: evalResp.keyConceptsMentioned || [],
        missingConcepts: evalResp.missingConcepts || [],
        userAnswer: evalResp.userAnswer || evalResp.transcript || "",
        correctAnswer: question?.answer || evalResp.correctAnswer || "",
        categoryScores: evalResp.categoryScores || null,
        usedRealLifeExamples: evalResp.usedRealLifeExamples ?? false,
        interviewImpactFeedback: evalResp.interviewImpactFeedback || "",
      };
    });

    const resultsData = {
      topic: sessionData.role || sessionData.topicsToFocus || "Interview",
      questions: questionsForResults,
      answers: answersForResults,
      skippedQuestionIds: Object.keys(skippedQuestions || {}),
    };

    navigate(`/interview-results/${sessionId}`, { state: { resultsData } });
  };

  const handleLoadMoreVisible = () => {
    // simply increase the visible count by 5 if more questions exist
    const total = sessionData?.questions?.length || 0;
    const newCount = Math.min(total, visibleCount + 5);
    setVisibleCount(newCount);
    // if we reached the currently fetched total and want more permanently, user can click Upload More to fetch new ones
  };

  return (
    <DashboardLayout>
      <RoleInfoHeader
        role={sessionData?.role || ""}
        topicsToFocus={sessionData?.topicsToFocus || ""}
        experience={sessionData?.experience || "-"}
        questions={sessionData?.questions?.length || "-"}
        description={sessionData?.description || ""}
        lastUpdated={sessionData?.updatedAt ? moment(sessionData.updatedAt).format("Do MMM YYYY") : ""}
      />

      <div className="w-full pt-4 pb-8 px-4 md:px-6" style={{ backgroundColor: '#fffdf5', minHeight: '100vh' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>Interview Q & A</h2>

          <div className="flex flex-col items-center">
            <div className="w-full max-w-3xl">
              <AnimatePresence>
                {sessionData?.questions?.slice(0, visibleCount).map((q, idx) => (
                  <motion.div
                    id={`question-${idx + 1}`}
                    key={q._id || idx}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                    layout
                    className="w-full"
                  >
                    <QuestionCard
                      question={q.question}
                      questionId={q._id}
                      correctAnswer={q.answer}
                      index={idx}
                      totalCount={sessionData.questions.length}
                      difficulty={q.difficulty || "easy"}
                      isAnswered={Boolean(voiceAnswers[q._id])}
                      isSkipped={Boolean(skippedQuestions[q._id])}
                      onVoiceAnswer={(evaluation) => handleVoiceAnswer(q, evaluation)}
                      onSkip={() => handleSkipQuestion(q)}
                      onNext={() => handleNextQuestion(idx)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load more visible (client-side) + Submit */}
              <div className="flex flex-wrap items-center justify-center mt-6 gap-3">
                <div>
                  {visibleCount < (sessionData?.questions?.length || 0) ? (
                    <button
                      onClick={handleLoadMoreVisible}
                      className="flex items-center gap-3 text-sm font-bold border-3 border-black px-5 py-2 shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-hover"
                      style={{ backgroundColor: '#fff', color: '#18181b' }}
                    >
                      <LuListCollapse /> Show 5 More
                    </button>
                  ) : (
                    <button
                      onClick={uploadMoreQuestions}
                      disabled={isUpdateLoader}
                      className="flex items-center gap-3 text-sm font-bold border-3 border-black px-5 py-2 shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-hover disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#fff', color: '#18181b' }}
                    >
                      {isUpdateLoader ? <SpinnerLoader /> : <LuListCollapse />}
                      <span>{isUpdateLoader ? "Adding..." : "Load More Questions"}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSubmitInterview}
                  disabled={
                    !sessionData ||
                    (sessionData.questions?.length || 0) === 0 ||
                    Object.keys(voiceAnswers).length === 0
                  }
                  className="flex items-center gap-3 text-sm font-bold border-3 border-black px-5 py-2 shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-hover disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                >
                  Submit Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewApp;