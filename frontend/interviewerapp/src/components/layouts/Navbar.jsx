import React from 'react';
import ProfileInfoCard from '../Cards/ProfileInfoCard';
import { Link } from "react-router-dom";
import { Terminal } from 'lucide-react';

const Navbar = () => {
    return (
        <div className='h-20 sticky top-0 z-30 py-2.5 px-4 md:px-0 border-b-3 border-black' style={{ backgroundColor: '#fffdf5' }}>
            <div className='container mx-auto flex items-center justify-between gap-5'>
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer group">
                    <div className="bg-black text-white p-2 border-2 border-black shadow-neo-sm transform group-hover:rotate-12 transition-transform duration-300">
                        <Terminal size={20} />
                    </div>
                    <h2 className='text-2xl font-bold' style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#000' }}>
                        Prep<span style={{ color: '#8b5cf6', textDecoration: 'underline', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>AI</span>
                    </h2>
                </Link>
                <ProfileInfoCard />
            </div>
        </div>
    )
}
export default Navbar;
