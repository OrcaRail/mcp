import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OrcaRail from '@orcarail/node';
import type { McpConfig, ToolContext, ToolDefinition } from './tools';
import { selectTools } from './tools';
import {
  DEFAULT_API_BASE,
  MISSING_CREDENTIALS_MESSAGE,
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
  };

  const tools = selectTools(config.tools);

  const server = new McpServer({
    name: 'orcarail',
    version: packageJson.version,
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
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

export async function startStdioServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
