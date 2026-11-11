import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { createTestPostgres } from "./postgres";

async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Binding inválido da fixture.");
  return address.port;
}

/** Provedor de identidade controlado apenas nos testes; não integra o app. */
export async function createLoginFixture(
  options: { password?: string; build?: boolean; delayMs?: number } = {},
) {
  const database = await createTestPostgres();
  const support = await database.db.tenant.create({
    data: { slug: "suporte_ti", name: "Suporte TI" },
  });
  const other = await database.db.tenant.create({
    data: { slug: "outra_area", name: "Outra área" },
  });
  const password: string = options.password ?? randomUUID();
  const users = new Map<string, { id: string; email: string }>();
  const bearer = new Map<string, { id: string; email: string }>();
  const refresh = new Map<string, { id: string; email: string }>();
  let renewals = 0;
  let outage = false;
  let next: ChildProcess | undefined;
  const secret = randomUUID();
  function session(user: { id: string; email: string }) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        aud: "authenticated",
        role: "authenticated",
        iat: now,
        exp: now + 3600,
        jti: randomUUID(),
      }),
    ).toString("base64url");
    const input = `${header}.${payload}`;
    const access = `${input}.${createHmac("sha256", secret).update(input).digest("base64url")}`;
    const token = randomUUID();
    bearer.set(access, user);
    refresh.set(token, user);
    return {
      access_token: access,
      refresh_token: token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: now + 3600,
      user: {
        ...user,
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
      },
    };
  }
  const auth = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    const send = (status: number, body: unknown) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    };
    if (outage) {
      send(503, { message: "fixture-provider-unavailable" });
      return;
    }
    if (
      request.url?.startsWith("/auth/v1/token") &&
      request.method === "POST"
    ) {
      if (options.delayMs) await delay(options.delayMs);
      let body = "";
      for await (const chunk of request) body += chunk;
      const credentials = JSON.parse(body);
      const grant = new URL(request.url, "http://127.0.0.1").searchParams.get(
        "grant_type",
      );
      const user =
        grant === "refresh_token"
          ? refresh.get(credentials.refresh_token)
          : credentials.password === password
            ? users.get(credentials.email)
            : undefined;
      if (!user) {
        send(400, {
          code: "invalid_credentials",
          msg: "fixture-invalid-credentials",
        });
        return;
      }
      if (grant === "refresh_token") {
        refresh.delete(credentials.refresh_token);
        renewals++;
      }
      send(200, session(user));
      return;
    }
    if (request.url === "/auth/v1/user") {
      const user = bearer.get(
        request.headers.authorization?.replace(/^Bearer /, "") ?? "",
      );
      send(
        user ? 200 : 401,
        user
          ? {
              ...user,
              aud: "authenticated",
              role: "authenticated",
              app_metadata: {},
              user_metadata: {},
            }
          : { code: "bad_jwt", msg: "fixture-invalid-session" },
      );
      return;
    }
    send(404, { message: "fixture-not-found" });
  });
  async function dispose() {
    try {
      if (next?.pid && next.exitCode === null && next.signalCode === null) {
        const stopped = new Promise<void>((resolve) =>
          next!.once("exit", () => resolve()),
        );
        next.kill("SIGTERM");
        await stopped;
      }
    } finally {
      auth.closeAllConnections();
      await new Promise<void>((resolve) => auth.close(() => resolve()));
      await database.dispose();
    }
  }
  try {
    const authPort = await listen(auth);
    const reservation = createServer();
    const port = await listen(reservation);
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    const origin = `http://127.0.0.1:${port}`;
    const environment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: database.url,
      DIRECT_URL: database.url,
      SUPABASE_URL: `http://127.0.0.1:${authPort}`,
      SUPABASE_ANON_KEY: "fixture-public-key",
      NEXT_TELEMETRY_DISABLED: "1",
    };
    // Verifica o comportamento de cache e Secure do runtime de produção,
    // que é diferente dos headers impostos por next dev.
    if (options.build !== false)
      execFileSync(
        process.execPath,
        [path.resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
        {
          env: environment,
          stdio: "pipe",
          timeout: 120_000,
          windowsHide: true,
        },
      );
    next = spawn(
      process.execPath,
      [
        path.resolve("node_modules/next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        env: environment,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    // Não repassar saída bruta: erros de SDK/ORM podem carregar dados de sessão.
    next.stdout?.resume();
    next.stderr?.resume();
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (next.exitCode !== null) break;
      try {
        const response = await fetch(`${origin}/login`);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* inicializando */
      }
      await delay(500);
    }
    if (!ready) throw new Error("Next local não iniciou a fixture.");
    return {
      ...database,
      origin,
      password,
      dispose,
      renewals: () => renewals,
      setOutage: (value: boolean) => {
        outage = value;
      },
      async addUser(
        email: string,
        role?: "ADMIN" | "COLLABORATOR",
        otherRole?: "ADMIN" | "COLLABORATOR",
      ) {
        const user = { id: randomUUID(), email };
        users.set(email, user);
        if (role)
          await database.db.membership.create({
            data: { userId: user.id, tenantId: support.id, role },
          });
        if (otherRole)
          await database.db.membership.create({
            data: { userId: user.id, tenantId: other.id, role: otherRole },
          });
        return user;
      },
    };
  } catch {
    await dispose();
    throw new Error("Falha ao preparar fixture local de login.");
  }
}
