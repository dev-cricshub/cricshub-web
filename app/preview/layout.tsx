import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CricShub Overlay Preview",
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            background: transparent;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
