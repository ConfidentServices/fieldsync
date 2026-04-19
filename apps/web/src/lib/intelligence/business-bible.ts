/**
 * FieldSync Business Bible
 * =========================
 * A running operational log of everything Sophia has done for your business.
 * Sophia appends entries daily. Owners read it like a journal of their business improving.
 *
 * "On April 18, the Spring Refresh campaign converted 11/47 clients, generating $2,035.
 *  This is 23% above the industry average conversion rate."
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BibleCategory = 'win' | 'improvement' | 'process' | 'learning' | 'milestone';

export interface BibleEntry {
  id: string;
  date: Date;
  category: BibleCategory;
  title: string;
  detail: string;
  metric?: string;        // "$420 recovered", "3 clients retained", "15 miles saved"
  automated: boolean;     // true if Sophia did it; false if owner did it
  relatedClients?: string[];
  relatedTechs?: string[];
  dollarImpact?: number;  // numeric version of metric for aggregation
}

export interface BibleSummary {
  totalEntries: number;
  totalDollarImpact: number;
  entriesByCategory: Record<BibleCategory, number>;
  recentHighlights: BibleEntry[];
  sinceDate: Date;
}

export interface BibleFeedItem {
  date: Date;
  dateLabel: string;      // "Yesterday", "Monday", "April 18"
  entries: BibleEntry[];
  totalDollarImpact: number;
}

// ─── Category Config ──────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<BibleCategory, { label: string; emoji: string; color: string }> = {
  win: { label: 'Win', emoji: '🏆', color: 'text-green-400' },
  improvement: { label: 'Improvement', emoji: '📈', color: 'text-blue-400' },
  process: { label: 'Process', emoji: '⚙️', color: 'text-purple-400' },
  learning: { label: 'Learning', emoji: '💡', color: 'text-yellow-400' },
  milestone: { label: 'Milestone', emoji: '🎯', color: 'text-orange-400' },
};

// ─── ID Generation ────────────────────────────────────────────────────────────

function generateId(): string {
  return `bible-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Bible Operations ─────────────────────────────────────────────────────────

/**
 * Create a new Bible entry.
 */
export function createEntry(
  params: Omit<BibleEntry, 'id'>
): BibleEntry {
  return { id: generateId(), ...params };
}

/**
 * Append multiple entries to an existing Bible log.
 */
export function appendEntries(
  bible: BibleEntry[],
  newEntries: BibleEntry[]
): BibleEntry[] {
  return [...bible, ...newEntries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

/**
 * Get entries for a specific date range.
 */
export function getEntriesInRange(
  bible: BibleEntry[],
  from: Date,
  to: Date
): BibleEntry[] {
  return bible.filter(
    (e) => e.date >= from && e.date <= to
  );
}

/**
 * Get the last N days of entries as a feed, grouped by day.
 */
export function getBibleFeed(
  bible: BibleEntry[],
  days: number = 7
): BibleFeedItem[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = bible.filter((e) => e.date >= cutoff);

  // Group by date string
  const grouped = new Map<string, BibleEntry[]>();
  for (const entry of recent) {
    const key = entry.date.toISOString().split('T')[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const feed: BibleFeedItem[] = [];
  for (const [dateStr, entries] of Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]))) {
    let dateLabel: string;
    if (dateStr === today) dateLabel = 'Today';
    else if (dateStr === yesterday) dateLabel = 'Yesterday';
    else {
      const d = new Date(dateStr + 'T12:00:00');
      dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const totalDollarImpact = entries.reduce((s, e) => s + (e.dollarImpact ?? 0), 0);
    feed.push({ date: new Date(dateStr), dateLabel, entries, totalDollarImpact });
  }

  return feed;
}

/**
 * Compute summary stats for the Bible.
 */
export function getBibleSummary(
  bible: BibleEntry[],
  sinceDate?: Date
): BibleSummary {
  const filtered = sinceDate ? bible.filter((e) => e.date >= sinceDate) : bible;

  const entriesByCategory = {
    win: 0, improvement: 0, process: 0, learning: 0, milestone: 0,
  } as Record<BibleCategory, number>;

  let totalDollarImpact = 0;

  for (const entry of filtered) {
    entriesByCategory[entry.category] = (entriesByCategory[entry.category] ?? 0) + 1;
    totalDollarImpact += entry.dollarImpact ?? 0;
  }

  const recentHighlights = filtered
    .filter((e) => e.category === 'win' || e.category === 'milestone')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return {
    totalEntries: filtered.length,
    totalDollarImpact,
    entriesByCategory,
    recentHighlights,
    sinceDate: sinceDate ?? (filtered[filtered.length - 1]?.date ?? new Date()),
  };
}

/**
 * Format a Bible entry as a human-readable sentence.
 */
export function formatEntry(entry: BibleEntry): string {
  const cat = CATEGORY_CONFIG[entry.category];
  const prefix = entry.automated ? 'Sophia' : 'You';
  const dateStr = entry.date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
  });
  const metric = entry.metric ? ` (${entry.metric})` : '';
  return `${cat.emoji} On ${dateStr}, ${prefix} ${entry.detail}${metric}.`;
}

// ─── Sophia Bible Writers ─────────────────────────────────────────────────────
// These are called by the Sophia engine after each automated action.

export function writeARRecoveryEntry(params: {
  clientName: string;
  amount: number;
  daysOverdue: number;
}): BibleEntry {
  return createEntry({
    date: new Date(),
    category: 'win',
    title: `Collected ${formatDollar(params.amount)} from ${params.clientName}`,
    detail: `collected an overdue invoice of ${formatDollar(params.amount)} (${params.daysOverdue} days past due) from ${params.clientName}`,
    metric: formatDollar(params.amount) + ' recovered',
    automated: true,
    relatedClients: [params.clientName],
    dollarImpact: params.amount,
  });
}

export function writeRetentionEntry(params: {
  clientName: string;
  monthlyValue: number;
  action: string;
}): BibleEntry {
  return createEntry({
    date: new Date(),
    category: 'win',
    title: `Retained ${params.clientName} — ${formatDollar(params.monthlyValue * 12)}/year protected`,
    detail: `${params.action} for ${params.clientName}, preventing a potential cancellation worth ${formatDollar(params.monthlyValue)}/month`,
    metric: `${formatDollar(params.monthlyValue * 12)}/year protected`,
    automated: true,
    relatedClients: [params.clientName],
    dollarImpact: params.monthlyValue * 12,
  });
}

export function writeRouteSavingsEntry(params: {
  techName: string;
  milesSaved: number;
  dollarsSaved: number;
}): BibleEntry {
  return createEntry({
    date: new Date(),
    category: 'improvement',
    title: `Saved ${params.milesSaved} miles on ${params.techName}'s route`,
    detail: `optimized ${params.techName}'s route, saving ${params.milesSaved} miles and ${formatDollar(params.dollarsSaved)} in fuel`,
    metric: `${params.milesSaved} miles · ${formatDollar(params.dollarsSaved)} saved`,
    automated: true,
    relatedTechs: [params.techName],
    dollarImpact: params.dollarsSaved,
  });
}

export function writeCampaignEntry(params: {
  campaignName: string;
  sent: number;
  converted: number;
  revenue: number;
  industryAvgRate?: number;
}): BibleEntry {
  const convRate = params.sent > 0 ? Math.round((params.converted / params.sent) * 100) : 0;
  const vsIndustry = params.industryAvgRate
    ? ` This is ${convRate > params.industryAvgRate ? `${Math.round(((convRate - params.industryAvgRate) / params.industryAvgRate) * 100)}% above` : `${Math.round(((params.industryAvgRate - convRate) / params.industryAvgRate) * 100)}% below`} the industry average.`
    : '';

  return createEntry({
    date: new Date(),
    category: 'win',
    title: `${params.campaignName} converted ${params.converted}/${params.sent} clients`,
    detail: `the ${params.campaignName} campaign converted ${params.converted} of ${params.sent} clients, generating ${formatDollar(params.revenue)}.${vsIndustry}`,
    metric: formatDollar(params.revenue) + ' revenue',
    automated: true,
    dollarImpact: params.revenue,
  });
}

export function writePatternEntry(params: {
  pattern: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}): BibleEntry {
  return createEntry({
    date: new Date(),
    category: 'learning',
    title: params.pattern,
    detail: params.detail,
    automated: true,
  });
}

export function writeMilestoneEntry(params: {
  title: string;
  detail: string;
  metric: string;
  dollarImpact?: number;
}): BibleEntry {
  return createEntry({
    date: new Date(),
    category: 'milestone',
    title: params.title,
    detail: params.detail,
    metric: params.metric,
    automated: false,
    dollarImpact: params.dollarImpact,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDollar(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Mock Bible Data ──────────────────────────────────────────────────────────
// Used in demos / dashboard until real data is available.

export function getMockBible(): BibleEntry[] {
  const d = (daysAgo: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - daysAgo);
    return dt;
  };

  return [
    {
      id: 'bible-001',
      date: d(0),
      category: 'win',
      title: 'Collected $420 from Henderson',
      detail: 'collected an overdue invoice of $420 (31 days past due) from Henderson',
      metric: '$420 recovered',
      automated: true,
      relatedClients: ['Henderson'],
      dollarImpact: 420,
    },
    {
      id: 'bible-002',
      date: d(0),
      category: 'improvement',
      title: 'Saved 12 miles on Carlos\'s route',
      detail: 'optimized Carlos\'s route, saving 12 miles and $37 in fuel',
      metric: '12 miles · $37 saved',
      automated: true,
      relatedTechs: ['Carlos'],
      dollarImpact: 37,
    },
    {
      id: 'bible-003',
      date: d(0),
      category: 'process',
      title: 'Sent 5 review requests',
      detail: 'sent Google review requests to 5 champion clients who have never reviewed',
      metric: '5 requests sent',
      automated: true,
      dollarImpact: 0,
    },
    {
      id: 'bible-004',
      date: d(1),
      category: 'win',
      title: 'Spring Refresh campaign: 11/47 conversions',
      detail: 'the Spring Refresh campaign converted 11 of 47 clients, generating $2,035. This is 23% above the industry average conversion rate.',
      metric: '$2,035 revenue',
      automated: true,
      dollarImpact: 2035,
    },
    {
      id: 'bible-005',
      date: d(1),
      category: 'learning',
      title: 'Pattern detected: 3 complaints in Zone 4',
      detail: 'identified 3 client complaints in Zone 4 this week, suggesting a possible tech or equipment issue. Flagged for review.',
      automated: true,
    },
    {
      id: 'bible-006',
      date: d(2),
      category: 'win',
      title: 'Retained Torres — $185/mo protected',
      detail: 'sent a proactive check-in to Torres after detecting cancellation signals. Client confirmed they are staying.',
      metric: '$2,220/year protected',
      automated: true,
      relatedClients: ['Torres'],
      dollarImpact: 2220,
    },
    {
      id: 'bible-007',
      date: d(3),
      category: 'milestone',
      title: 'Crossed $60K MRR',
      detail: 'monthly recurring revenue exceeded $60,000 for the first time. FieldSync has contributed $4,200 in recovered AR and retained clients this month.',
      metric: '$60K MRR',
      automated: false,
      dollarImpact: 60000,
    },
    {
      id: 'bible-008',
      date: d(5),
      category: 'improvement',
      title: 'Reduced average AR age from 31 to 24 days',
      detail: 'AR collection campaigns over the past 30 days reduced the average outstanding invoice age from 31 to 24 days.',
      metric: '7 days faster collection',
      automated: true,
      dollarImpact: 1200,
    },
  ];
}
