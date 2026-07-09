export const siteConfig = {
  name: "Jewellery AI Analytics",
  shortName: "JewelAI",
  description:
    "Upload your customer Excel sheet and ask questions in plain English. Jewellery AI Analytics turns raw sales data into instant, AI-powered business insights.",
  url: "https://jewelleryai.app",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
] as const;
