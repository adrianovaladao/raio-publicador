import type { Metadata } from "next";
import "@/app/app.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
