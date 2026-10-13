"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  getSubscriptionQrInfo,
  getAddonQrInfo,
  getBundleQrInfo,
  createSubscriptionIntent,
  createAddonIntent,
  createBundleManualIntent,
  submitUtr,
  pollManualPaymentStatus,
  checkPendingSubscription,
  checkPendingAddon,
  checkPendingBundle,
  cancelManualPayment,
} from "@/lib/api";
import { Alert, Button, Field, Input, Modal, Skeleton, buttonClasses, cn } from "@/app/components/ui";

// npm install qrcode @types/qrcode

type CheckoutStep =
  | "loading"
  | "qr"
  | "utr" // PENDING_UTR  — user clicked "I've Paid", DB record exists, no UTR yet
  | "pending" // PENDING_VERIFICATION — UTR submitted, waiting for owner
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "error";

interface UpiCheckoutModalProps {
  onClose: () => void;
  onConfirmed: () => void;
  subscriptionPlan?: "MONTHLY" | "SIX_MONTH";
  addonPayload?: {
    matchId: string;
    templateId: string;
    templateName: string;
    tier: string;
    amount: number;
  };
  bundlePayload?: {
    matchId: string;
    bundleId: string;
    bundleName: string;
    amount: number;
  };
  userId: string;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function UpiCheckoutModal({
  onClose,
  onConfirmed,
  subscriptionPlan,
  addonPayload,
  bundlePayload,
  userId,
}: UpiCheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState(0);
  const [utrInput, setUtrInput] = useState("");
  const [utrError, setUtrError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [existingUtr, setExistingUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // UI-only: shows a loading state on "I've paid" while the intent is created
  const [proceeding, setProceeding] = useState(false);
  // Display-only: the raw upi:// string, used for the "Open UPI app" deep link on phones
  const [upiLink, setUpiLink] = useState("");

  // ── On open: check for any existing pending record ────────────────────────
  // PENDING_UTR          → resume UTR entry screen (clicked "I've Paid" but refreshed before submitting UTR)
  // PENDING_VERIFICATION → resume waiting screen   (UTR submitted, awaiting owner)
  // nothing              → show QR fresh           (no DB write yet)
  useEffect(() => {
    (async () => {
      try {
        let pending = null;
        if (subscriptionPlan) {
          pending = await checkPendingSubscription(userId, subscriptionPlan);
        } else if (addonPayload) {
          pending = await checkPendingAddon(
            userId,
            addonPayload.matchId,
            addonPayload.templateId,
          );
        } else if (bundlePayload) {
          pending = await checkPendingBundle(
            userId,
            bundlePayload.matchId,
            bundlePayload.bundleId,
          );
        }

        if (pending) {
          setPaymentId(pending.paymentId);
          setAmount(pending.amount);
          if (pending.utrNumber) setExistingUtr(pending.utrNumber);

          // Always load QR info — needed if user goes back from UTR screen
          await loadQrInfo();

          if (pending.status === "PENDING_UTR") {
            setStep("utr");
          } else {
            setStep("pending");
          }
          return;
        }

        // No pending — show QR fresh
        await loadQrInfo();
        setStep("qr");
      } catch (err: any) {
        setErrorMessage(err.message || "Could not load payment info.");
        setStep("error");
      }
    })();
  }, []);

  const loadQrInfo = async () => {
    let data;
    if (subscriptionPlan) {
      data = await getSubscriptionQrInfo(subscriptionPlan);
    } else if (addonPayload) {
      data = await getAddonQrInfo(addonPayload.amount);
    } else if (bundlePayload) {
      data = await getBundleQrInfo(bundlePayload.amount);
    } else {
      throw new Error("No payment target provided.");
    }
    setUpiId(data.upiId);
    // Backend no longer applies GST — amountWithGst === amount, use either field
    setAmount(data.amountWithGst);
    setUpiLink(typeof data.upiString === "string" ? data.upiString : "");
    const qr = await QRCode.toDataURL(data.upiString, {
      width: 240,
      margin: 2,
      // Pure black-on-white: QR modules must stay maximum-contrast for scanners (functional, not theme chrome)
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(qr);
  };

  // ── Poll for confirmation ─────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "pending" || !paymentId) return;
    const interval = setInterval(async () => {
      try {
        const status = await pollManualPaymentStatus(paymentId);
        if (status.status === "CONFIRMED") {
          setStep("confirmed");
          clearInterval(interval);
          setTimeout(onConfirmed, 2500);
        } else if (status.status === "REJECTED") {
          setStep("rejected");
          clearInterval(interval);
        } else if (status.status === "CANCELLED") {
          setStep("cancelled");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [step, paymentId, onConfirmed]);

  // ── "I've Paid" clicked — create PENDING_UTR intent in DB ────────────────
  const handleIvePaid = async () => {
    try {
      let result;
      if (subscriptionPlan) {
        result = await createSubscriptionIntent(userId, subscriptionPlan);
      } else if (addonPayload) {
        result = await createAddonIntent(addonPayload.matchId, {
          userId,
          ...addonPayload,
        });
      } else if (bundlePayload) {
        result = await createBundleManualIntent({
          userId,
          ...bundlePayload,
        });
      } else {
        throw new Error("No payment target.");
      }
      setPaymentId(result.paymentId);
      setStep("utr");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to proceed. Please try again.");
      setStep("error");
    }
  };

  // ── Submit UTR — transitions PENDING_UTR → PENDING_VERIFICATION ──────────
  const handleSubmitUtr = async () => {
    const cleaned = utrInput.trim();
    if (cleaned.length < 6) {
      setUtrError("Please enter a valid UTR number (at least 6 characters).");
      return;
    }
    setUtrError("");
    setSubmitting(true);
    try {
      await submitUtr(paymentId, cleaned);
      setExistingUtr(cleaned);
      setStep("pending");
    } catch (err: any) {
      setUtrError(err.message || "Failed to submit UTR. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel payment ────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelManualPayment(paymentId, userId);
      setStep("cancelled");
      setShowCancelConfirm(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText(upiId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = subscriptionPlan
    ? subscriptionPlan === "MONTHLY"
      ? "Monthly Subscription"
      : "6-Month Bundle"
    : bundlePayload
      ? bundlePayload.bundleName
      : (addonPayload?.templateName ?? "Premium Overlay");

  const canDismiss = [
    "qr",
    "error",
    "confirmed",
    "rejected",
    "cancelled",
  ].includes(step);

  const progressIndex = step === "qr" ? 0 : step === "utr" ? 1 : step === "pending" ? 2 : -1;
  const showUpiDeepLink = upiLink.startsWith("upi://");

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={canDismiss}
      hideClose={!canDismiss}
      size="md"
      title="Pay via UPI"
      description={title}
      icon={
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-lg text-primary-soft-fg">
          <i className="ri-qr-code-line" aria-hidden />
        </span>
      }
    >
      {progressIndex >= 0 && <CheckoutProgress current={progressIndex} />}

      {/* LOADING */}
      {step === "loading" && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-[72px] w-full rounded-xl" />
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-[228px] w-[228px] rounded-card" />
            <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
              <i className="ri-loader-4-line animate-spin text-primary" aria-hidden />
              Loading payment info…
            </p>
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {/* QR */}
      {step === "qr" && (
        <div className="space-y-4 animate-fade-in">
          {/* Single flat amount — no GST breakdown */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-fg-muted">Amount to pay</p>
              <p className="mt-1 font-display text-4xl font-bold leading-none tabular-nums text-fg">
                {fmt(amount)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-soft-fg">
              <i className="ri-shield-check-line" aria-hidden />
              No extra fees
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            {/* QR stays on a white tile in both themes so every scanner can read it */}
            <div className="rounded-card border border-line bg-white p-3 shadow-card">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR code to pay ${fmt(amount)}`}
                  width={200}
                  height={200}
                  className="block h-[200px] w-[200px] rounded-lg"
                />
              ) : (
                <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-black/5" aria-hidden />
              )}
            </div>
            <p className="text-center text-xs text-fg-subtle">
              Scan with PhonePe, GPay, Paytm, or BHIM
            </p>
          </div>

          {showUpiDeepLink && (
            <a
              href={upiLink}
              className={buttonClasses({ variant: "outline", size: "md", block: true, className: "sm:hidden" })}
            >
              <i className="ri-smartphone-line text-[1.1em]" aria-hidden />
              Open in a UPI app
            </a>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <i className="ri-bank-card-line flex-shrink-0 text-lg text-fg-subtle" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">UPI ID</p>
              <p className="truncate font-mono text-sm font-medium text-fg">{upiId}</p>
            </div>
            <button
              type="button"
              onClick={copyUpiId}
              aria-label={copied ? "UPI ID copied" : "Copy UPI ID"}
              className={cn(
                "inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                copied
                  ? "bg-success-soft text-success-soft-fg"
                  : "border border-line-strong bg-surface text-fg hover:bg-surface-2",
              )}
            >
              <i className={copied ? "ri-check-line" : "ri-file-copy-line"} aria-hidden />
              {copied ? "Copied!" : "Copy"}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? "UPI ID copied to clipboard" : ""}
            </span>
          </div>

          <ol className="space-y-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            <InstructionStep n={1}>
              Pay <strong className="font-medium text-fg">{fmt(amount)}</strong> to the UPI ID above
            </InstructionStep>
            <InstructionStep n={2}>
              Note the <strong className="font-medium text-fg">UTR / transaction reference number</strong>
            </InstructionStep>
            <InstructionStep n={3}>Click &ldquo;I&rsquo;ve paid&rdquo; and enter the UTR</InstructionStep>
          </ol>

          <Button
            onClick={async () => {
              setProceeding(true);
              try {
                await handleIvePaid();
              } finally {
                setProceeding(false);
              }
            }}
            loading={proceeding}
            disabled={proceeding}
            size="lg"
            block
            icon="ri-check-double-line"
          >
            {proceeding ? "Preparing…" : <>I&rsquo;ve paid — enter UTR</>}
          </Button>
        </div>
      )}

      {/* UTR ENTRY — PENDING_UTR state, DB record exists */}
      {step === "utr" &&
        (!showCancelConfirm ? (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-semibold text-fg">Enter your UTR number</h3>
              <p className="mt-0.5 text-sm text-fg-muted">
                Find this in your UPI app under the payment receipt.
              </p>
            </div>

            <Field
              label="UTR / transaction reference number"
              hint="12-digit number in your UPI app → Payment history → Receipt"
              error={utrError || undefined}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={utrInput}
                  onChange={(e) => {
                    setUtrInput(e.target.value);
                    setUtrError("");
                  }}
                  placeholder="e.g. 425123456789"
                  className="h-12 font-mono text-base tracking-wide"
                  autoFocus
                  data-autofocus
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitUtr()}
                />
              )}
            </Field>

            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-sm">
              <span className="text-fg-muted">Amount paid</span>
              <span className="font-display text-xl font-bold leading-none tabular-nums text-fg">{fmt(amount)}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" icon="ri-arrow-left-line" className="flex-1" onClick={() => setStep("qr")}>
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                icon="ri-send-plane-line"
                loading={submitting}
                disabled={submitting || utrInput.trim().length < 6}
                onClick={handleSubmitUtr}
              >
                {submitting ? "Submitting…" : "Submit UTR"}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="mx-auto block rounded text-xs text-fg-subtle underline underline-offset-2 transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Haven&rsquo;t paid? Cancel this payment
            </button>
          </div>
        ) : (
          <CancelConfirm
            description={
              <>
                Only cancel if you have <strong className="font-medium text-fg">not</strong> made the UPI payment.
              </>
            }
            errorMessage={errorMessage}
            cancelling={cancelling}
            onBack={() => setShowCancelConfirm(false)}
            onConfirm={handleCancel}
          />
        ))}

      {/* PENDING VERIFICATION */}
      {step === "pending" &&
        (!showCancelConfirm ? (
          <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
            <StatusIcon tone="warning" icon="ri-time-line" pulse />
            <div>
              <h3 className="text-lg font-semibold text-fg">Pending verification</h3>
              {existingUtr && (
                <p className="mt-1 text-sm text-fg-muted">
                  UTR <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-fg">{existingUtr}</span> is
                  being verified.
                </p>
              )}
              <p className="mt-1 text-xs text-fg-subtle">The platform owner has been notified.</p>
            </div>
            <div className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3.5 text-left">
              <p className="eyebrow mb-2.5 text-fg-muted">What happens next</p>
              <ol className="space-y-2 text-sm text-fg-muted">
                {[
                  "Owner verifies your UTR in their UPI app",
                  "They click confirm — your access unlocks instantly",
                  "You get an email confirmation. This page auto-updates.",
                ].map((t, i) => (
                  <InstructionStep key={i} n={i + 1}>
                    {t}
                  </InstructionStep>
                ))}
              </ol>
            </div>
            <p role="status" className="flex items-center gap-2 text-xs text-fg-subtle">
              <i className="ri-loader-4-line animate-spin text-primary" aria-hidden />
              Checking for confirmation every 8s…
            </p>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="rounded text-xs text-fg-subtle underline underline-offset-2 transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Entered wrong UTR or want to start over? Cancel this payment
            </button>
          </div>
        ) : (
          <CancelConfirm
            description="If you already paid, please contact support before cancelling."
            utr={existingUtr}
            errorMessage={errorMessage}
            cancelling={cancelling}
            onBack={() => setShowCancelConfirm(false)}
            onConfirm={handleCancel}
          />
        ))}

      {/* CONFIRMED */}
      {step === "confirmed" && (
        <div role="status" className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-4xl text-white shadow-raised animate-pop">
            <i className="ri-check-line" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold uppercase leading-none text-fg">Payment confirmed</h3>
            <p className="mt-1 text-sm text-fg-muted">
              {subscriptionPlan
                ? "Your subscription is now active."
                : bundlePayload
                  ? `${bundlePayload.bundleName} has been unlocked for this match.`
                  : `${addonPayload?.templateName} overlay has been unlocked.`}
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-fg-subtle">
            <i className="ri-loader-4-line animate-spin" aria-hidden />
            This window will close automatically…
          </p>
        </div>
      )}

      {/* REJECTED */}
      {step === "rejected" && (
        <ResultState
          tone="danger"
          icon="ri-close-circle-line"
          title="Payment rejected"
          description="We could not verify your UTR. Please check the number and contact support."
        >
          <Button variant="secondary" size="lg" block onClick={onClose}>
            Close
          </Button>
        </ResultState>
      )}

      {/* CANCELLED */}
      {step === "cancelled" && (
        <ResultState
          tone="neutral"
          icon="ri-forbid-line"
          title="Payment cancelled"
          description="You can start a new payment anytime. If you already paid and cancelled by mistake, please contact support with your UTR."
        >
          <Button size="lg" block onClick={onClose}>
            Close &amp; start over
          </Button>
        </ResultState>
      )}

      {/* ERROR */}
      {step === "error" && (
        <ResultState tone="danger" icon="ri-error-warning-line" title="Something went wrong" description={errorMessage}>
          <Button variant="secondary" size="lg" block onClick={onClose}>
            Close
          </Button>
        </ResultState>
      )}
    </Modal>
  );
}

// ─── Presentational helpers ──────────────────────────────────────────────────

const PROGRESS_STEPS = ["Pay", "Add UTR", "Verification"];

function CheckoutProgress({ current }: { current: number }) {
  return (
    <ol className="mb-5 flex items-center gap-2" aria-label="Payment progress">
      {PROGRESS_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors duration-200",
                done && "bg-primary text-primary-fg",
                active && "bg-primary-soft text-primary-soft-fg ring-1 ring-inset ring-primary/40",
                !done && !active && "bg-surface-2 text-fg-subtle",
              )}
            >
              {done ? <i className="ri-check-line" aria-hidden /> : i + 1}
            </span>
            <span className={cn("truncate text-xs font-medium", active ? "text-fg" : "text-fg-subtle")}>
              {label}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
            {i < PROGRESS_STEPS.length - 1 && (
              <span className={cn("h-px min-w-3 flex-1", done ? "bg-primary" : "bg-line")} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function InstructionStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface text-2xs font-semibold tabular-nums text-fg-muted ring-1 ring-line">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

const statusTones = {
  warning: "bg-warning-soft text-warning-soft-fg",
  danger: "bg-danger-soft text-danger-soft-fg",
  neutral: "bg-surface-2 text-fg-subtle",
};

function StatusIcon({ tone, icon, pulse }: { tone: keyof typeof statusTones; icon: string; pulse?: boolean }) {
  return (
    <span className="relative">
      <span className={cn("flex h-16 w-16 items-center justify-center rounded-card text-3xl", statusTones[tone])}>
        <i className={icon} aria-hidden />
      </span>
      {pulse && (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-warning animate-live-ping" />
          <span className="relative h-3.5 w-3.5 rounded-full bg-warning ring-2 ring-surface" />
        </span>
      )}
    </span>
  );
}

function ResultState({
  tone,
  icon,
  title,
  description,
  children,
}: {
  tone: keyof typeof statusTones;
  icon: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="flex flex-col items-center gap-4 py-2 text-center animate-fade-in"
    >
      <StatusIcon tone={tone} icon={icon} />
      <div>
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      <div className="w-full pt-1">{children}</div>
    </div>
  );
}

function CancelConfirm({
  description,
  utr,
  errorMessage,
  cancelling,
  onBack,
  onConfirm,
}: {
  description: React.ReactNode;
  utr?: string;
  errorMessage?: string;
  cancelling: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/20 bg-danger-soft/60 px-4 py-5 text-center">
        <StatusIcon tone="danger" icon="ri-error-warning-line" />
        <div>
          <h3 className="text-base font-semibold text-fg">Cancel this payment?</h3>
          <p className="mt-1 text-sm text-fg-muted">{description}</p>
          {utr && (
            <p className="mt-2 text-xs text-fg-subtle">
              UTR: <span className="font-mono text-fg-muted">{utr}</span>
            </p>
          )}
        </div>
      </div>
      {/* Surface cancel failures — previously set but never shown on this screen */}
      {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" icon="ri-arrow-left-line" onClick={onBack}>
          Go back
        </Button>
        <Button variant="danger" size="lg" className="flex-1" loading={cancelling} onClick={onConfirm}>
          {cancelling ? "Cancelling…" : "Yes, cancel"}
        </Button>
      </div>
    </div>
  );
}
