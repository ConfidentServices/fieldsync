-- Migration 004: Sophia Multi-Channel + At-Risk + Reactivation

-- Client risk scoring (daily)
CREATE TABLE IF NOT EXISTS client_risk_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES fs_clients(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  signals text[] DEFAULT '{}',
  segment text DEFAULT 'healthy' CHECK (segment IN ('champion','loyal','expansion','at_risk','win_back','new','occasional')),
  scored_at timestamptz DEFAULT now(),
  UNIQUE(company_id, client_id)
);

-- Reactivation campaigns (for cancelled clients)
CREATE TABLE IF NOT EXISTS reactivation_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES fs_clients(id) ON DELETE CASCADE,
  cancel_date date,
  cancel_reason text,
  current_stage int DEFAULT 0,
  stage_90_sent_at timestamptz,
  stage_180_sent_at timestamptz,
  stage_365_sent_at timestamptz,
  converted_at timestamptz,
  revenue_recovered numeric(10,2),
  status text DEFAULT 'active' CHECK (status IN ('active','converted','expired','opted_out')),
  created_at timestamptz DEFAULT now()
);

-- Sophia notification channels (Discord, WhatsApp, Telegram, SMS)
CREATE TABLE IF NOT EXISTS notification_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('discord','whatsapp','telegram','sms','email')),
  channel_id text,
  credentials_encrypted jsonb,
  enabled boolean DEFAULT true,
  morning_brief boolean DEFAULT true,
  urgent_alerts boolean DEFAULT true,
  payment_notifications boolean DEFAULT true,
  lead_notifications boolean DEFAULT true,
  day_summary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, channel_type)
);

-- Sophia conversation history (context across channels)
CREATE TABLE IF NOT EXISTS sophia_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  channel text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_text text NOT NULL,
  intent text,
  response_text text,
  action_taken text,
  action_approved boolean,
  created_at timestamptz DEFAULT now()
);

-- Smart offers / upsell queue
CREATE TABLE IF NOT EXISTS smart_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES fs_clients(id) ON DELETE CASCADE,
  offer_type text NOT NULL,
  offer_title text NOT NULL,
  offer_body text NOT NULL,
  trigger_reason text,
  status text DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','sent','converted','rejected','expired')),
  approved_at timestamptz,
  sent_at timestamptz,
  converted_at timestamptz,
  revenue_generated numeric(10,2),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sophia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_offers ENABLE ROW LEVEL SECURITY;
