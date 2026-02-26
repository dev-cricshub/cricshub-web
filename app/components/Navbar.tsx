'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import LoginModal from './LoginModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // TODO: Replace with your real auth context / session check
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    // TODO: Clear JWT token, call backend logout endpoint if needed
    // await fetch('https://your-api.com/api/v1/auth/logout', { method: 'POST', ... });
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-white'
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image src="/images/iconLogo.png" alt="Cricshub" width={36} height={36} className="rounded-lg" />
            <Image src="/images/textLogo.png" alt="Cricshub" width={90} height={28} className="object-contain hidden sm:block" />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              // Logged-in state: avatar + menu
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">Hi, <span className="font-semibold text-gray-800">{user.name}</span></span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Logged-out state: Login button
              <button
                onClick={() => setLoginOpen(true)}
                className="group flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-200 hover:scale-105"
              >
                <i className="ri-user-line text-base group-hover:scale-110 transition-transform" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
