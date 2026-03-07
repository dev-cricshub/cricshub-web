"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMatchPlaylist, MediaAsset } from "@/lib/api";

// ═══════════════════════════════════════════════════════════
// MEDIA REEL OVERLAY — tpl-pro-5
// Full-screen broadcast-style ad/media player.
// Loops through uploaded assets one by one.
// ═══════════════════════════════════════════════════════════

const IMAGE_DURATION_MS = 8000; // how long each image is shown
const FADE_MS           = 400;  // cross-fade transition

export default function MediaReelOverlay({ matchId, refreshKey = 0 }: { matchId: string; refreshKey?: number }) {
  const [assets, setAssets]       = useState<MediaAsset[]>([]);
  const [index, setIndex]         = useState(0);
  const [visible, setVisible]     = useState(true); // for fade transition
  const [loaded, setLoaded]       = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef                  = useRef<HTMLVideoElement | null>(null);

  // Load playlist on mount and whenever the streamer saves a new sequence
  useEffect(() => {
    fetchMatchPlaylist(matchId).then((list) => {
      if (list.length > 0) {
        setAssets(list);
        setIndex(0);
        setLoaded(true);
      }
    });
  }, [matchId, refreshKey]);

  // Advance to next asset (with fade)
  const advance = () => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % assets.length);
      setVisible(true);
    }, FADE_MS);
  };

  // Schedule next asset when current one changes
  useEffect(() => {
    if (!loaded || assets.length === 0) return;

    const current = assets[index];
    if (!current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (current.type === "IMAGE") {
      timerRef.current = setTimeout(advance, IMAGE_DURATION_MS);
    }
    // For VIDEO, onEnded triggers advance (see videoRef below)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, loaded, assets]);

  if (!loaded || assets.length === 0) return null;

  const current = assets[index];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        // Layered abstract background
        background: `
          repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 40px,
            rgba(217,119,6,0.025) 40px,
            rgba(217,119,6,0.025) 41px
          ),
          radial-gradient(ellipse at 20% 50%, rgba(120,40,0,0.35) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 50%, rgba(30,20,80,0.4) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 0%,  rgba(217,119,6,0.12) 0%, transparent 50%),
          linear-gradient(160deg, #07080f 0%, #0d0f1e 50%, #090608 100%)
        `,
      }}
    >
      {/* ── Ambient glow blobs behind the frame ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 500, height: 300,
          left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(217,119,6,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        {/* Thin horizontal scan lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)",
        }} />
      </div>

      {/* ── AD BREAK badge ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(90deg, #b45309 0%, #d97706 50%, #b45309 100%)",
          borderRadius: 5,
          padding: "8px 28px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 24px rgba(217,119,6,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* Shimmer sweep */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 5,
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
          animation: "reelShimmer 2.8s ease-in-out infinite",
        }} />
        <div style={{
          width: 10, height: 10, borderRadius: "50%", background: "#fff",
          animation: "reelPing 1.4s ease-in-out infinite", flexShrink: 0,
        }} />
        <span style={{
          color: "#fff", fontSize: 22,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, letterSpacing: 5, textTransform: "uppercase",
          textShadow: "0 1px 6px rgba(0,0,0,0.4)",
        }}>
          AD BREAK
        </span>
      </div>

      {/* ── Frame wrapper with side decorations ── */}
      <div style={{ position: "relative", width: "80%" }}>

        {/* Left side bar */}
        <div style={{
          position: "absolute", left: -18, top: "10%", bottom: "10%",
          width: 3,
          background: "linear-gradient(180deg, transparent 0%, rgba(217,119,6,0.7) 30%, rgba(217,119,6,0.7) 70%, transparent 100%)",
          borderRadius: 2,
        }} />
        <div style={{
          position: "absolute", left: -26, top: "30%", bottom: "30%",
          width: 2,
          background: "linear-gradient(180deg, transparent 0%, rgba(217,119,6,0.35) 50%, transparent 100%)",
          borderRadius: 2,
        }} />

        {/* Right side bar */}
        <div style={{
          position: "absolute", right: -18, top: "10%", bottom: "10%",
          width: 3,
          background: "linear-gradient(180deg, transparent 0%, rgba(217,119,6,0.7) 30%, rgba(217,119,6,0.7) 70%, transparent 100%)",
          borderRadius: 2,
        }} />
        <div style={{
          position: "absolute", right: -26, top: "30%", bottom: "30%",
          width: 2,
          background: "linear-gradient(180deg, transparent 0%, rgba(217,119,6,0.35) 50%, transparent 100%)",
          borderRadius: 2,
        }} />

        {/* Broadcast frame */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: `
              0 0 0 1px rgba(217,119,6,0.6),
              0 0 0 3px rgba(217,119,6,0.12),
              0 0 40px rgba(217,119,6,0.2),
              0 20px 60px rgba(0,0,0,0.85)
            `,
          }}
        >
          {/* Media */}
          <div style={{
            position: "absolute", inset: 0,
            opacity: visible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
          }}>
            {current.type === "IMAGE" ? (
              <img key={current.id} src={current.url} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <video key={current.id} ref={videoRef} src={current.url}
                autoPlay playsInline onEnded={advance}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>

          {/* Bottom gradient + counter */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 56,
            background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 18px", zIndex: 2,
          }}>
            <span style={{
              color: "rgba(255,255,255,0.5)", fontSize: 12,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600, letterSpacing: 1,
            }}>
              {index + 1} / {assets.length}
            </span>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {assets.map((_, i) => (
                <div key={i} style={{
                  width: i === index ? 22 : 6, height: 6, borderRadius: 3,
                  background: i === index ? "#D97706" : "rgba(255,255,255,0.22)",
                  transition: "width 0.3s ease, background 0.3s ease",
                }} />
              ))}
            </div>
            <span style={{
              color: "rgba(255,255,255,0.35)", fontSize: 10,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              {current.type === "VIDEO" ? "▶ Video" : "◼ Image"}
            </span>
          </div>

          {/* Corner brackets inside the frame */}
          {[
            { top: 0,    left: 0,  borderTop: "2px solid rgba(217,119,6,0.9)", borderLeft:  "2px solid rgba(217,119,6,0.9)" },
            { top: 0,    right: 0, borderTop: "2px solid rgba(217,119,6,0.9)", borderRight: "2px solid rgba(217,119,6,0.9)" },
            { bottom: 0, left: 0,  borderBottom: "2px solid rgba(217,119,6,0.9)", borderLeft:  "2px solid rgba(217,119,6,0.9)" },
            { bottom: 0, right: 0, borderBottom: "2px solid rgba(217,119,6,0.9)", borderRight: "2px solid rgba(217,119,6,0.9)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 22, height: 22, zIndex: 3, pointerEvents: "none", ...s }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes reelPing {
          0%  { transform: scale(1);   opacity: 1; }
          70% { transform: scale(2.2); opacity: 0; }
          100%{ transform: scale(1);   opacity: 0; }
        }
        @keyframes reelShimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
