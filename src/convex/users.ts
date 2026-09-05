import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

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
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile;
  },
});

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

    if (existing) return existing._id;

    const profileId = await ctx.db.insert("appUsers", {
      userId,
      name: args.name,
      email: args.email,
      role: args.role,
      isActive: true,
      createdAt: Date.now(),
    });

    // Update the auth user's name too
    await ctx.db.patch(userId, { name: args.name, email: args.email });

    return profileId;
  },
});

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

    // Verify membership
    const member = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgAndUser", (q) =>
        q.eq("orgId", args.orgId).eq("userId", profile._id)
      )
      .unique();

    if (!member) throw new Error("Not a member of this organization");

    await ctx.db.patch(profile._id, { selectedOrgId: args.orgId });
    return profile._id;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(profile._id, updates);

    if (args.name) {
      await ctx.db.patch(userId, { name: args.name });
    }

    return profile._id;
  },
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");
    if (profile.role !== "super_admin" && profile.role !== "org_admin") {
      throw new Error("Not authorized");
    }

    // Check if user already exists in the system
    let existingProfile = await ctx.db
      .query("appUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    let targetProfileId: typeof existingProfile extends null ? never : string;
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
        q.eq("orgId", args.orgId).eq("userId", targetProfileId as any)
      )
      .unique();

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    const memberId = await ctx.db.insert("orgMembers", {
      orgId: args.orgId,
      userId: targetProfileId as any,
      role: args.role,
      isActive: true,
      joinedAt: Date.now(),
    });

    // Notify the new member
    const org = await ctx.db.get(args.orgId);
    if (org) {
      await ctx.db.insert("notifications", {
        userId: targetProfileId as any,
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

export const toggleMemberActive = mutation({
  args: {
    memberId: v.id("orgMembers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.memberId, { isActive: args.isActive });
    return args.memberId;
  },
});

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
    await ctx.db.patch(args.memberId, { role: args.role });
    return args.memberId;
  },
});
