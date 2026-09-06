import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  FileText,
  Trophy,
  Zap,
  Play,
  Clock,
  Send,
  XCircle,
  CheckCircle,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

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

// ─── LEARNER DASHBOARD ────────────────────────────────────────
function LearnerDashboard() {
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);
  const certificates = useQuery(api.certificates.getUserCertificates);
  const assignments = useQuery(api.assignments.getSubmissionsByUser);

  const inProgress = enrollments?.filter((e: any) => !e.isCompleted) ?? [];
  const completed = enrollments?.filter((e: any) => e.isCompleted) ?? [];
  const pendingAssignments = assignments?.filter((s: any) => s.status === "submitted") ?? [];

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
        <p className="text-muted-foreground mt-1">Continue your learning journey where you left off.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label="Enrolled" value={enrollments?.length ?? 0} color="bg-primary/10" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Completed" value={completed.length} color="bg-emerald-50" />
        <StatCard icon={<Award className="h-5 w-5 text-amber-600" />} label="Certificates" value={certificates?.length ?? 0} color="bg-amber-50" />
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Submissions" value={assignments?.length ?? 0} color="bg-blue-50" />
      </div>

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
                    <p className="text-xs text-muted-foreground mt-1">ID: {cert.certificateId}</p>
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

// ─── INSTRUCTOR DASHBOARD ─────────────────────────────────────
function InstructorDashboard() {
  const { profile, selectedOrg, memberships } = useApp();
  const courses = useQuery(
    api.courses.getCourses,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const myApplications = useQuery(api.users.getMyApplications);

  const myCourses = courses?.filter((c: any) => c.instructorId === profile?._id) ?? [];
  const publishedCourses = myCourses.filter((c: any) => c.isPublished);
  const totalEnrollments = myCourses.reduce((acc: number, c: any) => acc + (c.enrollmentCount ?? 0), 0);

  const approvedOrgs = memberships?.filter((m: any) => m.status === "approved" && m.role === "instructor") ?? [];
  const pendingApps = memberships?.filter((m: any) => m.status === "pending") ?? [];
  const approvedApps = memberships?.filter((m: any) => m.status === "approved" && m.role === "instructor") ?? [];

  // If instructor has no approved org memberships, show candidate view
  if (approvedOrgs.length === 0 && myCourses.length === 0) {
    return <InstructorCandidateDashboard />;
  }

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

      {/* My Applications */}
      {approvedApps.length > 0 && (
        <div className="clay-card p-5">
          <h3 className="font-bold mb-3">Your Org Memberships</h3>
          <div className="space-y-2">
            {approvedApps.map((app: any) => (
              <div key={app._id} className="flex items-center justify-between clay-inset px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{app.org?.name ?? "Unknown"}</span>
                </div>
                <Badge className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                  <CheckCircle className="h-3 w-3 mr-1" /> Approved
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApps.length > 0 && (
        <div className="clay-card p-5">
          <h3 className="font-bold mb-3">Pending Applications</h3>
          <div className="space-y-2">
            {pendingApps.map((app: any) => (
              <div key={app._id} className="flex items-center justify-between clay-inset px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{app.org?.name ?? "Unknown"}</span>
                </div>
                <Badge className="clay-badge text-xs bg-amber-50 text-amber-700">
                  <Clock className="h-3 w-3 mr-1" /> Pending
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

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

// ─── INSTRUCTOR CANDIDATE DASHBOARD ───────────────────────────
function InstructorCandidateDashboard() {
  const { profile } = useApp();
  const approvedOrgs = useQuery(api.organizations.getApprovedOrganizations);
  const myApplications = useQuery(api.users.getMyApplications);
  const applyToOrg = useMutation(api.users.applyToOrganization);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationMsg, setApplicationMsg] = useState("");

  const pendingApps = myApplications?.filter((m: any) => m.status === "pending") ?? [];
  const approvedApps = myApplications?.filter((m: any) => m.status === "approved") ?? [];
  const rejectedApps = myApplications?.filter((m: any) => m.status === "rejected") ?? [];

  const appliedOrgIds = new Set(myApplications?.map((m: any) => m.orgId) ?? []);

  const handleApply = async (orgId: string) => {
    try {
      await applyToOrg({ orgId: orgId as any, message: applicationMsg || undefined });
      toast.success("Application submitted! Waiting for org admin approval.");
      setApplyingTo(null);
      setApplicationMsg("");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-bold">Instructor Candidate 🎓</h2>
        <p className="text-muted-foreground mt-1">
          Browse approved organizations and apply to join as an instructor.
        </p>
      </div>

      {/* My Applications */}
      {myApplications && myApplications.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">My Applications</h3>
          <div className="space-y-3">
            {myApplications.map((app: any) => (
              <div key={app._id} className="clay-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{app.org?.name ?? "Unknown"}</p>
                    {app.applicationMessage && (
                      <p className="text-xs text-muted-foreground mt-1">{app.applicationMessage}</p>
                    )}
                  </div>
                </div>
                {app.status === "pending" && (
                  <Badge className="clay-badge text-xs bg-amber-50 text-amber-700">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                )}
                {app.status === "approved" && (
                  <Badge className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Approved
                  </Badge>
                )}
                {app.status === "rejected" && (
                  <Badge className="clay-badge text-xs bg-red-50 text-red-700">
                    <XCircle className="h-3 w-3 mr-1" /> Rejected
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Organizations */}
      <div>
        <h3 className="text-lg font-bold mb-3">Available Organizations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {approvedOrgs?.map((org: any) => {
            const isApplied = appliedOrgIds.has(org._id);
            return (
              <div key={org._id} className="clay-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{org.name}</h4>
                  {isApplied ? (
                    <Badge className="clay-badge text-xs bg-blue-50 text-blue-700">
                      <Send className="h-3 w-3 mr-1" /> Applied
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{org.description}</p>
                {org.website && (
                  <p className="text-xs text-muted-foreground mb-3">{org.website}</p>
                )}
                {!isApplied && (
                  applyingTo === org._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={applicationMsg}
                        onChange={(e) => setApplicationMsg(e.target.value)}
                        placeholder="Why do you want to join? (optional)"
                        className="clay-input w-full px-3 py-2 text-sm min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button className="clay-btn text-white text-sm flex-1" onClick={() => handleApply(org._id)}>
                          Submit Application
                        </Button>
                        <Button variant="ghost" className="text-sm" onClick={() => { setApplyingTo(null); setApplicationMsg(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="clay-btn text-white text-sm" onClick={() => setApplyingTo(org._id)}>
                      <Send className="mr-1 h-3 w-3" /> Apply
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>
        {(!approvedOrgs || approvedOrgs.length === 0) && (
          <div className="clay-card p-10 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations available yet</h3>
            <p className="text-muted-foreground">Check back later for approved organizations to apply to.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORG ADMIN DASHBOARD ──────────────────────────────────────
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
  const pendingApps = useQuery(
    api.users.getPendingApplications,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const approveInstructor = useMutation(api.users.approveInstructor);
  const removeMember = useMutation(api.users.removeMember);

  const handleApprove = async (memberId: string, approved: boolean) => {
    try {
      await approveInstructor({ memberId: memberId as any, approved });
      toast.success(approved ? "Instructor approved!" : "Application rejected.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember({ memberId: memberId as any });
      toast.success("Member removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

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

      {/* Pending Instructor Applications */}
      {pendingApps && pendingApps.length > 0 && (
        <div className="clay-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-500" /> Pending Instructor Applications ({pendingApps.length})
          </h3>
          <div className="space-y-3">
            {pendingApps.map((app: any) => (
              <div key={app._id} className="clay-inset p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 clay-sm">
                      <span className="text-sm font-bold text-primary">
                        {app.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{app.user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{app.user?.email}</p>
                      {app.applicationMessage && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{app.applicationMessage}"</p>
                      )}
                      {app.user?.qualifications && (
                        <p className="text-xs text-muted-foreground mt-1">📚 {app.user.qualifications}</p>
                      )}
                      {app.user?.institution && (
                        <p className="text-xs text-muted-foreground">🏫 {app.user.institution}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="clay-btn text-white text-xs" onClick={() => handleApprove(app._id, true)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => handleApprove(app._id, false)}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <Link to="/dashboard/members"><UserPlus className="mr-2 h-4 w-4" /> Manage Members</Link>
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

// ─── SUPER ADMIN DASHBOARD ────────────────────────────────────
function SuperAdminDashboard() {
  const allOrgs = useQuery(api.organizations.getAllOrganizations);
  const allUsers = useQuery(api.users.getAllUsers);
  const approveOrg = useMutation(api.organizations.approveOrganization);
  const deleteOrg = useMutation(api.organizations.deleteOrganization);

  const totalUsers = allUsers?.length ?? 0;
  const totalOrgs = allOrgs?.length ?? 0;
  const pendingOrgs = allOrgs?.filter((o: any) => o.status === "pending") ?? [];
  const approvedOrgs = allOrgs?.filter((o: any) => o.status === "approved") ?? [];
  const instructors = allUsers?.filter((u: any) => u.role === "instructor").length ?? 0;
  const learners = allUsers?.filter((u: any) => u.role === "learner").length ?? 0;

  const handleApproveOrg = async (orgId: string, approved: boolean) => {
    try {
      await approveOrg({ orgId: orgId as any, approved });
      toast.success(approved ? "Organization approved!" : "Organization rejected.");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

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

      {/* Pending Organization Approvals */}
      {pendingOrgs.length > 0 && (
        <div className="clay-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" /> Pending Organization Approvals ({pendingOrgs.length})
          </h3>
          <div className="space-y-3">
            {pendingOrgs.map((org: any) => (
              <div key={org._id} className="clay-inset p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{org.name}</h4>
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                    {org.website && <p className="text-xs text-muted-foreground mt-1">{org.website}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="clay-btn text-white text-xs" onClick={() => handleApproveOrg(org._id, true)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => handleApproveOrg(org._id, false)}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Organizations */}
      <div>
        <h3 className="text-lg font-bold mb-3">All Organizations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {allOrgs?.map((org: any) => (
            <div key={org._id} className="clay-card p-5">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{org.name}</h4>
                <Badge variant={org.status === "approved" ? "default" : org.status === "pending" ? "secondary" : "destructive"} className="clay-badge text-xs capitalize">
                  {org.status}
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

// ─── PROFILE SETUP ────────────────────────────────────────────
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
                { value: "learner", label: "Learner", icon: <GraduationCap className="h-5 w-5" />, desc: "Browse & enroll in courses" },
                { value: "instructor", label: "Instructor", icon: <BookOpen className="h-5 w-5" />, desc: "Create & teach courses" },
                { value: "org_admin", label: "Org Admin", icon: <Building2 className="h-5 w-5" />, desc: "Manage organization" },
                { value: "super_admin", label: "Super Admin", icon: <Zap className="h-5 w-5" />, desc: "Platform administrator" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`clay-card p-4 text-left transition-all ${
                    role === opt.value ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
                  }`}
                >
                  <div className={`mb-2 ${role === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                    {opt.icon}
                  </div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {role === "learner" && (
            <div className="clay-inset p-3 rounded-xl">
              <p className="text-xs text-muted-foreground">
                💡 As a learner, you can browse published courses, enroll, take quizzes, and earn certificates.
              </p>
            </div>
          )}
          {role === "instructor" && (
            <div className="clay-inset p-3 rounded-xl">
              <p className="text-xs text-muted-foreground">
                📝 As an instructor, you'll need to apply to an organization. Your application will be reviewed by the org admin.
              </p>
            </div>
          )}
          {role === "org_admin" && (
            <div className="clay-inset p-3 rounded-xl">
              <p className="text-xs text-muted-foreground">
                🏢 As an org admin, you can create an organization (pending super admin approval), manage members, and oversee courses.
              </p>
            </div>
          )}

          <Button type="submit" className="clay-btn text-white w-full" disabled={saving}>
            {saving ? "Setting up..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────
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
