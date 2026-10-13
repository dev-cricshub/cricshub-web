"use client";

import type { VmixInput } from "@/lib/streaming/types";
import { Badge, LiveDot, cn } from "@/app/components/ui";
import { SubLabel } from "../StudioKit";

interface Props {
  inputs: VmixInput[];
  activeInput: number | null;
  previewInput: number | null;
  onCut: (input: number) => void;
  onPreview: (input: number) => void;
}

export default function VmixInputSwitcher({
  inputs,
  activeInput,
  previewInput,
  onCut,
  onPreview,
}: Props) {
  if (!inputs.length) return null;

  return (
    <div>
      <SubLabel icon="ri-vidicon-line">Inputs</SubLabel>
      <div className="grid grid-cols-2 gap-2">
        {inputs.map((inp) => {
          const isActive = inp.number === activeInput;
          const isPreview = inp.number === previewInput;
          const name = inp.title || inp.type;
          return (
            <div
              key={inp.key}
              className={cn(
                "min-w-0 overflow-hidden rounded-xl border bg-surface transition-[border-color,box-shadow] duration-150",
                isActive
                  ? "border-live shadow-[0_0_0_1px_rgb(var(--live))]"
                  : isPreview
                    ? "border-success shadow-[0_0_0_1px_rgb(var(--success))]"
                    : "border-line-strong",
              )}
            >
              <div
                className={cn(
                  "px-3 py-2",
                  isActive ? "bg-live/10" : isPreview ? "bg-success-soft" : "bg-surface-2",
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-1.5">
                  <span className="truncate text-xs font-semibold text-fg" title={name}>
                    <span className="font-mono tabular-nums text-fg-subtle">{inp.number}</span> {name}
                  </span>
                  {isActive && (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-live px-1.5 py-px text-2xs font-semibold text-white">
                      <LiveDot className="h-1.5 w-1.5" />
                      PGM
                    </span>
                  )}
                  {isPreview && !isActive && (
                    <Badge tone="success" size="xs" className="flex-shrink-0">
                      PVW
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-2xs text-fg-subtle">{inp.type}</p>
              </div>
              <div className="flex border-t border-line">
                <button
                  type="button"
                  onClick={() => onPreview(inp.number)}
                  aria-label={`Preview input ${inp.number} ${name}`}
                  aria-pressed={isPreview}
                  className="flex h-9 flex-1 items-center justify-center border-r border-line text-2xs font-semibold tracking-wider text-success transition-colors duration-150 hover:bg-success-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  PVW
                </button>
                <button
                  type="button"
                  onClick={() => onCut(inp.number)}
                  aria-label={`Cut input ${inp.number} ${name} to program`}
                  aria-pressed={isActive}
                  className="flex h-9 flex-1 items-center justify-center text-2xs font-semibold tracking-wider text-live transition-colors duration-150 hover:bg-live/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  CUT
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
