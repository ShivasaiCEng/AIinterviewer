# Deployment Guide

This guide will help you deploy the Interview App to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud like MongoDB Atlas)
- API keys:
  - Gemini API key (for transcription and concept explanations)
  - OpenAI/OpenRouter API key (for quiz generation, answer analysis, question generation, resume parsing)

## Backend Deployment

### 1. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=production

# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_KEY=your-openai-or-openrouter-api-key-here

# Optional: Override AI models
# GEMINI_MODEL=gemini-2.0-flash-lite
# OPENAI_MODEL=openai/gpt-4o-mini

# CORS Configuration (comma-separated list of allowed origins)
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start the Server

For production:
```bash
npm start
```

For development (with auto-reload):
```bash
npm run dev
```

## Frontend Deployment

### 1. Environment Variables

Create a `.env` file in the `frontend/interviewerapp/` directory:

```env
# API Configuration
# Set this to your backend API URL
VITE_API_URL=https://api.yourdomain.com
# For local development: http://localhost:8000
```

### 2. Install Dependencies

```bash
cd frontend/interviewerapp
npm install
```

### 3. Build for Production

```bash
npm run build
```

This will create a `dist/` folder with optimized production files.

### 4. Serve the Frontend

You can serve the `dist/` folder using:
- **Vercel**: Connect your GitHub repo and deploy
- **Netlify**: Drag and drop the `dist/` folder or connect via Git
- **Nginx**: Configure to serve the `dist/` folder
- **Express static**: Serve the `dist/` folder from your backend

## Security Checklist

✅ **Fixed npm vulnerabilities** - All known vulnerabilities have been patched
✅ **Environment variables** - Sensitive data is stored in `.env` files (not committed to git)
✅ **CORS configuration** - Configured to restrict origins in production
✅ **Console logs** - Reduced verbose logging in production mode
✅ **File uploads** - Uploaded files are stored securely and not committed to git

## Important Notes

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Update CORS origins** - Set `ALLOWED_ORIGINS` in backend `.env` for production
3. **Use strong JWT_SECRET** - Generate a random, secure string for production
4. **MongoDB connection** - Use a secure connection string (MongoDB Atlas recommended)
5. **API keys** - Keep your API keys secure and rotate them regularly

## Deployment Platforms

### Backend (Node.js/Express)
- **Heroku**: Add buildpack, set environment variables, deploy
- **Railway**: Connect repo, set environment variables
- **Render**: Connect repo, set environment variables
- **DigitalOcean App Platform**: Connect repo, configure environment

### Frontend (React/Vite)
- **Vercel**: Connect GitHub repo, auto-deploys
- **Netlify**: Connect GitHub repo or drag & drop `dist/` folder
- **Cloudflare Pages**: Connect GitHub repo
- **AWS S3 + CloudFront**: Upload `dist/` to S3, serve via CloudFront

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check port availability

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration in backend
- Ensure backend is running and accessible

### API errors
- Verify API keys are correct
- Check API rate limits
- Review backend logs for detailed errors

## Support

For issues or questions, check the error logs in your deployment platform's console.

