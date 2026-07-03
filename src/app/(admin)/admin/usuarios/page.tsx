"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  ArrowUp, ArrowDown, ArrowUpDown,
  Pencil, Check, X, RefreshCw, ExternalLink, ChevronDown, Crown,
} from "lucide-react";

interface UserRow {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: number;
  lastSignInAt: number | null;
  plan: PlanId;
  planLabel: string;
  status: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsAvailable: number;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

type SortCol = "name" | "plan" | "status" | "credits" | "createdAt" | "lastSignIn";
type SortDir = "asc" | "desc";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo", INACTIVE: "Inativo", PAST_DUE: "Inadimplente", CANCELLED: "Cancelado",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVE:    { bg: "#D1FAE5", fg: "#065F46" },
  INACTIVE:  { bg: "#F3F4F6", fg: "#6B7280" },
  PAST_DUE:  { bg: "#FEF3C7", fg: "#92400E" },
  CANCELLED: { bg: "#FEE2E2", fg: "#991B1B" },
};
const PLAN_COLOR: Record<string, { bg: string; fg: string }> = {
  BASIC:        { bg: "#EFF6FF", fg: "#1D4ED8" },
  ADVANCED:     { bg: "#F5F3FF", fg: "#6D28D9" },
  PROFESSIONAL: { bg: "#FFF7ED", fg: "#C2410C" },
};

function fmtDate(ts: number | string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtName(row: UserRow) {
  const n = [row.firstName, row.lastName].filter(Boolean).join(" ");
  return n || row.email.split("@")[0];
}

function EditModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [creditsTotal, setCreditsTotal] = useState(String(user.creditsTotal));
  const [creditsUsed, setCreditsUsed]   = useState(String(user.creditsUsed));
  const [plan, setPlan]                 = useState<PlanId>(user.plan);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  async function save() {
    setSaving(true); setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId: user.clerkId, creditsTotal: Number(creditsTotal), creditsUsed: Number(creditsUsed), plan }),
    });
    if (res.ok) { onSaved(); onClose(); }
    else { setError("Erro ao salvar."); setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440, marginTop: 80 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 0" }}>
          <h3>Editar usuário</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><X size={16} /></button>
        </div>
        <div className="m-body">
          <p style={{ fontSize: 13, color: "var(--stone)", margin: "0 0 20px" }}>{user.email}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Plano</label>
              <div style={{ position: "relative" }}>
                <select value={plan} onChange={e => setPlan(e.target.value as PlanId)} className="input">
                  {(Object.keys(PLANS) as PlanId[]).map(p => <option key={p} value={p}>{PLANS[p].label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--stone)" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Total de créditos</label>
                <input type="number" value={creditsTotal} onChange={e => setCreditsTotal(e.target.value)} min={0} className="input" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Usados</label>
                <input type="number" value={creditsUsed} onChange={e => setCreditsUsed(e.target.value)} min={0} className="input" />
              </div>
            </div>
            <div style={{ background: "var(--cream)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--stone)" }}>
              Disponível após edição: <strong style={{ color: "var(--ink)" }}>{Math.max(0, Number(creditsTotal) - Number(creditsUsed)).toLocaleString("pt-BR")}</strong> créditos
            </div>
          </div>
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
        <div className="m-foot">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn btn-dark btn-sm">
            {saving ? "Salvando…" : <><Check size={14} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.raioAdmin === true;

  const [rows, setRows]         = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPlan, setFilterPlan]     = useState("ALL");
  const [sortCol, setSortCol]   = useState<SortCol>("createdAt");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");
  const [editing, setEditing]   = useState<UserRow | null>(null);
  const [tick, setTick]         = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/admin/users").then(r => r.json()) as UserRow[];
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load, tick]);

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const filtered = rows
    .filter(r => {
      const q = search.toLowerCase();
      if (q && !fmtName(r).toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (filterPlan   !== "ALL" && r.plan   !== filterPlan)   return false;
      return true;
    })
    .sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortCol === "name")       { va = fmtName(a).toLowerCase(); vb = fmtName(b).toLowerCase(); }
      if (sortCol === "plan")       { va = a.plan; vb = b.plan; }
      if (sortCol === "status")     { va = a.status; vb = b.status; }
      if (sortCol === "credits")    { va = a.creditsAvailable; vb = b.creditsAvailable; }
      if (sortCol === "createdAt")  { va = a.createdAt; vb = b.createdAt; }
      if (sortCol === "lastSignIn") { va = a.lastSignInAt ?? 0; vb = b.lastSignInAt ?? 0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2><em>Usuários</em></h2>
            <p className="sub">{rows.length} cadastros na plataforma</p>
          </div>
          <div className="actions">
            <button onClick={() => setTick(t => t + 1)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <input
            placeholder="Buscar por nome ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: 220 }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input" style={{ width: "auto" }}>
            <option value="ALL">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="input" style={{ width: "auto" }}>
            <option value="ALL">Todos os planos</option>
            {(Object.keys(PLANS) as PlanId[]).map(p => <option key={p} value={p}>{PLANS[p].label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--stone)", alignSelf: "center", fontFamily: "var(--mono)" }}>
            {filtered.length} de {rows.length}
          </span>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    {[
                      { col: "name" as SortCol,      label: "Nome"           },
                      { col: "plan" as SortCol,      label: "Plano"          },
                      { col: "status" as SortCol,    label: "Status"         },
                      { col: "credits" as SortCol,   label: "Créditos"       },
                      { col: "createdAt" as SortCol, label: "Cadastro"       },
                      { col: "lastSignIn" as SortCol,label: "Último acesso"  },
                    ].map(({ col, label }) => (
                      <th key={col} onClick={() => toggleSort(col)} style={{ cursor: "pointer", userSelect: "none" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {label} <SortIcon col={col} />
                        </span>
                      </th>
                    ))}
                    <th style={{ textAlign: "center" }}>Renovação</th>
                    <th style={{ textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--stone)" }}>Nenhum usuário encontrado.</td></tr>
                  ) : filtered.map(row => {
                    const planC = PLAN_COLOR[row.plan]    ?? { bg: "#F3F4F6", fg: "#374151" };
                    const statC = STATUS_COLOR[row.status] ?? { bg: "#F3F4F6", fg: "#374151" };
                    const pct   = row.creditsTotal > 0 ? Math.round((row.creditsUsed / row.creditsTotal) * 100) : 0;
                    return (
                      <tr key={row.clerkId}>
                        <td className="title-cell">
                          {fmtName(row)}
                          <span className="ph">{row.email}</span>
                        </td>
                        <td>
                          <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: planC.bg, color: planC.fg }}>
                            {row.planLabel}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: statC.bg, color: statC.fg }}>
                            {STATUS_LABEL[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="num">
                          <span style={{ fontWeight: 700 }}>{row.creditsAvailable.toLocaleString("pt-BR")}</span>
                          <span className="muted" style={{ fontSize: 11 }}> / {row.creditsTotal.toLocaleString("pt-BR")}</span>
                          <div style={{ marginTop: 4, height: 3, borderRadius: 4, background: "var(--line)", overflow: "hidden", width: 72 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "var(--red)" : pct > 50 ? "#F59E0B" : "var(--green)", borderRadius: 4 }} />
                          </div>
                        </td>
                        <td className="muted num">{fmtDate(row.createdAt)}</td>
                        <td className="muted num">{fmtDate(row.lastSignInAt)}</td>
                        <td className="muted num" style={{ textAlign: "center" }}>{fmtDate(row.currentPeriodEnd)}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button title="Editar" onClick={() => setEditing(row)} className="btn btn-ghost btn-sm" style={{ padding: "5px 8px" }}>
                              <Pencil size={13} />
                            </button>
                            {row.stripeCustomerId && (
                              <a
                                href={`https://dashboard.stripe.com/customers/${row.stripeCustomerId}`}
                                target="_blank" rel="noreferrer" title="Ver no Stripe"
                                className="btn btn-ghost btn-sm" style={{ padding: "5px 8px" }}
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setTick(t => t + 1); setEditing(null); }}
        />
      )}
    </div>
  );
}
