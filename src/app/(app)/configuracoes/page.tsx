"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { extractDominantColor, extractDominantColorFromUrl } from "@/lib/color";
import {
  UserCircle, Settings2, Users, Building2, CreditCard,
  Plus, ChevronDown, Camera, Lock,
  Mail, Download, Check, X, MoreHorizontal, Shield,
  Tag, Ban, Trash2, Send, Upload, Zap,
} from "lucide-react";

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLAN = { total: 5000, used: 3200 };

const ROLES: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  admin:    { label: "Administração", desc: "Acesso total: edita releases, gerencia pessoas, marcas e cobrança.", color: "#8A6500", bg: "#FCEFCB" },
  editor:   { label: "Edição",        desc: "Escreve, revisa e agenda releases das marcas atribuídas.",          color: "#2A6FDB", bg: "#E6EEFB" },
  reviewer: { label: "Revisão",       desc: "Acessa a lista de releases da marca e adiciona comentários.",        color: "#2F8A5B", bg: "#E3F2E9" },
};

const TEAM = [
  { id: "u1", name: "Samara Perez",    email: "samara@markable.com.br",    role: "admin",    status: "active",    brands: "all" as const,       color: "#C25E00", you: true  },
  { id: "u2", name: "Liliane Pires",   email: "liliane@markable.com.br",   role: "editor",   status: "active",    brands: ["b1","b2"] as string[], color: "#2A6FDB" },
  { id: "u3", name: "Analina Arouche", email: "analina@markable.com.br",   role: "editor",   status: "active",    brands: ["b3"] as string[],      color: "#6D3BD9" },
  { id: "u4", name: "Daiana Napoleão", email: "daiana@markable.com.br",    role: "editor",   status: "suspended", brands: ["b1"] as string[],      color: "#0E7C86" },
  { id: "u5", name: "Carlos Menezes",  email: "carlos@saborbrasil.com.br", role: "reviewer", status: "active",    brands: ["b1"] as string[],      color: "#2F8A5B" },
  { id: "u6", name: "Renata Vidal",    email: "renata@technova.com.br",    role: "reviewer", status: "active",    brands: ["b2"] as string[],      color: "#B0322E" },
];

const INVITES = [
  { id: "i1", email: "paulo@saborbrasil.com.br", role: "reviewer", brands: ["b1"], sentAt: "2026-06-08" },
  { id: "i2", email: "marina@markable.com.br",   role: "editor",   brands: ["b2","b3"], sentAt: "2026-06-05" },
];

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
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d).padStart(2,"0")} ${meses[m-1]} ${y}`;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

function brandNames(brands: string[] | "all") {
  if (brands === "all") return "Todas as marcas";
  return brands.join(", ");
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
      onToast("Foto atualizada");
    } catch {
      onToast("Erro ao enviar foto");
    } finally {
      setPhotoLoading(false);
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

function ContaPanel({ onToast }: { onToast: (m: string) => void }) {
  const { user, isLoaded } = useUser();
  const [notif, setNotif] = useState({ published: true, scheduled: true, comments: true, weekly: false });

  // troca de senha
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [savingPw,   setSavingPw]   = useState(false);

  async function handleChangePassword() {
    if (!user || !newPw) return;
    setSavingPw(true);
    try {
      await user.updatePassword({ currentPassword: currentPw, newPassword: newPw });
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
          {([["published","Release publicado","Quando um release entra no ar nos veículos."],["scheduled","Release agendado","Confirmação quando algo é agendado."],["comments","Comentários de revisão","Quando um cliente comenta um release."],["weekly","Resumo semanal","Um panorama de desempenho toda segunda."]] as [keyof typeof notif,string,string][]).map(([k,t,d]) => (
            <div className="set-inline-row" key={k}>
              <div><div className="sir-title">{t}</div><div className="sir-sub">{d}</div></div>
              <button className={`toggle${notif[k] ? " on" : ""}`} onClick={() => setNotif(n => ({ ...n, [k]: !n[k] }))}><span className="knob" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card danger-card" style={{ marginTop: 16 }}>
        <div className="card-pad set-inline-row" style={{ padding: 22 }}>
          <div><div className="sir-title">Encerrar conta</div><div className="sir-sub">Remove seu acesso e dados pessoais. Releases publicados permanecem.</div></div>
          <button className="btn btn-danger btn-sm">Encerrar conta</button>
        </div>
      </div>
    </div>
  );
}

// ─── Equipe ───────────────────────────────────────────────────────────────────

function InviteModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const [role, setRole] = useState("editor");
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-head"><h3>Convidar para a <em>equipe</em></h3></div>
        <div className="m-body">
          <div className="field"><label>E-mail</label><input className="input" type="email" placeholder="nome@empresa.com.br" autoFocus /></div>
          <div className="field">
            <label>Função</label>
            <div className="role-pick">
              {Object.entries(ROLES).map(([k, r]) => (
                <button key={k} className={`role-opt${role === k ? " on" : ""}`} onClick={() => setRole(k)}>
                  <span className="ro-radio" />
                  <span><span className="ro-name">{r.label}</span><span className="ro-desc">{r.desc}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Marcas com acesso</label>
            <div className="select-wrap">
              <select className="input"><option>Todas as marcas</option></select>
              <ChevronDown size={16} />
            </div>
            {role === "reviewer" && <p className="muted" style={{ fontSize: 12, margin: "7px 0 0" }}>Revisão acessa apenas a marca atribuída.</p>}
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onToast("Convite enviado"); }}><Send size={15} /> Enviar convite</button>
        </div>
      </div>
    </div>
  );
}

function EquipePanel({ onToast }: { onToast: (m: string) => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
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
        <div className="card-head"><h3>Membros <span className="count-chip">{TEAM.length}</span></h3></div>
        <table className="tbl team-tbl">
          <thead><tr><th>Pessoa</th><th>Função</th><th>Marcas</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {TEAM.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="row" style={{ gap: 11 }}>
                    <Av name={u.name} color={u.color} size={34} />
                    <div>
                      <div className="title-cell" style={{ fontSize: 14 }}>{u.name}{u.you && <span className="muted" style={{ fontWeight: 400 }}> · você</span>}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--stone)" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td className="muted" style={{ fontSize: 13 }}>{brandNames(u.brands)}</td>
                <td>{u.status === "active" ? <span className="dot-status active">Ativo</span> : <span className="dot-status suspended">Suspenso</span>}</td>
                <td style={{ textAlign: "right", position: "relative" }}>
                  {!u.you && (
                    <>
                      <button className="row-menu-btn" onClick={() => setMenu(menu === u.id ? null : u.id)}><MoreHorizontal size={18} /></button>
                      {menu === u.id && (
                        <>
                          <div className="menu-backdrop" onClick={() => setMenu(null)} />
                          <div className="row-menu">
                            <button onClick={() => { setMenu(null); onToast("Função alterada"); }}><Shield size={15} /> Alterar função</button>
                            <button onClick={() => { setMenu(null); onToast("Marcas atualizadas"); }}><Tag size={15} /> Editar marcas</button>
                            {u.status === "active"
                              ? <button onClick={() => { setMenu(null); onToast(`${u.name} foi suspenso`); }}><Ban size={15} /> Suspender</button>
                              : <button onClick={() => { setMenu(null); onToast(`${u.name} foi reativado`); }}><Check size={15} /> Reativar</button>}
                            <button className="danger" onClick={() => { setMenu(null); onToast(`${u.name} foi removido`); }}><Trash2 size={15} /> Remover</button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {INVITES.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h3>Convites pendentes <span className="count-chip">{INVITES.length}</span></h3></div>
          {INVITES.map(inv => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 22px", borderTop: "1px solid var(--line)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--cream)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Mail size={17} style={{ color: "var(--stone)" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sir-title" style={{ fontSize: 14 }}>{inv.email}</div>
                <div className="sir-sub">Enviado em {fmtDate(inv.sentAt)} · {brandNames(inv.brands)}</div>
              </div>
              <div className="row" style={{ marginLeft: "auto", gap: 8, flexShrink: 0 }}>
                <RoleBadge role={inv.role} />
                <button className="btn btn-quiet btn-sm" onClick={() => onToast("Convite reenviado")}>Reenviar</button>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onToast("Convite cancelado")}><X size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onToast={onToast} />}
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
    if (!brand || !confirm(`Excluir a marca "${brand.name}"? Esta ação não pode ser desfeita.`)) return;
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
            <button className="btn btn-quiet btn-sm" style={{ color: "var(--red,#c0392b)" }} onClick={deleteBrand} disabled={deleting}>
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
    </div>
  );
}

function MarcasPanel({ onToast }: { onToast: (m: string) => void }) {
  const [brands,  setBrands]  = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json())
      .then((data: unknown) => setBrands(Array.isArray(data) ? (data as Brand[]) : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="set-panel">
      <PanelHead title="Suas <em>marcas</em>" desc="Clique em uma marca para editar seus dados."
        action={<button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> Nova marca</button>} />

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

      {editing && <BrandFormModal brand={editing} onClose={() => setEditing(null)} onSaved={b => { handleSaved(b); setEditing(null); }} />}
      {showNew  && <BrandFormModal onClose={() => setShowNew(false)} onSaved={b => { handleSaved(b); setShowNew(false); }} />}
    </div>
  );
}

// ─── Cobrança ─────────────────────────────────────────────────────────────────

function CobrancaPanel({ onToast }: { onToast: (m: string) => void }) {
  const pct = Math.round((PLAN.used / PLAN.total) * 100);
  const left = PLAN.total - PLAN.used;
  const maxC = Math.max(...CONSUMPTION.map(c => c.credits));
  return (
    <div className="set-panel">
      <PanelHead title="Cobrança e <em>créditos</em>" desc="Plano, consumo, pagamento e faturas." />

      <div className="card billing-plan">
        <div className="bp-left">
          <div className="bp-label">Plano atual</div>
          <div className="bp-name">Plano Pro</div>
          <div className="bp-price">R$ 1.500 <span>/mês · renova em 12 dias</span></div>
          <div className="row" style={{ gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary btn-sm">Mudar de plano</button>
            <button className="btn btn-ghost btn-sm"><Zap size={15} /> Comprar créditos</button>
          </div>
        </div>
        <div className="bp-right">
          <div className="bp-credit-top">
            <span className="bp-credit-num">{left.toLocaleString("pt-BR")}</span>
            <span className="bp-credit-of">de {PLAN.total.toLocaleString("pt-BR")} créditos</span>
          </div>
          <div className="bp-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="bp-bar-legend"><span>{PLAN.used.toLocaleString("pt-BR")} usados neste ciclo</span><span>{pct}%</span></div>
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

// ─── Hub ──────────────────────────────────────────────────────────────────────

const GROUPS = [
  { label: "Você", items: [{ id: "perfil", icon: UserCircle, label: "Perfil" }, { id: "conta", icon: Settings2, label: "Conta" }] },
  { label: "Organização", items: [{ id: "equipe", icon: Users, label: "Equipe e permissões" }, { id: "marcas", icon: Building2, label: "Marcas" }, { id: "cobranca", icon: CreditCard, label: "Cobrança" }] },
];

function ConfiguracoesInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "perfil";
  const [tab, setTab] = useState(initialTab);
  const [toast, setToast] = useState<string | null>(null);

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
