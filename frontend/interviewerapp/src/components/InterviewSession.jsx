import React, { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import AIAnswerFeedback from "./layouts/AIAnswerFeedback";

/**
 * props:
 *  - questions: [{ id, text, answer, focusArea, difficulty }]
 *  - topic
 *  - onComplete(interviewData)
 */
const InterviewSession = ({ questions = [], topic = "", onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]); // store raw backend responses per question
  const [processing, setProcessing] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);

  if (!questions || questions.length === 0) {
    return <div className="p-8">No questions available.</div>;
  }

  const handleRecordingComplete = async (base64Audio, blob) => {
    try {
      setProcessing(true);
      const form = new FormData();
      form.append("audio", blob);
      form.append("correctAnswer", questions[current].answer || "");
      form.append("questionId", questions[current].id || `q-${current}`);
      form.append("questionText", questions[current].text || "");

      // call backend
      const res = await fetch("/api/voice/evaluate", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Evaluation failed");
      }

      const data = await res.json();
      // expected: { questionId, userAnswer, correctAnswer, evaluation, score, explanation, keyConceptsMentioned?, missingConcepts? }

      setResults((prev) => [...prev, data]);
      setLastFeedback(data);

      // move to next
      if (current + 1 === questions.length) {
        // build answers map for ResultsDashboard (map each question id -> EvaluationResult-like)
        const answersMap = {};
        results.concat([data]).forEach((r) => {
          const rawScore = typeof r.score === "number" ? r.score : 0;
          const normalizedScore =
            rawScore > 5 ? rawScore : Math.max(0, Math.min(100, Math.round(rawScore * 20)));
          answersMap[r.questionId] = {
            score: Math.max(0, Math.min(100, normalizedScore)),
            feedback: r.explanation || r.evaluation || "",
            keyConceptsMentioned: r.keyConceptsMentioned || [],
            missingConcepts: r.missingConcepts || [],
            isCoherent: r.isCoherent !== undefined ? r.isCoherent : true,
            categoryScores: r.categoryScores || null,
            usedRealLifeExamples: r.usedRealLifeExamples ?? false,
            interviewImpactFeedback: r.interviewImpactFeedback || "",
          };
        });

        onComplete({
          topic,
          questions,
          currentQuestionIndex: questions.length - 1,
          answers: answersMap,
        });
      } else {
        setCurrent((c) => c + 1);
      }
    } catch (err) {
      console.error("Evaluation failed", err);
      alert("Failed to evaluate the answer. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const total = questions.length;
  const q = questions[current];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interview: {topic}</h2>
        <div className="text-sm text-slate-400">Question {current + 1} / {total}</div>
      </div>

      <div className="bg-slate-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Question {current + 1}</h3>
        <p className="mt-2 text-slate-300">{q.text}</p>

        <div className="mt-6">
          <AudioRecorder isProcessing={processing} onRecordingComplete={handleRecordingComplete} />
        </div>

        <div className="mt-4 text-sm text-slate-400">
          After you stop recording, your answer will be evaluated and the next question will load automatically.
        </div>

        {/* show last feedback below the recorder */}
        {lastFeedback && (
          <div className="mt-6">
            <AIAnswerFeedback
              userAnswer={lastFeedback.userAnswer}
              evaluation={lastFeedback.evaluation}
              explanation={lastFeedback.explanation}
              correctAnswer={lastFeedback.correctAnswer}
              score={lastFeedback.score}
              categoryScores={lastFeedback.categoryScores}
              usedRealLifeExamples={lastFeedback.usedRealLifeExamples}
              missingConcepts={lastFeedback.missingConcepts || []}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSession;
