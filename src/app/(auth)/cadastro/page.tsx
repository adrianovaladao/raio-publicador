"use client";

import { useSignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, CheckCircle, Feather, Newspaper, Send, Mail, Check, X, Loader } from "lucide-react";
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
  { icon: Newspaper, t: "Escolha entre dezenas de veículos" },
  { icon: Send,      t: "Publique seu release em minutos" },
];

const VALID_PLANS = ["BASIC", "ADVANCED", "PROFESSIONAL"];

function CadastroInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { signUp, setActive } = useSignUp() as any;
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const isVoucherFlow = searchParams.get("voucher") === "1";
  const plan = planParam && VALID_PLANS.includes(planParam) ? planParam : null;

  const [voucherCode,    setVoucherCode]    = useState("");
  const [voucherState,   setVoucherState]   = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [voucherError,   setVoucherError]   = useState("");
  const [voucherCredits, setVoucherCredits] = useState(0);
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  async function checkVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherState("checking");
    setVoucherError("");
    try {
      const res = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(voucherCode.trim())}`);
      const data = await res.json() as { valid: boolean; credits?: number; error?: string };
      if (data.valid) {
        setVoucherState("valid");
        setVoucherCredits(data.credits ?? 100);
      } else {
        setVoucherState("invalid");
        setVoucherError(data.error ?? "Código inválido.");
      }
    } catch {
      setVoucherState("invalid");
      setVoucherError("Erro ao validar código. Tente novamente.");
    }
  }

  function goToCheckout() {
    window.location.href = plan ? `/boas-vindas?plan=${plan}` : "/boas-vindas";
  }

  async function redeemAndProceed() {
    try {
      await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
    } catch { /* ignore — user can redeem later in configurações */ }
    window.location.href = "/boas-vindas?checkout=voucher";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suBefore = signUp as any;
      console.log("[cadastro] BEFORE create — typeof prepareEmailAddressVerification:", typeof suBefore?.prepareEmailAddressVerification, "| proto methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(suBefore ?? {})).join(","));

      // Use the return value of create() — Clerk returns an updated SignUpResource
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await signUp.create({ emailAddress: email, password, firstName, lastName }) as any;

      // Also read the live object from window.Clerk as a fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveSignUp = (window as any).Clerk?.client?.signUp ?? created ?? signUp;
      console.log("[cadastro] AFTER create — created.status:", created?.status, "| liveSignUp.status:", liveSignUp?.status, "| created.prepareEmailAddressVerification:", typeof created?.prepareEmailAddressVerification, "| live.prepareEmailAddressVerification:", typeof liveSignUp?.prepareEmailAddressVerification);

      // If Clerk completes signup immediately (no email verification required)
      if (created?.status === "complete" && created?.createdSessionId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sa = setActive ?? (window as any).Clerk?.setActive;
        await sa({ session: created.createdSessionId });
        goToCheckout();
        return;
      }

      // Use the most capable object: prefer liveSignUp (window.Clerk), fall back to created
      const su = liveSignUp;
      if (typeof su?.prepareEmailAddressVerification === "function") {
        await su.prepareEmailAddressVerification({ strategy: "email_code" });
      } else if (typeof su?.prepareVerification === "function") {
        await su.prepareVerification({ strategy: "email_code" });
      } else {
        throw new Error(`prepareEmailAddressVerification unavailable. created keys: ${Object.keys(created ?? {}).join(",")}, live keys: ${Object.keys(liveSignUp ?? {}).join(",")}`);
      }
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
      let result = await clerkSu.attemptEmailAddressVerification({ code });
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

      const proceed = isVoucherFlow && voucherState === "valid" ? redeemAndProceed : goToCheckout;
      if (result.status === "complete") {
        await sa({ session: result.createdSessionId });
        await proceed();
      } else if (result.createdSessionId) {
        await sa({ session: result.createdSessionId });
        await proceed();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionId = (window as any).Clerk?.client?.activeSessions?.[0]?.id;
        if (sessionId) {
          await sa({ session: sessionId });
          await proceed();
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
      await clerkSu.prepareEmailAddressVerification({ strategy: "email_code" });
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
              <p className="lead">Garanta espaço para sua marca nos maiores portais de notícias do país.</p>

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

                {isVoucherFlow && (
                  <div className="fld" style={{ marginBottom: 24 }}>
                    <label>Código do voucher</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="in"
                        placeholder="Ex: RAIO-WELCOME"
                        value={voucherCode}
                        onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherState("idle"); setVoucherError(""); }}
                        style={{ flex: 1, fontFamily: "monospace", letterSpacing: "0.05em" }}
                      />
                      <button
                        type="button"
                        onClick={checkVoucher}
                        disabled={!voucherCode.trim() || voucherState === "checking"}
                        style={{ flexShrink: 0, padding: "0 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: voucherState === "valid" ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.07)", color: voucherState === "valid" ? "#34C759" : "var(--tx)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                      >
                        {voucherState === "checking" ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : voucherState === "valid" ? <><Check size={15} /> Válido</> : "Validar"}
                      </button>
                    </div>
                    {voucherState === "valid" && (
                      <p style={{ color: "#34C759", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <Check size={12} /> {voucherCredits} créditos serão adicionados à sua conta após o cadastro.
                      </p>
                    )}
                    {voucherState === "invalid" && (
                      <p style={{ color: "var(--red)", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <X size={12} /> {voucherError}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16 }}>
                  <span style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, borderRadius: 3, background: "var(--coral)", display: "grid", placeItems: "center" }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                    Autorizo o Raio Publicador a enviar novidades, dicas e atualizações por e-mail. Esta autorização é necessária para uso da plataforma.
                  </span>
                </div>

                <div style={{ marginTop: 12 }} />
                <div id="clerk-captcha" />
                {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading || (isVoucherFlow && voucherState !== "valid")}>
                  {loading ? "Criando conta…" : <><span>Criar conta</span><ArrowRight size={17} /></>}
                </button>
                <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--tx-3)", marginTop: 12 }}>
                  🔒 <b>Seus dados estão protegidos.</b> Cadastro rápido e 100% seguro.
                </p>
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
