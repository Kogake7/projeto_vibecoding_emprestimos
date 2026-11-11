import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";

// Alvo fixo local: DOCKER_HOST/DOCKER_CONTEXT não podem redirecionar estes testes.
const dockerHost =
  process.platform === "win32"
    ? "npipe:////./pipe/docker_engine"
    : "unix:///var/run/docker.sock";

function docker(args: string[], environment = process.env) {
  const localEnvironment = { ...environment };
  delete localEnvironment.DOCKER_CONTEXT;
  delete localEnvironment.DOCKER_HOST;
  delete localEnvironment.DOCKER_TLS_VERIFY;
  delete localEnvironment.DOCKER_CERT_PATH;
  return execFileSync("docker", ["--host", dockerHost, ...args], {
    encoding: "utf8",
    timeout: 15_000,
    env: localEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

/** Um container novo por suíte; nenhum banco/volume já existente é utilizado. */
export async function createTestPostgres() {
  const name = `empresti-access-test-${randomUUID()}`;
  const password = randomUUID();
  let started = false;
  let db: PrismaClient | undefined;

  async function dispose() {
    try {
      await db?.$disconnect();
    } finally {
      if (started) {
        docker(["stop", "--time", "1", name]);
        started = false;
      }
    }
  }

  try {
    docker(
      [
        "run",
        "--detach",
        "--rm",
        "--pull=never",
        "--name",
        name,
        "--label",
        "empresti.test=access",
        "--publish",
        "127.0.0.1::5432",
        "--env",
        "POSTGRES_DB=access_test",
        "--env",
        "POSTGRES_PASSWORD",
        "postgres:17-alpine",
      ],
      { ...process.env, POSTGRES_PASSWORD: password },
    );
    started = true;

    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        docker([
          "exec",
          name,
          "pg_isready",
          "-U",
          "postgres",
          "-d",
          "access_test",
        ]);
        ready = true;
        break;
      } catch {
        await delay(500);
      }
    }
    if (!ready) throw new Error("PostgreSQL local não ficou pronto.");

    const binding = docker(["port", name, "5432/tcp"]);
    const match = /^127\.0\.0\.1:(\d+)$/.exec(binding);
    if (!match)
      throw new Error("Binding local inesperado para o banco de teste.");
    const url = `postgresql://postgres:${password}@127.0.0.1:${match[1]}/access_test?schema=public`;

    // Ambos os destinos são explícitos; nenhum valor de .env controla o banco.
    try {
      execFileSync(
        process.execPath,
        [
          path.resolve("node_modules/prisma/build/index.js"),
          "migrate",
          "deploy",
        ],
        {
          env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 30_000,
          windowsHide: true,
        },
      );
    } catch {
      throw new Error(
        "Falha ao aplicar migrations existentes no PostgreSQL de teste.",
      );
    }

    db = new PrismaClient({ datasourceUrl: url });
    await db.$connect();
    return { db, url, dispose };
  } catch (error) {
    await dispose();
    if (
      error instanceof Error &&
      error.message.startsWith("Falha ao aplicar")
    ) {
      throw error;
    }
    throw new Error(
      "PostgreSQL local indisponível: inicie Docker e disponibilize postgres:17-alpine. Nenhum banco remoto é aceito.",
    );
  }
}
