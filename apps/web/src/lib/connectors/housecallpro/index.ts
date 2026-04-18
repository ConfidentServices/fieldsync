/**
 * Housecall Pro Connector (REST API)
 * ===================================
 * Housecall Pro uses API key authentication.
 * Base URL: https://api.housecallpro.com/v1/
 * 
 * Note: Partner API access required — apply at:
 * https://www.housecallpro.com/partner-program/
 * 
 * Status: STUB — implements interface, real API calls TODO in Week 3
 */

import { BaseConnector, FSClient, FSJob, FSInvoice, FSTech, FSRoute } from '../base';

const HCP_API = 'https://api.housecallpro.com/v1';

export class HousecallProConnector extends BaseConnector {
  readonly name = 'Housecall Pro';
  readonly version = '0.1.0';

  private apiKey: string | null = null;

  async connect(credentials: Record<string, string>): Promise<boolean> {
    const { apiKey } = credentials;
    if (!apiKey) {
      this.error('Missing apiKey');
      return false;
    }
    this.credentials = credentials;
    this.apiKey = apiKey;

    const ok = await this.testConnection();
    if (ok) {
      this.connected = true;
      this.log('Connected via API key');
    }
    return ok;
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await this.get('/company');
      return !!res?.id;
    } catch {
      return false;
    }
  }

  async getClients(): Promise<FSClient[]> {
    this.assertConnected();
    this.log('getClients() — stub, returning []');
    return [];
  }

  async getJobs(_dateFrom: Date, _dateTo: Date): Promise<FSJob[]> {
    this.assertConnected();
    this.log('getJobs() — stub, returning []');
    return [];
  }

  async getInvoices(_dateFrom?: Date): Promise<FSInvoice[]> {
    this.assertConnected();
    this.log('getInvoices() — stub, returning []');
    return [];
  }

  async getTechs(): Promise<FSTech[]> {
    this.assertConnected();
    this.log('getTechs() — stub, returning []');
    return [];
  }

  async getRoutes(_date: Date): Promise<FSRoute[]> {
    this.assertConnected();
    this.log('getRoutes() — stub, returning []');
    return [];
  }

  private async get(path: string) {
    const res = await fetch(`${HCP_API}${path}`, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HCP API error: ${res.status}`);
    return res.json();
  }
}
