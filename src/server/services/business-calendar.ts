export const CALENDAR_FIRST_YEAR = 2026;
export const CALENDAR_LAST_YEAR = 2030;
export const LOAN_TIME_ZONE = "America/Sao_Paulo";

const localFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LOAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type CivilDate = { year: number; month: number; day: number };
type CivilTime = CivilDate & {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function assertCovered(year: number) {
  if (year < CALENDAR_FIRST_YEAR || year > CALENDAR_LAST_YEAR) {
    throw new RangeError("Calendário de empréstimos precisa ser atualizado.");
  }
}

function localParts(date: Date): CivilTime {
  if (!Number.isFinite(date.getTime())) throw new RangeError("Data inválida.");
  const parts = Object.fromEntries(
    localFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    millisecond: date.getUTCMilliseconds(),
  };
}

function civilEpoch(parts: CivilTime) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
}

function fromLocalParts(parts: CivilTime): Date {
  const desired = civilEpoch(parts);
  let instant = desired;
  // Resolve the IANA zone offset rather than assuming a permanent UTC-03.
  for (let attempt = 0; attempt < 4; attempt++) {
    const correction = desired - civilEpoch(localParts(new Date(instant)));
    if (correction === 0) return new Date(instant);
    instant += correction;
  }
  throw new RangeError("Horário local não representável no calendário.");
}

function dateKey({ year, month, day }: CivilDate) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function easterSunday(year: number) {
  // Gregorian Meeus/Jones/Butcher computus; no runtime network/calendar API.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Rules and reviewed horizon are documented in spec 003/plan.md. */
export function nationalHolidayDates(year: number): ReadonlySet<string> {
  assertCovered(year);
  const fixed = [
    "01-01",
    "04-21",
    "05-01",
    "09-07",
    "10-12",
    "11-02",
    "11-15",
    "11-20",
    "12-25",
  ].map((monthDay) => `${year}-${monthDay}`);
  const goodFriday = easterSunday(year);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);
  return new Set([...fixed, goodFriday.toISOString().slice(0, 10)]);
}

function isBusinessDate(date: CivilDate) {
  assertCovered(date.year);
  const weekday = new Date(
    Date.UTC(date.year, date.month - 1, date.day),
  ).getUTCDay();
  return (
    weekday !== 0 &&
    weekday !== 6 &&
    !nationalHolidayDates(date.year).has(dateKey(date))
  );
}

export function isNationalBusinessDay(instant: Date) {
  return isBusinessDate(localParts(instant));
}

/** Inclusive business-day counting, preserving the issued local wall clock. */
export function addInclusiveBusinessDays(issuedAt: Date, days: number): Date {
  if (!Number.isInteger(days) || days < 1)
    throw new RangeError("Prazo inválido.");
  const original = localParts(issuedAt);
  assertCovered(original.year);
  const calendarDate = new Date(
    Date.UTC(original.year, original.month - 1, original.day),
  );
  let counted = 0;
  for (;;) {
    const candidate = {
      year: calendarDate.getUTCFullYear(),
      month: calendarDate.getUTCMonth() + 1,
      day: calendarDate.getUTCDate(),
    };
    if (isBusinessDate(candidate)) counted++;
    if (counted === days) return fromLocalParts({ ...original, ...candidate });
    calendarDate.setUTCDate(calendarDate.getUTCDate() + 1);
  }
}
