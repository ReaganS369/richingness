# High-Level Roadmap

## Phase 0: Foundation (Current Phase)
- Monorepo structure initialization (Turborepo + pnpm workspaces).
- Shared package skeletons setup.
- Core design system values and colors established.
- Identity, Events, Sync, Database interfaces.
- Core linter/formatter/husky configurations.

## Phase 1: Core Domain Engines
- Implementation of the `@repo/module-budget` (Allocation, Recovery optimization, Rollovers).
- Implementation of the `@repo/module-finance` (Net Worth, Portfolio CAGR, Bills tracking).
- Core unit test coverage (100% targeting code formulas).

## Phase 2: Web Interface & Local Sync
- Setup Next.js 15 Web Application.
- Design responsive layouts.
- Integrate PGlite WASM databases.
- Setup ElectricSQL synchronization layer.

## Phase 3: Mobile Applications & Offline Engine
- Setup Expo SDK 52 workspace.
- Setup PowerSync schemas and sync pipelines.
- Integrate OP-SQLite secure storage with SQLCipher.
- Port cross-platform UI components.

## Phase 4: Advanced Product Features
- Invoicing, Projects tracking, Lending registers.
- CSV/SMS local transaction import engine.
- AI Heuristic Insights engine.
- Tauri Desktop shells compile setups.

## Phase 5: Production Launch
- CI/CD build scripts finalized.
- App Store and Play Store submissions.
- Public platform launch.
