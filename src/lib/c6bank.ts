/**
 * C6 Bank BaaS API client — mTLS + OAuth2
 * Usa node:https diretamente para suporte a certificados mTLS no Vercel/Node 18+
 */
import https from "node:https";
import { URL } from "node:url";

const IS_SANDBOX = (process.env.C6_ENV ?? "sandbox") === "sandbox";
const BASE_AUTH    = IS_SANDBOX ? "https://baas-api-sandbox.c6bank.info/v1/auth" : "https://baas-api.c6bank.info/v1/auth";
const BASE_PIX     = IS_SANDBOX ? "https://baas-api-sandbox.c6bank.info/v2/pix"  : "https://baas-api.c6bank.info/v2/pix";
// BASE_WEBHOOK reservado para outros serviços (BANK_SLIP, CHECKOUT)
// const BASE_WEBHOOK = IS_SANDBOX ? "https://baas-api-sandbox.c6bank.info/v1/webhooks" : "https://baas-api.c6bank.info/v1/webhooks";

// ── mTLS helpers ────────────────────────────────────────────────────────────
function getMtlsCreds() {
  const keyB64  = process.env.C6_MTLS_KEY;
  const certB64 = process.env.C6_MTLS_CERT;
  if (!keyB64 || !certB64) throw new Error("C6_MTLS_KEY / C6_MTLS_CERT não configurados");
  return {
    key:  Buffer.from(keyB64,  "base64").toString("utf-8"),
    cert: Buffer.from(certB64, "base64").toString("utf-8"),
  };
}

function httpsRequest(
  urlStr: string,
  options: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const { key, cert } = getMtlsCreds();
    const url = new URL(urlStr);
    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      port:     url.port || 443,
      path:     url.pathname + url.search,
      method:   options.method ?? "GET",
      headers:  options.headers ?? {},
      key,
      cert,
      rejectUnauthorized: true,
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text: data }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── token cache ─────────────────────────────────────────────────────────────
let _token: string | null = null;
let _tokenExpires = 0;

export async function getAccessToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpires) return _token;

  const clientId     = process.env.C6_CLIENT_ID;
  const clientSecret = process.env.C6_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("C6_CLIENT_ID / C6_CLIENT_SECRET não configurados");

  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString();

  const res = await httpsRequest(`${BASE_AUTH}/`, {
    method: "POST",
    headers: {
      "Content-Type":   "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body).toString(),
    },
    body,
  });

  if (res.status !== 200) throw new Error(`C6 auth error ${res.status}: ${res.text}`);

  const data = JSON.parse(res.text) as { access_token: string; expires_in: number };
  _token = data.access_token;
  _tokenExpires = Date.now() + (data.expires_in - 30) * 1000;
  return _token;
}

// ── c6Fetch — requisições autenticadas ─────────────────────────────────────
async function c6Fetch(
  urlStr: string,
  options: { method?: string; body?: string } = {}
): Promise<{ status: number; text: string }> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
  };
  if (options.body) headers["Content-Length"] = Buffer.byteLength(options.body).toString();

  return httpsRequest(urlStr, { ...options, headers });
}

// ── Pix Cobrança Imediata ───────────────────────────────────────────────────
export interface CriarCobrancaInput {
  amountCents: number;
  txId?: string;
  expiracaoSegundos?: number;
  solicitacaoPagador?: string;
}

export interface CobResponse {
  txid: string;
  status: string;
  location: string;
  pixCopiaECola: string;
  valor: { original: string };
  calendario: { criacao: string; expiracao: number };
}

export async function criarCobranca(input: CriarCobrancaInput): Promise<CobResponse> {
  const pixKey = process.env.C6_PIX_KEY;
  if (!pixKey) throw new Error("C6_PIX_KEY não configurado");

  const original = (input.amountCents / 100).toFixed(2);
  const txid = input.txId ?? generateTxId();

  const bodyObj = {
    calendario: { expiracao: input.expiracaoSegundos ?? 3600 },
    valor: { original },
    chave: pixKey,
    solicitacaoPagador: input.solicitacaoPagador ?? "Assinatura Raio Publicador",
  };
  const body = JSON.stringify(bodyObj);

  const res = await c6Fetch(`${BASE_PIX}/cob/${txid}`, { method: "PUT", body });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`C6 criar cobrança error ${res.status}: ${res.text}`);
  }
  return JSON.parse(res.text) as CobResponse;
}

// ── Registrar webhook Pix ────────────────────────────────────────────────────
// O webhook Pix é registrado na API Pix via PUT /v2/pix/webhook/{chave}
export async function registrarWebhook(webhookUrl: string): Promise<void> {
  const pixKey = process.env.C6_PIX_KEY;
  if (!pixKey) throw new Error("C6_PIX_KEY não configurado");

  const body = JSON.stringify({ webhookUrl });
  const res = await c6Fetch(`${BASE_PIX}/webhook/${encodeURIComponent(pixKey)}`, { method: "PUT", body });
  if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
    throw new Error(`C6 registrar webhook error ${res.status}: ${res.text}`);
  }
}

// ── utils ────────────────────────────────────────────────────────────────────
function generateTxId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 35 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
