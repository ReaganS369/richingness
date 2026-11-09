-- Create the Richingness schema
CREATE SCHEMA IF NOT EXISTS richingness;

-- 1. Accounts
CREATE TABLE richingness.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    hlc_timestamp TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 2. Budget Categories
CREATE TABLE richingness.budget_categories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES richingness.budget_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    rollover_mode TEXT NOT NULL,
    budget_amount TEXT NOT NULL,
    priority INTEGER NOT NULL,
    is_income BOOLEAN NOT NULL,
    is_hidden BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    hlc_timestamp TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 3. Ledger Operations
CREATE TABLE richingness.ledger_operations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES richingness.accounts(id) ON DELETE CASCADE,
    to_account_id TEXT REFERENCES richingness.accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    exchange_rate NUMERIC NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    reference_id TEXT,
    hlc_timestamp TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 4. Saving Goals
CREATE TABLE richingness.saving_goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount TEXT NOT NULL,
    current_amount TEXT NOT NULL,
    monthly_contribution TEXT NOT NULL,
    target_date TIMESTAMPTZ,
    category_id TEXT REFERENCES richingness.budget_categories(id) ON DELETE SET NULL,
    hlc_timestamp TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 5. Devices
CREATE TABLE richingness.devices (
    device_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_version TEXT NOT NULL,
    device_name TEXT NOT NULL,
    app_version TEXT NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    sync_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    hlc_timestamp TEXT NOT NULL
);

-- 6. User Preferences
CREATE TABLE richingness.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL,
    language TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    number_format TEXT NOT NULL,
    notification_preferences JSONB NOT NULL,
    layout_preferences JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    hlc_timestamp TEXT NOT NULL
);

-- 7. Audit Logs
CREATE TABLE richingness.audit_logs (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    changes JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,
    hlc_timestamp TEXT NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE richingness.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.ledger_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE richingness.audit_logs ENABLE ROW LEVEL SECURITY;

-- CREATE SECURITY POLICIES
CREATE POLICY "Users can manage their own accounts" ON richingness.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON richingness.budget_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own ledger" ON richingness.ledger_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goals" ON richingness.saving_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own devices" ON richingness.devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own preferences" ON richingness.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own audit logs" ON richingness.audit_logs FOR ALL USING (auth.uid() = user_id);

-- Expose schema to REST API if necessary
-- NOTE: In Supabase dashboard, `richingness` schema will need to be added to "Exposed schemas" in API settings.


