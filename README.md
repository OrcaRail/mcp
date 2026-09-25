# @orcarail/mcp

Official [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for [OrcaRail](https://orcarail.com) — accept crypto payments from your AI coding agent.

Runs locally over stdio and wraps the [`@orcarail/node`](https://www.npmjs.com/package/@orcarail/node) SDK, so Claude Code, Cursor, Codex, and any other MCP client can create payment intents, manage subscriptions, maintain your product catalog, and look up exchange rates — the same delivery model as Stripe's `@stripe/mcp`.

- **Docs:** [docs.orcarail.com/docs/integration/mcp](https://docs.orcarail.com/docs/integration/mcp/)
- **Dashboard:** [app.orcarail.com](https://app.orcarail.com)
- **npm:** [`@orcarail/mcp`](https://www.npmjs.com/package/@orcarail/mcp)

## What you can ask your agent

- "Create a $25 USDC payment intent on Polygon with return URL `https://myapp.com/success` and give me the pay link."
- "List my active subscriptions and cancel the one for `customer@example.com` at period end."
- "Create a product called Pro Plan with a $29/month recurring price."
- "How much is 500 EUR in USDC right now?"

## Requirements

- Node.js 18+
- For private tools (payment intents, subscriptions, catalog): an OrcaRail API key (`ak_…`) and secret (`sk_…`) from the [dashboard](https://app.orcarail.com)
- Public tools (`rates.*`, `pay.*`) work with no credentials

## Quick start

Public rates/pay tools need no credentials:

```bash
npx -y @orcarail/mcp --tools=all
```

For private tools, set environment variables (preferred — keeps secrets out of shell history):

```bash
export ORCARAIL_API_KEY=ak_live_xxx
export ORCARAIL_API_SECRET=sk_live_xxx
npx -y @orcarail/mcp --tools=all
```

Or pass flags:

```bash
npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
```

The server speaks MCP over stdin/stdout; it is meant to be launched by an MCP client, not used interactively. `npx -y @orcarail/mcp --help` prints usage.

## Configuration

Every option is a CLI flag or an environment variable. Flags win. Prefer env for secrets.

| Flag | Environment variable | Required | Description |
| --- | --- | --- | --- |
| `--api-key` | `ORCARAIL_API_KEY` | For private tools | API key (`ak_…`) |
| `--api-secret` | `ORCARAIL_API_SECRET` | For private tools | API secret (`sk_…`) |
| `--api-base` | `ORCARAIL_API_BASE` | No | API base URL. Default `https://api.orcarail.com/api/v1` |
| `--organization-id` | `ORCARAIL_ORGANIZATION_ID` | No | Default organization for `products.*` / `prices.*` tools |
| `--tools` | — | No | `all` (default) or comma-separated tool names |

Restrict what the agent can do:

```bash
npx -y @orcarail/mcp \
  --tools=payment_intents.create,payment_intents.retrieve,subscriptions.list \
  --api-key=... --api-secret=...
```

Self-hosted or local API:

```bash
npx -y @orcarail/mcp --tools=all --api-base=http://127.0.0.1:3000/api/v1 --api-key=... --api-secret=...
```

## Client setup

### Claude Code

```bash
claude mcp add orcarail -- npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
```

Or pass secrets via env:

```bash
claude mcp add orcarail \
  -e ORCARAIL_API_KEY=ak_live_xxx \
  -e ORCARAIL_API_SECRET=sk_live_xxx \
  -- npx -y @orcarail/mcp --tools=all
```

Verify with `claude mcp list`.

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "orcarail": {
      "command": "npx",
      "args": ["-y", "@orcarail/mcp", "--tools=all"],
      "env": {
        "ORCARAIL_API_KEY": "ak_live_xxx",
        "ORCARAIL_API_SECRET": "sk_live_xxx"
      }
    }
  }
}
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.orcarail]
command = "npx"
args = ["-y", "@orcarail/mcp", "--tools=all"]

[mcp_servers.orcarail.env]
ORCARAIL_API_KEY = "ak_live_xxx"
ORCARAIL_API_SECRET = "sk_live_xxx"
```

### Other MCP clients

Any stdio-capable MCP client works with the same shape: command `npx`, args `["-y", "@orcarail/mcp", "--tools=all"]`, credentials in env. For Claude Desktop, use the Cursor JSON block in `claude_desktop_config.json`.

## Live vs sandbox

The server detects the mode from your API key and tells the agent about it through its MCP instructions and the `account.get_mode` tool.

| Key | Mode | What it means |
| --- | --- | --- |
| `ak_test_…` | **Sandbox** | A sandbox organization: testnets only, no real funds. `payment_intents.simulate` is available. |
| `ak_live_…` | **Live** | Real funds on mainnet networks. The agent is asked to confirm with you before any write. |
| none | Public | Only the public tools (`rates.*`, `pay.*`, `account.get_mode`). |

Use a sandbox key while you build with an agent. You can create one from the **Go to sandbox** button in the OrcaRail dashboard (see [Sandbox](https://docs.orcarail.com/docs/sandbox/overview/)). Switch to a live key only when you are ready.

## Tool reference

Tool names follow `resource.action`. Responses are raw OrcaRail API objects as JSON.

### Payment intents

| Tool | Arguments | Description |
| --- | --- | --- |
| `payment_intents.create` | `return_url` (required); either `price_id` or `amount` + `currency` + `tokenId` + `networkId`; optional `cancel_url`, `description`, `metadata`, `expires_at`, `payment_method_types`, `withdrawal_addresses` | Create a payment intent (returns `client_secret` and payment link) |
| `payment_intents.retrieve` | `id` | Fetch current status |
| `payment_intents.update` | `id` + any updatable field | Update before confirmation |
| `payment_intents.confirm` | `id`, `client_secret`, `return_url` | Confirm and get the hosted pay redirect URL |
| `payment_intents.complete` | `id` | Mark processing after the customer hits your success URL |
| `payment_intents.cancel` | `id` | Cancel the intent |
| `payment_intents.simulate` | `id` | **Sandbox keys only.** Complete the payment without a wallet, firing the usual webhooks |

`tokenId` / `networkId` are UUIDs — see [Networks and Tokens](https://docs.orcarail.com/docs/reference/networks-and-tokens/).

### Subscriptions

| Tool | Arguments | Description |
| --- | --- | --- |
| `subscriptions.create` | `description` (required); either `price_id` or `interval` + `amount` + `currency` + `token_id` + `network_id`; optional `collection_method`, `total_cycles`, `trial_period_days`, `trial_end`, `payer_email`, `payer_user_id`, `billing_cycle_anchor`, `cancel_at`, `cancel_at_period_end`, `days_until_due`, `interval_count`, `metadata`, `withdrawal_addresses`, `return_url`, `cancel_url` | Create a recurring subscription |
| `subscriptions.retrieve` | `id` | Fetch a subscription |
| `subscriptions.update` | `id` + any updatable field, including `pause_collection` | Update |
| `subscriptions.cancel` | `id`, optional `cancellation_details` (`comment`, `feedback`) | Cancel |
| `subscriptions.resume` | `id` | Resume a paused subscription |
| `subscriptions.list` | Optional `status`, `collection_method`, `created` / `current_period_start` / `current_period_end` range filters, `limit`, `starting_after`, `ending_before` | List with cursor pagination |
| `subscriptions.list_payment_links` | `id`, optional `limit`, `starting_after`, `ending_before` | Cycle invoices for a subscription |

### Catalog — products and prices

Catalog tools operate on an organization: pass `organization_id` per call or set a default via `--organization-id` / `ORCARAIL_ORGANIZATION_ID`.

| Tool | Arguments | Description |
| --- | --- | --- |
| `products.list` | optional `organization_id` | List products |
| `products.create` | `name` (required); optional `description`, `active`, `metadata`, `default_price`, `marketing_features`, … | Create a product |
| `products.update` | `product_id` + updatable fields | Update a product |
| `products.delete` | `product_id` | Delete a product |
| `prices.list` | optional `active`, `recurring`, `limit` | List prices |
| `prices.create` | `unit_amount_decimal`, `currency`, `token_id`, `network_id` (required); `product` or inline `product_data`; optional `recurring` (`interval`, `interval_count`, `trial_period_days`), `nickname`, `lookup_key`, `active`, `metadata` | Create a one-time or recurring price |
| `prices.update` | `price_id` + updatable fields | Update a price |
| `prices.deactivate` | `price_id` | Deactivate a price |

### Rates and pay (public — no credentials required)

| Tool | Arguments | Description |
| --- | --- | --- |
| `rates.get_fiat_quote` | `amount`, `currency` | Fiat → USD/USDC quote |
| `rates.list_currencies` | optional `active` | Supported fiat currencies |
| `pay.get_by_slug` | `slug` | Payment details by hosted pay slug |
| `pay.cancel_by_slug` | `slug` | Cancel by pay slug |
| `account.get_mode` | — | Live, sandbox or public mode of this server (see [Live vs sandbox](#live-vs-sandbox)) |

## Error handling

API failures surface to the agent as tool errors with the HTTP status, error type, and message intact, e.g. `API error (401): [authentication_error]: …`. Nothing is retried automatically.

Calling a private tool without credentials returns a clear tool error telling you to set `ORCARAIL_API_KEY` and `ORCARAIL_API_SECRET` (or the matching flags).

## Programmatic usage

The package also exports its building blocks if you want to embed the server:

```typescript
import { createServer, startStdioServer, listToolNames } from '@orcarail/mcp';

const { server, tools } = createServer({
  // Optional — omit for public rates/pay only
  apiKey: process.env.ORCARAIL_API_KEY,
  apiSecret: process.env.ORCARAIL_API_SECRET,
  tools: 'all', // or new Set(['payment_intents.create'])
});

console.log(listToolNames()); // all 25 tool names
await startStdioServer(server);
```

## Security

- API keys grant **full access** to the linked organization — treat MCP config files like `.env` files.
- Prefer environment variables over inline `--api-key=…` args.
- Never commit live keys; keep project-level `.cursor/mcp.json` with secrets out of git.
- Scope with `--tools` to only the operations your agent needs.
- Use test keys during development; rotate leaked keys in the [dashboard](https://app.orcarail.com/api-keys).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Missing credentials for this tool` | Set `ORCARAIL_API_KEY`/`ORCARAIL_API_SECRET` (or `--api-key`/`--api-secret`) for private tools |
| `Authentication error` on every call | Verify the key/secret pair; don't mix test and live credentials |
| `organization_id is required` | Pass `organization_id` in the call or launch with `--organization-id` |
| Tool missing from the client | Check the `--tools` filter — names must match exactly |
| Client can't start the server | Ensure Node.js 18+ on the client's PATH; try `npx -y @orcarail/mcp --help` |

## Development

```bash
npm install
npm run build       # tsup → dist/
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Test against a local MCP inspector:

```bash
npx @modelcontextprotocol/inspector node dist/cli.cjs --tools=all --api-key=ak_test_xxx --api-secret=sk_test_xxx
```

## Related

- [MCP server guide](https://docs.orcarail.com/docs/integration/mcp/)
- [Node.js SDK](https://docs.orcarail.com/docs/integration/node-sdk/)
- [Build with AI](https://docs.orcarail.com/docs/building-with-ai/)
- [Changelog](./CHANGELOG.md)

## License

MIT
