"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  getSubscriptionQrInfo,
  getAddonQrInfo,
  createSubscriptionIntent,
  createAddonIntent,
  submitUtr,
  pollManualPaymentStatus,
  checkPendingSubscription,
  checkPendingAddon,
  cancelManualPayment,
} from "@/lib/api";

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
  userId: string;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function UpiCheckoutModal({
  onClose,
  onConfirmed,
  subscriptionPlan,
  addonPayload,
  userId,
}: UpiCheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amountWithGst, setAmountWithGst] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [utrInput, setUtrInput] = useState("");
  const [utrError, setUtrError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [existingUtr, setExistingUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
        }

        if (pending) {
          setPaymentId(pending.paymentId);
          setAmountWithGst(pending.amount);
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
    } else {
      throw new Error("No payment target provided.");
    }
    setUpiId(data.upiId);
    setAmountWithGst(data.amountWithGst);
    setBaseAmount(data.amount);
    const qr = await QRCode.toDataURL(data.upiString, {
      width: 240,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
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
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gstAmount = Math.round(baseAmount * 0.18);
  const title = subscriptionPlan
    ? subscriptionPlan === "MONTHLY"
      ? "Monthly Subscription"
      : "6-Month Bundle"
    : (addonPayload?.templateName ?? "Premium Overlay");
  const canDismiss = [
    "qr",
    "error",
    "confirmed",
    "rejected",
    "cancelled",
  ].includes(step);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={canDismiss ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: "scaleIn .25s cubic-bezier(.16,1,.3,1)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="ri-qr-code-line text-white text-xl" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">
                Pay via UPI
              </p>
              <p className="text-white/70 text-xs mt-0.5">{title}</p>
            </div>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <i className="ri-close-line text-white" />
            </button>
          )}
        </div>

        <div className="px-6 py-6">
          {/* LOADING */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <i className="ri-loader-4-line text-4xl text-[#34B8FF] animate-spin" />
              <p className="text-gray-500 font-medium">Loading payment info…</p>
            </div>
          )}

          {/* QR */}
          {step === "qr" && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>
                    Base:{" "}
                    <span className="font-semibold text-gray-800">
                      {fmt(baseAmount)}
                    </span>
                  </p>
                  <p>
                    GST (18%):{" "}
                    <span className="font-semibold text-gray-800">
                      {fmt(gstAmount)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {fmt(amountWithGst)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 shadow-sm">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Scan with PhonePe, GPay, Paytm, or BHIM
                </p>
              </div>

              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <i className="ri-bank-card-line text-[#1E88E5] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    UPI ID
                  </p>
                  <p className="font-mono font-bold text-gray-900 text-sm truncate">
                    {upiId}
                  </p>
                </div>
                <button
                  onClick={copyUpiId}
                  className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copied ? "bg-green-500 text-white" : "bg-white border border-blue-200 text-[#1E88E5] hover:bg-blue-50"}`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold">Instructions:</p>
                <p>
                  1. Pay <strong>{fmt(amountWithGst)}</strong> to the UPI ID
                  above
                </p>
                <p>
                  2. Note the{" "}
                  <strong>UTR / Transaction Reference Number</strong>
                </p>
                <p>3. Click "I've Paid" and enter the UTR</p>
              </div>

              <button
                onClick={handleIvePaid}
                className="w-full h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <i className="ri-check-double-line text-xl" />
                I've Paid — Enter UTR
              </button>
            </div>
          )}

          {/* UTR ENTRY — PENDING_UTR state, DB record exists */}
          {step === "utr" &&
            (!showCancelConfirm ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-hashtag text-3xl text-[#1E88E5]" />
                  </div>
                  <p className="font-black text-gray-900">Enter UTR Number</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Find this in your UPI app under the payment receipt
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    UTR / Transaction Reference Number
                  </label>
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => {
                      setUtrInput(e.target.value);
                      setUtrError("");
                    }}
                    placeholder="e.g. 425123456789"
                    className={`w-full h-12 rounded-xl border-2 px-4 font-mono text-base transition-colors outline-none ${utrError ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-[#34B8FF] focus:bg-white"}`}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitUtr()}
                  />
                  {utrError && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <i className="ri-error-warning-line" />
                      {utrError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    12-digit number found in your UPI app → Payment History →
                    Receipt
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Amount paid</span>
                  <span className="font-black text-gray-900">
                    {fmt(amountWithGst)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("qr")}
                    className="flex-1 h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmitUtr}
                    disabled={submitting || utrInput.trim().length < 6}
                    className="flex-1 h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black rounded-xl hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line" />
                        Submit UTR
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors text-center"
                >
                  Haven't paid? Cancel this payment
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 py-4 text-center">
                <div className="w-20 h-20 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                  <i className="ri-error-warning-line text-4xl text-red-400" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg">
                    Cancel this payment?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Only cancel if you have <strong>not</strong> made the UPI
                    payment.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    ← Go Back
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 h-12 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </button>
                </div>
              </div>
            ))}

          {/* PENDING VERIFICATION */}
          {step === "pending" && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              {!showCancelConfirm ? (
                <>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                      <i className="ri-time-line text-4xl text-amber-500" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">
                      Pending Verification
                    </p>
                    {existingUtr && (
                      <p className="text-sm text-gray-500 mt-1">
                        UTR{" "}
                        <strong className="font-mono text-gray-700">
                          {existingUtr}
                        </strong>{" "}
                        is being verified.
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      The platform owner has been notified.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 w-full text-left space-y-2">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                      What happens next
                    </p>
                    {[
                      "Owner verifies your UTR in their UPI app",
                      "They click confirm — your access unlocks instantly",
                      "You get an email confirmation. This page auto-updates.",
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-blue-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <i className="ri-loader-4-line animate-spin" />
                    Checking for confirmation every 8s…
                  </div>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
                  >
                    Entered wrong UTR or want to start over? Cancel this payment
                  </button>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                    <i className="ri-error-warning-line text-3xl text-red-400 mb-2 block" />
                    <p className="font-black text-gray-900">
                      Cancel this payment?
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      If you already paid, please contact support before
                      cancelling.
                    </p>
                    {existingUtr && (
                      <p className="text-xs text-gray-400 mt-2">
                        UTR: <span className="font-mono">{existingUtr}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 h-11 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 h-11 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                      {cancelling ? (
                        <>
                          <i className="ri-loader-4-line animate-spin" />
                          Cancelling…
                        </>
                      ) : (
                        "Yes, Cancel"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONFIRMED */}
          {step === "confirmed" && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
                <i className="ri-check-line text-5xl text-white" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-xl">
                  Payment Confirmed! 🎉
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {subscriptionPlan
                    ? "Your subscription is now active."
                    : `${addonPayload?.templateName} overlay has been unlocked.`}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                This window will close automatically…
              </p>
            </div>
          )}

          {/* REJECTED */}
          {step === "rejected" && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <i className="ri-close-circle-line text-4xl text-red-500" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">
                  Payment Rejected
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  We could not verify your UTR. Please check the number and
                  contact support.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* CANCELLED */}
          {step === "cancelled" && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <i className="ri-forbid-line text-4xl text-gray-400" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">
                  Payment Cancelled
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You can start a new payment anytime. If you already paid and
                  cancelled by mistake, please contact support with your UTR.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold rounded-xl transition-colors"
              >
                Close & Start Over
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <i className="ri-error-warning-line text-5xl text-red-400" />
              <div>
                <p className="font-black text-gray-900">Something went wrong</p>
                <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
