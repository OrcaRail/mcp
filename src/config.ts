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

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * The API key and secret go out as HTTP Basic auth, so the API base must use https;
 * plain http is allowed only for a local API (MCP-3).
 */
function checkApiBase(apiBase: string): string {
  let url: URL;
  try {
    url = new URL(apiBase);
  } catch {
    throw new Error(`Invalid --api-base URL: ${apiBase}`);
  }
  if (url.protocol === 'https:') return apiBase;
  if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) return apiBase;
  throw new Error(
    '--api-base must use https (plain http is allowed only for localhost), because the API key and secret are sent with every request.'
  );
}

/**
 * Parse CLI args and environment into MCP config.
 * Flags: --api-key, --api-secret, --api-base, --organization-id, --tools
 * Env: ORCARAIL_API_KEY, ORCARAIL_API_SECRET, ORCARAIL_API_BASE, ORCARAIL_ORGANIZATION_ID
 *
 * Credentials are optional at startup. Public tools (rates.*, pay.*) work without them;
 * private tools return a clear error when credentials are missing.
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

  return {
    apiKey: apiKey || undefined,
    apiSecret: apiSecret || undefined,
    apiBase: apiBase ? checkApiBase(apiBase) : undefined,
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

Credentials are optional for public tools (rates.*, pay.*).
Private tools require ORCARAIL_API_KEY and ORCARAIL_API_SECRET (or the flags above).

Examples:
  npx -y @orcarail/mcp --tools=all
  npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
  npx -y @orcarail/mcp --tools=payment_intents.create,subscriptions.list --api-key=...
`);
}
