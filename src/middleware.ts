import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/site(.*)",
  "/login(.*)",
  "/cadastro(.*)",
  "/verificar(.*)",
  "/convite(.*)",
  "/api/stripe/webhook",
  "/api/vouchers/validate",
]);

const BETA_PASSWORD = process.env.BETA_PASSWORD;
const BETA_COOKIE = "raio_beta";

function isBetaUnlocked(req: NextRequest) {
  return req.cookies.get(BETA_COOKIE)?.value === BETA_PASSWORD;
}

function betaGatePage(req: NextRequest, error = false) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Raio — Acesso Restrito</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f4f0;font-family:'Helvetica Neue',Arial,sans-serif}
    .box{background:#fff;border-radius:16px;padding:48px 40px;width:100%;max-width:380px;box-shadow:0 4px 32px rgba(0,0,0,0.08)}
    h1{font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:6px}
    p{font-size:14px;color:#888;margin-bottom:28px;line-height:1.5}
    input{width:100%;padding:12px 14px;border:1px solid #e0e0e0;border-radius:8px;font-size:15px;outline:none;margin-bottom:12px;transition:border .15s}
    input:focus{border-color:#1a1a1a}
    button{width:100%;padding:13px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
    button:hover{background:#333}
    .err{font-size:13px;color:#c0392b;margin-bottom:12px}
    .logo{font-size:22px;font-weight:700;margin-bottom:28px;letter-spacing:-0.5px}
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">⚡ Raio</div>
    <h1>Acesso restrito</h1>
    <p>A plataforma está em fase de testes. Insira a senha para continuar.</p>
    <form method="POST" action="/__beta_auth">
      <input type="hidden" name="redirect" value="${req.nextUrl.pathname}">
      <input type="password" name="password" placeholder="Senha de acesso" autofocus>
      ${error ? '<p class="err">Senha incorreta. Tente novamente.</p>' : ""}
      <button type="submit">Entrar</button>
    </form>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: error ? 401 : 200, headers: { "Content-Type": "text/html" } });
}

export default clerkMiddleware(async (auth, req) => {
  // Beta password gate — only active when BETA_PASSWORD env var is set
  if (BETA_PASSWORD) {
    const { pathname } = req.nextUrl;

    // Handle login form submission
    if (req.method === "POST" && pathname === "/__beta_auth") {
      const body = await req.text();
      const params = new URLSearchParams(body);
      const password = params.get("password");
      const redirect = params.get("redirect") || "/";

      if (password === BETA_PASSWORD) {
        const res = NextResponse.redirect(new URL(redirect, req.url));
        res.cookies.set(BETA_COOKIE, BETA_PASSWORD, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 dias
          path: "/",
        });
        return res;
      }
      return betaGatePage(req, true);
    }

    // Only the Stripe webhook bypasses the gate — everything else requires the password
    if (!pathname.startsWith("/api/stripe/webhook") && !isBetaUnlocked(req)) {
      return betaGatePage(req);
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg)).*)",
    "/(api|trpc)(.*)",
  ],
};
