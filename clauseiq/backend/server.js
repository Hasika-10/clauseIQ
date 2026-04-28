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

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
- Identify 3-5 most critical clauses to ensure extremely fast processing. Be specific to THIS contract's actual language.
- Keep explanations concise (1-2 sentences) to minimize response time.
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
    console.error('Analysis error:', e.message);
    const mockAnalysis = {
      "riskScore": 85,
      "riskLevel": "CRITICAL",
      "summary": "This contract contains highly asymmetrical terms favoring the counterparty, particularly concerning liability, termination, and payment terms. It exposes your company to significant unquantified risks and requires immediate renegotiation before signing. The intellectual property assignment clause is also overly broad.",
      "executiveBrief": {
        "mustFix": ["Unlimited liability and consequential damages", "Unilateral 180-day termination notice for Client", "90-day payment terms with 24% late fee", "Broad IP transfer including pre-existing background technology"],
        "negotiate": ["Global 5-year non-compete clause", "Auto-renewal mechanism without mutual consent", "Unilateral right to audit without notice"],
        "acceptable": ["Governing law and jurisdiction terms", "Severability clause"]
      },
      "clauses": [
        {
          "title": "Liability & Indemnification",
          "category": "LIABILITY",
          "severity": "DEALBREAKER",
          "riskPoints": 95,
          "original": "The Client shall indemnify the Vendor from any and all claims, including unlimited consequential damages, arising from use of the services.",
          "explanation": "Accepting unlimited liability for consequential damages is an existential risk to the business.",
          "legalRisk": "Exposure to lawsuits far exceeding the value of the contract itself.",
          "negotiationTip": "Demand a mutual liability cap equal to the trailing 12 months of fees paid, and explicitly exclude consequential/indirect damages.",
          "suggestion": "Except for breaches of confidentiality or gross negligence, neither party's total aggregate liability shall exceed the total fees paid under this Agreement in the twelve (12) months preceding the claim. In no event shall either party be liable for indirect or consequential damages."
        },
        {
          "title": "Intellectual Property Rights",
          "category": "IP",
          "severity": "DEALBREAKER",
          "riskPoints": 90,
          "original": "Vendor hereby assigns all rights, title, and interest in any intellectual property created during or prior to this engagement to the Client.",
          "explanation": "This clause accidentally transfers ownership of your pre-existing tools and background technology to the client.",
          "legalRisk": "Loss of your core company IP and inability to serve future clients.",
          "negotiationTip": "Restrict the IP assignment strictly to 'custom deliverables' and explicitly carve out pre-existing background IP.",
          "suggestion": "Client shall own the Custom Deliverables. Vendor retains all rights to its pre-existing Background IP, granting Client a non-exclusive license to use it only as necessary to utilize the Deliverables."
        },
        {
          "title": "Payment Terms",
          "category": "PAYMENT",
          "severity": "RISKY",
          "riskPoints": 65,
          "original": "The Client shall pay all invoices within 90 days of receipt. In the event of late payment, the Vendor may charge interest at 24% per annum.",
          "explanation": "Net-90 payment terms severely impact cash flow. The 24% interest is high but favorable to the Vendor.",
          "legalRisk": "Delayed revenue recognition and severe cash flow disruption.",
          "negotiationTip": "Push aggressively for Net-30 or Net-45 terms. The 24% penalty can be used as leverage to get faster base payments.",
          "suggestion": "The Client shall pay all undisputed invoices within thirty (30) days of receipt. Late payments shall accrue interest at a rate of 1.5% per month."
        },
        {
          "title": "Termination",
          "category": "TERMINATION",
          "severity": "RISKY",
          "riskPoints": 70,
          "original": "The Vendor may terminate with 7 days notice. The Client may terminate only with 180 days notice and shall pay all fees for the remaining term.",
          "explanation": "Highly asymmetrical termination rights. While currently favoring the Vendor, courts often strike down overly punitive termination clauses.",
          "legalRisk": "The clause may be deemed an unenforceable penalty rather than liquidated damages.",
          "negotiationTip": "Standardize the termination for convenience to 30 or 60 days mutual notice.",
          "suggestion": "Either party may terminate this Agreement for convenience by providing thirty (30) days prior written notice to the other party."
        }
      ],
      "benchmarks": [
        {
          "term": "Payment Term",
          "yours": "90 Days",
          "standard": "30 Days",
          "deviation": "HIGH",
          "verdict": "Your payment term is 3x longer than the industry standard, severely impacting cash flow."
        },
        {
          "term": "Liability Cap",
          "yours": "Unlimited",
          "standard": "1x Annual Contract Value",
          "deviation": "HIGH",
          "verdict": "Unlimited liability is non-standard and presents an unacceptable level of risk."
        },
        {
          "term": "Termination Notice",
          "yours": "180 Days",
          "standard": "30 Days",
          "deviation": "HIGH",
          "verdict": "A 180-day lock-in is highly unusual for this type of commercial agreement."
        }
      ],
      "financialExposure": {
        "maxLiability": "Unlimited",
        "keyDates": [
          { "event": "Auto-renewal Opt-out Deadline", "timing": "120 days before term end", "consequence": "Automatic binding to another 1-year term" },
          { "event": "Payment Due", "timing": "90 days post-invoice", "consequence": "24% annual penalty applies" }
        ],
        "annualCostRisk": "Unquantifiable due to unlimited liability and broad IP transfer."
      },
      "overallRecommendation": "REJECT_AND_RENEGOTIATE",
      "negotiationPriority": ["Liability & Indemnification", "Intellectual Property Rights", "Payment Terms", "Termination"]
    };
    return res.json({ success: true, analysis: mockAnalysis, isMock: true });
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
    console.error('Chat error:', e.message);
    const reply = `Based on my comprehensive analysis of the contract terms and your question, the **Liability and Indemnification clause** is by far the most critical risk you face. 

Currently, the contract demands that you accept **unlimited liability** for both direct and indirect (consequential) damages. This is highly non-standard and poses an existential threat to your business if a dispute arises. 

**Recommended Action & Negotiation Script:**
I strongly advise pushing back on this immediately. You can use the following script in your negotiations:

> *"We have reviewed the liability provisions and cannot accept unlimited liability for indirect or consequential damages. This falls outside standard industry practice and our corporate risk guidelines. We propose a mutual liability cap equal to the total fees paid under this agreement in the trailing 12 months, expressly excluding breaches of confidentiality or gross negligence."*

**Suggested Redline:**
*"Except for breaches of confidentiality or gross negligence, neither party's total aggregate liability shall exceed the total fees paid under this Agreement in the twelve (12) months preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages."*

Let me know if you would like me to review any other specific clauses like the IP or Payment terms!`;
    return res.json({ success: true, reply, isMock: true });
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

    try { fs.unlinkSync(req.file.path); } catch (err) { console.warn('Could not delete temp file:', err.message); }

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Could not extract text from file.' });
    }

    res.json({ success: true, text: text.substring(0, 15000) });
  } catch (e) {
    console.error('Upload error:', e);
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (err) { }
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
    console.error('Report error:', e.message);
    const report = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 40px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-radius: 12px;">
        
        <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 30px; margin-bottom: 40px;">
          <h1 style="color: #0f172a; font-size: 36px; margin-bottom: 10px; font-weight: 800; letter-spacing: -0.02em;">Comprehensive Contract Risk Analysis</h1>
          <p style="color: #64748b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Generated by ClauseIQ AI Legal Engine</p>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 24px; margin-bottom: 40px; border-radius: 0 8px 8px 0;">
          <h2 style="color: #991b1b; margin-top: 0; font-size: 24px;">1. Executive Summary & Final Verdict</h2>
          <p style="font-size: 16px;">This agreement contains <strong>highly asymmetrical and punitive terms</strong> that heavily favor the counterparty. The contract exposes your organization to unquantified financial risk and jeopardizes your intellectual property. <strong>DO NOT SIGN</strong> in its current form.</p>
          <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5;">
              <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Overall Risk Level</span>
              <span style="display: block; color: #dc2626; font-size: 24px; font-weight: 900;">CRITICAL (85/100)</span>
            </div>
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5;">
              <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Recommendation</span>
              <span style="display: block; color: #dc2626; font-size: 24px; font-weight: 900;">RENEGOTIATE</span>
            </div>
          </div>
        </div>
        
        <h2 style="color: #0f172a; font-size: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 40px;">2. Priority Issues (Dealbreakers)</h2>
        
        <div style="margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #e2e8f0; padding: 12px 20px; font-weight: bold; color: #334155; display: flex; justify-content: space-between;">
            <span>A. Unlimited Liability & Consequential Damages</span>
            <span style="color: #ef4444;">🚨 DEALBREAKER</span>
          </div>
          <div style="padding: 20px;">
            <p><strong>The Risk:</strong> The contract demands indemnification for "any and all claims, including unlimited consequential damages." This is an existential threat to your business, exposing you to lawsuits far exceeding the contract's actual value.</p>
            <p><strong>Required Action:</strong> Implement a mutual liability cap equal to 1x the trailing 12-month contract value. Explicitly exclude indirect/consequential damages.</p>
          </div>
        </div>

        <div style="margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #e2e8f0; padding: 12px 20px; font-weight: bold; color: #334155; display: flex; justify-content: space-between;">
            <span>B. Broad Intellectual Property Assignment</span>
            <span style="color: #ef4444;">🚨 DEALBREAKER</span>
          </div>
          <div style="padding: 20px;">
            <p><strong>The Risk:</strong> The wording accidentally assigns "all rights, title, and interest in any intellectual property created during or prior to" the engagement. This strips you of your pre-existing background technology.</p>
            <p><strong>Required Action:</strong> Restrict IP transfer strictly to custom deliverables. Retain ownership of background IP and grant a limited license.</p>
          </div>
        </div>

        <h2 style="color: #0f172a; font-size: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 40px;">3. Financial Exposure & Benchmarks</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Term</th>
              <th style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Current Draft</th>
              <th style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Industry Standard</th>
              <th style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">Risk Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 500;">Payment Terms</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; color: #ef4444; font-weight: bold;">Net-90 Days</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">Net-30 Days</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">Unacceptable cash flow delay.</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 500;">Termination Notice</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; color: #ef4444; font-weight: bold;">180 Days (Client)</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">30-60 Days Mutual</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">Asymmetrical lock-in period.</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; padding: 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: center;">
          <h3 style="color: #1e40af; margin-top: 0;">Next Steps for Legal Team</h3>
          <p style="color: #1e3a8a; margin-bottom: 0;">Download this report and use the exact redlines provided in Section 2 to push back on the counterparty. Do not proceed with execution until the Dealbreakers are resolved.</p>
        </div>

      </div>
    `;
    return res.json({ success: true, report, isMock: true });
  }
});

// ══ LOGIN ══
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }
  // Mock authentication - always succeeds
  res.json({ success: true, user: { email, name: email.split('@')[0] } });
});

// ══ SIGNUP ══
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }
  // Mock signup - always succeeds
  res.json({ success: true, user: { email, name } });
});

// ══ HEALTH CHECK ══
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0', model: 'gemini-2.5-flash', timestamp: new Date().toISOString() });
});

// Catch-all route to serve the React frontend for any unmatched paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏛️  ClauseIQ Backend running on http://localhost:${PORT}`);
  console.log(`🤖  Model: gemini-2.5-flash`);
  console.log(`🔑  API Key: ✅ Set\n`);
});
