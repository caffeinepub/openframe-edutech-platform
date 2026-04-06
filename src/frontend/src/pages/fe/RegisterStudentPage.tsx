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
import { IndianRupee, Loader2, UserPlus } from "lucide-react";
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

  useEffect(() => {
    setCourses(db.getCourses().filter((c) => c.isActive));
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
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const fes = db.getFEs();
    const fe = fes.find((f) => f.id === session.id);
    if (!fe) {
      toast.error("FE not found");
      setLoading(false);
      return;
    }

    const allRegs = db.getRegistrations();
    const price = FEE_PLANS[form.feePlan as FeePlan];

    const newReg: Registration = {
      id: db.nextId(allRegs),
      studentName: form.studentName.trim(),
      studentPhone: form.studentPhone.trim(),
      feId: fe.id,
      feName: fe.name,
      feCode: fe.feCode,
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
    };

    db.saveRegistrations([...allRegs, newReg]);
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

      <div className="max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-border shadow-card p-6 space-y-5"
          data-ocid="fe.register_student.section"
        >
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

          {/* Standard — only active courses for the selected medium */}
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
                      {plan} — ₹{price}
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
