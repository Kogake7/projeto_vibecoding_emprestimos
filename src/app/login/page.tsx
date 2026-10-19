import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | Suporte TI",
  description: "Acesse o sistema interno de empréstimo de equipamentos",
};

const inputClassName =
  "h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 place-items-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-950/15"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <rect x="3.5" y="5" width="17" height="11" rx="2" />
        <path d="M8 20h8M12 16v4" />
        <path d="m9.5 10.5 1.6 1.6 3.5-3.6" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-400/15 text-teal-200">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      >
        <path d="m5 10 3 3 7-7" />
      </svg>
    </span>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0b3b3c] px-12 py-10 text-white lg:flex lg:flex-col xl:px-20 xl:py-14">
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-40 size-[32rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 size-80 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-44 -left-44 size-[30rem] rounded-full bg-teal-300/5"
        />

        <div className="relative flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-base font-bold tracking-[0.16em]">SUPORTE TI</p>
            <p className="text-xs text-teal-100/60">Equipamentos internos</p>
          </div>
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            Tudo em um só lugar
          </p>
          <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
            Equipamentos certos,
            <br />
            sempre ao seu alcance.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-teal-50/70">
            Consulte a disponibilidade, acompanhe seus empréstimos e organize
            suas devoluções com tranquilidade.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-teal-50/85">
            {[
              "Catálogo atualizado em um só lugar",
              "Acompanhamento simples dos seus itens",
              "Prazos e disponibilidade sempre visíveis",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckIcon />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-teal-50/45">
          Uso interno · Instituto Germinare
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center gap-3 lg:hidden">
          <BrandMark />
          <div>
            <p className="text-sm font-bold tracking-[0.14em] text-slate-900">
              SUPORTE TI
            </p>
            <p className="text-xs text-slate-500">Equipamentos internos</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <div className="mb-9">
            <p className="mb-3 text-sm font-semibold text-teal-700">
              Bem-vindo de volta
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Entre na sua conta
            </h2>
            <p className="mt-3 leading-7 text-slate-500">
              Use as credenciais fornecidas pela equipe de Operações.
            </p>
          </div>

          <div aria-label="Dados de acesso" className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                E-mail
              </label>
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu.email@empresa.com"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Senha
              </label>
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className={inputClassName}
                />
              </div>
            </div>

            <button
              type="button"
              aria-describedby="login-status"
              disabled
              className="mt-2 h-13 w-full cursor-not-allowed rounded-xl bg-teal-700 px-5 text-sm font-bold text-white opacity-70 shadow-lg shadow-teal-900/15"
            >
              Entrar
            </button>
            <p id="login-status" className="sr-only">
              O envio das credenciais será habilitado com a integração segura de
              autenticação.
            </p>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-500">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="mt-0.5 size-5 shrink-0 text-teal-700"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p>
              Acesso exclusivo para pessoas convidadas. Em caso de dúvidas,
              procure a equipe de Operações.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Seus dados de acesso são protegidos e não são compartilhados.
        </p>
      </section>
    </main>
  );
}
