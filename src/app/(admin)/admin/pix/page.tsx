"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X } from "lucide-react";

interface PixPayment {
  id: string;
  ownerId: string;
  planId: string;
  amountCents: number;
  status: string;
  userName: string;
  userEmail: string;
  txId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
}

export default function AdminPixPage() {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/pix");
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? String(res.status)); setPayments([]); }
      else setPayments(data.payments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPayments([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(paymentId: string, action: "confirm" | "reject") {
    setActing(paymentId);
    try {
      const res = await fetch("/api/admin/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Erro"); return; }
      await load();
    } finally { setActing(null); }
  }

  function fmt(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR");
  }

  const planLabel: Record<string, string> = {
    basic: "Básico", pro: "Pro", enterprise: "Enterprise",
  };

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2>Pagamentos <em>Pix</em></h2>
            <p className="sub">Confirme ou rejeite pagamentos Pix pendentes de verificação manual.</p>
          </div>
          <div className="actions">
            <button onClick={load} className="btn btn-ghost btn-sm" disabled={loading} style={{ gap: 6 }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--red)" }}>
            ⚠️ {error}
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : payments.length === 0 ? (
            <div className="card empty" style={{ flexDirection: "column", gap: 10 }}>
              <Check size={28} style={{ opacity: 0.25 }} />
              <div className="muted">Nenhum pagamento Pix pendente.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>TxID</th>
                  <th>Solicitado em</th>
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.userName || "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.userEmail || p.ownerId}</div>
                    </td>
                    <td>{planLabel[p.planId] ?? p.planId}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(p.amountCents)}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--stone)", wordBreak: "break-all" }}>
                        {p.txId ?? "—"}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{fmtDate(p.createdAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: "var(--green)", color: "#fff", border: "none", gap: 5 }}
                          disabled={acting === p.id}
                          onClick={() => act(p.id, "confirm")}>
                          {acting === p.id ? <RefreshCw size={13} /> : <Check size={13} />}
                          Confirmar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red)", gap: 5 }}
                          disabled={acting === p.id}
                          onClick={() => act(p.id, "reject")}>
                          <X size={13} />
                          Rejeitar
                        </button>
                      </div>
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
