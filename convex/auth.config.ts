const domain = process.env.CONVEX_SITE_URL
    ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL
    ?? "https://outgoing-tortoise-912.convex.site";

export default {
    providers: [
        {
            domain,
            applicationID: "convex",
        },
    ],
};
