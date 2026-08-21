import { headers } from "next/headers";

export const REQUEST_ID_HEADER = "x-request-id";

/** Reads the current request's correlation ID via next/headers — works from any server-side call in the request lifecycle (Route Handlers, Server Components, Server Actions) without threading the request object through every function signature. Set by middleware.ts on every request. */
export function getRequestId(): string | undefined {
  return headers().get(REQUEST_ID_HEADER) ?? undefined;
}
