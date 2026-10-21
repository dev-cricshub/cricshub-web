"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { sendOtp, verifyOtp } from "@/lib/api";
import type { LoginIntent } from "@/lib/session";
import { Button, Checkbox, cn } from "@/app/components/ui";

type Step = "phone" | "otp" | "success";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
// Hardcoded for India as requested
const COUNTRY_DATA = { code: "+91", label: "IN" };

/** Heading and hand-off copy per feature, so the user knows why they are signing in and where they go next. */
const COPY: Record<LoginIntent | "default", { title: string; lead: string; next: string }> = {
  default: { title: "Log in or sign up", lead: "Score, stream and run auctions with one account.", next: "Taking you to CricsHub…" },
  stream: { title: "Log in to Stream Studio", lead: "Put live score overlays on your YouTube stream.", next: "Opening Stream Studio…" },
  auction: { title: "Log in to Auctions", lead: "Set up and run player auctions for your league.", next: "Opening Auctions…" },
  register: { title: "Sign in to register", lead: "Use the phone number on your CricsHub profile.", next: "Opening your registration…" },
  plans: { title: "Log in to buy a plan", lead: "Plans and bundles are linked to your account.", next: "Back to plans…" },
};

/**
 * Phone + OTP sign-in. The same flow signs existing users in and creates new accounts.
 * Rendered by the /login page, the one sign-in screen for every feature.
 */
export function LoginForm({
  intent,
  onSuccess,
  autoFocus,
}: {
  intent?: LoginIntent;
  /** Called shortly after the session is stored; the caller decides where to go. */
  onSuccess: () => void;
  autoFocus?: boolean;
}) {
  const copy = COPY[intent ?? "default"];
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
        // sessionActive: non-httpOnly, used only by proxy.ts to gate routes
        // Remember me: 30 days | Default: session cookie (expires on browser close)
        const sessionCookie = rememberMe
          ? "sessionActive=1; path=/; SameSite=Lax; Max-Age=2592000"
          : "sessionActive=1; path=/; SameSite=Lax";
        document.cookie = sessionCookie;

        setStep("success");

        // Brief confirmation, then hand over to the caller (which navigates).
        setTimeout(onSuccess, 900);
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

  const resend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await sendOtp(phone);
      if (!res.success) fail(res.message || "Couldn't resend the code. Try again.");
    } catch {
      fail("Network error. Please check your connection.");
    }
    setLoading(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    startResendTimer();
    otpRefs.current[0]?.focus();
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
    <div>
      {/* ── STEP: Phone ── */}
      {step === "phone" && (
        <form
          className="animate-fade-up"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOtp();
          }}
        >
          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none text-fg sm:text-3xl">{copy.title}</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {copy.lead} We&apos;ll text a 6-digit code to your phone. No password needed.
          </p>
          <p className="mt-1 text-xs text-fg-subtle">New to CricsHub? The same code creates your account.</p>

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
                <span className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle" aria-hidden>
                  {COUNTRY_DATA.label}
                </span>
                <span className="font-mono tabular-nums">{COUNTRY_DATA.code}</span>
              </span>
              <input
                id="login-phone"
                data-autofocus
                autoFocus={autoFocus}
                enterKeyHint="go"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                maxLength={10}
                pattern="[0-9]{10}"
                value={phone}
                onPaste={(e) => {
                  e.preventDefault();
                  const digits = e.clipboardData.getData("text").replace(/\D/g, "");
                  const national = digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;
                  setPhone(national.slice(0, 10));
                  setError("");
                }}
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
            <Link href="/terms-of-service" className="rounded-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="rounded-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            className="-ml-1 mb-5 inline-flex items-center gap-1 rounded-md px-1 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-arrow-left-line" aria-hidden />
            Change number
          </button>

          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none text-fg sm:text-3xl">Enter verification code</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            Sent to{" "}
            <span className="font-mono font-medium tabular-nums text-fg">
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
                onClick={() => void resend()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {loading && <i className="ri-loader-4-line animate-spin" aria-hidden />}
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
          <h2 className="font-display text-[1.75rem] font-bold uppercase leading-none text-fg sm:text-3xl">You&apos;re signed in</h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-sm text-fg-muted">
            <i className="ri-loader-4-line animate-spin" aria-hidden />
            {copy.next}
          </p>
        </div>
      )}
    </div>
  );
}
