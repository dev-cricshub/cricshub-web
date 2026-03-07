"use client";

// ═══════════════════════════════════════════════════════════
// BRANDING OVERLAY — tpl-pro-4
// Persistent layer, sits above all other overlays (z-index 100)
// Everything is optional — streamer toggles per feature
// ═══════════════════════════════════════════════════════════

export interface BrandingConfig {
  // Logo
  logoUrl: string | null; // null = show CricShub default logo
  // Top left block
  showLogo: boolean;
  showLiveBadge: boolean;
  showMatchTitle: boolean;
  matchTitle: string; // e.g. "IPL 2026 · RCB vs MI"
  // Bottom left
  showSocialHandle: boolean;
  socialHandle: string; // e.g. "@cricfan99"
  // Bottom right
  showSponsor: boolean;
  sponsorLogoUrl: string | null;
  sponsorLabel: string; // e.g. "Powered by"
  // Full screen
  showWatermark: boolean;
  showVignette: boolean;
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  logoUrl: null,
  showLogo: true,
  showLiveBadge: true,
  showMatchTitle: true,
  matchTitle: "Live Cricket",
  showSocialHandle: false,
  socialHandle: "",
  showSponsor: false,
  sponsorLogoUrl: null,
  sponsorLabel: "Powered by",
  showWatermark: false,
  showVignette: true,
};

// ═══════════════════════════════════════════════════════════
// CRICSHUB DEFAULT LOGO (SVG wordmark fallback)
// ═══════════════════════════════════════════════════════════

function CricShubLogo({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        // Heavy drop shadow so the whole logo pops off the live video feed
        filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.8))",
      }}
    >
      {/* Icon Logo (JPG) */}
      <img
        src="/images/iconLogoTransparent.png"
        alt="Cricshub Icon"
        style={{
          width: size*2,
          height: size*2,
          borderRadius: "50%", // 🔥 Chops off the ugly white corners of the JPG
          objectFit: "cover",
          flexShrink: 0,
        }}
      />

      {/* Text Logo (PNG) */}
      <img
        src="/images/textLogo.png"
        alt="Cricshub Text"
        style={{
          height: size * 0.75,
          objectFit: "contain",
          // 🔥 THE TEXT FIX:
          // invert(1) turns black to white
          // hue-rotate(180deg) spins the inverted orange back to blue
          // brightness(1.5) makes it pop
          filter: "invert(1) hue-rotate(180deg) brightness(1.5)",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN OVERLAY
// ═══════════════════════════════════════════════════════════

export default function BrandingOverlay({
  config,
}: {
  config: BrandingConfig;
}) {
  const logoSize = 48;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
    >
      {/* ── CORNER VIGNETTE ── */}
      {config.showVignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
            radial-gradient(ellipse at top left,    rgba(0,0,0,0.55) 0%, transparent 40%),
            radial-gradient(ellipse at top right,   rgba(0,0,0,0.35) 0%, transparent 35%),
            radial-gradient(ellipse at bottom left, rgba(0,0,0,0.35) 0%, transparent 35%),
            radial-gradient(ellipse at bottom right,rgba(0,0,0,0.45) 0%, transparent 38%)
          `,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── WATERMARK — tiled faint logo ── */}
      {config.showWatermark && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            opacity: 0.035,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                style={{
                  position: "absolute",
                  left: `${col * 12 + (row % 2 === 0 ? 0 : 6)}%`,
                  top: `${row * 18 + 5}%`,
                  transform: "rotate(-20deg)",
                }}
              >
                <CricShubLogo size={22} />
              </div>
            )),
          )}
        </div>
      )}

      {/* ══ TOP LEFT — Logo Only ══ */}
      {config.showLogo && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            display: "flex",
            alignItems: "center",
            filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.8))",
          }}
        >
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Stream Logo"
              style={{
                height: logoSize,
                maxWidth: 160,
                objectFit: "contain",
              }}
            />
          ) : (
            <CricShubLogo size={logoSize} />
          )}
        </div>
      )}

      {/* ══ TOP RIGHT — LIVE Badge ══ */}
      {config.showLiveBadge && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            borderRadius: 6,
            padding: "6px 14px",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.15), 0 4px 16px rgba(220,38,38,0.55), 0 2px 6px rgba(0,0,0,0.4)",
          }}
        >
          {/* Pulsing dot */}
          <div
            style={{
              position: "relative",
              width: 8,
              height: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
                animation: "brandPing 1.5s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "1.5px",
                borderRadius: "50%",
                background: "#FFFFFF",
              }}
            />
          </div>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            Live
          </span>
        </div>
      )}

      {/* ══ TOP CENTRE — Match Title ══ */}
      {config.showMatchTitle && config.matchTitle && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "stretch",
            borderRadius: 8,
            overflow: "hidden",
            backdropFilter: "blur(14px)",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
            whiteSpace: "nowrap",
          }}
        >
          {/* Accent stripe */}
          <div
            style={{
              width: 4,
              flexShrink: 0,
              background: "linear-gradient(180deg, #f59e0b 0%, #ef4444 100%)",
            }}
          />
          {/* Title text */}
          <div
            style={{
              background: "rgba(6,8,20,0.88)",
              padding: "7px 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              }}
            >
              {config.matchTitle}
            </span>
          </div>
        </div>
      )}

      {/* ══ BOTTOM LEFT — Social handle (Lifted) ══ */}
      {config.showSocialHandle && config.socialHandle && (
        <div
          style={{
            position: "absolute",
            bottom: 115,
            left: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(6,8,20,0.88)",
            borderRadius: 10,
            padding: "10px 18px 10px 12px",
            backdropFilter: "blur(14px)",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.09), 0 0 0 1px rgba(59,130,246,0.15)",
          }}
        >
          {/* @ badge */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 900, lineHeight: 1 }}>
              @
            </span>
          </div>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 17,
              fontWeight: 800,
              letterSpacing:1,
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
          >
            {config.socialHandle.replace(/^@/, "")}
          </span>
        </div>
      )}

      {/* ══ BOTTOM RIGHT — Sponsor (Lifted) ══ */}
      {config.showSponsor && (config.sponsorLogoUrl || config.sponsorLabel) && (
        <div
          style={{
            position: "absolute",
            bottom: 115,
            right: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            background: "rgba(6,8,20,0.88)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 18px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)",
            minWidth: 140,
          }}
        >
          {/* Logo or placeholder */}
          {config.sponsorLogoUrl ? (
            <img
              src={config.sponsorLogoUrl}
              alt="Sponsor"
              style={{ height: 80, maxWidth: 200, objectFit: "contain" }}
            />
          ) : (
            <span
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              Your sponsor here
            </span>
          )}
          {/* Divider */}
          <div
            style={{
              alignSelf: "stretch",
              height: 1,
              background: "rgba(255,255,255,0.08)",
            }}
          />
          {/* Label */}
          <span
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              alignSelf: "stretch",
              textAlign: "center",
            }}
          >
            {config.sponsorLabel}
          </span>
        </div>
      )}

      <style>{`
        @keyframes brandPing {
          0%  { transform: scale(1);   opacity: 1; }
          70% { transform: scale(2.4); opacity: 0; }
          100%{ transform: scale(1);   opacity: 0; }
        }
      `}</style>
    
    </div>
  );
}
