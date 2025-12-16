import React,{useContext, useState} from 'react'
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import { validateEmail } from '../../utils/helper';
import Button from '../../components/Button';
import { UserContext } from '../../context/userContext';
import uploadImage from "../../utils/uploadImage";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const SignUp = ({setCurrentPage}) => {
  const[profilePic,setProfilePic]=useState(null);
  const [fullName,setFullName]=useState("");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[error,setError]=useState(null);

  const {updateUser}=useContext(UserContext)
  const navigate=useNavigate()

  const handleSignUp=async(e)=>{
    e.preventDefault();

    let profileImageUrl=""

    if(!fullName){
      setError("please enter full name");
      return;
    }

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

      if(profilePic){
        const imgUploadRes=await uploadImage(profilePic);
        profileImageUrl=imgUploadRes.imageUrl || "";
      }

      const response=await axiosInstance.post(API_PATHS.AUTH.REGISTER,{
        name:fullName,
        email,
        password,
        profileImageUrl,
      });

       const { token } = response.data;
       if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        navigate("/dashboard");}
    }catch(error){
      if(error.response && error.response.data.message){
        setError(error.response.data.message);
      }else{
        setError("Something went wrong. Please try again.")
      }
    }
  };
  return <div className='w-[90vw] md:w-[33vw] p-7 flex flex-col justify-center bg-white border-3 border-black shadow-neo'>
    <h3 className='text-2xl font-black mb-2' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create an Account</h3>
    <p className='text-sm text-gray-700 mb-6 font-medium'>
      join us today by entering your details below
    </p>

    <form onSubmit={handleSignUp}>

      <ProfilePhotoSelector image={profilePic} setImage={setProfilePic}/>
      <div className='grid grid-cols-1 md:grid-cols-1 gap-2'>
      <Input 
      value={fullName}
      onChange={({target}) => setFullName(target.value)} 
      label="Full Name"
      placeholder="John"
      type="text"/>

      <Input
      value={email}
      onChange={({target})=>setEmail(target.value)}
      label="Email Address"
      placeholder="john@example.com"
      type="text"/>

      <Input
       value={password}
      onChange={({target})=>setPassword(target.value)}
      label="Password"
      placeholder="Min 8 Characters"
      type="password"
      />
      </div>

{error && (
  <div className='bg-red-50 border-2 border-red-500 text-red-700 text-xs p-3 mb-4 font-bold shadow-neo-sm'>
    {error}
  </div>
)}
<Button type="submit" className="w-full justify-center mt-4">
  Sign up
</Button>

<p className='text-sm text-gray-800 mt-4 font-medium'>
  Already have an account?{" "}
  <button
  type='button'
  className='font-bold text-primary underline cursor-pointer hover:text-primary/80'
  onClick={()=>{
    setCurrentPage("login");
  }}
  style={{ color: '#8b5cf6' }}>
    Login
  </button>
</p>
    </form>
  </div>

};

export default SignUp
