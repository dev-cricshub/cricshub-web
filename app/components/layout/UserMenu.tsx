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
          className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-2"
        >
          <Avatar name={name} size="sm" shape="circle" />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-fg sm:block">{name}</span>
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
        { label: "Dashboard", icon: "ri-dashboard-line", href: "/dashboard" },
        { label: "Profile & billing", icon: "ri-user-line", href: "/profile" },
        { label: "Plans & pricing", icon: "ri-vip-crown-line", href: "/pricing" },
        { type: "separator" },
        { label: "Log out", icon: "ri-logout-box-r-line", onSelect: logout, tone: "danger" },
      ]}
    />
  );
}
