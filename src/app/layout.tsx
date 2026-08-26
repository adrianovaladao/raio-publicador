import type { Metadata } from "next";
import { DM_Sans, Roboto_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  variable: "--font-roboto-serif",
  style: ["italic"],
  weight: ["400"],
});

/*
  Switzer não está no Google Fonts — é via Fontshare.
  O @font-face é declarado diretamente no globals.css quando você
  hospedar o arquivo localmente (ver comentário abaixo).
  Por enquanto DM Sans serve como fallback.
*/

const SITE_URL = "https://raiopublicador.com.br";
const DESCRIPTION = "A mais inovadora plataforma brasileira de publicação garantida e branded content em créditos que você distribui como preferir.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Raio Publicador",
    template: "%s | Raio Publicador",
  },
  description: DESCRIPTION,
  keywords: ["publicação garantida", "branded content", "assessoria de imprensa", "releases", "portais de notícias", "imprensa", "distribuição de conteúdo", "brasil"],
  authors: [{ name: "Raio Publicador", url: SITE_URL }],
  creator: "Markable",
  publisher: "Raio Publicador",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Raio Publicador",
    title: "Raio Publicador",
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Raio Publicador" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raio Publicador",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} localization={ptBR}>
      <html lang="pt-BR" className={`${dmSans.variable} ${robotoSerif.variable}`} style={{ height: "100%" }}>
        <body style={{ height: "100%", margin: 0 }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
