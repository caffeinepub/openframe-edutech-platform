import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/storage";
import type {
  Certificate,
  Course,
  ExamAttempt,
  ExamQuestion,
  Registration,
} from "../../types/models";

export default function ExamPage() {
  const { session } = useApp();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<ExamAttempt | null>(
    null,
  );

  useEffect(() => {
    if (!session?.id) return;
    const student = db.getStudents().find((s) => s.id === session.id);
    const allRegs = db.getRegistrations();
    const reg = student?.registrationId
      ? allRegs.find((r) => r.id === student.registrationId)
      : allRegs.find((r) => r.studentPhone === student?.phone);

    if (!reg) return;
    setRegistration(reg);

    const c = db.getCourses().find((cr) => cr.id === reg.courseId);
    if (c) setCourse(c);

    const qs = db.getQuestions().filter((q) => q.courseId === reg.courseId);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));

    const attempts = db.getExamAttempts();
    const attempt = attempts.find(
      (a) => a.studentId === session.id && a.courseId === reg.courseId,
    );
    if (attempt) {
      setAlreadyAttempted(true);
      setExistingAttempt(attempt);
    }
  }, [session?.id]);

  const handleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[qIdx] = optIdx;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (course?.passingScore ?? 60);

    const attempts = db.getExamAttempts();
    const newAttempt: ExamAttempt = {
      id: db.nextId(attempts),
      studentId: session!.id!,
      registrationId: registration!.id,
      courseId: course!.id,
      answers: answers as number[],
      score,
      passed,
      takenAt: new Date().toISOString(),
    };
    db.saveExamAttempts([...attempts, newAttempt]);

    if (passed) {
      const certs = db.getCertificates();
      const certNum = `CERT-${new Date().getFullYear()}-${String(db.nextId(certs)).padStart(5, "0")}`;
      const newCert: Certificate = {
        id: db.nextId(certs),
        studentId: session!.id!,
        registrationId: registration!.id,
        courseId: course!.id,
        studentName: session!.name,
        courseName: course!.title,
        certNumber: certNum,
        issuedAt: new Date().toISOString(),
      };
      db.saveCertificates([...certs, newCert]);
    }

    setResult({ score, passed });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (!registration) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <h3 className="font-semibold text-foreground mb-2">
          No Active Enrollment
        </h3>
        <p className="text-sm text-muted-foreground">
          You need an active enrollment to take an exam.
        </p>
      </div>
    );
  }

  if (
    registration.status !== "Approved" ||
    registration.paymentStatus !== "Paid"
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <h3 className="font-semibold text-foreground mb-2">
          Exam Not Available
        </h3>
        <p className="text-sm text-muted-foreground">
          Your registration must be Approved and payment must be Paid to take
          the exam.
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            Registration:{" "}
            <span className="font-medium">{registration.status}</span>
          </p>
          <p>
            Payment:{" "}
            <span className="font-medium">{registration.paymentStatus}</span>
          </p>
        </div>
      </div>
    );
  }

  if (alreadyAttempted && existingAttempt) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-border shadow-card p-8 text-center">
          {existingAttempt.passed ? (
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          )}
          <h3 className="text-xl font-bold text-foreground mb-1">
            {existingAttempt.passed ? "Exam Passed!" : "Exam Not Passed"}
          </h3>
          <p className="text-muted-foreground mb-4">
            You already attempted this exam.
          </p>
          <div className="text-3xl font-extrabold text-primary mb-1">
            {existingAttempt.score}%
          </div>
          <p className="text-sm text-muted-foreground">Your Score</p>
          {existingAttempt.passed && (
            <Button
              onClick={() => navigate({ to: "/student/certificate" })}
              className="mt-4 teal-gradient text-white border-0"
              data-ocid="student.view_certificate.button"
            >
              View Certificate
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <p className="text-muted-foreground">
          No exam questions available yet. Check back later.
        </p>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-border shadow-card p-8 text-center">
          {result.passed ? (
            <>
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-700 mb-1">
                Congratulations!
              </h3>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-600 mb-1">
                Not Passed
              </h3>
            </>
          )}
          <p className="text-muted-foreground mb-4">
            {result.passed
              ? "You have successfully passed the exam! Your certificate has been generated."
              : `You scored below the passing threshold of ${course?.passingScore}%.`}
          </p>
          <div className="text-4xl font-extrabold text-foreground mb-1">
            {result.score}%
          </div>
          <p className="text-sm text-muted-foreground mb-2">Your Score</p>
          <Progress value={result.score} className="h-3 mb-6" />
          {result.passed ? (
            <Button
              onClick={() => navigate({ to: "/student/certificate" })}
              className="teal-gradient text-white border-0 gap-2"
              data-ocid="student.exam_result_certificate.button"
            >
              View Certificate <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Please contact your instructor for further guidance.
            </p>
          )}
        </div>
      </div>
    );
  }

  const progress =
    (answers.filter((a) => a !== null).length / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {course?.title} Exam
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {questions.length} questions • Passing score: {course?.passingScore}%
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {answers.filter((a) => a !== null).length} / {questions.length}{" "}
            answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className="bg-white rounded-xl border border-border shadow-card p-5"
            data-ocid={`student.exam.question.${qIdx + 1}`}
          >
            <p className="font-semibold text-foreground mb-4">
              Q{qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <button
                  key={`opt-${q.id}-${oIdx}`}
                  type="button"
                  onClick={() => handleAnswer(qIdx, oIdx)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                    answers[qIdx] === oIdx
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  data-ocid={`student.exam.option.${qIdx + 1}.${oIdx + 1}`}
                >
                  <span className="font-semibold mr-2">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  {opt}
                  {answers[qIdx] === oIdx && (
                    <CheckCircle className="inline ml-2 h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full teal-gradient text-white border-0 h-12 text-base"
        disabled={submitting || answers.some((a) => a === null)}
        data-ocid="student.exam.submit_button"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Exam...
          </>
        ) : (
          "Submit Exam"
        )}
      </Button>
    </div>
  );
}
