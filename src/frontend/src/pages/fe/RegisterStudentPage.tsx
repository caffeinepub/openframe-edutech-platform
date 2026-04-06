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
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Course, Registration } from "../../types/models";

export default function RegisterStudentPage() {
  const { session } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    studentName: "",
    studentPhone: "",
    courseId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCourses(db.getCourses().filter((c) => c.isActive));
  }, []);

  const selectedCourse = courses.find((c) => c.id === Number(form.courseId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.studentName.trim() ||
      !form.studentPhone.trim() ||
      !form.courseId
    ) {
      toast.error("Please fill all required fields");
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

    const course = courses.find((c) => c.id === Number(form.courseId))!;
    const allRegs = db.getRegistrations();

    const newReg: Registration = {
      id: db.nextId(allRegs),
      studentName: form.studentName.trim(),
      studentPhone: form.studentPhone.trim(),
      feId: fe.id,
      feName: fe.name,
      feCode: fe.feCode,
      courseId: course.id,
      courseName: course.title,
      courseType: course.courseType,
      price: course.price,
      status: "Pending",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveRegistrations([...allRegs, newReg]);
    toast.success(`Student ${form.studentName} registered successfully!`);
    setForm({ studentName: "", studentPhone: "", courseId: "", notes: "" });
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
          <div>
            <Label>Course *</Label>
            <Select
              value={form.courseId}
              onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}
            >
              <SelectTrigger className="mt-1" data-ocid="fe.course.select">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title} ({c.courseType}) — ₹
                    {c.price.toLocaleString("en-IN")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm">
              <p className="font-semibold text-teal-800">
                {selectedCourse.title}
              </p>
              <p className="text-teal-700 text-xs mt-0.5">
                {selectedCourse.description}
              </p>
              <p className="text-teal-800 font-bold mt-1">
                ₹{selectedCourse.price.toLocaleString("en-IN")}
              </p>
            </div>
          )}

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
