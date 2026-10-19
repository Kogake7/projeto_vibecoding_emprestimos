"use client";

import { useEffect, useState } from "react";

type Health = {
  status: "ok" | "error";
  database: "connected" | "unavailable";
};

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (response) => ({
        response,
        body: (await response.json()) as Health,
      }))
      .then(({ response, body }) =>
        setHealth(
          response.ok ? body : { status: "error", database: "unavailable" },
        ),
      )
      .catch(() => setHealth({ status: "error", database: "unavailable" }));
  }, []);

  const ready = health?.status === "ok";
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <span className="text-lg font-bold tracking-tight">
          SUPORTE <span className="text-teal-700">TI</span>
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
        >
          {health === null
            ? "Verificando ambiente"
            : ready
              ? "Ambiente conectado"
              : "Banco indisponível"}
        </span>
      </header>
      <section className="py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-teal-700">
          Equipamentos internos
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
          O equipamento certo.
          <br />
          Na hora de trabalhar.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          Um lugar para consultar equipamentos, acompanhar empréstimos e
          registrar devoluções.
        </p>
      </section>
      <section
        aria-label="Regras de empréstimo"
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          [
            "Até 3 itens",
            "Cada colaborador pode manter até três empréstimos em aberto.",
          ],
          ["14 dias", "Prazo padrão para devolver o equipamento emprestado."],
          [
            "Devoluções em dia",
            "Regularize itens atrasados antes de solicitar outro empréstimo.",
          ],
        ].map(([title, description]) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{description}</p>
          </article>
        ))}
      </section>
      <aside className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-relaxed text-slate-600">
        O andar zero está ativo. Esta página consulta <code>/api/health</code>{" "}
        para provar a comunicação entre interface, servidor e banco antes da
        primeira feature.
      </aside>
    </main>
  );
}
