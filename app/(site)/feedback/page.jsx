'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('https:app.cricshub.com/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Thank you for your feedback! 🎉');
        setFormData({ userName: '', userEmail: '', message: '' });
      } else {
        const errorText = await response.text();
        setSubmitStatus('error');
        setSubmitMessage(`Failed to send feedback: ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
      setSubmitMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-3xl w-full mb-8">
        {/* Logo */}
        <div className="flex justify-center items-center mb-10">
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/iconLogo.png"
              alt="CricsHub Icon Logo"
              width={64}
              height={64}
              className="rounded-full mr-4 shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            <Image
              src="/images/textLogo.png"
              alt="CricsHub Text Logo"
              width={200}
              height={60}
              className="object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">
          We Value Your Feedback 💬
        </h1>
        <p className="text-gray-700 mb-8 leading-relaxed text-center max-w-2xl mx-auto">
          Help us make CricsHub even better! Share your thoughts, suggestions, or experiences with us below.
        </p>

        <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userName" className="block text-gray-700 text-sm font-semibold mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 
                           focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                required
              />
            </div>

            <div>
              <label htmlFor="userEmail" className="block text-gray-700 text-sm font-semibold mb-2">
                Your Email
              </label>
              <input
                type="email"
                id="userEmail"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                placeholder="john.doe@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 
                           focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-gray-700 text-sm font-semibold mb-2">
                Your Feedback
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 
                           focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300 resize-y"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
                         text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 
                         transform hover:scale-105 shadow-lg cursor-pointer flex items-center justify-center 
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                      5.291A7.962 7.962 0 014 12H0c0 3.042 
                      1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>

            {submitStatus !== 'idle' && (
              <p
                className={`mt-4 text-center font-semibold ${
                  submitStatus === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {submitMessage}
              </p>
            )}
          </form>
        </div>

        <p className="text-gray-600 text-sm mt-8 text-center">
          Your opinions matter — thank you for helping us improve CricsHub!
        </p>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 
                     transition-all duration-300 transform hover:scale-110 z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FeedbackPage;
