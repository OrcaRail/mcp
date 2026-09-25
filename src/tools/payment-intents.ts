import { z } from 'zod';
import type { ToolDefinition } from './types';
import { requireClient } from './types';

const metadataSchema = z.record(z.unknown()).nullable().optional();
const withdrawalAddressesSchema = z.record(z.string()).optional();

export const paymentIntentTools: ToolDefinition[] = [
  {
    name: 'payment_intents.create',
    description:
      'Create a Payment Intent. Provide either price_id (a catalog price) or all of ' +
      'amount + currency + tokenId + networkId. tokenId and networkId are UUIDs from the ' +
      'OrcaRail Networks and Tokens reference; no tool in this server lists them, so prefer ' +
      'price_id when the user has a catalog price. Returns the intent, including client_secret ' +
      '(needed by payment_intents.confirm) and the hosted payment link.',
    requiresAuth: true,
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
      const client = requireClient(ctx);
      return client.paymentIntents.create(
        args as unknown as Parameters<typeof client.paymentIntents.create>[0]
      );
    },
  },
  {
    name: 'payment_intents.retrieve',
    description: 'Retrieve a Payment Intent by ID',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).paymentIntents.retrieve(String(args.id));
    },
  },
  {
    name: 'payment_intents.update',
    description: 'Update a Payment Intent before confirmation',
    requiresAuth: true,
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
      const client = requireClient(ctx);
      const { id, ...params } = args;
      return client.paymentIntents.update(
        String(id),
        params as unknown as Parameters<typeof client.paymentIntents.update>[1]
      );
    },
  },
  {
    name: 'payment_intents.confirm',
    description: 'Confirm a Payment Intent and get the hosted pay redirect URL',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
      client_secret: z.string().describe('Client secret from create/retrieve'),
      return_url: z.string().describe('Return URL after payment'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).paymentIntents.confirm(String(args.id), {
        client_secret: String(args.client_secret),
        return_url: String(args.return_url),
      });
    },
  },
  {
    name: 'payment_intents.complete',
    description:
      'Mark a Payment Intent as processing after the customer returns to your success URL',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).paymentIntents.complete(String(args.id));
    },
  },
  {
    name: 'payment_intents.cancel',
    description:
      'Cancel a Payment Intent by ID. Returns the cancelled intent. Check its status with ' +
      'payment_intents.retrieve first when the customer may already have paid. To cancel from a ' +
      'hosted pay slug without credentials, use pay.cancel_by_slug.',
    requiresAuth: true,
    inputSchema: z.object({
      id: z.string().describe('Payment Intent ID'),
    }),
    handler: async (args, ctx) => {
      return requireClient(ctx).paymentIntents.cancel(String(args.id));
    },
  },
  {
    name: 'payment_intents.simulate',
    description:
      'SANDBOX ONLY. Completes a payment intent without an on-chain transfer (no wallet or ' +
      'faucet needed) and fires the usual webhooks, so the whole flow can be tested. ' +
      'Simulated payments are never withdrawable. The API rejects live organizations.',
    requiresAuth: true,
    sandboxOnly: true,
    inputSchema: z.object({
      id: z.string().describe('Payment intent id'),
    }),
    handler: async (args, ctx) => {
      requireClient(ctx);
      const res = await fetch(
        `${ctx.apiBase.replace(/\/$/, '')}/payment_intents/${encodeURIComponent(String(args.id))}/simulate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${ctx.apiKey}:${ctx.apiSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          `Simulate failed (${res.status}): ${JSON.stringify(body)}`
        );
      }
      return body;
    },
  },
];
