import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireOrgAdmin,
  getProfile,
} from "./helpers";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
};

export const currentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    return await getProfile(ctx);
  },
});

// ─── CREATE / REFRESH PROFILE ─────────────────────────────────
export const getOrCreateProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("org_admin"),
      v.literal("instructor"),
      v.literal("learner")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      if (existing.name !== args.name || existing.email !== args.email) {
        await ctx.db.patch(existing._id, { name: args.name, email: args.email });
      }
      return existing._id;
    }

    const profileId = await ctx.db.insert("appUsers", {
      userId,
      name: args.name,
      email: args.email,
      role: args.role,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.patch(userId, { name: args.name, email: args.email });
    return profileId;
  },
});

// ─── UPDATE PROFILE (with academic details) ───────────────────
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    institution: v.optional(v.string()),
    qualifications: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.institution !== undefined) updates.institution = args.institution;
    if (args.qualifications !== undefined) updates.qualifications = args.qualifications;
    if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth;
    if (args.address !== undefined) updates.address = args.address;

    await ctx.db.patch(profile._id, updates);

    if (args.name) {
      await ctx.db.patch(profile.userId, { name: args.name });
    }

    return profile._id;
  },
});

// ─── SELECT ORG ───────────────────────────────────────────────
export const selectOrg = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, { selectedOrgId: args.orgId });
    return profile._id;
  },
});

// ─── INVITE MEMBER (org_admin only) ──────────────────────────
export const inviteMember = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("org_admin"),
      v.literal("instructor"),
      v.literal("learner")
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireOrgAdmin(ctx, args.orgId);

    // Check if user already exists
    let existingProfile = await ctx.db
      .query("appUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    let targetProfileId;
    if (!existingProfile) {
      const authUserId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        role: args.role,
      });

      targetProfileId = await ctx.db.insert("appUsers", {
        userId: authUserId,
        name: args.name,
        email: args.email,
        role: args.role,
        isActive: true,
        createdAt: Date.now(),
      });
    } else {
      targetProfileId = existingProfile._id;
    }

    // Check if already a member
    const existingMember = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgAndUser", (q) =>
        q.eq("orgId", args.orgId).eq("userId", targetProfileId!)
      )
      .unique();

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    const memberId = await ctx.db.insert("orgMembers", {
      orgId: args.orgId,
      userId: targetProfileId,
      role: args.role,
      isActive: true,
      joinedAt: Date.now(),
      status: args.role === "learner" ? "approved" : "pending",
      invitedBy: profile._id,
    });

    const org = await ctx.db.get(args.orgId);
    if (org) {
      await ctx.db.insert("notifications", {
        userId: targetProfileId,
        title: "Organization Invitation",
        message: `You've been invited to join ${org.name} as ${args.role.replace("_", " ")}. ${args.role === "instructor" ? "Your application is pending approval." : ""}`,
        type: "system",
        isRead: false,
        link: "/dashboard",
        createdAt: Date.now(),
      });
    }

    return memberId;
  },
});

// ─── INSTRUCTOR: APPLY TO ORG ─────────────────────────────────
// Instructor candidate sees published orgs and applies
export const applyToOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    if (profile.role !== "instructor") {
      throw new Error("Only instructors can apply to organizations");
    }

    // Org must be approved
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");
    if (org.status !== "approved") {
      throw new Error("Organization is not yet approved");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgAndUser", (q) =>
        q.eq("orgId", args.orgId).eq("userId", profile._id)
      )
      .unique();

    if (existing) {
      if (existing.status === "pending") {
        throw new Error("You already have a pending application to this organization");
      }
      if (existing.status === "approved") {
        throw new Error("You are already a member of this organization");
      }
      // If rejected, allow re-application
      await ctx.db.patch(existing._id, {
        status: "pending",
        applicationMessage: args.message,
        applicationDate: Date.now(),
      });
      return existing._id;
    }

    const memberId = await ctx.db.insert("orgMembers", {
      orgId: args.orgId,
      userId: profile._id,
      role: "instructor",
      isActive: true,
      joinedAt: Date.now(),
      status: "pending",
      applicationMessage: args.message,
      applicationDate: Date.now(),
    });

    // Notify org admins
    const orgMembers = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
    const admins = orgMembers.filter(
      (m) => m.role === "org_admin" && m.status === "approved"
    );
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin.userId,
        title: "Instructor Application",
        message: `${profile.name} has applied to join ${org.name} as an instructor.`,
        type: "system",
        isRead: false,
        link: "/dashboard/members",
        createdAt: Date.now(),
      });
    }

    return memberId;
  },
});

// ─── ORG ADMIN: APPROVE/REJECT INSTRUCTOR ─────────────────────
export const approveInstructor = mutation({
  args: {
    memberId: v.id("orgMembers"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminProfile = await requireProfile(ctx);
    if (adminProfile.role !== "org_admin") {
      throw new Error("Organization admin required");
    }

    const membership = await ctx.db.get(args.memberId);
    if (!membership) throw new Error("Membership not found");
    if (membership.role !== "instructor") {
      throw new Error("Can only approve/reject instructor applications");
    }

    // Verify admin is in the same org
    const adminMember = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgAndUser", (q) =>
        q.eq("orgId", membership.orgId).eq("userId", adminProfile._id)
      )
      .unique();

    if (!adminMember || adminMember.status !== "approved" || !adminMember.isActive) {
      throw new Error("Not authorized for this organization");
    }

    await ctx.db.patch(args.memberId, {
      status: args.approved ? "approved" : "rejected",
      approvedBy: adminProfile._id,
    });

    // Notify the instructor
    const org = await ctx.db.get(membership.orgId);
    await ctx.db.insert("notifications", {
      userId: membership.userId,
      title: args.approved ? "Application Approved!" : "Application Rejected",
      message: args.approved
        ? `Congratulations! Your application to join ${org?.name ?? "the organization"} has been approved.`
        : `Your application to join ${org?.name ?? "the organization"} was not accepted.`,
      type: "system",
      isRead: false,
      link: "/dashboard",
      createdAt: Date.now(),
    });

    return args.memberId;
  },
});

// ─── ORG ADMIN: REMOVE MEMBER ─────────────────────────────────
export const removeMember = mutation({
  args: {
    memberId: v.id("orgMembers"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const membership = await ctx.db.get(args.memberId);
    if (!membership) throw new Error("Membership not found");

    if (profile.role === "org_admin") {
      const adminMember = await ctx.db
        .query("orgMembers")
        .withIndex("by_orgAndUser", (q) =>
          q.eq("orgId", membership.orgId).eq("userId", profile._id)
        )
        .unique();
      if (!adminMember || adminMember.status !== "approved" || !adminMember.isActive) {
        throw new Error("Not authorized");
      }
    } else if (profile.role !== "super_admin") {
      throw new Error("Super admin or org admin required");
    }

    // Cannot remove yourself
    if (membership.userId === profile._id) {
      throw new Error("Cannot remove yourself");
    }

    await ctx.db.delete(args.memberId);
    return args.memberId;
  },
});

// ─── TOGGLE MEMBER ACTIVE ─────────────────────────────────────
export const toggleMemberActive = mutation({
  args: {
    memberId: v.id("orgMembers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.memberId);
    if (!membership) throw new Error("Membership not found");

    const profile = await requireOrgAdmin(ctx, membership.orgId);

    if (membership.userId === profile._id) {
      throw new Error("Cannot deactivate yourself");
    }

    await ctx.db.patch(args.memberId, { isActive: args.isActive });
    return args.memberId;
  },
});

// ─── UPDATE MEMBER ROLE ───────────────────────────────────────
export const updateMemberRole = mutation({
  args: {
    memberId: v.id("orgMembers"),
    role: v.union(
      v.literal("org_admin"),
      v.literal("instructor"),
      v.literal("learner")
    ),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.memberId);
    if (!membership) throw new Error("Membership not found");

    await requireOrgAdmin(ctx, membership.orgId);

    await ctx.db.patch(args.memberId, { role: args.role });
    return args.memberId;
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appUsers").collect();
  },
});

export const getUserById = query({
  args: { userId: v.id("appUsers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getOrgMembers = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const users = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );

    return users;
  },
});

// Pending instructor applications for an org (org_admin view)
export const getPendingApplications = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const pending = members.filter((m) => m.role === "instructor" && m.status === "pending");

    return await Promise.all(
      pending.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );
  },
});

// Get instructor's applications across orgs
export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];

    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();

    return await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.orgId);
        return { ...m, org };
      })
    );
  },
});
