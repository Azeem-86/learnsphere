import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  Plus,
  ArrowRight,
  GraduationCap,
  Search,
  Building2,
  Clock,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Courses() {
  const { profile, selectedOrg } = useApp();
  const isLearner = profile?.role === "learner";
  const isInstructor = profile?.role === "instructor";
  const isOrgAdmin = profile?.role === "org_admin";

  // Learners see all published courses; instructors/admins see their org's courses
  const allPublishedCourses = useQuery(
    api.courses.getPublishedCoursesForLearners,
    isLearner ? {} : "skip"
  );
  const orgCourses = useQuery(
    api.courses.getCourses,
    selectedOrg && !isLearner ? { orgId: selectedOrg._id } : "skip"
  );
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);
  const enroll = useMutation(api.enrollments.enroll);

  const [searchQuery, setSearchQuery] = useState("");

  const courses = isLearner ? (allPublishedCourses ?? []) : (orgCourses ?? []);

  const filtered = courses.filter((c: any) => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!isLearner && !c.isPublished) return false;
    return true;
  });

  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.courseId) ?? []);

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll({ courseId: courseId as any });
      toast.success("Enrolled successfully! You now have access to course content.");
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll");
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              {isLearner ? "Browse Courses" : "Courses"}
            </h2>
            <p className="text-muted-foreground">
              {isLearner
                ? "Explore and enroll in courses from approved organizations"
                : "Manage your organization's courses"}
            </p>
          </div>
          {!isLearner && (
            <Button asChild className="clay-btn text-white">
              <Link to="/dashboard/course-builder">
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="clay-inset flex items-center px-3 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Course Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course: any) => {
              const isEnrolled = enrolledCourseIds.has(course._id);
              const enrollment = enrollments?.find((e: any) => e.courseId === course._id);

              return (
                <div key={course._id} className="clay-card p-5 flex flex-col">
                  {/* Status + Progress */}
                  <div className="flex items-center justify-between mb-3">
                    {!isLearner && (
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className="clay-badge text-xs"
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    )}
                    {isLearner && isEnrolled && (
                      <span className="text-xs font-medium text-primary">{enrollment?.progress?.percentage ?? 0}%</span>
                    )}
                    {isLearner && !isEnrolled && (
                      <Badge className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                        Open
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold mb-1">{course.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {course.description}
                  </p>

                  {/* Instructor */}
                  {course.instructor && (
                    <p className="text-xs text-muted-foreground mb-2">
                      👨‍🏫 {course.instructorName ?? course.instructor?.name ?? "Instructor"}
                    </p>
                  )}

                  {/* Organization (for learner view) */}
                  {isLearner && course.orgName && (
                    <p className="text-xs text-muted-foreground mb-2">
                      <Building2 className="h-3 w-3 inline mr-1" />
                      {course.orgName}
                    </p>
                  )}

                  {/* Modules preview */}
                  {course.moduleTitles && course.moduleTitles.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        📦 {course.moduleCount} modules
                      </p>
                      <div className="space-y-0.5">
                        {course.moduleTitles.slice(0, 3).map((title: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" /> {title}
                          </p>
                        ))}
                        {course.moduleTitles.length > 3 && (
                          <p className="text-xs text-muted-foreground/50">
                            +{course.moduleTitles.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isLearner && course.moduleCount !== undefined && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📦 {course.moduleCount} modules
                    </p>
                  )}

                  {/* Duration (for learner view) */}
                  {isLearner && (
                    <p className="text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDuration(course.durationMinutes)}
                    </p>
                  )}

                  {/* Progress bar for enrolled */}
                  {isLearner && isEnrolled && enrollment && (
                    <Progress value={enrollment.progress?.percentage ?? 0} className="clay-progress h-2 mb-3" />
                  )}

                  {/* Enrolled count */}
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Users className="h-3 w-3 mr-1" />
                    {course.enrollmentCount ?? 0} enrolled
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" className="clay-sm rounded-xl flex-1 text-sm">
                      <Link to={`/dashboard/course/${course._id}`}>
                        {isLearner && !isEnrolled ? (
                          <><Lock className="mr-1 h-3 w-3" /> View Details</>
                        ) : (
                          <><ArrowRight className="mr-1 h-3 w-3" /> {isEnrolled ? "Continue" : "View"}</>
                        )}
                      </Link>
                    </Button>
                    {isLearner && !isEnrolled && (
                      <Button
                        className="clay-btn text-white text-sm flex-1"
                        onClick={() => handleEnroll(course._id)}
                      >
                        <GraduationCap className="mr-1 h-3 w-3" /> Enroll
                      </Button>
                    )}
                    {isLearner && isEnrolled && (
                      <Button asChild className="clay-btn text-white text-sm flex-1">
                        <Link to={`/dashboard/course/${course._id}`}>
                          Continue
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="clay-card p-10 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : isLearner ? "No published courses available yet" : "No courses available yet"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
