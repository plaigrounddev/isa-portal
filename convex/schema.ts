import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
    ...authTables,

    travelers: defineTable({
        userId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        role: v.string(),
        dateOfBirth: v.optional(v.string()),
        gender: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        nationality: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    itineraries: defineTable({
        userId: v.string(),
        title: v.string(),
        status: v.string(),
        startDate: v.number(),
        endDate: v.number(),
    }).index("by_user", ["userId"]),

    bookings: defineTable({
        itineraryId: v.optional(v.id("itineraries")),
        userId: v.string(),
        type: v.string(),
        status: v.string(),
        price: v.number(),
        currency: v.optional(v.string()),
        flightDetails: v.optional(v.object({
            airline: v.string(),
            flightNumber: v.optional(v.string()),
            origin: v.string(),
            destination: v.string(),
            departureTime: v.optional(v.string()),
            arrivalTime: v.optional(v.string()),
        })),
        stayDetails: v.optional(v.object({
            hotelName: v.string(),
            roomType: v.optional(v.string()),
            checkIn: v.string(),
            checkOut: v.string(),
            address: v.optional(v.string()),
        })),
    }).index("by_user", ["userId"]),
});
