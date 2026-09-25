# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-25

### Fixed

- `subscriptions.cancel` description now matches API behavior: it cancels at period end when `cancel_at_period_end` was already set, and points period-end requests to `subscriptions.update`.

## [1.1.0] - 2026-08-11

### Changed

- Credentials are optional at startup. Public tools (`rates.*`, `pay.*`) work without an API key/secret.
- Private tools without credentials return a clear tool error instead of refusing to start the server.
- Prefer `ORCARAIL_API_KEY` / `ORCARAIL_API_SECRET` (CLI flags remain supported overrides).

## [1.0.0] - 2026-07-31

### Added

- Initial release: local stdio MCP server wrapping `@orcarail/node`.
- 25 tools across payment intents (create, retrieve, update, confirm, complete, cancel), subscriptions (create, retrieve, update, cancel, resume, list, list_payment_links), catalog products and prices, exchange rates, and hosted pay slugs.
- `--tools` filter (Stripe-style), `--api-base` override, and `--organization-id` default for catalog tools.
- Credentials via `--api-key`/`--api-secret` flags or `ORCARAIL_API_KEY`/`ORCARAIL_API_SECRET` environment variables.
- Setup docs for Claude Code, Cursor, and Codex.
