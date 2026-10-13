// Ensure this is at the very top for Client Components in App Router
'use client';

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Image from 'next/image'; // Import Image for the logo
import Link from 'next/link';   // Import Link for navigation to homepage

const PrivacyPolicy = () => {
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
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-4xl w-full mb-8"> {/* Adjusted margin-bottom */}
        {/* Logo Section */}
        <div className="flex justify-center items-center mb-10">
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/iconLogo.png" // Path to your icon logo
              alt="CricsHub Icon Logo"
              width={64} // Size for icon
              height={64}
              className="rounded-full mr-4 shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            {/* REPLACED TEXT WITH IMAGE FOR THE TEXT LOGO */}
            <Image
              src="/images/textLogo.png" // Path to your text logo
              alt="CricsHub Text Logo"
              width={200} // Adjust width as needed for your text logo image
              height={60} // Adjust height to maintain aspect ratio, or set to 'auto' with fill for responsive
              className="object-contain group-hover:scale-105 transition-transform duration-200" // object-contain ensures it fits without cropping
            />
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Privacy Policy for Cricshub App and Website
        </h1>

        <p className="text-gray-700 mb-4 leading-relaxed">
          This Privacy Policy describes how Cricshub ("we," "us," or "our") collects, uses, and discloses your information when you use our mobile application (the "App") and our website, www.cricshub.com (the "Website"). By accessing or using the App or Website, you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          1. Information We Collect
        </h2>

        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mt-6 mb-3">
          1.1. Information Collected by the Cricshub App
        </h3>
        <p className="text-gray-700 mb-2 leading-relaxed">
          When you use the Cricshub App, we collect several types of information from and about users, including:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>
            <strong className="font-semibold">Personal Information:</strong> Information that can be used to identify you, such as your name, email address, and any other information you provide when you register for an account, subscribe to our newsletter, or contact us.
          </li>
          <li>
            <strong className="font-semibold">Usage Data:</strong> Information about how you access and use the App, such as your device IP address, device type, operating system, app features accessed, and the dates and times of your sessions.
          </li>
          <li>
            <strong className="font-semibold">Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies (like web beacons and pixels) to track activity on our App and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </li>
        </ul>

        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mt-6 mb-3">
          1.2. Information Collected by the Cricshub Website (www.cricshub.com)
        </h3>
        <p className="text-gray-700 mb-4 leading-relaxed">
          When you visit our website, www.cricshub.com, we primarily collect information you voluntarily provide through forms, such as:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>
            <strong className="font-semibold">Name:</strong> When you submit inquiries or sign up for newsletters.
          </li>
          <li>
            <strong className="font-semibold">Email Address:</strong> When you submit inquiries or sign up for newsletters.
          </li>
        </ul>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The website's data collection is limited to these purposes to respond to your requests and manage subscriptions.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          2. How We Use Your Information
        </h2>
        <p className="text-gray-700 mb-2 leading-relaxed">
          We use the collected information for various purposes, including to:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>Provide and maintain our App.</li>
          <li>Improve, personalize, and expand our App.</li>
          <li>Understand and analyze how you use our App.</li>
          <li>Develop new products, services, features, and functionality.</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the App and Website, and for marketing and promotional purposes.</li>
          <li>Send you emails.</li>
          <li>Find and prevent fraud.</li>
        </ul>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          3. How We Share Your Information
        </h2>
        <p className="text-gray-700 mb-2 leading-relaxed">
          We may share your information in the following situations:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>
            <strong className="font-semibold">With Service Providers:</strong> We may share your personal information with service providers to monitor and analyze the use of our App and Website, and to contact you.
          </li>
          <li>
            <strong className="font-semibold">For Business Transfers:</strong> We may share or transfer your personal information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
          </li>
          <li>
            <strong className="font-semibold">With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include our parent company and any other subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.
          </li>
          <li>
            <strong className="font-semibold">With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.
          </li>
          <li>
            <strong className="font-semibold">With Other Users:</strong> When you share personal information or otherwise interact in the public areas of the App, such information may be viewed by all users and may be publicly distributed outside.
          </li>
          <li>
            <strong className="font-semibold">With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
          </li>
        </ul>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          4. Data Retention
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          5. Your Data Protection Rights
        </h2>
        <p className="text-gray-700 mb-2 leading-relaxed">
          Depending on your location, you may have the following rights regarding your personal data:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>
            <strong className="font-semibold">The right to access</strong> – You have the right to request copies of your personal data.
          </li>
          <li>
            <strong className="font-semibold">The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.
          </li>
          <li>
            <strong className="font-semibold">The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.
          </li>
          <li>
            <strong className="font-semibold">The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.
          </li>
          <li>
            <strong className="font-semibold">The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.
          </li>
          <li>
            <strong className="font-semibold">The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.
          </li>
        </ul>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          6. Security of Your Personal Information
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The security of your personal information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          7. Links to Other Websites
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Our App and Website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          8. Children's Privacy
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Our App and Website do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from anyone under the age of 13 without verification of parental consent, we take steps to remove that information from our servers.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          9. Changes to This Privacy Policy
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our App or Website, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
          10. Contact Us
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          If you have any questions about this Privacy Policy, you can contact us:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4 pl-4 space-y-2">
          <li>By email: support@cricshub.com</li>
          <li>By visiting this page on our website: <a href="https://www.cricshub.com" className="text-blue-600 hover:underline">www.cricshub.com</a></li>
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

export default PrivacyPolicy;