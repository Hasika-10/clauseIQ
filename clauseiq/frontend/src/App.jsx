import React, { useState, useRef, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || '';

// ══ CONSTANTS ══
const SAMPLE_CONTRACT = `SERVICE AGREEMENT

This Service Agreement is entered into as of January 1, 2026, between TechVendor Solutions Pvt. Ltd. ("Vendor") and ClientCorp India Ltd. ("Client").

1. SERVICES
The Vendor may subcontract any part of the services without prior written consent of the Client.

2. PAYMENT TERMS
The Client shall pay all invoices within 90 days of receipt. In the event of late payment, the Vendor may charge interest at 24% per annum. The Client shall bear all costs of collection, including legal fees.

3. LIABILITY
The Client shall indemnify the Vendor from any and all claims, including unlimited consequential damages, arising from use of the services.

4. INTELLECTUAL PROPERTY
All deliverables created by the Vendor shall remain exclusive property of the Vendor. The Client is granted only a non-transferable license during the term.

5. TERMINATION
The Vendor may terminate with 7 days notice. The Client may terminate only with 180 days notice and shall pay all fees for the remaining term.

6. AUTO-RENEWAL
This Agreement shall automatically renew annually unless written notice is provided at least 120 days before the end of the term.

7. NON-COMPETE
The Client shall not engage with any competitor of the Vendor for 5 years after termination, globally.

8. GOVERNING LAW
Governed by laws of Vendor's home jurisdiction. Disputes resolved exclusively in Vendor's home city courts.

9. CONFIDENTIALITY
Client maintains confidentiality in perpetuity. Violation results in liquidated damages of Rs. 50,00,000 per incident.`;

const SEV_CONFIG = {
  DEALBREAKER: { color: 'var(--red)', dim: 'var(--red-dim)', border: 'var(--red-border)', label: '🚨 DEALBREAKER' },
  RISKY: { color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'var(--amber-border)', label: '⚠️ RISKY' },
  WATCH: { color: 'var(--purple)', dim: 'var(--purple-dim)', border: 'var(--purple-border)', label: '👁 WATCH' },
  FAIR: { color: 'var(--green)', dim: 'var(--green-dim)', border: 'var(--green-border)', label: '✓ FAIR' },
};

const REC_CONFIG = {
  SIGN: { color: 'var(--green)', bg: 'var(--green-dim)', label: '✓ SIGN WITH MINOR NOTES' },
  NEGOTIATE: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: '⚡ NEGOTIATE BEFORE SIGNING' },
  REJECT: { color: 'var(--red)', bg: 'var(--red-dim)', label: '✗ REJECT / MAJOR REWORK NEEDED' },
};

// ══ MINI COMPONENTS ══
function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function SevBadge({ sev }) {
  const c = SEV_CONFIG[sev] || SEV_CONFIG.WATCH;
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      padding: '3px 10px', borderRadius: 4, border: `1px solid ${c.border}`,
      background: c.dim, color: c.color, whiteSpace: 'nowrap'
    }}>
      {c.label}
    </span>
  );
}

function RiskMeter({ score, level }) {
  const lc = level === 'HIGH' ? 'var(--red)' : level === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 200); return () => clearTimeout(t); }, [score]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          <circle
            cx="70" cy="70" r="56" fill="none"
            stroke={lc}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - width / 100)}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)', filter: `drop-shadow(0 0 8px ${lc})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 38, color: lc, lineHeight: 1, textShadow: `0 0 24px ${lc}80` }}>{score}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
        padding: '5px 16px', borderRadius: 20, background: lc + '20',
        color: lc, border: `1px solid ${lc}50`, textTransform: 'uppercase'
      }}>
        {level} RISK
      </div>
    </div>
  );
}

// ══ CLAUSE CARD ══
function ClauseCard({ clause, index }) {
  const [open, setOpen] = useState(clause.severity === 'DEALBREAKER');
  const [copied, setCopied] = useState(false);
  const c = SEV_CONFIG[clause.severity] || SEV_CONFIG.WATCH;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{
      border: `1px solid ${open ? c.border : 'var(--border)'}`,
      borderRadius: 'var(--r-md)', overflow: 'hidden',
      background: open ? `${c.dim}` : 'var(--surface)',
      transition: 'all 0.25s', marginBottom: 10,
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.dim, border: `1px solid ${c.border}`,
          fontFamily: 'var(--mono)', fontSize: 11, color: c.color, fontWeight: 600, flexShrink: 0
        }}>
          {clause.riskPoints}
        </div>
        <SevBadge sev={clause.severity} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{clause.title}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
          {clause.category}
        </span>
        <span style={{ color: 'var(--ink3)', fontSize: 16, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', animation: 'slideDown 0.2s ease-out' }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Original clause */}
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7,
            background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)',
            padding: '14px 16px', borderRadius: 8, marginTop: 16,
            color: 'var(--ink2)', position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: -10, left: 14, background: 'var(--bg)', padding: '0 8px', fontSize: 9, color: 'var(--ink3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Original Text
            </div>
            "{clause.original}"
          </div>

          {/* Explanation */}
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--ink2)', margin: '14px 0 10px' }}>
            {clause.explanation}
          </p>

          {/* Legal risk */}
          {clause.legalRisk && (
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid var(--red-border)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 10,
              fontSize: 12.5, color: '#FCA5A5'
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 8 }}>Legal Risk:</span>
              {clause.legalRisk}
            </div>
          )}

          {/* Negotiation tip */}
          {clause.negotiationTip && (
            <div style={{
              background: 'rgba(59,130,246,0.07)', border: '1px solid var(--blue-border)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              fontSize: 12.5, color: '#93C5FD'
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 8 }}>💡 Negotiate:</span>
              {clause.negotiationTip}
            </div>
          )}

          {/* Suggestion */}
          {clause.suggestion && !clause.suggestion.toLowerCase().includes('fair as written') ? (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✦ Suggested Rewrite
              </div>
              <div style={{
                background: 'var(--green-dim)', border: '1px solid var(--green-border)',
                borderRadius: 8, padding: '14px 16px', fontSize: 13, lineHeight: 1.7,
                color: '#D1FAE5', fontFamily: 'var(--mono)'
              }}>
                {clause.suggestion}
              </div>
              <button
                onClick={() => copy(clause.suggestion)}
                style={{
                  marginTop: 8, background: 'transparent', color: 'var(--green)',
                  border: '1px solid var(--green-border)', padding: '6px 14px',
                  fontFamily: 'var(--mono)', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Rewrite'}
              </button>
            </div>
          ) : clause.suggestion && (
            <div style={{
              fontSize: 13, color: 'var(--green)', padding: '10px 14px',
              background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 8
            }}>
              ✓ This clause is fair as written
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══ CHAT COMPONENT ══
function ChatPanel({ analysis, contractText }) {
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: `I've analyzed this contract and found a **${analysis.riskLevel} RISK** score of ${analysis.riskScore}/100.\n\n${analysis.summary}\n\nAsk me anything — negotiation tactics, specific clause risks, what to say to the vendor, or how to rewrite problematic terms.`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const CHIPS = [
    "What's the single biggest risk I should fix?",
    "Give me a negotiation script for the termination clause",
    "What's my maximum financial exposure?",
    "Which clauses should I sign as-is?",
    "Draft a counter-proposal email",
  ];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, analysis, history, contractText })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Network error. Please ensure the backend is running.' }]);
    }
    setLoading(false);
  };

  const formatMsg = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'var(--ink)' }}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Chat window */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
        minHeight: 0
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fadeUp 0.3s ease-out' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 14,
              background: msg.role === 'ai' ? 'linear-gradient(135deg, var(--blue), var(--violet))' : 'var(--surface2)',
              border: '1px solid var(--border)'
            }}>
              {msg.role === 'ai' ? '⚖️' : '👤'}
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '0 12px 12px 12px',
              background: msg.role === 'ai' ? 'var(--blue-dim)' : 'var(--surface2)',
              border: `1px solid ${msg.role === 'ai' ? 'var(--blue-border)' : 'var(--border)'}`,
              fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink2)', maxWidth: '85%'
            }}>
              {formatMsg(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚖️</div>
            <div style={{ padding: '14px 18px', borderRadius: '0 12px 12px 12px', background: 'var(--blue-dim)', border: '1px solid var(--blue-border)', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'block', animation: `bounce 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick chips */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: 'auto' }}>
        {CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => send(chip)}
            disabled={loading}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--ink2)', padding: '6px 12px', borderRadius: 20,
              fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.color = 'var(--blue)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--ink2)'; }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 12 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about this contract..."
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--ink)',
            outline: 'none', transition: 'border-color 0.2s',
            fontFamily: 'var(--sans)'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? 'var(--surface)' : 'linear-gradient(135deg, var(--blue), var(--violet))',
            border: 'none', borderRadius: 10, padding: '12px 20px',
            color: loading || !input.trim() ? 'var(--ink3)' : 'white',
            fontWeight: 600, fontSize: 14, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {loading ? <Spinner size={16} /> : '↗'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ══ RESULTS PANEL ══
function ResultsPanel({ analysis, contractText, onReset }) {
  const [tab, setTab] = useState('clauses');
  const TABS = [
    { id: 'clauses', label: '📋 Clauses' },
    { id: 'heatmap', label: '🗺 Heatmap' },
    { id: 'benchmarks', label: '📊 Benchmarks' },
    { id: 'exposure', label: '💸 Exposure' },
    { id: 'chat', label: '💬 AI Advisor' },
  ];

  const rec = REC_CONFIG[analysis.overallRecommendation] || REC_CONFIG.NEGOTIATE;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
      {/* Hero result header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', padding: '36px 40px', marginBottom: 24,
        display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 300, height: 300,
          borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15,
          background: analysis.riskLevel === 'HIGH' ? 'var(--red)' : analysis.riskLevel === 'MEDIUM' ? 'var(--amber)' : 'var(--green)',
          pointerEvents: 'none'
        }} />

        <RiskMeter score={analysis.riskScore} level={analysis.riskLevel} />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
            Analysis Complete
          </div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400, lineHeight: 1.2, marginBottom: 14 }}>
            Contract Risk Assessment
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink2)', marginBottom: 20 }}>
            {analysis.summary}
          </p>

          {/* Recommendation badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', borderRadius: 10,
            background: rec.bg, border: `1px solid ${rec.color}30`,
            fontWeight: 700, fontSize: 13, color: rec.color, marginBottom: 20
          }}>
            Recommendation: {rec.label}
          </div>

          {/* Priority fixes */}
          {analysis.executiveBrief?.mustFix && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {analysis.executiveBrief.mustFix.slice(0, 3).map((item, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--mono)', fontSize: 11,
                  background: 'var(--red-dim)', border: '1px solid var(--red-border)',
                  color: 'var(--red)', padding: '3px 10px', borderRadius: 4
                }}>
                  🚨 {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 160 }}>
          {[
            { label: 'Clauses Found', val: analysis.clauses?.length || 0 },
            { label: 'Dealbreakers', val: analysis.clauses?.filter(c => c.severity === 'DEALBREAKER').length || 0, color: 'var(--red)' },
            { label: 'Risky Clauses', val: analysis.clauses?.filter(c => c.severity === 'RISKY').length || 0, color: 'var(--amber)' },
            { label: 'Fair Clauses', val: analysis.clauses?.filter(c => c.severity === 'FAIR').length || 0, color: 'var(--green)' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: stat.color || 'var(--ink)', lineHeight: 1 }}>{stat.val}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{
        display: 'flex', gap: 4, padding: '4px', background: 'var(--surface)', borderRadius: 'var(--r-md)',
        marginBottom: 20, border: '1px solid var(--border)', flexWrap: 'wrap'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--sans)',
              background: tab === t.id ? 'var(--blue-dim)' : 'transparent',
              color: tab === t.id ? 'var(--blue)' : 'var(--ink2)',
              border: tab === t.id ? '1px solid var(--blue-border)' : '1px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={onReset}
          style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
            cursor: 'pointer', fontSize: 12, fontFamily: 'var(--mono)',
            background: 'transparent', color: 'var(--ink3)', transition: 'all 0.2s'
          }}
        >
          ← New Contract
        </button>
      </div>

      {/* Tab content */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
        minHeight: tab === 'chat' ? 580 : 'auto',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* CLAUSES TAB */}
        {tab === 'clauses' && (
          <div style={{ padding: '28px 32px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 400, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              Clause Analysis
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface2)', padding: '3px 10px', borderRadius: 20, fontWeight: 400 }}>
                {analysis.clauses?.length} clauses
              </span>
            </h3>
            {(analysis.clauses || [])
              .sort((a, b) => (['DEALBREAKER','RISKY','WATCH','FAIR'].indexOf(a.severity)) - (['DEALBREAKER','RISKY','WATCH','FAIR'].indexOf(b.severity)))
              .map((clause, i) => (
                <ClauseCard key={i} clause={clause} index={i} />
              ))
            }
          </div>
        )}

        {/* HEATMAP TAB */}
        {tab === 'heatmap' && (
          <div style={{ padding: '28px 32px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>Risk Heatmap</h3>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 24, fontFamily: 'var(--mono)' }}>Visual overview — risk score per clause</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
              {(analysis.clauses || [])
                .sort((a, b) => b.riskPoints - a.riskPoints)
                .map((c, i) => {
                  const cfg = SEV_CONFIG[c.severity] || SEV_CONFIG.WATCH;
                  return (
                    <div key={i} style={{
                      borderRadius: 10, padding: '18px 16px',
                      background: cfg.dim, border: `1px solid ${cfg.border}`,
                      transition: 'transform 0.2s', cursor: 'default'
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: cfg.color, marginBottom: 6, fontWeight: 600 }}>
                        {c.severity}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{c.title}</div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: cfg.color, lineHeight: 1, textShadow: `0 0 20px ${cfg.color}60` }}>
                        {c.riskPoints}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginTop: 2 }}>/100 risk</div>
                    </div>
                  );
                })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
              {Object.entries(SEV_CONFIG).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink2)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color }} />
                  {key}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BENCHMARKS TAB */}
        {tab === 'benchmarks' && (
          <div style={{ padding: '28px 32px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>Industry Benchmarking</h3>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 24, fontFamily: 'var(--mono)' }}>How this contract compares to market standards</p>

            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 16, padding: '8px 16px', marginBottom: 4 }}>
              {['Term', 'Your Contract', 'Industry Standard', 'Impact'].map((h, i) => (
                <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink3)' }}>{h}</div>
              ))}
            </div>

            {(analysis.benchmarks || []).map((b, i) => {
              const devColor = b.deviation === 'HIGH' ? 'var(--red)' : b.deviation === 'MEDIUM' ? 'var(--amber)' : b.deviation === 'LOW' ? 'var(--purple)' : 'var(--green)';
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 16,
                  padding: '14px 16px', borderBottom: '1px solid var(--border)',
                  borderRadius: 8, transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {b.deviation !== 'NONE' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: devColor, display: 'inline-block', flexShrink: 0 }} />}
                    {b.term}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: devColor }}>{b.yours}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>{b.standard}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>{b.verdict}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* EXPOSURE TAB */}
        {tab === 'exposure' && (
          <div style={{ padding: '28px 32px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>Financial Exposure Analysis</h3>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 28, fontFamily: 'var(--mono)' }}>Estimated financial risk if worst-case clauses are triggered</p>

            {analysis.financialExposure && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div style={{ padding: 24, background: 'var(--red-dim)', border: '1px solid var(--red-border)', borderRadius: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Maximum Liability</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--red)', lineHeight: 1.2 }}>{analysis.financialExposure.maxLiability || 'Unlimited'}</div>
                </div>
                <div style={{ padding: 24, background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Annual Cost Risk</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--amber)', lineHeight: 1.2 }}>{analysis.financialExposure.annualCostRisk || 'Unquantified'}</div>
                </div>
              </div>
            )}

            {analysis.financialExposure?.keyDates && analysis.financialExposure.keyDates.length > 0 && (
              <div>
                <h4 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink3)', marginBottom: 16 }}>⏰ Key Dates & Deadlines</h4>
                {analysis.financialExposure.keyDates.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 20, padding: '14px 16px',
                    borderBottom: '1px solid var(--border)', alignItems: 'flex-start'
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue)', minWidth: 150 }}>{d.event}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', minWidth: 100 }}>{d.timing}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink2)', flex: 1 }}>{d.consequence}</div>
                  </div>
                ))}
              </div>
            )}

            {analysis.negotiationPriority && (
              <div style={{ marginTop: 28 }}>
                <h4 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink3)', marginBottom: 16 }}>🎯 Negotiation Priority Order</h4>
                {analysis.negotiationPriority.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i === 0 ? 'var(--red-dim)' : i === 1 ? 'var(--amber-dim)' : 'var(--purple-dim)',
                      border: `1px solid ${i === 0 ? 'var(--red-border)' : i === 1 ? 'var(--amber-border)' : 'var(--purple-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                      color: i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--purple)'
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <ChatPanel analysis={analysis} contractText={contractText} />
        )}
      </div>
    </div>
  );
}

// ══ UPLOAD / INPUT SECTION ══
function UploadSection({ onAnalyze, analyzing }) {
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API}/api/upload-pdf`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) setText(data.text);
      else alert(data.error || 'Upload failed');
    } catch {
      alert('Upload failed — ensure backend is running');
    }
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)',
          letterSpacing: '0.18em', textTransform: 'uppercase', padding: '6px 18px',
          background: 'var(--blue-dim)', borderRadius: 100, border: '1px solid var(--blue-border)', marginBottom: 24
        }}>
          ⚖️ AI Contract Intelligence
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(40px, 7vw, 72px)',
          fontWeight: 400, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 20
        }}>
          Never Sign a <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, var(--blue), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bad Contract</em><br />Again
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink2)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 40px' }}>
          Paste any contract. ClauseIQ identifies risks, rewrites dangerous clauses, benchmarks against industry standards, and gives you a negotiation strategy — in seconds.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['7-10', 'Clauses Analyzed'], ['< 30s', 'Analysis Time'], ['100%', 'AI-Powered']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'left', borderLeft: '2px solid var(--blue)', paddingLeft: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 26 }}>{n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink3)', marginTop: 2, letterSpacing: '0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Drop zone */}
        <div style={{ padding: '36px 40px 0' }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'var(--blue-dim)' : 'rgba(0,0,0,0.15)',
              transition: 'all 0.3s', position: 'relative'
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 28, marginBottom: 10 }}>{uploading ? '⏳' : '📄'}</div>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 400, marginBottom: 4 }}>
              {uploading ? 'Extracting text...' : 'Drop contract file here'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink3)' }}>PDF, TXT, DOC — or paste below</p>
          </div>

          <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink3)', margin: '20px 0', letterSpacing: '0.12em' }}>
            — or paste contract text —
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your contract text here..."
            style={{
              width: '100%', height: 220, background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border)', borderRadius: 10, padding: '16px',
              fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7,
              color: 'var(--ink)', resize: 'vertical', outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Action row */}
        <div style={{ padding: '20px 40px 36px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onAnalyze(text)}
            disabled={analyzing || text.length < 50}
            style={{
              background: analyzing || text.length < 50 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, var(--blue), var(--violet))',
              border: 'none', borderRadius: 10, padding: '14px 32px',
              color: analyzing || text.length < 50 ? 'var(--ink3)' : 'white',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: analyzing || text.length < 50 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: analyzing || text.length < 50 ? 'none' : '0 4px 20px rgba(59,130,246,0.35)'
            }}
          >
            {analyzing ? <><Spinner size={16} /> Analyzing with AI...</> : '⚖️ Analyze Contract'}
          </button>
          <button
            onClick={() => setText(SAMPLE_CONTRACT)}
            style={{
              background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
              padding: '13px 20px', color: 'var(--ink2)', fontFamily: 'var(--sans)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--ink2)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; }}
          >
            Load Demo Contract
          </button>
          {text.length > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink3)' }}>{text.length.toLocaleString()} chars</span>}
        </div>
      </div>
    </div>
  );
}

// ══ LOADING SCREEN ══
function LoadingScreen() {
  const STEPS = [
    { id: 1, text: 'Parsing contract structure...' },
    { id: 2, text: 'Identifying risky clauses...' },
    { id: 3, text: 'Benchmarking against industry standards...' },
    { id: 4, text: 'Calculating financial exposure...' },
    { id: 5, text: 'Generating negotiation strategies...' },
    { id: 6, text: 'Compiling final report...' },
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev > 0) setDoneSteps(d => [...d, prev]);
        return prev < STEPS.length ? prev + 1 : prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 8 }}>Analyzing Contract</div>
        <p style={{ color: 'var(--ink2)', fontSize: 14 }}>AI is reviewing your contract for risks...</p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
        {STEPS.map((step) => {
          const isDone = doneSteps.includes(step.id);
          const isActive = activeStep === step.id;
          return (
            <div key={step.id} style={{
              display: 'flex', gap: 14, alignItems: 'center',
              padding: '11px 0', borderBottom: step.id < STEPS.length ? '1px solid var(--border)' : 'none',
              transition: 'all 0.4s', transform: isActive ? 'translateX(6px)' : 'none'
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? 'var(--green-dim)' : isActive ? 'var(--blue-dim)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isDone ? 'var(--green-border)' : isActive ? 'var(--blue-border)' : 'var(--border)'}`,
                fontSize: 11,
                color: isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--ink3)'
              }}>
                {isDone ? '✓' : isActive ? <Spinner size={12} /> : step.id}
              </div>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 12,
                color: isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--ink3)',
                transition: 'color 0.3s'
              }}>
                {step.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══ ROOT APP ══
export default function App() {
  const [state, setState] = useState('upload'); // upload | analyzing | results
  const [analysis, setAnalysis] = useState(null);
  const [contractText, setContractText] = useState('');
  const [error, setError] = useState('');

  const analyze = useCallback(async (text) => {
    if (!text || text.length < 50) { setError('Please paste a contract first.'); return; }
    setContractText(text);
    setError('');
    setState('analyzing');

    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: text })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setState('results');
      } else {
        setError(data.error || 'Analysis failed.');
        setState('upload');
      }
    } catch (e) {
      setError('Cannot reach backend. Make sure the server is running on port 3001.');
      setState('upload');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'var(--blue)', filter: 'blur(160px)', opacity: 0.1 }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'var(--violet)', filter: 'blur(160px)', opacity: 0.1 }} />
      </div>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div
          onClick={() => { setState('upload'); setAnalysis(null); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 22 }}>⚖️</span>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400,
            background: 'linear-gradient(135deg, var(--blue), var(--violet))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>ClauseIQ</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)',
            background: 'var(--blue-dim)', border: '1px solid var(--blue-border)',
            padding: '5px 12px', borderRadius: 20, letterSpacing: '0.08em'
          }}>
            gemini-2.5-flash
          </span>
          {state === 'results' && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid var(--green-border)', padding: '5px 12px', borderRadius: 20 }}>
              ✓ Analysis Ready
            </span>
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {error && (
          <div style={{
            maxWidth: 700, margin: '20px auto 0', padding: '0 24px'
          }}>
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red-border)',
              borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#FCA5A5',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          </div>
        )}

        {state === 'upload' && <UploadSection onAnalyze={analyze} analyzing={false} />}
        {state === 'analyzing' && <LoadingScreen />}
        {state === 'results' && analysis && (
          <ResultsPanel
            analysis={analysis}
            contractText={contractText}
            onReset={() => { setState('upload'); setAnalysis(null); }}
          />
        )}
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)',
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.08em'
      }}>
        ClauseIQ · AI Contract Intelligence · Powered by Gemini 2.5 Flash
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
