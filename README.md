# Detailog

Detailog is a responsive web service MVP for car wash record management, AI wash routine recommendations, and community sharing.

## Current Status

This repository currently includes:

- Next.js App Router project structure
- TypeScript configuration
- Tailwind CSS setup
- Feature-based folder structure
- Supabase Auth setup
- Login / signup / logout flows
- Protected app routes
- Auth redirect middleware
- Placeholder pages for future MVP features

## Not implemented yet:

- Profile table integration
- Car management
- Wash log CRUD
- Image upload
- AI routine recommendation
- Community feed
- Like / bookmark

## Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/cars`
- `/wash`
- `/routine/new`
- `/community`
- `/bookmarks`
- `/profile`

## Local Development

Install dependencies:

```bash
npm ci
```

Create a local environment file:

```bash
cp .env.example .env
```

Then set:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.env` is intentionally ignored and should not be committed.

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run checks:

```bash
npm ci
npm test
npm run lint
npm run build
```

## MVP Boundary

The first release target is a responsive web MVP deployed on Vercel. Native mobile app planning, App Store release work, and Play Store release work are out of scope.
