import React, {useState} from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({ value, onChange, label, placeholder, type }) => {
 const[showPassword,setShowPassword] =useState(false)

 const toggleShowPassword=()=>{
    setShowPassword(!showPassword);
 };
    return <div className="mb-4">
        <label className="text-sm font-bold text-black mb-2 block">{label}</label>
    <div className="w-full flex justify-between gap-3 text-sm text-black bg-gray-50 rounded px-4 py-3 border-3 border-black outline-none focus-within:bg-white focus-within:shadow-neo-sm transition-all">
        <input
        type={
            type=="password" ? (showPassword? "text":"password"):type
        }
        placeholder={placeholder}
        className="w-full bg-transparent outline-none font-medium"
        value={value}
        onChange={(e)=> onChange(e)}
        />
    {type === "password"&&(
        <>
        {showPassword ?(
            <FaRegEye
            size={22}
            className="cursor-pointer"
            style={{ color: '#8b5cf6' }}
            onClick={()=>toggleShowPassword()}
            />
        ):(
            <FaRegEyeSlash
            size={22}
            className="cursor-pointer text-gray-400"
            onClick={()=>toggleShowPassword()}
            />
        )}
        </>
        )}

    </div>
    </div>
};

export default Input;
