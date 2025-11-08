'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

const Do = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const AOS = require('aos');
      AOS.init({
        duration: 800,
        once: true,
      });
    }
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 text-gray-800 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gray-100/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-200/40 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className="inline-block bg-gray-100/60 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            WHAT YOU CAN DO WITH CRICSHUB
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Power Up Your{" "}
            <span className="bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
              Cricket Experience
            </span>
          </h2>
          <p
            className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            Cricshub is your all-in-one cricket app — manage tournaments, score
            matches, stream games, and track fantasy stats — everything built
            for the real cricket community.
          </p>
        </div>

        {/* Feature Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 mt-12">
          {/* Left Features */}
          <div className="flex flex-col gap-6 w-full lg:w-1/4">
            {[
              {
                icon: "ri-time-line",
                gradient: "from-blue-500 to-blue-600",
                title: "Real-time Match Setup",
                desc: "Create and manage matches instantly with live scoring and instant player sync.",
                delay: 400,
                color: "text-blue-600",
              },
              {
                icon: "ri-team-line",
                gradient: "from-purple-500 to-purple-600",
                title: "Team Creation & Management",
                desc: "Build your teams, assign captains, and manage rosters seamlessly.",
                delay: 500,
                color: "text-purple-600",
              },
              {
                icon: "ri-live-line",
                gradient: "from-red-500 to-red-600",
                title: "Live Streaming Integration",
                desc: "Stream matches directly to YouTube with real-time score overlays.",
                delay: 600,
                color: "text-red-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group relative"
                data-aos="fade-right"
                data-aos-delay={item.delay}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md`}
                >
                  <i className={`${item.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <h3
                    className={`text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:${item.color} transition-colors duration-300`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Center Image */}
          <div
            className="mb-10 lg:mb-0 lg:mx-8 flex justify-center"
            data-aos="zoom-in"
            data-aos-delay="700"
          >
            <Image
              src="/images/phone.png"
              alt="Cricshub app interface on phone"
              width={300}
              height={600}
              className="rounded-2xl"
            />
          </div>

          {/* Right Features */}
          <div className="flex flex-col gap-6 w-full lg:w-1/4">
            {[
              {
                icon: "ri-trophy-line",
                gradient: "from-yellow-500 to-yellow-600",
                title: "Tournament Management",
                desc: "Organize tournaments, update fixtures, and track points tables effortlessly.",
                delay: 400,
                color: "text-yellow-600",
              },
              {
                icon: "ri-line-chart-line",
                gradient: "from-green-500 to-green-600",
                title: "Fantasy & Analytics",
                desc: "Track fantasy points and analyze player performance in real time.",
                delay: 500,
                color: "text-green-600",
                tag: "Coming Soon",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group"
                data-aos="fade-left"
                data-aos-delay={item.delay}
              >
                {/* Coming Soon Tag */}
                {item.tag && (
                  <span className="absolute top-3 right-3 text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                )}

                <div
                  className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md`}
                >
                  <i className={`${item.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <h3
                    className={`text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:${item.color} transition-colors duration-300`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remix Icons CDN */}
      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </section>
  );
};

export default Do;
