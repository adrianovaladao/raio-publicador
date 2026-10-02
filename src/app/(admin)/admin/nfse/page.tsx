"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Send, AlertTriangle, CheckCircle, FileX, Clock, ExternalLink, Trash2 } from "lucide-react";

interface NfseRow {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  amountCents: number;
  scheduledFor: string;
  status: string;
  nfeioId: string | null;
  errorMessage: string | null;
  hasFiscalProfile: boolean;
  stripeInvoiceId: string | null;
  pixPaymentId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:           "Pendente",
  SENT:              "Emitida",
  FAILED:            "Erro",
  NO_FISCAL_PROFILE: "Sem perfil fiscal",
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    PENDING:           { bg: "#FEF9C3", color: "#A16207", icon: <Clock size={11} /> },
    SENT:              { bg: "#DCFCE7", color: "#166534", icon: <CheckCircle size={11} /> },
    FAILED:            { bg: "#FEE2E2", color: "#991B1B", icon: <AlertTriangle size={11} /> },
    NO_FISCAL_PROFILE: { bg: "#F3F4F6", color: "#374151", icon: <FileX size={11} /> },
  };
  const c = cfg[status] ?? { bg: "#F3F4F6", color: "#374151", icon: null };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.color, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
      {c.icon} {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function AdminNfsePage() {
  const [invoices, setInvoices] = useState<NfseRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [emitting, setEmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState<"pending" | "sent">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/nfse");
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? String(res.status)); setInvoices([]); }
      else setInvoices(data.invoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteInvoice(invoiceId: string) {
    if (!confirm("Deletar este registro permanentemente?")) return;
    setDeleting(invoiceId);
    try {
      const res = await fetch("/api/admin/nfse", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? `Erro ${res.status}`); }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro inesperado");
    } finally { setDeleting(null); }
  }

  async function emit(invoiceId: string) {
    setEmitting(invoiceId);
    try {
      const res = await fetch("/api/admin/nfse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? `Erro ${res.status}`); }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro inesperado");
    } finally { setEmitting(null); }
  }

  const pending = invoices.filter(i => i.status !== "SENT");
  const sent    = invoices.filter(i => i.status === "SENT");
  const shown   = tab === "pending" ? pending : sent;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Master Admin · Raio Publicador</p>
            <h2>NFS-e</h2>
            <p className="sub">Notas fiscais de serviço</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Atualizar
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {([
            { key: "pending", label: "Pendentes", count: pending.length },
            { key: "sent",    label: "Emitidas",  count: sent.length },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px",
                background: tab === t.key ? "var(--fg)" : "var(--bg2)",
                color:      tab === t.key ? "var(--bg)" : "var(--fg)",
                border: "1px solid var(--line)", borderRadius: 99,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {t.label}
              <span style={{
                background: tab === t.key ? "var(--bg)" : "var(--line)",
                color:      tab === t.key ? "var(--fg)" : "var(--stone)",
                borderRadius: 99, padding: "0 7px", fontSize: 11, fontWeight: 700,
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando…</div></div>
        ) : shown.length === 0 ? (
          <div className="card empty">
            <div className="muted">{tab === "pending" ? "Nenhuma nota pendente." : "Nenhuma nota emitida."}</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg2)" }}>
                    {["Data pagamento", "Nome", "E-mail", "Valor", "Origem", "Status", tab === "pending" ? "Ação" : "NFe.io", ""].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "var(--stone)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < shown.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap", fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)" }}>
                        {fmtDate(inv.scheduledFor)}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                        {inv.name}
                        {!inv.hasFiscalProfile && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--stone)", background: "var(--bg2)", borderRadius: 4, padding: "1px 5px" }}>sem perfil</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--stone)", fontFamily: "var(--mono)", fontSize: 12 }}>{inv.email}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "var(--mono)", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(inv.amountCents)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, color: "var(--stone)", background: "var(--bg2)", borderRadius: 5, padding: "2px 7px" }}>
                          {inv.stripeInvoiceId ? "Stripe" : inv.pixPaymentId ? "Pix" : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={inv.status} />
                        {inv.errorMessage && (
                          <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 4, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={inv.errorMessage}>
                            {inv.errorMessage}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {tab === "pending" ? (
                          <button
                            onClick={() => emit(inv.id)}
                            disabled={emitting === inv.id || !inv.hasFiscalProfile}
                            title={!inv.hasFiscalProfile ? "Usuário sem perfil fiscal cadastrado" : "Emitir NFS-e via NFe.io"}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px",
                              background: inv.hasFiscalProfile ? "#1d4ed8" : "var(--bg2)",
                              color: inv.hasFiscalProfile ? "#fff" : "var(--stone)",
                              border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                              cursor: emitting === inv.id || !inv.hasFiscalProfile ? "not-allowed" : "pointer",
                              opacity: emitting === inv.id ? 0.6 : 1,
                            }}
                          >
                            {emitting === inv.id
                              ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                              : <Send size={12} />}
                            {inv.status === "FAILED" ? "Tentar novamente" : "Emitir"}
                          </button>
                        ) : (
                          inv.nfeioId ? (
                            <a
                              href={`https://app.nfe.io/service-invoices/${inv.nfeioId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--stone)", fontSize: 12, fontFamily: "var(--mono)" }}
                            >
                              <ExternalLink size={12} />
                              {inv.nfeioId.slice(0, 8)}…
                            </a>
                          ) : "—"
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          disabled={deleting === inv.id}
                          title="Deletar registro"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30,
                            background: "none", border: "1px solid var(--line)", borderRadius: 7,
                            color: "var(--stone)", cursor: deleting === inv.id ? "not-allowed" : "pointer",
                            opacity: deleting === inv.id ? 0.5 : 1,
                          }}
                        >
                          {deleting === inv.id
                            ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                            : <Trash2 size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
