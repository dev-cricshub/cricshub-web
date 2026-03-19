"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMatchPlaylist, MediaAsset } from "@/lib/api";

// ═══════════════════════════════════════════════════════════
// MEDIA REEL OVERLAY — tpl-pro-5
// Full-screen broadcast-style ad/media player.
// Loops through uploaded assets one by one.
// ═══════════════════════════════════════════════════════════

const IMAGE_DURATION_MS = 8000;
const FADE_MS           = 500;

export default function MediaReelOverlay({ matchId, refreshKey = 0 }: { matchId: string; refreshKey?: number }) {
  const [assets, setAssets]   = useState<MediaAsset[]>([]);
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded]   = useState(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef              = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchMatchPlaylist(matchId).then((list) => {
      if (list.length > 0) {
        setAssets(list);
        setIndex(0);
        setLoaded(true);
      }
    });
  }, [matchId, refreshKey]);

  const advance = () => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % assets.length);
      setVisible(true);
    }, FADE_MS);
  };

  useEffect(() => {
    if (!loaded || assets.length === 0) return;
    const current = assets[index];
    if (!current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (current.type === "IMAGE") {
      timerRef.current = setTimeout(advance, IMAGE_DURATION_MS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, loaded, assets]);

  if (!loaded || assets.length === 0) return null;

  const current = assets[index];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: "#000", overflow: "hidden" }}>

      {/* ── Full-bleed media ── */}
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

      {/* ── Gradient vignettes ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 18%),
          linear-gradient(0deg,   rgba(0,0,0,0.72) 0%, transparent 32%)
        `,
      }} />

      {/* ══════════════════════════════════════════════
          LOWER THIRD — broadcast info bar
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
      }}>
        {/* Thin accent rule at the very top of the bar */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.9) 12%, rgba(217,119,6,0.9) 88%, transparent 100%)",
        }} />

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 44px 22px",
          gap: 24,
        }}>

          {/* Left block: label */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Vertical accent bar */}
            <div style={{
              width: 3, alignSelf: "stretch",
              background: "#D97706",
              borderRadius: 2,
              minHeight: 32,
            }} />
            <div>
              <div style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 10,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                letterSpacing: 3.5,
                textTransform: "uppercase",
                marginBottom: 3,
                lineHeight: 1,
              }}>
                Commercial Break
              </div>
              <div style={{
                color: "#FFFFFF",
                fontSize: 30,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                lineHeight: 1,
              }}>
                Advertisement
              </div>
            </div>
          </div>

          {/* Right block: counter + progress */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9 }}>
            <div style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 11,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              letterSpacing: 2,
              lineHeight: 1,
            }}>
              {index + 1}&nbsp;/&nbsp;{assets.length}
            </div>
            {/* Progress segments */}
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {assets.map((_, i) => (
                <div key={i} style={{
                  height: 3,
                  width: i === index ? 32 : 10,
                  borderRadius: 2,
                  background: i === index ? "#D97706" : "rgba(255,255,255,0.2)",
                  transition: "width 0.4s ease, background 0.4s ease",
                }} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TOP-RIGHT — on-air indicator
      ══════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        top: 24, right: 36,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#D97706",
          flexShrink: 0,
          animation: "onAirPulse 2s ease-in-out infinite",
        }} />
        <span style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 11,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}>
          Ad Break
        </span>
      </div>

      <style>{`
        @keyframes onAirPulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
