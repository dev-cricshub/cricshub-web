"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  deleteMediaAsset,
  fetchMatchPlaylist,
  fetchMediaLibrary,
  MediaAsset,
  saveMatchPlaylist,
  uploadMediaAsset,
} from "../../../lib/api";
import { Button, cn } from "@/app/components/ui";

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

function Thumb({ asset, small }: { asset: MediaAsset; small?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-3 text-fg-subtle",
        small ? "h-7 w-10" : "h-9 w-12",
      )}
    >
      {asset.type === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <i className="ri-play-fill text-base" aria-hidden />
      )}
    </div>
  );
}

function SectionToggle({
  title,
  open,
  onToggle,
  controls,
  meta,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  controls: string;
  meta?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{title}</span>
      <span className="flex items-center gap-2">
        {meta}
        <i
          className={cn(
            "ri-arrow-down-s-line text-base text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </span>
    </button>
  );
}

export default function MediaAssetsPanel({ matchId, userId }: Props) {
  const [library,      setLibrary]      = useState<MediaAsset[]>([]);
  const [playlist,     setPlaylist]     = useState<MediaAsset[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [dragIndex,    setDragIndex]    = useState<number | null>(null);
  const [libraryOpen,  setLibraryOpen]  = useState(true);
  const [sequenceOpen, setSequenceOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryId = useId();
  const sequenceId = useId();

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
    <div className="bg-surface text-fg">
      {/* ── Scrollable body ── */}
      <div className="max-h-[480px] space-y-5 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] sm:p-5">
        {/* ── LIBRARY ─────────────────────────── */}
        <section className="space-y-2">
          <SectionToggle
            title="Your library"
            open={libraryOpen}
            onToggle={() => setLibraryOpen((v) => !v)}
            controls={libraryId}
            meta={
              <span className="font-mono text-xs tabular-nums text-fg-subtle">
                {library.length} / {MAX_ASSETS}
              </span>
            }
          />

          {libraryOpen && (
            <div id={libraryId} className="space-y-2 animate-fade-in">
              {library.length === 0 && !uploading && (
                <p className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-xs text-fg-subtle">
                  No assets yet. Upload images or videos below.
                </p>
              )}

              {library.length > 0 && (
                <ul className="space-y-1.5">
                  {library.map((asset) => {
                    const inPlaylist = !!playlist.find((a) => a.id === asset.id);
                    const name = fmt(asset);
                    return (
                      <li
                        key={asset.id}
                        className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 p-2"
                      >
                        <Thumb asset={asset} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{name}</p>
                          <p className="text-xs text-fg-subtle">
                            {asset.type === "VIDEO" ? "Video" : "Image"}
                          </p>
                        </div>
                        <Button
                          size="xs"
                          variant={inPlaylist ? "secondary" : "outline"}
                          icon={inPlaylist ? "ri-check-line" : "ri-add-line"}
                          onClick={() => addToPlaylist(asset)}
                          disabled={inPlaylist}
                          title={inPlaylist ? "Already in sequence" : "Add to sequence"}
                          aria-label={inPlaylist ? `${name} is in the sequence` : `Add ${name} to sequence`}
                        >
                          {inPlaylist ? "Added" : "Add"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(asset)}
                          title="Delete from library"
                          aria-label={`Delete ${name} from library`}
                          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sm text-fg-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <i className="ri-delete-bin-line" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Upload button */}
              {library.length < MAX_ASSETS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2 px-3 py-3 text-sm font-medium text-fg-muted transition-colors duration-150 hover:border-primary hover:bg-primary-soft hover:text-primary-soft-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i
                    className={uploading ? "ri-loader-4-line animate-spin" : "ri-upload-cloud-2-line"}
                    aria-hidden
                  />
                  {uploading ? "Uploading…" : "Upload image or video"}
                </button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </section>

        {/* ── SEQUENCE ────────────────────────── */}
        <section className="space-y-2 border-t border-line pt-4">
          <SectionToggle
            title="Playback sequence"
            open={sequenceOpen}
            onToggle={() => setSequenceOpen((v) => !v)}
            controls={sequenceId}
          />

          {sequenceOpen && (
            <div id={sequenceId} className="animate-fade-in">
              {playlist.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-xs text-fg-subtle">
                  No assets in sequence yet. Add from library above.
                </p>
              ) : (
                <ol className="space-y-1.5" aria-label="Playback order (drag to reorder)">
                  {playlist.map((asset, i) => (
                    <li
                      key={asset.id}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={(e) => onDragOver(e, i)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "flex cursor-grab items-center gap-2 rounded-lg border px-2 py-1.5 transition-[background-color,border-color,box-shadow] duration-150 active:cursor-grabbing",
                        dragIndex === i
                          ? "border-primary/40 bg-primary-soft shadow-raised"
                          : "border-line bg-surface hover:border-line-strong",
                      )}
                    >
                      <i className="ri-draggable flex-shrink-0 text-base text-fg-subtle" aria-hidden />
                      <span className="w-4 flex-shrink-0 font-mono text-xs font-medium tabular-nums text-fg-subtle">
                        {i + 1}
                      </span>
                      <Thumb asset={asset} small />
                      <span className="min-w-0 flex-1 truncate text-xs text-fg">{fmt(asset)}</span>
                      <button
                        type="button"
                        onClick={() => removeFromPlaylist(asset.id)}
                        aria-label={`Remove ${fmt(asset)} from sequence`}
                        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors duration-150 hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <i className="ri-close-line" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2 px-4 py-3 sm:px-5">
        <span className="text-xs text-fg-subtle">
          <span className="font-mono tabular-nums">{playlist.length}</span> asset
          {playlist.length !== 1 ? "s" : ""} in sequence
        </span>
        <Button
          size="sm"
          variant={saved ? "secondary" : "primary"}
          icon={saved ? "ri-check-line" : "ri-save-line"}
          loading={saving}
          onClick={handleSave}
          disabled={playlist.length === 0}
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save sequence"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {saved ? "Sequence saved" : ""}
        </span>
      </div>
    </div>
  );
}
