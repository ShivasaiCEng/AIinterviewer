export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",  // ✅ removed extra /api
    GET_PROFILE: "/api/auth/profile",
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  AI: {
    GENERATE_QUESTIONS: "/api/ai/generate-question",
    GENERATE_EXPLANATION: "/api/ai/generate-explanation",
    EVALUATE_ANSWER: "/api/voice/evaluate",
    ANALYZE_RESULTS: "/api/ai/analyze-results",
    GENERATE_QUIZ: "/api/ai/generate-quiz",
    PARSE_RESUME: "/api/ai/parse-resume",
  },
  SESSION: {
    CREATE: "/api/sessions/create",
    GET_ALL: "/api/sessions/my-sessions",
    GET_ONE: (id) => `/api/sessions/${id}`,
    DELETE: (id) => `/api/sessions/${id}`,
  },
  QUESTION: {
    ADD_TO_SESSION: "/api/questions/add",
    PIN: (id) => `/api/questions/${id}/pin`,
    UPDATE_NOTE: (id) => `/api/questions/${id}/note`,
  },
};