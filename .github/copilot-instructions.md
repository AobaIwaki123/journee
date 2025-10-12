# Copilot instructions for Journee

Purpose: Enable AI coding agents to contribute productively to this Next.js 14 + TypeScript app that plans travel itineraries via AI chat, with Supabase persistence and NextAuth auth.

## Big picture

- App architecture
  - app/ (App Router pages + API route handlers)
  - components/ (feature-oriented React components: chat, itinerary, layout, auth, etc.)
  - lib/ (business logic): ai/, auth/, db/, store/ (Zustand), utils/, execution/
  - types/ (shared TS types)
  - e2e/ (Playwright tests), docs/ (project docs), .cursor/rules/ (authoritative coding rules)
- Core flows
  - Chat → POST app/api/chat: server streams SSE; client consumes ReadableStream and updates Zustand
  - Auth → NextAuth (Google) with middleware-protected routes; use getCurrentUser() server-side
  - Data → Supabase repositories; JSONB for itinerary data; always scope queries by user_id (RLS)

## Project conventions (do this here)

- Server vs Client Components: default server; add 'use client' for interactive components/hooks
- API route pattern: auth check first, parse/validate body, delegate to lib layer, typed JSON response
- Zustand: single global store in lib/store; use selective subscriptions, not whole-store reads
- Types: no any; add/extend types under types/\*.ts; keep API request/response types in types/api.ts
- Paths: prefer @/ alias imports over relative chains
- Error handling: normalize API errors; don't leak stack traces in 500s; log server-side only

## Integration points to reuse

- AI: lib/ai/gemini.ts (primary); prompts and parsing helpers in lib/ai/prompts.ts
  - Typical server usage: streamGeminiMessage(...) → emit SSE chunks: {type:'message'|'itinerary'|'done'|'error'}
- API: implement route handlers in app/api/\*\*/route.ts with NextRequest/NextResponse
  - Example outline (omit codegen): auth → validate (zod if needed) → repo/service → NextResponse.json
- DB: lib/db/supabase.ts client; repository pattern under lib/db/\*\* (e.g., itinerary-repository.ts)
  - Always filter by user_id and respect RLS; select only needed columns for performance
- State: lib/store/useStore.ts; subscribe with selectors (state => state.slice) to minimize re-renders

## Developer workflow (run locally before committing)

- npm run dev – start dev server (http://localhost:3000)
- npm run type-check && npm run lint && npm run build – mandatory pre-commit check
- Tests: npm test (Jest), npm run test:e2e (Playwright)
- Docker helpers: npm run docker:start|stop|logs|shell (optional)

## Cursor rules and commands

- Rules live under `.cursor/rules/` and are authoritative for patterns and guardrails. Always follow `mandatory-pre-build-check.mdc`.
- Custom commands live under `.cursor/commands/` and can be invoked in Cursor chat:
  - `@pre-commit-check` – run type-check + lint before commit
  - `@pre-build-check` – run type-check + lint + build before push/PR
- Before pushing code, always ensure pre-commit checks pass locally or via the commands above.

## Environment (minimal)

- NextAuth: NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- AI: GEMINI_API_KEY

## Patterns by example (from this repo)

- Streaming chat SSE
  - Server: app/api/chat/route.ts constructs ReadableStream; chunks encode JSON lines with data: prefix
  - Client: lib/utils/api-client.ts reads response.body with a reader, splits on \n, JSON.parse after 'data: '
- Itinerary persistence
  - Use lib/db/itinerary-repository.ts; upsert JSONB itinerary; order by updated_at; paginate with range()
- Zustand subscriptions
  - Good: const messages = useStore(s => s.messages)
  - Avoid: const { messages } = useStore() // re-renders too often

## Source of truth

- Rules and patterns: .cursor/rules/\*.mdc (api-patterns, state_management, security_and_performance, project_structure, etc.)
- Docs: docs/API.md, docs/SCHEMA.md, docs/TESTING.md, docs/QUICK_START.md
- Auth: lib/auth/\*, middleware.ts

## When adding features

- Prefer reusing lib/\* abstractions; keep route handlers thin
- Add/extend types in types/\* and wire to API responses
- Respect auth (getCurrentUser) and RLS in every API touching user data
- Update or add minimal tests when you change public behavior (Jest or Playwright)

Questions/clarifications welcome: If any of the referenced files differ in your branch (e.g., chat route or repository names), tell me and I’ll adapt these instructions to match your layout.
