"use client";

import { useState } from "react";
import type { VmixInput } from "@/lib/streaming/types";
import { Button, Field, Input, controlClasses } from "@/app/components/ui";
import { Hint, selectClasses } from "../StudioKit";

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
    <div className="space-y-3">
      <Field label="Title input">
        {({ id }) => (
          <select
            id={id}
            value={selectedInput ?? ""}
            onChange={(e) => setSelectedInput(parseInt(e.target.value) || null)}
            className={controlClasses(false, selectClasses)}
          >
            <option value="">Select title input…</option>
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
        )}
      </Field>

      <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
        <Field label="Field #">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              value={fieldIndex}
              onChange={(e) => setFieldIndex(parseInt(e.target.value) || 0)}
              className="font-mono tabular-nums"
            />
          )}
        </Field>
        <Field label="Value">
          {({ id }) => (
            <Input
              id={id}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Text to display"
            />
          )}
        </Field>
      </div>

      <Button block icon="ri-edit-line" onClick={handleApply} disabled={!selectedInput}>
        Apply title
      </Button>

      <Hint>Update text in vMix Title/GT inputs dynamically. Use field index 0 for the first text field.</Hint>
    </div>
  );
}
