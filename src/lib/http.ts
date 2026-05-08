export function jsonOk(data: unknown, init?: ResponseInit) {
  // Verifica se data é um objeto antes de fazer o spread
  const body = data && typeof data === 'object' && !Array.isArray(data) 
    ? { ok: true, ...data as Record<string, unknown> } 
    : { ok: true };
  
  return Response.json(body, { status: 200, ...init });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  const body: { ok: false; message: string; details?: unknown } = { ok: false, message };
  if (details !== undefined) {
    body.details = details;
  }
  return Response.json(body, { status });
}