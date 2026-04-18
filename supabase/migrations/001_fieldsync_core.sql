-- FieldSync Core Schema
-- Multi-tenant: every table has company_id
-- Version: 001 | Date: 2026-04-18

-- ─── Companies ───────────────────────────────────────────────────────────────
-- Each paying customer is a company (tenant)

CREATE TABLE companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  industry text DEFAULT 'pool_service'
    CHECK (industry IN ('pool_service', 'hvac', 'pest_control', 'lawn_care', 'cleaning', 'other')),
  plan text DEFAULT 'starter'
    CHECK (plan IN ('starter', 'growth', 'scale', 'enterprise')),
  active boolean DEFAULT true,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now()
);

-- ─── CRM Connections ──────────────────────────────────────────────────────────

CREATE TABLE crm_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  crm_type text NOT NULL
    CHECK (crm_type IN ('serviceautopilot', 'jobber', 'housecallpro', 'servicetitan', 'skimmer', 'manual')),
  credentials_encrypted jsonb,   -- AES-256 encrypted at rest via Supabase Vault
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'syncing', 'success', 'error', 'disabled')),
  sync_error text,
  created_at timestamptz DEFAULT now()
);

-- ─── Clients (synced from CRM) ────────────────────────────────────────────────

CREATE TABLE fs_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  external_id text NOT NULL,
  crm_type text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  monthly_rate numeric(10,2),
  service_frequency text,
  tags text[],
  active boolean DEFAULT true,
  last_service_date date,
  churn_risk_score int DEFAULT 0 CHECK (churn_risk_score BETWEEN 0 AND 100),
  synced_at timestamptz DEFAULT now(),
  UNIQUE(company_id, crm_type, external_id)
);

CREATE INDEX idx_fs_clients_company ON fs_clients(company_id);
CREATE INDEX idx_fs_clients_active ON fs_clients(company_id, active);
CREATE INDEX idx_fs_clients_churn ON fs_clients(company_id, churn_risk_score DESC);

-- ─── Technicians ─────────────────────────────────────────────────────────────

CREATE TABLE fs_techs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  external_id text,
  name text NOT NULL,
  email text,
  phone text,
  active boolean DEFAULT true,
  completion_rate numeric(5,2),  -- % of jobs completed (vs skipped)
  qc_pass_rate numeric(5,2),     -- % of photos passing QC
  avg_rating numeric(3,2),       -- customer satisfaction 1-5
  UNIQUE(company_id, external_id)
);

CREATE INDEX idx_fs_techs_company ON fs_techs(company_id);

-- ─── Jobs ─────────────────────────────────────────────────────────────────────

CREATE TABLE fs_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  external_id text NOT NULL,
  crm_type text NOT NULL,
  client_id uuid REFERENCES fs_clients(id),
  tech_id uuid REFERENCES fs_techs(id),
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  status text DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled')),
  service_address text,
  service_type text,
  amount numeric(10,2),
  photo_urls text[],
  photo_qc_status text
    CHECK (photo_qc_status IN ('pass', 'fail', 'pending', 'not_required')),
  notes text,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(company_id, crm_type, external_id)
);

CREATE INDEX idx_fs_jobs_company_date ON fs_jobs(company_id, scheduled_date DESC);
CREATE INDEX idx_fs_jobs_tech ON fs_jobs(tech_id, scheduled_date);
CREATE INDEX idx_fs_jobs_client ON fs_jobs(client_id);
CREATE INDEX idx_fs_jobs_status ON fs_jobs(company_id, status);

-- ─── Invoices / AR ───────────────────────────────────────────────────────────

CREATE TABLE fs_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  external_id text NOT NULL,
  crm_type text NOT NULL,
  client_id uuid REFERENCES fs_clients(id),
  amount numeric(10,2) NOT NULL,
  amount_paid numeric(10,2) DEFAULT 0,
  balance numeric(10,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
  status text DEFAULT 'open'
    CHECK (status IN ('paid', 'open', 'overdue', 'voided')),
  issued_date date,
  due_date date,
  paid_date date,
  days_past_due int GENERATED ALWAYS AS (
    CASE
      WHEN paid_date IS NULL AND due_date IS NOT NULL AND due_date < CURRENT_DATE
      THEN GREATEST(0, CURRENT_DATE - due_date)
      ELSE 0
    END
  ) STORED,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(company_id, crm_type, external_id)
);

CREATE INDEX idx_fs_invoices_company ON fs_invoices(company_id);
CREATE INDEX idx_fs_invoices_status ON fs_invoices(company_id, status);
CREATE INDEX idx_fs_invoices_client ON fs_invoices(client_id);
CREATE INDEX idx_fs_invoices_overdue ON fs_invoices(company_id, days_past_due DESC)
  WHERE status = 'overdue';

-- ─── KPI Snapshots (daily) ────────────────────────────────────────────────────

CREATE TABLE kpi_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  revenue_today numeric(10,2) DEFAULT 0,
  revenue_mtd numeric(10,2) DEFAULT 0,
  jobs_scheduled int DEFAULT 0,
  jobs_completed int DEFAULT 0,
  jobs_skipped int DEFAULT 0,
  ar_current numeric(10,2) DEFAULT 0,
  ar_30 numeric(10,2) DEFAULT 0,
  ar_60 numeric(10,2) DEFAULT 0,
  ar_90_plus numeric(10,2) DEFAULT 0,
  new_leads int DEFAULT 0,
  quotes_sent int DEFAULT 0,
  quotes_converted int DEFAULT 0,
  new_clients int DEFAULT 0,
  churned_clients int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, date)
);

CREATE INDEX idx_kpi_company_date ON kpi_snapshots(company_id, date DESC);

-- ─── Alerts ───────────────────────────────────────────────────────────────────

CREATE TABLE fs_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL
    CHECK (type IN ('ar_overdue', 'qc_fail', 'missed_call', 'lead_stalled', 'job_skipped',
                    'tech_performance', 'churn_risk', 'route_inefficiency', 'other')),
  priority text DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  detail text,
  entity_type text
    CHECK (entity_type IN ('client', 'job', 'invoice', 'tech', 'route', null)),
  entity_id uuid,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fs_alerts_company ON fs_alerts(company_id, resolved, created_at DESC);
CREATE INDEX idx_fs_alerts_priority ON fs_alerts(company_id, priority, resolved);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Every table locked down — tenants can only see their own company's data

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_techs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fs_alerts ENABLE ROW LEVEL SECURITY;

-- Note: Full RLS policies added in migration 002 after auth layer is configured.
-- Pattern will be:
--   CREATE POLICY "company_isolation" ON [table]
--   FOR ALL USING (company_id = auth.jwt()->>'company_id');
