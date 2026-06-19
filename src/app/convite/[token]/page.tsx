"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignIn } from "@clerk/nextjs";

interface InviteInfo {
  email: string;
  role: string;
  expired: boolean;
  accepted: boolean;
}

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "accepting" | "done" | "error">("loading");
  const [err, setErr] = useState("");

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invites/accept?token=${token}`)
      .then(r => r.json())
      .then((data: InviteInfo & { error?: string }) => {
        if (data.error) { setErr(data.error); setStatus("error"); return; }
        setInvite(data);
        setStatus("ready");
      })
      .catch(() => { setErr("Não foi possível carregar o convite."); setStatus("error"); });
  }, [token]);

  async function accept() {
    setStatus("accepting");
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) { setErr(data.error ?? "Erro ao aceitar convite."); setStatus("error"); return; }
    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  const roleLabel: Record<string, string> = { ADMIN: "Administração", EDITOR: "Edição", REVIEWER: "Revisão" };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--cream, #FAF9F7)", fontFamily: "var(--font-dm-sans, sans-serif)", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%", boxShadow: "0 2px 24px rgba(0,0,0,0.07)", textAlign: "center" }}>

        <svg width="48" height="48" viewBox="0 0 101 101" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto 24px", display: "block" }}>
          <rect width="101" height="101" rx="16" fill="#212121"/>
          <path d="M73.4658 16C81.0444 16.0002 87.1883 22.144 87.1885 29.7227V54.8809C87.1885 62.4597 81.0446 68.6043 73.4658 68.6045H60.2471L66.4297 60.9805H73.4658C76.8341 60.9803 79.5645 58.2492 79.5645 54.8809V29.7227C79.5642 26.3545 76.834 23.6242 73.4658 23.624H27.7227C24.3545 23.6241 21.6242 26.3545 21.624 29.7227V54.8809C21.624 58.2492 24.3543 60.9804 27.7227 60.9805H31.5205L29.167 68.6045H27.7227C20.1438 68.6044 14 62.4597 14 54.8809V29.7227C14.0002 22.144 20.144 16.0001 27.7227 16H73.4658Z" fill="white"/>
          <path d="M63.9117 56.1858L42.0623 83.1394C41.3525 84.3086 40.1865 85 38.7671 85C38.2982 85 37.8292 85 37.3603 84.7611C35.4846 84.0571 34.5341 82.1965 35.003 80.3233L38.7417 68.6066H29.5533C28.3747 68.6066 26.9679 68.1414 26.2581 66.9722C25.5484 66.0419 25.3203 64.6339 25.5484 63.4773L35.0917 32.8528C35.5606 30.9922 37.2082 29.823 39.0966 29.823H50.9465C52.3533 29.823 53.532 30.527 54.2417 31.4573C54.9514 32.3876 55.1795 34.0219 54.7106 35.1911L49.0455 50.3399L60.3884 50.1011C61.7952 50.1011 63.2147 50.8051 63.9117 52.2005C64.6215 53.3697 64.6215 54.7652 63.9117 56.1732V56.1858Z" fill="#FAB500"/>
        </svg>

        {status === "loading" && <p style={{ color: "#777" }}>Carregando convite…</p>}

        {status === "error" && (
          <>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Link inválido</h2>
            <p style={{ color: "#777", margin: "0 0 24px", fontSize: 14 }}>{err}</p>
            <button onClick={() => router.push("/")} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              Ir para o início
            </button>
          </>
        )}

        {status === "done" && (
          <>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Convite aceito! ✓</h2>
            <p style={{ color: "#777", fontSize: 14 }}>Redirecionando para o painel…</p>
          </>
        )}

        {(status === "ready" || status === "accepting") && invite && (
          <>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>Você foi convidado</h2>
            <p style={{ color: "#555", margin: "0 0 6px", fontSize: 14 }}>
              Para colaborar no <strong>Raio Publicador</strong> com a função de{" "}
              <strong>{roleLabel[invite.role] ?? invite.role}</strong>.
            </p>
            <p style={{ color: "#999", margin: "0 0 32px", fontSize: 13 }}>{invite.email}</p>

            {!isLoaded ? null : !user ? (
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>Faça login ou crie uma conta para continuar:</p>
                <SignIn routing="hash" forceRedirectUrl={`/convite/${token}`} />
              </div>
            ) : (
              <button
                onClick={accept}
                disabled={status === "accepting"}
                style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600, width: "100%" }}
              >
                {status === "accepting" ? "Aceitando…" : "Aceitar convite →"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
