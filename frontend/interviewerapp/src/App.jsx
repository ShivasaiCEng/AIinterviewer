import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import UserProvider from "./context/userContext";

/* Pages */
import LandingPage from "./Pages/InterviewerApp/LandingPage";
import Dashboard from "./Pages/Home/Dashboard";
import InterviewApp from "./Pages/InterviewerApp/InterviewApp";
import InterviewResults from "./Pages/InterviewerApp/InterviewResults";
import QuizPage from "./Pages/InterviewerApp/QuizPage";

/* AI Interview App Components */
import TopicSelector from "./components/topicSelector";
import InterviewSession from "./components/InterviewSession";
import ResultsDashboard from "./components/ResultsDashboard";

/* Utils & Services */
import { AppState } from "./utils/appState";
import { Loader2 } from "lucide-react";
import { generateQuestions } from "./services/gemini";

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  /** Interview App States **/
  const [appState, setAppState] = useState(AppState.IDLE);
  const [interviewData, setInterviewData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  /** Start Interview **/
  const handleStartInterview = async (topic) => {
    setAppState(AppState.GENERATING_QUESTIONS);
    setErrorMsg(null);
    try {
      const questions = await generateQuestions(topic);
      setInterviewData({
        topic,
        questions,
        currentQuestionIndex: 0,
        answers: {},
      });
      setAppState(AppState.INTERVIEW_IN_PROGRESS);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate interview questions.");
      setAppState(AppState.IDLE);
    }
  };

  /** When Interview Finishes **/
  const handleInterviewComplete = (data) => {
    setInterviewData(data);
    setAppState(AppState.SHOW_SUMMARY);
  };

  /** Reset Everything **/
  const handleReset = () => {
    setInterviewData(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  /* Landing Page */
  if (isLandingPage) {
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
        <Toaster toastOptions={{ style: { fontSize: "13px" } }} />
      </>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#fffdf5", color: "#18181b" }}>
      <main className="relative z-10 w-full">
        <Routes>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Interview Session */}
          <Route path="/interviewapp/:sessionId" element={<InterviewApp />} />

          {/* Interview Results */}
          <Route path="/interview-results/:sessionId" element={<InterviewResults />} />

          {/* Quiz */}
          <Route path="/quiz" element={<QuizPage />} />

          {/* AI Interview Flow */}
          <Route
            path="/ai-interview"
            element={
              <>
                {appState === AppState.IDLE && (
                  <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#fffdf5" }}>
                    <TopicSelector onStart={handleStartInterview} isLoading={false} />
                    {errorMsg && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg border-2 border-red-500 bg-red-100 text-red-800">
                        {errorMsg}
                      </div>
                    )}
                  </div>
                )}

                {appState === AppState.GENERATING_QUESTIONS && (
                  <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                    <p className="text-lg animate-pulse text-gray-500">
                      Generating interview questions...
                    </p>
                  </div>
                )}

                {appState === AppState.INTERVIEW_IN_PROGRESS && interviewData && (
                  <InterviewSession
                    questions={interviewData.questions}
                    topic={interviewData.topic}
                    onComplete={handleInterviewComplete}
                  />
                )}

                {appState === AppState.SHOW_SUMMARY && interviewData && (
                  <ResultsDashboard data={interviewData} onReset={handleReset} />
                )}
              </>
            }
          />
        </Routes>
      </main>

      <Toaster toastOptions={{ style: { fontSize: "13px" } }} />
    </div>
  );
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};

export default App;
