"use client";

import { useState, useEffect } from "react";
import { loadObsHotkeys, saveObsHotkeys, type HotkeyMapping } from "@/lib/streaming/storage";
import { Button, Field, Input, controlClasses } from "@/app/components/ui";
import { Hint, selectClasses } from "../StudioKit";

interface Props {
  onTrigger: (hotkeyName: string) => void;
  onGetList: () => Promise<string[]>;
  connected: boolean;
}

export default function ObsHotkeyPanel({ onTrigger, onGetList, connected }: Props) {
  const [hotkeys, setHotkeys] = useState<HotkeyMapping[]>([]);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHotkeys(loadObsHotkeys());
  }, []);

  const fetchAvailable = async () => {
    setLoading(true);
    try {
      const list = await onGetList();
      setAvailableKeys(list);
    } catch {}
    setLoading(false);
  };

  const handleAdd = () => {
    if (!newLabel || !newKey) return;
    const updated = [...hotkeys, { label: newLabel, obsHotkeyName: newKey }];
    setHotkeys(updated);
    saveObsHotkeys(updated);
    setNewLabel("");
    setNewKey("");
    setAdding(false);
  };

  const handleRemove = (idx: number) => {
    const updated = hotkeys.filter((_, i) => i !== idx);
    setHotkeys(updated);
    saveObsHotkeys(updated);
  };

  return (
    <div className="space-y-3">
      {hotkeys.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {hotkeys.map((hk, i) => (
            <li
              key={i}
              className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-line-strong bg-surface shadow-xs"
            >
              <button
                type="button"
                onClick={() => onTrigger(hk.obsHotkeyName)}
                disabled={!connected}
                title={hk.obsHotkeyName}
                className="flex min-h-[40px] min-w-0 flex-1 items-center gap-1.5 px-3 text-xs font-medium text-fg transition-colors duration-150 hover:bg-primary-soft hover:text-primary-soft-fg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50"
              >
                <i className="ri-flashlight-line flex-shrink-0 text-primary" aria-hidden />
                <span className="truncate">{hk.label}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={`Remove hotkey ${hk.label}`}
                className="flex w-8 flex-shrink-0 items-center justify-center border-l border-line text-fg-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <i className="ri-close-line" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <Hint>Map OBS hotkeys to one-tap buttons for replays, stingers and more.</Hint>
      )}

      {adding ? (
        <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3 animate-fade-in">
          <Field label="Button label">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Replay"
              />
            )}
          </Field>
          <Field label="OBS hotkey">
            {({ id }) =>
              availableKeys.length > 0 ? (
                <select
                  id={id}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className={controlClasses(false, selectClasses)}
                >
                  <option value="">Select hotkey…</option>
                  {availableKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id={id}
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="OBS hotkey name"
                    className="font-mono"
                    spellCheck={false}
                  />
                  <Button
                    variant="outline"
                    icon="ri-download-2-line"
                    loading={loading}
                    disabled={!connected}
                    onClick={fetchAvailable}
                  >
                    Fetch
                  </Button>
                </div>
              )
            }
          </Field>
          <div className="flex gap-2">
            <Button block onClick={handleAdd} disabled={!newLabel || !newKey}>
              Add
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" block icon="ri-add-line" onClick={() => setAdding(true)} className="border-dashed">
          Add hotkey button
        </Button>
      )}
    </div>
  );
}
