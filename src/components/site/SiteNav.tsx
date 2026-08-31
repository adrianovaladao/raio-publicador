"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";

export function SiteNav({ activePage }: { activePage?: "sobre" | "home" }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn); fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-in">
        <Link className="lock" href="/" onClick={close}>
          <RaioLockup height={33} variant="dark" />
        </Link>
        <div className="links">
          <Link href="/#como">Como funciona</Link>
          <Link href="/#planos">Planos</Link>
          <Link href="/sobre" style={activePage === "sobre" ? { color: "var(--gold)" } : undefined}>Sobre</Link>
        </div>
        <div className="nav-cta">
          <Link className="enter" href="/login">Entrar</Link>
          <Link className="btn btn-primary btn-sm" href="/#planos">Assinar agora</Link>
        </div>
        <button className="nav-burger" aria-label="Abrir menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-mobile${menuOpen ? " open" : ""}`}>
        <Link href="/#como" onClick={close}>Como funciona</Link>
        <Link href="/#planos" onClick={close}>Planos</Link>
        <Link href="/sobre" onClick={close} style={activePage === "sobre" ? { color: "var(--gold)" } : undefined}>Sobre</Link>
        <div className="nav-mobile-cta">
          <Link className="btn btn-ghost btn-block" href="/login" onClick={close}>Entrar</Link>
          <Link className="btn btn-primary btn-block" href="/#planos" onClick={close}>Assinar agora</Link>
        </div>
      </div>
      {menuOpen && <div className="nav-scrim" onClick={close} />}
    </nav>
  );
}
