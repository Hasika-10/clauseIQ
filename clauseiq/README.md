# ⚖️ ClauseIQ v4 — AI Contract Intelligence

> **Hackathon Edition** — Full-stack AI contract analysis powered by Gemini 2.5 Flash

## 🏆 What Makes This Win

ClauseIQ is a **full-stack AI legal intelligence platform** that:

- **Deep risk analysis** — 7-10 clause breakdown with severity, legal risk, and negotiation tactics
- **Financial exposure modeling** — estimates max liability, annual cost risk, and key deadlines
- **Industry benchmarking** — compares payment terms, liability caps, etc. against market standards
- **AI Legal Advisor chatbot** — conversational Q&A backed by full contract context + Gemini 2.5 Flash
- **Suggested clause rewrites** — full professional language replacements for every risky clause
- **PDF/file upload** — drag-and-drop any contract file
- **Visual risk heatmap** — at-a-glance danger overview

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Gemini API key (https://aistudio.google.com/app/apikey)

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

Start the backend:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

---

## 🏗️ Architecture

```
clauseiq/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   └── .env               # YOUR API KEY GOES HERE
│
└── frontend/
    ├── src/
    │   ├── App.jsx         # Full React application
    │   ├── index.js
    │   └── index.css       # Global styles
    ├── public/
    │   └── index.html
    └── package.json
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Deep contract analysis |
| POST | `/api/chat` | AI legal advisor chat |
| POST | `/api/upload-pdf` | PDF/file text extraction |
| POST | `/api/report` | Full HTML report generation |
| GET | `/api/health` | Server health check |

---

## 🎯 Key Features

### Contract Analysis
- Risk score (0-100) with visual gauge
- 7-10 clauses analyzed: LIABILITY, IP, PAYMENT, TERMINATION, RENEWAL, NON-COMPETE, CONFIDENTIALITY, INDEMNIFICATION, DISPUTE
- Each clause gets: severity badge, original text, explanation, legal risk, negotiation tip, full rewrite suggestion
- Executive brief: must-fix list, negotiation points, acceptable clauses
- Final recommendation: SIGN / NEGOTIATE / REJECT

### AI Advisor Chat
- Full contract context in every message
- Memory of conversation history
- Quick-chip prompts for common questions
- Can draft counter-proposals, write negotiation scripts, explain legal terms

### Visual Heatmap
- Grid view of all clauses color-coded by severity
- Risk score per clause

### Industry Benchmarking
- Payment terms, liability caps, termination notice, auto-renewal windows
- Deviation level (HIGH/MEDIUM/LOW/NONE)
- Dollar impact per deviation

### Financial Exposure
- Max liability estimation
- Annual cost risk if worst clauses triggered
- Key dates and deadlines timeline
- Priority negotiation order

---

## 🔧 Production Deployment

### Backend (e.g., Railway, Render, Heroku)
```bash
cd backend
# Set env vars: GEMINI_API_KEY, NODE_ENV=production
npm start
```

### Frontend (e.g., Vercel, Netlify)
```bash
cd frontend
# Set env var: REACT_APP_API_URL=https://your-backend-url.com
npm run build
# Deploy the build/ folder
```

---

## 💡 Hackathon Talking Points

1. **Real AI, not mocks** — every analysis is live Gemini 2.5 Flash with structured output
2. **Full-stack** — proper separation of concerns, not a single HTML file
3. **Production-ready** — error handling, file upload, chat history, loading states
4. **Legal depth** — not just "this looks risky" but specific legal consequences, negotiation scripts, full clause rewrites
5. **Financial modeling** — translates legal risk into dollar amounts
6. **UX craft** — animated risk meter, heatmap, smooth transitions, dark theme

---

*Built for hackathon — ClauseIQ v4 · Powered by Gemini 2.5 Flash*


