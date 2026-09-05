import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type LmsRole = "super_admin" | "org_admin" | "instructor" | "learner";

export type AppUser = {
  _id: Id<"appUsers">;
  userId: Id<"users">;
  name: string;
  email: string;
  role: LmsRole;
  selectedOrgId?: Id<"organizations">;
  isActive: boolean;
  createdAt: number;
};

/** Get the current app profile. Returns null if not signed in or no profile exists. */
export async function getProfile(ctx: QueryCtx | MutationCtx): Promise<AppUser | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const profile = await ctx.db
    .query("appUsers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return profile as AppUser | null;
}

/** Require authentication and a profile. Throws if missing. */
export async function requireProfile(ctx: MutationCtx): Promise<AppUser> {
  const profile = await getProfile(ctx);
  if (!profile) throw new Error("Authentication required");
  return profile;
}

/** Require the user to have one of the given roles. Throws if not. */
export async function requireRole(
  ctx: MutationCtx,
  roles: LmsRole[]
): Promise<AppUser> {
  const profile = await requireProfile(ctx);
  if (!roles.includes(profile.role)) {
    throw new Error(`Requires role: ${roles.join(" or ")}. Your role: ${profile.role}`);
  }
  return profile;
}

/** Require the user to be a member of the given org (or super_admin). */
export async function requireOrgMember(
  ctx: MutationCtx | QueryCtx,
  orgId: Id<"organizations">
): Promise<AppUser> {
  const profile = await getProfile(ctx);
  if (!profile) throw new Error("Authentication required");
  if (profile.role === "super_admin") return profile;

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgAndUser", (q) =>
      q.eq("orgId", orgId).eq("userId", profile._id)
    )
    .unique();

  if (!member) throw new Error("Not a member of this organization");
  if (!member.isActive) throw new Error("Your membership is inactive");
  return profile;
}

/** Require org_admin or super_admin for the given org. */
export async function requireOrgAdmin(
  ctx: MutationCtx,
  orgId: Id<"organizations">
): Promise<AppUser> {
  const profile = await requireProfile(ctx);
  if (profile.role === "super_admin") return profile;
  if (profile.role !== "org_admin") throw new Error("Organization admin required");

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgAndUser", (q) =>
      q.eq("orgId", orgId).eq("userId", profile._id)
    )
    .unique();

  if (!member) throw new Error("Not a member of this organization");
  if (!member.isActive) throw new Error("Your membership is inactive");
  return profile;
}

/** Require instructor or org_admin for the given org. super_admin is NOT allowed. */
export async function requireInstructorOrAdmin(
  ctx: MutationCtx,
  orgId: Id<"organizations">
): Promise<AppUser> {
  const profile = await requireProfile(ctx);
  if (profile.role !== "instructor" && profile.role !== "org_admin") {
    throw new Error("Instructor or organization admin role required");
  }

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgAndUser", (q) =>
      q.eq("orgId", orgId).eq("userId", profile._id)
    )
    .unique();

  if (!member) throw new Error("Not a member of this organization");
  if (!member.isActive) throw new Error("Your membership is inactive");
  return profile;
}

/** Verify the user owns or manages the course. Returns the course + org. */
export async function requireCourseAccess(
  ctx: MutationCtx,
  courseId: Id<"courses">
) {
  const course = await ctx.db.get(courseId);
  if (!course) throw new Error("Course not found");

  const profile = await requireProfile(ctx);

  // Learners and super_admins cannot modify courses
  if (profile.role === "learner") {
    throw new Error("Learners cannot modify courses");
  }
  if (profile.role === "super_admin") {
    throw new Error("Super admins cannot modify courses directly");
  }

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgAndUser", (q) =>
      q.eq("orgId", course.orgId).eq("userId", profile._id)
    )
    .unique();

  if (!member || !member.isActive) throw new Error("Not authorized for this course");

  // Instructors can only edit their own courses; org_admin can edit any in their org
  if (profile.role === "instructor" && course.instructorId !== profile._id) {
    throw new Error("Instructors can only manage their own courses");
  }

  if (profile.role !== "instructor" && profile.role !== "org_admin") {
    throw new Error("Insufficient permissions to manage courses");
  }

  return { course, profile, member };
}
