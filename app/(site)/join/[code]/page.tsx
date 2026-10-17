"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SiteHeader from "@/app/components/layout/SiteHeader";
import { Select } from "@/app/components/auction/chrome";
import { Alert, Badge, Button, ButtonLink, Card, Checkbox, EmptyState, Field, Input, Skeleton, Textarea, useToast } from "@/app/components/ui";
import { uploadFile } from "@/lib/api";
import { formatWhen, inr } from "@/lib/auction/format";
import { clearPendingInvite, normalizeInviteCode, savePendingInvite } from "@/lib/auction/invite";
import { auctionService } from "@/lib/auction/store";
import type { InviteCard, InviteResolution, InviteState, MyRegistration, PlayerRole, RegistrationSubmit } from "@/lib/auction/types";
import { PLAYER_ROLES, REGISTRATION_STATUS_LABEL, ROLE_LABEL } from "@/lib/auction/types";
import { getStoredUser, requestLogin } from "@/lib/session";

/** Screens where the player can't register, with what to tell them. */
const BLOCKED: Partial<Record<InviteState, { icon: string; title: string; body: string }>> = {
  LINK_INVALID: { icon: "ri-link-unlink", title: "This link doesn't work", body: "It may have expired or been turned off. Ask the organiser for a new one." },
  NOT_OPEN: { icon: "ri-time-line", title: "Registration hasn't opened yet", body: "Come back when it opens." },
  CLOSED: { icon: "ri-lock-line", title: "Registration is closed", body: "The organiser is no longer taking registrations." },
  FULL: { icon: "ri-group-line", title: "Registration is full", body: "Every place is taken." },
  NOT_ELIGIBLE: { icon: "ri-user-forbid-line", title: "You can't register for this auction", body: "You don't meet the organiser's requirements." },
  AUCTION_CANCELLED: { icon: "ri-close-circle-line", title: "This auction was cancelled", body: "There's nothing to register for." },
};

type Step = "details" | "cricket" | "review";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const code = normalizeInviteCode(params.code);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [card, setCard] = useState<InviteCard | null>(null);
  const [resolution, setResolution] = useState<InviteResolution | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = getStoredUser();
    setSignedIn(!!user);
    if (user) {
      const result = await auctionService.resolveInvite(code);
      if (result.ok) {
        setResolution(result.value);
        if (result.value.invite) setCard(result.value.invite);
        return;
      }
      // Session expired on the server: fall back to the public card.
      if (result.code !== "UNAUTHENTICATED") {
        setFailed(result.error);
        return;
      }
      setSignedIn(false);
    }
    const result = await auctionService.inviteCard(code);
    if (result.ok) setCard(result.value);
    else setFailed(result.error);
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <SiteHeader />
      <main className="container-page max-w-2xl space-y-6 py-8 sm:py-12">
        {failed ? (
          <EmptyState icon="ri-error-warning-line" title="Couldn't open this invite" description={failed} action={<Button onClick={() => void load()}>Try again</Button>} />
        ) : !card ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <InviteHeader card={card} />
            {signedIn === false ? (
              <SignInPrompt card={card} code={code} />
            ) : !resolution ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <Resolved code={code} resolution={resolution} onChanged={load} />
            )}
          </>
        )}
      </main>
    </>
  );
}

function InviteHeader({ card }: { card: InviteCard }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">Player registration</p>
      <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-wide">{card.auctionName ?? "Auction"}</h1>
      {card.tournament && <p className="mt-1 text-fg-muted">{card.tournament}</p>}
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {card.startsAt && (
          <div>
            <dt className="text-fg-subtle">Auction</dt>
            <dd>{formatWhen(card.startsAt, card.timezone)}</dd>
          </div>
        )}
        {card.organiser && (
          <div>
            <dt className="text-fg-subtle">Organiser</dt>
            <dd>{card.organiser}</dd>
          </div>
        )}
        {card.closesAt && (
          <div>
            <dt className="text-fg-subtle">Registration closes</dt>
            <dd>{formatWhen(card.closesAt, card.timezone)}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

function SignInPrompt({ card, code }: { card: InviteCard; code: string }) {
  const blocked = BLOCKED[card.state];
  if (blocked) return <Blocked state={card.state} />;
  return (
    <Card className="space-y-3 text-center">
      <p className="text-fg-muted">Sign in with your phone number to register. We&apos;ll fill in what your CricsHub profile already has.</p>
      <Button
        icon="ri-login-box-line"
        onClick={() => {
          savePendingInvite(code, card.auctionName);
          requestLogin(`/join/${code}`);
        }}
      >
        Sign in to register
      </Button>
    </Card>
  );
}

function Blocked({ state, message }: { state: InviteState; message?: string }) {
  const b = BLOCKED[state];
  if (!b) return null;
  return <EmptyState icon={b.icon} title={b.title} description={message || b.body} action={<ButtonLink href="/auctions" variant="outline">Go to auctions</ButtonLink>} />;
}

function Resolved({ code, resolution, onChanged }: { code: string; resolution: InviteResolution; onChanged: () => void }) {
  useEffect(() => {
    if (resolution.state !== "CAN_REGISTER" && resolution.state !== "WAITLIST_AVAILABLE") clearPendingInvite();
  }, [resolution.state]);

  if (resolution.registration) return <StatusCard registration={resolution.registration} onChanged={onChanged} />;
  if (BLOCKED[resolution.state]) return <Blocked state={resolution.state} message={resolution.message} />;
  if (!resolution.form) return null;
  return <RegistrationForm code={code} resolution={resolution} onDone={onChanged} />;
}

function StatusCard({ registration, onChanged }: { registration: MyRegistration; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const live = registration.auctionStatus === "live" || registration.auctionStatus === "paused";
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase">Your registration</h2>
        <Badge tone={registration.status === "approved" ? "success" : registration.status === "rejected" ? "danger" : registration.status === "pending" ? "warning" : "neutral"}>
          {REGISTRATION_STATUS_LABEL[registration.status]}
        </Badge>
      </div>
      <p className="text-sm text-fg-muted">
        {registration.soldToTeam
          ? `Sold to ${registration.soldToTeam}${registration.soldPrice != null ? ` for ${inr(registration.soldPrice)}` : ""}.`
          : registration.status === "pending"
            ? "The organiser will review it. We'll notify you when they decide."
            : registration.status === "approved"
              ? "You're in the player pool. Watch the auction to see when you're up."
              : registration.status === "waitlisted"
                ? "You're on the waitlist. You'll move into the pool if a place opens up."
                : registration.status === "rejected"
                  ? registration.reason || "The organiser didn't select you for this auction."
                  : registration.status === "withdrawn"
                    ? "You withdrew from this auction."
                    : "Registration closed before the organiser decided."}
      </p>
      <div className="flex flex-wrap gap-2">
        {(registration.status === "approved" || live) && (
          <ButtonLink href={`/auctions/${registration.auctionId}/watch`} icon={live ? "ri-broadcast-line" : "ri-eye-line"}>
            {live ? "Watch live" : "Open auction"}
          </ButtonLink>
        )}
        {registration.canWithdraw && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Withdraw from this auction? You can't register again with this link.")) return;
              setBusy(true);
              const result = await auctionService.withdrawRegistration(registration.id);
              setBusy(false);
              if (!result.ok) toast(result.error, { tone: "error" });
              else {
                toast("You've withdrawn.", { tone: "success" });
                onChanged();
              }
            }}
          >
            Withdraw
          </Button>
        )}
        <ButtonLink href="/auctions/registrations" variant="ghost">
          All my registrations
        </ButtonLink>
      </div>
    </Card>
  );
}

function RegistrationForm({ code, resolution, onDone }: { code: string; resolution: InviteResolution; onDone: () => void }) {
  const toast = useToast();
  const form = resolution.form!;
  const prefill = resolution.prefill ?? {};
  const [step, setStep] = useState<Step>("details");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"photo" | "id" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<RegistrationSubmit>({
    name: prefill.name ?? "",
    photoUrl: prefill.photoUrl ?? "",
    dateOfBirth: prefill.dateOfBirth ?? "",
    city: prefill.city ?? "",
    role: "BAT",
    battingHand: prefill.battingHand ?? "",
    bowlingStyle: prefill.bowlingStyle ?? "",
    nationality: "",
    answers: {},
    acceptTerms: false,
  });
  const set = <K extends keyof RegistrationSubmit>(key: K, value: RegistrationSubmit[K]) => setValues((v) => ({ ...v, [key]: value }));

  const needDob = form.fields.dateOfBirth || form.minAge != null;
  const needCity = form.fields.city || form.cities.length > 0;
  const waitlist = resolution.state === "WAITLIST_AVAILABLE";

  const upload = async (file: File | undefined, kind: "photo" | "id") => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Choose a file under 5 MB.", { tone: "error" });
      return;
    }
    setUploading(kind);
    try {
      const url = await uploadFile(file);
      set(kind === "photo" ? "photoUrl" : "idProofUrl", url);
    } catch {
      toast("Upload failed. Try again.", { tone: "error" });
    } finally {
      setUploading(null);
    }
  };

  /** Client checks mirror the server so most mistakes are caught before submitting. */
  const check = (which: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (which === "details") {
      if (!prefill.name && !values.name?.trim()) e.name = "Enter your name.";
      if (form.fields.photo && !prefill.photoUrl && !values.photoUrl) e.photoUrl = "Add a photo.";
      if (needDob && !prefill.dateOfBirth && !values.dateOfBirth) e.dateOfBirth = "Enter your date of birth.";
      if (needCity && !prefill.city && !values.city?.trim()) e.city = "Enter your city.";
    }
    if (which === "cricket") {
      if (form.fields.idProof && !values.idProofUrl) e.idProofUrl = "Upload your ID proof.";
      if (values.matches != null && values.matches < 0) e.matches = "Matches can't be negative.";
      for (const q of form.customQuestions) {
        if (q.required && q.id && !values.answers[q.id]?.trim()) e[`answers.${q.id}`] = `Answer: ${q.label}`;
      }
    }
    if (which === "review" && !values.acceptTerms) e.acceptTerms = "Accept the terms to register.";
    return e;
  };

  const next = (from: Step, to: Step) => {
    const e = check(from);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(to);
  };

  const submit = async () => {
    const e = { ...check("details"), ...check("cricket"), ...check("review") };
    setErrors(e);
    if (Object.keys(e).length) {
      setStep(e.name || e.photoUrl || e.dateOfBirth || e.city ? "details" : e.acceptTerms ? "review" : "cricket");
      return;
    }
    setBusy(true);
    const blank = (s?: string) => (s && s.trim() ? s.trim() : undefined);
    const result = await auctionService.register(code, {
      ...values,
      name: blank(values.name),
      photoUrl: blank(values.photoUrl),
      dateOfBirth: blank(values.dateOfBirth),
      city: blank(values.city),
      battingHand: blank(values.battingHand),
      bowlingStyle: blank(values.bowlingStyle),
      nationality: blank(values.nationality),
      battingAvg: blank(values.battingAvg),
      bowlingAvg: blank(values.bowlingAvg),
      playingHistory: blank(values.playingHistory),
    });
    setBusy(false);
    if (!result.ok) {
      if (result.fields?.length) {
        setErrors(Object.fromEntries(result.fields.map((f) => [f.path, f.message])));
        const first = result.fields[0].path;
        setStep(["name", "photoUrl", "dateOfBirth", "city"].includes(first) ? "details" : first === "acceptTerms" ? "review" : "cricket");
      }
      toast(result.error, { tone: "error" });
      if (!result.fields?.length) onDone(); // state changed (closed, full…): show the right screen
      return;
    }
    clearPendingInvite();
    toast(result.value.status === "approved" ? "You're in the player pool!" : "Registration sent.", { tone: "success" });
    onDone();
  };

  const steps: { key: Step; label: string }[] = [
    { key: "details", label: "Your details" },
    { key: "cricket", label: "Cricket" },
    { key: "review", label: "Review" },
  ];

  return (
    <Card className="space-y-5">
      {waitlist && (
        <Alert tone="warning" title="Registration is full">
          You can join the waitlist. You&apos;ll move into the pool if a place opens up.
        </Alert>
      )}
      <ol className="flex gap-2 text-sm" aria-label="Steps">
        {steps.map((s, i) => (
          <li key={s.key} aria-current={step === s.key ? "step" : undefined} className={step === s.key ? "font-semibold text-fg" : "text-fg-subtle"}>
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {step === "details" && (
        <div className="space-y-4">
          <Field label="Name" required error={errors.name} hint={prefill.name ? "From your CricsHub profile." : undefined}>
            {({ id, invalid }) => <Input id={id} invalid={invalid} value={values.name} readOnly={!!prefill.name} onChange={(e) => set("name", e.target.value)} />}
          </Field>
          {form.fields.photo && (
            <Field label="Photo" required error={errors.photoUrl} hint={prefill.photoUrl ? "From your CricsHub profile." : "A clear face photo. Teams see it during the auction."}>
              {({ id }) => (
                <div className="flex items-center gap-3">
                  {values.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values.photoUrl} alt="" className="h-16 w-16 rounded-card object-cover" />
                  )}
                  {!prefill.photoUrl && (
                    <input id={id} type="file" accept="image/*" disabled={uploading != null} onChange={(e) => void upload(e.target.files?.[0], "photo")} className="text-sm" />
                  )}
                  {uploading === "photo" && <span className="text-sm text-fg-muted">Uploading…</span>}
                </div>
              )}
            </Field>
          )}
          {needDob && (
            <Field
              label="Date of birth"
              required
              error={errors.dateOfBirth}
              hint={prefill.dateOfBirth ? "From your CricsHub profile." : form.minAge != null ? `Players must be at least ${form.minAge}.` : "Only the organiser sees this."}
            >
              {({ id, invalid }) => (
                <Input id={id} type="date" invalid={invalid} value={values.dateOfBirth} readOnly={!!prefill.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("dateOfBirth", e.target.value)} />
              )}
            </Field>
          )}
          {needCity && (
            <Field
              label="City"
              required
              error={errors.city}
              hint={prefill.city ? "From your CricsHub profile." : form.cities.length ? `Open to players from ${form.cities.join(", ")}.` : undefined}
            >
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={values.city} readOnly={!!prefill.city} onChange={(e) => set("city", e.target.value)} />}
            </Field>
          )}
          <div className="flex justify-end">
            <Button disabled={uploading != null} onClick={() => next("details", "cricket")}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === "cricket" && (
        <div className="space-y-4">
          <Field label="Role" required error={errors.role}>
            {({ id }) => (
              <Select id={id} value={values.role} onChange={(e) => set("role", e.target.value as PlayerRole)}>
                {PLAYER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Batting hand" optional>
              {({ id }) => (
                <Select id={id} value={values.battingHand} disabled={!!prefill.battingHand} onChange={(e) => set("battingHand", e.target.value)}>
                  <option value="">—</option>
                  {prefill.battingHand && !["Right", "Left"].includes(prefill.battingHand) && <option value={prefill.battingHand}>{prefill.battingHand}</option>}
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                </Select>
              )}
            </Field>
            <Field label="Bowling style" optional>
              {({ id }) => <Input id={id} placeholder="Right-arm medium" value={values.bowlingStyle} readOnly={!!prefill.bowlingStyle} onChange={(e) => set("bowlingStyle", e.target.value)} />}
            </Field>
            <Field label="Matches played" optional error={errors.matches}>
              {({ id, invalid }) => (
                <Input id={id} type="number" min={0} invalid={invalid} value={values.matches ?? ""} onChange={(e) => set("matches", e.target.value === "" ? undefined : Number(e.target.value))} />
              )}
            </Field>
            <Field label="Nationality" optional hint="Leave blank if you're from the host country.">
              {({ id }) => <Input id={id} value={values.nationality} onChange={(e) => set("nationality", e.target.value)} />}
            </Field>
            <Field label="Batting average" optional>
              {({ id }) => <Input id={id} inputMode="decimal" value={values.battingAvg ?? ""} onChange={(e) => set("battingAvg", e.target.value)} />}
            </Field>
            <Field label="Bowling average" optional>
              {({ id }) => <Input id={id} inputMode="decimal" value={values.bowlingAvg ?? ""} onChange={(e) => set("bowlingAvg", e.target.value)} />}
            </Field>
            {form.allowSuggestedPrice && (
              <Field label="Your base price (₹)" optional hint="The organiser decides the final base price." error={errors.suggestedBasePrice}>
                {({ id, invalid }) => (
                  <Input id={id} type="number" min={1} invalid={invalid} value={values.suggestedBasePrice ?? ""} onChange={(e) => set("suggestedBasePrice", e.target.value === "" ? undefined : Number(e.target.value))} />
                )}
              </Field>
            )}
          </div>
          {form.fields.playingHistory && (
            <Field label="Playing history" optional hint="Teams and tournaments you've played for.">
              {({ id }) => <Textarea id={id} maxLength={2000} value={values.playingHistory ?? ""} onChange={(e) => set("playingHistory", e.target.value)} />}
            </Field>
          )}
          {form.fields.idProof && (
            <Field label="ID proof" required error={errors.idProofUrl} hint="Only the organiser sees this.">
              {({ id }) => (
                <div className="flex items-center gap-3">
                  <input id={id} type="file" accept="image/*,application/pdf" disabled={uploading != null} onChange={(e) => void upload(e.target.files?.[0], "id")} className="text-sm" />
                  {uploading === "id" ? <span className="text-sm text-fg-muted">Uploading…</span> : values.idProofUrl ? <Badge tone="success">Uploaded</Badge> : null}
                </div>
              )}
            </Field>
          )}
          {form.customQuestions.map((q) =>
            q.id ? (
              <Field key={q.id} label={q.label} required={q.required} optional={!q.required} error={errors[`answers.${q.id}`]}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    maxLength={500}
                    value={values.answers[q.id!] ?? ""}
                    onChange={(e) => set("answers", { ...values.answers, [q.id!]: e.target.value })}
                  />
                )}
              </Field>
            ) : null,
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button disabled={uploading != null} onClick={() => next("cricket", "review")}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Name" value={values.name} />
            {needDob && <Row label="Date of birth" value={values.dateOfBirth} />}
            {needCity && <Row label="City" value={values.city} />}
            <Row label="Role" value={ROLE_LABEL[values.role]} />
            <Row label="Batting hand" value={values.battingHand} />
            <Row label="Bowling style" value={values.bowlingStyle} />
            <Row label="Matches" value={values.matches?.toString()} />
            {form.allowSuggestedPrice && <Row label="Your base price" value={values.suggestedBasePrice ? inr(values.suggestedBasePrice) : undefined} />}
            {form.customQuestions.map((q) => (q.id ? <Row key={q.id} label={q.label} value={values.answers[q.id]} /> : null))}
          </dl>
          <p className="text-xs text-fg-muted">
            Teams and spectators see your name, photo and cricket details during the auction. Your phone number, date of birth, city and ID proof are shared
            only with the organiser. New details you entered are saved to your CricsHub profile.
          </p>
          <div>
            <Checkbox
              checked={values.acceptTerms}
              onChange={(v) => {
                set("acceptTerms", v);
                if (v) setErrors(({ acceptTerms: _, ...rest }) => rest);
              }}
              label={
                <span className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms-of-service" className="text-accent underline" target="_blank">
                    terms
                  </Link>{" "}
                  and that the organiser can contact me about this auction.
                </span>
              }
            />
            {errors.acceptTerms && <p className="mt-1 text-xs font-medium text-danger">{errors.acceptTerms}</p>}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("cricket")}>
              Back
            </Button>
            <Button disabled={busy} onClick={() => void submit()}>
              {waitlist ? "Join the waitlist" : "Register"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
