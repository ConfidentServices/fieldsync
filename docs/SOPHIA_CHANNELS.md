# FieldSync-Sophia: Multi-Channel Communication

## Channels Supported
- Discord: KPI updates to private server + DM conversations
- WhatsApp: via Twilio WhatsApp API
- Telegram: via Telegram Bot API  
- SMS: via Twilio
- Email: daily/weekly digests

## What Sophia Sends Proactively
- 7 AM: Morning brief (revenue, jobs, top 3 alerts)
- Real-time: Urgent alerts (cancellation, complaint, overdue payment)
- Real-time: Payment received notifications
- Real-time: New lead notifications
- 5 PM: Day summary (jobs done, revenue billed, issues caught)

## What Owner Can Ask Sophia
- "Which clients are at risk?"
- "How much AR over 30 days?"
- "Send retention message to [client name]"
- "What's revenue this month vs last?"
- "Can I afford another tech?"
- "Which tech has best QC score?"

## Approval Model
Any action touching clients requires explicit approval:
Sophia: "Should I send the collection email to John Boyd? Reply YES to confirm."
Owner: "YES"
Sophia sends, logs action, updates dashboard.

## At-Risk Client List (Dashboard)
Top at-risk clients shown prominently on main dashboard with:
- Risk signal (specific reason)
- Monthly value at risk
- Churn score
- One-click suggested action

## Reactivation Campaigns
Auto-started when client cancels:
- Day 90: Re-engagement (seasonal angle)
- Day 180: Value proposition update
- Day 365: Final light-touch attempt
All personalized to cancel reason. All require owner approval.
