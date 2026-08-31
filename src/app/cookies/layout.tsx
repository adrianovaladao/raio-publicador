import "../site/site.css";

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="site-root">
      {children}
    </div>
  );
}
