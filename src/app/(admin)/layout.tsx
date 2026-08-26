import type { Metadata } from "next";
import "@/app/app.css";
import { AdminShell } from "@/components/shell/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
