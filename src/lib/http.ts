export function jsonOk(data: unknown, init?: ResponseInit) {
  return Response.json({ ok: true, ...data }, { status: 200, ...init });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, message, details }, { status });
}

