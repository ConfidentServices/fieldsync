-- FieldSync Extensions Schema
-- Migration 002 | Date: 2026-04-18
-- Adds: billing retention, Sofia AI, approval gates, ROI tracking,
--       visit completion, report config, route optimization cache

-- ─── Geocode Cache ────────────────────────────────────────────────────────────
-- Cache Google Geocoding results — addresses rarely change, $5/1000 calls

CREATE TABLE geocode_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  address_normalized text UNIQUE NOT NULL, -- lowercase, stripped
  address_raw text NOT NULL,
  lat numeric(10,7) NOT NULL,
  lng numeric(10,7) NOT NULL,
  confidence text,                          -- 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER'
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

CREATE INDEX idx_geocode_address ON geocode_cache(address_normalized);

-- ─── Route Analyses ───────────────────────────────────────────────────────────
-- Stored route optimization results for each tech/day

CREATE TABLE route_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  tech_id uuid REFERENCES fs_techs(id),
  analysis_date date NOT NULL,
  job_count int NOT NULL DEFAULT 0,
  current_miles numeric(8,2),
  optimized_miles numeric(8,2),
  miles_saved numeric(8,2) GENERATED ALWAYS AS
    (GREATEST(0, current_miles - optimized_miles)) STORED,
  estimated_fuel_saved numeric(8,2) GENERATED ALWAYS AS
    (GREATEST(0, current_miles - optimized_miles) * 0.21) STORED,
  estimated_time_saved_min int,             -- minutes
  annualized_savings numeric(10,2),         -- miles_saved * 250 * $0.21
  current_order jsonb,                      -- array of job IDs in current order
  optimized_order jsonb,                    -- array of job IDs in optimized order
  google_maps_link text,                    -- directions URL for tech
  approved_at timestamptz,
  approved_by text,
  sms_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, tech_id, analysis_date)
);

CREATE INDEX idx_route_analyses_company_date ON route_analyses(company_id, analysis_date DESC);

-- ─── Billing Retention — FieldSync Recover ───────────────────────────────────

-- Dunning / collection sequences per client invoice
CREATE TABLE collection_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES fs_clients(id) NOT NULL,
  invoice_id uuid REFERENCES fs_invoices(id),
  stripe_invoice_id text,
  status text DEFAULT 'active'
    CHECK (status IN ('active', 'resolved', 'escalated', 'hold', 'cancelled', 'payment_plan')),
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  last_attempt_at timestamptz,
  attempt_count int DEFAULT 0,
  max_attempts int DEFAULT 5,
  decline_code text,
  decline_category text CHECK (decline_category IN ('soft', 'hard', 'card_update', 'unknown')),
  next_action_at timestamptz,
  service_hold_triggered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_collection_sequences_company ON collection_sequences(company_id, status);
CREATE INDEX idx_collection_sequences_next_action ON collection_sequences(next_action_at)
  WHERE status = 'active';

-- Payment recovery events log (every attempt, notification, state change)
CREATE TABLE payment_recovery_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  sequence_id uuid REFERENCES collection_sequences(id) ON DELETE CASCADE,
  client_id uuid REFERENCES fs_clients(id) NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN (
      'payment_failed', 'payment_succeeded', 'retry_attempted', 'retry_succeeded',
      'card_auto_updated', 'card_expired_warning', 'email_sent', 'sms_sent',
      'email_opened', 'link_clicked', 'payment_method_updated',
      'service_hold_initiated', 'service_hold_lifted',
      'payment_plan_offered', 'payment_plan_accepted', 'payment_plan_declined',
      'cancellation_intercepted', 'save_offer_sent', 'save_accepted', 'churned',
      'winback_sent', 'owner_notified', 'manual_override'
    )),
  channel text CHECK (channel IN ('stripe', 'email', 'sms', 'push', 'manual')),
  amount_cents int,
  decline_code text,
  template_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recovery_events_sequence ON payment_recovery_events(sequence_id, created_at);
CREATE INDEX idx_recovery_events_company ON payment_recovery_events(company_id, created_at DESC);

-- Payment plans
CREATE TABLE payment_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES fs_clients(id) NOT NULL,
  total_amount_cents int NOT NULL,
  installment_count int NOT NULL DEFAULT 2,
  status text DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  installments jsonb NOT NULL,              -- [{amount_cents, due_date, paid_at, stripe_pi_id}]
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_payment_plans_company ON payment_plans(company_id, status);

-- ─── Sofia AI — Natural Language Query Engine ─────────────────────────────────

-- Every query logged for cost guardrails + audit
CREATE TABLE ai_queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id text,                             -- supabase auth user id
  query_text text NOT NULL,
  response_text text,
  model text DEFAULT 'gpt-4o-mini',
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  total_tokens int GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  cost_cents int DEFAULT 0,                 -- tracked to the cent
  latency_ms int,
  was_blocked boolean DEFAULT false,        -- true = budget hard stop
  block_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_queries_company_date ON ai_queries(company_id, created_at DESC);
CREATE INDEX idx_ai_queries_daily_cost ON ai_queries(company_id, (created_at::date), cost_cents);

-- Daily AI budget tracking (denormalized for fast budget checks)
CREATE TABLE ai_daily_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  queries_count int DEFAULT 0,
  total_cost_cents int DEFAULT 0,
  budget_limit_cents int NOT NULL,          -- Starter: 2000, Growth: 10000, Scale: -1 (unlimited)
  budget_exhausted boolean DEFAULT false,
  exhausted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, date)
);

CREATE INDEX idx_ai_daily_budgets_lookup ON ai_daily_budgets(company_id, date);

-- ─── Approval Gates — All Outreach Requires Approval ─────────────────────────

CREATE TABLE outreach_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  outreach_type text NOT NULL
    CHECK (outreach_type IN (
      'ar_dunning_email', 'ar_dunning_sms', 'save_offer', 'payment_plan_offer',
      'service_hold_notice', 'visit_completion_notification', 'review_request',
      'lead_nurture', 'winback', 'rate_increase', 'campaign', 'custom'
    )),
  recipient_client_id uuid REFERENCES fs_clients(id),
  recipient_name text NOT NULL,
  recipient_contact text,                   -- email or phone
  channel text CHECK (channel IN ('email', 'sms', 'push')),
  subject text,
  body_preview text,                        -- first 500 chars of message
  full_body text,
  sequence_id uuid REFERENCES collection_sequences(id),
  metadata jsonb,                           -- any extra context
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'sent', 'expired')),
  auto_approve_enabled boolean DEFAULT false, -- opt-in only
  approved_by text,
  approved_at timestamptz,
  rejected_reason text,
  expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_outreach_approvals_pending ON outreach_approvals(company_id, status, created_at DESC)
  WHERE status = 'pending';
CREATE INDEX idx_outreach_approvals_company ON outreach_approvals(company_id, created_at DESC);

-- Per-type auto-approve settings (opt-in per company)
CREATE TABLE outreach_auto_approve_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  outreach_type text NOT NULL,
  enabled boolean DEFAULT false,            -- default OFF — must explicitly enable
  enabled_by text,
  enabled_at timestamptz,
  max_amount_cents int,                     -- for discount offers: max auto-approve
  UNIQUE(company_id, outreach_type)
);

-- ─── Visit Completion & Customer Trust ────────────────────────────────────────

-- Configurable checklist per service type
CREATE TABLE visit_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,               -- 'pool_cleaning', 'hvac_maintenance', etc.
  name text NOT NULL,
  items jsonb NOT NULL,
  -- items: [{id, label, type: 'photo'|'checkbox'|'number'|'text', required: bool, order: int}]
  -- Example pool_cleaning: before_photo, chemistry_ph, chemistry_chlorine, equipment_check, after_photo
  active boolean DEFAULT true,
  send_notification_on_complete boolean DEFAULT true,
  hold_on_incomplete boolean DEFAULT true,  -- alert supervisor if items missing
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, service_type)
);

-- Per-job visit completion records
CREATE TABLE visit_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES fs_jobs(id) NOT NULL,
  checklist_id uuid REFERENCES visit_checklists(id),
  tech_id uuid REFERENCES fs_techs(id),
  items_completed jsonb,
  -- [{item_id, completed_at, value, photo_url, passed_qc}]
  all_required_complete boolean DEFAULT false,
  photo_count int DEFAULT 0,
  qc_status text DEFAULT 'pending'
    CHECK (qc_status IN ('pending', 'pass', 'fail', 'waived')),
  qc_notes text,
  qc_reviewed_by text,
  notification_queued boolean DEFAULT false,
  notification_sent_at timestamptz,
  supervisor_alerted boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id)
);

CREATE INDEX idx_visit_completions_company ON visit_completions(company_id, created_at DESC);
CREATE INDEX idx_visit_completions_qc ON visit_completions(company_id, qc_status)
  WHERE qc_status IN ('pending', 'fail');

-- Customer notifications (visit summaries sent to clients)
CREATE TABLE customer_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES fs_clients(id) NOT NULL,
  job_id uuid REFERENCES fs_jobs(id),
  completion_id uuid REFERENCES visit_completions(id),
  channel text CHECK (channel IN ('email', 'sms', 'push')),
  notification_type text
    CHECK (notification_type IN (
      'visit_complete', 'tech_en_route', 'review_request', 'next_visit_reminder', 'custom'
    )),
  subject text,
  body text,
  photo_urls text[],
  next_visit_date date,
  rating_requested boolean DEFAULT false,
  rating_received int CHECK (rating_received BETWEEN 1 AND 5),
  rated_at timestamptz,
  status text DEFAULT 'queued'
    CHECK (status IN ('queued', 'pending_approval', 'approved', 'sent', 'failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_customer_notifications_company ON customer_notifications(company_id, created_at DESC);
CREATE INDEX idx_customer_notifications_ratings ON customer_notifications(company_id, rating_received)
  WHERE rating_received IS NOT NULL;

-- ─── Weekly ROI Snapshots ────────────────────────────────────────────────────

CREATE TABLE weekly_roi_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,

  -- AR Recovery
  ar_recovered_cents int DEFAULT 0,         -- payments collected from dunning sequences
  dunning_emails_sent int DEFAULT 0,
  dunning_sms_sent int DEFAULT 0,
  payment_plans_activated int DEFAULT 0,
  saves_from_cancellation int DEFAULT 0,

  -- Route Optimization
  miles_saved numeric(8,2) DEFAULT 0,
  fuel_saved_cents int DEFAULT 0,           -- miles_saved * $0.21
  routes_optimized int DEFAULT 0,

  -- Visit Completion
  visits_completed int DEFAULT 0,
  photos_logged int DEFAULT 0,
  customer_notifications_sent int DEFAULT 0,
  avg_rating numeric(3,2),

  -- Lead Pipeline
  leads_followed_up int DEFAULT 0,
  quotes_sent int DEFAULT 0,
  revenue_from_new_clients_cents int DEFAULT 0,

  -- Sofia AI
  ai_queries_answered int DEFAULT 0,

  -- Total FieldSync Value (sum of above in dollars)
  total_value_cents int GENERATED ALWAYS AS (
    ar_recovered_cents + fuel_saved_cents + revenue_from_new_clients_cents
  ) STORED,

  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, week_start)
);

CREATE INDEX idx_weekly_roi_company ON weekly_roi_snapshots(company_id, week_start DESC);

-- ─── Report Configuration ─────────────────────────────────────────────────────

CREATE TABLE report_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL
    CHECK (report_type IN (
      'daily_brief', 'weekly_roi', 'monthly_ar', 'tech_scorecard',
      'client_health', 'route_efficiency', 'custom'
    )),
  name text NOT NULL,
  frequency text NOT NULL
    CHECK (frequency IN ('daily', 'weekly', 'monthly', 'on_demand')),
  send_day text,                            -- 'monday', '1st', etc.
  send_hour int DEFAULT 7 CHECK (send_hour BETWEEN 0 AND 23),
  timezone text DEFAULT 'America/New_York',
  active boolean DEFAULT true,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, report_type)
);

-- Stakeholder contacts (investors, property managers get different report types)
CREATE TABLE stakeholder_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text
    CHECK (role IN ('owner', 'manager', 'investor', 'property_manager', 'accountant', 'other')),
  report_types text[],                      -- which report_configs they receive
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, email)
);

-- ─── Row Level Security (new tables) ─────────────────────────────────────────

ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_recovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_auto_approve_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_roi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_contacts ENABLE ROW LEVEL SECURITY;

-- geocode_cache is shared infrastructure (no company_id) — service role only
-- All other tables: policies follow same pattern as migration 001

-- ─── Seed: Default Budget Limits by Plan ─────────────────────────────────────
-- Enforced at application layer — these are reference values
-- Starter: $0.20/day (2000 cents), Growth: $1.00/day (10000 cents), Scale: -1 (unlimited)

COMMENT ON COLUMN ai_daily_budgets.budget_limit_cents IS
  'Starter=2000 ($0.20), Growth=10000 ($1.00), Scale=-1 (unlimited). Hard stop at limit.';

COMMENT ON COLUMN outreach_approvals.auto_approve_enabled IS
  'Opt-in only — never default true. Customer must explicitly enable per type.';

COMMENT ON COLUMN outreach_auto_approve_settings.enabled IS
  'Default false. Customer enables per outreach_type. No type is auto-approved out of the box.';
