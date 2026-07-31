import { z } from 'zod';
import type { ToolDefinition } from './types';

export const payTools: ToolDefinition[] = [
  {
    name: 'pay.get_by_slug',
    description: 'Get pay / payment intent details by hosted pay slug',
    inputSchema: z.object({
      slug: z.string().describe('Pay slug from the payment link URL'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.pay.get(String(args.slug));
    },
  },
  {
    name: 'pay.cancel_by_slug',
    description: 'Cancel a payment intent by hosted pay slug',
    inputSchema: z.object({
      slug: z.string().describe('Pay slug from the payment link URL'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.pay.cancel(String(args.slug));
    },
  },
];
