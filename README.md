# @orcarail/mcp

Official [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for [OrcaRail](https://orcarail.com). Use it from Claude Code, Cursor, or Codex to create payment intents, manage subscriptions and catalog, and look up rates — the same delivery model as Stripe's `@stripe/mcp`.

## Requirements

- Node.js 18+
- OrcaRail API key (`ak_…`) and secret (`sk_…`) from the [dashboard](https://app.orcarail.com)

## Quick start

```bash
npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
```

Or with environment variables:

```bash
export ORCARAIL_API_KEY=ak_live_xxx
export ORCARAIL_API_SECRET=sk_live_xxx
npx -y @orcarail/mcp --tools=all
```

### Options

| Flag / env | Description |
| --- | --- |
| `--api-key` / `ORCARAIL_API_KEY` | API key (required) |
| `--api-secret` / `ORCARAIL_API_SECRET` | API secret (required) |
| `--api-base` / `ORCARAIL_API_BASE` | Optional API base (default `https://api.orcarail.com/api/v1`) |
| `--organization-id` / `ORCARAIL_ORGANIZATION_ID` | Default org for catalog tools |
| `--tools` | `all` (default) or comma-separated tool names |

Restrict what the agent can do:

```bash
npx -y @orcarail/mcp --tools=payment_intents.create,payment_intents.retrieve,subscriptions.list --api-key=... --api-secret=...
```

## Client setup

### Claude Code

```bash
claude mcp add orcarail -- npx -y @orcarail/mcp --tools=all --api-key=ak_live_xxx --api-secret=sk_live_xxx
```

Or pass secrets via env:

```bash
claude mcp add orcarail -e ORCARAIL_API_KEY=ak_live_xxx -e ORCARAIL_API_SECRET=sk_live_xxx -- npx -y @orcarail/mcp --tools=all
```

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

## Available tools

### Payment intents

| Tool | Description |
| --- | --- |
| `payment_intents.create` | Create a payment intent |
| `payment_intents.retrieve` | Retrieve by ID |
| `payment_intents.update` | Update before confirmation |
| `payment_intents.confirm` | Confirm and get hosted pay URL |
| `payment_intents.complete` | Mark processing after return URL |
| `payment_intents.cancel` | Cancel |

### Subscriptions

| Tool | Description |
| --- | --- |
| `subscriptions.create` | Create a subscription |
| `subscriptions.retrieve` | Retrieve by ID |
| `subscriptions.update` | Update |
| `subscriptions.cancel` | Cancel |
| `subscriptions.resume` | Resume paused |
| `subscriptions.list` | List with filters |
| `subscriptions.list_payment_links` | List cycle payment links |

### Catalog

| Tool | Description |
| --- | --- |
| `products.list` / `create` / `update` / `delete` | Organization products |
| `prices.list` / `create` / `update` / `deactivate` | Organization prices |

Catalog tools need `organization_id` (argument or `--organization-id`).

### Rates and pay

| Tool | Description |
| --- | --- |
| `rates.get_fiat_quote` | Fiat → USDC quote |
| `rates.list_currencies` | Supported fiat currencies |
| `pay.get_by_slug` | Get pay details by slug |
| `pay.cancel_by_slug` | Cancel by pay slug |

## Security

API keys grant full access to the linked organization. Prefer test keys during development, and use `--tools` to expose only the operations your agent needs. Never commit live secrets into MCP config files that are checked into git — use environment variables or a secret store.

## Docs

- [MCP server guide](https://docs.orcarail.com/docs/integration/mcp/)
- [Node.js SDK](https://docs.orcarail.com/docs/integration/node-sdk/)
- [Build with AI](https://docs.orcarail.com/docs/building-with-ai/)

## License

MIT
