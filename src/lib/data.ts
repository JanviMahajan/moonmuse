export const studioImage = "/images/moonmuse-studio.png";
export const pricingKey = "moonmuse-pricing";
export const pricingDefaults = { frameSmall: 350, frameMedium: 550, tote: 499 };
export const getPricing = () => {
  try {
    return {
      ...pricingDefaults,
      ...JSON.parse(localStorage.getItem(pricingKey) || "{}"),
    };
  } catch {
    return pricingDefaults;
  }
};
const pricing = typeof window === "undefined" ? pricingDefaults : getPricing();
export type ProductId = "frame" | "tote" | "wallpaper";
export type Product = {
  id: ProductId;
  name: string;
  short: string;
  price: number;
  priceLabel: string;
  crop: string;
  image: string;
};
export const products: Product[] = [
  {
    id: "frame",
    name: "Memory Frames",
    short: "Layered stories, framed by hand.",
    price: pricing.frameSmall,
    priceLabel: `From ₹${pricing.frameSmall} + shipping`,
    crop: "object-center",
    image: "/images/frame1.jpg",
  },
  {
    id: "tote",
    name: "Painted Tote",
    short: "A little art to carry everywhere.",
    price: pricing.tote,
    priceLabel: `From ₹${pricing.tote} + shipping`,
    crop: "object-center",
    image: "/images/tote1.jpg",
  },
];
export const frameSizes = [
  {
    id: "small",
    name: "Small Frame",
    dimensions: "5 × 7 inches",
    price: pricing.frameSmall,
    canvas: { width: 500, height: 700 },
  },
  {
    id: "medium",
    name: "Medium Frame",
    dimensions: "9 × 12 inches (A4)",
    price: pricing.frameMedium,
    canvas: { width: 600, height: 800 },
  },
] as const;
export const frameColours = [
  { id: "black", name: "Black", colour: "#171417" },
  { id: "white", name: "White", colour: "#fffdf8" },
] as const;
export const styles = [
  "Scrapbook",
  "Doodle Fun",
  "Wine Romance",
  "Soft Botanical",
  "Blue Check",
];
export const wallpaperPresets = [
  {
    id: "mobile",
    name: "Mobile",
    dimensions: "1080 × 1920",
    width: 1080,
    height: 1920,
    note: "Portrait ratio",
  },
  {
    id: "desktop",
    name: "Laptop/Desktop",
    dimensions: "1920 × 1080",
    width: 1920,
    height: 1080,
    note: "Landscape ratio",
  },
  {
    id: "tablet",
    name: "Tablet",
    dimensions: "1536 × 2048",
    width: 1536,
    height: 2048,
    note: "Portrait ratio",
  },
] as const;
export const statuses = [
  "Request Received",
  "Confirmed",
  "Creating",
  "Dispatched",
  "Delivered",
];
export const money = (n: number) =>
  n === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);
