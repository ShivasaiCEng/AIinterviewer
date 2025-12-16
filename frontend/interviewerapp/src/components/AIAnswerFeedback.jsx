import React from "react";

const AIAnswerFeedback = ({ userAnswer = "", evaluation = "", correctAnswer = "", missingConcepts = [] }) => {
  const displayEvaluation =
    evaluation === "Wrong" ? "Needs Improvement" : "Good Attempt";
  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="bg-[#0f1724] text-gray-200 rounded-2xl p-6 border border-gray-800 shadow-xl">

        {/* Header */}
        <div className="mb-4">
          <h4 className="text-sm text-gray-400 uppercase">AI Feedback</h4>
          <h3 className="text-xl font-semibold mt-1">
            {displayEvaluation || "Evaluation Pending"}
          </h3>
        </div>

        {/* User Answer */}
        <div className="mt-3">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-gray-200">Your Answer:</span>{" "}
            {userAnswer || "—"}
          </p>
        </div>

        {/* Missed concepts, if any */}
        {missingConcepts.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm text-red-300 font-semibold mb-1">What you missed</h5>
            <div className="flex flex-wrap gap-2">
              {missingConcepts.map((c, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs text-red-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div className="mt-5">
          <h5 className="text-sm text-gray-400 font-semibold mb-2">Correct Answer</h5>

          <div className="bg-[#0b1220] border border-gray-800 rounded-md p-4 text-gray-200 shadow-inner">
            <div className="whitespace-pre-wrap text-sm">{correctAnswer || "—"}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAnswerFeedback;