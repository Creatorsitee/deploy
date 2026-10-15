/**
 * Safely parses JSON from a fetch Response object.
 * Handles cases where the response might be a non-JSON error message (like "Rate exceeded.")
 */
export async function safeJson<T = any>(res: Response | null | undefined): Promise<T | null> {
  if (!res) return null;
  
  try {
    const contentType = res.headers?.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('Rate exceeded')) {
        throw new Error('System is currently busy (Rate Limit Exceeded). Please try again in a few moments.');
      }
      return null;
    }

    const text = await res.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch (err: any) {
    if (err?.message?.includes('Rate Limit Exceeded')) {
      throw err;
    }
    return null;
  }
}
