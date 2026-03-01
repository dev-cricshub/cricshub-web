'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoginModal from './LoginModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);

  // 1. Handle scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 2. Check login status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);


  const checkAuthStatus = () => {
    const token = localStorage.getItem('jwtToken');
    const name = localStorage.getItem('userName');
    const phone = localStorage.getItem('userPhone');

    if (token && name) {
      setIsLoggedIn(true);
      setUser({ name, phone: phone || '' });
    }
  };

  // 3. Complete Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userUUID');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('hasSubscription');

    setIsLoggedIn(false);
    setUser(null);

    // Optional: Force reload to clear any cached states/redirect to home
    window.location.href = '/';
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white'
          }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/iconLogo.png" alt="Cricshub" width={36} height={36} className="rounded-lg" />
            <Image src="/images/textLogo.png" alt="Cricshub" width={90} height={28} className="object-contain hidden sm:block" />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              // Logged-in state: Dashboard button + Logout
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-1.5 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-semibold px-4 py-2 rounded-full hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <i className="ri-dashboard-line text-base" />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>

                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Hi, <span className="font-semibold text-gray-800">{user.name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                  >
                    <i className="ri-logout-circle-r-line text-lg" />
                  </button>
                </div>
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

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          checkAuthStatus();
        }}
      />
    </>
  );
}