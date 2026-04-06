import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../../lib/storage";
import type { FieldExecutive, Notification, Student } from "../../types/models";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fes, setFEs] = useState<FieldExecutive[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [recipientType, setRecipientType] = useState("all_fe");
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setNotifications(db.getNotifications());
    setFEs(db.getFEs());
    setStudents(db.getStudents());
  };
  useEffect(load, []);

  const needsId = recipientType === "fe" || recipientType === "student";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const all = db.getNotifications();
    const newNotif: Notification = {
      id: db.nextId(all),
      recipientType: recipientType as Notification["recipientType"],
      recipientId: needsId && recipientId ? Number(recipientId) : null,
      message: message.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.saveNotifications([newNotif, ...all]);
    load();
    setMessage("");
    setLoading(false);
    toast.success("Notification sent!");
  };

  const recipientLabel = (n: Notification) => {
    if (n.recipientType === "all_fe") return "All Field Executives";
    if (n.recipientType === "all_student") return "All Students";
    if (n.recipientType === "all") return "Everyone";
    if (n.recipientType === "fe" && n.recipientId) {
      const fe = fes.find((f) => f.id === n.recipientId);
      return fe ? `FE: ${fe.name}` : "Unknown FE";
    }
    if (n.recipientType === "student" && n.recipientId) {
      const s = students.find((st) => st.id === n.recipientId);
      return s ? `Student: ${s.name}` : "Unknown Student";
    }
    return "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Send announcements to FEs and students
        </p>
      </div>

      {/* Send form */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Send Notification
        </h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <Label>Send To</Label>
            <Select
              value={recipientType}
              onValueChange={(v) => {
                setRecipientType(v);
                setRecipientId("");
              }}
            >
              <SelectTrigger
                className="mt-1"
                data-ocid="admin.notification_recipient.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="all_fe">All Field Executives</SelectItem>
                <SelectItem value="all_student">All Students</SelectItem>
                <SelectItem value="fe">Specific Field Executive</SelectItem>
                <SelectItem value="student">Specific Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {needsId && (
            <div>
              <Label>
                Select {recipientType === "fe" ? "Field Executive" : "Student"}
              </Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger
                  className="mt-1"
                  data-ocid="admin.notification_specific.select"
                >
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {(recipientType === "fe" ? fes : students).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="notif-msg">Message *</Label>
            <Textarea
              id="notif-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="mt-1"
              rows={3}
              data-ocid="admin.notification_message.textarea"
            />
          </div>
          <Button
            type="submit"
            className="teal-gradient text-white border-0 gap-2"
            disabled={loading}
            data-ocid="admin.notification.submit_button"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Sent notifications */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">
            Sent Notifications ({notifications.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications sent yet
            </div>
          ) : (
            notifications.map((n, idx) => (
              <div
                key={n.id}
                className="p-4"
                data-ocid={`admin.notification.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                        {recipientLabel(n)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
