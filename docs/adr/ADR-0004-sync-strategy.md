# ADR 0004: Sync Strategy

## Status
Approved

## Context
When an offline device goes online, it needs to replicate local updates to the server and pull new mutations from other clients without creating consistency issues.

## Decision
We implement a hybrid synchronization structure using **PowerSync** (for SQLite mobile storage) and **ElectricSQL** (for Web PGlite shapes). Both target a single cloud Supabase Postgres database.

- **PowerSync**: Leverages logical replication streams to sync subsets of tables to local SQLite files based on user workspace permissions.
- **ElectricSQL**: Pulls reactive shapes (filtered tables) directly into WASM PGlite caches inside web clients.
- **Outbox Queue**: Local writes are added to a `pending_operations` outbox table on the client. When online, the client pushes outstanding items in order of creation (via Hybrid Logical Clock timestamps), then clears the queue upon receiving server confirmation.

## Consequences
- **Automatic Reconnection**: Libraries auto-handle connections, retry intervals, and synchronization states (Syncing, Offline, Synced).
- **Conflict Handling**: Concurrent changes on independent data records (like budgets or categories) resolve using Last-Write-Wins based on HLC timestamps. Money entries resolve commutatively via operation log appends.
