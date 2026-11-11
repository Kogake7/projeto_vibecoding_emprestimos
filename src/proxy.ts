import type { NextRequest } from "next/server";
import { refreshSession } from "./server/auth/proxy";

export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ttf)$).*)",
  ],
};
