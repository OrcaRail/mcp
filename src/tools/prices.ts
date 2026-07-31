import { z } from 'zod';
import type { ToolDefinition } from './types';
import { resolveOrganizationId } from './types';

const metadataSchema = z.record(z.unknown()).optional();

export const priceTools: ToolDefinition[] = [
  {
    name: 'prices.list',
    description: 'List catalog prices for an organization',
    inputSchema: z.object({
      organization_id: z.string().optional(),
      active: z.boolean().optional(),
      recurring: z.boolean().optional(),
      limit: z.number().optional(),
    }),
    handler: async (args, ctx) => {
      const { organization_id, ...params } = args;
      const orgId = resolveOrganizationId({ organization_id: organization_id as string | undefined }, ctx);
      return ctx.client.prices.list(
        orgId,
        params as unknown as Parameters<typeof ctx.client.prices.list>[1]
      );
    },
  },
  {
    name: 'prices.create',
    description: 'Create a catalog price (one-time or recurring)',
    inputSchema: z.object({
      organization_id: z.string().optional(),
      product: z.string().optional().describe('Existing product ID'),
      product_data: z
        .object({
          name: z.string(),
          active: z.boolean().optional(),
          metadata: metadataSchema,
          statement_descriptor: z.string().nullable().optional(),
          unit_label: z.string().nullable().optional(),
        })
        .optional(),
      unit_amount_decimal: z.string().describe('Amount e.g. "29.00"'),
      currency: z.string(),
      token_id: z.string(),
      network_id: z.string(),
      recurring: z
        .object({
          interval: z.enum(['day', 'week', 'month', 'year']),
          interval_count: z.number().optional(),
          trial_period_days: z.number().optional(),
        })
        .nullable()
        .optional(),
      lookup_key: z.string().optional(),
      transfer_lookup_key: z.boolean().optional(),
      nickname: z.string().nullable().optional(),
      active: z.boolean().optional(),
      metadata: metadataSchema,
    }),
    handler: async (args, ctx) => {
      const { organization_id, ...params } = args;
      const orgId = resolveOrganizationId({ organization_id: organization_id as string | undefined }, ctx);
      return ctx.client.prices.create(
        orgId,
        params as unknown as Parameters<typeof ctx.client.prices.create>[1]
      );
    },
  },
  {
    name: 'prices.update',
    description: 'Update a catalog price',
    inputSchema: z.object({
      organization_id: z.string().optional(),
      price_id: z.string().describe('Price ID'),
      product: z.string().optional(),
      nickname: z.string().nullable().optional(),
      unit_amount_decimal: z.string().optional(),
      currency: z.string().optional(),
      token_id: z.string().optional(),
      network_id: z.string().optional(),
      recurring: z
        .object({
          interval: z.enum(['day', 'week', 'month', 'year']).nullable().optional(),
          interval_count: z.number().nullable().optional(),
          trial_period_days: z.number().nullable().optional(),
        })
        .nullable()
        .optional(),
      lookup_key: z.string().nullable().optional(),
      transfer_lookup_key: z.boolean().optional(),
      active: z.boolean().optional(),
      metadata: z.record(z.unknown()).nullable().optional(),
    }),
    handler: async (args, ctx) => {
      const { organization_id, price_id, ...params } = args;
      const orgId = resolveOrganizationId({ organization_id: organization_id as string | undefined }, ctx);
      return ctx.client.prices.update(
        orgId,
        String(price_id),
        params as unknown as Parameters<typeof ctx.client.prices.update>[2]
      );
    },
  },
  {
    name: 'prices.deactivate',
    description: 'Deactivate a catalog price',
    inputSchema: z.object({
      organization_id: z.string().optional(),
      price_id: z.string().describe('Price ID'),
    }),
    handler: async (args, ctx) => {
      const orgId = resolveOrganizationId(
        { organization_id: args.organization_id as string | undefined },
        ctx
      );
      return ctx.client.prices.deactivate(orgId, String(args.price_id));
    },
  },
];
