import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate, Link } from "react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Video,
  ClipboardCheck,
  Send,
  Trophy,
  AlertCircle,
} from "lucide-react";

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useApp();
  const navigate = useNavigate();

  const lessonData = useQuery(
    api.courses.getLesson,
    lessonId ? { lessonId: lessonId as any } : "skip"
  );
  const enrollment = useQuery(
    api.enrollments.getEnrollmentByCourseAndUser,
    lessonData ? { courseId: lessonData.courseId } : "skip"
  );
  const lessonProgressData = useQuery(
    api.enrollments.getLessonProgress,
    enrollment ? { enrollmentId: enrollment._id } : "skip"
  );
  const completeLesson = useMutation(api.enrollments.completeLesson);
  const checkCourseComplete = useMutation(api.enrollments.checkAndCompleteCourse);
  const submitQuiz = useMutation(api.quizzes.submitQuiz);
  const submitAssignment = useMutation(api.assignments.submitAssignment);
  const userSubmission = useQuery(
    api.assignments.getUserSubmission,
    lessonData?.assignment ? { assignmentId: lessonData.assignment._id } : "skip"
  );

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [assignmentContent, setAssignmentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!lessonData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="clay-card p-8 text-center">
            <FileText className="h-8 w-8 text-primary mx-auto animate-pulse mb-3" />
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = lessonProgressData?.some(
    (p: any) => p.lessonId === lessonId && p.isCompleted
  );

  const handleCompleteLesson = async () => {
    if (!enrollment || !lessonId) return;
    try {
      await completeLesson({ enrollmentId: enrollment._id, lessonId: lessonId as any });
      // Check if course is complete
      await checkCourseComplete({ enrollmentId: enrollment._id });
      navigate(`/dashboard/course/${lessonData.courseId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!enrollment || !lessonData.quiz) return;
    setSubmitting(true);
    try {
      const answers = lessonData.quiz.questions.map((q: any) => ({
        questionId: q._id,
        selectedAnswer: quizAnswers[q._id] ?? -1,
      }));
      const result = await submitQuiz({
        quizId: lessonData.quiz._id,
        enrollmentId: enrollment._id,
        answers,
      });
      setQuizResult(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!enrollment || !lessonData.assignment) return;
    setSubmitting(true);
    try {
      await submitAssignment({
        assignmentId: lessonData.assignment._id,
        enrollmentId: enrollment._id,
        content: assignmentContent,
      });
      navigate(`/dashboard/course/${lessonData.courseId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/course/${lessonData.courseId}`)} className="clay-sm rounded-xl w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Course
        </Button>

        {/* Lesson Header */}
        <div className="clay-card p-6">
          <div className="flex items-center gap-2 mb-2">
            {lessonData.type === "text" && <FileText className="h-5 w-5 text-primary" />}
            {lessonData.type === "video" && <Video className="h-5 w-5 text-primary" />}
            {lessonData.type === "quiz" && <ClipboardCheck className="h-5 w-5 text-primary" />}
            {lessonData.type === "assignment" && <Send className="h-5 w-5 text-primary" />}
            <Badge variant="secondary" className="clay-badge text-xs capitalize">{lessonData.type}</Badge>
            {isCompleted && (
              <Badge className="clay-badge text-xs bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{lessonData.title}</h1>
          {lessonData.module && (
            <p className="text-sm text-muted-foreground mt-1">
              {lessonData.course?.title} → {lessonData.module.title}
            </p>
          )}
        </div>

        {/* Text Lesson */}
        {lessonData.type === "text" && (
          <div className="clay-card p-6">
            <div className="prose prose-sm max-w-none">
              {lessonData.content?.split("\n").map((line: string, i: number) => {
                if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4">{line.slice(2)}</li>;
                if (line.match(/^\d+\./)) return <li key={i} className="text-sm ml-4 list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-bold mt-2">{line.slice(2, -2)}</p>;
                if (line.startsWith("```")) return null;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} className="text-sm leading-relaxed mb-1">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Video Lesson */}
        {lessonData.type === "video" && (
          <div className="clay-card p-6">
            {lessonData.videoUrl ? (
              <div className="aspect-video rounded-2xl overflow-hidden clay-inset">
                <iframe
                  src={lessonData.videoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl flex items-center justify-center clay-inset">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {lessonData.content && (
              <p className="text-sm text-muted-foreground mt-4">{lessonData.content}</p>
            )}
          </div>
        )}

        {/* Quiz */}
        {lessonData.type === "quiz" && lessonData.quiz && (
          <div className="space-y-4">
            {quizResult ? (
              <div className="clay-card p-6 text-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-3xl mx-auto mb-4 clay-sm ${quizResult.passed ? "bg-emerald-50" : "bg-red-50"}`}>
                  {quizResult.passed ? (
                    <Trophy className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1">{quizResult.score}%</h2>
                <p className={`text-lg font-medium ${quizResult.passed ? "text-emerald-600" : "text-red-500"}`}>
                  {quizResult.passed ? "🎉 Quiz Passed!" : "Not Passed"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {quizResult.correctAnswers} of {quizResult.totalQuestions} correct
                </p>
                <Button
                  className="clay-btn text-white mt-4"
                  onClick={() => navigate(`/dashboard/course/${lessonData.courseId}`)}
                >
                  Back to Course
                </Button>
              </div>
            ) : (
              <>
                <div className="clay-card p-5">
                  <h2 className="text-lg font-bold">{lessonData.quiz.title}</h2>
                  <p className="text-sm text-muted-foreground">{lessonData.quiz.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Passing score: {lessonData.quiz.passingScore}%
                  </p>
                </div>

                {lessonData.quiz.questions.map((q: any, idx: number) => (
                  <div key={q._id} className="clay-card p-5">
                    <p className="font-semibold mb-3">
                      <span className="text-primary mr-2">Q{idx + 1}.</span>
                      {q.text}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            quizAnswers[q._id] === oi
                              ? "clay-tab-active text-white"
                              : "clay-inset hover:bg-white/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q._id}
                            checked={quizAnswers[q._id] === oi}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [q._id]: oi })}
                            className="sr-only"
                          />
                          <span className={`text-sm font-medium ${quizAnswers[q._id] === oi ? "text-white" : ""}`}>
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  className="clay-btn text-white w-full"
                  onClick={handleSubmitQuiz}
                  disabled={submitting || Object.keys(quizAnswers).length < (lessonData.quiz.questions?.length ?? 0)}
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Assignment */}
        {lessonData.type === "assignment" && lessonData.assignment && (
          <div className="clay-card p-6">
            <h2 className="text-lg font-bold mb-1">{lessonData.assignment.title}</h2>
            {lessonData.assignment.description && (
              <p className="text-sm text-muted-foreground mb-4">{lessonData.assignment.description}</p>
            )}

            {userSubmission ? (
              <div className={`clay-inset p-4 rounded-2xl ${userSubmission.status === "graded" ? "ring-2 ring-emerald-300" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Your Submission</h4>
                  <Badge variant={userSubmission.status === "graded" ? "default" : "secondary"} className="clay-badge text-xs">
                    {userSubmission.status}
                  </Badge>
                </div>
                {userSubmission.content && (
                  <p className="text-sm text-muted-foreground mb-2">{userSubmission.content}</p>
                )}
                {userSubmission.status === "graded" && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm font-semibold">Score: <span className="text-primary">{userSubmission.score}%</span></p>
                    {userSubmission.feedback && (
                      <p className="text-sm text-muted-foreground mt-1">{userSubmission.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Answer</label>
                  <textarea
                    value={assignmentContent}
                    onChange={(e) => setAssignmentContent(e.target.value)}
                    className="clay-input w-full px-4 py-3 text-sm min-h-[150px]"
                    placeholder="Write your answer here..."
                  />
                </div>
                <Button
                  className="clay-btn text-white"
                  onClick={handleSubmitAssignment}
                  disabled={submitting || !assignmentContent.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Complete Lesson Button (for non-quiz, non-assignment) */}
        {lessonData.type !== "quiz" && lessonData.type !== "assignment" && enrollment && !isCompleted && (
          <Button className="clay-btn text-white w-full" onClick={handleCompleteLesson}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Complete
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
