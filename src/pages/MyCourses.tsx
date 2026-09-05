import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { BookOpen, ArrowRight, CheckCircle2, Award, Play } from "lucide-react";

export default function MyCourses() {
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);

  const inProgress = enrollments?.filter((e: any) => !e.isCompleted) ?? [];
  const completed = enrollments?.filter((e: any) => e.isCompleted) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-muted-foreground">Track your enrolled courses and progress</p>
        </div>

        {/* Continue Learning */}
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" /> In Progress
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {inProgress.map((e: any) => (
                <Link key={e._id} to={`/dashboard/course/${e.courseId}`}>
                  <div className="clay-card p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold group-hover:text-primary transition-colors">{e.course?.title}</h4>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                    <Progress value={e.progress?.percentage ?? 0} className="clay-progress h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{e.progress?.completedLessons ?? 0}/{e.progress?.totalLessons ?? 0} lessons</span>
                      <span className="font-medium text-primary">{e.progress?.percentage ?? 0}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Completed
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {completed.map((e: any) => (
                <Link key={e._id} to={`/dashboard/course/${e.courseId}`}>
                  <div className="clay-card p-5 hover:shadow-lg transition-shadow cursor-pointer group border-emerald-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{e.course?.title}</h4>
                      <Badge className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                        <Award className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed {e.completedAt ? new Date(e.completedAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {inProgress.length === 0 && completed.length === 0 && (
          <div className="clay-card p-10 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Browse available courses and enroll to start learning.</p>
            <Button asChild className="clay-btn text-white">
              <Link to="/dashboard/courses">Browse Courses</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
