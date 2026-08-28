/**
 * Server-only admin helpers — use only in Route Handlers and Server Components.
 * Reads the admin role from the JWT session claims (no extra Clerk API call).
 */
import { auth } from "@clerk/nextjs/server";
import { getAdminRole, type AdminRole } from "./admin";

async function getAuthRole(): Promise<AdminRole | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const meta = (sessionClaims?.metadata ?? {}) as Record<string, unknown>;
  return getAdminRole(meta);
}

/** Returns true if the current user is a master admin (reads JWT, no network call). */
export async function assertMaster(): Promise<boolean> {
  return (await getAuthRole()) === "master";
}

/** Returns true if the current user is any admin (reads JWT, no network call). */
export async function assertAnyAdmin(): Promise<boolean> {
  return (await getAuthRole()) !== null;
}
