import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// WhatsAppFab removido provisoriamente — para reativar:
// 1. Restaurar o componente WhatsAppFab aqui
// 2. Adicionar <WhatsAppFab /> antes de </div> abaixo

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ height: "calc(100vh / 1.15)", background: "var(--ink)", color: "var(--tx)", zoom: 1.15, overflow: "hidden" }}>
      {children}
    </div>
  );
}
