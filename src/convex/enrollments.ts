import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const enroll = mutation({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    // Check if already enrolled
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_courseAndUser", (q) =>
        q.eq("courseId", args.courseId).eq("userId", profile._id)
      )
      .unique();
    if (existing) throw new Error("Already enrolled");

    const enrollmentId = await ctx.db.insert("enrollments", {
      orgId: course.orgId,
      courseId: args.courseId,
      userId: profile._id,
      enrolledAt: Date.now(),
      isCompleted: false,
    });

    // Notify instructor
    await ctx.db.insert("notifications", {
      userId: course.instructorId,
      title: "New Enrollment",
      message: `${profile.name} enrolled in ${course.title}`,
      type: "enrollment",
      isRead: false,
      createdAt: Date.now(),
    });

    return enrollmentId;
  },
});

export const getEnrollmentsByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();

    const enriched = await Promise.all(
      enrollments.map(async (e) => {
        const course = await ctx.db.get(e.courseId);
        const progress = await getEnrollmentProgress(ctx, e._id, e.courseId);
        return { ...e, course, progress };
      })
    );

    return enriched;
  },
});

export const getEnrollmentByCourseAndUser = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    return await ctx.db
      .query("enrollments")
      .withIndex("by_courseAndUser", (q) =>
        q.eq("courseId", args.courseId).eq("userId", profile._id)
      )
      .unique();
  },
});

export const getEnrollmentsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    return await Promise.all(
      enrollments.map(async (e) => {
        const user = await ctx.db.get(e.userId);
        const progress = await getEnrollmentProgress(ctx, e._id, e.courseId);
        return { ...e, user, progress };
      })
    );
  },
});

export const completeLesson = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    // Check if already completed
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_enrollmentAndLesson", (q) =>
        q.eq("enrollmentId", args.enrollmentId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (existing?.isCompleted) return existing._id;

    if (existing) {
      await ctx.db.patch(existing._id, {
        isCompleted: true,
        completedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("lessonProgress", {
      enrollmentId: args.enrollmentId,
      lessonId: args.lessonId,
      userId: profile._id,
      isCompleted: true,
      completedAt: Date.now(),
    });
  },
});

export const getLessonProgress = query({
  args: {
    enrollmentId: v.id("enrollments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_enrollmentId", (q) =>
        q.eq("enrollmentId", args.enrollmentId)
      )
      .collect();
  },
});

export const checkAndCompleteCourse = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.isCompleted) return false;

    // Get all lessons in the course
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (q) => q.eq("courseId", enrollment.courseId))
      .collect();

    // Get completed lessons
    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_enrollmentId", (q) =>
        q.eq("enrollmentId", args.enrollmentId)
      )
      .collect();

    const completedLessonIds = new Set(
      progress.filter((p) => p.isCompleted).map((p) => p.lessonId)
    );

    const allComplete = lessons.every((l) => completedLessonIds.has(l._id));

    if (allComplete && lessons.length > 0) {
      await ctx.db.patch(args.enrollmentId, {
        isCompleted: true,
        completedAt: Date.now(),
      });

      // Generate certificate
      const course = await ctx.db.get(enrollment.courseId);
      const user = await ctx.db.get(enrollment.userId);
      const org = course ? await ctx.db.get(course.orgId) : null;

      if (course && user && org) {
        const certId = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const verifyCode = Math.random().toString(36).slice(2, 10).toUpperCase();

        await ctx.db.insert("certificates", {
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          orgId: enrollment.orgId,
          learnerName: user.name,
          courseName: course.title,
          orgName: org.name,
          completionDate: Date.now(),
          certificateId: certId,
          verificationCode: verifyCode,
        });

        await ctx.db.insert("notifications", {
          userId: enrollment.userId,
          title: "Course Completed!",
          message: `Congratulations! You completed "${course.title}" and earned a certificate.`,
          type: "certificate",
          isRead: false,
          link: "/dashboard/certificates",
          createdAt: Date.now(),
        });
      }

      return true;
    }

    return false;
  },
});

async function getEnrollmentProgress(
  ctx: any,
  enrollmentId: string,
  courseId: string
) {
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_courseId", (q: any) => q.eq("courseId", courseId))
    .collect();

  const progress = await ctx.db
    .query("lessonProgress")
    .withIndex("by_enrollmentId", (q: any) => q.eq("enrollmentId", enrollmentId))
    .collect();

  const completedCount = progress.filter((p: any) => p.isCompleted).length;
  const totalLessons = lessons.length;

  return {
    totalLessons,
    completedLessons: completedCount,
    percentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
  };
}
