// app/terms-of-service/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const TermsOfService = () => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Effect to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) { // Show button after scrolling down 300px
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
      behavior: 'smooth' // Smooth scroll animation
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-4xl w-full mb-8">
        {/* Logo Section */}
        <div className="flex justify-center items-center mb-10">
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/iconLogo.png" // Path to your icon logo
              alt="CricsHub Icon Logo"
              width={64}
              height={64}
              className="rounded-full mr-4 shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            <Image
              src="/images/textLogo.png" // Path to your text logo
              alt="CricsHub Text Logo"
              width={200}
              height={60}
              className="object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Terms of Service for Cricshub
        </h1>

        <p className="text-gray-700 mb-4 leading-relaxed">
          Welcome to Cricshub! These Terms of Service ("Terms") govern your use of the Cricshub website located at www.cricshub.com (the "Service"). Please read these Terms carefully before using our Service.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          1. Definitions
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>
            <strong className="font-semibold">Account:</strong> A unique account created for You to access our Service or parts of our Service.
          </li>
          <li>
            <strong className="font-semibold">Company:</strong> Refers to Cricshub ("We", "Us", "Our").
          </li>
          <li>
            <strong className="font-semibold">Service:</strong> Refers to the Website.
          </li>
          <li>
            <strong className="font-semibold">Website:</strong> Refers to Cricshub, accessible from www.cricshub.com
          </li>
          <li>
            <strong className="font-semibold">You:</strong> Means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
          </li>
        </ul>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          2. User Accounts
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party social media Service.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          3. Prohibited Uses
        </h2>
        <p className="text-gray-700 mb-2 leading-relaxed">
          You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>In any way that violates any applicable national or international law or regulation.</li>
          <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
          <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
          <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
          <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
        </ul>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          4. Intellectual Property
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The Service and its original content (excluding content provided by you or other users), features, and functionality are and will remain the exclusive property of Cricshub and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Cricshub.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          5. Links to Other Websites
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Our Service may contain links to third-party web sites or services that are not owned or controlled by Cricshub.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Cricshub has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Cricshub shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          6. Termination
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          We may terminate or suspend your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Service.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Upon termination, your right to use the Service will immediately cease. If you wish to terminate your Account, you may simply discontinue using the Service.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          7. Limitation of Liability
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Notwithstanding any damages that you might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          8. Governing Law
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The laws of India, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          9. Changes to These Terms of Service
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          10. Contact Us
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          If you have any questions about these Terms of Service, you can contact us:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>By email: support@cricshub.com</li>
          <li>By visiting this page on our website: www.cricshub.com/contact</li>
        </ul>

        <p className="text-gray-600 text-sm mt-8 text-center">
          Last updated: August 4, 2025
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

export default TermsOfService;
