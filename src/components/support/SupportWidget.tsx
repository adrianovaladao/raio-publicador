"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, X, Send, Loader, ChevronDown,
  Ticket, Phone, AlertCircle, CheckCircle,
} from "lucide-react";

interface Message { role: "user" | "assistant"; content: string }

interface SupportWidgetProps {
  plan: string | null;
}

function isBusinessHours(): boolean {
  const now = new Date();
  const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const day = brt.getDay(); // 0=Sun, 6=Sat
  const hour = brt.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

const hasHumanSupport = (plan: string | null) =>
  plan === "ADVANCED" || plan === "PROFESSIONAL";

export function SupportWidget({ plan }: SupportWidgetProps) {
  const [open, setOpen]               = useState(false);
  const [view, setView]               = useState<"chat" | "ticket" | "ticket-sent" | "human">("chat");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [convId, setConvId]           = useState<string | null>(null);
  const [err, setErr]                 = useState("");
  const [subject, setSubject]         = useState("");
  const [description, setDescription] = useState("");
  const [ticketErr, setTicketErr]     = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [protocol, setProtocol]       = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const businessHours = isBusinessHours();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Olá! Sou o assistente do Raio Publicador 👋 Como posso te ajudar hoje?",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setErr("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId }),
      });
      const data = await res.json() as { reply?: string; conversationId?: string; error?: string };
      if (!res.ok || data.error) { setErr(data.error ?? "Erro ao enviar."); return; }
      setConvId(data.conversationId ?? null);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "" }]);
    } catch { setErr("Falha de conexão."); }
    finally { setLoading(false); }
  }

  async function submitTicket() {
    if (!subject.trim() || !description.trim()) { setTicketErr("Preencha todos os campos."); return; }
    setTicketLoading(true); setTicketErr("");
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, conversationId: convId }),
      });
      const data = await res.json() as { protocol?: string; error?: string };
      if (!res.ok || data.error) { setTicketErr(data.error ?? "Erro ao enviar ticket."); return; }
      setProtocol(data.protocol ?? "");
      setView("ticket-sent");
    } catch { setTicketErr("Falha de conexão."); }
    finally { setTicketLoading(false); }
  }

  return (
    <>
      {/* ── Botão flutuante ── */}
      <button
        className="support-fab"
        onClick={() => setOpen(v => !v)}
        title="Suporte"
        aria-label="Abrir suporte"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* ── Widget ── */}
      {open && (
        <div className="support-widget">
          {/* Header */}
          <div className="sw-head">
            <div className="sw-head-info">
              <div className="sw-avatar">R</div>
              <div>
                <div className="sw-name">Suporte Raio</div>
                <div className="sw-status">
                  <span className={`sw-dot${businessHours ? " online" : ""}`} />
                  {businessHours ? "Online agora" : "Fora do horário comercial"}
                </div>
              </div>
            </div>
            <button className="sw-close" onClick={() => setOpen(false)}><ChevronDown size={18} /></button>
          </div>

          {/* ── View: Chat ── */}
          {view === "chat" && (
            <>
              <div className="sw-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`sw-msg ${m.role}`}>
                    <div className="sw-bubble">{m.content}</div>
                  </div>
                ))}
                {loading && (
                  <div className="sw-msg assistant">
                    <div className="sw-bubble sw-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                {err && <p className="sw-err"><AlertCircle size={12} /> {err}</p>}
                <div ref={bottomRef} />
              </div>

              {/* Actions */}
              <div className="sw-actions">
                <button className="sw-action-btn" onClick={() => setView("ticket")}>
                  <Ticket size={13} /> Abrir ticket
                </button>
                {hasHumanSupport(plan) && (
                  <button className="sw-action-btn" onClick={() => setView("human")}>
                    <Phone size={13} /> Falar com humano
                  </button>
                )}
              </div>

              <div className="sw-input-row">
                <textarea
                  ref={inputRef}
                  className="sw-input"
                  placeholder="Digite sua mensagem…"
                  value={input}
                  rows={1}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button className="sw-send" onClick={sendMessage} disabled={!input.trim() || loading}>
                  {loading ? <Loader size={16} className="spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          )}

          {/* ── View: Ticket ── */}
          {view === "ticket" && (
            <div className="sw-form">
              <div className="sw-form-head">
                <button className="link" style={{ fontSize: 12 }} onClick={() => setView("chat")}>← Voltar</button>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Abrir ticket</span>
              </div>
              <div className="sw-form-body">
                <div className="field">
                  <label>Assunto</label>
                  <input className="input" placeholder="Resumo do problema" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="field">
                  <label>Descrição</label>
                  <textarea className="input" rows={5} placeholder="Descreva em detalhes o que aconteceu…" value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "none" }} />
                </div>
                {ticketErr && <p className="sw-err"><AlertCircle size={12} /> {ticketErr}</p>}
              </div>
              <div className="sw-form-foot">
                <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={submitTicket} disabled={ticketLoading}>
                  {ticketLoading ? <><Loader size={14} className="spin" /> Enviando…</> : <><Send size={14} /> Enviar ticket</>}
                </button>
              </div>
            </div>
          )}

          {/* ── View: Ticket enviado ── */}
          {view === "ticket-sent" && (
            <div className="sw-form" style={{ textAlign: "center" }}>
              <div style={{ padding: "32px 20px" }}>
                <CheckCircle size={40} color="var(--green,#2f8a5b)" style={{ marginBottom: 16 }} />
                <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>Ticket enviado!</p>
                <p style={{ fontSize: 13, color: "var(--stone)", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Protocolo <strong>#{protocol}</strong>. Nossa equipe retorna em até 1 dia útil.
                </p>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setView("chat"); setSubject(""); setDescription(""); }}>
                  Voltar ao chat
                </button>
              </div>
            </div>
          )}

          {/* ── View: Humano ── */}
          {view === "human" && (
            <div className="sw-form">
              <div className="sw-form-head">
                <button className="link" style={{ fontSize: 12 }} onClick={() => setView("chat")}>← Voltar</button>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Suporte humano</span>
              </div>
              <div style={{ padding: "20px 20px 0" }}>
                {businessHours ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "#E3F2E9", borderRadius: 10, marginBottom: 16 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F8A5B", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#2F8A5B", fontWeight: 600 }}>Equipe online agora</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 16px" }}>
                      Para falar com nossa equipe, abra um ticket descrevendo sua dúvida e entraremos em contato pelo e-mail cadastrado o mais breve possível.
                    </p>
                    <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => setView("ticket")}>
                      <Ticket size={14} /> Abrir ticket de atendimento
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--bg)", borderRadius: 10, marginBottom: 16 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--stone)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--stone)", fontWeight: 600 }}>Fora do horário comercial</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 4px" }}>
                      Nossa equipe atende de <strong>seg a sex, das 8h às 18h</strong> (horário de Brasília).
                    </p>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 16px" }}>
                      Deixe um ticket e respondemos no próximo horário comercial.
                    </p>
                    <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => setView("ticket")}>
                      <Ticket size={14} /> Deixar uma mensagem
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
