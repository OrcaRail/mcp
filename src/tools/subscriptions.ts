import { z } from 'zod';
import type { ToolDefinition } from './types';
import { requireClient } from './types';

const dateFilter = z
  .object({
    gt: z.string().optional(),
    gte: z.string().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
  })
  .optional();

const metadataSchema = z.record(z.unknown()).optional();
const withdrawalAddressesSchema = z.record(z.string()).optional();

export const subscriptionTools: ToolDefinition[] = [
  {
    name: 'subscriptions.create',
    description:
      'Create a subscription. Provide either price_id or amount+currency+token_id+network_id+interval.',
    requiresAuth: true,
    inputSchema: z.object({
      description: z.string(),
      collection_method: z.enum(['send_payment_link', 'auto_charge']).optional(),
      total_cycles: z.number().optional(),
      billing_cycle_anchor: z.string().optional(),
      cancel_at: z.string().optional(),
      cancel_at_period_end: z.boolean().optional(),
      days_until_due: z.number().optional(),
      trial_end: z.string().optional(),
      trial_period_days: z.number().optional(),
      payer_user_id: z.string().optional(),
      payer_email: z.string().optional(),
      withdrawal_addresses: withdrawalAddressesSchema,
      metadata: metadataSchema,
      return_url: z.string().optional(),
      cancel_url: z.string().optional(),
      price_id: z.string().optional(),
      interval: z.enum(['day', 'week', 'month', 'year']).optional(),
      interval_count: z.number().optional(),
      amount: z.string().optional(),
      currency: z.string().optional(),
      token_id: z.string().optional(),
      network_id: z.string().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      return client.subscriptions.create(
        args as unknown as Parameters<typeof client.subscriptions.create>[0]
      );
    },
  },
  {
    name: 'subscriptions.retrieve',
    description: 'Retrieve a subscription by ID',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Subscription ID'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).subscriptions.retrieve(String(args.id));
    },
  },
  {
    name: 'subscriptions.update',
    description: 'Update a subscription',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Subscription ID'),
      price_id: z.string().optional(),
      description: z.string().optional(),
      amount: z.string().optional(),
      currency: z.string().optional(),
      token_id: z.string().optional(),
      network_id: z.string().optional(),
      collection_method: z.enum(['send_payment_link', 'auto_charge']).optional(),
      cancel_at: z.string().nullable().optional(),
      cancel_at_period_end: z.boolean().optional(),
      days_until_due: z.number().optional(),
      trial_end: z.string().optional(),
      metadata: metadataSchema,
      withdrawal_addresses: withdrawalAddressesSchema,
      pause_collection: z
        .object({ behavior: z.enum(['void', 'keep_as_draft']) })
        .nullable()
        .optional(),
      return_url: z.string().nullable().optional(),
      cancel_url: z.string().nullable().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      const { id, ...params } = args;
      return client.subscriptions.update(
        String(id),
        params as unknown as Parameters<typeof client.subscriptions.update>[1]
      );
    },
  },
  {
    name: 'subscriptions.cancel',
    description:
      'Cancel a subscription. Cancels immediately, unless cancel_at_period_end was already set ' +
      'on it, in which case it ends at the current period end. To schedule a period-end ' +
      'cancellation, call subscriptions.update with cancel_at_period_end: true (or cancel_at for ' +
      'a specific date) instead of this tool. Optional cancellation_details records the reason ' +
      '(comment; feedback one of too_expensive, missing_features, switched_service, unused, other). ' +
      'Returns the subscription object.',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Subscription ID'),
      cancellation_details: z
        .object({
          comment: z.string().optional(),
          feedback: z
            .enum(['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'])
            .optional(),
        })
        .optional(),
    }),
    handler: async (args, ctx) => {
      const { id, cancellation_details } = args;
      return requireClient(ctx).subscriptions.cancel(
        String(id),
        cancellation_details
          ? { cancellation_details: cancellation_details as { comment?: string; feedback?: 'too_expensive' | 'missing_features' | 'switched_service' | 'unused' | 'other' } }
          : undefined
      );
    },
  },
  {
    name: 'subscriptions.resume',
    description: 'Resume a paused subscription',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Subscription ID'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).subscriptions.resume(String(args.id));
    },
  },
  {
    name: 'subscriptions.list',
    description: 'List subscriptions with optional filters and cursor pagination',
    requiresAuth: true,
    inputSchema: z.object({
      status: z
        .enum(['trialing', 'active', 'past_due', 'canceled', 'paused', 'completed'])
        .optional(),
      collection_method: z.enum(['send_payment_link', 'auto_charge']).optional(),
      current_period_start: dateFilter,
      current_period_end: dateFilter,
      created: dateFilter,
      limit: z.number().optional(),
      starting_after: z.string().optional(),
      ending_before: z.string().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      return client.subscriptions.list(
        args as unknown as Parameters<typeof client.subscriptions.list>[0]
      );
    },
  },
  {
    name: 'subscriptions.list_payment_links',
    description: 'List payment links (cycle invoices) for a subscription',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Subscription ID'),
      limit: z.number().optional(),
      starting_after: z.string().optional(),
      ending_before: z.string().optional(),
    }),
    handler: async (args, ctx) => {
      const client = requireClient(ctx);
      const { id, ...params } = args;
      return client.subscriptions.listPaymentLinks(
        String(id),
        params as unknown as Parameters<typeof client.subscriptions.listPaymentLinks>[1]
      );
    },
  },
];
