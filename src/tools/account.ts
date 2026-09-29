import { z } from 'zod';
import type { ToolDefinition } from './types';

export const accountTools: ToolDefinition[] = [
  {
    name: 'account.get_mode',
    description:
      'Returns whether this server is connected to a LIVE organization (real funds, ' +
      'ak_live_ key), a SANDBOX organization (testnets only, no real funds, ak_test_ key) ' +
      'or no key (public tools only). Check this before creating, confirming, completing ' +
      'or cancelling anything.',
    requiresAuth: false,
    inputSchema: z.object({}),
    handler: async (_args, ctx) => ({
      mode: ctx.mode,
      livemode: ctx.mode === 'live',
      organizationId: ctx.organizationId ?? null,
      keyPrefix: ctx.apiKey ? ctx.apiKey.slice(0, 12) : null,
      apiBase: ctx.apiBase,
    }),
  },
];
