# ADR 0003: Immutable Event Ledger

## Status
Approved

## Context
Financial databases face validation errors, audit trail missing contexts, and data loss during concurrent offline edits if standard CRUD mutative queries (`UPDATE` / `DELETE` fields) are applied. In financial systems, the history of how a balance was reached is as important as the balance itself.

## Decision
We implement an **immutable append-only financial ledger** inside the `operation_log` table. 

- Financial updates and deletes are represented as new compensating operations (debit/credit adjustments).
- Every debit, credit, allocation, or rollover is logged as an atomic operation with time-ordered UUID v7 IDs.
- User balances are computed by summing the operations log, rather than modifying direct fields.
- For high-performance reads, we cache aggregated balances inside `account_balances` and `envelope_snapshots` using database triggers.

## Consequences
- **Audit Integrity**: Complete financial audit trail maintained forever.
- **Sync Safety**: Operation logs are commutative, meaning they are easier to sync without complex conflict resolution logic (they are simply appended).
- **Performance**: High insertion speed. Balance lookup is kept fast through materialized trigger caches.
