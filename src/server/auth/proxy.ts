import "server-only";
import type { CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "../env";
import { createAuthClient, readVerifiedIdentity } from "./supabase";

export async function refreshSession(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  const protectedPage =
    request.nextUrl.pathname === "/app" ||
    request.nextUrl.pathname.startsWith("/app/");
  const updates = new Map<string, { value: string; options: CookieOptions }>();
  let authenticated = false;
  let unavailable = false;
  const hasCookie = request.cookies
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  if (hasCookie) {
    try {
      const env = getServerEnv();
      const client = createAuthClient(
        {
          getAll: () => request.cookies.getAll(),
          set: (name, value, options) => {
            request.cookies.set(name, value);
            updates.set(name, { value, options });
          },
        },
        {
          url: env.SUPABASE_URL,
          key: env.SUPABASE_ANON_KEY,
          secure: process.env.NODE_ENV === "production",
        },
      );
      authenticated = Boolean(await readVerifiedIdentity(client));
    } catch {
      unavailable = true;
    }
  }
  // O proxy verifica sessão; a Membership e os dados continuam protegidos por tRPC.
  const response =
    protectedPage && unavailable
      ? new NextResponse(
          "Não foi possível verificar seu acesso. Tente novamente.",
          { status: 503 },
        )
      : protectedPage && !authenticated
        ? NextResponse.redirect(new URL("/login", request.url))
        : NextResponse.next({ request: { headers: request.headers } });
  for (const [name, { value, options }] of updates)
    response.cookies.set(name, value, options);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Vary", "Cookie");
  return response;
}
