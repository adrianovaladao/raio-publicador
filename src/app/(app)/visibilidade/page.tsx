"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Brand = { id: string; name: string; segment: string | null; logoUrl?: string | null; color?: string | null };
type AIResult = { found: boolean; excerpt: string; error?: string };
type CheckResult = {
  results: { openai: AIResult; gemini: AIResult; claude: AIResult };
  foundCount: number; totalEngines: number; freeChecksUsed: number; freeChecksTotal: number; creditsUsed: number;
};
type HistoryItem = {
  id: string; companyName: string; segment: string; city?: string;
  results: { openai: AIResult; gemini: AIResult; claude: AIResult };
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
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-1.785-.121-.952-.17-.428-.244-.151-.462.414-.827.993-.462 1.165.17.055.012 1.834.389 2.024.414 1.5.316h.097l.012-.121-.146-.146-1.08-1.067-1.64-1.567-1.2-1.2-.987-1.056-.414-.827.098-.717.552-.49.717.044.661.46.496.415 1.253 1.08 1.19 1.044 1.359 1.308.158.122h.097v-.158l-.122-.389-.316-1.68-.389-2.084-.244-1.603-.012-.9.42-.79.717-.195.734.317.432.722.207 1.299.336 1.906.42 2.254.17 1.04.097.012.158-.146.316-.645.766-1.567 1.055-1.896 1.044-1.834.613-.79.766-.195.717.39.244.717-.244.746-.851 1.372-.8 1.311-.899 1.603-.42.814-.97.207.085.17 1.02-.146 2.084-.195 1.603-.085 1.52.049.73.317.63.619.158.84-.437.465-1.08.085-1.286-.122-2.254-.244-1.615-.195-.88v-.097l.097-.049.766.512 1.603 1.14 1.737 1.19 1.31 1.006.955.998.17.717-.39.59-.736.097-.69-.244-1.372-1.08-1.237-.998-1.737-1.359-.146-.097-.085.073-.012.146.42.924.814 1.834.766 1.737.556 1.737.146.9-.27.717-.638.39-.765-.146-.528-.462-1.068-2.157-.801-1.823-.813-1.967-.146-.244h-.122l-.46 1.08-.961 2.084-.961 1.956-.858 1.579-.686.9-.79.39-.79-.17-.49-.6.146-.9.42-.827.961-1.714.766-1.567.84-1.906.42-1.08v-.146l-.073.012-1.08 1.14-1.555 1.615-1.396 1.408-1.14 1.03-.998.669-.79.097-.6-.462-.049-.717.39-.747.936-.912 1.14-1.08 1.444-1.396 1.2-1.2 1.08-1.056.56-.613-.012-.085-.17.012-1.69.364-2.23.486-1.482.316-.79-.049-.661-.462-.122-.717.42-.6.814-.293.985.146 2.096.413 1.86.39 1.067.207.097-.012.012-.085-.085-.195-1.117-1.067-1.286-1.287-1.14-1.19-.717-.9-.195-.79.39-.6.692-.134"/>
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
  const [brands, setBrands]       = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [city, setCity]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<CheckResult | null>(null);
  const [error, setError]         = useState("");
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [freeChecksUsed, setFreeChecksUsed] = useState(0);
  const [animScores, setAnimScores] = useState({ vis: 0, auth: 0, rel: 0 });

  const freeLeft = Math.max(0, 3 - freeChecksUsed);
  const CORAL = "#FAB500", BLUE = "#2A6FDB", GREEN = "#2F8A5B";

  // Carrega marcas e histórico
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

  // Anima scores quando resultado chega
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

  async function handleAnalyze() {
    if (!activeBrand) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAnimScores({ vis: 0, auth: 0, rel: 0 });
    try {
      const res = await fetch("/api/visibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: activeBrand.name, segment: activeBrand.segment ?? "", city }),
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

  // Histórico de scores de visibilidade para sparkline
  const visHistory = history.slice(0, 6).reverse().map(h => {
    const f = [h.results.openai, h.results.gemini, h.results.claude].filter(x => x.found).length;
    return Math.round((f / 3) * 100);
  });

  const lastCheck = history[0];
  const lastVis = lastCheck
    ? Math.round(([lastCheck.results.openai, lastCheck.results.gemini, lastCheck.results.claude].filter(x => x.found).length / 3) * 100)
    : null;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 64px" }}>

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
            <select value={activeBrand?.id ?? ""} onChange={e => setActiveBrand(brands.find(b => b.id === e.target.value) ?? null)}
              style={{ padding: "7px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)", fontSize: 13, background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--sans)", cursor: "pointer" }}>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <span style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: freeLeft > 0 ? "var(--green-soft)" : "var(--amber-soft)",
            color: freeLeft > 0 ? "var(--green)" : "var(--coral-ink)",
          }}>
            {freeLeft > 0 ? `${freeLeft} grátis este mês` : "50 créditos/análise"}
          </span>
        </div>
      </div>

      {/* ── KPI Cards (último diagnóstico ou placeholder) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { key: "vis", label: "Visibilidade", sub: "Mencionada nas IAs", color: CORAL, val: result ? animScores.vis : lastVis ?? 0, hist: visHistory },
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
        padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow-sm)",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {activeBrand ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{activeBrand.name}</div>
              <div style={{ fontSize: 13, color: "var(--stone)", marginTop: 2 }}>
                {activeBrand.segment ?? "Sem segmento"}
                {city ? ` · ${city}` : ""}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--stone)", fontSize: 14 }}>Carregando marca…</div>
          )}
        </div>
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade (opcional)"
          style={{ padding: "9px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-3)", fontSize: 14, background: "var(--bg)", fontFamily: "var(--sans)", color: "var(--ink)", width: 180 }} />
        <button onClick={handleAnalyze} disabled={loading || !activeBrand} style={{
          padding: "10px 24px", background: loading ? "var(--sand)" : "var(--ink)", color: "#fff",
          borderRadius: "var(--r-sm)", border: "none", fontSize: 14, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--sans)",
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          {loading ? "Analisando…" : "Analisar agora"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--r-sm)", background: "var(--red-soft)", color: "var(--red)", fontSize: 13, marginBottom: 24 }}>{error}</div>
      )}

      {/* ── Resultado detalhado ── */}
      {result && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", padding: 24, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Visibilidade por IA
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(["openai", "gemini", "claude"] as const).map(engine => {
              const r = result.results[engine];
              const labels = { openai: "ChatGPT", gemini: "Gemini", claude: "Claude" };
              return (
                <div key={engine} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                  borderRadius: "var(--r-sm)", background: "var(--bg)", border: "1px solid var(--line)",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: r.found ? "var(--ink)" : "var(--sand)", color: r.found ? "#fff" : "var(--stone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AILogo engine={engine} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.excerpt ? 6 : 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{labels[engine]}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: r.error ? "var(--red-soft)" : r.found ? "var(--green-soft)" : "var(--line)", color: r.error ? "var(--red)" : r.found ? "var(--green)" : "var(--stone)" }}>
                        {r.error ? "Erro" : r.found ? "Mencionada ✓" : "Não encontrada"}
                      </span>
                    </div>
                    {r.excerpt && <p style={{ fontSize: 13, color: "var(--stone)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{r.excerpt}&rdquo;</p>}
                    {r.error && <p style={{ fontSize: 12, color: "var(--stone)", margin: 0 }}>{r.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {result.foundCount === 0 && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "var(--amber-soft)", color: "var(--coral-ink)", fontSize: 13, lineHeight: 1.5 }}>
              💡 <strong>Sua marca ainda não aparece nas IAs.</strong> Publicar releases com regularidade em portais de grande alcance é o caminho para mudar isso.
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["Data", "Marca", "ChatGPT", "Gemini", "Claude", "Score"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", borderBottom: "1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => {
                const r = item.results;
                const found = [r.openai, r.gemini, r.claude].filter(x => x.found).length;
                const vis = Math.round((found / 3) * 100);
                return (
                  <tr key={item.id} style={{ borderBottom: i < history.length - 1 ? "1px solid var(--line)" : "none", background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--stone)", whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{item.companyName}</td>
                    {(["openai", "gemini", "claude"] as const).map(e => (
                      <td key={e} style={{ padding: "12px 16px" }}>
                        {r[e].error ? <span style={{ fontSize: 12, color: "var(--stone)" }}>—</span>
                          : r[e].found
                          ? <span style={{ color: "var(--green)", fontSize: 16 }}>✓</span>
                          : <span style={{ color: "var(--sand)", fontSize: 16 }}>✕</span>}
                      </td>
                    ))}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: vis >= 67 ? "var(--green)" : vis >= 33 ? "var(--coral-ink)" : "var(--stone)" }}>
                        {vis}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
