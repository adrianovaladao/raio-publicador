"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Crown, Plus, Trash2, Check, RefreshCw, ShieldCheck, Shield } from "lucide-react";
import { isMaster, ROLE_LABEL, type AdminRole } from "@/lib/admin";

interface AdminRow {
  clerkId: string;
  email: string;
  name: string;
  role: string;
}

const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  master: { bg: "#FEF3C7", fg: "#92400E" },
  editor: { bg: "#EFF6FF", fg: "#1D4ED8" },
};

export default function AdminAdministradores() {
  const { user, isLoaded } = useUser();
  const isAdmin = isMaster(user?.publicMetadata as Record<string, unknown>);

  const [admins, setAdmins]     = useState<AdminRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState<AdminRole>("editor");
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState("");
  const [addOk, setAddOk]       = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/admin/admins").then(r => r.json()) as AdminRow[];
    setAdmins(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load, tick]);

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito ao Master Admin.</p>
    </div>
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true); setAddError(""); setAddOk("");
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddOk(`Acesso ${ROLE_LABEL[role]} concedido com sucesso!`);
      setEmail("");
      setTick(t => t + 1);
    } else {
      setAddError(data.error ?? "Erro ao adicionar.");
    }
    setAdding(false);
  }

  async function handleRemove(clerkId: string) {
    setRemoving(clerkId);
    await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId }),
    });
    setTick(t => t + 1);
    setRemoving(null);
  }

  async function handleChangeRole(clerkId: string, newRole: AdminRole) {
    await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId, role: newRole }),
    });
    setTick(t => t + 1);
  }

  const myId = user?.id;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2><em>Administradores</em></h2>
            <p className="sub">Gerencie quem tem acesso ao painel admin e em qual nível.</p>
          </div>
          <div className="actions">
            <button onClick={() => setTick(t => t + 1)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>

        {/* Roles explainer */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
          {[
            { role: "master", icon: <ShieldCheck size={16} />, desc: "Acesso total: usuários, releases, veículos, links externos e gestão de administradores." },
            { role: "editor", icon: <Shield size={16} />, desc: "Acesso restrito: apenas releases e veículos. Não vê usuários nem links externos." },
          ].map(({ role: r, icon, desc }) => {
            const c = ROLE_COLOR[r];
            return (
              <div key={r} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 12 }}>
                <span style={{ color: c.fg, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: c.fg }}>{ROLE_LABEL[r as AdminRole]}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--stone)", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add admin form */}
        <div className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>
            Adicionar administrador
          </p>
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
              <label>E-mail do usuário</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
                className="input"
              />
            </div>
            <div className="field" style={{ minWidth: 160, marginBottom: 0 }}>
              <label>Nível de acesso</label>
              <div style={{ position: "relative" }}>
                <select value={role} onChange={e => setRole(e.target.value as AdminRole)} className="input">
                  <option value="editor">Editor Admin</option>
                  <option value="master">Master Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={adding} className="btn btn-dark btn-sm" style={{ gap: 5, marginBottom: 0 }}>
              <Plus size={14} /> {adding ? "Adicionando…" : "Adicionar"}
            </button>
          </form>
          {addError && <p style={{ fontSize: 13, color: "var(--red)", marginTop: 10 }}>{addError}</p>}
          {addOk && (
            <p style={{ fontSize: 13, color: "var(--green)", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <Check size={13} /> {addOk}
            </p>
          )}
        </div>

        {/* Admin list */}
        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : admins.length === 0 ? (
            <div className="card empty"><div className="muted">Nenhum administrador cadastrado.</div></div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Nível de acesso</th>
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => {
                  const c = ROLE_COLOR[a.role] ?? ROLE_COLOR.editor;
                  const isMe = a.clerkId === myId;
                  return (
                    <tr key={a.clerkId}>
                      <td className="title-cell">
                        {a.name}
                        {isMe && <span style={{ marginLeft: 6, fontSize: 10, background: "var(--ink)", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>você</span>}
                      </td>
                      <td className="muted" style={{ fontSize: 13 }}>{a.email}</td>
                      <td>
                        {isMe ? (
                          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>
                            {ROLE_LABEL[a.role as AdminRole] ?? a.role}
                          </span>
                        ) : (
                          <select
                            value={a.role}
                            onChange={e => handleChangeRole(a.clerkId, e.target.value as AdminRole)}
                            className="input"
                            style={{ fontSize: 12, padding: "4px 8px", width: "auto", fontWeight: 600, backgroundColor: c.bg, color: c.fg, border: "none", borderRadius: 6 }}
                          >
                            <option value="editor">Editor Admin</option>
                            <option value="master">Master Admin</option>
                          </select>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!isMe && (
                          <button
                            onClick={() => handleRemove(a.clerkId)}
                            disabled={removing === a.clerkId}
                            title="Remover acesso"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "5px 8px", color: "var(--red)" }}
                          >
                            {removing === a.clerkId ? <RefreshCw size={13} /> : <Trash2 size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
