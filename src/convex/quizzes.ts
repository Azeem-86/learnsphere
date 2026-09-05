import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, requireCourseAccess, getProfile } from "./helpers";

// ─── CREATE QUIZ ──────────────────────────────────────────────
// Instructor or org_admin only
export const createQuiz = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    passingScore: v.number(),
    timeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCourseAccess(ctx, args.courseId);

    return await ctx.db.insert("quizzes", {
      lessonId: args.lessonId,
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      passingScore: args.passingScore,
      timeLimit: args.timeLimit,
      createdAt: Date.now(),
    });
  },
});

// ─── ADD QUESTION ─────────────────────────────────────────────
// Instructor or org_admin only
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    text: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");
    await requireCourseAccess(ctx, quiz.courseId);

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return await ctx.db.insert("questions", {
      quizId: args.quizId,
      text: args.text,
      type: "multiple_choice",
      options: args.options,
      correctAnswer: args.correctAnswer,
      order: existing.length,
    });
  },
});

// ─── SUBMIT QUIZ ──────────────────────────────────────────────
// Only enrolled learners can submit; must own the enrollment
export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    enrollmentId: v.id("enrollments"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedAnswer: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    // Ownership check: only the learner can submit their own quiz
    if (enrollment.userId !== profile._id) {
      throw new Error("You can only take quizzes for your own enrollment");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Score the quiz
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    let correct = 0;
    for (const answer of args.answers) {
      const question = questions.find((q) => q._id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correct++;
      }
    }

    const score =
      questions.length > 0
        ? Math.round((correct / questions.length) * 100)
        : 0;
    const passed = score >= quiz.passingScore;

    const attemptId = await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId: profile._id,
      enrollmentId: args.enrollmentId,
      answers: args.answers,
      score,
      passed,
      startedAt: Date.now(),
      completedAt: Date.now(),
    });

    // Notify learner
    await ctx.db.insert("notifications", {
      userId: profile._id,
      title: passed ? "Quiz Passed!" : "Quiz Result",
      message: `You scored ${score}% on "${quiz.title}"${passed ? " — Congrats!" : ". Keep trying!"}`,
      type: "quiz",
      isRead: false,
      createdAt: Date.now(),
    });

    // If passed, mark lesson complete
    if (passed) {
      const lesson = await ctx.db.get(quiz.lessonId);
      if (lesson) {
        const existing = await ctx.db
          .query("lessonProgress")
          .withIndex("by_enrollmentAndLesson", (q) =>
            q
              .eq("enrollmentId", args.enrollmentId)
              .eq("lessonId", lesson._id)
          )
          .unique();

        if (existing) {
          await ctx.db.patch(existing._id, {
            isCompleted: true,
            completedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("lessonProgress", {
            enrollmentId: args.enrollmentId,
            lessonId: lesson._id,
            userId: profile._id,
            isCompleted: true,
            completedAt: Date.now(),
          });
        }
      }
    }

    return {
      attemptId,
      score,
      passed,
      totalQuestions: questions.length,
      correctAnswers: correct,
    };
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

export const getQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return {
      ...quiz,
      questions: questions.sort((a, b) => a.order - b.order),
    };
  },
});

export const getQuizByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    if (quizzes.length === 0) return null;

    const quiz = quizzes[0];
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", quiz._id))
      .collect();

    return {
      ...quiz,
      questions: questions.sort((a, b) => a.order - b.order),
    };
  },
});

export const getQuizAttempts = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizAttempts")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();
  },
});

export const getUserQuizAttempts = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return attempts.filter((a) => a.userId === profile._id);
  },
});

export const getQuizzesByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});
