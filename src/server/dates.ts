/** Server-side date helpers anchored to Europe/Stockholm (the app's timezone). */

/** Today's date as YYYY-MM-DD in Stockholm time. */
export function stockholmToday(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Monday-based week start (YYYY-MM-DD) for a given YYYY-MM-DD date string. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
