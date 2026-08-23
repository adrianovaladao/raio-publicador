"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/plans";
import { RaioLockup } from "@/components/logo/RaioLockup";
import QRCode from "qrcode";
import { CheckCircle2, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

const PLAN_FEATURES: Record<string, string[]> = {
  BASIC:        ["200 créditos/mês", "Até 2 marcas", "1 editor + 1 revisor", "2 pub. Categoria A/mês"],
  ADVANCED:     ["1.000 créditos/mês", "Até 5 marcas", "3 editores + 5 revisores", "5 pub. Categoria A/mês"],
  PROFESSIONAL: ["2.000 créditos/mês", "Até 10 marcas", "5 editores + 10 revisores", "10 pub. Categoria A/mês"],
};

type Step = "loading" | "qr" | "confirming" | "done" | "error";

export default function PixPage() {
  const { plano } = useParams<{ plano: string }>();
  const planId = plano.toUpperCase() as PlanId;
  const plan = PLANS[planId];
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cria a cobrança dinâmica ao montar
  useEffect(() => {
    if (!plan || !user) return;
    let cancelled = false;

    async function criarCobranca() {
      try {
        const res = await fetch("/api/pix/criar-cobranca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok || cancelled) throw new Error(data.error ?? "Erro ao criar cobrança");

        setPixCopiaECola(data.pixCopiaECola);
        setTxId(data.txId);

        // Gera o QR Code como data URL (sem depender do DOM)
        const dataUrl = await QRCode.toDataURL(data.pixCopiaECola, {
          width: 220, margin: 2,
          color: { dark: "#212121", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
        setStep("qr");

        // Polling de status a cada 8s — max 45 tentativas (~6 min)
        let attempts = 0;
        const poll = setInterval(async () => {
          if (cancelled || attempts++ > 45) { clearInterval(poll); return; }
          try {
            const r = await fetch(`/api/pix/status?txId=${data.txId}`);
            const s = await r.json();
            if (s.status === "CONFIRMED") {
              clearInterval(poll);
              if (!cancelled) setStep("done");
            }
          } catch { /* ignora erros de polling */ }
        }, 8000);

        return () => clearInterval(poll);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Erro ao criar cobrança Pix");
          setStep("error");
        }
      }
    }

    criarCobranca();
    return () => { cancelled = true; };
  }, [plan, user, planId]);

  if (!plan) {
    return (
      <div style={{ minHeight: "100vh", background: "#212121", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Plano não encontrado.</p>
      </div>
    );
  }

  const amount = (plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function handleCopy() {
    await navigator.clipboard.writeText(pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /* ── shared styles ── */
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "24px",
  };

  return (
    <div data-theme="dark" style={{ height: "100dvh", overflow: "hidden", background: "#212121", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", top: "-180px", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(250,181,0,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <header style={{ position: "relative", zIndex: 1, padding: "18px 32px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <RaioLockup height={27} variant="dark" />
        </Link>
      </header>

      <main style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", justifyContent: "center", overflowY: "auto", padding: "12px 16px 16px" }}>
        <div style={{ width: "100%", maxWidth: 440, zoom: 1.2 }}>

          <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={14} /> Voltar
          </button>

          {/* Plan card */}
          <div style={{ ...card, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "rgba(250,181,0,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FAB500", marginBottom: 6 }}>Plano {plan.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {amount}<span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>/mês</span>
            </div>
            <ul style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0 }}>
              {PLAN_FEATURES[planId]?.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                  <span style={{ color: "#FAB500", fontSize: 11 }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ── LOADING ── */}
          {step === "loading" && (
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 24px" }}>
              <Loader2 size={32} color="#FAB500" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Gerando seu QR Code…</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === "error" && (
            <div style={{ ...card, textAlign: "center", padding: "40px 24px" }}>
              <p style={{ fontSize: 15, color: "#f87171", marginBottom: 20 }}>{errorMsg}</p>
              <button onClick={() => { setStep("loading"); setErrorMsg(""); }} style={{ padding: "12px 28px", background: "#FAB500", color: "#212121", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* ── QR CODE ── */}
          {step === "qr" && (
            <>
              <div style={{ ...card, marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Pague com Pix</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.5 }}>
                  Abra o aplicativo do seu banco e selecione a opção de pagamento via Pix com QR Code (Ler QR Code)
                </p>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{ padding: 12, background: "#fff", borderRadius: 16, lineHeight: 0 }}>
                    {qrDataUrl && <Image src={qrDataUrl} alt="QR Code Pix" width={220} height={220} unoptimized />}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Pix Copia e Cola</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "all" }}>
                      {pixCopiaECola}
                    </span>
                    <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", flexShrink: 0, display: "flex" }}>
                      {copied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ background: "rgba(250,181,0,0.08)", border: "1.5px solid rgba(250,181,0,0.2)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "rgba(250,181,0,0.9)", lineHeight: 1.5 }}>
                  <strong>Atenção:</strong> Envie exatamente <strong>{amount}</strong>. Este QR Code expira em <strong>1 hora</strong>.
                </div>
              </div>

              <div style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
                <Loader2 size={16} color="#FAB500" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                  Aguardando confirmação do pagamento… Sua assinatura será ativada automaticamente assim que o banco processar.
                </p>
              </div>
            </>
          )}

          {/* ── CONFIRMING (fallback manual) ── */}
          {step === "confirming" && (
            <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "32px 24px" }}>
              <Loader2 size={20} color="#FAB500" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Confirmando pagamento…</p>
            </div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div style={{ ...card, textAlign: "center", padding: "48px 32px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <CheckCircle2 size={52} color="#4ade80" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>Pagamento confirmado!</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 28px" }}>
                Seu plano <strong style={{ color: "rgba(255,255,255,0.8)" }}>{plan.label}</strong> foi ativado com sucesso. Bem-vindo ao Raio!
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ width: "100%", padding: "14px 0", background: "#FAB500", color: "#212121", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer" }}
              >
                Ir para o dashboard
              </button>
            </div>
          )}

          {txId && step === "qr" && (
            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12, fontFamily: "monospace" }}>
              ref: {txId}
            </p>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
