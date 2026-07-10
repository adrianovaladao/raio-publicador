"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Coins, Building2, Users, Newspaper, Zap } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import "./onboarding.css";

interface Props {
  planId: string;
  label: string;
  priceBRL: string;
  credits: number;
  brandsLimit: number;
  editorsLimit: number;
  reviewersLimit: number;
  tierAIncluded: number;
}

export default function CheckoutConfirmClient({
  planId, label, priceBRL, credits, brandsLimit, editorsLimit, reviewersLimit, tierAIncluded,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao iniciar pagamento.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Coins,     text: `${credits.toLocaleString("pt-BR")} créditos mensais` },
    { icon: Building2, text: `${brandsLimit} marca${brandsLimit > 1 ? "s" : ""}` },
    { icon: Newspaper, text: `${tierAIncluded} publicações/mês em veículos Tier A` },
    { icon: Users,     text: `${editorsLimit} editor${editorsLimit > 1 ? "es" : ""} · ${reviewersLimit} revisor${reviewersLimit > 1 ? "es" : ""}` },
  ];

  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="onb">
        <span className="bg-glow" />
        <header className="onb-top">
          <Link className="lock" href="/" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={27} variant="dark" />
          </Link>
        </header>
        <main className="onb-body">
          <div className="onb-card narrow" style={{ textAlign: "center" }}>
            <div className="onb-head">
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 14, background: "rgba(250,181,0,0.12)", marginBottom: 18 }}>
                <Zap size={26} style={{ color: "var(--coral)" }} />
              </div>
              <h1>Confirme sua <em>assinatura</em></h1>
              <p className="sub">Revise os detalhes do plano antes de prosseguir para o pagamento.</p>
            </div>

            {/* Plan card */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "28px 28px 24px",
              textAlign: "left",
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 6 }}>
                    Plano selecionado
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--tx)" }}>
                    {label}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--coral)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {priceBRL}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--tx-3)", marginTop: 4 }}>por mês</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {features.map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(250,181,0,0.1)",
                      display: "grid", placeItems: "center", flexShrink: 0,
                    }}>
                      <Icon size={15} style={{ color: "var(--coral)" }} />
                    </span>
                    <span style={{ fontSize: 14.5, color: "var(--tx-2)", fontWeight: 500 }}>{text}</span>
                    <Check size={14} style={{ color: "#2F8A5B", marginLeft: "auto", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ color: "var(--red, #c0392b)", fontSize: 13, marginBottom: 16 }}>{error}</p>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirm}
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
            >
              {loading ? "Redirecionando…" : <><span>Confirmar e pagar</span><ArrowRight size={17} /></>}
            </button>

            <Link
              href="/site#planos"
              style={{ fontSize: 13.5, color: "var(--tx-3)", textDecoration: "none", display: "inline-block" }}
            >
              Mudar de plano
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
