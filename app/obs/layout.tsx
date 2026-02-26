import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cricshub OBS Overlay",
};

export default function ObsLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <style>{`
          *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            background: transparent !important;
            background-color: transparent !important;
            overflow: hidden;
            width: 1920px;
            height: 1080px;
          }
        `}</style>
            </head>
            <body style={{ background: 'transparent', backgroundColor: 'transparent' }}>
                {children}
            </body>
        </html>
    );
}