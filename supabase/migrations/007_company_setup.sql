-- Migration 007: Company setup tracking
CREATE TABLE IF NOT EXISTS company_setup (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  phone_number text,
  twilio_number_sid text,
  phone_provisioned_at timestamptz,
  domain text,
  domain_registrar text DEFAULT 'namecheap',
  domain_registered_at timestamptz,
  domain_expires_at timestamptz,
  stripe_connect_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  stripe_connected_at timestamptz,
  google_email text,
  google_oauth_type text,
  google_connected_at timestamptz,
  crm_type text,
  crm_connected_at timestamptz,
  crm_last_sync_at timestamptz,
  crm_client_count int DEFAULT 0,
  crm_tech_count int DEFAULT 0,
  setup_complete boolean DEFAULT false,
  setup_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE company_setup ENABLE ROW LEVEL SECURITY;
