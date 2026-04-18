/**
 * FieldSync Unified Inbox
 * ========================
 * All customer messages — one place.
 * Sofia AI drafts every reply. Owner controls every send.
 * 
 * Three send modes:
 *   1. Review Required (default) — approve before send
 *   2. Auto-send (opt-in) — enabled per message type
 *   3. Explicit command — "Sofia, reply to X" → shows draft → confirm
 * 
 * NEVER auto-send: complaint, billing_dispute, cancellation_request, review_negative
 */

import { MOCK_INBOX, getInboxSummary } from '@/lib/utils/mock-inbox';
import { AppNav } from '@/components/AppNav';
import { getMockDashboardData } from '@/lib/utils/mock-data';

const dash = getMockDashboardData();
const summary = getInboxSummary();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️',
  sms: '💬',
  voicemail: '📞',
  google_review: '⭐',
  facebook: '👥',
  instagram: '📸',
  crm_note: '📝',
};

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  voicemail: 'Voicemail',
  google_review: 'Google Review',
  facebook: 'Facebook',
  crm_note: 'CRM Note',
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  complaint: 'Complaint',
  billing_question: 'Billing Q',
  billing_dispute: 'Billing Dispute',
  cancellation_request: 'Cancellation',
  scheduling_request: 'Scheduling',
  reschedule_request: 'Reschedule',
  review_positive: 'Positive Review',
  review_negative: 'Negative Review',
  general_inquiry: 'Inquiry',
  compliment: 'Compliment',
  referral: 'Referral',
  payment_update: 'Payment Update',
  unclassified: 'Unclassified',
};

const CLASSIFICATION_STYLES: Record<string, string> = {
  complaint: 'bg-red-500/20 text-red-300 border border-red-500/30',
  billing_dispute: 'bg-red-500/20 text-red-300 border border-red-500/30',
  cancellation_request: 'bg-red-500/20 text-red-300 border border-red-500/30',
  review_negative: 'bg-red-500/20 text-red-300 border border-red-500/30',
  billing_question: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  scheduling_request: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  reschedule_request: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  review_positive: 'bg-green-500/20 text-green-300 border border-green-500/30',
  compliment: 'bg-green-500/20 text-green-300 border border-green-500/30',
  referral: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  payment_update: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  general_inquiry: 'bg-slate-700/50 text-slate-300 border border-slate-600/30',
};

const URGENCY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border border-red-500/30',
  normal: 'bg-slate-700/30 text-slate-500 border border-slate-600/20',
  low: '',
};

function confidenceColor(n: number) {
  if (n >= 0.85) return 'text-green-400';
  if (n >= 0.65) return 'text-yellow-400';
  return 'text-red-400';
}

function confidenceLabel(n: number) {
  if (n >= 0.85) return 'High confidence';
  if (n >= 0.65) return 'Review carefully';
  return 'Low confidence — edit recommended';
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({ msg }: { msg: (typeof MOCK_INBOX)[0] }) {
  const isProtected = msg.neverAutoSend;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors ${
        isProtected
          ? 'border-red-500/20 bg-[#1a0f0a]'
          : msg.autoSendEnabled
          ? 'border-green-500/20 bg-[#0d1a12]'
          : 'border-[#2a2a3a] bg-[#1a1a24]'
      }`}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        {/* Channel icon */}
        <div className="w-10 h-10 rounded-lg bg-[#12121a] border border-[#2a2a3a] flex items-center justify-center text-xl shrink-0">
          {CHANNEL_ICONS[msg.source] ?? '💬'}
        </div>

        {/* Sender + metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-200">{msg.fromName}</span>
              <span className="text-xs text-slate-600">{msg.fromContact}</span>
              <span className="text-xs text-slate-600">{CHANNEL_LABELS[msg.source]}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {msg.urgency === 'urgent' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${URGENCY_STYLES.urgent}`}>
                  Urgent
                </span>
              )}
              <span className="text-xs text-slate-600">{msg.receivedAt}</span>
            </div>
          </div>

          {/* Classification badge */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                CLASSIFICATION_STYLES[msg.classification] ?? CLASSIFICATION_STYLES.general_inquiry
              }`}
            >
              {CLASSIFICATION_LABELS[msg.classification] ?? msg.classification}
            </span>
            {isProtected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                🔒 Review required — cannot auto-send
              </span>
            )}
            {msg.autoSendEnabled && !isProtected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                ✓ Auto-send enabled
              </span>
            )}
          </div>

          {/* Message body */}
          <p className="text-sm text-slate-400 mt-2 leading-relaxed line-clamp-2">{msg.body}</p>
        </div>
      </div>

      {/* Sofia's draft reply */}
      <div className="border-t border-[#2a2a3a] p-4 bg-black/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xs font-bold">
            S
          </div>
          <span className="text-xs font-semibold text-purple-300">Sofia's draft reply</span>
          <span className={`text-xs ml-1 ${confidenceColor(msg.sofiaConfidence)}`}>
            {Math.round(msg.sofiaConfidence * 100)}% — {confidenceLabel(msg.sofiaConfidence)}
          </span>
        </div>

        {/* Reasoning (collapsed by default visually) */}
        <p className="text-xs text-slate-600 italic mb-2">{msg.sofiaReasoning}</p>

        {/* Draft text */}
        <div className="bg-[#0f0f18] border border-[#2a2a3a] rounded-lg p-3">
          <p className="text-sm text-slate-300 leading-relaxed">{msg.sofiaReplyDraft}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button className="px-4 py-1.5 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition-colors">
            ✏️ Edit & Send
          </button>

          {!isProtected ? (
            <button className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/30 transition-colors">
              Send As-Is
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-1.5 bg-slate-800/50 border border-slate-700/30 text-slate-600 text-xs font-medium rounded-lg cursor-not-allowed"
              title="This message type always requires manual review before sending"
            >
              Send As-Is
            </button>
          )}

          <button className="px-4 py-1.5 bg-slate-700/30 border border-slate-600/30 text-slate-500 text-xs rounded-lg hover:bg-slate-700/50 transition-colors">
            Dismiss
          </button>

          <button className="px-3 py-1.5 bg-slate-700/20 border border-slate-600/20 text-slate-600 text-xs rounded-lg hover:bg-slate-700/40 transition-colors ml-auto">
            Snooze
          </button>
        </div>

        {isProtected && (
          <p className="text-xs text-red-400/60 mt-2">
            ⚠ This message type cannot be auto-sent. Edit and review before sending.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sofia Chat Panel ─────────────────────────────────────────────────────────

function SofiaInboxChat() {
  const suggestions = [
    "What messages need my attention today?",
    "Reply to Susan Clark about rescheduling to Wednesday",
    "Send thank-you to all 5-star reviews this week",
    "Which urgent messages haven't been answered?",
  ];

  return (
    <div className="bg-[#0f0f1a] border border-purple-500/20 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
          S
        </div>
        <div>
          <p className="text-sm font-bold text-purple-300">Ask Sofia about your inbox</p>
          <p className="text-xs text-slate-500">Drafts replies, summarizes, takes action on your command</p>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {suggestions.map((s) => (
          <button
            key={s}
            className="text-left text-xs text-slate-400 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 hover:border-purple-500/40 hover:text-slate-300 transition-all"
          >
            "{s}"
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder='Ask Sofia: "Reply to Thomas Webb with the pause offer" or "Summarize urgent messages"'
          className="flex-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
        />
        <button className="px-4 py-2.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-bold rounded-lg hover:bg-purple-500/30 transition-colors shrink-0">
          Ask
        </button>
      </div>

      <div className="mt-3 p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
        <p className="text-xs text-slate-500 mb-1 font-medium">⚡ Sofia's Inbox Summary — Right Now</p>
        <p className="text-sm text-slate-300">
          You have <span className="text-orange-400 font-bold">2 urgent messages</span> needing
          immediate attention: Patricia Wolfe's billing dispute and David Chen's complaint about a
          skipped service. Thomas Webb sent a cancellation request — he cited financial reasons,
          and I've drafted a pause + reduced-plan offer for your review.
          Jennifer Martinez left a 5-star Google Review (auto-send is ON for 5-star replies —
          my response goes out in 10 minutes unless you disable it).
        </p>
      </div>
    </div>
  );
}

// ─── Auto-Send Rules Summary ──────────────────────────────────────────────────

function AutoSendRulesBanner() {
  return (
    <div className="bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Auto-Send Rules
          </p>
          <p className="text-xs text-slate-500">
            <span className="text-green-400 font-semibold">2 types enabled</span> ·{' '}
            5-star reviews, payment updates ·{' '}
            <span className="text-red-400 font-semibold">4 types locked</span> ·{' '}
            complaints, disputes, cancellations, negative reviews
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a3a] text-slate-400 text-xs rounded-lg hover:border-slate-600 transition-colors">
            Configure rules
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans">
      <AppNav
        companyName={dash.company.name}
        inboxUnread={summary.unread}
        pendingApprovals={dash.pendingApprovals.length}
        syncMinutesAgo={dash.company.syncMinutesAgo}
        crmType={dash.company.crmType}
      />

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Unified Inbox</h1>
            <p className="text-sm text-slate-500 mt-1">
              All channels · Sofia AI drafts every reply · You approve every send
            </p>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            {[
              { label: `${summary.unread} unread`, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
              { label: `${summary.urgent} urgent`, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
              { label: `${summary.neverAutoSend} need review`, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
              { label: `${summary.autoSendQueued} auto-queued`, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
            ].map(({ label, color }) => (
              <span key={label} className={`px-2.5 py-1 rounded-full border font-medium ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Sofia Inbox Chat */}
        <SofiaInboxChat />

        {/* Auto-send rules summary */}
        <AutoSendRulesBanner />

        {/* Filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {[
            'All',
            '🔴 Urgent',
            '🔒 Review Required',
            '✉️ Email',
            '💬 SMS',
            '⭐ Reviews',
            '📞 Voicemail',
          ].map((filter, i) => (
            <button
              key={filter}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === 0
                  ? 'bg-[#1a1a24] text-slate-200 border border-[#2a2a3a]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1a24]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Message list — sorted: urgent first, then by time */}
        <div className="space-y-3">
          {/* Section: Needs Immediate Attention */}
          {MOCK_INBOX.filter((m) => m.urgency === 'urgent').length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
                🔴 Urgent — Needs Immediate Attention
              </p>
              {MOCK_INBOX.filter((m) => m.urgency === 'urgent').map((msg) => (
                <div key={msg.id} className="mb-3">
                  <MessageCard msg={msg} />
                </div>
              ))}
            </div>
          )}

          {/* Section: Ready to Review */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Review & Send
            </p>
            {MOCK_INBOX.filter((m) => m.urgency !== 'urgent').map((msg) => (
              <div key={msg.id} className="mb-3">
                <MessageCard msg={msg} />
              </div>
            ))}
          </div>
        </div>

        {/* Never auto-send explainer */}
        <div className="bg-[#0a0a0f] border border-red-500/15 rounded-xl p-4">
          <p className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-2">
            🔒 Types That Always Require Your Review
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-slate-400">Complaints, billing disputes, cancellation requests, and negative reviews</span> are
            hard-locked to manual review. No auto-send rule can override this. This is enforced at the
            database level — not just the UI. These messages involve emotional or financial risk
            and always require your personal judgment. Sofia drafts the reply; you personalize and send.
          </p>
        </div>

      </main>
    </div>
  );
}
