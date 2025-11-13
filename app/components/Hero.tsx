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

        {/* Play Store */}
        <div
          className="flex items-center justify-center mt-10"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <div className="mt-12" data-aos="fade-up" data-aos-delay="400">
            <a
              href="https://play.google.com/store/apps/details?id=dev.cricshub.team"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-full font-semibold text-gray-700 hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400"
            >
              <i className="ri-google-play-fill text-xl text-green-600 group-hover:scale-110 transition-transform duration-300"></i>
              <span className="group-hover:text-gray-900 transition-colors duration-300">Download Now on Google Play</span>
            </a>
          </div>
        </div>

        {/* Features */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 max-w-4xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          {[
            {
              icon: "ri-live-line",
              title: "Live Scoring",
              desc: "Ball-by-ball updates",
              color: "from-blue-400 to-blue-600",
              bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100",
              borderColor: "border-blue-200",
            },
            {
              icon: "ri-youtube-line",
              title: "Streaming",
              desc: "Broadcast live matches",
              color: "from-red-500 to-red-600",
              bgGradient: "bg-gradient-to-br from-red-50 to-red-100",
              borderColor: "border-red-200",
            },
            {
              icon: "ri-trophy-line",
              title: "Tournaments",
              desc: "Organize & manage easily",
              color: "from-yellow-500 to-yellow-600",
              bgGradient: "bg-gradient-to-br from-yellow-50 to-yellow-100",
              borderColor: "border-yellow-200",
            },
            {
              icon: "ri-gamepad-line",
              title: "Fantasy Cricket",
              desc: "Play & compete",
              color: "from-purple-500 to-purple-600",
              bgGradient: "bg-gradient-to-br from-purple-50 to-purple-100",
              borderColor: "border-purple-200",
              tag: "Coming Soon",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
            >
              <div
                className={`relative bg-white border ${feature.borderColor} rounded-2xl p-5 text-center transition-all duration-500 ease-out
                          hover:scale-105 hover:-translate-y-2 hover:shadow-2xl
                          transform-gpu will-change-transform
                          before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br ${feature.color} before:opacity-0 before:transition-opacity before:duration-500 before:hover:opacity-10
                          overflow-hidden`}
              >
                {/* Animated background gradient on hover */}
                <div className={`absolute inset-0 ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -inset-x-24 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform-gpu transition-all duration-1000 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-x-96"></div>

                {feature.tag && (
                  <span className="absolute top-2 right-2 text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                    {feature.tag}
                  </span>
                )}
                
                <div
                  className={`w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                >
                  <i className={`${feature.icon} text-xl text-white group-hover:scale-110 transition-transform duration-300`}></i>
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                  {feature.desc}
                </p>

                {/* Bottom border animation */}
                <div className={`absolute bottom-0 left-1/2 w-0 h-1 bg-gradient-to-r ${feature.color} transition-all duration-500 group-hover:w-4/5 group-hover:left-1/2 group-hover:-translate-x-1/2 rounded-full`}></div>
              </div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 bg-gradient-to-br ${feature.color} rounded-full opacity-60`}
                    style={{
                      top: `${20 + i * 30}%`,
                      left: `${10 + i * 40}%`,
                      animation: `float${i + 1} 3s ease-in-out infinite`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating animations */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(90deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(270deg); }
        }
      `}</style>

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </section>
  );
}