import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart3, Star, FileText, ClipboardCheck } from "lucide-react";

export default function Grades() {
  const submissions = useQuery(api.assignments.getSubmissionsByUser);
  const enrollments = useQuery(api.enrollments.getEnrollmentsByUser);

  const graded = submissions?.filter((s: any) => s.status === "graded") ?? [];
  const pending = submissions?.filter((s: any) => s.status === "submitted") ?? [];

  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((acc: number, s: any) => acc + (s.score ?? 0), 0) / graded.length)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Grades</h2>
          <p className="text-muted-foreground">View your grades and academic performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 clay-sm">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
            </div>
          </div>
          <div className="clay-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 clay-sm">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{graded.length}</p>
                <p className="text-xs text-muted-foreground">Graded</p>
              </div>
            </div>
          </div>
          <div className="clay-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 clay-sm">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="clay-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 clay-sm">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        {submissions && submissions.length > 0 ? (
          <div className="clay-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold">Assignment</th>
                    <th className="text-left py-3 px-4 font-semibold">Course</th>
                    <th className="text-left py-3 px-4 font-semibold">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s: any) => (
                    <tr key={s._id} className="border-b border-border/30 last:border-0">
                      <td className="py-3 px-4 font-medium">{s.assignment?.title ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.assignment?.courseId ? "Course" : "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(s.submittedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {s.score != null ? (
                          <span className={`font-semibold ${s.score >= 70 ? "text-emerald-600" : "text-red-500"}`}>
                            {s.score}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={s.status === "graded" ? "default" : "secondary"}
                          className={`clay-badge text-xs ${
                            s.status === "graded" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="clay-card p-10 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No grades yet</h3>
            <p className="text-muted-foreground">Complete assignments to see your grades here.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
