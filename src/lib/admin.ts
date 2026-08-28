import { auth } from "@clerk/nextjs/server";

export type AdminRole = "master" | "editor";

export function getAdminRole(meta: Record<string, unknown> | undefined | null): AdminRole | null {
  const v = meta?.raioAdmin;
  if (v === "master" || v === true) return "master";
  if (v === "editor") return "editor";
  return null;
}

export function isMaster(meta: Record<string, unknown> | undefined | null) {
  return getAdminRole(meta) === "master";
}

export function isAnyAdmin(meta: Record<string, unknown> | undefined | null) {
  return getAdminRole(meta) !== null;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  master: "Master Admin",
  editor: "Editor Admin",
};

/**
 * Reads the admin role directly from the JWT session claims —
 * zero extra network calls (unlike currentUser() which hits the Clerk API).
 * Clerk refreshes the JWT every ~60 s, so this is always fresh enough for auth checks.
 */
async function getAuthRole(): Promise<AdminRole | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const meta = (sessionClaims?.metadata ?? {}) as Record<string, unknown>;
  return getAdminRole(meta);
}

/** Returns true if the current user is a master admin (no network call). */
export async function assertMaster(): Promise<boolean> {
  return (await getAuthRole()) === "master";
}

/** Returns true if the current user is any admin (no network call). */
export async function assertAnyAdmin(): Promise<boolean> {
  return (await getAuthRole()) !== null;
}
