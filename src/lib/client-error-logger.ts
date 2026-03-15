export async function logClientError(source: string, message: string, detail?: string) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, message, detail }),
    });
  } catch { /* fire-and-forget */ }
}
