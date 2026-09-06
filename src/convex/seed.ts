import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const existingOrgs = await ctx.db.query("organizations").collect();
    if (existingOrgs.length > 0) {
      return "already_seeded";
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const threeWeeksAgo = now - 21 * 24 * 60 * 60 * 1000;

    const createAuthUser = async (name: string, email: string) => {
      return await ctx.db.insert("users", {
        name,
        email,
        emailVerificationTime: now,
        isAnonymous: false,
      });
    };

    // ─── SUPER ADMIN ──────────────────────────────────────────
    const saUserId = await createAuthUser("Admin Master", "admin@learnsphere.com");
    const saProfileId = await ctx.db.insert("appUsers", {
      userId: saUserId,
      name: "Admin Master",
      email: "admin@learnsphere.com",
      role: "super_admin",
      isActive: true,
      createdAt: threeWeeksAgo,
    });

    // ─── ORG A: BrightPath Academy (approved) ─────────────────
    const orgAId = await ctx.db.insert("organizations", {
      name: "BrightPath Academy",
      slug: "brightpath-academy",
      description: "Professional skills training for modern teams. From leadership to technical mastery.",
      website: "https://brightpath.example.com",
      isActive: true,
      status: "approved",
      createdBy: saProfileId,
      createdAt: threeWeeksAgo,
    });

    const orgAAdminId = await createAuthUser("Sarah Chen", "sarah@brightpath.com");
    const orgAAdminProfile = await ctx.db.insert("appUsers", {
      userId: orgAAdminId,
      name: "Sarah Chen",
      email: "sarah@brightpath.com",
      role: "org_admin",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: threeWeeksAgo,
      bio: "Education leader with 12 years of experience in corporate training.",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: orgAAdminProfile, role: "org_admin", isActive: true, joinedAt: threeWeeksAgo, status: "approved",
    });

    // Instructor 1: David (approved)
    const instA1Id = await createAuthUser("David Park", "david@brightpath.com");
    const instA1Profile = await ctx.db.insert("appUsers", {
      userId: instA1Id,
      name: "David Park",
      email: "david@brightpath.com",
      role: "instructor",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: twoWeeksAgo,
      bio: "Leadership coach and former Fortune 500 executive.",
      qualifications: "MBA, ICF Certified Coach",
      institution: "Stanford Graduate School of Business",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: instA1Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo, status: "approved",
    });

    // Instructor 2: Emily (approved)
    const instA2Id = await createAuthUser("Emily Torres", "emily@brightpath.com");
    const instA2Profile = await ctx.db.insert("appUsers", {
      userId: instA2Id,
      name: "Emily Torres",
      email: "emily@brightpath.com",
      role: "instructor",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: twoWeeksAgo,
      bio: "Senior React developer and open-source contributor.",
      qualifications: "BS Computer Science, Google Developer Expert",
      institution: "MIT",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: instA2Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo, status: "approved",
    });

    // Learners
    const learnerA1Id = await createAuthUser("Alex Johnson", "alex@example.com");
    const learnerA1Profile = await ctx.db.insert("appUsers", {
      userId: learnerA1Id, name: "Alex Johnson", email: "alex@example.com", role: "learner", selectedOrgId: orgAId, isActive: true, createdAt: oneWeekAgo, institution: "University of California",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA1Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo, status: "approved",
    });

    const learnerA2Id = await createAuthUser("Maria Garcia", "maria@example.com");
    const learnerA2Profile = await ctx.db.insert("appUsers", {
      userId: learnerA2Id, name: "Maria Garcia", email: "maria@example.com", role: "learner", selectedOrgId: orgAId, isActive: true, createdAt: oneWeekAgo, institution: "NYU",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA2Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo, status: "approved",
    });

    const learnerA3Id = await createAuthUser("James Wilson", "james@example.com");
    const learnerA3Profile = await ctx.db.insert("appUsers", {
      userId: learnerA3Id, name: "James Wilson", email: "james@example.com", role: "learner", selectedOrgId: orgAId, isActive: true, createdAt: oneWeekAgo, institution: "UCLA",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA3Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo, status: "approved",
    });

    // ─── ORG B: NovaTech Institute (approved) ─────────────────
    const orgBId = await ctx.db.insert("organizations", {
      name: "NovaTech Institute",
      slug: "novatech-institute",
      description: "Cutting-edge technology education for developers and engineers.",
      website: "https://novatech.example.com",
      isActive: true,
      status: "approved",
      createdBy: saProfileId,
      createdAt: twoWeeksAgo,
    });

    const orgBAdminId = await createAuthUser("Michael Liu", "michael@novatech.com");
    const orgBAdminProfile = await ctx.db.insert("appUsers", {
      userId: orgBAdminId, name: "Michael Liu", email: "michael@novatech.com", role: "org_admin", selectedOrgId: orgBId, isActive: true, createdAt: twoWeeksAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: orgBAdminProfile, role: "org_admin", isActive: true, joinedAt: twoWeeksAgo, status: "approved",
    });

    const instB1Id = await createAuthUser("Lisa Wang", "lisa@novatech.com");
    const instB1Profile = await ctx.db.insert("appUsers", {
      userId: instB1Id, name: "Lisa Wang", email: "lisa@novatech.com", role: "instructor", selectedOrgId: orgBId, isActive: true, createdAt: twoWeeksAgo, qualifications: "PhD Computer Science", institution: "Carnegie Mellon",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: instB1Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo, status: "approved",
    });

    const learnerB1Id = await createAuthUser("Ryan Brown", "ryan@example.com");
    const learnerB1Profile = await ctx.db.insert("appUsers", {
      userId: learnerB1Id, name: "Ryan Brown", email: "ryan@example.com", role: "learner", selectedOrgId: orgBId, isActive: true, createdAt: oneWeekAgo, institution: "Georgia Tech",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: learnerB1Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo, status: "approved",
    });

    // ─── PENDING ORG (for super admin to approve) ─────────────
    const orgCId = await ctx.db.insert("organizations", {
      name: "CodeWizards Bootcamp",
      slug: "codewizards",
      description: "Intensive coding bootcamp for career changers.",
      isActive: false,
      status: "pending",
      createdBy: saProfileId,
      createdAt: oneWeekAgo,
    });

    // ─── PENDING INSTRUCTOR APPLICATION ───────────────────────
    const pendingInstId = await createAuthUser("Rachel Kim", "rachel@example.com");
    const pendingInstProfile = await ctx.db.insert("appUsers", {
      userId: pendingInstId, name: "Rachel Kim", email: "rachel@example.com", role: "instructor", isActive: true, createdAt: oneWeekAgo,
      bio: "Full-stack developer with expertise in TypeScript and React.",
      qualifications: "BS Software Engineering",
      institution: "University of Washington",
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: pendingInstProfile, role: "instructor", isActive: true, joinedAt: oneWeekAgo, status: "pending",
      applicationMessage: "I'd love to teach advanced TypeScript and React patterns at BrightPath Academy.",
      applicationDate: oneWeekAgo,
    });

    // ─── COURSES IN BRIGHTPATH ────────────────────────────────
    const course1Id = await ctx.db.insert("courses", {
      orgId: orgAId,
      title: "Leadership Foundations",
      description: "Master the essential skills of effective leadership. Learn to inspire teams, make strategic decisions, and drive organizational success.",
      instructorId: instA1Profile,
      isPublished: true,
      passingGrade: 70,
      durationMinutes: 360,
      createdAt: twoWeeksAgo,
      updatedAt: oneWeekAgo,
    });

    const mod1AId = await ctx.db.insert("modules", {
      courseId: course1Id, title: "Understanding Leadership", description: "What makes a great leader?", order: 0, createdAt: twoWeeksAgo,
    });

    const lesson1A1 = await ctx.db.insert("lessons", {
      moduleId: mod1AId, courseId: course1Id,
      title: "What is Leadership?", type: "text", order: 0,
      content: "Leadership is the art of motivating a group of people to act toward achieving a common goal.\n\n## Key Principles\n1. **Vision** — Great leaders have a clear vision\n2. **Communication** — They articulate clearly\n3. **Integrity** — They lead by example\n4. **Empathy** — They understand their team\n5. **Decisiveness** — They make informed decisions",
      createdAt: twoWeeksAgo,
    });

    const lesson1A2 = await ctx.db.insert("lessons", {
      moduleId: mod1AId, courseId: course1Id,
      title: "Leadership Styles Explained", type: "text", order: 1,
      content: "The Six Leadership Styles:\n1. **Commanding** — Best for crisis situations\n2. **Visionary** — Best for change management\n3. **Affiliative** — Best for team building\n4. **Democratic** — Best for getting input\n5. **Pacesetting** — Best for high-performing teams\n6. **Coaching** — Best for development",
      createdAt: twoWeeksAgo,
    });

    const mod2AId = await ctx.db.insert("modules", {
      courseId: course1Id, title: "Communication & Influence", description: "Master the art of impactful communication", order: 1, createdAt: twoWeeksAgo,
    });

    await ctx.db.insert("lessons", {
      moduleId: mod2AId, courseId: course1Id,
      title: "Effective Communication Techniques", type: "text", order: 0,
      content: "## The Communication Framework\n\n### Active Listening\n- Give full attention\n- Ask clarifying questions\n- Summarize what you heard\n\n### Clear Messaging\n- Know your audience\n- Be concise and direct\n- Use stories and examples\n\n## Difficult Conversations\n1. Prepare your key points\n2. Create a safe environment\n3. Focus on behavior, not personality\n4. Listen to understand\n5. Agree on next steps",
      createdAt: oneWeekAgo,
    });

    await ctx.db.insert("lessons", {
      moduleId: mod2AId, courseId: course1Id,
      title: "Influencing Without Authority", type: "video", order: 1,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "Learn how to influence peers and cross-functional teams even without direct authority.",
      createdAt: oneWeekAgo,
    });

    const mod3AId = await ctx.db.insert("modules", {
      courseId: course1Id, title: "Final Assessment", description: "Demonstrate your leadership knowledge", order: 2, createdAt: oneWeekAgo,
    });

    const quizLesson1 = await ctx.db.insert("lessons", {
      moduleId: mod3AId, courseId: course1Id, title: "Leadership Knowledge Quiz", type: "quiz", order: 0, passingScore: 70, createdAt: oneWeekAgo,
    });

    const quiz1Id = await ctx.db.insert("quizzes", {
      lessonId: quizLesson1, courseId: course1Id, title: "Leadership Foundations Quiz", description: "Test your understanding of key leadership concepts", passingScore: 70, createdAt: oneWeekAgo,
    });

    const q1 = await ctx.db.insert("questions", { quizId: quiz1Id, text: "Which leadership style is best for crisis?", type: "multiple_choice", options: ["Democratic", "Coaching", "Commanding", "Affiliative"], correctAnswer: 2, order: 0 });
    const q2 = await ctx.db.insert("questions", { quizId: quiz1Id, text: "What is the PRIMARY difference between leadership and management?", type: "multiple_choice", options: ["Leaders are born", "Leadership is about inspiring, management about organizing", "Leaders work harder", "No difference"], correctAnswer: 1, order: 1 });
    const q3 = await ctx.db.insert("questions", { quizId: quiz1Id, text: "Most important communication skill?", type: "multiple_choice", options: ["Speaking loudly", "Active listening", "Using jargon", "Avoiding feedback"], correctAnswer: 1, order: 2 });
    const q4 = await ctx.db.insert("questions", { quizId: quiz1Id, text: "Influencing without authority relies on?", type: "multiple_choice", options: ["Org chart", "Building trust", "Threats", "Legal authority"], correctAnswer: 1, order: 3 });
    const q5 = await ctx.db.insert("questions", { quizId: quiz1Id, text: "Which style focuses on mentoring?", type: "multiple_choice", options: ["Commanding", "Visionary", "Pacesetting", "Coaching"], correctAnswer: 3, order: 4 });

    const assignmentLesson1 = await ctx.db.insert("lessons", {
      moduleId: mod3AId, courseId: course1Id, title: "Leadership Self-Assessment", type: "assignment", order: 1, createdAt: oneWeekAgo,
    });

    await ctx.db.insert("assignments", {
      lessonId: assignmentLesson1, courseId: course1Id, title: "Leadership Style Reflection Essay",
      description: "Write a 500-word reflection on your personal leadership style.",
      maxScore: 100, createdAt: oneWeekAgo,
    });

    // ─── COURSE 2: React Fundamentals ─────────────────────────
    const course2Id = await ctx.db.insert("courses", {
      orgId: orgAId, title: "React Fundamentals",
      description: "Build modern web applications with React. From components to hooks.",
      instructorId: instA2Profile, isPublished: true, passingGrade: 60, durationMinutes: 240,
      createdAt: twoWeeksAgo, updatedAt: oneWeekAgo,
    });

    const mod1BId = await ctx.db.insert("modules", { courseId: course2Id, title: "Getting Started with React", description: "Setup and basics", order: 0, createdAt: twoWeeksAgo });
    await ctx.db.insert("lessons", {
      moduleId: mod1BId, courseId: course2Id, title: "Introduction to React", type: "text", order: 0,
      content: "React is a JavaScript library for building user interfaces.\n\n## Why React?\n- **Component-Based** — Reusable UI pieces\n- **Declarative** — Describe UI for any given state\n- **Learn Once, Write Anywhere**\n\n## Key Concepts\n1. JSX 2. Components 3. Props 4. State 5. Hooks",
      createdAt: oneWeekAgo,
    });
    await ctx.db.insert("lessons", {
      moduleId: mod1BId, courseId: course2Id, title: "Setting Up Your Environment", type: "video", order: 1,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "Set up Node.js, VS Code, and create-react-app for React development.",
      createdAt: oneWeekAgo,
    });

    const mod2BId = await ctx.db.insert("modules", { courseId: course2Id, title: "Components & Props", description: "Building blocks of React", order: 1, createdAt: oneWeekAgo });

    const quizLesson2 = await ctx.db.insert("lessons", { moduleId: mod2BId, courseId: course2Id, title: "React Basics Quiz", type: "quiz", order: 0, passingScore: 60, createdAt: oneWeekAgo });
    const quiz2Id = await ctx.db.insert("quizzes", { lessonId: quizLesson2, courseId: course2Id, title: "React Basics Quiz", description: "Test your React fundamentals", passingScore: 60, createdAt: oneWeekAgo });
    await ctx.db.insert("questions", { quizId: quiz2Id, text: "What does JSX stand for?", type: "multiple_choice", options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript XHR"], correctAnswer: 0, order: 0 });
    await ctx.db.insert("questions", { quizId: quiz2Id, text: "Which hook manages state in functional components?", type: "multiple_choice", options: ["useEffect", "useState", "useReducer", "useMemo"], correctAnswer: 1, order: 1 });
    await ctx.db.insert("questions", { quizId: quiz2Id, text: "How to pass data from parent to child?", type: "multiple_choice", options: ["State", "Props", "Context", "Refs"], correctAnswer: 1, order: 2 });

    // ─── COURSE 3: Full-Stack TypeScript (NovaTech) ───────────
    const course3Id = await ctx.db.insert("courses", {
      orgId: orgBId, title: "Full-Stack TypeScript",
      description: "Master TypeScript from frontend to backend. Build type-safe applications.",
      instructorId: instB1Profile, isPublished: true, passingGrade: 70, durationMinutes: 420,
      createdAt: twoWeeksAgo, updatedAt: oneWeekAgo,
    });

    const mod1CId = await ctx.db.insert("modules", { courseId: course3Id, title: "TypeScript Essentials", description: "Core TypeScript concepts", order: 0, createdAt: twoWeeksAgo });
    await ctx.db.insert("lessons", {
      moduleId: mod1CId, courseId: course3Id, title: "Why TypeScript?", type: "text", order: 0,
      content: "TypeScript adds static type checking to JavaScript.\n\n## Benefits\n1. Early Error Detection\n2. Better IDE Support\n3. Self-Documenting Code\n4. Safer Refactoring\n5. Scalability",
      createdAt: oneWeekAgo,
    });

    const quizLesson3 = await ctx.db.insert("lessons", { moduleId: mod1CId, courseId: course3Id, title: "TypeScript Fundamentals Quiz", type: "quiz", order: 1, passingScore: 70, createdAt: oneWeekAgo });
    const quiz3Id = await ctx.db.insert("quizzes", { lessonId: quizLesson3, courseId: course3Id, title: "TypeScript Fundamentals Quiz", description: "Check your TypeScript basics", passingScore: 70, createdAt: oneWeekAgo });
    await ctx.db.insert("questions", { quizId: quiz3Id, text: "Primary benefit of TypeScript?", type: "multiple_choice", options: ["Faster runtime", "Static type checking", "Better browser support", "Smaller bundle"], correctAnswer: 1, order: 0 });
    await ctx.db.insert("questions", { quizId: quiz3Id, text: "Type for values A or B?", type: "multiple_choice", options: ["Interface", "Enum", "Union", "Generic"], correctAnswer: 2, order: 1 });

    // ─── ENROLLMENTS & PROGRESS ───────────────────────────────
    const enrollment1 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA1Profile, enrolledAt: oneWeekAgo, isCompleted: false,
    });

    await ctx.db.insert("lessonProgress", { enrollmentId: enrollment1, lessonId: lesson1A1, userId: learnerA1Profile, isCompleted: true, completedAt: oneWeekAgo - 3 * 3600000 });
    await ctx.db.insert("lessonProgress", { enrollmentId: enrollment1, lessonId: lesson1A2, userId: learnerA1Profile, isCompleted: true, completedAt: oneWeekAgo - 2 * 3600000 });
    await ctx.db.insert("lessonProgress", { enrollmentId: enrollment1, lessonId: (await ctx.db.query("lessons").withIndex("by_courseId", q => q.eq("courseId", course1Id)).collect())[2]._id, userId: learnerA1Profile, isCompleted: true, completedAt: oneWeekAgo - 1 * 3600000 });

    await ctx.db.insert("quizAttempts", {
      quizId: quiz1Id, userId: learnerA1Profile, enrollmentId: enrollment1,
      answers: [{ questionId: q1, selectedAnswer: 2 }, { questionId: q2, selectedAnswer: 1 }, { questionId: q3, selectedAnswer: 1 }, { questionId: q4, selectedAnswer: 1 }, { questionId: q5, selectedAnswer: 3 }],
      score: 80, passed: true, startedAt: oneWeekAgo - 45 * 60000, completedAt: oneWeekAgo - 30 * 60000,
    });

    const enrollment2 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course2Id, userId: learnerA1Profile, enrolledAt: oneWeekAgo - 2 * 86400000, isCompleted: false,
    });

    // Maria: completed Leadership Foundations
    const enrollment3 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA2Profile, enrolledAt: oneWeekAgo - 3 * 86400000, isCompleted: false,
    });

    const allCourse1Lessons = [lesson1A1, lesson1A2, (await ctx.db.query("lessons").withIndex("by_courseId", q => q.eq("courseId", course1Id)).collect())[2]._id, (await ctx.db.query("lessons").withIndex("by_courseId", q => q.eq("courseId", course1Id)).collect())[3]._id, quizLesson1, assignmentLesson1];
    for (const lid of allCourse1Lessons) {
      await ctx.db.insert("lessonProgress", { enrollmentId: enrollment3, lessonId: lid, userId: learnerA2Profile, isCompleted: true, completedAt: oneWeekAgo - 12 * 3600000 });
    }
    await ctx.db.patch(enrollment3, { isCompleted: true, completedAt: oneWeekAgo - 12 * 3600000 });

    const questionsQ1 = [q1, q2, q3, q4, q5];
    await ctx.db.insert("quizAttempts", {
      quizId: quiz1Id, userId: learnerA2Profile, enrollmentId: enrollment3,
      answers: questionsQ1.map((qId, i) => ({ questionId: qId, selectedAnswer: [2, 1, 1, 1, 3][i] })),
      score: 100, passed: true, startedAt: oneWeekAgo - 15 * 60000, completedAt: oneWeekAgo - 14 * 60000,
    });

    const assignments = await ctx.db.query("assignments").withIndex("by_courseId", q => q.eq("courseId", course1Id)).collect();
    if (assignments.length > 0) {
      await ctx.db.insert("assignmentSubmissions", {
        assignmentId: assignments[0]._id, userId: learnerA2Profile, enrollmentId: enrollment3,
        content: "My leadership style is primarily affiliative. I focus on building relationships and creating harmony.",
        submittedAt: oneWeekAgo - 20 * 60000, score: 95,
        feedback: "Excellent self-awareness and practical examples.",
        gradedAt: oneWeekAgo - 18 * 60000, gradedBy: instA1Profile, status: "graded",
      });
    }

    await ctx.db.insert("certificates", {
      userId: learnerA2Profile, courseId: course1Id, orgId: orgAId,
      learnerName: "Maria Garcia", courseName: "Leadership Foundations", orgName: "BrightPath Academy",
      completionDate: oneWeekAgo - 12 * 3600000, certificateId: "CERT-BP-2024-001", verificationCode: "VER-BP-LEADERSHIP-001",
    });

    // James enrolled in Leadership Foundations
    await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA3Profile, enrolledAt: oneWeekAgo - 5 * 86400000, isCompleted: false,
    });

    // Ryan enrolled in Full-Stack TypeScript
    await ctx.db.insert("enrollments", {
      orgId: orgBId, courseId: course3Id, userId: learnerB1Profile, enrolledAt: oneWeekAgo - 4 * 86400000, isCompleted: false,
    });

    // ─── NOTIFICATIONS ────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: learnerA1Profile, title: "Welcome to BrightPath!",
      message: "Start your learning journey by exploring Leadership Foundations.",
      type: "system", isRead: false, createdAt: oneWeekAgo,
    });
    await ctx.db.insert("notifications", {
      userId: instA1Profile, title: "New Enrollment",
      message: "Alex Johnson enrolled in Leadership Foundations",
      type: "enrollment", isRead: false, createdAt: oneWeekAgo,
    });
    await ctx.db.insert("notifications", {
      userId: orgAAdminProfile, title: "Instructor Application",
      message: "Rachel Kim has applied to join BrightPath Academy as an instructor.",
      type: "system", isRead: false, createdAt: oneWeekAgo,
    });

    return "seeded";
  },
});
