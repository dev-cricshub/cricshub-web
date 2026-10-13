// app/contact-us/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent } from 'react'; // Removed 'type' keyword

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  // Removed TypeScript type annotation for useState
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Social media channels (reused from Footer)
  const socialChannels = [
    {
      name: "LinkedIn",
      icon: "ri-linkedin-box-fill",
      link: "https://www.linkedin.com/company/cricshub/about/" // Replace with actual LinkedIn
    },
    {
      name: "X (Twitter)",
      icon: "ri-twitter-x-fill",
      link: "https://twitter.com/your-twitter-handle" // Replace with actual Twitter
    },
    {
      name: "Instagram",
      icon: "ri-instagram-fill",
      link: "https://www.instagram.com/_cricshub/" // Replace with actual Instagram
    },
  ];

  // Removed TypeScript type annotation for 'e'
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Removed TypeScript type annotation for 'event'
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitStatus('idle'); // Reset status
    setSubmitMessage(''); // Clear previous message

    // API payload mapping message to 'phone' field as per existing schema
    const apiData = {
      name: formData.name,
      email: formData.email,
      phone: formData.message, // Using 'phone' field for the message content
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
        setSubmitStatus('success');
        setSubmitMessage('Your message has been sent successfully! We will get back to you soon. 🎉');
        setFormData({ name: '', email: '', message: '' }); // Clear form
      } else {
        const errorText = await response.text();
        setSubmitStatus('error');
        setSubmitMessage(`Failed to send message: ${errorText}. Please try again.`);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
      setSubmitMessage('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-4xl w-full mb-8">
        {/* Logo Section */}
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
          Contact CricsHub
        </h1>

        <p className="text-gray-700 mb-8 leading-relaxed text-center max-w-2xl mx-auto">
          Have questions, feedback, or just want to say hello? We'd love to hear from you! Fill out the form below or reach out to us directly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Direct Contact Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left p-6 bg-gray-50 rounded-xl shadow-inner">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Get in Touch</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-center">
                <i className="ri-mail-line text-blue-600 text-xl mr-3"></i>
                <a href="mailto:support@cricshub.com" className="hover:text-blue-600 transition-colors duration-200">support@cricshub.com</a>
              </div>
              {/* Add phone or address if applicable */}
              {/* <div className="flex items-center">
                <i className="ri-phone-line text-blue-600 text-xl mr-3"></i>
                <span>+1 (123) 456-7890</span>
              </div> */}
              {/* <div className="flex items-start">
                <i className="ri-map-pin-line text-blue-600 text-xl mr-3 mt-1"></i>
                <span>CricsHub Headquarters, 123 Cricket Lane, Sportsville, ST 12345</span>
              </div> */}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Follow Us</h3>
            <div className="flex space-x-6">
              {socialChannels.map((channel, index) => (
                <a
                  key={index}
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 transform hover:scale-125"
                  aria-label={`Follow us on ${channel.name}`}
                >
                  <i className={`${channel.icon} text-3xl`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center md:text-left">Send Us a Message</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-gray-700 text-sm font-semibold mb-2">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300 resize-y"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
              {submitStatus !== 'idle' && (
                <p className={`mt-4 text-center font-semibold ${submitStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {submitMessage}
                </p>
              )}
            </form>
          </div>
        </div>

        <p className="text-gray-600 text-sm mt-8 text-center">
          We aim to respond to all inquiries within 24-48 business hours.
        </p>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-110 z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ContactUs;
