# Database Blueprint

This document specifies the database schemas, rules, conventions, and sync requirements for the Richingness Platform. 

## Architectural Rules
1. **Paise/Cent representation**: All financial amounts are stored as standard `BIGINT` integers corresponding to the currency's lowest denomination (e.g., paise for INR: ₹100.50 is stored as `10050`). No floating-point or localized money types.
2. **UUID v7**: Every record uses a time-ordered UUID v7 generated on the client to avoid sync collisions and allow sorting by creation order naturally.
3. **No Direct Mutation on Ledgers**: The `operation_log` table is append-only. To modify a transaction, write a compensating ledger entry.
4. **Soft Deletes**: Synced tables use `deleted_at TIMESTAMPTZ` (nullable). Queries must filter by `deleted_at IS NULL`.
5. **Sync Metadata Mixin**: All syncable tables must implement the sync fields: `sync_id`, `client_id`, `hlc_timestamp`, `server_version`, `created_at`, `updated_at`, `synced_at`, `deleted_at`.

## Core Tables
- `users`: Identity records.
- `user_preferences`: Formatting and default currency setups.
- `accounts`: Bank, Cash, Card, UPI, and Investment account wrappers.
- `account_balances`: Materialized balance caches updated via triggers.
- `budget_categories`: Tree node using adjacency lists (`parent_id`) and rollover configurations.
- `budget_periods`: Monthly timeline frames (`year` & `month`).
- `budget_allocations`: Assigned amounts per category and period.
- `envelope_snapshots`: Periodic closing snapshot records for rollover computation.
- `operation_log`: Immutable transactions ledger containing atomic debit/credit operations.
- `transactions`: Human-readable user-facing transactions.
- `goals`: Saving targets linked to categories.
- `bills`: Recurring billing schedules.
- `recovery_events`: Log of Smart Recovery balance transfers.

## SQL Schema & Triggers
The tables use Row-Level Security (RLS) policies gated by `user_id`. Direct writes on client databases sync automatically via the local `pending_operations` outbox.

An auto-update Postgres function keeps `account_balances` up to date:
```sql
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    UPDATE account_balances
    SET cleared_balance = cleared_balance + CASE WHEN NEW.cleared_at IS NOT NULL THEN NEW.amount ELSE 0 END,
        pending_balance = pending_balance + CASE WHEN NEW.cleared_at IS NULL THEN NEW.amount ELSE 0 END
    WHERE account_id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
