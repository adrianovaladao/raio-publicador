"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { ArrowRight, ArrowLeft, Check, Coins, Building2, Users, Newspaper, Zap, QrCode } from "lucide-react";
import "../../boas-vindas/onboarding.css";

const PLAN_FEATURES: Record<string, { icon: React.ElementType; text: string }[]> = {
  BASIC: [
    { icon: Coins,     text: "200 créditos mensais" },
    { icon: Building2, text: "Até 2 marcas" },
    { icon: Newspaper, text: "Até 2 publicações em portais categoria A" },
    { icon: Users,     text: "1 editor" },
  ],
  ADVANCED: [
    { icon: Coins,     text: "1.000 créditos mensais" },
    { icon: Building2, text: "Até 5 marcas" },
    { icon: Newspaper, text: "Até 10 publicações em portais categoria A" },
    { icon: Users,     text: "3 editores" },
  ],
  PROFESSIONAL: [
    { icon: Coins,     text: "2.000 créditos mensais" },
    { icon: Building2, text: "Até 10 marcas" },
    { icon: Newspaper, text: "Até 20 publicações em portais categoria A" },
    { icon: Users,     text: "5 editores" },
  ],
};

export default function CheckoutPage() {
  const { plano } = useParams<{ plano: string }>();
  const planId = plano.toUpperCase() as PlanId;
  const plan = PLANS[planId];
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!plan) {
    return (
      <div data-theme="dark" style={{ minHeight: "100dvh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Plano não encontrado.</p>
      </div>
    );
  }

  const feeCents   = Math.round(plan.priceCents * 0.035);
  const totalCents = plan.priceCents + feeCents;
  const fmt        = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const features   = PLAN_FEATURES[planId] ?? [];

  async function handleCard() {
    if (!user) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          returnUrl: `${window.location.origin}/configuracoes?upgrade=success`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json() as { ok?: boolean; redirect?: boolean; url?: string; error?: string };
      if (!res.ok) { setErr(data?.error ?? "Erro ao redirecionar para o checkout."); return; }
      if (data.redirect && data.url) { window.location.href = data.url; return; }
      if (data.ok) { router.replace("/configuracoes?upgrade=success"); }
    } catch {
      setErr("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-theme="dark" style={{ minHeight: "100dvh", overflowY: "auto", background: "var(--ink)" }}>
      <div className="onb" style={{ minHeight: "100%" }}>
        <span className="bg-glow" />
        <header className="onb-top">
          <span className="lock" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={27} variant="dark" />
          </span>
        </header>

        <main className="onb-body">
          <div className="onb-card narrow" style={{ textAlign: "center", zoom: 1.15 }}>

            <div className="onb-head">
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(250,181,0,0.12)", marginBottom: 12 }}>
                <Zap size={22} style={{ color: "var(--coral)" }} />
              </div>
              <h1>Confirme sua <em>assinatura</em></h1>
              <p className="sub">Revise os detalhes do plano antes de prosseguir para o pagamento.</p>
            </div>

            {/* Plan summary card */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 22px 18px", textAlign: "left", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 14 }}>
                Plano selecionado
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--tx)", marginBottom: 16 }}>
                {plan.label}
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {features.map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(250,181,0,0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: "var(--coral)" }} />
                    </span>
                    <span style={{ fontSize: 14.5, color: "var(--tx-2)", fontWeight: 500 }}>{text}</span>
                    <Check size={14} style={{ color: "#2F8A5B", marginLeft: "auto", flexShrink: 0 }} />
                  </div>
                ))}
              </div>

              {/* Card fee breakdown */}
              <div style={{ marginTop: 18 }}>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 14px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 10 }}>
                    💳 Cartão de crédito
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tx-2)", marginBottom: 5 }}>
                    <span>Plano {plan.label}</span><span>{fmt(plan.priceCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tx-3)", marginBottom: 10 }}>
                    <span>Taxa de processamento (3,5%)</span><span>{fmt(feeCents)}</span>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "var(--coral)" }}>
                    <span>Total/mês</span><span>{fmt(totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {err && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, marginBottom: 16 }}>{err}</p>}

            <button className="btn btn-primary btn-lg" onClick={handleCard} disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
              {loading ? "Redirecionando…" : <><span>Pagar com cartão</span><ArrowRight size={17} /></>}
            </button>

            <button onClick={() => window.location.href = `/pix/${plano}`} disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "13px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--tx-2)", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              <QrCode size={15} /> Pagar com Pix
            </button>

            <button onClick={() => router.back()}
              style={{ background: "none", border: "none", fontSize: 13.5, color: "var(--tx-3)", cursor: "pointer", padding: "4px 8px", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <ArrowLeft size={14} /> Voltar
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, fontSize: 12, color: "var(--tx-3)", lineHeight: 1.5, textAlign: "left" }}>
              <b style={{ color: "var(--tx-2)" }}>Garantia de Satisfação (Art. 49, CDC):</b>{" "}
              Queremos que você ame o Raio. Se você cancelar em até 7 dias sem ter utilizado nenhum crédito, devolvemos 100% do seu dinheiro de forma integral.
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
