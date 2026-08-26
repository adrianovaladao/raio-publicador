import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/site", "/sobre", "/termos", "/privacidade", "/cookies"],
        disallow: ["/dashboard", "/releases", "/veiculos", "/calendario", "/configuracoes", "/admin", "/boas-vindas", "/pix", "/convite", "/logout"],
      },
    ],
    sitemap: "https://raiopublicador.com.br/sitemap.xml",
  };
}
