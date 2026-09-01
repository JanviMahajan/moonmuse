import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { frameSizes, money, products, styles } from "../lib/data";
import { supabase } from "../lib/supabase";

type Product = "frame" | "tote";
type Brief = {
  fullName: string; email: string; whatsapp: string; product: Product;
  frameSize: string; frameColour: string;
  occasion: string; recipientName: string; importantDate: string;
  message: string; colours: string; style: string; instructions: string;
};

const blank: Brief = {
  fullName: "", email: "", whatsapp: "", product: "frame",
  frameSize: "small", frameColour: "black",
  occasion: "", recipientName: "", importantDate: "", message: "",
  colours: "", style: styles[0], instructions: "",
};

const makeOrderId = () => `MM${Math.floor(1000 + Math.random() * 9000)}`;

export function DesignRequestFlow() {
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState(blank);
  const [photos, setPhotos] = useState<File[]>([]);
  const [references, setReferences] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const product = products.find((item) => item.id === brief.product)!;
  const selectedFrame = frameSizes.find((item) => item.id === brief.frameSize) || frameSizes[0];
  const price = brief.product === "frame" ? selectedFrame.price : brief.product === "tote" ? product.price : 0;
  const option = brief.product === "frame"
    ? `${selectedFrame.name} · ${brief.frameColour} frame`
    : "One standard size";
  const valid = useMemo(() => brief.fullName.trim() && /^\S+@\S+\.\S+$/.test(brief.email) && brief.whatsapp.trim() && brief.instructions.trim(), [brief]);
  const set = (key: keyof Brief, value: string) => setBrief((old) => ({ ...old, [key]: value }));

  const files = (list: FileList | null, kind: "photos" | "references") => {
    const next = Array.from(list || []);
    const invalid = next.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalid) return setError("Please use JPG, PNG or WebP images under 10 MB each.");
    setError("");
    kind === "photos" ? setPhotos(next) : setReferences(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return setError("Please complete your name, email, WhatsApp number and design instructions.");
    setBusy(true); setError("");
    try {
      let id = makeOrderId();
      if (supabase) {
        const body = new FormData();
        Object.entries({ ...brief, selectedOption: option, price }).forEach(([key, value]) => body.append(key, String(value)));
        photos.forEach((file) => body.append("photos", file));
        references.forEach((file) => body.append("references", file));
        const { data, error: requestError } = await supabase.functions.invoke("submit-design-request", { body });
        if (requestError) throw requestError;
        id = data.orderId;
      } else {
        const requests = JSON.parse(localStorage.getItem("moonmuse-design-requests") || "[]");
        requests.unshift({ ...brief, orderId: id, selectedOption: option, price, status: "New Request", createdAt: new Date().toISOString(), photoNames: photos.map((f) => f.name), referenceNames: references.map((f) => f.name) });
        localStorage.setItem("moonmuse-design-requests", JSON.stringify(requests));
        localStorage.setItem("moonmuse-order", JSON.stringify({ id, status: 0, updated: "Your design request has reached Janvi's studio." }));
      }
      setOrderId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit your request. Please try again.");
    } finally { setBusy(false); }
  };

  if (orderId) return (
    <section className="section text-center">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage text-white"><Check /></span>
        <p className="label mt-6">Design request received</p>
        <h1 className="text-5xl">Janvi has your story.</h1>
        <p className="mt-4">Your order ID is <b>{orderId}</b>. A preview will be emailed to you for approval.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="btn" to="/status">Track request</Link>
          <a className="btn-light !bg-blush !text-wine" target="_blank" rel="noreferrer" href={`https://wa.me/${import.meta.env.VITE_OWNER_WHATSAPP || "919999999999"}?text=${encodeURIComponent(`Hi Janvi, my MoonMuse design request is ${orderId}.`)}`}>Chat on WhatsApp</a>
        </div>
      </div>
    </section>
  );

  return (
    <section className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[.72fr_1.28fr]">
      <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
        <img src="/images/tote4.jpg" className="absolute inset-0 h-full w-full object-cover" alt="MoonMuse creative studio" />
        <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-wine/95 p-7 text-cream">
          <p className="hand text-2xl text-blush">personally made by Janvi</p>
          <h1 className="text-5xl">Design It for Me</h1>
          <p className="mt-3 text-sm text-cream/75">Share your photographs, story and ideas with me. I’ll personally create your MoonMuse design and email you a preview for approval.</p>
          <p className="mt-4 border-t border-white/15 pt-4 text-xs text-cream/65">Every Design It for Me order is personally designed by Janvi. No AI-generated designs are used.</p>
        </div>
      </div>
      <form className="bg-cream p-7 md:p-12" onSubmit={submit}>
        <div className="mb-9 flex gap-2" aria-label={`Step ${step} of 4`}>
          {[1,2,3,4].map((number) => <span key={number} className={`h-2 flex-1 rounded-full ${number <= step ? "bg-wine" : "bg-wine/10"}`} />)}
        </div>
        {step === 1 && <ProductStep brief={brief} set={set} />}
        {step === 2 && <BriefStep brief={brief} set={set} photos={photos} references={references} files={files} />}
        {step === 3 && <ContactStep brief={brief} set={set} />}
        {step === 4 && <Summary brief={brief} productName={product.name} option={option} price={price} photos={photos} references={references} />}
        {error && <p role="alert" className="mt-5 rounded-2xl bg-coral/10 p-4 text-sm text-wine">{error}</p>}
        <div className="mt-8 flex justify-between gap-3">
          {step > 1 ? <button type="button" className="tag" onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Back</button> : <span />}
          {step < 4 ? <button type="button" className="btn" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16}/></button> : <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit Design Request"}</button>}
        </div>
      </form>
    </section>
  );
}

function ProductStep({ brief, set }: { brief: Brief; set: (key: keyof Brief, value: string) => void }) {
  return <div><p className="label">Step 1 · Product</p><h2 className="mb-7 text-5xl">What shall I make?</h2>
    <div className="grid gap-3 md:grid-cols-3">{products.map((product) => <button type="button" key={product.id} onClick={() => set("product", product.id)} className={`card overflow-hidden text-left ${brief.product === product.id ? "ring-2 ring-wine" : ""}`}><img src={product.image} className="h-32 w-full object-cover" alt=""/><div className="p-4"><b>{product.name}</b><small className="block text-ink/55">{product.priceLabel}</small></div></button>)}</div>
    {brief.product === "frame" && <div className="mt-7 grid gap-4 md:grid-cols-2"><Choice label="Frame size" value={brief.frameSize} setValue={(v) => set("frameSize", v)} options={frameSizes.map((s) => [s.id, `${s.name} · ${s.dimensions} · ${money(s.price)}`])}/><Choice label="Frame colour" value={brief.frameColour} setValue={(v) => set("frameColour", v)} options={[["black","Black"],["white","White"]]}/></div>}
    {brief.product === "tote" && <p className="mt-7 rounded-2xl bg-white p-5"><b>One standard size · ₹499 + shipping</b></p>}
  </div>;
}
function BriefStep({ brief, set, photos, references, files }: { brief: Brief; set: (key: keyof Brief, value: string) => void; photos: File[]; references: File[]; files: (list: FileList | null, kind: "photos" | "references") => void }) {
  return <div><p className="label">Step 2 · Your story</p><h2 className="mb-7 text-5xl">Tell me everything.</h2><div className="grid gap-5 md:grid-cols-2">
    <Input label="Occasion" value={brief.occasion} onChange={(v)=>set("occasion",v)}/><Input label="Recipient’s name" value={brief.recipientName} onChange={(v)=>set("recipientName",v)}/><Input label="Important date" type="date" value={brief.importantDate} onChange={(v)=>set("importantDate",v)}/><Input label="Quote or personal message" value={brief.message} onChange={(v)=>set("message",v)}/><Input label="Preferred colours" value={brief.colours} onChange={(v)=>set("colours",v)}/><Choice label="Style preference" value={brief.style} setValue={(v)=>set("style",v)} options={styles.map((s)=>[s,s])}/>
    <label className="md:col-span-2"><span className="label">Detailed design instructions *</span><textarea required className="field min-h-28" value={brief.instructions} onChange={(e)=>set("instructions",e.target.value)} placeholder="The feeling, favourite details, inside jokes and anything I should know…"/></label>
    <UploadBox label="Customer photographs" count={photos.length} onChange={(list)=>files(list,"photos")}/><UploadBox label="Optional reference images" count={references.length} onChange={(list)=>files(list,"references")}/>
  </div></div>;
}
function ContactStep({ brief, set }: { brief: Brief; set: (key: keyof Brief, value: string) => void }) { return <div><p className="label">Step 3 · Contact</p><h2 className="mb-7 text-5xl">Where should I send your preview?</h2><div className="grid gap-5 md:grid-cols-2"><Input label="Full name *" value={brief.fullName} onChange={(v)=>set("fullName",v)}/><Input label="Email address *" type="email" value={brief.email} onChange={(v)=>set("email",v)}/><Input label="WhatsApp number *" type="tel" value={brief.whatsapp} onChange={(v)=>set("whatsapp",v)}/></div><p className="mt-6 rounded-2xl bg-blush/20 p-5 text-sm text-ink/65">Your photographs remain private and are used only to create your requested MoonMuse design.</p></div> }
function Summary({ brief, productName, option, price, photos, references }: { brief: Brief; productName: string; option: string; price: number; photos: File[]; references: File[] }) { return <div><p className="label">Step 4 · Review</p><h2 className="mb-7 text-5xl">Your design request.</h2><div className="rounded-[2rem] bg-wine p-7 text-cream"><Row name="Product" value={productName}/><Row name="Options" value={option}/><Row name="Price" value={price ? `${money(price)} + shipping` : "Free · no shipping"}/><Row name="For" value={brief.recipientName || "Not specified"}/><Row name="Style" value={brief.style}/><Row name="Uploads" value={`${photos.length} photographs · ${references.length} references`}/><div className="mt-5 border-t border-white/15 pt-5"><small className="text-cream/55">Instructions</small><p>{brief.instructions}</p></div></div></div> }
function Row({ name, value }: { name: string; value: string }) { return <p className="flex justify-between gap-5 border-b border-white/10 py-3 text-sm"><span className="text-cream/60">{name}</span><b className="text-right">{value}</b></p> }
function Input({ label, value, onChange, type="text" }: { label: string; value: string; onChange:(v:string)=>void; type?:string }) { return <label><span className="label">{label}</span><input className="field" type={type} value={value} onChange={(e)=>onChange(e.target.value)}/></label> }
function Choice({ label, value, setValue, options }: { label:string; value:string; setValue:(v:string)=>void; options:string[][] }) { return <label><span className="label">{label}</span><select className="field" value={value} onChange={(e)=>setValue(e.target.value)}>{options.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label> }
function UploadBox({ label, count, onChange }: { label:string; count:number; onChange:(list:FileList|null)=>void }) { return <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-wine/30 bg-white p-5"><Upload/><span><b>{label}</b><small className="block text-ink/50">{count ? `${count} selected` : "JPG, PNG or WebP · up to 10 MB each"}</small></span><input className="hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e)=>onChange(e.target.files)}/></label> }
