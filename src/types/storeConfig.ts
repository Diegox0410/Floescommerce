export type SocialKey = "instagram" | "facebook" | "tiktok";
export type HomeSectionType = "hero" | "categories" | "featured-products" | "brand-statement" | "campaign" | "best-sellers" | "benefits" | "social";
export interface NavItem { id: string; label: string; href: string; enabled: boolean; sortOrder: number }
export interface SocialLink { enabled: boolean; url: string; handle?: string }
export interface HomeSection { id: string; type: HomeSectionType; enabled: boolean; sortOrder: number; title?: string; description?: string; limit?: number }
export interface StoreConfig {
  identity: { name: string; shortName: string; tagline: string; logo: string; favicon?: string; colors: { primary: string; secondary: string; accent: string; background: string } };
  contact: { whatsapp: string; whatsappMessage: string; email: string; city: string; country: string };
  social: Record<SocialKey, SocialLink>;
  commerce: { currency: string; country: string; shippingEnabled: boolean; shippingText: string; shippingMode: "pending" | "fixed"; shippingCost: number; whatsappPurchaseEnabled: boolean; webCheckoutEnabled: boolean; paymentMethods: { transfer: boolean; cash: boolean } };
  seo: { siteTitle: string; siteDescription: string; keywords: string };
  announcement: { enabled: boolean; text: string; linkText: string; href: string };
  navigation: NavItem[];
  home: {
    sections: HomeSection[];
    hero: { enabled: boolean; eyebrow: string; title: string; description: string; primaryButtonLabel: string; primaryButtonHref: string; secondaryButtonLabel?: string; secondaryButtonHref?: string; image: string; mobileImage?: string };
    brandStory: { eyebrow: string; title: string; description: string; image: string; imageAlt: string; buttonLabel: string; buttonHref: string };
    campaign: { enabled: boolean; eyebrow: string; title: string; description: string; image: string; buttonLabel: string; buttonHref: string };
    benefits: { id: string; title: string; description: string; iconKey: string; enabled: boolean }[];
  };
}
