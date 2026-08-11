const DEFAULT_TIMEOUT_MS = 30_000;

function buildUrl(apiBase: string, path: string): string {
  const base = apiBase.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}

async function requestJson<T>(
  method: string,
  apiBase: string,
  path: string,
  body?: unknown
): Promise<T> {
  let url = buildUrl(apiBase, path);
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_=${Date.now()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'orcarail-mcp/public',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const options: RequestInit & { cache?: 'no-store' } = {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    };

    const response = await fetch(url, options);

    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        typeof responseData === 'object' && responseData !== null && 'message' in responseData
          ? String((responseData as { message: unknown }).message)
          : `API request failed with status ${response.status}`;
      const errorType =
        typeof responseData === 'object' && responseData !== null && 'error' in responseData
          ? String((responseData as { error: unknown }).error)
          : undefined;
      const parts = [`API error (${response.status})`];
      if (errorType) parts.push(`[${errorType}]`);
      parts.push(errorMessage);
      throw new Error(parts.join(': '));
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${DEFAULT_TIMEOUT_MS}ms`);
      }
      throw error;
    }
    throw new Error('An unknown error occurred');
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Unauthenticated GET against the OrcaRail API (public routes). */
export function publicGet<T>(apiBase: string, path: string): Promise<T> {
  return requestJson<T>('GET', apiBase, path);
}

/** Unauthenticated POST against the OrcaRail API (public routes). */
export function publicPost<T>(apiBase: string, path: string, body: unknown = {}): Promise<T> {
  return requestJson<T>('POST', apiBase, path, body);
}
