/**
 * FieldSync CRM Adapter Framework
 * Base interfaces that every CRM connector must implement.
 * 
 * Design goals:
 * - Callers never need to know which CRM they're talking to
 * - All data normalized to FieldSync's unified schema
 * - Credentials passed as parameters (multi-tenant safe)
 * - Async throughout — connectors may hit APIs or run Playwright
 */

// ─── Connector Interface ─────────────────────────────────────────────────────

export interface FieldSyncConnector {
  // Identity
  readonly name: string;
  readonly version: string;

  // Connection
  connect(credentials: Record<string, string>): Promise<boolean>;
  testConnection(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Core data pulls
  getClients(): Promise<FSClient[]>;
  getJobs(dateFrom: Date, dateTo: Date): Promise<FSJob[]>;
  getInvoices(dateFrom?: Date): Promise<FSInvoice[]>;
  getTechs(): Promise<FSTech[]>;
  getRoutes(date: Date): Promise<FSRoute[]>;

  // Writes (where supported — not all CRMs allow writes)
  addJobNote(jobId: string, note: string): Promise<boolean>;
  updateJobStatus(jobId: string, status: string): Promise<boolean>;
}

// ─── Normalized Data Types ────────────────────────────────────────────────────

export interface FSClient {
  id: string;
  externalId: string;        // CRM's native ID
  crmType: string;           // 'serviceautopilot' | 'jobber' | 'housecallpro' | etc.
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  monthlyRate?: number;
  serviceFrequency?: string; // 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  tags?: string[];
  notes?: string;
  active: boolean;
  createdAt: Date;
  lastServiceDate?: Date;
}

export interface FSJob {
  id: string;
  externalId: string;
  crmType: string;
  clientId: string;
  clientName: string;
  techId?: string;
  techName?: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  serviceAddress: string;
  serviceType: string;
  notes?: string;
  photos?: string[];
  amount?: number;
}

export interface FSInvoice {
  id: string;
  externalId: string;
  crmType: string;
  clientId: string;
  clientName: string;
  amount: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'open' | 'overdue' | 'voided';
  issuedDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  daysPastDue?: number;
}

export interface FSTech {
  id: string;
  externalId: string;
  crmType: string;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export interface FSRoute {
  id: string;
  techId: string;
  techName: string;
  date: Date;
  stops: FSJob[];
  estimatedMiles?: number;
  estimatedDuration?: number; // minutes
  actualMiles?: number;
  actualDuration?: number;    // minutes
}

// ─── Sync Result ─────────────────────────────────────────────────────────────

export interface FSSyncResult {
  success: boolean;
  crmType: string;
  syncedAt: Date;
  counts: {
    clients: number;
    jobs: number;
    invoices: number;
    techs: number;
  };
  errors: string[];
  durationMs: number;
}

// ─── Connector Credentials ────────────────────────────────────────────────────

export interface SACredentials {
  email: string;
  password: string;
}

export interface JobberCredentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
}

export interface HousecallProCredentials {
  apiKey: string;
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BaseConnector implements FieldSyncConnector {
  abstract readonly name: string;
  abstract readonly version: string;

  protected connected = false;
  protected credentials: Record<string, string> = {};

  abstract connect(credentials: Record<string, string>): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;

  async disconnect(): Promise<void> {
    this.connected = false;
    this.credentials = {};
  }

  abstract getClients(): Promise<FSClient[]>;
  abstract getJobs(dateFrom: Date, dateTo: Date): Promise<FSJob[]>;
  abstract getInvoices(dateFrom?: Date): Promise<FSInvoice[]>;
  abstract getTechs(): Promise<FSTech[]>;
  abstract getRoutes(date: Date): Promise<FSRoute[]>;

  // Default: writes not supported — override if CRM supports them
  async addJobNote(_jobId: string, _note: string): Promise<boolean> {
    throw new Error(`${this.name} does not support write operations`);
  }

  async updateJobStatus(_jobId: string, _status: string): Promise<boolean> {
    throw new Error(`${this.name} does not support write operations`);
  }

  protected assertConnected(): void {
    if (!this.connected) {
      throw new Error(`${this.name}: not connected — call connect() first`);
    }
  }

  protected log(msg: string): void {
    console.log(`[${this.name}] ${msg}`);
  }

  protected error(msg: string, err?: unknown): void {
    console.error(`[${this.name}] ERROR: ${msg}`, err ?? '');
  }
}
