/**
 * FieldSync Onboarding
 * ====================
 * Step 1: Connect your CRM
 * Step 2: Confirm data protection settings
 * Step 3: Configure approval preferences
 * Step 4: Set report cadence
 * 
 * Data protection assurances are PROMINENT here — not buried in settings.
 */

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-lg">FS</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Set up FieldSync</h1>
          <p className="text-slate-400 mt-2">Connect in 10 minutes. No migration. No data entry.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {['Connect CRM', 'Data & Privacy', 'Approvals', 'Reports'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                i === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-[#1a1a24] text-slate-500 border border-[#2a2a3a]'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  i === 0 ? 'bg-green-500 text-black' : 'bg-[#2a2a3a] text-slate-500'
                }`}>{i + 1}</span>
                {step}
              </div>
              {i < 3 && <div className="w-4 h-px bg-[#2a2a3a]" />}
            </div>
          ))}
        </div>

        {/* Step 1: Connect CRM */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Connect your CRM</h2>
          <p className="text-sm text-slate-400 mb-6">FieldSync reads from your existing software. Nothing to migrate.</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'ServiceAutopilot', status: '✅ Live', desc: 'Most pool companies', highlight: true },
              { name: 'Jobber', status: '🔄 In progress', desc: 'HVAC, cleaning, lawn' },
              { name: 'Housecall Pro', status: '🔄 In progress', desc: 'Home services' },
              { name: 'ServiceTitan', status: '📋 Coming soon', desc: 'Enterprise HVAC/plumbing' },
            ].map(({ name, status, desc, highlight }) => (
              <button
                key={name}
                className={`text-left p-4 rounded-lg border transition-all ${
                  highlight
                    ? 'bg-green-500/10 border-green-500/40 hover:bg-green-500/15'
                    : 'bg-[#12121a] border-[#2a2a3a] hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200 text-sm">{name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{status} · {desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Protection — prominent, not buried */}
        <div className="bg-[#0d1a10] border border-green-500/20 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-green-300 mb-1">🔒 Your data belongs to you</h2>
          <p className="text-sm text-slate-400 mb-4">
            Before we connect to anything, here's what we commit to:
          </p>
          <div className="space-y-3">
            {[
              {
                icon: '🏢',
                title: 'Complete isolation',
                desc: 'Your data is row-level isolated in our database. No other FieldSync customer can ever see your clients, jobs, or invoices. Enforced at the database level, not just the application layer.',
              },
              {
                icon: '📤',
                title: 'One-click export',
                desc: 'Download all your data as CSV or JSON at any time. No hoops, no waiting, no questions. Settings → Data → Export Everything.',
              },
              {
                icon: '🗑',
                title: 'Deletion on cancel',
                desc: 'If you cancel FieldSync, we delete all your data within 30 days. You\'ll receive a deletion confirmation email.',
              },
              {
                icon: '🚫',
                title: 'No AI training on your data',
                desc: 'Sofia AI uses your data to answer your questions. It is never used to train any model, shared with any third party, or used to improve any system other than your own account.',
              },
              {
                icon: '✉️',
                title: 'Approval required for every message',
                desc: 'FieldSync never sends an email, SMS, or notification to your clients without your explicit approval. Every message goes through your approval queue first.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors">
          Connect ServiceAutopilot →
        </button>

        <p className="text-center text-xs text-slate-600 mt-4">
          No credit card required for 14-day trial · Cancel anytime · Data deleted on request
        </p>
      </div>
    </div>
  );
}
