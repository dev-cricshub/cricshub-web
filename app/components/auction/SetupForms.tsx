"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/app/components/auction/chrome";
import { ReviewQueue, useRegistrations } from "@/app/components/auction/Registrations";
import { Button, Field, Input, Textarea, useToast } from "@/app/components/ui";
import { csvTemplate, normalizePhone } from "@/lib/auction/csv";
import { fromDateTimeLocal, inr, toDateTimeLocal } from "@/lib/auction/format";
import { auctionService, fetchMyCricshubTeams } from "@/lib/auction/store";
import type { Auction, AuctionTeam, PlayerRole } from "@/lib/auction/types";
import { PLAYER_ROLES, ROLE_LABEL } from "@/lib/auction/types";

// Forms the auction admin (AuctionAdmin.tsx) opens in dialogs and sections.

export const TEAM_COLORS = ["#1E88E5", "#E2B94B", "#C46B4E", "#8A9BA8", "#207BBE", "#273687", "#3D8F6E", "#A15C8A"];
export const TIME_ZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Colombo", "Europe/London", "Australia/Sydney"];

/** Auction name, tournament, date and visibility. Only the name is required. */
export function DetailsForm({
  auction,
  onSaved,
}: {
  auction: Auction;
  onSaved: (result: { ok: true } | { ok: false; error: string }) => void;
}) {
  const [name, setName] = useState(auction.name);
  const [tournament, setTournament] = useState(auction.tournament);
  const [description, setDescription] = useState(auction.description);
  const [timezone, setTimezone] = useState(auction.timezone);
  const [starts, setStarts] = useState(toDateTimeLocal(auction.startsAt, auction.timezone));
  const [visibility, setVisibility] = useState(auction.visibility);
  const [homeCountry, setHomeCountry] = useState(auction.homeCountry ?? "India");

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          onSaved({ ok: false, error: "Give your auction a name." });
          return;
        }
        // Tournament linking is not part of setup: it happens on Results once the auction is completed.
        onSaved(
          await auctionService.saveDetails(auction.id, {
            name: name.trim(),
            tournament: tournament.trim(),
            description: description.trim(),
            startsAt: starts ? fromDateTimeLocal(starts, timezone) : null,
            timezone,
            visibility,
            homeCountry: homeCountry.trim() || "India",
          }),
        );
      }}
    >
      <Field label="Auction name" required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={name} onChange={(e) => setName(e.target.value)} required />
        )}
      </Field>
      <Field label="Tournament" optional hint="Just a label. You can add the squads to a CricsHub tournament after the auction ends.">
        {({ id }) => <Input id={id} value={tournament} onChange={(e) => setTournament(e.target.value)} />}
      </Field>
      <Field label="Description" optional>
        {({ id }) => <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date and time" optional>
          {({ id }) => <Input id={id} type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />}
        </Field>
        <Field label="Time zone" optional>
          {({ id }) => (
            <Select id={id} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIME_ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Who can open the spectator view" optional hint="Registered players can always watch. Link lets any signed-in user with the spectator URL watch too.">
        {({ id }) => (
          <Select id={id} value={visibility} onChange={(e) => setVisibility(e.target.value as Auction["visibility"])}>
            <option value="private">Private — auctioneer and registered players</option>
            <option value="link">Anyone with the spectator link</option>
          </Select>
        )}
      </Field>
      <Field label="Home country" optional hint="Default nationality for players who register themselves.">
        {({ id }) => <Input id={id} maxLength={64} value={homeCountry} onChange={(e) => setHomeCountry(e.target.value)} />}
      </Field>
      <p className="text-sm text-fg-muted">Format: player auction. Other formats are not part of this version.</p>
      <Button type="submit">Save details</Button>
    </form>
  );
}

export function TeamEditor({
  auction,
  initial,
  teamId,
  onClose,
}: {
  auction: Auction;
  initial: Omit<AuctionTeam, "id">;
  teamId?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [myTeams, setMyTeams] = useState<{ id: string; name: string }[] | null>(null);

  useEffect(() => {
    fetchMyCricshubTeams().then(setMyTeams);
  }, []);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const ownerPhone = normalizePhone(form.ownerPhone);
        if (ownerPhone === null) {
          toast("Owner phone must be a 10-digit mobile number.", { tone: "error" });
          return;
        }
        const payload = { ...form, ownerPhone };
        const result = teamId
          ? await auctionService.updateTeam(auction.id, teamId, payload)
          : await auctionService.addTeam(auction.id, payload);
        if (!result.ok) toast(result.error, { tone: "error" });
        else onClose();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Team name"
          required
          hint={form.appTeamId ? "Linked teams keep their CricsHub name, so the auction and the app match." : undefined}
        >
          {({ id }) => (
            <Input
              id={id}
              value={form.name}
              readOnly={!!form.appTeamId}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
        </Field>
        <Field label="Short name" required>
          {({ id }) => (
            <Input
              id={id}
              value={form.shortName}
              maxLength={16}
              placeholder="e.g. MUM"
              onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })}
              required
            />
          )}
        </Field>
        <Field label="Representative" optional>
          {({ id }) => <Input id={id} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />}
        </Field>
        <Field label="Colour" optional>
          {({ id }) => (
            <Input id={id} type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 px-1" />
          )}
        </Field>
        <Field label="Owner phone" optional hint="10-digit mobile. That user will manage the team on CricsHub after the auction.">
          {({ id }) => (
            <Input
              id={id}
              inputMode="tel"
              placeholder="10-digit mobile"
              value={form.ownerPhone ?? ""}
              onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
            />
          )}
        </Field>
        <Field label="CricsHub team" optional hint="Link one of your existing teams, or leave it to create a new one when the squads go to CricsHub.">
          {({ id }) => (
            <Select
              id={id}
              value={form.appTeamId ?? ""}
              onChange={(e) => {
                const picked = (myTeams ?? []).find((t) => t.id === e.target.value);
                // A linked team plays under its CricsHub name; use it here too.
                setForm({ ...form, appTeamId: picked?.id ?? null, name: picked ? picked.name : form.name });
              }}
            >
              <option value="">Create a new team</option>
              {(myTeams ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      {auction.rules.allowPurseOverride && (
        <Field label="Purse override (₹)" optional hint={`Leave empty to use ${inr(auction.rules.pursePerTeam)}.`} >
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              value={form.purseOverride ?? ""}
              onChange={(e) => setForm({ ...form, purseOverride: e.target.value === "" ? null : Number(e.target.value) })}
            />
          )}
        </Field>
      )}
      <div className="flex gap-2">
        <Button type="submit">{teamId ? "Save team" : "Add team"}</Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const emptyPlayer = {
  name: "",
  role: "BAT" as PlayerRole,
  nationality: "",
  category: "",
  basePrice: 20000,
  matches: 0,
  battingAvg: "",
  bowlingAvg: "",
  phone: "",
};

/** Paste a CSV of players; invalid rows are listed before importing. */
export function CsvImport({ auction, onDone }: { auction: Auction; onDone: () => void }) {
  const toast = useToast();
  const [csv, setCsv] = useState("");
  const preview = useMemo(() => (csv.trim() ? auctionService.previewCsv(csv) : null), [csv]);
  return (
    <div>
      <p className="text-xs text-fg-subtle">Columns: {csvTemplate().split("\n")[0]}</p>
      <Textarea className="mt-3 min-h-[160px] font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={csvTemplate()} />
      {preview && preview.errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-danger">
          {preview.errors.map((err, i) => (
            <li key={i}>
              Row {err.row}: {err.message}
            </li>
          ))}
        </ul>
      )}
      {preview && <p className="mt-2 text-xs text-fg-muted">{preview.players.length} valid rows ready to import.</p>}
      <Button
        className="mt-3"
        disabled={!csv.trim()}
        onClick={async () => {
          const result = await auctionService.importPlayers(auction.id, csv);
          if (!result.ok) toast(result.error, { tone: "error" });
          else {
            toast(`Imported ${result.value.imported} players.`, { tone: "success" });
            if (result.value.errors.length) toast(result.value.errors[0].message, { tone: "warning" });
            setCsv("");
            onDone();
          }
        }}
      >
        Import valid rows
      </Button>
    </div>
  );
}

export function PlayerEditor({ auction, playerId, onClose }: { auction: Auction; playerId?: string; onClose: () => void }) {
  const existing = auction.players.find((p) => p.id === playerId);
  const toast = useToast();
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          role: existing.role,
          nationality: existing.nationality,
          category: existing.category,
          basePrice: existing.basePrice,
          matches: existing.matches,
          battingAvg: existing.battingAvg === "—" ? "" : existing.battingAvg,
          bowlingAvg: existing.bowlingAvg === "—" ? "" : existing.bowlingAvg,
          phone: existing.phone ?? "",
        }
      : emptyPlayer,
  );
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.basePrice || form.basePrice <= 0) {
          toast("Base price must be more than zero.", { tone: "error" });
          return;
        }
        const phone = normalizePhone(form.phone);
        if (phone === null) {
          toast("Phone must be a 10-digit mobile number.", { tone: "error" });
          return;
        }
        const payload = { ...form, phone };
        const result = playerId
          ? await auctionService.updatePlayer(auction.id, playerId, payload)
          : await auctionService.addPlayer(auction.id, payload);
        if (!result.ok) toast(result.error, { tone: "error" });
        else onClose();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" required>
          {({ id }) => <Input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        </Field>
        <Field label="Role" required>
          {({ id }) => (
            <Select id={id} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PlayerRole })}>
              {PLAYER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Nationality" optional>
          {({ id }) => <Input id={id} placeholder="India" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />}
        </Field>
        <Field label="Category" optional hint="e.g. A, B or C">
          {({ id }) => <Input id={id} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value.toUpperCase() })} />}
        </Field>
        <Field label="Base price (₹)" required>
          {({ id }) => (
            <Input id={id} type="number" min={1} step={1} value={form.basePrice || ""} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} required />
          )}
        </Field>
        <Field label="Matches" optional>
          {({ id }) => (
            <Input id={id} type="number" min={0} value={form.matches || ""} onChange={(e) => setForm({ ...form, matches: Number(e.target.value) })} />
          )}
        </Field>
        <Field label="Batting average" optional>
          {({ id }) => <Input id={id} value={form.battingAvg} onChange={(e) => setForm({ ...form, battingAvg: e.target.value })} />}
        </Field>
        <Field label="Bowling average" optional>
          {({ id }) => <Input id={id} value={form.bowlingAvg} onChange={(e) => setForm({ ...form, bowlingAvg: e.target.value })} />}
        </Field>
      </div>
      <Field label="Phone" optional hint="10-digit mobile, unique in this auction. Sold players need one before the squads can go to CricsHub.">
        {({ id }) => (
          <Input id={id} inputMode="tel" placeholder="10-digit mobile" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        )}
      </Field>
      <div className="flex gap-2">
        <Button type="submit">{playerId ? "Save player" : "Add player"}</Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Registrations waiting for a decision, above the pool on the Players step. */
export function PendingQueue({ auction }: { auction: Auction }) {
  const { data, reload } = useRegistrations(auction);
  const waiting = data?.items.filter((r) => r.status === "pending" || r.status === "waitlisted") ?? [];
  if (!data || waiting.length === 0) return null;
  return (
    <section className="space-y-2 rounded-card border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">
        {waiting.length} registration{waiting.length === 1 ? "" : "s"} to review
      </h2>
      <ReviewQueue auction={auction} items={data.items} onChanged={reload} />
    </section>
  );
}
