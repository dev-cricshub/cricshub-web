"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/app/components/ui";
import { EXPLORE_HREF } from "@/lib/site";
import { ArrowRightIcon } from "./icons";
import { Kicker, ghostCta, gradientCta } from "./primitives";

type ThemeId = "Glass" | "Classic" | "Light";

// Mirrors the three free overlay themes in Stream Studio.
const OVERLAY_THEMES: Record<ThemeId, { bg: string; border: string; text: string; sub: string; teamBg: string; teamText: string }> = {
  Glass: { bg: "rgba(10,14,23,0.72)", border: "1px solid rgba(127,179,232,0.3)", text: "#FFFFFF", sub: "#B4BFD0", teamBg: "#2F6DB8", teamText: "#FFFFFF" },
  Classic: { bg: "#0D1A33", border: "1px solid #2F6DB8", text: "#FFFFFF", sub: "#A8CCF2", teamBg: "#5FA8E8", teamText: "#0A0E17" },
  Light: { bg: "rgba(245,248,252,0.95)", border: "1px solid #DCE3EE", text: "#0A0E17", sub: "#4A5568", teamBg: "#2E3A8C", teamText: "#FFFFFF" },
};

const SAMPLE_OVERLAY_URL = "cricshub.com/overlay/your-match-id";

const FACTS = [
  { value: "Free", label: "score overlay for every match admin", accent: true },
  { value: "Every ball", label: "synced from the scorer's app" },
  { value: "OBS · vMix", label: "added as a browser source" },
  { value: "₹49", label: "premium bundles, per match" },
];

const STEPS = [
  { title: "Score in the app", body: "Start the match on CricsHub and score as usual." },
  { title: "Add the overlay", body: "Paste the link from Stream Studio into OBS or vMix as a browser source." },
  { title: "Go live on YouTube", body: "Start your stream. The score updates on its own, ball by ball." },
];

export default function StreamingShowcase() {
  return (
    <div id="streaming" className="flex scroll-mt-24 flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-7">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-4">
          <Kicker className="flex items-center gap-2 self-start">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_#5FA8E8]" />
            Live streaming
          </Kicker>
          <h2 className="m-0 font-display text-[clamp(2.6rem,5.2vw,4.2rem)] font-extrabold uppercase leading-[0.95]">
            Your match.
            <br />
            On air, <span className="text-accent">like the pros.</span>
          </h2>
          <p className="m-0 max-w-[560px] text-[17px] leading-relaxed text-fg-lead">
            Turn any phone or camera stream into a TV-style broadcast. The CricsHub overlay sits on your YouTube stream and
            updates itself with every ball you score in the app.
          </p>
        </div>
        <div className="grid flex-[0_1_420px] grid-cols-2 gap-2.5">
          {FACTS.map((f) => (
            <div key={f.value} className="rounded-[18px] border border-line bg-surface px-4 py-3.5">
              <div className={cn("font-display text-[28px] font-extrabold leading-none", f.accent && "text-accent")}>{f.value}</div>
              <div className="mt-1 text-xs text-fg-muted">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <StudioDemo />

      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 p-0">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3.5 rounded-[22px] border border-line bg-surface p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-xl font-extrabold">
              {i + 1}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-extrabold">{s.title}</span>
              <span className="text-sm leading-normal text-fg-muted">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href={EXPLORE_HREF} className={cn("flex h-[54px] items-center gap-2.5 rounded-full px-6 text-[15px] font-bold", gradientCta)}>
          Explore Stream Studio
          <ArrowRightIcon />
        </Link>
        <Link href="/pricing" className={cn("flex h-[54px] items-center rounded-full px-[22px] text-[15px] text-primary-soft-fg", ghostCta)}>
          See overlay bundles
        </Link>
      </div>
    </div>
  );
}

/** Interactive mock of a YouTube broadcast + the Stream Studio overlay controls. */
function StudioDemo() {
  const [theme, setTheme] = useState<ThemeId>("Glass");
  const [milestone, setMilestone] = useState(true);
  const [copied, setCopied] = useState(false);
  const t = OVERLAY_THEMES[theme];
  const glass = { background: t.bg, border: t.border };

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(SAMPLE_OVERLAY_URL).catch(() => {});
    setCopied(true);
  };

  return (
    <div className="relative rounded-[32px] border border-line-strong bg-[linear-gradient(170deg,#16203A_0%,#0D1220_100%)] p-3.5 shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-160px] -ml-[450px] h-[360px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.28), rgba(74,158,224,0) 100%)" }}
      />
      <div className="relative flex flex-wrap gap-3.5">
        {/* Broadcast preview */}
        <div className="min-w-0 flex-[2_1_560px] overflow-hidden rounded-[22px] border border-[#22304A] bg-canvas">
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            ))}
            <span className="ml-2 min-w-0 flex-1 truncate rounded-lg bg-well px-2.5 py-[5px] text-[11px] text-fg-subtle">
              YouTube Live · City Premier League · Final
            </span>
          </div>
          <div
            role="img"
            aria-label="Sample YouTube broadcast with the CricsHub score overlay"
            className="relative aspect-video overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(0,0,0,0) 0%, rgba(4,8,14,0.7) 100%), repeating-linear-gradient(90deg, #1A3A2A 0px, #1A3A2A 70px, #1E4330 70px, #1E4330 140px)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[22%] bg-[linear-gradient(180deg,#0B1220_0%,rgba(11,18,32,0.6)_70%,rgba(11,18,32,0)_100%)]" />
            <div className="absolute left-1/2 top-[24%] -ml-[4%] h-[56%] w-[8%] rounded-[3px] bg-[linear-gradient(180deg,#CDBB8C_0%,#B9A578_100%)] opacity-60" />
            <div className="absolute left-1/2 top-[26%] -ml-[1.5%] h-0.5 w-[3%] bg-[#F4F4F4]" />
            <div className="absolute left-1/2 top-[77%] -ml-[1.5%] h-0.5 w-[3%] bg-[#F4F4F4]" />

            <div className="absolute left-[3%] top-[5%] flex gap-1.5">
              <span className="rounded-[5px] bg-[#D93025] px-2 py-1 text-[10px] font-extrabold tracking-[1px] text-white">LIVE</span>
              <span className="rounded-[5px] bg-canvas/60 px-2 py-1 text-[10px] font-bold text-white">1080p</span>
            </div>
            <div className="absolute right-[3%] top-[5%] flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 backdrop-blur-[10px]" style={glass}>
              <span className="font-display text-[13px] font-bold tracking-[1px]" style={{ color: t.text }}>
                CRICS<span className="text-accent">HUB</span>
              </span>
              <span className="h-3.5 w-px opacity-40" style={{ background: t.sub }} />
              <span className="text-[10px] font-bold" style={{ color: t.sub }}>
                CPL · FINAL
              </span>
            </div>

            {milestone && (
              <div
                className="absolute bottom-[27%] left-[3%] flex items-center gap-2.5 rounded-xl py-2 pl-2 pr-3 backdrop-blur-[10px] animate-fade-up"
                style={glass}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold"
                  style={{ background: t.teamBg, color: t.teamText }}
                >
                  RS
                </span>
                <span className="flex flex-col gap-px">
                  <span className="text-xs font-extrabold" style={{ color: t.text }}>
                    R. Sharma · 50 up!
                  </span>
                  <span className="text-[10px]" style={{ color: t.sub }}>
                    81* (48) · 7 fours · 4 sixes
                  </span>
                </span>
              </div>
            )}

            <div
              className="absolute inset-x-[3%] bottom-[5%] flex items-stretch overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-[12px]"
              style={glass}
            >
              <div className="flex flex-col justify-center px-3 py-2" style={{ background: t.teamBg, color: t.teamText }}>
                <span className="font-display text-xl font-extrabold leading-none">MUM</span>
                <span className="text-[8px] font-extrabold tracking-[0.5px]">v AND</span>
              </div>
              <div className="flex flex-col justify-center gap-px px-3 py-1.5">
                <span className="font-display text-2xl font-extrabold leading-none" style={{ color: t.text }}>
                  171/4{" "}
                  <span className="text-sm" style={{ color: t.sub }}>
                    19.1
                  </span>
                </span>
                <span className="text-[9px] font-bold" style={{ color: t.sub }}>
                  CRR 8.92 · RRR 8.40
                </span>
              </div>
              <div className="hidden flex-col justify-center gap-0.5 border-l border-accent-soft/20 px-3 py-1.5 text-[10px] min-[900px]:flex" style={{ color: t.text }}>
                <span>
                  <b>Sharma*</b> 81 (48)
                </span>
                <span>
                  <b>Pandya</b> 2 (2)
                </span>
              </div>
              <div className="hidden items-center gap-1 border-l border-accent-soft/20 px-3 py-1.5 min-[900px]:flex">
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-white">4</span>
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#4A9EE0] text-[9px] font-extrabold text-canvas">6</span>
                <span className="box-border h-[18px] w-[18px] rounded-full border border-dashed" style={{ borderColor: t.sub }} />
              </div>
              <div className="ml-auto flex flex-col items-end justify-center border-l border-accent-soft/20 px-3 py-1.5">
                <span className="text-[8px] font-extrabold tracking-[0.5px]" style={{ color: t.sub }}>
                  NEED
                </span>
                <span className="font-display text-lg font-extrabold text-accent">7 off 5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Studio panel */}
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-[18px] rounded-[22px] border border-[#22304A] bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-accent-soft">Stream Studio</span>
              <span className="text-base font-extrabold">Overlay controls</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-[5px] text-[11px] font-extrabold text-primary-soft-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Synced
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-fg-muted">Theme</span>
            <div role="radiogroup" aria-label="Overlay theme" className="flex gap-1 rounded-[14px] border border-line bg-well p-1">
              {(Object.keys(OVERLAY_THEMES) as ThemeId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "h-[38px] flex-1 rounded-[10px] text-[13px] font-bold transition-colors",
                    theme === id ? "bg-primary text-white" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="mb-1 text-xs font-bold text-fg-muted">Graphics</span>
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <span className="text-sm font-semibold">Score bar</span>
              <span className="text-[11px] font-extrabold text-primary-soft-fg">Always on</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={milestone}
              onClick={() => setMilestone((m) => !m)}
              className="flex items-center justify-between border-b border-line py-2.5 text-left"
            >
              <span className="text-sm font-semibold">Milestone pop-up</span>
              <span className={cn("relative h-6 w-[42px] rounded-full transition-colors", milestone ? "bg-primary" : "bg-line-strong")}>
                <span
                  className={cn(
                    "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-200",
                    milestone ? "left-[21px]" : "left-[3px]",
                  )}
                />
              </span>
            </button>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm font-semibold">Tournament badge</span>
              <span className="text-[11px] font-extrabold text-primary-soft-fg">Always on</span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <span className="text-xs font-bold text-fg-muted">Browser source URL</span>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-well py-1.5 pl-3 pr-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#C9D3E2]">{SAMPLE_OVERLAY_URL}</span>
              <button type="button" onClick={copy} className="rounded-[9px] bg-primary px-3 py-2 text-xs font-extrabold text-white hover:bg-primary-hover">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
