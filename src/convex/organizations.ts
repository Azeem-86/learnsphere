import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireOrgAdmin,
  requireOrgMember,
  getProfile,
} from "./helpers";

// ─── CREATE ORG ───────────────────────────────────────────────
// Only super_admin or any authenticated user (first org = becomes org_admin)
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    // Only super_admin can create orgs (learners/instructors join existing ones)
    if (profile.role !== "super_admin" && profile.role !== "org_admin") {
      throw new Error("Only administrators can create organizations");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Organization slug already taken");

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      website: args.website,
      isActive: true,
      createdBy: profile._id,
      createdAt: Date.now(),
    });

    // Add creator as org_admin member
    await ctx.db.insert("orgMembers", {
      orgId,
      userId: profile._id,
      role: "org_admin",
      isActive: true,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(profile._id, { selectedOrgId: orgId });
    return orgId;
  },
});

// ─── UPDATE ORG ───────────────────────────────────────────────
// Only org_admin or super_admin of the org
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.orgId);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.website !== undefined) updates.website = args.website;

    await ctx.db.patch(args.orgId, updates);
    return args.orgId;
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

export const getAllOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const getOrganization = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});

export const getUserOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];

    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.orgId);
        return { ...m, org };
      })
    );

    return orgs.filter((o) => o.org !== null);
  },
});

export const getOrgStats = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Count certificates for this org
    let totalCertificates = 0;
    for (const m of members) {
      const certs = await ctx.db
        .query("certificates")
        .withIndex("by_userId", (q) => q.eq("userId", m.userId))
        .collect();
      totalCertificates += certs.length;
    }

    const instructors = members.filter((m) => m.role === "instructor").length;
    const learners = members.filter((m) => m.role === "learner").length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const completedEnrollments = enrollments.filter((e) => e.isCompleted).length;
    const completionRate =
      enrollments.length > 0
        ? Math.round((completedEnrollments / enrollments.length) * 100)
        : 0;

    return {
      totalMembers: members.length,
      totalInstructors: instructors,
      totalLearners: learners,
      totalCourses: courses.length,
      publishedCourses,
      totalEnrollments: enrollments.length,
      completedEnrollments,
      completionRate,
      totalCertificates,
    };
  },
});
