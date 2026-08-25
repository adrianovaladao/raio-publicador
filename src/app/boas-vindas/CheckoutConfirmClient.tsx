"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, X, Coins, Building2, Users, Newspaper, Zap, FileText } from "lucide-react";
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
  const [pendingPayment, setPendingPayment] = useState<"card" | null>(null);
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

  function startPayment() {
    setPendingPayment("card");
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
    await proceedToStripe();
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
          <div className={step === "plans" ? "onb-plans-wide" : "onb-card narrow"} style={{ textAlign: "center", zoom: 1.15 }}>

            <style>{`
              .flip-wrap { perspective: 1200px; }
              .flipper {
                position: relative;
                transition: transform 0.6s cubic-bezier(0.45, 0, 0.55, 1);
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
                overflow-y: auto;
              }
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

              /* Planos wide */
              .onb-plans-wide {
                width: 100%;
                max-width: 960px;
                margin: 0 auto;
                padding: 0 16px;
              }
              .onb-plans-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                align-items: start;
              }
              @media (max-width: 720px) {
                .onb-plans-grid { grid-template-columns: 1fr; }
              }
              .onb-plan-card {
                position: relative;
                background: rgba(255,255,255,0.04);
                border: 1.5px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 24px 22px 22px;
                text-align: left;
                cursor: pointer;
                transition: border-color .2s, background .2s, transform .2s;
              }
              .onb-plan-card:hover { border-color: rgba(250,181,0,0.5); transform: translateY(-3px); }
              .onb-plan-card.featured {
                border-color: var(--coral);
                background: rgba(250,181,0,0.06);
              }
              .onb-plan-ribbon {
                position: absolute;
                top: -1px; right: 20px;
                background: var(--coral);
                color: #1a1a1a;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                padding: 4px 10px;
                border-radius: 0 0 8px 8px;
              }
              .onb-plan-name { font-size: 22px; font-weight: 800; color: var(--tx); letter-spacing: -0.02em; margin-bottom: 4px; }
              .onb-plan-price { display: flex; align-items: baseline; gap: 3px; margin-bottom: 16px; }
              .onb-plan-price .cur { font-size: 14px; font-weight: 600; color: var(--tx-2); }
              .onb-plan-price .amt { font-size: 34px; font-weight: 800; color: var(--tx); letter-spacing: -0.03em; line-height: 1; }
              .onb-plan-price .per { font-size: 13px; color: var(--tx-3); margin-left: 2px; }
              .onb-plan-credits { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(250,181,0,0.08); border-radius: 10px; margin-bottom: 16px; }
              .onb-plan-feats { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
              .onb-plan-feat { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--tx-2); }
              .onb-plan-feat svg { flex-shrink: 0; }
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

                      {/* Detalhamento por método */}
                      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                        {/* Cartão */}
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 14px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--tx-3)", marginBottom: 10 }}>💳 Cartão ou boleto</div>
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

                <button className="btn btn-primary btn-lg" onClick={() => startPayment()} disabled={loading}
                  style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
                  {loading ? "Redirecionando…" : <><span>Pagar com cartão ou boleto</span><ArrowRight size={17} /></>}
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
              <div>
                <div style={{ marginBottom: 28, textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--coral)" }}>Planos e preços</span>
                  <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: 8, color: "var(--tx)" }}>
                    Escolha o plano ideal
                  </h2>
                </div>

                <div className="onb-plans-grid">
                  {allPlans.map((p, idx) => {
                    const isFeatured = idx === 1; // Avançado
                    const feats: [string, boolean][] = [
                      [`Até ${p.brandsLimit} marca${p.brandsLimit > 1 ? "s" : ""} cadastradas`, true],
                      [`Até ${p.tierAIncluded} publicações em portais categoria A`, true],
                      ["Acesso completo aos 50 portais parceiros", true],
                      ["Calendário e agendamento de publicações", true],
                      [`${p.editorsLimit} editor${p.editorsLimit > 1 ? "es" : ""} · ${p.reviewersLimit} revisor${p.reviewersLimit > 1 ? "es" : ""}`, true],
                    ];
                    return (
                      <div
                        key={p.id}
                        className={`onb-plan-card${isFeatured ? " featured" : ""}`}
                        onClick={() => selectPlan(p.id)}
                      >
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
                          {feats.map(([text, on], i) => (
                            <div key={i} className="onb-plan-feat">
                              {on
                                ? <Check size={14} style={{ color: "#2F8A5B" }} />
                                : <X size={14} style={{ color: "var(--tx-3)" }} />}
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
