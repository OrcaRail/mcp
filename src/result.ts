import {
  OrcaRailAPIError,
  OrcaRailAuthenticationError,
  OrcaRailError,
} from '@orcarail/node';

export function jsonResult(data: unknown): {
  content: [{ type: 'text'; text: string }];
} {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(error: unknown): {
  content: [{ type: 'text'; text: string }];
  isError: true;
} {
  let message: string;
  if (error instanceof OrcaRailAuthenticationError) {
    message = `Authentication error: ${error.message}`;
  } else if (error instanceof OrcaRailAPIError) {
    const parts = [`API error (${error.statusCode})`];
    if (error.type) parts.push(`[${error.type}]`);
    parts.push(error.message);
    message = parts.join(': ');
  } else if (error instanceof OrcaRailError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
