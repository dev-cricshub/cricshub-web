const XI = [
  { name: "N. Kadam", role: "WK", credits: "8.5", captain: false },
  { name: "A. Mehta", role: "BAT", credits: "9.5", captain: false },
  { name: "D. Kulkarni", role: "AR", credits: "9.0", captain: true },
  { name: "R. Pawar", role: "BOWL", credits: "8.0", captain: false },
  { name: "Y. Shinde", role: "BOWL", credits: "7.5", captain: false },
  { name: "V. Joshi", role: "BOWL", credits: "7.5", captain: false },
];

/** Fantasy XI as an app screen. The feature is not live yet. */
export default function FantasyPreview() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[300px] flex-col overflow-hidden rounded-[1.75rem] border border-line-strong bg-canvas shadow-frame">
      <div className="flex h-8 items-center justify-between px-5 pt-1 text-[10px] font-semibold text-fg">
        <span className="tabular-nums">12:17</span>
        <span className="flex items-center gap-1 text-[11px]" aria-hidden>
          <i className="ri-signal-wifi-fill" />
          <i className="ri-battery-2-line" />
        </span>
      </div>
      <div className="flex items-center gap-2 px-3.5 pb-2 pt-1">
        <i className="ri-arrow-left-line text-fg-muted" aria-hidden />
        <span className="flex-1 font-display text-[15px] font-bold uppercase tracking-wide">My XI</span>
        <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-canvas">Soon</span>
      </div>

      <div className="mx-3 rounded-card border border-line bg-surface px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">Credits</span>
          <span className="font-mono text-xs tabular-nums text-fg">50.0 / 50</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>
      </div>

      <ul className="mx-3 mt-2.5 flex-1 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {XI.map((p) => (
          <li key={p.name} className="flex items-center gap-2.5 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 font-display text-[11px] font-bold text-fg-muted">
              {p.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                <span className="truncate">{p.name}</span>
                {p.captain && (
                  <span className="rounded bg-gold/15 px-1 text-[9px] font-bold text-gold">C</span>
                )}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-fg-subtle">{p.role}</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-fg-muted">{p.credits}</span>
          </li>
        ))}
      </ul>

      <p className="px-4 py-3 text-center text-[11px] leading-snug text-fg-subtle">
        A sample side. Contests are not open yet.
      </p>
    </div>
  );
}
