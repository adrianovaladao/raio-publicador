"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Tag } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  credits: number;
  maxUses: number;
  usedCount: number;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count: { redemptions: number };
}

export default function VouchersAdminPage() {
  const [vouchers, setVouchers]     = useState<Voucher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState({
    code: "", credits: "100", maxUses: "1", description: "", expiresAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json() as Voucher[];
      setVouchers(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
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
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        alert(d.error ?? "Erro ao criar voucher.");
        return;
      }
      setForm({ code: "", credits: "100", maxUses: "1", description: "", expiresAt: "" });
      setShowForm(false);
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

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vouchers de créditos</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            Crie e gerencie códigos promocionais para presentear prospects e clientes.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            <Plus size={14} /> Novo voucher
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Criar voucher</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
              Código *
              <input className="set-input" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: RAIO-WELCOME" />
            </label>
            <label style={{ fontSize: 12, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
              Créditos *
              <input className="set-input" type="number" min={1} required value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
              Usos máximos
              <input className="set-input" type="number" min={1} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
              Descrição (interna)
              <input className="set-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Prospect Folhapress" />
            </label>
            <label style={{ fontSize: 12, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
              Validade
              <input className="set-input" type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
              {creating ? "Criando…" : "Criar voucher"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--fg-muted)", fontSize: 13 }}>Carregando…</div>
      ) : vouchers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 64, color: "var(--fg-muted)" }}>
          <Tag size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>Nenhum voucher criado ainda.</div>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-muted)", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Código</th>
              <th style={{ padding: "8px 12px" }}>Créditos</th>
              <th style={{ padding: "8px 12px" }}>Usos</th>
              <th style={{ padding: "8px 12px" }}>Descrição</th>
              <th style={{ padding: "8px 12px" }}>Validade</th>
              <th style={{ padding: "8px 12px" }}>Criado em</th>
              <th style={{ padding: "8px 12px" }}></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, fontFamily: "monospace", letterSpacing: 0.5 }}>{v.code}</td>
                <td style={{ padding: "10px 12px" }}>{v.credits.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ color: v.usedCount >= v.maxUses ? "var(--error)" : "inherit" }}>
                    {v.usedCount}/{v.maxUses}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--fg-muted)" }}>{v.description ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: v.expiresAt && new Date(v.expiresAt) < new Date() ? "var(--error)" : "inherit" }}>
                  {formatDate(v.expiresAt)}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--fg-muted)" }}>{formatDate(v.createdAt)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px 8px", color: "var(--error)" }}
                    onClick={() => handleDelete(v.id, v.code)}
                    disabled={deleting === v.id}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
