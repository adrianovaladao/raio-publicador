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

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Ativo", INACTIVE: "Inativo", PAST_DUE: "Inadimplente", CANCELLED: "Cancelado" };
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Editar usuário</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "var(--stone)", marginBottom: 20 }}>{user.email}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 6 }}>Plano</label>
            <div style={{ position: "relative" }}>
              <select value={plan} onChange={e => setPlan(e.target.value as PlanId)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, appearance: "none", cursor: "pointer" }}>
                {(Object.keys(PLANS) as PlanId[]).map(p => <option key={p} value={p}>{PLANS[p].label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--stone)" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 6 }}>Total de créditos</label>
              <input type="number" value={creditsTotal} onChange={e => setCreditsTotal(e.target.value)} min={0}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 6 }}>Usados</label>
              <input type="number" value={creditsUsed} onChange={e => setCreditsUsed(e.target.value)} min={0}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--stone)" }}>
            Disponível após edição: <strong style={{ color: "var(--fg)" }}>{Math.max(0, Number(creditsTotal) - Number(creditsUsed)).toLocaleString("pt-BR")}</strong> créditos
          </div>
        </div>

        {error && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
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

  const [rows, setRows]       = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPlan, setFilterPlan]     = useState("ALL");
  const [sortCol, setSortCol] = useState<SortCol>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [tick, setTick]       = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/admin/users").then(r => r.json()) as UserRow[];
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load, tick]);

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
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

  const thS: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontSize: 11,
    fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--stone)", fontWeight: 600, whiteSpace: "nowrap",
    borderBottom: "1.5px solid var(--border)", cursor: "pointer", userSelect: "none",
  };
  const tdS: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Usuários</h1>
          <p style={{ fontSize: 13, color: "var(--stone)", marginTop: 4 }}>{rows.length} cadastros na plataforma</p>
        </div>
        <button onClick={() => setTick(t => t + 1)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input placeholder="Buscar por nome ou email…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 13 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 13, cursor: "pointer" }}>
          <option value="ALL">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 13, cursor: "pointer" }}>
          <option value="ALL">Todos os planos</option>
          {(Object.keys(PLANS) as PlanId[]).map(p => <option key={p} value={p}>{PLANS[p].label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "var(--stone)", alignSelf: "center" }}>{filtered.length} de {rows.length}</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--stone)" }}>Carregando…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thS} onClick={() => toggleSort("name")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Nome <SortIcon col="name" /></span></th>
                  <th style={thS} onClick={() => toggleSort("plan")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Plano <SortIcon col="plan" /></span></th>
                  <th style={thS} onClick={() => toggleSort("status")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Status <SortIcon col="status" /></span></th>
                  <th style={{ ...thS, textAlign: "right" }} onClick={() => toggleSort("credits")}><span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>Créditos <SortIcon col="credits" /></span></th>
                  <th style={thS} onClick={() => toggleSort("createdAt")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Cadastro <SortIcon col="createdAt" /></span></th>
                  <th style={thS} onClick={() => toggleSort("lastSignIn")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Último acesso <SortIcon col="lastSignIn" /></span></th>
                  <th style={{ ...thS, textAlign: "center" }}>Renovação</th>
                  <th style={{ ...thS, textAlign: "center" }}>Ações</th>
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
                    <tr key={row.clerkId}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600 }}>{fmtName(row)}</div>
                        <div style={{ fontSize: 11, color: "var(--stone)" }}>{row.email}</div>
                      </td>
                      <td style={tdS}>
                        <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: planC.bg, color: planC.fg }}>{row.planLabel}</span>
                      </td>
                      <td style={tdS}>
                        <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: statC.bg, color: statC.fg }}>{STATUS_LABEL[row.status] ?? row.status}</span>
                      </td>
                      <td style={{ ...tdS, textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>
                          {row.creditsAvailable.toLocaleString("pt-BR")}
                          <span style={{ fontWeight: 400, color: "var(--stone)", fontSize: 11 }}> / {row.creditsTotal.toLocaleString("pt-BR")}</span>
                        </div>
                        <div style={{ marginTop: 4, height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden", width: 80, marginLeft: "auto" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#DC2626" : pct > 50 ? "#F59E0B" : "#10B981", borderRadius: 4 }} />
                        </div>
                      </td>
                      <td style={{ ...tdS, fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)" }}>{fmtDate(row.createdAt)}</td>
                      <td style={{ ...tdS, fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)" }}>{fmtDate(row.lastSignInAt)}</td>
                      <td style={{ ...tdS, textAlign: "center", fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)" }}>{fmtDate(row.currentPeriodEnd)}</td>
                      <td style={{ ...tdS, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button title="Editar" onClick={() => setEditing(row)}
                            style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--stone)", display: "flex", alignItems: "center" }}>
                            <Pencil size={13} />
                          </button>
                          {row.stripeCustomerId && (
                            <a href={`https://dashboard.stripe.com/customers/${row.stripeCustomerId}`} target="_blank" rel="noreferrer"
                              title="Ver no Stripe"
                              style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--stone)", display: "flex", alignItems: "center", textDecoration: "none" }}>
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

      {editing && (
        <EditModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setTick(t => t + 1); setEditing(null); }} />
      )}
    </div>
  );
}
