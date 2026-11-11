"use client";

import Link from "next/link";
import { api } from "../trpc/react";

export default function AccessScreen() {
  const access = api.auth.me.useQuery(undefined, { staleTime: 0 });
  return (
    <main className="min-h-svh bg-slate-50 px-6 py-12 font-[Arial,Helvetica,sans-serif] text-slate-950 [color-scheme:light]">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-bold tracking-wide text-teal-700">
          SUPORTE TI
        </p>
        <h1 className="mt-4 text-2xl font-semibold">Seu acesso</h1>
        {access.isPending ? (
          <p role="status" className="mt-4">
            Verificando seu acesso…
          </p>
        ) : access.isError ? (
          <div role="alert" className="mt-4 space-y-4">
            <p>
              {access.error.data?.code === "FORBIDDEN"
                ? "Acesso não permitido. Fale com Operações."
                : "Não foi possível verificar seu acesso."}
            </p>
            <button
              type="button"
              onClick={() => void access.refetch()}
              className="rounded-xl border border-teal-700 px-4 py-3 text-teal-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p role="status">Acesso autorizado.</p>
            <p>
              Perfil:{" "}
              <strong>
                {access.data.role === "ADMIN" ? "Administrador" : "Colaborador"}
              </strong>
            </p>
            <p className="text-slate-600">
              {access.data.role === "ADMIN"
                ? "Seu perfil permite funções de colaborador e administração."
                : "Seu perfil permite funções de colaborador."}
            </p>
          </div>
        )}
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl px-1 py-2 text-teal-700 underline"
        >
          Voltar à entrada
        </Link>
      </section>
    </main>
  );
}
