import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import AOSInitializer from './components/AOSInitializer';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricsHub | Live Cricket Scores, Manage Tournament & Play Fantasy!",
  description:"CricsHub is the ultimate all-in-one cricket app for live scores, live streaming, and fantasy sports. Get real-time match updates, manage tournaments with powerful tools, and build your winning fantasy team. Your comprehensive cricket journey starts here!",

  keywords: ["cricket","live scoring","local fantasy","stream", "live scores", "fantasy cricket", "cricket app", "live streaming", "cricket tournament", "cricket news", "IPL", "T20"],
  openGraph: {
    title: "CricsHub: The Ultimate Cricket App",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        <AOSInitializer />
        {children}
      </body>
    </html>
  );
}