// Shared marketing/site constants so links stay consistent across header, footer and pages.

/** Backend origin. Override with NEXT_PUBLIC_API_URL when pointing at another host. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.cricshub.com";

/** The landing site's single way into the product. Signed-out visitors sign in on /login first. */
export const EXPLORE_HREF = "/explore";

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=dev.cricshub.team";
export const SUPPORT_EMAIL = "support@cricshub.com";

export const SOCIAL_LINKS = [
  { name: "LinkedIn", icon: "ri-linkedin-box-fill", href: "https://www.linkedin.com/company/cricshub/about/" },
  { name: "Instagram", icon: "ri-instagram-line", href: "https://www.instagram.com/cricshubapp/" },
] as const;
