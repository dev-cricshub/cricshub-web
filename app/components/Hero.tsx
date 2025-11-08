'use client';

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] bg-white text-gray-800 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* App Icon */}
        <div className="mb-4" data-aos="fade-up">
          <Image
            src="/images/iconLogo.png"
            alt="Cricshub Icon"
            width={110}
            height={110}
            className="mx-auto"
          />
        </div>

        {/* App Name */}
        <div className="mb-2" data-aos="fade-up" data-aos-delay="100">
          <Image
            src="/images/textLogo.png"
            alt="Cricshub Logo"
            width={300}
            height={80}
            className="mx-auto"
          />
        </div>

        {/* Tagline */}
        <p
          className="text-xl md:text-2xl font-semibold text-gray-700 mt-3"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Your All-in-One Cricket App 🏏
        </p>

        <p
          className="text-gray-600 text-base md:text-lg mt-3 max-w-xl mx-auto leading-relaxed"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          Live scores, manage tournaments, stream matches, and play fantasy
          cricket — everything in one app built for true cricket fans.
        </p>

        {/* Play Store & QR Code */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-10"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          {/* Play Store Section */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
              GET IT ON
            </p>
            <Link
              href="https://play.google.com/store/apps/details?id=dev.cricshub.team"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/images/play1.png"
                alt="Get it on Google Play"
                width={170}
                height={40}
                className="border border-gray-300 rounded-[25px] shadow-sm"
              />
            </Link>
          </div>

          {/* QR Section */}
          <div className="flex flex-col items-center">
            <div className="bg-white border border-gray-200 p-2 rounded-2xl shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/frame.png"
                alt="Cricshub QR Code"
                width={100}
                height={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Scan to Download
            </p>
          </div>
        </div>

        {/* Features */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          {[
            {
              icon: "ri-live-line",
              title: "Live Scoring",
              desc: "Ball-by-ball updates",
              color: "from-blue-400 to-blue-600",
            },
            {
              icon: "ri-youtube-line",
              title: "Streaming",
              desc: "Broadcast live matches",
              color: "from-red-500 to-red-600",
            },
            {
              icon: "ri-trophy-line",
              title: "Tournaments",
              desc: "Organize & manage easily",
              color: "from-yellow-500 to-yellow-600",
            },
            {
              icon: "ri-gamepad-line",
              title: "Fantasy Cricket",
              desc: "Play & compete",
              color: "from-purple-500 to-purple-600",
              tag: "Coming Soon",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="relative bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-transform duration-300 hover:-translate-y-1"
            >
              {feature.tag && (
                <span className="absolute top-2 right-2 text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                  {feature.tag}
                </span>
              )}
              <div
                className={`w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}
              >
                <i className={`${feature.icon} text-lg text-white`}></i>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </section>
  );
}
