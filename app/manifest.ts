import type { MetadataRoute } from "next";

// Lets phones "Add to Home Screen" and launch CricsHub full-screen, without browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CricsHub",
    short_name: "CricsHub",
    description: "Live cricket streaming studio, auctions and scoring tools.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060A12",
    theme_color: "#060A12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
