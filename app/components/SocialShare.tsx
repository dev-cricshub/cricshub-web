'use client';

export default function CommunityConnect() {
  const socialChannels = [
    {
      name: "LinkedIn",
      icon: "ri-linkedin-box-line",
      value: "Follow our journey and connect professionally.",
      gradient: "from-blue-500 to-blue-600",
      link: "https://www.linkedin.com/company/cricshub/about/"
    },
    {
      name: "X (Twitter)",
      icon: "ri-twitter-x-fill",
      value: "Get real-time updates and insights.",
      gradient: "from-gray-700 to-gray-800",
      link: "https://twitter.com/your-twitter-handle"
    },
    {
      name: "Instagram",
      icon: "ri-instagram-line",
      value: "Catch visual highlights and cricket moments.",
      gradient: "from-pink-500 to-pink-600",
      link: "https://www.instagram.com/cricshubapp/"
    },
    {
      name: "Email Us",
      icon: "ri-mail-line",
      value: "Reach out for collaborations or feedback.",
      gradient: "from-gray-700 to-gray-800",
      link: "mailto:accounts@cricshub.com"
    }
  ];

  return (
    <section className="py-24 bg-white text-gray-800 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gray-100/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-200/50 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Tagline */}
        <div
          className="inline-block bg-gray-100/60 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-full text-sm font-semibold mb-4 border border-gray-300"
          data-aos="fade-up"
        >
          CONNECT WITH CRICSHUB
        </div>

        {/* Heading */}
        <h2
          className="text-5xl md:text-6xl font-bold text-gray-800 mb-6"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Join Our{" "}
          <span className="bg-gradient-to-r from-blue-600 to-gray-700 bg-clip-text text-transparent">
            Global Cricket Community
          </span>
        </h2>

        {/* Subtext */}
        <p
          className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Cricshub is officially live! Connect with us across social platforms to stay
          updated on new features, live match events, and exclusive cricket content.
        </p>

        {/* Social Channels */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-5xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          {socialChannels.map((channel, index) => (
            <a
              key={index}
              href={channel.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300`}
              >
                <i className={`${channel.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                {channel.name}
              </h3>
              <p className="text-gray-600 text-sm">{channel.value}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Remix Icon CDN */}
      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </section>
  );
}
