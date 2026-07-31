import { z } from 'zod';
import type { ToolDefinition } from './types';

export const rateTools: ToolDefinition[] = [
  {
    name: 'rates.get_fiat_quote',
    description: 'Get a fiat-to-USDC quote for an amount in a source currency',
    inputSchema: z.object({
      amount: z.string().describe('Amount e.g. "100.00"'),
      currency: z.string().describe('Source currency code e.g. "eur"'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.rates.getFiatQuote({
        amount: String(args.amount),
        currency: String(args.currency),
      });
    },
  },
  {
    name: 'rates.list_currencies',
    description: 'List supported fiat currencies',
    inputSchema: z.object({
      active: z.boolean().optional().describe('Only return active currencies'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.rates.getCurrencies(
        args.active === undefined ? undefined : { active: Boolean(args.active) }
      );
    },
  },
];
