import "server-only";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext, type RequestContext } from "./context";
import { appRouter } from "./root";

export function createTRPCHandler(
  contextFactory: () => Promise<RequestContext> = createContext,
) {
  return async (request: Request) => {
    if (request.method === "POST") {
      // Protege também o login contra troca de sessão por uma origem externa.
      const target = new URL(request.url);
      // Next normaliza loopback para localhost internamente. Host mantém a
      // autoridade recebida pelo navegador; não confiar em X-Forwarded-Host.
      const authority = request.headers.get("Host") ?? target.host;
      const sameOrigin =
        request.headers.get("Origin") === `${target.protocol}//${authority}`;
      const json =
        request.headers
          .get("Content-Type")
          ?.split(";")[0]
          .trim()
          .toLowerCase() === "application/json";
      if (!sameOrigin || !json) {
        return Response.json(
          {
            error: {
              json: {
                message: "Solicitação não permitida.",
                code: -32003,
                data: { code: "FORBIDDEN", httpStatus: 403 },
              },
            },
          },
          {
            status: 403,
            headers: {
              "Cache-Control": "private, no-store, max-age=0",
              Vary: "Cookie, Origin",
            },
          },
        );
      }
    }
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: contextFactory,
    });
    // Respostas de identidade nunca podem ser compartilhadas por cache/CDN.
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    const vary = response.headers.get("Vary")?.toLowerCase().split(/,\s*/);
    if (!vary?.includes("cookie")) response.headers.append("Vary", "Cookie");
    return response;
  };
}
