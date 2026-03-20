"use client";

import { useState } from "react";
import type { VmixInput } from "@/lib/streaming/types";

interface Props {
  inputs: VmixInput[];
  onSetTitle: (input: number, index: number, value: string) => void;
}

export default function VmixTitling({ inputs, onSetTitle }: Props) {
  const [selectedInput, setSelectedInput] = useState<number | null>(null);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [value, setValue] = useState("");

  // Filter title/GT inputs
  const titleInputs = inputs.filter(
    (inp) =>
      inp.type.toLowerCase().includes("title") ||
      inp.type.toLowerCase().includes("gt") ||
      inp.type.toLowerCase().includes("xaml"),
  );

  const handleApply = () => {
    if (selectedInput != null) {
      onSetTitle(selectedInput, fieldIndex, value);
    }
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-text mr-1" />
        Dynamic Titling
      </p>

      <div className="space-y-2">
        <select
          value={selectedInput ?? ""}
          onChange={(e) => setSelectedInput(parseInt(e.target.value) || null)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600"
        >
          <option value="">Select title input...</option>
          {titleInputs.length > 0
            ? titleInputs.map((inp) => (
                <option key={inp.key} value={inp.number}>
                  {inp.number}. {inp.title || inp.type}
                </option>
              ))
            : inputs.map((inp) => (
                <option key={inp.key} value={inp.number}>
                  {inp.number}. {inp.title || inp.type}
                </option>
              ))}
        </select>

        <div className="flex gap-2">
          <div className="w-20">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Field #</label>
            <input
              type="number"
              min={0}
              value={fieldIndex}
              onChange={(e) => setFieldIndex(parseInt(e.target.value) || 0)}
              className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Text to display"
              className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700"
            />
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={!selectedInput}
          className="w-full py-2.5 rounded-xl bg-[#34B8FF]/10 text-[#1E88E5] text-xs font-bold hover:bg-[#34B8FF]/20 transition-all border border-[#34B8FF]/20 disabled:opacity-40"
        >
          <i className="ri-edit-line mr-1" />
          Apply Title
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-2">
        Update text in vMix Title/GT inputs dynamically. Use field index 0 for the first text field.
      </p>
    </div>
  );
}
