// time.js: date and countdown helpers. Used by vote.js and admin.js.

// Example: "Nov 18, 2026, 5:30 PM" (in the viewer's local time)
export const fmtDate = d =>
  d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

// Example: 90061000 ms -> "1d 1h 1m 1s"
export function fmtLeft(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (d ? d + "d " : "") + (d || h ? h + "h " : "") + m + "m " + sec + "s";
}
