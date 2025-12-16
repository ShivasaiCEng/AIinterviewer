import React, { useState } from "react";
import { BrainCircuit, ArrowRight, Loader2 } from "lucide-react";

const SUGGESTIONS = ["React", "Node.js", "Python", "System Design", "CSS", "SQL"];

const TopicSelector = ({ onStart, isLoading }) => {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) onStart(topic);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-6">
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-full mb-4">
          <BrainCircuit className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
          TechVoice Interviewer
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto">
          Master your technical interview skills. Speak your answers, get AI-powered feedback, and visualize your growth.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 relative">
        <div className="relative group">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a tech topic (e.g., React Hooks)"
            className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 px-6 py-4 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white p-3 rounded-lg transition-all duration-200 flex items-center justify-center aspect-square"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTopic(s)}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-sm text-slate-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default TopicSelector;