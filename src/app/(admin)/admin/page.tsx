"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PLANS, type PlanId } from "@/lib/plans";
import { Crown, TrendingUp, TrendingDown, Users, FileText, Zap, UserCheck, UserX, AlertTriangle } from "lucide-react";

interface Stats {
  totalUsers: number;
  byPlan: Record<string, number>;
  byStatus: Record<string, number>;
  mrr: number;
  mrrLastMonth: number;
  mrrGrowth: number | null;
  newUsersLast30: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  totalReleases: number;
  releasesByStatus: Record<string, number>;
  releasesThisMonth: number;
  totalCreditsConsumed: number;
}

function fmtBRL(cents: number) {
  return cents.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: number | null;
}) {
  return (
    <div style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ color, background: color + "18", padding: 8, borderRadius: 8, display: "flex" }}>{icon}</div>
        {trend != null && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: trend >= 0 ? "#059669" : "#DC2626" }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 2, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.raioAdmin === true;

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then((d: Stats) => setStats(d))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const S = stats;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Visão geral</h1>
        <p style={{ fontSize: 13, color: "var(--stone)", marginTop: 4 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--stone)", fontSize: 14 }}>Carregando métricas…</div>
      ) : !S ? null : (
        <>
          {/* ── Receita ── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>Receita</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <KpiCard
                label="MRR atual"
                value={fmtBRL(S.mrr)}
                sub={`Mês anterior: ${fmtBRL(S.mrrLastMonth)}`}
                icon={<TrendingUp size={18} />}
                color="#059669"
                trend={S.mrrGrowth}
              />
              <KpiCard
                label="Assinantes ativos"
                value={S.byStatus.ACTIVE ?? 0}
                sub={`de ${S.totalUsers} cadastros`}
                icon={<UserCheck size={18} />}
                color="#2563EB"
              />
              <KpiCard
                label="Inadimplentes + cancelados"
                value={(S.byStatus.PAST_DUE ?? 0) + (S.byStatus.CANCELLED ?? 0)}
                sub={`${S.byStatus.PAST_DUE ?? 0} inadimplente${S.byStatus.PAST_DUE !== 1 ? "s" : ""} · ${S.byStatus.CANCELLED ?? 0} cancelado${S.byStatus.CANCELLED !== 1 ? "s" : ""}`}
                icon={<AlertTriangle size={18} />}
                color="#DC2626"
              />
            </div>
          </section>

          {/* ── Usuários ── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>Usuários</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <KpiCard
                label="Novos este mês"
                value={S.newUsersThisMonth}
                sub={`${S.newUsersLastMonth} no mês anterior`}
                icon={<Users size={18} />}
                color="#7C3AED"
              />
              <KpiCard
                label="Inativos (sem plano)"
                value={S.byStatus.INACTIVE ?? 0}
                sub="Cadastros sem assinatura"
                icon={<UserX size={18} />}
                color="#6B7280"
              />
              <KpiCard
                label="Total de cadastros"
                value={S.totalUsers}
                sub={`${S.newUsersLast30} nos últimos 30 dias`}
                icon={<Users size={18} />}
                color="#0891B2"
              />
            </div>
          </section>

          {/* ── Planos ── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>Distribuição por plano</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {(["BASIC", "ADVANCED", "PROFESSIONAL"] as PlanId[]).map(planId => {
                const count = S.byPlan[planId] ?? 0;
                const plan  = PLANS[planId];
                const pct   = S.totalUsers > 0 ? Math.round((count / S.totalUsers) * 100) : 0;
                const colors: Record<string, { bg: string; bar: string }> = {
                  BASIC:        { bg: "#EFF6FF", bar: "#2563EB" },
                  ADVANCED:     { bg: "#F5F3FF", bar: "#7C3AED" },
                  PROFESSIONAL: { bg: "#FFF7ED", bar: "#C2410C" },
                };
                const c = colors[planId];
                return (
                  <div key={planId} style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{plan.label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>
                        {fmtBRL(plan.priceCents / 100)}/mês
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--mono)" }}>{count}</div>
                    <div style={{ marginTop: 10, height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 5 }}>{pct}% dos cadastros</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Releases e créditos ── */}
          <section>
            <h2 style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>Plataforma</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <KpiCard
                label="Releases este mês"
                value={S.releasesThisMonth}
                sub={`${S.totalReleases} no total`}
                icon={<FileText size={18} />}
                color="#0E7490"
              />
              <KpiCard
                label="Releases publicados"
                value={S.releasesByStatus.PUBLISHED ?? 0}
                sub={`${S.releasesByStatus.SCHEDULED ?? 0} agendado${S.releasesByStatus.SCHEDULED !== 1 ? "s" : ""} · ${S.releasesByStatus.DRAFT ?? 0} rascunho${S.releasesByStatus.DRAFT !== 1 ? "s" : ""}`}
                icon={<FileText size={18} />}
                color="#059669"
              />
              <KpiCard
                label="Créditos consumidos"
                value={S.totalCreditsConsumed.toLocaleString("pt-BR")}
                sub="Acumulado de todos os usuários"
                icon={<Zap size={18} />}
                color="#D97706"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
