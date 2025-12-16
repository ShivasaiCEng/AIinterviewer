// client/src/components/QuestionCard.jsx
import React, { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuMic } from "react-icons/lu";
import api from "../../services/api";
import Button from "../Button";

const QuestionCard = ({
  question,
  questionId,
  correctAnswer,
  onVoiceAnswer,
  index,
  totalCount,
  difficulty,
  isAnswered = false,
  isSkipped = false,
  onSkip,
  onNext,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [timer, setTimer] = useState(0);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);
  // Setup SpeechRecognition for live transcript (interim results)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not available in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
        if (event.results[i].isFinal) interim += " ";
      }
      setLiveTranscript(interim);
    };
    recognition.onerror = (e) => {
      console.warn("SpeechRecognition error:", e);
      // Only stop on critical errors, not temporary issues
      if (e.error === 'no-speech' || e.error === 'audio-capture') {
        // These are recoverable - don't stop
        return;
      }
      // For other errors, stop only if we're actually listening
      if (listening) {
        try { recognition.stop(); } catch {}
        setListening(false);
      }
    };
    // FIX: Restart recognition if it ends while we're still supposed to be listening
    recognition.onend = () => {
      // Only stop if we're not supposed to be listening anymore
      if (!listening) {
        return; // Already stopped intentionally
      }
      // If we're still supposed to be listening, restart it
      try {
        recognition.start();
      } catch (err) {
        // If restart fails (e.g., already started), just continue
        console.warn("Could not restart recognition:", err);
      }
    };
    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [listening]); // Add listening as dependency so onend can check current state
  // Start recording (MediaRecorder) and speech recognition for live transcript
  const startRecording = async () => {
    if (isAnswered || isSkipped) return; // prevent re-recording once answered or skipped
    setLiveTranscript("");
    setFinalTranscript("");
    setTimer(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        await uploadAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      try {
        recognitionRef.current && recognitionRef.current.start();
      } catch (srErr) {
        console.warn("SpeechRecognition start error:", srErr);
      }
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
      setListening(true);
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Please allow microphone access and try again.");
    }
  };
  const stopRecording = () => {
    try { mediaRecorderRef.current?.state !== "inactive" && mediaRecorderRef.current?.stop(); } catch (e) {}
    try { recognitionRef.current && recognitionRef.current.stop(); } catch (e) {}
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setListening(false);
  };
  // Upload audio to backend and handle response
  const uploadAudioBlob = async (blob) => {
    try {
      setProcessing(true);
      const filename = `answer-${questionId || index || Date.now()}.webm`;
      const resp = await api.evaluateVoice({
        audioBlob: blob,
        questionId,
        questionText: question,
        correctAnswer: correctAnswer || "",
        filename,
        browserTranscript: liveTranscript || finalTranscript || "",
      });
      // backend returns userAnswer/evaluation/score etc.
      const combinedUserAnswer =
        resp.userAnswer ||
        resp.transcript ||
        liveTranscript ||
        finalTranscript ||
        "";

      setFinalTranscript(combinedUserAnswer);
      setLiveTranscript("");
      setProcessing(false);

      // Enrich response with a guaranteed userAnswer so results page
      // can always show the transcribed text.
      if (onVoiceAnswer) {
        onVoiceAnswer({
          ...resp,
          userAnswer: combinedUserAnswer,
        });
      }
    } catch (err) {
      setProcessing(false);
      console.error("Upload/evaluate error:", err);
      // Show clear message.
      const msg = (err && err.message) ? err.message : "Failed to evaluate your answer. Try again.";
      alert(msg);
    }
  };
  return (
    <div className="w-full bg-white border-3 border-black mb-6 overflow-hidden py-6 px-6 shadow-neo" style={{ backgroundColor: '#fffdf5' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>QUESTION {index + 1} OF {totalCount}</span>
        {difficulty && (
          <div className="text-xs px-3 py-1 border-2 border-black rounded-full font-bold shadow-neo-sm" style={{ backgroundColor: '#34d399', color: '#065f46' }}>
            {difficulty.toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-6 border-3 border-black shadow-neo-sm" style={{ backgroundColor: '#fff' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="border-2 border-black text-xs px-3 py-1 font-bold shadow-neo-sm" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>Q{index + 1}</div>
            <div className="text-sm font-bold" style={{ color: '#8b5cf6' }}>Interview Question</div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded((s) => !s)} 
              className="border-2 border-black p-1 shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo"
              style={{ backgroundColor: '#fff', color: '#18181b' }}
            >
              <LuChevronDown className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
        <h3 className="text-2xl md:text-3xl font-black leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{question}</h3>
        
        {isExpanded && (
          <>
            <div className="border-3 border-black px-4 py-4 mb-6 shadow-neo-sm" style={{ backgroundColor: '#f9fafb' }}>
              <div className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: '#8b5cf6' }}>📄 LIVE TRANSCRIPT</div>
              <div className="h-20 overflow-y-auto text-sm break-words font-medium" style={{ color: '#18181b' }}>
                {processing ? (finalTranscript || "Processing...") : (liveTranscript.trim() || finalTranscript || (listening ? "Listening..." : "Start speaking to see transcript here"))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mt-4">
              <button
                onClick={listening ? stopRecording : startRecording}
                disabled={processing || isAnswered || isSkipped}
                className={`w-24 h-24 rounded-full flex items-center justify-center border-3 border-black transition-all duration-300 transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                  ${
                    isAnswered || isSkipped
                      ? "shadow-neo-sm opacity-70 cursor-not-allowed"
                      : listening
                      ? "shadow-neo animate-pulse"
                      : "shadow-neo hover:shadow-neo-hover"
                  }
                  ${processing ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{
                  backgroundColor: isAnswered || isSkipped 
                    ? '#9ca3af' 
                    : listening 
                    ? '#ef4444' 
                    : '#8b5cf6'
                }}
                title={
                  isAnswered
                    ? "Answer submitted"
                    : isSkipped
                    ? "Question skipped"
                    : listening
                    ? "Stop Recording"
                    : "Start Recording"
                }
              >
                <LuMic size={32} className="text-white" />
              </button>

              <div className="flex items-center gap-2 mt-3">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${
                      isAnswered || isSkipped
                        ? "h-2 opacity-40"
                        : listening
                        ? "h-6 opacity-100 animate-pulse"
                        : "h-2 opacity-40"
                    }`}
                    style={{ backgroundColor: listening ? '#ef4444' : '#9ca3af' }}
                  />
                ))}
              </div>

              <div className="text-xs font-bold mt-2" style={{ color: '#6b7280' }}>
                {listening ? `⏺ ${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}` : processing ? "Uploading & evaluating..." : ""}
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onSkip}
                  disabled={isAnswered || isSkipped}
                  className="text-xs px-3 py-1"
                >
                  Skip Question
                </Button>
                <Button
                  type="button"
                  onClick={onNext}
                  className="text-xs px-3 py-1"
                >
                  Next Question
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
