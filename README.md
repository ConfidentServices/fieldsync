# FieldSync

**The intelligence and automation platform for field service businesses.**

Connect your existing CRM in 10 minutes. See insights you've never had. Automate the work that's costing you money every day.

## What It Is

FieldSync is NOT a CRM replacement. It's the brain that sits on top — reading data from whatever you use, adding intelligence, and pushing automation back.

### Supported CRMs
- ✅ **ServiceAutopilot** — Playwright-based (live, production-tested)
- 🔄 **Jobber** — GraphQL API + OAuth (in progress)
- 🔄 **Housecall Pro** — REST API + OAuth (in progress)
- 📋 **ServiceTitan** — REST v2 (ISV approval pending)

## Architecture

```
fieldsync/
├── apps/
│   └── web/                    # Next.js 14 dashboard (App Router)
│       └── src/
│           ├── app/            # Pages
│           │   ├── dashboard/  # Operations Command Center
│           │   ├── onboarding/ # Tenant setup wizard
│           │   └── api/        # API routes
│           ├── components/     # UI components
│           └── lib/
│               ├── connectors/ # CRM adapter framework
│               ├── intelligence/ # Intelligence engine
│               └── automation/ # Automation engine
├── packages/
│   └── db/                     # Shared database types
├── supabase/
│   └── migrations/             # Database schema
└── workers/                    # Background sync workers
```

## Five Intelligence Layers

1. **Connectors** — Pull from any CRM, normalized to unified schema
2. **Intelligence Engine** — AR aging, tech performance, churn risk, route efficiency
3. **Automation Engine** — AR follow-up, QC alerts, lead nurture, dispatch optimization
4. **Command Center** — Real-time ops dashboard
5. **Reporting** — Revenue trends, tech scorecards, client health

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth
- **CRM Integration:** Playwright (SA), GraphQL (Jobber), REST (HCP)
- **Deployment:** Vercel

## Week 1-2 Status

- [x] CRM adapter framework (base interfaces)
- [x] ServiceAutopilot adapter
- [x] Supabase schema (multi-tenant, RLS)
- [x] Operations dashboard (with sample data)
- [ ] Jobber adapter (Week 3)
- [ ] Housecall Pro adapter (Week 3)
- [ ] Auth flow (Week 3)
- [ ] Live data sync (Week 4)

---

Built by Confident Services | [fieldsync.io](https://fieldsync.io)
