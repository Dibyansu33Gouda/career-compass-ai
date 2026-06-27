# CareerCompass AI 🧭

> **From skills to a personalized career action plan in under 60 seconds.**

Built for the **Google Vibe Coding Hackathon** by [Dibyansu Gouda](https://github.com/Dibyansu33Gouda) · NIST University, Baripada, Odisha.

🔴 **[Live Demo](https://career-compass-ai-belv-n2tm5jol3-dibyansu-coding.vercel.app)** · **[Backend API](https://career-compass-ai-z21y.onrender.com)** · **[Portfolio](https://dibyansu33gouda.github.io/pixel-parade-311/)**

---

## 🎯 The Problem

Every CS student faces the same question: *"I want to become a Data Scientist — where do I even start?"*

The internet is full of generic advice and paid courses. There's no personalized, honest, actionable guide that starts from **where YOU are today**.

---

## ✨ Solution

CareerCompass AI takes your resume or skills summary and generates a **personalized 30/60/90-day career roadmap** with weekly tasks, free resources, and progress tracking — powered by AI.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🗺️ **Career Roadmap** | 30/60/90-day personalized plan from your resume |
| 📊 **Resume Score Ring** | Animated score showing readiness for the target role |
| 🎯 **Skill Gap Analysis** | Prioritized gaps with why they matter |
| 🛡️ **ATS Analyser** | Missing keywords + weak phrase replacements |
| 🐙 **GitHub Project Ideas** | Portfolio projects mapped to your skill gaps |
| 🎤 **Mock Interview Prep** | 5 tailored questions with answer outlines |
| ⚖️ **Career Comparison** | Side-by-side comparison of two career paths |
| 📄 **PDF Export** | Download your full roadmap with progress |
| ✅ **Progress Tracker** | Check off weekly tasks, persisted in localStorage |
| 🎉 **Confetti on Completion** | Because finishing deserves a celebration |

---

## 🏗️ Tech Stack

```
Frontend  →  Next.js 15.4.8 · TypeScript · Tailwind CSS
Backend   →  FastAPI · Python 3.11 · Pydantic
AI        →  Llama 3.3 70B via Groq API (free tier)
Deploy    →  Vercel (frontend) · Render (backend)
```

---

## 🚀 Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/Dibyansu33Gouda/career-compass-ai.git
cd career-compass-ai
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your Groq API key (free at https://console.groq.com)
# GROQ_API_KEY=your_key_here

uvicorn main:app --reload
# Runs at http://localhost:8000
```

### 3. Frontend setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
# Runs at http://localhost:3000
```

---

## 📁 Project Structure

```
career-compass-ai/
├── backend/
│   ├── main.py          # FastAPI — all 5 AI endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Main UI — all features
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   ├── lib/
    │   │   ├── api.ts        # API client
    │   │   └── utils.ts
    │   └── types/
    │       └── index.ts      # TypeScript types
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.js
```

---

## 🌐 Deployment

**Frontend → Vercel**
1. Import repo on [vercel.com](https://vercel.com)
2. Root Directory: `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

**Backend → Render**
1. New Web Service on [render.com](https://render.com)
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `GROQ_API_KEY=your_key`

---

## 🔑 Get a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → API Keys → Create API key
3. Free tier: 14,400 requests/day — more than enough

---

## 👤 Author

**Dibyansu Gouda** · CSE @ NIST University, Baripada, Odisha (Batch 2025)

[![GitHub](https://img.shields.io/badge/GitHub-Dibyansu33Gouda-181717?logo=github)](https://github.com/Dibyansu33Gouda)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dibyansu_Gouda-0A66C2?logo=linkedin)](https://linkedin.com/in/dibyansu-gouda-b5b432379)
[![Portfolio](https://img.shields.io/badge/Portfolio-Live-0f766e?logo=github-pages)](https://dibyansu33gouda.github.io/pixel-parade-311/)

---

*Built with ❤️ for the Google Vibe Coding Hackathon*
