"use client";

import { useState } from "react";
import { Select } from "@/app/components/auction/chrome";
import { Button, Field, Input, useToast } from "@/app/components/ui";
import { auctionService, type NewTournamentInput } from "@/lib/auction/store";
import type { Auction } from "@/lib/auction/types";

/**
 * Creates a CricsHub tournament from a completed auction, links it and adds the teams and squads in one call
 * (same fields as creating one in the app). Format, ball, start and end date are required.
 */
export function CreateTournamentForm({
  auction,
  disabled,
  onCreated,
  onCancel,
}: {
  auction: Auction;
  /** e.g. while sold players still need phone numbers. */
  disabled?: boolean;
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
    matchesPerDay: "",
    venues: "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast("Enter the tournament name.", { tone: "error" });
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast("Choose the tournament start and end dates.", { tone: "error" });
      return;
    }
    if (form.endDate < form.startDate) {
      toast("The end date can't be before the start date.", { tone: "error" });
      return;
    }
    setBusy(true);
    const result = await auctionService.createTournament(auction.id, {
      name: form.name.trim(),
      format: form.format,
      ballType: form.ballType,
      type: form.overs.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      matchesPerDay: Number(form.matchesPerDay) || undefined,
      venues: form.venues.split(",").map((v) => v.trim()).filter(Boolean),
    });
    setBusy(false);
    if (!result.ok) {
      toast(result.error, { tone: "error" });
      return;
    }
    if (result.value.handoverStatus === "failed") {
      toast(result.value.handoverError ?? `Created ${result.value.tournament}, but the squads were not added.`, { tone: "error" });
    } else {
      toast(`Squads added to ${result.value.tournament}. Schedule matches from the tournament in the app.`, { tone: "success" });
    }
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
        <Field label="Overs per innings" optional>
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
        <Field label="Matches per day" optional>
          {({ id }) => <Input id={id} type="number" min={1} value={form.matchesPerDay} onChange={(e) => set({ matchesPerDay: e.target.value })} />}
        </Field>
        <Field label="Venues" optional hint="Separate with commas.">
          {({ id }) => <Input id={id} value={form.venues} onChange={(e) => set({ venues: e.target.value })} />}
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={busy || disabled} onClick={submit}>
          Create tournament and add squads
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
