import React from "react";
import { getInitials } from "../../utils/helper";
import { LuTrash2 } from "react-icons/lu";

const SummaryCard = ({
    colors,
    role,
    topicsToFocus,
    experience,
    questions,
    description,
    lastUpdated,
        
     onSelect,
    onDelete,
}) => {
    return <div 
    className="bg-white border-3 border-black overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-neo-hover transition-all duration-300 relative group shadow-neo"
    onClick={onSelect}
    >
        <div
        className="p-6 cursor-pointer relative"
    style={{
        background: colors.bgcolor,
    }}>
        <div className="flex items-start justify-between">
            <div className="flex-grow">
                <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{role}</h2>
                <p className="text-base font-medium" style={{ color: '#18181b' }}>
                    {topicsToFocus}
                </p>
            </div>
        </div>

    <button 
    className="hidden group-hover:flex items-center gap-2 text-xs text-white font-bold bg-red-500 px-3 py-1 border-2 border-black shadow-neo-sm cursor-pointer absolute top-4 right-4 transition-all"
    onClick={(e) => {
        e.stopPropagation();
        onDelete();
    }}
    >
        <LuTrash2 size={14} />
    </button>
    </div>
    <div className="px-6 pb-6 pt-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                Experience: {experience ==1 ? "Year" : "Years"} 
            </div>
            <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                {questions}Q&A
            </div>
            <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                Last Updated: {lastUpdated}
            </div> 
        </div>
        {description && (
            <p className="text-sm font-medium line-clamp-2" style={{ color: '#6b7280' }}>
                {description}
            </p>
        )}
    </div>
    </div>

};
 export default SummaryCard;
