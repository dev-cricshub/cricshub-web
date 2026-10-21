"use client";

import { Avatar, Menu, cn } from "@/app/components/ui";
import { logout } from "@/lib/session";

/** Avatar button with profile / plans / logout menu. */
export function UserMenu({
  name,
  hasSubscription,
  className,
}: {
  name: string;
  hasSubscription?: boolean;
  className?: string;
}) {
  return (
    <Menu
      className={className}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={`Account menu for ${name}`}
          className="flex h-10 items-center gap-2 rounded-full border border-line bg-well p-1 transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-2"
        >
          <Avatar name={name} size="sm" shape="circle" />
          <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
            <span className="max-w-[140px] truncate text-[13px] font-semibold text-fg">{name}</span>
            <span className={cn("text-[11px] font-semibold", hasSubscription ? "text-success" : "text-accent-soft")}>
              {hasSubscription ? "Active plan" : "Free plan"}
            </span>
          </span>
          <i className="ri-arrow-down-s-line hidden text-fg-subtle sm:block" aria-hidden />
        </button>
      )}
      items={[
        {
          type: "label",
          label: (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{name}</p>
              <p className={cn("mt-0.5 flex items-center gap-1 text-xs", hasSubscription ? "text-success" : "text-fg-subtle")}>
                <i className={hasSubscription ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"} aria-hidden />
                {hasSubscription ? "Active subscription" : "Free plan"}
              </p>
            </div>
          ),
        },
        { type: "separator" },
        { label: "Home", icon: "ri-home-5-line", href: "/dashboard" },
        { label: "Stream Studio", icon: "ri-broadcast-line", href: "/stream" },
        { label: "Auctions", icon: "ri-auction-line", href: "/auctions" },
        { label: "My registrations", icon: "ri-user-follow-line", href: "/auctions/registrations" },
        { type: "separator" },
        { label: "Profile & billing", icon: "ri-user-line", href: "/profile" },
        { label: "Plans & pricing", icon: "ri-vip-crown-line", href: "/pricing" },
        { type: "separator" },
        { label: "Log out", icon: "ri-logout-box-r-line", onSelect: logout, tone: "danger" },
      ]}
    />
  );
}
