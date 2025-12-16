import React, { useState, useContext } from 'react'
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import Login from '../Auth/Login';
import SignUp from '../Auth/SignUp';
import Modal from '../../components/Modal';
import ProfileInfoCard from "../../components/Cards/ProfileInfoCard";
import Button from '../../components/Button';
import { Sparkles, Terminal, Mic, Award, Zap, Brain, MessageSquare, ArrowRight, BookOpen, Check, Star } from 'lucide-react';

const LandingPage = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [openAuthModal, setOpenAuthModal] = useState(false);
    const [currentPage, setCurrentPage] = useState("login");

    const handleStartSetup = () => {
        if (!user) {
    setOpenAuthModal(true);
        } else {
    navigate("/dashboard");
}
    };

  return (
    <>
            <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#fffdf5', color: '#18181b' }}>
                
                {/* Header */}
                <header className="sticky top-0 z-50" style={{ backgroundColor: '#fffdf5', borderBottom: '3px solid #000' }}>
                    <div className="max-w-6xl mx-auto px-6" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="bg-black text-white p-2" style={{ border: '2px solid #000', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
                                <Terminal size={20} />
                            </div>
                            <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#000' }}>
                                Prep<span style={{ color: '#8b5cf6', textDecoration: 'underline', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>AI</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <ProfileInfoCard />
                            ) : (
                                <Button variant="secondary" onClick={handleStartSetup} className="text-sm py-2 px-4">
                                    Start Practicing
                                </Button>
                            )}
                        </div>
            </div>
        </header>

                {/* Main Content */}
                <main className="flex-grow w-full">
                    
                    <div className="flex flex-col overflow-hidden">
                        
                        {/* Hero Section */}
                        <section className="relative px-6 py-24 md:py-36" style={{ borderBottom: '3px solid #000', background: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                            
                            {/* --- Animated Floating Elements (Left) --- */}
                            <div className="absolute top-24 left-[5%] xl:left-[10%] hidden lg:block z-0 animate-float">
                                <div className="bg-white p-4 shadow-neo transform -rotate-6" style={{ border: '3px solid #000' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-400 w-12 h-12 border-2 border-black flex items-center justify-center font-black text-xl shadow-sm">A+</div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                                            <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <span>Score</span>
                                        <span className="text-green-600">98/100</span>
                                    </div>
    </div>
    </div>

                            <div className="absolute bottom-20 left-[15%] hidden md:block animate-bounce opacity-80 delay-1000">
                                <div className="w-16 h-16 rounded-full shadow-neo-sm" style={{ backgroundColor: '#34d399', border: '3px solid #000' }}></div>
        </div>

                            {/* --- Animated Floating Elements (Right) --- */}
                            <div className="absolute top-32 right-[8%] xl:right-[15%] hidden lg:block z-0 animate-float delay-500">
                                <div className="px-6 py-4 shadow-neo transform rotate-3 relative" style={{ backgroundColor: '#fbbf24', border: '3px solid #000' }}>
                                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 border-2 border-black animate-pulse">LIVE</div>
                                    <div className="flex items-center gap-3 font-bold text-lg">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        Listening...
      </div>
    </div>
</div>

                            <div className="absolute bottom-40 right-[10%] hidden md:block animate-spin-slow opacity-60">
                                <div className="w-0 h-0 border-l-[25px] border-l-transparent border-b-[40px] border-b-primary border-r-[25px] border-r-transparent" style={{ borderBottomColor: '#8b5cf6' }}></div>
    </div>

                            {/* --- Main Content --- */}
                            <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
                                <div className="inline-block relative">
                                    <div className="absolute -top-6 -right-6 text-yellow-400 animate-spin-slow">
                                        <Star size={40} fill="currentColor" className="stroke-black stroke-2" />
                                    </div>
                                    <div className="bg-white px-6 py-2 font-bold shadow-neo-sm transform -rotate-1 animate-wiggle inline-flex items-center gap-2" style={{ border: '2px solid #000' }}>
                                        <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                                        <span>AI-Powered Interview Coach</span>
                                    </div>
                      </div>
                    
                                <h1 className="text-6xl md:text-8xl font-black text-black leading-[0.9] tracking-tight animate-slide-up delay-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    MASTER YOUR <br/>
                                    <span className="relative inline-block px-4 mx-2">
                                        <span className="absolute inset-0 transform -rotate-2 shadow-neo" style={{ backgroundColor: '#8b5cf6', border: '3px solid #000' }}></span>
                                        <span className="relative text-white">TALK</span>
                                    </span>
                                    GAME
                                </h1>
                                
                                <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto font-medium animate-slide-up delay-200 border-l-4 border-black pl-6 md:border-none md:pl-0 text-left md:text-center">
                                    Stop mumbling. Start impressing. Our AI listens to your voice, critiques your answers, and helps you land the job.
                                </p>
                                
                                <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center animate-slide-up delay-300">
                                    <Button onClick={handleStartSetup} className="text-xl px-12 py-5 hover:scale-105 transition-transform w-full md:w-auto shadow-neo border-3">
                                        Start Practicing
                                    </Button>
                                    <a href="#how-it-works" className="font-bold border-b-2 border-black pb-1 hover:text-primary hover:border-primary transition-colors cursor-pointer">
                                        See how it works ↓
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* How It Works */}
                        <section id="how-it-works" className="px-6 py-24 bg-white" style={{ borderBottom: '3px solid #000' }}>
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-5xl font-black mb-20 text-center animate-slide-up" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HOW IT WORKS</h2>
                                <div className="grid md:grid-cols-3 gap-12">
                                    {[
                                        { 
                                            title: "1. PICK A TOPIC", 
                                            desc: "Frontend, System Design, or even Biology. You choose the battlefield.",
                                            icon: <Zap size={32} className="text-black" />,
                                            color: "#fbbf24"
                                        },
                                        { 
                                            title: "2. SPEAK UP", 
                                            desc: "Answer with your voice. No typing needed. Real-time transcription included.",
                                            icon: <Mic size={32} className="text-black" />,
                                            color: "#34d399"
                                        },
                                        { 
                                            title: "3. GET ROASTED", 
                                            desc: "Receive instant, brutal, but helpful feedback on your clarity and accuracy.",
                                            icon: <Award size={32} className="text-black" />,
                                            color: "#8b5cf6"
                                        }
                                    ].map((step, i) => (
                                        <div key={i} className="relative bg-white p-8 shadow-neo hover:-translate-y-2 hover:shadow-neo-hover transition-all duration-300 group" style={{ border: '3px solid #000', animationDelay: `${i * 150}ms` }}>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 border-3 border-black flex items-center justify-center shadow-neo-sm transform transition-transform group-hover:rotate-12" style={{ backgroundColor: step.color }}>
                                                {step.icon}
                                            </div>
                                            <div className="mt-8 text-center">
                                                <h3 className="text-2xl font-black mb-4 uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.title}</h3>
                                                <p className="text-gray-700 font-medium leading-relaxed">{step.desc}</p>
                      </div>
                                 </div>
                        ))}
                        </div>
                        </div>
                        </section>

                        {/* Who is this for? */}
                        <section className="px-6 py-24 overflow-hidden" style={{ backgroundColor: '#fbbf24', borderBottom: '3px solid #000' }}>
                            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                                <div className="md:w-1/2 space-y-8 animate-slide-in-right relative z-10">
                                    <div className="bg-black text-white inline-block px-4 py-1 font-bold border-2 border-white transform -rotate-2 shadow-neo-sm">
                                        FOR EVERYONE
                                    </div>
                                    <h2 className="text-5xl font-black leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                        NOT JUST FOR <br/> CODERS.
                                    </h2>
                                    <p className="text-xl font-medium">
                                        Whether you are analyzing history, preparing for a PM role, or just want to sound smarter.
                                    </p>
                                    <div className="space-y-4">
                                        {[
                                            "Software Engineers (System Design)",
                                            "Product Managers (Strategy)",
                                            "Students (History, Science)",
                                            "Public Speaking Practice"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-white p-4 border-3 border-black shadow-neo-sm hover:translate-x-2 transition-transform duration-200">
                                                <div className="bg-primary text-white p-1 border-2 border-black rounded-full" style={{ backgroundColor: '#8b5cf6' }}>
                                                    <Check size={16} strokeWidth={4} />
                                                </div>
                                                <span className="font-bold text-lg">{item}</span>
                                            </div>
                                        ))}
                        </div>
                        </div>

                                {/* Floating Cards Graphic */}
                                <div className="md:w-1/2 relative h-96 w-full">
                                    <div className="absolute top-0 right-0 w-64 h-64 border-3 border-black z-0 opacity-10 rounded-full animate-blob" style={{ backgroundColor: '#000' }}></div>
                                    
                                    <div className="absolute top-10 right-10 bg-white text-black p-6 border-3 border-black shadow-neo transform rotate-3 hover:rotate-0 transition-transform duration-300 animate-float z-10 max-w-xs">
                                        <Brain size={48} className="mb-4" style={{ color: '#fbbf24', strokeWidth: '3px' }} />
                                        <div className="font-black text-2xl uppercase">Knowledge</div>
                                        <p className="mt-2 font-medium text-gray-600">Test your technical depth and accuracy.</p>
                                    </div>
                                    
                                    <div className="absolute bottom-10 left-10 text-white p-6 border-3 border-black shadow-neo transform -rotate-2 mt-8 hover:rotate-0 transition-transform duration-300 animate-float delay-500 z-20 max-w-xs" style={{ backgroundColor: '#8b5cf6' }}>
                                        <MessageSquare size={48} className="mb-4 text-white" style={{ strokeWidth: '3px' }} />
                                        <div className="font-black text-2xl uppercase">Clarity</div>
                                        <p className="mt-2 font-medium opacity-90">Improve how you structure and deliver answers.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section className="px-6 py-24" style={{ backgroundColor: '#fffdf5' }}>
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-5xl font-black mb-16 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FAQ</h2>
                                <div className="space-y-6">
                                    {[
                                        { q: "Is it really free?", a: "Yes! Use your own Gemini API key for unlimited practice." },
                                        { q: "Do you record me?", a: "No. Your audio is processed in real-time in the browser and never saved." },
                                        { q: "Can I practice specific frameworks?", a: "Absolutely. Just type 'Next.js' or 'AWS' in the specific topic field." }
                                    ].map((faq, i) => (
                                        <div key={i} className="bg-white border-3 border-black p-8 shadow-neo-sm hover:shadow-neo transition-shadow cursor-default group">
                                            <h3 className="font-black text-xl mb-3 flex items-start gap-3">
                                                <span className="bg-secondary text-black w-8 h-8 flex items-center justify-center border-2 border-black shadow-sm group-hover:rotate-12 transition-transform" style={{ backgroundColor: '#fbbf24' }}>?</span>
                                                {faq.q}
                                            </h3>
                                            <p className="text-gray-800 font-medium pl-11 text-lg">{faq.a}</p>
                                        </div>
                                    ))}
</div>
    </div>
                        </section>

                        {/* Footer */}
                        <footer className="bg-black text-white py-16 relative overflow-hidden" style={{ borderTop: '4px solid #8b5cf6' }}>
                            <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'linear-gradient(to right, #fbbf24, #8b5cf6, #34d399)' }}></div>
                            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                                <div className="text-center md:text-left">
                                    <div className="font-black text-3xl mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PrepAI</div>
                                    <p className="text-gray-400 font-medium">Level up your interview game.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="secondary" className="px-6 py-2 text-sm" onClick={handleStartSetup}>
                                        Try it out
                                    </Button>
                                </div>
                            </div>
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-20 opacity-10">
                                <Terminal size={200} />
                            </div>
                        </footer>
                    </div>
                </main>
            </div>

<Modal 
isOpen={openAuthModal}
                onClose={() => {
    setOpenAuthModal(false);
                    setCurrentPage("login");
}}
hideHeader
>
<div> 
                    {currentPage === "login" && (
                        <Login setCurrentPage={setCurrentPage} />
    )}
                    {currentPage === "signup" && (
                        <SignUp setCurrentPage={setCurrentPage} />
)}
</div>
</Modal>
</>
  );
};

export default LandingPage;
