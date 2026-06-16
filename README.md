# Raio Publicador — Codebase

Next.js 15 · TypeScript · Tailwind CSS 4 · App Router

## Pré-requisitos

- Node.js 20+ (instale via [nvm](https://github.com/nvm-sh/nvm) ou [Volta](https://volta.sh/))

## Iniciar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` — redireciona para `/site`.

## Estrutura de rotas

```
/site                   → Site de marketing (tema escuro)
/login                  → Login
/cadastro               → Cadastro
/verificar              → Verificação de e-mail
/convite                → Aceitar convite de equipe
/boas-vindas            → Onboarding pós-cadastro
/dashboard              → App autenticado — visão geral
/releases               → Biblioteca de releases
/releases/novo          → Composer (4 passos)
/calendario             → Calendário de publicações
/veiculos               → Diretório de veículos parceiros
/configuracoes          → Configurações
```

## Design system

Tokens em `src/app/globals.css` (CSS custom properties).
Tema claro: `:root` · Tema escuro: `[data-theme="dark"]`.
Referência visual: `../design_handoff_raio_publicador/prototype/`.

## Stack planejada

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + TypeScript |
| Auth | Clerk |
| Banco | Supabase (PostgreSQL) + Drizzle ORM |
| Pagamentos | Stripe |
| E-mail | Resend |
| Deploy | Vercel |
