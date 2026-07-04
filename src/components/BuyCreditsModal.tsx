"use client";

import { useState } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { X, Zap } from "lucide-react";

interface PackageDef { qty: number; label: string }

const PACKAGES: Record<string, { pricePerCr: number; packages: PackageDef[]; allowCustom: boolean }> = {
  BASIC: {
    pricePerCr: 5,
    packages: [
      { qty: 100, label: "100 créditos" },
      { qty: 50,  label: "50 créditos"  },
      { qty: 25,  label: "25 créditos"  },
    ],
    allowCustom: false,
  },
  ADVANCED: {
    pricePerCr: 3,
    packages: [
      { qty: 500, label: "500 créditos" },
      { qty: 250, label: "250 créditos" },
      { qty: 100, label: "100 créditos" },
    ],
    allowCustom: false,
  },
  PROFESSIONAL: {
    pricePerCr: 2.5,
    packages: [
      { qty: 1000, label: "1.000 créditos" },
      { qty: 500,  label: "500 créditos"   },
      { qty: 250,  label: "250 créditos"   },
    ],
    allowCustom: true,
  },
};

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BuyCreditsModal({ currentPlan, onClose, returnUrl }: { currentPlan: string; onClose: () => void; returnUrl?: string }) {
  useEscapeKey(onClose);
  const config = PACKAGES[currentPlan];
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  if (!config) return null;

  const customQty = parseInt(custom.replace(/\D/g, ""), 10);
  const effectiveQty = selected !== null ? selected : (config.allowCustom && customQty >= 1000 ? customQty : null);
  const totalCents = effectiveQty ? Math.round(effectiveQty * config.pricePerCr * 100) : null;

  async function handleBuy() {
    if (!effectiveQty) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: effectiveQty, returnUrl: returnUrl ?? window.location.href }),
      });
      const data = await res.json() as { redirect?: boolean; url?: string; error?: string };
      if (data.redirect && data.url) { window.location.href = data.url; return; }
      setError(data.error ?? "Não foi possível iniciar o pagamento. Tente novamente.");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Comprar <em>créditos</em> avulsos</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="m-body" style={{ paddingTop: 8, paddingBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--stone)", marginBottom: 20 }}>
            No seu plano, cada crédito custa <b style={{ color: "var(--ink)" }}>R$ {config.pricePerCr.toFixed(2).replace(".", ",")}</b>.
            Os créditos são adicionados imediatamente ao seu saldo.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: config.allowCustom ? 16 : 20 }}>
            {config.packages.map(pkg => {
              const priceCents = Math.round(pkg.qty * config.pricePerCr * 100);
              const isSel = selected === pkg.qty;
              const isHov = hovered === pkg.qty;
              return (
                <button
                  key={pkg.qty}
                  onClick={() => { setSelected(isSel ? null : pkg.qty); setCustom(""); }}
                  onMouseEnter={() => setHovered(pkg.qty)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: `1.5px solid ${isSel ? "var(--coral)" : "var(--line)"}`,
                    borderRadius: 12, padding: "14px 16px", background: isSel ? "var(--amber-soft)" : isHov ? "rgba(0,0,0,0.04)" : "transparent",
                    cursor: "pointer", transition: "background 0.12s, border-color 0.12s", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--coral)", display: "flex" }}><Zap size={16} /></span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{pkg.label}</span>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: isSel ? "var(--coral-ink)" : "var(--ink)" }}>
                    {fmtBRL(priceCents)}
                  </span>
                </button>
              );
            })}
          </div>

          {config.allowCustom && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 8 }}>
                Quantidade personalizada (mín. 1.000)
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  className="input"
                  placeholder="Ex: 2.000"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setSelected(null); }}
                  style={{ flex: 1, padding: "10px 14px", fontSize: 14 }}
                />
                {custom && customQty >= 1000 && (
                  <span style={{ display: "flex", alignItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "var(--coral-ink)", whiteSpace: "nowrap" }}>
                    {fmtBRL(Math.round(customQty * config.pricePerCr * 100))}
                  </span>
                )}
              </div>
              {custom && customQty > 0 && customQty < 1000 && (
                <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>Mínimo de 1.000 créditos para compra personalizada.</p>
              )}
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
              {error}
            </p>
          )}

          <button
            className="btn btn-primary btn-block"
            style={{ justifyContent: "center", fontSize: 15 }}
            disabled={!effectiveQty || loading}
            onClick={handleBuy}
          >
            {loading ? "Aguarde…" : effectiveQty ? `Comprar ${effectiveQty.toLocaleString("pt-BR")} créditos · ${fmtBRL(totalCents!)}` : "Selecione um pacote"}
          </button>

          <p style={{ fontSize: 12, color: "var(--stone)", textAlign: "center", marginTop: 12 }}>
            Pagamento único via Stripe. Créditos válidos até o fim do ciclo de assinatura atual.
          </p>
        </div>
      </div>
    </div>
  );
}
