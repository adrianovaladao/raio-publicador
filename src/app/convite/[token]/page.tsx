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

        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1a1a1a", display: "grid", placeItems: "center", margin: "0 auto 24px", fontSize: 22 }}>⚡</div>

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
