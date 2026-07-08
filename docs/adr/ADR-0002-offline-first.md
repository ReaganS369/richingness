# ADR 0002: Offline-First Architecture

## Status
Approved

## Context
A financial operating system must remain functional regardless of cellular or Wi-Fi network availability. Querying server APIs on every transaction creation creates high latency, bad user experiences, and renders the app unusable in offline scenarios.

## Decision
All applications must operate on an **offline-first local database**. The cloud acts as a sync target and backup, not the runtime query handler.

### Local Database Selections
- **Mobile (React Native)**: OP-SQLite (supports fast native threads and SQLCipher for data encryption).
- **Desktop (Tauri)**: Native SQLite wrapped in `tauri-plugin-sql`.
- **Web (Next.js)**: PGlite WASM (runs a fully functional PostgreSQL database in-browser).

## Consequences
- **Performance**: Reads and writes take less than 5ms (no network latency).
- **Complexity**: Conflict resolution and delta synchronization logic must be handled on the client.
- **Size**: Web bundle size increases slightly due to WASM PGlite modules.
