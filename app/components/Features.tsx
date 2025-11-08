'use client';

import Image from "next/image";

export default function Features() {
  const features = [
    {
      title: "Live Match Scoring",
      description:
        "Score every ball in real time with automatic updates, player stats, and commentary — built for professional and local matches alike.",
      icon: "ri-play-circle-line",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      title: "YouTube Live Streaming",
      description:
        "Stream matches directly to YouTube with live overlays, real-time score sync, and HD quality streaming.",
      icon: "ri-youtube-line",
      gradient: "from-red-500 to-red-600",
    },
    {
      title: "Tournament Management",
      description:
        "Easily create tournaments, manage fixtures, update points tables, and handle knockout stages — all in one place.",
      icon: "ri-trophy-line",
      gradient: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Fantasy Cricket",
      description:
        "Enjoy fantasy leagues linked with real match data. Compete with friends and experience cricket in a new way.",
      icon: "ri-gamepad-line",
      gradient: "from-purple-500 to-purple-600",
      tag: "Coming Soon",
    },
    {
      title: "Player Insights",
      description:
        "Track detailed player stats including runs, averages, and strike rates with smart analytics and insights.",
      icon: "ri-bar-chart-line",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Team Analytics",
      description:
        "Analyze team performance with trends, comparisons, and historical match data for better decision-making.",
      icon: "ri-pie-chart-line",
      gradient: "from-indigo-500 to-indigo-600",
      tag: "Coming Soon",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 text-gray-800 relative overflow-hidden">
      {/* Decorative Backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-24 w-40 h-40 bg-gray-100/40 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-32 h-32 bg-gray-200/40 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Tagline */}
        <div
          className="inline-block bg-gray-100/60 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
          data-aos="fade-up"
        >
          POWERED BY PASSION FOR CRICKET
        </div>

        {/* Heading */}
        <h2
          className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Explore the{" "}
          <span className="bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
            Ultimate Cricket Experience
          </span>
        </h2>

        {/* Subtext */}
        <p
          className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Cricshub is officially live on Google Play! Discover powerful features
          built for players, scorers, and fans — manage tournaments, stream
          matches, and track every moment of the game.
        </p>

        {/* Feature Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Coming Soon Tag */}
              {feature.tag && (
                <span className="absolute top-3 right-3 text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                  {feature.tag}
                </span>
              )}

              <div
                className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
              >
                <i className={`${feature.icon} text-xl text-white`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
