# FieldSync Provisioning System

## What Gets Provisioned
When a new customer signs up, FieldSync can automatically provision:
1. Business phone number (Twilio) — $1.15/month
2. Domain registration (Namecheap) — ~$10/year
3. Payment processing (Stripe Connect) — no fixed fee
4. Email connection (Gmail OAuth) — free
5. CRM connection (SA, Jobber, HCP, or Manual)

## Required Environment Variables
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
- NAMECHEAP_API_USER, NAMECHEAP_API_KEY (⚠️ VPS IP must be whitelisted in Namecheap account)
- STRIPE_SECRET_KEY (platform account key)
- JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET (for Jobber OAuth)
- NEXT_PUBLIC_APP_URL

## Blockers Before Launch
1. **Namecheap**: Whitelist VPS IP 204.168.179.24 in account settings
2. **Housecall Pro**: Apply for Integration Partner status
3. **ServiceTitan**: Submit ISV application at developer.servicetitan.io
4. **Jobber**: Register app at developer.getjobber.com to get CLIENT_ID

## COGS Per Customer
- Twilio: ~$6.50/month
- Domain: ~$1.00/month
- Stripe: $0 fixed
- Google: $0 (OAuth)
- Total: ~$7.50-15/month
- Gross margin at $397/mo Growth tier: ~96%
