import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(v.string()),
    }).index("email", ["email"]),

    // Application user profiles with LMS roles
    appUsers: defineTable({
      userId: v.id("users"),
      name: v.string(),
      email: v.string(),
      role: v.union(
        v.literal("super_admin"),
        v.literal("org_admin"),
        v.literal("instructor"),
        v.literal("learner")
      ),
      selectedOrgId: v.optional(v.id("organizations")),
      avatar: v.optional(v.string()),
      isActive: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_userId", ["userId"])
      .index("by_email", ["email"])
      .index("by_role", ["role"]),

    organizations: defineTable({
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      logo: v.optional(v.string()),
      website: v.optional(v.string()),
      isActive: v.boolean(),
      createdBy: v.id("appUsers"),
      createdAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_createdBy", ["createdBy"]),

    orgMembers: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("appUsers"),
      role: v.union(
        v.literal("org_admin"),
        v.literal("instructor"),
        v.literal("learner")
      ),
      isActive: v.boolean(),
      joinedAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_userId", ["userId"])
      .index("by_orgAndUser", ["orgId", "userId"]),

    courses: defineTable({
      orgId: v.id("organizations"),
      title: v.string(),
      description: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      instructorId: v.id("appUsers"),
      isPublished: v.boolean(),
      passingGrade: v.number(), // percentage 0-100
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_instructorId", ["instructorId"]),

    modules: defineTable({
      courseId: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      order: v.number(),
      createdAt: v.number(),
    })
      .index("by_courseId", ["courseId"]),

    lessons: defineTable({
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
      order: v.number(),
      content: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      passingScore: v.optional(v.number()),
      maxAttempts: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_moduleId", ["moduleId"])
      .index("by_courseId", ["courseId"]),

    enrollments: defineTable({
      orgId: v.id("organizations"),
      courseId: v.id("courses"),
      userId: v.id("appUsers"),
      enrolledAt: v.number(),
      completedAt: v.optional(v.number()),
      isCompleted: v.boolean(),
    })
      .index("by_courseId", ["courseId"])
      .index("by_userId", ["userId"])
      .index("by_orgId", ["orgId"])
      .index("by_orgAndUser", ["orgId", "userId"])
      .index("by_courseAndUser", ["courseId", "userId"]),

    lessonProgress: defineTable({
      enrollmentId: v.id("enrollments"),
      lessonId: v.id("lessons"),
      userId: v.id("appUsers"),
      isCompleted: v.boolean(),
      completedAt: v.optional(v.number()),
    })
      .index("by_enrollmentId", ["enrollmentId"])
      .index("by_lessonId", ["lessonId"])
      .index("by_userId", ["userId"])
      .index("by_enrollmentAndLesson", ["enrollmentId", "lessonId"]),

    quizzes: defineTable({
      lessonId: v.id("lessons"),
      courseId: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      passingScore: v.number(),
      timeLimit: v.optional(v.number()), // in minutes
      createdAt: v.number(),
    })
      .index("by_lessonId", ["lessonId"])
      .index("by_courseId", ["courseId"]),

    questions: defineTable({
      quizId: v.id("quizzes"),
      text: v.string(),
      type: v.union(v.literal("multiple_choice")),
      options: v.array(v.string()),
      correctAnswer: v.number(), // index of correct option
      order: v.number(),
    })
      .index("by_quizId", ["quizId"]),

    quizAttempts: defineTable({
      quizId: v.id("quizzes"),
      userId: v.id("appUsers"),
      enrollmentId: v.id("enrollments"),
      answers: v.array(
        v.object({
          questionId: v.id("questions"),
          selectedAnswer: v.number(),
        })
      ),
      score: v.number(), // percentage 0-100
      passed: v.boolean(),
      startedAt: v.number(),
      completedAt: v.number(),
    })
      .index("by_quizId", ["quizId"])
      .index("by_userId", ["userId"])
      .index("by_enrollmentId", ["enrollmentId"]),

    assignments: defineTable({
      lessonId: v.id("lessons"),
      courseId: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      maxScore: v.number(),
      dueDate: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_lessonId", ["lessonId"])
      .index("by_courseId", ["courseId"]),

    assignmentSubmissions: defineTable({
      assignmentId: v.id("assignments"),
      userId: v.id("appUsers"),
      enrollmentId: v.id("enrollments"),
      content: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      submittedAt: v.number(),
      score: v.optional(v.number()),
      feedback: v.optional(v.string()),
      gradedAt: v.optional(v.number()),
      gradedBy: v.optional(v.id("appUsers")),
      status: v.union(
        v.literal("submitted"),
        v.literal("graded"),
        v.literal("returned")
      ),
    })
      .index("by_assignmentId", ["assignmentId"])
      .index("by_userId", ["userId"])
      .index("by_enrollmentId", ["enrollmentId"]),

    certificates: defineTable({
      userId: v.id("appUsers"),
      courseId: v.id("courses"),
      orgId: v.id("organizations"),
      learnerName: v.string(),
      courseName: v.string(),
      orgName: v.string(),
      completionDate: v.number(),
      certificateId: v.string(),
      verificationCode: v.string(),
    })
      .index("by_userId", ["userId"])
      .index("by_courseId", ["courseId"])
      .index("by_certificateId", ["certificateId"])
      .index("by_verificationCode", ["verificationCode"]),

    notifications: defineTable({
      userId: v.id("appUsers"),
      title: v.string(),
      message: v.string(),
      type: v.union(
        v.literal("enrollment"),
        v.literal("completion"),
        v.literal("grade"),
        v.literal("certificate"),
        v.literal("assignment"),
        v.literal("quiz"),
        v.literal("system")
      ),
      isRead: v.boolean(),
      link: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_userId", ["userId"])
      .index("by_userAndRead", ["userId", "isRead"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;
