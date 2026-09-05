import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createCourse = mutation({
  args: {
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    instructorId: v.id("appUsers"),
    passingGrade: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const courseId = await ctx.db.insert("courses", {
      orgId: args.orgId,
      title: args.title,
      description: args.description,
      instructorId: args.instructorId,
      isPublished: false,
      passingGrade: args.passingGrade,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return courseId;
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    passingGrade: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.passingGrade !== undefined) updates.passingGrade = args.passingGrade;

    await ctx.db.patch(args.courseId, updates);
    return args.courseId;
  },
});

export const publishCourse = mutation({
  args: {
    courseId: v.id("courses"),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.courseId, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return args.courseId;
  },
});

export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // Delete lessons, modules, enrollments, quizzes, etc.
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const mod of modules) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", mod._id))
        .collect();
      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }
      await ctx.db.delete(mod._id);
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const e of enrollments) await ctx.db.delete(e._id);

    await ctx.db.delete(args.courseId);
    return args.courseId;
  },
});

export const getCourses = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const instructor = await ctx.db.get(course.instructorId);
        const modules = await ctx.db
          .query("modules")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();

        return {
          ...course,
          instructor,
          moduleCount: modules.length,
          enrollmentCount: enrollments.length,
        };
      })
    );

    return enriched;
  },
});

export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const instructor = await ctx.db.get(course.instructorId);
    const org = await ctx.db.get(course.orgId);

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
      .collect();

    const modulesWithLessons = await Promise.all(
      modules
        .sort((a, b) => a.order - b.order)
        .map(async (mod) => {
          const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_moduleId", (q) => q.eq("moduleId", mod._id))
            .collect();
          return { ...mod, lessons: lessons.sort((a, b) => a.order - b.order) };
        })
    );

    const enrollmentCount = (
      await ctx.db
        .query("enrollments")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .collect()
    ).length;

    return {
      ...course,
      instructor,
      org,
      modules: modulesWithLessons,
      enrollmentCount,
    };
  },
});

export const getPublishedCourses = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return courses.filter((c) => c.isPublished);
  },
});

// Modules
export const createModule = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const moduleId = await ctx.db.insert("modules", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      order: existing.length,
      createdAt: Date.now(),
    });

    return moduleId;
  },
});

export const updateModule = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.order !== undefined) updates.order = args.order;
    await ctx.db.patch(args.moduleId, updates);
    return args.moduleId;
  },
});

export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    for (const l of lessons) await ctx.db.delete(l._id);
    await ctx.db.delete(args.moduleId);
    return args.moduleId;
  },
});

// Lessons
export const createLesson = mutation({
  args: {
    moduleId: v.id("modules"),
    courseId: v.id("courses"),
    title: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("video"),
      v.literal("file"),
      v.literal("quiz"),
      v.literal("assignment")
    ),
    content: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    passingScore: v.optional(v.number()),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .collect();

    const lessonId = await ctx.db.insert("lessons", {
      moduleId: args.moduleId,
      courseId: args.courseId,
      title: args.title,
      type: args.type,
      order: existing.length,
      content: args.content,
      videoUrl: args.videoUrl,
      fileUrl: args.fileUrl,
      passingScore: args.passingScore,
      maxAttempts: args.maxAttempts,
      createdAt: Date.now(),
    });

    return lessonId;
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    passingScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.videoUrl !== undefined) updates.videoUrl = args.videoUrl;
    if (args.fileUrl !== undefined) updates.fileUrl = args.fileUrl;
    if (args.passingScore !== undefined) updates.passingScore = args.passingScore;
    await ctx.db.patch(args.lessonId, updates);
    return args.lessonId;
  },
});

export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.lessonId);
    return args.lessonId;
  },
});

export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) return null;

    const module_ = await ctx.db.get(lesson.moduleId);
    const course = await ctx.db.get(lesson.courseId);

    // Get quiz/assignment data if applicable
    let quiz = null;
    let assignment = null;

    if (lesson.type === "quiz") {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
        .collect();
      if (quizzes.length > 0) {
        quiz = quizzes[0];
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quizId", (q) => q.eq("quizId", quiz!._id))
          .collect();
        quiz = { ...quiz, questions };
      }
    }

    if (lesson.type === "assignment") {
      const assignments = await ctx.db
        .query("assignments")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
        .collect();
      if (assignments.length > 0) assignment = assignments[0];
    }

    return { ...lesson, module: module_, course, quiz, assignment };
  },
});
