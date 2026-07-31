import type OrcaRail from '@orcarail/node';
import type { z } from 'zod';

export interface McpConfig {
  apiKey: string;
  apiSecret: string;
  apiBase?: string;
  organizationId?: string;
  /** `all` or a set of tool names like `payment_intents.create` */
  tools: 'all' | Set<string>;
}

export interface ToolContext {
  client: OrcaRail;
  organizationId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: z.ZodObject<any>;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
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
