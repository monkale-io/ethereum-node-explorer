# Style Guides

## Stack and Architecture

- Keep the application browser-only.
- Do not introduce backend services or Node-only runtime behavior into frontend code.
- Preserve the single-file Vite build and the `@/` alias unless the task explicitly changes project architecture.
- Preserve the existing routing assumptions, including `HashRouter`, unless deployment strategy intentionally changes.

## Project Structure

- Put UI and route-level components in `src/components/`.
- Put reusable hooks and providers in `src/hooks/`.
- Put Ethereum RPC logic in `src/services/`.
- Put Zustand state in `src/stores/`.
- Put shared helpers in `src/lib/`.
- Put shared types in `src/types/`.
- Put Vitest unit and component tests in `src/__tests__/`.
- Put Cypress end-to-end tests in `cypress/e2e/`.
- Do not hand-edit generated output in `dist/`, `coverage/`, `artifacts/`, `cache/`, `cypress/screenshots/`, or `cypress/videos/` unless the task explicitly requires it.

## TypeScript Conventions

- Use ES module syntax.
- Prefer named exports over default exports.
- Favor type-safe code and prefer `unknown` over `any` when possible.
- Avoid `any` unless it is localized and clearly justified.
- Use descriptive names for variables and functions.
- Use early returns to keep control flow flat and readable.
- Follow existing local patterns for `type` versus `interface`.
- Add explicit return types only when they improve clarity or are required.

## React Conventions

- Use named exports for components.
- Prefer `export function ComponentName()` for components.
- Do not use `React.FC`.
- Prefix event handlers with `handle`, for example `handleClick`.
- Give non-trivial props a dedicated `<ComponentName>Props` type.
- Keep components focused on rendering and local UI state.
- Move shared business logic into hooks, stores, services, or `src/lib/` helpers when that matches existing patterns.

## Quality Standards

- Match existing repository patterns, naming, and organization.
- Write reusable, modular, and maintainable code.
- Prefer extending or refactoring existing code over adding parallel implementations.
- Remove dead or irrelevant code when your change makes it obsolete. Don't submit dead and irrelevant stuff.
- Prefer clean fixes over compatibility hacks, fallback layers, or legacy shims. Do not develop backward compatibilities.
- Add comments only when they explain non-obvious reasoning or constraints. Only meaningful comments are allowed.
- Keep single-line comments lowercase when you need them.

## Testing Standards

- Test as much as you can.
- Add or update automated tests for every production code change.
- Documentation-only changes do not require tests.
- Do not weaken tests just to make failures disappear.
- Use Vitest and Testing Library for unit and component behavior.
- Use Cypress for browser-level end-to-end behavior.
- For e2e flows that depend on chain data, prefer the local Hardhat node used by the current Cypress setup.
- Keep tests deterministic and behavior-focused.

## Validation Requirements

- ESLint must pass with zero errors and zero warnings.
- TypeScript, build, and runtime issues introduced by the change must be fixed before handoff. There should be no warnings.
- Default verification for code changes is:

```bash
npm run test
npm run build
```

- `npm run test` is the top-level verification command and includes lint, Vitest coverage, unit tests, and Cypress e2e coverage.
- We also suggest running a `trivy fs .` check to scan for vulnerabilities.
