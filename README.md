# 👁️ Soul Reader — Deploy Guide

## Project Structure
```
soul-reader/
├── api/
│   └── read.js        ← Backend (API key lives here, hidden from users)
├── public/
│   └── index.html     ← Frontend (no API key, calls /api/read)
├── vercel.json
├── package.json
└── README.md
```

---

## 🚀 Deploy in 5 Minutes (Free)

### Step 1 — Push to GitHub
1. Go to **github.com** → New repository → name it `soul-reader` → Public → Create
2. Upload ALL files keeping the same folder structure:
   - `api/read.js`
   - `public/index.html`
   - `vercel.json`
   - `package.json`

### Step 2 — Connect to Vercel
1. Go to **vercel.com** → Sign up with your GitHub account (free)
2. Click **"Add New Project"**
3. Import your `soul-reader` GitHub repo
4. Click **Deploy** (Vercel auto-detects everything)

### Step 3 — Add your API Key (Secret & Safe)
1. In Vercel dashboard → your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `your-openai-api-key-here`
3. Click **Save** → then **Redeploy**

### Step 4 — Your app is live! 🎉
```
https://soul-reader.vercel.app
```

---

## 🔐 How the API Key is Protected
- The key is stored in Vercel's encrypted environment variables
- It only exists on the **server** inside `api/read.js`
- The browser **never** sees it — not in DevTools, not in source code
- Users call `/api/read` → your server calls OpenAI → result sent back
