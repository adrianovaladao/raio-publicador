/**
 * Server-only admin helpers — use only in Route Handlers and Server Components.
 * Reads the admin role from Clerk's publicMetadata via currentUser().
 */
import { currentUser } from "@clerk/nextjs/server";
import { getAdminRole, type AdminRole } from "./admin";

async function getAuthRole(): Promise<AdminRole | null> {
  const user = await currentUser();
  if (!user) return null;
  return getAdminRole(user.publicMetadata as Record<string, unknown>);
}

/** Returns true if the current user is a master admin. */
export async function assertMaster(): Promise<boolean> {
  return (await getAuthRole()) === "master";
}

/** Returns true if the current user is any admin. */
export async function assertAnyAdmin(): Promise<boolean> {
  return (await getAuthRole()) !== null;
}
