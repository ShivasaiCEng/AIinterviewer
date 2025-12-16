import React, { useState, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";
import { blobToBase64 } from "../utils/audioUtils";

const AudioRecorder = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    if (!canvasCtx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 99, 235)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      drawVisualizer();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);
        onRecordingComplete(base64, blob);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to answer questions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-full h-32 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {isRecording ? <canvas ref={canvasRef} width={600} height={128} className="w-full h-full" /> : (
          <div className="text-slate-600 flex flex-col items-center">
            <Mic className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm">Ready to record</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-slate-950/80 px-3 py-1 rounded-full text-xs text-red-400 border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>REC {formatTime(duration)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {isProcessing ? (
          <button disabled className="flex items-center space-x-2 bg-slate-700 text-slate-300 px-8 py-4 rounded-full font-semibold cursor-not-allowed">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing Answer...</span>
          </button>
        ) : !isRecording ? (
          <button onClick={startRecording} className="group relative flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg">
            <Mic className="w-7 h-7" />
            <span className="absolute -bottom-8 text-sm text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Start Answer</span>
          </button>
        ) : (
          <button onClick={stopRecording} className="group relative flex items-center justify-center w-16 h-16 bg-slate-800 hover:bg-slate-700 text-white border-2 border-red-500 rounded-full transition-all shadow-lg">
            <div className="w-6 h-6 bg-red-500 rounded-sm" />
            <span className="absolute -bottom-8 text-sm text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Stop & Submit</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;