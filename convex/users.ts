import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * Get the currently authenticated user's profile.
 * Returns null if the user hasn't created a profile yet.
 */
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId.toString()))
            .unique();
        return profile;
    },
});

/**
 * Store/update the user's profile after signup.
 * Called from the frontend after successful authentication.
 */
export const storeUser = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId.toString()))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                role: args.role,
            });
            return existing._id;
        }

        return await ctx.db.insert("userProfiles", {
            userId: userId.toString(),
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            role: args.role,
        });
    },
});
