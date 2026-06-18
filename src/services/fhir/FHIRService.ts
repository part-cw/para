/**
 * Sends FHIR bundles to the eCHIS server.
 *
 * When no server URL is configured the service runs in dry-run mode: it logs the
 * (pretty-printed) bundle and reports success, so the archive flow works end-to-end
 * before the real eCHIS endpoint is known.
 */

import { Bundle } from './fhirTypes';

export interface SendOptions {
  serverUrl?: string;
  authToken?: string;
}

export interface SendResult {
  ok: boolean;
  dryRun: boolean;
  status?: number;
  error?: string;
}

export class FHIRService {
  async sendBundle(bundle: Bundle, opts: SendOptions = {}): Promise<SendResult> {
    const serverUrl = opts.serverUrl?.trim();

    // Dry-run: no endpoint configured yet.
    if (!serverUrl) {
      console.log('[FHIR] Dry-run (no echisServerUrl configured). Bundle that would be sent:');
      console.log(JSON.stringify(bundle, null, 2));
      return { ok: true, dryRun: true };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      };
      if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`;

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return {
          ok: false,
          dryRun: false,
          status: response.status,
          error: `eCHIS responded ${response.status} ${response.statusText}${body ? `: ${body}` : ''}`,
        };
      }

      return { ok: true, dryRun: false, status: response.status };
    } catch (error) {
      return {
        ok: false,
        dryRun: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
