import React from "react";

const RoleInfoHeader = ({
    role,
    topicsToFocus,
    experience,
    questions,
    description,
    lastUpdated,
}) => {
    return (
        <div className="bg-white border-b-3 border-black relative" style={{ backgroundColor: '#fffdf5' }}>
            <div className="container mx-auto px-6 md:px-6">
                <div className="h-[200px] flex flex-col justify-center relative z-10">
                    <div className="flex items-start">
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#18181b' }}>{role}</h2>
                                    <p className="text-base font-medium" style={{ color: '#18181b' }}>
                                        {topicsToFocus}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                        Experience: {experience} {experience ==1? "Year" : "Years"}
                    </div>
                    <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                        {questions} Q&A
                    </div>
                    <div className="text-xs font-bold text-white px-4 py-2 rounded-full" style={{ backgroundColor: '#000' }}>
                        Last Updated: {lastUpdated}
                    </div>
                </div>
            </div>
            <div className="w-[40vw] md:w-[30vw] h-[200px] flex items-center justify-center overflow-hidden absolute top-0 right-0 pointer-events-none">
                <div className="w-16 h-16 bg-lime-400 blur-[65px] animate-blob opacity-30" />
                <div className="w-16 h-16 bg-teal-400 blur-[65px] animate-blob delay-500 opacity-30" />
                <div className="w-16 h-16 bg-cyan-300 blur-[45px] animate-blob delay-700 opacity-30" />
                <div className="w-16 h-16 bg-fuchsia-400 blur-[45px] animate-blob delay-1000 opacity-30" />
            </div>
        </div>
    );
};
export default RoleInfoHeader;
