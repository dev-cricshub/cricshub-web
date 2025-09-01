import React, { useEffect } from 'react';
import Image from 'next/image';

const Do = () => {
  useEffect(() => {
    // Initialize AOS
    if (typeof window !== 'undefined') {
      const AOS = require('aos');
      AOS.init({
        duration: 800,
        once: true,
      });
    }
  }, []);

  return (
    <section className="py-24 bg-white text-gray-800 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gray-100/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-200/50 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div 
            className="inline-block bg-gray-100/50 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            CORE FEATURES
          </div>
          <h2 
            className="text-5xl md:text-6xl font-bold text-gray-800 mb-6"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            What We Can Do?
            <span className="block bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
              For Cricket Enthusiasts
            </span>
          </h2>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            CricsHub provides all the tools you need to enjoy cricket like never before - from live scoring to streaming and tournaments.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 mt-12">
          {/* Left Features */}
          <div className="flex flex-col gap-6 w-full lg:w-1/4">
            <div 
              className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              data-aos="fade-right"
              data-aos-delay="400"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <i className="ri-time-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">Real-time Match Setup</h3>
                <p className="text-gray-600">Emphasize instant, real-time match setup with intuitive tools.</p>
              </div>
            </div>
            
            <div 
              className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              data-aos="fade-right"
              data-aos-delay="500"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <i className="ri-team-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-300">Team Creation</h3>
                <p className="text-gray-600">Feature team creation for players with comprehensive management tools.</p>
              </div>
            </div>
            
            <div 
              className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              data-aos="fade-right"
              data-aos-delay="600"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <i className="ri-live-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors duration-300">Live Streaming</h3>
                <p className="text-gray-600">Go live! Stream your cricket matches instantly to share with friends and family.</p>
              </div>
            </div>
          </div>
          
          {/* Phone Image */}
          <div 
            className="mb-10 lg:mb-0 lg:mx-8 flex justify-center"
            data-aos="zoom-in"
            data-aos-delay="700"
          >
            <Image
              src="/images/phone.png"
              alt="A mobile phone showcasing the Cricshub app interface"
              width={300}
              height={600}
              className="rounded-lg"
            />
          </div>
          
          {/* Right Features */}
          <div className="flex flex-col gap-6 w-full lg:w-1/4">
            <div 
              className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              data-aos="fade-left"
              data-aos-delay="400"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <i className="ri-trophy-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors duration-300">Tournament Management</h3>
                <p className="text-gray-600">Highlight the ability to organize and manage tournaments with ease.</p>
              </div>
            </div>
            
            <div 
              className="flex items-start p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              data-aos="fade-left"
              data-aos-delay="500"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <i className="ri-line-chart-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors duration-300">Fantasy Leaderboards</h3>
                <p className="text-gray-600">Pick your team, earn points, and climb the live leaderboards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Remix Icon CDN */}
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
    </section>
  );
};

export default Do;