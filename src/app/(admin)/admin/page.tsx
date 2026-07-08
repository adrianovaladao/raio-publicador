"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PLANS, type PlanId } from "@/lib/plans";
import { isAnyAdmin } from "@/lib/admin";
import {
  TrendingUp, TrendingDown, Users, FileText, Zap,
  UserCheck, UserX, AlertTriangle, Crown,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  byPlan: Record<string, number>;
  byStatus: Record<string, number>;
  mrr: number;
  mrrLastMonth: number;
  mrrGrowth: number | null;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  newUsersLast30: number;
  totalReleases: number;
  releasesByStatus: Record<string, number>;
  releasesThisMonth: number;
  totalCreditsConsumed: number;
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({ icon: Icon, label, val, sub, delta }: {
  icon: React.ElementType; label: string; val: string | number;
  sub?: string; delta?: number | null;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="card kpi">
      <div className="ic"><Icon size={19} /></div>
      <div className="lbl">{label}</div>
      <div className="val">{val}</div>
      {delta != null ? (
        <div className={`delta ${up ? "up" : "down"}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {up ? "+" : ""}{delta}% <span className="muted">· vs mês anterior</span>
        </div>
      ) : sub ? (
        <div className="delta muted" style={{ fontSize: 12, fontWeight: 400 }}>{sub}</div>
      ) : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const isAdmin = isAnyAdmin(user?.publicMetadata as Record<string, unknown>);

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
    <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const S = stats;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2>Visão <em>geral</em></h2>
            <p className="sub">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando métricas…</div></div>
        ) : !S ? null : (
          <>
            {/* ── Receita ── */}
            <p className="eyebrow" style={{ marginBottom: 12 }}>Receita</p>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <KpiCard icon={TrendingUp}    label="MRR atual"               val={fmtBRL(S.mrr)}                         delta={S.mrrGrowth} />
              <KpiCard icon={UserCheck}     label="Assinantes ativos"       val={S.byStatus.ACTIVE ?? 0}                sub={`de ${S.totalUsers} cadastros`} />
              <KpiCard icon={AlertTriangle} label="Inadimplentes + cancelados" val={(S.byStatus.PAST_DUE ?? 0) + (S.byStatus.CANCELLED ?? 0)}
                sub={`${S.byStatus.PAST_DUE ?? 0} inadimplentes · ${S.byStatus.CANCELLED ?? 0} cancelados`} />
            </div>

            {/* ── Usuários ── */}
            <p className="eyebrow" style={{ marginTop: 28, marginBottom: 12 }}>Usuários</p>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <KpiCard icon={Users}  label="Novos este mês"       val={S.newUsersThisMonth}  sub={`${S.newUsersLastMonth} no mês anterior`} />
              <KpiCard icon={UserX}  label="Inativos (sem plano)" val={S.byStatus.INACTIVE ?? 0} sub="Cadastros sem assinatura" />
              <KpiCard icon={Users}  label="Total de cadastros"   val={S.totalUsers}         sub={`${S.newUsersLast30} nos últimos 30 dias`} />
            </div>

            {/* ── Planos ── */}
            <p className="eyebrow" style={{ marginTop: 28, marginBottom: 12 }}>Distribuição por plano</p>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 28 }}>
              {(["BASIC", "ADVANCED", "PROFESSIONAL"] as PlanId[]).map(planId => {
                const count = S.byPlan[planId] ?? 0;
                const plan  = PLANS[planId];
                const pct   = S.totalUsers > 0 ? Math.round((count / S.totalUsers) * 100) : 0;
                const bars: Record<string, string> = { BASIC: "#2563EB", ADVANCED: "#7C3AED", PROFESSIONAL: "#C2410C" };
                return (
                  <div key={planId} className="card" style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{plan.label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>
                        {fmtBRL(plan.priceCents)}/mês
                      </span>
                    </div>
                    <div style={{ fontSize: 33, fontWeight: 700, fontFamily: "var(--sans)", letterSpacing: "-0.03em" }}>{count}</div>
                    <div style={{ marginTop: 12, height: 5, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: bars[planId], borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 6, fontFamily: "var(--mono)" }}>{pct}% dos cadastros</div>
                  </div>
                );
              })}
            </div>

            {/* ── Plataforma ── */}
            <p className="eyebrow" style={{ marginBottom: 12 }}>Plataforma</p>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <KpiCard icon={FileText} label="Releases este mês"   val={S.releasesThisMonth}
                sub={`${S.totalReleases} no total`} />
              <KpiCard icon={FileText} label="Releases publicados" val={S.releasesByStatus.PUBLISHED ?? 0}
                sub={`${S.releasesByStatus.SCHEDULED ?? 0} agendados · ${S.releasesByStatus.DRAFT ?? 0} rascunhos`} />
              <KpiCard icon={Zap}      label="Créditos consumidos" val={(S.totalCreditsConsumed ?? 0).toLocaleString("pt-BR")}
                sub="Acumulado de todos os usuários" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
