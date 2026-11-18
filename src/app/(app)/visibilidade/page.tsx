"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Brand = { id: string; name: string; segment: string | null; logoUrl?: string | null; color?: string | null };
type AIResult = { found: boolean; excerpt: string; error?: string };
type CheckResult = {
  results: { openai: AIResult; gemini: AIResult; claude: AIResult; googleAI: AIResult };
  foundCount: number; totalEngines: number; freeChecksUsed: number; freeChecksTotal: number; creditsUsed: number;
};
type HistoryItem = {
  id: string; companyName: string; segment: string; city?: string;
  results: { openai: AIResult; gemini: AIResult; claude: AIResult; googleAI?: AIResult };
  creditsUsed: number; createdAt: string;
};

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function Gauge({ label, sub, color, animated }: { score?: number; label: string; sub: string; color: string; animated: number }) {
  const r = 48, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const filled = (animated / 100) * arc;
  const offset = -(circ * 0.625);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line-2)" strokeWidth="9"
            strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={offset} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${filled} ${arc - filled}`} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: "var(--ink)", fontFamily: "var(--sans)" }}>{animated}</span>
          <span style={{ fontSize: 10, color: "var(--stone)", fontWeight: 500 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── AI Logo ──────────────────────────────────────────────────────────────────

function AILogo({ engine, size = 18 }: { engine: string; size?: number }) {
  if (engine === "openai") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
  if (engine === "gemini") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"/>
    </svg>
  );
  if (engine === "googleAI") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15"/>
      <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="Georgia, serif">C</text>
    </svg>
  );
}

// ─── Trend Sparkline ──────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 80, h = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) / (values.length - 1) * w} cy={h - (values[values.length - 1] / max) * h} r="3" fill={color} />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VisibilidadePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const BETA_EMAILS = ["adrianovaladao@raiopublicador.com.br"];
  const isAdmin = !!(user?.publicMetadata as Record<string, unknown>)?.raioAdmin;
  const isBetaTester = BETA_EMAILS.includes(user?.primaryEmailAddress?.emailAddress ?? "");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin && !isBetaTester) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isAdmin, isBetaTester, router]);

  const [brands, setBrands]       = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [keyword, setKeyword]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<CheckResult | null>(null);
  const [error, setError]         = useState("");
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [freeChecksUsed, setFreeChecksUsed] = useState(0);
  const [animScores, setAnimScores] = useState({ vis: 0, auth: 0, rel: 0 });
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  const freeLeft = Math.max(0, 3 - freeChecksUsed);
  const willChargeCredits = freeLeft === 0;
  const CORAL = "#FAB500", BLUE = "#2A6FDB", GREEN = "#2F8A5B";

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      const bs: Brand[] = d.brands ?? [];
      setBrands(bs);
      if (bs.length > 0) setActiveBrand(bs[0]);
    }).catch(() => {});
    fetch("/api/visibility-check").then(r => r.json()).then(d => {
      setHistory(d.checks ?? []);
      setFreeChecksUsed(d.freeChecksUsed ?? 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!result) return;
    const vis = Math.round((result.foundCount / result.totalEngines) * 100);
    const target = { vis, auth: 0, rel: 0 };
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimScores({ vis: Math.round(ease * target.vis), auth: Math.round(ease * target.auth), rel: Math.round(ease * target.rel) });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [result]);

  const fetchHistory = useCallback(() => {
    fetch("/api/visibility-check").then(r => r.json()).then(d => {
      setHistory(d.checks ?? []);
      setFreeChecksUsed(d.freeChecksUsed ?? 0);
    }).catch(() => {});
  }, []);

  async function runAnalysis() {
    if (!activeBrand || !keyword.trim()) return;
    setShowCreditWarning(false);
    setLoading(true);
    setError("");
    setResult(null);
    setAnimScores({ vis: 0, auth: 0, rel: 0 });
    try {
      const res = await fetch("/api/visibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: activeBrand.name, segment: activeBrand.segment ?? "", keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao analisar."); return; }
      setResult(data);
      setFreeChecksUsed(data.freeChecksUsed);
      fetchHistory();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnalyzeClick() {
    if (!keyword.trim()) { setError("Informe a palavra-chave para analisar."); return; }
    setError("");
    if (willChargeCredits) {
      setShowCreditWarning(true);
    } else {
      runAnalysis();
    }
  }

  const visHistory = history.slice(0, 6).reverse().map(h => {
    const engines = [h.results.openai, h.results.gemini, h.results.claude, h.results.googleAI].filter(Boolean);
    const f = engines.filter(x => x?.found).length;
    return Math.round((f / 4) * 100);
  });

  const lastCheck = history[0];
  const lastVis = lastCheck
    ? (() => {
        const engines = [lastCheck.results.openai, lastCheck.results.gemini, lastCheck.results.claude, lastCheck.results.googleAI].filter(Boolean);
        return Math.round((engines.filter(x => x?.found).length / 4) * 100);
      })()
    : null;

  const engines = [
    { key: "googleAI" as const, label: "Google AI Overview", desc: "Citada no AI Overview do Google" },
    { key: "openai" as const,   label: "ChatGPT",            desc: "Mencionada pelo ChatGPT" },
    { key: "gemini" as const,   label: "Gemini",             desc: "Mencionada pelo Gemini" },
    { key: "claude" as const,   label: "Claude",             desc: "Mencionada pelo Claude" },
  ];

  return (
    <div className="content scroll">
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "4px 0 80px" }}>

      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Diagnóstico de Presença Digital
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
            Como sua marca aparece nas IAs?
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {brands.length > 1 && (
            <div style={{ position: "relative" }}>
              <select
                value={activeBrand?.id ?? ""}
                onChange={e => setActiveBrand(brands.find(b => b.id === e.target.value) ?? null)}
                style={{
                  appearance: "none", WebkitAppearance: "none",
                  padding: "7px 32px 7px 12px",
                  borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)",
                  fontSize: 13, background: "var(--paper)", color: "var(--ink)",
                  fontFamily: "var(--sans)", cursor: "pointer", fontWeight: 500,
                }}
              >
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--stone)" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          )}
          <span style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: freeLeft > 0 ? "#e8f5ed" : "#fef3cd",
            color: freeLeft > 0 ? "#2F8A5B" : "#7a5a00",
          }}>
            {freeLeft > 0 ? `${freeLeft} grátis este período` : "50 créditos/análise"}
          </span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { key: "vis", label: "Visibilidade IA", sub: "Score médio nos 4 canais", color: CORAL, val: result ? animScores.vis : lastVis ?? 0, hist: visHistory },
          { key: "auth", label: "Autoridade", sub: "Publicações em portais", color: BLUE, val: result ? animScores.auth : 0, hist: [] },
          { key: "rel", label: "Relevância", sub: "Alinhamento de pauta", color: GREEN, val: result ? animScores.rel : 0, hist: [] },
        ].map(kpi => (
          <div key={kpi.key} style={{
            background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)",
            padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center",
            boxShadow: "var(--shadow-sm)", gap: 0,
          }}>
            <Gauge score={kpi.val} label={kpi.label} sub={kpi.sub} color={kpi.color} animated={kpi.val} />
            {kpi.hist.length >= 2 && (
              <div style={{ marginTop: 12 }}>
                <Sparkline values={kpi.hist} color={kpi.color} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Painel de ação ── */}
      <div style={{
        background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)",
        padding: "20px 24px", marginBottom: 16, boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            {activeBrand ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{activeBrand.name}</div>
                <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 2 }}>{activeBrand.segment ?? "Sem segmento"}</div>
              </>
            ) : (
              <div style={{ color: "var(--stone)", fontSize: 14 }}>Carregando marca…</div>
            )}
          </div>
          <button onClick={handleAnalyzeClick} disabled={loading || !activeBrand} style={{
            padding: "10px 24px", background: loading ? "var(--sand)" : "var(--ink)", color: "#fff",
            borderRadius: "var(--r-sm)", border: "none", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--sans)",
            display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
            {loading ? "Analisando…" : "Analisar agora"}
          </button>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
            Palavra-chave alvo
          </label>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAnalyzeClick()}
            placeholder="Ex: representação do produtor rural pelo sindicato"
            style={{
              width: "100%", padding: "9px 14px", borderRadius: "var(--r-sm)",
              border: "1px solid var(--line-3)", fontSize: 14, background: "var(--bg)",
              fontFamily: "var(--sans)", color: "var(--ink)", boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 6 }}>
            Use a keyword do tema que você publicou. Será verificada no Google AI Overview e nas IAs conversacionais.
          </div>
        </div>
      </div>

      {/* ── Aviso de créditos ── */}
      {showCreditWarning && (
        <div style={{
          background: "#fef3cd", border: "1px solid #f0d070", borderRadius: "var(--r-sm)",
          padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#7a5a00", marginBottom: 2 }}>Você usou suas 3 análises gratuitas deste período</div>
            <div style={{ fontSize: 13, color: "#7a5a00" }}>Esta análise vai consumir <strong>50 créditos</strong>. Deseja continuar?</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowCreditWarning(false)} style={{ padding: "8px 16px", borderRadius: "var(--r-sm)", border: "1px solid #c8a800", background: "transparent", color: "#7a5a00", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={runAnalysis} style={{ padding: "8px 16px", borderRadius: "var(--r-sm)", border: "none", background: "#7a5a00", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Confirmar (50 créditos)
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--r-sm)", background: "var(--red-soft)", color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* ── Resultado detalhado ── */}
      {result && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", padding: 24, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Resultado por canal
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {engines.map(({ key, label, desc }) => {
              const r = result.results[key];
              const isGEO = key === "googleAI";
              return (
                <div key={key} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                  borderRadius: "var(--r-sm)", background: isGEO ? (r.found ? "#f0f7ff" : "var(--bg)") : "var(--bg)",
                  border: `1px solid ${isGEO ? (r.found ? "#c0d8f8" : "var(--line)") : "var(--line)"}`,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: r.found ? (isGEO ? "#1a73e8" : "var(--ink)") : "var(--sand)", color: r.found ? "#fff" : "var(--stone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AILogo engine={key} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{label}</span>
                      {isGEO && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#1a73e8", color: "#fff", letterSpacing: "0.04em" }}>GEO</span>}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: r.error ? "var(--red-soft)" : r.found ? "#e8f5ed" : "var(--line)", color: r.error ? "var(--red)" : r.found ? "#2F8A5B" : "var(--stone)" }}>
                        {r.error ? "Erro" : r.found ? "Citada ✓" : "Não citada"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--stone)", marginBottom: r.excerpt ? 6 : 0 }}>{desc}</div>
                    {r.excerpt && <p style={{ fontSize: 13, color: "var(--stone)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{r.excerpt}&rdquo;</p>}
                    {r.error && <p style={{ fontSize: 12, color: "var(--stone)", margin: 0 }}>{r.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {result.foundCount === 0 && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "#fef3cd", color: "#7a5a00", fontSize: 13, lineHeight: 1.5 }}>
              💡 <strong>Sua marca ainda não aparece nas IAs para essa keyword.</strong> Publicar releases com regularidade em portais de grande alcance é o caminho para mudar isso.
            </div>
          )}
        </div>
      )}

      {/* ── Histórico ── */}
      {history.length > 0 && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Histórico de diagnósticos</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Data", "Marca", "Keyword", "Google AI", "ChatGPT", "Gemini", "Claude", "Score"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => {
                  const r = item.results;
                  const allEngines = [r.openai, r.gemini, r.claude, r.googleAI].filter(Boolean);
                  const found = allEngines.filter(x => x?.found).length;
                  const vis = Math.round((found / 4) * 100);
                  const dot = (v: AIResult | undefined) =>
                    !v ? <span style={{ color: "var(--stone)", fontSize: 12 }}>—</span>
                    : v.error ? <span style={{ color: "var(--stone)", fontSize: 12 }}>—</span>
                    : v.found ? <span style={{ color: "#2F8A5B", fontSize: 15 }}>✓</span>
                    : <span style={{ color: "var(--sand)", fontSize: 15 }}>✕</span>;
                  return (
                    <tr key={item.id} style={{ borderBottom: i < history.length - 1 ? "1px solid var(--line)" : "none", background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--stone)", whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{item.companyName}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--stone)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.city ?? "—"}</td>
                      <td style={{ padding: "11px 14px" }}>{dot(r.googleAI)}</td>
                      <td style={{ padding: "11px 14px" }}>{dot(r.openai)}</td>
                      <td style={{ padding: "11px 14px" }}>{dot(r.gemini)}</td>
                      <td style={{ padding: "11px 14px" }}>{dot(r.claude)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: vis >= 67 ? "#2F8A5B" : vis >= 33 ? "#7a5a00" : "var(--stone)" }}>
                          {vis}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </div>
  );
}
