"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/plans";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { CreditCard, QrCode, Check, ArrowLeft, Zap } from "lucide-react";

const PLAN_FEATURES: Record<string, string[]> = {
  BASIC:        ["200 créditos/mês", "Até 2 marcas", "1 admin + 1 editor", "Centenas de veículos", "Até 2 publicações em portais categoria A"],
  ADVANCED:     ["1.000 créditos/mês", "Até 5 marcas", "3 editores", "Relatórios de desempenho", "Até 10 publicações em portais categoria A"],
  PROFESSIONAL: ["2.000 créditos/mês", "Até 10 marcas", "5 editores", "Relatórios + exportação", "Até 20 publicações em portais categoria A"],
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
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--stone)" }}>Plano não encontrado.</p>
      </div>
    );
  }

  const features = PLAN_FEATURES[planId] ?? [];
  const priceFmt = (plan.priceCents / 100).toLocaleString("pt-BR");

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
          cancelUrl: `${window.location.origin}/checkout/${plano}`,
        }),
      });
      const data = await res.json();
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
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg, #fff)",
    }}>
      {/* Header */}
      <header style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--line, #e5e7eb)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        <Link href="/dashboard" style={{ display: "flex", color: "inherit", textDecoration: "none" }}>
          <RaioLockup height={28} />
        </Link>
      </header>

      {/* Body */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: 32,
      }}>
        {/* Plan card */}
        <div style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid var(--line, #e5e7eb)",
          borderRadius: 16,
          padding: "28px 28px 24px",
          background: "var(--bg, #fff)",
        }}>
          <p style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone, #6b7280)", margin: "0 0 8px" }}>
            Plano selecionado
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
            {plan.label}
          </h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "0 0 20px" }}>
            <span style={{ fontSize: 13, color: "var(--stone)", fontWeight: 500 }}>R$</span>
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{priceFmt}</span>
            <span style={{ fontSize: 13, color: "var(--stone)" }}>/mês</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "var(--stone)", fontSize: 13 }}>
            <Zap size={14} style={{ color: "#F59E0B" }} />
            <span style={{ fontWeight: 600 }}>{plan.credits} créditos/mês</span>
          </div>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {features.map((f, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg, #111)" }}>
                <Check size={14} style={{ color: "#2F8A5B", flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment buttons */}
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "var(--stone)", margin: "0 0 4px", textAlign: "center" }}>
            Como deseja pagar?
          </p>

          <button
            onClick={handleCard}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px 20px",
              background: loading ? "var(--line)" : "#111",
              color: "#fff",
              border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <CreditCard size={18} />
            {loading ? "Redirecionando…" : "Pagar com cartão"}
          </button>

          <button
            onClick={() => router.push(`/pix/${plano}`)}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px 20px",
              background: "transparent",
              color: "var(--fg, #111)",
              border: "1px solid var(--line, #e5e7eb)", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <QrCode size={18} />
            Pagar com Pix
          </button>

          {err && (
            <p style={{ fontSize: 13, color: "#dc2626", background: "#fee2e2", borderRadius: 8, padding: "10px 14px", margin: 0 }}>
              {err}
            </p>
          )}

          <button
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "12px 20px",
              background: "transparent",
              color: "var(--stone, #6b7280)",
              border: "none", borderRadius: 12,
              fontSize: 13, cursor: "pointer", marginTop: 4,
            }}
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
