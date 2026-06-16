import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--ink)" }}>
      {children}
    </div>
  );
}
