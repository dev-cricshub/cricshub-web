import { ToastProvider } from "@/app/components/ui/Toast";

// Shared shell for every human-facing route (marketing + app).
// Broadcast routes (/overlay, /obs, /preview) live outside this group and stay transparent.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <ToastProvider>
        {children}
        <div id="app-portal" />
      </ToastProvider>
    </div>
  );
}
