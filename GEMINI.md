# GEMINI.md

## Project Overview

This is a Next.js web application called "Journee". It's a travel planning application that allows users to create their own travel itineraries by chatting with an AI assistant. The application is designed to be intuitive and user-friendly, mimicking a conversation with a travel-savvy friend.

The application is built with a modern tech stack, including:

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **UI:** React, Tailwind CSS
*   **Authentication:** NextAuth.js
*   **Database:** Supabase (PostgreSQL)
*   **AI:** Google Gemini, Anthropic Claude
*   **Testing:** Jest, Playwright
*   **Deployment:** Docker, Google Cloud Run, Kubernetes

## Building and Running

### Development

To run the application in a development environment, use the following command:

```bash
npm run dev
```

This will start the Next.js development server on `http://localhost:3000`.

### Docker

The project includes a Docker setup for containerized development.

*   **Start:** `npm run docker:start`
*   **Stop:** `npm run docker:stop`
*   **Build:** `npm run docker:build`

### Testing

The project has a comprehensive testing suite.

*   **Unit Tests:** `npm run test`
*   **E2E Tests:** `npm run test:e2e`
*   **All Tests:** `npm run test:all`

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code linting and formatting.
*   **Type Checking:** TypeScript is used for static type checking. Run `npm run type-check` to check for type errors.
*   **Authentication:** Authentication is handled by NextAuth.js. Session management is done server-side.
*   **Database:** The application uses Supabase for its database. The `lib/db` directory contains the database schema and repositories.
*   **AI Integration:** The application integrates with Google Gemini and Anthropic Claude for its AI assistant features.
*   **State Management:** Zustand is used for state management.
*   **Deployment:** The application is deployed using Docker and Google Cloud Run. Kubernetes is also used for orchestration.
