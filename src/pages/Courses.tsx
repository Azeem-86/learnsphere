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
  Filter,
  Search,
} from "lucide-react";
import { useState } from "react";

export default function Courses() {
  const { profile, selectedOrg } = useApp();
  const courses = useQuery(
    api.courses.getCourses,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);
  const enroll = useMutation(api.enrollments.enroll);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const role = profile?.role;
  const isLearner = role === "learner";

  const filtered = (courses ?? [])
    .filter((c: any) => {
      if (filter === "published" && !c.isPublished) return false;
      if (filter === "draft" && c.isPublished) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.courseId) ?? []);

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll({ courseId: courseId as any });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Courses</h2>
            <p className="text-muted-foreground">
              {isLearner ? "Browse and enroll in available courses" : "Manage your organization's courses"}
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

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
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
          <div className="flex gap-1 clay-inset p-1">
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl capitalize transition-all ${
                  filter === f ? "clay-tab-active text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
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
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant={course.isPublished ? "default" : "secondary"}
                      className="clay-badge text-xs"
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                    {isEnrolled && enrollment && (
                      <span className="text-xs font-medium text-primary">{enrollment.progress?.percentage ?? 0}%</span>
                    )}
                  </div>

                  <h3 className="font-bold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {course.description}
                  </p>

                  {isEnrolled && enrollment && (
                    <Progress value={enrollment.progress?.percentage ?? 0} className="clay-progress h-2 mb-3" />
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {course.moduleCount ?? 0} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {course.enrollmentCount ?? 0} enrolled
                    </span>
                  </div>

                  {course.instructor && (
                    <p className="text-xs text-muted-foreground mb-3">
                      By {course.instructor.name}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button asChild variant="ghost" className="clay-sm rounded-xl flex-1 text-sm">
                      <Link to={`/dashboard/course/${course._id}`}>
                        View <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    {isLearner && !isEnrolled && course.isPublished && (
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
              {searchQuery ? "Try adjusting your search" : "No courses available yet"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
