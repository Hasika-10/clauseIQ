require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyCrpEp-q0X0E06AkFjzrnqq9kKMTHtDT8k" });

// ══ ANALYZE CONTRACT ══
app.post('/api/analyze', async (req, res) => {
  const { contractText } = req.body;
  if (!contractText || contractText.length < 50) {
    return res.status(400).json({ error: 'Contract text too short or missing.' });
  }

  const prompt = `You are ClauseIQ, an elite AI contract analyst and legal intelligence system. Your analysis must be deep, specific, and actionable — not generic.

Analyze the following contract thoroughly and return ONLY a raw JSON object (no markdown, no code fences, no preamble).

Return this EXACT structure:
{
  "riskScore": <integer 0-100>,
  "riskLevel": "<HIGH|MEDIUM|LOW>",
  "summary": "<3-4 sentence executive summary highlighting the most critical issues>",
  "executiveBrief": {
    "mustFix": ["<critical issue 1>", "<critical issue 2>", "<critical issue 3>"],
    "negotiate": ["<negotiation point 1>", "<negotiation point 2>"],
    "acceptable": ["<acceptable clause 1>"]
  },
  "clauses": [
    {
      "title": "<specific clause name>",
      "category": "<LIABILITY|IP|PAYMENT|TERMINATION|RENEWAL|NON-COMPETE|CONFIDENTIALITY|INDEMNIFICATION|DISPUTE|SUBCONTRACTING|OTHER>",
      "severity": "<DEALBREAKER|RISKY|WATCH|FAIR>",
      "riskPoints": <integer 0-100>,
      "original": "<verbatim excerpt from contract, max 100 words>",
      "explanation": "<clear 2-3 sentence explanation of why this is problematic or acceptable>",
      "legalRisk": "<specific legal consequence if this clause is enforced as-is>",
      "negotiationTip": "<specific tactic to use when negotiating this clause>",
      "suggestion": "<complete rewritten clause text, or 'This clause is fair as written.' if FAIR>"
    }
  ],
  "benchmarks": [
    {
      "term": "<term name>",
      "yours": "<exact value/condition in this contract>",
      "standard": "<industry standard value>",
      "deviation": "<HIGH|MEDIUM|LOW|NONE>",
      "verdict": "<one sentence financial/legal impact>"
    }
  ],
  "financialExposure": {
    "maxLiability": "<estimated maximum financial exposure>",
    "keyDates": [
      { "event": "<event name>", "timing": "<when>", "consequence": "<what happens>" }
    ],
    "annualCostRisk": "<estimated annual cost if worst clauses are triggered>"
  },
  "overallRecommendation": "<SIGN|NEGOTIATE|REJECT>",
  "negotiationPriority": ["<clause title 1>", "<clause title 2>", "<clause title 3>"]
}

Rules:
- Identify 7-10 clauses. Be specific to THIS contract's actual language.
- Focus on: liability caps, IP ownership, termination asymmetry, payment terms, auto-renewal traps, non-compete scope, governing law, indemnification, confidentiality duration, subcontracting rights.
- riskScore: 0=perfectly balanced, 100=extremely dangerous
- DEALBREAKER = must renegotiate before signing; RISKY = significant concern; WATCH = minor issue; FAIR = acceptable
- Be specific about financial amounts, timeframes, and legal jurisdictions mentioned.
- For financialExposure, estimate actual dollar/rupee amounts where possible.

CONTRACT TEXT:
${contractText.substring(0, 8000)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const raw = response.text;
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);

    res.json({ success: true, analysis });
  } catch (e) {
    console.error('Analysis error:', e);
    res.status(500).json({ error: 'Analysis failed. Please check your API key and try again.', details: e.message });
  }
});

// ══ CHAT WITH CONTRACT ══
app.post('/api/chat', async (req, res) => {
  const { message, analysis, history, contractText } = req.body;
  if (!message || !analysis) {
    return res.status(400).json({ error: 'Message and analysis required.' });
  }

  const systemContext = `You are ClauseIQ's AI Legal Advisor — an expert contract lawyer with 20+ years of experience in commercial contracts, IP law, and corporate negotiations.

CONTRACT ANALYSIS DATA:
- Risk Score: ${analysis.riskScore}/100 (${analysis.riskLevel} RISK)
- Overall Recommendation: ${analysis.overallRecommendation}
- Summary: ${analysis.summary}

KEY CLAUSES IDENTIFIED:
${(analysis.clauses || []).map(c => `• ${c.title} [${c.severity}] — ${c.explanation}`).join('\n')}

FINANCIAL EXPOSURE:
${JSON.stringify(analysis.financialExposure || {}, null, 2)}

${contractText ? `ORIGINAL CONTRACT TEXT (first 3000 chars):\n${contractText.substring(0, 3000)}` : ''}

INSTRUCTIONS:
- Answer questions with the precision of a senior lawyer
- Be direct, practical, and actionable
- When asked about specific clauses, reference the actual contract language
- Give negotiation scripts when asked ("Say exactly: ...")  
- Cite relevant legal precedents or standards when helpful
- Use plain English but don't oversimplify
- If asked to draft a counter-clause, provide complete professional language
- Keep responses focused: 2-4 paragraphs unless more detail is requested`;

  const contents = [];
  if (history && history.length > 0) {
    history.slice(-8).forEach(h => {
      contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] });
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemContext,
      }
    });

    const reply = response.text;
    res.json({ success: true, reply });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: 'Chat failed.', details: e.message });
  }
});

// ══ UPLOAD PDF ══
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      text = fs.readFileSync(req.file.path, 'utf-8');
    }

    fs.unlinkSync(req.file.path);

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Could not extract text from file.' });
    }

    res.json({ success: true, text: text.substring(0, 15000) });
  } catch (e) {
    console.error('Upload error:', e);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'File processing failed.', details: e.message });
  }
});

// ══ GENERATE REPORT ══
app.post('/api/report', async (req, res) => {
  const { analysis, contractText } = req.body;
  if (!analysis) return res.status(400).json({ error: 'Analysis data required.' });

  const prompt = `You are ClauseIQ. Generate a comprehensive professional legal analysis report in clean HTML format.

Based on this contract analysis:
${JSON.stringify(analysis, null, 2)}

Create a formal report with:
1. Executive Summary
2. Risk Assessment Dashboard 
3. Clause-by-Clause Analysis (detailed)
4. Financial Exposure Analysis
5. Industry Benchmarking
6. Negotiation Strategy & Priority Actions
7. Recommended Contract Changes
8. Final Recommendation

Format as clean, professional HTML with inline CSS. Use a clean legal document style. Include the date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ success: true, report: response.text });
  } catch (e) {
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

// ══ HEALTH CHECK ══
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0', model: 'gemini-2.5-flash', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🏛️  ClauseIQ Backend running on http://localhost:${PORT}`);
  console.log(`🤖  Model: gemini-2.5-flash`);
  console.log(`🔑  API Key: ✅ Set\n`);
});
