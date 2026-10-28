import { cn } from "@/app/components/ui";
import { CheckItem, Section, SectionHead, tile } from "./primitives";

const ROWS = [
  { team: "Mumbai Strikers", p: 5, w: 4, pts: 8, nrr: "+1.24", q: true },
  { team: "Andheri Warriors", p: 5, w: 4, pts: 8, nrr: "+0.87", q: true },
  { team: "Thane Titans", p: 5, w: 2, pts: 4, nrr: "−0.31" },
  { team: "Borivali Blasters", p: 5, w: 0, pts: 0, nrr: "−1.76" },
];

const cell = "p-3";
const edge = "py-3 pl-[22px] pr-3";
const last = "py-3 pl-3 pr-[22px]";

export default function TournamentShowcase() {
  return (
    <Section className="flex flex-wrap-reverse items-center gap-14">
      <div data-anim="left" className={cn(tile, "min-w-0 flex-[1_1_480px] overflow-hidden rounded-3xl")}>
        <div className="flex justify-between border-b border-white/10 px-[22px] py-[18px] text-sm">
          <strong className="text-white">Points table · Group A</strong>
          <span className="text-[#C3CEE0]">Top 2 qualify</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[#C3CEE0]">
                <th className={cn(edge, "font-medium")}>Team</th>
                <th className={cn(cell, "font-medium")}>P</th>
                <th className={cn(cell, "font-medium")}>W</th>
                <th className={cn(cell, "font-medium")}>Pts</th>
                <th className={cn(last, "font-medium")}>NRR</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.team} className={r.q ? "bg-[rgba(90,169,240,0.12)] text-white" : "text-[#D6E2F5]"}>
                  <td className={cn(edge, r.q && "font-semibold")}>{r.team}</td>
                  <td className={cell}>{r.p}</td>
                  <td className={cell}>{r.w}</td>
                  <td className={cell}>{r.pts}</td>
                  <td className={last}>{r.nrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 px-[22px] pb-[22px] pt-4 text-[13px]">
          <div className="rounded-[14px] border border-white/10 bg-white/[0.06] p-3.5">
            <div className="font-bold text-[#5AA9F0]">FINAL · SUN 9:00 AM</div>
            <div className="font-semibold text-white">MUM vs AND</div>
            <div className="text-[#C3CEE0]">Oval Maidan</div>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.06] p-3.5">
            <div className="font-bold text-[#C3CEE0]">RESULT</div>
            <div className="font-semibold text-white">THA beat BOR</div>
            <div className="text-[#C3CEE0]">by 6 wickets</div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[22px]">
        <SectionHead
          kicker="Tournaments"
          title="Run your whole league from one place"
          lead="Create fixtures, track the points table with net run rate, and take it all the way through the knockouts. Every result updates the standings automatically."
          gap="gap-[22px]"
        />
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-base text-[#EEF3FB]" data-anim-stagger="80">
          {["League, groups and knockout stages", "Automatic points and NRR", "Player auctions to build teams"].map((t) => (
            <li key={t} data-anim="up">
              <CheckItem>{t}</CheckItem>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
