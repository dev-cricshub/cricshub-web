"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Button, Modal, cn, controlClasses } from "@/app/components/ui";
import { playerTone, statusTone } from "@/lib/auction/format";
import type { Auction, AuctionStatus, PlayerState } from "@/lib/auction/types";
import { PLAYER_STATE_LABEL, STATUS_LABEL } from "@/lib/auction/types";

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <Badge tone={statusTone(status)} icon={status === "live" ? "ri-broadcast-fill" : undefined}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function PlayerStateBadge({ status }: { status: PlayerState }) {
  return <Badge tone={playerTone(status)}>{PLAYER_STATE_LABEL[status]}</Badge>;
}

export function Select({
  invalid,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={controlClasses(invalid, cn("h-10 px-3", className))} {...rest} />;
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const LINKS = [
  { key: "overview", label: "Overview", href: (id: string) => `/auctions/${id}` },
  { key: "setup", label: "Setup", href: (id: string) => `/auctions/${id}/setup` },
  { key: "live", label: "Live", href: (id: string) => `/auctions/${id}/live` },
  { key: "watch", label: "Spectator", href: (id: string) => `/auctions/${id}/watch` },
] as const;

export function AuctionSubnav({ auction }: { auction: Auction }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-fg-muted">{auction.tournament || "Untitled tournament"}</p>
        <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wide text-fg sm:text-3xl">{auction.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        <AuctionStatusBadge status={auction.status} />
        {auction.archived && <Badge tone="outline">Archived</Badge>}
      </div>
      <nav aria-label="Auction" className="flex gap-1 overflow-x-auto sm:ml-auto">
        {LINKS.map((link) => {
          const href = link.href(auction.id);
          const active = pathname === href;
          if (link.key === "setup" && auction.status !== "draft" && auction.status !== "scheduled") return null;
          // Viewers and registered players only get the room view.
          if (auction.role !== "auctioneer" && link.key !== "watch") return null;
          return (
            <Link
              key={link.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-control px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                active ? "bg-primary-soft text-primary-soft-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-fg-muted">{body}</p>
    </Modal>
  );
}

/**
 * Shown when Start answers REGISTRATIONS_PENDING: the auctioneer decides what happens to registrations
 * nobody approved yet. "Reject" tells those players they weren't selected; "Leave out" closes them quietly.
 */
export function PendingStartDialog({
  message,
  onClose,
  onChoose,
}: {
  message: string | null;
  onClose: () => void;
  onChoose: (pending: "reject" | "expire") => void;
}) {
  return (
    <Modal
      open={message != null}
      onClose={onClose}
      title="Registrations still waiting"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onChoose("expire")}>
            Leave them out
          </Button>
          <Button variant="danger" onClick={() => onChoose("reject")}>
            Reject remaining
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-fg-muted">{message}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        Approve anyone you want in the pool first. Rejected players are told they weren&apos;t selected; players left out
        just see that registration closed.
      </p>
    </Modal>
  );
}
