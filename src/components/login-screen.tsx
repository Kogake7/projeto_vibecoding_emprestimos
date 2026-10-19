"use client";

import { useEffect, useState } from "react";

const glyphs = {
  package: "\ue390",
  arrow: "\ue06c",
  envelope: "\ue214",
  lock: "\ue2fe",
  shield: "\ue40c",
} as const;

function Icon({
  name,
  className = "text-[17px]",
}: {
  name: keyof typeof glyphs;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center font-[family-name:var(--font-phosphor)] font-normal leading-none ${className}`}
    >
      {glyphs[name]}
    </span>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-[12px]">
      <span
        className={`grid place-items-center rounded-[8px] border border-[var(--accent-700)] bg-[var(--accent-900)] text-[var(--accent-300)] ${compact ? "size-[30px]" : "size-[34px]"}`}
      >
        <Icon name="package" className="text-[21px]" />
      </span>
      <span className="text-[16px] font-semibold tracking-[0.02em]">
        Empres<span className="text-[var(--accent-400)]">TI</span>
      </span>
    </div>
  );
}

export default function LoginScreen() {
  const [connection, setConnection] = useState<
    "checking" | "connected" | "unavailable"
  >("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!controller.signal.aborted) {
          setConnection(
            response.ok && body.status === "ok" && body.database === "connected"
              ? "connected"
              : "unavailable",
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnection("unavailable");
      });

    return () => controller.abort();
  }, []);

  return (
    <main
      data-screen-label="01 Login"
      className="grid min-h-svh bg-[var(--color-bg)] lg:grid-cols-[minmax(380px,560px)_minmax(0,1fr)]"
    >
      <section
        aria-label="Sobre o EmpresTI"
        className="hidden flex-col justify-between gap-[56px] border-r border-[var(--border-soft)] bg-[linear-gradient(160deg,#001449_0%,#00102F_60%,#080C1A_100%)] p-[56px] lg:flex"
      >
        <Brand />

        <div className="flex flex-col gap-[32px] py-[40px]">
          <div className="flex flex-col gap-[18px]">
            <p className="text-[11px] tracking-[0.12em] text-[var(--accent-400)] uppercase">
              Equipamentos internos
            </p>
            <h2 className="max-w-[20ch] text-[34px] leading-[1.15] font-semibold tracking-[-0.01em]">
              O equipamento certo.
              <br />
              Na hora de trabalhar.
            </h2>
            <p className="max-w-[38ch] text-[14px] leading-[1.8] text-[#93A0C6]">
              Consulte equipamentos, acompanhe seus empréstimos e organize as
              devoluções em um só lugar.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="h-px w-full bg-[linear-gradient(to_right,#3C5DBE,rgba(60,93,190,0))]"
          />

          <dl className="flex gap-[40px]">
            <div className="flex flex-col gap-[6px]">
              <dt className="order-2 text-[12px] text-[#93A0C6]">
                itens por pessoa
              </dt>
              <dd className="text-[24px] leading-none font-semibold">3</dd>
            </div>
            <div className="flex flex-col gap-[6px]">
              <dt className="order-2 text-[12px] text-[#93A0C6]">
                dias de prazo
              </dt>
              <dd className="text-[24px] leading-none font-semibold">14</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between gap-[16px] text-[11px] text-[var(--text-dim)]">
          <span>Operações · v1</span>
          <span>Uso interno</span>
        </div>
      </section>

      <section
        aria-labelledby="login-title"
        className="flex min-h-svh flex-col gap-[32px] px-[26px] py-[32px] sm:px-[56px] sm:py-[40px] lg:p-[56px]"
      >
        <div className="lg:hidden">
          <Brand compact />
        </div>

        <div className="flex flex-1 items-center justify-center py-[32px]">
          <div className="flex w-full max-w-[372px] flex-col gap-[32px]">
            <div className="flex flex-col gap-[10px]">
              <p className="text-[11px] tracking-[0.1em] text-[var(--text-dim)] uppercase">
                Acesso ao sistema
              </p>
              <h1
                id="login-title"
                className="text-[22px] leading-[1.3] font-semibold tracking-[-0.01em] max-lg:text-[24px]"
              >
                Entrar
              </h1>
              <p className="text-[13px] leading-[1.8] text-[var(--text-muted)]">
                Use o e-mail e a senha fornecidos por Operações.
              </p>
            </div>

            <form
              className="flex flex-col gap-[22px]"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="flex flex-col gap-[18px]">
                <label className="flex flex-col gap-[8px]">
                  <span className="text-[12px] text-[var(--text-label)]">
                    E-mail
                  </span>
                  <span className="relative flex items-center">
                    <span className="pointer-events-none absolute left-[12px] flex text-[var(--text-dim)]">
                      <Icon name="envelope" />
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@empresa.com.br"
                      className="h-[42px] w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-sunken)] pr-[12px] pl-[40px] text-[14px] placeholder:text-[var(--text-faint)]"
                    />
                  </span>
                </label>

                <label className="flex flex-col gap-[8px]">
                  <span className="text-[12px] text-[var(--text-label)]">
                    Senha
                  </span>
                  <span className="relative flex items-center">
                    <span className="pointer-events-none absolute left-[12px] flex text-[var(--text-dim)]">
                      <Icon name="lock" />
                    </span>
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Sua senha"
                      className="h-[42px] w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-sunken)] pr-[12px] pl-[40px] text-[14px] placeholder:text-[var(--text-faint)]"
                    />
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-[10px]">
                <button
                  type="submit"
                  disabled
                  aria-describedby="login-status"
                  className="flex h-[44px] w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-[8px] border border-[var(--accent-500)] bg-transparent px-[20px] text-[13px] font-semibold text-[var(--accent-300)] opacity-45"
                >
                  Entrar
                  <Icon name="arrow" className="text-[16px]" />
                </button>
                <p
                  id="login-status"
                  className="text-[11.5px] leading-[1.7] text-[var(--text-dim)]"
                >
                  O acesso ainda não está habilitado.
                </p>
              </div>
            </form>

            <div className="flex flex-col gap-[22px]">
              <div
                aria-hidden="true"
                className="h-px w-full bg-[linear-gradient(to_right,rgba(230,234,246,0),#222C4A_48px,#222C4A_calc(100%_-_48px),rgba(230,234,246,0))]"
              />
              <div className="flex items-start justify-center gap-[8px] text-[12px] leading-[1.8] text-[var(--text-dim)]">
                <Icon name="shield" className="pt-[3px] text-[15px]" />
                <p className="max-w-[34ch] text-center">
                  Acesso exclusivo por convite.
                  <br />
                  Precisa de ajuda? Fale com Operações.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-[12px] text-[11px] text-[var(--text-dim)]">
          <span>EmpresTI · Equipamentos internos</span>
          <p role="status" className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className={`size-[5px] rounded-full ${connection === "connected" ? "bg-[var(--status-available)]" : connection === "unavailable" ? "bg-[var(--status-maintenance)]" : "bg-[var(--text-faint)]"}`}
            />
            {connection === "checking"
              ? "Verificando conexão"
              : connection === "connected"
                ? "Sistema conectado"
                : "Conexão indisponível"}
          </p>
        </footer>
      </section>
    </main>
  );
}
