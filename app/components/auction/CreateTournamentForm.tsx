"use client";

import { useState } from "react";
import { Select } from "@/app/components/auction/chrome";
import { Button, Field, Input, useToast } from "@/app/components/ui";
import { auctionService, type NewTournamentInput } from "@/lib/auction/store";
import type { Auction } from "@/lib/auction/types";

/**
 * Creates a CricsHub tournament from the auction and links it (same fields as creating one in the app).
 * If the auction has already ended, the server adds the teams and squads to it straight away.
 * A plain block rather than a <form>, so it can sit inside the setup wizard's Details form.
 */
export function CreateTournamentForm({
  auction,
  onCreated,
  onCancel,
}: {
  auction: Auction;
  onCreated?: (auction: Auction) => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: auction.tournament || auction.name,
    format: "SINGLE_ROUND_ROBIN" as NewTournamentInput["format"],
    ballType: "TENNIS" as NewTournamentInput["ballType"],
    overs: "20",
    startDate: "",
    endDate: "",
    matchesPerDay: 1,
    venues: "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast("Enter the tournament name.", { tone: "error" });
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast("Choose the tournament dates.", { tone: "error" });
      return;
    }
    setBusy(true);
    const result = await auctionService.createTournament(auction.id, {
      name: form.name.trim(),
      format: form.format,
      ballType: form.ballType,
      type: form.overs.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      matchesPerDay: form.matchesPerDay,
      venues: form.venues.split(",").map((v) => v.trim()).filter(Boolean),
    });
    setBusy(false);
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    const done = result.value.handoverStatus === "done";
    toast(done ? `Created ${result.value.tournament} and added the squads.` : `Created ${result.value.tournament}.`, {
      tone: "success",
    });
    onCreated?.(result.value);
  };

  return (
    <div className="space-y-3 rounded-card border border-line bg-surface-2 p-4">
      <p className="text-sm font-semibold">New CricsHub tournament</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tournament name" required>
          {({ id }) => <Input id={id} value={form.name} onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <Field label="Format" required>
          {({ id }) => (
            <Select id={id} value={form.format} onChange={(e) => set({ format: e.target.value as NewTournamentInput["format"] })}>
              <option value="SINGLE_ROUND_ROBIN">League — everyone plays once</option>
              <option value="DOUBLE_ROUND_ROBIN">League — everyone plays twice</option>
              <option value="CUSTOM">Custom — I'll schedule matches</option>
            </Select>
          )}
        </Field>
        <Field label="Ball" required>
          {({ id }) => (
            <Select id={id} value={form.ballType} onChange={(e) => set({ ballType: e.target.value as NewTournamentInput["ballType"] })}>
              <option value="TENNIS">Tennis</option>
              <option value="LEATHER">Leather</option>
            </Select>
          )}
        </Field>
        <Field label="Overs per innings">
          {({ id }) => <Input id={id} type="number" min={1} value={form.overs} onChange={(e) => set({ overs: e.target.value })} />}
        </Field>
        <Field label="Start date" required>
          {({ id }) => <Input id={id} type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />}
        </Field>
        <Field label="End date" required>
          {({ id }) => (
            <Input id={id} type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set({ endDate: e.target.value })} />
          )}
        </Field>
        <Field label="Matches per day">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              value={form.matchesPerDay}
              onChange={(e) => set({ matchesPerDay: Math.max(1, Number(e.target.value) || 1) })}
            />
          )}
        </Field>
        <Field label="Venues" optional hint="Separate with commas.">
          {({ id }) => <Input id={id} value={form.venues} onChange={(e) => set({ venues: e.target.value })} />}
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={busy} onClick={submit}>
          {auction.status === "completed" ? "Create tournament & add squads" : "Create tournament"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
