-- 1. ENUMS (if any, though we can use text checks or just text)
-- 2. TABLES

-- A. accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'checking', 'savings', 'credit', 'investment', 'crypto', 'loan', 'asset', 'liability')),
  currency_code text NOT NULL,
  hlc_timestamp text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- B. budget_categories
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  rollover_mode text NOT NULL CHECK (rollover_mode IN ('none', 'carry', 'recover')),
  budget_amount numeric NOT NULL DEFAULT 0,
  priority smallint NOT NULL DEFAULT 1,
  is_income boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  hlc_timestamp text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- C. ledger_operations
CREATE TABLE IF NOT EXISTS public.ledger_operations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT')),
  amount numeric NOT NULL DEFAULT 0,
  currency_code text NOT NULL,
  exchange_rate numeric NOT NULL DEFAULT 1.0,
  date timestamptz NOT NULL,
  reference_id uuid,
  hlc_timestamp text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- D. saving_goals
CREATE TABLE IF NOT EXISTS public.saving_goals (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  monthly_contribution numeric NOT NULL DEFAULT 0,
  target_date timestamptz,
  category_id uuid REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  hlc_timestamp text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- E. devices
CREATE TABLE IF NOT EXISTS public.devices (
  device_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_version text NOT NULL,
  device_name text NOT NULL,
  app_version text NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  sync_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  hlc_timestamp text NOT NULL
);

-- F. user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'light',
  language text NOT NULL DEFAULT 'en',
  currency_code text NOT NULL DEFAULT 'USD',
  number_format text NOT NULL DEFAULT 'en-US',
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  layout_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  hlc_timestamp text NOT NULL
);

-- G. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  changes text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  device_id text NOT NULL,
  hlc_timestamp text NOT NULL
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS budget_categories_user_id_idx ON public.budget_categories(user_id);
CREATE INDEX IF NOT EXISTS ledger_operations_user_id_idx ON public.ledger_operations(user_id);
CREATE INDEX IF NOT EXISTS ledger_operations_account_id_idx ON public.ledger_operations(account_id);
CREATE INDEX IF NOT EXISTS saving_goals_user_id_idx ON public.saving_goals(user_id);
CREATE INDEX IF NOT EXISTS devices_user_id_idx ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget categories" ON public.budget_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ledger operations" ON public.ledger_operations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saving goals" ON public.saving_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices" ON public.devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own audit logs" ON public.audit_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. SCHEMA VERIFICATION RPC
CREATE OR REPLACE FUNCTION public.verify_schema() 
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  missing_tables text[] := '{}';
  missing_columns jsonb := '{}'::jsonb;
  missing_indexes text[] := '{}';
  missing_rls text[] := '{}';
  
  expected_tables text[] := ARRAY['accounts', 'budget_categories', 'ledger_operations', 'saving_goals', 'devices', 'user_preferences', 'audit_logs'];
  tbl text;
  col record;
BEGIN
  -- Check Tables and Columns
  FOREACH tbl IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    ELSE
      -- Check RLS
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = tbl AND c.relrowsecurity = true
      ) THEN
        missing_rls := array_append(missing_rls, tbl);
      END IF;
    END IF;
  END LOOP;
  
  -- Check Indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'accounts_user_id_idx') THEN missing_indexes := array_append(missing_indexes, 'accounts_user_id_idx'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'budget_categories_user_id_idx') THEN missing_indexes := array_append(missing_indexes, 'budget_categories_user_id_idx'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ledger_operations_user_id_idx') THEN missing_indexes := array_append(missing_indexes, 'ledger_operations_user_id_idx'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'saving_goals_user_id_idx') THEN missing_indexes := array_append(missing_indexes, 'saving_goals_user_id_idx'); END IF;
  
  result := jsonb_build_object(
    'valid', (array_length(missing_tables, 1) IS NULL) AND (array_length(missing_indexes, 1) IS NULL) AND (array_length(missing_rls, 1) IS NULL),
    'missing_tables', missing_tables,
    'missing_indexes', missing_indexes,
    'missing_rls', missing_rls
  );
  
  RETURN result;
END;
$$;
