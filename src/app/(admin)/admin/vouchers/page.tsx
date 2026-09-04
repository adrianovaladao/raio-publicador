"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, RefreshCw, Tag, Copy, Check, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";

type SortKey = "code" | "credits" | "usedCount" | "description" | "expiresAt" | "createdAt";
type SortDir = "asc" | "desc";

interface Voucher {
  id: string;
  code: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function VouchersAdminPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [sortKey, setSortKey]   = useState<SortKey>("expiresAt");
  const [sortDir, setSortDir]   = useState<SortDir>("asc");
  const [copied, setCopied]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string } | null>(null);
  const [search, setSearch] = useState("");

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", credits: "100", maxUses: "1", description: "", expiresAt: "" });
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      setVouchers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:        form.code.trim().toUpperCase(),
          credits:     parseInt(form.credits),
          maxUses:     parseInt(form.maxUses) || 1,
          description: form.description.trim() || undefined,
          expiresAt:   form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Erro ao criar voucher."); return; }
      setForm({ code: "", credits: "100", maxUses: "1", description: "", expiresAt: "" });
      await load();
    } finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      await load();
    } finally { setDeleting(null); }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  function isExpired(iso: string | null) {
    return !!iso && new Date(iso) < new Date();
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return vouchers;
    const q = search.trim().toLowerCase();
    return vouchers.filter(v =>
      v.code.toLowerCase().includes(q) ||
      (v.description ?? "").toLowerCase().includes(q)
    );
  }, [vouchers, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "credits" || sortKey === "usedCount") {
        av = sortKey === "usedCount" ? a.usedCount / Math.max(a.maxUses, 1) : a.credits;
        bv = sortKey === "usedCount" ? b.usedCount / Math.max(b.maxUses, 1) : b.credits;
      } else if (sortKey === "expiresAt" || sortKey === "createdAt") {
        // nulls last for expiresAt (sem validade = infinito = vai pro final)
        const dateA = a[sortKey] ? new Date(a[sortKey]!).getTime() : Infinity;
        const dateB = b[sortKey] ? new Date(b[sortKey]!).getTime() : Infinity;
        av = dateA; bv = dateB;
      } else {
        av = (a[sortKey] ?? "").toString().toLowerCase();
        bv = (b[sortKey] ?? "").toString().toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.3, marginLeft: 4, flexShrink: 0 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ marginLeft: 4, flexShrink: 0 }} />
      : <ChevronDown size={12} style={{ marginLeft: 4, flexShrink: 0 }} />;
  }

  return (
    <>
    {confirmDelete && (
      <div className="overlay" onClick={() => setConfirmDelete(null)}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="m-head">
            <h3>Excluir <em>voucher</em></h3>
          </div>
          <div className="m-body" style={{ paddingBottom: 24 }}>
            <p style={{ fontSize: 14, color: "var(--stone)", marginBottom: 24 }}>
              Tem certeza que deseja excluir o voucher <b style={{ fontFamily: "monospace", color: "var(--ink)" }}>{confirmDelete.code}</b>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: "var(--red)", color: "#fff", border: "none" }} onClick={() => handleDelete(confirmDelete.id)}>
                Excluir voucher
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2><em>Vouchers</em></h2>
            <p className="sub">Crie e gerencie códigos promocionais para presentear prospects e clientes.</p>
          </div>
          <div className="actions">
            <button onClick={load} className="btn btn-ghost btn-sm" disabled={loading} style={{ gap: 6 }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>

        {/* Create form */}
        <div className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>
            Criar voucher
          </p>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 1fr auto", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Código *</label>
                <input
                  className="input"
                  required
                  placeholder="EX: RAIO-WELCOME"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Créditos *</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  required
                  value={form.credits}
                  onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Usos máx.</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Descrição interna</label>
                <input
                  className="input"
                  placeholder="Ex: Prospect Folhapress"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Validade</label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[
                    { label: "7d",  days: 7  },
                    { label: "15d", days: 15 },
                    { label: "30d", days: 30 },
                    { label: "60d", days: 60 },
                    { label: "∞",   days: 0  },
                  ].map(({ label, days }) => {
                    const val = days === 0 ? "" : (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; })();
                    const active = days === 0 ? form.expiresAt === "" : form.expiresAt === val;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, expiresAt: val }))}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: active ? "1.5px solid var(--ink)" : "1.5px solid var(--line-3)",
                          background: active ? "var(--ink)" : "transparent",
                          color: active ? "var(--paper)" : "var(--stone)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="submit" disabled={creating} className="btn btn-dark btn-sm" style={{ gap: 5, whiteSpace: "nowrap" }}>
                <Plus size={14} /> {creating ? "Criando…" : "Criar"}
              </button>
            </div>
            {formError && <p style={{ fontSize: 13, color: "var(--red)", marginTop: 10 }}>{formError}</p>}
          </form>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--stone)", pointerEvents: "none" }} />
          <input
            className="input"
            placeholder="Buscar por código ou descrição…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, paddingRight: search ? 32 : undefined }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--stone)", display: "flex", padding: 2 }}
              title="Limpar"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* List */}
        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : sorted.length === 0 ? (
            <div className="card empty" style={{ flexDirection: "column", gap: 10 }}>
              <Tag size={28} style={{ opacity: 0.25 }} />
              <div className="muted">{search ? `Nenhum voucher encontrado para "${search}".` : "Nenhum voucher criado ainda."}</div>
            </div>
          ) : (
            <table className="tbl admin-vouchers-tbl">
              <thead>
                <tr>
                  {(["code", "credits", "usedCount", "description", "expiresAt", "createdAt"] as SortKey[]).map((col) => {
                    const labels: Record<SortKey, string> = { code: "Código", credits: "Créditos", usedCount: "Usos", description: "Descrição", expiresAt: "Validade", createdAt: "Criado em" };
                    return (
                      <th key={col} style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => toggleSort(col)}>
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {labels[col]}<SortIcon col={col} />
                        </span>
                      </th>
                    );
                  })}
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(v => (
                  <tr key={v.id}>
                    <td className="title-cell">
                      <button
                        onClick={() => copyCode(v.code)}
                        title="Copiar código"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "monospace", letterSpacing: 0.5, fontWeight: 700, fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                      >
                        {v.code}
                        {copied === v.code
                          ? <Check size={13} style={{ color: "var(--green)" }} />
                          : <Copy size={13} style={{ color: "var(--stone)", opacity: 0.5 }} />}
                      </button>
                    </td>
                    <td>{v.credits.toLocaleString("pt-BR")}</td>
                    <td>
                      <span style={{ color: v.usedCount >= v.maxUses ? "var(--red)" : "inherit" }}>
                        {v.usedCount}/{v.maxUses}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{v.description ?? "—"}</td>
                    <td style={{ color: isExpired(v.expiresAt) ? "var(--red)" : "inherit" }}>
                      {formatDate(v.expiresAt)}
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{formatDate(v.createdAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "5px 8px", color: "var(--red)" }}
                        onClick={() => setConfirmDelete({ id: v.id, code: v.code })}
                        disabled={deleting === v.id}
                        title="Excluir"
                      >
                        {deleting === v.id ? <RefreshCw size={13} /> : <Trash2 size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
