<!--
Sync Impact Report:
- Version change: NONE → 1.0.0
- New sections added: All (initial constitution creation)
- Modified principles: N/A (initial creation)
- Removed sections: N/A (initial creation)
- Templates requiring updates:
  ✅ plan-template.md - Constitution Check section already present
  ✅ spec-template.md - Requirements align with constitution principles
  ✅ tasks-template.md - Task categorization reflects testing and user story principles
- Follow-up TODOs: None
-->

# Journee Project Constitution

## Core Principles

### I. User-Centric Design

Every feature MUST start with clearly defined user stories prioritized by value (P1, P2, P3).
Each user story MUST be independently testable and deliverable as a standalone increment.
Features MUST be validated against real user scenarios before implementation begins.

**Rationale**: Journee exists to simplify travel planning through conversational AI. Keeping users at the center ensures we build features that deliver real value, not technical complexity for its own sake.

### II. Type Safety First

All code MUST be written in TypeScript with strict mode enabled.
No use of `any` type unless explicitly justified and documented.
All data structures crossing API boundaries MUST have explicit type definitions.
Zod schemas MUST be used for runtime validation of external data.

**Rationale**: Type safety prevents entire classes of bugs at compile time, especially critical in a full-stack application where data flows between frontend, backend, database, and AI APIs.

### III. Test-Driven Development (MANDATORY)

Tests MUST be written before implementation for all critical user flows.
All tests MUST fail initially, then pass after implementation (Red-Green-Refactor).
E2E tests MUST cover main user journeys: chat interaction, itinerary creation, sharing, PDF generation.
Unit tests MUST cover business logic in `lib/` with 80%+ coverage target.

**Rationale**: Journee integrates multiple complex systems (AI APIs, database, authentication, PDF generation). TDD ensures each integration point works correctly and prevents regressions as the system evolves.

### IV. Incremental Value Delivery

Features MUST be decomposable into independently shippable user stories.
MVP (P1 story) MUST be completable and demonstrable before starting P2 stories.
Each story completion MUST represent a working feature that can be deployed and used.
Progress MUST be validated at user story boundaries, not just at feature completion.

**Rationale**: Incremental delivery allows early validation, faster feedback cycles, and reduces risk of building the wrong thing. Users can benefit from P1 features while P2/P3 are still in development.

### V. AI Integration Standards

AI responses MUST use streaming to provide real-time feedback.
Primary AI provider is Google Gemini, with Claude as fallback.
All AI prompts MUST be centralized in `lib/ai/prompts.ts` for maintainability.
AI errors MUST be handled gracefully with user-friendly messages.
Chat history MUST be compressed to manage token limits (`lib/ai/chat-compressor.ts`).

**Rationale**: AI is core to Journee's value proposition. Standardized integration patterns ensure consistent behavior, maintainability, and graceful degradation when APIs fail.

### VI. Database Integrity & Security

All database operations MUST respect Supabase Row Level Security (RLS) policies.
User data MUST be isolated and accessible only to the owning user (except public shares).
Database schema changes MUST be applied via migrations, never direct edits.
All queries MUST use prepared statements or ORM methods to prevent SQL injection.

**Rationale**: User trust is paramount. RLS provides defense-in-depth security. Migrations ensure database consistency across environments and enable rollback if needed.

### VII. Mobile-First Responsiveness

All UI components MUST work on mobile screens (PWA support).
Layouts MUST be tested on mobile, tablet, and desktop viewports.
Touch interactions MUST be as intuitive as mouse/keyboard interactions.
Performance on mobile networks MUST be considered (lazy loading, image optimization).

**Rationale**: Travel planning happens on-the-go. Mobile-first design ensures the app works where users need it most - while researching trips, during travel, and when sharing with companions.

### VIII. Observability & Debugging

All critical operations MUST include structured logging.
Errors MUST include context (user action, API endpoint, request ID) for debugging.
Client-side errors MUST be captured and reportable (feedback mechanism).
API responses MUST include meaningful error messages, not generic "500 Internal Server Error".

**Rationale**: When AI APIs, database, or authentication fail, rapid diagnosis is essential. Good logging and error reporting reduce mean time to resolution and improve user experience.

## Development Workflow

### Code Review Requirements

All changes MUST go through Pull Request review before merging to main.
PRs MUST include:
- Description of what changed and why
- Link to related user story or issue
- Test results (unit + E2E where applicable)
- Screenshots for UI changes

Reviews MUST verify:
- Type safety (no `any` without justification)
- Test coverage for new logic
- Mobile responsiveness for UI changes
- Error handling for external API calls
- RLS compliance for database queries

### Quality Gates

Before merging any PR:
- `npm run build` MUST succeed
- `npm run type-check` MUST pass with no errors
- `npm test` MUST pass (Jest unit tests)
- `npm run test:e2e` MUST pass for affected user flows (Playwright)
- `npm run lint` MUST pass with no errors

### Branch Strategy

Main branch (`main` or `master`) MUST always be deployable.
Feature branches MUST follow naming convention: `[issue-number]-[feature-name]`
Each feature branch MUST correspond to a single user story or tightly scoped feature.
Merge to main triggers deployment pipeline (Vercel / GCR / ArgoCD).

## Technology Constraints

### Approved Stack

**Frontend**: Next.js 14 (App Router), React 18, TypeScript 5.3+, Tailwind CSS
**State**: Zustand 4.5+ (no Redux or other state libraries without justification)
**Auth**: NextAuth.js 4 with Google OAuth only
**Database**: Supabase (PostgreSQL with RLS)
**AI**: Google Gemini (primary), Anthropic Claude (fallback)
**Testing**: Jest (unit), Playwright (E2E)
**Deployment**: Vercel (preferred), Google Cloud Run, Kubernetes + ArgoCD

### Adding Dependencies

New dependencies MUST be justified by:
- Solving a problem not addressed by existing stack
- Significant reduction in code complexity
- Well-maintained library with active community

Avoid dependencies that:
- Duplicate existing functionality (e.g., another state library)
- Are poorly maintained or have known security issues
- Significantly increase bundle size without proportional value

## Security Requirements

### Authentication & Authorization

Google OAuth MUST be the only authentication method.
Session tokens MUST be stored securely (httpOnly cookies via NextAuth).
Protected API routes MUST validate session via `getCurrentUser()` helper.
Client-side API keys (Gemini, Claude) MUST be encrypted in browser storage.

### Data Privacy

User data MUST be private by default (RLS enforced).
Shared itineraries MUST use unique, unguessable URLs (`share/[slug]`).
Public sharing MUST be opt-in, never automatic.
User feedback MUST not include personally identifiable information unless explicitly provided.

### Dependency Security

Dependencies MUST be regularly updated to patch CVEs.
`npm audit` MUST be run periodically and high/critical issues addressed.
Environment variables MUST never be committed to git (use `.env.local`).

## Governance

### Constitution Authority

This constitution supersedes all other development practices.
When practices conflict with constitution, constitution takes precedence.
All team members MUST be familiar with this constitution.

### Amendment Process

Amendments require:
1. Proposal with clear rationale for change
2. Review and approval from project maintainers
3. Update to constitution version number (see versioning policy below)
4. Propagation of changes to dependent templates and documentation
5. Communication to all team members

### Versioning Policy

Constitution version follows semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Backward-incompatible governance changes, principle removal/redefinition
- **MINOR**: New principle added, materially expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

Every PR review MUST verify compliance with:
- User-Centric Design (user stories defined and prioritized)
- Type Safety First (no unjustified `any`, Zod for external data)
- Test-Driven Development (tests exist and pass)
- Database Integrity & Security (RLS respected)
- Observability & Debugging (errors logged with context)

If a PR violates constitution principles, it MUST be justified in the PR description with:
- Why the violation is necessary
- What simpler alternatives were rejected and why
- How the violation will be mitigated or removed in the future

**Version**: 1.0.0 | **Ratified**: 2025-10-26 | **Last Amended**: 2025-10-26
