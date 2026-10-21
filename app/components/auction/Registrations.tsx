"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ConfirmDialog, Select, downloadText } from "@/app/components/auction/chrome";
import { Alert, Badge, Button, Card, Checkbox, EmptyState, Field, Input, Modal, Skeleton, Switch, Textarea, useToast } from "@/app/components/ui";
import { formatWhen, fromDateTimeLocal, inr, toDateTimeLocal } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { Auction, InviteLink, RegistrationConfig, RegistrationRow, RegistrationsOverview, RegistrationStatus } from "@/lib/auction/types";
import { REGISTRATION_STATUS_LABEL, ROLE_LABEL } from "@/lib/auction/types";

export const DEFAULT_REGISTRATION: RegistrationConfig = {
  enabled: false,
  opensAt: null,
  closesAt: null,
  cap: null,
  waitlist: true,
  approvalMode: "manual",
  defaultCategory: "B",
  basePrices: { A: 100_000, B: 50_000, C: 20_000 },
  allowSuggestedPrice: false,
  form: { photo: true, dateOfBirth: false, city: true, playingHistory: false, idProof: false },
  customQuestions: [],
  eligibility: { minAge: null, cities: [] },
};

const MAX_QUESTIONS = 5;

export function statusTone(status: RegistrationStatus) {
  return status === "approved" ? "success" : status === "rejected" ? "danger" : status === "pending" ? "warning" : status === "waitlisted" ? "primary" : "neutral";
}

/** Loads the auctioneer's registration overview and reloads it whenever the auction changes. */
export function useRegistrations(auction: Auction) {
  const [data, setData] = useState<RegistrationsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const result = await auctionService.registrations(auction.id);
    if (result.ok) {
      setData(result.value);
      setError(null);
    } else setError(result.error);
  }, [auction.id]);
  const enabled = auction.registration?.enabled === true;
  useEffect(() => {
    if (enabled) void reload();
  }, [reload, enabled, auction.revision]);
  return { data, error, reload };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function RegistrationSettings({ auction, editable }: { auction: Auction; editable: boolean }) {
  const toast = useToast();
  const [cfg, setCfg] = useState<RegistrationConfig>(() => ({ ...DEFAULT_REGISTRATION, ...auction.registration }));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [citiesText, setCitiesText] = useState(() => (auction.registration?.eligibility.cities ?? []).join(", "));
  const dirty = JSON.stringify(cfg) !== JSON.stringify({ ...DEFAULT_REGISTRATION, ...auction.registration });
  const tz = auction.timezone;

  const patch = (p: Partial<RegistrationConfig>) => setCfg((c) => ({ ...c, ...p }));

  const save = async (next = cfg) => {
    setBusy(true);
    const result = await auctionService.saveRegistration(auction.id, next);
    setBusy(false);
    if (!result.ok) {
      setErrors(Object.fromEntries((result.fields ?? []).map((f) => [f.path.replace(/^registration\./, ""), f.message])));
      toast(result.error, { tone: "error" });
      return;
    }
    setErrors({});
    setCfg({ ...DEFAULT_REGISTRATION, ...result.value.registration });
    toast(next.enabled ? "Registration settings saved." : "Self-registration turned off.", { tone: "success" });
  };

  return (
    <div className="space-y-5">
      <Switch
        checked={cfg.enabled}
        disabled={!editable || busy}
        onChange={(enabled) => {
          const next = { ...cfg, enabled };
          setCfg(next);
          void save(next);
        }}
        label="Let players register themselves"
        description="Share an invite link. Players sign in with CricsHub, fill a short form, and you approve them into the pool."
      />
      {cfg.enabled && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opens" optional hint="Leave empty to open now." error={errors.opensAt}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="datetime-local"
                  invalid={invalid}
                  disabled={!editable}
                  value={cfg.opensAt ? toDateTimeLocal(cfg.opensAt, tz) : ""}
                  onChange={(e) => patch({ opensAt: e.target.value ? fromDateTimeLocal(e.target.value, tz) : null })}
                />
              )}
            </Field>
            <Field label="Closes" optional hint="Must be before the auction starts." error={errors.closesAt}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="datetime-local"
                  invalid={invalid}
                  disabled={!editable}
                  value={cfg.closesAt ? toDateTimeLocal(cfg.closesAt, tz) : ""}
                  onChange={(e) => patch({ closesAt: e.target.value ? fromDateTimeLocal(e.target.value, tz) : null })}
                />
              )}
            </Field>
            <Field label="Player cap" optional hint="Pending and approved registrations count." error={errors.cap}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  invalid={invalid}
                  disabled={!editable}
                  value={cfg.cap ?? ""}
                  onChange={(e) => patch({ cap: e.target.value === "" ? null : Number(e.target.value) })}
                />
              )}
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox checked={cfg.waitlist} onChange={(waitlist) => patch({ waitlist })} label="Waitlist when full" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Approval</h3>
            <div className="flex flex-wrap gap-4">
              {(["manual", "auto"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="approvalMode" checked={cfg.approvalMode === mode} disabled={!editable} onChange={() => patch({ approvalMode: mode })} />
                  {mode === "manual" ? "I approve each player" : "Approve automatically"}
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Default category">
                {({ id }) => (
                  <Select id={id} value={cfg.defaultCategory} disabled={!editable} onChange={(e) => patch({ defaultCategory: e.target.value })}>
                    {Object.keys(cfg.basePrices).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
              {Object.entries(cfg.basePrices).map(([cat, price]) => (
                <Field key={cat} label={`Base price · ${cat}`} error={errors[`basePrices.${cat}`]}>
                  {({ id, invalid }) => (
                    <Input
                      id={id}
                      type="number"
                      min={1}
                      invalid={invalid}
                      disabled={!editable}
                      value={price}
                      onChange={(e) => patch({ basePrices: { ...cfg.basePrices, [cat]: Number(e.target.value) } })}
                    />
                  )}
                </Field>
              ))}
            </div>
            <Checkbox checked={cfg.allowSuggestedPrice} onChange={(allowSuggestedPrice) => patch({ allowSuggestedPrice })} label="Players can suggest their base price" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Form</h3>
            <p className="text-xs text-fg-muted">Name, role and cricket details are always asked. Fields already on a player&apos;s CricsHub profile are filled in for them.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Checkbox checked={cfg.form.photo} onChange={(photo) => patch({ form: { ...cfg.form, photo } })} label="Photo" />
              <Checkbox checked={cfg.form.dateOfBirth} onChange={(dateOfBirth) => patch({ form: { ...cfg.form, dateOfBirth } })} label="Date of birth" />
              <Checkbox checked={cfg.form.city} onChange={(city) => patch({ form: { ...cfg.form, city } })} label="City" />
              <Checkbox checked={cfg.form.playingHistory} onChange={(playingHistory) => patch({ form: { ...cfg.form, playingHistory } })} label="Playing history" />
              <Checkbox checked={cfg.form.idProof} onChange={(idProof) => patch({ form: { ...cfg.form, idProof } })} label="ID proof" />
            </div>
            {cfg.form.idProof && (
              <p className="text-xs text-fg-muted">ID documents are sensitive. Ask for them only if you must verify age or residence.</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Your questions</h3>
            {cfg.customQuestions.map((q, i) => (
              <div key={q.id ?? i} className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label={`Question ${i + 1}`}
                  className="flex-1"
                  maxLength={200}
                  value={q.label}
                  invalid={!!errors[`customQuestions[${i}].label`]}
                  disabled={!editable}
                  onChange={(e) => patch({ customQuestions: cfg.customQuestions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                />
                <Checkbox
                  checked={q.required}
                  onChange={(required) => patch({ customQuestions: cfg.customQuestions.map((x, j) => (j === i ? { ...x, required } : x)) })}
                  label="Required"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  icon="ri-delete-bin-line"
                  aria-label="Remove question"
                  disabled={!editable}
                  onClick={() => patch({ customQuestions: cfg.customQuestions.filter((_, j) => j !== i) })}
                />
              </div>
            ))}
            {cfg.customQuestions.length < MAX_QUESTIONS && (
              <Button
                size="sm"
                variant="outline"
                icon="ri-add-line"
                disabled={!editable}
                onClick={() => patch({ customQuestions: [...cfg.customQuestions, { label: "", required: false }] })}
              >
                Add a question
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum age" optional error={errors["eligibility.minAge"]}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  min={5}
                  max={80}
                  invalid={invalid}
                  disabled={!editable}
                  value={cfg.eligibility.minAge ?? ""}
                  onChange={(e) => patch({ eligibility: { ...cfg.eligibility, minAge: e.target.value === "" ? null : Number(e.target.value) } })}
                />
              )}
            </Field>
            <Field label="Only these cities" optional hint="Comma separated. Leave empty for anywhere.">
              {({ id }) => (
                <Input
                  id={id}
                  disabled={!editable}
                  value={citiesText}
                  onChange={(e) => {
                    setCitiesText(e.target.value);
                    const cities = e.target.value.split(",").map((c) => c.trim()).filter(Boolean);
                    patch({ eligibility: { ...cfg.eligibility, cities } });
                  }}
                />
              )}
            </Field>
          </div>

          {editable && (
            <div className="flex justify-end">
              <Button disabled={!dirty || busy} onClick={() => void save()}>
                Save registration settings
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Invite links ────────────────────────────────────────────────────────────

export function InviteLinks({ auction, links, onChanged }: { auction: Auction; links: InviteLink[]; onChanged: () => void }) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState<InviteLink | null>(null);
  const [revoke, setRevoke] = useState<InviteLink | null>(null);

  const share = (link: InviteLink) =>
    `Register for ${auction.name}${auction.tournament ? ` (${auction.tournament})` : ""} on CricsHub: ${link.url}`;

  const copy = async (link: InviteLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast("Link copied.", { tone: "success" });
    } catch {
      toast(link.url, { tone: "info" });
    }
  };

  const create = async () => {
    setBusy(true);
    const result = await auctionService.createInviteLink(auction.id, { label: label.trim() || undefined });
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else {
      setLabel("");
      onChanged();
    }
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {links.map((link) => (
          <li key={link.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {link.label || (link.defaultLink ? "Main link" : "Link")}
                {link.revoked && <Badge tone="danger">Turned off</Badge>}
              </p>
              <p className="truncate font-mono text-xs text-fg-subtle">{link.url}</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {link.opens} opened · {link.signIns} signed in · {link.submitted} registered · {link.approved} approved
              </p>
            </div>
            {!link.revoked && (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" icon="ri-file-copy-line" onClick={() => void copy(link)}>
                  Copy
                </Button>
                <a
                  className="inline-flex h-8 items-center gap-1 rounded-control px-2 text-sm text-fg-muted hover:bg-surface-2"
                  href={`https://wa.me/?text=${encodeURIComponent(share(link))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="ri-whatsapp-line" aria-hidden /> WhatsApp
                </a>
                <Button size="sm" variant="ghost" icon="ri-qr-code-line" onClick={() => setQr(link)}>
                  QR
                </Button>
                {!link.defaultLink && (
                  <Button size="sm" variant="ghost" onClick={() => setRevoke(link)}>
                    Turn off
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Input aria-label="New link label" placeholder="Label, e.g. Club WhatsApp" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} className="max-w-xs" />
        <Button size="sm" variant="outline" icon="ri-add-line" disabled={busy} onClick={() => void create()}>
          New link
        </Button>
      </div>
      <p className="text-xs text-fg-muted">A separate link per channel shows which one brings players in.</p>
      <QrModal link={qr} title={auction.name} onClose={() => setQr(null)} />
      <ConfirmDialog
        open={!!revoke}
        title="Turn off this link?"
        body="People who open it will see that the link doesn't work. Registrations already made through it stay."
        confirmLabel="Turn off"
        danger
        onClose={() => setRevoke(null)}
        onConfirm={async () => {
          if (!revoke) return;
          const result = await auctionService.revokeInviteLink(auction.id, revoke.id);
          setRevoke(null);
          if (!result.ok) toast(result.error, { tone: "error" });
          else onChanged();
        }}
      />
    </div>
  );
}

function QrModal({ link, title, onClose }: { link: InviteLink | null; title: string; onClose: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    setSrc(null);
    if (link) void QRCode.toDataURL(link.url, { width: 320, margin: 1 }).then(setSrc);
  }, [link]);
  return (
    <Modal open={!!link} onClose={onClose} title="Scan to register" size="sm">
      <div className="space-y-3 text-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`QR code for ${link?.url}`} className="mx-auto h-64 w-64 rounded-card bg-white p-2" />
        ) : (
          <Skeleton className="mx-auto h-64 w-64" />
        )}
        <p className="font-mono text-xs text-fg-subtle">{link?.url}</p>
        {src && (
          <a href={src} download={`${title.replace(/\s+/g, "-").toLowerCase()}-invite.png`} className="text-sm text-accent underline">
            Download PNG
          </a>
        )}
      </div>
    </Modal>
  );
}

// ─── Funnel and review queue ─────────────────────────────────────────────────

export function Funnel({ data }: { data: RegistrationsOverview }) {
  const steps = [
    { label: "Opened", value: data.funnel.opens },
    { label: "Signed in", value: data.funnel.signIns },
    { label: "Registered", value: data.funnel.submitted },
    { label: "Approved", value: data.funnel.approved },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((s) => (
        <Card key={s.label} className="p-3">
          <p className="text-xs text-fg-muted">{s.label}</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}

type Filter = RegistrationStatus | "review" | "all";

export function ReviewQueue({ auction, items, onChanged }: { auction: Auction; items: RegistrationRow[]; onChanged: () => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("review");
  const [approve, setApprove] = useState<RegistrationRow | null>(null);
  const [reject, setReject] = useState<RegistrationRow | null>(null);
  const [open, setOpen] = useState<RegistrationRow | null>(null);
  const canDecide = auction.status === "draft" || auction.status === "scheduled";

  const rows = useMemo(
    () => items.filter((r) => (filter === "all" ? true : filter === "review" ? r.status === "pending" || r.status === "waitlisted" : r.status === filter)),
    [items, filter],
  );

  const waitlist = async (r: RegistrationRow) => {
    const result = await auctionService.waitlist(auction.id, r.id);
    if (!result.ok) toast(result.error, { tone: "error" });
    else onChanged();
  };

  const exportCsv = async () => {
    const result = await auctionService.registrationsCsv(auction.id);
    if (!result.ok) toast(result.error, { tone: "error" });
    else downloadText(`${auction.name.replace(/\s+/g, "-").toLowerCase()}-registrations.csv`, result.value);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="max-w-[200px]">
          <option value="review">Needs a decision</option>
          <option value="all">All</option>
          {(Object.keys(REGISTRATION_STATUS_LABEL) as RegistrationStatus[]).map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <span className="text-sm text-fg-muted">{rows.length} shown</span>
        <Button size="sm" variant="outline" icon="ri-download-line" className="ml-auto" disabled={items.length === 0} onClick={() => void exportCsv()}>
          Export CSV
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="ri-user-add-line" title={items.length === 0 ? "No registrations yet" : "Nothing here"} description={items.length === 0 ? "Share your invite link to get players in." : undefined} />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(r)}>
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-subtle">
                    <i className="ri-user-line" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {r.name}
                    <Badge tone={statusTone(r.status)}>{REGISTRATION_STATUS_LABEL[r.status]}</Badge>
                    {r.sameNameAs?.length ? <Badge tone="warning">Same name as {r.sameNameAs.join(", ")}</Badge> : null}
                  </span>
                  <span className="block truncate text-xs text-fg-subtle">
                    {ROLE_LABEL[r.role]}
                    {r.age != null ? ` · ${r.age} yrs` : ""}
                    {r.city ? ` · ${r.city}` : ""}
                    {r.nationality ? ` · ${r.nationality}` : ""}
                    {r.suggestedBasePrice ? ` · asks ${inr(r.suggestedBasePrice)}` : ""}
                  </span>
                </span>
              </button>
              {canDecide && (r.status === "pending" || r.status === "waitlisted") && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => setApprove(r)}>
                    Approve
                  </Button>
                  {r.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => void waitlist(r)}>
                      Waitlist
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setReject(r)}>
                    Reject
                  </Button>
                </div>
              )}
              {canDecide && r.status === "approved" && (
                <Button size="sm" variant="ghost" onClick={() => setReject(r)}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ApproveSheet auction={auction} row={approve} onClose={() => setApprove(null)} onDone={onChanged} />
      <RejectSheet auction={auction} row={reject} onClose={() => setReject(null)} onDone={onChanged} />
      <DetailSheet row={open} timezone={auction.timezone} onClose={() => setOpen(null)} />
    </div>
  );
}

function ApproveSheet({ auction, row, onClose, onDone }: { auction: Auction; row: RegistrationRow | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const cfg = { ...DEFAULT_REGISTRATION, ...auction.registration };
  const [category, setCategory] = useState(cfg.defaultCategory);
  const [price, setPrice] = useState<number>(cfg.basePrices[cfg.defaultCategory] ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    const c = { ...DEFAULT_REGISTRATION, ...auction.registration };
    setCategory(c.defaultCategory);
    setPrice(row.suggestedBasePrice ?? c.basePrices[c.defaultCategory] ?? 0);
  }, [row, auction.registration]);

  const submit = async () => {
    if (!row) return;
    setBusy(true);
    const result = await auctionService.approve(auction.id, row.id, { category, basePrice: price });
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else {
      toast(`${row.name} added to the pool.`, { tone: "success" });
      onClose();
      onDone();
    }
  };

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={row ? `Approve ${row.name}` : "Approve"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || price <= 0} onClick={() => void submit()}>
            Add to pool
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Category">
          {({ id }) => (
            <Select
              id={id}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPrice(cfg.basePrices[e.target.value] ?? price);
              }}
            >
              {Object.keys(cfg.basePrices).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Base price (₹)" hint={row?.suggestedBasePrice ? `Player asked for ${inr(row.suggestedBasePrice)}.` : undefined}>
          {({ id }) => <Input id={id} type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />}
        </Field>
      </div>
    </Modal>
  );
}

function RejectSheet({ auction, row, onClose, onDone }: { auction: Auction; row: RegistrationRow | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setReason(""), [row]);
  const removing = row?.status === "approved";
  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={row ? `${removing ? "Remove" : "Reject"} ${row.name}?` : "Reject"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!row) return;
              setBusy(true);
              const result = await auctionService.reject(auction.id, row.id, reason);
              setBusy(false);
              if (!result.ok) toast(result.error, { tone: "error" });
              else {
                onClose();
                onDone();
              }
            }}
          >
            {removing ? "Remove" : "Reject"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          {removing ? "They leave the player pool. " : ""}The player is told they weren&apos;t selected. If anyone is waitlisted, the first in line moves up.
        </p>
        <Field label="Reason" optional hint="Shown to the player.">
          {({ id }) => <Textarea id={id} maxLength={500} className="min-h-[80px]" value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  );
}

function DetailSheet({ row, timezone, onClose }: { row: RegistrationRow | null; timezone: string; onClose: () => void }) {
  const lines: [string, string | number | undefined][] = row
    ? [
        ["Phone", row.phone],
        ["Date of birth", row.dateOfBirth ? `${row.dateOfBirth}${row.age != null ? ` (${row.age})` : ""}` : undefined],
        ["City", row.city],
        ["Role", ROLE_LABEL[row.role]],
        ["Batting", row.battingHand],
        ["Bowling", row.bowlingStyle],
        ["Nationality", row.nationality],
        ["Matches", row.matches],
        ["Batting avg", row.battingAvg],
        ["Bowling avg", row.bowlingAvg],
        ["Asked base price", row.suggestedBasePrice ? inr(row.suggestedBasePrice) : undefined],
        ["Via link", row.link],
        ["Registered", formatWhen(row.submittedAt, timezone)],
      ]
    : [];
  return (
    <Modal open={!!row} onClose={onClose} title={row?.name ?? ""} size="md">
      {row && (
        <div className="space-y-4 text-sm">
          {row.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.photoUrl} alt="" className="h-28 w-28 rounded-card object-cover" />
          )}
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {lines
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-fg-subtle">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          {row.playingHistory && (
            <div>
              <p className="text-fg-subtle">Playing history</p>
              <p className="whitespace-pre-line">{row.playingHistory}</p>
            </div>
          )}
          {Object.keys(row.answers).length > 0 && (
            <div className="space-y-1">
              <p className="text-fg-subtle">Answers</p>
              {Object.entries(row.answers).map(([q, a]) => (
                <p key={q}>{a}</p>
              ))}
            </div>
          )}
          {row.idProofUrl && (
            <a href={row.idProofUrl} target="_blank" rel="noreferrer" className="text-accent underline">
              View ID proof
            </a>
          )}
          {row.reason && <Alert tone="warning" title="Reason given">{row.reason}</Alert>}
        </div>
      )}
    </Modal>
  );
}

/** Registrations tab: funnel, links and the review queue. */
export function RegistrationsPanel({ auction }: { auction: Auction }) {
  const { data, error, reload } = useRegistrations(auction);
  if (!auction.registration?.enabled) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-fg-muted">Self-registration is off. Turn it on to share an invite link with players.</p>
        <RegistrationSettings auction={auction} editable={auction.status === "draft" || auction.status === "scheduled"} />
      </Card>
    );
  }
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-6">
      <Funnel data={data} />
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold uppercase">Invite links</h2>
        <InviteLinks auction={auction} links={data.links} onChanged={reload} />
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold uppercase">Registrations</h2>
        <ReviewQueue auction={auction} items={data.items} onChanged={reload} />
      </section>
      <details className="rounded-card border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">Registration settings</summary>
        <div className="mt-4">
          <RegistrationSettings auction={auction} editable={auction.status === "draft" || auction.status === "scheduled"} />
        </div>
      </details>
    </div>
  );
}
