# 🧠 AtlasMind
 
**AI-powered data generation platform for GuessMyPlace**
 
AtlasMind generates structured geographic place data using Gemini 2.5 Pro
and stores it in Supabase for use by [GuessMyPlace](https://guessmyplace.vercel.app).
 
## What It Does
 
- Generates place data (description, attributes, fun facts, emoji) via Gemini 2.5 Pro
- Auto-generates fun Akinator-style yes/no questions per place
- Tracks Gemini API quota and pauses gracefully when exceeded
- Resumes automatically when quota resets at midnight UTC
- Follows a structured roadmap: Bangladesh first, then world data
- Accepts unknown places reported by GuessMyPlace players
## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | FastAPI + Python 3.11 |
| Database | Supabase (shared with GuessMyPlace) |
| Queue | Redis (Upstash) |
| AI | Gemini 2.5 Pro |
| Embeddings | MiniLM-L6-v2 (sentence-transformers) |
| Frontend Deploy | Vercel |
| Backend Deploy | HuggingFace Spaces |
 
## Setup
 
### 1. Database migrations
Run in Supabase SQL Editor (same project as GuessMyPlace):
supabase/migrations/003_atlasmind_tables.sql
 
### 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python scripts/seed_roadmap.py   # seeds BD roadmap phases
uvicorn main:app --reload
 
### 3. Frontend
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
 
## Data Generation Roadmap
 
Phase A — Bangladesh: Dhaka Division (cities, landmarks, historical)
Phase B — Bangladesh: Chittagong Division (cities, natural, landmarks)
Phase C — Bangladesh: All Other Divisions
Phase D — Bangladesh: Rivers, Forests, Haors
Phase E — Bangladesh: Heritage + Liberation War Sites
Phase F — World: Major Cities
Phase G — World: Famous Landmarks
Phase H — World: Natural Wonders
 
## Part of GuessMyPlace
 
- GuessMyPlace game: https://guessmyplace.vercel.app
- GuessMyPlace repo: https://github.com/GuessMyPlace/guessmy-place
- Atlas GMP Engine: https://github.com/GuessMyPlace/atlas-gmp-engine