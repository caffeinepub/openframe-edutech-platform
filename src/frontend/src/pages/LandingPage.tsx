import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Globe,
  GraduationCap,
  Layers,
  Menu,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiFacebook, SiLinkedin, SiX } from "react-icons/si";

const navLinks = ["Features", "Modules", "Solutions", "Pricing", "Contact"];

const modules = [
  { label: "School Management", icon: Layers },
  { label: "Enrollment Tracking", icon: Users },
  { label: "Online Learning", icon: BookOpen },
  { label: "Analytics", icon: BarChart3 },
];

const features = [
  {
    icon: GraduationCap,
    title: "Multi-Role Access",
    desc: "Separate dashboards for Admin, Field Executives, and Students with role-specific features.",
  },
  {
    icon: Users,
    title: "FE Management",
    desc: "Track field executives, assign IDs, monitor performance, and measure student acquisition.",
  },
  {
    icon: Award,
    title: "Auto Certificates",
    desc: "Automatically generate verified certificates upon exam completion with unique IDs.",
  },
  {
    icon: TrendingUp,
    title: "Revenue Tracking",
    desc: "Monitor payment status, pending dues, and overall revenue in real-time dashboards.",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    desc: "Create and manage Basic, Standard, and Premium courses with videos, notes, and exams.",
  },
  {
    icon: Globe,
    title: "Online Classes",
    desc: "Connect students to live classes with direct meeting links upon enrollment approval.",
  },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 teal-gradient rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">
                OpenFrame
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid={`nav.${link.toLowerCase()}.link`}
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/login" })}
                data-ocid="nav.login.button"
              >
                Login
              </Button>
              <Button
                size="sm"
                className="teal-gradient text-white border-0 hover:opacity-90"
                onClick={() => navigate({ to: "/login" })}
                data-ocid="nav.get_started.button"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-ocid="nav.mobile_menu.toggle"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    className="text-sm font-medium text-muted-foreground py-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link}
                  </a>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate({ to: "/login" })}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 teal-gradient text-white border-0"
                    onClick={() => navigate({ to: "/login" })}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-gradient py-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-6">
                <CheckCircle className="h-3 w-3" /> Trusted by 500+ Institutions
                Across India
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                OpenFrame: Integrated{" "}
                <span className="text-primary">Education Management</span>{" "}
                Platform
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Streamline student enrollment, empower field executives, track
                payments, and deliver online education — all in one powerful
                platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="teal-gradient text-white border-0 hover:opacity-90 px-8"
                  onClick={() => navigate({ to: "/login" })}
                  data-ocid="hero.get_started.button"
                >
                  Get Started Free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ to: "/login" })}
                  data-ocid="hero.login.button"
                >
                  Sign In to Platform
                </Button>
              </div>
            </motion.div>
          </div>

          {/* 3-up showcase */}
          <div className="max-w-6xl mx-auto mt-16 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {[
                {
                  label: "Admin Dashboard",
                  img: "/assets/generated/dashboard-preview.dim_600x400.png",
                  scale: false,
                },
                {
                  label: "Field Executive Panel",
                  img: "/assets/generated/fe-panel-preview.dim_600x400.png",
                  scale: true,
                },
                {
                  label: "Student Portal",
                  img: "/assets/generated/student-portal-preview.dim_600x400.png",
                  scale: false,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg border border-border overflow-hidden ${
                    item.scale ? "md:scale-105 md:shadow-xl z-10" : ""
                  }`}
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules + Trust */}
        <section
          id="modules"
          className="py-16 px-4 bg-white border-y border-border"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Key Modules */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Key Modules
                </h2>
                <div className="flex flex-wrap gap-3">
                  {modules.map(({ label, icon: Icon }) => (
                    <span
                      key={label}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-sm font-medium"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  ))}
                </div>
                <ul className="mt-6 space-y-2">
                  {[
                    "Complete student lifecycle management",
                    "Field executive performance tracking",
                    "Automated certificate generation",
                    "Real-time payment status monitoring",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trusted by */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Trusted by Institutions
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    "Apex Academy",
                    "TechBridge Institute",
                    "SkillForge",
                    "EduPath",
                    "LearnSphere",
                    "CodeCraft",
                  ].map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-center p-3 bg-muted rounded-xl border border-border text-center"
                    >
                      <span className="text-xs font-semibold text-muted-foreground">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Join 500+ educational institutions and training centers using
                  OpenFrame to manage enrollments, track progress, and certify
                  students.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Everything you need to manage education
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From student registration to certification, OpenFrame covers the
                entire educational journey.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl p-6 border border-border shadow-card card-hover"
                >
                  <div className="p-2 bg-teal-50 rounded-lg w-fit mb-4">
                    <Icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 teal-gradient">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your institution?
            </h2>
            <p className="text-white/80 mb-8">
              Get started with OpenFrame today and see the difference in your
              enrollment and delivery operations.
            </p>
            <Button
              size="lg"
              className="bg-white text-teal-800 hover:bg-white/90 font-semibold px-8"
              onClick={() => navigate({ to: "/login" })}
              data-ocid="cta.get_started.button"
            >
              Start Free Today
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 teal-gradient rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-foreground">OpenFrame</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The integrated education management platform for modern
                institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2">
                {["Features", "Modules", "Solutions", "Pricing"].map((l) => (
                  <li key={l}>
                    <a
                      href="/#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Social</h4>
              <div className="flex gap-3">
                {[
                  {
                    icon: SiLinkedin,
                    href: "https://linkedin.com",
                    label: "LinkedIn",
                  },
                  {
                    icon: SiX,
                    href: "https://twitter.com",
                    label: "Twitter",
                  },
                  {
                    icon: SiFacebook,
                    href: "https://facebook.com",
                    label: "Facebook",
                  },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
