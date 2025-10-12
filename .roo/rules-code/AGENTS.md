# Project Coding Rules (Non-Obvious Only)
- **Component Definition**: Use arrow functions with `React.FC` and named exports. Add `'use client'` for interactive components.
- **Import Order**: React, Next.js modules, external libraries, internal `@/` alias, then relative imports.
- **File Naming**: API routes are always `route.ts`.
- **Zustand Store**: Global state is defined in `lib/store/useStore.ts`. Use selective subscriptions (`useStore(state => state.slice)`) to minimize re-renders. Global state is persisted to IndexedDB via `persist` middleware.
- **Custom Hooks**: Located in `/lib/hooks`.
- **Interface vs Type**: Prefer `interface` for type definitions.
- **Type Safety**: Strictly no `any` types. NextAuth type extensions are in `types/auth.ts`.
- **Chat History Database Integration**: Chat messages are automatically saved to Supabase `chat_history` table with server-side encryption (using `NEXTAUTH_SECRET` or `CHAT_ENCRYPTION_KEY`). Use `saveItineraryWithChatHistory()` from `lib/utils/api-client.ts` for atomic saving.
- **Database Access (Supabase)**: Always filter queries by `user_id` due to Row Level Security (RLS). Supabase Admin client (`supabaseAdmin`) requires `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS.
