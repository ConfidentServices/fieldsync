-- Migration 005: Inventory Intelligence (Flexible 3-Mode Architecture)
-- Mode 1: Outcome watching (no inventory tracking required)
-- Mode 2: Light touch logging (optional tech prompts)  
-- Mode 3: Full inventory management (warehouse + truck tracking)

-- Company inventory settings
CREATE TABLE IF NOT EXISTS inventory_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  mode int DEFAULT 1 CHECK (mode IN (1, 2, 3)),
  -- Mode 1: outcome inference only
  -- Mode 2: light touch logging after jobs
  -- Mode 3: full tracking with warehouse/trucks
  tech_prompt_enabled boolean DEFAULT false,
  reorder_alerts boolean DEFAULT true,
  cost_per_job_tracking boolean DEFAULT true,
  supplier_scraping boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Inventory items catalog (Mode 2+)
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text, -- chemical, equipment, part, consumable
  unit text DEFAULT 'each', -- gallons, lbs, bags, each
  par_level numeric DEFAULT 0,
  reorder_quantity numeric DEFAULT 0,
  avg_unit_cost numeric,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inventory by location (Mode 3)
CREATE TABLE IF NOT EXISTS inventory_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_type text NOT NULL CHECK (location_type IN ('warehouse', 'truck', 'van')),
  location_id text, -- tech_id for trucks/vans
  quantity numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(company_id, item_id, location_type, location_id)
);

-- Usage log — works in all modes
-- Mode 1: populated from job skip notes and expense categorization
-- Mode 2+: populated from tech prompts and manual entries
CREATE TABLE IF NOT EXISTS inventory_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  job_id uuid REFERENCES fs_jobs(id) ON DELETE SET NULL,
  tech_id uuid REFERENCES fs_techs(id) ON DELETE SET NULL,
  item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name text, -- fallback if no catalog item
  quantity numeric,
  unit_cost numeric,
  entry_method text CHECK (entry_method IN ('tech_prompt', 'expense_import', 'manual', 'inferred')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Supply expense submissions (Mode 1 — techs submit receipts)
CREATE TABLE IF NOT EXISTS supply_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  tech_id uuid REFERENCES fs_techs(id) ON DELETE SET NULL,
  job_id uuid REFERENCES fs_jobs(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  description text,
  receipt_url text,
  category text DEFAULT 'supplies',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Suppliers catalog
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  account_number text,
  payment_terms text,
  portal_url text,
  api_available boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Supplier price history (from scraping — Mode 2+)
CREATE TABLE IF NOT EXISTS supplier_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_sku text,
  price numeric NOT NULL,
  unit text,
  in_stock boolean DEFAULT true,
  scraped_at timestamptz DEFAULT now()
);

-- Purchase orders (Mode 3)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'received', 'cancelled')),
  line_items jsonb DEFAULT '[]',
  total_amount numeric,
  sophia_generated boolean DEFAULT false,
  approved_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Sophia supply intelligence alerts
-- These fire in ALL modes based on outcome patterns
CREATE TABLE IF NOT EXISTS supply_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN (
    'skip_pattern',        -- tech skipping jobs, may be supply issue
    'cost_spike',          -- tech supply cost above average
    'reorder_needed',      -- inventory below par (Mode 2+)
    'weekly_projection',   -- projected shortage for upcoming schedule
    'price_opportunity',   -- better price available from supplier
    'expense_anomaly'      -- tech expense unusually high
  )),
  tech_id uuid REFERENCES fs_techs(id),
  title text NOT NULL,
  detail text,
  recommended_action text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_alerts ENABLE ROW LEVEL SECURITY;
