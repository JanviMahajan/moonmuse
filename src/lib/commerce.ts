export type ShopCategory = "ashtrays" | "totes" | "keychains" | "paintings" | "frames" | "frame-templates";
export type ProductMedia = { id: string; type: "image" | "video" | "external_video"; url: string; thumbnailUrl?: string; posterUrl?: string; alt: string; caption: string; isPrimary: boolean };
export type ShopProduct = {
  id: string; slug: string; title: string; category: ShopCategory; price: number;
  availability: "In Stock" | "Made to Order" | "Sold Out" | "Hidden";
  badge: "Handmade" | "Made to Order" | "Editable Template";
  description: string; story: string; materials: string; dimensions: string;
  care: string; processingTime: string; images: string[]; featured: boolean;
  stock: number | null; createdAt: string; photoSlots?: number; media?: ProductMedia[];
};
export type CartItem = { id: string; productId: string; quantity: number; unitPrice: number; title: string; image: string; options?: Record<string,string>; preview?: string };
export const productStoreKey = "moonmuse-shop-products";
export const cartStoreKey = "moonmuse-cart";
export const categories: Array<[string, ShopCategory | "all"]> = [["All","all"],["Ashtrays","ashtrays"],["Tote Bags","totes"],["Keychains","keychains"],["Paintings","paintings"],["Frames","frames"],["Frame Templates","frame-templates"]];
export const seedProducts: ShopProduct[] = [
  { id:"tote-stargirl",slug:"stargirl-painted-tote",title:"Stargirl Painted Tote",category:"totes",price:499,availability:"Made to Order",badge:"Made to Order",description:"A hand-painted cream tote made to carry a little colour everywhere.",story:"Painted slowly by Janvi, one brushstroke at a time.",materials:"Cotton canvas, fabric paint",dimensions:"Standard tote size",care:"Spot clean gently. Do not machine wash.",processingTime:"5–7 working days",images:["/images/tote1.jpg","/images/tote2.jpg"],featured:true,stock:null,createdAt:"2026-08-26" },
  { id:"frame-blue",slug:"blue-gingham-memory-frame",title:"Blue Gingham Memory Frame",category:"frames",price:350,availability:"Made to Order",badge:"Handmade",description:"A layered scrapbook-style frame for photographs and tiny memories.",story:"Cut, arranged and finished by hand in the MoonMuse studio.",materials:"Paper, board, glass and frame",dimensions:"5 × 7 inches",care:"Keep dry and dust with a soft cloth.",processingTime:"5–7 working days",images:["/images/frame1.jpg","/images/frame2.jpg"],featured:true,stock:null,createdAt:"2026-08-25" },
  { id:"template-friends",slug:"best-friends-memory-frame-6-photos",title:"Best Friends Memory Frame — 6 Photos",category:"frame-templates",price:350,availability:"Made to Order",badge:"Editable Template",description:"Personalise Janvi’s finished frame design using six protected photo slots and permitted text fields.",story:"The artwork and layout remain locked while your own memories make it personal.",materials:"Printed artwork, board, glass and frame",dimensions:"5 × 7 or 9 × 12 inches",care:"Keep dry and dust with a soft cloth.",processingTime:"5–7 working days",images:["/images/frame2.jpg"],featured:true,stock:null,createdAt:"2026-09-01",photoSlots:6 },
];
export function readProducts(): ShopProduct[] { try { const value=JSON.parse(localStorage.getItem(productStoreKey)||"null"); return Array.isArray(value)?value:seedProducts; } catch { return seedProducts; } }
export function writeProducts(value: ShopProduct[]) { localStorage.setItem(productStoreKey,JSON.stringify(value)); window.dispatchEvent(new Event("moonmuse-products")); }

export async function fetchPublishedProducts(): Promise<ShopProduct[]> {
  if (!supabase) return seedProducts;
  const client = supabase;
  const { data, error } = await client.from("products")
    .select("id,slug,name,description,price_inr,sale_price_inr,availability,product_story,materials,dimensions,care_instructions,processing_time,is_featured,created_at,categories(slug),product_media(id,media_type,storage_path,external_url,thumbnail_path,poster_path,alt_text,caption,display_order,is_primary)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Could not load published products", { message: error.message });
    return seedProducts;
  }
  const databaseProducts = (data || []).map((row: any): ShopProduct | null => {
    const category = row.categories?.slug as ShopCategory | undefined;
    const media: ProductMedia[] = (row.product_media || [])
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((item: any) => ({ id: item.id, type: item.media_type, url: item.external_url || client.storage.from("products").getPublicUrl(item.storage_path).data.publicUrl, thumbnailUrl: item.thumbnail_path ? client.storage.from("products").getPublicUrl(item.thumbnail_path).data.publicUrl : undefined, posterUrl: item.poster_path ? client.storage.from("products").getPublicUrl(item.poster_path).data.publicUrl : undefined, alt: item.alt_text || row.name, caption: item.caption || "", isPrimary: item.is_primary }));
    const orderedMedia = [...media].sort((a,b) => Number(b.isPrimary)-Number(a.isPrimary));
    const images = orderedMedia.filter((item) => item.type === "image").map((item) => item.url);
    if (!category || !orderedMedia.length || !images.length) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.name,
      category,
      price: row.sale_price_inr ?? row.price_inr,
      availability: row.availability,
      badge: category === "frame-templates" ? "Editable Template" : row.availability === "Made to Order" ? "Made to Order" : "Handmade",
      description: row.description || "A handmade MoonMuse creation.",
      story: row.product_story || row.description || "Made thoughtfully in the MoonMuse studio.",
      materials: row.materials || "Contact Janvi for details",
      dimensions: row.dimensions || "Contact Janvi for details",
      care: row.care_instructions || "Handle with care.",
      processingTime: row.processing_time || "5–7 working days",
      images,
      media: orderedMedia,
      featured: Boolean(row.is_featured),
      stock: null,
      createdAt: row.created_at,
    };
  }).filter(Boolean) as ShopProduct[];
  const databaseSlugs = new Set(databaseProducts.map((product) => product.slug));
  return [...databaseProducts, ...seedProducts.filter((product) => !databaseSlugs.has(product.slug))];
}

export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>(seedProducts);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; void fetchPublishedProducts().then((values) => { if (active) { setProducts(values); setLoading(false); } }); return () => { active = false; }; }, []);
  return { products, loading };
}
export function readCart(): CartItem[] { try { const value=JSON.parse(localStorage.getItem(cartStoreKey)||"[]"); return Array.isArray(value)?value:[]; } catch { return []; } }
export function writeCart(value: CartItem[]) { localStorage.setItem(cartStoreKey,JSON.stringify(value)); window.dispatchEvent(new Event("moonmuse-cart")); }
export function addToCart(product: ShopProduct, options?: Record<string,string>, preview?: string) { const cart=readCart(); const key=`${product.id}-${JSON.stringify(options||{})}`; const found=cart.find((item)=>item.id===key); if(found && product.category!=="frame-templates") found.quantity+=1; else cart.push({id:key,productId:product.id,quantity:1,unitPrice:product.price,title:product.title,image:product.images[0],options,preview}); writeCart(cart); }
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
