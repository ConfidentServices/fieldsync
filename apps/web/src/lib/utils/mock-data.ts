/**
 * FieldSync Mock / Demo Data
 * ==========================
 * Used in the dashboard until a real CRM connection is made.
 * Represents a realistic mid-size pool service company: ~180 clients, 4 techs.
 */

export function getMockDashboardData() {
  return {
    company: {
      name: 'Sunset Pool Service',
      slug: 'sunset-pool',
      syncMinutesAgo: 4,
      plan: 'growth' as const,
      crmType: 'ServiceAutopilot',
    },

    // ── Morning Brief ───────────────────────────────────────────────────────
    summary: {
      revenueToday: 3840,
      revenueMTD: 61_200,
      revenueMTDGoal: 72_000,
      jobsScheduled: 38,
      jobsCompleted: 24,
      jobsSkipped: 2,
      openAR: 18_460,
      overdueClients: 11,
      activeAlerts: 7,
      criticalAlerts: 2,
    },

    // ── AR Aging ────────────────────────────────────────────────────────────
    arAging: {
      current: 9_200,
      currentClients: 23,
      d30: 5_440,
      d30Clients: 14,
      d60: 2_380,
      d60Clients: 6,
      d90plus: 1_440,
      d90plusClients: 4,
    },

    // ── Pending Approvals ───────────────────────────────────────────────────
    pendingApprovals: [
      {
        id: 'appr-001',
        type: 'ar_dunning_email',
        priority: 'high' as const,
        recipient: 'David Chen',
        contact: 'dchen@email.com',
        subject: 'Quick note about your Sunset Pool payment',
        preview: "Hi David, we tried to process your monthly payment of $210 today but ran into a small hiccup...",
        amount: 210,
        daysOverdue: 14,
        queuedAt: '8:02 AM',
      },
      {
        id: 'appr-002',
        type: 'ar_dunning_sms',
        priority: 'medium' as const,
        recipient: 'Maria Santos',
        contact: '(813) 555-0142',
        subject: 'SMS: Payment reminder',
        preview: "Sunset Pool: Friendly reminder — $185 is still outstanding. Your pool visit is Thursday. Update card: [link]",
        amount: 185,
        daysOverdue: 7,
        queuedAt: '8:02 AM',
      },
      {
        id: 'appr-003',
        type: 'visit_completion_notification',
        priority: 'low' as const,
        recipient: 'Robert Kim',
        contact: 'rkim@gmail.com',
        subject: "Your pool service is complete — here's today's report",
        preview: "Hi Robert, Carlos just finished your pool service. Chemistry is balanced, filter cleaned, equipment looks great...",
        amount: null,
        daysOverdue: null,
        queuedAt: '11:34 AM',
      },
      {
        id: 'appr-004',
        type: 'ar_dunning_email',
        priority: 'critical' as const,
        recipient: 'Patricia Wolfe',
        contact: 'p.wolfe@email.com',
        subject: "Your service may be paused — we want to avoid that",
        preview: "Hi Patricia, we haven't been able to process your payment of $420 and we've reached the point where...",
        amount: 420,
        daysOverdue: 31,
        queuedAt: '8:02 AM',
      },
      {
        id: 'appr-005',
        type: 'review_request',
        priority: 'low' as const,
        recipient: 'James Monroe',
        contact: 'jmonroe@gmail.com',
        subject: "How was your pool service today?",
        preview: "Hi James, we hope you love the results. It would mean a lot if you left us a quick review — it only takes 30 seconds...",
        amount: null,
        daysOverdue: null,
        queuedAt: '2:15 PM',
      },
    ],

    // ── FieldSync ROI This Month ─────────────────────────────────────────────
    roiThisMonth: {
      periodLabel: 'April 1–18, 2026',
      arRecovered: 3_840,
      arRecoveredCount: 9,      // invoices collected
      milesSaved: 312,
      fuelSaved: 65.52,         // miles * $0.21
      visitsDocumented: 247,
      customerNotificationsSent: 193,
      avgRating: 4.8,
      savesFromCancellation: 3,
      revenueProtected: 1_620,  // saves * avg monthly rate
      totalValue: 5_525,        // all-in
      vsLastMonth: '+14%',
    },

    // ── Route Intelligence ──────────────────────────────────────────────────
    routeIntelligence: {
      date: 'Today, April 18',
      totalMilesCurrent: 187,
      totalMilesOptimized: 149,
      totalMilesSaved: 38,
      totalFuelSaved: 7.98,
      totalTimeSavedMin: 91,
      annualizedSavings: 1_995,
      techs: [
        {
          id: 'tech-001',
          name: 'Carlos M.',
          jobCount: 11,
          currentMiles: 52,
          optimizedMiles: 38,
          milesSaved: 14,
          fuelSaved: 2.94,
          timeSavedMin: 34,
          annualizedSavings: 735,
          improvement: 'significant' as 'significant' | 'minor' | 'none',
          googleMapsLink: 'https://www.google.com/maps/dir/?api=1&origin=27.9506,82.4572&destination=27.8812,82.5012&waypoints=27.9321,82.4890|27.9104,82.4701',
          approved: false,
        },
        {
          id: 'tech-002',
          name: 'Mike T.',
          jobCount: 9,
          currentMiles: 48,
          optimizedMiles: 40,
          milesSaved: 8,
          fuelSaved: 1.68,
          timeSavedMin: 19,
          annualizedSavings: 420,
          improvement: 'significant' as 'significant' | 'minor' | 'none',
          googleMapsLink: 'https://www.google.com/maps/dir/?api=1&origin=27.9506,82.4572&destination=27.8612,82.4812',
          approved: false,
        },
        {
          id: 'tech-003',
          name: 'Tony R.',
          jobCount: 10,
          currentMiles: 51,
          optimizedMiles: 43,
          milesSaved: 8,
          fuelSaved: 1.68,
          timeSavedMin: 19,
          annualizedSavings: 420,
          improvement: 'significant' as 'significant' | 'minor' | 'none',
          googleMapsLink: 'https://www.google.com/maps/dir/?api=1&origin=27.9506,82.4572&destination=27.8912,82.5212',
          approved: true,
          approvedAt: '7:48 AM',
          smsSentAt: '7:49 AM',
        },
        {
          id: 'tech-004',
          name: 'James K.',
          jobCount: 8,
          currentMiles: 36,
          optimizedMiles: 28,
          milesSaved: 8,
          fuelSaved: 1.68,
          timeSavedMin: 19,
          annualizedSavings: 420,
          improvement: 'minor' as 'significant' | 'minor' | 'none',
          googleMapsLink: 'https://www.google.com/maps/dir/?api=1&origin=27.9506,82.4572&destination=27.8412,82.4412',
          approved: false,
        },
      ],
      weeklyTrend: [
        { week: 'Apr 7', milesSaved: 28 },
        { week: 'Apr 14', milesSaved: 34 },
        { week: 'Apr 18', milesSaved: 38 },
      ],
    },

    // ── Today's Jobs ────────────────────────────────────────────────────────
    todaysJobs: [
      { id: 'j-001', time: '7:00 AM', tech: 'Carlos M.', client: 'Robert Kim', address: '4821 Bay Shore Blvd, Tampa', status: 'completed' as const },
      { id: 'j-002', time: '7:45 AM', tech: 'Mike T.', client: 'Linda Park', address: '2203 Bayshore Blvd, Tampa', status: 'completed' as const },
      { id: 'j-003', time: '8:00 AM', tech: 'Carlos M.', client: 'Thomas Webb', address: '916 Euclid Ave, Tampa', status: 'completed' as const },
      { id: 'j-004', time: '8:30 AM', tech: 'Tony R.', client: 'Susan Clark', address: '3401 W Swann Ave, Tampa', status: 'completed' as const },
      { id: 'j-005', time: '9:00 AM', tech: 'James K.', client: 'Brian Foster', address: '1105 S Dale Mabry, Tampa', status: 'completed' as const },
      { id: 'j-006', time: '9:15 AM', tech: 'Carlos M.', client: 'Jennifer Lee', address: '2847 W Horatio St, Tampa', status: 'completed' as const },
      { id: 'j-007', time: '9:30 AM', tech: 'Mike T.', client: 'David Chen', address: '5502 W Neptune St, Tampa', status: 'skipped' as const },
      { id: 'j-008', time: '10:00 AM', tech: 'Tony R.', client: 'Patricia Wolfe', address: '7234 N Rome Ave, Tampa', status: 'in_progress' as const },
      { id: 'j-009', time: '10:30 AM', tech: 'Carlos M.', client: 'Mark Johnson', address: '3318 W Palmetto St, Tampa', status: 'in_progress' as const },
      { id: 'j-010', time: '11:00 AM', tech: 'James K.', client: 'Anna Rodriguez', address: '4401 W Spruce St, Tampa', status: 'scheduled' as const },
      { id: 'j-011', time: '11:30 AM', tech: 'Mike T.', client: 'Kevin Walsh', address: '1867 W Azeele St, Tampa', status: 'scheduled' as const },
      { id: 'j-012', time: '1:00 PM', tech: 'Tony R.', client: 'Carol Simpson', address: '6103 N Howard Ave, Tampa', status: 'scheduled' as const },
    ],

    // ── Visit Completion Status ─────────────────────────────────────────────
    visitCompletion: {
      totalVisitsToday: 24,
      fullChecklistComplete: 19,
      pendingReview: 3,
      incomplete: 2,
      photosCaptured: 67,
      notificationsSentToday: 19,
      avgRatingToday: 4.9,
      techs: [
        {
          id: 'tech-001',
          name: 'Carlos M.',
          visitsDone: 7,
          checklistComplete: 6,
          photosCaptured: 21,
          pendingNotifications: 1,
          issues: [] as string[],
        },
        {
          id: 'tech-002',
          name: 'Mike T.',
          visitsDone: 5,
          checklistComplete: 4,
          photosCaptured: 13,
          pendingNotifications: 1,
          issues: ['Neptune St — before photo missing'],
        },
        {
          id: 'tech-003',
          name: 'Tony R.',
          visitsDone: 6,
          checklistComplete: 5,
          photosCaptured: 18,
          pendingNotifications: 1,
          issues: ['Palmetto St — chemistry test not logged'],
        },
        {
          id: 'tech-004',
          name: 'James K.',
          visitsDone: 6,
          checklistComplete: 4,
          photosCaptured: 15,
          pendingNotifications: 0,
          issues: ['Spruce St — equipment check incomplete', 'Dale Mabry — after photo missing'],
        },
      ],
    },

    // ── Tech Performance ────────────────────────────────────────────────────
    techPerformance: [
      { id: 'tech-001', name: 'Carlos M.', jobsDone: 7, jobsTotal: 11, completionRate: 96, qcPassRate: 94, rating: 4.9 },
      { id: 'tech-002', name: 'Mike T.', jobsDone: 5, jobsTotal: 9, completionRate: 78, qcPassRate: 82, rating: 4.6 },
      { id: 'tech-003', name: 'Tony R.', jobsDone: 7, jobsTotal: 10, completionRate: 89, qcPassRate: 91, rating: 4.8 },
      { id: 'tech-004', name: 'James K.', jobsDone: 5, jobsTotal: 8, completionRate: 84, qcPassRate: 79, rating: 4.5 },
    ],

    // ── Sofia AI ────────────────────────────────────────────────────────────
    sofia: {
      plan: 'growth',
      dailyBudgetCents: 10_000,
      usedTodayCents: 3_420,
      queriestoday: 7,
      recentQueries: [
        { q: 'Which clients are most at risk of churning?', ago: '2h ago' },
        { q: 'How much AR is 60+ days overdue?', ago: '4h ago' },
        { q: 'Which tech has the best QC pass rate this month?', ago: 'Yesterday' },
      ],
    },

    // ── Alerts ──────────────────────────────────────────────────────────────
    alerts: [
      {
        id: 'a-001',
        priority: 'critical' as const,
        type: 'ar_overdue',
        title: 'Patricia Wolfe — $420 overdue 31 days',
        detail: '3-year client, LTV $6,800. Unresponsive to 3 emails. Recommend personal call.',
        time: '8:02 AM',
      },
      {
        id: 'a-002',
        priority: 'critical' as const,
        type: 'ar_overdue',
        title: 'Frank Morris — $380 overdue 28 days',
        detail: 'Soft decline twice (insufficient funds). Next retry scheduled for Monday.',
        time: '8:02 AM',
      },
      {
        id: 'a-003',
        priority: 'high' as const,
        type: 'qc_fail',
        title: 'Mike T. — Neptune St job missing before photo',
        detail: 'Pool service completed but before photo not captured. Client notification held.',
        time: '9:47 AM',
      },
      {
        id: 'a-004',
        priority: 'high' as const,
        type: 'job_skipped',
        title: 'David Chen — Job skipped (Neptune St)',
        detail: 'Marked skipped at 9:30 AM. No note. Client not notified yet.',
        time: '9:31 AM',
      },
      {
        id: 'a-005',
        priority: 'medium' as const,
        type: 'churn_risk',
        title: '3 clients have cards expiring this month',
        detail: 'Auto-update pending for 2. Robert K. needs manual update.',
        time: '8:00 AM',
      },
      {
        id: 'a-006',
        priority: 'medium' as const,
        type: 'qc_fail',
        title: "James K. — 2 incomplete checklists today",
        detail: '79% QC pass rate this week, below 85% threshold. Review with James.',
        time: '11:15 AM',
      },
      {
        id: 'a-007',
        priority: 'low' as const,
        type: 'route_inefficiency',
        title: 'Carlos M. route can save 14 miles today',
        detail: 'Reordering 3 stops saves 14 miles ($2.94 fuel, 34 min). Pending your approval.',
        time: '6:45 AM',
      },
    ],
  };
}

export type DashboardData = ReturnType<typeof getMockDashboardData>;
export type PendingApproval = DashboardData['pendingApprovals'][0];
export type RouteTech = DashboardData['routeIntelligence']['techs'][0];
export type TechPerf = DashboardData['techPerformance'][0];
export type AlertItem = DashboardData['alerts'][0];
