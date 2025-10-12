# Project Architecture Rules (Non-Obvious Only)
- **AI Model Switching**: The application supports switching between Gemini and Claude AI models, managed by `lib/ai/models.ts`. Gemini is default and does not require an API key, while Claude requires a user-provided API key stored encrypted.
- **Authentication Strategy**: Only Google OAuth is supported. Mock authentication is available for development via `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`. Supabase user UUIDs are stored in NextAuth JWTs.
- **State Management**: Zustand is used for global state, with selective subscriptions (`useStore(state => state.slice)`) being critical for performance. State is persisted to IndexedDB.
- **Database Row Level Security (RLS)**: All Supabase queries must filter by `user_id` due to RLS. The `supabaseAdmin` client bypasses RLS but requires `SUPABASE_SERVICE_ROLE_KEY`.
- **Chat History Encryption**: Chat messages are automatically saved to Supabase `chat_history` table with server-side encryption using `NEXTAUTH_SECRET` or `CHAT_ENCRYPTION_KEY`.
- **Branch Environment Isolation**: Each Git branch can have its own Kubernetes environment, managed by `scripts/create-branch-infra.sh` and documented in `k8s/README.md`.
- **API Route Authentication**: All API routes must include an authentication check using `getCurrentUser()` from `lib/auth/session.ts`.
- **AI Streaming Implementation**: AI responses are streamed via Server-Sent Events (SSE) from `/api/chat` to the client, which incrementally updates the Zustand store.
