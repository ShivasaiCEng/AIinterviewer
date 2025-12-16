import React from "react";

const AIAnswerFeedback = ({
  userAnswer,
  evaluation,
  explanation,
  correctAnswer,
  score,
  categoryScores,
  usedRealLifeExamples,
  missingConcepts = [],
}) => {
  const readableScore = typeof score === "number" ? Math.max(0, Math.min(100, Math.round(score))) : null;
  const displayEvaluation =
    evaluation === "Wrong" ? "Needs Improvement" : "Good Attempt";
  const breakdownEntries = categoryScores
    ? [
        { label: "Content Accuracy", value: categoryScores.contentAccuracy, max: 40 },
        { label: "Clarity & Structure", value: categoryScores.clarityStructure, max: 20 },
        { label: "Depth of Explanation", value: categoryScores.depth, max: 20 },
        { label: "Examples / Use Cases", value: categoryScores.examples, max: 10 },
        { label: "Communication & Confidence", value: categoryScores.communication, max: 10 },
      ].filter((entry) => typeof entry.value === "number")
    : [];

  return (
    <div className="mt-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
      <h4 className="font-semibold text-lg mb-2">AI Feedback</h4>
      <p><strong>Your Answer:</strong> {userAnswer}</p>
      <p className="mt-2"><strong>Evaluation:</strong> {displayEvaluation}</p>
      <p className="mt-2">
        <strong>Score:</strong>{" "}
        {readableScore !== null ? `${readableScore}/100` : "—"}
      </p>
      {breakdownEntries.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-slate-400 font-semibold">What the AI looked at</p>
          {breakdownEntries.map(({ label, value, max }) => (
            <div key={label} className="text-xs text-slate-300 flex justify-between">
              <span>{label}</span>
              <span>{value}/{max}</span>
            </div>
          ))}
        </div>
      )}
      {typeof usedRealLifeExamples === "boolean" && (
        <p className="mt-2 text-xs text-slate-400">
          Example used: {usedRealLifeExamples ? "Yes – your example helped your score." : "No specific example detected."}
        </p>
      )}
      {categoryScores && (
        <div className="mt-3 text-xs text-slate-300" />
      )}
      {Array.isArray(missingConcepts) && missingConcepts.length > 0 && (
        <div className="mt-3 text-sm text-slate-200">
          <span className="font-semibold text-red-400">What you missed: </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingConcepts.map((c, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/40 text-xs text-red-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2"><strong>Explanation:</strong> {explanation}</p>
      <hr className="my-3 border-slate-800" />
      <p className="text-slate-400"><strong>Correct Answer:</strong> {correctAnswer}</p>
    </div>
  );
};

export default AIAnswerFeedback;