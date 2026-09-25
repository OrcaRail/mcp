#!/usr/bin/env node
import { parseConfig, printUsage } from './config';
import { createServer, startStdioServer } from './server';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const config = parseConfig(argv);
  const { server, ctx } = createServer(config);
  // stderr only: stdout is the MCP stdio channel.
  process.stderr.write(
    `OrcaRail MCP: ${ctx.mode.toUpperCase()} mode${ctx.mode === 'live' ? ' (real funds)' : ctx.mode === 'sandbox' ? ' (testnets, no real funds)' : ''}\n`
  );
  await startStdioServer(server);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
