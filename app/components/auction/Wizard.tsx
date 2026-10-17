"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionSubnav, Select } from "@/app/components/auction/chrome";
import { CreateTournamentForm } from "@/app/components/auction/CreateTournamentForm";
import { Alert, Badge, Button, EmptyState, Field, Input, Switch, Textarea, useToast, cn } from "@/app/components/ui";
import { csvTemplate, normalizePhone } from "@/lib/auction/csv";
import { InviteLinks, RegistrationSettings, ReviewQueue, useRegistrations } from "@/app/components/auction/Registrations";
import { validateConfig, type ConfigIssue } from "@/lib/auction/engine";
import { fromDateTimeLocal, inr, toDateTimeLocal } from "@/lib/auction/format";
import { auctionService, fetchMyCricshubTeams } from "@/lib/auction/store";
import type { Auction, AuctionRules, AuctionTeam, LinkableTournament, PlayerRole } from "@/lib/auction/types";
import { PLAYER_ROLES, ROLE_LABEL } from "@/lib/auction/types";

const STEPS = ["Details", "Rules", "Teams", "Registration", "Players", "Review"] as const;
const REVIEW = STEPS.length - 1;
const COLORS = ["#1E88E5", "#E2B94B", "#C46B4E", "#8A9BA8", "#207BBE", "#273687", "#3D8F6E", "#A15C8A"];
const ZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Colombo", "Europe/London", "Australia/Sydney"];

export function Wizard({ auction }: { auction: Auction }) {
  const [step, setStep] = useState(0);
  const toast = useToast();
  const router = useRouter();
  // Server checks include tournament rules (phones, team names); local checks show while they load.
  const [serverIssues, setServerIssues] = useState<ConfigIssue[] | null>(null);
  const issues = serverIssues ?? validateConfig(auction);

  useEffect(() => {
    if (step !== REVIEW) return;
    let alive = true;
    auctionService.validate(auction.id).then((r) => {
      if (alive && r.ok) setServerIssues(r.value);
    });
    return () => {
      alive = false;
    };
  }, [step, auction.id, auction.revision]);

  const saveAnd = (ok: boolean, error?: string, next?: number) => {
    if (!ok) {
      toast(error || "Could not save.", { tone: "error" });
      return;
    }
    if (next != null) setStep(next);
  };

  return (
    <>
      <AppHeader />
      <main className="container-page space-y-6 py-6 sm:py-10">
        <AuctionSubnav auction={auction} />
        <ol className="flex gap-2 overflow-x-auto text-sm">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-control px-3 py-1.5 font-medium",
                  i === step ? "bg-primary text-primary-fg" : "bg-surface text-fg-muted hover:text-fg",
                )}
              >
                <span className="mr-1.5 font-mono text-xs">{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        {step === 0 && <DetailsStep auction={auction} onSaved={(r) => saveAnd(r.ok, r.ok ? undefined : r.error, 1)} />}
        {step === 1 && <RulesStep auction={auction} onSaved={(r) => saveAnd(r.ok, r.ok ? undefined : r.error, 2)} />}
        {step === 2 && <TeamsStep auction={auction} onContinue={() => setStep(3)} />}
        {step === 3 && <RegistrationStep auction={auction} onContinue={() => setStep(4)} />}
        {step === 4 && <PlayersStep auction={auction} onContinue={() => setStep(REVIEW)} />}
        {step === REVIEW && (
          <ReviewStep
            auction={auction}
            issues={issues}
            onEdit={setStep}
            onDraft={() => {
              toast("Draft saved.", { tone: "success" });
              router.push("/auctions");
            }}
            onPublish={async () => {
              const result = await auctionService.publish(auction.id);
              if (!result.ok) toast(result.error, { tone: "error" });
              else {
                toast("Auction scheduled.", { tone: "success" });
                router.push(`/auctions/${auction.id}`);
              }
            }}
          />
        )}
      </main>
    </>
  );
}

function DetailsStep({
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
  // "name": the tournament is just a label (auction only). "linked": a CricsHub tournament gets the squads.
  const [mode, setMode] = useState<"name" | "linked">(auction.tournamentId ? "linked" : "name");
  const [tournamentId, setTournamentId] = useState(auction.tournamentId ?? "");
  const [options, setOptions] = useState<LinkableTournament[] | null>(null);
  const [creatingTournament, setCreatingTournament] = useState(false);

  useEffect(() => {
    if (mode !== "linked" || options) return;
    auctionService.linkableTournaments().then((r) =>
      setOptions(r.ok ? r.value.filter((t) => !t.linkedAuctionId || t.linkedAuctionId === auction.id) : []),
    );
  }, [mode, options, auction.id]);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const startsAt = fromDateTimeLocal(starts, timezone);
        if (!startsAt) {
          onSaved({ ok: false, error: "Choose an auction date and time." });
          return;
        }
        if (mode === "linked" && !tournamentId) {
          onSaved({ ok: false, error: "Choose the CricsHub tournament to link." });
          return;
        }
        const linkedName = options?.find((t) => t.id === tournamentId)?.name;
        onSaved(
          await auctionService.saveDetails(auction.id, {
            name,
            tournament: mode === "linked" ? linkedName ?? auction.tournament : tournament,
            description,
            startsAt,
            timezone,
            visibility,
            homeCountry: homeCountry.trim() || "India",
            tournamentId: mode === "linked" ? tournamentId : "",
          }),
        );
      }}
    >
      <Field label="Auction name" required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={name} onChange={(e) => setName(e.target.value)} required />
        )}
      </Field>
      <Field label="Where will the tournament be played?">
        {({ id }) => (
          <Select id={id} value={mode} onChange={(e) => setMode(e.target.value as "name" | "linked")}>
            <option value="name">Somewhere else — just name the tournament</option>
            <option value="linked">On CricsHub — add the squads to my tournament</option>
          </Select>
        )}
      </Field>
      {mode === "name" ? (
        <Field label="Tournament" required>
          {({ id }) => <Input id={id} value={tournament} onChange={(e) => setTournament(e.target.value)} required />}
        </Field>
      ) : (
        <Field
          label="CricsHub tournament"
          required
          hint="When the auction ends, its teams and bought players are added to this tournament. Players then need phone numbers."
        >
          {({ id }) =>
            options && options.length === 0 ? (
              <p id={id} className="text-sm text-fg-subtle">
                You have no open tournaments yet. Create one below.
              </p>
            ) : (
              <Select id={id} value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
                <option value="">{options ? "Choose a tournament" : "Loading…"}</option>
                {(options ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.startDate ? ` · ${t.startDate}` : ""}
                  </option>
                ))}
              </Select>
            )
          }
        </Field>
      )}
      {mode === "linked" &&
        (creatingTournament ? (
          <CreateTournamentForm
            auction={auction}
            onCreated={(updated) => {
              setCreatingTournament(false);
              setTournamentId(updated.tournamentId ?? "");
              setOptions(null); // reload the picker, which now includes the new tournament
            }}
            onCancel={() => setCreatingTournament(false)}
          />
        ) : (
          <Button type="button" size="sm" variant="outline" icon="ri-add-line" onClick={() => setCreatingTournament(true)}>
            Create a new CricsHub tournament
          </Button>
        ))}
      <Field label="Description" optional>
        {({ id }) => <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date and time" required>
          {({ id }) => <Input id={id} type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} required />}
        </Field>
        <Field label="Time zone" required>
          {({ id }) => (
            <Select id={id} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Who can open the spectator view" hint="Private keeps it with the auctioneer. Link means anyone with the spectator URL, once accounts exist.">
        {({ id }) => (
          <Select id={id} value={visibility} onChange={(e) => setVisibility(e.target.value as Auction["visibility"])}>
            <option value="private">Private — auctioneer only</option>
            <option value="link">Anyone with the spectator link</option>
          </Select>
        )}
      </Field>
      <Field label="Home country" hint="Registered players from any other country count as overseas.">
        {({ id }) => <Input id={id} maxLength={64} value={homeCountry} onChange={(e) => setHomeCountry(e.target.value)} />}
      </Field>
      <p className="text-sm text-fg-muted">Format: player auction. Other formats are not part of this version.</p>
      <Button type="submit">Save and continue</Button>
    </form>
  );
}

function RulesStep({ auction, onSaved }: { auction: Auction; onSaved: (result: { ok: true } | { ok: false; error: string }) => void }) {
  const [rules, setRules] = useState<AuctionRules>(auction.rules);
  const set = (patch: Partial<AuctionRules>) => setRules((r) => ({ ...r, ...patch }));

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        onSaved(await auctionService.saveRules(auction.id, rules));
      }}
    >
      <Field label="Purse per team (₹)" required hint="Used for every team unless you set an override.">
        {({ id }) => (
          <Input id={id} type="number" min={1} value={rules.pursePerTeam} onChange={(e) => set({ pursePerTeam: Number(e.target.value) })} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Minimum squad">
          {({ id }) => <Input id={id} type="number" min={1} value={rules.minSquad} onChange={(e) => set({ minSquad: Number(e.target.value) })} />}
        </Field>
        <Field label="Maximum squad">
          {({ id }) => <Input id={id} type="number" min={1} value={rules.maxSquad} onChange={(e) => set({ maxSquad: Number(e.target.value) })} />}
        </Field>
        <Field label="Overseas limit" optional hint="Leave empty for no cap.">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={0}
              value={rules.overseasLimit ?? ""}
              onChange={(e) => set({ overseasLimit: e.target.value === "" ? null : Number(e.target.value) })}
            />
          )}
        </Field>
      </div>
      <Switch
        checked={rules.allowPurseOverride}
        onChange={(allowPurseOverride) => set({ allowPurseOverride })}
        label="Allow a different purse for a team"
        description="Use this when one franchise brings a different budget."
      />
      <Switch
        checked={rules.reserveForMinSquad !== false}
        onChange={(reserveForMinSquad) => set({ reserveForMinSquad })}
        label="Keep purse for the minimum squad"
        description="A team can't bid so much that it can no longer afford base price for the players it still needs."
      />
      <div>
        <p className="text-sm font-medium text-fg">Bid increments</p>
        <p className="mt-1 text-xs text-fg-subtle">The step applies while the current bid is below “Up to”. Leave “Up to” empty on the last slab.</p>
        <ul className="mt-3 space-y-2">
          {rules.increments.map((slab, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                aria-label="Increment applies up to"
                type="number"
                placeholder="No upper limit"
                value={slab.upTo ?? ""}
                onChange={(e) => {
                  const increments = rules.increments.slice();
                  increments[i] = { ...slab, upTo: e.target.value === "" ? null : Number(e.target.value) };
                  set({ increments });
                }}
              />
              <Input
                aria-label="Bid step"
                type="number"
                min={1}
                value={slab.step}
                onChange={(e) => {
                  const increments = rules.increments.slice();
                  increments[i] = { ...slab, step: Number(e.target.value) };
                  set({ increments });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={rules.increments.length === 1}
                onClick={() => set({ increments: rules.increments.filter((_, j) => j !== i) })}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" className="mt-2" onClick={() => set({ increments: [...rules.increments, { upTo: null, step: 10000 }] })}>
          Add slab
        </Button>
      </div>
      <div>
        <p className="text-sm font-medium text-fg">Role limits</p>
        <ul className="mt-3 space-y-2">
          {PLAYER_ROLES.map((role) => {
            const limit = rules.roleLimits.find((r) => r.role === role) ?? { role, min: 0, max: null };
            const write = (patch: Partial<typeof limit>) => {
              const rest = rules.roleLimits.filter((r) => r.role !== role);
              set({ roleLimits: [...rest, { ...limit, ...patch }] });
            };
            return (
              <li key={role} className="grid grid-cols-[8rem_1fr_1fr] items-center gap-2">
                <span className="text-sm text-fg-muted">{ROLE_LABEL[role]}</span>
                <Input aria-label={`${role} minimum`} type="number" min={0} value={limit.min} onChange={(e) => write({ min: Number(e.target.value) })} />
                <Input
                  aria-label={`${role} maximum`}
                  type="number"
                  min={0}
                  placeholder="No max"
                  value={limit.max ?? ""}
                  onChange={(e) => write({ max: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </li>
            );
          })}
        </ul>
      </div>
      <Button type="submit">Save rules</Button>
    </form>
  );
}

function TeamsStep({ auction, onContinue }: { auction: Auction; onContinue: () => void }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Omit<AuctionTeam, "id"> | null>(null);
  const total = auction.teams.reduce((sum, t) => sum + (t.purseOverride ?? auction.rules.pursePerTeam), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-fg-muted">
          {auction.teams.length} teams · combined purse {inr(total)}
        </p>
        <Button
          icon="ri-add-line"
          onClick={() =>
            setDraft({
              name: "",
              shortName: "",
              ownerName: "",
              color: COLORS[auction.teams.length % COLORS.length],
              purseOverride: null,
            })
          }
        >
          Add team
        </Button>
      </div>
      {auction.teams.length === 0 ? (
        <EmptyState icon="ri-team-line" title="No teams yet" description="Add at least two teams before publishing." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {auction.teams.map((team) => (
            <li key={team.id} className="flex items-center gap-3 px-4 py-3">
              <span className="h-8 w-8 shrink-0 rounded-md" style={{ background: team.color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg">
                  {team.name} <span className="font-mono text-xs text-fg-subtle">{team.shortName}</span>
                </p>
                <p className="text-xs text-fg-muted">
                  {team.ownerName || "No representative"} · {inr(team.purseOverride ?? auction.rules.pursePerTeam)}
                  {team.purseOverride != null ? " override" : ""}
                  {team.appTeamId ? " · existing CricsHub team" : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setDraft(team)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const result = await auctionService.removeTeam(auction.id, team.id);
                  if (!result.ok) toast(result.error, { tone: "error" });
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {draft && (
        <TeamEditor
          auction={auction}
          initial={draft}
          teamId={"id" in draft ? (draft as AuctionTeam).id : undefined}
          onClose={() => setDraft(null)}
        />
      )}
      <Button onClick={onContinue}>Continue to players</Button>
    </div>
  );
}

function TeamEditor({
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
  const linked = !!auction.tournamentId;

  useEffect(() => {
    if (linked) fetchMyCricshubTeams().then(setMyTeams);
  }, [linked]);

  return (
    <form
      className="max-w-xl space-y-3 rounded-card border border-line bg-surface p-4"
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
            <Input id={id} value={form.shortName} maxLength={5} onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })} required />
          )}
        </Field>
        <Field label="Representative" optional>
          {({ id }) => <Input id={id} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />}
        </Field>
        <Field label="Colour">
          {({ id }) => <Input id={id} type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 px-1" />}
        </Field>
        {linked && (
          <Field label="Owner phone" optional hint="The owner will manage this team in the CricsHub app.">
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
        )}
        {linked && (
          <Field label="CricsHub team" optional hint="Use one of your existing teams, or leave it to create a new one.">
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
        )}
      </div>
      {auction.rules.allowPurseOverride && (
        <Field label="Purse override (₹)" optional hint={`Leave empty to use ${inr(auction.rules.pursePerTeam)}.`} >
          {({ id }) => (
            <Input
              id={id}
              type="number"
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
  nationality: "India",
  overseas: false,
  category: "B",
  basePrice: 20000,
  matches: 0,
  battingAvg: "",
  bowlingAvg: "",
  phone: "",
};

function PlayersStep({ auction, onContinue }: { auction: Auction; onContinue: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [csv, setCsv] = useState("");
  const [query, setQuery] = useState("");
  const preview = useMemo(() => (csv.trim() ? auctionService.previewCsv(csv) : null), [csv]);
  const rows = auction.players.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      {auction.registration?.enabled && <PendingQueue auction={auction} />}
      <div className="flex flex-wrap gap-2">
        <Input icon="ri-search-line" placeholder="Search players" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search players" className="max-w-xs" />
        <Button variant="outline" onClick={() => setEditing("new")}>
          Add player
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="ri-user-line" title="No players in this list" description="Add players one by one, or paste a CSV below." />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-fg-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Base</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-fg-subtle">{p.overseas ? "Overseas" : p.nationality}</span>
                    {p.source === "registration" && (
                      <Badge tone="primary" className="ml-2">
                        Registered
                      </Badge>
                    )}
                    {auction.tournamentId && (
                      <span className={cn("ml-2 font-mono text-xs", p.phone ? "text-fg-subtle" : "text-danger")}>
                        {p.phone ?? "no phone"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-fg-muted">{ROLE_LABEL[p.role]}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.category}</td>
                  <td className="px-3 py-2 tabular-nums">{inr(p.basePrice)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="xs" variant="ghost" onClick={() => setEditing(p.id)}>
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={async () => {
                        const result = await auctionService.removePlayer(auction.id, p.id);
                        if (!result.ok) toast(result.error, { tone: "error" });
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <PlayerEditor
          auction={auction}
          playerId={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">Import CSV</p>
        <p className="mt-1 text-xs text-fg-subtle">Columns: {csvTemplate().split("\n")[0]}</p>
        <Textarea className="mt-3 font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={csvTemplate()} />
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
          variant="outline"
          disabled={!csv.trim()}
          onClick={async () => {
            const result = await auctionService.importPlayers(auction.id, csv);
            if (!result.ok) toast(result.error, { tone: "error" });
            else {
              toast(`Imported ${result.value.imported} players.`, { tone: "success" });
              if (result.value.errors.length) toast(result.value.errors[0].message, { tone: "warning" });
              setCsv("");
            }
          }}
        >
          Import valid rows
        </Button>
      </div>
      <Button onClick={onContinue}>Review auction</Button>
    </div>
  );
}

function PlayerEditor({ auction, playerId, onClose }: { auction: Auction; playerId?: string; onClose: () => void }) {
  const existing = auction.players.find((p) => p.id === playerId);
  const toast = useToast();
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          role: existing.role,
          nationality: existing.nationality,
          overseas: existing.overseas,
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
      className="max-w-xl space-y-3 rounded-card border border-line bg-surface p-4"
      onSubmit={async (e) => {
        e.preventDefault();
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
        <Field label="Nationality">
          {({ id }) => <Input id={id} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />}
        </Field>
        <Field label="Category">
          {({ id }) => <Input id={id} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />}
        </Field>
        <Field label="Base price (₹)" required>
          {({ id }) => (
            <Input id={id} type="number" min={1} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
          )}
        </Field>
        <Field label="Matches">
          {({ id }) => <Input id={id} type="number" min={0} value={form.matches} onChange={(e) => setForm({ ...form, matches: Number(e.target.value) })} />}
        </Field>
        <Field label="Batting average" optional>
          {({ id }) => <Input id={id} value={form.battingAvg} onChange={(e) => setForm({ ...form, battingAvg: e.target.value })} />}
        </Field>
        <Field label="Bowling average" optional>
          {({ id }) => <Input id={id} value={form.bowlingAvg} onChange={(e) => setForm({ ...form, bowlingAvg: e.target.value })} />}
        </Field>
        <Field
          label="Phone"
          optional={!auction.tournamentId}
          required={!!auction.tournamentId}
          hint={auction.tournamentId ? "Needed to add the player to the CricsHub tournament." : "Optional. Needed only if you later add the squads to a CricsHub tournament."}
        >
          {({ id }) => (
            <Input id={id} inputMode="tel" placeholder="10-digit mobile" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          )}
        </Field>
      </div>
      <Switch checked={form.overseas} onChange={(overseas) => setForm({ ...form, overseas })} label="Overseas player" />
      <div className="flex gap-2">
        <Button type="submit">{playerId ? "Save player" : "Add player"}</Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReviewStep({
  auction,
  issues,
  onEdit,
  onDraft,
  onPublish,
}: {
  auction: Auction;
  issues: ConfigIssue[];
  onEdit: (step: number) => void;
  onDraft: () => void;
  onPublish: () => void;
}) {
  const stepIndex: Record<string, number> = { details: 0, rules: 1, teams: 2, registration: 3, players: 4 };
  // Older servers sent no severity; treat that as blocking.
  const errors = issues.filter((i) => i.severity !== "warning");
  const warnings = issues.filter((i) => i.severity === "warning");
  const list = (items: ConfigIssue[]) => (
    <ul className="mt-1 list-disc pl-4">
      {items.map((issue) => (
        <li key={issue.message}>
          <button type="button" className="text-left underline" onClick={() => onEdit(stepIndex[issue.step] ?? 0)}>
            {issue.message}
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="max-w-2xl space-y-4">
      {errors.length > 0 ? (
        <Alert tone="danger" title="Fix these to publish">
          {list(errors)}
        </Alert>
      ) : (
        <Alert tone="success" title="Ready to schedule">
          Teams, players and rules pass the checks. You can still keep it as a draft.
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert tone="warning" title="Worth a look">
          {list(warnings)}
        </Alert>
      )}
      <dl className="grid gap-3 rounded-card border border-line bg-surface p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-subtle">Auction</dt>
          <dd className="font-medium">{auction.name}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Tournament</dt>
          <dd className="font-medium">
            {auction.tournament || "—"}
            {auction.tournamentId ? <span className="ml-1 text-xs text-fg-subtle">(on CricsHub)</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Teams</dt>
          <dd className="font-medium">{auction.teams.length}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Players</dt>
          <dd className="font-medium">{auction.players.length}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Purse</dt>
          <dd className="font-medium">{inr(auction.rules.pursePerTeam)} each</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Squad</dt>
          <dd className="font-medium">
            {auction.rules.minSquad}–{auction.rules.maxSquad}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onDraft}>
          Save draft
        </Button>
        <Button disabled={errors.length > 0 || auction.status !== "draft"} onClick={onPublish}>
          {auction.status === "draft" ? "Publish" : "Already scheduled"}
        </Button>
      </div>
    </div>
  );
}

function RegistrationStep({ auction, onContinue }: { auction: Auction; onContinue: () => void }) {
  const { data, reload } = useRegistrations(auction);
  return (
    <div className="max-w-3xl space-y-6">
      <RegistrationSettings key={auction.registration?.enabled ? "on" : "off"} auction={auction} editable />
      {auction.registration?.enabled && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold uppercase">Invite links</h2>
          {data ? <InviteLinks auction={auction} links={data.links} onChanged={reload} /> : <p className="text-sm text-fg-muted">Loading links…</p>}
          {auction.status === "draft" && (
            <p className="text-xs text-fg-muted">Players can open the link now; it works best once the auction is published.</p>
          )}
        </section>
      )}
      <Button onClick={onContinue}>Continue to players</Button>
    </div>
  );
}

/** Registrations waiting for a decision, above the pool on the Players step. */
function PendingQueue({ auction }: { auction: Auction }) {
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
