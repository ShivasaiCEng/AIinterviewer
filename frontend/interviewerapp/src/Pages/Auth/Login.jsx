import React, { useState,createContext,useContext } from 'react'
import { useNavigate } from 'react-router-dom';  
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import Button from '../../components/Button';
import { UserContext } from '../../context/userContext';

const Login = ({ setCurrentPage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const {updateUser}=useContext(UserContext)
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // login logic here

    if(!validateEmail(email)){
      setError("please enter a valid email address");
      return;
    }
    if(!password){
      setError("Please enter the password");
      return;
    }
    setError("");
    try{
      const response=await axiosInstance.post(API_PATHS.AUTH.LOGIN,{
        email,
        password,
      });
      const{token}=response.data;

      if(token){
        localStorage.setItem("token",token);
        updateUser(response.data)
        navigate("/dashboard");
      }
    }catch(error){
      if(error.response && error.response.data.message){
        setError(error.response.data.message);
      }else{
        setError("Something went wrong. Please try again.")
      }
    }
  };

  return (
    <div className='w-[90vw] md:w-[33vw] p-7 flex flex-col justify-center bg-white border-3 border-black shadow-neo'>
      <h3 className='text-2xl font-black mb-2' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Welcome Back</h3>
      <p className='text-sm text-gray-700 mb-6 font-medium'>
        Please enter your details to log in 
      </p>

      <form onSubmit={handleLogin}>   
        <Input
          value={email}
          onChange={({target}) => setEmail(target.value)}
          label="Email Address"
          placeholder="john@example.com"
          type="text"
        />

        <Input 
          value={password}
          onChange={({target}) => setPassword(target.value)}
          label="Password"
          placeholder="Min 8 characters"
          type="password"
        />

        {error && (
          <div className='bg-red-50 border-2 border-red-500 text-red-700 text-xs p-3 mb-4 font-bold shadow-neo-sm'>
            {error}
          </div>
        )}

        <Button type="submit" className="w-full justify-center mt-4">LOGIN</Button>

        <p className='text-sm text-gray-800 mt-4 font-medium'>
          Don't have an account?{" "}
          <button
            type="button"
            className='font-bold text-primary underline cursor-pointer hover:text-primary/80'
            onClick={() => setCurrentPage("signup")}
            style={{ color: '#8b5cf6' }}
          >
            SignUp
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
