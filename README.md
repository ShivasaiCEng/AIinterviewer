
---

#  PrepAI

**PrepAI** is an AI-powered interview preparation web application designed to help users practice and improve their interview skills using  mock interview simulations and instant feedback. It integrates AI to simulate realistic interview experience, making the preparation process smarter, personalized, and effective. ([GitHub][1])

---

##  Demo & Links

*  **Live Website:** [https://a-iinterviewer-one.vercel.app/](https://a-iinterviewer-one.vercel.app/)
*  **Demo Video:** [https://youtu.be/n6lIzUERQ_o](https://youtu.be/n6lIzUERQ_o)
*  **GitHub Repository:** [https://github.com/ShivasaiCEng/PrepAI](https://github.com/ShivasaiCEng/PrepAI) ([GitHub][1])

---

##  Overview

* AI-driven interview question generation
* Real-time feedback and response evaluation
* Designed to improve confidence and readiness
* Built with modern frontend & backend stack ([GitHub][1])

---

##  Project Structure

```
PrepAI/
│
├── backend/                          # Backend API (Node.js + Express)
│   ├── config/                       # Database & environment configs
│   ├── controllers/                  # Business logic & handlers
│   ├── middlewares/                  # Middleware (auth, error handling)
│   ├── models/                       # DB models & schemas
│   ├── routes/                       # API route definitions
│   ├── uploads/                      # Uploaded files (if any)
│   ├── utils/                        # Helpers & utilities
│   ├── .env                         # Backend environment variables
│   ├── .gitignore
│   ├── package.json                  # Backend dependencies & scripts
│   └── server.js                     # Server entry file
│
├── frontend/                         # Frontend application (React + Vite)
│   └── interviewerapp/
│       ├── public/                   # Static assets
│       ├── src/                      # React source code
│       ├── .gitignore
│       ├── eslint.config.js
│       ├── index.html                # Root HTML
│       ├── package.json              # Frontend dependencies & scripts
│       ├── tailwind.config.js        # Tailwind CSS config
│       └── vite.config.js            # Vite config
│
├── API_USAGE_REVIEW.md               # API usage documentation
├── DEPLOYMENT.md                     # Deployment instructions
├── README.md                        # This file
└── package-lock.json                 # Lockfile
```

> This structure reflects the folders and files in your source repository. ([GitHub][1])

---

##  Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* A code editor (VS Code, etc.)

---

##  Installation

Clone the project:

```bash
git clone https://github.com/ShivasaiCEng/PrepAI.git
cd PrepAI
```

Install dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend/interviewerapp
npm install
```

---

##  Running the Application

### Start Development Server

```bash
npm run dev
```

This will run **both frontend and backend** (if configured) or use scripts in respective folders.

If separate:

#### Frontend

```bash
cd frontend/interviewerapp
npm run dev
```

#### Backend

```bash
cd backend
npm start
```

---

##  Features

*  **AI-Driven Interview Practice**
  Simulates real interview scenarios using AI for dynamic question generation. ([GitHub][1])

*  **Instant Feedback Evaluation**
  Provides instant performance evaluation and suggestions. ([GitHub][1])

*  **React + Vite Frontend**
  Fast, responsive user experience. ([GitHub][1])

* 🛠 **Backend API Support via Express**
  Handles interview session data and analytics. ([GitHub][1])

---

## 🛠 Tech Stack

**Frontend:** React, Vite, JavaScript, Tailwind CSS
**Backend:** Node.js, Express, MongoDB (optionally)
**AI:** OpenAI / Gemini (for question generation) ([GitHub][1])

---

##  Contribution

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "feat: your message"`)
4. Push (`git push origin feature-name`)
5. Open a Pull Request


[1]: https://github.com/ShivasaiCEng/PrepAI "GitHub - ShivasaiCEng/PrepAI: DEMO VIDEO : https://youtu.be/n6lIzUERQ_o"
