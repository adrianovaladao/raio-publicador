"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";

const UPGRADE_OPTIONS: Record<string, Array<{ id: string; label: string; brandsLimit: number; price: string }>> = {
  BASIC: [
    { id: "ADVANCED",     label: "Avançado",    brandsLimit: 5,  price: "R$ 3.000/mês" },
    { id: "PROFESSIONAL", label: "Profissional", brandsLimit: 10, price: "R$ 5.000/mês" },
  ],
  ADVANCED: [
    { id: "PROFESSIONAL", label: "Profissional", brandsLimit: 10, price: "R$ 5.000/mês" },
  ],
};

export function UpgradeModal({ currentPlan, onClose }: { currentPlan: string; onClose: () => void }) {
  const options = UPGRADE_OPTIONS[currentPlan] ?? [];
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setLoadingId(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json() as { ok?: boolean; redirect?: boolean; url?: string; error?: string };
      if (data.ok) { window.location.href = "/configuracoes?upgrade=success"; return; }
      if (data.redirect && data.url) { window.location.href = data.url; return; }
      setError(data.error ?? "Não foi possível processar o upgrade. Tente novamente.");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    }
    setLoadingId(null);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: options.length > 1 ? 560 : 420, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Limite de <em>marcas</em> atingido</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body" style={{ paddingTop: 8, paddingBottom: 24 }}>
          {options.length > 0 ? (
            <>
              <p style={{ fontSize: 14, color: "var(--stone)", marginBottom: 20 }}>
                Seu plano atual não permite mais marcas. Escolha um plano para continuar.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
                {options.map(opt => (
                  <div key={opt.id}
                    style={{ border: `1.5px solid var(--border)`, borderRadius: 14, padding: "20px 16px", textAlign: "left", display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.04)", cursor: "default" }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--coral-ink)", marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{opt.price}</div>
                      <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 4 }}>até {opt.brandsLimit} marcas</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm btn-block"
                      style={{ justifyContent: "center" }}
                      onClick={() => handleUpgrade(opt.id)}
                      disabled={loadingId !== null}
                    >
                      {loadingId === opt.id ? "Aguarde…" : <><span>Fazer upgrade</span><ArrowRight size={14} /></>}
                    </button>
                  </div>
                ))}
              </div>
              {error && (
                <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "10px 12px" }}>
                  {error}
                </p>
              )}
              <p style={{ fontSize: 12, color: "var(--stone)" }}>
                Você paga apenas a diferença proporcional ao tempo restante do ciclo atual.
              </p>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onClose}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "var(--stone)", marginBottom: 24 }}>
                Você já está no plano máximo. Entre em contato com nossa equipe para soluções personalizadas.
              </p>
              <button className="btn btn-primary btn-block" onClick={onClose}>Entendido</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
