import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricsHub | The Ultimate Cricket App",
  description: "CricsHub is the ultimate all-in-one cricket app for live scores, live streaming, and fantasy sports. Get real-time match updates, manage tournaments with powerful tools, and build your winning fantasy team. Your comprehensive cricket journey starts here!",

  keywords: ["cricket", "live scoring", "local fantasy", "stream", "live scores", "fantasy cricket", "cricket app", "live streaming", "cricket tournament", "cricket news", "IPL", "T20"],
  openGraph: {
    title: "CricsHub: Live Cricket Scores, Manage Tournament & Play Fantasy!",
    description: "Your all-in-one app for live scores, streaming, tournament tools, and fantasy cricket. Coming soon!",

    url: "https://www.cricshub.com",
    siteName: "CricsHub",
    images: [
      {
        url: "http://res.cloudinary.com/di4m8pzsa/image/upload/v1754663685/qqbx5oi2kzptbbwrbv4r.png",
        width: 1200,
        height: 630,
        alt: "CricsHub | Live Cricket Scores, Manage Tournament & Play Fantasy!",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "images/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#090C12" },
  ],
};

// Applies the saved theme before first paint so there's no light/dark flash.
// Stored value: "light" | "dark" | "system" (default "light").
const themeInit = `(function(){try{var t=localStorage.getItem('ch-theme')||'light';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        {children}
      </body>
    </html>
  );
}
