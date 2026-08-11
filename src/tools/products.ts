import { z } from 'zod';
import type { ToolDefinition } from './types';
import { requireClient, resolveOrganizationId } from './types';

const metadataSchema = z.record(z.unknown()).optional();

export const productTools: ToolDefinition[] = [
  {
    name: 'products.list',
    description: 'List catalog products for an organization',
    requiresAuth: true,
    inputSchema: z.object({
      organization_id: z
        .string()
        .optional()
        .describe('Organization ID (falls back to --organization-id)'),
    }),
    handler: async (args, ctx) => {
      const orgId = resolveOrganizationId(args as { organization_id?: string }, ctx);
      return requireClient(ctx).products.list(orgId);
    },
  },
  {
    name: 'products.create',
    description: 'Create a catalog product',
    requiresAuth: true,
    inputSchema: z.object({
      organization_id: z.string().optional(),
      name: z.string(),
      description: z.string().nullable().optional(),
      active: z.boolean().optional(),
      metadata: metadataSchema,
      default_price: z.string().optional(),
      image_file_ids: z.array(z.string()).optional(),
      marketing_features: z.array(z.object({ name: z.string() })).optional(),
      statement_descriptor: z.string().nullable().optional(),
      unit_label: z.string().nullable().optional(),
      shippable: z.boolean().nullable().optional(),
      url: z.string().nullable().optional(),
      livemode: z.boolean().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      const { organization_id, ...params } = args;
      const orgId = resolveOrganizationId({ organization_id: organization_id as string | undefined }, ctx);
      return client.products.create(
        orgId,
        params as unknown as Parameters<typeof client.products.create>[1]
      );
    },
  },
  {
    name: 'products.update',
    description: 'Update a catalog product',
    requiresAuth: true,
    inputSchema: z.object({
      organization_id: z.string().optional(),
      product_id: z.string().describe('Product ID'),
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      active: z.boolean().optional(),
      metadata: z.record(z.unknown()).nullable().optional(),
      default_price: z.string().nullable().optional(),
      image_file_ids: z.array(z.string()).nullable().optional(),
      marketing_features: z.array(z.object({ name: z.string() })).nullable().optional(),
      statement_descriptor: z.string().nullable().optional(),
      unit_label: z.string().nullable().optional(),
      shippable: z.boolean().nullable().optional(),
      url: z.string().nullable().optional(),
      livemode: z.boolean().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      const { organization_id, product_id, ...params } = args;
      const orgId = resolveOrganizationId({ organization_id: organization_id as string | undefined }, ctx);
      return client.products.update(
        orgId,
        String(product_id),
        params as unknown as Parameters<typeof client.products.update>[2]
      );
    },
  },
  {
    name: 'products.delete',
    description: 'Delete a catalog product',
    requiresAuth: true,
    inputSchema: z.object({
      organization_id: z.string().optional(),
      product_id: z.string().describe('Product ID'),
    }),
    handler: async (args, ctx) => {
      const orgId = resolveOrganizationId(
        { organization_id: args.organization_id as string | undefined },
        ctx
      );
      return requireClient(ctx).products.delete(orgId, String(args.product_id));
    },
  },
];
