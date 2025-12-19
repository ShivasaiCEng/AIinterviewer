
PrepAI is an AI-powered interview preparation web application designed to help users practice and improve their interview skills using live mock interview simulations and instant feedback. It integrates AI to simulate realistic interview scenarios, making the preparation process smarter, personalized, and effective.

**Demo video**: https://youtu.be/n6lIzUERQ_o

**Live Demo**: https://a-iinterviewer-one.vercel.app/
 
**GitHub**

**Features**

**AI-Driven Interview Practice**
Simulates real interview scenarios using AI question generation. You can practice common questions tailored to roles and topics.

**Instant Response Evaluation**
Receive instant feedback (accuracy, confidence, suggestions) after answering each question to improve your performance.

**React + Vite Frontend**
Built with React and Vite for fast development and excellent user experience.

 **Live Demo & Video Showcase**
A live working deployment and a demo walkthrough video are provided to show how the product works. 
GitHub

**Tech Stack**
 React — UI
 Vite — Build tooling
 JavaScript / CSS / HTML — Core application
 AI service — OpenAI, Gemini
 Backend — MongoDB/Express/Node.js

**Project Structure (Example)**
```
PrepAI/
│
├── backend/                      # Backend (Node.js + Express)
│   ├── config/                   # Database & app configuration
│   ├── controllers/              # Request handling logic
│   ├── middlewares/              # Custom middlewares (auth, error handling)
│   ├── models/                   # Mongoose schemas / DB models
│   ├── routes/                   # API route definitions
│   ├── uploads/                  # Uploaded audio/files
│   ├── utils/                    # Utility/helper functions
│   ├── node_modules/             # Backend dependencies
│   ├── .env                      # Environment variables
│   ├── .gitignore                # Git ignore rules
│   ├── package.json              # Backend dependencies & scripts
│   ├── package-lock.json         # Dependency lock file
│   └── server.js                 # Backend entry point
│
├── frontend/
│   └── interviewerapp/           # Frontend (React + Vite)
│       ├── public/               # Static assets
│       ├── src/                  # React source code
│       ├── node_modules/         # Frontend dependencies
│       ├── .gitignore            # Git ignore rules
│       ├── eslint.config.js      # ESLint configuration
│       ├── index.html            # HTML entry file
│       ├── package.json          # Frontend dependencies & scripts
│       ├── package-lock.json     # Dependency lock file
│       ├── tailwind.config.js    # Tailwind CSS configuration
│       ├── vite.config.js        # Vite configuration
│       └── README.md             # Frontend-specific README
│
└── package-lock.json             # Root lock file (if applicable) 
 ```


You can update this to include actual folders you have in your project.

**Installation (Local Setup)**

To run PrepAI on your machine:

**Clone the repo**

git clone https://github.com/madugushivakumar/PrepAI.git
cd PrepAI


**Install dependencies**

npm install


**Run the development server**

npm run dev


**Build the app for production**

npm run build

**How It Helps Users**

PrepAI provides a single platform where job seekers can practice interviews without juggling between multiple resources. It brings personalized question practice, performance feedback, and real-world readiness all in one place. 
GitHub

You can expand this section later with screenshots, features like resume checkers, analytics, interviewer voice mode, or mobile support depending on how your app evolves.

**Contribution**

Contributions are welcome!
If you’d like to add features, fix bugs, or help improve documentation:

Fork the repository

Create a feature branch

Submit a pull request
