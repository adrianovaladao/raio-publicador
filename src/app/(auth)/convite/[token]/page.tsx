"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { ArrowRight, Check, Users } from "lucide-react";

interface InviteInfo {
  email: string;
  role: string;
  expired: boolean;
  accepted: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  EDITOR: "Edição",
  ADMIN:  "Administração",
};

const ROLE_DESC: Record<string, string> = {
  EDITOR: "Você poderá criar e editar releases em nome da conta.",
  ADMIN:  "Você terá acesso administrativo à conta.",
};

export default function ConviteTokenPage({ params }: { params: Promise<{ token: string }> }) {
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
      .catch(() => { setErr("Não foi possível carregar o convite. Verifique sua conexão."); setStatus("error"); });
  }, [token]);

  // If user is already logged in and invite is loaded, show accept button directly
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

  return (
    <div className="auth" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
      <div style={{
        width: "100%", maxWidth: 480, margin: "auto",
        padding: "40px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      }}>
        {/* Logo */}
        <RaioLockup height={32} variant="dark" />

        {/* Card */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line-2)",
          borderRadius: 16,
          padding: "36px 32px",
        }}>

          {/* Loading */}
          {status === "loading" && (
            <p style={{ color: "var(--tx-3)", textAlign: "center", fontSize: 14 }}>Carregando convite…</p>
          )}

          {/* Error */}
          {status === "error" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(220,53,69,0.1)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--tx)" }}>
                Convite inválido
              </h2>
              <p style={{ color: "var(--tx-2)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>{err}</p>
              {(err.includes("expirou") || err.includes("utilizado")) && (
                <p style={{ color: "var(--tx-4)", fontSize: 13, margin: "0 0 24px" }}>
                  Peça ao administrador da conta um novo convite.
                </p>
              )}
              <button
                onClick={() => router.push("/")}
                style={{ background: "var(--coral)", color: "#1a1a1a", border: "none", borderRadius: 9, padding: "11px 28px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
              >
                Ir para o início
              </button>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(250,181,0,0.12)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <Check size={24} color="var(--coral)" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--tx)" }}>Convite aceito!</h2>
              <p style={{ color: "var(--tx-2)", fontSize: 14 }}>Bem-vindo ao Raio Publicador. Redirecionando…</p>
            </div>
          )}

          {/* Ready — show invite info + CTA */}
          {(status === "ready" || status === "accepting") && invite && (
            <>
              {/* Role badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(250,181,0,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Users size={20} color="var(--coral)" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 3 }}>
                    Convite — {ROLE_LABEL[invite.role] ?? invite.role}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx)" }}>
                    Raio Publicador
                  </div>
                </div>
              </div>

              <h1 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 8px", color: "var(--tx)" }}>
                Você foi <em style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 400, color: "var(--coral)" }}>convidado</em>.
              </h1>
              <p style={{ color: "var(--tx-2)", fontSize: 14, margin: "0 0 6px", lineHeight: 1.5 }}>
                {ROLE_DESC[invite.role] ?? "Colabore na conta do Raio Publicador."}
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--tx-4)", margin: "0 0 28px", textTransform: "uppercase" }}>
                {invite.email}
              </p>

              {!isLoaded ? (
                <p style={{ color: "var(--tx-4)", fontSize: 14 }}>Carregando…</p>
              ) : !user ? (
                /* Not logged in — redirect to our own login page */
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "var(--tx-3)", marginBottom: 20, lineHeight: 1.55 }}>
                    Entre ou crie sua conta para aceitar o convite.
                  </p>
                  <a
                    href={`/login?redirect_url=${encodeURIComponent(`/convite/${token}`)}`}
                    className="btn btn-primary btn-block btn-lg"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}
                  >
                    Entrar <ArrowRight size={16} />
                  </a>
                  <p style={{ fontSize: 13, color: "var(--tx-4)", marginTop: 14 }}>
                    Primeira vez aqui?{" "}
                    <a
                      href={`/cadastro?redirect_url=${encodeURIComponent(`/convite/${token}`)}&email=${encodeURIComponent(invite.email)}`}
                      style={{ color: "var(--coral)", fontWeight: 600 }}
                    >
                      Criar conta gratuita
                    </a>
                  </p>
                </div>
              ) : (
                /* Logged in — show accept button */
                <button
                  onClick={accept}
                  disabled={status === "accepting"}
                  className="btn btn-primary btn-block btn-lg"
                >
                  {status === "accepting" ? "Aceitando…" : <><span>Aceitar convite</span> <ArrowRight size={16} /></>}
                </button>
              )}
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: "var(--tx-4)", textAlign: "center" }}>
          Ao aceitar, você concorda com os{" "}
          <a href="/termos" style={{ color: "var(--tx-3)" }}>Termos de Uso</a> do Raio Publicador.
        </p>
      </div>
    </div>
  );
}
