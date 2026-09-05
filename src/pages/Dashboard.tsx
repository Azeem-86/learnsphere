import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  Trophy,
  BarChart3,
  Zap,
  Play,
  UserPlus,
} from "lucide-react";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="clay-card p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} clay-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function LearnerDashboard() {
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);
  const certificates = useQuery(api.certificates.getUserCertificates);
  const assignments = useQuery(api.assignments.getSubmissionsByUser);

  const inProgress = enrollments?.filter((e: any) => !e.isCompleted) ?? [];
  const completed = enrollments?.filter((e: any) => e.isCompleted) ?? [];
  const pendingAssignments = assignments?.filter((s: any) => s.status === "submitted") ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
        <p className="text-muted-foreground mt-1">Continue your learning journey where you left off.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="Enrolled" value={enrollments?.length ?? 0} color="bg-primary/10" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Completed" value={completed.length} color="bg-emerald-50" />
        <StatCard icon={<Award className="h-5 w-5 text-amber-600" />} label="Certificates" value={certificates?.length ?? 0} color="bg-amber-50" />
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Submissions" value={assignments?.length ?? 0} color="bg-blue-50" />
      </div>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" /> Continue Learning
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {inProgress.slice(0, 4).map((e: any) => (
              <Link key={e._id} to={`/dashboard/course/${e.courseId}`}>
                <div className="clay-card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold group-hover:text-primary transition-colors">{e.course?.title}</h4>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <Progress value={e.progress?.percentage ?? 0} className="clay-progress h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{e.progress?.completedLessons}/{e.progress?.totalLessons} lessons completed</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" /> My Certificates
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert: any) => (
              <div key={cert._id} className="clay-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 clay-sm">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.courseName}</h4>
                    <p className="text-xs text-muted-foreground">{cert.orgName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {cert.certificateId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inProgress.length === 0 && (!certificates || certificates.length === 0) && (
        <div className="clay-card p-10 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to start learning?</h3>
          <p className="text-muted-foreground mb-4">Browse available courses and enroll to begin your journey.</p>
          <Button asChild className="clay-btn">
            <Link to="/dashboard/courses">Browse Courses</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function InstructorDashboard() {
  const profile = useApp();
  const courses = useQuery(
    api.courses.getCourses,
    profile.selectedOrg ? { orgId: profile.selectedOrg._id } : "skip"
  );

  const myCourses = courses ?? [];
  const publishedCourses = myCourses.filter((c: any) => c.isPublished);
  const totalEnrollments = myCourses.reduce((acc: number, c: any) => acc + (c.enrollmentCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">Instructor Dashboard 📚</h2>
        <p className="text-muted-foreground mt-1">Manage your courses and track student progress.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="My Courses" value={myCourses.length} color="bg-primary/10" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Published" value={publishedCourses.length} color="bg-emerald-50" />
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} label="Total Learners" value={totalEnrollments} color="bg-blue-50" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-amber-600" />} label="Draft" value={myCourses.length - publishedCourses.length} color="bg-amber-50" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">My Courses</h3>
        <Button asChild className="clay-btn text-white">
          <Link to="/dashboard/course-builder">+ New Course</Link>
        </Button>
      </div>

      {myCourses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {myCourses.map((course: any) => (
            <Link key={course._id} to={`/dashboard/course/${course._id}`}>
              <div className="clay-card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">{course.title}</h4>
                  <Badge variant={course.isPublished ? "default" : "secondary"} className="clay-badge text-xs">
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.moduleCount} modules</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrollmentCount} enrolled</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="clay-card p-10 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">Create your first course to start teaching.</p>
          <Button asChild className="clay-btn text-white">
            <Link to="/dashboard/course-builder">Create Course</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function OrgAdminDashboard() {
  const { selectedOrg } = useApp();
  const stats = useQuery(
    api.organizations.getOrgStats,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const courses = useQuery(
    api.courses.getCourses,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">Organization Dashboard 🏢</h2>
        <p className="text-muted-foreground mt-1">Overview of your organization's training program.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Members" value={stats?.totalMembers ?? 0} color="bg-primary/10" />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-blue-600" />} label="Instructors" value={stats?.totalInstructors ?? 0} color="bg-blue-50" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-emerald-600" />} label="Courses" value={stats?.totalCourses ?? 0} color="bg-emerald-50" />
        <StatCard icon={<Award className="h-5 w-5 text-amber-600" />} label="Enrollments" value={stats?.totalEnrollments ?? 0} color="bg-amber-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="clay-card p-5">
          <h3 className="font-bold mb-3">Completion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{stats?.completionRate ?? 0}%</div>
            <div className="flex-1">
              <Progress value={stats?.completionRate ?? 0} className="clay-progress h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.completedEnrollments ?? 0} of {stats?.totalEnrollments ?? 0} enrollments completed
              </p>
            </div>
          </div>
        </div>

        <div className="clay-card p-5">
          <h3 className="font-bold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start clay-sm rounded-xl">
              <Link to="/dashboard/members"><UserPlus className="mr-2 h-4 w-4" /> Invite Member</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start clay-sm rounded-xl">
              <Link to="/dashboard/course-builder"><BookOpen className="mr-2 h-4 w-4" /> Create Course</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start clay-sm rounded-xl">
              <Link to="/dashboard/courses"><BarChart3 className="mr-2 h-4 w-4" /> View All Courses</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      {courses && courses.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Recent Courses</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.slice(0, 4).map((course: any) => (
              <Link key={course._id} to={`/dashboard/course/${course._id}`}>
                <div className="clay-card p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{course.title}</h4>
                    <Badge variant={course.isPublished ? "default" : "secondary"} className="clay-badge text-xs">
                      {course.isPublished ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{course.enrollmentCount ?? 0} enrolled</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuperAdminDashboard() {
  const allOrgs = useQuery(api.organizations.getAllOrganizations);
  const allUsers = useQuery(api.users.getAllUsers);

  const totalUsers = allUsers?.length ?? 0;
  const totalOrgs = allOrgs?.length ?? 0;
  const instructors = allUsers?.filter((u: any) => u.role === "instructor").length ?? 0;
  const learners = allUsers?.filter((u: any) => u.role === "learner").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">System Overview ⚡</h2>
        <p className="text-muted-foreground mt-1">Manage the entire LearnSphere platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 className="h-5 w-5 text-primary" />} label="Organizations" value={totalOrgs} color="bg-primary/10" />
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} label="Total Users" value={totalUsers} color="bg-blue-50" />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-emerald-600" />} label="Instructors" value={instructors} color="bg-emerald-50" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-amber-600" />} label="Learners" value={learners} color="bg-amber-50" />
      </div>

      {/* All Organizations */}
      <div>
        <h3 className="text-lg font-bold mb-3">All Organizations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {allOrgs?.map((org: any) => (
            <div key={org._id} className="clay-card p-5">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{org.name}</h4>
                <Badge variant={org.isActive ? "default" : "destructive"} className="clay-badge text-xs">
                  {org.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{org.description}</p>
              <p className="text-xs text-muted-foreground mt-2">Created {new Date(org.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Users */}
      <div>
        <h3 className="text-lg font-bold mb-3">All Users</h3>
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers?.map((user: any) => (
                  <tr key={user._id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="clay-badge text-xs capitalize">
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? "text-emerald-600" : "text-red-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, isLoading } = useApp();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="clay-card p-8 text-center">
            <Zap className="h-8 w-8 text-primary mx-auto animate-pulse mb-3" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return <ProfileSetup />;
  }

  const role = profile.role;

  return (
    <AppLayout>
      {role === "super_admin" && <SuperAdminDashboard />}
      {role === "org_admin" && <OrgAdminDashboard />}
      {role === "instructor" && <InstructorDashboard />}
      {role === "learner" && <LearnerDashboard />}
    </AppLayout>
  );
}

function ProfileSetup() {
  const { createProfile, user } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState("learner");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createProfile(name, email, role);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="clay-card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 clay-sm mx-auto mb-4">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="clay-input w-full px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="clay-input w-full px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "learner", label: "Learner", icon: <GraduationCap className="h-5 w-5" /> },
                { value: "instructor", label: "Instructor", icon: <BookOpen className="h-5 w-5" /> },
                { value: "org_admin", label: "Org Admin", icon: <Building2 className="h-5 w-5" /> },
                { value: "super_admin", label: "Super Admin", icon: <Zap className="h-5 w-5" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`clay-card p-4 text-center transition-all ${
                    role === opt.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={role === opt.value ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full clay-btn text-white" disabled={saving}>
            {saving ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
}
