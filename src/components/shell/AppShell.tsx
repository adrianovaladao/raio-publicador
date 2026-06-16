"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard, FileText, CalendarDays, Radio, Settings,
  Bell, Search, LogOut, ChevronDown, Zap, Check, X,
  Plus, ArrowRight, Headphones,
} from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { useState, useRef, useEffect } from "react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLAN = { total: 5000, used: 3200 };

const BRANDS = [
  { id: "b1", name: "Franquia Sabor Brasil", segment: "Franquias",  color: "#C25E00", releases: 12 },
  { id: "b2", name: "TechNova Sistemas",     segment: "Tecnologia", color: "#2A6FDB", releases: 7  },
  { id: "b3", name: "Rede Bem Estar",        segment: "Saúde",      color: "#2F8A5B", releases: 4  },
];

const APP_PLANS = [
  { name: "Básico",       amt: "999",   credits: "500 créditos",   feats: ["Até 2 veículos AAA por release", "Centenas de veículos parceiros", "1 usuário"] },
  { name: "Avançado",     amt: "1.500", credits: "1.000 créditos", feats: ["Até 5 veículos AAA por release", "Relatórios de desempenho", "Até 3 usuários"], featured: true },
  { name: "Profissional", amt: "2.500", credits: "3.000 créditos", feats: ["Até 10 veículos AAA por release", "Relatórios + exportação", "Usuários ilimitados"], current: true },
];

const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ─── BrandSwitcher ────────────────────────────────────────────────────────────

function BrandSwitcher({ onAddBrand, active, onSelect }: { onAddBrand: () => void; active: typeof BRANDS[0]; onSelect: (b: typeof BRANDS[0]) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tb-brandsel">
      <button className="tbb-btn" onClick={() => setOpen(o => !o)}>
        <span className="tbb-av" style={{ background: active.color }}>{getInitials(active.name)}</span>
        <span className="tbb-meta">
          <span className="tbb-lbl">Marca ativa</span>
          <span className="tbb-nm">{active.name}</span>
        </span>
        <ChevronDown size={15} className={`tbb-chev${open ? " open" : ""}`} />
      </button>

      {open && (
        <>
          <div className="tbb-backdrop" onClick={() => setOpen(false)} />
          <div className="tbb-menu">
            <div className="tbb-menu-label">Trocar de marca</div>
            {BRANDS.map(b => (
              <button
                key={b.id}
                className={`tbb-opt${b.id === active.id ? " on" : ""}`}
                onClick={() => { onSelect(b); setOpen(false); }}
              >
                <span className="tbb-av" style={{ background: b.color }}>{getInitials(b.name)}</span>
                <span className="tbb-opt-meta">
                  <span className="tbb-nm">{b.name}</span>
                  <span className="tbb-sg">{b.segment} · {b.releases} releases</span>
                </span>
                {b.id === active.id && <Check size={15} />}
              </button>
            ))}
            <button className="tbb-add" onClick={() => { setOpen(false); onAddBrand(); }}>
              <Plus size={15} /> Adicionar marca
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PlansModal ───────────────────────────────────────────────────────────────

function PlansModal({ onClose }: { onClose: () => void }) {
  const pct = Math.round((PLAN.used / PLAN.total) * 100);
  const left = PLAN.total - PLAN.used;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-plans dark" onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3>Planos e <em>créditos</em></h3>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--d-text)" }}>
              Você usou {pct}% dos créditos deste ciclo · {left.toLocaleString("pt-BR")} restantes.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 34, height: 34, flexShrink: 0 }}>
            <X size={17} />
          </button>
        </div>
        <div className="m-body">
          <div className="plan-usage">
            <div className="pu-top">
              <span>Plano Pro · {PLAN.used.toLocaleString("pt-BR")} de {PLAN.total.toLocaleString("pt-BR")} usados</span>
              <span className="pu-left">{left.toLocaleString("pt-BR")} restantes</span>
            </div>
            <div className="pu-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>

          <div className="plans-row">
            {APP_PLANS.map(p => (
              <div key={p.name} className={`plan-card${p.featured ? " featured" : ""}${p.current ? " current" : ""}`}>
                {p.featured && !p.current && <span className="pc-ribbon">Mais vendido</span>}
                {p.current && <span className="pc-ribbon cur">Plano atual</span>}
                <div className="pc-name">{p.name}</div>
                <div className="pc-price">
                  <span className="cur">R$</span>
                  <span className="amt">{p.amt}</span>
                  <span className="per">/mês</span>
                </div>
                <div className="pc-credits"><Zap size={16} /> {p.credits}</div>
                <ul className="pc-feats">
                  {p.feats.map((f, i) => (
                    <li key={i}><Check size={15} /> {f}</li>
                  ))}
                </ul>
                <button
                  className={`btn btn-block${p.current ? " btn-ghost" : p.featured ? " btn-primary" : " btn-dark"}`}
                  disabled={p.current}
                >
                  {p.current ? "Plano atual" : `Mudar para ${p.name}`}
                </button>
              </div>
            ))}
          </div>

          <div className="plans-note">
            <Headphones size={16} />
            <span>Precisa de mais créditos ou um plano anual? <b>Fale com o time comercial.</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NewBrandModal ────────────────────────────────────────────────────────────

function NewBrandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: typeof BRANDS[0]) => void }) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("Franquias");
  const [site, setSite] = useState("");
  const [desc, setDesc] = useState("");
  const [contact, setContact] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const valid = name.trim().length > 1;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function submit() {
    if (!valid) return;
    onCreate({ id: `b${Date.now()}`, name: name.trim(), segment, color, releases: 0 });
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Cadastrar nova <em>marca</em></h3>
        </div>
        <div className="m-body">
          <div className="nb-preview">
            <span className="nb-av" style={{ background: color }}>
              {name.trim() ? getInitials(name) : "?"}
            </span>
            <div>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
          </div>

          <div className="field">
            <label>Nome da marca / cliente</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex.: Franquia Sabor Brasil" autoFocus />
          </div>
          <div className="nb-grid2">
            <div className="field">
              <label>Segmento / setor</label>
              <div className="select-wrap">
                <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                  {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field">
              <label>Site</label>
              <input className="input" value={site} onChange={e => setSite(e.target.value)} placeholder="www.exemplo.com.br" />
            </div>
          </div>
          <div className="field">
            <label>Pessoa de contato / responsável</label>
            <input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do contato na marca" />
          </div>
          <div className="field">
            <label>Descrição curta</label>
            <textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Em uma frase, o que a marca faz." />
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Cor de identificação</label>
            <div className="nb-colors">
              {BRAND_COLORS.map(c => (
                <button key={c} className={`nb-color${color === c ? " on" : ""}`}
                  style={{ background: c }} onClick={() => setColor(c)} type="button">
                  {color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!valid} onClick={submit}>
            <Check size={15} /> Criar marca
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-wrap">
      <div className="toast"><span className="ic"><Check size={14} /></span>{msg}</div>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Visão geral" },
  { href: "/releases",    icon: FileText,         label: "Biblioteca",  badge: "9" },
  { href: "/calendario",  icon: CalendarDays,     label: "Calendário" },
  { href: "/veiculos",    icon: Radio,            label: "Veículos" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [showPlans, setShowPlans] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState(BRANDS[0]);

  const firstName = user?.firstName ?? "";
  const lastName  = user?.lastName  ?? "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Usuário";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "U";

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const pct  = Math.round((PLAN.used / PLAN.total) * 100);
  const left = PLAN.total - PLAN.used;

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <RaioLockup height={22} variant="dark" />
        </div>

        <div className="sb-mid scroll">
          <div style={{ padding: "16px 12px 2px" }}>
            <Link href="/releases/novo" className="btn btn-primary btn-block btn-lg">
              <FileText size={17} /> Criar release
            </Link>
          </div>

          <div className="sb-section">Navegação</div>
          <nav className="sb-nav">
            {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} className={`sb-item${active ? " active" : ""}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {badge && <span className="badge">{badge}</span>}
                </Link>
              );
            })}
            <Link href="/configuracoes" className={`sb-item${pathname.startsWith("/configuracoes") ? " active" : ""}`}>
              <Settings size={18} />
              <span>Configurações</span>
            </Link>
          </nav>
        </div>

        {/* Widget de créditos — clicável → PlansModal */}
        <button className="credits" onClick={() => setShowPlans(true)} title="Ver planos e créditos">
          <div className="top">
            <span className="lbl">Créditos</span>
            <span className="credits-plan">Plano Pro</span>
          </div>
          <div className="num">
            {left.toLocaleString("pt-BR")}
            <small> / {PLAN.total.toLocaleString("pt-BR")}</small>
          </div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="hint">{pct}% usados · renova em 12 dias</div>
          <div className="credits-cta">Ver planos <ArrowRight size={12} /></div>
        </button>

        {/* Usuário — clicável → Configurações */}
        <div className="sb-user">
          <button className="sb-user-main" onClick={() => router.push("/configuracoes")} title="Perfil e configurações">
            <div className="av">{initials}</div>
            <div className="who">
              <div className="nm">{fullName}</div>
              <div className="rl">Administração</div>
            </div>
          </button>
          <button className="out" title="Sair" onClick={handleLogout}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <span className="t">{getPageTitle(pathname)}</span>
          </div>
          <div className="spacer" />


          <div className="search">
            <Search size={16} />
            <input placeholder="Buscar releases, veículos…" />
          </div>
          <button className="icon-btn" title="Notificações">
            <Bell size={18} />
            <span className="dot" />
          </button>
        </header>

        {children}
      </div>

      {/* ── MODAIS ── */}
      {showPlans && <PlansModal onClose={() => setShowPlans(false)} />}
      {showNewBrand && (
        <NewBrandModal
          onClose={() => setShowNewBrand(false)}
          onCreate={b => { setShowNewBrand(false); setToast(`Marca "${b.name}" criada`); }}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/releases/novo")) return "Novo release";
  if (pathname.startsWith("/releases")) return "Biblioteca";
  if (pathname.startsWith("/calendario")) return "Calendário";
  if (pathname.startsWith("/veiculos")) return "Veículos";
  if (pathname.startsWith("/configuracoes")) return "Configurações";
  return "Visão geral";
}
