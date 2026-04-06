import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { db } from "../lib/storage";
import type { FieldExecutive, Student } from "../types/models";

type RoleView = "select" | "admin" | "fe" | "student";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [view, setView] = useState<RoleView>("select");

  // Admin form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // Student mock form
  const [mockName, setMockName] = useState("");
  const [mockPhone, setMockPhone] = useState("");
  const [mockLoading, setMockLoading] = useState(false);

  // FE Internet Identity
  const ii = useInternetIdentity();
  const [feStep, setFeStep] = useState<"button" | "linking">("button");
  const [linkName, setLinkName] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  // When view changes away from 'fe', clear II state
  useEffect(() => {
    if (view !== "fe") {
      ii.clear();
      setFeStep("button");
      setLinkName("");
      setLinkPhone("");
    }
  }, [view, ii.clear]);

  // When II identity is set and we're in FE view, try to auto-match principal
  useEffect(() => {
    if (view !== "fe") return;
    if (!ii.identity) return;

    const principal = ii.identity.getPrincipal();
    if (principal.isAnonymous()) return;

    const principalStr = principal.toString();
    const fes = db.getFEs();
    const matched = fes.find((f) => f.principal === principalStr);

    if (matched) {
      login({
        role: "fe",
        id: matched.id,
        name: matched.name,
        phone: matched.phone,
        feCode: matched.feCode,
      });
      toast.success(`Welcome back, ${matched.name}!`);
      navigate({ to: "/fe/dashboard" });
    } else {
      // No principal match — show self-registration form
      setFeStep("linking");
    }
  }, [ii.identity, view, login, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (adminUser === "akashrajnayak" && adminPass === "aakashnaik") {
      login({ role: "admin", name: "Akash Raj Nayak" });
      toast.success("Welcome back, Admin!");
      navigate({ to: "/admin/dashboard" });
    } else {
      toast.error("Invalid username or password");
    }
    setAdminLoading(false);
  };

  const handleFERegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkPhone.trim()) {
      toast.error("Please enter your full name and phone number");
      return;
    }
    if (!ii.identity) {
      toast.error("Internet Identity not found. Please try again.");
      return;
    }
    setLinkLoading(true);

    const principalStr = ii.identity.getPrincipal().toString();
    const allFEs = db.getFEs();

    // Check if phone already registered to prevent duplicates
    const existingByPhone = allFEs.find((f) => f.phone === linkPhone.trim());
    if (existingByPhone) {
      // If same principal or unlinked account, link and log in
      if (
        !existingByPhone.principal ||
        existingByPhone.principal === principalStr
      ) {
        const updated = allFEs.map((f) =>
          f.id === existingByPhone.id ? { ...f, principal: principalStr } : f,
        );
        db.saveFEs(updated);
        login({
          role: "fe",
          id: existingByPhone.id,
          name: existingByPhone.name,
          phone: existingByPhone.phone,
          feCode: existingByPhone.feCode,
        });
        toast.success(`Welcome back, ${existingByPhone.name}!`);
        navigate({ to: "/fe/dashboard" });
        setLinkLoading(false);
        return;
      }
      toast.error(
        "This phone number is already registered to another account.",
      );
      setLinkLoading(false);
      return;
    }

    // Create new FE account
    const nextNum = allFEs.length + 1;
    const feCode = `FE${String(nextNum).padStart(3, "0")}`;
    const newFE: FieldExecutive = {
      id: db.nextId(allFEs),
      feCode,
      name: linkName.trim(),
      phone: linkPhone.trim(),
      principal: principalStr,
      createdAt: new Date().toISOString(),
      isActive: true,
      dailyTarget: 5,
      weeklyTarget: 25,
      monthlyTarget: 100,
      loginTime: null,
      logoutTime: null,
      totalWorkHours: 0,
      performanceScore: 0,
      rank: "Unranked",
      fixedSalary: 0,
      incentivePerRegistration: 0,
      bonusEarned: 0,
      totalEarnings: 0,
    };
    db.saveFEs([...allFEs, newFE]);

    login({
      role: "fe",
      id: newFE.id,
      name: newFE.name,
      phone: newFE.phone,
      feCode: newFE.feCode,
    });
    toast.success(
      `Welcome, ${newFE.name}! Your FE account (${feCode}) has been created.`,
    );
    navigate({ to: "/fe/dashboard" });
    setLinkLoading(false);
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockName.trim() || !mockPhone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setMockLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const students = db.getStudents();
    let student = students.find(
      (s) =>
        s.phone === mockPhone.trim() &&
        s.name.toLowerCase() === mockName.trim().toLowerCase(),
    );

    if (!student) {
      // Auto-register as new student
      const newStudent: Student = {
        id: db.nextId(students),
        name: mockName.trim(),
        phone: mockPhone.trim(),
        principal: `student-principal-${Date.now()}`,
        registrationId: null,
        createdAt: new Date().toISOString(),
      };
      students.push(newStudent);
      db.saveStudents(students);
      student = newStudent;
      toast.success(`Account created! Welcome, ${student.name}!`);
    } else {
      toast.success(`Welcome back, ${student.name}!`);
    }

    login({
      role: "student",
      id: student.id,
      name: student.name,
      phone: student.phone,
    });
    navigate({ to: "/student/dashboard" });
    setMockLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Top Bar */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            if (view === "select") {
              navigate({ to: "/" });
            } else {
              if (view === "fe") {
                ii.clear();
                setFeStep("button");
              }
              setView("select");
            }
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="login.back.button"
        >
          <ArrowLeft className="h-4 w-4" />
          {view === "select" ? "Back to Home" : "Back to role selection"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 teal-gradient rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                OpenFrame
              </span>
            </div>
            {view === "select" ? (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Sign In to OpenFrame
                </h1>
                <p className="text-muted-foreground mt-1">
                  Select your role to continue
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {view === "admin"
                    ? "Admin Login"
                    : view === "fe"
                      ? "Field Executive Login"
                      : "Student Login"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {view === "admin"
                    ? "Enter your admin credentials"
                    : view === "fe"
                      ? "Sign in securely with Internet Identity"
                      : "Enter your registered name and phone number"}
                </p>
              </>
            )}
          </div>

          {view === "select" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  role: "admin" as RoleView,
                  icon: Shield,
                  title: "Admin",
                  desc: "Full platform control, manage FEs, students, courses and reports.",
                  color: "text-purple-700",
                  bg: "bg-purple-50",
                  ocid: "login.admin.card",
                },
                {
                  role: "fe" as RoleView,
                  icon: Briefcase,
                  title: "Field Executive",
                  desc: "Register and manage your enrolled students, track daily performance.",
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  ocid: "login.fe.card",
                },
                {
                  role: "student" as RoleView,
                  icon: User,
                  title: "Student",
                  desc: "View your course, take exams, download certificates and more.",
                  color: "text-teal-700",
                  bg: "bg-teal-50",
                  ocid: "login.student.card",
                },
              ].map(({ role, icon: Icon, title, desc, color, bg, ocid }) => (
                <motion.button
                  key={role}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 8px 24px rgba(15,124,134,0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView(role)}
                  className="bg-white rounded-2xl p-8 border border-border shadow-card text-left cursor-pointer hover:border-primary transition-all"
                  data-ocid={ocid}
                >
                  <div className={`p-3 ${bg} rounded-xl w-fit mb-4`}>
                    <Icon className={`h-7 w-7 ${color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.button>
              ))}
            </motion.div>
          )}

          {view === "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm mx-auto"
            >
              <form
                onSubmit={handleAdminLogin}
                className="bg-white rounded-2xl p-8 border border-border shadow-card"
              >
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-user">Username</Label>
                    <Input
                      id="admin-user"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="Enter username"
                      className="mt-1"
                      data-ocid="login.admin.input"
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-pass">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="admin-pass"
                        type={showPass ? "text" : "password"}
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="Enter password"
                        data-ocid="login.admin_password.input"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full teal-gradient text-white border-0"
                    disabled={adminLoading}
                    data-ocid="login.admin.submit_button"
                  >
                    {adminLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Signing in...
                      </>
                    ) : (
                      "Sign In as Admin"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {view === "fe" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm mx-auto"
            >
              {feStep === "button" && (
                <div className="bg-white rounded-2xl p-8 border border-border shadow-card">
                  {/* II Brand area */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                      <svg
                        viewBox="0 0 32 32"
                        className="w-9 h-9 text-white"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="16" cy="10" r="4" />
                        <path d="M10 22c0-3.314 2.686-6 6-6s6 2.686 6 6v2H10v-2z" />
                        <path
                          d="M6 16a10 10 0 1 1 20 0 10 10 0 0 1-20 0z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          opacity="0.5"
                        />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-2">
                      Internet Identity
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sign in with your Internet Identity to access your FE
                      panel. Your identity is secured by the Internet Computer.
                    </p>
                  </div>

                  {/* Error message */}
                  {ii.isLoginError && ii.loginError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        {ii.loginError.message}
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 h-11 text-sm font-semibold"
                    disabled={ii.isLoggingIn || ii.isInitializing}
                    onClick={() => ii.login()}
                    data-ocid="login.fe_ii.button"
                  >
                    {ii.isLoggingIn || ii.isInitializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {ii.isInitializing
                          ? "Initializing..."
                          : "Opening Internet Identity..."}
                      </>
                    ) : (
                      "Sign in with Internet Identity"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    A new window will open for secure authentication.
                  </p>
                </div>
              )}

              {feStep === "linking" && (
                <div className="bg-white rounded-2xl p-8 border border-border shadow-card">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        Identity verified
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      Create your FE Account
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your name and phone number to register as a Field
                      Executive.
                    </p>
                  </div>

                  <form onSubmit={handleFERegisterSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="link-name">Full Name</Label>
                      <Input
                        id="link-name"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1"
                        data-ocid="login.fe_link_name.input"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-phone">Phone Number</Label>
                      <Input
                        id="link-phone"
                        value={linkPhone}
                        onChange={(e) => setLinkPhone(e.target.value)}
                        placeholder="10-digit phone number"
                        className="mt-1"
                        data-ocid="login.fe_link_phone.input"
                        autoComplete="tel"
                        maxLength={10}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full teal-gradient text-white border-0"
                      disabled={linkLoading}
                      data-ocid="login.fe_link.submit_button"
                    >
                      {linkLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Register & Sign In"
                      )}
                    </Button>
                  </form>

                  <button
                    type="button"
                    className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      ii.clear();
                      setFeStep("button");
                    }}
                  >
                    ← Use a different Internet Identity
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === "student" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm mx-auto"
            >
              <form
                onSubmit={handleStudentLogin}
                className="bg-white rounded-2xl p-8 border border-border shadow-card"
              >
                <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-xs text-teal-700 font-medium">
                    Secure Identity Login — powered by Internet Identity
                  </p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    Enter your name and phone to access your student portal. New
                    users will be registered automatically.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mock-name">Full Name</Label>
                    <Input
                      id="mock-name"
                      value={mockName}
                      onChange={(e) => setMockName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      data-ocid="login.student_name.input"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mock-phone">Phone Number</Label>
                    <Input
                      id="mock-phone"
                      value={mockPhone}
                      onChange={(e) => setMockPhone(e.target.value)}
                      placeholder="10-digit phone number"
                      className="mt-1"
                      data-ocid="login.student_phone.input"
                      autoComplete="tel"
                      maxLength={10}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full teal-gradient text-white border-0"
                    disabled={mockLoading}
                    data-ocid="login.student.submit_button"
                  >
                    {mockLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Verifying Identity...
                      </>
                    ) : (
                      "Sign In as Student"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
