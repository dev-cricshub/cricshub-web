"use client";

import { LoginForm } from "@/app/components/auth/LoginForm";
import type { LoginIntent } from "@/lib/session";
import { Logo, Modal } from "@/app/components/ui";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intent?: LoginIntent;
  theme?: "dark" | "light";
}

/** Login sheet over the current page: a bottom sheet on phones, a dialog from `sm` up. */
export default function LoginModal({ isOpen, onClose, onSuccess, intent, theme }: LoginModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} size="md" ariaLabel="Log in to CricsHub" theme={theme} padded={false}>
      <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2 sm:px-8 sm:pt-0">
        <Logo href={null} className="mb-6 sm:mb-7" />
        {/* Remount per open so every sheet starts on the phone step. */}
        {isOpen && <LoginForm intent={intent} onSuccess={onSuccess} />}
      </div>
    </Modal>
  );
}
