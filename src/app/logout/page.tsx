"use client";
import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useClerk();
  useEffect(() => {
    signOut().then(() => { window.location.href = "/login"; });
  }, [signOut]);
  return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif" }}>Saindo…</div>;
}
