import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OrcaRail from '@orcarail/node';
import type { McpConfig, ToolContext, ToolDefinition } from './tools';
import { selectTools } from './tools';
import {
  DEFAULT_API_BASE,
  MISSING_CREDENTIALS_MESSAGE,
  modeFromApiKey,
  type McpMode,
} from './tools/types';
import { errorResult, jsonResult } from './result';
import packageJson from '../package.json';

export interface CreatedServer {
  server: McpServer;
  tools: ToolDefinition[];
  ctx: ToolContext;
}

export function createServer(config: McpConfig): CreatedServer {
  const apiBase = config.apiBase || DEFAULT_API_BASE;
  const hasCredentials = Boolean(config.apiKey && config.apiSecret);

  const client = hasCredentials
    ? new OrcaRail(config.apiKey!, config.apiSecret!, {
        baseUrl: apiBase,
      })
    : undefined;

  const ctx: ToolContext = {
    client,
    apiBase,
    organizationId: config.organizationId,
    mode: modeFromApiKey(config.apiKey),
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  };

  const tools = selectTools(config.tools, ctx.mode);

  const server = new McpServer(
    {
      name: 'orcarail',
      version: packageJson.version,
    },
    { instructions: modeInstructions(ctx.mode) }
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
        annotations: toolAnnotations(tool.name),
      },
      async (args: Record<string, unknown>) => {
        if (tool.requiresAuth && !ctx.client) {
          return errorResult(new Error(MISSING_CREDENTIALS_MESSAGE));
        }
        try {
          const result = await tool.handler(args, ctx);
          return jsonResult(result);
        } catch (err) {
          return errorResult(err);
        }
      }
    );
  }

  return { server, tools, ctx };
}

/** Server-level instructions so the agent always knows whether real funds are involved. */
export function modeInstructions(mode: McpMode): string {
  if (mode === 'sandbox') {
    return (
      'OrcaRail SANDBOX: this key belongs to a sandbox organization. Testnets only, ' +
      'no real funds. Use payment_intents.simulate to complete payments without a wallet.'
    );
  }
  if (mode === 'live') {
    return (
      'OrcaRail LIVE: this key moves real funds on mainnet networks. Confirm with the user ' +
      'before any create, confirm, complete, cancel, update or delete. Prefer a sandbox ' +
      'key (ak_test_) while developing.'
    );
  }
  return (
    'OrcaRail public mode: no API key, so only public tools (rates, pay) are available. ' +
    'Use a sandbox key (ak_test_) for development.'
  );
}

const READ_ONLY_TOOL = /\.(list|retrieve|get_[a-z_]+|list_[a-z_]+)$|^rates\./;
const DESTRUCTIVE_TOOL = /\.(cancel|cancel_by_slug|delete|deactivate|complete|confirm)$/;

/** MCP tool hints so clients can gate writes. */
export function toolAnnotations(name: string): {
  readOnlyHint: boolean;
  destructiveHint: boolean;
} {
  const readOnly = READ_ONLY_TOOL.test(name) || name === 'account.get_mode';
  return {
    readOnlyHint: readOnly,
    destructiveHint: !readOnly && DESTRUCTIVE_TOOL.test(name),
  };
}

export async function startStdioServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
