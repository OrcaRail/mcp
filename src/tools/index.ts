import type { McpConfig, ToolDefinition } from './types';
import { toolAllowed } from './types';
import { paymentIntentTools } from './payment-intents';
import { subscriptionTools } from './subscriptions';
import { productTools } from './products';
import { priceTools } from './prices';
import { rateTools } from './rates';
import { payTools } from './pay';

/** All tool definitions (before --tools filter). */
export const ALL_TOOLS: ToolDefinition[] = [
  ...paymentIntentTools,
  ...subscriptionTools,
  ...productTools,
  ...priceTools,
  ...rateTools,
  ...payTools,
];

export function listToolNames(): string[] {
  return ALL_TOOLS.map((t) => t.name);
}

export function selectTools(tools: McpConfig['tools']): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => toolAllowed(t.name, tools));
}

export type { McpConfig, ToolContext, ToolDefinition } from './types';
export { resolveOrganizationId, toolAllowed } from './types';
