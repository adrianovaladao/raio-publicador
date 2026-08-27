"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { isMaster } from "@/lib/admin";
import { RefreshCw, Search, Building2, User, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface ClientRow {
  ownerId: string;
  email: string;
  clerkName: string | null;
  personType: string;
  fullName: string | null;
  cpf: string | null;
  companyName: string | null;
  cnpj: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  plan: string | null;
  status: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo", INACTIVE: "Inativo", PAST_DUE: "Inadimplente", CANCELLED: "Cancelado",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVE:    { bg: "#D1FAE5", fg: "#065F46" },
  INACTIVE:  { bg: "#F3F4F6", fg: "#6B7280" },
  PAST_DUE:  { bg: "#FEF3C7", fg: "#92400E" },
  CANCELLED: { bg: "#FEE2E2", fg: "#991B1B" },
};
const PLAN_LABEL: Record<string, string> = {
  BASIC: "Básico", ADVANCED: "Avançado", PROFESSIONAL: "Profissional",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function maskCpf(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : v;
}
function maskCnpj(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : v;
}
function displayName(row: ClientRow) {
  if (row.personType === "PJ") return row.companyName ?? row.clerkName ?? row.email.split("@")[0];
  return row.fullName ?? row.clerkName ?? row.email.split("@")[0];
}
function fmtDoc(row: ClientRow) {
  if (row.personType === "PF") return row.cpf ? maskCpf(row.cpf) : "—";
  return row.cnpj ? maskCnpj(row.cnpj) : "—";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      title="Copiar"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "0 3px", color: "var(--stone)", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}
    >
      {copied ? <Check size={11} color="#059669" /> : <Copy size={11} />}
    </button>
  );
}

function DetailPanel({ row }: { row: ClientRow }) {
  const address = [row.street, row.number, row.complement].filter(Boolean).join(", ");
  const cityState = `${row.city}/${row.state}`;
  const doc = fmtDoc(row);
  const docRaw = (row.cnpj ?? row.cpf ?? "").replace(/\D/g, "");
  const fullAddress = [address, row.district, cityState, `CEP ${row.cep}`].filter(Boolean).join(" — ");

  const fields = [
    { label: row.personType === "PJ" ? "Razão social" : "Nome completo", value: displayName(row) },
    { label: row.personType === "PJ" ? "CNPJ" : "CPF", value: doc, copy: docRaw, mono: true },
    { label: "E-mail", value: row.email, copy: row.email },
    { label: "Endereço", value: fullAddress, copy: fullAddress },
    { label: "Bairro", value: row.district },
    { label: "Cidade / UF", value: cityState },
    { label: "CEP", value: row.cep, mono: true },
    { label: "Tipo", value: row.personType === "PJ" ? "Pessoa Jurídica" : "Pessoa Física" },
    { label: "Plano", value: row.plan ? (PLAN_LABEL[row.plan] ?? row.plan) : "—" },
    { label: "Status", value: row.status ? (STATUS_LABEL[row.status] ?? row.status) : "—" },
    { label: "Cadastro", value: fmtDate(row.createdAt) },
  ];

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ padding: "20px 20px 20px 52px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px 24px" }}>
            {fields.map(({ label, value, copy, mono }) => (
              <div key={label}>
                <p style={{ margin: "0 0 3px", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, fontFamily: mono ? "var(--mono)" : undefined, wordBreak: "break-all" }}>
                  {value || "—"}
                  {copy && value && value !== "—" && <CopyBtn text={copy} />}
                </p>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function ClientesPage() {
  const { user } = useUser();
  const master = isMaster(user?.publicMetadata as Record<string, unknown>);

  const [rows, setRows]         = useState<ClientRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tick, setTick]         = useState(0);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"ALL" | "PF" | "PJ">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clientes");
    const data = await res.json() as { rows: ClientRow[] };
    setRows(data.rows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  if (!master) return (
    <div className="content scroll"><div className="content-inner"><p className="muted">Acesso restrito.</p></div></div>
  );

  const filtered = rows.filter(r => {
    if (filter !== "ALL" && r.personType !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.fullName ?? "").toLowerCase().includes(q) ||
      (r.companyName ?? "").toLowerCase().includes(q) ||
      (r.clerkName ?? "").toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.cpf ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      (r.cnpj ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      r.city.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="content scroll">
      <div className="content-inner">

        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2><em>Clientes</em></h2>
            <p className="sub">{rows.length} perfis fiscais cadastrados</p>
          </div>
          <div className="actions">
            <button onClick={() => setTick(t => t + 1)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--stone)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ, e-mail, cidade…"
              className="input"
              style={{ paddingLeft: 30 }}
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value as "ALL" | "PF" | "PJ")} className="input" style={{ width: "auto" }}>
            <option value="ALL">Todos os tipos</option>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
          <span style={{ fontSize: 12, color: "var(--stone)", fontFamily: "var(--mono)" }}>
            {filtered.length} de {rows.length}
          </span>
        </div>

        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : filtered.length === 0 ? (
            <div className="card empty"><div className="muted">Nenhum cliente encontrado.</div></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 32 }} />
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Documento</th>
                    <th>Cidade / UF</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => {
                    const isOpen = expanded === row.ownerId;
                    const sc = row.status ? STATUS_COLOR[row.status] : null;
                    return (
                      <>
                      <tr
                        key={row.ownerId}
                        onClick={() => setExpanded(isOpen ? null : row.ownerId)}
                        style={{ cursor: "pointer", background: isOpen ? "var(--bg)" : undefined }}
                      >
                        <td style={{ color: "var(--stone)", paddingRight: 0 }}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              background: row.personType === "PJ" ? "#EFF6FF" : "#F5F3FF",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {row.personType === "PJ"
                                ? <Building2 size={13} color="#1D4ED8" />
                                : <User size={13} color="#6D28D9" />}
                            </span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{displayName(row)}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "var(--stone)" }}>{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--stone)" }}>{row.personType}</span></td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{fmtDoc(row)}</td>
                        <td>{row.city}/{row.state}</td>
                        <td>{row.plan ? (PLAN_LABEL[row.plan] ?? row.plan) : <span className="muted">—</span>}</td>
                        <td>
                          {sc && row.status
                            ? <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.fg }}>{STATUS_LABEL[row.status]}</span>
                            : <span className="muted">—</span>}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--stone)" }}>{fmtDate(row.createdAt)}</td>
                      </tr>
                      {isOpen && <DetailPanel key={`${row.ownerId}-detail`} row={row} />}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
