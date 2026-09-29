import type OrcaRail from '@orcarail/node';
import type { z } from 'zod';

export const DEFAULT_API_BASE = 'https://api.orcarail.com/api/v1';

export const MISSING_CREDENTIALS_MESSAGE =
  'Missing credentials for this tool. Set ORCARAIL_API_KEY and ORCARAIL_API_SECRET (or pass --api-key / --api-secret).';

export interface McpConfig {
  apiKey?: string;
  apiSecret?: string;
  apiBase?: string;
  organizationId?: string;
  /** `all` or a set of tool names like `payment_intents.create` */
  tools: 'all' | Set<string>;
}

/**
 * `sandbox`: an `ak_test_` key of a sandbox organization (testnets, no real funds).
 * `live`: an `ak_live_` key (real funds). `public`: no key, public tools only.
 */
export type McpMode = 'live' | 'sandbox' | 'public';

export function modeFromApiKey(apiKey?: string): McpMode {
  const key = apiKey?.trim() ?? '';
  if (key.startsWith('ak_test_')) return 'sandbox';
  if (key) return 'live';
  return 'public';
}

export interface ToolContext {
  /** Present when API key and secret are configured */
  client?: OrcaRail;
  apiBase: string;
  organizationId?: string;
  mode: McpMode;
  apiKey?: string;
  apiSecret?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** When true, ORCARAIL_API_KEY + ORCARAIL_API_SECRET are required */
  requiresAuth: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: z.ZodObject<any>;
  /** Only registered for sandbox (`ak_test_`) keys. */
  sandboxOnly?: boolean;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

export function requireClient(ctx: ToolContext): OrcaRail {
  if (!ctx.client) {
    throw new Error(MISSING_CREDENTIALS_MESSAGE);
  }
  return ctx.client;
}

export function resolveOrganizationId(
  args: { organization_id?: string },
  ctx: ToolContext
): string {
  const id = args.organization_id ?? ctx.organizationId;
  if (!id) {
    throw new Error(
      'organization_id is required. Pass it as a tool argument or set --organization-id / ORCARAIL_ORGANIZATION_ID.'
    );
  }
  return id;
}

export function toolAllowed(name: string, tools: McpConfig['tools']): boolean {
  if (tools === 'all') return true;
  return tools.has(name);
}
