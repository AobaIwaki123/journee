# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
- Journee is a Next.js 14 + TypeScript application for AI-powered travel itinerary generation.
- Supports Gemini / Claude AI models (switchable), Supabase persistence, PDF export, and public sharing features.

## Essential Commands
- **Pre-Commit Checklist**: Always run `npm run type-check && npm run lint && npm run build` before committing. (Refer to `.cursor/rules/mandatory-pre-build-check.mdc` for details.)
- **Single Test**: `npm test -- <path/to/test.test.ts>` for Jest unit tests. `npm run test:e2e -- <path/to/spec.spec.ts>` for Playwright E2E tests.
- **Custom Scripts**:
    - `npm run docker:start|stop|restart|logs|shell|build|clean|status` for Docker development.
    - `npm run deploy:gcr` for Google Cloud Run deployment.
    - `npm run release` for version tagging.
    - `npm run seed:mock-users` to seed mock user data.
    - `npm run k8s:clean` to clean Kubernetes manifests.

## Critical Implementation Patterns
- **AI Streaming Response**: Server streams chunks via Server-Sent Events (SSE) to client, which updates Zustand store incrementally.
- **Authentication**: Only Google OAuth is supported. Mock authentication is enabled via `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`. `middleware.ts` protects routes, and API routes use `getCurrentUser()` from `lib/auth/session.ts`. Supabase user UUIDs are stored in NextAuth JWTs.
- **State Management (Zustand)**: Use selective subscriptions (`useStore(state => state.slice)`) to minimize re-renders. Global state is persisted to IndexedDB via `persist` middleware.
- **Chat History Database Integration**: Chat messages are automatically saved to Supabase `chat_history` table with server-side encryption (using `NEXTAUTH_SECRET` or `CHAT_ENCRYPTION_KEY`). Use `saveItineraryWithChatHistory()` from `lib/utils/api-client.ts` for atomic saving.
- **Database Access (Supabase)**: Always filter queries by `user_id` due to Row Level Security (RLS). Supabase Admin client (`supabaseAdmin`) requires `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS.
- **Type Safety**: Strictly no `any` types. NextAuth type extensions are in `types/auth.ts`.
- **Branch Environment Isolation**: Each Git branch can have its own Kubernetes environment. Refer to `scripts/create-branch-infra.sh` and `k8s/README.md`.

## Code Style & Conventions
- **Component Definition**: Use arrow functions with `React.FC` and named exports. Add `'use client'` for interactive components.
- **Import Order**: React, Next.js modules, external libraries, internal `@/` alias, then relative imports.
- **File Naming**: API routes are always `route.ts`.
- **Zustand Store**: Global state is defined in `lib/store/useStore.ts`.
- **Custom Hooks**: Located in `/lib/hooks`.
- **Interface vs Type**: Prefer `interface` for type definitions.

## AI Assistant Rules Integration
- Refer to `.cursor/rules/` for comprehensive coding rules, including `project_structure.mdc`, `typescript-react-rules.mdc`, `styling-rules.mdc`, `api-patterns.mdc`, `error-handling.mdc`, `authentication.mdc`, `database-integration.mdc`, `ai-integration.mdc`, `testing-strategy.mdc`, `git-workflow.mdc`, `comment-feature.mdc`, `feedback-feature.mdc`, `ogp-image-generation.mdc`, `branch-isolation.mdc`, `cursor-commands.mdc`, `context7-mcp.mdc`, `serena-mcp.mdc`, `environment-variables.mdc`, `security_and_performance.mdc`, `responsive-layout.mdc`, and `state_management.mdc`.
- Custom Cursor commands are defined in `.cursor/commands/`.

## Important Notes
- Gemini API key is server-side only. Claude API key can be user-provided and is stored encrypted in Zustand + LocalStorage.
- PWA-enabled with `public/manifest.json` and mobile-specific layouts in `components/layout/MobileLayout.tsx`.
