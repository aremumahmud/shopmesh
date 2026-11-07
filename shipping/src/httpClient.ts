// Shared outbound HTTP client.
//
// Every cross-service call goes through here, and the base URL is always read
// from a named *_URL environment variable. Constructing a client with the env
// var name keeps each call site clearly tied to the base URL it depends on.
//
// shipping makes no internal calls, but keeps the shared client for parity.

export interface HttpClient {
  get<T = any>(path: string): Promise<T>;
  post<T = any>(path: string, body: unknown): Promise<T>;
}

export function httpClient(baseUrlEnvVar: string): HttpClient {
  const baseURL = process.env[baseUrlEnvVar];
  if (!baseURL) {
    throw new Error(`Missing base URL env var: ${baseUrlEnvVar}`);
  }

  const request = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${method} ${baseUrlEnvVar}${path} -> ${res.status} ${text}`);
    }
    return res.json();
  };

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  };
}
