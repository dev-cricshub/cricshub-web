"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { sendOtp, verifyOtp } from "@/lib/api";
import type { LoginIntent } from "@/lib/session";
import { cn } from "@/app/components/ui";

type Step = "phone" | "otp" | "success";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
// Hardcoded for India as requested
const COUNTRY_DATA = { code: "+91", label: "IN" };

/** Heading and hand-off copy per feature, so the user knows why they are signing in and where they go next. */
const COPY: Record<LoginIntent | "default", { title: string; lead: string; next: string }> = {
  default: { title: "Log in or sign up", lead: "", next: "Taking you to your dashboard…" },
  stream: { title: "Log in to Stream Studio", lead: "Put live score overlays on your YouTube stream.", next: "Opening Stream Studio…" },
  auction: { title: "Log in to Auctions", lead: "Set up and run player auctions for your league.", next: "Opening Auctions…" },
  register: { title: "Sign in to register", lead: "Use the phone number on your CricsHub profile.", next: "Opening your registration…" },
  plans: { title: "Log in to buy a plan", lead: "Plans and bundles are linked to your account.", next: "Back to plans…" },
};

/** "9876543210" → "98765 43210" */
const formatPhone = (p: string) => (p.length > 5 ? `${p.slice(0, 5)} ${p.slice(5)}` : p);

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="self-start rounded-full border border-white/[0.16] bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white">
      {children}
    </span>
  );
}

function Spin() {
  return <i className="ri-loader-4-line animate-spin" aria-hidden />;
}

/** Primary CTA: accent fill when enabled, muted glass when not. */
function PrimaryButton({ enabled, loading, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { enabled: boolean; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={!enabled || loading}
      className={cn(
        "ch-btn flex h-[58px] items-center justify-center gap-2.5 rounded-2xl border text-base font-semibold",
        enabled ? "border-transparent bg-[#5AA9F0] text-[#060A14]" : "cursor-not-allowed border-white/[0.12] bg-white/[0.06] text-[#9AA8BF]",
        loading && "cursor-wait",
        className,
      )}
    >
      {children}
    </button>
  );
}

const linkButton = "rounded-sm border-0 bg-transparent p-0 font-medium text-[#5AA9F0] underline underline-offset-2 hover:text-[#7CC4FF] disabled:opacity-50";

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
  const [otp, setOtp] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const otpRef = useRef<HTMLInputElement | null>(null);
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

  const phoneOk = phone.length === 10;
  const otpOk = otp.length === OTP_LENGTH;

  const handleSendOtp = async () => {
    if (!phoneOk) {
      fail("Please enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.success) {
        setOtp("");
        setStep("otp");
        startResendTimer();
        setTimeout(() => otpRef.current?.focus(), 100);
      } else {
        fail(res.message || "Failed to send OTP. Try again.");
      }
    } catch {
      fail("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    if (code.length < OTP_LENGTH) return;

    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code, rememberMe);
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
        setOtp("");
        setTimeout(() => otpRef.current?.focus(), 0);
      }
    } catch {
      fail("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // One hidden input drives the six boxes, so typing, paste and SMS autofill all work the same way.
  const handleOtpChange = (value: string) => {
    const code = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(code);
    setError("");
    if (code.length === OTP_LENGTH) setTimeout(() => verify(code), 100);
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
    setOtp("");
    startResendTimer();
    otpRef.current?.focus();
  };

  const ErrorText = ({ id, center }: { id?: string; center?: boolean }) =>
    error ? (
      <p
        id={id}
        key={errorKey}
        role="alert"
        className={cn("flex items-center gap-1.5 text-[13px] font-medium text-[#FCA5A5]", center && "justify-center")}
      >
        <i className="ri-error-warning-fill" aria-hidden />
        {error}
      </p>
    ) : null;

  const heading = "m-0 font-display text-[40px] font-bold uppercase leading-none text-white sm:text-5xl [@media(max-height:820px)]:text-[40px]";
  const lead = "m-0 text-[15px] leading-relaxed text-[#D6E2F5]";

  return (
    <div>
      {/* ── STEP: Phone ── */}
      {step === "phone" && (
        <form
          className="ch-rise flex flex-col gap-7 [@media(max-height:820px)]:gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOtp();
          }}
        >
          <div className="flex flex-col gap-3">
            <StepBadge>Step 1 of 2</StepBadge>
            <h2 className={heading}>{copy.title}</h2>
            <p className={lead}>
              {copy.lead && `${copy.lead} `}
              We&apos;ll text you a 6-digit code. No password needed, and if you&apos;re new, the same code creates your account.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="login-phone" className="text-sm font-medium text-[#EEF3FB]">
              Phone number
            </label>
            <div
              key={errorKey}
              className={cn(
                "ch-field flex h-[58px] overflow-hidden rounded-2xl border bg-white/[0.06]",
                error ? "ch-shake border-[#F87171]/70" : "border-white/[0.18]",
              )}
            >
              <span className="flex items-center gap-2 border-r border-white/[0.14] px-4 text-base text-white">
                <span className="text-xs font-semibold text-[#C3CEE0]" aria-hidden>
                  {COUNTRY_DATA.label}
                </span>
                <span className="tabular-nums">{COUNTRY_DATA.code}</span>
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
                value={formatPhone(phone)}
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
                aria-describedby="login-phone-hint"
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-lg tracking-[0.05em] text-white tabular-nums outline-none"
                disabled={loading}
              />
              {phoneOk && <i className="ri-checkbox-circle-fill ch-pop mr-4 self-center text-lg text-[#34D399]" aria-hidden />}
            </div>
            {error ? (
              <ErrorText id="login-phone-hint" />
            ) : (
              <span id="login-phone-hint" className="text-[13px] text-[#C3CEE0]">
                {phoneOk ? "Looks good. We’ll send the code by SMS." : "Enter your 10-digit mobile number."}
              </span>
            )}
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-[#D6E2F5]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="m-0 h-5 w-5 accent-[#5AA9F0]"
            />
            Keep me signed in for 30 days
          </label>

          <PrimaryButton type="submit" enabled={phoneOk} loading={loading}>
            {loading ? (
              <>
                <Spin /> Sending code…
              </>
            ) : (
              <>
                Send code
                <i className="ri-arrow-right-line text-lg" aria-hidden />
              </>
            )}
          </PrimaryButton>

          <p className="m-0 text-center text-[13px] leading-relaxed text-[#C3CEE0]">
            By continuing, you agree to CricsHub&apos;s{" "}
            <Link href="/terms-of-service" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}

      {/* ── STEP: OTP ── */}
      {step === "otp" && (
        <form
          className="ch-rise flex flex-col gap-7 [@media(max-height:820px)]:gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            verify(otp);
          }}
        >
          <div className="flex flex-col gap-3">
            <StepBadge>Step 2 of 2</StepBadge>
            <h2 className={heading}>Enter your code</h2>
            <p className={lead}>
              Sent to{" "}
              <span className="font-semibold tabular-nums text-white">
                {COUNTRY_DATA.code} {formatPhone(phone)}
              </span>
              .{" "}
              <button
                type="button"
                className={linkButton}
                onClick={() => {
                  setStep("phone");
                  setError("");
                  setOtp("");
                }}
              >
                Change number
              </button>
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="login-otp" className="text-sm font-medium text-[#EEF3FB]">
              Verification code
            </label>
            <div key={errorKey} className={cn("relative", error && "ch-shake")}>
              <div aria-hidden className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {Array.from({ length: OTP_LENGTH }, (_, i) => {
                  const ch = otp.charAt(i);
                  const active = otpFocused && !loading && i === Math.min(otp.length, OTP_LENGTH - 1);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex h-14 items-center justify-center rounded-[14px] border-[1.5px] font-display text-[32px] font-bold text-white backdrop-blur-md transition-[border-color,background-color] duration-200 sm:h-[62px]",
                        active && "ch-active",
                        error
                          ? "border-[#F87171]/70 bg-white/[0.05]"
                          : active
                            ? "border-[#5AA9F0] bg-white/[0.05]"
                            : ch
                              ? "border-white/[0.35] bg-white/[0.12]"
                              : "border-white/[0.16] bg-white/[0.05]",
                      )}
                    >
                      {ch}
                    </div>
                  );
                })}
              </div>
              <input
                id="login-otp"
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                disabled={loading}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? "login-otp-error" : undefined}
                className="absolute inset-0 h-full w-full cursor-text border-0 text-base opacity-0"
              />
            </div>
            <ErrorText id="login-otp-error" />
          </div>

          <PrimaryButton type="submit" enabled={otpOk} loading={loading}>
            {loading ? (
              <>
                <Spin /> Verifying…
              </>
            ) : (
              "Verify and continue"
            )}
          </PrimaryButton>

          <div className="flex min-h-6 items-center justify-center text-sm text-[#C3CEE0]">
            {resendTimer > 0 ? (
              <span>
                Didn&apos;t get it? Resend in <span className="tabular-nums">0:{String(resendTimer).padStart(2, "0")}</span>
              </span>
            ) : (
              <span>
                Didn&apos;t get it?{" "}
                <button type="button" onClick={() => void resend()} disabled={loading} className={linkButton}>
                  Resend code
                </button>
              </span>
            )}
          </div>
        </form>
      )}

      {/* ── STEP: Success ── */}
      {step === "success" && (
        <div className="ch-rise flex flex-col items-center gap-[18px] py-6 text-center" role="status">
          <span className="ch-pop inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/[0.22] bg-white/10 text-[#5AA9F0] shadow-[0_0_40px_-6px_#5AA9F0]">
            <i className="ri-check-line text-[32px]" aria-hidden />
          </span>
          <h2 className={heading}>You&apos;re in</h2>
          <p className={cn(lead, "flex items-center gap-2")}>
            <Spin />
            {copy.next}
          </p>
        </div>
      )}
    </div>
  );
}
