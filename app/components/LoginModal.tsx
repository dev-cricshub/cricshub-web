"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { sendOtp, verifyOtp } from "@/lib/api";

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

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
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
        setError(res.message || "Failed to send OTP. Try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
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
            const redirectParam = searchParams.get("redirect");
            // Only allow relative redirects — blocks open redirect attacks
            const safeRedirect =
              redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
                ? redirectParam
                : "/dashboard";
            window.location.href = safeRedirect;
          }
        }, 1500);
      } else {
        setError(res.message || "Invalid OTP. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center pointer-events-none sm:p-4">
        <div
          className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] pb-safe mobile-slide-up sm:desktop-zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* FIX: Moved gradient line INSIDE the overflow-hidden container
            and used h-1.5 with rounded-t-2xl to match container exactly.
          */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 rounded-t-2xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors z-10 p-1.5 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-xl leading-none" />
          </button>

          <div className="px-6 sm:px-8 pt-10 pb-8 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/images/iconLogo.png"
                alt="Cricshub"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <Image
                src="/images/textLogo.png"
                alt="Cricshub"
                width={100}
                height={30}
                className="object-contain"
              />
            </div>

            {/* ── STEP: Phone ── */}
            {step === "phone" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
                  Welcome back 👋
                </h2>
                <p className="text-gray-600 text-sm mb-8">
                  Enter your phone number to continue
                </p>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>

                  {/* FIX: Simplified Input Group (Removed Dropdown) */}
                  <div className="relative flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-brand-200 focus-within:border-brand-400 transition-all bg-white h-14">
                    {/* Fixed Country Code Display */}
                    <div className="flex items-center gap-2 h-full px-4 text-base font-medium text-gray-700 border-r border-gray-200 bg-gray-50 rounded-l-xl">
                      <span className="text-lg">{COUNTRY_DATA.flag}</span>
                      <span>{COUNTRY_DATA.code}</span>
                    </div>

                    {/* Number input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        );
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      className="flex-1 h-full px-4 bg-transparent text-gray-900 text-base placeholder:text-gray-300 focus:outline-none rounded-r-xl w-full font-medium tracking-wide"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="mt-2.5 text-xs text-red-600 flex items-center gap-1.5 animate-fade-in font-medium">
                      <i className="ri-error-warning-fill text-sm" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 mb-6 cursor-pointer select-none group w-fit">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-gray-300 bg-white peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all flex items-center justify-center">
                      {rememberMe && <i className="ri-check-line text-white text-xs leading-none" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors font-medium">
                    Remember me for 30 days
                  </span>
                </label>

                <button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                  // FIX: Changed gradient to use brand colors
                  className="w-full h-14 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-brand-100 hover:shadow-lg hover:shadow-brand-200 flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Get OTP
                      <i className="ri-arrow-right-line" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-7 line-height-relaxed">
                  By continuing, you agree to Cricshub's{" "}
                  <a
                    href="/terms-of-service"
                    className="text-brand-600 hover:text-brand-700 font-medium underline decoration-brand-200 transition-colors"
                  >
                    Terms
                  </a>{" "}
                  &{" "}
                  <a
                    href="/privacy-policy"
                    className="text-brand-600 hover:text-brand-700 font-medium underline decoration-brand-200 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}

            {/* ── STEP: OTP ── */}
            {step === "otp" && (
              <div className="animate-fade-in">
                <button
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setOtp(Array(OTP_LENGTH).fill(""));
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-700 transition-colors mb-7 font-medium"
                >
                  <i className="ri-arrow-left-line" />
                  Change phone number
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
                  Verify OTP
                </h2>
                <p className="text-gray-600 text-sm mb-9">
                  Enter 6-digit code sent to{" "}
                  <span className="font-semibold text-gray-800 tracking-wide">
                    {COUNTRY_DATA.code} {phone}
                  </span>
                </p>

                {/* FIX: Cleaner, less round OTP boxes */}
                <div
                  className="flex gap-2 sm:gap-3 justify-between mb-7"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      // Changed rounding to rounded-lg, focus to brand color
                      className={`w-full max-w-[3rem] aspect-[4/5] sm:aspect-square text-center text-2xl font-bold rounded-lg border-2 transition-all duration-150 focus:outline-none
                        ${digit ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-200 bg-gray-50 text-gray-900"}
                        focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100/50 disabled:opacity-50`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-center text-sm text-red-600 flex items-center justify-center gap-1.5 mb-5 animate-fade-in font-medium">
                    <i className="ri-error-warning-fill text-base" />
                    {error}
                  </p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.some((d) => d === "")}
                  // FIX: Changed gradient to use brand colors
                  className="w-full h-14 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-brand-100 hover:shadow-lg hover:shadow-brand-200 flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <i className="ri-shield-check-line" />
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center mt-7 h-6">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500 font-medium">
                      Resend code in{" "}
                      <span className="font-bold text-gray-800 tabular-nums">
                        {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={async () => {
                        setLoading(true);
                        await sendOtp(phone);
                        setLoading(false);
                        setOtp(Array(OTP_LENGTH).fill(""));
                        startResendTimer();
                        otpRefs.current[0]?.focus();
                      }}
                      className="text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors underline decoration-brand-200"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: Success ── */}
            {step === "success" && (
              <div className="animate-fade-in text-center py-10">
                {/* FIX: Changed success gradient to be softer green */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-7 shadow-xl shadow-emerald-100 animate-[scaleUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                  <i className="ri-check-line text-5xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Login Successful! 🎉
                </h2>
                <p className="text-gray-600 font-medium">
                  Redirecting you to dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Mobile: Slide up from bottom */
        .mobile-slide-up {
          animation: slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Desktop: Zoom/fade in from center */
        @media (min-width: 640px) {
          .sm\\:desktop-zoom-in {
            animation: zoomInDesktop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes zoomInDesktop {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleUp {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Helper for iPhone notch/safe areas */
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
}
