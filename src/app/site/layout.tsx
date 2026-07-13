import "./site.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "#1A1A1A", color: "rgba(255,255,255,0.94)", zoom: 1.15 }}>
      {children}
    </div>
  );
}
