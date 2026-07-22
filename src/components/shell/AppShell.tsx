"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard, FileText, CalendarDays, Rss, Settings, ShieldCheck,
  Bell, LogOut, Zap, Check, X,
  Megaphone, CreditCard, Users, Radio,
} from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { SupportWidget } from "@/components/support/SupportWidget";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";
import { SelectBox } from "@/components/SelectBox";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ─── Subscription data ────────────────────────────────────────────────────────

interface SubInfo { plan: string | null; status: string | null; label: string; priceCents: number | null; credits: number; creditsUsed: number; }

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


// ─── Notification Panel ───────────────────────────────────────────────────────

interface NotifRow {
  id: string; type: string; title: string; body: string;
  link: string | null; read: boolean; createdAt: string;
}

function notifIcon(type: string) {
  if (type.startsWith("release"))    return <Megaphone size={15} />;
  if (type.startsWith("plan") || type.startsWith("subscription") || type.includes("credits") || type.includes("payment")) return <CreditCard size={15} />;
  if (type === "member_joined")      return <Users size={15} />;
  if (type === "vehicle_added")      return <Radio size={15} />;
  return <Bell size={15} />;
}

function notifColor(type: string): string {
  if (type === "release_published")        return "#2F8A5B";
  if (type === "release_needs_revision")   return "#8A6500";
  if (type === "release_rejected")         return "#B0322E";
  if (type.includes("credit") || type === "payment_failed") return "#B0322E";
  if (type.startsWith("plan") || type.startsWith("subscription")) return "#2A6FDB";
  return "#6D3BD9";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d atrás`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then((d: NotifRow[]) => { setNotifs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 1099 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: 60, right: 16, width: 380, maxHeight: "calc(100vh - 80px)",
        background: "var(--paper)", borderRadius: 16, border: "1px solid var(--line)",
        boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 1100,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Notificações</span>
            {unread > 0 && (
              <span style={{ background: "var(--coral)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "1px 7px" }}>{unread}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--stone)", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6 }}>
                <Check size={13} /> Marcar todas como lidas
              </button>
            )}
            <button onClick={onClose} style={{ background: "var(--cream)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--stone)" }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--stone)", fontSize: 13 }}>Carregando…</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Bell size={32} style={{ color: "var(--line)", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Tudo tranquilo por aqui</div>
              <div style={{ fontSize: 13, color: "var(--stone)" }}>Você não tem notificações ainda.</div>
            </div>
          ) : (
            notifs.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.link) window.location.href = n.link;
                  else onClose();
                }}
                style={{
                  display: "flex", gap: 12, padding: "13px 18px", borderBottom: "1px solid var(--line)",
                  background: n.read ? "transparent" : "var(--cream)",
                  cursor: "pointer", transition: "background .15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? "transparent" : "var(--cream)")}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: notifColor(n.type) + "18",
                  color: notifColor(n.type),
                  display: "grid", placeItems: "center",
                }}>
                  {notifIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.3 }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: "var(--stone)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--stone)", lineHeight: 1.45, marginTop: 2 }}>{n.body}</div>
                </div>
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--coral)", flexShrink: 0, marginTop: 13 }} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line)", flexShrink: 0, textAlign: "center" }}>
          <a href="/configuracoes?tab=notificacoes" style={{ fontSize: 12, color: "var(--stone)", textDecoration: "none" }} onClick={onClose}>
            Gerenciar preferências de notificação →
          </a>
        </div>
      </div>
    </>
  );
}

// ─── PlansModal ───────────────────────────────────────────────────────────────

function PlansModal({ onClose, sub, onSuccess, onBuyCredits }: { onClose: () => void; sub: SubInfo; onSuccess: (msg: string) => void; onBuyCredits: () => void }) {
  const pct  = sub.credits > 0 ? Math.round((sub.creditsUsed / sub.credits) * 100) : 0;
  const left = sub.credits - sub.creditsUsed;
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeErr, setUpgradeErr] = useState<string | null>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    setUpgradeErr(null);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json() as { ok?: boolean; redirect?: boolean; url?: string; error?: string };
      if (data.redirect && data.url) { window.location.href = data.url; return; }
      if (data.ok) { onSuccess("Plano atualizado com sucesso"); onClose(); return; }
      setUpgradeErr(data.error ?? "Não foi possível processar o upgrade. Tente novamente.");
    } catch {
      setUpgradeErr("Falha de conexão. Tente novamente.");
    }
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

          {upgradeErr && (
            <div style={{ margin: "0 0 8px", padding: "10px 14px", background: "var(--coral-soft, #fee2e2)", borderRadius: 10, fontSize: 13, color: "var(--coral, #dc2626)" }}>
              {upgradeErr}
            </div>
          )}
          <div className="plans-note" style={{ cursor: "pointer" }} onClick={() => { onClose(); onBuyCredits(); }}>
            <Zap size={16} />
            <span>Precisa de mais créditos? <b>Comprar créditos avulsos →</b></span>
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
              <SelectBox value={segment} options={BRAND_SEGMENTS} onChange={setSegment} />
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

function QueryParamWatcher({ setToast }: { setToast: (m: string) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      setToast("Plano atualizado com sucesso");
      const url = new URL(window.location.href);
      url.searchParams.delete("upgrade");
      router.replace(url.pathname + (url.search || ""));
    }
    if (searchParams.get("credits") === "success") {
      setToast("Créditos adicionados ao seu saldo");
      const url = new URL(window.location.href);
      url.searchParams.delete("credits");
      router.replace(url.pathname + (url.search || ""));
    }
  }, [searchParams, router, setToast]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [showPlans, setShowPlans] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [releaseCount, setReleaseCount] = useState<number | null>(null);
  const [sub, setSub] = useState<SubInfo>({ plan: null, status: null, label: "—", priceCents: null, credits: 0, creditsUsed: 0 });

  const fetchSub = useCallback(() => {
    fetch("/api/stripe/subscription")
      .then(r => r.json())
      .then((d: Partial<SubInfo>) => {
        setSub({ plan: d.plan ?? null, status: d.status ?? null, label: d.label ?? "—", priceCents: d.priceCents ?? null, credits: d.credits ?? 0, creditsUsed: d.creditsUsed ?? 0 });
      })
      .catch(() => {});
  }, []);

  const fetchReleaseCount = useCallback(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then((d: { stats?: { total?: number } }) => { if (d?.stats?.total != null) setReleaseCount(d.stats.total); })
      .catch(() => {});
  }, []);

  const fetchUnread = useCallback(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then((d: { read: boolean }[]) => setUnreadCount(Array.isArray(d) ? d.filter(n => !n.read).length : 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReleaseCount();
    fetchSub();
    fetchUnread();
    const openPlans = () => setShowPlans(true);
    const refreshNotifs = () => fetchUnread();
    window.addEventListener("credits-changed", fetchSub);
    window.addEventListener("open-plans", openPlans);
    window.addEventListener("releases-changed", fetchReleaseCount);
    window.addEventListener("notifications-changed", refreshNotifs);
    return () => {
      window.removeEventListener("credits-changed", fetchSub);
      window.removeEventListener("open-plans", openPlans);
      window.removeEventListener("releases-changed", fetchReleaseCount);
      window.removeEventListener("notifications-changed", refreshNotifs);
    };
  }, [fetchReleaseCount, fetchSub, fetchUnread]);

  useEffect(() => {
    fetchReleaseCount();
  }, [pathname, fetchReleaseCount]);

  const firstName = user?.firstName ?? "";
  const lastName  = user?.lastName  ?? "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Usuário";

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const pct  = sub.credits > 0 ? Math.round((sub.creditsUsed / sub.credits) * 100) : 0;
  const left = sub.credits - sub.creditsUsed;
  const isCancelled = sub.status === "CANCELLED" || sub.status === "INACTIVE" && sub.credits === 0;

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <Link href="/dashboard"><RaioLockup height={32} variant="dark" /></Link>
        </div>

        <div className="sb-mid scroll">
          <div style={{ padding: "16px 12px 2px" }}>
            {isCancelled ? (
              <button className="btn btn-primary btn-block btn-lg" disabled title="Assine um plano para criar releases">
                <FileText size={17} /> Criar release
              </button>
            ) : (
              <Link
                href="/releases/novo"
                className="btn btn-primary btn-block btn-lg"
                onClick={e => {
                  if (pathname === "/releases/novo") {
                    e.preventDefault();
                    window.location.href = "/releases/novo";
                  }
                }}
              >
                <FileText size={17} /> Criar release
              </Link>
            )}
          </div>

          <div className="sb-section">Navegação</div>
          <nav className="sb-nav">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const badge = href === "/releases" && releaseCount ? String(releaseCount) : null;
              if (isCancelled) return (
                <span key={href} className="sb-item" style={{ opacity: 0.35, cursor: "not-allowed", pointerEvents: "none" }}>
                  <Icon size={18} /><span>{label}</span>
                </span>
              );
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
            {user?.publicMetadata?.raioAdmin === true && (
              <Link href="/admin" className={`sb-item${pathname.startsWith("/admin") ? " active" : ""}`}>
                <ShieldCheck size={18} />
                <span>Master Admin</span>
              </Link>
            )}
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
          {sub.plan && (
            <div
              style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "center", cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); setShowPlans(true); }}
            >
              Ver planos
            </div>
          )}
          {sub.plan && (
            <div
              style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "#000", border: "1px solid #000", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "center", cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); setShowBuyCredits(true); }}
            >
              + Comprar créditos avulsos
            </div>
          )}
        </button>

      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <span className="t">{getPageTitle(pathname)}</span>
          </div>
          <div className="spacer" />

          {/* Usuário na topbar */}
          <button className="topbar-user" onClick={() => router.push("/configuracoes")} title="Perfil e configurações">
            {user?.hasImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.imageUrl} alt={fullName} className="topbar-av" style={{ objectFit: "cover" }} />
              : (
                <div className="topbar-av topbar-av-default">
                  <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                    <defs>
                      <linearGradient id="av-grad-tb" x1="17" y1="4" x2="17" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#5A5A5A" />
                        <stop offset="100%" stopColor="#1A1A1A" />
                      </linearGradient>
                    </defs>
                    <circle cx="17" cy="13" r="6" fill="url(#av-grad-tb)" />
                    <path d="M4 34c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="url(#av-grad-tb)" />
                  </svg>
                </div>
              )
            }
            <div className="topbar-who">
              <div className="topbar-nm">{fullName}</div>
              <div className="topbar-rl">Administração</div>
            </div>
          </button>
          <button
            className="icon-btn"
            title="Notificações"
            style={{ position: "relative" }}
            onClick={() => { setShowNotifs(o => !o); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--coral)", border: "2px solid var(--paper)",
              }} />
            )}
          </button>
          {showNotifs && (
            <NotificationPanel onClose={() => { setShowNotifs(false); fetchUnread(); }} />
          )}
          <button className="icon-btn" title="Sair" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </header>

        {children}
      </div>

      {/* ── MODAIS ── */}
      {showPlans && <PlansModal onClose={() => setShowPlans(false)} sub={sub} onSuccess={msg => { setToast(msg); setShowPlans(false); fetchSub(); }} onBuyCredits={() => { setShowPlans(false); setShowBuyCredits(true); }} />}
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
      <Suspense fallback={null}><QueryParamWatcher setToast={setToast} /></Suspense>

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
  if (pathname.startsWith("/admin")) return "Master Admin";
  return "Visão geral";
}
