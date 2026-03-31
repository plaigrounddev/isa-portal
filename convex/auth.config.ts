const domain = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
if (!domain) {
    throw new Error("Missing CONVEX_SITE_URL or NEXT_PUBLIC_CONVEX_SITE_URL environment variable for auth config.");
}

export default {
    providers: [
        {
            domain,
            applicationID: "convex",
        },
    ],
};
