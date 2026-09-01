export type ShopCategory = "ashtrays" | "totes" | "keychains" | "paintings" | "frames" | "frame-templates";
export type ShopProduct = {
  id: string; slug: string; title: string; category: ShopCategory; price: number;
  availability: "In Stock" | "Made to Order" | "Sold Out" | "Hidden";
  badge: "Handmade" | "Made to Order" | "Editable Template";
  description: string; story: string; materials: string; dimensions: string;
  care: string; processingTime: string; images: string[]; featured: boolean;
  stock: number | null; createdAt: string; photoSlots?: number;
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
export function readCart(): CartItem[] { try { const value=JSON.parse(localStorage.getItem(cartStoreKey)||"[]"); return Array.isArray(value)?value:[]; } catch { return []; } }
export function writeCart(value: CartItem[]) { localStorage.setItem(cartStoreKey,JSON.stringify(value)); window.dispatchEvent(new Event("moonmuse-cart")); }
export function addToCart(product: ShopProduct, options?: Record<string,string>, preview?: string) { const cart=readCart(); const key=`${product.id}-${JSON.stringify(options||{})}`; const found=cart.find((item)=>item.id===key); if(found && product.category!=="frame-templates") found.quantity+=1; else cart.push({id:key,productId:product.id,quantity:1,unitPrice:product.price,title:product.title,image:product.images[0],options,preview}); writeCart(cart); }

