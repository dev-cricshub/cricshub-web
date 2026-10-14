import { cn } from "@/app/components/ui";
import { CheckIcon } from "./icons";
import { Kicker } from "./primitives";

const ROWS = [
  { team: "Mumbai Strikers", p: 5, w: 4, pts: 8, nrr: "+1.24", top: true },
  { team: "Andheri Warriors", p: 5, w: 4, pts: 8, nrr: "+0.87", top: true },
  { team: "Thane Titans", p: 5, w: 2, pts: 4, nrr: "−0.31" },
  { team: "Borivali Blasters", p: 5, w: 0, pts: 0, nrr: "−1.76" },
];

const row = "grid grid-cols-[2fr_repeat(4,minmax(0,1fr))]";

export default function TournamentShowcase() {
  return (
    <div className="flex flex-wrap-reverse items-center gap-14">
      <div aria-hidden className="relative min-w-0 flex-[1_1_460px]">
        <div
          className="absolute -inset-10 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.22), rgba(74,158,224,0) 100%)" }}
        />
        <div className="relative grid grid-cols-2 gap-3.5">
          <div className="col-span-2 flex flex-col gap-2 rounded-[22px] border border-line-strong bg-surface p-5 shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-extrabold">Points table · Group A</span>
              <span className="text-[11px] font-bold text-accent-soft">Top 2 qualify</span>
            </div>
            <div className={cn(row, "px-2.5 text-[11px] font-bold text-fg-subtle")}>
              <span>Team</span>
              <span>P</span>
              <span>W</span>
              <span>Pts</span>
              <span>NRR</span>
            </div>
            {ROWS.map((r) => (
              <div key={r.team} className={cn(row, "rounded-[10px] p-2.5 text-[13px]", r.top ? "bg-raised" : "text-[#C9D3E2]")}>
                <span className={r.top ? "font-extrabold" : "font-semibold"}>{r.team}</span>
                <span>{r.p}</span>
                <span>{r.w}</span>
                <span className={r.top ? "font-extrabold" : undefined}>{r.pts}</span>
                <span>{r.nrr}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-surface p-4">
            <span className="text-[10px] font-extrabold tracking-[1px] text-accent-soft">FINAL · SUN 9:00 AM</span>
            <span className="text-[15px] font-extrabold">MUM vs AND</span>
            <span className="text-[11px] text-fg-muted">Oval Maidan</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-surface p-4">
            <span className="text-[10px] font-extrabold tracking-[1px] text-fg-muted">RESULT</span>
            <span className="text-[15px] font-extrabold">THA beat BOR</span>
            <span className="text-[11px] text-fg-muted">by 6 wickets</span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
        <Kicker>Tournaments</Kicker>
        <h2 className="m-0 font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-extrabold uppercase leading-none">
          Run your whole league from one place
        </h2>
        <p className="m-0 text-[17px] leading-relaxed text-fg-lead">
          Create fixtures, track the points table with net run rate, and take it all the way through the knockouts. Every
          result updates the standings automatically.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] text-[#DCE3EE]">
          {["League, groups and knockout stages", "Automatic points and NRR", "Player auctions to build teams"].map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckIcon size={20} strokeWidth={2.6} className="shrink-0 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
