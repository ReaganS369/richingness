# Coding Standards

## 1. TypeScript Strictness
- Enforce strict mode (`strict: true`) in all `tsconfig.json` configurations.
- Avoid using `any`. Use `unknown` with type guards or `z.infer` schemas from `@repo/validation`.
- Explicitly declare return types for public functions, custom hooks, and API endpoints.

## 2. Architectural Conventions
- **Clean Architecture**: Decouple domain packages from platform UI modules. Logic packages must not contain imports from UI frameworks (`react`, `react-native`, etc.).
- **Immutability**: Avoid mutating parameters in-place. Prefer pure functions, object destructuring, and array operations.
- **Composition over Inheritance**: Assemble complex functionalities by piping smaller modules rather than creating class inheritance trees.

## 3. Organizing Code
- **Feature-first organization**: Group components, pages, schemas, and hooks related to the same domain close to each other.
- **Barrel Exports**: Use clean exports via `index.ts` files to make the package consumable without deep file paths.
- **Zero Duplicate Business Logic**: Calculations for interest, rollover formulas, recovery heuristics, and validation rules must stay inside the package layers.

## 4. Error Handling
- Use typed error classes extending from a base `AppError` defined in `@repo/shared`.
- All async database queries and fetch commands should be wrapped in robust try-catch blocks with standardized logging.
- Return user-friendly error codes (`ERROR_SYNC_FAILED`, `ERROR_INSUFFICIENT_FUNDS`) rather than exposing raw raw stack traces.
