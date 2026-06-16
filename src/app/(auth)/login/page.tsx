"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Feather, Newspaper, Send } from "lucide-react";
import { translateClerkError } from "@/lib/clerkErrors";
import { RaioLockup } from "@/components/logo/RaioLockup";

const STEPS_MINI = [
  { icon: Feather,   t: "Escreva seu release" },
  { icon: Newspaper, t: "Escolha entre centenas de veículos" },
  { icon: Send,      t: "Publique com um clique" },
];

export default function LoginPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { setActive } = useSignIn() as any;
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.replace("/dashboard");
  }, [isSignedIn, router]);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function doLogin() {
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clerk   = (window as any).Clerk;
      const clerkSi = clerk?.client?.signIn;
      if (!clerkSi) { setError("Aguarde um instante e tente novamente."); return; }

      const result = await clerkSi.create({ identifier: email, password });

      if (result.status === "complete") {
        const sa = setActive ?? clerk?.setActive;
        await sa({ session: result.createdSessionId });
        window.location.href = "/dashboard";
        return;
      }

      if (result.status === "needs_first_factor") {
        const attempt = await clerkSi.attemptFirstFactor({ strategy: "password", password });
        if (attempt.status === "complete") {
          const sa = setActive ?? clerk?.setActive;
          await sa({ session: attempt.createdSessionId });
          window.location.href = "/dashboard";
          return;
        }
      }

      if (result.status === "needs_client_trust") {
        await clerk?.client?.fetch?.();
        const activeSession = clerk?.session ?? clerk?.client?.activeSessions?.[0];
        if (activeSession?.id) {
          const sa = setActive ?? clerk?.setActive;
          await sa({ session: activeSession.id });
          window.location.href = "/dashboard";
          return;
        }
        try {
          const attempt = await clerkSi.attemptFirstFactor({ strategy: "password", password });
          if (attempt.status === "complete") {
            const sa = setActive ?? clerk?.setActive;
            await sa({ session: attempt.createdSessionId });
            window.location.href = "/dashboard";
            return;
          }
        } catch { /* cai no erro genérico */ }
        setError("Não foi possível verificar sua sessão. Tente novamente.");
        return;
      }

      setError("Não foi possível completar o login. Tente novamente.");
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(translateClerkError(e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || "") || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      {/* ── Painel esquerdo ── */}
      <aside className="auth-aside">
        <span className="glow" />
        <span className="grid-bg" />

        <div className="top">
          <RaioLockup height={24} variant="dark" />
        </div>

        <div className="mid">
          <div className="q">
            Um plano. Centenas de veículos.{" "}
            <b>Quantos releases você precisar.</b>
          </div>
          <div className="by">A distribuição de releases por créditos do Brasil</div>

          <div className="steps-mini" style={{ marginTop: 32 }}>
            {STEPS_MINI.map(({ icon: Icon, t }, i) => (
              <div className="sm" key={i}>
                <span className="ic"><Icon size={17} /></span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="powered">
          Energizado pela{" "}
          <Image src="/assets/logo/markable-horizontal-mono-white.svg" alt="Markable" width={80} height={15} style={{ height: 15, width: "auto" }} />
        </div>
      </aside>

      {/* ── Painel direito ── */}
      <div className="auth-main">
        <div className="auth-card">
          <RaioLockup height={22} variant="dark" />

          <h1 style={{ marginTop: 28 }}>
            Bem-vindo<br />de <em>volta</em>.
          </h1>
          <p className="lead">Entre na sua conta para continuar distribuindo.</p>

          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
            <div className="fld">
              <label>E-mail</label>
              <input
                className="in"
                type="email"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="fld">
              <label>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  className="in"
                  type={showPw ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.44)", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="opt-row">
              <label className="chk">
                <input type="checkbox" />
                <span className="bx" />
                <span className="tx">Lembrar acesso</span>
              </label>
              <Link href="/cadastro">Esqueci a senha</Link>
            </div>

            {error && (
              <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>
            )}

            <button
              className="btn btn-primary btn-block btn-lg"
              type="button"
              disabled={loading}
              onClick={() => doLogin()}
            >
              {loading ? "Entrando…" : <><span>Entrar</span><ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-foot">
            Não tem conta?{" "}
            <Link href="/cadastro">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
