import React, { useEffect, useRef, useState } from "react";

const VoiceRecorder = ({
  onLiveTranscript = () => {},
  onFinish = () => {},
  isProcessing = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalResult = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalResult += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) onLiveTranscript(interim);
      if (finalResult) onFinish(finalResult);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support voice input.");
      return;
    }

    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center mt-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`rounded-full h-16 w-16 flex items-center justify-center text-white 
          transition-all shadow-lg
          ${isRecording ? "bg-red-600" : "bg-purple-600 hover:bg-purple-700"}
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        🎤
      </button>

      <div className="text-xs text-gray-400 mt-2">
        {isProcessing
          ? "Processing..."
          : isRecording
          ? "Listening..."
          : "Tap mic to answer"}
      </div>
    </div>
  );
};

export default VoiceRecorder;