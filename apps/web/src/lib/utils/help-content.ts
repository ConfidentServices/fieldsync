/**
 * FieldSync In-Product Help Content
 * ===================================
 * Full article content for every feature.
 * Searchable at /help. Inline "?" icons link to specific articles.
 */

export interface HelpArticle {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  summary: string;
  body: HelpSection[];
  tags: string[];
  updatedAt: string;
}

export interface HelpSection {
  type: 'heading' | 'text' | 'list' | 'callout' | 'table' | 'code';
  content: string;
  items?: string[];
  variant?: 'info' | 'warning' | 'success' | 'danger';
  headers?: string[];
  rows?: string[][];
}

export const HELP_ARTICLES: HelpArticle[] = [
  // ─── Unified Inbox ────────────────────────────────────────────────────────

  {
    id: 'inbox-overview',
    category: 'Unified Inbox',
    categoryIcon: '📬',
    title: 'How the Unified Inbox works',
    summary: 'All customer messages from every channel — one place. Sofia drafts replies. You decide what gets sent.',
    tags: ['inbox', 'messages', 'sofia', 'replies', 'channels'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'The Unified Inbox pulls in every customer message — SMS, email, voicemails, Google Reviews, Facebook messages, and notes from your CRM — and puts them all in one list. For every message, Sofia AI prepares a draft reply.',
      },
      {
        type: 'heading',
        content: 'Three send modes',
      },
      {
        type: 'list',
        content: '',
        items: [
          '**Review Required (default for all types)** — Sofia prepares the draft, you approve before anything sends. You can edit, approve as-is, or discard.',
          '**Auto-send (opt-in)** — For low-risk message types you trust, you can enable auto-send. Examples: appointment confirmation responses, 5-star review thank-yous, payment update acknowledgments.',
          '**Explicit command** — Tell Sofia in chat: "Reply to Sarah Miller and tell her service is Tuesday." Sofia will draft it, show it to you, and only send when you confirm.',
        ],
      },
      {
        type: 'callout',
        variant: 'danger',
        content: 'FieldSync never sends to complaints, billing disputes, cancellation requests, or negative reviews — ever. These four types are hard-locked to Review Required. No auto-send rule can override this. This is enforced at the database level, not just the UI.',
      },
      {
        type: 'heading',
        content: 'What channels are supported',
      },
      {
        type: 'table',
        content: '',
        headers: ['Channel', 'How it connects', 'Can reply via FieldSync'],
        rows: [
          ['SMS', 'Twilio integration', '✅ Yes — reply SMS'],
          ['Email', 'Gmail / Outlook OAuth', '✅ Yes — reply email'],
          ['Voicemail', 'Twilio transcription', '✅ Yes — reply SMS to caller'],
          ['Google Reviews', 'Google Business Profile API', '✅ Yes — post response'],
          ['Facebook Messages', 'Meta Pages API', '✅ Yes'],
          ['CRM Notes', 'SA / Jobber sync', '✅ View only (write back to CRM)'],
        ],
      },
      {
        type: 'heading',
        content: 'Sofia\'s confidence score',
      },
      {
        type: 'text',
        content: 'Every draft shows a confidence score (0–100%). This is Sofia\'s assessment of how accurate and appropriate her draft is. High confidence (85%+) means the reply is straightforward and factual. Lower confidence means Sofia is less certain — usually because the message is ambiguous, emotionally complex, or requires information she doesn\'t have. Always read low-confidence drafts carefully.',
      },
    ],
  },

  {
    id: 'inbox-auto-send',
    category: 'Unified Inbox',
    categoryIcon: '📬',
    title: 'Configuring auto-send rules',
    summary: 'Enable auto-send for specific, low-risk message types. Detailed guide on what\'s safe, what\'s not, and how to configure.',
    tags: ['auto-send', 'inbox', 'automation', 'rules'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'callout',
        variant: 'info',
        content: 'Auto-send is OFF for all message types by default. You enable it explicitly per type. Nothing auto-sends at account creation.',
      },
      {
        type: 'heading',
        content: 'Recommended types to enable auto-send',
      },
      {
        type: 'list',
        content: '',
        items: [
          '**5-star review thank-you** — Safe, positive, low risk. Sofia writes a warm response. High volume = big time saver.',
          '**Appointment confirmation** — Client asks "what time is service?" — Sofia replies with date/time from CRM. Fully automated.',
          '**Payment update acknowledgment** — Client updates their card and emails to say so. Sofia says "got it, you\'re all set."',
          '**Compliment responses** — Client texts "service was great!" Sofia replies "Thank you, Carlos works so hard!" Short, genuine.',
        ],
      },
      {
        type: 'heading',
        content: 'Types that always require your review (cannot be changed)',
      },
      {
        type: 'list',
        content: '',
        items: [
          '🚫 **Complaints** — Every complaint needs a human response. Sofia drafts, you personalize.',
          '🚫 **Billing disputes** — Legal/financial risk. You must own every response.',
          '🚫 **Cancellation requests** — These need a save attempt. Never auto-acknowledge a cancellation.',
          '🚫 **Negative reviews (1–2 stars)** — Your reputation. Always respond personally.',
        ],
      },
      {
        type: 'heading',
        content: 'How to enable auto-send',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Go to Settings → Inbox → Auto-Send Rules',
          'Find the message classification you want to enable',
          'Toggle it ON',
          'Optionally set conditions (e.g., "only auto-send if client has no open AR balance")',
          'Choose which reply template to use, or let Sofia generate each time',
          'Save — takes effect immediately',
        ],
      },
    ],
  },

  // ─── Route Intelligence ───────────────────────────────────────────────────

  {
    id: 'route-intelligence-overview',
    category: 'Route Intelligence',
    categoryIcon: '🗺',
    title: 'How Route Intelligence works',
    summary: 'FieldSync suggests better route ordering using our own algorithm. You approve. Tech gets directions via SMS.',
    tags: ['route', 'optimization', 'maps', 'techs', 'miles', 'fuel'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'FieldSync analyzes each tech\'s daily stops and calculates whether reordering them would save meaningful miles. We use our own routing solver — not a third-party routing service. You own the approval decision. We just surface the math.',
      },
      {
        type: 'heading',
        content: 'The pipeline (what happens under the hood)',
      },
      {
        type: 'list',
        content: '',
        items: [
          '**Step 1: Pull today\'s jobs** — Fetched from your CRM via our connector (real-time).',
          '**Step 2: Geocode addresses** — Google Geocoding API converts street addresses to lat/lng coordinates. Results are cached permanently — we only call this API once per address ever.',
          '**Step 3: Build distance matrix** — Google Distance Matrix API calculates actual driving distances between every pair of stops. This accounts for real roads, not straight-line guesses.',
          '**Step 4: Run TSP solver** — Our own Nearest Neighbor + 2-opt Traveling Salesman solver runs in milliseconds. Zero API cost for this step.',
          '**Step 5: Compare** — We compare the optimized order vs the current scheduled order and calculate miles saved, fuel cost, and time.',
          '**Step 6: Show recommendation** — "Reorder Carlos\'s route to save 14 miles today" with a preview of the new order.',
          '**Step 7: You approve** — One click. Tech receives an SMS with a Google Maps directions link to the optimized route.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        content: 'FieldSync does NOT change anything in your CRM. We suggest the reorder, you dispatch in your existing software. This is intelligence, not takeover.',
      },
      {
        type: 'heading',
        content: 'What the TSP solver is',
      },
      {
        type: 'text',
        content: 'TSP stands for Traveling Salesman Problem — the classic math problem of finding the shortest path through a set of stops. Our solver uses "Nearest Neighbor" heuristic (start from depot, always go to the closest unvisited stop) followed by "2-opt" improvement (swap pairs of stops to eliminate crossing paths). For 20-40 stops, this runs in under 10 milliseconds and typically finds near-optimal routes.',
      },
      {
        type: 'heading',
        content: 'How savings are calculated',
      },
      {
        type: 'list',
        content: '',
        items: [
          '**Today\'s fuel savings** = Miles saved × $0.21 (IRS standard mileage rate)',
          '**Annualized savings** = Miles saved × 250 working days × $0.21',
          '**Time savings** = Miles saved ÷ 25 mph average (urban field service)',
        ],
      },
      {
        type: 'heading',
        content: 'What it costs',
      },
      {
        type: 'table',
        content: '',
        headers: ['API', 'Cost', 'When called', 'Cache?'],
        rows: [
          ['Google Geocoding', '$5/1,000 calls', 'Once per unique address, ever', '✅ Permanent'],
          ['Google Distance Matrix', '$5/1,000 elements', 'Daily per company', '✅ 24-hour'],
          ['Google Directions (SMS link)', '$5/1,000 calls', 'Only when owner approves', '❌ One-time'],
        ],
      },
      {
        type: 'text',
        content: 'Total cost per customer per month: approximately $2–8 depending on company size. This is absorbed into FieldSync\'s margin — you are not billed separately for these API calls.',
      },
    ],
  },

  // ─── AR & Collections ─────────────────────────────────────────────────────

  {
    id: 'ar-collections-overview',
    category: 'AR & Collections',
    categoryIcon: '💰',
    title: 'FieldSync Recover — How AR collection works',
    summary: 'Automated 5-stage collection sequence for failed payments. Every message requires your approval before sending.',
    tags: ['ar', 'collections', 'dunning', 'billing', 'payments', 'recover'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'FieldSync Recover is a built-in billing retention system. When a payment fails, it starts a smart recovery sequence — retry logic, client notifications, and service hold rules. Approximately 85% of field service payment failures are not intentional cancellations. They\'re expired cards, temporary insufficient funds, or bank holds. FieldSync treats every failure as a logistics problem first.',
      },
      {
        type: 'heading',
        content: 'The 5-stage notification sequence',
      },
      {
        type: 'table',
        content: '',
        headers: ['Day', 'Event', 'Message type', 'Tone'],
        rows: [
          ['Day 0', 'Payment fails', 'Email (+ SMS if opted in)', '"Quick note about your payment" — friendly, zero shame'],
          ['Day 3', 'Retry fails', 'Email', '"Still having a hiccup — easy to fix" — helpful'],
          ['Day 7', 'Retry fails', 'Email + SMS', '"Your service is coming up" — service-first framing'],
          ['Day 14', 'No resolution', 'Email', '"Service may pause — want to avoid this" — warning with options'],
          ['Day 21', 'Final retry fails', 'Email', '"Service paused + payment plan offer" — structured resolution'],
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'Every message in the collection sequence goes through your Approval Queue before sending. You review and approve each one. You can edit any message, snooze it, or skip it entirely.',
      },
      {
        type: 'heading',
        content: 'Smart retry logic',
      },
      {
        type: 'text',
        content: 'FieldSync doesn\'t just retry on a fixed schedule. It uses the decline code to decide what to do:',
      },
      {
        type: 'list',
        content: '',
        items: [
          '**Insufficient funds** → retry Day 3, 7, 14 (wait for payday cycles)',
          '**Expired card** → do NOT retry until card is updated; send update email immediately',
          '**Do not honor / Bank hold** → retry Day 2, 5 (these lift quickly)',
          '**Processing error** → retry next business day',
          '**Lost/stolen card or fraud detected** → STOP all retries immediately; alert you; create a manual task',
        ],
      },
      {
        type: 'heading',
        content: 'Payment plans',
      },
      {
        type: 'text',
        content: 'When a balance exceeds $300 (configurable), FieldSync automatically offers the client a payment plan. Three options: 2-Pay (7 and 37 days), 3-Pay (7, 37, 67 days), or Custom. Service resumes immediately when the client accepts a plan and makes the first payment.',
      },
      {
        type: 'heading',
        content: 'Service hold rules',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Days 0–21: service continues as normal (balance accumulates, client gets notifications)',
          'Day 21+: new visits pause; in-progress or next-day visits complete (tech already mobilized)',
          'VIP clients (LTV > $5,000 or 2+ year tenure): service hold requires your manual approval',
          'You can set "Never hold service" on any individual client (Settings → Clients → Client Detail)',
        ],
      },
    ],
  },

  // ─── Visit Completion ─────────────────────────────────────────────────────

  {
    id: 'visit-completion-overview',
    category: 'Visit Completion',
    categoryIcon: '📋',
    title: 'Visit checklists and customer notifications',
    summary: 'Configurable checklist per service type. When complete → customer gets notification with photos. When incomplete → supervisor alert.',
    tags: ['visit', 'checklist', 'photos', 'qc', 'notifications', 'completion'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'FieldSync can require your techs to complete a checklist before marking a job done. This creates accountability, builds customer trust, and gives you photo documentation for every visit. When all items are complete, a customer notification is automatically drafted (and queued for your approval).',
      },
      {
        type: 'heading',
        content: 'Default pool service checklist',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Before photo (required)',
          'Water chemistry — pH reading (required)',
          'Water chemistry — chlorine reading (required)',
          'Equipment inspection (required)',
          'After photo (required)',
          'Tech notes (optional)',
        ],
      },
      {
        type: 'heading',
        content: 'What the customer notification includes',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Before + after photos',
          'Chemistry readings (if logged)',
          'Tech\'s name and notes',
          'Service summary ("pool cleaned, filter checked, all chemistry balanced")',
          'Next scheduled visit date',
          'One-tap rating request (1–5 stars)',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        content: 'If required checklist items are missing, the customer notification is HELD — not sent. A supervisor alert fires immediately. The tech has 2 hours to complete the missing items before the job is flagged as incomplete.',
      },
      {
        type: 'heading',
        content: 'Configuring checklists',
      },
      {
        type: 'text',
        content: 'Go to Settings → Visit Checklists. You can create a different checklist for each service type (pool cleaning, equipment repair, HVAC maintenance, etc.). Each checklist item can be: photo, checkbox, number, or text. Mark items as required or optional.',
      },
      {
        type: 'heading',
        content: 'Photo QC review',
      },
      {
        type: 'text',
        content: 'FieldSync\'s QC system flags photos that may have issues — blurry, taken inside a vehicle, or clearly not of the service area. Flagged photos appear in your Alerts with a "Review" button. You can pass or fail individual photos, and failing a photo holds the customer notification until the tech uploads a replacement.',
      },
    ],
  },

  // ─── Sofia AI ─────────────────────────────────────────────────────────────

  {
    id: 'sofia-overview',
    category: 'Sofia AI',
    categoryIcon: '🤖',
    title: 'What Sofia can (and can\'t) do',
    summary: 'Natural language queries against your live business data. Budget limits per plan. Your data is never used for training.',
    tags: ['sofia', 'ai', 'queries', 'natural language', 'budget', 'data'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'Sofia is FieldSync\'s AI assistant. She can answer questions about your business data in plain English — no reports to run, no filters to set. Ask "Which clients are most likely to churn?" and she\'ll tell you.',
      },
      {
        type: 'heading',
        content: 'What you can ask Sofia',
      },
      {
        type: 'list',
        content: '',
        items: [
          '"Which clients have open AR over $200?"',
          '"Who hasn\'t had service in the last 30 days?"',
          '"Which tech has the best completion rate this month?"',
          '"How much revenue did we collect last week?"',
          '"Show me all skipped jobs in the last 7 days"',
          '"What messages need my attention today?"',
          '"Reply to Sarah Miller and tell her service is Tuesday"',
          '"Send thank-you replies to all 5-star reviews this week"',
          '"Which clients are at risk of churning?"',
          '"What\'s my AR aging look like today?"',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        content: 'When Sofia drafts a message (inbox reply, review response, etc.), it always goes through your approval queue first — even if you gave a voice command. She will show you exactly what she\'s about to send and wait for your confirmation.',
      },
      {
        type: 'heading',
        content: 'Daily budget limits',
      },
      {
        type: 'table',
        content: '',
        headers: ['Plan', 'Daily limit', 'What happens at limit'],
        rows: [
          ['Starter', '$0.20/day', 'Hard stop — "You\'ve used your available daily credits. Upgrade for more."'],
          ['Growth', '$1.00/day', 'Hard stop — same message'],
          ['Scale', 'Unlimited', 'No limit'],
          ['Enterprise', 'Unlimited', 'No limit'],
        ],
      },
      {
        type: 'text',
        content: 'Every Sofia query logs: your company ID, the query text, the model used, tokens consumed, and cost in cents. This data is visible to you in Settings → Sofia → Usage. It is never shared.',
      },
      {
        type: 'heading',
        content: 'Data privacy commitments',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Your data is never used to train any AI model — not ours, not OpenAI\'s, not anyone\'s.',
          'Sofia only accesses your company\'s data — row-level security enforced at the database.',
          'Query logs are retained for 90 days then deleted.',
          'Sofia has no memory between sessions — every conversation starts fresh.',
        ],
      },
      {
        type: 'heading',
        content: 'What Sofia can\'t do',
      },
      {
        type: 'list',
        content: '',
        items: [
          'She cannot send any message to any customer without your explicit approval.',
          'She cannot make changes in your CRM (she\'s read-only from your CRM).',
          'She cannot access information from other FieldSync customers.',
          'She cannot answer questions about data that hasn\'t been synced yet.',
        ],
      },
    ],
  },

  // ─── Approval Gates ───────────────────────────────────────────────────────

  {
    id: 'approval-gates',
    category: 'Approval Gates',
    categoryIcon: '✅',
    title: 'Why every outreach requires approval — and how to configure it',
    summary: 'FieldSync queues every automated message for your review before sending. Opt-in auto-approve for specific safe types.',
    tags: ['approval', 'outreach', 'auto-approve', 'review', 'safety'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'text',
        content: 'Every automated message FieldSync would send to your clients — AR dunning emails, visit completion notifications, review requests, payment plan offers — goes into your Approval Queue first. Nothing leaves without you seeing it.',
      },
      {
        type: 'heading',
        content: 'Why we built it this way',
      },
      {
        type: 'text',
        content: 'Your clients are your relationships — built over months and years. An automated system that sent the wrong message to the wrong person at the wrong time could damage trust that took years to build. The approval queue means you\'re always in the loop. When you\'re confident a certain type of message is always right, you can opt that type into auto-send.',
      },
      {
        type: 'heading',
        content: 'How to enable auto-approve for a message type',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Settings → Outreach → Approval Rules',
          'Find the message type you want to auto-approve',
          'Toggle "Auto-approve" ON',
          'Set conditions if desired (e.g., "only for clients with no open AR")',
          'Confirm — it takes effect immediately',
        ],
      },
      {
        type: 'table',
        content: '',
        headers: ['Message type', 'Default', 'Can auto-approve?'],
        rows: [
          ['AR dunning email (day 0, 3, 7)', 'Review required', '✅ Yes (if you trust the template)'],
          ['Visit completion notification', 'Review required', '✅ Yes'],
          ['5-star review thank-you', 'Review required', '✅ Yes — recommended'],
          ['Payment plan offer', 'Review required', '✅ Yes'],
          ['Appointment confirmation', 'Review required', '✅ Yes — recommended'],
          ['Complaint response', 'Review required', '🚫 Never — locked'],
          ['Cancellation response', 'Review required', '🚫 Never — locked'],
          ['Billing dispute response', 'Review required', '🚫 Never — locked'],
          ['Negative review response', 'Review required', '🚫 Never — locked'],
        ],
      },
      {
        type: 'callout',
        variant: 'danger',
        content: 'Complaints, cancellations, billing disputes, and negative reviews are hard-locked to Review Required. This cannot be changed. These message types always involve emotional or financial risk and require your personal judgment.',
      },
      {
        type: 'heading',
        content: 'The approval queue UI',
      },
      {
        type: 'text',
        content: 'The Pending Approvals section appears at the top of your dashboard. Each item shows: recipient, message type, urgency, and a preview of the message. Buttons: Approve (sends immediately), Edit (open editor then send), Skip (removes from queue without sending). Items expire after 48 hours if not actioned.',
      },
    ],
  },

  // ─── Report Configuration ─────────────────────────────────────────────────

  {
    id: 'report-config',
    category: 'Reports',
    categoryIcon: '📊',
    title: 'Configuring reports and report recipients',
    summary: 'Control what gets reported, how often, and who receives it. Investors and property managers get their own report type.',
    tags: ['reports', 'email', 'weekly', 'roi', 'stakeholders', 'config'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'heading',
        content: 'Available report types',
      },
      {
        type: 'table',
        content: '',
        headers: ['Report', 'Default frequency', 'Best for'],
        rows: [
          ['Daily Brief', 'Daily 7 AM', 'Operations overview — revenue, jobs, alerts'],
          ['FieldSync Weekly ROI', 'Monday 7 AM', 'Dollar value FieldSync delivered this week'],
          ['Monthly AR Report', '1st of month', 'Full AR aging + recovery stats'],
          ['Tech Scorecard', 'Weekly', 'Per-tech performance metrics'],
          ['Client Health Report', 'Weekly', 'Churn risk, completion rates, satisfaction'],
          ['Route Efficiency', 'Weekly', 'Miles saved, fuel, optimization trends'],
        ],
      },
      {
        type: 'heading',
        content: 'Configuring frequency',
      },
      {
        type: 'text',
        content: 'Go to Settings → Reports. Each report type has: frequency (daily/weekly/monthly/on-demand), send day, send hour, and timezone. You can also disable any report type entirely.',
      },
      {
        type: 'heading',
        content: 'Stakeholder contacts',
      },
      {
        type: 'text',
        content: 'Add contacts in Settings → Reports → Stakeholders. Assign each contact a role (owner, manager, investor, property manager, accountant) and select which reports they receive. Each contact can have a different report set — your accountant gets the AR report, your investors get the ROI report.',
      },
      {
        type: 'heading',
        content: 'The FieldSync Weekly ROI email',
      },
      {
        type: 'text',
        content: 'Subject: "Here\'s what FieldSync did for your business this week." Sent every Monday morning. Shows: AR recovered, fuel saved, miles saved, cancellations saved, ratings collected, and total dollar value. This is designed to make the value of FieldSync obvious every week.',
      },
    ],
  },

  // ─── Data Protection ──────────────────────────────────────────────────────

  {
    id: 'data-protection',
    category: 'Data & Privacy',
    categoryIcon: '🔒',
    title: 'Data protection, isolation, and your rights',
    summary: 'Row-level isolation, one-click export, deletion on cancel, and a hard commitment that your data is never used for training.',
    tags: ['data', 'privacy', 'security', 'export', 'deletion', 'isolation', 'gdpr'],
    updatedAt: 'April 2026',
    body: [
      {
        type: 'heading',
        content: 'Row-level isolation',
      },
      {
        type: 'text',
        content: 'Every table in FieldSync\'s database has Row Level Security (RLS) enabled. This is PostgreSQL\'s native security mechanism — it\'s not just application-layer filtering. When a query runs, the database itself filters to only rows where company_id matches the authenticated user\'s company. No code path can accidentally return another company\'s data.',
      },
      {
        type: 'callout',
        variant: 'success',
        content: 'Even if there were a bug in FieldSync\'s code, the database enforces isolation independently. Another tenant\'s data is inaccessible at the storage level.',
      },
      {
        type: 'heading',
        content: 'One-click data export',
      },
      {
        type: 'text',
        content: 'Settings → Data → Export Everything. Downloads a ZIP file containing all your data as CSV: clients, jobs, invoices, techs, routes, inbox messages, and alerts. No waiting, no support ticket, no fee. You can export at any time.',
      },
      {
        type: 'heading',
        content: 'Data deletion on cancel',
      },
      {
        type: 'text',
        content: 'When you cancel your FieldSync subscription, we begin deletion of all your data within 30 days. You\'ll receive a deletion confirmation email when complete. We do not retain anonymized or aggregate versions of your data after deletion.',
      },
      {
        type: 'heading',
        content: 'No cross-company data sharing',
      },
      {
        type: 'text',
        content: 'FieldSync does not share, sell, aggregate, or derive insights from your data that benefit other customers or third parties. Your clients\' contact information is never shared or exported to marketing platforms.',
      },
      {
        type: 'heading',
        content: 'No AI training on your data',
      },
      {
        type: 'text',
        content: 'Sofia AI uses your data to answer your questions in the current session. Your data is not used to train any machine learning model — not FieldSync\'s, not the underlying model provider\'s. We use API access with no training data permission.',
      },
      {
        type: 'heading',
        content: 'Credential storage',
      },
      {
        type: 'text',
        content: 'Your CRM credentials (passwords, API keys, OAuth tokens) are encrypted at rest using AES-256 via Supabase Vault before being written to the database. Credentials are never logged. The decrypted values are used only in memory during sync operations and are never transmitted to any third party.',
      },
    ],
  },
];

export function searchHelp(query: string): HelpArticle[] {
  if (!query.trim()) return HELP_ARTICLES;
  const q = query.toLowerCase();
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q)) ||
      a.category.toLowerCase().includes(q)
  );
}

export function getArticlesByCategory(): Map<string, HelpArticle[]> {
  const map = new Map<string, HelpArticle[]>();
  for (const article of HELP_ARTICLES) {
    if (!map.has(article.category)) map.set(article.category, []);
    map.get(article.category)!.push(article);
  }
  return map;
}

export function getArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.id === id);
}
