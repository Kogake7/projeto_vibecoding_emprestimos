"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RouterOutputs } from "../server/api/root";
import { getEquipmentImage } from "../shared/equipment-images";
import { api } from "../trpc/react";

type Equipment = RouterOutputs["equipment"]["list"]["items"][number];
type OpenLoan = RouterOutputs["loans"]["mine"]["items"][number];

const actionClass =
  "inline-flex min-h-13 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600";
const secondaryClass =
  "inline-flex min-h-13 items-center justify-center rounded-xl border border-teal-700 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-500";
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function EquipmentPhoto({ equipment }: { equipment: Equipment }) {
  const image = getEquipmentImage(equipment.assetTag);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <figure className="border-b border-slate-200">
      <div className="flex aspect-4/3 items-center justify-center bg-slate-100">
        {image && failedSource !== image.src ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={800}
            height={600}
            unoptimized
            className="h-full w-full object-contain"
            onError={() => setFailedSource(image.src)}
          />
        ) : (
          <div className="px-6 text-center text-sm text-slate-500">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-3 h-12 w-12"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="30" height="23" rx="3" />
              <path d="M5 37h38M19 37l1-5h8l1 5" />
            </svg>
            <p>{image ? "Foto indisponível" : "Foto pendente"}</p>
          </div>
        )}
      </div>
      {image ? (
        <figcaption className="px-5 py-2 text-xs text-slate-600">
          Foto de{" "}
          <a
            href={image.photographerUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {image.photographer}
          </a>{" "}
          ·{" "}
          <a
            href={image.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Pixabay
          </a>{" "}
          ·{" "}
          <a
            href={image.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Licença
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}

export function EquipmentCard({
  equipment,
  disabledReason,
  isSending,
  onRequest,
}: {
  equipment: Equipment;
  disabledReason?: string;
  isSending: boolean;
  onRequest: () => void;
}) {
  const available = equipment.status === "AVAILABLE";
  const statusLabel = available
    ? "Disponível"
    : equipment.status === "MAINTENANCE"
      ? "Em manutenção"
      : "Emprestado";
  const reason = !available ? statusLabel : disabledReason;
  const reasonId = `reason-${equipment.id}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <EquipmentPhoto equipment={equipment} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold tracking-wide text-slate-500">
            {equipment.assetTag}
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${available ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
          >
            {statusLabel}
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">
          {equipment.name}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{equipment.category}</p>
        <div className="mt-auto pt-5">
          <button
            type="button"
            className={`${actionClass} w-full`}
            disabled={Boolean(reason) || isSending}
            aria-describedby={reason ? reasonId : undefined}
            aria-label={`Solicitar ${equipment.name} — ${equipment.assetTag}`}
            onClick={onRequest}
          >
            {isSending ? "Solicitando…" : "Solicitar empréstimo"}
          </button>
          {reason ? (
            <p id={reasonId} className="mt-2 text-sm text-slate-600">
              {reason}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OpenLoanCard({ loan, now }: { loan: OpenLoan; now: number }) {
  const overdue = loan.dueAt.getTime() < now;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-slate-500">
            {loan.equipment.assetTag}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {loan.equipment.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {loan.equipment.category}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${overdue ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}
        >
          {overdue ? "Em atraso" : "Em andamento"}
        </span>
      </div>
      <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Solicitado em</dt>
          <dd className="mt-1 font-semibold">
            <time dateTime={loan.issuedAt.toISOString()}>
              {dateFormat.format(loan.issuedAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Devolver até</dt>
          <dd className="mt-1 font-semibold">
            <time dateTime={loan.dueAt.toISOString()}>
              {dateFormat.format(loan.dueAt)}
            </time>
          </dd>
        </div>
      </dl>
      {overdue ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Procure Operações para regularizar a devolução. Novos empréstimos
          ficam bloqueados enquanto houver atraso.
        </p>
      ) : null}
    </article>
  );
}

function QueryError({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"
    >
      <p>{children}</p>
      <button
        type="button"
        className={`${secondaryClass} mt-4 bg-white`}
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </div>
  );
}

export default function EquipmentWorkspace({
  view = "catalog",
}: {
  view?: "catalog" | "loans";
}) {
  const access = api.auth.me.useQuery(undefined, { staleTime: 0 });
  const utils = api.useUtils();
  const equipment = api.equipment.list.useInfiniteQuery(
    { limit: 12 },
    {
      enabled: access.isSuccess && view === "catalog",
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      staleTime: 0,
    },
  );
  const mine = api.loans.mine.useInfiniteQuery(
    { limit: 50 },
    {
      enabled: access.isSuccess,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      staleTime: 0,
    },
  );
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const request = api.loans.request.useMutation({
    onSuccess: (loan) => {
      setNotice({
        kind: "success",
        text: `Empréstimo confirmado. Devolva até ${dateFormat.format(loan.dueAt)} (horário de São Paulo).`,
      });
    },
    onError: (error) => {
      setNotice({
        kind: "error",
        text:
          error.data?.code === "CONFLICT"
            ? error.message
            : error.data?.code === "UNAUTHORIZED"
              ? "Sua sessão expirou. Volte à entrada para entrar novamente."
              : "Não foi possível confirmar o pedido. Atualize as listas antes de tentar novamente.",
      });
    },
    onSettled: async () => {
      await Promise.allSettled([
        utils.equipment.list.invalidate(),
        utils.loans.mine.invalidate(),
      ]);
    },
  });
  const items = equipment.data?.pages.flatMap((page) => page.items) ?? [];
  const loans = mine.data?.pages.flatMap((page) => page.items) ?? [];
  const overdue = loans.some((loan) => loan.dueAt.getTime() < now);
  const disabledReason = request.isPending
    ? "Aguarde a conclusão do pedido em andamento."
    : mine.isPending || mine.isFetching
      ? "Consultando seus empréstimos…"
      : mine.isError
        ? "Atualize seus empréstimos para solicitar um equipamento."
        : overdue
          ? "Você tem um empréstimo em atraso. Procure Operações."
          : loans.length >= 3
            ? "Você atingiu o limite de três empréstimos em aberto."
            : undefined;

  async function submit(equipmentId: string) {
    if (inFlight.current || disabledReason) return;
    inFlight.current = true;
    setNotice(null);
    try {
      await request.mutateAsync({ equipmentId });
    } catch {
      // A mutation mostra uma mensagem controlada e consulta novamente as listas.
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="min-h-svh bg-slate-50 font-[Arial,Helvetica,sans-serif] text-slate-950 [color-scheme:light]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:rounded-xl focus:bg-white focus:p-4 focus:text-teal-700"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <Link href="/app" className="rounded-xl py-1" prefetch={false}>
            <span className="block text-lg font-bold tracking-tight text-teal-700">
              SUPORTE TI
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Equipamentos internos
            </span>
          </Link>
          <nav
            aria-label="Navegação principal"
            className="flex flex-wrap gap-2"
          >
            {[
              { href: "/app", label: "Catálogo", active: view === "catalog" },
              {
                href: "/app/meus-emprestimos",
                label: "Meus empréstimos",
                active: view === "loans",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={link.active ? "page" : undefined}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${link.active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main
        id="conteudo"
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12"
      >
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-teal-700">Seu espaço</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {view === "catalog"
                ? "Catálogo de equipamentos"
                : "Meus empréstimos"}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
              {view === "catalog"
                ? "Encontre o equipamento de que precisa e solicite seu empréstimo."
                : "Acompanhe os equipamentos com você e seus prazos de devolução."}
            </p>
          </div>
          {access.data ? (
            <div className="text-sm text-slate-600">
              <p className="text-teal-700">Acesso autorizado.</p>
              <p className="mt-1">
                Perfil:{" "}
                <strong className="font-semibold text-slate-950">
                  {access.data.role === "ADMIN"
                    ? "Administrador"
                    : "Colaborador"}
                </strong>
              </p>
            </div>
          ) : null}
        </div>
        {access.isPending ? (
          <p
            role="status"
            className="rounded-2xl border border-slate-200 bg-white p-8"
          >
            Verificando seu acesso…
          </p>
        ) : access.isError ? (
          <QueryError onRetry={() => void access.refetch()}>
            {access.error.data?.code === "FORBIDDEN"
              ? "Acesso não permitido. Fale com Operações."
              : "Não foi possível verificar seu acesso."}
          </QueryError>
        ) : (
          <>
            <aside
              aria-label="Regras de empréstimo"
              className="mb-8 grid gap-4 rounded-2xl border border-teal-100 bg-teal-50 p-6 sm:grid-cols-3"
            >
              <div>
                <p className="text-sm text-teal-800">Com você</p>
                <p className="mt-1 font-semibold text-teal-950">
                  {mine.isPending
                    ? "Consultando…"
                    : mine.isError
                      ? "Consulta indisponível"
                      : `${loans.length}${mine.hasNextPage ? "+" : ""} de 3 equipamentos`}
                </p>
              </div>
              <div>
                <p className="text-sm text-teal-800">Prazo de devolução</p>
                <p className="mt-1 font-semibold text-teal-950">
                  14 dias úteis
                </p>
              </div>
              <p className="text-sm leading-relaxed text-teal-900">
                Fins de semana e feriados nacionais não contam. Datas no horário
                de São Paulo.
              </p>
            </aside>
            {notice ? (
              <div
                role={notice.kind === "error" ? "alert" : "status"}
                className={`mb-6 rounded-xl border p-5 ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}
              >
                <p>{notice.text}</p>
                {notice.kind === "success" ? (
                  <Link
                    href="/app/meus-emprestimos"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    Ver meus empréstimos
                  </Link>
                ) : null}
              </div>
            ) : null}
            {view === "catalog" ? (
              <>
                {mine.isError ? (
                  <div className="mb-6">
                    <QueryError onRetry={() => void mine.refetch()}>
                      Não foi possível consultar seus empréstimos. Atualize a
                      consulta para solicitar outro equipamento.
                    </QueryError>
                  </div>
                ) : overdue ? (
                  <p
                    role="status"
                    className="mb-6 rounded-xl bg-amber-100 p-5 text-amber-950"
                  >
                    Há um empréstimo em atraso. Procure Operações para
                    regularizar a devolução antes de solicitar outro
                    equipamento.
                  </p>
                ) : null}
                {equipment.isPending ? (
                  <p
                    role="status"
                    className="rounded-2xl border border-slate-200 bg-white p-8"
                  >
                    Carregando equipamentos…
                  </p>
                ) : equipment.isError ? (
                  <QueryError onRetry={() => void equipment.refetch()}>
                    Não foi possível carregar o catálogo.
                  </QueryError>
                ) : items.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8">
                    <h2 className="text-xl font-semibold">
                      Catálogo ainda vazio
                    </h2>
                    <p className="mt-2 text-slate-600">
                      Não há equipamentos cadastrados nesta área. Fale com
                      Operações.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <EquipmentCard
                        key={item.id}
                        equipment={item}
                        disabledReason={disabledReason}
                        isSending={
                          request.isPending &&
                          request.variables?.equipmentId === item.id
                        }
                        onRequest={() => void submit(item.id)}
                      />
                    ))}
                  </div>
                )}
                {equipment.hasNextPage ? (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={equipment.isFetchingNextPage}
                      onClick={() => void equipment.fetchNextPage()}
                    >
                      {equipment.isFetchingNextPage
                        ? "Carregando…"
                        : "Carregar mais equipamentos"}
                    </button>
                  </div>
                ) : null}
                <p className="mt-8 text-sm text-slate-600">
                  Fotos:{" "}
                  <a
                    href="https://pixabay.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-teal-700 underline underline-offset-4"
                  >
                    Pixabay
                  </a>
                </p>
              </>
            ) : mine.isPending ? (
              <p
                role="status"
                className="rounded-2xl border border-slate-200 bg-white p-8"
              >
                Carregando seus empréstimos…
              </p>
            ) : mine.isError ? (
              <QueryError onRetry={() => void mine.refetch()}>
                Não foi possível carregar seus empréstimos.
              </QueryError>
            ) : loans.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12">
                <h2 className="text-xl font-semibold">
                  Você não tem empréstimos em aberto
                </h2>
                <p className="mt-3 max-w-lg leading-relaxed text-slate-600">
                  Quando solicitar um equipamento, ele aparecerá aqui com o
                  prazo de devolução.
                </p>
                <Link href="/app" className={`${actionClass} mt-6`}>
                  Explorar o catálogo
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  {loans.map((loan) => (
                    <OpenLoanCard key={loan.id} loan={loan} now={now} />
                  ))}
                </div>
                {mine.hasNextPage ? (
                  <button
                    type="button"
                    className={`${secondaryClass} mt-6`}
                    disabled={mine.isFetchingNextPage}
                    onClick={() => void mine.fetchNextPage()}
                  >
                    {mine.isFetchingNextPage
                      ? "Carregando…"
                      : "Carregar mais empréstimos"}
                  </button>
                ) : null}
              </>
            )}
          </>
        )}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <Link
            href="/login"
            className="rounded-xl py-2 text-teal-700 underline underline-offset-4"
          >
            Voltar à entrada
          </Link>
        </footer>
      </main>
    </div>
  );
}
