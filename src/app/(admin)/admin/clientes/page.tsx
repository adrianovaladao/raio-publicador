"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { isMaster } from "@/lib/admin";
import { Search, ChevronDown, ChevronUp, Building2, User, Copy, Check } from "lucide-react";

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
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtDoc(row: ClientRow) {
  if (row.personType === "PF") return row.cpf ? maskCpf(row.cpf) : "—";
  return row.cnpj ? maskCnpj(row.cnpj) : "—";
}
function maskCpf(v: string) {
  const d = v.replace(/\D/g, "");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
function maskCnpj(v: string) {
  const d = v.replace(/\D/g, "");
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
function displayName(row: ClientRow) {
  if (row.personType === "PJ") return row.companyName ?? row.clerkName ?? row.email.split("@")[0];
  return row.fullName ?? row.clerkName ?? row.email.split("@")[0];
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copiar"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--stone)", display: "inline-flex", alignItems: "center" }}
    >
      {copied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
    </button>
  );
}

function ExpandedRow({ row }: { row: ClientRow }) {
  const address = [row.street, row.number, row.complement, row.district, `${row.city}/${row.state}`, row.cep]
    .filter(Boolean).join(", ");

  return (
    <tr>
      <td colSpan={7} style={{ padding: "0 16px 16px 52px", background: "var(--bg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, padding: "16px 0 4px" }}>
          <div>
            <p style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)", marginBottom: 4 }}>
              {row.personType === "PJ" ? "Razão social" : "Nome completo"}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{displayName(row)}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)", marginBottom: 4 }}>
              {row.personType === "PJ" ? "CNPJ" : "CPF"}
            </p>
            <p style={{ fontSize: 14, fontFamily: "var(--mono)" }}>
              {fmtDoc(row)} <CopyBtn text={(row.cnpj ?? row.cpf ?? "").replace(/\D/g, "")} />
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)", marginBottom: 4 }}>E-mail</p>
            <p style={{ fontSize: 14 }}>{row.email} <CopyBtn text={row.email} /></p>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)", marginBottom: 4 }}>Endereço</p>
            <p style={{ fontSize: 14 }}>{address || "—"} <CopyBtn text={address} /></p>
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

  useEffect(() => { load(); }, [load]);

  if (!master) return (
    <div style={{ padding: 40, color: "var(--stone)" }}>Acesso restrito.</div>
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
      (r.cpf ?? "").includes(q) ||
      (r.cnpj ?? "").includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Clientes</h1>
        <p style={{ fontSize: 13, color: "var(--stone)", marginTop: 4 }}>
          Dados fiscais preenchidos no checkout — {rows.length} cadastros
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--stone)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, e-mail, cidade…"
            style={{
              width: "100%", padding: "8px 10px 8px 32px",
              border: "1px solid var(--line)", borderRadius: 8,
              fontSize: 13, background: "var(--paper)", color: "var(--ink)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        {(["ALL", "PF", "PJ"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: filter === f ? "1.5px solid var(--ink)" : "1.5px solid var(--line)",
              background: filter === f ? "var(--ink)" : "var(--paper)",
              color: filter === f ? "var(--paper)" : "var(--stone)",
              cursor: "pointer",
            }}
          >
            {f === "ALL" ? "Todos" : f}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <p style={{ color: "var(--stone)", fontSize: 14 }}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--stone)", fontSize: 14 }}>Nenhum cliente encontrado.</p>
      ) : (
        <div style={{ background: "var(--paper)", borderRadius: 12, border: "1px solid var(--line)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)", width: 36 }}></th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Cliente</th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Documento</th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Cidade/UF</th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Plano</th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Status</th>
                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--stone)" }}>Cadastro</th>
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
                    style={{ borderBottom: isOpen ? "none" : "1px solid var(--line)", cursor: "pointer", transition: "background .1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                  >
                    <td style={{ padding: "12px 8px 12px 16px", color: "var(--stone)" }}>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: row.personType === "PJ" ? "#EFF6FF" : "#F5F3FF",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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
                    <td style={{ padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 12 }}>
                      <span style={{ fontSize: 9, color: "var(--stone)", marginRight: 4 }}>{row.personType}</span>
                      {fmtDoc(row)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink-soft)" }}>
                      {row.city}/{row.state}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {row.plan ? <span style={{ fontSize: 12 }}>{PLAN_LABEL[row.plan] ?? row.plan}</span> : <span style={{ color: "var(--stone)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {sc && row.status ? (
                        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.fg }}>
                          {STATUS_LABEL[row.status]}
                        </span>
                      ) : <span style={{ color: "var(--stone)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--stone)", fontSize: 12 }}>
                      {fmtDate(row.createdAt)}
                    </td>
                  </tr>
                  {isOpen && <ExpandedRow key={`${row.ownerId}-exp`} row={row} />}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
