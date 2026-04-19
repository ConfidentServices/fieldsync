# FieldSync Inventory Intelligence

## Three Flexible Modes

### Mode 1 — Outcome Watching (default, zero workflow change)
Works with how the business already operates. Sophia watches job outcomes and expense data to surface supply intelligence without requiring any new workflow from techs.

Sophia detects:
- Skipped jobs with supply-related notes
- Tech expenses categorized as supplies (cost per job tracking)
- Patterns: same tech skipping same day weekly (supply issue?)
- Weekly schedule → projected chemical consumption estimate

Zero setup. Zero tech training. Intelligence from day one.

### Mode 2 — Light Touch Logging
After job completion, tech gets one optional 10-second prompt:
"Used any supplies beyond standard today? [Yes / No standard visit]"
If Yes: pre-populated checklist based on service type. Tech confirms/adjusts.

Adds: actual usage tracking, per-job cost accuracy, trend analysis.

### Mode 3 — Full Inventory Management
Truck-level and warehouse tracking, supplier price comparison, automated purchase orders, reorder alerts.

## What Sophia Does in Mode 1 (Sun King model)

Weekly projection message (Sunday evening):
"Based on 31 jobs next week, estimated chemical needs: ~30 bags shock, ~8 gal chlorine across your team. Are your techs stocked?"

Cost anomaly alert:
"Carlos's supply expenses this month: $4.20/job average. Team average: $2.80/job. Worth a conversation."

Skip pattern alert:
"3 jobs skipped this week had supply-related notes. Estimated lost revenue: $420."

## Supplier Integrations (Mode 2+)
- Grainger API (HVAC, electrical, plumbing)
- Amazon Business API
- Pool Corp/SCP portal scraping
- Pinch A Penny trade account scraping
- Ferguson portal scraping

Price comparison shown on reorder suggestions.
All orders require owner approval before placement.
