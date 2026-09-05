import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingOrgs = await ctx.db.query("organizations").collect();
    if (existingOrgs.length > 0) {
      return "already_seeded";
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const threeWeeksAgo = now - 21 * 24 * 60 * 60 * 1000;

    // ─── Users ──────────────────────────────────────────────
    const createAuthUser = async (name: string, email: string) => {
      return await ctx.db.insert("users", {
        name,
        email,
        emailVerificationTime: now,
        isAnonymous: false,
      });
    };

    const saUserId = await createAuthUser("Admin Master", "admin@learnsphere.com");
    const saProfileId = await ctx.db.insert("appUsers", {
      userId: saUserId,
      name: "Admin Master",
      email: "admin@learnsphere.com",
      role: "super_admin",
      isActive: true,
      createdAt: threeWeeksAgo,
    });

    // Org A: BrightPath Academy
    const orgAId = await ctx.db.insert("organizations", {
      name: "BrightPath Academy",
      slug: "brightpath-academy",
      description: "Professional skills training for modern teams. From leadership to technical mastery.",
      website: "https://brightpath.example.com",
      isActive: true,
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
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: orgAAdminProfile, role: "org_admin", isActive: true, joinedAt: threeWeeksAgo,
    });

    const instA1Id = await createAuthUser("David Park", "david@brightpath.com");
    const instA1Profile = await ctx.db.insert("appUsers", {
      userId: instA1Id,
      name: "David Park",
      email: "david@brightpath.com",
      role: "instructor",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: twoWeeksAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: instA1Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo,
    });

    const instA2Id = await createAuthUser("Emily Torres", "emily@brightpath.com");
    const instA2Profile = await ctx.db.insert("appUsers", {
      userId: instA2Id,
      name: "Emily Torres",
      email: "emily@brightpath.com",
      role: "instructor",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: twoWeeksAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: instA2Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo,
    });

    const learnerA1Id = await createAuthUser("Alex Johnson", "alex@example.com");
    const learnerA1Profile = await ctx.db.insert("appUsers", {
      userId: learnerA1Id,
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "learner",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: oneWeekAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA1Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo,
    });

    const learnerA2Id = await createAuthUser("Maria Garcia", "maria@example.com");
    const learnerA2Profile = await ctx.db.insert("appUsers", {
      userId: learnerA2Id,
      name: "Maria Garcia",
      email: "maria@example.com",
      role: "learner",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: oneWeekAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA2Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo,
    });

    const learnerA3Id = await createAuthUser("James Wilson", "james@example.com");
    const learnerA3Profile = await ctx.db.insert("appUsers", {
      userId: learnerA3Id,
      name: "James Wilson",
      email: "james@example.com",
      role: "learner",
      selectedOrgId: orgAId,
      isActive: true,
      createdAt: oneWeekAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgAId, userId: learnerA3Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo,
    });

    // Org B: NovaTech Institute
    const orgBId = await ctx.db.insert("organizations", {
      name: "NovaTech Institute",
      slug: "novatech-institute",
      description: "Cutting-edge technology education for developers and engineers.",
      website: "https://novatech.example.com",
      isActive: true,
      createdBy: saProfileId,
      createdAt: twoWeeksAgo,
    });

    const orgBAdminId = await createAuthUser("Michael Liu", "michael@novatech.com");
    const orgBAdminProfile = await ctx.db.insert("appUsers", {
      userId: orgBAdminId,
      name: "Michael Liu",
      email: "michael@novatech.com",
      role: "org_admin",
      selectedOrgId: orgBId,
      isActive: true,
      createdAt: twoWeeksAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: orgBAdminProfile, role: "org_admin", isActive: true, joinedAt: twoWeeksAgo,
    });

    const instB1Id = await createAuthUser("Lisa Wang", "lisa@novatech.com");
    const instB1Profile = await ctx.db.insert("appUsers", {
      userId: instB1Id,
      name: "Lisa Wang",
      email: "lisa@novatech.com",
      role: "instructor",
      selectedOrgId: orgBId,
      isActive: true,
      createdAt: twoWeeksAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: instB1Profile, role: "instructor", isActive: true, joinedAt: twoWeeksAgo,
    });

    const learnerB1Id = await createAuthUser("Ryan Brown", "ryan@example.com");
    const learnerB1Profile = await ctx.db.insert("appUsers", {
      userId: learnerB1Id,
      name: "Ryan Brown",
      email: "ryan@example.com",
      role: "learner",
      selectedOrgId: orgBId,
      isActive: true,
      createdAt: oneWeekAgo,
    });
    await ctx.db.insert("orgMembers", {
      orgId: orgBId, userId: learnerB1Profile, role: "learner", isActive: true, joinedAt: oneWeekAgo,
    });

    // ─── Courses in BrightPath ──────────────────────────────
    const course1Id = await ctx.db.insert("courses", {
      orgId: orgAId,
      title: "Leadership Foundations",
      description: "Master the essential skills of effective leadership. Learn to inspire teams, make strategic decisions, and drive organizational success.",
      instructorId: instA1Profile,
      isPublished: true,
      passingGrade: 70,
      createdAt: twoWeeksAgo,
      updatedAt: oneWeekAgo,
    });

    // Module 1: Understanding Leadership
    const mod1AId = await ctx.db.insert("modules", {
      courseId: course1Id,
      title: "Understanding Leadership",
      description: "What makes a great leader?",
      order: 0,
      createdAt: twoWeeksAgo,
    });

    const lesson1A1 = await ctx.db.insert("lessons", {
      moduleId: mod1AId, courseId: course1Id,
      title: "What is Leadership?", type: "text", order: 0,
      content: "Leadership is the art of motivating a group of people to act toward achieving a common goal. In a business setting, this can mean directing workers and colleagues with a strategy to meet the company's needs.\n\n## Key Principles of Leadership\n\n1. **Vision** — Great leaders have a clear vision of where they want to go\n2. **Communication** — They articulate that vision clearly and inspire others\n3. **Integrity** — They lead by example with strong moral principles\n4. **Empathy** — They understand and care about their team members\n5. **Decisiveness** — They make informed decisions with confidence\n\n## Leadership vs Management\n\nWhile often used interchangeably, leadership and management are distinct:\n- **Management** is about planning, organizing, and coordinating\n- **Leadership** is about inspiring, motivating, and guiding\n\nEffective organizations need both strong leaders and skilled managers.",
      createdAt: twoWeeksAgo,
    });

    const lesson1A2 = await ctx.db.insert("lessons", {
      moduleId: mod1AId, courseId: course1Id,
      title: "Leadership Styles Explained", type: "text", order: 1,
      content: "Different situations call for different leadership styles. Understanding when to use each style is key to effective leadership.\n\n## The Six Leadership Styles\n\n### 1. Commanding Leadership\nBest for: Crisis situations, quick decisions\n- Direct and authoritative\n- Clear expectations\n- Fast execution\n\n### 2. Visionary Leadership\nBest for: Change management, new initiatives\n- Inspires with a compelling vision\n- Encourages innovation\n- Builds buy-in\n\n### 3. Affiliative Leadership\nBest for: Team building, conflict resolution\n- Creates harmony and trust\n- Supports team members\n- Builds emotional bonds\n\n### 4. Democratic Leadership\nBest for: Getting input, building consensus\n- Values everyone's opinion\n- Encourages participation\n- Builds commitment\n\n### 5. Pacesetting Leadership\nBest for: High-performing teams, quick results\n- Sets high standards\n- Leads by example\n- Drives excellence\n\n### 6. Coaching Leadership\nBest for: Development, long-term growth\n- Focuses on individual growth\n- Provides mentoring\n- Builds capabilities",
      createdAt: twoWeeksAgo,
    });

    // Module 2: Communication & Influence
    const mod2AId = await ctx.db.insert("modules", {
      courseId: course1Id,
      title: "Communication & Influence",
      description: "Master the art of impactful communication",
      order: 1,
      createdAt: twoWeeksAgo,
    });

    const lesson1A3 = await ctx.db.insert("lessons", {
      moduleId: mod2AId, courseId: course1Id,
      title: "Effective Communication Techniques", type: "text", order: 0,
      content: "Communication is the backbone of leadership. Without clear, effective communication, even the best strategies fail.\n\n## The Communication Framework\n\n### Active Listening\n- Give full attention to the speaker\n- Ask clarifying questions\n- Summarize what you heard\n- Avoid interrupting\n\n### Clear Messaging\n- Know your audience\n- Be concise and direct\n- Use stories and examples\n- Check for understanding\n\n### Non-Verbal Communication\n- Body language speaks volumes\n- Maintain appropriate eye contact\n- Use gestures purposefully\n- Match your words with your actions\n\n## Difficult Conversations\n\n1. Prepare your key points\n2. Create a safe environment\n3. Focus on behavior, not personality\n4. Listen to understand, not to respond\n5. Agree on next steps",
      createdAt: oneWeekAgo,
    });

    const lesson1A4 = await ctx.db.insert("lessons", {
      moduleId: mod2AId, courseId: course1Id,
      title: "Influencing Without Authority", type: "video", order: 1,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "Learn how to influence peers, stakeholders, and cross-functional teams even without direct authority. This lesson covers the psychology of influence and practical techniques for building consensus.",
      createdAt: oneWeekAgo,
    });

    // Module 3: Final Assessment
    const mod3AId = await ctx.db.insert("modules", {
      courseId: course1Id,
      title: "Final Assessment",
      description: "Demonstrate your leadership knowledge",
      order: 2,
      createdAt: oneWeekAgo,
    });

    const quizLesson1 = await ctx.db.insert("lessons", {
      moduleId: mod3AId, courseId: course1Id,
      title: "Leadership Knowledge Quiz", type: "quiz", order: 0,
      passingScore: 70,
      createdAt: oneWeekAgo,
    });

    const quiz1Id = await ctx.db.insert("quizzes", {
      lessonId: quizLesson1, courseId: course1Id,
      title: "Leadership Foundations Quiz",
      description: "Test your understanding of key leadership concepts",
      passingScore: 70,
      createdAt: oneWeekAgo,
    });

    // Quiz questions
    await ctx.db.insert("questions", {
      quizId: quiz1Id, text: "Which leadership style is best suited for crisis situations?",
      type: "multiple_choice",
      options: ["Democratic", "Coaching", "Commanding", "Affiliative"],
      correctAnswer: 2, order: 0,
    });
    await ctx.db.insert("questions", {
      quizId: quiz1Id, text: "What is the PRIMARY difference between leadership and management?",
      type: "multiple_choice",
      options: [
        "Leaders are born, managers are trained",
        "Leadership is about inspiring, management is about organizing",
        "Leaders work harder than managers",
        "There is no difference",
      ],
      correctAnswer: 1, order: 1,
    });
    await ctx.db.insert("questions", {
      quizId: quiz1Id, text: "Which skill is most important for effective communication?",
      type: "multiple_choice",
      options: ["Speaking loudly", "Active listening", "Using jargon", "Avoiding feedback"],
      correctAnswer: 1, order: 2,
    });
    await ctx.db.insert("questions", {
      quizId: quiz1Id, text: "Influencing without authority relies most on:",
      type: "multiple_choice",
      options: ["Organizational chart position", "Building trust and relationships", "Threats of consequences", "Legal authority"],
      correctAnswer: 1, order: 3,
    });
    await ctx.db.insert("questions", {
      quizId: quiz1Id, text: "Which leadership style focuses on individual growth and mentoring?",
      type: "multiple_choice",
      options: ["Commanding", "Visionary", "Pacesetting", "Coaching"],
      correctAnswer: 3, order: 4,
    });

    const assignmentLesson1 = await ctx.db.insert("lessons", {
      moduleId: mod3AId, courseId: course1Id,
      title: "Leadership Self-Assessment", type: "assignment", order: 1,
      createdAt: oneWeekAgo,
    });

    await ctx.db.insert("assignments", {
      lessonId: assignmentLesson1, courseId: course1Id,
      title: "Leadership Style Reflection Essay",
      description: "Write a 500-word reflection on your personal leadership style. Identify which of the six leadership styles you most naturally use, provide examples from your experience, and describe one area you want to develop.",
      maxScore: 100,
      createdAt: oneWeekAgo,
    });

    // ─── Course 2 in BrightPath ─────────────────────────────
    const course2Id = await ctx.db.insert("courses", {
      orgId: orgAId,
      title: "React Fundamentals",
      description: "Build modern web applications with React. From components to hooks, learn everything you need to become a proficient React developer.",
      instructorId: instA2Profile,
      isPublished: true,
      passingGrade: 60,
      createdAt: twoWeeksAgo,
      updatedAt: oneWeekAgo,
    });

    const mod1BId = await ctx.db.insert("modules", {
      courseId: course2Id, title: "Getting Started with React", description: "Setup and basics", order: 0, createdAt: twoWeeksAgo,
    });

    await ctx.db.insert("lessons", {
      moduleId: mod1BId, courseId: course2Id,
      title: "Introduction to React", type: "text", order: 0,
      content: "React is a JavaScript library for building user interfaces. Created by Facebook, it has become one of the most popular front-end frameworks.\n\n## Why React?\n\n- **Component-Based**: Build encapsulated components that manage their own state\n- **Declarative**: Describe what the UI should look like for any given state\n- **Learn Once, Write Anywhere**: React can render to the DOM, server, or mobile apps\n\n## Your First Component\n\n```jsx\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n```\n\n## Key Concepts\n\n1. **JSX** — A syntax extension for JavaScript\n2. **Components** — Reusable UI pieces\n3. **Props** — Data passed to components\n4. **State** — Internal component data\n5. **Hooks** — Functions that let you use state and lifecycle",
      createdAt: oneWeekAgo,
    });

    await ctx.db.insert("lessons", {
      moduleId: mod1BId, courseId: course2Id,
      title: "Setting Up Your Environment", type: "video", order: 1,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "Learn how to set up your development environment for React development, including Node.js, VS Code extensions, and create-react-app.",
      createdAt: oneWeekAgo,
    });

    const mod2BId = await ctx.db.insert("modules", {
      courseId: course2Id, title: "Components & Props", description: "Building blocks of React", order: 1, createdAt: oneWeekAgo,
    });

    const quizLesson2 = await ctx.db.insert("lessons", {
      moduleId: mod2BId, courseId: course2Id,
      title: "React Basics Quiz", type: "quiz", order: 0,
      passingScore: 60, createdAt: oneWeekAgo,
    });

    const quiz2Id = await ctx.db.insert("quizzes", {
      lessonId: quizLesson2, courseId: course2Id,
      title: "React Basics Quiz",
      description: "Test your understanding of React fundamentals",
      passingScore: 60, createdAt: oneWeekAgo,
    });

    await ctx.db.insert("questions", {
      quizId: quiz2Id, text: "What does JSX stand for?",
      type: "multiple_choice",
      options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript XHR"],
      correctAnswer: 0, order: 0,
    });
    await ctx.db.insert("questions", {
      quizId: quiz2Id, text: "Which hook is used for managing state in a functional component?",
      type: "multiple_choice",
      options: ["useEffect", "useState", "useReducer", "useMemo"],
      correctAnswer: 1, order: 1,
    });
    await ctx.db.insert("questions", {
      quizId: quiz2Id, text: "What is the correct way to pass data from parent to child component?",
      type: "multiple_choice",
      options: ["State", "Props", "Context", "Refs"],
      correctAnswer: 1, order: 2,
    });

    // ─── Course in NovaTech ─────────────────────────────────
    const course3Id = await ctx.db.insert("courses", {
      orgId: orgBId,
      title: "Full-Stack TypeScript",
      description: "Master TypeScript from frontend to backend. Build type-safe applications with confidence using TypeScript across your entire stack.",
      instructorId: instB1Profile,
      isPublished: true,
      passingGrade: 70,
      createdAt: twoWeeksAgo,
      updatedAt: oneWeekAgo,
    });

    const mod1CId = await ctx.db.insert("modules", {
      courseId: course3Id, title: "TypeScript Essentials", description: "Core TypeScript concepts", order: 0, createdAt: twoWeeksAgo,
    });

    await ctx.db.insert("lessons", {
      moduleId: mod1CId, courseId: course3Id,
      title: "Why TypeScript?", type: "text", order: 0,
      content: "TypeScript adds static type checking to JavaScript, catching errors at compile time rather than runtime.\n\n## Benefits of TypeScript\n\n1. **Early Error Detection** — Catch bugs before they reach production\n2. **Better IDE Support** — Autocomplete, refactoring, and navigation\n3. **Self-Documenting Code** — Types serve as living documentation\n4. **Safer Refactoring** — Change code with confidence\n5. **Scalability** — Maintain large codebases with ease\n\n## Quick Example\n\n```typescript\n// Without TypeScript\nfunction add(a, b) {\n  return a + b;\n}\nadd('hello', 5); // No error at compile time!\n\n// With TypeScript\nfunction add(a: number, b: number): number {\n  return a + b;\n}\nadd('hello', 5); // Error: Argument of type 'string' is not assignable\n```",
      createdAt: oneWeekAgo,
    });

    const quizLesson3 = await ctx.db.insert("lessons", {
      moduleId: mod1CId, courseId: course3Id,
      title: "TypeScript Fundamentals Quiz", type: "quiz", order: 1,
      passingScore: 70, createdAt: oneWeekAgo,
    });

    const quiz3Id = await ctx.db.insert("quizzes", {
      lessonId: quizLesson3, courseId: course3Id,
      title: "TypeScript Fundamentals Quiz",
      description: "Check your understanding of TypeScript basics",
      passingScore: 70, createdAt: oneWeekAgo,
    });

    await ctx.db.insert("questions", {
      quizId: quiz3Id, text: "What is the primary benefit of TypeScript over JavaScript?",
      type: "multiple_choice",
      options: ["Faster runtime performance", "Static type checking", "Better browser support", "Smaller bundle size"],
      correctAnswer: 1, order: 0,
    });
    await ctx.db.insert("questions", {
      quizId: quiz3Id, text: "Which TypeScript type represents values that can be either A or B?",
      type: "multiple_choice",
      options: ["Interface", "Enum", "Union", "Generic"],
      correctAnswer: 2, order: 1,
    });

    // ─── Enrollments & Progress ─────────────────────────────
    // Alex enrolls in Leadership Foundations
    const enrollment1 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA1Profile,
      enrolledAt: oneWeekAgo, isCompleted: false,
    });

    // Alex completed first 2 lessons
    await ctx.db.insert("lessonProgress", {
      enrollmentId: enrollment1, lessonId: lesson1A1, userId: learnerA1Profile,
      isCompleted: true, completedAt: oneWeekAgo - 3 * 60 * 60 * 1000,
    });
    await ctx.db.insert("lessonProgress", {
      enrollmentId: enrollment1, lessonId: lesson1A2, userId: learnerA1Profile,
      isCompleted: true, completedAt: oneWeekAgo - 2 * 60 * 60 * 1000,
    });
    await ctx.db.insert("lessonProgress", {
      enrollmentId: enrollment1, lessonId: lesson1A3, userId: learnerA1Profile,
      isCompleted: true, completedAt: oneWeekAgo - 1 * 60 * 60 * 1000,
    });

    // Alex passed the quiz
    await ctx.db.insert("quizAttempts", {
      quizId: quiz1Id, userId: learnerA1Profile, enrollmentId: enrollment1,
      answers: [
        { questionId: (await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect())[0]._id, selectedAnswer: 2 },
        { questionId: (await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect())[1]._id, selectedAnswer: 1 },
        { questionId: (await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect())[2]._id, selectedAnswer: 1 },
        { questionId: (await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect())[3]._id, selectedAnswer: 1 },
        { questionId: (await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect())[4]._id, selectedAnswer: 3 },
      ],
      score: 80, passed: true, startedAt: oneWeekAgo - 45 * 60 * 1000, completedAt: oneWeekAgo - 30 * 60 * 1000,
    });

    // Alex enrolled in React Fundamentals
    const enrollment2 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course2Id, userId: learnerA1Profile,
      enrolledAt: oneWeekAgo - 2 * 24 * 60 * 60 * 1000, isCompleted: false,
    });

    // Maria enrolled in Leadership Foundations
    const enrollment3 = await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA2Profile,
      enrolledAt: oneWeekAgo - 3 * 24 * 60 * 60 * 1000, isCompleted: false,
    });

    // Maria completed all lessons and the course
    const allCourse1Lessons = [lesson1A1, lesson1A2, lesson1A3, lesson1A4, quizLesson1, assignmentLesson1];
    for (const lid of allCourse1Lessons) {
      await ctx.db.insert("lessonProgress", {
        enrollmentId: enrollment3, lessonId: lid, userId: learnerA2Profile,
        isCompleted: true, completedAt: oneWeekAgo - 12 * 60 * 60 * 1000,
      });
    }
    await ctx.db.patch(enrollment3, { isCompleted: true, completedAt: oneWeekAgo - 12 * 60 * 60 * 1000 });

    // Maria's quiz attempt
    const questionsQ1 = await ctx.db.query("questions").withIndex("by_quizId", q => q.eq("quizId", quiz1Id)).collect();
    await ctx.db.insert("quizAttempts", {
      quizId: quiz1Id, userId: learnerA2Profile, enrollmentId: enrollment3,
      answers: questionsQ1.map((q, i) => ({ questionId: q._id, selectedAnswer: q.correctAnswer })),
      score: 100, passed: true, startedAt: oneWeekAgo - 15 * 60 * 1000, completedAt: oneWeekAgo - 14 * 60 * 1000,
    });

    // Maria's graded assignment
    const sub1 = await ctx.db.insert("assignmentSubmissions", {
      assignmentId: (await ctx.db.query("assignments").withIndex("by_courseId", q => q.eq("courseId", course1Id)).collect())[0]._id,
      userId: learnerA2Profile, enrollmentId: enrollment3,
      content: "My leadership style is primarily affiliative. I naturally focus on building relationships and creating harmony within my team. In my previous role as a project coordinator, I found that by creating strong emotional bonds with team members, I could motivate them to achieve goals without relying on formal authority. One area I want to develop is my decisiveness — I sometimes spend too long seeking consensus when a quick decision is needed.",
      submittedAt: oneWeekAgo - 20 * 60 * 1000,
      score: 95,
      feedback: "Excellent self-awareness and practical examples. Your reflection shows genuine growth mindset. Consider also developing your visionary leadership skills to complement your natural affiliative style.",
      gradedAt: oneWeekAgo - 18 * 60 * 1000,
      gradedBy: instA1Profile,
      status: "graded",
    });

    // Maria's certificate
    await ctx.db.insert("certificates", {
      userId: learnerA2Profile, courseId: course1Id, orgId: orgAId,
      learnerName: "Maria Garcia",
      courseName: "Leadership Foundations",
      orgName: "BrightPath Academy",
      completionDate: oneWeekAgo - 12 * 60 * 60 * 1000,
      certificateId: "CERT-BP-2024-001",
      verificationCode: "VER-BP-LEADERSHIP-001",
    });

    // James enrolled in Leadership Foundations
    await ctx.db.insert("enrollments", {
      orgId: orgAId, courseId: course1Id, userId: learnerA3Profile,
      enrolledAt: oneWeekAgo - 5 * 24 * 60 * 60 * 1000, isCompleted: false,
    });

    // Ryan enrolled in Full-Stack TypeScript
    await ctx.db.insert("enrollments", {
      orgId: orgBId, courseId: course3Id, userId: learnerB1Profile,
      enrolledAt: oneWeekAgo - 4 * 24 * 60 * 60 * 1000, isCompleted: false,
    });

    // ─── Notifications ──────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: learnerA1Profile, title: "Welcome to BrightPath!",
      message: "Start your learning journey by exploring Leadership Foundations.",
      type: "system", isRead: false, createdAt: oneWeekAgo,
    });
    await ctx.db.insert("notifications", {
      userId: learnerA1Profile, title: "Quiz Passed!",
      message: "You scored 80% on the Leadership Knowledge Quiz. Great job!",
      type: "quiz", isRead: false, createdAt: oneWeekAgo - 30 * 60 * 1000,
    });
    await ctx.db.insert("notifications", {
      userId: instA1Profile, title: "New Enrollment",
      message: "Alex Johnson enrolled in Leadership Foundations",
      type: "enrollment", isRead: false, createdAt: oneWeekAgo,
    });

    return "seeded";
  },
});
