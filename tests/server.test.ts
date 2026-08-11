import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseConfig } from '../src/config';
import { createServer } from '../src/server';
import { ALL_TOOLS, listToolNames, selectTools } from '../src/tools';
import { DEFAULT_API_BASE, MISSING_CREDENTIALS_MESSAGE } from '../src/tools/types';
import { errorResult } from '../src/result';

describe('parseConfig', () => {
  afterEach(() => {
    delete process.env.ORCARAIL_API_KEY;
    delete process.env.ORCARAIL_API_SECRET;
    delete process.env.ORCARAIL_ORGANIZATION_ID;
  });

  it('parses flags and defaults tools to all', () => {
    const config = parseConfig([
      '--api-key=ak_test',
      '--api-secret=sk_test',
      '--organization-id=org_1',
    ]);
    expect(config.apiKey).toBe('ak_test');
    expect(config.apiSecret).toBe('sk_test');
    expect(config.organizationId).toBe('org_1');
    expect(config.tools).toBe('all');
  });

  it('parses --tools filter into a Set', () => {
    const config = parseConfig([
      '--api-key=ak_test',
      '--api-secret=sk_test',
      '--tools=payment_intents.create,subscriptions.list',
    ]);
    expect(config.tools).toBeInstanceOf(Set);
    expect([...(config.tools as Set<string>)]).toEqual([
      'payment_intents.create',
      'subscriptions.list',
    ]);
  });

  it('reads credentials from env', () => {
    process.env.ORCARAIL_API_KEY = 'ak_env';
    process.env.ORCARAIL_API_SECRET = 'sk_env';
    const config = parseConfig([]);
    expect(config.apiKey).toBe('ak_env');
    expect(config.apiSecret).toBe('sk_env');
  });

  it('allows missing credentials (public tools still work)', () => {
    const config = parseConfig([]);
    expect(config.apiKey).toBeUndefined();
    expect(config.apiSecret).toBeUndefined();
    expect(config.tools).toBe('all');
  });
});

describe('tool registration', () => {
  it('exposes the full SDK surface with --tools=all', () => {
    const names = listToolNames();
    expect(names).toContain('payment_intents.create');
    expect(names).toContain('payment_intents.retrieve');
    expect(names).toContain('payment_intents.update');
    expect(names).toContain('payment_intents.confirm');
    expect(names).toContain('payment_intents.complete');
    expect(names).toContain('payment_intents.cancel');
    expect(names).toContain('subscriptions.create');
    expect(names).toContain('subscriptions.retrieve');
    expect(names).toContain('subscriptions.update');
    expect(names).toContain('subscriptions.cancel');
    expect(names).toContain('subscriptions.resume');
    expect(names).toContain('subscriptions.list');
    expect(names).toContain('subscriptions.list_payment_links');
    expect(names).toContain('products.list');
    expect(names).toContain('products.create');
    expect(names).toContain('products.update');
    expect(names).toContain('products.delete');
    expect(names).toContain('prices.list');
    expect(names).toContain('prices.create');
    expect(names).toContain('prices.update');
    expect(names).toContain('prices.deactivate');
    expect(names).toContain('rates.get_fiat_quote');
    expect(names).toContain('rates.list_currencies');
    expect(names).toContain('pay.get_by_slug');
    expect(names).toContain('pay.cancel_by_slug');
    expect(names.length).toBe(ALL_TOOLS.length);
    expect(names.length).toBe(25);
  });

  it('marks rates and pay public; other tools require auth', () => {
    for (const tool of ALL_TOOLS) {
      const isPublic = tool.name.startsWith('rates.') || tool.name.startsWith('pay.');
      expect(tool.requiresAuth).toBe(!isPublic);
    }
  });

  it('filters tools via --tools', () => {
    const selected = selectTools(new Set(['payment_intents.create', 'rates.list_currencies']));
    expect(selected.map((t) => t.name).sort()).toEqual([
      'payment_intents.create',
      'rates.list_currencies',
    ]);
  });

  it('registers only filtered tools on the MCP server', () => {
    const { tools } = createServer({
      apiKey: 'ak_test',
      apiSecret: 'sk_test',
      tools: new Set(['payment_intents.retrieve']),
    });
    expect(tools.map((t) => t.name)).toEqual(['payment_intents.retrieve']);
  });

  it('starts without credentials and leaves client undefined', () => {
    const { tools, ctx } = createServer({ tools: 'all' });
    expect(ctx.client).toBeUndefined();
    expect(ctx.apiBase).toBe(DEFAULT_API_BASE);
    expect(tools.length).toBe(ALL_TOOLS.length);
  });
});

describe('tool call', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('payment_intents.retrieve hits the SDK with the right path', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: 'pi_123',
          object: 'payment_intent',
          status: 'requires_payment_method',
          amount: '10.00',
          currency: 'usd',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const { ctx, tools } = createServer({
      apiKey: 'ak_test',
      apiSecret: 'sk_test',
      apiBase: 'https://api.example.com/api/v1',
      tools: new Set(['payment_intents.retrieve']),
    });

    const tool = tools[0];
    expect(tool.name).toBe('payment_intents.retrieve');

    const result = await tool.handler({ id: 'pi_123' }, ctx);

    expect(result).toMatchObject({ id: 'pi_123', amount: '10.00' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/api\.example\.com\/api\/v1\/payment_intents\/pi_123\?/);
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Basic /);
  });

  it('private tool without credentials surfaces a clear missing-credentials error', async () => {
    const { tools, ctx } = createServer({
      tools: new Set(['payment_intents.retrieve']),
    });
    const tool = tools[0];
    expect(tool.requiresAuth).toBe(true);

    await expect(tool.handler({ id: 'pi_123' }, ctx)).rejects.toThrow(
      MISSING_CREDENTIALS_MESSAGE
    );

    // Server wrapper converts to MCP errorResult
    const wrapped = errorResult(new Error(MISSING_CREDENTIALS_MESSAGE));
    expect(wrapped.isError).toBe(true);
    expect(wrapped.content[0].text).toBe(MISSING_CREDENTIALS_MESSAGE);
  });

  it('public rates.list_currencies works without credentials and skips Authorization', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify([{ code: 'usd', name: 'US Dollar' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { ctx, tools } = createServer({
      apiBase: 'https://api.example.com/api/v1',
      tools: new Set(['rates.list_currencies']),
    });

    const tool = tools[0];
    expect(tool.requiresAuth).toBe(false);
    expect(ctx.client).toBeUndefined();

    const result = await tool.handler({}, ctx);

    expect(result).toEqual([{ code: 'usd', name: 'US Dollar' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/api\.example\.com\/api\/v1\/rates\/currencies\?/);
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
