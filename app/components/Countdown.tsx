'use client';

import { useState } from "react";

export default function Countdown() {
  const stats = [
    {
      number: "1K+",
      label: "Live Matches Scored",
      icon: "ri-play-circle-line",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      number: "300+",
      label: "YouTube Streams Managed",
      icon: "ri-youtube-line",
      gradient: "from-red-500 to-red-600",
    },
    {
      number: "500+",
      label: "Tournaments Organized",
      icon: "ri-trophy-line",
      gradient: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 text-gray-800 relative overflow-hidden">
      {/* Decorative Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-24 w-40 h-40 bg-gray-100/40 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-32 h-32 bg-gray-200/40 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Launch Tagline */}
        <div
          className="inline-block bg-gray-100/60 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
          data-aos="fade-up"
        >
          CRICSHUB IS NOW LIVE
        </div>

        {/* Main Heading */}
        <h2
          className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Join the{" "}
          <span className="bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
            Cricket Revolution
          </span>
        </h2>

        {/* Subtext */}
        <p
          className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Cricshub is officially live on Google Play! Dive into live scores,
          manage tournaments, stream matches, and build your dream fantasy
          teams — all in one powerful app made for every cricket lover.
        </p>

        {/* Stats Grid - Adjusted for 3 items */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-14 max-w-4xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
              >
                <i className={`${stat.icon} text-xl text-white`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {stat.number}
              </h3>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        
      </div>
    </section>
  );
}
