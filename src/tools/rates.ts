import { z } from 'zod';
import type { ToolDefinition } from './types';
import { publicGet } from '../public-api';

export const rateTools: ToolDefinition[] = [
  {
    name: 'rates.get_fiat_quote',
    description: 'Get a fiat-to-USDC quote for an amount in a source currency',
    requiresAuth: false,
    inputSchema: z.object({
      amount: z.string().describe('Amount e.g. "100.00"'),
      currency: z.string().describe('Source currency code e.g. "eur"'),
    }),
    handler: async (args, ctx) => {
      if (ctx.client) {
        return ctx.client.rates.getFiatQuote({
          amount: String(args.amount),
          currency: String(args.currency),
        });
      }
      const amount = encodeURIComponent(String(args.amount));
      const currency = encodeURIComponent(String(args.currency));
      return publicGet(ctx.apiBase, `rates/fiat-quote?amount=${amount}&currency=${currency}`);
    },
  },
  {
    name: 'rates.list_currencies',
    description: 'List supported fiat currencies',
    requiresAuth: false,
    inputSchema: z.object({
      active: z.boolean().optional().describe('Only return active currencies'),
    }),
    handler: async (args, ctx) => {
      if (ctx.client) {
        return ctx.client.rates.getCurrencies(
          args.active === undefined ? undefined : { active: Boolean(args.active) }
        );
      }
      const query = args.active === true ? '?active=true' : '';
      return publicGet(ctx.apiBase, `rates/currencies${query}`);
    },
  },
];
