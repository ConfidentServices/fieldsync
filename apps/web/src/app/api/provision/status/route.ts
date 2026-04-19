import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: setup } = await supabase.from('company_setup').select('*').eq('company_id', companyId).single();
  const { data: crm } = await supabase.from('crm_connections').select('*').eq('company_id', companyId).single();

  return NextResponse.json({
    phone: { complete: !!setup?.phone_number, number: setup?.phone_number || null },
    domain: { complete: !!setup?.domain, domain: setup?.domain || null },
    stripe: { complete: !!setup?.stripe_connect_account_id, onboarding_complete: setup?.stripe_onboarding_complete || false },
    google: { complete: !!setup?.google_email, type: setup?.google_oauth_type || null, email: setup?.google_email || null },
    crm: { complete: !!crm, type: crm?.crm_type || setup?.crm_type || null, last_sync: crm?.last_sync_at || null, client_count: setup?.crm_client_count || 0 },
    setup_complete: setup?.setup_complete || false,
  });
}
