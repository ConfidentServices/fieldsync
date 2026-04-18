/**
 * ServiceAutopilot Connector
 * ==========================
 * Wraps the Playwright-based SA scripts (proven in Sun King production).
 * 
 * Multi-tenant safe: credentials passed as parameters, never read from files.
 * Playwright runs server-side only (Next.js server actions / API routes).
 * 
 * Proven SA API endpoints (reverse-engineered from browser traffic):
 *   - V2AccountList_Query  → client list
 *   - ScheduledWorkWs.asmx/Query → dispatch board / jobs
 *   - v2QueryTotals → billing totals
 *   - Employee list → tech roster
 */

import { BaseConnector, FSClient, FSJob, FSInvoice, FSTech, FSRoute } from '../base';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SALoginResult {
  success: boolean;
  cookies?: string;
  error?: string;
}

interface SARawClient {
  AccountId: string;
  AccountName: string;
  Email?: string;
  CellPhone?: string;
  HomePhone?: string;
  WorkPhone?: string;
  Address?: string;
  Address2?: string;
  City?: string;
  State?: string;
  Zip?: string;
  IsActive?: boolean;
  Tags?: string[];
  Notes?: string;
  CreateDate?: string;
  LastServiceDate?: string;
  MonthlyRate?: number;
  ServiceFrequency?: string;
}

interface SARawJob {
  WorkOrderId: string;
  AccountId: string;
  AccountName: string;
  EmployeeId?: string;
  EmployeeName?: string;
  ScheduledDate?: string;
  CompletedDate?: string;
  Status?: string;
  ServiceAddress?: string;
  ServiceType?: string;
  Notes?: string;
  Amount?: number;
  Photos?: string[];
}

interface SARawInvoice {
  InvoiceId: string;
  AccountId: string;
  AccountName: string;
  Total: string;
  TotalPaid: string;
  Balance: string;
  Status: string;
  InvoiceDate?: string;
  DueDate?: string;
  PaidDate?: string;
}

interface SARawEmployee {
  EmployeeId: string;
  Name: string;
  Email?: string;
  Phone?: string;
  IsActive?: boolean;
}

// ─── SA Connector ─────────────────────────────────────────────────────────────

export class ServiceAutopilotConnector extends BaseConnector {
  readonly name = 'ServiceAutopilot';
  readonly version = '1.0.0';

  private page: import('playwright').Page | null = null;
  private browser: import('playwright').Browser | null = null;

  // ── Connection ────────────────────────────────────────────────────────────

  async connect(credentials: Record<string, string>): Promise<boolean> {
    const { email, password } = credentials;
    if (!email || !password) {
      this.error('Missing email or password credentials');
      return false;
    }

    this.credentials = credentials;

    const result = await this.launchAndLogin(email, password);
    if (result.success) {
      this.connected = true;
      this.log(`Connected as ${email}`);
    } else {
      this.error(`Login failed: ${result.error}`);
    }

    return result.success;
  }

  async testConnection(): Promise<boolean> {
    if (!this.connected || !this.page) return false;
    try {
      const url = this.page.url();
      return url.includes('serviceautopilot.com');
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.page = null;
    }
    await super.disconnect();
    this.log('Disconnected');
  }

  // ── Core Data Pulls ───────────────────────────────────────────────────────

  async getClients(): Promise<FSClient[]> {
    this.assertConnected();
    this.log('Fetching clients...');

    try {
      const raw = await this.fetchClientList();
      const clients = raw.map(this.normalizeClient.bind(this));
      this.log(`Got ${clients.length} clients`);
      return clients;
    } catch (err) {
      this.error('getClients failed', err);
      return [];
    }
  }

  async getJobs(dateFrom: Date, dateTo: Date): Promise<FSJob[]> {
    this.assertConnected();
    this.log(`Fetching jobs ${dateFrom.toISOString()} → ${dateTo.toISOString()}`);

    try {
      const raw = await this.fetchScheduledWork(dateFrom, dateTo);
      const jobs = raw.map(this.normalizeJob.bind(this));
      this.log(`Got ${jobs.length} jobs`);
      return jobs;
    } catch (err) {
      this.error('getJobs failed', err);
      return [];
    }
  }

  async getInvoices(dateFrom?: Date): Promise<FSInvoice[]> {
    this.assertConnected();
    this.log('Fetching invoices...');

    try {
      const raw = await this.fetchInvoiceList(dateFrom);
      const invoices = raw.map(this.normalizeInvoice.bind(this));
      this.log(`Got ${invoices.length} invoices`);
      return invoices;
    } catch (err) {
      this.error('getInvoices failed', err);
      return [];
    }
  }

  async getTechs(): Promise<FSTech[]> {
    this.assertConnected();
    this.log('Fetching techs...');

    try {
      const raw = await this.fetchEmployeeList();
      const techs = raw.map(this.normalizeTech.bind(this));
      this.log(`Got ${techs.length} techs`);
      return techs;
    } catch (err) {
      this.error('getTechs failed', err);
      return [];
    }
  }

  async getRoutes(date: Date): Promise<FSRoute[]> {
    this.assertConnected();
    this.log(`Fetching routes for ${date.toISOString()}`);

    try {
      // Get all jobs for the date, group by tech
      const jobs = await this.getJobs(date, date);
      const techMap = new Map<string, FSJob[]>();

      for (const job of jobs) {
        if (!job.techId) continue;
        if (!techMap.has(job.techId)) techMap.set(job.techId, []);
        techMap.get(job.techId)!.push(job);
      }

      const routes: FSRoute[] = [];
      for (const [techId, techJobs] of techMap.entries()) {
        const firstJob = techJobs[0];
        routes.push({
          id: `route-${techId}-${date.toISOString().split('T')[0]}`,
          techId,
          techName: firstJob.techName ?? techId,
          date,
          stops: techJobs.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
        });
      }

      this.log(`Built ${routes.length} routes`);
      return routes;
    } catch (err) {
      this.error('getRoutes failed', err);
      return [];
    }
  }

  // ── Playwright Internals ──────────────────────────────────────────────────

  private async launchAndLogin(email: string, password: string): Promise<SALoginResult> {
    try {
      const { chromium } = await import('playwright');

      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      this.page = await context.newPage();

      await this.page.goto('https://my.serviceautopilot.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.page.waitForTimeout(2000);
      await this.page.fill('input[placeholder="Email"]', email);
      await this.page.waitForTimeout(300);
      await this.page.fill('input[placeholder="Password"]', password);
      await this.page.waitForTimeout(300);
      await this.page.click('button:has-text("Log In")');
      await this.page.waitForTimeout(10000);

      const url = this.page.url();
      if (!url.includes('serviceautopilot.com') || url.includes('login')) {
        return { success: false, error: 'Login redirect failed — bad credentials?' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async fetchClientList(): Promise<SARawClient[]> {
    if (!this.page) throw new Error('No active page');

    return new Promise(async (resolve, reject) => {
      const clients: SARawClient[] = [];
      let reqBody: string | null = null;

      const captureReq = (req: import('playwright').Request) => {
        if (req.url().includes('V2AccountList_Query') && !reqBody) {
          reqBody = req.postData();
        }
      };

      this.page!.on('request', captureReq);

      try {
        await this.page!.goto('https://my.serviceautopilot.com/Clients.aspx', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await this.page!.waitForTimeout(3000);

        // Click "Search All Clients" button
        await this.page!.click('p.sabutton.green.pointer[data-bind*="SearchClients"]').catch(() => {});
        await this.page!.waitForTimeout(5000);

        this.page!.off('request', captureReq);

        if (!reqBody) {
          reject(new Error('Could not capture SA AccountList request'));
          return;
        }

        // Re-fire request with pagination — SA returns 500 per page
        const parsed = JSON.parse(reqBody);
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          parsed.PageNumber = page;
          parsed.PageSize = 500;

          const response = await this.page!.evaluate(async (body: string) => {
            const res = await fetch('/V2AccountList_Query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
            });
            return res.json();
          }, JSON.stringify(parsed));

          if (response?.Data?.length > 0) {
            clients.push(...response.Data);
            hasMore = response.Data.length === 500;
            page++;
          } else {
            hasMore = false;
          }
        }

        resolve(clients);
      } catch (err) {
        this.page!.off('request', captureReq);
        reject(err);
      }
    });
  }

  private async fetchScheduledWork(dateFrom: Date, dateTo: Date): Promise<SARawJob[]> {
    if (!this.page) throw new Error('No active page');

    return new Promise(async (resolve, reject) => {
      let capturedBody: string | null = null;

      const captureReq = (req: import('playwright').Request) => {
        if (req.url().includes('ScheduledWorkWs.asmx/Query') && !capturedBody) {
          capturedBody = req.postData();
        }
      };

      this.page!.on('request', captureReq);

      try {
        await this.page!.goto('https://my.serviceautopilot.com/DispatchBoard.aspx', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await this.page!.waitForTimeout(6000);
        this.page!.off('request', captureReq);

        if (!capturedBody) {
          reject(new Error('Could not capture SA ScheduledWork request'));
          return;
        }

        // Modify date range
        const body = JSON.parse(capturedBody);
        body.StartDate = dateFrom.toISOString().split('T')[0];
        body.EndDate = dateTo.toISOString().split('T')[0];

        const response = await this.page!.evaluate(async (payload: string) => {
          const res = await fetch('/ScheduledWorkWs.asmx/Query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
          return res.json();
        }, JSON.stringify(body));

        resolve(response?.d ?? []);
      } catch (err) {
        this.page!.off('request', captureReq);
        reject(err);
      }
    });
  }

  private async fetchInvoiceList(dateFrom?: Date): Promise<SARawInvoice[]> {
    if (!this.page) throw new Error('No active page');

    // Navigate to billing and intercept the invoice API
    const invoices: SARawInvoice[] = [];

    const captureResp = async (resp: import('playwright').Response) => {
      if (resp.url().includes('InvoiceList') || resp.url().includes('v2Invoice')) {
        try {
          const data = await resp.json();
          if (data?.Data?.length > 0) invoices.push(...data.Data);
        } catch { /* not JSON */ }
      }
    };

    this.page.on('response', captureResp);

    try {
      await this.page.goto('https://my.serviceautopilot.com/Billing.aspx', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await this.page.waitForTimeout(5000);
    } finally {
      this.page.off('response', captureResp);
    }

    return invoices;
  }

  private async fetchEmployeeList(): Promise<SARawEmployee[]> {
    if (!this.page) throw new Error('No active page');

    const employees: SARawEmployee[] = [];

    const captureResp = async (resp: import('playwright').Response) => {
      if (resp.url().includes('Employee') || resp.url().includes('employee')) {
        try {
          const data = await resp.json();
          if (Array.isArray(data)) employees.push(...data);
          else if (data?.Data) employees.push(...data.Data);
        } catch { /* not JSON */ }
      }
    };

    this.page.on('response', captureResp);

    try {
      await this.page.goto('https://my.serviceautopilot.com/Employees.aspx', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);
    } finally {
      this.page.off('response', captureResp);
    }

    return employees;
  }

  // ── Normalization ─────────────────────────────────────────────────────────

  private normalizeClient(raw: SARawClient): FSClient {
    const phone = raw.CellPhone || raw.HomePhone || raw.WorkPhone;
    return {
      id: `sa-${raw.AccountId}`,
      externalId: raw.AccountId,
      crmType: 'serviceautopilot',
      name: raw.AccountName ?? 'Unknown',
      email: raw.Email || undefined,
      phone: phone ? phone.replace(/\D/g, '') : undefined,
      address: raw.Address || undefined,
      city: raw.City || undefined,
      state: raw.State || undefined,
      zip: raw.Zip || undefined,
      monthlyRate: raw.MonthlyRate || undefined,
      serviceFrequency: raw.ServiceFrequency || undefined,
      tags: raw.Tags || undefined,
      notes: raw.Notes || undefined,
      active: raw.IsActive !== false,
      createdAt: raw.CreateDate ? new Date(raw.CreateDate) : new Date(),
      lastServiceDate: raw.LastServiceDate ? new Date(raw.LastServiceDate) : undefined,
    };
  }

  private normalizeJob(raw: SARawJob): FSJob {
    return {
      id: `sa-${raw.WorkOrderId}`,
      externalId: raw.WorkOrderId,
      crmType: 'serviceautopilot',
      clientId: `sa-${raw.AccountId}`,
      clientName: raw.AccountName ?? 'Unknown',
      techId: raw.EmployeeId ? `sa-${raw.EmployeeId}` : undefined,
      techName: raw.EmployeeName || undefined,
      scheduledDate: raw.ScheduledDate ? new Date(raw.ScheduledDate) : new Date(),
      completedDate: raw.CompletedDate ? new Date(raw.CompletedDate) : undefined,
      status: this.normalizeJobStatus(raw.Status),
      serviceAddress: raw.ServiceAddress ?? '',
      serviceType: raw.ServiceType ?? 'Service',
      notes: raw.Notes || undefined,
      photos: raw.Photos || undefined,
      amount: raw.Amount || undefined,
    };
  }

  private normalizeInvoice(raw: SARawInvoice): FSInvoice {
    const p = (s: string) => parseFloat((s || '0').replace(/[$,]/g, '')) || 0;
    const amount = p(raw.Total);
    const amountPaid = p(raw.TotalPaid);
    const balance = p(raw.Balance) || (amount - amountPaid);
    const issuedDate = raw.InvoiceDate ? new Date(raw.InvoiceDate) : new Date();
    const dueDate = raw.DueDate ? new Date(raw.DueDate) : undefined;
    const paidDate = raw.PaidDate ? new Date(raw.PaidDate) : undefined;

    let daysPastDue = 0;
    if (!paidDate && dueDate && dueDate < new Date()) {
      daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: `sa-${raw.InvoiceId}`,
      externalId: raw.InvoiceId,
      crmType: 'serviceautopilot',
      clientId: `sa-${raw.AccountId}`,
      clientName: raw.AccountName ?? 'Unknown',
      amount,
      amountPaid,
      balance,
      status: this.normalizeInvoiceStatus(raw.Status, balance, dueDate),
      issuedDate,
      dueDate,
      paidDate,
      daysPastDue,
    };
  }

  private normalizeTech(raw: SARawEmployee): FSTech {
    return {
      id: `sa-${raw.EmployeeId}`,
      externalId: raw.EmployeeId,
      crmType: 'serviceautopilot',
      name: raw.Name ?? 'Unknown',
      email: raw.Email || undefined,
      phone: raw.Phone ? raw.Phone.replace(/\D/g, '') : undefined,
      active: raw.IsActive !== false,
    };
  }

  private normalizeJobStatus(status?: string): FSJob['status'] {
    const s = (status ?? '').toLowerCase();
    if (s.includes('complet')) return 'completed';
    if (s.includes('skip') || s.includes('cancel') && s.includes('skip')) return 'skipped';
    if (s.includes('cancel')) return 'cancelled';
    if (s.includes('progress') || s.includes('started')) return 'in_progress';
    return 'scheduled';
  }

  private normalizeInvoiceStatus(
    status?: string,
    balance?: number,
    dueDate?: Date
  ): FSInvoice['status'] {
    const s = (status ?? '').toLowerCase();
    if (s.includes('void')) return 'voided';
    if (s.includes('paid') || balance === 0) return 'paid';
    if (dueDate && dueDate < new Date() && (balance ?? 0) > 0) return 'overdue';
    return 'open';
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSAConnector(): ServiceAutopilotConnector {
  return new ServiceAutopilotConnector();
}
