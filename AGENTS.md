# Agent Guidelines for Flashcards App Repository

This document outlines essential commands and code style guidelines for AI agents operating within this repository.

## 1. Build, Lint, and Test Commands

### API (Node.js/TypeScript) - `cd api/`
- **Build:** `npm run build` (runs `tsc`)
- **Start:** `npm start` (production), `npm run dev` (development with nodemon)
- **Seed:** `npm run seed` (seed database with initial data)
- **Lint:** ESLint installed but no script defined. Use `npx eslint src/` for manual linting
- **Test:** No tests configured. Use `jest` for unit tests if needed
- **Single Test:** `jest path/to/test.ts` or `npm test -- path/to/test.ts`

### App (React Native/Expo) - `cd app/`
- **Start:** `npm start` (expo start)
- **Platform:** `npm run android|ios|web`
- **Lint:** ESLint installed but no script defined. Use `npx eslint src/` for manual linting
- **Test:** No tests configured. Use `jest` or `expo test` if needed
- **Single Test:** `jest TestName` or `npm test -- TestName`

## 2. Code Style Guidelines

- **Imports:** Group by: external libraries, React/RN, local modules, relative imports
- **Formatting:** 2 spaces indentation, single quotes for strings, trailing commas, semicolons
- **Types:** Use TypeScript interfaces, avoid `any` (use specific types or `unknown`)
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components/interfaces
- **Components:** Export named components (not default exports), use functional components with hooks
- **Error Handling:** Use try/catch for async operations, proper error logging with console.error
- **Styling:** StyleSheet.create() for React Native, consistent theming (dark theme: #121212)

## 3. Project Structure
- API uses Express + Prisma ORM with PostgreSQL
- App uses React Native + Expo with React Navigation
- No Cursor or Copilot specific rules found
