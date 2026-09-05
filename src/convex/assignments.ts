import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, requireCourseAccess, getProfile } from "./helpers";

// ─── CREATE ASSIGNMENT ────────────────────────────────────────
// Instructor or org_admin only
export const createAssignment = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    maxScore: v.number(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCourseAccess(ctx, args.courseId);

    return await ctx.db.insert("assignments", {
      lessonId: args.lessonId,
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      maxScore: args.maxScore,
      dueDate: args.dueDate,
      createdAt: Date.now(),
    });
  },
});

// ─── SUBMIT ASSIGNMENT ────────────────────────────────────────
// Only the enrolled learner can submit; must own the enrollment
export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    enrollmentId: v.id("enrollments"),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    // Ownership check: only the learner can submit their own work
    if (enrollment.userId !== profile._id) {
      throw new Error("You can only submit your own assignments");
    }

    // Check if already submitted
    const existing = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignmentId", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .collect()
      .then((subs) => subs.find((s) => s.userId === profile._id));

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        fileUrl: args.fileUrl,
        submittedAt: Date.now(),
        status: "submitted",
        score: undefined,
        feedback: undefined,
        gradedAt: undefined,
      });
      return existing._id;
    }

    const submissionId = await ctx.db.insert("assignmentSubmissions", {
      assignmentId: args.assignmentId,
      userId: profile._id,
      enrollmentId: args.enrollmentId,
      content: args.content,
      fileUrl: args.fileUrl,
      submittedAt: Date.now(),
      status: "submitted",
    });

    const assignment = await ctx.db.get(args.assignmentId);
    if (assignment) {
      await ctx.db.insert("notifications", {
        userId: profile._id,
        title: "Assignment Submitted",
        message: `Your submission for "${assignment.title}" has been received`,
        type: "assignment",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return submissionId;
  },
});

// ─── GRADE SUBMISSION ─────────────────────────────────────────
// Only instructor or org_admin can grade; instructor can only grade
// submissions in their own courses
export const gradeSubmission = mutation({
  args: {
    submissionId: v.id("assignmentSubmissions"),
    score: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const assignment = await ctx.db.get(submission.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Must be instructor or admin for the course's org
    if (profile.role === "learner") {
      throw new Error("Learners cannot grade submissions");
    }

    if (profile.role === "instructor") {
      // Instructor can only grade submissions in their own courses
      if (assignment.courseId) {
        const course = await ctx.db.get(assignment.courseId);
        if (course && course.instructorId !== profile._id) {
          throw new Error("Instructors can only grade submissions in their own courses");
        }
      }
    }

    // For org_admin, verify they are in the same org as the course
    if (profile.role === "org_admin" && assignment.courseId) {
      const course = await ctx.db.get(assignment.courseId);
      if (course) {
        const member = await ctx.db
          .query("orgMembers")
          .withIndex("by_orgAndUser", (q) =>
            q.eq("orgId", course.orgId).eq("userId", profile._id)
          )
          .unique();
        if (!member) {
          throw new Error("Not authorized to grade this submission");
        }
      }
    }

    await ctx.db.patch(args.submissionId, {
      score: args.score,
      feedback: args.feedback,
      gradedAt: Date.now(),
      gradedBy: profile._id,
      status: "graded",
    });

    // Notify learner
    await ctx.db.insert("notifications", {
      userId: submission.userId,
      title: "Assignment Graded",
      message: `Your submission for "${assignment?.title}" has been graded: ${args.score}%`,
      type: "grade",
      isRead: false,
      createdAt: Date.now(),
    });

    // Mark lesson complete if graded
    if (args.score > 0 && assignment) {
      const lesson = await ctx.db.get(assignment.lessonId);
      if (lesson) {
        const enrollment = await ctx.db.get(submission.enrollmentId);
        if (enrollment) {
          const existing = await ctx.db
            .query("lessonProgress")
            .withIndex("by_enrollmentAndLesson", (q) =>
              q
                .eq("enrollmentId", submission.enrollmentId)
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
              enrollmentId: submission.enrollmentId,
              lessonId: lesson._id,
              userId: submission.userId,
              isCompleted: true,
              completedAt: Date.now(),
            });
          }
        }
      }
    }

    return args.submissionId;
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

export const getAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return null;
    const lesson = await ctx.db.get(assignment.lessonId);
    return { ...assignment, lesson };
  },
});

export const getAssignmentByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    return assignments.length > 0 ? assignments[0] : null;
  },
});

export const getAssignmentsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const getSubmissionsByAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignmentId", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .collect();

    return await Promise.all(
      submissions.map(async (s) => {
        const user = await ctx.db.get(s.userId);
        return { ...s, user };
      })
    );
  },
});

export const getUserSubmission = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;

    const submissions = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignmentId", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .collect();

    return submissions.find((s) => s.userId === profile._id) ?? null;
  },
});

export const getSubmissionsByUser = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];

    const submissions = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();

    return await Promise.all(
      submissions.map(async (s) => {
        const assignment = await ctx.db.get(s.assignmentId);
        return { ...s, assignment };
      })
    );
  },
});
