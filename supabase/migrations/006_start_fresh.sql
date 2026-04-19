-- ============================================================
-- Migration 006: Start Fresh — Manual CRM for businesses with no existing software
-- ============================================================
-- For businesses that use spreadsheets, paper, or nothing at all.
-- These tables make FieldSync itself the CRM.
-- All Sophia intelligence (scoring, AR, routing, campaigns) runs identically
-- whether data comes from SA/Jobber/HousecallPro or from these manual tables.
-- ============================================================

-- ─── Manual Clients ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manual_clients (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id          uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identity
  name                text          NOT NULL,
  email               text,
  phone               text,

  -- Address (stored flat for route optimizer geocoding)
  address             text,
  city                text,
  state               text,
  zip                 text,

  -- Service config
  service_type        text,                                -- 'Pool Service', 'HVAC', etc.
  monthly_rate        numeric(10,2),
  service_frequency   text          DEFAULT 'weekly',      -- 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  preferred_day       text[],                              -- ['monday', 'thursday']
  assigned_tech_id    uuid          REFERENCES fs_techs(id) ON DELETE SET NULL,

  -- Status
  active              boolean       DEFAULT true,
  notes               text,

  -- Lifecycle
  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_clients_company_id_idx ON manual_clients (company_id);
CREATE INDEX IF NOT EXISTS manual_clients_active_idx ON manual_clients (company_id, active);

-- ─── Manual Jobs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manual_jobs (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id          uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id           uuid          NOT NULL REFERENCES manual_clients(id) ON DELETE CASCADE,
  tech_id             uuid          REFERENCES fs_techs(id) ON DELETE SET NULL,

  -- Schedule
  scheduled_date      date          NOT NULL,
  status              text          DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled'

  -- Service
  service_type        text,
  notes               text,
  photos              text[],                              -- URLs / storage paths
  amount              numeric(10,2),

  -- Completion
  completed_at        timestamptz,
  checklist_data      jsonb,                              -- flexible checklist responses

  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_jobs_company_id_idx ON manual_jobs (company_id);
CREATE INDEX IF NOT EXISTS manual_jobs_client_id_idx ON manual_jobs (client_id);
CREATE INDEX IF NOT EXISTS manual_jobs_scheduled_date_idx ON manual_jobs (company_id, scheduled_date);
CREATE INDEX IF NOT EXISTS manual_jobs_tech_id_idx ON manual_jobs (tech_id, scheduled_date);

-- ─── Manual Invoices ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manual_invoices (
  id                      uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id              uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id               uuid          NOT NULL REFERENCES manual_clients(id) ON DELETE CASCADE,
  job_id                  uuid          REFERENCES manual_jobs(id) ON DELETE SET NULL,

  -- Amounts
  amount                  numeric(10,2) NOT NULL,
  amount_paid             numeric(10,2) DEFAULT 0,

  -- Status
  status                  text          DEFAULT 'open', -- 'open' | 'paid' | 'overdue' | 'voided'

  -- Dates
  issued_date             date          DEFAULT CURRENT_DATE,
  due_date                date,
  paid_date               date,

  -- Payment
  stripe_payment_intent_id text,                          -- for Stripe-collected payments
  payment_method          text,                           -- 'stripe' | 'check' | 'cash' | 'ach'
  payment_notes           text,

  created_at              timestamptz   DEFAULT now(),
  updated_at              timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_invoices_company_id_idx ON manual_invoices (company_id);
CREATE INDEX IF NOT EXISTS manual_invoices_client_id_idx ON manual_invoices (client_id);
CREATE INDEX IF NOT EXISTS manual_invoices_status_idx ON manual_invoices (company_id, status);
CREATE INDEX IF NOT EXISTS manual_invoices_due_date_idx ON manual_invoices (company_id, due_date) WHERE status IN ('open', 'overdue');

-- ─── Auto-status update trigger ──────────────────────────────────────────────
-- Automatically marks invoices as 'overdue' when past due_date.

CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.due_date IS NOT NULL
     AND NEW.due_date < CURRENT_DATE
     AND NEW.status = 'open'
     AND (NEW.amount - COALESCE(NEW.amount_paid, 0)) > 0
  THEN
    NEW.status := 'overdue';
  END IF;

  IF (NEW.amount - COALESCE(NEW.amount_paid, 0)) <= 0 AND NEW.status != 'voided' THEN
    NEW.status := 'paid';
    IF NEW.paid_date IS NULL THEN NEW.paid_date := CURRENT_DATE; END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manual_invoices_status_trigger ON manual_invoices;
CREATE TRIGGER manual_invoices_status_trigger
  BEFORE INSERT OR UPDATE ON manual_invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- ─── Updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manual_clients_updated_at ON manual_clients;
CREATE TRIGGER manual_clients_updated_at
  BEFORE UPDATE ON manual_clients
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS manual_jobs_updated_at ON manual_jobs;
CREATE TRIGGER manual_jobs_updated_at
  BEFORE UPDATE ON manual_jobs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── Row-level security ───────────────────────────────────────────────────────
-- Enforces company-level isolation: a company can only see its own rows.

ALTER TABLE manual_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_invoices ENABLE ROW LEVEL SECURITY;

-- Companies see only their own manual clients
CREATE POLICY manual_clients_company_isolation
  ON manual_clients FOR ALL
  USING (company_id = (
    SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1
  ));

-- Companies see only their own manual jobs
CREATE POLICY manual_jobs_company_isolation
  ON manual_jobs FOR ALL
  USING (company_id = (
    SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1
  ));

-- Companies see only their own manual invoices
CREATE POLICY manual_invoices_company_isolation
  ON manual_invoices FOR ALL
  USING (company_id = (
    SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1
  ));

-- ─── Onboarding state tracking ────────────────────────────────────────────────
-- Track where a company is in the Start Fresh flow so they can resume.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS onboarding_mode    text DEFAULT 'crm',      -- 'crm' | 'start_fresh'
  ADD COLUMN IF NOT EXISTS onboarding_step    integer DEFAULT 1,       -- 1-5
  ADD COLUMN IF NOT EXISTS onboarding_goals   text[],                  -- selected goal IDs
  ADD COLUMN IF NOT EXISTS onboarding_done    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS crm_type           text;                    -- 'serviceautopilot' | 'jobber' | 'manual' | etc.

-- ─── Helper view: unified client roster ───────────────────────────────────────
-- Used by Sophia's scoring engine — works regardless of CRM type.
-- Query this instead of CRM-specific tables for a normalized client list.

CREATE OR REPLACE VIEW v_all_clients AS
  -- Manual clients (Start Fresh)
  SELECT
    mc.company_id,
    mc.id                           AS client_id,
    'manual'                        AS source,
    mc.name,
    mc.email,
    mc.phone,
    mc.address,
    mc.city,
    mc.state,
    mc.zip,
    mc.service_type,
    mc.monthly_rate,
    mc.service_frequency,
    mc.active,
    mc.created_at,
    NULL::timestamptz               AS last_service_at
  FROM manual_clients mc

  UNION ALL

  -- CRM-synced clients (ServiceAutopilot, Jobber, etc.)
  SELECT
    fc.company_id,
    fc.id                           AS client_id,
    fc.crm_type                     AS source,
    fc.name,
    fc.email,
    fc.phone,
    fc.address,
    fc.city,
    fc.state,
    fc.zip,
    fc.service_type,
    fc.monthly_rate,
    fc.service_frequency,
    fc.active,
    fc.created_at,
    fc.last_service_at
  FROM fs_clients fc;

COMMENT ON VIEW v_all_clients IS
  'Unified client view across manual (Start Fresh) and CRM-synced sources. Used by Sophia scoring engine.';
