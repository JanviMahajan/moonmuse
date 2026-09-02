import { FormEvent, useMemo, useState } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { readCart, writeCart } from "../lib/commerce";
import { money } from "../lib/data";
import { supabase } from "../lib/supabase";

type Confirmation = { orderId: string; trackingToken?: string; confirmationMessage?: string; emailStatus?: { owner: "sent" | "failed"; customer: "sent" | "failed" } };
const confirmationKey = (id: string) => `moonmuse-confirmation-${id}`;

export function CartPage() {
  const [cart, setCart] = useState(readCart);
  const update = (id: string, delta: number) => { const next = cart.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item); setCart(next); writeCart(next); };
  const remove = (id: string) => { const next = cart.filter((item) => item.id !== id); setCart(next); writeCart(next); };
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return <section className="section"><p className="label">Your bag</p><h1 className="text-6xl">Pieces you chose.</h1>{!cart.length ? <div className="mt-8 rounded-3xl bg-white p-10 text-center"><p>Your cart is empty.</p><Link className="btn mt-5" to="/shop">Shop Handmade</Link></div> : <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_360px]"><div className="space-y-4">{cart.map((item) => <article key={item.id} className="card flex gap-5 p-4"><img src={item.preview || item.image} className="h-28 w-28 rounded-2xl object-cover" alt=""/><div className="flex-1"><h2 className="text-2xl">{item.title}</h2>{item.options && <p className="text-xs capitalize text-ink/55">{Object.values(item.options).join(" · ")}</p>}<b className="mt-2 block">{money(item.unitPrice)}</b><div className="mt-3 flex items-center gap-3"><button aria-label="Decrease quantity" onClick={() => update(item.id, -1)}><Minus size={16}/></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => update(item.id, 1)}><Plus size={16}/></button><button className="ml-auto text-coral" aria-label="Remove" onClick={() => remove(item.id)}><Trash2 size={17}/></button></div></div></article>)}</div><aside className="h-fit rounded-[2rem] bg-wine p-7 text-cream"><p className="label !text-blush">Cart summary</p><p className="mt-6 flex justify-between"><span>Subtotal</span><b>{money(total)}</b></p><p className="mt-2 flex justify-between text-sm text-cream/60"><span>Delivery</span><span>Confirmed on WhatsApp</span></p><p className="mt-6 border-t border-white/15 pt-5 text-xs text-cream/60">Janvi will confirm the delivery charge and final total on WhatsApp before payment.</p><Link className="btn-light mt-7 w-full" to="/checkout">Proceed to Checkout</Link><Link className="mt-4 block text-center text-sm underline" to="/shop">Continue shopping</Link></aside></div>}</section>;
}

export function CheckoutPage() {
  const cart = readCart(); const nav = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const idempotencyKey = useMemo(() => { const existing = sessionStorage.getItem("moonmuse-checkout-idempotency"); if (existing) return existing; const value = crypto.randomUUID(); sessionStorage.setItem("moonmuse-checkout-idempotency", value); return value; }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return; if (!supabase) return setError("Ordering is temporarily unavailable. Please contact Janvi.");
    setBusy(true); setError(""); const customer = Object.fromEntries(new FormData(event.currentTarget));
    const items = cart.map((item) => ({ productId: item.productId, title: item.title, unitPrice: item.unitPrice, quantity: item.quantity, options: item.options || {}, previewPath: item.preview && !item.preview.startsWith("data:") ? item.preview : undefined }));
    const { data, error: functionError } = await supabase.functions.invoke("create-order", { body: { customer, items, idempotencyKey }, headers: { "x-idempotency-key": idempotencyKey } });
    if (functionError || !data?.orderId) { setError(data?.error || functionError?.message || "We could not submit the order. No payment was taken."); setBusy(false); return; }
    const confirmation = data as Confirmation; localStorage.setItem(confirmationKey(confirmation.orderId), JSON.stringify(confirmation));
    if (confirmation.trackingToken) localStorage.setItem("moonmuse-latest-tracking-token", confirmation.trackingToken);
    sessionStorage.removeItem("moonmuse-checkout-idempotency"); writeCart([]); nav(`/order-confirmation/${confirmation.orderId}`);
  };
  if (!cart.length) return <section className="section text-center"><h1 className="text-5xl">Your cart is empty.</h1><Link className="btn mt-5" to="/shop">Visit Shop</Link></section>;
  return <section className="section grid gap-8 lg:grid-cols-[1fr_400px]"><form onSubmit={submit} className="grid gap-5 rounded-[2rem] bg-white p-7 md:grid-cols-2"><div className="md:col-span-2"><p className="label">Checkout</p><h1 className="text-5xl">Delivery details.</h1></div>{[["fullName","Full name","text"],["email","Email address","email"],["whatsapp","WhatsApp number with country code","tel"],["address","Address","text"],["city","City","text"],["state","State","text"],["pinCode","PIN code","text"]].map(([name,label,type]) => <label key={name} className={name === "address" ? "md:col-span-2" : ""}><span className="label">{label}</span><input required name={name} type={type} className="field" autoComplete={name === "email" ? "email" : undefined}/></label>)}<label className="md:col-span-2"><span className="label">Optional delivery note</span><textarea name="note" className="field min-h-24"/></label>{error && <p role="alert" className="md:col-span-2 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p>}<button disabled={busy} className="btn md:col-span-2">{busy ? "Submitting securely…" : "Submit Order"}</button></form><aside className="rounded-[2rem] bg-wine p-7 text-cream"><p className="label !text-blush">Order summary</p>{cart.map((item) => <div key={item.id} className="flex gap-3 border-b border-white/10 py-4"><img src={item.preview || item.image} className="h-16 w-16 rounded-xl object-cover" alt=""/><div className="flex-1"><b>{item.title}</b><p className="text-xs text-cream/55">Qty {item.quantity}</p></div><b>{money(item.unitPrice * item.quantity)}</b></div>)}<p className="mt-5 flex justify-between text-lg"><span>Subtotal</span><b>{money(total)}</b></p><p className="mt-4 text-xs text-cream/60">Delivery and final total will be confirmed on WhatsApp. No payment is recorded yet.</p></aside></section>;
}

export function OrderConfirmation() {
  const { orderId = "" } = useParams(); let confirmation: Confirmation | null = null;
  try { confirmation = JSON.parse(localStorage.getItem(confirmationKey(orderId)) || "null"); } catch { /* no local confirmation */ }
  const token = confirmation?.trackingToken || localStorage.getItem("moonmuse-latest-tracking-token") || ""; const emailFailed = confirmation?.emailStatus?.customer === "failed";
  return <section className="section text-center"><div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage text-white"><Check/></span><p className="label mt-6">Order received</p><h1 className="text-5xl">Thank you!</h1><p className="mt-4">{confirmation?.confirmationMessage || "Your order is safely with Janvi. Please save your order ID."}</p><p className="mt-5 rounded-2xl bg-blush/20 p-4"><span className="label">Order ID</span><b className="font-serif text-3xl">{orderId}</b></p>{emailFailed && <p className="mt-4 text-sm text-coral">We could not send the confirmation email. Your order is still saved.</p>}<Link className="btn mt-7" to={token ? `/track-order?token=${encodeURIComponent(token)}` : "/track-order"}>Track Order</Link></div></section>;
}
