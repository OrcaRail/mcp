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
  const { server } = createServer(config);
  await startStdioServer(server);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
