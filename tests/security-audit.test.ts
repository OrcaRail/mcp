import OrcaRail from '@orcarail/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { parseConfig } from '../src/config';
import { toolAnnotations } from '../src/server';
import { ALL_TOOLS } from '../src/tools';
import { DEFAULT_API_BASE } from '../src/tools/types';

/**
 * plan/security 2026-11-04 (MCP-1): ids were plain `z.string()` and went into URL paths
 * unencoded. Under prompt injection, `payment_intents.retrieve` with
 * `id: "../subscriptions?limit=100"` reads endpoints outside the --tools allowlist, and a write
 * tool can be pointed at another write endpoint.
 */
const PATH_ID_FIELD = /^(id|slug|organization_id|price_id|product_id)$/;

const idFields = ALL_TOOLS.flatMap((tool) => {
  const shape = (tool.inputSchema as z.AnyZodObject).shape ?? {};
  return Object.keys(shape)
    .filter((key) => PATH_ID_FIELD.test(key))
    .map((key) => [`${tool.name}.${key}`, shape[key] as z.ZodTypeAny] as const);
});

describe('MCP tool id inputs (MCP-1)', () => {
  it('covers the tools that take resource ids', () => {
    expect(idFields.length).toBeGreaterThan(10);
  });

  it.fails.each(idFields)('MCP-1: %s rejects path-changing values', (_name, field) => {
    for (const unsafe of ['../subscriptions?limit=100', '..', 'a/b', 'x#y', '']) {
      expect(field.safeParse(unsafe).success, JSON.stringify(unsafe)).toBe(false);
    }
  });

  it.each(idFields)('%s accepts a normal id', (_name, field) => {
    expect(field.safeParse('00000000-0000-4000-8000-000000000001').success).toBe(true);
  });
});

/**
 * plan/security 2026-11-04 (MCP-2): MCP's destructiveHint means "may change or remove existing
 * state". Updating, resuming and simulating change existing resources (and can move money);
 * only additive `.create` tools may be non-destructive.
 */
describe('MCP tool annotations (MCP-2)', () => {
  it.fails.each([
    'payment_intents.update',
    'subscriptions.update',
    'subscriptions.resume',
    'prices.update',
    'products.update',
    'payment_intents.simulate',
  ])('MCP-2: %s is marked destructive', (name) => {
    expect(toolAnnotations(name).destructiveHint).toBe(true);
  });

  it.each(['payment_intents.create', 'subscriptions.create', 'prices.create'])(
    '%s stays non-destructive (additive)',
    (name) => {
      expect(toolAnnotations(name).destructiveHint).toBe(false);
    }
  );
});

/**
 * plan/security 2026-11-04 (MCP-3): the API key and secret go out as HTTP Basic auth, so a
 * plain-http api base sends them in clear text; the simulate call had no timeout.
 */
describe('MCP transport (MCP-3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.fails('MCP-3: refuses a plain-http api base outside localhost', () => {
    expect(() =>
      parseConfig([
        '--api-key=ak_test_1',
        '--api-secret=sk_1',
        '--api-base=http://api.example.com/api/v1',
      ])
    ).toThrow();
  });

  it('still allows http://localhost for local development', () => {
    expect(() =>
      parseConfig([
        '--api-key=ak_test_1',
        '--api-secret=sk_1',
        '--api-base=http://localhost:3000/api/v1',
      ])
    ).not.toThrow();
  });

  it.fails('MCP-3: payment_intents.simulate sets a request timeout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'pi_1' }),
      headers: new Headers(),
      status: 200,
      text: () => Promise.resolve('{"id":"pi_1"}'),
    });
    vi.stubGlobal('fetch', fetchMock);
    const tool = ALL_TOOLS.find((t) => t.name === 'payment_intents.simulate')!;
    const config = parseConfig(['--api-key=ak_test_1', '--api-secret=sk_1']);
    const apiBase = config.apiBase ?? DEFAULT_API_BASE;
    const client = new OrcaRail(config.apiKey!, config.apiSecret!, { baseUrl: apiBase });

    await tool.handler({ id: 'pi_1' }, {
      client,
      apiBase,
      mode: 'sandbox',
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    } as never);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/payment_intents/pi_1/simulate'),
      expect.objectContaining({ signal: expect.anything() })
    );
  });
});
