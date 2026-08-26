import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Singleton Redis — inicializado com as env vars do Upstash
function makeRedis() {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Limites por contexto (sliding window)
function makeLimiter(requests: number, window: string, prefix: string) {
  return new Ratelimit({
    redis:   makeRedis(),
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
  });
}

export const rateLimiters = {
  checkout: makeLimiter(10,  "60 s", "rl:checkout"), // 10 req/min — checkout e pagamentos
  api:      makeLimiter(60,  "60 s", "rl:api"),      // 60 req/min — APIs gerais
  feed:     makeLimiter(30,  "60 s", "rl:feed"),     // 30 req/min — feed RSS parceiros
};

/** Extrai o IP real da requisição (Vercel injeta x-forwarded-for) */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/** Aplica rate limit e retorna resposta 429 se excedido, null se ok */
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<NextResponse | null> {
  // Se Upstash não estiver configurado, não bloqueia (fallback seguro)
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;

  const { success, limit, reset } = await limiter.limit(identifier);
  if (!success) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit":     String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(reset),
          "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }
  return null;
}
