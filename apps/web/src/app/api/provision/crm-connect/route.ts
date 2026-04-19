import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const JOBBER_CLIENT_ID = process.env.JOBBER_CLIENT_ID;
const JOBBER_REDIRECT  = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/jobber/callback';

export async function POST(req: NextRequest) {
  const { companyId, crmType, credentials } = await req.json();
  if (!companyId || !crmType) return NextResponse.json({ error: 'companyId and crmType required' }, { status: 400 });

  const supabase = createAdminClient();

  switch (crmType) {
    case 'serviceautopilot': {
      // Store encrypted credentials, validate on first sync
      if (!credentials?.email || !credentials?.password) {
        return NextResponse.json({ error: 'SA credentials (email, password) required' }, { status: 400 });
      }
      // TODO: validate credentials via Playwright before storing
      // For now, store and mark for validation on first background sync
      await supabase.from('crm_connections').upsert({
        company_id: companyId,
        crm_type: 'serviceautopilot',
        credentials_encrypted: credentials, // TODO: encrypt before storing
        sync_status: 'pending_validation',
      }, { onConflict: 'company_id' });
      await supabase.from('company_setup').upsert({
        company_id: companyId,
        crm_type: 'serviceautopilot',
        crm_connected_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });
      return NextResponse.json({ success: true, crmType, status: 'pending_validation', message: 'Credentials stored. First sync will validate and pull data.' });
    }

    case 'jobber': {
      if (!JOBBER_CLIENT_ID) return NextResponse.json({ error: 'Jobber OAuth not configured' }, { status: 503 });
      const state = `${companyId}:${Date.now()}`;
      const authUrl = `https://api.getjobber.com/api/oauth/authorize?` + new URLSearchParams({
        client_id: JOBBER_CLIENT_ID,
        redirect_uri: JOBBER_REDIRECT,
        response_type: 'code',
        state,
      });
      return NextResponse.json({ success: true, crmType, oauthUrl: authUrl, message: 'Redirect owner to oauthUrl to authorize Jobber' });
    }

    case 'housecallpro': {
      return NextResponse.json({ 
        success: false, 
        crmType,
        message: 'Housecall Pro integration requires Integration Partner approval. Apply at housecallpro.com/integrations.',
        status: 'partner_approval_required'
      });
    }

    case 'manual': {
      await supabase.from('company_setup').upsert({
        company_id: companyId,
        crm_type: 'manual',
        crm_connected_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });
      return NextResponse.json({ success: true, crmType: 'manual', message: 'Using FieldSync as native CRM' });
    }

    default:
      return NextResponse.json({ error: `Unsupported CRM: ${crmType}` }, { status: 400 });
  }
}
