'use client';
import Image from 'next/image'; // Import the Image component from Next.js
import Link from 'next/link'; // Import Link from Next.js for navigation

export default function Footer() {
  // Define social media channels with their links and icons
  const socialChannels = [
    {
      name: "LinkedIn",
      icon: "ri-linkedin-box-fill", // Using filled icon for solid look
      link: "https://www.linkedin.com/company/cricshub/about/" // Replace with actual LinkedIn
    },
    {
      name: "X (Twitter)",
      icon: "ri-twitter-x-fill", // Using filled icon for solid look
      link: "https://twitter.com/your-twitter-handle" // Replace with actual Twitter
    },
    {
      name: "Instagram",
      icon: "ri-instagram-fill", // Using filled icon for solid look
      link: "https://www.instagram.com/cricshubapp/" // Replace with actual Instagram
    },
    // You can add more social channels here
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-800 via-gray-600 to-gray-800 text-white py-20 relative overflow-hidden font-sans"> {/* Changed to grayish-black gradient */}
      {/* Background Decorations - Adjusted for grayish-black theme */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info Section */}
          <div className="col-span-1 lg:col-span-2"> {/* Takes more space on larger screens */}
            <Link href="/" className="flex items-center mb-6 group w-fit"> {/* w-fit to prevent stretching */}
                <Image 
                  src="/images/iconLogo.png" 
                  alt="CricsHub Icon Logo" 
                  width={64} 
                  height={64} 
                  className="rounded-full mr-4 shadow-lg group-hover:scale-105 transition-transform duration-300" 
                />
              {/* Text Logo - Remains as image, should contrast well with dark gray */}
              <Image
                src="/images/textLogo.png" // Path to your text logo
                alt="CricsHub Text Logo"
                width={200} // Adjust width as needed for your text logo image
                height={60} // Adjust height to maintain aspect ratio, or set to 'auto' with fill for responsive
                className="object-contain group-hover:scale-105 transition-transform duration-200" // object-contain ensures it fits without cropping
              />
            </Link>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md"> {/* Text color adjusted for contrast */}
              The ultimate cricket platform bringing live scoring, streaming, tournament management, and fantasy cricket to enthusiasts worldwide.
            </p>
            {/* Social Media Icons - Adjusted hover color */}
            <div className="flex space-x-6">
              {socialChannels.map((channel, index) => (
                <a 
                  key={index} 
                  href={channel.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 transform hover:scale-125" // Adjusted text and hover color
                  aria-label={`Follow us on ${channel.name}`}
                >
                  <i className={`${channel.icon} text-3xl`}></i>
                </a>
              ))}
            </div>
          </div>
          
          {/* Features Section */}
          <div>
            <h4 className="text-2xl font-bold mb-8 text-white">Features</h4> {/* Text color adjusted for contrast */}
            <ul className="space-y-4">
              <li>
                <span className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group cursor-default"> {/* Text and hover color adjusted */}
                  Live Match Scoring
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group cursor-default"> {/* Text and hover color adjusted */}
                  YouTube Streaming
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group cursor-default"> {/* Text and hover color adjusted */}
                  Tournament Management
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group cursor-default"> {/* Text and hover color adjusted */}
                  Fantasy Cricket
                </span>
              </li>
            </ul>
          </div>
          
          {/* Support Section - Corrected links */}
          <div>
            <h4 className="text-2xl font-bold mb-8 text-white">Support</h4> {/* Text color adjusted for contrast */}
            <ul className="space-y-4">
              {/* Corrected: Link to Contact Us page */}
              <li>
                <Link href="/contact-us" className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group"> {/* Text and hover color adjusted */}
                  Contact Us
                </Link>
              </li>
              {/* Privacy Policy link */}
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group"> {/* Text and hover color adjusted */}
                  Privacy Policy
                </Link>
              </li>
              {/* Terms of Service added here */}
              <li>
                <Link href="/terms-of-service" className="text-gray-300 hover:text-blue-300 transition-colors duration-200 flex items-center group"> {/* Text and hover color adjusted */}
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright Section - Simplified */}
        <div className="border-t border-gray-700 pt-10 text-center"> {/* Border color adjusted for contrast */}
          <p className="text-gray-400 text-md"> {/* Text color adjusted for contrast */}
            © {new Date().getFullYear()} CricsHub. All rights reserved. Transforming cricket experiences worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}