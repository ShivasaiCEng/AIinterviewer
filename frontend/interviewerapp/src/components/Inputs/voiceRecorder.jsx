import React from "react";

/**
 
VoiceRecorder: optional alternative that uses browser SpeechRecognition (no audio file).
We primarily use AudioRecorder (MediaRecorder + Blob upload) in InterviewSession.*/
const VoiceRecorder = ({ onStop }) => {
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onStop(text);
    };
    recognition.onerror = () => {
      alert("Speech recognition error");
    };
    recognition.start();
  };

  return <button onClick={startListening} className="px-3 py-1 bg-rose-500 text-white rounded">Speak Answer</button>;
};

export default VoiceRecorder;