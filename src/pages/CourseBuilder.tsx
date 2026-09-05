import { useApp } from "@/lib/app-context";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Video,
  ClipboardCheck,
  Award,
} from "lucide-react";

export default function CourseBuilder() {
  const { profile, selectedOrg } = useApp();
  const courses = useQuery(
    api.courses.getCourses,
    selectedOrg ? { orgId: selectedOrg._id } : "skip"
  );
  const createCourse = useMutation(api.courses.createCourse);
  const updateCourse = useMutation(api.courses.updateCourse);
  const publishCourse = useMutation(api.courses.publishCourse);
  const createModule = useMutation(api.courses.createModule);
  const createLesson = useMutation(api.courses.createLesson);
  const createQuiz = useMutation(api.quizzes.createQuiz);
  const addQuestion = useMutation(api.quizzes.addQuestion);
  const createAssignment = useMutation(api.assignments.createAssignment);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showNewModule, setShowNewModule] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);

  // Form states
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("text");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassing, setQuizPassing] = useState(70);
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [assignmentMaxScore, setAssignmentMaxScore] = useState(100);
  const [saving, setSaving] = useState(false);

  const course = courses?.find((c: any) => c._id === selectedCourseId);
  const fullCourse = useQuery(
    api.courses.getCourse,
    selectedCourseId ? { courseId: selectedCourseId as any } : "skip"
  );

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !profile) return;
    setSaving(true);
    try {
      const id = await createCourse({
        orgId: selectedOrg._id,
        title: courseName,
        description: courseDesc || undefined,
        instructorId: profile._id,
        passingGrade: 70,
      });
      setSelectedCourseId(id);
      setShowNewCourse(false);
      setCourseName("");
      setCourseDesc("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSaving(true);
    try {
      const id = await createModule({ courseId: selectedCourseId as any, title: moduleName });
      setSelectedModuleId(id);
      setShowNewModule(false);
      setModuleName("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedModuleId) return;
    setSaving(true);
    try {
      await createLesson({
        moduleId: selectedModuleId as any,
        courseId: selectedCourseId as any,
        title: lessonTitle,
        type: lessonType as any,
        content: lessonContent || undefined,
        videoUrl: lessonVideoUrl || undefined,
      });
      setShowNewLesson(false);
      setLessonTitle("");
      setLessonContent("");
      setLessonVideoUrl("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedModuleId) return;
    setSaving(true);
    try {
      // Create a quiz lesson first
      const lessonId = await createLesson({
        moduleId: selectedModuleId as any,
        courseId: selectedCourseId as any,
        title: quizTitle,
        type: "quiz",
        passingScore: quizPassing,
      });

      // Create the quiz
      const quizId = await createQuiz({
        lessonId: lessonId as any,
        courseId: selectedCourseId as any,
        title: quizTitle,
        description: `Quiz: ${quizTitle}`,
        passingScore: quizPassing,
      });

      // Add questions
      for (const q of questions) {
        if (q.text && q.options.every((o) => o)) {
          await addQuestion({
            quizId: quizId as any,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
          });
        }
      }

      setShowNewQuiz(false);
      setQuizTitle("");
      setQuestions([{ text: "", options: ["", "", "", ""], correctAnswer: 0 }]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedModuleId) return;
    setSaving(true);
    try {
      const lessonId = await createLesson({
        moduleId: selectedModuleId as any,
        courseId: selectedCourseId as any,
        title: assignmentTitle,
        type: "assignment",
      });

      await createAssignment({
        lessonId: lessonId as any,
        courseId: selectedCourseId as any,
        title: assignmentTitle,
        description: assignmentDesc || undefined,
        maxScore: assignmentMaxScore,
      });

      setShowNewAssignment(false);
      setAssignmentTitle("");
      setAssignmentDesc("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (courseId: string, current: boolean) => {
    try {
      await publishCourse({ courseId: courseId as any, isPublished: !current });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addQuestionRow = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Course Builder</h2>
            <p className="text-muted-foreground">Create and manage course content</p>
          </div>
          <Button className="clay-btn text-white" onClick={() => setShowNewCourse(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Course List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Courses</h3>
            {courses?.map((c: any) => (
              <button
                key={c._id}
                onClick={() => setSelectedCourseId(c._id)}
                className={`w-full text-left clay-card p-4 transition-all ${
                  selectedCourseId === c._id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">{c.title}</h4>
                  <Badge variant={c.isPublished ? "default" : "secondary"} className="clay-badge text-[10px]">
                    {c.isPublished ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.moduleCount ?? 0} modules</p>
              </button>
            ))}
          </div>

          {/* Course Details / Builder */}
          {fullCourse ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="clay-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{fullCourse.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="clay-sm rounded-xl"
                      onClick={() => handleTogglePublish(fullCourse._id, fullCourse.isPublished)}
                    >
                      {fullCourse.isPublished ? <><EyeOff className="mr-1 h-3 w-3" /> Unpublish</> : <><Eye className="mr-1 h-3 w-3" /> Publish</>}
                    </Button>
                  </div>
                </div>
                {fullCourse.description && (
                  <p className="text-sm text-muted-foreground mb-3">{fullCourse.description}</p>
                )}
                <Button
                  className="clay-btn text-white text-sm"
                  onClick={() => setShowNewModule(true)}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Module
                </Button>
              </div>

              {/* Modules */}
              {fullCourse.modules?.map((mod: any, idx: number) => (
                <div key={mod._id} className="clay-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Module {idx + 1}: {mod.title}</h4>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-1 ml-4 mb-3">
                    {mod.lessons?.map((lesson: any) => (
                      <div key={lesson._id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                        {lesson.type === "text" && <FileText className="h-3.5 w-3.5" />}
                        {lesson.type === "video" && <Video className="h-3.5 w-3.5" />}
                        {lesson.type === "quiz" && <ClipboardCheck className="h-3.5 w-3.5" />}
                        {lesson.type === "assignment" && <Award className="h-3.5 w-3.5" />}
                        {lesson.title}
                        <Badge variant="secondary" className="clay-badge text-[10px] ml-auto">{lesson.type}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Add Lesson Buttons */}
                  <div className="flex flex-wrap gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs clay-sm rounded-xl"
                      onClick={() => { setSelectedModuleId(mod._id); setLessonType("text"); setShowNewLesson(true); }}
                    >
                      <FileText className="mr-1 h-3 w-3" /> Text Lesson
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs clay-sm rounded-xl"
                      onClick={() => { setSelectedModuleId(mod._id); setLessonType("video"); setShowNewLesson(true); }}
                    >
                      <Video className="mr-1 h-3 w-3" /> Video Lesson
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs clay-sm rounded-xl"
                      onClick={() => { setSelectedModuleId(mod._id); setShowNewQuiz(true); }}
                    >
                      <ClipboardCheck className="mr-1 h-3 w-3" /> Quiz
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs clay-sm rounded-xl"
                      onClick={() => { setSelectedModuleId(mod._id); setShowNewAssignment(true); }}
                    >
                      <Award className="mr-1 h-3 w-3" /> Assignment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lg:col-span-2 clay-card p-10 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a course to edit</h3>
              <p className="text-muted-foreground">Or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="clay-card border-0">
          <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm min-h-[80px]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewCourse(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Module Dialog */}
      <Dialog open={showNewModule} onOpenChange={setShowNewModule}>
        <DialogContent className="clay-card border-0">
          <DialogHeader><DialogTitle>Add Module</DialogTitle></DialogHeader>
          <form onSubmit={handleAddModule} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Module Title</label>
              <input type="text" value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewModule(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>{saving ? "Adding..." : "Add Module"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Lesson Dialog */}
      <Dialog open={showNewLesson} onOpenChange={setShowNewLesson}>
        <DialogContent className="clay-card border-0 max-w-lg">
          <DialogHeader><DialogTitle>Add {lessonType} Lesson</DialogTitle></DialogHeader>
          <form onSubmit={handleAddLesson} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" required />
            </div>
            {lessonType === "text" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <textarea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm min-h-[150px]" placeholder="Write lesson content..." />
              </div>
            )}
            {lessonType === "video" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Video URL</label>
                <input type="url" value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" placeholder="https://youtube.com/watch?v=..." />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewLesson(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>{saving ? "Adding..." : "Add Lesson"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Quiz Dialog */}
      <Dialog open={showNewQuiz} onOpenChange={setShowNewQuiz}>
        <DialogContent className="clay-card border-0 max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
          <form onSubmit={handleAddQuiz} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Quiz Title</label>
              <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Passing Score (%)</label>
              <input type="number" value={quizPassing} onChange={(e) => setQuizPassing(Number(e.target.value))} className="clay-input w-full px-4 py-2.5 text-sm" min="0" max="100" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Questions</h4>
                <Button type="button" variant="ghost" size="sm" onClick={addQuestionRow} className="text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Question
                </Button>
              </div>
              {questions.map((q, qi) => (
                <div key={qi} className="clay-inset p-3 space-y-2">
                  <input
                    type="text"
                    placeholder={`Question ${qi + 1}`}
                    value={q.text}
                    onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qi].text = e.target.value;
                      setQuestions(newQ);
                    }}
                    className="clay-input w-full px-3 py-2 text-sm"
                  />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => {
                          const newQ = [...questions];
                          newQ[qi].correctAnswer = oi;
                          setQuestions(newQ);
                        }}
                        className="accent-primary"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${oi + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qi].options[oi] = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="clay-input flex-1 px-3 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Select the correct answer (radio button)</p>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewQuiz(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>{saving ? "Creating..." : "Create Quiz"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Assignment Dialog */}
      <Dialog open={showNewAssignment} onOpenChange={setShowNewAssignment}>
        <DialogContent className="clay-card border-0">
          <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
          <form onSubmit={handleAddAssignment} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <input type="text" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea value={assignmentDesc} onChange={(e) => setAssignmentDesc(e.target.value)} className="clay-input w-full px-4 py-2.5 text-sm min-h-[100px]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Score</label>
              <input type="number" value={assignmentMaxScore} onChange={(e) => setAssignmentMaxScore(Number(e.target.value))} className="clay-input w-full px-4 py-2.5 text-sm" min="1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewAssignment(false)}>Cancel</Button>
              <Button type="submit" className="clay-btn text-white" disabled={saving}>{saving ? "Creating..." : "Create Assignment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
