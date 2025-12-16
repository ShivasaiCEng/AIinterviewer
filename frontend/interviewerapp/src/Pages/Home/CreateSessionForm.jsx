import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";
import Button from "../../components/Button";

const CreateSessionForm = ({ mode = 'manual' }) => {
    // Debug: log the mode
    useEffect(() => {
        console.log("CreateSessionForm mode:", mode);
    }, [mode]);
    const [formData, setFormData] = useState({
        role: "",
        experience: "",
        topicsToFocus: "",
        description: "",
        interviewType: "interview",
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoModeTriggered, setAutoModeTriggered] = useState(false);
    const navigate = useNavigate();
    const handleChange = (key,value) => {
        setFormData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    };

    const handleResumeChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setResumeFile(file);
        setIsParsingResume(true);
        setError(null);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("resume", file);

            const response = await axiosInstance.post(
                API_PATHS.AI.PARSE_RESUME,
                uploadFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 120000, // 2 minutes timeout for file processing
                }
            );

            setResumeData(response.data);
            
            // Auto-fill form fields (in automatic mode, always fill; in manual mode, only if empty)
            if (mode === 'automatic' || !formData.role) {
                if (response.data.extractedRole) {
                    handleChange("role", response.data.extractedRole);
                }
            }
            if (mode === 'automatic' || !formData.experience) {
                if (response.data.extractedExperience) {
                    handleChange("experience", response.data.extractedExperience);
                }
            }
            if (mode === 'automatic' || !formData.topicsToFocus) {
                if (response.data.extractedSkills?.length > 0) {
                    handleChange("topicsToFocus", response.data.extractedSkills.join(", "));
                }
            }
        } catch (error) {
            console.error("Error parsing resume:", error);
            console.error("Error response:", error.response?.data);
            
            // Extract detailed error message from backend
            let errorMessage = "Failed to parse resume.";
            
            if (error.response?.data) {
                const errorData = error.response.data;
                errorMessage = errorData.message || errorData.error || errorMessage;
                
                // Add additional details if available
                if (errorData.details) {
                    errorMessage += ` ${errorData.details}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            setResumeFile(null);
            setResumeData(null);
        } finally {
            setIsParsingResume(false);
        }
    };
    
    // Auto-trigger file input in automatic mode
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (mode === 'automatic' && !autoModeTriggered && fileInputRef.current) {
            setAutoModeTriggered(true);
            // Small delay to ensure the component is fully rendered
            setTimeout(() => {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }, 300);
        }
    }, [mode, autoModeTriggered]);
    const handleCreateSession = async (e) => {
        e.preventDefault();
        const {role, experience,topicsToFocus} = formData;
        if (!role || !experience || !topicsToFocus) {
            setError("Please fill all the required fields.");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            const aiResponse = await axiosInstance.post (
                API_PATHS.AI.GENERATE_QUESTIONS,
                {
                    role,
                    experience,
                    topicsToFocus,
                    numberOfQuestions: 10,
                    resumeData: resumeData,
                    interviewType: formData.interviewType,
                }
            );
            const generateQuestions = aiResponse.data;
             const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
                ...formData,
                questions:generateQuestions,
                resumeData: resumeData,
             });
             if (response.data?.session?._id) {
                navigate(`/interviewapp/${response.data?.session?._id}`);
             }


        } catch (error) {
            if (error.response && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    return  (
    <div className="w-[90vw] md:w-[35vw] p-7 flex flex-col justify-center bg-white border-3 border-black shadow-neo">
        <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {mode === 'automatic' ? 'Upload Your Resume' : 'Start a New Interview Journey'}
        </h3>
        <p className="text-sm text-gray-700 mb-6 font-medium">
            {mode === 'automatic' 
                ? 'Upload your resume and we\'ll automatically extract your details to create personalized interview questions!'
                : 'Fill out a few quick details and unlock your personalized set of interview questions!'
            }
        </p>
        <form onSubmit={handleCreateSession} className="flex flex-col gap-3">
            {/* Resume Upload - Show first in automatic mode */}
            {mode === 'automatic' && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-800">
                        Upload Your Resume <span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,image/*"
                        onChange={handleResumeChange}
                        className="w-full px-4 py-3 border-3 border-black bg-white font-bold shadow-neo-sm focus:outline-none focus:shadow-neo transition-all file:mr-4 file:py-2 file:px-4 file:border-3 file:border-black file:bg-white file:font-bold file:cursor-pointer"
                    />
                    {isParsingResume && (
                        <div className="text-xs text-blue-600 bg-blue-50 border-2 border-blue-500 p-2 font-bold">
                            ⏳ Parsing resume and extracting your details...
                        </div>
                    )}
                    {resumeData && !isParsingResume && (
                        <div className="text-xs text-green-700 bg-green-50 border-2 border-green-500 p-2 font-bold">
                            ✓ Resume parsed successfully! Your details have been extracted below.
                        </div>
                    )}
                </div>
            )}

            <Input
            value={formData.role}
            onChange={({target }) => handleChange("role", target.value)}
            label="Target Role"
            placeholder="(e.g., Frontend Developer, UI/UX Designer, etc.)"
            type="text"
            disabled={mode === 'automatic' && isParsingResume}
            />
            
             <Input
            value={formData.experience}
            onChange={({target }) => handleChange("experience", target.value)}
            label="Year of Experience"
            placeholder="(e.g., 1 year, 3 years, 5+ years)"
            type="number"
            disabled={mode === 'automatic' && isParsingResume}
            />

             <Input
            value={formData.topicsToFocus}
            onChange={({target }) => handleChange("topicsToFocus", target.value)}
            label="Topics to Focus On"
            placeholder="(Comma- separated, e.g., React, Node.js, MongoDB)"
            type="text"
            disabled={mode === 'automatic' && isParsingResume}
            />

             <Input
            value={formData.description}
            onChange={({target }) => handleChange("description", target.value)}
            label="Description"
            placeholder="(Any specific goals or notes for this session)"
            type="text"
            disabled={mode === 'automatic' && isParsingResume}
            />

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-800">
                    Interview Type
                </label>
                <select
                    value={formData.interviewType}
                    onChange={(e) => handleChange("interviewType", e.target.value)}
                    className="w-full px-4 py-3 border-3 border-black bg-white font-bold shadow-neo-sm focus:outline-none focus:shadow-neo transition-all"
                    disabled={mode === 'automatic' && isParsingResume}
                >
                    <option value="interview">General Interview</option>
                    <option value="technical interview">Technical Interview</option>
                </select>
            </div>

            {/* Resume Upload - Show as optional in manual mode */}
            {mode === 'manual' && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-800">
                        Upload Resume (Optional)
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,image/*"
                        onChange={handleResumeChange}
                        className="w-full px-4 py-3 border-3 border-black bg-white font-bold shadow-neo-sm focus:outline-none focus:shadow-neo transition-all file:mr-4 file:py-2 file:px-4 file:border-3 file:border-black file:bg-white file:font-bold file:cursor-pointer"
                    />
                    {isParsingResume && (
                        <p className="text-xs text-gray-600">Parsing resume...</p>
                    )}
                    {resumeData && !isParsingResume && (
                        <div className="text-xs text-green-700 bg-green-50 border-2 border-green-500 p-2 font-bold">
                            ✓ Resume parsed successfully! Form fields auto-filled.
                        </div>
                    )}
                </div>
            )}
            
            {error && (
                <div className='bg-red-50 border-2 border-red-500 text-red-700 text-xs p-3 font-bold shadow-neo-sm'>
                    {error}
                </div>
            )}
            <Button
            type="submit"
            className="w-full justify-center mt-2"
            disabled={isLoading || (mode === 'automatic' && (!resumeData || isParsingResume))}
            isLoading={isLoading || (mode === 'automatic' && isParsingResume)}>
                {mode === 'automatic' && isParsingResume 
                    ? 'Parsing Resume...' 
                    : mode === 'automatic' && !resumeData
                    ? 'Please Upload Resume First'
                    : 'Create Session'
                }
            </Button>
              
        </form>
    </div>
    )
};
export default CreateSessionForm;
