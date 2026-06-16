"use client";

import { useAuth } from "@clerk/nextjs";
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
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getClerkSignIn(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof window !== "undefined" ? (window as any).Clerk?.client?.signIn : null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getClerk(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof window !== "undefined" ? (window as any).Clerk : null;
  }

  useEffect(() => {
    if (isSignedIn) router.replace("/dashboard");
  }, [isSignedIn, router]);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── Reset de senha ───────────────────────────────────────────────────────
  const [resetStep, setResetStep] = useState<"none" | "email" | "code">("none");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode]   = useState("");
  const [resetPw, setResetPw]       = useState("");
  const [resetMsg, setResetMsg]     = useState("");

  async function sendResetEmail() {
    setLoading(true); setError("");
    try {
      const clerkSi = getClerkSignIn();
      if (!clerkSi) { setError("Aguarde e tente novamente."); return; }
      await clerkSi.create({ strategy: "reset_password_email_code", identifier: resetEmail });
      setResetStep("code");
      setResetMsg("Enviamos um código para " + resetEmail);
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(translateClerkError(e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || "") || "Não foi possível enviar o e-mail.");
    } finally { setLoading(false); }
  }

  async function confirmReset() {
    setLoading(true); setError("");
    try {
      const clerk   = getClerk();
      const clerkSi = getClerkSignIn();
      if (!clerkSi) { setError("Aguarde e tente novamente."); return; }
      const result = await clerkSi.attemptFirstFactor({ strategy: "reset_password_email_code", code: resetCode, password: resetPw });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(translateClerkError(e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || "") || "Código ou senha inválidos.");
    } finally { setLoading(false); }
  }

  async function doLogin() {
    setLoading(true);
    setError("");
    try {
      const clerk   = getClerk();
      const clerkSi = getClerkSignIn();
      if (!clerkSi) { setError("Aguarde um instante e tente novamente."); setLoading(false); return; }

      const result = await clerkSi.create({ identifier: email, password });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        window.location.href = "/dashboard";
        return;
      }

      if (result.status === "needs_first_factor") {
        const attempt = await clerkSi.attemptFirstFactor({ strategy: "password", password });
        if (attempt.status === "complete") {
          await clerk.setActive({ session: attempt.createdSessionId });
          window.location.href = "/dashboard";
          return;
        }
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
          <Link href="/"><RaioLockup height={24} variant="dark" /></Link>
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
          <a href="https://markable.com.br" target="_blank" rel="noopener noreferrer">
            <Image src="/assets/logo/markable-horizontal-mono-white.svg" alt="Markable" width={80} height={15} style={{ height: 15, width: "auto" }} />
          </a>
        </div>
      </aside>

      {/* ── Painel direito ── */}
      <div className="auth-main">
        <div className="auth-card">
          {/* ── Esqueci a senha: passo e-mail ── */}
          {resetStep === "email" && (
            <>
              <h1 style={{ marginTop: 28 }}>Recuperar <em>senha</em>.</h1>
              <p className="lead">Digite seu e-mail e enviaremos um código de verificação.</p>
              <form onSubmit={(e) => { e.preventDefault(); sendResetEmail(); }}>
                <div className="fld">
                  <label>E-mail</label>
                  <input className="in" type="email" placeholder="voce@empresa.com.br" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required autoFocus />
                </div>
                {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                  {loading ? "Enviando…" : <>Enviar código <ArrowRight size={17} /></>}
                </button>
              </form>
              <div className="auth-foot"><button style={{ background: "none", border: "none", color: "var(--coral)", fontWeight: 600, cursor: "pointer", fontSize: 14 }} onClick={() => { setResetStep("none"); setError(""); }}>Voltar ao login</button></div>
            </>
          )}

          {/* ── Esqueci a senha: passo código + nova senha ── */}
          {resetStep === "code" && (
            <>
              <h1 style={{ marginTop: 28 }}>Nova <em>senha</em>.</h1>
              <p className="lead">{resetMsg}</p>
              <form onSubmit={(e) => { e.preventDefault(); confirmReset(); }}>
                <div className="fld">
                  <label>Código de verificação</label>
                  <input className="in" type="text" placeholder="000000" value={resetCode} onChange={e => setResetCode(e.target.value)} required autoFocus maxLength={6} style={{ letterSpacing: "0.2em", fontSize: 20 }} />
                </div>
                <div className="fld">
                  <label>Nova senha</label>
                  <div style={{ position: "relative" }}>
                    <input className="in" type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={resetPw} onChange={e => setResetPw(e.target.value)} required minLength={8} style={{ paddingRight: 46 }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.44)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                  {loading ? "Salvando…" : <>Salvar nova senha <ArrowRight size={17} /></>}
                </button>
              </form>
              <div className="auth-foot"><button style={{ background: "none", border: "none", color: "var(--coral)", fontWeight: 600, cursor: "pointer", fontSize: 14 }} onClick={() => { setResetStep("none"); setError(""); }}>Voltar ao login</button></div>
            </>
          )}

          {/* ── Login normal ── */}
          {resetStep === "none" && (<>
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
              <button type="button" style={{ background: "none", border: "none", color: "var(--tx-2)", cursor: "pointer", fontSize: 13.5, textDecoration: "underline" }} onClick={() => { setResetEmail(email); setResetStep("email"); setError(""); }}>Esqueci a senha</button>
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
          </>)}
        </div>
      </div>
    </div>
  );
}
