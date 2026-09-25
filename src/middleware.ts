import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/site(.*)",
  "/sobre(.*)",
  "/termos(.*)",
  "/privacidade(.*)",
  "/cookies(.*)",
  "/login(.*)",
  "/cadastro(.*)",
  "/verificar(.*)",
  "/convite(.*)",
  "/api/invites/accept",
  "/api/stripe/webhook",
  "/api/vouchers/validate",
  "/api/feed/(.*)",
  "/api/contact",
  "/api/clerk/webhook",
  "/api/webhooks/clerk",
  "/api/webhooks/c6bank",
  "/api/cron/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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
