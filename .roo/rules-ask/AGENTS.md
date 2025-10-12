# Project Documentation Rules (Non-Obvious Only)
- **AI Model Configuration**: `lib/ai/models.ts` centralizes AI model settings, avoiding hardcoding and ensuring type safety.
- **Authentication Configuration**: `lib/auth/auth-options.ts` defines NextAuth.js settings, including Google OAuth and mock authentication logic.
- **Supabase Client Initialization**: `lib/db/supabase.ts` initializes both client-side (Anon Key, RLS enabled) and server-side (Service Role Key, RLS bypassed) Supabase clients.
- **Zustand Global Store**: `lib/store/useStore.ts` defines the single global state, persisted to IndexedDB.
- **Environment Variable Management**: `lib/utils/env.ts` provides utilities for checking environment variables like `NEXT_PUBLIC_ENABLE_MOCK_AUTH`.
- **Chat History Encryption**: Chat messages are encrypted server-side using `NEXTAUTH_SECRET` or `CHAT_ENCRYPTION_KEY`.
- **Branch Environment Isolation**: Each Git branch can have its own Kubernetes environment. Refer to `scripts/create-branch-infra.sh` and `k8s/README.md`.
