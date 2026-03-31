const domain = process.env.CONVEX_SITE_URL
    ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL
    ?? "https://blessed-chickadee-405.convex.site";

export default {
    providers: [
        {
            domain,
            applicationID: "convex",
        },
    ],
};
