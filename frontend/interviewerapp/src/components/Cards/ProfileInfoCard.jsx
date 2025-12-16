import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

// Default profile image (can replace with any URL or local image)
const DEFAULT_AVATAR =
  "https://www.gravatar.com/avatar/?d=mp&f=y"; // generic placeholder

const ProfileInfoCard = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <img
        src={user.profileImageUrl || DEFAULT_AVATAR} 
        alt="Profile"
        className="w-11 h-11 border-2 border-black rounded-full object-cover shadow-neo-sm"
      />
      <div>
        <div className="text-sm text-black font-bold leading-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {user.name || "Anonymous"}
        </div>
        <button
          className="text-sm font-bold cursor-pointer hover:underline"
          onClick={handleLogout}
          style={{ color: '#8b5cf6' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
