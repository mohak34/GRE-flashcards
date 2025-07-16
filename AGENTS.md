# Agent Guidelines for Flashcards App Repository

This document outlines essential commands and code style guidelines for AI agents operating within this repository.

## 1. Build, Lint, and Test Commands

### API (Node.js/TypeScript)
- **Build:** `npm run build` or `tsc`
- **Lint:** No explicit linting command found. Adhere to existing code style.
- **Test:** No specific test command defined in `package.json`. If tests are added, `npm test` would typically run them. For single tests, specify the test file (e.g., `jest path/to/test.ts`).

### App (React Native/TypeScript)
- **Build/Start:** `npm run start` (starts development server)
- **Lint:** No explicit linting command found. Adhere to existing code style.
- **Test:** No specific test command defined. If tests are added (e.g., with Jest), `npm test` or `expo test` might be used. For single tests, specify the test file/name.

## 2. Code Style Guidelines

- **Imports:** Group imports logically (e.g., external libraries, internal modules, relative paths).
- **Formatting:** Maintain consistent indentation (2 spaces for JS/TS, 4 for Python if applicable).
- **Types:** Utilize TypeScript for strong typing and clear interfaces.
- **Naming:** Use `camelCase` for variables and functions, `PascalCase` for components and classes.
- **Error Handling:** Implement robust `try...catch` blocks for error-prone operations.
- **Comments:** Add comments to explain complex logic or non-obvious decisions.

## 3. Agent-Specific Rules
No Cursor or Copilot specific rules found in this repository.
