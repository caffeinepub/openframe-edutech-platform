import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Edit, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { CourseTypeBadge, StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Registration } from "../../types/models";

function MediumBadge({ medium }: { medium?: string }) {
  if (!medium) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
        medium === "English"
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-orange-50 text-orange-700 border border-orange-200"
      }`}
    >
      {medium}
    </span>
  );
}

export default function MyStudentsPage() {
  const { session } = useApp();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    const sid = session?.id;
    if (!sid) return;
    setRegs(db.getRegistrations().filter((r) => r.feId === sid));
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within session.id scope
  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);

    // Cross-tab sync: reload immediately when another tab writes to localStorage
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === null ||
        e.key === "openframe_registrations" ||
        e.key === "openframe_last_registration"
      ) {
        load();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [session?.id]);

  const filtered = regs.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentPhone.includes(search) ||
      r.courseName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReg) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const all = db.getRegistrations();
    const updated = all.map((r) =>
      r.id === editReg.id
        ? { ...r, studentName: editName.trim(), studentPhone: editPhone.trim() }
        : r,
    );
    db.saveRegistrations(updated);
    load();
    setEditReg(null);
    setLoading(false);
    toast.success("Student details updated");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Students</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {filtered.length} students registered by you
        </p>
      </div>

      {/* Soft notice if FE is not yet assigned to a TL — informational only */}
      {(() => {
        const feRecord = session?.id
          ? db.getFEs().find((f) => f.id === session.id)
          : null;
        const unassigned =
          !feRecord ||
          feRecord.assignedTL_ID === null ||
          feRecord.status === "unassigned";
        return unassigned ? (
          <div
            className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3"
            data-ocid="fe.my_students.unassigned_notice"
          >
            <ClipboardList className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              You have not been assigned to a Team Leader yet. You can still
              register and manage students — a Team Leader will be assigned to
              you later by the admin.
            </p>
          </div>
        ) : null;
      })()}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="fe.students_search.input"
        />
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No students found"
            description={
              search
                ? "Try a different search"
                : "Register your first student to get started"
            }
            data-ocid="fe.students.empty_state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="fe.students.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Name",
                    "Course",
                    "Medium",
                    "Fee Plan",
                    "Status",
                    "Payment",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                    data-ocid={`fe.student.item.${idx + 1}`}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {r.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.studentPhone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-foreground text-xs">
                          {r.courseName}
                        </p>
                        <CourseTypeBadge type={r.courseType} />
                      </div>
                    </td>
                    <td className="p-4">
                      <MediumBadge medium={r.medium} />
                    </td>
                    <td className="p-4">
                      {r.feePlan && (
                        <p className="text-xs font-medium text-foreground">
                          {r.feePlan}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.paymentStatus} />
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="p-4">
                      {r.status === "Pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => {
                            setEditReg(r);
                            setEditName(r.studentName);
                            setEditPhone(r.studentPhone);
                          }}
                          data-ocid={`fe.student.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editReg} onOpenChange={(o) => !o && setEditReg(null)}>
        <DialogContent data-ocid="fe.edit_student.dialog">
          <DialogHeader>
            <DialogTitle>Edit Student Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Student Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                  data-ocid="fe.edit_student_name.input"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1"
                  maxLength={10}
                  data-ocid="fe.edit_student_phone.input"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditReg(null)}
                data-ocid="fe.edit_student.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="teal-gradient text-white border-0"
                disabled={loading}
                data-ocid="fe.edit_student.save_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
