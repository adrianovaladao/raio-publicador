"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard, FileText, CalendarDays, Rss, Settings,
  Bell, Search, LogOut, ChevronDown, Zap, Check, X,
  ArrowRight, Headphones,
} from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { SupportWidget } from "@/components/support/SupportWidget";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";
import { useState, useEffect } from "react";

// ─── Subscription data ────────────────────────────────────────────────────────

interface SubInfo { plan: string | null; label: string; priceCents: number | null; credits: number; creditsUsed: number; }

const APP_PLANS = [
  { id: "BASIC",        name: "Básico",       amt: "1.000", credits: "200 créditos",   feats: ["Até 2 marcas", "1 editor + 1 revisor",  "Centenas de veículos"] },
  { id: "ADVANCED",     name: "Avançado",     amt: "3.000", credits: "1.000 créditos", feats: ["Até 5 marcas", "3 editores + 5 revisores", "Relatórios de desempenho"], featured: true },
  { id: "PROFESSIONAL", name: "Profissional", amt: "5.000", credits: "2.000 créditos", feats: ["Até 10 marcas", "5 editores + 10 revisores", "Relatórios + exportação"] },
];

const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}


// ─── PlansModal ───────────────────────────────────────────────────────────────

function PlansModal({ onClose, sub }: { onClose: () => void; sub: SubInfo }) {
  const pct  = sub.credits > 0 ? Math.round((sub.creditsUsed / sub.credits) * 100) : 0;
  const left = sub.credits - sub.creditsUsed;
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { window.location.href = data.url; return; }
    } catch {}
    setUpgrading(null);
  }

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
              <span>{sub.label} · {sub.creditsUsed.toLocaleString("pt-BR")} de {sub.credits.toLocaleString("pt-BR")} usados</span>
              <span className="pu-left">{left.toLocaleString("pt-BR")} restantes</span>
            </div>
            <div className="pu-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>

          <div className="plans-row">
            {APP_PLANS.map(p => {
              const isCurrent = sub.plan === p.id;
              return (
                <div key={p.name} className={`plan-card${p.featured ? " featured" : ""}${isCurrent ? " current" : ""}`}>
                  {p.featured && !isCurrent && <span className="pc-ribbon">Mais vendido</span>}
                  {isCurrent && <span className="pc-ribbon cur">Plano atual</span>}
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
                    className={`btn btn-block${isCurrent ? " btn-ghost" : p.featured ? " btn-primary" : " btn-dark"}`}
                    disabled={isCurrent || upgrading === p.id}
                    onClick={() => { if (!isCurrent) handleUpgrade(p.id); }}
                  >
                    {upgrading === p.id ? "Redirecionando…" : isCurrent ? "Plano atual" : `Mudar para ${p.name}`}
                  </button>
                </div>
              );
            })}
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

interface Brand { id: string; name: string; segment: string | null; color: string | null }

function NewBrandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Brand) => void }) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("Franquias");
  const [site, setSite] = useState("");
  const [desc, setDesc] = useState("");
  const [contact, setContact] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const valid = name.trim().length > 1;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site, description: desc, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? `Erro ${res.status}. Tente novamente.`);
        return;
      }
      onCreate(data);
      onClose();
    } catch {
      setErr("Falha de conexão. Verifique e tente novamente.");
    } finally {
      setSaving(false);
    }
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
        {err && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!valid || saving} onClick={submit}>
            <Check size={15} /> {saving ? "Criando…" : "Criar marca"}
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
  { href: "/releases",    icon: FileText,         label: "Biblioteca" },
  { href: "/calendario",  icon: CalendarDays,     label: "Calendário" },
  { href: "/veiculos",    icon: Rss,              label: "Veículos" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [showPlans, setShowPlans] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [releaseCount, setReleaseCount] = useState<number | null>(null);
  const [sub, setSub] = useState<SubInfo>({ plan: null, label: "—", priceCents: null, credits: 0, creditsUsed: 0 });

  const fetchSub = () => {
    fetch("/api/stripe/subscription")
      .then(r => r.json())
      .then((d: Partial<SubInfo>) => {
        setSub({ plan: d.plan ?? null, label: d.label ?? "—", priceCents: d.priceCents ?? null, credits: d.credits ?? 0, creditsUsed: d.creditsUsed ?? 0 });
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then((d: { stats?: { total?: number } }) => { if (d?.stats?.total != null) setReleaseCount(d.stats.total); })
      .catch(() => {});
    fetchSub();
    window.addEventListener("credits-changed", fetchSub);
    return () => window.removeEventListener("credits-changed", fetchSub);
  }, []);

  const firstName = user?.firstName ?? "";
  const lastName  = user?.lastName  ?? "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Usuário";

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const pct  = sub.credits > 0 ? Math.round((sub.creditsUsed / sub.credits) * 100) : 0;
  const left = sub.credits - sub.creditsUsed;

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <Link href="/dashboard"><RaioLockup height={22} variant="dark" /></Link>
        </div>

        <div className="sb-mid scroll">
          <div style={{ padding: "16px 12px 2px" }}>
            <Link href="/releases/novo" className="btn btn-primary btn-block btn-lg">
              <FileText size={17} /> Criar release
            </Link>
          </div>

          <div className="sb-section">Navegação</div>
          <nav className="sb-nav">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const badge = href === "/releases" && releaseCount ? String(releaseCount) : null;
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
              <span>Gerenciamento</span>
            </Link>
          </nav>
        </div>

        {/* Widget de créditos — clicável → PlansModal */}
        <button className="credits" onClick={() => setShowPlans(true)} title="Ver planos e créditos">
          <div className="top">
            <span className="lbl">Créditos</span>
            <span className="credits-plan">{sub.label}</span>
          </div>
          <div className="num">
            {left.toLocaleString("pt-BR")}
            <small> / {sub.credits.toLocaleString("pt-BR")}</small>
          </div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="hint">{pct}% usados · renova em {(() => { const d = new Date(); const r = new Date(d.getFullYear(), d.getMonth()+1, 1); return `${String(r.getDate()).padStart(2,"0")}/${String(r.getMonth()+1).padStart(2,"0")}/${r.getFullYear()}`; })()}</div>
          <div className="credits-cta">Ver planos <ArrowRight size={12} /></div>
          {sub.plan && (
            <div
              style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(250,181,0,0.12)", border: "1px solid rgba(250,181,0,0.3)", fontSize: 12, fontWeight: 600, color: "var(--coral-ink, #8A6500)", textAlign: "center", cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); setShowBuyCredits(true); }}
            >
              + Comprar créditos avulsos
            </div>
          )}
        </button>

        {/* Usuário — clicável → Configurações */}
        <div className="sb-user">
          <button className="sb-user-main" onClick={() => router.push("/configuracoes")} title="Perfil e configurações">
            {user?.hasImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.imageUrl} alt={fullName} className="av" style={{ objectFit: "cover" }} />
              : (
                <div className="av av-default">
                  <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                    <defs>
                      <linearGradient id="av-grad" x1="17" y1="4" x2="17" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#5A5A5A" />
                        <stop offset="100%" stopColor="#1A1A1A" />
                      </linearGradient>
                    </defs>
                    <circle cx="17" cy="13" r="6" fill="url(#av-grad)" />
                    <path d="M4 34c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="url(#av-grad)" />
                  </svg>
                </div>
              )
            }
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
      {showPlans && <PlansModal onClose={() => setShowPlans(false)} sub={sub} />}
      {showBuyCredits && sub.plan && (
        <BuyCreditsModal currentPlan={sub.plan} onClose={() => setShowBuyCredits(false)} />
      )}
      {showNewBrand && (
        <NewBrandModal
          onClose={() => setShowNewBrand(false)}
          onCreate={b => { setShowNewBrand(false); setToast(`Marca "${b.name}" criada`); }}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <SupportWidget plan={sub.plan} />
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/releases/novo")) return "Novo release";
  if (pathname.startsWith("/releases")) return "Biblioteca";
  if (pathname.startsWith("/calendario")) return "Calendário";
  if (pathname.startsWith("/veiculos")) return "Veículos";
  if (pathname.startsWith("/configuracoes")) return "Gerenciamento";
  return "Visão geral";
}
