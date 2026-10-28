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
  apiKey?: string;
}

export interface SendResult {
  ok: boolean;
  dryRun: boolean;
  status?: number;
  error?: string;
  body?: { error?: string } | string;
}

export class FHIRService {
  async sendBundle(bundle: Bundle, opts: SendOptions = {}): Promise<SendResult> {
    const serverUrl = opts.serverUrl?.trim();
    console.log(JSON.stringify(bundle, null, 2));

    // Dry-run: no endpoint configured yet.
    if (!serverUrl) {
      console.log('[FHIR] Dry-run (no echisServerUrl configured). Bundle that would be sent:');
      console.log(JSON.stringify(bundle, null, 2));
      return { ok: true, dryRun: true };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      // if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`; * Endpoint uses an API key instead *
      if (opts.apiKey) headers['X-API-Key'] = opts.apiKey;

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bundle),
      });

      // Read the body once, as text, regardless of success or failure
      const rawBody = await response.text().catch(() => '');

      // eCHIS returns JSON like { error: "..." }; fall back to raw text if it isn't JSON
      let parsedBody: { error?: string } | string | undefined = rawBody || undefined;
      try {
        if (rawBody) parsedBody = JSON.parse(rawBody) as { error?: string };
      } catch {
        // not JSON, keep the raw text
      }

      // return body if it's a string, or JSON if it's an object
      const detail = typeof parsedBody === 'string' ? parsedBody : parsedBody?.error;

      if (!response.ok) {
        return {
          ok: false,
          dryRun: false,
          status: response.status,
          error: `eCHIS responded ${response.status} ${response.statusText}${detail ? `: ${detail}` : ''}`,
          body: parsedBody
        };
      }

      return { ok: true, dryRun: false, status: response.status, body: parsedBody };
    } catch (error) {
      return {
        ok: false,
        dryRun: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}


