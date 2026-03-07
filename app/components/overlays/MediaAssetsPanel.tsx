"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteMediaAsset,
  fetchMatchPlaylist,
  fetchMediaLibrary,
  MediaAsset,
  saveMatchPlaylist,
  uploadMediaAsset,
} from "../../../lib/api";

// ═══════════════════════════════════════════════════════════
// MEDIA ASSETS PANEL — tpl-pro-5
// Upload to library → drag-and-drop sequence → save playlist
// ═══════════════════════════════════════════════════════════

const MAX_ASSETS    = 10;
const MAX_IMAGE_MB  = 10;
const MAX_VIDEO_MB  = 50;

interface Props {
  matchId: string;
  userId:  string;
}

export default function MediaAssetsPanel({ matchId, userId }: Props) {
  const [library,    setLibrary]    = useState<MediaAsset[]>([]);
  const [playlist,   setPlaylist]   = useState<MediaAsset[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [dragIndex,  setDragIndex]  = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load library + current playlist on mount
  useEffect(() => {
    fetchMediaLibrary(userId).then(setLibrary);
    fetchMatchPlaylist(matchId).then((pl) => {
      if (pl.length > 0) setPlaylist(pl);
    });
  }, [matchId, userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) {
      alert("Only image and video files are supported.");
      return;
    }
    const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File too large. Max ${maxMB}MB for ${isVideo ? "videos" : "images"}.`);
      return;
    }
    if (library.length >= MAX_ASSETS) {
      alert(`Library is full (${MAX_ASSETS} assets max). Delete one to upload more.`);
      return;
    }

    setUploading(true);
    try {
      const asset = await uploadMediaAsset(file, userId);
      setLibrary((prev) => [asset, ...prev]);
    } catch (err: any) {
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`Remove "${asset.fileName || "this asset"}" from your library?`)) return;
    try {
      await deleteMediaAsset(asset.id, userId);
      setLibrary((prev) => prev.filter((a) => a.id !== asset.id));
      setPlaylist((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err: any) {
      alert(err.message || "Delete failed.");
    }
  };

  const addToPlaylist = (asset: MediaAsset) => {
    if (playlist.find((a) => a.id === asset.id)) return; // already in playlist
    setPlaylist((prev) => [...prev, asset]);
  };

  const removeFromPlaylist = (id: string) => {
    setPlaylist((prev) => prev.filter((a) => a.id !== id));
  };

  // ── HTML5 drag-and-drop reorder ──────────────────────────
  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const reordered = [...playlist];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setPlaylist(reordered);
    setDragIndex(i);
  };
  const onDragEnd = () => setDragIndex(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveMatchPlaylist(matchId, userId, playlist);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("Failed to save playlist.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fmt = (asset: MediaAsset) =>
    asset.fileName ? asset.fileName.replace(/^.+\//, "").substring(0, 28) : asset.type;

  return (
    <div
      style={{
        background: "rgba(8,10,24,0.97)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        fontFamily: "'DM Sans', sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* ── Top separator ── */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      />

      <div style={{ padding: 20 }}>

        {/* ── LIBRARY ─────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                color: "#D97706",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              Your Library
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
              {library.length} / {MAX_ASSETS}
            </span>
          </div>

          {library.length === 0 && !uploading && (
            <div
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 12,
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No assets yet. Upload images or videos below.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {library.map((asset) => {
              const inPlaylist = !!playlist.find((a) => a.id === asset.id);
              return (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 7,
                    padding: "8px 10px",
                  }}
                >
                  {/* Thumb */}
                  <div
                    style={{
                      width: 44,
                      height: 32,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {asset.type === "IMAGE" ? (
                      <img
                        src={asset.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 16 }}>▶</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#E5E7EB",
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(asset)}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                      {asset.type === "VIDEO" ? "Video" : "Image"}
                    </div>
                  </div>

                  <button
                    onClick={() => addToPlaylist(asset)}
                    disabled={inPlaylist}
                    title={inPlaylist ? "Already in sequence" : "Add to sequence"}
                    style={{
                      background: inPlaylist ? "rgba(217,119,6,0.08)" : "rgba(217,119,6,0.15)",
                      border: `1px solid ${inPlaylist ? "rgba(217,119,6,0.15)" : "rgba(217,119,6,0.4)"}`,
                      borderRadius: 5,
                      padding: "4px 8px",
                      color: inPlaylist ? "rgba(217,119,6,0.4)" : "#D97706",
                      fontSize: 11,
                      cursor: inPlaylist ? "default" : "pointer",
                      fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    {inPlaylist ? "Added" : "+ Add"}
                  </button>

                  <button
                    onClick={() => handleDelete(asset)}
                    title="Delete from library"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 5,
                      padding: "4px 8px",
                      color: "#F87171",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Upload button */}
          {library.length < MAX_ASSETS && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: "100%",
                marginTop: 8,
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.03)",
                border: "1.5px dashed rgba(255,255,255,0.1)",
                borderRadius: 7,
                padding: "12px",
                color: uploading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.35)",
                fontSize: 12,
                cursor: uploading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{uploading ? "…" : "↑"}</span>
              {uploading ? "Uploading…" : "Upload image or video"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* ── SEQUENCE ────────────────────────── */}
        <div>
          <div
            style={{
              color: "#D97706",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "1px solid rgba(217,119,6,0.18)",
            }}
          >
            Playback Sequence
          </div>

          {playlist.length === 0 ? (
            <div
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 12,
                textAlign: "center",
                padding: "14px 0",
              }}
            >
              No assets in sequence yet. Add from library above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {playlist.map((asset, i) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background:
                      dragIndex === i
                        ? "rgba(217,119,6,0.08)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${dragIndex === i ? "rgba(217,119,6,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 6,
                    padding: "7px 10px",
                    cursor: "grab",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {/* Drag handle */}
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, flexShrink: 0 }}>
                    ⠿
                  </span>
                  {/* Order number */}
                  <span
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontWeight: 700,
                      width: 14,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {/* Thumb */}
                  <div
                    style={{
                      width: 36,
                      height: 26,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.06)",
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {asset.type === "IMAGE" ? (
                      <img
                        src={asset.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12 }}>▶</span>
                    )}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      color: "#D1D5DB",
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(asset)}
                  </span>
                  <button
                    onClick={() => removeFromPlaylist(asset.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 14,
                      cursor: "pointer",
                      padding: "0 2px",
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(8,10,24,0.98)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
          {playlist.length} asset{playlist.length !== 1 ? "s" : ""} in sequence
        </span>
        <button
          onClick={handleSave}
          disabled={saving || playlist.length === 0}
          style={{
            background: saved ? "rgba(5,150,105,0.12)" : "transparent",
            border: `1px solid ${saved ? "rgba(5,150,105,0.35)" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 7,
            padding: "8px 18px",
            color: saved ? "#34D399" : "rgba(255,255,255,0.7)",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving || playlist.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: playlist.length === 0 ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Sequence"}
        </button>
      </div>
    </div>
  );
}
