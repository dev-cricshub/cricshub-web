"use client";

import type { VmixOverlayChannel, VmixInput } from "@/lib/streaming/types";
import { Badge, Button, controlClasses, cn } from "@/app/components/ui";
import { Hint, selectClasses } from "../StudioKit";

interface Props {
  overlays: VmixOverlayChannel[];
  inputs: VmixInput[];
  onOverlayIn: (channel: 1 | 2 | 3 | 4, input: number) => void;
  onOverlayOut: (channel: 1 | 2 | 3 | 4) => void;
  onOverlayOff: (channel: 1 | 2 | 3 | 4) => void;
}

export default function VmixOverlayChannels({
  overlays,
  inputs,
  onOverlayIn,
  onOverlayOut,
}: Props) {
  return (
    <div className="space-y-2">
      {overlays.map((ov) => {
        const currentInput = inputs.find((inp) => inp.number === ov.inputNumber);
        const selectId = `vmix-overlay-${ov.number}`;
        return (
          <div
            key={ov.number}
            className={cn(
              "rounded-xl border px-3 py-2.5 transition-colors duration-150",
              ov.active ? "border-primary/40 bg-primary-soft" : "border-line bg-surface-2",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor={selectId} className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums",
                    ov.active ? "bg-primary text-primary-fg" : "bg-surface-3 text-fg-muted",
                  )}
                >
                  {ov.number}
                </span>
                <span className="truncate text-sm font-medium text-fg">
                  Overlay {ov.number}
                  {currentInput && (
                    <span className="ml-1 font-normal text-fg-muted">
                      · {currentInput.title || currentInput.type}
                    </span>
                  )}
                </span>
              </label>
              {ov.active && (
                <Badge tone="primary" size="xs" className="flex-shrink-0">
                  On
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <select
                id={selectId}
                className={controlClasses(false, cn(selectClasses, "min-w-0 flex-1"))}
                value={ov.inputNumber ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val) onOverlayIn(ov.number, val);
                }}
              >
                <option value="">Select input…</option>
                {inputs.map((inp) => (
                  <option key={inp.key} value={inp.number}>
                    {inp.number}. {inp.title || inp.type}
                  </option>
                ))}
              </select>
              {ov.active ? (
                <Button
                  variant="outline"
                  icon="ri-eye-off-line"
                  onClick={() => onOverlayOut(ov.number)}
                  aria-label={`Take overlay ${ov.number} off`}
                >
                  Off
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon="ri-eye-line"
                  onClick={() => {
                    if (ov.inputNumber) onOverlayIn(ov.number, ov.inputNumber);
                  }}
                  disabled={!ov.inputNumber}
                  aria-label={`Put overlay ${ov.number} on`}
                >
                  On
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <Hint className="pt-1">
        Use overlays for independent layers: score on Ch1, banners on Ch2, branding on Ch3, replay on Ch4.
      </Hint>
    </div>
  );
}
