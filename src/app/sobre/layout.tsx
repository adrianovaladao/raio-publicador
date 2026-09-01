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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://raiopublicador.com.br/sobre",
  "url": "https://raiopublicador.com.br/sobre",
  "name": "Sobre o Raio Publicador",
  "description": "Conheça a origem do Raio Publicador, a plataforma brasileira de publicação garantida criada pela Markable Comunicação.",
  "publisher": {
    "@type": "Organization",
    "@id": "https://raiopublicador.com.br/#org",
    "name": "Raio Publicador",
    "url": "https://raiopublicador.com.br",
  },
};

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="site-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
