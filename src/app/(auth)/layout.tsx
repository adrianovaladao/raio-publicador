import "../site/site.css";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ height: "calc(100vh / 1.15)", background: "var(--ink)", color: "var(--tx)", zoom: 1.15, overflow: "hidden" }}>
      {children}
    </div>
  );
}
