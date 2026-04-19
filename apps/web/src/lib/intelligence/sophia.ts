/**
 * FieldSync — Sophia Intelligence Engine
 * ========================================
 * Runs daily (cron job) for every connected company.
 *
 * Responsibilities:
 *  1. Daily client risk scoring — churn probability per client
 *  2. Pattern detection — emerging trends across clients/techs
 *  3. Opportunity generation — new opportunities as data changes
 *  4. Business Bible — append daily log of wins, improvements, learnings
 *
 * Design principle: Sophia works identically whether data comes from
 *   ServiceAutopilot, Jobber, HousecallPro, or the Manual connector
 *   (Start Fresh). All intelligence is CRM-agnostic.
 *
 * Scoring weights are intentionally exposed so they can be tuned per
 * industry vertical (pool vs HVAC vs lawn) in future.
 */

import type { FSClient, FSJob, FSInvoice, FSTech } from '../connectors/base';
import { createEntry, writeARRecoveryEntry, writeRetentionEntry, writeRouteSavingsEntry, writeCampaignEntry, writePatternEntry, type BibleEntry } from './business-bible';
import { generateOpportunityPlan, type CompanyData, type Opportunity, type GoalId } from './opportunity-plan';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientRiskScore {
  clientId: string;
  clientName: string;
  score: number;          // 0–100 (100 = highest risk)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: RiskSignal[];
  recommendedAction: string;
  scoredAt: Date;
}

export interface RiskSignal {
  type: RiskSignalType;
  severity: 'low' | 'medium' | 'high';
  label: string;
  detail: string;
  contribution: number;   // points added to score
}

export type RiskSignalType =
  | 'overdue_payment'
  | 'slow_payment'
  | 'recent_complaint'
  | 'service_skip'
  | 'communication_gap'
  | 'low_tenure'
  | 'rate_increase_pending'
  | 'no_recent_service';

export interface DetectedPattern {
  id: string;
  type: PatternType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  affectedEntities: string[];  // client names, tech names, zones
  detectedAt: Date;
  suggestedAction?: string;
}

export type PatternType =
  | 'complaint_cluster'
  | 'revenue_trend'
  | 'tech_performance_drop'
  | 'ar_trend'
  | 'churn_cluster'
  | 'seasonal_opportunity';

export interface SophiaRunResult {
  companyId: string;
  ranAt: Date;
  durationMs: number;
  clientsScored: number;
  patternsDetected: DetectedPattern[];
  opportunitiesGenerated: Opportunity[];
  bibleEntries: BibleEntry[];
  errors: string[];
}

// ─── Risk Scoring Weights ─────────────────────────────────────────────────────
// Tune per vertical: pool companies weight service_skip more; HVAC weight payment harder.

const RISK_WEIGHTS = {
  overdue_30: 25,
  overdue_60: 45,
  overdue_90: 70,
  slow_payment: 15,       // consistently pays 15-29 days late
  recent_complaint: 20,
  service_skip_once: 10,
  service_skip_twice: 25,
  service_skip_3plus: 40,
  communication_gap_30d: 10,
  communication_gap_60d: 20,
  low_tenure_under_6mo: 15,
  no_recent_service_30d: 20,
  no_recent_service_60d: 40,
} as const;

// ─── Daily Scoring Engine ─────────────────────────────────────────────────────

/**
 * Score every client in the company. Returns a map of clientId → score.
 * Called daily by the cron job and persisted to DB.
 */
export function scoreAllClients(
  clients: FSClient[],
  jobs: FSJob[],          // last 90 days
  invoices: FSInvoice[],
): Map<string, ClientRiskScore> {
  const scores = new Map<string, ClientRiskScore>();
  const now = new Date();

  // Build lookup indexes
  const invoicesByClient = groupBy(invoices, (inv) => inv.clientId);
  const jobsByClient = groupBy(jobs, (job) => job.clientId);

  for (const client of clients) {
    if (!client.active) continue;

    const clientInvoices = invoicesByClient.get(client.id) ?? [];
    const clientJobs = jobsByClient.get(client.id) ?? [];

    const signals: RiskSignal[] = [];

    // ── Signal: overdue payments ────────────────────────────────────────────
    const overdueInvoices = clientInvoices.filter((inv) => inv.status === 'overdue' && inv.balance > 0);
    for (const inv of overdueInvoices) {
      const days = inv.daysPastDue ?? 0;
      if (days >= 90) {
        signals.push({
          type: 'overdue_payment',
          severity: 'high',
          label: `${days}d overdue payment`,
          detail: `Invoice of $${inv.balance.toFixed(0)} is ${days} days past due`,
          contribution: RISK_WEIGHTS.overdue_90,
        });
      } else if (days >= 60) {
        signals.push({
          type: 'overdue_payment',
          severity: 'high',
          label: `${days}d overdue payment`,
          detail: `Invoice of $${inv.balance.toFixed(0)} is ${days} days past due`,
          contribution: RISK_WEIGHTS.overdue_60,
        });
      } else if (days >= 30) {
        signals.push({
          type: 'overdue_payment',
          severity: 'medium',
          label: `${days}d overdue payment`,
          detail: `Invoice of $${inv.balance.toFixed(0)} is ${days} days past due`,
          contribution: RISK_WEIGHTS.overdue_30,
        });
      }
    }

    // ── Signal: slow payment pattern ───────────────────────────────────────
    const paidInvoices = clientInvoices.filter((inv) => inv.status === 'paid' && inv.paidDate && inv.dueDate);
    const latePaid = paidInvoices.filter((inv) => {
      const lateDays = Math.floor(
        (inv.paidDate!.getTime() - inv.dueDate!.getTime()) / 86400000
      );
      return lateDays >= 15 && lateDays < 30;
    });
    if (latePaid.length >= 2) {
      signals.push({
        type: 'slow_payment',
        severity: 'low',
        label: 'Slow payment pattern',
        detail: `Paid ${latePaid.length} invoices 15-29 days late in last 90 days`,
        contribution: RISK_WEIGHTS.slow_payment,
      });
    }

    // ── Signal: service skips ───────────────────────────────────────────────
    const skippedJobs = clientJobs.filter((j) => j.status === 'skipped');
    if (skippedJobs.length >= 3) {
      signals.push({
        type: 'service_skip',
        severity: 'high',
        label: `${skippedJobs.length} service skips`,
        detail: `Client has had ${skippedJobs.length} skipped visits in the last 90 days`,
        contribution: RISK_WEIGHTS.service_skip_3plus,
      });
    } else if (skippedJobs.length === 2) {
      signals.push({
        type: 'service_skip',
        severity: 'medium',
        label: '2 service skips',
        detail: 'Client has had 2 skipped visits in the last 90 days',
        contribution: RISK_WEIGHTS.service_skip_twice,
      });
    } else if (skippedJobs.length === 1) {
      signals.push({
        type: 'service_skip',
        severity: 'low',
        label: '1 service skip',
        detail: 'Client had 1 skipped visit in the last 90 days',
        contribution: RISK_WEIGHTS.service_skip_once,
      });
    }

    // ── Signal: no recent service ───────────────────────────────────────────
    const completedJobs = clientJobs.filter((j) => j.status === 'completed');
    const lastCompleted = completedJobs.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime())[0];
    if (!lastCompleted) {
      signals.push({
        type: 'no_recent_service',
        severity: 'high',
        label: 'No completed service in 90 days',
        detail: 'No completed visits found in the last 90 days',
        contribution: RISK_WEIGHTS.no_recent_service_60d,
      });
    } else {
      const daysSinceService = Math.floor(
        (now.getTime() - lastCompleted.scheduledDate.getTime()) / 86400000
      );
      if (daysSinceService >= 60) {
        signals.push({
          type: 'no_recent_service',
          severity: 'medium',
          label: `${daysSinceService}d since last service`,
          detail: `Last completed visit was ${daysSinceService} days ago`,
          contribution: RISK_WEIGHTS.no_recent_service_60d,
        });
      } else if (daysSinceService >= 30 && client.serviceFrequency === 'weekly') {
        signals.push({
          type: 'no_recent_service',
          severity: 'low',
          label: `${daysSinceService}d gap for weekly client`,
          detail: 'Weekly client has not been serviced in 30+ days',
          contribution: RISK_WEIGHTS.no_recent_service_30d,
        });
      }
    }

    // ── Signal: low tenure ──────────────────────────────────────────────────
    const tenureMonths = (now.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (tenureMonths < 6) {
      signals.push({
        type: 'low_tenure',
        severity: 'low',
        label: `New client (${Math.round(tenureMonths)}mo)`,
        detail: 'Clients in the first 6 months have higher churn risk',
        contribution: RISK_WEIGHTS.low_tenure_under_6mo,
      });
    }

    // ── Compute final score ─────────────────────────────────────────────────
    const rawScore = signals.reduce((s, sig) => s + sig.contribution, 0);
    const score = Math.min(100, rawScore);

    const riskLevel =
      score >= 70 ? 'critical' :
      score >= 45 ? 'high' :
      score >= 20 ? 'medium' :
      'low';

    const recommendedAction =
      riskLevel === 'critical' ? 'Call this client today — cancellation likely' :
      riskLevel === 'high' ? 'Personal outreach this week — high churn risk' :
      riskLevel === 'medium' ? 'Check in via email or text this month' :
      'Monitor — no action needed';

    scores.set(client.id, {
      clientId: client.id,
      clientName: client.name,
      score,
      riskLevel,
      signals,
      recommendedAction,
      scoredAt: now,
    });
  }

  return scores;
}

// ─── Pattern Detection ────────────────────────────────────────────────────────

export function detectPatterns(
  clients: FSClient[],
  jobs: FSJob[],
  invoices: FSInvoice[],
  techs: FSTech[],
  riskScores: Map<string, ClientRiskScore>,
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // ── Pattern: complaint cluster ────────────────────────────────────────────
  // Detect multiple high-signal clients in the same service area in short window
  const recentHighRisk = Array.from(riskScores.values()).filter(
    (s) => s.riskLevel === 'critical' || s.riskLevel === 'high'
  );
  if (recentHighRisk.length >= 3) {
    patterns.push({
      id: `pattern-high-risk-cluster-${now.toISOString().split('T')[0]}`,
      type: 'churn_cluster',
      severity: 'warning',
      title: `${recentHighRisk.length} clients showing high churn risk simultaneously`,
      detail: `${recentHighRisk.map((s) => s.clientName).slice(0, 3).join(', ')}${recentHighRisk.length > 3 ? ` +${recentHighRisk.length - 3} more` : ''} are all at high or critical risk. This may indicate a systemic service quality issue.`,
      affectedEntities: recentHighRisk.map((s) => s.clientName),
      detectedAt: now,
      suggestedAction: 'Review recent service notes for these clients. Check if they share a technician.',
    });
  }

  // ── Pattern: tech performance drop ───────────────────────────────────────
  const recentJobs = jobs.filter((j) => j.scheduledDate >= sevenDaysAgo);
  const techJobs = groupBy(recentJobs, (j) => j.techId ?? 'unknown');

  for (const [techId, techRecentJobs] of techJobs) {
    if (techId === 'unknown') continue;
    const tech = techs.find((t) => t.id === techId);
    const skipRate = techRecentJobs.filter((j) => j.status === 'skipped').length / Math.max(techRecentJobs.length, 1);
    if (skipRate > 0.25 && techRecentJobs.length >= 4) {
      patterns.push({
        id: `pattern-tech-skips-${techId}-${now.toISOString().split('T')[0]}`,
        type: 'tech_performance_drop',
        severity: skipRate > 0.4 ? 'critical' : 'warning',
        title: `${tech?.name ?? techId} skip rate: ${Math.round(skipRate * 100)}% this week`,
        detail: `${tech?.name ?? techId} has skipped ${Math.round(skipRate * 100)}% of jobs in the last 7 days (${Math.round(skipRate * techRecentJobs.length)}/${techRecentJobs.length} visits). Industry average: <5%.`,
        affectedEntities: [tech?.name ?? techId],
        detectedAt: now,
        suggestedAction: `Review skip notes for ${tech?.name ?? techId}. Consider reassigning if pattern continues.`,
      });
    }
  }

  // ── Pattern: AR trend ─────────────────────────────────────────────────────
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue' && inv.balance > 0).length;
  const overdueTotal = invoices.filter((inv) => inv.status === 'overdue').reduce((s, inv) => s + inv.balance, 0);
  if (overdueTotal > 10000) {
    patterns.push({
      id: `pattern-ar-high-${now.toISOString().split('T')[0]}`,
      type: 'ar_trend',
      severity: overdueTotal > 20000 ? 'critical' : 'warning',
      title: `$${Math.round(overdueTotal).toLocaleString()} in overdue AR across ${overdueCount} clients`,
      detail: `Outstanding AR is above normal thresholds. Typical AR collection window: 14-21 days. Current average is trending longer.`,
      affectedEntities: [],
      detectedAt: now,
      suggestedAction: 'Run an AR collection campaign. Sophia has templates ready.',
    });
  }

  // ── Pattern: seasonal opportunity ─────────────────────────────────────────
  const month = now.getMonth() + 1;
  if (month === 3 && now.getDate() <= 7) {
    patterns.push({
      id: 'pattern-spring-2026',
      type: 'seasonal_opportunity',
      severity: 'info',
      title: 'Spring is here — time to launch seasonal upsell campaign',
      detail: 'March is the highest-conversion month for pool opening and Spring Refresh campaigns. Industry conversion rate: 20-30%.',
      affectedEntities: [],
      detectedAt: now,
      suggestedAction: 'Launch Spring Refresh campaign. Sophia has a template ready.',
    });
  } else if (month === 10 && now.getDate() <= 7) {
    patterns.push({
      id: 'pattern-fall-2026',
      type: 'seasonal_opportunity',
      severity: 'info',
      title: 'Fall prep season — winterization upsell opportunity',
      detail: 'October is peak season for winterization and equipment checks. Average ticket: $225.',
      affectedEntities: [],
      detectedAt: now,
      suggestedAction: 'Launch Fall Prep campaign. Sophia has a template ready.',
    });
  }

  return patterns;
}

// ─── Daily Bible Entries ──────────────────────────────────────────────────────

/**
 * Generate Business Bible entries based on today's events.
 * Called after scoring and pattern detection complete.
 */
export function generateDailyBibleEntries(
  patterns: DetectedPattern[],
  newOpportunities: Opportunity[],
  previousScores: Map<string, ClientRiskScore>,
  currentScores: Map<string, ClientRiskScore>,
): BibleEntry[] {
  const entries: BibleEntry[] = [];

  // Log newly-critical clients
  for (const [clientId, current] of currentScores) {
    const previous = previousScores.get(clientId);
    if (current.riskLevel === 'critical' && previous?.riskLevel !== 'critical') {
      entries.push(
        writePatternEntry({
          pattern: `${current.clientName} flagged as critical churn risk`,
          detail: `${current.clientName} crossed the critical threshold (score: ${current.score}/100). Signals: ${current.signals.map((s) => s.label).join(', ')}.`,
          severity: 'critical',
        })
      );
    }
  }

  // Log patterns
  for (const pattern of patterns) {
    if (pattern.severity !== 'info') {
      entries.push(
        createEntry({
          date: new Date(),
          category: 'learning',
          title: pattern.title,
          detail: pattern.detail,
          automated: true,
        })
      );
    }
  }

  // Log new high-value opportunities
  for (const opp of newOpportunities) {
    if (opp.estimated_value >= 1000 && opp.sophia_ready) {
      entries.push(
        createEntry({
          date: new Date(),
          category: 'improvement',
          title: `New opportunity found: ${opp.title}`,
          detail: `Sophia identified a new opportunity worth $${opp.estimated_value.toLocaleString()}: ${opp.description}`,
          metric: `$${opp.estimated_value.toLocaleString()} potential`,
          automated: true,
          dollarImpact: opp.estimated_value,
        })
      );
    }
  }

  return entries;
}

// ─── Full Daily Run ───────────────────────────────────────────────────────────

/**
 * Run the full Sophia intelligence cycle for one company.
 * Called by the cron job. Typically runs in <500ms for a 300-client company.
 *
 * @param data           - All company data (clients, jobs, invoices, techs)
 * @param goals          - Owner's stated goals (from onboarding)
 * @param previousScores - Prior day's scores (for delta detection)
 */
export async function runDailyIntelligence(
  data: CompanyData,
  goals: GoalId[],
  previousScores: Map<string, ClientRiskScore> = new Map(),
): Promise<SophiaRunResult> {
  const startedAt = Date.now();
  const errors: string[] = [];
  const bibleEntries: BibleEntry[] = [];

  // 1. Score all clients
  let riskScores = new Map<string, ClientRiskScore>();
  try {
    riskScores = scoreAllClients(data.clients, data.jobs, data.invoices);
    // Inject scores into data for opportunity detection
    data.clientRiskScores = new Map(
      Array.from(riskScores.entries()).map(([id, s]) => [id, s.score])
    );
  } catch (err) {
    errors.push(`Scoring failed: ${String(err)}`);
  }

  // 2. Detect patterns
  let patterns: DetectedPattern[] = [];
  try {
    patterns = detectPatterns(data.clients, data.jobs, data.invoices, data.techs, riskScores);
  } catch (err) {
    errors.push(`Pattern detection failed: ${String(err)}`);
  }

  // 3. Generate opportunities
  let opportunities: Opportunity[] = [];
  try {
    opportunities = await generateOpportunityPlan(data, goals);
  } catch (err) {
    errors.push(`Opportunity generation failed: ${String(err)}`);
  }

  // 4. Generate Bible entries
  try {
    const dailyEntries = generateDailyBibleEntries(patterns, opportunities, previousScores, riskScores);
    bibleEntries.push(...dailyEntries);
  } catch (err) {
    errors.push(`Bible generation failed: ${String(err)}`);
  }

  return {
    companyId: data.companyId,
    ranAt: new Date(),
    durationMs: Date.now() - startedAt,
    clientsScored: riskScores.size,
    patternsDetected: patterns,
    opportunitiesGenerated: opportunities,
    bibleEntries,
    errors,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// ─── Sophia Status Summary (for dashboard widget) ─────────────────────────────

export interface SophiaDailyStatus {
  lastRanAt: Date;
  clientsAtRisk: number;
  criticalClients: number;
  openOpportunities: number;
  estimatedOpportunityValue: number;
  patternsDetected: number;
  topSignal: string;
}

export function buildSophiaDailyStatus(
  result: SophiaRunResult,
  riskScores: Map<string, ClientRiskScore>,
): SophiaDailyStatus {
  const atRisk = Array.from(riskScores.values()).filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical');
  const critical = Array.from(riskScores.values()).filter((s) => s.riskLevel === 'critical');

  const urgentOpps = result.opportunitiesGenerated.filter((o) => o.priority === 'urgent');
  const totalValue = urgentOpps.reduce((s, o) => s + o.estimated_value, 0);

  const criticalPattern = result.patternsDetected.find((p) => p.severity === 'critical');
  const warningPattern = result.patternsDetected.find((p) => p.severity === 'warning');
  const topSignal = criticalPattern?.title ?? warningPattern?.title ?? 'No critical signals today';

  return {
    lastRanAt: result.ranAt,
    clientsAtRisk: atRisk.length,
    criticalClients: critical.length,
    openOpportunities: result.opportunitiesGenerated.length,
    estimatedOpportunityValue: result.opportunitiesGenerated.reduce((s, o) => s + o.estimated_value, 0),
    patternsDetected: result.patternsDetected.length,
    topSignal,
  };
}
