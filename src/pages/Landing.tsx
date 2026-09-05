import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Shield,
  BarChart3,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Play,
  Zap,
  Globe,
  Star,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const features = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Course Builder",
    desc: "Create rich courses with modules, lessons, quizzes, and assignments. Support for text, video, and interactive content.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Multi-Tenant",
    desc: "Separate organizations with their own admins, instructors, learners, and course catalogs.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: "Quizzes & Assessments",
    desc: "Build quizzes with multiple-choice questions, automatic scoring, and pass/fail thresholds.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Progress Tracking",
    desc: "Learners track their progress through courses. Instructors monitor completion rates and engagement.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Certificates",
    desc: "Automatic certificate generation on course completion with unique verification codes.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Role-Based Access",
    desc: "Super Admin, Organization Admin, Instructor, and Learner roles with proper permissions.",
    color: "bg-violet-50 text-violet-600",
  },
];

const stats = [
  { value: "2", label: "Organizations" },
  { value: "3", label: "Courses" },
  { value: "5+", label: "Quizzes" },
  { value: "6", label: "Learners" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary clay-btn">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">LearnSphere</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="clay-sm rounded-2xl hidden sm:flex">
              <Link to="/verify">Verify Certificate</Link>
            </Button>
            <Button asChild className="clay-btn text-white rounded-2xl">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-32 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <div className="clay-badge inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/5">
              <Zap className="h-4 w-4" /> Multi-Tenant Learning Management System
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Train your teams with{" "}
              <span className="gradient-text">LearnSphere</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              A complete LMS for corporate training, online academies, and professional development.
              Create courses, track progress, assess learners, and issue certificates — all in one place.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button asChild className="clay-btn text-white rounded-2xl px-8 py-6 text-base">
                <Link to="/auth">
                  Start Learning <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="clay-sm rounded-2xl px-8 py-6 text-base">
                <Link to="/verify">
                  Verify Certificate
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="clay-card p-5 text-center">
                <p className="text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Hero Visual - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="clay-card p-2 overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 via-background to-blue-50 rounded-2xl p-6 min-h-[300px]">
                {/* Mock dashboard */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground ml-2">LearnSphere Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Courses", value: "3", color: "bg-primary/10 text-primary" },
                    { label: "Learners", value: "6", color: "bg-blue-50 text-blue-600" },
                    { label: "Certificates", value: "1", color: "bg-amber-50 text-amber-600" },
                  ].map((s, i) => (
                    <div key={i} className="clay-inset p-4 rounded-2xl">
                      <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="clay-inset p-4 rounded-2xl">
                    <p className="text-sm font-semibold mb-2">Leadership Foundations</p>
                    <div className="clay-progress h-2 w-full mb-1" />
                    <p className="text-xs text-muted-foreground">67% complete</p>
                  </div>
                  <div className="clay-inset p-4 rounded-2xl">
                    <p className="text-sm font-semibold mb-2">React Fundamentals</p>
                    <div className="clay-progress h-2 w-full mb-1" />
                    <p className="text-xs text-muted-foreground">15% complete</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Everything you need to train</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From course creation to certificate verification, LearnSphere covers the complete learning lifecycle.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="clay-card p-6"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl clay-sm mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-6 py-20 bg-primary/3">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Complete Learning Workflow</h2>
            <p className="text-muted-foreground">From registration to certification — every step works.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { step: "1", text: "Sign up and create your organization", icon: <Users className="h-4 w-4" /> },
              { step: "2", text: "Instructors build courses with modules and lessons", icon: <BookOpen className="h-4 w-4" /> },
              { step: "3", text: "Add quizzes and assignments for assessment", icon: <ClipboardCheck className="h-4 w-4" /> },
              { step: "4", text: "Learners enroll and start learning", icon: <Play className="h-4 w-4" /> },
              { step: "5", text: "Complete lessons, take quizzes, submit work", icon: <CheckCircle2 className="h-4 w-4" /> },
              { step: "6", text: "Instructors review and grade submissions", icon: <BarChart3 className="h-4 w-4" /> },
              { step: "7", text: "Earn certificates on course completion", icon: <Award className="h-4 w-4" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="clay-card flex items-center gap-4 p-4"
              >
                <div className="clay-tab-active flex h-8 w-8 items-center justify-center rounded-xl text-white text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="clay-card p-10"
          >
            <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Create your account and start building courses, enrolling learners, and tracking progress today.
            </p>
            <Button asChild className="clay-btn text-white rounded-2xl px-8 py-6 text-base">
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">LearnSphere</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/verify" className="hover:text-foreground transition-colors">Verify Certificate</Link>
            <span>© 2024 LearnSphere</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
