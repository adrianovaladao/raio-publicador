"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { LayoutDashboard, Users, Rss, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";

const NAV = [
  { href: "/admin",           icon: LayoutDashboard, label: "Visão geral",  exact: true },
  { href: "/admin/usuarios",  icon: Users,           label: "Usuários"               },
  { href: "/admin/veiculos",  icon: Rss,             label: "Veículos"               },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", height: "100vh", background: "var(--bg)" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        display: "flex", flexDirection: "column",
        background: "#111", color: "#fff",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "0 0 16px",
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <RaioLockup height={20} variant="dark" />
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
            <ShieldCheck size={11} style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "#F59E0B" }}>
              Master Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          <p style={{ fontSize: 9.5, fontFamily: "var(--mono)", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", padding: "8px 10px 6px" }}>
            Administração
          </p>
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                fontSize: 13.5, fontWeight: active ? 600 : 400,
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                textDecoration: "none", transition: "all 0.15s",
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          <div style={{ margin: "16px 0 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
          <p style={{ fontSize: 9.5, fontFamily: "var(--mono)", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", padding: "8px 10px 6px" }}>
            Links externos
          </p>
          {[
            { label: "Stripe Dashboard", href: "https://dashboard.stripe.com" },
            { label: "Clerk Dashboard",  href: "https://dashboard.clerk.com"  },
          ].map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, marginBottom: 2,
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              textDecoration: "none", transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <ExternalLink size={13} />
              {label}
            </a>
          ))}
        </nav>

        {/* Divider + back to app */}
        <div style={{ padding: "0 10px 12px" }}>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 10px", borderRadius: 8,
            fontSize: 13, color: "rgba(255,255,255,0.4)",
            textDecoration: "none", transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            ← Voltar ao app
          </Link>
        </div>

        {/* User */}
        <div style={{ margin: "0 10px", padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F59E0B", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#111", flexShrink: 0 }}>
            {(user?.firstName?.[0] ?? user?.emailAddresses[0]?.emailAddress?.[0] ?? "A").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.firstName ?? "Admin"}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.emailAddresses[0]?.emailAddress}
            </div>
          </div>
          <button onClick={handleLogout} title="Sair" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 4, display: "flex" }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ overflow: "auto", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
