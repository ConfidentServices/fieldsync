/**
 * Mock Inbox Data
 * ===============
 * Represents a realistic day's worth of messages for a field service company.
 * Mix of channels, urgencies, and classifications.
 */

export interface InboxMessage {
  id: string;
  source: 'email' | 'sms' | 'voicemail' | 'google_review' | 'facebook' | 'crm_note';
  fromName: string;
  fromContact: string;
  clientId?: string;
  subject?: string;
  body: string;
  receivedAt: string;
  classification:
    | 'complaint'
    | 'billing_question'
    | 'billing_dispute'
    | 'cancellation_request'
    | 'scheduling_request'
    | 'reschedule_request'
    | 'review_positive'
    | 'review_negative'
    | 'general_inquiry'
    | 'compliment'
    | 'referral'
    | 'payment_update';
  urgency: 'urgent' | 'normal' | 'low';
  neverAutoSend: boolean; // complaint, billing_dispute, cancellation, review_negative
  sofiaReplyDraft: string;
  sofiaConfidence: number; // 0-1
  sofiaReasoning: string;
  status: 'unread' | 'draft_ready' | 'replied' | 'dismissed' | 'auto_sent';
  eligibleForAutoSend: boolean; // false if neverAutoSend or no rule configured
  autoSendEnabled: boolean; // true only if owner has opt-in AND rule is configured
}

export const MOCK_INBOX: InboxMessage[] = [
  {
    id: 'msg-001',
    source: 'sms',
    fromName: 'Patricia Wolfe',
    fromContact: '(813) 555-0198',
    clientId: 'client-patricia',
    body: "Why was my card charged twice this month?? I'm seeing two payments of $210. This is completely unacceptable. I want a refund immediately.",
    receivedAt: '9:14 AM',
    classification: 'billing_dispute',
    urgency: 'urgent',
    neverAutoSend: true,
    sofiaReplyDraft: "Hi Patricia, thank you for reaching out. I can see this is urgent and I completely understand your concern. I'm looking into your account right now — it appears there may have been a duplicate charge. I'll have this resolved today and you'll receive a full refund for any duplicate within 1-2 business days. Can I reach you by phone this morning to confirm the details?",
    sofiaConfidence: 0.62,
    sofiaReasoning: "Billing dispute — high confidence draft but flagged for mandatory owner review. Client has existing $420 overdue balance which may be relevant context.",
    status: 'draft_ready',
    eligibleForAutoSend: false,
    autoSendEnabled: false,
  },
  {
    id: 'msg-002',
    source: 'email',
    fromName: 'Robert Kim',
    fromContact: 'rkim@gmail.com',
    clientId: 'client-robert',
    subject: 'Pool service question',
    body: 'Hi — when is my next scheduled service? I want to make sure someone is home. Thanks, Robert',
    receivedAt: '8:47 AM',
    classification: 'scheduling_request',
    urgency: 'normal',
    neverAutoSend: false,
    sofiaReplyDraft: "Hi Robert! Your next scheduled pool service is this Thursday, April 21st. Carlos will be there between 9:00–11:00 AM. You don't need to be home — we have access through the side gate as usual. We'll send you a notification when Carlos is on his way and again when service is complete with photos. Let me know if you need to reschedule!",
    sofiaConfidence: 0.94,
    sofiaReasoning: "Scheduling inquiry. Pulled next service date from CRM. High confidence — factual response with no risk. Eligible for auto-send if rule configured.",
    status: 'draft_ready',
    eligibleForAutoSend: true,
    autoSendEnabled: false,
  },
  {
    id: 'msg-003',
    source: 'google_review',
    fromName: 'Jennifer Martinez',
    fromContact: 'Google Reviews',
    body: '⭐⭐⭐⭐⭐ Incredible service! Carlos showed up exactly on time, sent me photos of the completed work, and my pool has never looked better. Have been using Sunset Pool for 3 years and they keep getting better. Highly recommend!',
    receivedAt: '8:23 AM',
    classification: 'review_positive',
    urgency: 'low',
    neverAutoSend: false,
    sofiaReplyDraft: "Jennifer, thank you so much for taking the time to leave this review! It genuinely means the world to us 🙏 Carlos is incredible — this kind of feedback is exactly why he loves what he does. Three years together and we're honored to still be your pool service team. We'll make sure Carlos sees this!",
    sofiaConfidence: 0.97,
    sofiaReasoning: "5-star positive review. High confidence warm response. Owner has auto-send enabled for 5-star reviews. Eligible for auto-send.",
    status: 'draft_ready',
    eligibleForAutoSend: true,
    autoSendEnabled: true,
  },
  {
    id: 'msg-004',
    source: 'sms',
    fromName: 'David Chen',
    fromContact: '(813) 555-0142',
    clientId: 'client-david',
    body: "Your guy came by but I wasnt home and the gate was locked. Nobody called ahead. The pool still hasnt been done. This keeps happening and Im getting pretty frustrated.",
    receivedAt: '10:02 AM',
    classification: 'complaint',
    urgency: 'urgent',
    neverAutoSend: true,
    sofiaReplyDraft: "Hi David, I'm so sorry — this is on us, not you. You should have gotten a heads-up call before the visit, and we dropped the ball. I'm personally looking at your account now. I'm going to schedule a priority visit for tomorrow morning and I'll make sure the team has your gate code updated. Can I have someone call you in the next 30 minutes to confirm? This won't happen again.",
    sofiaConfidence: 0.71,
    sofiaReasoning: "Customer complaint about skipped service and no-call. Draft is empathetic and action-oriented. Flagged for mandatory review — complaint category. Context: this client has overdue payment, may be relevant to conversation.",
    status: 'draft_ready',
    eligibleForAutoSend: false,
    autoSendEnabled: false,
  },
  {
    id: 'msg-005',
    source: 'email',
    fromName: 'Susan Clark',
    fromContact: 'sclark@email.com',
    clientId: 'client-susan',
    subject: 'Need to reschedule Thursday',
    body: "Hi, we're having a pool party on Thursday afternoon so I need to move the service to Wednesday or Friday if possible. Thanks!",
    receivedAt: '7:55 AM',
    classification: 'reschedule_request',
    urgency: 'normal',
    neverAutoSend: false,
    sofiaReplyDraft: "Hi Susan! No problem at all — enjoy the party! 🎉 I've checked Tony's schedule and we can move your service to Wednesday, April 20th (same time window, 8–10 AM). I'll update the schedule now. You'll get the usual completion notification with photos when it's done. Does Wednesday work for you?",
    sofiaConfidence: 0.89,
    sofiaReasoning: "Reschedule request. Checked tech availability in CRM. Wednesday has an open slot. Confident response — just needs confirmation.",
    status: 'draft_ready',
    eligibleForAutoSend: true,
    autoSendEnabled: false,
  },
  {
    id: 'msg-006',
    source: 'voicemail',
    fromName: 'Unknown Caller',
    fromContact: '(727) 555-0312',
    body: "[Voicemail transcript] Hi, this is Mark calling — I got your number from my neighbor Brian Foster. He says you guys do great pool work. I have a 15,000 gallon pool that needs weekly service. Can someone give me a call back? Best time is after 4 PM. Number again is 727-555-0312.",
    receivedAt: '11:30 AM',
    classification: 'referral',
    urgency: 'normal',
    neverAutoSend: false,
    sofiaReplyDraft: "Hi Mark! Thanks so much for reaching out — Brian is a fantastic client and we're glad he recommended us. We'd love to talk about weekly service for your pool. I'll have our owner give you a call this afternoon after 4 PM as you requested. In the meantime, our typical weekly service for a pool your size starts at around $120/month. Looking forward to connecting!",
    sofiaConfidence: 0.85,
    sofiaReasoning: "Inbound referral lead — highest value lead type. Mentioned neighbor Brian Foster (existing client). Personalized response referencing Brian. Schedule callback for after 4 PM as requested.",
    status: 'draft_ready',
    eligibleForAutoSend: false,
    autoSendEnabled: false,
  },
  {
    id: 'msg-007',
    source: 'email',
    fromName: 'Thomas Webb',
    fromContact: 'twebb@gmail.com',
    clientId: 'client-thomas',
    subject: 'Thinking about canceling',
    body: "Hi, I've been meaning to reach out. We're going through a tough financial stretch right now and I'm thinking about pausing or canceling service for a few months. I feel bad because you guys have been great. Just can't swing the $210 a month right now.",
    receivedAt: '9:38 AM',
    classification: 'cancellation_request',
    urgency: 'urgent',
    neverAutoSend: true,
    sofiaReplyDraft: "Hi Thomas, thank you so much for reaching out and being upfront with us — that really means a lot, and we completely understand. Life happens. Before we close anything, I wanted to offer a couple of options: (1) We can pause your service for up to 90 days — no charge, account stays active, you just let us know when you're ready to resume. (2) We also offer a reduced schedule (every 3 weeks instead of weekly) at $90/month, which keeps your pool safe without the full cost. Would either of those work? We'd love to keep you as a client but we also want to do right by you.",
    sofiaConfidence: 0.78,
    sofiaReasoning: "Cancellation request — financial reason. Drafted retention offer: service pause + reduced schedule option. Flagged for mandatory owner review. Owner should call Thomas personally — 2+ year client, LTV $4,800+.",
    status: 'draft_ready',
    eligibleForAutoSend: false,
    autoSendEnabled: false,
  },
  {
    id: 'msg-008',
    source: 'google_review',
    fromName: 'Anonymous',
    fromContact: 'Google Reviews',
    body: '⭐⭐ Pool was green for two weeks after service. Tech said he fixed it but nothing changed. Called twice, no callback. Disappointing.',
    receivedAt: '7:12 AM',
    classification: 'review_negative',
    urgency: 'urgent',
    neverAutoSend: true,
    sofiaReplyDraft: "We're so sorry to hear this and we take it seriously. This is not the standard we hold ourselves to. I'd like to personally reach out to understand exactly what happened and make it right. Please call us at [phone] or reply here with your contact info and we'll be in touch today. We want to earn back your trust.",
    sofiaConfidence: 0.66,
    sofiaReasoning: "Negative review — 2 stars, specific complaint about service quality + no callbacks. Mandatory owner review. Response is humble and action-oriented but owner should personalize. Recommend owner also identify the customer and reach out proactively.",
    status: 'draft_ready',
    eligibleForAutoSend: false,
    autoSendEnabled: false,
  },
  {
    id: 'msg-009',
    source: 'sms',
    fromName: 'Anna Rodriguez',
    fromContact: '(813) 555-0276',
    clientId: 'client-anna',
    body: 'Just wanted to say Carlos did a great job today, pool looks amazing. Thanks!',
    receivedAt: '1:22 PM',
    classification: 'compliment',
    urgency: 'low',
    neverAutoSend: false,
    sofiaReplyDraft: "Thank you Anna, that means so much to hear! 😊 Carlos works really hard and we'll make sure he gets this message. See you at your next visit!",
    sofiaConfidence: 0.98,
    sofiaReasoning: "Simple compliment. Very high confidence warm response. Short and natural for SMS. Eligible for auto-send.",
    status: 'draft_ready',
    eligibleForAutoSend: true,
    autoSendEnabled: false,
  },
  {
    id: 'msg-010',
    source: 'email',
    fromName: 'Kevin Walsh',
    fromContact: 'kwalsh@company.com',
    clientId: 'client-kevin',
    subject: 'Updated card on file',
    body: "Hey, I updated my credit card in the customer portal. The old one was expiring. Just wanted to give you a heads up.",
    receivedAt: '10:45 AM',
    classification: 'payment_update',
    urgency: 'low',
    neverAutoSend: false,
    sofiaReplyDraft: "Hi Kevin! Got it — we can see the updated card on file. You're all set! Your next billing date is May 1st. Thanks for the heads up and for keeping things smooth. See you at your next visit!",
    sofiaConfidence: 0.96,
    sofiaReasoning: "Payment method update confirmation. Routine acknowledgment. Very high confidence. Eligible for auto-send.",
    status: 'draft_ready',
    eligibleForAutoSend: true,
    autoSendEnabled: true,
  },
];

export function getInboxSummary() {
  const total = MOCK_INBOX.length;
  const unread = MOCK_INBOX.filter((m) => m.status === 'unread' || m.status === 'draft_ready').length;
  const urgent = MOCK_INBOX.filter((m) => m.urgency === 'urgent').length;
  const neverAutoSend = MOCK_INBOX.filter((m) => m.neverAutoSend).length;
  const readyToSend = MOCK_INBOX.filter(
    (m) => m.eligibleForAutoSend && !m.neverAutoSend && m.status === 'draft_ready'
  ).length;
  const autoSendQueued = MOCK_INBOX.filter((m) => m.autoSendEnabled && m.eligibleForAutoSend).length;

  return { total, unread, urgent, neverAutoSend, readyToSend, autoSendQueued };
}
