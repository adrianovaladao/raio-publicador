"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, useReverification } from "@clerk/nextjs";
import Image from "next/image";
import { extractDominantColor, extractDominantColorFromUrl } from "@/lib/color";
import {
  UserCircle, Settings2, Users, Building2, CreditCard,
  Plus, ChevronDown, Camera, Lock,
  Mail, Download, Check, X, MoreHorizontal, Ban, Trash2, Send, Upload, Zap,
  Rss, Pencil, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  MessageCircle, Ticket,
} from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  segment: string | null;
  color: string | null;
  site: string | null;
  contact: string | null;
  description: string | null;
  boilerplate: string | null;
  authors: string[];
  logoUrl: string | null;
  toneConfig: unknown;
}

// ─── Upgrade modal (shared component) ───────────────────────────────────────

// ─── Mock data ────────────────────────────────────────────────────────────────

const ROLES: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  admin:    { label: "Administração", desc: "Acesso total: edita releases, gerencia pessoas, marcas e cobrança.", color: "#8A6500", bg: "#FCEFCB" },
  editor:   { label: "Edição",        desc: "Escreve, revisa e agenda releases das marcas atribuídas.",          color: "#2A6FDB", bg: "#E6EEFB" },
  reviewer: { label: "Revisão",       desc: "Acessa a lista de releases da marca e adiciona comentários.",        color: "#2F8A5B", bg: "#E3F2E9" },
};

const INVITE_ROLES = Object.fromEntries(Object.entries(ROLES).filter(([k]) => k !== "admin"));


const INVOICES = [
  { id: "INV-2026-06", date: "2026-06-01", amount: "R$ 1.500,00", plan: "Plano Pro · Junho 2026",     status: "paid" },
  { id: "INV-2026-05", date: "2026-05-01", amount: "R$ 1.500,00", plan: "Plano Pro · Maio 2026",      status: "paid" },
  { id: "INV-2026-04", date: "2026-04-01", amount: "R$ 1.500,00", plan: "Plano Pro · Abril 2026",     status: "paid" },
  { id: "INV-2026-03", date: "2026-03-01", amount: "R$ 1.500,00", plan: "Plano Pro · Março 2026",     status: "paid" },
  { id: "INV-2026-02", date: "2026-02-01", amount: "R$ 1.500,00", plan: "Plano Pro · Fevereiro 2026", status: "paid" },
];

const CONSUMPTION = [
  { m: "Jan", credits: 2100 }, { m: "Fev", credits: 2600 }, { m: "Mar", credits: 1900 },
  { m: "Abr", credits: 3400 }, { m: "Mai", credits: 4200 }, { m: "Jun", credits: 3200 },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase();
}



// ─── Shared ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const r = ROLES[role];
  if (!r) return null;
  return <span className="role-badge" style={{ color: r.color, background: r.bg }}>{r.label}</span>;
}

function Av({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <span className="set-av" style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}>
      {getInitials(name)}
    </span>
  );
}

function PanelHead({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="set-phead">
      <div>
        <h2 dangerouslySetInnerHTML={{ __html: title }} />
        {desc && <p className="set-pdesc">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

function PerfilPanel({ onToast }: { onToast: (m: string) => void }) {
  const { user, isLoaded } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [cargo,     setCargo]     = useState("");
  const [telefone,  setTelefone]  = useState("");
  const [bio,       setBio]       = useState("");
  const [timezone,  setTimezone]  = useState("America/Sao_Paulo");
  const [saving,    setSaving]    = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (user.unsafeMetadata ?? {}) as any;
    setCargo(meta.cargo ?? "");
    setTelefone(meta.telefone ?? "");
    setBio(meta.bio ?? "");
    setTimezone(meta.timezone ?? "America/Sao_Paulo");
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({
        firstName,
        lastName,
        unsafeMetadata: { cargo, telefone, bio, timezone },
      });
      onToast("Perfil atualizado");
    } catch {
      onToast("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoLoading(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      onToast("Foto atualizada");
    } catch {
      onToast("Erro ao enviar foto");
    } finally {
      setPhotoLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemovePhoto() {
    if (!user) return;
    try {
      await user.setProfileImage({ file: null });
      onToast("Foto removida");
    } catch {
      onToast("Erro ao remover foto");
    }
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "?";

  if (!isLoaded) return <div className="set-panel"><div className="card card-pad muted">Carregando…</div></div>;

  return (
    <div className="set-panel">
      <PanelHead title="Perfil" desc="Como você aparece para a equipe e nos releases que assina." />
      <div className="card card-pad">
        <div className="profile-top">
          {user?.hasImage ? (
            <Image src={user.imageUrl} alt={fullName} width={76} height={76}
              style={{ borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <Av name={fullName} color="#C25E00" size={76} />
          )}
          <div className="profile-photo-actions">
            <div className="row" style={{ gap: 10 }}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={handlePhoto} />
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={photoLoading}>
                <Camera size={15} /> {photoLoading ? "Enviando…" : "Alterar foto"}
              </button>
              <button className="btn btn-quiet btn-sm" onClick={handleRemovePhoto}>Remover</button>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>JPG ou PNG quadrado, até 2 MB.</p>
          </div>
        </div>
        <div className="set-grid2" style={{ marginTop: 22 }}>
          <div className="field"><label>Nome</label><input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Primeiro nome" /></div>
          <div className="field"><label>Sobrenome</label><input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" /></div>
          <div className="field"><label>Cargo / função</label><input className="input" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex.: Assessor de imprensa" /></div>
          <div className="field"><label>Telefone</label><input className="input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-0000" /></div>
          <div className="field">
            <label>Fuso horário</label>
            <div className="select-wrap">
              <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                <option value="America/Rio_Branco">Acre (GMT-5)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        <div className="field" style={{ marginTop: 4 }}>
          <label>Bio curta</label>
          <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Em uma frase, o que você faz." />
        </div>
        <div className="set-foot">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Conta ────────────────────────────────────────────────────────────────────

// ─── Cancel flow ─────────────────────────────────────────────────────────────

type CancelStep = "idle" | "retention" | "policy" | "confirm" | "done";

function CancelFlow({ plan, email, periodEnd, onDone }: {
  plan: string; email: string; periodEnd: string | null; onDone: () => void;
}) {
  const [step, setStep] = useState<CancelStep>("idle");
  const [zapping, setZapping] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [err, setErr] = useState("");

  const isAdvanced = plan === "ADVANCED";
  const isProfessional = plan === "PROFESSIONAL";
  const hasRetention = isAdvanced || isProfessional;

  const discountPct = isProfessional ? 50 : 25;
  const periodEndFmt = periodEnd ? fmtDate(periodEnd) : "fim do ciclo";

  function handleButtonClick() {
    setZapping(true);
    setTimeout(() => {
      setZapping(false);
      setStep(hasRetention ? "retention" : "policy");
    }, 900);
  }

  async function handleConfirmCancel() {
    if (emailInput.trim().toLowerCase() !== email.toLowerCase()) {
      setErr("E-mail incorreto. Digite exatamente seu e-mail de cadastro.");
      return;
    }
    setCancelling(true);
    setErr("");
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao cancelar");
      setStep("done");
      onDone();
    } catch {
      setErr("Falha ao cancelar. Tente novamente ou entre em contato com o suporte.");
    } finally {
      setCancelling(false);
    }
  }

  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Assinatura cancelada</div>
        <div style={{ fontSize: 13, color: "var(--stone)", maxWidth: 380, margin: "0 auto" }}>
          Seu acesso permanece ativo até <b>{periodEndFmt}</b>. Use seus créditos até lá — eles não serão reembolsados.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes zap {
          0%   { transform: rotate(0deg) scale(1); }
          15%  { transform: rotate(-8deg) scale(1.15); filter: brightness(1.8); }
          30%  { transform: rotate(8deg) scale(0.9); }
          45%  { transform: rotate(-6deg) scale(1.2); filter: brightness(2.2); }
          60%  { transform: rotate(6deg) scale(0.95); }
          75%  { transform: rotate(-4deg) scale(1.1); filter: brightness(1.5); }
          90%  { transform: rotate(2deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); filter: brightness(1); }
        }
        .btn-cancel-zap { transition: background 0.2s; }
        .btn-cancel-zap:hover { background: #fee2e2 !important; }
        .zap-icon { display: inline-block; }
        .zap-icon.zapping { animation: zap 0.85s ease-in-out; }
      `}</style>

      <div className="card danger-card" style={{ marginTop: 16 }}>
        <div className="card-pad set-inline-row" style={{ padding: 22 }}>
          <div>
            <div className="sir-title">Cancelar assinatura</div>
            <div className="sir-sub">Você mantém o acesso até o fim do ciclo atual. Créditos não são reembolsados.</div>
          </div>
          <button
            className="btn btn-danger btn-sm btn-cancel-zap"
            onClick={handleButtonClick}
            disabled={zapping}
          >
            <span className={`zap-icon${zapping ? " zapping" : ""}`}>
              <Zap size={15} fill="currentColor" />
            </span>
            {zapping ? "…" : "Cancelar assinatura"}
          </button>
        </div>
      </div>

      {/* Retention modal */}
      {step === "retention" && (
        <div className="overlay" onClick={() => setStep("idle")}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="m-head">
              <span style={{ fontSize: 28 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Espera — temos uma oferta para você</div>
                <div style={{ fontSize: 13, color: "var(--stone)", marginTop: 2 }}>Antes de ir, que tal continuar com desconto?</div>
              </div>
            </div>
            <div className="m-body">
              <div style={{ background: "var(--cream)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "var(--stone)", marginBottom: 4 }}>Sua oferta exclusiva</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
                  {discountPct}% de desconto
                </div>
                <div style={{ fontSize: 13, color: "var(--stone)", marginTop: 4 }}>
                  no Plano {isProfessional ? "Profissional" : "Avançado"} pelos próximos 30 dias. Seus créditos continuam válidos.
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--stone)" }}>
                Se ainda assim quiser cancelar, podemos fazer isso — mas essa oferta não estará disponível depois.
              </p>
            </div>
            <div className="m-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep("policy")}>Não, quero cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={() => setStep("idle")}>
                Quero o desconto de {discountPct}%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy modal */}
      {step === "policy" && (
        <div className="overlay" onClick={() => setStep("idle")}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="m-head">
              <div style={{ fontWeight: 700, fontSize: 17 }}>Política de cancelamento</div>
            </div>
            <div className="m-body">
              <ul style={{ fontSize: 13, color: "var(--stone)", lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                <li><b>Sem reembolso</b> — o valor pago não é devolvido.</li>
                <li><b>Créditos</b> — devem ser usados até o fim do ciclo atual ({periodEndFmt}). Após isso, expiram.</li>
                <li><b>Releases não publicados</b> — podem ser editados até o fim do ciclo. Após o cancelamento, ficam arquivados e não serão mais distribuídos.</li>
                <li><b>Releases já publicados</b> — permanecem nos veículos normalmente.</li>
                <li><b>Acesso</b> — sua conta será suspensa automaticamente em {periodEndFmt}.</li>
              </ul>
            </div>
            <div className="m-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep("idle")}>Voltar</button>
              <button className="btn btn-danger btn-sm" onClick={() => setStep("confirm")}>Entendi, continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {step === "confirm" && (
        <div className="overlay" onClick={() => setStep("idle")}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="m-head">
              <div style={{ fontWeight: 700, fontSize: 17 }}>Confirmar cancelamento</div>
            </div>
            <div className="m-body">
              <p style={{ fontSize: 13, color: "var(--stone)", marginBottom: 16 }}>
                Para confirmar, digite seu e-mail de cadastro:
              </p>
              <div className="field">
                <input
                  className="input"
                  type="email"
                  placeholder={email}
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setErr(""); }}
                  autoFocus
                />
              </div>
              {err && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{err}</p>}
            </div>
            <div className="m-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep("policy")}>Voltar</button>
              <button
                className="btn btn-danger btn-sm"
                disabled={cancelling || !emailInput}
                onClick={handleConfirmCancel}
              >
                {cancelling ? "Cancelando…" : "Cancelar minha assinatura"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ContaPanel({ onToast }: { onToast: (m: string) => void }) {
  const { user, isLoaded } = useUser();
  const [notif, setNotif] = useState({ sent: true, queued: true, published: true, review: false });
  const [subInfo, setSubInfo] = useState<{ plan: string; periodEnd: string | null } | null>(null);

  // troca de senha
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [savingPw,   setSavingPw]   = useState(false);

  const updatePasswordWithReverification = useReverification(
    (params: { currentPassword: string; newPassword: string }) =>
      user!.updatePassword(params)
  );

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSubInfo({ plan: d.plan ?? "BASIC", periodEnd: d.currentPeriodEnd ?? null }); })
      .catch(() => {});
  }, []);

  async function handleChangePassword() {
    if (!user || !newPw) return;
    setSavingPw(true);
    try {
      await updatePasswordWithReverification({ currentPassword: currentPw, newPassword: newPw });
      onToast("Senha alterada com sucesso");
      setShowPwForm(false);
      setCurrentPw(""); setNewPw("");
    } catch (err: unknown) {
      const e = err as { errors?: { message?: string }[] };
      onToast(e?.errors?.[0]?.message ?? "Erro ao alterar senha");
    } finally {
      setSavingPw(false);
    }
  }

  if (!isLoaded) return <div className="set-panel"><div className="card card-pad muted">Carregando…</div></div>;

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div className="set-panel">
      <PanelHead title="Conta" desc="Login, segurança e preferências de notificação." />

      <div className="card">
        <div className="card-head"><h3>Acesso</h3></div>
        <div className="card-pad">
          <div className="set-grid2">
            <div className="field">
              <label>E-mail de login</label>
              <input className="input" type="email" value={email} readOnly
                style={{ opacity: 0.7, cursor: "default" }} title="Para alterar o e-mail, entre em contato com o suporte." />
            </div>
            <div className="field">
              <label>Idioma</label>
              <div className="select-wrap"><select className="input"><option>Português (Brasil)</option><option>English</option></select><ChevronDown size={16} /></div>
            </div>
          </div>

          {!showPwForm ? (
            <div className="set-inline-row">
              <div><div className="sir-title">Senha</div><div className="sir-sub">Altere sua senha de acesso.</div></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPwForm(true)}><Lock size={15} /> Alterar senha</button>
            </div>
          ) : (
            <div className="card" style={{ padding: "18px 20px", marginTop: 8, marginBottom: 4, background: "var(--cream)" }}>
              <div className="set-grid2" style={{ marginBottom: 12 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Senha atual</label>
                  <input className="input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Senha atual" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Nova senha</label>
                  <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} />
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={handleChangePassword} disabled={savingPw || !currentPw || newPw.length < 8}>
                  {savingPw ? "Salvando…" : <><Check size={15} /> Salvar nova senha</>}
                </button>
                <button className="btn btn-quiet btn-sm" onClick={() => { setShowPwForm(false); setCurrentPw(""); setNewPw(""); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Notificações</h3></div>
        <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {([["sent","Release enviado para publicação","Confirmação quando o release é submetido."],["queued","Release adicionado à fila","Quando o release é recebido e entra na fila de publicação."],["published","Release publicado no veículo","Quando o release entra no ar em cada veículo selecionado."],["review","Release precisa de revisão","Quando um veículo solicita ajustes antes de publicar."]] as [keyof typeof notif,string,string][]).map(([k,t,d]) => (
            <div className="set-inline-row" key={k}>
              <div><div className="sir-title">{t}</div><div className="sir-sub">{d}</div></div>
              <button className={`toggle${notif[k] ? " on" : ""}`} onClick={() => setNotif(n => ({ ...n, [k]: !n[k] }))}><span className="knob" /></button>
            </div>
          ))}
        </div>
      </div>

      <CancelFlow
        plan={subInfo?.plan ?? "BASIC"}
        email={email}
        periodEnd={subInfo?.periodEnd ?? null}
        onDone={() => onToast("Assinatura cancelada. Seu acesso permanece até o fim do ciclo.")}
      />
    </div>
  );
}

// ─── Equipe ───────────────────────────────────────────────────────────────────

interface InviteRow { id: string; email: string; role: string; brandIds: string[]; sentAt: string }

interface SlotsInfo { editorsUsed: number; editorsLimit: number; reviewersUsed: number; reviewersLimit: number; }

function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: (inv: InviteRow) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState("editor");
  const [sending, setSending] = useState(false);
  const [err, setErr]     = useState("");
  const [slots, setSlots] = useState<SlotsInfo | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stripe/subscription").then(r => r.json()),
      fetch("/api/team/members").then(r => r.json()),
      fetch("/api/invites").then(r => r.json()),
    ]).then(([sub, members, invites]: [
      { plan?: string; editorsLimit?: number; reviewersLimit?: number },
      { role: string; status: string }[],
      { role: string }[]
    ]) => {
      const editorsUsed    = (members.filter(m => m.role === "EDITOR"   && m.status === "ACTIVE").length)
                           + (invites.filter(i => i.role === "EDITOR").length);
      const reviewersUsed  = (members.filter(m => m.role === "REVIEWER" && m.status === "ACTIVE").length)
                           + (invites.filter(i => i.role === "REVIEWER").length);
      setSlots({
        editorsUsed,
        editorsLimit:   sub.editorsLimit   ?? 0,
        reviewersUsed,
        reviewersLimit: sub.reviewersLimit ?? 0,
      });
    }).catch(() => {});
  }, []);

  async function send() {
    if (!email.trim()) { setErr("Informe o e-mail."); return; }
    setSending(true); setErr("");
    try {
      const res  = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role, brandIds: [] }),
      });
      const data = await res.json() as InviteRow & { error?: string };
      if (!res.ok) { setErr(data.error ?? `Erro ${res.status}`); return; }
      onSent(data);
      onClose();
    } catch { setErr("Falha de conexão."); }
    finally { setSending(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-head"><h3>Convidar para a <em>equipe</em></h3></div>
        <div className="m-body">
          <div className="field"><label>E-mail</label><input className="input" type="email" placeholder="nome@empresa.com.br" autoFocus value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} /></div>
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ margin: 0 }}>Função</label>
              {slots && (
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--stone)", letterSpacing: "0.04em" }}>
                  {slots.editorsUsed}/{slots.editorsLimit} editores · {slots.reviewersUsed}/{slots.reviewersLimit} revisores
                </span>
              )}
            </div>
            <div className="role-pick">
              {Object.entries(INVITE_ROLES).map(([k, r]) => {
                const atLimit = slots && (
                  (k === "editor"   && slots.editorsUsed   >= slots.editorsLimit) ||
                  (k === "reviewer" && slots.reviewersUsed >= slots.reviewersLimit)
                );
                return (
                  <button key={k} className={`role-opt${role === k ? " on" : ""}${atLimit ? " disabled" : ""}`}
                    onClick={() => { if (!atLimit) setRole(k); }}
                    style={atLimit ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                    title={atLimit ? "Limite do plano atingido" : undefined}
                  >
                    <span className="ro-radio" />
                    <span><span className="ro-name">{r.label}</span><span className="ro-desc">{r.desc}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
          {role === "reviewer" && <p className="muted" style={{ fontSize: 12, margin: "-8px 0 12px" }}>Revisão acessa apenas a marca atribuída.</p>}
          {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, margin: "0 0 12px", fontWeight: 500 }}>{err}</p>}
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={send} disabled={sending}><Send size={15} /> {sending ? "Enviando…" : "Enviar convite"}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="m-body" style={{ paddingTop: 28 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{message}</p>
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm" style={{ background: "var(--red,#c0392b)", color: "#fff", border: "none" }} onClick={onConfirm}>Remover</button>
        </div>
      </div>
    </div>
  );
}

interface MemberRow { id: string; name: string; email: string; role: string; status: string }

function EquipePanel({ onToast }: { onToast: (m: string) => void }) {
  const { user } = useUser();
  const [showInvite, setShowInvite] = useState(false);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  useEffect(() => {
    fetch("/api/invites")
      .then(r => r.json())
      .then((data: InviteRow[]) => setInvites(data))
      .catch(() => {});
    fetch("/api/team/members")
      .then(r => r.json())
      .then((data: MemberRow[]) => setMembers(data))
      .catch(() => {});
  }, []);

  async function updateMember(id: string, data: { role?: string; status?: string }) {
    await fetch(`/api/team/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data, role: (data.role ?? m.role).toUpperCase(), status: (data.status ?? m.status).toUpperCase() } : m));
  }

  async function removeMember(id: string, name: string) {
    await fetch(`/api/team/members/${id}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.id !== id));
    onToast(`${name} foi removido`);
  }

  async function cancelInvite(id: string) {
    await fetch(`/api/invites/${id}`, { method: "DELETE" }).catch(() => {});
    setInvites(prev => prev.filter(i => i.id !== id));
    onToast("Convite cancelado");
  }

  async function resendInvite(inv: InviteRow) {
    await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inv.email, role: inv.role.toLowerCase(), brandIds: inv.brandIds }),
    }).catch(() => {});
    onToast("Convite reenviado");
  }

  return (
    <div className="set-panel">
      <PanelHead title="Equipe e <em>permissões</em>" desc="Convide pessoas e defina o que cada uma pode fazer."
        action={<button className="btn btn-primary" onClick={() => setShowInvite(true)}><Plus size={16} /> Convidar</button>} />

      <div className="roles-legend">
        {Object.entries(ROLES).map(([k, r]) => (
          <div className="rl-item" key={k}>
            <RoleBadge role={k} />
            <p style={{ fontSize: 13, color: "var(--stone)", margin: "8px 0 0", lineHeight: 1.45 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Membros <span className="count-chip">{1 + members.length}</span></h3></div>
        <table className="tbl team-tbl">
          <thead><tr><th>Pessoa</th><th>Função</th><th>Marcas</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {/* Owner — always first */}
            <tr>
              <td>
                <div className="row" style={{ gap: 11 }}>
                  <Av name={fullName || "?"} color="#C25E00" size={34} />
                  <div>
                    <div className="title-cell" style={{ fontSize: 14 }}>{fullName}<span className="muted" style={{ fontWeight: 400 }}> · você</span></div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--stone)" }}>{email}</div>
                  </div>
                </div>
              </td>
              <td><RoleBadge role="admin" /></td>
              <td className="muted" style={{ fontSize: 13 }}>Todas as marcas</td>
              <td><span className="dot-status active">Ativo</span></td>
              <td />
            </tr>
            {/* Team members from DB */}
            {members.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="row" style={{ gap: 11 }}>
                    <Av name={m.name} color="#2A6FDB" size={34} />
                    <div>
                      <div className="title-cell" style={{ fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--stone)" }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={m.role.toLowerCase()} /></td>
                <td className="muted" style={{ fontSize: 13 }}>—</td>
                <td>{m.status === "ACTIVE" ? <span className="dot-status active">Ativo</span> : <span className="dot-status suspended">Suspenso</span>}</td>
                <td style={{ textAlign: "right", position: "relative" }}>
                  <button className="row-menu-btn" onClick={() => setMenu(menu === m.id ? null : m.id)}><MoreHorizontal size={18} /></button>
                  {menu === m.id && (
                    <>
                      <div className="menu-backdrop" onClick={() => setMenu(null)} />
                      <div className="row-menu">
                        <div style={{ padding: "6px 14px 4px", fontSize: 11, color: "var(--stone)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Função</div>
                        {["admin","editor","reviewer"].map(r => (
                          <button key={r} onClick={() => { updateMember(m.id, { role: r }); setMenu(null); onToast("Função atualizada"); }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {m.role.toLowerCase() === r && <Check size={13} />}
                            <span style={{ marginLeft: m.role.toLowerCase() === r ? 0 : 21 }}>{ROLES[r]?.label ?? r}</span>
                          </button>
                        ))}
                        <div style={{ height: 1, background: "var(--line)", margin: "6px 0" }} />
                        {m.status === "ACTIVE"
                          ? <button onClick={() => { updateMember(m.id, { status: "suspended" }); setMenu(null); onToast(`${m.name} foi suspenso`); }}><Ban size={14} /> Suspender</button>
                          : <button onClick={() => { updateMember(m.id, { status: "active" }); setMenu(null); onToast(`${m.name} foi reativado`); }}><Check size={14} /> Reativar</button>}
                        <button className="danger" onClick={() => { setMenu(null); setConfirmRemove({ id: m.id, name: m.name }); }}><Trash2 size={14} /> Remover</button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h3>Convites pendentes <span className="count-chip">{invites.length}</span></h3></div>
          {invites.map(inv => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 22px", borderTop: "1px solid var(--line)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--cream)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Mail size={17} style={{ color: "var(--stone)" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sir-title" style={{ fontSize: 14 }}>{inv.email}</div>
                <div className="sir-sub">Enviado em {fmtDate(inv.sentAt)}</div>
              </div>
              <div className="row" style={{ marginLeft: "auto", gap: 8, flexShrink: 0 }}>
                <RoleBadge role={inv.role.toLowerCase()} />
                <button className="btn btn-quiet btn-sm" onClick={() => resendInvite(inv)}>Reenviar</button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => cancelInvite(inv.id)}><X size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSent={inv => { setInvites(prev => [inv, ...prev]); onToast("Convite enviado!"); }} />}
      {confirmRemove && (
        <ConfirmModal
          message={`Remover ${confirmRemove.name} da equipe?`}
          onConfirm={() => { removeMember(confirmRemove.id, confirmRemove.name); setConfirmRemove(null); }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}

// ─── Marcas ───────────────────────────────────────────────────────────────────

const BRAND_COLORS   = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

function BrandAv({ name, color, logoUrl, size = 36 }: { name: string | null | undefined; color: string | null | undefined; logoUrl?: string | null; size?: number }) {
  const bg = color ?? "#1A1A1A";
  if (logoUrl) {
    return (
      <span style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: bg, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name ?? ""} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </span>
    );
  }
  return (
    <span style={{ width: size, height: size, borderRadius: 8, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: Math.round(size * 0.38), color: "#fff", flexShrink: 0 }}>
      {getInitials(name)}
    </span>
  );
}

async function uploadBrandLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res  = await fetch("/api/upload", { method: "POST", body: form });
  const text = await res.text();
  let data: { url?: string; error?: string } = {};
  try { data = JSON.parse(text); } catch { /* ignore */ }
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status} no upload`);
  if (!data.url) throw new Error("Upload falhou: URL não retornada");
  return data.url;
}

function BrandFormModal({ brand, onClose, onSaved }: {
  brand?: Brand;
  onClose: () => void;
  onSaved: (b: Brand) => void;
}) {
  const isEdit = !!brand;
  const [name,    setName]    = useState(brand?.name ?? "");
  const [segment, setSegment] = useState(brand?.segment ?? BRAND_SEGMENTS[0]);
  const [site,    setSite]    = useState(brand?.site ?? "");
  const [contact, setContact] = useState(brand?.contact ?? "");
  const [desc,    setDesc]    = useState(brand?.description ?? "");
  const [boiler,  setBoiler]  = useState(brand?.boilerplate ?? "");
  const [authors, setAuthors] = useState<string[]>(brand?.authors ?? []);
  const [authorInput, setAuthorInput] = useState("");
  const [color,   setColor]   = useState(brand?.color ?? BRAND_COLORS[0]);
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(brand?.logoUrl ?? "");
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Ao abrir modal de edição com logo já salvo, extrai a cor dominante automaticamente
  useEffect(() => {
    if (brand?.logoUrl && brand.logoUrl === logoPreview) {
      extractDominantColorFromUrl(brand.logoUrl).then(setColor);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    const dominant = await extractDominantColor(file);
    setColor(dominant);
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      let finalLogo = logoUrl;
      if (logoFile) finalLogo = await uploadBrandLogo(logoFile);
      const body = { name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null, boilerplate: boiler.trim() || null, authors, logoUrl: finalLogo || null };
      const url = isEdit ? `/api/brands/${brand!.id}` : "/api/brands";
      const method = isEdit ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(text)?.error ?? msg; } catch { /* ignore */ }
        setErr(msg); return;
      }
      const saved = JSON.parse(text) as Brand;
      onSaved(saved);
      onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setSaving(false); }
  }

  async function deleteBrand() {
    if (!brand) return;
    setDeleting(true);
    try {
      await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
      onSaved({ ...brand, id: `__deleted__${brand.id}` });
      onClose();
    } catch { setErr("Erro ao excluir."); }
    finally { setDeleting(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>{isEdit ? "Editar" : "Cadastrar nova"} <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          {/* Preview + logo */}
          <div className="nb-preview">
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              <BrandAv name={name || "?"} color={color} logoUrl={logoPreview || null} size={40} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
          <div className="field">
            <label>Logotipo</label>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => fileRef.current?.click()} style={{ gap: 7 }}>
                <Upload size={14} /> {logoPreview ? "Trocar imagem" : "Adicionar logo"}
              </button>
              {logoPreview && (
                <button type="button" className="btn btn-quiet btn-sm" style={{ color: "var(--red,#c0392b)" }}
                  onClick={() => { setLogoPreview(""); setLogoFile(null); setLogoUrl(""); }}>
                  Remover
                </button>
              )}
            </div>
          </div>
          {/* Campos */}
          <div className="nb-grid2">
            <div className="field"><label>Nome da marca / cliente</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Franquia Sabor Brasil" autoFocus /></div>
            <div className="field">
              <label>Segmento / setor</label>
              <div className="select-wrap">
                <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                  {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field"><label>Site</label><input className="input" value={site} onChange={e => setSite(e.target.value)} placeholder="www.exemplo.com.br" /></div>
            <div className="field"><label>Pessoa de contato</label><input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do responsável" /></div>
          </div>
          <div className="field"><label>Descrição curta</label><textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Em uma frase, o que a marca faz." /></div>
          <div className="field"><label>Boilerplate <span className="muted" style={{ fontWeight: 400 }}>· &ldquo;sobre a empresa&rdquo;</span></label><textarea className="input" rows={3} value={boiler} onChange={e => setBoiler(e.target.value)} placeholder={`A ${name || "marca"} é referência em ${segment.toLowerCase()}.`} /></div>
          <div className="field">
            <label>Autores</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Nome do autor ou porta-voz"
                value={authorInput}
                onChange={e => setAuthorInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = authorInput.trim();
                    if (v && !authors.includes(v)) setAuthors(a => [...a, v]);
                    setAuthorInput("");
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => {
                  const v = authorInput.trim();
                  if (v && !authors.includes(v)) setAuthors(a => [...a, v]);
                  setAuthorInput("");
                }}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
            {authors.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {authors.map(a => (
                  <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 99, padding: "3px 10px 3px 12px", fontSize: 13 }}>
                    {a}
                    <button type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--stone)" }} onClick={() => setAuthors(prev => prev.filter(x => x !== a))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Cor de identificação</label>
            <div className="nb-colors">
              {BRAND_COLORS.map(c => (
                <button key={c} className={`nb-color${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} type="button">
                  {color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot" style={{ justifyContent: isEdit ? "space-between" : "flex-end" }}>
          {isEdit && (
            <button className="btn btn-quiet btn-sm" style={{ color: "var(--red,#c0392b)" }} onClick={() => setConfirmDelete(true)} disabled={deleting}>
              {deleting ? "Excluindo…" : <><Trash2 size={14} /> Excluir marca</>}
            </button>
          )}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" disabled={!name.trim() || saving} onClick={save}>
              <Check size={15} /> {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar marca"}
            </button>
          </div>
        </div>
      </div>
      {confirmDelete && brand && (
        <ConfirmModal
          message={`Excluir a marca "${brand.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => { setConfirmDelete(false); deleteBrand(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function MarcasPanel({ onToast }: { onToast: (m: string) => void }) {
  const [brands,       setBrands]       = useState<Brand[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState<Brand | null>(null);
  const [showNew,      setShowNew]      = useState(false);
  const [showUpgrade,  setShowUpgrade]  = useState(false);
  const [currentPlan,  setCurrentPlan]  = useState<string | null>(null);
  const [brandsLimit,  setBrandsLimit]  = useState<number | null>(null);
  useEffect(() => {
    Promise.all([
      fetch("/api/brands").then(r => r.json()),
      fetch("/api/stripe/subscription").then(r => r.json()),
    ]).then(([brandsData, subData]) => {
      setBrands(Array.isArray(brandsData) ? (brandsData as Brand[]) : []);
      const s = subData as { plan?: string; brandsLimit?: number };
      setCurrentPlan(s.plan ?? null);
      setBrandsLimit(s.brandsLimit ?? null);
    }).catch(() => setBrands([])).finally(() => setLoading(false));
  }, []);

  function handleNewClick() {
    if (brandsLimit !== null && brands.length >= brandsLimit) {
      setShowUpgrade(true);
    } else {
      setShowNew(true);
    }
  }

  function handleSaved(b: Brand) {
    if (b.id.startsWith("__deleted__")) {
      setBrands(prev => prev.filter(x => x.id !== b.id.replace("__deleted__", "")));
      onToast("Marca excluída");
    } else if (brands.find(x => x.id === b.id)) {
      setBrands(prev => prev.map(x => x.id === b.id ? b : x));
      onToast("Marca atualizada");
    } else {
      setBrands(prev => [...prev, b]);
      onToast(`Marca "${b.name}" criada`);
    }
  }

  if (loading) return <div className="set-panel"><div className="card card-pad muted">Carregando…</div></div>;

  const atLimit = brandsLimit !== null && brands.length >= brandsLimit;

  return (
    <div className="set-panel">
      <PanelHead
        title="Suas <em>marcas</em>"
        desc={brandsLimit ? `${brands.length} de ${brandsLimit} marcas utilizadas no seu plano.` : "Clique em uma marca para editar seus dados."}
        action={
          <button className={`btn ${atLimit ? "btn-ghost" : "btn-primary"}`} onClick={handleNewClick}>
            <Plus size={16} /> Nova marca
          </button>
        }
      />

      <div className="card">
        {brands.length === 0 ? (
          <div className="card-pad" style={{ textAlign: "center", padding: "40px 24px" }}>
            <Building2 size={32} style={{ color: "var(--stone)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "var(--stone)", margin: 0 }}>Nenhuma marca cadastrada ainda.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>Marca</th>
                <th>Segmento</th>
                <th>Site</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brands.map(b => (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setEditing(b)}>
                  <td className="title-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <BrandAv name={b.name} color={b.color} logoUrl={b.logoUrl} size={32} />
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                  </td>
                  <td className="muted">{b.segment ?? "—"}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{b.site ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-quiet btn-sm" onClick={e => { e.stopPropagation(); setEditing(b); }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing     && <BrandFormModal brand={editing} onClose={() => setEditing(null)} onSaved={b => { handleSaved(b); setEditing(null); }} />}
      {showNew     && <BrandFormModal onClose={() => setShowNew(false)} onSaved={b => { handleSaved(b); setShowNew(false); }} />}
      {showUpgrade && <UpgradeModal currentPlan={currentPlan ?? ""} onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

// ─── Cobrança ─────────────────────────────────────────────────────────────────

function CobrancaPanel({ onToast }: { onToast: (m: string) => void }) {
  const [planLabel,       setPlanLabel]       = useState<string>("—");
  const [plan,            setPlan]            = useState<string>("BASIC");
  const [priceCents,      setPriceCents]      = useState<number | null>(null);
  const [credits,         setCredits]         = useState(0);
  const [creditsUsed,     setCreditsUsed]     = useState(0);
  const [showBuyCredits,  setShowBuyCredits]  = useState(false);

  useEffect(() => {
    fetch("/api/stripe/subscription").then(r => r.json()).then((s: { plan?: string; label?: string; priceCents?: number; credits?: number; creditsUsed?: number }) => {
      if (s.plan)       setPlan(s.plan);
      if (s.label)      setPlanLabel(s.label);
      if (s.priceCents) setPriceCents(s.priceCents);
      if (s.credits)    setCredits(s.credits);
      setCreditsUsed(s.creditsUsed ?? 0);
    }).catch(() => {});
  }, []);

  const pct  = credits > 0 ? Math.round((creditsUsed / credits) * 100) : 0;
  const left = credits - creditsUsed;
  const maxC = Math.max(...CONSUMPTION.map(c => c.credits));

  const priceStr = priceCents != null
    ? (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "—";

  return (
    <div className="set-panel">
      <PanelHead title="Cobrança e <em>créditos</em>" desc="Plano, consumo, pagamento e faturas." />
      {showBuyCredits && <BuyCreditsModal currentPlan={plan} onClose={() => setShowBuyCredits(false)} />}

      <div className="card billing-plan">
        <div className="bp-left">
          <div className="bp-label">Plano atual</div>
          <div className="bp-name">{planLabel}</div>
          <div className="bp-price">{priceStr} <span>/mês · renova em {(() => { const d = new Date(); const r = new Date(d.getFullYear(), d.getMonth()+1, 1); return `${String(r.getDate()).padStart(2,"0")}/${String(r.getMonth()+1).padStart(2,"0")}/${r.getFullYear()}`; })()}</span></div>
          <div className="row" style={{ gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.dispatchEvent(new Event("open-plans"))}>Mudar de plano</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowBuyCredits(true)}><Zap size={15} /> Comprar créditos</button>
          </div>
        </div>
        <div className="bp-right">
          <div className="bp-credit-top">
            <span className="bp-credit-num">{left.toLocaleString("pt-BR")}</span>
            <span className="bp-credit-of">de {credits.toLocaleString("pt-BR")} créditos</span>
          </div>
          <div className="bp-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="bp-bar-legend"><span>{creditsUsed.toLocaleString("pt-BR")} usados neste ciclo</span><span>{pct}%</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Consumo por <em>mês</em></h3><span className="muted" style={{ fontSize: 13 }}>créditos</span></div>
        <div className="card-pad">
          <div className="cons-chart">
            {CONSUMPTION.map(c => (
              <div className="cons-col" key={c.m} title={`${c.credits.toLocaleString("pt-BR")} créditos`}>
                <div className="cons-bar-wrap"><div className="cons-bar" style={{ height: `${(c.credits / maxC) * 100}%` }} /></div>
                <span className="cons-val">{(c.credits / 1000).toFixed(1).replace(".",",")}k</span>
                <span className="cons-m">{c.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="set-grid2" style={{ marginTop: 16, alignItems: "start" }}>
        <div className="card">
          <div className="card-head"><h3>Forma de pagamento</h3></div>
          <div className="card-pad">
            <div className="pay-card">
              <div className="pay-brand"><CreditCard size={20} /></div>
              <div><div className="sir-title">Visa •••• 4218</div><div className="sir-sub">Expira em 09/2028</div></div>
              <button className="btn btn-quiet btn-sm" style={{ marginLeft: "auto" }} onClick={() => onToast("Editar cartão")}>Trocar</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Dados de cobrança</h3><button className="link" onClick={() => onToast("Editar dados")}>Editar</button></div>
          <div className="card-pad" style={{ paddingTop: 16 }}>
            {[["Razão social","Markable Assessoria Ltda."],["CNPJ","23.456.789/0001-12"],["Endereço","Av. Paulista, 1000 · São Paulo, SP"],["E-mail fiscal","financeiro@markable.com.br"]].map(([k,v]) => (
              <div className="billdata-row" key={k}><span className="bd-k">{k}</span><span className="bd-v">{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Faturas</h3><button className="link" onClick={() => onToast("Baixando faturas")}>Baixar todas</button></div>
        <table className="tbl">
          <thead><tr><th>Fatura</th><th>Data</th><th>Descrição</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id}>
                <td className="title-cell" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{inv.id}</td>
                <td className="muted num">{fmtDate(inv.date)}</td>
                <td className="muted">{inv.plan}</td>
                <td className="num" style={{ fontWeight: 600 }}>{inv.amount}</td>
                <td><span className="dot-status active">Paga</span></td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-quiet btn-sm" onClick={() => onToast(`Baixando ${inv.id}`)}><Download size={15} /> PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── VeiculosPanel (Raio admin only) ─────────────────────────────────────────

const TIER_TOKENS_ADM: Record<string, number> = { A: 100, B: 50, C: 25 };
const TIER_COLORS_ADM: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017" };
const TIER_FG_ADM:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff"    };
const VEH_CATS_ADM = ["Negócios","Tecnologia","Cultura","Esportes","Saúde","Entretenimento","Política","Educação","Lifestyle","Gastronomia","Moda","Sustentabilidade","Finanças","Variedades","Automotivo","Imóveis"];
const TIERS_ADM = ["A","B","C"];

interface VehicleRow { id: string; name: string; domain: string; category: string; tier: string; reach: number; logoUrl?: string | null }
type VAdmSortCol = "name" | "category" | "tier" | "reach";
type VAdmSortDir = "asc" | "desc";
const VADM_TIER_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };


function fmtReachAdm(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000)    return Math.round(n / 1_000) + " mil";
  return String(n);
}
function vAdmInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function sortVAdm(arr: VehicleRow[], col: VAdmSortCol, dir: VAdmSortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tier")     { va = VADM_TIER_ORDER[a.tier] ?? 99; vb = VADM_TIER_ORDER[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a[col] as string).toLowerCase(); vb = (b[col] as string).toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}
function VAdmSortIcon({ col, active, dir }: { col: string; active: string; dir: VAdmSortDir }) {
  if (col !== active) return <ArrowUpDown size={13} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return dir === "asc"
    ? <ArrowUp   size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />
    : <ArrowDown size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />;
}
function VAdmFilterModal({ cats, tiers, onApply, onClose }: { cats: string[]; tiers: string[]; onApply: (c: string[], t: string[]) => void; onClose: () => void }) {
  const [selCats,  setSelCats]  = useState<string[]>(cats);
  const [selTiers, setSelTiers] = useState<string[]>(tiers);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Filtrar veículos</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Editoria</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VEH_CATS_ADM.map(c => <button key={c} onClick={() => setSelCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])} className={`chip${selCats.includes(c) ? " active" : ""}`}>{c}</button>)}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
            <div style={{ display: "flex", gap: 8 }}>
              {TIERS_ADM.map(t => <button key={t} onClick={() => setSelTiers(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} className={`chip${selTiers.includes(t) ? " active" : ""}`}>Tier {t}</button>)}
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>Limpar</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={() => { onApply(selCats, selTiers); onClose(); }}>Aplicar {(selCats.length + selTiers.length) > 0 ? `(${selCats.length + selTiers.length})` : ""}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleModal({ initial, onSave, onClose }: {
  initial?: VehicleRow | null;
  onSave: (data: Omit<VehicleRow, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [name,       setName]       = useState(initial?.name       ?? "");
  const [domain,     setDomain]     = useState(initial?.domain     ?? "");
  const [category,   setCategory]   = useState(initial?.category   ?? VEH_CATS_ADM[0]);
  const [tier,       setTier]       = useState(initial?.tier       ?? "B");
  const [reach,      setReach]      = useState(String(initial?.reach ?? ""));
  const [logoUrl,    setLogoUrl]    = useState(initial?.logoUrl     ?? "");
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json() as { url?: string };
    if (data.url) setLogoUrl(data.url);
    setUploading(false);
  }

  async function handleSubmit() {
    if (!name.trim() || !domain.trim() || !reach) { setErr("Preencha todos os campos."); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), domain: domain.trim(), category, tier, reach: Number(reach), logoUrl: logoUrl || null });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>{initial ? "Editar veículo" : "Novo veículo"}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Logo */}
          <div className="field">
            <label>Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{ width: 48, height: 48, borderRadius: 10, background: TIER_COLORS_ADM[tier] ?? "#ccc", color: TIER_FG_ADM[tier] ?? "#fff", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, overflow: "hidden", flexShrink: 0 }}
              >
                {logoUrl
                  ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : vAdmInitials(name || "?")}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              <button className="btn btn-ghost btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Camera size={14} /> {uploading ? "Enviando…" : logoUrl ? "Trocar logo" : "Adicionar logo"}
              </button>
              {logoUrl && <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => setLogoUrl("")}><X size={13} /></button>}
            </div>
          </div>
          <div className="field"><label>Nome</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Folha de S.Paulo" /></div>
          <div className="field"><label>Domínio</label><input className="input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="folha.uol.com.br" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Editoria</label>
              <div className="select-wrap">
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {VEH_CATS_ADM.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <div className="field">
              <label>Tier</label>
              <div className="select-wrap">
                <select className="input" value={tier} onChange={e => setTier(e.target.value)}>
                  {TIERS_ADM.map(t => <option key={t} value={t}>Tier {t} — {TIER_TOKENS_ADM[t]} créditos</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
          </div>
          <div className="field"><label>Alcance/mês</label><input className="input" type="number" value={reach} onChange={e => setReach(e.target.value)} placeholder="Ex.: 5000000" /></div>
          {err && <p style={{ color: "var(--red)", fontSize: 13, margin: 0 }}>{err}</p>}
        </div>
        <div className="m-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-dark" disabled={saving} onClick={handleSubmit}>{saving ? "Salvando…" : <><Check size={15} /> Salvar</>}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteVehicleModal({ name, onConfirm, onClose, deleting }: { name: string; onConfirm: () => void; onClose: () => void; deleting: boolean }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Remover veículo</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="m-body"><p>Tem certeza que deseja remover <strong>{name}</strong>? Esta ação não pode ser desfeita.</p></div>
        <div className="m-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" style={{ background: "var(--red)", color: "#fff", border: "none" }} disabled={deleting} onClick={onConfirm}>{deleting ? "Removendo…" : <><Trash2 size={14} /> Remover</>}</button>
        </div>
      </div>
    </div>
  );
}

const VADM_PAGE_SIZE = 25;

function VeiculosPanel({ onToast }: { onToast: (m: string) => void }) {
  const [vehicles,     setVehicles]    = useState<VehicleRow[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [seeding,      setSeeding]     = useState(false);
  const [q,            setQ]           = useState("");
  const [filterCats,   setFilterCats]  = useState<string[]>([]);
  const [filterTiers,  setFilterTiers] = useState<string[]>([]);
  const [sortCol,      setSortCol]     = useState<VAdmSortCol>("reach");
  const [sortDir,      setSortDir]     = useState<VAdmSortDir>("desc");
  const [page,         setPage]        = useState(1);
  const [showFilter,   setShowFilter]  = useState(false);
  const [editing,      setEditing]     = useState<VehicleRow | null | "new">(null);
  const [deleting,     setDeleting]    = useState<VehicleRow | null>(null);
  const [isDel,        setIsDel]       = useState(false);

  useEffect(() => {
    fetch("/api/admin/vehicles")
      .then(r => r.json())
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  async function handleSeed() {
    setSeeding(true);
    const res  = await fetch("/api/admin/vehicles/seed", { method: "POST" });
    const data = await res.json() as { inserted: number };
    const all  = await fetch("/api/admin/vehicles").then(r => r.json()) as VehicleRow[];
    setVehicles(all);
    setSeeding(false);
    onToast(`${data.inserted} veículos importados!`);
  }

  async function handleSave(data: Omit<VehicleRow, "id">) {
    if (editing === "new") {
      const res = await fetch("/api/admin/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const v = await res.json() as VehicleRow;
      setVehicles(prev => [...prev, v]);
      onToast("Veículo adicionado!");
    } else if (editing) {
      const res = await fetch(`/api/admin/vehicles/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const v = await res.json() as VehicleRow;
      setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
      onToast("Veículo atualizado!");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDel(true);
    await fetch(`/api/admin/vehicles/${deleting.id}`, { method: "DELETE" });
    setVehicles(prev => prev.filter(v => v.id !== deleting.id));
    setDeleting(null); setIsDel(false);
    onToast("Veículo removido.");
  }

  function handleSort(col: VAdmSortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "reach" ? "desc" : "asc"); }
    setPage(1);
  }

  const activeFilters = filterCats.length + filterTiers.length;
  const thStyle = (col: VAdmSortCol): React.CSSProperties => ({
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    color: sortCol === col ? "var(--coral-ink)" : undefined,
  });
  const thInner = (label: string, col: VAdmSortCol, align: "left" | "right" = "left") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%" }}>
      {label}<VAdmSortIcon col={col} active={sortCol} dir={sortDir} />
    </span>
  );

  const filtered    = vehicles.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.category)) &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );
  const sorted      = sortVAdm(filtered, sortCol, sortDir);
  const totalPages  = Math.ceil(sorted.length / VADM_PAGE_SIZE);
  const list        = sorted.slice((page - 1) * VADM_PAGE_SIZE, page * VADM_PAGE_SIZE);

  return (
    <div className="set-panel">
      <PanelHead title="Veículos" desc="Gerencie os veículos disponíveis na plataforma." />

      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 18, gap: 8 }}>
        <button className={`btn btn-ghost btn-sm${activeFilters > 0 ? " active" : ""}`} onClick={() => setShowFilter(true)} style={{ gap: 6 }}>
          <SlidersHorizontal size={14} /> Filtrar
          {activeFilters > 0 && <span style={{ background: "var(--coral)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px", marginLeft: 2 }}>{activeFilters}</span>}
        </button>
        {activeFilters > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); setPage(1); }}>
            <X size={13} /> Limpar
          </button>
        )}
        <div style={{ flex: 1 }} />
        {vehicles.length === 0 && !loading && (
          <button className="btn btn-ghost btn-sm" disabled={seeding} onClick={handleSeed}>
            {seeding ? "Importando…" : <><Upload size={15} /> Importar veículos padrão</>}
          </button>
        )}
        <input className="input" placeholder="Buscar veículo…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} style={{ width: 220, padding: "8px 14px", fontSize: 13 }} />
        <button className="btn btn-dark btn-sm" onClick={() => setEditing("new")}><Plus size={15} /> Novo veículo</button>
      </div>

      {/* Tabela */}
      <div className="card">
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--stone)" }}>Carregando…</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ ...thStyle("name"), width: "34%" }} onClick={() => handleSort("name")}>{thInner("Veículo", "name")}</th>
                <th style={thStyle("category")} onClick={() => handleSort("category")}>{thInner("Editoria", "category")}</th>
                <th style={thStyle("tier")} onClick={() => handleSort("tier")}>{thInner("Tier", "tier")}</th>
                <th style={{ ...thStyle("reach"), textAlign: "right" }} onClick={() => handleSort("reach")}>{thInner("Alcance/mês", "reach", "right")}</th>
                <th style={{ textAlign: "right" }}>Créditos</th>
                <th style={{ width: 72 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--stone)" }}>Nenhum veículo encontrado.</td></tr>
              ) : list.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: TIER_COLORS_ADM[v.tier] ?? "#ccc", color: TIER_FG_ADM[v.tier] ?? "#fff", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, flexShrink: 0, overflow: "hidden" }}>
                        {v.logoUrl
                          ? <img src={v.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : vAdmInitials(v.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: "var(--stone)" }}>{v.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--stone)", fontSize: 13 }}>{v.category}</td>
                  <td>
                    <span className={`tier t-${v.tier.toLowerCase()}`} style={{ fontSize: 10, padding: "2px 7px" }}>{v.tier}</span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{fmtReachAdm(v.reach)}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{TIER_TOKENS_ADM[v.tier] ?? 0} ⚡</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", paddingRight: 8 }}>
                      <button className="icon-btn" title="Editar" onClick={() => setEditing(v)}><Pencil size={14} /></button>
                      <button className="icon-btn" title="Remover" onClick={() => setDeleting(v)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px 8px", fontSize: 13 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span style={{ color: "var(--stone)" }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
        </div>
      )}

      {/* Footer count */}
      {!loading && (
        <div style={{ padding: "8px 4px 0", fontSize: 12, color: "var(--stone)" }}>
          {sorted.length} veículos encontrados · alcance combinado: {fmtReachAdm(sorted.reduce((s, v) => s + v.reach, 0))}
        </div>
      )}

      {editing !== null && (
        <VehicleModal
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteVehicleModal
          name={deleting.name}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          deleting={isDel}
        />
      )}
      {showFilter && (
        <VAdmFilterModal
          cats={filterCats}
          tiers={filterTiers}
          onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); setPage(1); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}

// ─── Hub ──────────────────────────────────────────────────────────────────────

// ─── Suporte ──────────────────────────────────────────────────────────────────

interface SupportMsg { role: string; content: string; createdAt: string }
interface SupportConv { id: string; createdAt: string; updatedAt: string; messages: SupportMsg[]; ticket: { subject: string; status: string } | null }

function SupportPanel() {
  const [convs, setConvs] = useState<SupportConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/support/chat").then(r => r.json()).then((data: SupportConv[]) => {
      setConvs(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="set-panel">
      <PanelHead title="Histórico de <em>suporte</em>" desc="Suas conversas e tickets com o suporte do Raio Publicador." />

      {loading && <p className="muted" style={{ fontSize: 13 }}>Carregando…</p>}

      {!loading && convs.length === 0 && (
        <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
          <MessageCircle size={32} color="var(--stone)" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14, color: "var(--stone)" }}>Nenhuma conversa de suporte ainda.</p>
        </div>
      )}

      {convs.map(conv => (
        <div key={conv.id} className="card" style={{ marginBottom: 12 }}>
          <button
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onClick={() => setOpen(open === conv.id ? null : conv.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {conv.ticket
                ? <Ticket size={16} color="var(--coral-ink)" />
                : <MessageCircle size={16} color="var(--stone)" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>
                  {conv.ticket ? conv.ticket.subject : "Conversa com assistente"}
                </div>
                <div style={{ fontSize: 12, color: "var(--stone)", marginTop: 2 }}>
                  {fmt(conv.updatedAt)} · {conv.messages.length} mensagens
                  {conv.ticket && (
                    <span style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: conv.ticket.status === "open" ? "#FEF3DC" : "#E3F2E9", color: conv.ticket.status === "open" ? "#C07A00" : "#2F8A5B" }}>
                      {conv.ticket.status === "open" ? "Aberto" : "Resolvido"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown size={16} color="var(--stone)" style={{ transform: open === conv.id ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>

          {open === conv.id && (
            <div style={{ borderTop: "1px solid var(--line)", padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {conv.messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: m.role === "user" ? "var(--ink)" : "var(--bg)",
                    color: m.role === "user" ? "var(--paper)" : "var(--ink)",
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const BASE_GROUPS = [
  { label: "Você", items: [{ id: "perfil", icon: UserCircle, label: "Perfil" }, { id: "conta", icon: Settings2, label: "Conta" }] },
  { label: "Organização", items: [{ id: "equipe", icon: Users, label: "Equipe e permissões" }, { id: "marcas", icon: Building2, label: "Marcas" }, { id: "cobranca", icon: CreditCard, label: "Cobrança" }] },
  { label: "Suporte", items: [{ id: "suporte", icon: MessageCircle, label: "Histórico de suporte" }] },
];

function ConfiguracoesInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "perfil";
  const [tab, setTab] = useState(initialTab);
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useUser();
  const isRaioAdmin = user?.publicMetadata?.raioAdmin === true;

  const GROUPS = isRaioAdmin
    ? [...BASE_GROUPS, { label: "Raio", items: [{ id: "veiculos", icon: Rss, label: "Veículos" }] }]
    : BASE_GROUPS;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <>
      <div className="content scroll">
        <div className="settings-layout">
          <nav className="set-nav">
            {GROUPS.map(g => (
              <div className="set-nav-group" key={g.label}>
                <div className="set-nav-label">{g.label}</div>
                {g.items.map(({ id, icon: Icon, label }) => (
                  <button key={id} className={`set-nav-item${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
                    <Icon size={17} /> <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="set-body">
            {tab === "perfil"   && <PerfilPanel   onToast={showToast} />}
            {tab === "conta"    && <ContaPanel    onToast={showToast} />}
            {tab === "equipe"   && <EquipePanel   onToast={showToast} />}
            {tab === "marcas"   && <MarcasPanel   onToast={showToast} />}
            {tab === "cobranca" && <CobrancaPanel onToast={showToast} />}
            {tab === "suporte"  && <SupportPanel />}
            {tab === "veiculos" && isRaioAdmin && <VeiculosPanel onToast={showToast} />}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-wrap" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}>
          <div className="toast"><span className="ic"><Check size={14} /></span>{toast}</div>
        </div>
      )}
    </>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense>
      <ConfiguracoesInner />
    </Suspense>
  );
}
