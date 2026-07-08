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
