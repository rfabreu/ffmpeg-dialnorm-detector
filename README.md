# IPTS Loudness Meter

**Stack**  
- Analyzer: Python + ffmpeg
- API: Netlify Functions (Node.js + Supabase)  
- DB: Supabase Postgres  
- UI: React + Tailwind + Recharts (Netlify)

## Getting Started

1. Clone repo  
2. Setup Supabase
3. Configure `.env` in `/analyzer` & Netlify env-vars  
4. `npm install` in `/web` and `/functions`  
5. Deploy to Netlify; run `analyze_low.py`/`analyze_high.py` locally.

