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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Filter,
  IndianRupee,
  Link,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { CourseTypeBadge, StatusBadge } from "../../components/StatusBadge";
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

function FeePlanBadge({ feePlan, price }: { feePlan?: string; price: number }) {
  if (!feePlan) return <span>₹{price.toLocaleString("en-IN")}</span>;
  return (
    <span className="text-xs">
      <span className="font-medium">{feePlan}</span>
      <span className="text-muted-foreground">
        {" "}
        — ₹{price.toLocaleString("en-IN")}
      </span>
    </span>
  );
}

export default function RegistrationsPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [filterMedium, setFilterMedium] = useState("All");
  const [approveReg, setApproveReg] = useState<Registration | null>(null);
  const [classLink, setClassLink] = useState("");
  const [schedule, setSchedule] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);

  const load = () => setRegs(db.getRegistrations());
  useEffect(load, []);

  const filtered = regs.filter((r) => {
    const matchSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentPhone.includes(search) ||
      r.feName.toLowerCase().includes(search.toLowerCase()) ||
      r.feCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchPayment =
      filterPayment === "All" || r.paymentStatus === filterPayment;
    const matchMedium = filterMedium === "All" || r.medium === filterMedium;
    return matchSearch && matchStatus && matchPayment && matchMedium;
  });

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveReg) return;
    setApproveLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const all = db.getRegistrations();
    const updated = all.map((r) =>
      r.id === approveReg.id
        ? {
            ...r,
            status: "Approved" as const,
            classLink,
            schedule,
            updatedAt: new Date().toISOString(),
          }
        : r,
    );
    db.saveRegistrations(updated);
    load();
    setApproveReg(null);
    setClassLink("");
    setSchedule("");
    setApproveLoading(false);
    toast.success(`Registration approved for ${approveReg.studentName}`);
  };

  const handleReject = (reg: Registration) => {
    const all = db.getRegistrations();
    const updated = all.map((r) =>
      r.id === reg.id
        ? {
            ...r,
            status: "Rejected" as const,
            updatedAt: new Date().toISOString(),
          }
        : r,
    );
    db.saveRegistrations(updated);
    load();
    toast.success(`Registration rejected for ${reg.studentName}`);
  };

  const togglePayment = (reg: Registration) => {
    const all = db.getRegistrations();
    const newStatus = reg.paymentStatus === "Paid" ? "Pending" : "Paid";
    const updated = all.map((r) =>
      r.id === reg.id
        ? {
            ...r,
            paymentStatus: newStatus as "Pending" | "Paid",
            updatedAt: new Date().toISOString(),
          }
        : r,
    );
    db.saveRegistrations(updated);
    load();
    toast.success(`Payment marked as ${newStatus} for ${reg.studentName}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Student Registrations
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {filtered.length} of {regs.length} registrations
        </p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3"
        data-ocid="admin.registrations.section"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, FE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.registrations_search.input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.registrations_status.select"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {["All", "Pending", "Approved", "Rejected"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.registrations_payment.select"
          >
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            {["All", "Pending", "Paid"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMedium} onValueChange={setFilterMedium}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.registrations_medium.select"
          >
            <SelectValue placeholder="Medium" />
          </SelectTrigger>
          <SelectContent>
            {["All", "English", "Kannada"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No registrations found"
            description="Try adjusting your filters"
            data-ocid="admin.registrations.empty_state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Student",
                    "Course",
                    "Medium",
                    "Fee Plan",
                    "FE",
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
                    data-ocid={`admin.registration.item.${idx + 1}`}
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
                      <div className="flex items-center gap-0.5">
                        <IndianRupee className="h-3 w-3 text-muted-foreground" />
                        <FeePlanBadge feePlan={r.feePlan} price={r.price} />
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-foreground">{r.feName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.feCode}
                        </p>
                      </div>
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
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.status === "Pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50 gap-1"
                              onClick={() => {
                                setApproveReg(r);
                                setClassLink(r.classLink);
                                setSchedule(r.schedule);
                              }}
                              data-ocid={`admin.registration.approve_button.${idx + 1}`}
                            >
                              <CheckCircle className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50 gap-1"
                              onClick={() => handleReject(r)}
                              data-ocid={`admin.registration.reject_button.${idx + 1}`}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 text-xs gap-1 ${
                            r.paymentStatus === "Paid"
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                          onClick={() => togglePayment(r)}
                          data-ocid={`admin.registration.payment_button.${idx + 1}`}
                        >
                          <IndianRupee className="h-3 w-3" />
                          {r.paymentStatus === "Paid"
                            ? "Mark Pending"
                            : "Mark Paid"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={!!approveReg}
        onOpenChange={(o) => !o && setApproveReg(null)}
      >
        <DialogContent data-ocid="admin.approve.dialog">
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApprove}>
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p>
                  <span className="font-medium">Student:</span>{" "}
                  {approveReg?.studentName}
                </p>
                <p>
                  <span className="font-medium">Course:</span>{" "}
                  {approveReg?.courseName}
                </p>
                {approveReg?.medium && (
                  <p>
                    <span className="font-medium">Medium:</span>{" "}
                    {approveReg.medium}
                  </p>
                )}
                {approveReg?.feePlan && (
                  <p>
                    <span className="font-medium">Fee Plan:</span>{" "}
                    {approveReg.feePlan} — ₹{approveReg.price}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="class-link">
                  <Link className="inline h-3.5 w-3.5 mr-1" />
                  Class Meeting Link
                </Label>
                <Input
                  id="class-link"
                  value={classLink}
                  onChange={(e) => setClassLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1"
                  data-ocid="admin.class_link.input"
                />
              </div>
              <div>
                <Label htmlFor="schedule">Class Schedule</Label>
                <Textarea
                  id="schedule"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Mon, Wed, Fri — 7:00 PM to 9:00 PM IST"
                  className="mt-1"
                  rows={2}
                  data-ocid="admin.schedule.textarea"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveReg(null)}
                data-ocid="admin.approve.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white border-0"
                disabled={approveLoading}
                data-ocid="admin.approve.confirm_button"
              >
                {approveLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Registration"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
