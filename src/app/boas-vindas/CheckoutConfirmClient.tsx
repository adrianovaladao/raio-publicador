"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Coins, Building2, Users, Newspaper, Zap } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import "./onboarding.css";

interface PlanData {
  id: string;
  label: string;
  priceBRL: string;
  credits: number;
  brandsLimit: number;
  editorsLimit: number;
  reviewersLimit: number;
  tierAIncluded: number;
}

interface Props {
  initialPlanId: string;
  initialPriceBRL: string;
  allPlans: PlanData[];
}

function PlanFeatures({ plan }: { plan: PlanData }) {
  const features = [
    { icon: Coins,     text: `${plan.credits.toLocaleString("pt-BR")} créditos mensais` },
    { icon: Building2, text: `${plan.brandsLimit} marca${plan.brandsLimit > 1 ? "s" : ""}` },
    { icon: Newspaper, text: `${plan.tierAIncluded} publicações/mês em veículos Tier A` },
    { icon: Users,     text: `${plan.editorsLimit} editor${plan.editorsLimit > 1 ? "es" : ""} · ${plan.reviewersLimit} revisor${plan.reviewersLimit > 1 ? "es" : ""}` },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {features.map(({ icon: Icon, text }, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(250,181,0,0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon size={15} style={{ color: "var(--coral)" }} />
          </span>
          <span style={{ fontSize: 14.5, color: "var(--tx-2)", fontWeight: 500 }}>{text}</span>
          <Check size={14} style={{ color: "#2F8A5B", marginLeft: "auto", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function CheckoutConfirmClient({ initialPlanId, allPlans }: Props) {
  const [selectedId, setSelectedId] = useState(initialPlanId);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = allPlans.find(p => p.id === selectedId) ?? allPlans[0];

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) { setError(data.error ?? "Erro ao iniciar pagamento."); return; }
      window.location.href = data.url;
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function selectPlan(id: string) {
    setSelectedId(id);
    // small delay so user sees the selection before flip
    setTimeout(() => setFlipped(false), 120);
  }

  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="onb">
        <span className="bg-glow" />
        <header className="onb-top">
          <Link className="lock" href="/" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={27} variant="dark" />
          </Link>
        </header>
        <main className="onb-body">
          <div className="onb-card narrow" style={{ textAlign: "center" }}>

            {/* ── flip container ── */}
            <style>{`
              .flip-wrap { perspective: 1200px; }
              .flipper {
                position: relative;
                transition: transform 0.55s cubic-bezier(0.45, 0, 0.55, 1);
                transform-style: preserve-3d;
              }
              .flipper.is-flipped { transform: rotateY(180deg); }
              .flip-front, .flip-back {
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
              }
              .flip-back {
                position: absolute;
                inset: 0;
                transform: rotateY(180deg);
                height: 100%;
              }
              .plan-choice {
                background: rgba(255,255,255,0.04);
                border: 1.5px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                padding: 20px;
                cursor: pointer;
                text-align: left;
                transition: border-color .18s, background .18s;
                flex: 1;
              }
              .plan-choice:hover { border-color: rgba(250,181,0,0.4); background: rgba(250,181,0,0.04); }
              .plan-choice.active { border-color: var(--coral); background: rgba(250,181,0,0.07); }
            `}</style>

            <div className="flip-wrap">
              <div className={`flipper${flipped ? " is-flipped" : ""}`} style={{ minHeight: flipped ? 420 : undefined }}>

                {/* ── FRENTE: confirmação ── */}
                <div className="flip-front">
                  <div className="onb-head">
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 14, background: "rgba(250,181,0,0.12)", marginBottom: 18 }}>
                      <Zap size={26} style={{ color: "var(--coral)" }} />
                    </div>
                    <h1>Confirme sua <em>assinatura</em></h1>
                    <p className="sub">Revise os detalhes do plano antes de prosseguir para o pagamento.</p>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px 28px 24px", textAlign: "left", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 6 }}>Plano selecionado</div>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--tx)" }}>{plan.label}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--coral)", letterSpacing: "-0.02em", lineHeight: 1 }}>{plan.priceBRL}</div>
                        <div style={{ fontSize: 13, color: "var(--tx-3)", marginTop: 4 }}>por mês</div>
                      </div>
                    </div>
                    <PlanFeatures plan={plan} />
                  </div>

                  {error && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

                  <button className="btn btn-primary btn-lg" onClick={handleConfirm} disabled={loading}
                    style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}>
                    {loading ? "Redirecionando…" : <><span>Confirmar e pagar</span><ArrowRight size={17} /></>}
                  </button>

                  <button onClick={() => setFlipped(true)}
                    style={{ background: "none", border: "none", fontSize: 13.5, color: "var(--tx-3)", cursor: "pointer", padding: "4px 8px", marginBottom: 20 }}>
                    Mudar de plano
                  </button>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, fontSize: 12, color: "var(--tx-3)", lineHeight: 1.6, textAlign: "left" }}>
                    <b style={{ color: "var(--tx-2)" }}>Política de cancelamento (Art. 49, CDC):</b>{" "}
                    Se cancelar em até 7 dias sem utilizar créditos, você recebe reembolso integral e seus dados são removidos. Após 7 dias ou com créditos utilizados, o acesso permanece até o fim do ciclo sem reembolso.
                  </div>
                </div>

                {/* ── VERSO: escolha de plano ── */}
                <div className="flip-back">
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px 24px 24px", textAlign: "left" }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 20 }}>Escolha seu plano</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {allPlans.map(p => (
                        <div key={p.id} className={`plan-choice${p.id === selectedId ? " active" : ""}`} onClick={() => selectPlan(p.id)}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--tx)", letterSpacing: "-0.01em" }}>{p.label}</div>
                              <div style={{ fontSize: 17, color: "var(--tx-3)", marginTop: 2 }}>{p.priceBRL}/mês</div>
                            </div>
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${p.id === selectedId ? "var(--coral)" : "rgba(255,255,255,0.2)"}`,
                              background: p.id === selectedId ? "var(--coral)" : "transparent",
                              display: "grid", placeItems: "center", transition: "all .15s",
                            }}>
                              {p.id === selectedId && <Check size={12} style={{ color: "var(--ink)" }} />}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                            {[
                              `${p.credits.toLocaleString("pt-BR")} créditos`,
                              `${p.brandsLimit} marca${p.brandsLimit > 1 ? "s" : ""}`,
                              `${p.tierAIncluded} Tier A/mês`,
                              `${p.editorsLimit} editor${p.editorsLimit > 1 ? "es" : ""}`,
                            ].map((t, i) => (
                              <span key={i} style={{ fontSize: 15.5, color: "var(--tx-3)", display: "flex", alignItems: "center", gap: 4 }}>
                                <Check size={11} style={{ color: "#2F8A5B" }} />{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => setFlipped(false)}
                      style={{ background: "none", border: "none", fontSize: 17.5, color: "var(--tx-3)", cursor: "pointer", marginTop: 20, padding: "4px 8px" }}>
                      ← Voltar
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
