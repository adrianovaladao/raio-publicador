"use client";
import { useState, useEffect } from "react";

type AIResult = { found: boolean; excerpt: string; error?: string };

type CheckResult = {
  results: { openai: AIResult; gemini: AIResult; claude: AIResult };
  foundCount: number;
  totalEngines: number;
  freeChecksUsed: number;
  freeChecksTotal: number;
  creditsUsed: number;
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

const ENGINE_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const ENGINE_ICONS: Record<string, string> = {
  openai: "🟢",
  gemini: "🔵",
  claude: "🟣",
};

export default function VisibilidadePage() {
  const [companyName, setCompanyName] = useState("");
  const [segment, setSegment]         = useState("");
  const [city, setCity]               = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<CheckResult | null>(null);
  const [error, setError]             = useState("");
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [freeChecksUsed, setFreeChecksUsed] = useState(0);
  const freeChecksTotal = 3;

  useEffect(() => {
    fetch("/api/visibility-check")
      .then(r => r.json())
      .then(d => {
        setHistory(d.checks ?? []);
        setFreeChecksUsed(d.freeChecksUsed ?? 0);
      })
      .catch(() => {});
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
      if (!res.ok) {
        setError(data.error ?? "Erro ao verificar visibilidade.");
        return;
      }
      setResult(data);
      setFreeChecksUsed(data.freeChecksUsed);
      // Atualiza histórico
      fetch("/api/visibility-check")
        .then(r => r.json())
        .then(d => setHistory(d.checks ?? []));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const freeLeft = Math.max(0, freeChecksTotal - freeChecksUsed);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Verificador de Visibilidade IA</h1>
        <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>
          Descubra se sua empresa aparece quando alguém pergunta às principais IAs sobre o seu segmento.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          marginTop: 12, padding: "6px 12px", borderRadius: 20,
          background: freeLeft > 0 ? "#e8f5e9" : "#fff3e0",
          color: freeLeft > 0 ? "#2e7d32" : "#e65100",
          fontSize: 13, fontWeight: 500,
        }}>
          {freeLeft > 0
            ? `✅ ${freeLeft} verificação${freeLeft !== 1 ? "ões" : ""} gratuita${freeLeft !== 1 ? "s" : ""} restante${freeLeft !== 1 ? "s" : ""} este mês`
            : "⚡ Verificações gratuitas esgotadas — próximas custam 50 créditos"}
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 24, marginBottom: 32,
      }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Nome da empresa *
            </label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Mecânica do João"
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Segmento / nicho *
            </label>
            <input
              value={segment}
              onChange={e => setSegment(e.target.value)}
              placeholder="Ex: oficina mecânica, restaurante japonês, clínica veterinária"
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Cidade <span style={{ fontWeight: 400, color: "#9ca3af" }}>(opcional)</span>
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: São Paulo, Belo Horizonte"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        {error && (
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 8,
            background: "#fef2f2", color: "#dc2626", fontSize: 13,
          }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !companyName.trim() || !segment.trim()}
          style={{
            marginTop: 20, width: "100%", padding: "12px",
            background: loading ? "#9ca3af" : "#1a1a2e",
            color: "#fff", borderRadius: 8, border: "none",
            fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Consultando IAs…" : "Verificar visibilidade"}
        </button>
      </form>

      {/* Resultado */}
      {result && (
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: 24, marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {result.foundCount === 0
                  ? "❌ Empresa não encontrada"
                  : result.foundCount === result.totalEngines
                  ? "🎉 Empresa encontrada em todas as IAs!"
                  : `⚠️ Encontrada em ${result.foundCount} de ${result.totalEngines} IAs`}
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                {companyName} · {segment}{city ? ` · ${city}` : ""}
              </p>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: result.foundCount === 0 ? "#fef2f2" : result.foundCount === result.totalEngines ? "#e8f5e9" : "#fffbeb",
              color: result.foundCount === 0 ? "#dc2626" : result.foundCount === result.totalEngines ? "#16a34a" : "#b45309",
            }}>
              {result.foundCount}/{result.totalEngines} IAs
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {(["openai", "gemini", "claude"] as const).map(engine => {
              const r = result.results[engine];
              return (
                <div key={engine} style={{
                  padding: 16, borderRadius: 8,
                  background: r.found ? "#f0fdf4" : "#fafafa",
                  border: `1px solid ${r.found ? "#bbf7d0" : "#e5e7eb"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.excerpt ? 8 : 0 }}>
                    <span style={{ fontSize: 16 }}>{ENGINE_ICONS[engine]}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{ENGINE_LABELS[engine]}</span>
                    <span style={{
                      marginLeft: "auto", fontSize: 12, fontWeight: 600, padding: "2px 8px",
                      borderRadius: 12,
                      background: r.found ? "#dcfce7" : "#fee2e2",
                      color: r.found ? "#16a34a" : "#dc2626",
                    }}>
                      {r.error ? "Erro" : r.found ? "Mencionada" : "Não encontrada"}
                    </span>
                  </div>
                  {r.excerpt && (
                    <p style={{
                      fontSize: 13, color: "#374151", margin: 0,
                      fontStyle: "italic", lineHeight: 1.5,
                    }}>
                      &ldquo;{r.excerpt}&rdquo;
                    </p>
                  )}
                  {r.error && (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{r.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Verificações anteriores</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {history.map(item => {
              const r = item.results;
              const found = [r.openai, r.gemini, r.claude].filter(x => x.found).length;
              return (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 8, background: "#fff",
                  border: "1px solid #e5e7eb", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.companyName}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {item.segment}{item.city ? ` · ${item.city}` : ""} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {(["openai", "gemini", "claude"] as const).map(engine => (
                      <span key={engine} title={ENGINE_LABELS[engine]} style={{ fontSize: 15 }}>
                        {item.results[engine].found ? ENGINE_ICONS[engine] : "⬜"}
                      </span>
                    ))}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                    background: found === 0 ? "#fee2e2" : found === 3 ? "#dcfce7" : "#fef9c3",
                    color: found === 0 ? "#dc2626" : found === 3 ? "#16a34a" : "#854d0e",
                    flexShrink: 0,
                  }}>
                    {found}/3
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
