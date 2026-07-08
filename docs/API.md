# API Specification

## Supabase Edge Functions
All edge functions require authentication using standard bearer JWTs (`Authorization: Bearer <supabase_jwt>`). They run in the Deno environment and execute database logic via the direct Postgres pooler connection.

### `/sync/pull` (POST)
Invoked by clients (like Tauri custom sync outbox or Web app backup loops) to fetch database changes.
- **Request Headers**:
  - `Authorization: Bearer <jwt>`
- **Request Body**:
  ```json
  {
    "lastSyncAt": "2026-07-08T12:00:00.000Z",
    "tables": ["accounts", "budget_categories", "transactions"],
    "clientId": "client-device-uuid-1234",
    "limit": 100
  }
  ```
- **Response Body**:
  ```json
  {
    "changes": {
      "transactions": [
        { "id": "tx-uuid-1", "amount": 50000, "updated_at": "..." }
      ]
    },
    "serverTime": "2026-07-08T12:05:00.000Z",
    "hasMore": false
  }
  ```

### `/sync/push` (POST)
Pushes a batch of locally queued operations from the client.
- **Request Body**:
  ```json
  {
    "clientId": "client-device-uuid-1234",
    "operations": [
      {
        "table": "transactions",
        "operation": "insert",
        "data": { "id": "tx-uuid-2", "amount": 25000 },
        "clientVersion": 10
      }
    ]
  }
  ```

### `/import/csv` (POST)
Parses a multipart CSV upload and maps transaction columns.
- **Response Body**: An array of mapped but uncommitted transactions ready for user review and classification.

### `/import/sms` (POST)
Parses transaction alert messages (e.g. UPI debit/credit notifications) to prefill the manual entry form.
