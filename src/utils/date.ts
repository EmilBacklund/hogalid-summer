function ymd(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Today's date in local time as YYYY-MM-DD. */
export function localToday(): string {
  return ymd(new Date());
}

/** ISO week start (Monday) for the given date (defaults to today) as YYYY-MM-DD. */
export function getWeekStart(dateStr?: string): string {
  const d = new Date(dateStr || localToday());
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}
