import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserCertificates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    return await ctx.db
      .query("certificates")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();
  },
});

export const getCertificatesByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const verifyCertificate = query({
  args: { verificationCode: v.string() },
  handler: async (ctx, args) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_verificationCode", (q) =>
        q.eq("verificationCode", args.verificationCode)
      )
      .unique();

    if (!cert) return null;

    const course = await ctx.db.get(cert.courseId);
    const org = await ctx.db.get(cert.orgId);

    return {
      ...cert,
      course,
      org,
      isValid: true,
    };
  },
});

export const verifyCertificateById = query({
  args: { certificateId: v.string() },
  handler: async (ctx, args) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_certificateId", (q) =>
        q.eq("certificateId", args.certificateId)
      )
      .unique();

    if (!cert) return null;

    return {
      ...cert,
      isValid: true,
    };
  },
});

export const getOrgCertificates = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const allCerts = [];
    for (const m of members) {
      const certs = await ctx.db
        .query("certificates")
        .withIndex("by_userId", (q) => q.eq("userId", m.userId))
        .collect();
      allCerts.push(...certs);
    }

    return allCerts;
  },
});
