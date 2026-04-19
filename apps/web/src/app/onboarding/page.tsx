'use client';

/**
 * FieldSync Onboarding Wizard
 * ============================
 * 5 steps · Target: 5 minutes from signup to Opportunity Plan
 *
 * Step 1 — Connect CRM  OR  Start Fresh        (~60 sec)
 *   └ Start Fresh sub-steps:
 *       1a  Choose import method (CSV / Google / QuickBooks / Manual)
 *       1b  Upload + map CSV columns (drag-drop)
 *       1c  Schedule builder (assign days + tech per client)
 * Step 2 — Business at a glance / projections  (~60 sec)
 * Step 3 — Select goals                        (~90 sec)
 * Step 4 — Sophia builds plan                  (~60 sec)
 * Step 5 — Opportunity Plan (CRM or benchmark) (~open)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CRM =
  | 'serviceautopilot'
  | 'jobber'
  | 'housecallpro'
  | 'servicetitan'
  | 'skimmer'
  | 'other'
  | 'start_fresh';

type OnboardingMode = 'crm' | 'start_fresh';
type GoalId = 'ar_recovery' | 'upsell' | 'retention' | 'routing' | 'leads' | 'reporting';

type ImportMethod = 'csv' | 'google' | 'quickbooks' | 'manual';

interface CRMOption {
  id: CRM;
  name: string;
  emoji: string;
  desc: string;
  status: 'live' | 'in_progress' | 'coming_soon';
  fields: { key: string; label: string; type: 'text' | 'password' }[];
}

interface BusinessSnapshot {
  monthlyRevenue: number;
  outstandingAR: number;
  arAvgAgeDays: number;
  activeClients: number;
  atRiskClients: number;
  routeEfficiency: number;
  totalClients: number;
  totalTechs: number;
  totalInvoices: number;
}

interface GoalCard {
  id: GoalId;
  emoji: string;
  title: string;
  desc: string;
  focus: string;
}

interface Opportunity {
  id: string;
  priority: 'urgent' | 'this_month' | 'next_90_days';
  category: string;
  title: string;
  description: string;
  estimatedValue: number;
  actionLabel: string;
  sophiaReady: boolean;
  detail: string;
}

// Imported client row from CSV / manual entry
interface ImportedClient {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  monthlyRate?: number;
  serviceFrequency?: string;
  // schedule builder fields
  preferredDays?: string[];
  assignedTech?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MOCK_TECHS = ['Carlos M.', 'Darius K.', 'Maria T.', 'Jake R.'];

const CSV_COLUMNS: { key: keyof ImportedClient; label: string; required: boolean }[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'serviceType', label: 'Service Type', required: false },
  { key: 'monthlyRate', label: 'Monthly Rate ($)', required: false },
  { key: 'serviceFrequency', label: 'Service Frequency', required: false },
];

const CRM_OPTIONS: CRMOption[] = [
  {
    id: 'serviceautopilot',
    name: 'ServiceAutopilot',
    emoji: '🏊',
    desc: 'Most pool companies',
    status: 'live',
    fields: [
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'jobber',
    name: 'Jobber',
    emoji: '🔧',
    desc: 'HVAC, cleaning, lawn',
    status: 'in_progress',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' }],
  },
  {
    id: 'housecallpro',
    name: 'Housecall Pro',
    emoji: '🏠',
    desc: 'Home services',
    status: 'in_progress',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' }],
  },
  {
    id: 'servicetitan',
    name: 'ServiceTitan',
    emoji: '⚡',
    desc: 'Enterprise HVAC / plumbing',
    status: 'coming_soon',
    fields: [],
  },
  {
    id: 'skimmer',
    name: 'Skimmer',
    emoji: '🌊',
    desc: 'Pool route software',
    status: 'coming_soon',
    fields: [],
  },
  {
    id: 'other',
    name: 'Other / Manual',
    emoji: '📋',
    desc: 'CSV import or manual entry',
    status: 'live',
    fields: [],
  },
];

const GOAL_CARDS: GoalCard[] = [
  { id: 'ar_recovery', emoji: '💰', title: 'Recover money I'm owed', desc: 'AR collection focus', focus: 'Sophia will prioritize overdue invoices and draft collection messages.' },
  { id: 'upsell', emoji: '📈', title: 'Grow revenue without new clients', desc: 'Upsell focus', focus: 'Sophia will find upsell windows and seasonal opportunities in your existing base.' },
  { id: 'retention', emoji: '🔄', title: 'Stop losing clients', desc: 'Retention focus', focus: 'Sophia will score every client for churn risk and suggest proactive outreach.' },
  { id: 'routing', emoji: '🗺️', title: 'Save time on operations', desc: 'Efficiency / routing focus', focus: 'Sophia will optimize routes and flag operational inefficiencies.' },
  { id: 'leads', emoji: '🌱', title: 'Get more new clients', desc: 'Lead generation focus', focus: 'Sophia will identify referral opportunities and win-back candidates.' },
  { id: 'reporting', emoji: '📊', title: 'Understand my business better', desc: 'Reporting / intelligence focus', focus: 'Sophia will surface trends, patterns, and insights you've never seen before.' },
];

const SOPHIA_STEPS = [
  'Analyzing your clients...',
  'Identifying growth opportunities...',
  'Finding quick wins...',
  'Building your route model...',
  'Creating your Opportunity Plan...',
];

const MOCK_SNAPSHOT: BusinessSnapshot = {
  monthlyRevenue: 61_200,
  outstandingAR: 18_460,
  arAvgAgeDays: 24,
  activeClients: 297,
  atRiskClients: 14,
  routeEfficiency: 69,
  totalClients: 297,
  totalTechs: 12,
  totalInvoices: 934,
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const f$ = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Connect', 'Overview', 'Your Goals', 'Sophia Analyzes', 'Your Plan'];
  return (
    <div className="flex items-center gap-1.5 mb-8 justify-center flex-wrap">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : done ? 'bg-[#1a1a24] text-green-600 border border-green-800/40'
                : 'bg-[#1a1a24] text-slate-500 border border-[#2a2a3a]'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                done ? 'bg-green-700 text-green-200' : active ? 'bg-green-500 text-black' : 'bg-[#2a2a3a] text-slate-500'
              }`}>{done ? '✓' : step}</span>
              {label}
            </div>
            {i < total - 1 && <div className="w-3 h-px bg-[#2a2a3a]" />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// START FRESH SUB-FLOW
// ─────────────────────────────────────────────────────────────────────────────

// ── 1a: Choose import method ──────────────────────────────────────────────────

function StartFreshMethodPicker({
  onPick,
}: {
  onPick: (method: ImportMethod) => void;
}) {
  const methods: { id: ImportMethod; emoji: string; label: string; desc: string; live: boolean }[] = [
    { id: 'csv', emoji: '📄', label: 'Upload CSV / Spreadsheet', desc: 'Excel, Google Sheets, or any .csv file', live: true },
    { id: 'google', emoji: '📒', label: 'Import from Google Contacts', desc: 'Sync your contacts directly', live: false },
    { id: 'quickbooks', emoji: '💼', label: 'Import from QuickBooks', desc: 'Pull your existing client list', live: false },
    { id: 'manual', emoji: '✏️', label: 'Start manually', desc: 'Enter clients one at a time', live: true },
  ];

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-3xl mb-3">📋</div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">How would you like to add your clients?</h2>
        <p className="text-slate-400 text-sm">We'll get your data in — then Sophia takes over.</p>
      </div>
      <div className="space-y-2">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => m.live && onPick(m.id)}
            disabled={!m.live}
            className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all ${
              m.live
                ? 'border-[#2a2a3a] bg-[#1a1a24] hover:border-green-500/40 hover:bg-green-500/5 cursor-pointer'
                : 'border-[#2a2a3a] bg-[#12121a] opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="text-2xl shrink-0">{m.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-slate-200 text-sm">{m.label}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
            {!m.live && <span className="text-xs text-slate-600 bg-[#2a2a3a] px-2 py-0.5 rounded-full">Coming soon</span>}
            {m.live && <span className="text-slate-600 text-sm">→</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 1b-i: CSV drag-drop uploader ──────────────────────────────────────────────

function CSVImporter({ onImported }: { onImported: (clients: ImportedClient[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // csvHeader → fsField
  const [stage, setStage] = useState<'drop' | 'map' | 'importing' | 'done'>('drop');
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) =>
      line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
    );
    return { headers, rows };
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map obvious columns
      const autoMap: Record<string, string> = {};
      for (const h of headers) {
        const lower = h.toLowerCase();
        if (lower.includes('name') && !lower.includes('first') && !lower.includes('last')) autoMap[h] = 'name';
        else if (lower.includes('address') && !lower.includes('email')) autoMap[h] = 'address';
        else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell')) autoMap[h] = 'phone';
        else if (lower.includes('email')) autoMap[h] = 'email';
        else if (lower.includes('service type') || lower.includes('servicetype')) autoMap[h] = 'serviceType';
        else if (lower.includes('rate') || lower.includes('monthly') || lower.includes('price')) autoMap[h] = 'monthlyRate';
        else if (lower.includes('frequency') || lower.includes('freq')) autoMap[h] = 'serviceFrequency';
        else if ((lower.includes('first') || lower.includes('last')) && lower.includes('name')) {
          // combine first/last later — map to name for now
          if (!autoMap['name']) autoMap[h] = 'name';
        }
      }
      setMapping(autoMap);
      setStage('map');
    };
    reader.readAsText(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) handleFile(file);
  }, []);

  function handleImport() {
    setStage('importing');
    setTimeout(() => {
      const nameCol = Object.keys(mapping).find((k) => mapping[k] === 'name');
      if (!nameCol) return;

      const clients: ImportedClient[] = csvRows
        .filter((row) => {
          const ni = csvHeaders.indexOf(nameCol);
          return ni >= 0 && row[ni]?.trim();
        })
        .map((row, idx) => {
          const get = (field: string) => {
            const col = Object.keys(mapping).find((k) => mapping[k] === field);
            if (!col) return undefined;
            const i = csvHeaders.indexOf(col);
            return row[i]?.trim() || undefined;
          };
          const rate = get('monthlyRate');
          return {
            id: `import-${idx}`,
            name: get('name') ?? `Client ${idx + 1}`,
            address: get('address'),
            phone: get('phone'),
            email: get('email'),
            serviceType: get('serviceType') ?? 'Pool Service',
            monthlyRate: rate ? parseFloat(rate.replace(/[$,]/g, '')) || undefined : undefined,
            serviceFrequency: get('serviceFrequency') ?? 'weekly',
            preferredDays: [],
            assignedTech: undefined,
          };
        });

      setImportCount(clients.length);
      setStage('done');
      setTimeout(() => onImported(clients), 1200);
    }, 1800);
  }

  if (stage === 'drop') {
    return (
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Upload your client spreadsheet</h2>
          <p className="text-slate-400 text-sm">CSV from Excel, Google Sheets, or any spreadsheet app</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-4 ${
            dragOver ? 'border-green-500 bg-green-500/10' : 'border-[#2a2a3a] hover:border-slate-500 hover:bg-[#1a1a24]'
          }`}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="font-semibold text-slate-200 mb-1">Drop your CSV here</p>
          <p className="text-sm text-slate-500">or click to browse files</p>
          <p className="text-xs text-slate-600 mt-3">.csv, .txt — Excel: File → Save As → CSV</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4">
          <p className="text-xs font-bold text-slate-400 mb-2">Expected columns (any order, we'll map them):</p>
          <div className="flex flex-wrap gap-2">
            {CSV_COLUMNS.map((c) => (
              <span key={c.key} className={`text-xs px-2 py-0.5 rounded-full border ${
                c.required ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#2a2a3a] border-[#3a3a4a] text-slate-500'
              }`}>
                {c.label}{c.required ? ' *' : ''}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2">* Required. Everything else is optional.</p>
        </div>
      </div>
    );
  }

  if (stage === 'map') {
    const unmapped = csvHeaders.filter((h) => !mapping[h]);
    return (
      <div>
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Map your columns</h2>
          <p className="text-slate-400 text-sm">We found <strong className="text-slate-200">{csvRows.length} rows</strong>. Tell us what each column means.</p>
        </div>

        <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
          {csvHeaders.map((header) => (
            <div key={header} className="flex items-center gap-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2">
              <div className="w-36 text-sm font-mono text-slate-300 truncate shrink-0">{header}</div>
              <span className="text-slate-600">→</span>
              <select
                value={mapping[header] ?? ''}
                onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value }))}
                className="flex-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-green-500/50"
              >
                <option value="">— Skip this column —</option>
                {CSV_COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              {mapping[header] && <span className="text-green-500 text-sm shrink-0">✓</span>}
            </div>
          ))}
        </div>

        {/* Preview */}
        {csvRows.length > 0 && (
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-lg p-3 mb-4 text-xs text-slate-500 overflow-x-auto">
            <p className="font-bold text-slate-400 mb-1">Preview (first 2 rows):</p>
            {csvRows.slice(0, 2).map((row, i) => (
              <div key={i} className="font-mono truncate">{row.join(' · ')}</div>
            ))}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!Object.values(mapping).includes('name')}
          className={`w-full py-3 font-bold rounded-xl transition-all text-sm ${
            Object.values(mapping).includes('name')
              ? 'bg-green-500 hover:bg-green-400 text-black'
              : 'bg-[#1a1a24] text-slate-600 border border-[#2a2a3a] cursor-not-allowed'
          }`}
        >
          Import {csvRows.length} clients →
        </button>
      </div>
    );
  }

  if (stage === 'importing' || stage === 'done') {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">{stage === 'done' ? '✅' : '⏳'}</div>
        {stage === 'importing' ? (
          <>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Importing your clients...</h2>
            <div className="w-48 h-1.5 bg-[#2a2a3a] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-pulse w-3/4" />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-green-400 mb-2">
              ✅ We imported {importCount} clients.
            </h2>
            <p className="text-slate-300 text-sm">Let's set up your schedule.</p>
          </>
        )}
      </div>
    );
  }

  return null;
}

// ── 1b-ii: Manual entry (single-client form, repeatable) ─────────────────────

function ManualImporter({ onImported }: { onImported: (clients: ImportedClient[]) => void }) {
  const [clients, setClients] = useState<ImportedClient[]>([]);
  const [form, setForm] = useState<Partial<ImportedClient>>({ serviceType: 'Pool Service', serviceFrequency: 'weekly' });
  const [adding, setAdding] = useState(true);

  function addClient() {
    if (!form.name) return;
    setClients((prev) => [...prev, { id: `manual-${Date.now()}`, ...form } as ImportedClient]);
    setForm({ serviceType: 'Pool Service', serviceFrequency: 'weekly' });
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-lg font-bold text-slate-100 mb-1">Add your clients</h2>
        <p className="text-slate-400 text-sm">Enter as many as you like — you can always add more later.</p>
      </div>

      {clients.length > 0 && (
        <div className="mb-4 max-h-36 overflow-y-auto space-y-1">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm">
              <span className="text-green-500 shrink-0">✓</span>
              <span className="text-slate-200 flex-1">{c.name}</span>
              {c.monthlyRate && <span className="text-slate-500 text-xs">{f$(c.monthlyRate)}/mo</span>}
              {c.serviceType && <span className="text-slate-600 text-xs">{c.serviceType}</span>}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 mb-4 space-y-3">
          {[
            { key: 'name', label: 'Client name *', placeholder: 'John & Jane Smith' },
            { key: 'address', label: 'Address', placeholder: '123 Main St, Tampa FL' },
            { key: 'email', label: 'Email', placeholder: 'client@email.com' },
            { key: 'phone', label: 'Phone', placeholder: '(813) 555-0100' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-slate-400 mb-1 font-medium">{field.label}</label>
              <input
                value={(form as Record<string, string>)[field.key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/50"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Monthly rate ($)</label>
              <input
                type="number"
                value={form.monthlyRate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, monthlyRate: parseFloat(e.target.value) || undefined }))}
                placeholder="150"
                className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Frequency</label>
              <select
                value={form.serviceFrequency ?? 'weekly'}
                onChange={(e) => setForm((f) => ({ ...f, serviceFrequency: e.target.value }))}
                className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-green-500/50"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <button
            onClick={addClient}
            disabled={!form.name}
            className={`w-full py-2.5 font-semibold rounded-lg text-sm transition-all ${
              form.name
                ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
                : 'bg-[#12121a] text-slate-600 cursor-not-allowed'
            }`}
          >
            + Add client
          </button>
        </div>
      )}

      {clients.length > 0 && (
        <button
          onClick={() => onImported(clients)}
          className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm"
        >
          Continue with {clients.length} {clients.length === 1 ? 'client' : 'clients'} →
        </button>
      )}
    </div>
  );
}

// ── 1c: Schedule builder ──────────────────────────────────────────────────────

function ScheduleBuilder({
  clients,
  onDone,
}: {
  clients: ImportedClient[];
  onDone: (clients: ImportedClient[]) => void;
}) {
  const [scheduled, setScheduled] = useState<ImportedClient[]>(clients);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  function toggleDay(id: string, day: string) {
    setScheduled((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const days = c.preferredDays ?? [];
        return {
          ...c,
          preferredDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
        };
      })
    );
  }

  function setTech(id: string, tech: string) {
    setScheduled((prev) => prev.map((c) => (c.id === id ? { ...c, assignedTech: tech } : c)));
  }

  const totalPages = Math.ceil(clients.length / PAGE_SIZE);
  const visibleClients = scheduled.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const assignedCount = scheduled.filter((c) => (c.preferredDays?.length ?? 0) > 0).length;

  return (
    <div>
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">🗓️</div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Set up your schedule</h2>
        <p className="text-slate-400 text-sm">
          For each client, pick their service day(s) and assign a tech.
          <span className="text-slate-500"> (You can always change this later.)</span>
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {visibleClients.map((client) => (
          <div key={client.id} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-200 text-sm">{client.name}</p>
                {client.monthlyRate && (
                  <p className="text-xs text-slate-500">{f$(client.monthlyRate)}/mo · {client.serviceFrequency}</p>
                )}
              </div>
              <select
                value={client.assignedTech ?? ''}
                onChange={(e) => setTech(client.id, e.target.value)}
                className="bg-[#12121a] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-green-500/50"
              >
                <option value="">No tech yet</option>
                {MOCK_TECHS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const selected = client.preferredDays?.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(client.id, day)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      selected
                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                        : 'bg-[#12121a] border-[#2a2a3a] text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-slate-400 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-xs">{page + 1} / {totalPages} · {assignedCount}/{clients.length} scheduled</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-slate-400 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      <button
        onClick={() => onDone(scheduled)}
        className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm"
      >
        {assignedCount < clients.length
          ? `Continue (${clients.length - assignedCount} unscheduled — you can finish later)`
          : `Schedule looks good — continue →`}
      </button>
    </div>
  );
}

// ── Start Fresh orchestrator (drives 1a → 1b → 1c → done) ────────────────────

type SFStage = 'method' | 'import_csv' | 'import_manual' | 'schedule' | 'done';

function StartFreshFlow({
  onComplete,
}: {
  onComplete: (clients: ImportedClient[], snapshot: BusinessSnapshot) => void;
}) {
  const [stage, setStage] = useState<SFStage>('method');
  const [importedClients, setImportedClients] = useState<ImportedClient[]>([]);

  function handleImported(clients: ImportedClient[]) {
    setImportedClients(clients);
    setStage('schedule');
  }

  function handleScheduleDone(clients: ImportedClient[]) {
    // Build a snapshot from the imported data with industry benchmarks
    const clientCount = clients.length;
    const avgRate = clients.reduce((s, c) => s + (c.monthlyRate ?? 150), 0) / Math.max(clientCount, 1);
    const mrr = Math.round(clientCount * avgRate);
    const snapshot: BusinessSnapshot = {
      monthlyRevenue: mrr,
      outstandingAR: 0,           // no history yet
      arAvgAgeDays: 0,
      activeClients: clientCount,
      atRiskClients: 0,
      routeEfficiency: 100,       // no data to judge yet
      totalClients: clientCount,
      totalTechs: MOCK_TECHS.length,
      totalInvoices: 0,
    };
    onComplete(clients, snapshot);
  }

  return (
    <>
      {stage === 'method' && (
        <StartFreshMethodPicker
          onPick={(method) => setStage(method === 'csv' ? 'import_csv' : method === 'manual' ? 'import_manual' : 'import_csv')}
        />
      )}
      {stage === 'import_csv' && <CSVImporter onImported={handleImported} />}
      {stage === 'import_manual' && <ManualImporter onImported={handleImported} />}
      {stage === 'schedule' && (
        <ScheduleBuilder clients={importedClients} onDone={handleScheduleDone} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Connect CRM or Start Fresh
// ─────────────────────────────────────────────────────────────────────────────

function Step1Connect({
  onConnect,
  onStartFresh,
}: {
  onConnect: (crm: CRM, snapshot: BusinessSnapshot) => void;
  onStartFresh: (clients: ImportedClient[], snapshot: BusinessSnapshot) => void;
}) {
  const [selected, setSelected] = useState<CRM | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [showStartFresh, setShowStartFresh] = useState(false);

  const selectedCRM = CRM_OPTIONS.find((c) => c.id === selected);

  async function handleConnect() {
    if (!selected) return;
    setStatus('connecting');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 90) { clearInterval(interval); return 90; } return p + Math.random() * 15; });
    }, 400);
    await new Promise((r) => setTimeout(r, 3500));
    clearInterval(interval);
    setProgress(100);
    await new Promise((r) => setTimeout(r, 300));
    setStatus('success');
    await new Promise((r) => setTimeout(r, 1200));
    onConnect(selected, MOCK_SNAPSHOT);
  }

  if (showStartFresh) {
    return (
      <div>
        <button
          onClick={() => setShowStartFresh(false)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-5 transition-colors"
        >
          ← Back to CRM options
        </button>
        <StartFreshFlow onComplete={onStartFresh} />
      </div>
    );
  }

  if (status === 'connecting' || status === 'success') {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6 text-3xl">
          {status === 'success' ? '✅' : selectedCRM?.emoji ?? '🔄'}
        </div>
        {status === 'connecting' ? (
          <>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Connecting to {selectedCRM?.name}...</h2>
            <p className="text-slate-400 text-sm mb-6">Pulling your clients, jobs, invoices, and techs</p>
            <div className="w-full max-w-sm mx-auto bg-[#2a2a3a] rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500">{Math.round(progress)}% — please wait...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-green-400 mb-2">Connected!</h2>
            <p className="text-slate-300 text-sm">
              We found <strong className="text-slate-100">{MOCK_SNAPSHOT.totalClients} clients</strong>,{' '}
              <strong className="text-slate-100">{MOCK_SNAPSHOT.totalTechs} techs</strong>, and{' '}
              <strong className="text-slate-100">{MOCK_SNAPSHOT.totalInvoices} invoices</strong>.
            </p>
            <p className="text-xs text-slate-500 mt-2">Building your business overview...</p>
          </>
        )}
      </div>
    );
  }

  const statusBadge: Record<string, string> = { live: '✅ Live', in_progress: '🔄 Coming soon', coming_soon: '📋 Coming soon' };
  const statusColor: Record<string, string> = {
    live: 'border-[#2a2a3a] bg-[#1a1a24] hover:border-slate-600 cursor-pointer',
    in_progress: 'border-[#2a2a3a] bg-[#12121a] opacity-60 cursor-not-allowed',
    coming_soon: 'border-[#2a2a3a] bg-[#12121a] opacity-40 cursor-not-allowed',
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">How are you managing clients today?</h1>
        <p className="text-slate-400 text-sm">Connect your existing CRM, or start fresh with FieldSync as your base.</p>
      </div>

      {/* CRM grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {CRM_OPTIONS.map((crm) => {
          const isDisabled = crm.status !== 'live';
          const isSelected = selected === crm.id;
          return (
            <button
              key={crm.id}
              disabled={isDisabled}
              onClick={() => { if (!isDisabled) { setSelected(crm.id); setCreds({}); } }}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-green-500/60 bg-green-500/15 ring-1 ring-green-500/40'
                  : statusColor[crm.status]
              }`}
            >
              <div className="text-2xl mb-2">{crm.emoji}</div>
              <div className="font-semibold text-slate-200 text-sm">{crm.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{statusBadge[crm.status]}</div>
              <div className="text-xs text-slate-600 mt-0.5">{crm.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Start Fresh card — full width, distinct treatment */}
      <button
        onClick={() => setShowStartFresh(true)}
        className="w-full text-left p-4 rounded-xl border-2 border-dashed border-[#2a2a3a] hover:border-green-500/40 hover:bg-green-500/5 transition-all mb-5 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] group-hover:border-green-500/30 flex items-center justify-center text-xl transition-all shrink-0">
            🌱
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-200 text-sm">Start Fresh — I use spreadsheets or paper</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload a CSV, import from Google Contacts, or enter clients manually. FieldSync becomes your CRM.</p>
          </div>
          <span className="text-slate-600 group-hover:text-green-500 transition-colors text-sm">→</span>
        </div>
      </button>

      {/* Credential form when CRM selected */}
      {selected && selectedCRM && selectedCRM.fields.length > 0 && (
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 mb-4">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Enter your {selectedCRM.name} credentials</h3>
          <div className="space-y-3">
            {selectedCRM.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-slate-400 mb-1 font-medium">{field.label}</label>
                <input
                  type={field.type}
                  value={creds[field.key] ?? ''}
                  onChange={(e) => setCreds((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30"
                  placeholder={field.type === 'password' ? '••••••••' : `Your ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">🔒 Encrypted in transit and at rest. Never stored in plaintext.</p>
        </div>
      )}

      {selected && selectedCRM?.id === 'other' && (
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 mb-4 text-center">
          <p className="text-sm text-slate-300">We'll set you up with manual CSV import or direct data entry.</p>
          <p className="text-xs text-slate-500 mt-1">Our team will reach out within 24 hours.</p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={!selected}
        className={`w-full py-3.5 font-bold rounded-xl transition-all text-sm ${
          selected
            ? 'bg-green-500 hover:bg-green-400 text-black'
            : 'bg-[#1a1a24] text-slate-600 border border-[#2a2a3a] cursor-not-allowed'
        }`}
      >
        {selected ? `Connect ${selectedCRM?.name} →` : 'Select your CRM to continue'}
      </button>

      <div className="mt-5 bg-[#0d1a10] border border-green-500/20 rounded-xl p-4">
        <p className="text-xs font-bold text-green-400 mb-2">🔒 Your data, your control</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-500">
          {[
            '🏢 Complete row-level isolation — no cross-tenant access, ever',
            '📤 One-click data export at any time',
            '🚫 Never used to train any AI model',
            '✉️ Approval required before any client message is sent',
          ].map((line) => <p key={line}>{line}</p>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Business at a glance
// ─────────────────────────────────────────────────────────────────────────────

function Step2Overview({
  snapshot,
  mode,
  onNext,
}: {
  snapshot: BusinessSnapshot;
  mode: OnboardingMode;
  onNext: () => void;
}) {
  const isFresh = mode === 'start_fresh';

  const metrics = isFresh
    ? [
        { label: 'Current MRR', value: f$(snapshot.monthlyRevenue), color: 'text-green-400', icon: '💵', note: `${snapshot.totalClients} clients × avg monthly rate` },
        { label: 'Active Clients', value: snapshot.activeClients.toString(), color: 'text-blue-400', icon: '👥', note: 'Imported from your data' },
        { label: 'Target MRR (industry benchmark)', value: f$(Math.round(snapshot.monthlyRevenue * 1.35)), color: 'text-purple-400', icon: '🎯', note: 'Based on similar businesses at your client count' },
        { label: 'AR Collection Rate', value: '—', color: 'text-slate-400', icon: '📋', note: 'No history yet — industry benchmark: 95% within 30 days' },
        { label: 'Route Efficiency', value: '—', color: 'text-slate-400', icon: '🗺️', note: 'Sophia will model this once your first routes run' },
      ]
    : [
        { label: 'Monthly Revenue', value: f$(snapshot.monthlyRevenue), color: 'text-green-400', icon: '💵', note: 'Based on completed invoices this month' },
        { label: 'Outstanding AR', value: f$(snapshot.outstandingAR), color: 'text-yellow-400', icon: '📋', note: `Average age: ${snapshot.arAvgAgeDays} days` },
        { label: 'Active Clients', value: snapshot.activeClients.toString(), color: 'text-blue-400', icon: '👥', note: 'Clients with service in last 60 days' },
        { label: 'Clients At-Risk', value: snapshot.atRiskClients.toString(), color: 'text-red-400', icon: '⚠️', note: 'Estimated from payment + service patterns' },
        { label: 'Route Efficiency', value: `${snapshot.routeEfficiency}%`, color: 'text-orange-400', icon: '🗺️', note: 'Based on geographic job density' },
      ];

  return (
    <div>
      <div className="text-center mb-7">
        <div className="text-4xl mb-3">{isFresh ? '🌱' : '🔍'}</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          {isFresh ? 'Your business, by the numbers' : 'Your business at a glance'}
        </h1>
        <p className="text-slate-400 text-sm">
          {isFresh
            ? 'Here's where you stand today — and where Sophia will take you.'
            : 'Here's what Sophia discovered in the first 60 seconds. Most owners have never seen this view before.'}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4">
            <span className="text-2xl shrink-0">{m.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{m.label}</p>
              <p className={`text-2xl font-bold font-mono mt-0.5 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{m.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a24] border border-green-500/20 rounded-xl p-4 mb-5 text-sm text-slate-400">
        <span className="text-green-400 font-semibold">Sophia says: </span>
        {isFresh
          ? `"You're starting with ${snapshot.totalClients} clients and ${f$(snapshot.monthlyRevenue)} MRR. Industry benchmarks suggest businesses at your size should be at ${f$(Math.round(snapshot.monthlyRevenue * 1.35))} MRR. Let's build a plan to get there."`
          : `"You have ${f$(snapshot.outstandingAR)} in outstanding AR and ${snapshot.atRiskClients} clients showing churn signals. That's over ${f$(snapshot.outstandingAR + snapshot.atRiskClients * 420 * 12)} in near-term risk. Let's build a plan."`}
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm"
      >
        {isFresh ? 'Build my plan →' : 'This is my business — let's improve it →'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Goal selection (shared)
// ─────────────────────────────────────────────────────────────────────────────

function Step3Goals({ onNext }: { onNext: (goals: GoalId[]) => void }) {
  const [selected, setSelected] = useState<GoalId[]>([]);
  function toggle(id: GoalId) {
    setSelected((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  }

  return (
    <div>
      <div className="text-center mb-7">
        <div className="text-4xl mb-3">🎯</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">What matters most right now?</h1>
        <p className="text-slate-400 text-sm">Pick 2–3. Sophia will tailor your Opportunity Plan to these priorities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {GOAL_CARDS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <button key={goal.id} onClick={() => toggle(goal.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-green-500/60 bg-green-500/10 ring-1 ring-green-500/30'
                  : 'border-[#2a2a3a] bg-[#1a1a24] hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{goal.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200 text-sm leading-tight">{goal.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{goal.desc}</p>
                  {isSelected && <p className="text-xs text-green-400 mt-2 leading-relaxed">{goal.focus}</p>}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="bg-[#1a1a24] border border-green-500/20 rounded-xl p-4 mb-4 text-sm text-slate-400">
          <span className="text-green-400 font-semibold">Sophia says: </span>
          "Got it. I'll build your plan around{' '}
          <strong className="text-slate-200">{selected.map((g) => GOAL_CARDS.find((c) => c.id === g)?.title.toLowerCase()).join(', ')}</strong>.
          Give me a moment."
        </div>
      )}

      <button onClick={() => onNext(selected)} disabled={selected.length === 0}
        className={`w-full py-3.5 font-bold rounded-xl transition-all text-sm ${
          selected.length > 0
            ? 'bg-green-500 hover:bg-green-400 text-black'
            : 'bg-[#1a1a24] text-slate-600 border border-[#2a2a3a] cursor-not-allowed'
        }`}
      >
        {selected.length > 0
          ? `Build my plan around ${selected.length} ${selected.length === 1 ? 'goal' : 'goals'} →`
          : 'Select at least one goal to continue'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Sophia building (shared)
// ─────────────────────────────────────────────────────────────────────────────

function Step4Building({ onDone }: { onDone: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SOPHIA_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
        if (i === SOPHIA_STEPS.length - 1) setTimeout(onDone, 800);
      }, (i + 1) * 800));
    });
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="text-center py-6">
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 rounded-2xl bg-green-500/10 border border-green-500/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl">🧠</span></div>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Sophia is building your plan</h1>
      <p className="text-slate-400 text-sm mb-8">Analyzing your data across all dimensions...</p>
      <div className="text-left max-w-sm mx-auto space-y-3">
        {SOPHIA_STEPS.map((step, i) => {
          const done = completedSteps.includes(i);
          const active = !done && completedSteps.length === i;
          return (
            <div key={step} className={`flex items-center gap-3 transition-all ${done ? 'opacity-100' : active ? 'opacity-80' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                done ? 'bg-green-500 text-black' : active ? 'bg-green-500/30 border border-green-500/60 animate-pulse' : 'bg-[#2a2a3a] text-slate-600'
              }`}>
                {done ? '✓' : active ? '·' : i + 1}
              </div>
              <span className={`text-sm ${done ? 'text-slate-200' : active ? 'text-slate-300' : 'text-slate-500'}`}>
                {step} {done && <span className="text-green-400">✅</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Opportunity Plan
// ─────────────────────────────────────────────────────────────────────────────

const priorityConfig = {
  urgent: { label: '🔴 URGENT (do this week)', color: 'border-red-500/30 bg-red-500/5' },
  this_month: { label: '🟡 THIS MONTH', color: 'border-yellow-500/20 bg-yellow-500/5' },
  next_90_days: { label: '🟢 NEXT 90 DAYS', color: 'border-green-700/20 bg-green-900/10' },
};

// CRM-mode opportunities (historical data)
const CRM_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op-001', priority: 'urgent', category: 'ar_recovery',
    title: 'Recover $8,240 in overdue AR',
    description: '7 clients have invoices 30+ days past due. Sophia has drafted collection messages for each.',
    estimatedValue: 6_200, actionLabel: 'Review & Send', sophiaReady: true,
    detail: 'Expected recovery: $6,200 (avg 75% collection rate for 30-60 day AR)',
  },
  {
    id: 'op-002', priority: 'urgent', category: 'retention',
    title: 'Re-engage 3 at-risk clients ($420/mo at stake)',
    description: 'Henderson, Torres, Williams show cancellation signals. Sophia recommends a personal call to each this week.',
    estimatedValue: 5_040, actionLabel: 'See Details & Script', sophiaReady: true,
    detail: 'Annual value at risk: $5,040. Retention rate for proactive outreach: 60-70%.',
  },
  {
    id: 'op-003', priority: 'this_month', category: 'upsell',
    title: 'Send Spring Refresh offers to 47 eligible clients',
    description: 'Average ticket: $185 | Expected conversion: 25%',
    estimatedValue: 2_200, actionLabel: 'Review Campaign', sophiaReady: true,
    detail: 'Sophia will send on your approval. Expected revenue: $2,200.',
  },
  {
    id: 'op-004', priority: 'this_month', category: 'routing',
    title: 'Fix route inefficiency — save $2,100/month',
    description: 'Your routes are averaging 31% longer than optimal. Carlos alone is driving 18 extra miles/day.',
    estimatedValue: 2_100, actionLabel: 'See Route Analysis', sophiaReady: false,
    detail: 'Annualized savings: $25,200. Requires one-time route review.',
  },
  {
    id: 'op-005', priority: 'this_month', category: 'reputation',
    title: 'Request Google reviews from 12 Champions',
    description: 'These clients are your happiest — none have reviewed yet.',
    estimatedValue: 800, actionLabel: 'Review Request Campaign', sophiaReady: true,
    detail: 'Expected: 4-6 new 5-star reviews. Industry impact: +12% lead conversion.',
  },
  {
    id: 'op-006', priority: 'next_90_days', category: 'leads',
    title: 'Set up win-back for 23 cancelled clients',
    description: '23 former clients cancelled in the last 12 months. Win-back rate for similar businesses: 15-20%.',
    estimatedValue: 5_400, actionLabel: 'Complete Setup →', sophiaReady: false,
    detail: 'Potential: 3-4 clients back = $5,400/year.',
  },
];

/**
 * Build a forward-looking, benchmark-driven Opportunity Plan for Start Fresh customers.
 */
function buildStartFreshOpportunities(
  snapshot: BusinessSnapshot,
  goals: GoalId[]
): Opportunity[] {
  const { totalClients, monthlyRevenue } = snapshot;
  const avgRate = totalClients > 0 ? monthlyRevenue / totalClients : 150;
  const targetMRR = Math.round(monthlyRevenue * 1.35);
  const mrrGap = targetMRR - monthlyRevenue;

  const opps: Opportunity[] = [];

  // Always: foundation setup
  opps.push({
    id: 'sf-001', priority: 'urgent', category: 'ar_recovery',
    title: `Set up billing for ${totalClients} clients — collect 95% on time`,
    description: `Pool companies with ${totalClients} clients typically collect 95% of AR within 30 days. Sophia will auto-generate invoices and send friendly reminders.`,
    estimatedValue: Math.round(monthlyRevenue * 0.05 * 12), // 5% monthly saved annually
    actionLabel: 'Set Up Billing', sophiaReady: true,
    detail: `Industry benchmark: 95% on-time collection rate. Sophia handles reminders automatically — you just approve.`,
  });

  // Always: get first reviews
  opps.push({
    id: 'sf-002', priority: 'urgent', category: 'reputation',
    title: 'Get your first Google reviews — new businesses need 5+ to compete',
    description: `New businesses need Google reviews to convert leads. Sophia will send review requests after every completed job.`,
    estimatedValue: Math.round(totalClients * 50),
    actionLabel: 'Enable Auto Review Requests', sophiaReady: true,
    detail: 'Industry data: 5+ Google reviews increases lead conversion by ~25%. Most customers agree if asked within 24 hours of service.',
  });

  // Goal-specific opportunities
  const goalSet = new Set(goals);

  if (goalSet.has('upsell') || goalSet.has('reporting')) {
    opps.push({
      id: 'sf-003', priority: 'this_month', category: 'upsell',
      title: `Reach ${f$(targetMRR)} MRR — ${f$(mrrGap)} growth opportunity`,
      description: `Businesses with ${totalClients} clients typically run at ${f$(targetMRR)}/mo. Here's the gap and how to close it: seasonal add-ons, service upgrades, and chemical treatments.`,
      estimatedValue: mrrGap * 12,
      actionLabel: 'Build Growth Plan', sophiaReady: false,
      detail: `Based on industry benchmarks for ${totalClients}-client field service businesses. Primary lever: upselling existing clients on additional services.`,
    });
  }

  if (goalSet.has('retention') || goalSet.has('reporting')) {
    opps.push({
      id: 'sf-004', priority: 'this_month', category: 'retention',
      title: 'Set up client health scoring — catch problems before they become cancellations',
      description: 'Sophia will score every client based on payment patterns, communication, and service history. New businesses that monitor health from day 1 have 3× lower churn.',
      estimatedValue: Math.round(avgRate * 12 * totalClients * 0.08), // prevent 8% churn
      actionLabel: 'Enable Client Scoring', sophiaReady: true,
      detail: 'Industry churn rate for field service businesses: 8-12%/year. Proactive monitoring cuts that by 40-60%.',
    });
  }

  if (goalSet.has('routing') || goalSet.has('reporting')) {
    opps.push({
      id: 'sf-005', priority: 'this_month', category: 'routing',
      title: 'Optimize your routes from day 1 — save fuel before bad habits form',
      description: 'Sophia's TSP solver will build efficient routes for your schedule. Starting optimized saves an average of $1,800/year per tech.',
      estimatedValue: Math.round(1800 * MOCK_TECHS.length),
      actionLabel: 'Build Optimized Routes', sophiaReady: true,
      detail: 'New businesses that start with optimized routes save 20-30% more fuel than those who fix habits later.',
    });
  }

  if (goalSet.has('leads') || goals.length === 0) {
    opps.push({
      id: 'sf-006', priority: 'next_90_days', category: 'leads',
      title: `Referral program — turn ${totalClients} clients into your sales team`,
      description: 'Word-of-mouth is the #1 growth channel for field service. Sophia will identify your happiest clients and build a referral program.',
      estimatedValue: Math.round(avgRate * 12 * Math.round(totalClients * 0.1)),
      actionLabel: 'Design Referral Program', sophiaReady: false,
      detail: `Industry data: field service businesses with referral programs grow 2× faster. Expected: ${Math.round(totalClients * 0.1)} new clients in 90 days.`,
    });
  }

  return opps;
}

function OpportunityCard({ opp, index }: { opp: Opportunity; index: number }) {
  return (
    <div className={`border rounded-xl p-4 transition-all hover:border-opacity-50 ${priorityConfig[opp.priority].color}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-slate-500 text-sm font-mono shrink-0">#{index}</span>
          <h3 className="font-bold text-slate-100 text-sm leading-tight">{opp.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold font-mono text-green-400">{f$(opp.estimatedValue)}</p>
          <p className="text-xs text-slate-500">est. value</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-2 leading-relaxed">{opp.description}</p>
      <p className="text-xs text-slate-500 mb-3 italic">{opp.detail}</p>
      <div className="flex items-center justify-between">
        <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:opacity-80 ${
          opp.sophiaReady
            ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30'
            : 'bg-[#2a2a3a] text-slate-300 border-[#3a3a4a] hover:bg-[#3a3a4a]'
        }`}>
          {opp.actionLabel}
        </button>
        {opp.sophiaReady && <span className="text-xs text-green-500/70">⚡ Sophia executes with one click</span>}
      </div>
    </div>
  );
}

function Step5Plan({
  goals,
  mode,
  snapshot,
  onGoToDashboard,
}: {
  goals: GoalId[];
  mode: OnboardingMode;
  snapshot: BusinessSnapshot | null;
  onGoToDashboard: () => void;
}) {
  const isFresh = mode === 'start_fresh';
  const opportunities = isFresh && snapshot
    ? buildStartFreshOpportunities(snapshot, goals)
    : CRM_OPPORTUNITIES;

  const totalValue = opportunities.reduce((s, o) => s + o.estimatedValue, 0);
  const byPriority = {
    urgent: opportunities.filter((o) => o.priority === 'urgent'),
    this_month: opportunities.filter((o) => o.priority === 'this_month'),
    next_90_days: opportunities.filter((o) => o.priority === 'next_90_days'),
  };

  let opIndex = 0;

  return (
    <div>
      <div className="text-center mb-7">
        <div className="text-3xl mb-3">{isFresh ? '🌱' : '✨'}</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Your Opportunity Plan</h1>
        <p className="text-slate-400 text-sm">
          {isFresh
            ? `Based on your ${snapshot?.totalClients ?? 0} clients + industry benchmarks. Forward-looking — Sophia will update this as your history builds.`
            : 'Based on your real data. Not generic advice.'}
        </p>
        {isFresh && snapshot && (
          <div className="mt-3 text-sm text-slate-400 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-3">
            Based on <strong className="text-slate-200">{snapshot.totalClients} clients</strong> at{' '}
            <strong className="text-slate-200">{f$(Math.round(snapshot.monthlyRevenue / Math.max(snapshot.totalClients, 1)))}/mo avg</strong>,
            your current MRR is <strong className="text-green-400">{f$(snapshot.monthlyRevenue)}</strong>.
            Here's how to reach <strong className="text-green-400">{f$(Math.round(snapshot.monthlyRevenue * 1.35))}</strong>:
          </div>
        )}
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
          <span className="text-green-400 font-bold text-lg font-mono">{f$(totalValue)}</span>
          <span className="text-slate-400 text-sm">in identified opportunities</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {goals.map((g) => {
          const card = GOAL_CARDS.find((c) => c.id === g);
          return card ? (
            <span key={g} className="px-3 py-1 text-xs bg-[#1a1a24] border border-[#2a2a3a] rounded-full text-slate-400">
              {card.emoji} {card.title}
            </span>
          ) : null;
        })}
      </div>

      <div className="space-y-6">
        {(['urgent', 'this_month', 'next_90_days'] as const).map((priority) => {
          const opps = byPriority[priority];
          if (!opps.length) return null;
          return (
            <div key={priority}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{priorityConfig[priority].label}</h2>
              <div className="space-y-3">
                {opps.map((opp) => { opIndex++; return <OpportunityCard key={opp.id} opp={opp} index={opIndex} />; })}
              </div>
            </div>
          );
        })}
      </div>

      {isFresh && (
        <div className="mt-5 bg-[#1a1a24] border border-blue-500/20 rounded-xl p-4 text-sm text-slate-400">
          <p className="font-semibold text-blue-300 mb-1">📊 About benchmark plans</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Since you're starting fresh, this plan uses industry benchmarks for field service businesses at your size.
            As you run jobs and collect payments, Sophia will replace benchmarks with your actual data —
            and your plan will get sharper every week.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={onGoToDashboard}
          className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm">
          Go to Dashboard →
        </button>
        <button className="flex-1 py-3.5 bg-[#1a1a24] border border-[#2a2a3a] hover:border-slate-500 text-slate-300 font-semibold rounded-xl transition-all text-sm">
          Start with #1
        </button>
      </div>

      <p className="text-center text-xs text-slate-600 mt-4">
        Sophia refreshes this plan daily as your data changes. You'll never see stale advice.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<OnboardingMode>('crm');
  const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null);
  const [goals, setGoals] = useState<GoalId[]>([]);

  function handleCRMConnect(_crm: CRM, data: BusinessSnapshot) {
    setMode('crm');
    setSnapshot(data);
    setStep(2);
  }

  function handleStartFreshComplete(_clients: ImportedClient[], data: BusinessSnapshot) {
    setMode('start_fresh');
    setSnapshot(data);
    setStep(2);
  }

  function handleGoalsDone(selectedGoals: GoalId[]) {
    setGoals(selectedGoals);
    setStep(4);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-black font-bold text-lg">FS</span>
          </div>
          <p className="text-slate-500 text-xs">FieldSync — Field Service Intelligence</p>
        </div>

        <StepIndicator current={step} total={5} />

        <div className="bg-[#0f0f18] border border-[#1e1e2e] rounded-2xl p-6 sm:p-8">
          {step === 1 && (
            <Step1Connect
              onConnect={handleCRMConnect}
              onStartFresh={handleStartFreshComplete}
            />
          )}
          {step === 2 && snapshot && (
            <Step2Overview snapshot={snapshot} mode={mode} onNext={() => setStep(3)} />
          )}
          {step === 3 && (
            <Step3Goals onNext={handleGoalsDone} />
          )}
          {step === 4 && (
            <Step4Building onDone={() => setStep(5)} />
          )}
          {step === 5 && (
            <Step5Plan
              goals={goals}
              mode={mode}
              snapshot={snapshot}
              onGoToDashboard={() => { window.location.href = '/dashboard'; }}
            />
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          No credit card required for 14-day trial · Cancel anytime · Data deleted on request
        </p>
      </div>
    </div>
  );
}
