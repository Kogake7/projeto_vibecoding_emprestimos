const confirmationError =
  "Confirme o alvo com --apply e --confirm-target <projeto Supabase ou loopback local>.";

export function assertInitialDataTarget(
  options: { apply?: boolean; confirmTarget?: string },
  databaseUrl: string | undefined,
) {
  if (!options.apply || !options.confirmTarget || !databaseUrl)
    throw new Error(confirmationError);
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(confirmationError);
  }
  if (!["postgresql:", "postgres:"].includes(url.protocol))
    throw new Error(confirmationError);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  const direct = /^db\.([a-z]{20})\.supabase\.co$/.exec(url.hostname);
  const pooled =
    /\.pooler\.supabase\.com$/.test(url.hostname) &&
    /^postgres\.([a-z]{20})$/.exec(decodeURIComponent(url.username));
  const target = local ? url.hostname : direct?.[1] || (pooled && pooled[1]);
  if (!target || target !== options.confirmTarget)
    throw new Error(confirmationError);
  return target;
}
