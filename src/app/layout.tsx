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

export const metadata: Metadata = {
  title: "Raio Publicador",
  description: "Distribua releases para 600+ portais de notícias num único plano.",
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
