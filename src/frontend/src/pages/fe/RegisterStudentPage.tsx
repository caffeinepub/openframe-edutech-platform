import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  IndianRupee,
  Loader2,
  MapPin,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Course, Registration } from "../../types/models";

const ORDINALS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

const FEE_PLANS = {
  Basic: 50,
  Standard: 100,
  Premium: 150,
} as const;

type FeePlan = keyof typeof FEE_PLANS;

export default function RegisterStudentPage() {
  const { session } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    studentName: "",
    studentPhone: "",
    medium: "" as "English" | "Kannada" | "",
    standard: "" as string,
    feePlan: "" as FeePlan | "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    lat: number | null;
    lng: number | null;
    address: string | null;
    status: "pending" | "captured" | "unavailable";
  }>({
    lat: null,
    lng: null,
    address: null,
    status: "pending",
  });

  useEffect(() => {
    setCourses(db.getCourses().filter((c) => c.isActive));

    // Capture GPS location on mount
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({
            lat,
            lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            status: "captured",
          });
        },
        () => {
          setLocation({
            lat: null,
            lng: null,
            address: null,
            status: "unavailable",
          });
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    } else {
      setLocation({
        lat: null,
        lng: null,
        address: null,
        status: "unavailable",
      });
    }
  }, []);

  // Derive the selected course from medium + standard
  const selectedCourse: Course | undefined =
    form.medium && form.standard
      ? courses.find(
          (c) =>
            c.medium === form.medium && c.standard === Number(form.standard),
        )
      : undefined;

  const feePlanPrice = form.feePlan ? FEE_PLANS[form.feePlan as FeePlan] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.studentName.trim() ||
      !form.studentPhone.trim() ||
      !form.medium ||
      !form.standard ||
      !form.feePlan
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!selectedCourse) {
      toast.error("No course found for selected standard and medium");
      return;
    }
    if (!session?.id) {
      toast.error("Session error. Please log in again.");
      return;
    }

    // Duplicate phone check
    const allRegs = db.getRegistrations();
    const duplicate = allRegs.find(
      (r) => r.studentPhone.trim() === form.studentPhone.trim(),
    );
    if (duplicate) {
      toast.error("⚠️ This phone number is already registered");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    // Look up FE record — session.id may be a number or string, normalize both sides
    const fes = db.getFEs();
    const fe = fes.find((f) => String(f.id) === String(session.id));

    // Resolve feId — NEVER allow 0 or NaN
    const sessionIdNum = Number(session.id);
    const resolvedFeId =
      fe?.id ?? (Number.isNaN(sessionIdNum) ? null : sessionIdNum);

    if (!resolvedFeId || resolvedFeId === 0) {
      toast.error(
        "Unable to identify your account. Please log out and log in again.",
      );
      setLoading(false);
      return;
    }

    const price = FEE_PLANS[form.feePlan as FeePlan];
    const feName =
      fe?.name ?? (session as { name?: string }).name ?? "Unknown FE";
    const feCode =
      fe?.feCode ?? (session as { feCode?: string }).feCode ?? "FE???";

    const newReg: Registration = {
      id: db.nextId(allRegs),
      studentName: form.studentName.trim(),
      studentPhone: form.studentPhone.trim(),
      feId: resolvedFeId,
      feName,
      feCode,
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      courseType: selectedCourse.courseType,
      medium: form.medium,
      feePlan: form.feePlan as FeePlan,
      price,
      status: "Pending",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latitude: location.lat,
      longitude: location.lng,
      locationAddress: location.address,
      incentiveCalculated: false,
    };

    db.saveRegistrations([...allRegs, newReg]);

    // Signal other tabs (e.g. admin dashboard) to refresh immediately.
    // The 'storage' event only fires in OTHER tabs, so we write a dedicated
    // sync key that all listeners watch for cross-tab notification.
    localStorage.setItem("openframe_last_registration", Date.now().toString());

    toast.success(`Student ${form.studentName} registered successfully!`);
    setForm({
      studentName: "",
      studentPhone: "",
      medium: "",
      standard: "",
      feePlan: "",
      notes: "",
    });
    navigate({ to: "/fe/my-students" });
    setLoading(false);
  };

  // Check if FE has a TL assigned — informational banner only, form is always accessible
  const feRecord = session?.id
    ? db.getFEs().find((f) => String(f.id) === String(session.id))
    : null;
  const showUnassignedBanner =
    !feRecord ||
    feRecord.assignedTL_ID === null ||
    feRecord.status === "unassigned";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Register New Student
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Fill in the details to register a new student under your account
        </p>
      </div>

      {/* Soft informational banner — does NOT lock the form */}
      {showUnassignedBanner && (
        <div
          className="max-w-lg mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3"
          data-ocid="fe.register_student.unassigned_notice"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            You have not been assigned to a Team Leader yet. You can still
            register students — a Team Leader will be assigned later by the
            admin.
          </p>
        </div>
      )}

      <div className="max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5"
          data-ocid="fe.register_student.section"
        >
          {/* Location indicator */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin
              className={`h-4 w-4 flex-shrink-0 ${
                location.status === "captured"
                  ? "text-green-600"
                  : location.status === "pending"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }`}
            />
            {location.status === "captured" ? (
              <span className="text-green-700 text-xs font-medium">
                Location captured ({location.address})
              </span>
            ) : location.status === "pending" ? (
              <span className="text-amber-600 text-xs">
                Capturing location...
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                Location unavailable
              </span>
            )}
          </div>

          {/* Student Name */}
          <div>
            <Label htmlFor="sname">Student Full Name *</Label>
            <Input
              id="sname"
              value={form.studentName}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentName: e.target.value }))
              }
              placeholder="Enter student's full name"
              className="mt-1"
              data-ocid="fe.student_name.input"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="sphone">Phone Number *</Label>
            <Input
              id="sphone"
              value={form.studentPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentPhone: e.target.value }))
              }
              placeholder="10-digit phone number"
              className="mt-1"
              maxLength={10}
              data-ocid="fe.student_phone.input"
            />
          </div>

          {/* Medium */}
          <div>
            <Label>Medium *</Label>
            <Select
              value={form.medium}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  medium: v as "English" | "Kannada",
                  standard: "",
                }))
              }
            >
              <SelectTrigger className="mt-1" data-ocid="fe.medium.select">
                <SelectValue placeholder="Select medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Standard */}
          <div>
            <Label>Standard *</Label>
            <Select
              value={form.standard}
              onValueChange={(v) => setForm((f) => ({ ...f, standard: v }))}
              disabled={!form.medium}
            >
              <SelectTrigger className="mt-1" data-ocid="fe.standard.select">
                <SelectValue
                  placeholder={
                    form.medium ? "Select standard" : "Select medium first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter((c) => !form.medium || c.medium === form.medium)
                  .sort((a, b) => a.standard - b.standard)
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.standard)}>
                      {ORDINALS[c.standard - 1]} Standard
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Plan */}
          <div>
            <Label>Fee Plan *</Label>
            <Select
              value={form.feePlan}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, feePlan: v as FeePlan }))
              }
            >
              <SelectTrigger className="mt-1" data-ocid="fe.fee_plan.select">
                <SelectValue placeholder="Select fee plan" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FEE_PLANS) as [FeePlan, number][]).map(
                  ([plan, price]) => (
                    <SelectItem key={plan} value={plan}>
                      {plan} {"—"} {"₹"}
                      {price}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Summary card */}
          {selectedCourse && form.feePlan && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                Enrollment Summary
              </p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-900">
                  {selectedCourse.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    form.medium === "English"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-orange-200 bg-orange-50 text-orange-700"
                  }`}
                >
                  {form.medium}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-teal-700">
                  Fee Plan: <strong>{form.feePlan}</strong>
                </span>
                <span className="flex items-center gap-0.5 text-teal-900 font-bold text-base">
                  <IndianRupee className="h-4 w-4" />
                  {feePlanPrice}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Any additional notes..."
              className="mt-1"
              rows={2}
              data-ocid="fe.notes.textarea"
            />
          </div>

          <Button
            type="submit"
            className="w-full teal-gradient text-white border-0 gap-2"
            disabled={loading}
            data-ocid="fe.register_student.submit_button"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Register Student
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
