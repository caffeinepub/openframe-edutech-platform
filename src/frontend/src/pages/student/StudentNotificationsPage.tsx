import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Notification } from "../../types/models";

export default function StudentNotificationsPage() {
  const { session } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = () => {
    const sid = session?.id;
    if (!sid) return;
    const all = db.getNotifications();
    const myNotifs = all.filter(
      (n) =>
        n.recipientType === "all" ||
        n.recipientType === "all_student" ||
        (n.recipientType === "student" && n.recipientId === sid),
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {unreadCount} unread
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card divide-y divide-border">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You'll see announcements and updates here"
            icon={Bell}
            data-ocid="student.notifications.empty_state"
          />
        ) : (
          notifications.map((n, idx) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 ${!n.isRead ? "bg-primary/5" : ""}`}
              data-ocid={`student.notification.item.${idx + 1}`}
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
                  className="h-7"
                  onClick={() => markRead(n.id)}
                  data-ocid={`student.notification.mark_read.${idx + 1}`}
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
