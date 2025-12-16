import React from "react";
import { LuFileText, LuPenTool } from "react-icons/lu";

const SessionModeChoice = ({ onSelectManual, onSelectAutomatic }) => {
  return (
    <div className="w-[90vw] md:w-[500px] p-8 flex flex-col items-center justify-center bg-white border-3 border-black shadow-neo">
      <h3 className="text-2xl font-black mb-2 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Choose Your Method
      </h3>
      <p className="text-sm text-gray-700 mb-8 text-center font-medium">
        How would you like to create your interview session?
      </p>
      
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Manual Option */}
        <button
          onClick={onSelectManual}
          className="flex-1 p-6 bg-white border-3 border-black shadow-neo hover:-translate-y-1 hover:shadow-neo-hover transition-all flex flex-col items-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center border-3 border-black group-hover:bg-purple-200 transition-colors">
            <LuPenTool className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Manual Entry
          </h4>
          <p className="text-xs text-gray-600 text-center">
            Fill out the form fields yourself
          </p>
        </button>

        {/* Automatic Option */}
        <button
          onClick={onSelectAutomatic}
          className="flex-1 p-6 bg-white border-3 border-black shadow-neo hover:-translate-y-1 hover:shadow-neo-hover transition-all flex flex-col items-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-3 border-black group-hover:bg-blue-200 transition-colors">
            <LuFileText className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Automatic
          </h4>
          <p className="text-xs text-gray-600 text-center">
            Upload your resume and we'll extract the details
          </p>
        </button>
      </div>
    </div>
  );
};

export default SessionModeChoice;

