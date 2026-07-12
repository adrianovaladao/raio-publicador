import { getPrisma } from "./prisma";

export type NotifType =
  | "release_scheduled"
  | "release_published"
  | "release_needs_revision"
  | "release_rejected"
  | "low_credits"
  | "no_credits"
  | "payment_failed"
  | "plan_renewed"
  | "plan_changed"
  | "subscription_cancelled"
  | "subscription_reactivated"
  | "member_joined"
  | "vehicle_added";

export const DEFAULT_PREFS: Record<NotifType, { inApp: boolean; email: boolean }> = {
  release_scheduled:       { inApp: true,  email: true  },
  release_published:       { inApp: true,  email: true  },
  release_needs_revision:  { inApp: true,  email: true  },
  release_rejected:        { inApp: true,  email: true  },
  low_credits:             { inApp: true,  email: true  },
  no_credits:              { inApp: true,  email: true  },
  payment_failed:          { inApp: true,  email: true  },
  plan_renewed:            { inApp: true,  email: false },
  plan_changed:            { inApp: true,  email: true  },
  subscription_cancelled:  { inApp: true,  email: true  },
  subscription_reactivated:{ inApp: true,  email: false },
  member_joined:           { inApp: true,  email: false },
  vehicle_added:           { inApp: true,  email: false },
};

export const NOTIF_LABELS: Record<NotifType, { title: string; desc: string; group: string }> = {
  release_scheduled:        { group: "Releases", title: "Release agendado",                    desc: "Confirmação quando um release é agendado." },
  release_published:        { group: "Releases", title: "Release publicado",                   desc: "Quando o release entra no ar em cada veículo." },
  release_needs_revision:   { group: "Releases", title: "Release precisa de revisão",          desc: "Quando um veículo solicita ajustes." },
  release_rejected:         { group: "Releases", title: "Release rejeitado",                   desc: "Quando um veículo recusa a publicação." },
  low_credits:              { group: "Conta",    title: "Créditos baixos",                     desc: "Aviso preventivo quando os créditos ficam abaixo de 20%." },
  no_credits:               { group: "Conta",    title: "Créditos zerados",                    desc: "Quando os créditos acabam." },
  payment_failed:           { group: "Conta",    title: "Pagamento falhou",                    desc: "Quando a cobrança do plano não é processada." },
  plan_renewed:             { group: "Conta",    title: "Plano renovado",                      desc: "Confirmação de renovação bem-sucedida." },
  plan_changed:             { group: "Conta",    title: "Plano alterado",                      desc: "Quando você faz upgrade ou downgrade." },
  subscription_cancelled:   { group: "Conta",    title: "Assinatura cancelada",                desc: "Confirmação de cancelamento da assinatura." },
  subscription_reactivated: { group: "Conta",    title: "Assinatura reativada",                desc: "Quando a assinatura é reativada." },
  member_joined:            { group: "Equipe",   title: "Novo membro na equipe",               desc: "Quando alguém aceita um convite." },
  vehicle_added:            { group: "Veículos", title: "Novo veículo adicionado",             desc: "Quando um novo veículo é cadastrado na plataforma." },
};

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
