-- FieldSync Migration 003
-- Unified Inbox + Auto-Send Rules
-- Date: 2026-04-18

-- ─── Inbox Messages ───────────────────────────────────────────────────────────
-- All customer messages from all channels land here — one source of truth.

CREATE TABLE inbox_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Source
  source text NOT NULL
    CHECK (source IN (
      'email', 'sms', 'voicemail', 'google_review', 'facebook',
      'instagram', 'crm_note', 'twilio', 'manual'
    )),
  external_message_id text,                 -- source platform's ID (dedup key)

  -- Sender
  from_name text,
  from_contact text NOT NULL,              -- phone or email
  client_id uuid REFERENCES fs_clients(id), -- NULL if unmatched
  subject text,                            -- email subject, review title

  -- Content
  body text NOT NULL,
  attachments text[],
  received_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,

  -- Classification (Sofia + heuristics)
  classification text
    CHECK (classification IN (
      'complaint', 'billing_question', 'billing_dispute', 'cancellation_request',
      'scheduling_request', 'reschedule_request', 'review_positive', 'review_negative',
      'review_neutral', 'general_inquiry', 'compliment', 'referral',
      'payment_update', 'service_question', 'unclassified'
    )),
  urgency text DEFAULT 'normal'
    CHECK (urgency IN ('urgent', 'normal', 'low')),

  -- Sofia AI draft
  sofia_reply_draft text,
  sofia_confidence numeric(4,3),            -- 0.000 to 1.000
  sofia_reasoning text,                    -- why Sofia wrote this draft (shown in UI)
  sofia_drafted_at timestamptz,

  -- Send control
  never_auto_send boolean NOT NULL DEFAULT false,
  -- Set true automatically for: complaint, billing_dispute, cancellation_request, review_negative
  -- Cannot be overridden by auto-send rules when true

  status text DEFAULT 'unread'
    CHECK (status IN ('unread', 'draft_ready', 'replied', 'dismissed', 'auto_sent', 'snoozed')),

  -- Reply tracking
  reply_body text,
  reply_sent_by text CHECK (reply_sent_by IN ('owner', 'auto', 'sofia_explicit', null)),
  reply_sent_at timestamptz,
  reply_channel text,                      -- which channel reply went out on

  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, source, external_message_id)
);

CREATE INDEX idx_inbox_company_status ON inbox_messages(company_id, status, received_at DESC);
CREATE INDEX idx_inbox_unread ON inbox_messages(company_id, received_at DESC)
  WHERE status = 'unread';
CREATE INDEX idx_inbox_urgent ON inbox_messages(company_id, urgency, received_at DESC)
  WHERE urgency = 'urgent';
CREATE INDEX idx_inbox_never_auto ON inbox_messages(company_id)
  WHERE never_auto_send = true AND status IN ('unread', 'draft_ready');
CREATE INDEX idx_inbox_client ON inbox_messages(client_id, received_at DESC)
  WHERE client_id IS NOT NULL;

-- Constraint: never_auto_send is forced true for protected classifications
CREATE OR REPLACE FUNCTION enforce_never_auto_send()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.classification IN (
    'complaint', 'billing_dispute', 'cancellation_request', 'review_negative'
  ) THEN
    NEW.never_auto_send := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inbox_never_auto_send
  BEFORE INSERT OR UPDATE OF classification ON inbox_messages
  FOR EACH ROW EXECUTE FUNCTION enforce_never_auto_send();

-- ─── Auto-Send Rules ──────────────────────────────────────────────────────────
-- Opt-in only. Never enabled by default. Customer enables per classification.
-- Never-auto-send classifications are rejected at application layer too.

CREATE TABLE inbox_auto_send_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  classification text NOT NULL,
  auto_send_enabled boolean DEFAULT false,   -- starts false — must opt in
  channel_filter text[],                     -- ['sms', 'email'] — which channels this applies to
  conditions jsonb,
  -- Example conditions:
  -- {"min_review_stars": 5}       -- only auto-send thank-yous for 5-star reviews
  -- {"max_balance_cents": 0}      -- only auto-send if no outstanding balance
  -- {"client_tenure_days_min": 30}-- only for established clients
  template_id text,                          -- which reply template to use
  custom_template text,                      -- or a custom template
  enabled_by text,
  enabled_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, classification),

  -- Hard constraint: protected types can never be auto-sent
  CONSTRAINT no_auto_send_protected CHECK (
    classification NOT IN (
      'complaint', 'billing_dispute', 'cancellation_request', 'review_negative'
    )
  )
);

CREATE INDEX idx_auto_send_rules_company ON inbox_auto_send_rules(company_id, auto_send_enabled);

COMMENT ON TABLE inbox_auto_send_rules IS
  'Opt-in per classification. complaint/billing_dispute/cancellation_request/review_negative
   are rejected by CHECK constraint — can never be configured for auto-send.';

COMMENT ON COLUMN inbox_auto_send_rules.auto_send_enabled IS
  'Default false. Owner must explicitly opt in per type. No type is auto-enabled at signup.';

-- ─── Reply Templates ──────────────────────────────────────────────────────────

CREATE TABLE reply_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  classification text,
  name text NOT NULL,
  channel text CHECK (channel IN ('email', 'sms', 'any')),
  subject text,
  body text NOT NULL,                        -- supports {{client_name}}, {{tech_name}}, etc.
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_auto_send_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN inbox_messages.never_auto_send IS
  'Set true by trigger for: complaint, billing_dispute, cancellation_request, review_negative.
   These ALWAYS require owner review. No exceptions. Cannot be overridden.';
