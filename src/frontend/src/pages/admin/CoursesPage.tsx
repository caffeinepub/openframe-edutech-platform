import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  HelpCircle,
  IndianRupee,
  Loader2,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { CourseTypeBadge } from "../../components/StatusBadge";
import { db } from "../../lib/storage";
import type { Course, ExamQuestion } from "../../types/models";

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

function makeCourseTitle(
  standard: number,
  medium: "English" | "Kannada",
): string {
  return `${ORDINALS[standard - 1]} Standard \u2013 ${medium}`;
}

interface CourseForm {
  standard: string;
  medium: "English" | "Kannada";
  courseType: "Basic" | "Standard" | "Premium";
  description: string;
  videoUrl: string;
  notes: string;
  price: string;
  passingScore: string;
}

const defaultForm: CourseForm = {
  standard: "1",
  medium: "English",
  courseType: "Basic",
  description: "",
  videoUrl: "",
  notes: "",
  price: "50",
  passingScore: "60",
};

function MediumBadge({ medium }: { medium: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${
        medium === "English"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-orange-200 bg-orange-50 text-orange-700"
      }`}
    >
      {medium}
    </Badge>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  // Question form
  const [qForm, setQForm] = useState({
    question: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correctIndex: "0",
  });
  const [editQuestion, setEditQuestion] = useState<ExamQuestion | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState<ExamQuestion | null>(
    null,
  );

  const load = () => {
    setCourses(db.getCourses());
    setQuestions(db.getQuestions());
  };
  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const all = db.getCourses();
    const standard = Number(form.standard);
    const title = makeCourseTitle(standard, form.medium);

    if (editCourse) {
      const updated = all.map((c) =>
        c.id === editCourse.id
          ? {
              ...c,
              standard,
              medium: form.medium,
              title,
              courseType: form.courseType,
              description: form.description,
              videoUrl: form.videoUrl,
              notes: form.notes,
              price: Number(form.price),
              passingScore: Number(form.passingScore),
            }
          : c,
      );
      db.saveCourses(updated);
      toast.success("Course updated!");
    } else {
      const newCourse: Course = {
        id: db.nextId(all),
        standard,
        medium: form.medium,
        title,
        courseType: form.courseType,
        description: form.description,
        videoUrl: form.videoUrl,
        notes: form.notes,
        price: Number(form.price),
        passingScore: Number(form.passingScore),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      db.saveCourses([...all, newCourse]);
      toast.success("Course created!");
    }

    load();
    setShowModal(false);
    setEditCourse(null);
    setForm(defaultForm);
    setLoading(false);
  };

  const handleDelete = () => {
    if (!deleteCourse) return;
    db.saveCourses(db.getCourses().filter((c) => c.id !== deleteCourse.id));
    db.saveQuestions(
      db.getQuestions().filter((q) => q.courseId !== deleteCourse.id),
    );
    load();
    setDeleteCourse(null);
    toast.success("Course deleted");
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedCourse) return;
    setQLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const all = db.getQuestions();

    if (editQuestion) {
      const updated = all.map((q) =>
        q.id === editQuestion.id
          ? {
              ...q,
              question: qForm.question,
              options: [
                qForm.option0,
                qForm.option1,
                qForm.option2,
                qForm.option3,
              ],
              correctIndex: Number(qForm.correctIndex),
            }
          : q,
      );
      db.saveQuestions(updated);
      toast.success("Question updated!");
    } else {
      const newQ: ExamQuestion = {
        id: db.nextId(all),
        courseId: expandedCourse,
        question: qForm.question,
        options: [qForm.option0, qForm.option1, qForm.option2, qForm.option3],
        correctIndex: Number(qForm.correctIndex),
      };
      db.saveQuestions([...all, newQ]);
      toast.success("Question added!");
    }

    load();
    setEditQuestion(null);
    setQForm({
      question: "",
      option0: "",
      option1: "",
      option2: "",
      option3: "",
      correctIndex: "0",
    });
    setQLoading(false);
  };

  const openEditCourse = (course: Course) => {
    setEditCourse(course);
    setForm({
      standard: String(course.standard ?? 1),
      medium: course.medium ?? "English",
      courseType: course.courseType,
      description: course.description,
      videoUrl: course.videoUrl,
      notes: course.notes,
      price: String(course.price),
      passingScore: String(course.passingScore),
    });
    setShowModal(true);
  };

  const openEditQuestion = (q: ExamQuestion) => {
    setEditQuestion(q);
    setQForm({
      question: q.question,
      option0: q.options[0] ?? "",
      option1: q.options[1] ?? "",
      option2: q.options[2] ?? "",
      option3: q.options[3] ?? "",
      correctIndex: String(q.correctIndex),
    });
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestion) return;
    db.saveQuestions(
      db.getQuestions().filter((q) => q.id !== deleteQuestion.id),
    );
    load();
    setDeleteQuestion(null);
    toast.success("Question deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {courses.length} courses
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCourse(null);
            setForm(defaultForm);
            setShowModal(true);
          }}
          className="teal-gradient text-white border-0 gap-2"
          data-ocid="admin.add_course.button"
        >
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Create your first course to get started"
            data-ocid="admin.courses.empty_state"
          />
        ) : (
          courses.map((course) => {
            const courseQs = questions.filter((q) => q.courseId === course.id);
            const isExpanded = expandedCourse === course.id;

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-border shadow-card"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground text-lg">
                          {course.title}
                        </h3>
                        <CourseTypeBadge type={course.courseType} />
                        <MediumBadge medium={course.medium ?? "English"} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span className="font-semibold text-foreground">
                            {course.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {course.videoUrl && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Video className="h-3.5 w-3.5" />
                            <a
                              href={course.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline text-xs"
                            >
                              Video Link
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>{courseQs.length} questions</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Pass: {course.passingScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCourse(course)}
                        data-ocid={`admin.course.edit_button.${course.id}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteCourse(course)}
                        data-ocid={`admin.course.delete_button.${course.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedCourse(isExpanded ? null : course.id)
                        }
                        data-ocid={`admin.course.expand.${course.id}`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes preview */}
                {course.notes && (
                  <div className="px-5 pb-3">
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        COURSE NOTES
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {course.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Exam Questions */}
                {isExpanded && (
                  <div className="border-t border-border p-5">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      Exam Questions ({courseQs.length})
                    </h4>

                    {/* Question form */}
                    <form
                      onSubmit={handleAddQuestion}
                      className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3"
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        {editQuestion ? "EDIT QUESTION" : "ADD NEW QUESTION"}
                      </p>
                      <div>
                        <Label className="text-xs">Question</Label>
                        <Input
                          value={qForm.question}
                          onChange={(e) =>
                            setQForm((f) => ({
                              ...f,
                              question: e.target.value,
                            }))
                          }
                          placeholder="Enter question..."
                          className="mt-1 h-8 text-sm"
                          data-ocid="admin.question.input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i}>
                            <Label className="text-xs">Option {i + 1}</Label>
                            <Input
                              value={qForm[`option${i}` as keyof typeof qForm]}
                              onChange={(e) =>
                                setQForm((f) => ({
                                  ...f,
                                  [`option${i}`]: e.target.value,
                                }))
                              }
                              placeholder={`Option ${i + 1}`}
                              className="mt-0.5 h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-xs">Correct Answer</Label>
                        <Select
                          value={qForm.correctIndex}
                          onValueChange={(v) =>
                            setQForm((f) => ({ ...f, correctIndex: v }))
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3].map((i) => (
                              <SelectItem key={i} value={String(i)}>
                                Option {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          className="teal-gradient text-white border-0"
                          disabled={qLoading}
                          data-ocid="admin.question.save_button"
                        >
                          {qLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : editQuestion ? (
                            "Update"
                          ) : (
                            "Add Question"
                          )}
                        </Button>
                        {editQuestion && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditQuestion(null);
                              setQForm({
                                question: "",
                                option0: "",
                                option1: "",
                                option2: "",
                                option3: "",
                                correctIndex: "0",
                              });
                            }}
                            data-ocid="admin.question.cancel_button"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>

                    {/* Question list */}
                    <div className="space-y-2">
                      {courseQs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No questions yet. Add some above.
                        </p>
                      ) : (
                        courseQs.map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="bg-white border border-border rounded-lg p-3 text-sm"
                            data-ocid={`admin.question.item.${qIdx + 1}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  Q{qIdx + 1}. {q.question}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {q.options.map((opt, oi) => (
                                    <span
                                      key={`opt-${q.id}-${oi}`}
                                      className={`text-xs px-2 py-0.5 rounded ${
                                        oi === q.correctIndex
                                          ? "bg-green-100 text-green-800 font-semibold"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oi)}. {opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => openEditQuestion(q)}
                                  data-ocid={`admin.question.edit_button.${qIdx + 1}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive"
                                  onClick={() => setDeleteQuestion(q)}
                                  data-ocid={`admin.question.delete_button.${qIdx + 1}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Course Add/Edit Dialog */}
      <Dialog
        open={showModal}
        onOpenChange={(o) => {
          setShowModal(o);
          if (!o) {
            setEditCourse(null);
            setForm(defaultForm);
          }
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="admin.course.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editCourse ? "Edit Course" : "Add New Course"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Standard *</Label>
                  <Select
                    value={form.standard}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, standard: v }))
                    }
                  >
                    <SelectTrigger
                      className="mt-1"
                      data-ocid="admin.course_standard.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
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
                      ].map((ord, i) => (
                        <SelectItem key={ord} value={String(i + 1)}>
                          {ord} Standard
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Medium *</Label>
                  <Select
                    value={form.medium}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        medium: v as "English" | "Kannada",
                      }))
                    }
                  >
                    <SelectTrigger
                      className="mt-1"
                      data-ocid="admin.course_medium.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-generated title preview */}
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground text-xs font-semibold">
                  COURSE TITLE:{" "}
                </span>
                <span className="font-medium text-foreground">
                  {makeCourseTitle(Number(form.standard), form.medium)}
                </span>
              </div>

              <div>
                <Label>Course Type *</Label>
                <Select
                  value={form.courseType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      courseType: v as "Basic" | "Standard" | "Premium",
                    }))
                  }
                >
                  <SelectTrigger
                    className="mt-1"
                    data-ocid="admin.course_type.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Basic", "Standard", "Premium"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c-desc">Description</Label>
                <Textarea
                  id="c-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Course description..."
                  className="mt-1"
                  rows={2}
                  data-ocid="admin.course_description.textarea"
                />
              </div>
              <div>
                <Label htmlFor="c-video">Video URL</Label>
                <Input
                  id="c-video"
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, videoUrl: e.target.value }))
                  }
                  placeholder="https://youtube.com/..."
                  className="mt-1"
                  data-ocid="admin.course_video.input"
                />
              </div>
              <div>
                <Label htmlFor="c-notes">Notes</Label>
                <Textarea
                  id="c-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Course notes and topics..."
                  className="mt-1"
                  rows={2}
                  data-ocid="admin.course_notes.textarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-price">Price (₹) *</Label>
                  <Input
                    id="c-price"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="50"
                    className="mt-1"
                    data-ocid="admin.course_price.input"
                  />
                </div>
                <div>
                  <Label htmlFor="c-pass">Passing Score (%)</Label>
                  <Input
                    id="c-pass"
                    type="number"
                    value={form.passingScore}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, passingScore: e.target.value }))
                    }
                    placeholder="60"
                    className="mt-1"
                    data-ocid="admin.course_passing_score.input"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                data-ocid="admin.course.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="teal-gradient text-white border-0"
                disabled={loading}
                data-ocid="admin.course.save_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editCourse ? (
                  "Save Changes"
                ) : (
                  "Create Course"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirm */}
      <AlertDialog
        open={!!deleteCourse}
        onOpenChange={(o) => !o && setDeleteCourse(null)}
      >
        <AlertDialogContent data-ocid="admin.course_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteCourse?.title}</strong>? All associated exam
              questions will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.course_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="admin.course_delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirm */}
      <AlertDialog
        open={!!deleteQuestion}
        onOpenChange={(o) => !o && setDeleteQuestion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
