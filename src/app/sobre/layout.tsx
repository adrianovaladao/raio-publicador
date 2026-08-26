import "../site/site.css";

export const metadata = {
  title: "Sobre",
  description: "Conheça a origem do Raio Publicador, a plataforma brasileira de publicação garantida criada pela Markable para conectar marcas à imprensa de forma direta e acessível.",
  openGraph: {
    title: "Sobre | Raio Publicador",
    description: "Conheça a origem do Raio Publicador, a plataforma brasileira de publicação garantida criada pela Markable para conectar marcas à imprensa de forma direta e acessível.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Raio Publicador" }],
  },
};

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "#1A1A1A", color: "rgba(255,255,255,0.94)", zoom: 1.15 }}>
      {children}
    </div>
  );
}
