import { z } from 'zod';
import type { ToolDefinition } from './types';
import { publicGet, publicPost } from '../public-api';

export const payTools: ToolDefinition[] = [
  {
    name: 'pay.get_by_slug',
    description: 'Get pay / payment intent details by hosted pay slug',
    requiresAuth: false,
    inputSchema: z.object({
      slug: z.string().describe('Pay slug from the payment link URL'),
    }),
    handler: async (args, ctx) => {
      if (ctx.client) {
        return ctx.client.pay.get(String(args.slug));
      }
      return publicGet(ctx.apiBase, `pay/${encodeURIComponent(String(args.slug))}`);
    },
  },
  {
    name: 'pay.cancel_by_slug',
    description: 'Cancel a payment intent by hosted pay slug',
    requiresAuth: false,
    inputSchema: z.object({
      slug: z.string().describe('Pay slug from the payment link URL'),
    }),
    handler: async (args, ctx) => {
      if (ctx.client) {
        return ctx.client.pay.cancel(String(args.slug));
      }
      return publicPost(
        ctx.apiBase,
        `pay/${encodeURIComponent(String(args.slug))}/cancel`,
        {}
      );
    },
  },
];
