import { getPrisma } from "./prisma";
export type { NotifType } from "./notify-types";
export { DEFAULT_PREFS, NOTIF_LABELS } from "./notify-types";
import type { NotifType } from "./notify-types";
import { DEFAULT_PREFS } from "./notify-types";

export async function createNotification(
  userId: string,
  type: NotifType,
  title: string,
  body: string,
  link?: string,
) {
  const prisma = getPrisma();

  // Check user preferences
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  const prefs = (pref?.prefs ?? DEFAULT_PREFS) as Record<NotifType, { inApp: boolean; email: boolean }>;
  const userPref = prefs[type] ?? DEFAULT_PREFS[type];

  if (userPref.inApp) {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  }

  return { emailEnabled: userPref.email };
}
