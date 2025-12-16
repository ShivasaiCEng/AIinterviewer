import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ResultsDashboard from "../../components/ResultsDashboard";

const InterviewResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // If user refreshes results page and state is lost, send them back
  if (!state || !state.resultsData) {
    navigate(`/interviewapp/${sessionId}`);
    return null;
  }

  const { resultsData } = state;

  return (
    <DashboardLayout>
      <ResultsDashboard
        data={resultsData}
        onReset={() => navigate("/dashboard")}
      />
    </DashboardLayout>
  );
};

export default InterviewResults;


