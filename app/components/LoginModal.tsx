'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { sendOtp, verifyOtp } from '@/lib/api';


type Step = 'phone' | 'otp' | 'success';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
];

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhone('');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setLoading(false);
      setResendTimer(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(RESEND_SECONDS);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.success) {
        setStep('otp');
        startResendTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message || 'Failed to send OTP. Try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpWithValues = async (otpValues: string[]) => {
    const otpString = otpValues.join('');
    if (otpString.length < OTP_LENGTH) return;

    setError('');
    setLoading(true);
    try {
      // const fullPhone = `${countryCode.code}${phone}`;
      const res = await verifyOtp(phone, otpString);
      console.log(res)
      if (res.success && res.data) {
        // Save auth data to localStorage
        localStorage.setItem('jwtToken', res.data.token);
        localStorage.setItem('userUUID', res.data.user.id);
        localStorage.setItem('userName', res.data.user.name);
        localStorage.setItem('userPhone', res.data.user.phone);

        setStep('success');

        // Close modal and refresh the page so the app picks up the new session
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard';
        }, 1500);

      } else {
        setError(res.message || 'Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => handleVerifyOtpWithValues(otp);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (digit && index === OTP_LENGTH - 1 && newOtp.every((d) => d !== '')) {
      setTimeout(() => handleVerifyOtpWithValues(newOtp), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const newOtp = pasted.split('');
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
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top gradient strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10 p-1 rounded-full hover:bg-gray-100"
          >
            <i className="ri-close-line text-xl" />
          </button>

          <div className="px-8 pt-8 pb-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <Image src="/images/iconLogo.png" alt="Cricshub" width={40} height={40} className="rounded-xl" />
              <Image src="/images/textLogo.png" alt="Cricshub" width={100} height={30} className="object-contain" />
            </div>

            {/* ── STEP: Phone ── */}
            {step === 'phone' && (
              <div className="animate-[fadeSlideUp_0.3s_ease_both]">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back 👋</h2>
                <p className="text-gray-500 text-sm mb-7">Enter your phone number to continue</p>

                {/* Phone input */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country code selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown((v) => !v)}
                        className="flex items-center gap-1.5 h-12 px-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                      >
                        <span>{countryCode.flag}</span>
                        <span>{countryCode.code}</span>
                        <i className="ri-arrow-down-s-line text-xs text-gray-400" />
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute top-14 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-36">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => { setCountryCode(c); setShowCountryDropdown(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <span>{c.flag}</span>
                              <span className="text-gray-500">{c.code}</span>
                              <span className="text-gray-400 text-xs ml-auto">{c.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Number input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-gray-900 text-base placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                    />
                  </div>
                  {error && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><i className="ri-error-warning-line" />{error}</p>}
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-red-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    <>
                      Get OTP
                      <i className="ri-arrow-right-line" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-5">
                  By continuing, you agree to our{' '}
                  <a href="/terms-of-service" className="text-red-500 hover:underline">Terms</a> &{' '}
                  <a href="/privacy-policy" className="text-red-500 hover:underline">Privacy Policy</a>
                </p>
              </div>
            )}

            {/* ── STEP: OTP ── */}
            {step === 'otp' && (
              <div className="animate-[fadeSlideUp_0.3s_ease_both]">
                <button
                  onClick={() => { setStep('phone'); setError(''); setOtp(Array(OTP_LENGTH).fill('')); }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
                >
                  <i className="ri-arrow-left-line" />
                  Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your phone</h2>
                <p className="text-gray-500 text-sm mb-7">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-gray-700">{countryCode.code} {phone}</span>
                </p>

                {/* OTP boxes */}
                <div className="flex gap-3 justify-center mb-5" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none
                        ${digit ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-900'}
                        focus:border-red-400 focus:bg-red-50 focus:ring-2 focus:ring-red-100`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-center text-xs text-red-500 flex items-center justify-center gap-1 mb-3">
                    <i className="ri-error-warning-line" />{error}
                  </p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.some((d) => d === '')}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-red-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      Verify & Continue
                      <i className="ri-shield-check-line" />
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center mt-5">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-400">
                      Resend OTP in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={async () => {
                        setLoading(true);
                        await sendOtp(phone);
                        setLoading(false);
                        setOtp(Array(OTP_LENGTH).fill(''));
                        startResendTimer();
                        otpRefs.current[0]?.focus();
                      }}
                      className="text-sm text-red-500 hover:text-red-600 font-semibold transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: Success ── */}
            {step === 'success' && (
              <div className="animate-[fadeSlideUp_0.3s_ease_both] text-center py-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                  <i className="ri-check-line text-4xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're in! 🎉</h2>
                <p className="text-gray-500 text-sm">Welcome to Cricshub. Redirecting you...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
