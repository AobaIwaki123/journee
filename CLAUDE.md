# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Journee** is a Next.js 14 web application that helps users create travel itineraries through AI-powered chat conversations. Users interact with Google Gemini or Anthropic Claude APIs in a conversational manner to plan trips, with real-time itinerary generation, sharing capabilities, and PDF export.

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+ (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (single global store at `lib/store/useStore.ts`)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: NextAuth.js (Google OAuth only)
- **AI Integration**: Google Gemini API (primary), Anthropic Claude API (fallback)
- **Testing**: Jest (unit), Playwright (E2E)
- **Deployment**: Google Cloud Run, Kubernetes with ArgoCD

## Essential Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build (ALWAYS run before committing)
npm run type-check       # TypeScript type checking (ALWAYS run before committing)
npm run lint             # ESLint (ALWAYS run before committing)
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Watch mode for unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # E2E tests in UI mode
npm run test:all         # Run all tests (unit + E2E)
```

### Docker Development
```bash
npm run docker:start     # Start Docker development environment
npm run docker:stop      # Stop Docker environment
npm run docker:restart   # Restart containers
npm run docker:logs      # View logs
npm run docker:shell     # Access container shell
```

### Pre-Commit Checklist
Before ANY commit or push, ALWAYS run these three commands:
```bash
npm run type-check && npm run lint && npm run build
```

## Architecture Overview

### Directory Structure

```
app/                    # Next.js App Router
├── api/               # API routes (Route Handlers)
│   ├── auth/          # NextAuth.js endpoints
│   ├── chat/          # AI chat streaming API
│   ├── itinerary/     # Itinerary CRUD operations
│   ├── feedback/      # Feedback submission
│   ├── og/            # Dynamic OGP image generation
│   └── user/          # User information
├── page.tsx           # Main page (chat + itinerary preview)
├── login/             # Login page
├── mypage/            # User dashboard
├── settings/          # Settings page
└── share/[slug]/      # Public shared itineraries

components/            # React components
├── auth/             # Authentication UI
├── chat/             # Chat interface
├── itinerary/        # Itinerary display/edit
├── layout/           # Layout components (Resizable, Mobile/Desktop)
├── comments/         # Comment feature
├── feedback/         # Feedback modal
└── ui/               # Reusable UI components

lib/                   # Business logic & utilities
├── ai/               # AI integration (gemini.ts, claude.ts, prompts.ts)
├── auth/             # Auth logic (auth-options.ts, session.ts)
├── db/               # Database (supabase.ts, repositories)
├── store/            # Zustand global store (useStore.ts)
├── execution/        # Itinerary creation flow
└── utils/            # Helpers (api-client, storage, pdf-generator, etc.)

types/                 # TypeScript type definitions
├── chat.ts
├── itinerary.ts
├── auth.ts           # NextAuth type extensions
└── database.ts
```

### Data Flow Patterns

#### AI Streaming Response
1. User sends message → `ChatBox` component
2. POST to `/api/chat` with streaming enabled
3. Server streams chunks via Server-Sent Events (SSE)
4. Client reads `ReadableStream`, updates Zustand store incrementally
5. `ItineraryPreview` displays real-time updates

#### Authentication Flow
1. User clicks `LoginButton` → NextAuth Google OAuth
2. Session created (JWT strategy)
3. `middleware.ts` protects routes automatically
4. API routes use `getCurrentUser()` from `lib/auth/session.ts`

#### State Management (Zustand)
- Single global store: `lib/store/useStore.ts`
- Slices: Chat, Itinerary, Settings, UI state
- LocalStorage persistence via `persist` middleware
- IndexedDB persistence via `persist` middleware
- **Always use selective subscriptions** for performance:
  ```typescript
  // Good - only subscribes to messages
  const messages = useStore(state => state.messages);

  // Bad - subscribes to entire store
  const { messages } = useStore();
  ```

#### Chat History Database Integration (Phase 5 & 7)
- Chat messages are automatically saved to Supabase `chat_history` table
- Server-side encryption using pgcrypto (`NEXTAUTH_SECRET` or `CHAT_ENCRYPTION_KEY`)
- Automatic save when itinerary has an ID
- Bulk save on first itinerary save using `saveItineraryWithChatHistory()` helper
- Automatic restore when loading itinerary via `ChatHistoryInitializer` component
- Repository: `lib/db/chat-repository.ts`
- API: `/api/chat/history` (GET for loading, POST for saving)

## Critical Implementation Patterns

### 1. Server vs Client Components
- **Server Components**: Default in App Router, use for data fetching
- **Client Components**: Add `'use client'` for interactivity, hooks, event handlers
- Use `getServerSession(authOptions)` in Server Components
- Use `useSession()` hook in Client Components

### 2. API Route Pattern
```typescript
// app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();

    // 3. Business logic
    const result = await processData(user.id, body);

    // 4. Return response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: 'InternalServerError' },
      { status: 500 }
    );
  }
}
```

### 3. Streaming API Pattern
Used in `/api/chat` for real-time AI responses:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    for await (const chunk of aiStreamGenerator()) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'message', content: chunk })}\n\n`)
      );
    }
    controller.close();
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  }
});
```

### 4. Database Access (Supabase)
- Client initialized at `lib/db/supabase.ts`
- Repository pattern: `lib/db/itinerary-repository.ts`
- Row Level Security (RLS) enabled - always filter by `user_id`
```typescript
const { data, error } = await supabase
  .from('itineraries')
  .select('*')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });
```

### 5. Type Safety
- **NO `any` types** - always use explicit types
- Type definitions in `/types` directory
- NextAuth type extensions in `types/auth.ts`:
  ```typescript
  declare module 'next-auth' {
    interface Session {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      };
    }
  }
  ```

## Code Style & Conventions

### Component Structure
```typescript
'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';

interface ComponentProps {
  title: string;
  isActive?: boolean;
}

export const Component: React.FC<ComponentProps> = ({ title, isActive = false }) => {
  // 1. Zustand store
  const { messages, addMessage } = useStore();

  // 2. Local state
  const [isOpen, setIsOpen] = React.useState(false);

  // 3. useEffect
  React.useEffect(() => {
    // side effects
  }, []);

  // 4. Event handlers (handleXxx)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // logic
  };

  return <div>{title}</div>;
};
```

### Import Order
1. React
2. Next.js modules
3. External libraries
4. Internal with `@/` alias
5. Relative imports

### Naming Conventions
- Components: PascalCase (e.g., `ChatBox`, `MessageList`)
- Functions/variables: camelCase (e.g., `handleSubmit`, `currentItinerary`)
- Types/Interfaces: PascalCase (e.g., `Message`, `ItineraryData`)
- Event handlers: `handleXxx` (e.g., `handleClick`, `handleSubmit`)
- Hooks: `useXxx` (e.g., `useStore`, `useAuth`)

### File Naming
- Components: PascalCase (e.g., `ChatBox.tsx`)
- Utilities: kebab-case (e.g., `api-client.ts`)
- Types: kebab-case (e.g., `chat.ts`, `itinerary.ts`)
- API routes: always `route.ts`

## Environment Variables

Required in `.env.local`:
```bash
# Google Gemini API
GEMINI_API_KEY=your_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Important**:
- `NEXT_PUBLIC_*` prefix = accessible on client-side
- No prefix = server-side only
- Never expose API keys without encryption on client-side

## Testing Strategy

### Unit Tests (Jest)
- Test files: `__tests__` directory or `*.test.ts` alongside source
- Focus on business logic in `/lib`
- Run: `npm test`

### E2E Tests (Playwright)
- Test files in `/e2e` directory
- Test full user flows (login, chat, itinerary creation, sharing)
- Run: `npm run test:e2e`
- Debug mode: `npm run test:e2e:debug`

## Kubernetes & Deployment

### Branch Isolation
- Each branch gets its own Kubernetes namespace
- Script: `scripts/create-branch-infra.sh`
- Manifests in `k8s/manifests-[branch-name]/`
- ArgoCD apps in `k8s/argocd-[branch-name]/`

### Deployment
```bash
npm run deploy:gcr       # Deploy to Google Cloud Run
npm run release          # Tag version for release
```

## Common Patterns Reference

### Responsive Layout
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

### Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

try {
  await apiCall();
  setError(null);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  console.error('Error:', err);
}
```

### Async Actions in Zustand
```typescript
// Option 1: In component
const { addMessage, setLoading } = useStore();
const handleSend = async () => {
  setLoading(true);
  try {
    await fetch('/api/chat', { ... });
  } finally {
    setLoading(false);
  }
};

// Option 2: In store
sendMessage: async (content) => {
  set({ isLoading: true });
  try {
    const res = await fetch('/api/chat', { ... });
    set({ messages: [...get().messages, newMessage] });
  } finally {
    set({ isLoading: false });
  }
}
```

## Cursor Rules Integration

Comprehensive coding rules are defined in `.cursor/rules/`:
- **Always applied**: `project_structure.mdc`, `state_management.mdc`, `security_and_performance.mdc`
- **TypeScript/React**: `typescript-react-rules.mdc`, `styling-rules.mdc`
- **API development**: `api-patterns.mdc`, `error-handling.mdc`
- **Features**: `authentication.mdc`, `database-integration.mdc`, `ai-integration.mdc`
- **Testing**: `testing-strategy.mdc`
- **Git workflow**: `git-workflow.mdc`

See `.cursor/rules/README.md` for full list.

## Important Notes

1. **Authentication**: Only Google OAuth is supported. No email/password authentication.

2. **AI API Keys**:
   - Gemini API key is server-side only (secure)
   - Claude API key can be user-provided (stored encrypted in Zustand + LocalStorage)

3. **Database Schema**: See `lib/db/schema.sql` for full schema. Key tables:
   - `users` - User profiles
   - `itineraries` - Trip itineraries with JSON data column
   - `comments` - Comments on public itineraries
   - `chat_history` - Encrypted chat messages linked to itineraries (Phase 5 implemented)

4. **Mobile Support**: PWA-enabled with `public/manifest.json`. Responsive design with mobile-specific layouts in `components/layout/MobileLayout.tsx`.

5. **Branch Environment Isolation**: Each Git branch can have its own Kubernetes environment for testing. See `k8s/README.md`.

6. **Performance**:
   - Use React.memo for components that re-render frequently
   - Use useCallback/useMemo for expensive operations
   - Selective Zustand subscriptions to minimize re-renders

7. **Security**:
   - All API routes must check authentication via `getCurrentUser()`
   - Database queries are protected by Supabase RLS policies
   - CSRF protection handled by NextAuth.js
   - Input validation required (consider Zod for schemas)

## Common Tasks

### Adding a new API endpoint
1. Create `app/api/[name]/route.ts`
2. Implement HTTP methods (GET, POST, etc.)
3. Add authentication check with `getCurrentUser()`
4. Add types in `types/api.ts`
5. Add client helper in `lib/utils/api-client.ts`
6. Run `npm run type-check && npm run build`

### Adding a new component
1. Create file in appropriate `components/` subdirectory
2. Use named export: `export const Component: React.FC = () => {}`
3. Add `'use client'` if interactive
4. Define Props interface
5. Import from `@/components/[path]`

### Modifying Zustand store
1. Edit `lib/store/useStore.ts`
2. Update interface with new state/actions
3. Implement actions immutably (use spread operator)
4. Update `partialize` if state should persist
5. Use selective subscriptions in components

### Adding a database table
1. Write migration in `lib/db/schema.sql`
2. Add RLS policies for user isolation
3. Create repository functions in `lib/db/[table]-repository.ts`
4. Add types in `types/database.ts`
5. Test with Supabase Studio

### Saving itinerary with chat history
Use the `saveItineraryWithChatHistory()` helper instead of direct API calls:
```typescript
import { saveItineraryWithChatHistory } from '@/lib/utils/api-client';

const savedItinerary = await saveItineraryWithChatHistory(
  currentItinerary,
  messages
);
```
This ensures chat history is saved atomically with the itinerary.

## Cursor Commands

Slash commands are defined in `.cursor/commands/`:

### Pre-Commit Check
Always run before committing:
```
@pre-build-check
```
or just say "コミット前チェックを実行してください"

This runs:
1. `npm run type-check` - TypeScript type checking
2. `npm run lint` - ESLint validation
3. `npm run build` - Production build test

See `.cursor/commands/pre-build-check.md` for detailed usage.

### Other Commands
- `@generate-api` - Generate API documentation
- `@generate-schema` - Generate database schema documentation
- `@compress-docs` - Compress documentation for AI context
- `@update-readme` - Update README with latest info

## Resources

- **Project Docs**: `/docs` directory (API.md, SCHEMA.md, TESTING.md, etc.)
- **Cursor Rules**: `.cursor/rules/` for detailed patterns
- **Cursor Commands**: `.cursor/commands/` for automation
- **Memory Files**: Serena MCP maintains architecture knowledge
- **Next.js Docs**: https://nextjs.org/docs
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **Supabase Docs**: https://supabase.com/docs

## Recent Updates

### Phase 5 & 7: Chat History Database Integration (2025-10-12)
- ✅ Implemented automatic chat history saving to Supabase
- ✅ Server-side encryption with pgcrypto
- ✅ Bulk save on first itinerary save
- ✅ Automatic restore on itinerary load
- ✅ Error logging and handling improvements
- Files modified:
  - `app/api/chat/route.ts` - Error logging, auto-save
  - `lib/store/useStore.ts` - Chat history actions
  - `lib/utils/api-client.ts` - `saveItineraryWithChatHistory()` helper
  - `components/itinerary/SaveButton.tsx` - Integrated bulk save
  - `app/api/itinerary/load/route.ts` - Return chat history
  - `components/layout/ChatHistoryInitializer.tsx` - Auto-restore component
