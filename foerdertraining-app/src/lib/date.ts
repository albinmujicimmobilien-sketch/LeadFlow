const tz = undefined; // Gerätezeitzone verwenden

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: tz,
  }).format(new Date(iso));
}

export function formatShortDay(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat('de-DE', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date),
  };
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(
    new Date(iso),
  );
}

export function formatTimeRange(iso: string, durationMinutes: number): string {
  const end = new Date(new Date(iso).getTime() + durationMinutes * 60_000).toISOString();
  return `${formatTime(iso)} – ${formatTime(end)} Uhr`;
}

export function formatDateTime(iso: string): string {
  return `${formatDay(iso)}, ${formatTime(iso)} Uhr`;
}

/** Lokaler Tagesschlüssel YYYY-MM-DD zum Gruppieren */
export function dayKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Baut aus Tag (lokal) und "HH:MM" einen ISO-Zeitstempel */
export function combineDayAndTime(day: Date, time: string): string | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return null;
  const d = new Date(day);
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d.toISOString();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
