"use client";

import { useState, useEffect } from "react";
import { loadObsHotkeys, saveObsHotkeys, type HotkeyMapping } from "@/lib/streaming/storage";

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
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-keyboard-line mr-1" />
        Hotkeys
      </p>

      {hotkeys.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {hotkeys.map((hk, i) => (
            <div key={i} className="relative group">
              <button
                onClick={() => onTrigger(hk.obsHotkeyName)}
                disabled={!connected}
                className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 text-xs font-bold hover:bg-[#34B8FF]/10 hover:text-[#1E88E5] transition-all border border-gray-200 disabled:opacity-40"
              >
                <i className="ri-flashlight-line mr-1" />
                {hk.label}
              </button>
              <button
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] hidden group-hover:flex items-center justify-center"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-2 bg-gray-50 rounded-xl border border-gray-200 p-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Button label (e.g. Replay)"
            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
          />
          {availableKeys.length > 0 ? (
            <select
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
            >
              <option value="">Select hotkey...</option>
              {availableKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="OBS hotkey name"
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
              />
              <button
                onClick={fetchAvailable}
                disabled={loading || !connected}
                className="px-2.5 py-2 rounded-lg bg-[#34B8FF]/10 text-[#1E88E5] text-xs font-bold border border-[#34B8FF]/20 disabled:opacity-40"
              >
                {loading ? <i className="ri-loader-4-line animate-spin" /> : "Fetch"}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newLabel || !newKey}
              className="flex-1 py-2 rounded-lg bg-[#34B8FF] text-white text-xs font-bold disabled:opacity-40"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-2 rounded-lg bg-gray-200 text-gray-600 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold hover:bg-gray-100 transition-all border border-gray-200 border-dashed"
        >
          <i className="ri-add-line mr-1" />
          Add Hotkey Button
        </button>
      )}
    </div>
  );
}
