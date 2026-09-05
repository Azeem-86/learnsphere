import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, Link, useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Users,
  Play,
  FileText,
  Video,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  ArrowLeft,
  ClipboardCheck,
  Award,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const lessonTypeIcons: Record<string, any> = {
  text: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  quiz: <ClipboardCheck className="h-4 w-4" />,
  assignment: <BookOpen className="h-4 w-4" />,
  file: <FileText className="h-4 w-4" />,
};

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile } = useApp();
  const navigate = useNavigate();
  const course = useQuery(
    api.courses.getCourse,
    courseId ? { courseId: courseId as any } : "skip"
  );
  const enrollment = useQuery(
    api.enrollments.getEnrollmentByCourseAndUser,
    courseId ? { courseId: courseId as any } : "skip"
  );
  const lessonProgress = useQuery(
    api.enrollments.getLessonProgress,
    enrollment ? { enrollmentId: enrollment._id } : "skip"
  );
  const enroll = useMutation(api.enrollments.enroll);

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const isLearner = profile?.role === "learner";
  const isInstructor = profile?.role === "instructor" || profile?.role === "org_admin";

  const completedLessonIds = new Set(
    lessonProgress?.filter((p: any) => p.isCompleted).map((p: any) => p.lessonId) ?? []
  );

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0) ?? 0;
  const completedCount = completedLessonIds.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!courseId) return;
    try {
      await enroll({ courseId: courseId as any });
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll");
    }
  };

  if (!course) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="clay-card p-8 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto animate-pulse mb-3" />
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="clay-sm rounded-xl w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {/* Course Header */}
        <div className="clay-card p-6">
          <div className="flex items-start justify-between mb-3">
            <Badge variant={course.isPublished ? "default" : "secondary"} className="clay-badge text-xs">
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
            {isInstructor && (
              <Button asChild variant="ghost" size="sm" className="clay-sm rounded-xl">
                <Link to={`/dashboard/course-builder?course=${courseId}`}>Edit Course</Link>
              </Button>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground mb-4">{course.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {course.instructor && (
              <span>Instructor: <strong className="text-foreground">{course.instructor.name}</strong></span>
            )}
            <span>{totalLessons} lessons</span>
            <span>{course.enrollmentCount} enrolled</span>
          </div>
        </div>

        {/* Progress / Enrollment */}
        {isLearner && (
          <div className="clay-card p-5">
            {enrollment ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">Your Progress</h3>
                  <span className="text-sm font-medium text-primary">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="clay-progress h-3 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {totalLessons} lessons completed
                </p>
                {enrollment.isCompleted && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-600">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-medium">Course completed! Certificate earned.</span>
                    <Button asChild variant="ghost" size="sm" className="ml-auto">
                      <Link to="/dashboard/certificates">View Certificate</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">Not enrolled yet</p>
                <Button className="clay-btn text-white" onClick={handleEnroll}>
                  Enroll in This Course
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modules */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Course Content</h3>
          {course.modules?.map((mod: any, idx: number) => {
            const isExpanded = expandedModules.has(mod._id) || idx === 0;
            return (
              <div key={mod._id} className="clay-card overflow-hidden">
                <button
                  onClick={() => toggleModule(mod._id)}
                  className="flex items-center justify-between w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground">M{idx + 1}</span>
                    <div>
                      <h4 className="font-semibold">{mod.title}</h4>
                      {mod.description && (
                        <p className="text-xs text-muted-foreground">{mod.description}</p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border/50 px-4 pb-3">
                    {mod.lessons?.map((lesson: any, lIdx: number) => {
                      const isComplete = completedLessonIds.has(lesson._id);
                      const isClickable = enrollment || !isLearner;
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => isClickable && navigate(`/dashboard/lesson/${lesson._id}`)}
                          disabled={!isClickable}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all ${
                            isClickable ? "hover:bg-white/50 cursor-pointer" : "opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <span className="flex-shrink-0">
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </span>
                          <span className="flex-shrink-0 text-muted-foreground">
                            {lessonTypeIcons[lesson.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{lesson.type}</p>
                          </div>
                          {isComplete && (
                            <Badge variant="secondary" className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                              Done
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
