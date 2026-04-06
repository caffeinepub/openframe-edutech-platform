import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Notification } from "../../types/models";

export default function FENotificationsPage() {
  const { session } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = () => {
    const sid = session?.id;
    if (!sid) return;
    const all = db.getNotifications();
    const myNotifs = all.filter(
      (n) =>
        n.recipientType === "all" ||
        n.recipientType === "all_fe" ||
        (n.recipientType === "fe" && n.recipientId === sid),
    );
    setNotifications(myNotifs);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within session.id scope
  useEffect(load, [session?.id]);

  const markRead = (id: number) => {
    const all = db.getNotifications();
    db.saveNotifications(
      all.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    load();
  };

  const markAllRead = () => {
    const sid = session?.id;
    const all = db.getNotifications();
    const updated = all.map((n) => {
      const mine =
        n.recipientType === "all" ||
        n.recipientType === "all_fe" ||
        (n.recipientType === "fe" && n.recipientId === sid);
      return mine ? { ...n, isRead: true } : n;
    });
    db.saveNotifications(updated);
    load();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            data-ocid="fe.notifications.mark_all_read.button"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card divide-y divide-border">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You'll see notifications from your admin here"
            icon={Bell}
            data-ocid="fe.notifications.empty_state"
          />
        ) : (
          notifications.map((n, idx) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 ${!n.isRead ? "bg-primary/5" : ""}`}
              data-ocid={`fe.notification.item.${idx + 1}`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${!n.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markRead(n.id)}
                  data-ocid={`fe.notification.mark_read.${idx + 1}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
