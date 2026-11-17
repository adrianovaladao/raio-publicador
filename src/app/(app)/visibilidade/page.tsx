"use client";
import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AIResult = { found: boolean; excerpt: string; error?: string };

type DiagnosisResult = {
  results: { openai: AIResult; gemini: AIResult; claude: AIResult };
  foundCount: number;
  totalEngines: number;
  freeChecksUsed: number;
  freeChecksTotal: number;
  creditsUsed: number;
  scores?: { visibility: number; authority: number; relevance: number };
};

type HistoryItem = {
  id: string;
  companyName: string;
  segment: string;
  city?: string;
  results: { openai: AIResult; gemini: AIResult; claude: AIResult };
  creditsUsed: number;
  createdAt: string;
};

// ─── Gauge animado ────────────────────────────────────────────────────────────

function GaugeChart({ score, label, sublabel, color, delay = 0 }: {
  score: number; label: string; sublabel: string; color: string; delay?: number;
}) {
  const [animated, setAnimated] = useState(0);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200;
      const startTime = performance.now();
      function step(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setAnimated(Math.round(ease * score));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const r = 54;
  const circ = 2 * Math.PI * r;
  // Gauge de 180° (semicírculo superior)
  const arcLen = circ * 0.75;
  const filled = (animated / 100) * arcLen;
  const dash = `${filled} ${arcLen - filled}`;
  const offset = circ * 0.625; // rotaciona para começar de baixo-esquerda

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="var(--line-2)"
            strokeWidth="10"
            strokeDasharray={`${arcLen} ${circ - arcLen}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            ref={ref}
            cx="70" cy="70" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.05s linear" }}
          />
        </svg>
        {/* Score no centro */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          paddingTop: 8,
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>
            {animated}
          </span>
          <span style={{ fontSize: 11, color: "var(--stone)", fontWeight: 500 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 2, maxWidth: 120, lineHeight: 1.4 }}>{sublabel}</div>
      </div>
    </div>
  );
}

// ─── Barra de AI ──────────────────────────────────────────────────────────────

function AILogo({ engine }: { engine: "openai" | "gemini" | "claude" }) {
  if (engine === "openai") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.677a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
  if (engine === "gemini") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"/>
    </svg>
  );
  // claude
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-1.785-.121-.952-.17-.428-.244-.151-.462.414-.827.993-.462 1.165.17.055.012 1.834.389 2.024.414 1.5.316h.097l.012-.121-.146-.146-1.08-1.067-1.64-1.567-1.2-1.2-.987-1.056-.414-.827.098-.717.552-.49.717.044.661.46.496.415 1.253 1.08 1.19 1.044 1.359 1.308.158.122h.097v-.158l-.122-.389-.316-1.68-.389-2.084-.244-1.603-.012-.9.42-.79.717-.195.734.317.432.722.207 1.299.336 1.906.42 2.254.17 1.04.097.012.158-.146.316-.645.766-1.567 1.055-1.896 1.044-1.834.613-.79.766-.195.717.39.244.717-.244.746-.851 1.372-.8 1.311-.899 1.603-.42.814-.97.207.085.17 1.02-.146 2.084-.195 1.603-.085 1.52.049.73.317.63.619.158.84-.437.465-1.08.085-1.286-.122-2.254-.244-1.615-.195-.88v-.097l.097-.049.766.512 1.603 1.14 1.737 1.19 1.31 1.006.955.998.17.717-.39.59-.736.097-.69-.244-1.372-1.08-1.237-.998-1.737-1.359-.146-.097-.085.073-.012.146.42.924.814 1.834.766 1.737.556 1.737.146.9-.27.717-.638.39-.765-.146-.528-.462-1.068-2.157-.801-1.823-.813-1.967-.146-.244h-.122l-.46 1.08-.961 2.084-.961 1.956-.858 1.579-.686.9-.79.39-.79-.17-.49-.6.146-.9.42-.827.961-1.714.766-1.567.84-1.906.42-1.08v-.146l-.073.012-1.08 1.14-1.555 1.615-1.396 1.408-1.14 1.03-.998.669-.79.097-.6-.462-.049-.717.39-.747.936-.912 1.14-1.08 1.444-1.396 1.2-1.2 1.08-1.056.56-.613-.012-.085-.17.012-1.69.364-2.23.486-1.482.316-.79-.049-.661-.462-.122-.717.42-.6.814-.293.985.146 2.096.413 1.86.39 1.067.207.097-.012.012-.085-.085-.195-1.117-1.067-1.286-1.287-1.14-1.19-.717-.9-.195-.79.39-.6.692-.134"/>
    </svg>
  );
}

// ─── Histórico mini ───────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(value), 100); }, [value]);
  return (
    <div style={{ height: 4, background: "var(--line)", borderRadius: 4, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VisibilidadePage() {
  const [companyName, setCompanyName] = useState("");
  const [segment, setSegment]         = useState("");
  const [city, setCity]               = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<DiagnosisResult | null>(null);
  const [error, setError]             = useState("");
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [freeChecksUsed, setFreeChecksUsed] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const freeChecksTotal = 3;

  useEffect(() => {
    fetch("/api/visibility-check")
      .then(r => r.json())
      .then(d => {
        setHistory(d.checks ?? []);
        setFreeChecksUsed(d.freeChecksUsed ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !segment.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/visibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), segment: segment.trim(), city: city.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao verificar."); return; }
      setResult(data);
      setFreeChecksUsed(data.freeChecksUsed);
      fetch("/api/visibility-check").then(r => r.json()).then(d => setHistory(d.checks ?? []));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Calcula scores
  function getScores(r: DiagnosisResult) {
    const vis = Math.round((r.foundCount / r.totalEngines) * 100);
    return { visibility: vis, authority: 0, relevance: 0 };
  }

  const scores = result ? getScores(result) : null;
  const freeLeft = Math.max(0, freeChecksTotal - freeChecksUsed);

  const CORAL  = "#FAB500";
  const BLUE   = "#2A6FDB";
  const GREEN  = "#2F8A5B";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 64px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              Diagnóstico de Presença Digital
            </h1>
            <p style={{ color: "var(--stone)", marginTop: 6, fontSize: 14, margin: "6px 0 0" }}>
              Meça como sua marca aparece nas principais IAs e portais de notícias.
            </p>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: freeLeft > 0 ? "var(--green-soft)" : "var(--amber-soft)",
            color: freeLeft > 0 ? "var(--green)" : "var(--coral-ink)",
            flexShrink: 0,
          }}>
            {freeLeft > 0
              ? `${freeLeft} diagnóstico${freeLeft !== 1 ? "s" : ""} grátis este mês`
              : "50 créditos por diagnóstico extra"}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{
        background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)",
        padding: 24, marginBottom: 32, boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Nome da empresa *
            </label>
            <input
              value={companyName} onChange={e => setCompanyName(e.target.value)} required
              placeholder="Ex: Mecânica do João"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)", fontSize: 14, background: "var(--bg)", boxSizing: "border-box", fontFamily: "var(--sans)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Segmento *
            </label>
            <input
              value={segment} onChange={e => setSegment(e.target.value)} required
              placeholder="Ex: oficina mecânica"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)", fontSize: 14, background: "var(--bg)", boxSizing: "border-box", fontFamily: "var(--sans)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cidade <span style={{ fontWeight: 400, color: "var(--stone-soft)", textTransform: "none" }}>(opcional)</span>
            </label>
            <input
              value={city} onChange={e => setCity(e.target.value)}
              placeholder="Ex: São Paulo"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)", fontSize: 14, background: "var(--bg)", boxSizing: "border-box", fontFamily: "var(--sans)", color: "var(--ink)" }}
            />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--red-soft)", color: "var(--red)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !companyName.trim() || !segment.trim()} style={{
          marginTop: 20, width: "100%", padding: "12px",
          background: loading ? "var(--sand)" : "var(--ink)",
          color: "#fff", borderRadius: "var(--r-sm)", border: "none",
          fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--sans)", letterSpacing: "0.02em",
          transition: "background 0.2s",
        }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Consultando as IAs…
            </span>
          ) : "Analisar presença digital"}
        </button>
      </form>

      {/* Resultado */}
      {result && scores && (
        <div style={{ marginBottom: 40 }}>
          {/* KPI Cards */}
          <div style={{
            background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)",
            padding: "32px 24px", boxShadow: "var(--shadow)", marginBottom: 20,
          }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {companyName}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                {scores.visibility === 0
                  ? "Presença digital não detectada"
                  : scores.visibility === 100
                  ? "Excelente presença digital!"
                  : "Presença digital em construção"}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, justifyItems: "center" }}>
              <GaugeChart score={scores.visibility} label="Visibilidade" sublabel="Mencionada pelas IAs" color={CORAL} delay={0} />
              <GaugeChart score={scores.authority} label="Autoridade" sublabel="Publicações em portais" color={BLUE} delay={200} />
              <GaugeChart score={scores.relevance} label="Relevância" sublabel="Alinhamento de pauta" color={GREEN} delay={400} />
            </div>

            {scores.authority === 0 && scores.relevance === 0 && (
              <div style={{
                marginTop: 24, padding: "12px 16px", borderRadius: "var(--r-sm)",
                background: "var(--amber-soft)", color: "var(--coral-ink)", fontSize: 13,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚡</span>
                <span>Autoridade e Relevância serão calculadas automaticamente conforme você publica releases no Raio.</span>
              </div>
            )}
          </div>

          {/* Detalhe por IA */}
          <div style={{
            background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)",
            padding: 24, boxShadow: "var(--shadow-sm)",
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Visibilidade por IA
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {(["openai", "gemini", "claude"] as const).map(engine => {
                const r = result.results[engine];
                const labels = { openai: "ChatGPT", gemini: "Gemini", claude: "Claude" };
                return (
                  <div key={engine} style={{
                    display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                    borderRadius: "var(--r-sm)", background: "var(--bg)",
                    border: `1px solid ${r.found ? "var(--line-2)" : "var(--line)"}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: r.found ? "var(--ink)" : "var(--sand)",
                      color: r.found ? "#fff" : "var(--stone)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <AILogo engine={engine} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.excerpt ? 6 : 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{labels[engine]}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                          background: r.error ? "var(--red-soft)" : r.found ? "var(--green-soft)" : "var(--line)",
                          color: r.error ? "var(--red)" : r.found ? "var(--green)" : "var(--stone)",
                        }}>
                          {r.error ? "Erro" : r.found ? "Mencionada ✓" : "Não encontrada"}
                        </span>
                      </div>
                      {r.excerpt && (
                        <p style={{ fontSize: 13, color: "var(--stone)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                          &ldquo;{r.excerpt}&rdquo;
                        </p>
                      )}
                      {r.error && <p style={{ fontSize: 12, color: "var(--stone)", margin: 0 }}>{r.error}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {!loadingHistory && history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Diagnósticos anteriores
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {history.map(item => {
              const r = item.results;
              const found = [r.openai, r.gemini, r.claude].filter(x => x.found).length;
              const vis = Math.round((found / 3) * 100);
              return (
                <div key={item.id} style={{
                  padding: "14px 16px", borderRadius: "var(--r-sm)", background: "var(--paper)",
                  border: "1px solid var(--line-2)", display: "grid", gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{item.companyName}</span>
                      <span style={{ fontSize: 12, color: "var(--stone)", marginLeft: 8 }}>
                        {item.segment}{item.city ? ` · ${item.city}` : ""} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{vis}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--stone)", width: 70, flexShrink: 0 }}>Visibilidade</span>
                    <ScoreBar value={vis} color={CORAL} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
