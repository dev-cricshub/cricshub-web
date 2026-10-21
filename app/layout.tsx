import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { fontVariables } from "./styles/fonts";

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
    icon: "/images/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  // Installed to the home screen, iOS opens CricsHub full-screen like a native app.
  appleWebApp: {
    capable: true,
    title: "CricsHub",
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content reach under the notch / home indicator; headers and bars pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: "#060A12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark only: there is no light theme. data-theme drives the tokens and Tailwind's `dark:` variant.
    <html lang="en" data-theme="dark" suppressHydrationWarning={true}>
      <body
        className={`${fontVariables} antialiased`}
      >
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        {children}
      </body>
    </html>
  );
}
