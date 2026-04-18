/**
 * FieldSync — Operations Command Center
 * ======================================
 * What a field service owner sees the moment they log in.
 * 
 * Layout (top → bottom):
 *   1. Header bar
 *   2. Pending Approvals banner (ALL outreach requires approval)
 *   3. Morning Brief KPIs
 *   4. FieldSync ROI This Month
 *   5. AR Aging
 *   6. Route Intelligence (our TSP solver — Google APIs, no routing SaaS)
 *   7. Today's Jobs
 *   8. Visit Completion Status
 *   9. Tech Performance
 *  10. Sofia AI chat with budget indicator
 *  11. Alerts
 */

import { getMockDashboardData } from '@/lib/utils/mock-data';
import { AppNav } from '@/components/AppNav';
import { getInboxSummary } from '@/lib/utils/mock-inbox';

const inboxSummary = getInboxSummary();

const d = getMockDashboardData();

// ─── Formatters ───────────────────────────────────────────────────────────────

const f$ = (n: number, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);

const fPct = (n: number) => `${Math.round(n)}%`;

const fMi = (n: number) => `${n.toFixed(1)} mi`;

function agoBadge(min: number) {
  if (min < 2) return '< 1 min ago';
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)}h ago`;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const statusCls: Record<string, string> = {
  completed: 'text-green-400',
  in_progress: 'text-blue-400',
  scheduled: 'text-slate-500',
  skipped: 'text-yellow-400',
  cancelled: 'text-red-400',
};
const statusLabel: Record<string, string> = {
  completed: 'Done',
  in_progress: 'Active',
  scheduled: 'Scheduled',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
};

const priorityCls: Record<string, string> = {
  critical: 'bg-red-500/15 border-red-500/40 text-red-300',
  high: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  medium: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
  low: 'bg-slate-700/40 border-slate-600/40 text-slate-400',
};

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-slate-500',
};

const approvalTypeCls: Record<string, string> = {
  ar_dunning_email: 'bg-red-500/20 text-red-300 border border-red-500/30',
  ar_dunning_sms: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  visit_completion_notification: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  review_request: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  service_hold_notice: 'bg-red-700/20 text-red-400 border border-red-600/30',
};

const approvalTypeLabel: Record<string, string> = {
  ar_dunning_email: 'AR Email',
  ar_dunning_sms: 'AR SMS',
  visit_completion_notification: 'Visit Summary',
  review_request: 'Review Request',
  service_hold_notice: 'Service Hold',
};

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</h2>
      {right && <div className="text-xs text-slate-500">{right}</div>}
    </div>
  );
}

// ─── 1. Pending Approvals Banner ──────────────────────────────────────────────

function PendingApprovalsBanner() {
  const pending = d.pendingApprovals;
  if (!pending.length) return null;

  const critical = pending.filter((p) => p.priority === 'critical');
  const high = pending.filter((p) => p.priority === 'high');

  return (
    <section className="bg-[#1a0f0a] border border-orange-500/30 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm">
            {pending.length}
          </div>
          <div>
            <h2 className="text-sm font-bold text-orange-300">
              Pending Approvals — Review Before Sending
            </h2>
            <p className="text-xs text-orange-400/70 mt-0.5">
              FieldSync never sends outreach without your approval.{' '}
              {critical.length > 0 && (
                <span className="text-red-400 font-semibold">
                  {critical.length} critical{critical.length === 1 ? '' : 's'} need attention.{' '}
                </span>
              )}
              Each message is ready to review and approve in one click.
            </p>
          </div>
        </div>
        <div className="text-xs text-orange-400/50 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          Approval required
        </div>
      </div>

      <div className="space-y-2">
        {pending.map((appr) => (
          <div
            key={appr.id}
            className={`flex items-start gap-3 rounded-lg border p-3 ${priorityCls[appr.priority]}`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[appr.priority]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    approvalTypeCls[appr.type] ?? 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {approvalTypeLabel[appr.type] ?? appr.type}
                </span>
                <span className="text-sm font-semibold">{appr.recipient}</span>
                {appr.amount && (
                  <span className="text-xs text-red-400">
                    {f$(appr.amount)} · {appr.daysOverdue}d overdue
                  </span>
                )}
                <span className="text-xs opacity-50 ml-auto">{appr.queuedAt}</span>
              </div>
              <p className="text-xs opacity-70 truncate">{appr.preview}</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-2">
              <button className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/30 transition-colors">
                Approve
              </button>
              <button className="px-3 py-1 bg-slate-700/50 border border-slate-600/40 text-slate-400 text-xs rounded-lg hover:bg-slate-700 transition-colors">
                Edit
              </button>
              <button className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors">
                Skip
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-orange-500/20 flex items-center justify-between text-xs text-orange-400/60">
        <span>
          Auto-approve is OFF by default. Enable per-type in Settings → Outreach Approvals.
        </span>
        <button className="text-orange-400 hover:text-orange-300 underline">
          Approve All Safe
        </button>
      </div>
    </section>
  );
}

// ─── 2. Morning Brief ─────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  trend,
  color = 'green',
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'neutral';
}) {
  const valueCls = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    neutral: 'text-slate-200',
  }[color];

  return (
    <Card>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold font-mono ${valueCls}`}>{value}</p>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
      {trend && <p className="text-xs text-slate-600 mt-2">{trend}</p>}
    </Card>
  );
}

// ─── 3. FieldSync ROI This Month ──────────────────────────────────────────────

function ROIThisMonth() {
  const roi = d.roiThisMonth;

  return (
    <Card className="bg-gradient-to-br from-[#0d1f14] to-[#1a1a24] border-green-500/30">
      <SectionTitle right={roi.periodLabel}>
        ⚡ FieldSync ROI This Month
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'AR Recovered',
            value: f$(roi.arRecovered),
            sub: `${roi.arRecoveredCount} invoices`,
            color: 'text-green-400',
          },
          {
            label: 'Fuel Saved',
            value: f$(roi.fuelSaved),
            sub: `${roi.milesSaved} miles`,
            color: 'text-blue-400',
          },
          {
            label: 'Revenue Protected',
            value: f$(roi.revenueProtected),
            sub: `${roi.savesFromCancellation} cancels saved`,
            color: 'text-green-400',
          },
          {
            label: 'Visits Documented',
            value: String(roi.visitsDocumented),
            sub: `${roi.customerNotificationsSent} notified`,
            color: 'text-purple-400',
          },
          {
            label: 'Avg Rating',
            value: roi.avgRating.toFixed(1) + ' ★',
            sub: 'Customer satisfaction',
            color: 'text-yellow-400',
          },
          {
            label: 'Total Value',
            value: f$(roi.totalValue),
            sub: roi.vsLastMonth + ' vs last month',
            color: 'text-green-300',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-black/20 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
            <p className="text-xs text-slate-600">{sub}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-green-600/70 mt-3 text-center">
        "Here's what FieldSync did for your business this month." — Weekly ROI email sent Mondays.
      </p>
    </Card>
  );
}

// ─── 4. AR Aging ──────────────────────────────────────────────────────────────

function ARAging() {
  const ar = d.arAging;
  const total = ar.current + ar.d30 + ar.d60 + ar.d90plus;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <Card>
      <SectionTitle right={`${f$(total)} total open AR`}>AR Aging</SectionTitle>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-4">
        <div className="bg-green-500 transition-all" style={{ width: `${pct(ar.current)}%` }} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${pct(ar.d30)}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${pct(ar.d60)}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${pct(ar.d90plus)}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Current', val: ar.current, clients: ar.currentClients, color: 'text-green-400' },
          { label: '30 days', val: ar.d30, clients: ar.d30Clients, color: 'text-yellow-400' },
          { label: '60 days', val: ar.d60, clients: ar.d60Clients, color: 'text-orange-400' },
          { label: '90+ days', val: ar.d90plus, clients: ar.d90plusClients, color: 'text-red-400' },
        ].map(({ label, val, clients, color }) => (
          <div key={label} className="bg-[#12121a] rounded-lg p-3">
            <p className={`text-lg font-bold font-mono ${color}`}>{f$(val)}</p>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xs text-slate-600">{clients} clients</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 5. Route Intelligence ────────────────────────────────────────────────────

function RouteIntelligence() {
  const ri = d.routeIntelligence;

  return (
    <Card>
      <SectionTitle right={ri.date}>🗺 Route Intelligence</SectionTitle>

      {/* Summary bar */}
      <div className="bg-[#12121a] rounded-lg p-4 mb-4 flex flex-wrap gap-6 items-center">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-red-400">{fMi(ri.totalMilesCurrent)}</p>
          <p className="text-xs text-slate-500">current order</p>
        </div>
        <div className="text-2xl text-slate-600">→</div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-green-400">{fMi(ri.totalMilesOptimized)}</p>
          <p className="text-xs text-slate-500">optimized</p>
        </div>
        <div className="h-8 w-px bg-[#2a2a3a]" />
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-green-400">−{fMi(ri.totalMilesSaved)}</p>
          <p className="text-xs text-slate-500">miles today</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-green-400">{f$(ri.totalFuelSaved, 2)}</p>
          <p className="text-xs text-slate-500">fuel saved</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-blue-400">{ri.totalTimeSavedMin} min</p>
          <p className="text-xs text-slate-500">time saved</p>
        </div>
        <div className="text-center ml-auto">
          <p className="text-xl font-bold font-mono text-green-300">{f$(ri.annualizedSavings)}/yr</p>
          <p className="text-xs text-slate-500">annualized</p>
        </div>
      </div>

      {/* Per-tech rows */}
      <div className="space-y-2">
        {ri.techs.map((tech) => (
          <div
            key={tech.id}
            className={`flex items-center gap-4 rounded-lg border p-3 ${
              tech.approved
                ? 'bg-green-500/5 border-green-500/20'
                : tech.improvement === 'significant'
                ? 'bg-[#12121a] border-[#2a2a3a] hover:border-blue-500/30 transition-colors'
                : 'bg-[#12121a] border-[#2a2a3a]'
            }`}
          >
            <div className="w-20 text-sm font-semibold text-slate-200 shrink-0">{tech.name}</div>
            <div className="text-xs text-slate-500 shrink-0">{tech.jobCount} stops</div>

            {/* Miles comparison */}
            <div className="flex items-center gap-1 text-xs font-mono shrink-0">
              <span className="text-slate-500 line-through">{fMi(tech.currentMiles)}</span>
              <span className="text-slate-600">→</span>
              <span className="text-green-400 font-bold">{fMi(tech.optimizedMiles)}</span>
            </div>

            <div className="text-xs font-mono text-green-400 font-bold shrink-0">
              save {fMi(tech.milesSaved)}
            </div>
            <div className="text-xs text-slate-500 shrink-0">{f$(tech.fuelSaved, 2)} fuel</div>
            <div className="text-xs text-slate-500 shrink-0">{tech.timeSavedMin} min</div>

            <div className="ml-auto flex items-center gap-2">
              {tech.approved ? (
                <>
                  <span className="text-xs text-green-400 font-semibold">✓ Approved {tech.approvedAt}</span>
                  {tech.smsSentAt && (
                    <span className="text-xs text-slate-500">SMS sent {tech.smsSentAt}</span>
                  )}
                </>
              ) : tech.improvement !== 'none' ? (
                <>
                  <a
                    href={tech.googleMapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Preview route ↗
                  </a>
                  <button className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/30 transition-colors">
                    Approve + SMS
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-600">Route OK</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-3">
        Optimized by FieldSync TSP solver (Google Maps geocoding + distance matrix, no routing SaaS).
        Approve → tech gets Google Maps directions link via SMS.
      </p>
    </Card>
  );
}

// ─── 6. Today's Jobs ──────────────────────────────────────────────────────────

function TodaysJobs() {
  const jobs = d.todaysJobs;
  const done = jobs.filter((j) => j.status === 'completed').length;

  return (
    <Card>
      <SectionTitle right={`${done}/${jobs.length} complete`}>Today's Jobs</SectionTitle>
      <div className="divide-y divide-[#2a2a3a]">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-center gap-3 py-2.5">
            <div className="w-20 text-xs font-mono text-slate-500 shrink-0">{job.time}</div>
            <div className="w-20 text-xs font-medium text-slate-300 shrink-0 truncate">{job.tech}</div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200">{job.client}</span>
              <span className="text-xs text-slate-600 ml-2">{job.address}</span>
            </div>
            <div className={`text-xs font-bold font-mono shrink-0 ${statusCls[job.status]}`}>
              {statusLabel[job.status]}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 7. Visit Completion Status ───────────────────────────────────────────────

function VisitCompletionStatus() {
  const vc = d.visitCompletion;
  const completePct = Math.round((vc.fullChecklistComplete / vc.totalVisitsToday) * 100);
  const hasIssues = vc.techs.some((t) => t.issues.length > 0);

  return (
    <Card>
      <SectionTitle>📋 Visit Completion & Customer Notifications</SectionTitle>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Checklist Complete', value: `${vc.fullChecklistComplete}/${vc.totalVisitsToday}`, color: completePct >= 90 ? 'text-green-400' : 'text-yellow-400' },
          { label: 'Photos Captured', value: String(vc.photosCaptured), color: 'text-blue-400' },
          { label: 'Clients Notified', value: String(vc.notificationsSentToday), color: 'text-purple-400' },
          { label: "Today's Avg Rating", value: vc.avgRatingToday.toFixed(1) + ' ★', color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#12121a] rounded-lg p-3 text-center">
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-tech breakdown */}
      <div className="space-y-2">
        {vc.techs.map((tech) => {
          const pct = Math.round((tech.checklistComplete / Math.max(tech.visitsDone, 1)) * 100);
          const ok = pct >= 90;
          return (
            <div
              key={tech.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                tech.issues.length > 0
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-[#12121a] border-[#2a2a3a]'
              }`}
            >
              <div className="w-20 text-sm font-semibold text-slate-200 shrink-0 pt-0.5">{tech.name}</div>
              <div className="flex items-center gap-4 flex-1 flex-wrap">
                <div className="text-xs font-mono">
                  <span className={ok ? 'text-green-400' : 'text-yellow-400'}>{tech.checklistComplete}/{tech.visitsDone}</span>
                  <span className="text-slate-600"> visits</span>
                </div>
                <div className="text-xs text-slate-500">{tech.photosCaptured} photos</div>
                {tech.pendingNotifications > 0 && (
                  <div className="text-xs text-blue-400">{tech.pendingNotifications} notification pending approval</div>
                )}
                {tech.issues.map((issue, i) => (
                  <div key={i} className="text-xs text-yellow-400 flex items-center gap-1">
                    <span>⚠</span> {issue}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {hasIssues && (
        <p className="text-xs text-yellow-500/70 mt-3">
          Incomplete checklists — customer notifications held. Resolve issues to release notifications.
        </p>
      )}
    </Card>
  );
}

// ─── 8. Tech Performance ──────────────────────────────────────────────────────

function TechPerformance() {
  return (
    <Card>
      <SectionTitle>Tech Performance — Today</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a3a]">
              {['Technician', 'Jobs', 'Completion %', 'QC Pass %', 'Rating'].map((h) => (
                <th key={h} className="py-2 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.techPerformance.map((tech) => {
              const compCls = tech.completionRate >= 90 ? 'text-green-400' : tech.completionRate >= 75 ? 'text-yellow-400' : 'text-red-400';
              const qcCls = tech.qcPassRate >= 90 ? 'text-green-400' : tech.qcPassRate >= 75 ? 'text-yellow-400' : 'text-red-400';
              return (
                <tr key={tech.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-[#12121a] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-slate-200">{tech.name}</td>
                  <td className="py-3 px-4 text-sm font-mono text-center">
                    <span className="text-slate-200">{tech.jobsDone}</span>
                    <span className="text-slate-600">/{tech.jobsTotal}</span>
                  </td>
                  <td className={`py-3 px-4 text-sm font-mono text-center font-bold ${compCls}`}>{fPct(tech.completionRate)}</td>
                  <td className={`py-3 px-4 text-sm font-mono text-center font-bold ${qcCls}`}>{fPct(tech.qcPassRate)}</td>
                  <td className="py-3 px-4 text-sm font-mono text-center">
                    <span className="text-yellow-400">{'★'.repeat(Math.round(tech.rating))}</span>
                    <span className="text-slate-600 ml-1 text-xs">{tech.rating.toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── 9. Sofia AI ──────────────────────────────────────────────────────────────

const BUDGET_LABELS: Record<string, { daily: number; label: string }> = {
  starter: { daily: 20, label: 'Starter: $0.20/day' },
  growth: { daily: 100, label: 'Growth: $1.00/day' },
  scale: { daily: -1, label: 'Scale: Unlimited' },
  enterprise: { daily: -1, label: 'Enterprise: Unlimited' },
};

function SofiaAI() {
  const sofia = d.sofia;
  const plan = BUDGET_LABELS[sofia.plan] ?? BUDGET_LABELS.growth;
  const usedPct = plan.daily === -1 ? 0 : Math.min(100, (sofia.usedTodayCents / sofia.dailyBudgetCents) * 100);
  const budgetExhausted = plan.daily !== -1 && sofia.usedTodayCents >= sofia.dailyBudgetCents;
  const remaining = plan.daily === -1 ? null : f$(Math.max(0, (sofia.dailyBudgetCents - sofia.usedTodayCents) / 100), 2);

  return (
    <Card className="bg-[#0f0f1a] border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
            S
          </div>
          <div>
            <h2 className="text-sm font-bold text-purple-300">Sofia — Ask Your Business Anything</h2>
            <p className="text-xs text-slate-500">Natural language queries against your live data</p>
          </div>
        </div>

        {/* Budget indicator */}
        <div className="text-right">
          <p className="text-xs text-slate-500">{plan.label}</p>
          {plan.daily !== -1 ? (
            <>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usedPct > 80 ? 'bg-red-500' : usedPct > 50 ? 'bg-yellow-400' : 'bg-purple-500'
                    }`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{remaining} left</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-purple-400 mt-1">Unlimited</p>
          )}
        </div>
      </div>

      {/* Recent queries */}
      <div className="space-y-1 mb-4">
        {sofia.recentQueries.map((q, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-1 border-b border-[#2a2a3a] last:border-0">
            <span className="text-purple-500/50">Q:</span>
            <span className="flex-1 text-slate-400">{q.q}</span>
            <span className="text-slate-600 shrink-0">{q.ago}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      {budgetExhausted ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-sm font-semibold text-red-400">
            You've used your available daily credits. Upgrade for more.
          </p>
          <button className="mt-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-500/30 transition-colors">
            Upgrade Plan
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask Sofia: 'Which clients are most at risk this week?' or 'Who owes over $200?'"
            className="flex-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
          />
          <button className="px-4 py-2.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold rounded-lg hover:bg-purple-500/30 transition-colors shrink-0">
            Ask
          </button>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-2">
        {sofia.queriestoday} queries today · Your data is never used for training · Isolated to your account
      </p>
    </Card>
  );
}

// ─── 10. Alerts ───────────────────────────────────────────────────────────────

function Alerts() {
  return (
    <section>
      <SectionTitle right={`${d.alerts.length} unresolved`}>Alerts</SectionTitle>
      <div className="space-y-2">
        {d.alerts.map((alert) => (
          <div key={alert.id} className={`flex items-start gap-3 border rounded-lg p-3.5 ${priorityCls[alert.priority]}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[alert.priority]}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs opacity-70 mt-0.5">{alert.detail}</p>
            </div>
            <div className="text-xs opacity-40 shrink-0">{alert.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const completionPct = d.summary.jobsCompleted / Math.max(d.summary.jobsScheduled, 1) * 100;
  const mtdPct = Math.round((d.summary.revenueMTD / d.summary.revenueMTDGoal) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans">

      <AppNav
        companyName={d.company.name}
        inboxUnread={inboxSummary.unread}
        pendingApprovals={d.pendingApprovals.length}
        syncMinutesAgo={d.company.syncMinutesAgo}
        crmType={d.company.crmType}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Pending Approvals — top, always visible */}
        <PendingApprovalsBanner />

        {/* Morning Brief */}
        <section>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Morning Brief</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Today's Revenue"
              value={f$(d.summary.revenueToday)}
              sub={`MTD: ${f$(d.summary.revenueMTD)} · ${mtdPct}% of goal`}
              trend="↑ 8% vs last month"
              color="green"
            />
            <KPICard
              label="Jobs"
              value={`${d.summary.jobsCompleted}/${d.summary.jobsScheduled}`}
              sub={`${fPct(completionPct)} complete · ${d.summary.jobsSkipped} skipped`}
              color={completionPct >= 80 ? 'green' : completionPct >= 60 ? 'yellow' : 'red'}
            />
            <KPICard
              label="Open AR"
              value={f$(d.summary.openAR)}
              sub={`${d.summary.overdueClients} clients overdue`}
              trend="FieldSync Recover active"
              color={d.summary.openAR > 15000 ? 'yellow' : 'neutral'}
            />
            <KPICard
              label="Alerts"
              value={String(d.summary.activeAlerts)}
              sub={`${d.summary.criticalAlerts} critical · ${d.pendingApprovals.length} pending approval`}
              color={d.summary.criticalAlerts > 0 ? 'red' : d.summary.activeAlerts > 4 ? 'yellow' : 'green'}
            />
          </div>
        </section>

        {/* FieldSync ROI */}
        <ROIThisMonth />

        {/* AR Aging */}
        <ARAging />

        {/* Route Intelligence — our TSP solver */}
        <RouteIntelligence />

        {/* Two-column: Jobs + Visit Completion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysJobs />
          <VisitCompletionStatus />
        </div>

        {/* Tech Performance */}
        <TechPerformance />

        {/* Sofia AI */}
        <SofiaAI />

        {/* Alerts */}
        <Alerts />

        {/* Data Protection Footer */}
        <div className="bg-[#0f0f18] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data Protection</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
            {[
              { icon: '🔒', text: 'Full row-level isolation — no cross-tenant data access, ever' },
              { icon: '📤', text: 'One-click data export — your data, anytime, no questions asked' },
              { icon: '🗑', text: 'Complete data deletion on cancel — nothing retained' },
              { icon: '🚫', text: 'Your data is never used for model training. Never.' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className="text-center text-xs text-slate-700 pb-4">
          FieldSync · Field Service Intelligence Platform ·{' '}
          <span className="text-green-700">Demo mode — connect your CRM to go live</span>
        </footer>

      </main>
    </div>
  );
}
