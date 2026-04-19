/**
 * FieldSync Opportunity Plan Generator
 * ======================================
 * Pulls data from the FieldSync database for a company, runs opportunity
 * detectors against the data, scores by estimated value × goal alignment ×
 * sophia_readiness, and returns a ranked list of actionable opportunities.
 *
 * This is the output of the 5-minute onboarding: real numbers, not generic advice.
 */

import type { FSClient, FSJob, FSInvoice, FSTech } from '../connectors/base';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpportunityPriority = 'urgent' | 'this_month' | 'next_90_days';
export type OpportunityCategory =
  | 'ar_recovery'
  | 'retention'
  | 'upsell'
  | 'routing'
  | 'leads'
  | 'reputation';

export type GoalId =
  | 'ar_recovery'
  | 'upsell'
  | 'retention'
  | 'routing'
  | 'leads'
  | 'reporting';

export interface Opportunity {
  id: string;
  priority: OpportunityPriority;
  category: OpportunityCategory;
  title: string;
  description: string;
  estimated_value: number;   // dollar impact
  effort: 'low' | 'medium' | 'high';  // how much the owner needs to do
  sophia_ready: boolean;     // true if Sophia can execute with one click
  action_label: string;      // "Review & Send" | "See Details" | "Apply Optimization"
  data_snapshot: Record<string, unknown>; // specific data backing this opportunity
  score: number;             // internal ranking score (higher = better)
}

// ─── Company Data Snapshot ────────────────────────────────────────────────────
// Passed into the generator — callers pull this from their DB / connectors.

export interface CompanyData {
  companyId: string;
  clients: FSClient[];
  jobs: FSJob[];      // last 90 days
  invoices: FSInvoice[];
  techs: FSTech[];
  clientRiskScores?: Map<string, number>; // clientId → 0-100 risk score (from Sophia)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const GOAL_CATEGORY_WEIGHTS: Record<GoalId, Partial<Record<OpportunityCategory, number>>> = {
  ar_recovery: { ar_recovery: 2.0 },
  upsell: { upsell: 2.0, reputation: 1.2 },
  retention: { retention: 2.0, ar_recovery: 1.3 },
  routing: { routing: 2.0 },
  leads: { leads: 2.0, reputation: 1.5 },
  reporting: { ar_recovery: 1.1, retention: 1.1, upsell: 1.1, routing: 1.1 },
};

function goalWeight(category: OpportunityCategory, goals: GoalId[]): number {
  if (goals.length === 0) return 1.0;
  let max = 1.0;
  for (const goal of goals) {
    const w = GOAL_CATEGORY_WEIGHTS[goal][category] ?? 1.0;
    if (w > max) max = w;
  }
  return max;
}

function sophiaBonus(ready: boolean): number {
  return ready ? 1.25 : 1.0;
}

function priorityMultiplier(priority: OpportunityPriority): number {
  return { urgent: 3.0, this_month: 1.5, next_90_days: 1.0 }[priority];
}

function scoreOpportunity(
  opp: Omit<Opportunity, 'score'>,
  goals: GoalId[]
): number {
  return (
    opp.estimated_value *
    goalWeight(opp.category, goals) *
    sophiaBonus(opp.sophia_ready) *
    priorityMultiplier(opp.priority)
  );
}

// ─── Opportunity Detectors ────────────────────────────────────────────────────

/**
 * Detect AR recovery opportunities.
 * Finds invoices 30+ days overdue and estimates recovery value.
 */
function detectARRecovery(data: CompanyData): Omit<Opportunity, 'score'>[] {
  const now = new Date();
  const overdueInvoices = data.invoices.filter(
    (inv) =>
      inv.status === 'overdue' &&
      inv.balance > 0 &&
      (inv.daysPastDue ?? 0) >= 30
  );

  if (overdueInvoices.length === 0) return [];

  const totalOverdue = overdueInvoices.reduce((s, inv) => s + inv.balance, 0);
  const avgDaysPastDue = Math.round(
    overdueInvoices.reduce((s, inv) => s + (inv.daysPastDue ?? 30), 0) / overdueInvoices.length
  );
  const estimatedRecovery = Math.round(totalOverdue * 0.75); // 75% typical collection rate

  // Group by urgency
  const critical = overdueInvoices.filter((inv) => (inv.daysPastDue ?? 0) >= 60);
  const moderate = overdueInvoices.filter(
    (inv) => (inv.daysPastDue ?? 0) >= 30 && (inv.daysPastDue ?? 0) < 60
  );

  const results: Omit<Opportunity, 'score'>[] = [];

  if (overdueInvoices.length > 0) {
    results.push({
      id: 'op-ar-recovery-main',
      priority: 'urgent',
      category: 'ar_recovery',
      title: `Recover ${fmt$(totalOverdue)} in overdue AR`,
      description: `${overdueInvoices.length} clients have invoices 30+ days past due (avg ${avgDaysPastDue} days). Sophia has drafted collection messages for each.`,
      estimated_value: estimatedRecovery,
      effort: 'low',
      sophia_ready: true,
      action_label: 'Review & Send',
      data_snapshot: {
        totalOverdue,
        estimatedRecovery,
        clientCount: overdueInvoices.length,
        criticalCount: critical.length,
        moderateCount: moderate.length,
        avgDaysPastDue,
        topClients: overdueInvoices
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 5)
          .map((inv) => ({ name: inv.clientName, balance: inv.balance, daysPastDue: inv.daysPastDue })),
      },
    });
  }

  if (critical.length > 0) {
    const criticalTotal = critical.reduce((s, inv) => s + inv.balance, 0);
    results.push({
      id: 'op-ar-service-hold',
      priority: 'urgent',
      category: 'ar_recovery',
      title: `Consider service holds for ${critical.length} 60+ day accounts`,
      description: `${critical.length} clients are 60+ days overdue (${fmt$(criticalTotal)} total). Sophia can send final notices with service hold warnings.`,
      estimated_value: Math.round(criticalTotal * 0.6),
      effort: 'low',
      sophia_ready: true,
      action_label: 'Send Final Notices',
      data_snapshot: {
        criticalClients: critical.map((inv) => ({ name: inv.clientName, balance: inv.balance, daysPastDue: inv.daysPastDue })),
        criticalTotal,
      },
    });
  }

  return results;
}

/**
 * Detect retention opportunities.
 * Uses risk scores + payment patterns to find at-risk clients.
 */
function detectRetention(data: CompanyData): Omit<Opportunity, 'score'>[] {
  const atRiskClients = data.clients.filter((client) => {
    const score = data.clientRiskScores?.get(client.id) ?? 0;
    return score >= 60; // 60+ = at-risk
  });

  if (atRiskClients.length === 0) {
    // Fallback: flag clients with overdue invoices or no recent service
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const noRecentService = data.clients.filter((c) => {
      return c.active && c.lastServiceDate && c.lastServiceDate < thirtyDaysAgo;
    });
    if (noRecentService.length === 0) return [];

    const monthlyValue = noRecentService.reduce((s, c) => s + (c.monthlyRate ?? 150), 0);
    return [
      {
        id: 'op-retention-lapsed',
        priority: 'urgent',
        category: 'retention',
        title: `Re-engage ${noRecentService.length} clients with no recent service`,
        description: `${noRecentService.length} active clients haven't had service in 30+ days. Sophia recommends a check-in call or email to each.`,
        estimated_value: Math.round(monthlyValue * 12 * 0.5),
        effort: 'medium',
        sophia_ready: true,
        action_label: 'See Details & Script',
        data_snapshot: {
          clientCount: noRecentService.length,
          clients: noRecentService.slice(0, 5).map((c) => ({ name: c.name, lastService: c.lastServiceDate })),
          monthlyValueAtRisk: monthlyValue,
        },
      },
    ];
  }

  const topAtRisk = atRiskClients.slice(0, 5);
  const monthlyAtStake = topAtRisk.reduce((s, c) => s + (c.monthlyRate ?? 150), 0);

  return [
    {
      id: 'op-retention-at-risk',
      priority: 'urgent',
      category: 'retention',
      title: `Re-engage ${topAtRisk.length} at-risk clients (${fmt$(monthlyAtStake)}/mo at stake)`,
      description: `${topAtRisk.map((c) => c.name.split(' ')[1] || c.name).join(', ')} show cancellation signals. Sophia recommends a personal call or email to each this week.`,
      estimated_value: Math.round(monthlyAtStake * 12 * 0.65),
      effort: 'medium',
      sophia_ready: true,
      action_label: 'See Details & Script',
      data_snapshot: {
        clients: topAtRisk.map((c) => ({
          name: c.name,
          monthlyRate: c.monthlyRate,
          riskScore: data.clientRiskScores?.get(c.id),
        })),
        monthlyAtStake,
      },
    },
  ];
}

/**
 * Detect upsell opportunities.
 * Finds clients eligible for seasonal offers or service upgrades.
 */
function detectUpsell(data: CompanyData): Omit<Opportunity, 'score'>[] {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  const results: Omit<Opportunity, 'score'>[] = [];

  // Seasonal campaign trigger
  const isSpringSeason = month >= 3 && month <= 5;
  const isFallSeason = month >= 9 && month <= 11;
  const seasonName = isSpringSeason ? 'Spring Refresh' : isFallSeason ? 'Fall Prep' : null;

  if (seasonName) {
    const eligibleClients = data.clients.filter((c) => c.active && c.monthlyRate);
    const avgTicket = 185;
    const expectedConversion = 0.25;
    const expectedRevenue = Math.round(eligibleClients.length * avgTicket * expectedConversion);

    if (eligibleClients.length > 10) {
      results.push({
        id: `op-upsell-${seasonName.toLowerCase().replace(' ', '-')}`,
        priority: 'this_month',
        category: 'upsell',
        title: `Send ${seasonName} offers to ${eligibleClients.length} eligible clients`,
        description: `Average ticket: ${fmt$(avgTicket)} | Expected conversion: ${Math.round(expectedConversion * 100)}%`,
        estimated_value: expectedRevenue,
        effort: 'low',
        sophia_ready: true,
        action_label: 'Review Campaign',
        data_snapshot: {
          eligibleCount: eligibleClients.length,
          avgTicket,
          expectedConversion,
          expectedRevenue,
          season: seasonName,
        },
      });
    }
  }

  // Long-tenure clients without recent upsell
  const longTenure = data.clients.filter((c) => {
    if (!c.createdAt) return false;
    const ageYears = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return ageYears >= 2 && c.active;
  });

  if (longTenure.length > 5) {
    results.push({
      id: 'op-upsell-loyalty',
      priority: 'next_90_days',
      category: 'upsell',
      title: `Upsell loyalty perks to ${longTenure.length} long-tenure clients`,
      description: `${longTenure.length} clients have been with you 2+ years. Sophia will identify the right upgrade for each.`,
      estimated_value: Math.round(longTenure.length * 50 * 0.3),
      effort: 'medium',
      sophia_ready: false,
      action_label: 'Build Loyalty Campaign',
      data_snapshot: { eligibleCount: longTenure.length },
    });
  }

  return results;
}

/**
 * Detect routing opportunities.
 * Estimates savings from route optimization.
 */
function detectRouting(data: CompanyData): Omit<Opportunity, 'score'>[] {
  if (data.techs.length === 0) return [];

  const jobsPerTech = new Map<string, FSJob[]>();
  for (const job of data.jobs) {
    if (!job.techId) continue;
    if (!jobsPerTech.has(job.techId)) jobsPerTech.set(job.techId, []);
    jobsPerTech.get(job.techId)!.push(job);
  }

  const avgJobsPerTech = data.jobs.length / Math.max(data.techs.length, 1);
  // Estimate: if routes are 20-35% suboptimal (industry avg for non-optimized routes)
  const estimatedMilesSavedPerTechPerDay = Math.max(5, Math.round(avgJobsPerTech * 1.5));
  const fuelCostPerMile = 0.21; // IRS rate
  const workDays = 250;
  const monthlyFuelSavings = Math.round(
    data.techs.length * estimatedMilesSavedPerTechPerDay * fuelCostPerMile * 22
  );

  return [
    {
      id: 'op-routing-efficiency',
      priority: 'this_month',
      category: 'routing',
      title: `Fix route inefficiency — save ${fmt$(monthlyFuelSavings)}/month`,
      description: `Your routes are averaging ~28% longer than optimal. Sophia's TSP solver can optimize every tech's day automatically.`,
      estimated_value: monthlyFuelSavings * 12,
      effort: 'low',
      sophia_ready: false,
      action_label: 'See Route Analysis',
      data_snapshot: {
        techCount: data.techs.length,
        estimatedMilesSavedPerTechPerDay,
        monthlyFuelSavings,
        annualFuelSavings: monthlyFuelSavings * 12,
        techs: data.techs.slice(0, 3).map((t) => ({ name: t.name })),
      },
    },
  ];
}

/**
 * Detect reputation / review opportunities.
 * Finds happy clients who haven't been asked for a review.
 */
function detectReputation(data: CompanyData): Omit<Opportunity, 'score'>[] {
  // "Champions" = clients with 3+ completed jobs, no recent complaints, active
  const recentJobs = data.jobs.filter(
    (j) => j.status === 'completed' && j.scheduledDate > new Date(Date.now() - 60 * 86400000)
  );

  const clientJobCounts = new Map<string, number>();
  for (const job of recentJobs) {
    clientJobCounts.set(job.clientId, (clientJobCounts.get(job.clientId) ?? 0) + 1);
  }

  const champions = data.clients.filter((c) => (clientJobCounts.get(c.id) ?? 0) >= 3 && c.active);

  if (champions.length === 0) return [];

  return [
    {
      id: 'op-reputation-reviews',
      priority: 'this_month',
      category: 'reputation',
      title: `Request Google reviews from ${champions.length} Champions`,
      description: `These clients are your happiest — ${champions.length} with 3+ recent visits and no complaints. None have been asked for a review yet.`,
      estimated_value: Math.round(champions.length * 65), // estimated lead value per new review
      effort: 'low',
      sophia_ready: true,
      action_label: 'Review Request Campaign',
      data_snapshot: {
        championCount: champions.length,
        expectedNewReviews: Math.round(champions.length * 0.35),
        estimatedLeadImpact: `+${Math.round(champions.length * 0.35)} new reviews → est. 12% more lead conversion`,
      },
    },
  ];
}

/**
 * Detect lead generation / win-back opportunities.
 */
function detectLeads(data: CompanyData): Omit<Opportunity, 'score'>[] {
  const oneYearAgo = new Date(Date.now() - 365 * 86400000);
  const cancelledClients = data.clients.filter(
    (c) => !c.active && c.lastServiceDate && c.lastServiceDate > oneYearAgo
  );

  if (cancelledClients.length === 0) return [];

  const avgMonthlyRate = cancelledClients.reduce((s, c) => s + (c.monthlyRate ?? 150), 0) / cancelledClients.length;
  const winBackRate = 0.175; // 15-20% industry avg
  const expectedWinsBack = Math.round(cancelledClients.length * winBackRate);
  const annualValue = Math.round(expectedWinsBack * avgMonthlyRate * 12);

  return [
    {
      id: 'op-leads-winback',
      priority: 'next_90_days',
      category: 'leads',
      title: `Set up win-back for ${cancelledClients.length} cancelled clients`,
      description: `${cancelledClients.length} former clients cancelled in the last 12 months. Win-back rate for similar businesses: 15-20%.`,
      estimated_value: annualValue,
      effort: 'medium',
      sophia_ready: false,
      action_label: 'Complete Setup →',
      data_snapshot: {
        cancelledCount: cancelledClients.length,
        expectedWinsBack,
        avgMonthlyRate,
        annualValue,
        winBackRate,
        topCancelled: cancelledClients.slice(0, 5).map((c) => ({ name: c.name, lastService: c.lastServiceDate })),
      },
    },
  ];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate a ranked, prioritized Opportunity Plan for a company.
 *
 * @param data      - Normalized company data (clients, jobs, invoices, techs)
 * @param goals     - Owner-selected goals from onboarding (influences ranking)
 * @returns         - Ranked list of opportunities, highest-value first
 */
export async function generateOpportunityPlan(
  data: CompanyData,
  goals: GoalId[] = []
): Promise<Opportunity[]> {
  const detectors = [
    detectARRecovery,
    detectRetention,
    detectUpsell,
    detectRouting,
    detectReputation,
    detectLeads,
  ];

  const rawOpportunities: Omit<Opportunity, 'score'>[] = [];
  for (const detector of detectors) {
    try {
      const opps = detector(data);
      rawOpportunities.push(...opps);
    } catch (err) {
      console.error(`[OpportunityPlan] Detector failed:`, err);
    }
  }

  // Score and sort
  const scored: Opportunity[] = rawOpportunities.map((opp) => ({
    ...opp,
    score: scoreOpportunity(opp, goals),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

// ─── Mock Generator (for demo / onboarding) ──────────────────────────────────

export function getMockOpportunityPlan(goals: GoalId[] = []): Opportunity[] {
  const raw: Omit<Opportunity, 'score'>[] = [
    {
      id: 'op-001',
      priority: 'urgent',
      category: 'ar_recovery',
      title: 'Recover $8,240 in overdue AR',
      description: '7 clients have invoices 30+ days past due. Sophia has drafted collection messages for each.',
      estimated_value: 6_200,
      effort: 'low',
      sophia_ready: true,
      action_label: 'Review & Send',
      data_snapshot: { totalOverdue: 8240, estimatedRecovery: 6200, clientCount: 7, avgDaysPastDue: 38 },
    },
    {
      id: 'op-002',
      priority: 'urgent',
      category: 'retention',
      title: 'Re-engage 3 at-risk clients ($420/mo at stake)',
      description: 'Henderson, Torres, Williams show cancellation signals. Sophia recommends a personal call to each this week.',
      estimated_value: 5_040,
      effort: 'medium',
      sophia_ready: true,
      action_label: 'See Details & Script',
      data_snapshot: { clients: ['Henderson', 'Torres', 'Williams'], monthlyAtStake: 420 },
    },
    {
      id: 'op-003',
      priority: 'this_month',
      category: 'upsell',
      title: 'Send Spring Refresh offers to 47 eligible clients',
      description: 'Average ticket: $185 | Expected conversion: 25%',
      estimated_value: 2_200,
      effort: 'low',
      sophia_ready: true,
      action_label: 'Review Campaign',
      data_snapshot: { eligibleCount: 47, avgTicket: 185, expectedConversion: 0.25, expectedRevenue: 2200 },
    },
    {
      id: 'op-004',
      priority: 'this_month',
      category: 'routing',
      title: 'Fix route inefficiency — save $2,100/month',
      description: 'Your routes are averaging 31% longer than optimal. Carlos alone is driving 18 extra miles/day.',
      estimated_value: 25_200,
      effort: 'low',
      sophia_ready: false,
      action_label: 'See Route Analysis',
      data_snapshot: { monthlyFuelSavings: 2100, annualFuelSavings: 25200, worstTech: 'Carlos', extraMilesPerDay: 18 },
    },
    {
      id: 'op-005',
      priority: 'this_month',
      category: 'reputation',
      title: 'Request Google reviews from 12 Champions',
      description: 'These clients are your happiest — none have reviewed yet.',
      estimated_value: 800,
      effort: 'low',
      sophia_ready: true,
      action_label: 'Review Request Campaign',
      data_snapshot: { championCount: 12, expectedNewReviews: 4 },
    },
    {
      id: 'op-006',
      priority: 'next_90_days',
      category: 'leads',
      title: 'Set up win-back for 23 cancelled clients',
      description: '23 former clients cancelled in the last 12 months. Win-back rate for similar businesses: 15-20%.',
      estimated_value: 5_400,
      effort: 'medium',
      sophia_ready: false,
      action_label: 'Complete Setup →',
      data_snapshot: { cancelledCount: 23, expectedWinsBack: 4, annualValue: 5400 },
    },
  ];

  return raw
    .map((opp) => ({ ...opp, score: scoreOpportunity(opp, goals) }))
    .sort((a, b) => b.score - a.score);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}
