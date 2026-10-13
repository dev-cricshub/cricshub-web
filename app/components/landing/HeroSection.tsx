import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { ctaPrimary } from "./primitives";

const HEADLINE = ["Every ball.", "Every boundary.", "One cricket hub."];

const PROOF = [
  { value: "1K+", label: "matches scored live" },
  { value: "300+", label: "streams broadcast" },
  { value: "500+", label: "tournaments run" },
];

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-header overflow-hidden border-b border-line pt-header">
      {/* Stadium photograph, held back so it reads as atmosphere rather than a picture. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/images/hero-stadium.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_60%] opacity-40"
        />
        {/* Darkest behind the centred copy, opening up toward the stands and pitch at the edges. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgb(var(--canvas)/0.82),rgb(var(--canvas)/0.35)_75%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-canvas to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <div className="container-page flex flex-col justify-center pb-20 pt-16 sm:pt-20 lg:min-h-[min(calc(100svh-var(--header-h)),52rem)] lg:pb-24 lg:pt-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="text-sm font-medium text-fg-muted opacity-0 animate-fade-up [animation-delay:60ms]">
            Live scoring <span className="mx-1.5 text-fg-subtle">/</span> Tournaments{" "}
            <span className="mx-1.5 text-fg-subtle">/</span> Streaming
          </p>

          <h1 id="hero-title" className="mt-6 font-display text-display-xl font-extrabold uppercase text-fg">
            {HEADLINE.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <span
                  className={cn(
                    "hero-line block translate-y-[105%] animate-[hero-line_800ms_var(--ease-out)_forwards]",
                    i === 2 && "text-accent",
                  )}
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-7 max-w-[34rem] text-base leading-relaxed text-fg-muted opacity-0 animate-fade-up [animation-delay:420ms] sm:text-lg">
            Score matches ball by ball, run your league from fixtures to final, and stream every game with live
            overlays — all from one app built for grassroots cricket.
          </p>

          <div className="mt-9 opacity-0 animate-fade-up [animation-delay:520ms]">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={ctaPrimary}>
              <i className="ri-google-play-fill text-lg" aria-hidden />
              Get CricsHub — free
            </a>
          </div>

          <dl className="mt-14 grid w-full max-w-md grid-cols-3 gap-6 border-t border-line pt-6 opacity-0 animate-fade-in [animation-delay:700ms]">
            {PROOF.map((p) => (
              <div key={p.label} className="flex flex-col items-center">
                <dt className="order-last mt-1.5 text-xs leading-snug text-fg-muted">{p.label}</dt>
                <dd className="font-display text-3xl font-bold leading-none text-fg">{p.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <style>{`
        @keyframes hero-line { to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .hero-line { transform: none !important; animation: none !important; }
        }
      `}</style>
    </section>
  );
}
