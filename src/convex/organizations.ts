import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireOrgAdmin,
  requireSuperAdmin,
  getProfile,
} from "./helpers";

// ─── CREATE ORG (request approval) ────────────────────────────
// org_admin creates → status = "pending" → super_admin approves
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    if (profile.role !== "org_admin" && profile.role !== "super_admin") {
      throw new Error("Only administrators can create organization requests");
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
      status: "pending",
      createdBy: profile._id,
      createdAt: Date.now(),
    });

    // Add creator as org_admin member (pending until org is approved)
    await ctx.db.insert("orgMembers", {
      orgId,
      userId: profile._id,
      role: "org_admin",
      isActive: true,
      joinedAt: Date.now(),
      status: "approved", // org_admin is auto-approved within their org
    });

    await ctx.db.patch(profile._id, { selectedOrgId: orgId });

    // Notify super admins
    const superAdmins = await ctx.db
      .query("appUsers")
      .withIndex("by_role", (q) => q.eq("role", "super_admin"))
      .collect();
    for (const sa of superAdmins) {
      await ctx.db.insert("notifications", {
        userId: sa._id,
        title: "New Organization Request",
        message: `"${args.name}" has requested to join LearnSphere. Review and approve.`,
        type: "system",
        isRead: false,
        link: "/dashboard/organizations",
        createdAt: Date.now(),
      });
    }

    return orgId;
  },
});

// ─── APPROVE ORG ──────────────────────────────────────────────
// Only super_admin can approve
export const approveOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const sa = await requireSuperAdmin(ctx);

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.orgId, {
      status: args.approved ? "approved" : "rejected",
      isActive: args.approved,
    });

    // Notify org creator
    await ctx.db.insert("notifications", {
      userId: org.createdBy,
      title: args.approved ? "Organization Approved!" : "Organization Rejected",
      message: args.approved
        ? `"${org.name}" has been approved and is now live.`
        : `"${org.name}" was not approved. Please review and resubmit.`,
      type: "system",
      isRead: false,
      link: "/dashboard/organizations",
      createdAt: Date.now(),
    });

    return args.orgId;
  },
});

// ─── UPDATE ORG ───────────────────────────────────────────────
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

// ─── DELETE ORG ───────────────────────────────────────────────
export const deleteOrganization = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const sa = await requireSuperAdmin(ctx);

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    // Remove all members
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);

    await ctx.db.delete(args.orgId);
    return args.orgId;
  },
});

// ─── QUERIES ──────────────────────────────────────────────────

// All orgs — super admin only
export const getAllOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

// Approved orgs — public (for learners to browse courses)
export const getApprovedOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
  },
});

// Pending orgs — super admin
export const getPendingOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
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

    let totalCertificates = 0;
    for (const m of members) {
      const certs = await ctx.db
        .query("certificates")
        .withIndex("by_userId", (q) => q.eq("userId", m.userId))
        .collect();
      totalCertificates += certs.length;
    }

    const instructors = members.filter((m) => m.role === "instructor" && m.status === "approved").length;
    const learners = members.filter((m) => m.role === "learner").length;
    const pendingApplications = members.filter((m) => m.role === "instructor" && m.status === "pending").length;
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
      pendingApplications,
    };
  },
});
