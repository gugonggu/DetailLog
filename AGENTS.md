# AGENTS.md

## Project Direction

Detailog is a responsive web service MVP for car wash record management, AI wash routine recommendation, and community sharing.

Do not plan or implement a native mobile app. Do not include App Store or Play Store release work. The first release target is a web MVP deployed on Vercel.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Zustand only when global state is necessary
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- OpenAI API via Next.js Route Handler
- Vercel

## Current Implementation Rule

Keep changes small and reviewable. Do not connect Supabase or OpenAI until explicitly requested. Do not implement business features before the relevant feature task is defined.

## Folder Guidance

- `src/app`: App Router route groups and route files
- `src/features`: Feature-owned UI, hooks, schemas, and services
- `src/components/ui`: shadcn/ui components
- `src/lib`: Shared utilities and integration clients when introduced
- `docs`: Architecture, scope, decisions, logs, and troubleshooting notes

## Language Guidance

Use Korean for project explanations and user-facing planning notes when working with this repository. Keep code, file names, variable names, route names, database table names, and technical identifiers in English.
