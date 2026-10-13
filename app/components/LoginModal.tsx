"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { sendOtp, verifyOtp } from "@/lib/api";
import { safeRedirect } from "@/lib/session";
import { Button, Checkbox, Logo, Modal, cn } from "@/app/components/ui";

type Step = "phone" | "otp" | "success";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
// Hardcoded for India as requested
const COUNTRY_DATA = { code: "+91", flag: "🇮🇳", label: "IN" };

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setLoading(false);
      setResendTimer(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(RESEND_SECONDS);

  const fail = (msg: string) => {
    setError(msg);
    setErrorKey((k) => k + 1); // re-trigger shake animation
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      fail("Please enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.success) {
        setStep("otp");
        startResendTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        fail(res.message || "Failed to send OTP. Try again.");
      }
    } catch {
      fail("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpWithValues = async (otpValues: string[]) => {
    const otpString = otpValues.join("");
    if (otpString.length < OTP_LENGTH) return;

    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otpString, rememberMe);
      if (res.success && res.data) {
        // JWT stored for Authorization header (fallback for cross-origin/local dev)
        // httpOnly cookie is also set by the backend for same-site production security
        localStorage.setItem("jwtToken", res.data.token);
        localStorage.setItem("userUUID", res.data.user.id);
        localStorage.setItem("userName", res.data.user.name);
        // sessionActive: non-httpOnly, used only by Next.js middleware to gate routes
        // Remember me: 30 days | Default: session cookie (expires on browser close)
        const sessionCookie = rememberMe
          ? "sessionActive=1; path=/; SameSite=Lax; Max-Age=2592000"
          : "sessionActive=1; path=/; SameSite=Lax";
        document.cookie = sessionCookie;

        setStep("success");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
            const searchParams = new URLSearchParams(window.location.search);
            window.location.href = safeRedirect(searchParams.get("redirect"));
          }
        }, 1500);
      } else {
        fail(res.message || "Invalid OTP. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      }
    } catch {
      fail("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => handleVerifyOtpWithValues(otp);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1 && newOtp.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOtpWithValues(newOtp), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
      setTimeout(() => handleVerifyOtpWithValues(newOtp), 100);
    }
  };

  const ErrorText = ({ center }: { center?: boolean }) =>
    error ? (
      <p
        key={errorKey}
        role="alert"
        className={cn(
          "mt-2.5 flex items-center gap-1.5 text-sm font-medium text-danger animate-fade-in",
          center && "justify-center",
        )}
      >
        <i className="ri-error-warning-fill" aria-hidden />
        {error}
      </p>
    ) : null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
      hideClose={step === "success"}
      dismissible={step !== "success"}
      ariaLabel="Log in to CricsHub"
      padded={false}
    >
      <div className="px-6 pb-8 pt-2 sm:px-8 sm:pt-0">
        <Logo href={null} className="mb-7" />

        {/* ── STEP: Phone ── */}
        {step === "phone" && (
          <form
            className="animate-fade-up"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Log in or sign up</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              We&apos;ll text a 6-digit code to your phone. No password needed.
            </p>

            <div className="mt-7">
              <label htmlFor="login-phone" className="mb-1.5 block text-sm font-medium text-fg">
                Phone number
              </label>
              <div
                key={errorKey}
                className={cn(
                  "flex h-12 items-center overflow-hidden rounded-xl border bg-surface shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-focus",
                  error ? "border-danger animate-shake" : "border-line-strong",
                )}
              >
                <span className="flex h-full items-center gap-1.5 border-r border-line bg-surface-2 px-3.5 text-sm font-medium text-fg-muted">
                  <span aria-hidden>{COUNTRY_DATA.flag}</span>
                  {COUNTRY_DATA.code}
                </span>
                <input
                  id="login-phone"
                  data-autofocus
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-medium tracking-wide text-fg placeholder:font-normal placeholder:text-fg-subtle focus:outline-none"
                  disabled={loading}
                />
                {phone.length === 10 && (
                  <i className="ri-checkbox-circle-fill mr-3.5 text-lg text-success animate-pop" aria-hidden />
                )}
              </div>
              <div id="login-error">
                <ErrorText />
              </div>
            </div>

            <Checkbox
              className="mt-5"
              checked={rememberMe}
              onChange={setRememberMe}
              label="Keep me signed in for 30 days"
            />

            <Button
              type="submit"
              size="lg"
              block
              className="mt-6"
              loading={loading}
              disabled={phone.length < 10}
              trailingIcon="ri-arrow-right-line"
            >
              {loading ? "Sending code…" : "Continue"}
            </Button>

            <p className="mt-6 text-center text-xs leading-relaxed text-fg-subtle">
              By continuing, you agree to CricsHub&apos;s{" "}
              <Link href="/terms-of-service" className="font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        {/* ── STEP: OTP ── */}
        {step === "otp" && (
          <div className="animate-fade-up">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
                setOtp(Array(OTP_LENGTH).fill(""));
              }}
              className="-ml-1 mb-5 inline-flex items-center gap-1 rounded-md px-1 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              <i className="ri-arrow-left-line" aria-hidden />
              Change number
            </button>

            <h2 className="text-2xl font-semibold tracking-tight text-fg">Enter verification code</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Sent to{" "}
              <span className="font-medium tabular-nums text-fg">
                {COUNTRY_DATA.code} {phone}
              </span>
            </p>

            <fieldset className="mt-7" onPaste={handleOtpPaste}>
              <legend className="sr-only">6-digit verification code</legend>
              <div key={errorKey} className={cn("flex justify-between gap-2 sm:gap-2.5", error && "animate-shake")}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${index + 1}`}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={loading}
                    className={cn(
                      "aspect-square w-full min-w-0 max-w-[3.25rem] rounded-xl border bg-surface text-center font-mono text-xl font-semibold text-fg shadow-xs",
                      "transition-[border-color,box-shadow,background-color] duration-150 focus:border-primary focus:shadow-focus focus:outline-none disabled:opacity-50",
                      error ? "border-danger" : digit ? "border-primary/50 bg-primary-soft/50" : "border-line-strong",
                    )}
                  />
                ))}
              </div>
            </fieldset>

            <ErrorText center />

            <Button
              size="lg"
              block
              className="mt-6"
              onClick={handleVerifyOtp}
              loading={loading}
              disabled={otp.some((d) => d === "")}
              icon={loading ? undefined : "ri-shield-check-line"}
            >
              {loading ? "Verifying…" : "Verify and continue"}
            </Button>

            {/* Resend */}
            <div className="mt-6 flex h-6 items-center justify-center text-sm">
              {resendTimer > 0 ? (
                <p className="text-fg-subtle">
                  Resend code in <span className="font-medium tabular-nums text-fg-muted">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    await sendOtp(phone);
                    setLoading(false);
                    setOtp(Array(OTP_LENGTH).fill(""));
                    startResendTimer();
                    otpRefs.current[0]?.focus();
                  }}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === "success" && (
          <div className="py-8 text-center animate-fade-in" role="status">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success ring-8 ring-success-soft/40 animate-pop">
              <i className="ri-check-line text-4xl" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">You&apos;re signed in</h2>
            <p className="mt-1.5 flex items-center justify-center gap-2 text-sm text-fg-muted">
              <i className="ri-loader-4-line animate-spin" aria-hidden />
              Taking you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
