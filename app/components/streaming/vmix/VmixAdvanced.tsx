"use client";

import { useState } from "react";
import type { VmixInput } from "@/lib/streaming/types";
import { Button, Field, controlClasses, cn } from "@/app/components/ui";
import { RangeSlider, SubLabel, selectClasses } from "../StudioKit";

interface Props {
  inputs: VmixInput[];
  onPtzMove: (input: number, direction: string, speed: number) => void;
  onPtzHome: (input: number) => void;
  onPtzZoomIn: (input: number, speed: number) => void;
  onPtzZoomOut: (input: number, speed: number) => void;
}

const PTZ_DIRECTIONS = [
  { dir: "Up", icon: "ri-arrow-up-line", col: "col-start-2" },
  { dir: "Left", icon: "ri-arrow-left-line", col: "col-start-1" },
  { dir: "Home", icon: "ri-home-4-line", col: "col-start-2", isHome: true },
  { dir: "Right", icon: "ri-arrow-right-line", col: "col-start-3" },
  { dir: "Down", icon: "ri-arrow-down-line", col: "col-start-2" },
];

export default function VmixAdvanced({
  inputs,
  onPtzMove,
  onPtzHome,
  onPtzZoomIn,
  onPtzZoomOut,
}: Props) {
  const [ptzInput, setPtzInput] = useState<number | null>(null);
  const [ptzSpeed, setPtzSpeed] = useState(0.5);

  return (
    <div className="space-y-5">
      {/* PTZ Camera Control */}
      <div className="space-y-3">
        <SubLabel icon="ri-webcam-line" className="mb-0">
          PTZ camera control
        </SubLabel>

        <Field label="Camera input">
          {({ id }) => (
            <select
              id={id}
              value={ptzInput ?? ""}
              onChange={(e) => setPtzInput(parseInt(e.target.value) || null)}
              className={controlClasses(false, selectClasses)}
            >
              <option value="">Select camera input…</option>
              {inputs.map((inp) => (
                <option key={inp.key} value={inp.number}>
                  {inp.number}. {inp.title || inp.type}
                </option>
              ))}
            </select>
          )}
        </Field>

        {ptzInput && (
          <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3 animate-fade-in">
            {/* Direction pad */}
            <div className="mx-auto grid w-fit grid-cols-3 gap-1.5" role="group" aria-label="Pan and tilt">
              {PTZ_DIRECTIONS.map((d) => (
                <button
                  key={d.dir}
                  type="button"
                  onClick={() =>
                    d.isHome ? onPtzHome(ptzInput) : onPtzMove(ptzInput, d.dir, ptzSpeed)
                  }
                  aria-label={d.isHome ? "Home position" : `Move ${d.dir.toLowerCase()}`}
                  className={cn(
                    d.col,
                    "flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition-[background-color,color,transform] duration-150 ease-out active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2",
                    d.isHome
                      ? "border-primary/30 bg-primary-soft text-primary-soft-fg hover:bg-primary hover:text-primary-fg"
                      : "border-line-strong bg-surface text-fg-muted hover:bg-surface-3 hover:text-fg",
                  )}
                >
                  <i className={d.icon} aria-hidden />
                </button>
              ))}
            </div>

            {/* Zoom */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" icon="ri-zoom-out-line" onClick={() => onPtzZoomOut(ptzInput, ptzSpeed)}>
                Zoom out
              </Button>
              <Button variant="outline" icon="ri-zoom-in-line" onClick={() => onPtzZoomIn(ptzInput, ptzSpeed)}>
                Zoom in
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                Speed
              </span>
              <RangeSlider
                min={0.1}
                max={1}
                step={0.1}
                value={ptzSpeed}
                onChange={(v) => setPtzSpeed(v)}
                ariaLabel="PTZ speed"
              />
              <span className="w-8 flex-shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
                {ptzSpeed.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Set Info */}
      <InfoBlock icon="ri-landscape-line" title="Virtual sets">
        Virtual sets are configured directly in vMix. Add a Virtual Set input in vMix and use the input
        switcher above to switch to it. Use PTZ controls to adjust the virtual camera position.
      </InfoBlock>

      {/* NDI Info */}
      <InfoBlock icon="ri-broadcast-line" title="NDI output">
        NDI output is controlled via External Output above. Enable it in vMix Settings → Outputs → NDI. Once
        enabled, use &ldquo;Start external output&rdquo; in the Stream &amp; record section.
      </InfoBlock>
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <SubLabel icon={icon}>{title}</SubLabel>
      <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-fg-muted">
        {children}
      </p>
    </div>
  );
}
