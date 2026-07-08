# Architecture Blueprint

## System Overview
Richingness is a multi-platform Financial Operating System featuring a highly modular monorepo structure. It is designed to run consistently across Web, Mobile (iOS/Android), and Desktop (Windows/macOS/Linux).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          RICHINGNESS PLATFORM                                │
├──────────────┬──────────────┬──────────────────┬───────────────────────────┤
│  Android     │    iOS       │   Web (Next.js)  │   Desktop (Tauri v2)      │
│  (Expo RN)   │  (Expo RN)   │   App Router     │  Win / macOS / Linux      │
├──────────────┴──────────────┴──────────────────┴───────────────────────────┤
│                          SHARED PACKAGES LAYER                               │
│  budget-engine │ finance-engine │ ui │ design-system │ auth │ validation   │
│  sync │ ai │ charts │ notifications │ database │ shared                    │
├──────────────────────────┬───────────────────────────────────────────────────┤
│  LOCAL STORAGE (Offline) │            SYNC ENGINE                            │
│  Mobile/Desktop: SQLite  │  PowerSync (mobile) │ ElectricSQL (web)          │
│  Web: PGlite (WASM)      │  Outbox pattern │ HLC timestamps │ Op-log        │
├──────────────────────────┴───────────────────────────────────────────────────┤
│                         CLOUD LAYER (Supabase)                               │
│  PostgreSQL │ Auth │ Realtime (triggers only) │ Storage │ Edge Functions    │
│  Row-Level Security │ Logical Replication │ pg_cron │ pg_vault               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Architectural Decoupling Rules
1. **No Business Logic in UI**: Applications (`apps/*`) must only contain UI logic, routing, and configurations. All calculations, syncing algorithms, and database queries must reside in the shared packages (`packages/*`).
2. **Offline-First Storage**: Local clients read and write from their local databases (SQLite/PGlite) and never query Supabase directly for standard CRUD operations. Sync is handled asynchronously.
3. **Immutable Transactions**: Financial transactions cannot be mutated or deleted. Corrections are represented as credit/debit adjustment operations, preserving audit integrity.
4. **Platform Primitives**: The shared UI package (`packages/ui`) uses React Native primitives. NativeWind translates Tailwind styles to both Native platforms and CSS rules for the web.

## Technology Stack
- **Turborepo**: Task orchestration, remote caching.
- **pnpm**: Fast, disk-space efficient package manager with workspaces and catalogs.
- **Next.js 15 (App Router)**: Powers the web application.
- **Expo SDK 52 / React Native**: Powers the mobile application.
- **Tauri v2**: Packs the compiled Next.js export with a Rust-based desktop shell.
- **Drizzle ORM**: The unified ORM used across PostgreSQL (cloud), OP-SQLite (mobile), and PGlite WASM (web).
- **PowerSync & ElectricSQL**: Hybrid syncing engine designed to synchronise cloud PostgreSQL to client databases.
