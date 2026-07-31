import type { McpConfig } from './tools/types';

function readFlag(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of argv) {
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
    if (arg === `--${name}`) {
      const idx = argv.indexOf(arg);
      const next = argv[idx + 1];
      if (next && !next.startsWith('--')) return next;
    }
  }
  return undefined;
}

function parseTools(raw: string | undefined): McpConfig['tools'] {
  if (!raw || raw === 'all') return 'all';
  const names = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 0) return 'all';
  return new Set(names);
}

/**
 * Parse CLI args and environment into MCP config.
 * Flags: --api-key, --api-secret, --api-base, --organization-id, --tools
 * Env: ORCARAIL_API_KEY, ORCARAIL_API_SECRET, ORCARAIL_API_BASE, ORCARAIL_ORGANIZATION_ID
 */
export function parseConfig(argv: string[] = process.argv.slice(2)): McpConfig {
  const apiKey =
    readFlag(argv, 'api-key') ?? process.env.ORCARAIL_API_KEY ?? process.env.ORCARAIL_KEY;
  const apiSecret =
    readFlag(argv, 'api-secret') ??
    process.env.ORCARAIL_API_SECRET ??
    process.env.ORCARAIL_SECRET;
  const apiBase = readFlag(argv, 'api-base') ?? process.env.ORCARAIL_API_BASE;
  const organizationId =
    readFlag(argv, 'organization-id') ?? process.env.ORCARAIL_ORGANIZATION_ID;
  const tools = parseTools(readFlag(argv, 'tools'));

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Missing credentials. Pass --api-key and --api-secret, or set ORCARAIL_API_KEY and ORCARAIL_API_SECRET.'
    );
  }

  return {
    apiKey,
    apiSecret,
    apiBase: apiBase || undefined,
    organizationId: organizationId || undefined,
    tools,
  };
}

export function printUsage(): void {
  process.stderr.write(`Usage: npx -y @orcarail/mcp [options]

Options:
  --api-key=KEY              OrcaRail API key (or ORCARAIL_API_KEY)
  --api-secret=SECRET        OrcaRail API secret (or ORCARAIL_API_SECRET)
  --api-base=URL             Optional API base URL (or ORCARAIL_API_BASE)
  --organization-id=ID       Default organization for catalog tools
  --tools=all|a,b,c          Tool filter (default: all)

Examples:
  npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
  npx -y @orcarail/mcp --tools=payment_intents.create,subscriptions.list --api-key=...
`);
}
