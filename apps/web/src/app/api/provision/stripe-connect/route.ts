import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { companyId, businessName, ownerEmail, ownerName } = await req.json();
  if (!companyId || !ownerEmail) return NextResponse.json({ error: 'companyId and ownerEmail required' }, { status: 400 });

  try {
    // 1. Create Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: ownerEmail,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { name: businessName || 'Field Service Business' },
      metadata: { fieldsync_company_id: companyId },
    });

    // 2. Generate onboarding link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldsync.vercel.app';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/onboarding?step=billing&retry=true`,
      return_url: `${appUrl}/onboarding?step=billing&success=true`,
      type: 'account_onboarding',
    });

    // 3. Store account ID
    const supabase = createAdminClient();
    await supabase.from('company_setup').upsert({
      company_id: companyId,
      stripe_connect_account_id: account.id,
      stripe_onboarding_complete: false,
      stripe_connected_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

    return NextResponse.json({
      success: true,
      stripeAccountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Redirect owner to onboardingUrl to complete KYC',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
