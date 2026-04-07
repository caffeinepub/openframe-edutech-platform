import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CourseTypeBadge, StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type { Course, Registration } from "../../types/models";

export default function StudentDashboard() {
  const { session } = useApp();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!session?.id) return;
    const students = db.getStudents();
    const student = students.find((s) => s.id === session.id);
    if (!student?.registrationId) {
      // try to find by phone
      const regs = db.getRegistrations();
      const reg = regs.find((r) => r.studentPhone === student?.phone);
      if (reg) {
        setRegistration(reg);
        const c = db.getCourses().find((c) => c.id === reg.courseId) ?? null;
        setCourse(c);
      }
      return;
    }
    const reg = db
      .getRegistrations()
      .find((r) => r.id === student.registrationId);
    if (reg) {
      setRegistration(reg);
      const c = db.getCourses().find((c) => c.id === reg.courseId) ?? null;
      setCourse(c);
    }
  }, [session]);

  const canAccessClass =
    registration?.status === "Approved" &&
    registration?.paymentStatus === "Paid";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {session?.name}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your student portal
        </p>
      </div>

      {!registration ? (
        <div className="bg-white rounded-xl border border-border shadow-card p-8 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">
            No Enrollment Found
          </h3>
          <p className="text-sm text-muted-foreground">
            Your enrollment is being processed or hasn't been registered yet.
            Please contact your Field Executive or the admin for assistance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enrolled Course */}
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Enrolled Course</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-foreground text-lg">
                    {registration.courseName}
                  </h4>
                  <CourseTypeBadge type={registration.courseType} />
                </div>
                {course && (
                  <p className="text-sm text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {formatCurrency(registration.price)}
                </span>
              </div>
              {course && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Passing score: {course.passingScore}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <h3 className="font-semibold text-foreground mb-4">
              Enrollment Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Registration
                </span>
                <StatusBadge status={registration.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment</span>
                <StatusBadge status={registration.paymentStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Field Executive
                </span>
                <span className="text-sm font-medium">
                  {registration.feName}
                </span>
              </div>
            </div>

            {registration.status === "Pending" && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Awaiting admin approval. You'll be notified once approved.
                </div>
              </div>
            )}
            {registration.status === "Rejected" && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-1.5 text-red-700 text-xs">
                  <XCircle className="h-3.5 w-3.5" />
                  Registration was rejected. Contact admin for details.
                </div>
              </div>
            )}
            {registration.status === "Approved" &&
              registration.paymentStatus === "Pending" && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment pending. Please complete payment to access classes.
                  </div>
                </div>
              )}
          </div>

          {/* Class Access */}
          {canAccessClass && registration.classLink && (
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">
                  Class Access Granted!
                </h3>
              </div>
              {registration.schedule && (
                <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{registration.schedule}</span>
                </div>
              )}
              <Button
                asChild
                className="bg-green-600 hover:bg-green-700 text-white border-0 gap-2"
                data-ocid="student.class_link.button"
              >
                <a
                  href={registration.classLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> Join Class
                </a>
              </Button>
            </div>
          )}

          {/* Take Exam */}
          {canAccessClass && (
            <div className="bg-white rounded-xl border border-border shadow-card p-5">
              <h3 className="font-semibold text-foreground mb-2">
                Ready for your exam?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take your {registration.courseName} exam and earn your
                certificate.
              </p>
              <Button
                onClick={() => navigate({ to: "/student/exam" })}
                className="teal-gradient text-white border-0"
                data-ocid="student.take_exam.button"
              >
                Take Exam
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
