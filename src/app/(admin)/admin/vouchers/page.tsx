"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Tag, Copy, Check } from "lucide-react";

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

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

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Excluir voucher ${code}?`)) return;
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

  return (
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr auto", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
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
              <button type="submit" disabled={creating} className="btn btn-dark btn-sm" style={{ gap: 5, whiteSpace: "nowrap" }}>
                <Plus size={14} /> {creating ? "Criando…" : "Criar"}
              </button>
            </div>
            {formError && <p style={{ fontSize: 13, color: "var(--red)", marginTop: 10 }}>{formError}</p>}
          </form>
        </div>

        {/* List */}
        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : vouchers.length === 0 ? (
            <div className="card empty" style={{ flexDirection: "column", gap: 10 }}>
              <Tag size={28} style={{ opacity: 0.25 }} />
              <div className="muted">Nenhum voucher criado ainda.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Créditos</th>
                  <th>Usos</th>
                  <th>Descrição</th>
                  <th>Validade</th>
                  <th>Criado em</th>
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
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
                        onClick={() => handleDelete(v.id, v.code)}
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
  );
}
