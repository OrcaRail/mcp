import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OrcaRail from '@orcarail/node';
import type { McpConfig, ToolContext, ToolDefinition } from './tools';
import { selectTools } from './tools';
import { errorResult, jsonResult } from './result';
import packageJson from '../package.json';

export interface CreatedServer {
  server: McpServer;
  tools: ToolDefinition[];
  ctx: ToolContext;
}

export function createServer(config: McpConfig): CreatedServer {
  const client = new OrcaRail(config.apiKey, config.apiSecret, {
    baseUrl: config.apiBase,
  });

  const ctx: ToolContext = {
    client,
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
