import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/auth-admin";
import crypto from "node:crypto";

export async function GET() {
  if (!await assertMaster()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const keyB64  = process.env.C6_MTLS_KEY  ?? "";
  const certB64 = process.env.C6_MTLS_CERT ?? "";

  const keyPem  = Buffer.from(keyB64,  "base64").toString("utf-8");
  const certPem = Buffer.from(certB64, "base64").toString("utf-8");

  let keyModulus  = "";
  let certModulus = "";
  let keyError    = "";
  let certError   = "";
  let match       = false;

  try {
    const pk = crypto.createPrivateKey(keyPem);
    const pub = crypto.createPublicKey(pk);
    keyModulus = pub.export({ format: "jwk" }).n as string;
  } catch (e) {
    keyError = String(e);
  }

  try {
    const cert = new crypto.X509Certificate(certPem);
    const pub = cert.publicKey;
    certModulus = pub.export({ format: "jwk" }).n as string;
  } catch (e) {
    certError = String(e);
  }

  if (keyModulus && certModulus) {
    match = keyModulus === certModulus;
  }

  return NextResponse.json({
    keyB64Length:  keyB64.length,
    certB64Length: certB64.length,
    keyPemStart:   keyPem.slice(0, 40),
    certPemStart:  certPem.slice(0, 40),
    keyError,
    certError,
    match,
  });
}
