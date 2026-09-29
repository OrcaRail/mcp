import type { McpConfig, McpMode, ToolDefinition } from './types';
import { toolAllowed } from './types';
import { paymentIntentTools } from './payment-intents';
import { subscriptionTools } from './subscriptions';
import { productTools } from './products';
import { priceTools } from './prices';
import { rateTools } from './rates';
import { payTools } from './pay';
import { accountTools } from './account';

/** All tool definitions (before --tools filter). */
export const ALL_TOOLS: ToolDefinition[] = [
  ...accountTools,
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

export function selectTools(
  tools: McpConfig['tools'],
  mode: McpMode = 'live'
): ToolDefinition[] {
  return ALL_TOOLS.filter(
    (t) => toolAllowed(t.name, tools) && (!t.sandboxOnly || mode === 'sandbox')
  );
}

export type { McpConfig, McpMode, ToolContext, ToolDefinition } from './types';
export {
  DEFAULT_API_BASE,
  MISSING_CREDENTIALS_MESSAGE,
  modeFromApiKey,
  requireClient,
  resolveOrganizationId,
  toolAllowed,
} from './types';
