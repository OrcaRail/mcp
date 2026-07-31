# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-31

### Added

- Initial release: local stdio MCP server wrapping `@orcarail/node`.
- 25 tools across payment intents (create, retrieve, update, confirm, complete, cancel), subscriptions (create, retrieve, update, cancel, resume, list, list_payment_links), catalog products and prices, exchange rates, and hosted pay slugs.
- `--tools` filter (Stripe-style), `--api-base` override, and `--organization-id` default for catalog tools.
- Credentials via `--api-key`/`--api-secret` flags or `ORCARAIL_API_KEY`/`ORCARAIL_API_SECRET` environment variables.
- Setup docs for Claude Code, Cursor, and Codex.
