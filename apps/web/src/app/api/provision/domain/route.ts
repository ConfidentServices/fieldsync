import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const NC_USER = process.env.NAMECHEAP_API_USER!;
const NC_KEY  = process.env.NAMECHEAP_API_KEY!;
const NC_IP   = process.env.VPS_IP || '204.168.179.24';
const NC_BASE = process.env.NAMECHEAP_SANDBOX === 'true'
  ? 'https://api.sandbox.namecheap.com/xml.response'
  : 'https://api.namecheap.com/xml.response';

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

function ncUrl(command: string, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ ApiUser: NC_USER, ApiKey: NC_KEY, UserName: NC_USER, ClientIp: NC_IP, Command: command, ...extra });
  return `${NC_BASE}?${p}`;
}

export async function POST(req: NextRequest) {
  const { companyId, companyName, preferredDomain } = await req.json();
  if (!companyId || !companyName) return NextResponse.json({ error: 'companyId and companyName required' }, { status: 400 });

  const slug = preferredDomain ? toSlug(preferredDomain) : toSlug(companyName);
  const candidates = [`${slug}.com`, `${slug}pro.com`, `get${slug}.com`, `${slug}hq.com`];

  try {
    // Check availability for all candidates
    const checkRes = await fetch(ncUrl('namecheap.domains.check', { DomainList: candidates.join(',') }));
    const checkXml = await checkRes.text();
    
    // Parse available domains from XML (basic regex parse)
    const available = candidates.filter(d => {
      const match = checkXml.match(new RegExp(`Domain="${d.replace('.', '\\.')}"[^>]*Available="true"`));
      return !!match;
    });

    if (!available.length) {
      return NextResponse.json({ 
        error: 'No suggested domains available', 
        checked: candidates,
        suggestion: 'Please enter a custom domain name'
      }, { status: 409 });
    }

    return NextResponse.json({
      available,
      recommended: available[0],
      yearlyFee: 9.98,
      note: 'Call /api/provision/domain/register with chosen domain to complete registration',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
