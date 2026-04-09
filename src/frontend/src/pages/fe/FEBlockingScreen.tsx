import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardCopy, LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";

const POLL_INTERVAL_MS = 2000;

export default function FEBlockingScreen() {
  const { session, logout } = useApp();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!session?.id) return;

    const check = () => {
      const fe = db.getFEs().find((f) => f.id === Number(session.id));
      if (fe && fe.assignedTL_ID !== null && fe.status === "active") {
        if (!toastShownRef.current) {
          toastShownRef.current = true;

          // Persist notification for FE notifications page
          const FE_NOTIF_KEY = "fe_notifications";
          try {
            const existing = JSON.parse(
              localStorage.getItem(FE_NOTIF_KEY) ?? "[]",
            ) as Array<{ message: string; timestamp: number; read: boolean }>;
            existing.unshift({
              message:
                "You have been assigned to a Team Leader. Dashboard is now unlocked.",
              timestamp: Date.now(),
              read: false,
            });
            localStorage.setItem(FE_NOTIF_KEY, JSON.stringify(existing));
          } catch {
            // ignore
          }

          toast.success(
            "You have been assigned to a Team Leader! Dashboard is now unlocked.",
            { duration: 5000 },
          );
          setTimeout(() => {
            navigate({ to: "/fe/dashboard" });
          }, 1500);
        }
      }
    };

    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session, navigate]);

  function handleContactAdmin() {
    const msg = "Contact admin: akashrajnayak";
    navigator.clipboard
      .writeText(msg)
      .then(() => toast.success("Admin contact info copied to clipboard!"))
      .catch(() =>
        toast.info("Admin contact: akashrajnayak", { duration: 6000 }),
      );
  }

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div
      className="min-h-screen bg-amber-50 flex items-center justify-center p-4"
      data-ocid="fe.blocking_screen.container"
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-amber-200 shadow-lg p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Not Yet Assigned
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You are not assigned to any Team Leader yet.
              <br />
              Please wait for admin approval.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              What happens next?
            </p>
            <ul className="text-sm text-amber-700 space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                An admin will review your account and assign you to a Team
                Leader.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                Once assigned, your dashboard will unlock automatically.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                No action needed — this page checks for updates every few
                seconds.
              </li>
            </ul>
          </div>

          {/* Polling indicator */}
          <div
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            data-ocid="fe.blocking_screen.polling_indicator"
          >
            <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
            <span>Checking for updates…</span>
          </div>

          {/* CTA */}
          <Button
            className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white border-0"
            onClick={handleContactAdmin}
            data-ocid="fe.blocking_screen.contact_admin_button"
          >
            <ClipboardCopy className="h-4 w-4" />
            Contact Admin
          </Button>

          {/* Account info */}
          {session?.name && (
            <p className="text-xs text-muted-foreground">
              Logged in as{" "}
              <span className="font-medium text-foreground">
                {session.name}
              </span>
            </p>
          )}

          {/* Logout link */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-red-600 transition-colors"
            data-ocid="fe.blocking_screen.logout_button"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
