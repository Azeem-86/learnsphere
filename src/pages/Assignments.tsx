import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, CheckCircle2, Clock, Send, Star, MessageSquare } from "lucide-react";

export default function Assignments() {
  const { profile, selectedOrg } = useApp();
  const isLearner = profile?.role === "learner";

  const submissions = useQuery(api.assignments.getSubmissionsByUser);
  const courses = useQuery(
    api.courses.getCourses,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Get all assignments for the selected course
  const courseAssignments = useQuery(
    api.assignments.getAssignmentsByCourse,
    selectedCourseId ? { courseId: selectedCourseId as any } : "skip"
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">
            {isLearner ? "View and submit your assignments" : "Review student submissions"}
          </p>
        </div>

        {isLearner ? (
          <LearnerAssignments submissions={submissions} />
        ) : (
          <InstructorAssignments courses={courses} selectedCourseId={selectedCourseId} setSelectedCourseId={setSelectedCourseId} assignments={courseAssignments} />
        )}
      </div>
    </AppLayout>
  );
}

function LearnerAssignments({ submissions }: { submissions: any[] | undefined }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="clay-card p-10 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
        <p className="text-muted-foreground">Assignments from your enrolled courses will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((s: any) => (
        <div key={s._id} className="clay-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{s.assignment?.title ?? "Assignment"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{s.assignment?.description}</p>
            </div>
            <Badge
              variant={s.status === "graded" ? "default" : "secondary"}
              className={`clay-badge text-xs ${
                s.status === "graded" ? "bg-emerald-50 text-emerald-700" : s.status === "submitted" ? "bg-amber-50 text-amber-700" : ""
              }`}
            >
              {s.status === "graded" && <Star className="h-3 w-3 mr-1" />}
              {s.status === "submitted" && <Clock className="h-3 w-3 mr-1" />}
              {s.status}
            </Badge>
          </div>

          {s.content && (
            <div className="clay-inset p-3 mt-3 rounded-xl">
              <p className="text-xs font-medium text-muted-foreground mb-1">Your submission:</p>
              <p className="text-sm">{s.content.slice(0, 200)}{s.content.length > 200 ? "..." : ""}</p>
            </div>
          )}

          {s.status === "graded" && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">Score: <span className="text-primary">{s.score}%</span></span>
              </div>
              {s.feedback && (
                <div className="mt-2 clay-inset p-3 rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Instructor Feedback:
                  </p>
                  <p className="text-sm">{s.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InstructorAssignments({
  courses,
  selectedCourseId,
  setSelectedCourseId,
  assignments,
}: {
  courses: any[] | undefined;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  assignments: any[] | undefined;
}) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Course selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Select Course</h3>
        {courses?.map((c: any) => (
          <button
            key={c._id}
            onClick={() => setSelectedCourseId(c._id)}
            className={`w-full text-left clay-card p-3 transition-all ${selectedCourseId === c._id ? "ring-2 ring-primary" : ""}`}
          >
            <h4 className="font-semibold text-sm">{c.title}</h4>
          </button>
        ))}
      </div>

      {/* Assignments list */}
      <div className="lg:col-span-2 space-y-3">
        {assignments && assignments.length > 0 ? (
          assignments.map((a: any) => (
            <button
              key={a._id}
              onClick={() => setSelectedAssignmentId(a._id)}
              className={`w-full text-left clay-card p-4 transition-all ${selectedAssignmentId === a._id ? "ring-2 ring-primary" : ""}`}
            >
              <h4 className="font-semibold">{a.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{a.description?.slice(0, 100)}...</p>
            </button>
          ))
        ) : (
          <div className="clay-card p-8 text-center text-muted-foreground">
            {selectedCourseId ? "No assignments in this course" : "Select a course to view assignments"}
          </div>
        )}

        {selectedAssignmentId && (
          <GradeSubmissions assignmentId={selectedAssignmentId} />
        )}
      </div>
    </div>
  );
}

function GradeSubmissions({ assignmentId }: { assignmentId: string }) {
  const submissions = useQuery(api.assignments.getSubmissionsByAssignment, { assignmentId: assignmentId as any });
  const gradeSubmission = useMutation(api.assignments.gradeSubmission);

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [score, setScore] = useState(80);
  const [feedback, setFeedback] = useState("");

  const handleGrade = async () => {
    if (!gradingId) return;
    try {
      await gradeSubmission({
        submissionId: gradingId as any,
        score,
        feedback: feedback || undefined,
      });
      setGradingId(null);
      setScore(80);
      setFeedback("");
    } catch (err: any) {
      toast.error(err.message || "Failed to grade submission");
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Submissions ({submissions?.length ?? 0})</h3>
      {submissions?.map((s: any) => (
        <div key={s._id} className="clay-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">{s.user?.name ?? "Student"}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</p>
            </div>
            <Badge variant={s.status === "graded" ? "default" : "secondary"} className="clay-badge text-xs">
              {s.status}
            </Badge>
          </div>
          {s.content && (
            <div className="clay-inset p-3 rounded-xl mb-2">
              <p className="text-sm">{s.content.slice(0, 300)}</p>
            </div>
          )}
          {s.status === "graded" ? (
            <div className="text-sm">
              <span className="font-medium">Score: <span className="text-primary">{s.score}%</span></span>
              {s.feedback && <p className="text-xs text-muted-foreground mt-1">{s.feedback}</p>}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="clay-sm rounded-xl text-xs mt-2"
              onClick={() => setGradingId(s._id)}
            >
              Grade
            </Button>
          )}
        </div>
      ))}

      {/* Grading Dialog */}
      <Dialog open={!!gradingId} onOpenChange={() => setGradingId(null)}>
        <DialogContent className="clay-card border-0">
          <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Score (%)</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="clay-input w-full px-4 py-2.5 text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="clay-input w-full px-4 py-2.5 text-sm min-h-[100px]"
                placeholder="Provide feedback..."
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setGradingId(null)}>Cancel</Button>
              <Button className="clay-btn text-white" onClick={handleGrade}>Save Grade</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
