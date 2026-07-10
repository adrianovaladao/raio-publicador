"use client";

import { useSignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, CheckCircle, Feather, Newspaper, Send, Mail } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import { translateClerkError } from "@/lib/clerkErrors";

type Step = "signup" | "verify" | "done";

function PwMeter({ pw }: { pw: string }) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  const lbl = ["", "Fraca", "Boa", "Forte"][pw ? s : 0];
  if (!pw) return null;
  return (
    <>
      <div className="pw-meter">
        {[1,2,3].map(i => <i key={i} className={s >= i ? `on${s}` : ""} />)}
      </div>
      <div className="pw-hint">Força da senha: <b style={{ color: "var(--tx)" }}>{lbl}</b></div>
    </>
  );
}

const STEPS_MINI = [
  { icon: Feather,   t: "Escreva seu release" },
  { icon: Newspaper, t: "Escolha entre centenas de veículos" },
  { icon: Send,      t: "Publique com um clique" },
];

const VALID_PLANS = ["BASIC", "ADVANCED", "PROFESSIONAL"];

function CadastroInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { signUp, setActive } = useSignUp() as any;
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam && VALID_PLANS.includes(planParam) ? planParam : null;

  function goToCheckout() {
    window.location.href = plan ? `/boas-vindas?plan=${plan}` : "/boas-vindas";
  }

  useEffect(() => {
    if (isSignedIn) goToCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkSuRef = useRef<any>(null);

  const [step, setStep]     = useState<Step>("signup");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPw]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp]       = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2 || !parts[1]) {
      setError("Por favor, informe seu nome completo (nome e sobrenome).");
      setLoading(false);
      return;
    }
    try {
      if (!signUp) { setError("Aguarde um instante e tente novamente."); return; }
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ");
      const su = await signUp.create({ emailAddress: email, password, firstName, lastName });
      console.log("[cadastro] su keys:", Object.keys(su ?? {}));
      console.log("[cadastro] su full:", JSON.stringify(su));
      console.log("[cadastro] su proto methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(su ?? {})));
      console.log("[cadastro] su.prepareVerification:", typeof (su as Record<string, unknown>)?.prepareVerification);
      console.log("[cadastro] su.prepareEmailAddressVerification:", typeof (su as Record<string, unknown>)?.prepareEmailAddressVerification);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prepareFn = (su as any)?.prepareVerification ?? (su as any)?.prepareEmailAddressVerification ?? signUp?.prepareVerification ?? signUp?.prepareEmailAddressVerification;
      if (!prepareFn) throw new Error("Clerk: método prepareVerification não encontrado no objeto su");
      await prepareFn.call(su, { strategy: "email_code" });
      clerkSuRef.current = su;
      setStep("verify");
    } catch (err: unknown) {
      console.error("[cadastro] signUp.create error:", JSON.stringify(err));
      const e = err as { errors?: { longMessage?: string; message?: string; code?: string }[]; message?: string };
      const raw = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || "";
      const code = e?.errors?.[0]?.code || "";
      setError(translateClerkError(raw) || translateClerkError(code) || raw || code || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true);
    setError("");
    try {
      // Always prefer the live signUp from window.Clerk to avoid stale closure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clerkSu = (window as any).Clerk?.client?.signUp ?? clerkSuRef.current ?? signUp;
      if (!clerkSu) { setError("Tente novamente."); return; }
      let result = await clerkSu.attemptVerification({ code });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sa = setActive ?? (window as any).Clerk?.setActive;

      // If missing_requirements, try to patch firstName/lastName in case they weren't saved
      if (result.status === "missing_requirements") {
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const liveSignUp = (window as any).Clerk?.client?.signUp ?? clerkSu;
          result = await liveSignUp.update({ firstName, lastName });
        } catch { /* ignore update errors, fall through */ }
      }

      if (result.status === "complete") {
        await sa({ session: result.createdSessionId });
        await goToCheckout();
      } else if (result.createdSessionId) {
        await sa({ session: result.createdSessionId });
        await goToCheckout();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionId = (window as any).Clerk?.client?.activeSessions?.[0]?.id;
        if (sessionId) {
          await sa({ session: sessionId });
          await goToCheckout();
        } else {
          setError(`Verificação incompleta (status: ${result.status}). Tente novamente.`);
        }
      }
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string; code?: string }[] };
      const code = e?.errors?.[0]?.code || "";
      // If email is already verified, the session may already exist
      if (code === "verification_already_verified" || code === "form_identifier_already_used") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionId = (window as any).Clerk?.client?.activeSessions?.[0]?.id;
        if (sessionId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sa = setActive ?? (window as any).Clerk?.setActive;
          await sa({ session: sessionId });
          await goToCheckout();
          return;
        }
      }
      const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || "";
      setError(translateClerkError(msg) || msg || code || "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const clerkSu = clerkSuRef.current || signUp;
    if (!clerkSu) return;
    try {
      await clerkSu.prepareVerification({ strategy: "email_code" });
      setError(""); setOtp(["","","","","",""]);
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(e?.errors?.[0]?.message || "Erro ao reenviar código.");
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    const next = [...otp];
    digits.forEach((d, idx) => { if (idx < 6) next[idx] = d; });
    setOtp(next);
    const focusIdx = Math.min(digits.length, 5);
    otpRefs.current[focusIdx]?.focus();
  }

  return (
    <div className="auth">
      {/* ── Painel esquerdo ── */}
      <aside className="auth-aside">
        <span className="glow" />
        <span className="grid-bg" />

        <div className="top">
          <Link href="/"><RaioLockup height={27} variant="dark" /></Link>
        </div>

        <div className="mid">
          <div className="q">
            Comece a publicar <b>como um raio</b> em menos de 5 minutos.
          </div>
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

          {/* ── Passo: cadastro ── */}
          {step === "signup" && (
            <>
              <h1>Crie sua <em>conta</em>.</h1>
              <p className="lead">Comece a distribuir releases para centenas de veículos.</p>

              <form onSubmit={handleSignUp}>
                <div className="fld">
                  <label>Nome completo</label>
                  <input className="in" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                </div>
                <div className="fld">
                  <label>E-mail</label>
                  <input className="in" type="email" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="fld">
                  <label>Senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="in" type={showPw ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres" value={password}
                      onChange={(e) => setPw(e.target.value)} required style={{ paddingRight: 46 }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.44)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <PwMeter pw={password} />
                </div>

                <div id="clerk-captcha" />
                {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                  {loading ? "Criando conta…" : <><span>Criar conta</span><ArrowRight size={17} /></>}
                </button>
              </form>

              <p className="auth-foot">
                Já tem conta? <Link href="/login">Entrar</Link>
              </p>
            </>
          )}

          {/* ── Passo: verificar e-mail ── */}
          {step === "verify" && (
            <>
              <div className="auth-icon"><Mail size={26} /></div>
              <h1>Confirme seu <em>e-mail</em>.</h1>
              <p className="lead">
                Enviamos um código para{" "}
                <span className="mail-to"><Mail size={15} />{email}</span>
              </p>

              <div className="otp">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    onPaste={handleOtpPaste}
                    className={digit ? "filled" : ""}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

              <button className="btn btn-primary btn-block btn-lg" onClick={handleVerify} disabled={loading || otp.join("").length < 6}>
                {loading ? "Verificando…" : <><span>Confirmar</span><ArrowRight size={17} /></>}
              </button>

              <div className="resend" style={{ marginTop: 16 }}>
                Não recebeu?{" "}
                <a onClick={handleResend} style={{ cursor: "pointer" }}>Reenviar código</a>
              </div>
            </>
          )}

          {/* ── Passo: conta criada ── */}
          {step === "done" && (
            <div style={{ textAlign: "center", paddingTop: 16 }}>
              <div className="success-ic" style={{ margin: "0 auto 22px" }}>
                <CheckCircle size={32} />
              </div>
              <h1 style={{ fontSize: 26 }}>Conta <em>criada</em>!</h1>
              <p className="lead">Sua conta está pronta. Vamos configurar seu primeiro espaço de trabalho.</p>
              <Link className="btn btn-primary btn-block btn-lg" href="/boas-vindas" style={{ marginTop: 24 }}>
                Começar <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroInner />
    </Suspense>
  );
}
