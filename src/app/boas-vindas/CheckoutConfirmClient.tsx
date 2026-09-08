"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Coins, Building2, Users, Newspaper, Zap } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import "./onboarding.css";

interface PlanData {
  id: string;
  label: string;
  priceBRL: string;
  priceCents: number;
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

type Step = "confirm" | "plans";

function PlanFeatures({ plan }: { plan: PlanData }) {
  const features = [
    { icon: Coins,     text: `${plan.credits.toLocaleString("pt-BR")} créditos mensais` },
    { icon: Building2, text: `Até ${plan.brandsLimit === 1 ? "uma" : plan.brandsLimit === 2 ? "duas" : plan.brandsLimit} marca${plan.brandsLimit > 1 ? "s" : ""}` },
    { icon: Newspaper, text: `Até ${plan.tierAIncluded} publicações em portais categoria A` },
    { icon: Users,     text: `${plan.editorsLimit} editor${plan.editorsLimit > 1 ? "es" : ""} · ${plan.reviewersLimit} revisor${plan.reviewersLimit > 1 ? "es" : ""}` },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
  const [step, setStep] = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);

  // Intercept browser back — exibe modal de confirmação
  useState(() => {
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });

  const plan = allPlans.find(p => p.id === selectedId) ?? allPlans[0];

  async function proceedToStripe() {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function selectPlan(id: string) {
    setSelectedId(id);
    setTimeout(() => setStep("confirm"), 120);
  }

  return (
    <div data-theme="dark" style={{ minHeight: "100dvh", overflowY: "auto", background: "var(--ink)" }}>
      <div className="onb" style={{ minHeight: "100%" }}>
        <span className="bg-glow" />
        <header className="onb-top">
          {/* Logo sem link — única ação é seguir para pagamento */}
          <span className="lock" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={27} variant="dark" />
          </span>
        </header>

        {/* Modal de saída */}
        {showExitModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}>
            <div style={{
              background: "#1e1e1e", borderRadius: 16, padding: "32px 28px",
              maxWidth: 400, width: "100%", textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                Tem certeza que quer sair?
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 28 }}>
                Se você sair agora, perderá a seleção de plano e precisará começar de novo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => setShowExitModal(false)}
                  style={{ padding: "13px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "var(--coral)", color: "#1a1a1a", fontWeight: 700, fontSize: 15 }}
                >
                  Continuar
                </button>
                <button
                  onClick={() => { window.location.href = "/"; }}
                  style={{ padding: "13px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 500, fontSize: 14 }}
                >
                  Sair mesmo assim
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="onb-body">
          <div className={step === "plans" ? "onb-plans-wide" : "onb-card narrow"} style={{ textAlign: "center", zoom: 1.15 }}>

            <style>{`
              .onb-plans-wide { width: 100%; max-width: 960px; margin: 0 auto; padding: 0 16px; }
              .onb-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
              @media (max-width: 720px) { .onb-plans-grid { grid-template-columns: 1fr; } }
              .onb-plan-card {
                position: relative; background: rgba(255,255,255,0.04);
                border: 1.5px solid rgba(255,255,255,0.1); border-radius: 20px;
                padding: 24px 22px 22px; text-align: left; cursor: pointer;
                transition: border-color .2s, background .2s, transform .2s;
              }
              .onb-plan-card:hover { border-color: rgba(250,181,0,0.5); transform: translateY(-3px); }
              .onb-plan-card.featured { border-color: var(--coral); background: rgba(250,181,0,0.06); }
              .onb-plan-ribbon {
                position: absolute; top: -1px; right: 20px;
                background: var(--coral); color: #1a1a1a;
                font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
                padding: 4px 10px; border-radius: 0 0 8px 8px;
              }
              .onb-plan-name { font-size: 22px; font-weight: 800; color: var(--tx); letter-spacing: -0.02em; margin-bottom: 4px; }
              .onb-plan-price { display: flex; align-items: baseline; gap: 3px; margin-bottom: 16px; }
              .onb-plan-price .cur { font-size: 14px; font-weight: 600; color: var(--tx-2); }
              .onb-plan-price .amt { font-size: 34px; font-weight: 800; color: var(--tx); letter-spacing: -0.03em; line-height: 1; }
              .onb-plan-price .per { font-size: 13px; color: var(--tx-3); margin-left: 2px; }
              .onb-plan-credits { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(250,181,0,0.08); border-radius: 10px; margin-bottom: 16px; }
              .onb-plan-feats { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
              .onb-plan-feat { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--tx-2); }
              .onb-plan-cta {
                width: 100%; padding: 11px; border-radius: 10px; border: none;
                font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
                transition: background .15s;
              }
              .onb-plan-cta.primary { background: var(--coral); color: #1a1a1a; }
              .onb-plan-cta.primary:hover { background: #ffc93b; }
              .onb-plan-cta.dark { background: rgba(255,255,255,0.1); color: var(--tx); }
              .onb-plan-cta.dark:hover { background: rgba(255,255,255,0.16); }
            `}</style>

            {/* ── STEP: CONFIRM ── */}
            {step === "confirm" && (
              <div>
                <div className="onb-head">
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(250,181,0,0.12)", marginBottom: 12 }}>
                    <Zap size={22} style={{ color: "var(--coral)" }} />
                  </div>
                  <h1>Confirme sua <em>assinatura</em></h1>
                  <p className="sub">Revise os detalhes do plano antes de prosseguir para o pagamento.</p>
                </div>

                {(() => {
                  const feeCents = Math.round(plan.priceCents * 0.035);
                  const totalCents = plan.priceCents + feeCents;
                  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                  return (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 22px 18px", textAlign: "left", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 14 }}>Plano selecionado</div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--tx)", marginBottom: 16 }}>{plan.label}</div>
                      <PlanFeatures plan={plan} />
                      <div style={{ marginTop: 18 }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 14px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 10 }}>💳 Cartão de crédito</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tx-2)", marginBottom: 5 }}>
                            <span>Plano {plan.label}</span><span>{fmt(plan.priceCents)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tx-3)", marginBottom: 10 }}>
                            <span>Taxa de processamento (3,5%)</span><span>{fmt(feeCents)}</span>
                          </div>
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "var(--coral)" }}>
                            <span>Total/mês</span><span>{fmt(totalCents)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {error && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

                <button className="btn btn-primary btn-lg" onClick={() => proceedToStripe()} disabled={loading}
                  style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
                  {loading ? "Redirecionando…" : <><span>Pagar com cartão</span><ArrowRight size={17} /></>}
                </button>

                <button onClick={() => window.location.href = "/site#planos"}
                  style={{ display: "block", width: "100%", padding: "11px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--tx-2)", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
                  Cancelar
                </button>

                <button onClick={() => setStep("plans")}
                  style={{ background: "none", border: "none", fontSize: 13.5, color: "var(--tx-3)", cursor: "pointer", padding: "4px 8px", marginBottom: 20 }}>
                  Mudar de plano
                </button>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, fontSize: 12, color: "var(--tx-3)", lineHeight: 1.5, textAlign: "left" }}>
                  <b style={{ color: "var(--tx-2)" }}>Garantia de Satisfação (Art. 49, CDC):</b>{" "}
                  Queremos que você ame o Raio. Se você cancelar em até 7 dias sem ter utilizado nenhum crédito, devolvemos 100% do seu dinheiro de forma integral. Após o uso de créditos ou o prazo de 7 dias, o seu acesso continua ativo até o final do período contratado, sem renovação automática caso decida cancelar.
                </div>
              </div>
            )}

            {/* ── STEP: PLANS ── */}
            {step === "plans" && (
              <div>
                <div style={{ marginBottom: 28, textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--coral)" }}>Planos e preços</span>
                  <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: 8, color: "var(--tx)" }}>
                    Escolha o plano ideal
                  </h2>
                </div>
                <div className="onb-plans-grid">
                  {allPlans.map((p, idx) => {
                    const isFeatured = idx === 1;
                    const feats = [
                      `Até ${p.brandsLimit} marca${p.brandsLimit > 1 ? "s" : ""} cadastradas`,
                      `Até ${p.tierAIncluded} publicações em portais categoria A`,
                      "Acesso completo aos 50 portais parceiros",
                      "Calendário e agendamento de publicações",
                      `${p.editorsLimit} editor${p.editorsLimit > 1 ? "es" : ""} · ${p.reviewersLimit} revisor${p.reviewersLimit > 1 ? "es" : ""}`,
                    ];
                    return (
                      <div key={p.id} className={`onb-plan-card${isFeatured ? " featured" : ""}`} onClick={() => selectPlan(p.id)}>
                        {isFeatured && <div className="onb-plan-ribbon">Mais vendido</div>}
                        <div className="onb-plan-name">{p.label}</div>
                        <div className="onb-plan-price">
                          <span className="cur">R$</span>
                          <span className="amt">{(p.priceCents / 100).toLocaleString("pt-BR")}</span>
                          <span className="per">/mês</span>
                        </div>
                        <div className="onb-plan-credits">
                          <Zap size={16} style={{ color: "var(--coral)" }} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--tx)" }}>{p.credits.toLocaleString("pt-BR")} créditos/mês</div>
                            <div style={{ fontSize: 11.5, color: "var(--tx-3)" }}>
                              R$ {(p.priceCents / p.credits).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por crédito
                            </div>
                          </div>
                        </div>
                        <div className="onb-plan-feats">
                          {feats.map((text, i) => (
                            <div key={i} className="onb-plan-feat">
                              <Check size={14} style={{ color: "#2F8A5B", flexShrink: 0 }} />
                              {text}
                            </div>
                          ))}
                        </div>
                        <button className={`onb-plan-cta ${isFeatured ? "primary" : "dark"}`}>
                          Assinar {p.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button onClick={() => setStep("confirm")}
                    style={{ background: "none", border: "none", fontSize: 14, color: "var(--tx-3)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ArrowLeft size={14} /> Voltar
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
