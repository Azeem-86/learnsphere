import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireOrgAdmin,
  getProfile,
  requireOrgMember,
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
      // Update if needed
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

// ─── SELECT ORG ───────────────────────────────────────────────
export const selectOrg = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

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

// ─── UPDATE PROFILE ───────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(profile._id, updates);

    if (args.name) {
      await ctx.db.patch(profile.userId, { name: args.name });
    }

    return profile._id;
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // Only super_admin should see all users; but this is a query so we
    // check on the client side. For safety, we return all for now.
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

// ─── INVITE MEMBER ────────────────────────────────────────────
// org_admin or super_admin only
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
    });

    const org = await ctx.db.get(args.orgId);
    if (org) {
      await ctx.db.insert("notifications", {
        userId: targetProfileId,
        title: "Organization Invitation",
        message: `You've been added to ${org.name} as ${args.role.replace("_", " ")}`,
        type: "system",
        isRead: false,
        link: "/dashboard",
        createdAt: Date.now(),
      });
    }

    return memberId;
  },
});

// ─── TOGGLE MEMBER ACTIVE ─────────────────────────────────────
// org_admin or super_admin only
export const toggleMemberActive = mutation({
  args: {
    memberId: v.id("orgMembers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.memberId);
    if (!membership) throw new Error("Membership not found");

    await requireOrgAdmin(ctx, membership.orgId);

    // Cannot deactivate yourself
    const profile = await requireProfile(ctx);
    if (membership.userId === profile._id) {
      throw new Error("Cannot deactivate yourself");
    }

    await ctx.db.patch(args.memberId, { isActive: args.isActive });
    return args.memberId;
  },
});

// ─── UPDATE MEMBER ROLE ───────────────────────────────────────
// org_admin or super_admin only
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
