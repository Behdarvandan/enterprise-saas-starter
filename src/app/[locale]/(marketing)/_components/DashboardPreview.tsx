import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

const ROWS = [
  { name: "Amelia Ross", service: "Fitting consultation", time: "9:00 AM", tone: "success" as const },
  { name: "Derek Chan", service: "Onboarding call", time: "10:30 AM", tone: "warn" as const },
  { name: "Priya Nair", service: "Equipment install", time: "1:15 PM", tone: "success" as const },
];

const toneClass = {
  success: "bg-status-success/10 text-status-success",
  warn: "bg-status-warn/10 text-status-warn",
};

/** Static, realistically-seeded preview of the bookings table — no live data. */
export default function DashboardPreview() {
  return (
    <div className="rounded-interactive border border-subtle bg-surface p-4 shadow-2xl shadow-black/40 sm:p-5">
      <div className="flex items-center justify-between border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-violet-dim" />
          <span className="text-sm font-semibold text-ink-primary">Today&apos;s bookings</span>
        </div>
        <span className="font-mono text-xs text-ink-muted">org_4f2a91</span>
      </div>

      <ul className="mt-3 space-y-2">
        {ROWS.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between rounded-control border border-subtle bg-surface-raised px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-ink-primary">{row.name}</p>
              <p className="text-xs text-ink-muted">{row.service}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-xs text-ink-muted">
                <Clock3 size={12} />
                {row.time}
              </span>
              <span
                className={`flex items-center gap-1 rounded-control px-2 py-0.5 text-xs font-semibold ${toneClass[row.tone]}`}
              >
                <CheckCircle2 size={12} />
                {row.tone === "success" ? "confirmed" : "pending"}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between rounded-control bg-status-error/10 px-3 py-2 text-xs text-status-error">
        <span>Conflict blocked: 1:15 PM overlaps an existing booking</span>
      </div>
    </div>
  );
}
