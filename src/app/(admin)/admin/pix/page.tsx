"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X, AlertTriangle } from "lucide-react";

interface PixPayment {
  id: string;
  ownerId: string;
  planId: string;
  amountCents: number;
  status: string;
  type: string;
  creditQty: number | null;
  userName: string;
  userEmail: string;
  txId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: "Básico", ADVANCED: "Avançado", PROFESSIONAL: "Profissional", VOUCHER: "Voucher",
};

export default function AdminPixPage() {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

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

  async function act(paymentId: string, action: "confirm" | "reject" | "cancel") {
    setActing(paymentId);
    setCancelConfirm(null);
    try {
      const res = await fetch("/api/admin/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      let data: { error?: string; ok?: boolean } = {};
      try { data = await res.json(); } catch { /* resposta não-JSON */ }
      if (!res.ok) { alert(data?.error ?? `Erro ${res.status}`); return; }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro inesperado");
    } finally { setActing(null); }
  }

  function fmt(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR");
  }

  function descricao(p: PixPayment) {
    if (p.type === "CREDIT_PURCHASE") {
      return `${(p.creditQty ?? 0).toLocaleString("pt-BR")} créditos avulsos`;
    }
    return `Assinatura · ${PLAN_LABELS[p.planId] ?? p.planId}`;
  }

  const pending   = payments.filter(p => p.status === "PENDING");
  const confirmed = payments.filter(p => p.status === "CONFIRMED");

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2>Pagamentos <em>Pix</em></h2>
            <p className="sub">Confirme ou rejeite pagamentos pendentes. Cancele pagamentos confirmados quando houver reembolso manual.</p>
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

        {/* Pendentes */}
        <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>
          Pendentes de verificação
        </h3>
        <div className="card" style={{ marginBottom: 28 }}>
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : pending.length === 0 ? (
            <div className="card empty" style={{ flexDirection: "column", gap: 10 }}>
              <Check size={28} style={{ opacity: 0.25 }} />
              <div className="muted">Nenhum pagamento Pix pendente.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>TxID</th>
                  <th>Solicitado em</th>
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.userName || "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.userEmail || p.ownerId}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{descricao(p)}</td>
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

        {/* Confirmados */}
        <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>
          Confirmados — cancelamento/reembolso
        </h3>
        <div className="card" style={{ marginBottom: 12 }}>
          {loading ? (
            <div className="card empty"><div className="muted">Carregando…</div></div>
          ) : confirmed.length === 0 ? (
            <div className="card empty" style={{ flexDirection: "column", gap: 10 }}>
              <div className="muted">Nenhum pagamento confirmado.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Confirmado em</th>
                  <th style={{ textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.userName || "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.userEmail || p.ownerId}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{descricao(p)}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(p.amountCents)}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{fmtDate(p.confirmedAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      {cancelConfirm === p.id ? (
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertTriangle size={12} /> Confirmar cancelamento?
                          </span>
                          <button
                            className="btn btn-sm"
                            style={{ background: "var(--red)", color: "#fff", border: "none", gap: 5 }}
                            disabled={acting === p.id}
                            onClick={() => act(p.id, "cancel")}>
                            {acting === p.id ? <RefreshCw size={13} /> : <Check size={13} />}
                            Sim, cancelar
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={acting === p.id}
                            onClick={() => setCancelConfirm(null)}>
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red)", gap: 5 }}
                          disabled={acting === p.id}
                          onClick={() => setCancelConfirm(p.id)}>
                          <X size={13} />
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ fontSize: 12, color: "var(--stone)", lineHeight: 1.6 }}>
          <strong>Atenção:</strong> o cancelamento desfaz o efeito do pagamento no sistema (desativa assinatura ou remove créditos), mas <strong>não</strong> faz o estorno bancário automaticamente. Realize a transferência Pix de volta ao cliente manualmente no app do banco.
        </p>
      </div>
    </div>
  );
}
