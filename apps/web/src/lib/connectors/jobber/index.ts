/**
 * Jobber Connector (GraphQL API)
 * ==============================
 * Jobber uses OAuth 2.0 + GraphQL.
 * 
 * OAuth flow:
 *   1. Redirect user to https://api.getjobber.com/api/oauth/authorize
 *   2. Exchange code for access_token + refresh_token
 *   3. All API calls use Bearer token to https://api.getjobber.com/api/graphql
 * 
 * Status: STUB — implements interface, real queries TODO in Week 3
 */

import { BaseConnector, FSClient, FSJob, FSInvoice, FSTech, FSRoute } from '../base';

const JOBBER_API = 'https://api.getjobber.com/api/graphql';

export class JobberConnector extends BaseConnector {
  readonly name = 'Jobber';
  readonly version = '0.1.0';

  private accessToken: string | null = null;

  async connect(credentials: Record<string, string>): Promise<boolean> {
    const { accessToken } = credentials;
    if (!accessToken) {
      this.error('Missing accessToken');
      return false;
    }
    this.credentials = credentials;
    this.accessToken = accessToken;

    const ok = await this.testConnection();
    if (ok) {
      this.connected = true;
      this.log('Connected via OAuth token');
    }
    return ok;
  }

  async testConnection(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const result = await this.query(`query { user { id email name { full } } }`);
      return !!result?.data?.user;
    } catch {
      return false;
    }
  }

  async getClients(): Promise<FSClient[]> {
    this.assertConnected();
    // TODO: implement GraphQL client query (Week 3)
    this.log('getClients() — stub, returning []');
    return [];
  }

  async getJobs(_dateFrom: Date, _dateTo: Date): Promise<FSJob[]> {
    this.assertConnected();
    // TODO: implement GraphQL visit query (Week 3)
    this.log('getJobs() — stub, returning []');
    return [];
  }

  async getInvoices(_dateFrom?: Date): Promise<FSInvoice[]> {
    this.assertConnected();
    // TODO: implement GraphQL invoice query (Week 3)
    this.log('getInvoices() — stub, returning []');
    return [];
  }

  async getTechs(): Promise<FSTech[]> {
    this.assertConnected();
    // TODO: implement GraphQL user query (Week 3)
    this.log('getTechs() — stub, returning []');
    return [];
  }

  async getRoutes(_date: Date): Promise<FSRoute[]> {
    this.assertConnected();
    this.log('getRoutes() — stub, returning []');
    return [];
  }

  private async query(gql: string, variables?: Record<string, unknown>) {
    const res = await fetch(JOBBER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2024-01-08',
      },
      body: JSON.stringify({ query: gql, variables }),
    });
    return res.json();
  }
}
