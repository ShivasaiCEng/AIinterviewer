import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import UserProvider from "./context/userContext";
import LandingPage from "./Pages/InterviewerApp/LandingPage";
import Dashboard from "./Pages/Home/Dashboard";
import InterviewApp from "./Pages/InterviewerApp/interviewApp";
import InterviewResults from "./Pages/InterviewerApp/InterviewResults";
import QuizPage from "./Pages/InterviewerApp/QuizPage";
/* AI Interview App Imports */
import TopicSelector from "./components/TopicSelector";
import InterviewSession from "./components/InterviewSession";
import ResultsDashboard from "./components/ResultsDashboard";
import { AppState } from "./utils/appState";
import { Loader2 } from "lucide-react";
import { generateQuestions } from "./services/gemini";

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
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
  
  if (isLandingPage) {
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
        <Toaster
          toastOptions={{
            className: "",
            style: { fontSize: "13px" },
          }}
        />
      </>
    );
  }
  
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#fffdf5', color: '#18181b' }}>
          <main className="relative z-10 w-full">
            <Routes>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Interview App Session Page */}
              <Route path="/interviewapp/:sessionId" element={<InterviewApp />} />
              {/* Interview results summary for a session */}
              <Route path="/interview-results/:sessionId" element={<InterviewResults />} />
          {/* Quiz page for missed concepts */}
          <Route path="/quiz" element={<QuizPage />} />
              {/* AI Interviewer Flow (Topic → Questions → Summary) */}
              <Route
                path="/ai-interview"
                element={
                  <>
                    {appState === AppState.IDLE && (
                  <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fffdf5' }}>
                        <TopicSelector onStart={handleStartInterview} isLoading={false} />
                        {errorMsg && (
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-neo border-3 border-black" style={{ backgroundColor: '#fee2e2', borderColor: '#ef4444', color: '#991b1b' }}>
                            {errorMsg}
                          </div>
                        )}
                      </div>
                    )}
                    {appState === AppState.GENERATING_QUESTIONS && (
                  <div className="flex flex-col items-center justify-center min-h-screen space-y-4" style={{ backgroundColor: '#fffdf5' }}>
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#8b5cf6' }} />
                    <p className="text-lg animate-pulse" style={{ color: '#6b7280' }}>
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

        {/* Toast Notifications */}
        <Toaster
          toastOptions={{
            className: "",
            style: { fontSize: "13px" },
          }}
        />
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
