'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const socialChannels = [
    {
      name: "LinkedIn",
      icon: "ri-linkedin-box-fill",
      link: "https://www.linkedin.com/company/cricshub/about/"
    },
    {
      name: "X (Twitter)",
      icon: "ri-twitter-x-fill",
      link: "https://twitter.com/your-twitter-handle"
    },
    {
      name: "Instagram",
      icon: "ri-instagram-fill",
      link: "https://www.instagram.com/cricshubapp/"
    },
  ];

  return (
    <footer className="bg-gray-50 text-gray-700 py-20 relative overflow-hidden font-sans">
      {/* Subtle Background Decor */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-gray-200/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gray-300/40 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Company Info */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center mb-6 group w-fit">
              <Image
                src="/images/iconLogo.png"
                alt="Cricshub Icon Logo"
                width={64}
                height={64}
                className="rounded-full mr-4 shadow-md group-hover:scale-105 transition-transform duration-300 border border-gray-300"
              />
              <Image
                src="/images/textLogo.png"
                alt="Cricshub Text Logo"
                width={200}
                height={60}
                className="object-contain group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md">
              Cricshub is now live — the all-in-one cricket platform for live scoring,
              tournament management, fantasy leagues, and live streaming.
            </p>

            {/* Social Icons + Google Play Badge */}
            <div className="flex flex-wrap items-center gap-6">
              {socialChannels.map((channel, index) => (
                <a
                  key={index}
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-800 transition-colors duration-300 transform hover:scale-125"
                  aria-label={`Follow us on ${channel.name}`}
                >
                  <i className={`${channel.icon} text-3xl`}></i>
                </a>
              ))}

              <a
                href="https://play.google.com/store/apps/details?id=com.cricshub.app"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2"
              >
                <Image
                  src="/images/play1.png"
                  alt="Get it on Google Play"
                  width={160}
                  height={50}
                  className="rounded-[25px] border border-gray-300 hover:shadow-md hover:scale-105 transition-transform duration-300"
                />
              </a>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-2xl font-bold mb-8 text-gray-800">Features</h4>
            <ul className="space-y-4">
              <li><span className="text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-default">Live Match Scoring</span></li>
              <li><span className="text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-default">YouTube Streaming</span></li>
              <li><span className="text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-default">Tournament Management</span></li>
              <li className="flex items-center gap-2">
                <span className="text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-default">
                  Fantasy Cricket
                </span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full border border-gray-300">
                  Coming Soon
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-2xl font-bold mb-8 text-gray-800">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact-us" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Contact Us</Link></li>
              <li><Link href="/feedback" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Feedback</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-gray-600 hover:text-gray-800 transition-colors duration-200">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-10 text-center">
          <p className="text-gray-500 text-md">
            © {new Date().getFullYear()} Cricshub. All rights reserved. Empowering cricket experiences worldwide.
          </p>
        </div>
      </div>

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </footer>
  );
}
