import "../site/site.css";

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="site-root">
      {children}
    </div>
  );
}
