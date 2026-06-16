"use client";

import { useState } from "react";
import {
  UserCircle, Settings2, Users, Building2, CreditCard,
  Plus, ChevronDown, ArrowRight, Camera, Globe, Lock,
  Mail, Download, Check, X, MoreHorizontal, Shield,
  Tag, Ban, Trash2, Send, Sparkles, Upload, Zap,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLAN = { total: 5000, used: 3200 };

const BRANDS = [
  { id: "b1", name: "Franquia Sabor Brasil", segment: "Franquias",  color: "#C25E00", releases: 12, tone: true },
  { id: "b2", name: "TechNova Sistemas",     segment: "Tecnologia", color: "#2A6FDB", releases: 7,  tone: true },
  { id: "b3", name: "Rede Bem Estar",        segment: "Saúde",      color: "#2F8A5B", releases: 4,  tone: false },
];

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

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d).padStart(2,"0")} ${meses[m-1]} ${y}`;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

function brandNames(brands: string[] | "all") {
  if (brands === "all") return "Todas as marcas";
  return brands.map(id => BRANDS.find(b => b.id === id)?.name).filter(Boolean).join(", ");
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
  return (
    <div className="set-panel">
      <PanelHead title="Perfil" desc="Como você aparece para a equipe e nos releases que assina." />
      <div className="card card-pad">
        <div className="profile-top">
          <Av name="Samara Perez" color="#C25E00" size={76} />
          <div className="profile-photo-actions">
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-ghost btn-sm"><Camera size={15} /> Alterar foto</button>
              <button className="btn btn-quiet btn-sm">Remover</button>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>JPG ou PNG quadrado, até 2 MB.</p>
          </div>
        </div>
        <div className="set-grid2" style={{ marginTop: 22 }}>
          <div className="field"><label>Nome completo</label><input className="input" defaultValue="Samara Perez" /></div>
          <div className="field"><label>Cargo / função</label><input className="input" defaultValue="Social media" /></div>
          <div className="field"><label>Telefone</label><input className="input" defaultValue="(11) 98888-1234" /></div>
          <div className="field">
            <label>Fuso horário</label>
            <div className="select-wrap">
              <select className="input"><option>Brasília (GMT-3)</option><option>Fernando de Noronha (GMT-2)</option><option>Acre (GMT-5)</option></select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        <div className="field" style={{ marginTop: 4 }}>
          <label>Bio curta</label>
          <textarea className="input" rows={3} defaultValue="Assessora de imprensa na Markable, cuidando da distribuição de releases de franquias e tecnologia." />
        </div>
        <div className="set-foot">
          <button className="btn btn-primary" onClick={() => onToast("Perfil atualizado")}>Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

// ─── Conta ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ContaPanel({ onToast }: { onToast: (m: string) => void }) {
  const [twofa, setTwofa] = useState(true);
  const [notif, setNotif] = useState({ published: true, scheduled: true, comments: true, weekly: false });
  const sessions = [
    { id: "s1", dev: "Chrome · macOS", where: "São Paulo, BR", when: "Agora", current: true },
    { id: "s2", dev: "Safari · iPhone", where: "São Paulo, BR", when: "há 2 h" },
    { id: "s3", dev: "Chrome · Windows", where: "Campinas, BR", when: "ontem" },
  ];
  return (
    <div className="set-panel">
      <PanelHead title="Conta" desc="Login, segurança e preferências de notificação." />

      <div className="card">
        <div className="card-head"><h3>Acesso</h3></div>
        <div className="card-pad">
          <div className="set-grid2">
            <div className="field"><label>E-mail de login</label><input className="input" type="email" defaultValue="samara@markable.com.br" /></div>
            <div className="field">
              <label>Idioma</label>
              <div className="select-wrap"><select className="input"><option>Português (Brasil)</option><option>English</option></select><ChevronDown size={16} /></div>
            </div>
          </div>
          <div className="set-inline-row">
            <div><div className="sir-title">Senha</div><div className="sir-sub">Última alteração há 3 meses</div></div>
            <button className="btn btn-ghost btn-sm"><Lock size={15} /> Alterar senha</button>
          </div>
          <div className="set-inline-row">
            <div>
              <div className="sir-title">Verificação em duas etapas{" "}
                <span className="role-badge" style={{ color: twofa ? "var(--green)" : "var(--stone)", background: twofa ? "var(--green-soft)" : "var(--cream)" }}>{twofa ? "Ativada" : "Desativada"}</span>
              </div>
              <div className="sir-sub">Proteja o acesso com um código no login.</div>
            </div>
            <button className={`toggle${twofa ? " on" : ""}`} onClick={() => setTwofa(v => !v)}><span className="knob" /></button>
          </div>
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

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Sessões ativas</h3><button className="link">Encerrar todas</button></div>
        {sessions.map(s => (
          <div className="session-row" key={s.id}>
            <div className="session-ic"><Globe size={17} /></div>
            <div>
              <div className="sir-title">{s.dev}{s.current && <span className="role-badge" style={{ color: "var(--coral-ink)", background: "var(--amber-soft)", marginLeft: 8 }}>Esta sessão</span>}</div>
              <div className="sir-sub">{s.where} · {s.when}</div>
            </div>
            {!s.current && <button className="btn btn-quiet btn-sm" style={{ marginLeft: "auto" }}>Encerrar</button>}
          </div>
        ))}
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
              <select className="input">{role === "reviewer" ? BRANDS.map(b => <option key={b.id}>{b.name}</option>) : <><option>Todas as marcas</option>{BRANDS.map(b => <option key={b.id}>{b.name}</option>)}</>}</select>
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

function MarcasPanel({ onToast }: { onToast: (m: string) => void }) {
  const [brandId, setBrandId] = useState("b1");
  const brand = BRANDS.find(b => b.id === brandId) || BRANDS[0];
  return (
    <div className="set-panel">
      <PanelHead title="Configurações da <em>marca</em>" desc="Dados que abastecem os releases desta marca."
        action={
          <div className="row" style={{ gap: 10 }}>
            <div className="select-wrap" style={{ width: 200 }}>
              <select className="input" value={brandId} onChange={e => setBrandId(e.target.value)}>
                {BRANDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
            <button className="btn btn-primary"><Plus size={16} /> Nova marca</button>
          </div>
        } />

      <div className="card">
        <div className="card-head"><h3>Identidade</h3></div>
        <div className="card-pad">
          <div className="profile-top">
            <div style={{ width: 64, height: 64, borderRadius: 12, background: brand.color, display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
              {getInitials(brand.name)}
            </div>
            <div>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn btn-ghost btn-sm"><Upload size={15} /> Enviar logo</button>
                <button className="btn btn-quiet btn-sm">Remover</button>
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>PNG ou SVG com fundo transparente, mín. 256×256.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" key={`inst-${brandId}`} style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Dados institucionais</h3></div>
        <div className="card-pad">
          <div className="set-grid2">
            <div className="field"><label>Nome da marca</label><input className="input" defaultValue={brand.name} /></div>
            <div className="field"><label>CNPJ</label><input className="input" defaultValue="12.345.678/0001-90" /></div>
            <div className="field"><label>Site</label><input className="input" defaultValue={`www.${brand.name.toLowerCase().replace(/[^a-z]/g,"")}.com.br`} /></div>
            <div className="field">
              <label>Setor</label>
              <div className="select-wrap">
                <select className="input" defaultValue={brand.segment}><option>{brand.segment}</option><option>Economia</option><option>Varejo</option></select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" key={`boiler-${brandId}`} style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Boilerplate <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>&middot; &ldquo;sobre a empresa&rdquo;</span></h3></div>
        <div className="card-pad">
          <div className="field" style={{ margin: 0 }}>
            <label>Texto padrão incluído ao final dos releases</label>
            <textarea className="input" rows={4} defaultValue={`A ${brand.name} é referência no segmento de ${brand.segment.toLowerCase()}, com atuação nacional e foco em inovação e proximidade com o cliente.`} />
            <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>Aparece automaticamente como último parágrafo de cada release desta marca.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-pad set-inline-row" style={{ padding: 22 }}>
          <div className="row" style={{ gap: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--amber-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Sparkles size={19} style={{ color: "var(--coral-ink)" }} />
            </div>
            <div>
              <div className="sir-title">Tom de voz{" "}
                <span className="role-badge" style={{ color: brand.tone ? "var(--green)" : "var(--stone)", background: brand.tone ? "var(--green-soft)" : "var(--cream)" }}>{brand.tone ? "Configurado" : "Pendente"}</span>
              </div>
              <div className="sir-sub">Atributos, eixos e vocabulário que guiam a escrita da marca.</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">{brand.tone ? "Editar tom de voz" : "Configurar"} <ArrowRight size={15} /></button>
        </div>
      </div>

      <div className="set-foot">
        <button className="btn btn-quiet" style={{ color: "var(--red)" }}>Excluir marca</button>
        <button className="btn btn-primary" onClick={() => onToast("Marca atualizada")}>Salvar alterações</button>
      </div>
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

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState("perfil");
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
