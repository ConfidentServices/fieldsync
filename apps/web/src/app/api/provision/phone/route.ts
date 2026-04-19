import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_BASE = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}`;

function twilioFetch(path: string, method = 'GET', body?: Record<string, string>) {
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64');
  return fetch(`${TWILIO_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
}

export async function POST(req: NextRequest) {
  const { companyId, areaCode = '813', companyName } = await req.json();
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  try {
    // 1. Search available numbers
    const searchRes = await twilioFetch(
      `/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&SmsEnabled=true&VoiceEnabled=true`
    );
    const searchData = await searchRes.json();
    if (!searchData.available_phone_numbers?.length) {
      return NextResponse.json({ error: 'No numbers available in that area code' }, { status: 404 });
    }
    const number = searchData.available_phone_numbers[0].phone_number;

    // 2. Purchase the number
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldsync.vercel.app';
    const purchaseRes = await twilioFetch('/IncomingPhoneNumbers.json', 'POST', {
      PhoneNumber: number,
      FriendlyName: `FieldSync — ${companyName || companyId}`,
      VoiceUrl: `${appUrl}/api/webhooks/twilio/voice`,
      SmsUrl: `${appUrl}/api/webhooks/twilio/sms`,
      StatusCallback: `${appUrl}/api/webhooks/twilio/status`,
    });
    const purchaseData = await purchaseRes.json();
    if (!purchaseData.sid) {
      return NextResponse.json({ error: 'Failed to purchase number', detail: purchaseData }, { status: 500 });
    }

    // 3. Store in company_setup
    const supabase = createAdminClient();
    await supabase.from('company_setup').upsert({
      company_id: companyId,
      phone_number: number,
      twilio_number_sid: purchaseData.sid,
      phone_provisioned_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

    return NextResponse.json({
      success: true,
      phoneNumber: number,
      sid: purchaseData.sid,
      monthlyFee: 1.15,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
