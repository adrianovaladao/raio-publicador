"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  ArrowUp, ArrowDown, ArrowUpDown,
  Pencil, Check, X, RefreshCw, ExternalLink, ChevronDown, Crown, Trash2, ChevronRight,
  Building2, FileText, Users, CreditCard, Zap,
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
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

interface UserDetail {
  brands: { id: string; name: string; color: string | null; logoUrl: string | null; releaseCount: number }[];
  releaseCount: number;
  teamMembers: { id: string; name: string; email: string; role: string; status: string; createdAt: string }[];
  invoices: { id: string; date: number; amount: number; status: string; description: string }[];
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
const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", EDITOR: "Editor", REVIEWER: "Revisor" };
const MEMBER_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVE:    { bg: "#D1FAE5", fg: "#065F46" },
  SUSPENDED: { bg: "#FEE2E2", fg: "#991B1B" },
};

function fmtDate(ts: number | string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtName(row: UserRow) {
  const n = [row.firstName, row.lastName].filter(Boolean).join(" ");
  return n || row.email.split("@")[0];
}

const SUB_STATUSES = ["ACTIVE", "INACTIVE", "PAST_DUE", "CANCELLED"] as const;

function EditModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [creditsTotal, setCreditsTotal]         = useState(String(user.creditsTotal));
  const [creditsUsed, setCreditsUsed]           = useState(String(user.creditsUsed));
  const [plan, setPlan]                         = useState<PlanId>(user.plan);
  const [status, setStatus]                     = useState(user.status);
  const [stripeCustomerId, setStripeCustomerId] = useState(user.stripeCustomerId ?? "");
  const [stripeSubId, setStripeSubId]           = useState(user.stripeSubscriptionId ?? "");
  const [saving, setSaving]                     = useState(false);
  const [error, setError]                       = useState("");

  async function save() {
    setSaving(true); setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkId: user.clerkId,
        creditsTotal: Number(creditsTotal),
        creditsUsed: Number(creditsUsed),
        plan,
        status,
        stripeCustomerId: stripeCustomerId.trim() || null,
        stripeSubscriptionId: stripeSubId.trim() || null,
      }),
    });
    if (res.ok) { onSaved(); onClose(); }
    else { setError("Erro ao salvar."); setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480, marginTop: 60 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 0" }}>
          <h3>Editar assinatura</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><X size={16} /></button>
        </div>
        <div className="m-body">
          <p style={{ fontSize: 13, color: "var(--stone)", margin: "0 0 20px" }}>{user.email}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Plano</label>
                <div style={{ position: "relative" }}>
                  <select value={plan} onChange={e => setPlan(e.target.value as PlanId)} className="input">
                    {(Object.keys(PLANS) as PlanId[]).map(p => <option key={p} value={p}>{PLANS[p].label}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--stone)" }} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Status</label>
                <div style={{ position: "relative" }}>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                    {SUB_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--stone)" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Total de créditos</label>
                <input type="number" value={creditsTotal} onChange={e => setCreditsTotal(e.target.value)} min={0} className="input" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Créditos usados</label>
                <input type="number" value={creditsUsed} onChange={e => setCreditsUsed(e.target.value)} min={0} className="input" />
              </div>
            </div>
            <div style={{ background: "var(--cream)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--stone)" }}>
              Disponível após edição: <strong style={{ color: "var(--ink)" }}>{Math.max(0, Number(creditsTotal) - Number(creditsUsed)).toLocaleString("pt-BR")}</strong> créditos
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 12 }}>IDs Stripe</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Customer ID <span style={{ fontWeight: 400, color: "var(--stone)" }}>(cus_…)</span></label>
                  <input value={stripeCustomerId} onChange={e => setStripeCustomerId(e.target.value)} placeholder="cus_xxxxxxxxxxxxxxxx" className="input" style={{ fontFamily: "var(--mono)", fontSize: 12 }} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Subscription ID <span style={{ fontWeight: 400, color: "var(--stone)" }}>(sub_…)</span></label>
                  <input value={stripeSubId} onChange={e => setStripeSubId(e.target.value)} placeholder="sub_xxxxxxxxxxxxxxxx" className="input" style={{ fontFamily: "var(--mono)", fontSize: 12 }} />
                </div>
              </div>
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

function UserDetailPanel({ row }: { row: UserRow }) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${row.clerkId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); });
  }, [row.clerkId]);

  const planC = PLAN_COLOR[row.plan] ?? { bg: "#F3F4F6", fg: "#374151" };
  const statC = STATUS_COLOR[row.status] ?? { bg: "#F3F4F6", fg: "#374151" };
  const pctCycle = row.creditsTotal > 0 ? Math.round((row.creditsUsed / row.creditsTotal) * 100) : 0;

  const sectionTitle = (icon: React.ReactNode, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
      <span style={{ color: "var(--stone)" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)" }}>{label}</span>
    </div>
  );

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ padding: "20px 24px" }}>
          {loading ? (
            <p style={{ fontSize: 13, color: "var(--stone)" }}>Carregando…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

              {/* 1 + 2 — Plano e Status */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "16px 18px" }}>
                {sectionTitle(<Zap size={13} />, "Assinatura")}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--stone)" }}>Plano</span>
                    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: planC.bg, color: planC.fg }}>{row.planLabel}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--stone)" }}>Status</span>
                    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: statC.bg, color: statC.fg }}>{STATUS_LABEL[row.status] ?? row.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--stone)" }}>Renovação</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(row.currentPeriodEnd)}</span>
                  </div>
                </div>
              </div>

              {/* 3 — Marcas */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "16px 18px" }}>
                {sectionTitle(<Building2 size={13} />, `Marcas (${detail?.brands.length ?? 0})`)}
                {!detail?.brands.length ? (
                  <p style={{ fontSize: 13, color: "var(--stone)" }}>Nenhuma marca cadastrada.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detail.brands.map(b => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {b.logoUrl
                            ? <img src={b.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "contain", border: "1px solid #eee" }} />
                            : <span style={{ width: 22, height: 22, borderRadius: 4, background: b.color ?? "#eee", display: "inline-block", flexShrink: 0 }} />
                          }
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--stone)" }}>{b.releaseCount} release{b.releaseCount !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 + 5 + 6 — Releases e créditos */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "16px 18px" }}>
                {sectionTitle(<FileText size={13} />, "Releases e créditos")}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--stone)" }}>Total de releases</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{detail?.releaseCount ?? 0}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--stone)" }}>Créditos — ciclo atual</span>
                      <span style={{ fontSize: 13 }}>
                        <strong>{row.creditsUsed.toLocaleString("pt-BR")}</strong>
                        <span style={{ color: "var(--stone)" }}> / {row.creditsTotal.toLocaleString("pt-BR")}</span>
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pctCycle}%`, background: pctCycle > 80 ? "var(--red)" : pctCycle > 50 ? "#F59E0B" : "var(--green)", borderRadius: 4, transition: "width .3s" }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--stone)", marginTop: 5 }}>
                      {row.creditsAvailable.toLocaleString("pt-BR")} disponíveis · {pctCycle}% usado
                    </p>
                  </div>
                </div>
              </div>

              {/* 7 — Histórico de transações */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "16px 18px", gridColumn: "span 2" }}>
                {sectionTitle(<CreditCard size={13} />, "Histórico de transações")}
                {!detail?.invoices.length ? (
                  <p style={{ fontSize: 13, color: "var(--stone)" }}>Nenhuma transação encontrada.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        {["Data", "Descrição", "Valor", "Status"].map(h => (
                          <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.invoices.map(inv => {
                        const isPaid = inv.status === "paid";
                        return (
                          <tr key={inv.id} style={{ borderBottom: "1px solid #f8f8f8" }}>
                            <td style={{ padding: "7px 8px", color: "var(--stone)", whiteSpace: "nowrap" }}>{fmtDate(inv.date * 1000)}</td>
                            <td style={{ padding: "7px 8px", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.description}</td>
                            <td style={{ padding: "7px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtCurrency(inv.amount)}</td>
                            <td style={{ padding: "7px 8px" }}>
                              <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: isPaid ? "#D1FAE5" : "#FEF3C7", color: isPaid ? "#065F46" : "#92400E" }}>
                                {isPaid ? "Pago" : inv.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {row.stripeCustomerId && (
                  <a href={`https://dashboard.stripe.com/customers/${row.stripeCustomerId}`} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--stone)", marginTop: 10, textDecoration: "none" }}>
                    <ExternalLink size={11} /> Ver no Stripe
                  </a>
                )}
              </div>

              {/* 8 — Equipe */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "16px 18px" }}>
                {sectionTitle(<Users size={13} />, `Equipe (${detail?.teamMembers.length ?? 0})`)}
                {!detail?.teamMembers.length ? (
                  <p style={{ fontSize: 13, color: "var(--stone)" }}>Nenhum membro na equipe.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detail.teamMembers.map(m => {
                      const mc = MEMBER_STATUS_COLOR[m.status] ?? MEMBER_STATUS_COLOR.ACTIVE;
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{m.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--stone)" }}>{m.email}</p>
                          </div>
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--stone)" }}>{ROLE_LABEL[m.role] ?? m.role}</span>
                            <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: mc.bg, color: mc.fg }}>
                              {m.status === "ACTIVE" ? "Ativo" : "Suspenso"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </td>
    </tr>
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tick, setTick]         = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel]   = useState(false);

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

  async function handleBulkDelete() {
    setBulkDel(true);
    const clerkIds = [...selected];
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clerkIds }) });
    setRows(prev => prev.filter(r => !selected.has(r.clerkId)));
    setSelected(new Set()); setBulkDel(false);
  }

  function toggleSelect(id: string, e: { stopPropagation: () => void }) {
    e.stopPropagation();
    setSelected(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  }

  function toggleAll(ids: string[]) {
    const allSelected = ids.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  }

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

        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "12px 16px", background: "var(--ink)", color: "#fff", borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
            <button onClick={() => setSelected(new Set())} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", gap: 5 }}>
              <X size={13} /> Limpar seleção
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={handleBulkDelete} disabled={bulkDel} className="btn btn-sm" style={{ background: "#DC2626", color: "#fff", border: "none", gap: 5 }}>
              <Trash2 size={13} /> {bulkDel ? "Removendo…" : `Remover ${selected.size}`}
            </button>
          </div>
        )}

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

        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(r => selected.has(r.clerkId))}
                        ref={el => { if (el) el.indeterminate = filtered.some(r => selected.has(r.clerkId)) && !filtered.every(r => selected.has(r.clerkId)); }}
                        onChange={() => toggleAll(filtered.map(r => r.clerkId))}
                        style={{ cursor: "pointer", width: 15, height: 15 }}
                      />
                    </th>
                    <th style={{ width: 20 }} />
                    {[
                      { col: "name" as SortCol,      label: "Nome"          },
                      { col: "plan" as SortCol,      label: "Plano"         },
                      { col: "status" as SortCol,    label: "Status"        },
                      { col: "credits" as SortCol,   label: "Créditos"      },
                      { col: "createdAt" as SortCol, label: "Cadastro"      },
                      { col: "lastSignIn" as SortCol,label: "Último acesso" },
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
                    <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "var(--stone)" }}>Nenhum usuário encontrado.</td></tr>
                  ) : filtered.map(row => {
                    const planC = PLAN_COLOR[row.plan]    ?? { bg: "#F3F4F6", fg: "#374151" };
                    const statC = STATUS_COLOR[row.status] ?? { bg: "#F3F4F6", fg: "#374151" };
                    const pct   = row.creditsTotal > 0 ? Math.round((row.creditsUsed / row.creditsTotal) * 100) : 0;
                    const sel   = selected.has(row.clerkId);
                    const isExp = expanded === row.clerkId;
                    return (
                      <>
                        <tr
                          key={row.clerkId}
                          style={{ background: sel ? "var(--cream)" : "", cursor: "pointer" }}
                          onClick={() => setExpanded(isExp ? null : row.clerkId)}
                        >
                          <td style={{ padding: "12px 14px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={sel} onChange={() => {}}
                              onClick={e => toggleSelect(row.clerkId, e)}
                              style={{ cursor: "pointer", width: 15, height: 15 }} />
                          </td>
                          <td style={{ padding: "12px 6px 12px 0", verticalAlign: "middle" }}>
                            <ChevronRight size={14} style={{ color: "var(--stone)", transition: "transform .2s", transform: isExp ? "rotate(90deg)" : "rotate(0deg)" }} />
                          </td>
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
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button title="Editar" onClick={() => setEditing(row)} className="btn btn-ghost btn-sm" style={{ padding: "5px 8px" }}>
                                <Pencil size={13} />
                              </button>
                              {row.stripeCustomerId && (
                                <a href={`https://dashboard.stripe.com/customers/${row.stripeCustomerId}`}
                                  target="_blank" rel="noreferrer" title="Ver no Stripe"
                                  className="btn btn-ghost btn-sm" style={{ padding: "5px 8px" }}>
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExp && <UserDetailPanel key={`detail-${row.clerkId}`} row={row} />}
                      </>
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
