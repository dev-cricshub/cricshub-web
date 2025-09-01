'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export default function CommunityConnect() {
  const [dialogue, setDialogue] = useState({
    isVisible: false,
    message: '',
    isSuccess: false,
    isAlreadyRegistered: false
  });

  const [isLoading, setIsLoading] = useState(false);
  
  const socialChannels = [
    {
      name: "LinkedIn",
      icon: "ri-linkedin-box-line",
      value: "Connect with our team and career opportunities.",
      color: "bg-blue-500 hover:bg-blue-600",
      gradient: "from-blue-500 to-blue-600",
      link: "https://www.linkedin.com/company/cricshub/about/"
    },
    {
      name: "X (Twitter)",
      icon: "ri-twitter-x-fill",
      value: "Follow for real-time sneak peeks.",
      color: "bg-gray-700 hover:bg-gray-800",
      gradient: "from-gray-700 to-gray-800",
      link: "https://twitter.com/your-twitter-handle"
    },
    {
      name: "Instagram",
      icon: "ri-instagram-line",
      value: "Visual updates & community highlights.",
      color: "bg-pink-500 hover:bg-pink-600",
      gradient: "from-pink-500 to-pink-600",
      link: "https://www.instagram.com/cricshubapp/"
    },
    {
      name: "Email Us",
      icon: "ri-mail-line",
      value: "Drop us a line with your questions and ideas.",
      color: "bg-gray-700 hover:bg-gray-800",
      gradient: "from-gray-700 to-gray-800",
      link: "mailto:accounts@cricshub.com"
    }
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
  
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
  
    const apiData = {
      name: data.name,
      email: data.email,
      phone: data.interest,
    };
  
    try {
      const response = await fetch('https://userbasecrix.onrender.com/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
  
      if (response.ok) {
        setDialogue({
          isVisible: true,
          message: 'You have successfully joined the waitlist! 🎉 We\'ll keep you updated.',
          isSuccess: true,
          isAlreadyRegistered: false
        });
        form.reset();
      } else {
        const errorMessage = await response.text();
  
        if (errorMessage.includes("User with this email already exists")) {
          setDialogue({
            isVisible: true,
            message: 'You\'re already on our list! We\'ll keep you posted with the latest from CricsHub. 😉',
            isSuccess: false,
            isAlreadyRegistered: true
          });
        } else {
          setDialogue({
            isVisible: true,
            message: `Oops! There was an error joining the waitlist: ${errorMessage}. Please try again.`,
            isSuccess: false,
            isAlreadyRegistered: false
          });
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setDialogue({
        isVisible: true,
        message: 'There was a network error. Please check your connection and try again.',
        isSuccess: false,
        isAlreadyRegistered: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 bg-white text-gray-800 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gray-100/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-200/50 rounded-full blur-3xl"></div>

      {dialogue.isVisible && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-transform duration-300 scale-100`}>
            <div className="text-center">
              {dialogue.isSuccess ? (
                <div className="text-green-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : dialogue.isAlreadyRegistered ? (
                <div className="mb-4">
                  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBkaW9kcTNieXgzZWppYWl0eHJ0enZ6OTVyZmp6cm1qbXg1aTZmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nVE8OaIGkUhf7rkieR/giphy.gif" alt="Already registered" className="h-24 w-auto mx-auto" />
                </div>
              ) : (
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                {dialogue.isSuccess ? `You're all set!` : dialogue.isAlreadyRegistered ? 'You\'re All Set!' : 'Error!'}
              </h3>
              <p className="text-gray-600 mb-6">{dialogue.message}</p>
              <button
                onClick={() => setDialogue({ ...dialogue, isVisible: false })}
                className={`w-full px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${dialogue.isSuccess || dialogue.isAlreadyRegistered ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div
            className="inline-block bg-gray-100/50 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
          >
            JOIN THE COMMUNITY
          </div>
          <h2
            className="text-5xl md:text-6xl font-bold text-gray-800 mb-6"
          >
            Stay Connected with
            <span className="block bg-gradient-to-r from-blue-600 to-gray-700 bg-clip-text text-transparent">
              CricsHub Updates
            </span>
          </h2>
          <p
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Be the first to know about CricsHub's launch, exclusive beta access, and development insights.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Social Channels Section */}
          <div
            className="bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-8">Follow Our Journey</h3>
            <div className="space-y-6">
              {socialChannels.map((channel, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 group"
                >
                  <a href={channel.link} target="_blank" rel="noopener noreferrer" className="relative group flex items-center space-x-4 w-full">
                    <div className={`w-16 h-16 bg-gradient-to-r ${channel.gradient} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-md group-hover:shadow-lg p-2 sm:p-0`}>
                      <i className={`${channel.icon} text-white text-2xl`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors duration-300">{channel.name}</p>
                      <p className="text-gray-600">{channel.value}</p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          {/* Get Updates Form */}
          <div
            id="waitlist-form"
            className="bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-8">Join Our Exclusive Waitlist</h3>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <input 
                type="text" 
                name="name"
                placeholder="Your Name"
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                required
              />
              <input 
                type="email" 
                name="email"
                placeholder="Your Email Address"
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                required
              />
              <select 
                name="interest"
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300 appearance-none pr-8 custom-select"
                required
              >
                <option value="" disabled selected className="text-gray-500">I'm most excited about...</option>
                <option value="live-scoring" className="text-gray-800">Live Match Scoring</option>
                <option value="youtube-streaming" className="text-gray-800">YouTube Streaming</option>
                <option value="tournament-management" className="text-gray-800">Tournament Management</option>
                <option value="fantasy-cricket" className="text-gray-800">Fantasy Cricket</option>
                <option value="all-features" className="text-gray-800">All Features</option>
              </select>
              <style jsx>{`
                .custom-select {
                  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%234B5563' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
                  background-repeat: no-repeat;
                  background-position: right 1rem center;
                  background-size: 1.5em 1.5em;
                }
              `}</style>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer whitespace-nowrap flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Get Early Access & Updates'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}