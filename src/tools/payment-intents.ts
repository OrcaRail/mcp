import { z } from 'zod';
import type { ToolDefinition } from './types';

const metadataSchema = z.record(z.unknown()).nullable().optional();
const withdrawalAddressesSchema = z.record(z.string()).optional();

export const paymentIntentTools: ToolDefinition[] = [
  {
    name: 'payment_intents.create',
    description:
      'Create a Payment Intent. Provide either price_id (catalog) or amount+currency+tokenId+networkId.',
    inputSchema: z.object({
      return_url: z.string().describe('URL to redirect after payment'),
      cancel_url: z.string().nullable().optional(),
      description: z.string().optional(),
      metadata: metadataSchema,
      expires_at: z.string().nullable().optional(),
      payment_method_types: z.array(z.string()).optional(),
      withdrawal_addresses: withdrawalAddressesSchema,
      price_id: z.string().optional().describe('Catalog price UUID'),
      amount: z.string().optional().describe('Amount e.g. "100.00"'),
      currency: z.string().optional().describe('Currency code e.g. "usd"'),
      tokenId: z.string().optional().describe('Token UUID'),
      networkId: z.string().optional().describe('Network UUID'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.paymentIntents.create(
        args as unknown as Parameters<typeof ctx.client.paymentIntents.create>[0]
      );
    },
  },
  {
    name: 'payment_intents.retrieve',
    description: 'Retrieve a Payment Intent by ID',
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.paymentIntents.retrieve(String(args.id));
    },
  },
  {
    name: 'payment_intents.update',
    description: 'Update a Payment Intent before confirmation',
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
      price_id: z.string().optional(),
      amount: z.string().optional(),
      currency: z.string().optional(),
      payment_method_types: z.array(z.string()).optional(),
      tokenId: z.string().optional(),
      networkId: z.string().optional(),
      return_url: z.string().optional(),
      cancel_url: z.string().nullable().optional(),
      description: z.string().optional(),
      metadata: metadataSchema,
      expires_at: z.string().nullable().optional(),
      withdrawal_addresses: withdrawalAddressesSchema,
    }),
    handler: async (args, ctx) => {
      const { id, ...params } = args;
      return ctx.client.paymentIntents.update(
        String(id),
        params as unknown as Parameters<typeof ctx.client.paymentIntents.update>[1]
      );
    },
  },
  {
    name: 'payment_intents.confirm',
    description: 'Confirm a Payment Intent and get the hosted pay redirect URL',
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
      client_secret: z.string().describe('Client secret from create/retrieve'),
      return_url: z.string().describe('Return URL after payment'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.paymentIntents.confirm(String(args.id), {
        client_secret: String(args.client_secret),
        return_url: String(args.return_url),
      });
    },
  },
  {
    name: 'payment_intents.complete',
    description:
      'Mark a Payment Intent as processing after the customer returns to your success URL',
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.paymentIntents.complete(String(args.id));
    },
  },
  {
    name: 'payment_intents.cancel',
    description: 'Cancel a Payment Intent',
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return ctx.client.paymentIntents.cancel(String(args.id));
    },
  },
];
