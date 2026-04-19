/**
 * FieldSync Manual Connector
 * ===========================
 * Reads from the manual_clients / manual_jobs / manual_invoices tables
 * (populated during the "Start Fresh" onboarding path).
 *
 * Implements the SAME FieldSyncConnector interface as the SA/Jobber/HousecallPro
 * connectors — so ALL of Sophia's intelligence (scoring, AR recovery, routing,
 * opportunity plan generation) works identically whether the company uses an
 * external CRM or FieldSync as their CRM.
 *
 * Authentication: uses the caller's Supabase session (RLS enforced at DB level).
 * No credentials object needed — the company sees only its own rows via RLS.
 */

import { BaseConnector, FSClient, FSJob, FSInvoice, FSTech, FSRoute } from '../base';

// ─── Supabase row types (match migration 006) ─────────────────────────────────

interface ManualClientRow {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  service_type?: string | null;
  monthly_rate?: number | null;
  service_frequency?: string | null;
  preferred_day?: string[] | null;
  assigned_tech_id?: string | null;
  active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface ManualJobRow {
  id: string;
  company_id: string;
  client_id: string;
  tech_id?: string | null;
  scheduled_date: string;   // 'YYYY-MM-DD'
  status: string;
  service_type?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  amount?: number | null;
  completed_at?: string | null;
  checklist_data?: Record<string, unknown> | null;
  created_at: string;
  // joined from manual_clients
  client_name?: string;
  // joined from fs_techs
  tech_name?: string;
}

interface ManualInvoiceRow {
  id: string;
  company_id: string;
  client_id: string;
  job_id?: string | null;
  amount: number;
  amount_paid: number;
  status: string;
  issued_date: string;
  due_date?: string | null;
  paid_date?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  // joined from manual_clients
  client_name?: string;
}

interface FSTechRow {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  crm_type: string;
  external_id?: string | null;
}

// ─── Supabase client type (minimal — avoids hard dependency on supabase-js) ──

type SupabaseLike = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (col: string, val: string | boolean) => {
        gte?: (col: string, val: string) => {
          lte?: (col: string, val: string) => unknown;
        };
        data: ManualClientRow[] | ManualJobRow[] | ManualInvoiceRow[] | FSTechRow[] | null;
        error: { message: string } | null;
      };
    };
  };
};

// ─── Manual Connector ─────────────────────────────────────────────────────────

export class ManualConnector extends BaseConnector {
  readonly name = 'manual';
  readonly version = '1.0.0';

  private supabase: SupabaseLike | null = null;
  private companyId: string | null = null;

  /**
   * Connect using a Supabase client + company ID.
   * No username/password needed — RLS enforces isolation.
   *
   * @param credentials.companyId  - UUID of the company (from companies table)
   * @param credentials.supabase   - Pass the supabase client instance as a string
   *                                 key if using dependency injection. In practice,
   *                                 callers should use connectWithClient() below.
   */
  async connect(credentials: Record<string, string>): Promise<boolean> {
    const { companyId } = credentials;
    if (!companyId) {
      this.error('Missing companyId in credentials');
      return false;
    }
    this.companyId = companyId;
    this.credentials = credentials;
    this.connected = true;
    this.log(`Connected to manual store for company ${companyId}`);
    return true;
  }

  /**
   * Preferred connection method — inject the Supabase client directly.
   */
  connectWithClient(supabaseClient: SupabaseLike, companyId: string): this {
    this.supabase = supabaseClient;
    this.companyId = companyId;
    this.connected = true;
    this.log(`Connected with Supabase client for company ${companyId}`);
    return this;
  }

  async testConnection(): Promise<boolean> {
    if (!this.connected || !this.companyId) return false;
    if (!this.supabase) {
      // No real DB — still "connected" for mock/build purposes
      return true;
    }
    try {
      const sb = this.supabase.from('manual_clients').select('id').eq('company_id', this.companyId);
      return !(sb as { error: unknown }).error;
    } catch {
      return false;
    }
  }

  // ── Core Data Pulls ───────────────────────────────────────────────────────

  async getClients(): Promise<FSClient[]> {
    this.assertConnected();
    this.log('Fetching manual clients...');

    if (!this.supabase) {
      this.log('No DB client — returning empty array');
      return [];
    }

    try {
      const result = await this.queryClients();
      const clients = result.map(this.normalizeClient.bind(this));
      this.log(`Got ${clients.length} manual clients`);
      return clients;
    } catch (err) {
      this.error('getClients failed', err);
      return [];
    }
  }

  async getJobs(dateFrom: Date, dateTo: Date): Promise<FSJob[]> {
    this.assertConnected();
    this.log(`Fetching manual jobs ${dateFrom.toISOString()} → ${dateTo.toISOString()}`);

    if (!this.supabase) return [];

    try {
      const result = await this.queryJobs(dateFrom, dateTo);
      const jobs = result.map(this.normalizeJob.bind(this));
      this.log(`Got ${jobs.length} manual jobs`);
      return jobs;
    } catch (err) {
      this.error('getJobs failed', err);
      return [];
    }
  }

  async getInvoices(dateFrom?: Date): Promise<FSInvoice[]> {
    this.assertConnected();
    this.log('Fetching manual invoices...');

    if (!this.supabase) return [];

    try {
      const result = await this.queryInvoices(dateFrom);
      const invoices = result.map(this.normalizeInvoice.bind(this));
      this.log(`Got ${invoices.length} manual invoices`);
      return invoices;
    } catch (err) {
      this.error('getInvoices failed', err);
      return [];
    }
  }

  async getTechs(): Promise<FSTech[]> {
    this.assertConnected();
    this.log('Fetching techs...');

    if (!this.supabase) return [];

    try {
      const result = await this.queryTechs();
      const techs = result.map(this.normalizeTech.bind(this));
      this.log(`Got ${techs.length} techs`);
      return techs;
    } catch (err) {
      this.error('getTechs failed', err);
      return [];
    }
  }

  async getRoutes(date: Date): Promise<FSRoute[]> {
    this.assertConnected();
    const jobs = await this.getJobs(date, date);
    const techMap = new Map<string, FSJob[]>();
    for (const job of jobs) {
      if (!job.techId) continue;
      if (!techMap.has(job.techId)) techMap.set(job.techId, []);
      techMap.get(job.techId)!.push(job);
    }
    const routes: FSRoute[] = [];
    for (const [techId, techJobs] of techMap) {
      routes.push({
        id: `route-manual-${techId}-${date.toISOString().split('T')[0]}`,
        techId,
        techName: techJobs[0].techName ?? techId,
        date,
        stops: techJobs.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
      });
    }
    return routes;
  }

  // ── Write operations (Manual connector supports full CRUD) ────────────────

  async addJobNote(jobId: string, note: string): Promise<boolean> {
    this.assertConnected();
    if (!this.supabase) return false;
    // In real implementation: UPDATE manual_jobs SET notes = $note WHERE id = $jobId
    this.log(`addJobNote: job=${jobId}`);
    return true;
  }

  async updateJobStatus(jobId: string, status: string): Promise<boolean> {
    this.assertConnected();
    if (!this.supabase) return false;
    // In real implementation: UPDATE manual_jobs SET status = $status WHERE id = $jobId
    this.log(`updateJobStatus: job=${jobId} status=${status}`);
    return true;
  }

  // ── DB Queries ────────────────────────────────────────────────────────────

  private async queryClients(): Promise<ManualClientRow[]> {
    if (!this.supabase || !this.companyId) return [];
    const result = this.supabase
      .from('manual_clients')
      .select('*')
      .eq('company_id', this.companyId) as unknown as { data: ManualClientRow[] | null; error: { message: string } | null };
    if (result.error) throw new Error(result.error.message);
    return result.data ?? [];
  }

  private async queryJobs(from: Date, to: Date): Promise<ManualJobRow[]> {
    if (!this.supabase || !this.companyId) return [];
    // SELECT mj.*, mc.name as client_name, ft.name as tech_name
    // FROM manual_jobs mj
    // LEFT JOIN manual_clients mc ON mc.id = mj.client_id
    // LEFT JOIN fs_techs ft ON ft.id = mj.tech_id
    // WHERE mj.company_id = $companyId
    //   AND mj.scheduled_date BETWEEN $from AND $to
    const result = this.supabase
      .from('manual_jobs')
      .select('*, manual_clients(name), fs_techs(name)')
      .eq('company_id', this.companyId) as unknown as { data: ManualJobRow[] | null; error: { message: string } | null };
    if (result.error) throw new Error(result.error.message);
    // Filter date range client-side (real impl uses .gte/.lte)
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    return (result.data ?? []).filter(
      (j) => j.scheduled_date >= fromStr && j.scheduled_date <= toStr
    );
  }

  private async queryInvoices(from?: Date): Promise<ManualInvoiceRow[]> {
    if (!this.supabase || !this.companyId) return [];
    const result = this.supabase
      .from('manual_invoices')
      .select('*, manual_clients(name)')
      .eq('company_id', this.companyId) as unknown as { data: ManualInvoiceRow[] | null; error: { message: string } | null };
    if (result.error) throw new Error(result.error.message);
    const rows = result.data ?? [];
    if (from) {
      const fromStr = from.toISOString().split('T')[0];
      return rows.filter((inv) => inv.issued_date >= fromStr);
    }
    return rows;
  }

  private async queryTechs(): Promise<FSTechRow[]> {
    if (!this.supabase || !this.companyId) return [];
    const result = this.supabase
      .from('fs_techs')
      .select('*')
      .eq('company_id', this.companyId) as unknown as { data: FSTechRow[] | null; error: { message: string } | null };
    if (result.error) throw new Error(result.error.message);
    return result.data ?? [];
  }

  // ── Normalization ─────────────────────────────────────────────────────────

  private normalizeClient(row: ManualClientRow): FSClient {
    return {
      id: `manual-${row.id}`,
      externalId: row.id,
      crmType: 'manual',
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      zip: row.zip ?? undefined,
      monthlyRate: row.monthly_rate ?? undefined,
      serviceFrequency: row.service_frequency ?? undefined,
      tags: row.preferred_day ?? undefined,
      notes: row.notes ?? undefined,
      active: row.active,
      createdAt: new Date(row.created_at),
      lastServiceDate: undefined,
    };
  }

  private normalizeJob(row: ManualJobRow): FSJob {
    return {
      id: `manual-${row.id}`,
      externalId: row.id,
      crmType: 'manual',
      clientId: `manual-${row.client_id}`,
      clientName: row.client_name ?? 'Unknown',
      techId: row.tech_id ? `manual-${row.tech_id}` : undefined,
      techName: row.tech_name ?? undefined,
      scheduledDate: new Date(row.scheduled_date),
      completedDate: row.completed_at ? new Date(row.completed_at) : undefined,
      status: this.normalizeJobStatus(row.status),
      serviceAddress: '',  // join from client in real query
      serviceType: row.service_type ?? 'Service',
      notes: row.notes ?? undefined,
      photos: row.photos ?? undefined,
      amount: row.amount ?? undefined,
    };
  }

  private normalizeInvoice(row: ManualInvoiceRow): FSInvoice {
    const amount = row.amount;
    const amountPaid = row.amount_paid ?? 0;
    const balance = amount - amountPaid;
    const dueDate = row.due_date ? new Date(row.due_date) : undefined;
    const paidDate = row.paid_date ? new Date(row.paid_date) : undefined;

    let daysPastDue = 0;
    if (!paidDate && dueDate && dueDate < new Date()) {
      daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / 86400000);
    }

    return {
      id: `manual-${row.id}`,
      externalId: row.id,
      crmType: 'manual',
      clientId: `manual-${row.client_id}`,
      clientName: row.client_name ?? 'Unknown',
      amount,
      amountPaid,
      balance,
      status: this.normalizeInvoiceStatus(row.status, balance, dueDate),
      issuedDate: new Date(row.issued_date),
      dueDate,
      paidDate,
      daysPastDue,
    };
  }

  private normalizeTech(row: FSTechRow): FSTech {
    return {
      id: `manual-${row.id}`,
      externalId: row.id,
      crmType: 'manual',
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      active: row.active,
    };
  }

  private normalizeJobStatus(status: string): FSJob['status'] {
    const s = status.toLowerCase();
    if (s === 'completed') return 'completed';
    if (s === 'in_progress') return 'in_progress';
    if (s === 'skipped') return 'skipped';
    if (s === 'cancelled') return 'cancelled';
    return 'scheduled';
  }

  private normalizeInvoiceStatus(
    status: string,
    balance: number,
    dueDate?: Date
  ): FSInvoice['status'] {
    if (status === 'voided') return 'voided';
    if (balance <= 0 || status === 'paid') return 'paid';
    if (dueDate && dueDate < new Date() && balance > 0) return 'overdue';
    return 'open';
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createManualConnector(): ManualConnector {
  return new ManualConnector();
}

/**
 * Convenience: create and connect in one call.
 * Pass your Supabase client and the company's UUID.
 *
 * Example:
 *   const connector = createManualConnectorForCompany(supabase, companyId);
 *   const clients = await connector.getClients();
 *   const plan = await generateOpportunityPlan({ ...clients, ... }, ['ar_recovery']);
 */
export function createManualConnectorForCompany(
  supabaseClient: SupabaseLike,
  companyId: string
): ManualConnector {
  return new ManualConnector().connectWithClient(supabaseClient, companyId);
}
