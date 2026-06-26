# CareerCompass AI 🧭

**From skills to a personalized career action plan in under 60 seconds.**

Built for the Google Vibe Coding Hackathon by [Dibyansu Gouda](https://github.com/Dibyansu33Gouda) · NIST University, Odisha.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Career Roadmap** | 30 / 60 / 90-day personalized plan from your resume |
| 📊 **Resume Score Ring** | Animated score showing your readiness for the target role |
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
Frontend  →  Next.js 14 · TypeScript · Tailwind CSS
Backend   →  FastAPI · Python · Pydantic
AI        →  Google Gemini 2.0 Flash (free tier)
Deploy    →  Vercel (frontend) · Render (backend)
```

---

## 🚀 Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/Dibyansu33Gouda/career-compass-ai
cd career-compass-ai
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Add your Gemini API key (free at https://aistudio.google.com/apikey)
# GEMINI_API_KEY=your_key_here

uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 3. Frontend setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# Frontend runs at http://localhost:3000
```

---

## 🌐 Deployment

**Frontend → Vercel**
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set Root Directory to `frontend`
4. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

**Backend → Render**
1. New Web Service on [render.com](https://render.com)
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `GEMINI_API_KEY=your_key`

---

## 📁 Project Structure

```
career-compass-ai-242/
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

## 🔑 Get a Free Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google → Create API key
3. Free tier: 15 requests/minute, 1500 requests/day — more than enough

---

## 👤 Author

**Dibyansu Gouda** · CSE @ NIST University, Berhampur , Odisha (Batch 2025)

[![GitHub](https://img.shields.io/badge/GitHub-Dibyansu33Gouda-181717?logo=github)](https://github.com/Dibyansu33Gouda)

[![Portfolio](https://img.shields.io/badge/Portfolio-Live-0f766e?logo=github-pages)](https://dibyansu33gouda.github.io/pixel-parade-311/)

---

*Built with ❤️ for the Google(unstop.com)  Vibe Coding Hackathon*
