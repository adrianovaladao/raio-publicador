"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Coins, Building2, Users, Newspaper, Zap, FileText } from "lucide-react";
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

type Step = "confirm" | "fiscal" | "plans";
type PersonType = "PF" | "PJ";

interface FiscalData {
  personType: PersonType;
  fullName: string;
  cpf: string;
  companyName: string;
  cnpj: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

const EMPTY_FISCAL: FiscalData = {
  personType: "PJ",
  fullName: "", cpf: "",
  companyName: "", cnpj: "",
  cep: "", street: "", number: "", complement: "",
  district: "", city: "", state: "",
};

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

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    border: "1.5px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)", color: "var(--tx)",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    ...style,
  };
}

function label(text: string, required = true) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-3)", marginBottom: 5, textAlign: "left", letterSpacing: "0.03em" }}>
      {text}{required && <span style={{ color: "var(--coral)" }}> *</span>}
    </div>
  );
}

function formatCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function formatCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function CheckoutConfirmClient({ initialPlanId, allPlans }: Props) {
  const [selectedId, setSelectedId] = useState(initialPlanId);
  const [step, setStep] = useState<Step>("confirm");
  const [pendingPayment, setPendingPayment] = useState<"card" | "pix" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Fiscal form state
  const [fiscal, setFiscal] = useState<FiscalData>(EMPTY_FISCAL);
  const [cepLoading, setCepLoading] = useState(false);
  const [fiscalError, setFiscalError] = useState("");
  const [fiscalSaving, setFiscalSaving] = useState(false);

  // Load existing fiscal profile
  useEffect(() => {
    fetch("/api/fiscal-profile")
      .then(r => r.json())
      .then((data: FiscalData | null) => { if (data) setFiscal({ ...EMPTY_FISCAL, ...data }); })
      .catch(() => {});
  }, []);

  // Intercept browser back button
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowBackWarning(true);
      setTimeout(() => setShowBackWarning(false), 5000);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const plan = allPlans.find(p => p.id === selectedId) ?? allPlans[0];

  function setF(key: keyof FiscalData, value: string) {
    setFiscal(f => ({ ...f, [key]: value }));
  }

  async function lookupCEP(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json() as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };
      if (!data.erro) {
        setFiscal(f => ({
          ...f,
          street:   data.logradouro ?? f.street,
          district: data.bairro     ?? f.district,
          city:     data.localidade ?? f.city,
          state:    data.uf         ?? f.state,
        }));
      }
    } catch { /* silently fail */ }
    finally { setCepLoading(false); }
  }

  function startPayment(type: "card" | "pix") {
    setPendingPayment(type);
    setStep("fiscal");
    setFiscalError("");
  }

  async function handleFiscalSubmit() {
    setFiscalError("");
    // Validation
    if (fiscal.personType === "PF") {
      if (!fiscal.fullName.trim()) return setFiscalError("Informe o nome completo.");
      if (fiscal.cpf.replace(/\D/g, "").length !== 11) return setFiscalError("CPF inválido.");
    } else {
      if (!fiscal.companyName.trim()) return setFiscalError("Informe a razão social.");
      if (fiscal.cnpj.replace(/\D/g, "").length !== 14) return setFiscalError("CNPJ inválido.");
    }
    if (fiscal.cep.replace(/\D/g, "").length !== 8) return setFiscalError("CEP inválido.");
    if (!fiscal.street.trim()) return setFiscalError("Informe o logradouro.");
    if (!fiscal.number.trim()) return setFiscalError("Informe o número.");
    if (!fiscal.district.trim()) return setFiscalError("Informe o bairro.");
    if (!fiscal.city.trim()) return setFiscalError("Informe a cidade.");
    if (!fiscal.state.trim()) return setFiscalError("Informe o estado.");

    setFiscalSaving(true);
    try {
      const res = await fetch("/api/fiscal-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fiscal),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        return setFiscalError(d.error ?? "Erro ao salvar dados fiscais.");
      }
    } catch {
      return setFiscalError("Falha de conexão. Tente novamente.");
    } finally {
      setFiscalSaving(false);
    }

    // Proceed to payment
    if (pendingPayment === "pix") {
      window.location.href = `/pix/${plan.id.toLowerCase()}`;
    } else {
      await proceedToStripe();
    }
  }

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
      if (!res.ok || !data.url) { setError(data.error ?? "Erro ao iniciar pagamento."); setStep("confirm"); return; }
      window.location.href = data.url;
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  }

  function selectPlan(id: string) {
    setSelectedId(id);
    setTimeout(() => setStep("confirm"), 120);
  }

  const inputStyle = inp();

  return (
    <div data-theme="dark" style={{ height: "100dvh", overflow: "hidden", background: "var(--ink)" }}>
      <div className="onb" style={{ height: "100%" }}>
        <span className="bg-glow" />
        <header className="onb-top">
          <Link className="lock" href="/" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={27} variant="dark" />
          </Link>
        </header>
        {showBackWarning && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999,
            background: "rgba(250,181,0,0.95)", color: "#212121", borderRadius: 12,
            padding: "12px 20px", fontSize: 13.5, fontWeight: 600, maxWidth: 420, width: "calc(100% - 40px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>Não use o botão Voltar do navegador — utilize os botões desta página para navegar sem perder seu cadastro.</span>
          </div>
        )}
        <main className="onb-body">
          <div className="onb-card narrow" style={{ textAlign: "center", zoom: 1.15 }}>

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
              .fiscal-input {
                width: 100%; padding: 10px 13px; border-radius: 9px;
                border: 1.5px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.06); color: var(--tx);
                font-size: 14px; outline: none; box-sizing: border-box;
                font-family: inherit;
              }
              .fiscal-input:focus { border-color: rgba(250,181,0,0.5); }
              .fiscal-input::placeholder { color: rgba(255,255,255,0.3); }
              .person-tab {
                flex: 1; padding: 9px 0; border-radius: 8px; border: none;
                font-size: 13.5px; font-weight: 600; cursor: pointer;
                transition: background .15s, color .15s;
              }
              .person-tab.active { background: var(--coral); color: #1a1a1a; }
              .person-tab.inactive { background: rgba(255,255,255,0.06); color: var(--tx-3); }
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

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 22px 18px", textAlign: "left", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
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

                <button className="btn btn-primary btn-lg" onClick={() => startPayment("card")} disabled={loading}
                  style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
                  {loading ? "Redirecionando…" : <><span>Pagar com cartão ou boleto</span><ArrowRight size={17} /></>}
                </button>

                <button onClick={() => startPayment("pix")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "10px 0", background: "rgba(250,181,0,0.12)", border: "1.5px solid rgba(250,181,0,0.35)", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#FAB500", marginBottom: 10, cursor: "pointer", fontFamily: "inherit" }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/></svg>
                  Pagar com Pix
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

            {/* ── STEP: FISCAL ── */}
            {step === "fiscal" && (
              <div>
                <div className="onb-head">
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(250,181,0,0.12)", marginBottom: 12 }}>
                    <FileText size={22} style={{ color: "var(--coral)" }} />
                  </div>
                  <h1>Dados para <em>nota fiscal</em></h1>
                  <p className="sub">Necessários para emissão da NFS-e após a confirmação do pagamento.</p>
                </div>

                {/* Tipo de pessoa */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
                  <button className={`person-tab ${fiscal.personType === "PJ" ? "active" : "inactive"}`} onClick={() => setF("personType", "PJ")}>
                    Pessoa Jurídica (PJ)
                  </button>
                  <button className={`person-tab ${fiscal.personType === "PF" ? "active" : "inactive"}`} onClick={() => setF("personType", "PF")}>
                    Pessoa Física (PF)
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                  {fiscal.personType === "PJ" ? (
                    <>
                      <div>
                        {label("Razão Social")}
                        <input className="fiscal-input" placeholder="Nome da empresa conforme CNPJ" value={fiscal.companyName} onChange={e => setF("companyName", e.target.value)} />
                      </div>
                      <div>
                        {label("CNPJ")}
                        <input className="fiscal-input" placeholder="00.000.000/0000-00" value={fiscal.cnpj} onChange={e => setF("cnpj", formatCNPJ(e.target.value))} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        {label("Nome Completo")}
                        <input className="fiscal-input" placeholder="Seu nome completo" value={fiscal.fullName} onChange={e => setF("fullName", e.target.value)} />
                      </div>
                      <div>
                        {label("CPF")}
                        <input className="fiscal-input" placeholder="000.000.000-00" value={fiscal.cpf} onChange={e => setF("cpf", formatCPF(e.target.value))} />
                      </div>
                    </>
                  )}

                  {/* Endereço */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 12 }}>Endereço</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 12 }}>
                      <div>
                        {label("CEP")}
                        <input className="fiscal-input" placeholder="00000-000" value={fiscal.cep}
                          onChange={e => { const v = formatCEP(e.target.value); setF("cep", v); if (v.replace(/\D/g, "").length === 8) lookupCEP(v); }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        {cepLoading && <div style={{ fontSize: 12, color: "var(--tx-3)", paddingBottom: 11 }}>buscando…</div>}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 12 }}>
                      <div>
                        {label("Logradouro")}
                        <input className="fiscal-input" placeholder="Rua, Av., etc." value={fiscal.street} onChange={e => setF("street", e.target.value)} />
                      </div>
                      <div>
                        {label("Número")}
                        <input className="fiscal-input" placeholder="123" value={fiscal.number} onChange={e => setF("number", e.target.value)} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      {label("Complemento", false)}
                      <input className="fiscal-input" placeholder="Apto, sala, bloco (opcional)" value={fiscal.complement} onChange={e => setF("complement", e.target.value)} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div>
                        {label("Bairro")}
                        <input className="fiscal-input" placeholder="Bairro" value={fiscal.district} onChange={e => setF("district", e.target.value)} />
                      </div>
                      <div>
                        {label("Cidade")}
                        <input className="fiscal-input" placeholder="Cidade" value={fiscal.city} onChange={e => setF("city", e.target.value)} />
                      </div>
                    </div>

                    <div style={{ maxWidth: 100 }}>
                      {label("Estado")}
                      <input className="fiscal-input" placeholder="SP" maxLength={2} value={fiscal.state} onChange={e => setF("state", e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>

                {fiscalError && <p style={{ color: "#e05c5c", fontSize: 13, marginTop: 12, textAlign: "left" }}>{fiscalError}</p>}

                <button className="btn btn-primary btn-lg" onClick={handleFiscalSubmit} disabled={fiscalSaving}
                  style={{ width: "100%", justifyContent: "center", marginTop: 18, marginBottom: 8 }}>
                  {fiscalSaving ? "Salvando…" : <><span>Continuar para pagamento</span><ArrowRight size={17} /></>}
                </button>

                <button onClick={() => setStep("confirm")}
                  style={{ background: "none", border: "none", fontSize: 13.5, color: "var(--tx-3)", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 5, margin: "0 auto" }}>
                  <ArrowLeft size={13} /> Voltar
                </button>
              </div>
            )}

            {/* ── STEP: PLANS ── */}
            {step === "plans" && (
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
                          `Até ${p.brandsLimit} marca${p.brandsLimit > 1 ? "s" : ""}`,
                          `Até ${p.tierAIncluded} portais categoria A`,
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

                <button onClick={() => setStep("confirm")}
                  style={{ background: "none", border: "none", fontSize: 17.5, color: "var(--tx-3)", cursor: "pointer", marginTop: 20, padding: "4px 8px" }}>
                  ← Voltar
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
