import { FormEvent, useEffect, useState } from "react";
import { Archive, Edit3, ExternalLink, Plus, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../lib/data";
import { supabase } from "../lib/supabase";

type Category = { id: string; name: string; slug: string };
type ProductImage = { id: string; storage_path: string; alt_text: string | null; display_order: number };
type Product = {
  id: string; slug: string; name: string; description: string | null; category_id: string | null;
  price_inr: number; availability: string; product_story: string | null; materials: string | null;
  dimensions: string | null; care_instructions: string | null; processing_time: string | null;
  is_featured: boolean; is_active: boolean; categories?: Category | null; product_images?: ProductImage[];
};

const publicImage = (path?: string) => path && supabase
  ? supabase.storage.from("products").getPublicUrl(path).data.publicUrl
  : "/images/frame1.jpg";

export function DatabaseProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!supabase) return setError("Supabase is not configured.");
    setLoading(true);
    const { data, error: loadError } = await supabase.from("products")
      .select("*,categories(id,name,slug),product_images(id,storage_path,alt_text,display_order)")
      .order("created_at", { ascending: false });
    setRows((data as Product[]) || []);
    setError(loadError?.message || "");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  const shown = rows.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
  const hide = async (product: Product) => {
    if (!supabase || !confirm(`Hide ${product.name}?`)) return;
    const { error: updateError } = await supabase.from("products").update({ is_active: false, availability: "Hidden" }).eq("id", product.id);
    if (updateError) setError(updateError.message); else await load();
  };

  return <>
    <div className="flex gap-3">
      <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4"><Search size={17}/><input className="min-h-12 w-full bg-transparent outline-none" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
      <Link className="btn" to="/admin/products/new"><Plus/> Add</Link>
    </div>
    {error && <p role="alert" className="mt-5 rounded-2xl bg-blush/30 p-4 text-coral">{error}</p>}
    {loading && <p className="mt-5 text-sm text-ink/50">Loading products…</p>}
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{shown.map((product) => <article className="card flex gap-4 p-4" key={product.id}>
      <img src={publicImage(product.product_images?.sort((a,b) => a.display_order-b.display_order)[0]?.storage_path)} className="h-28 w-28 rounded-2xl object-cover" alt=""/>
      <div className="min-w-0 flex-1"><h2 className="truncate text-2xl">{product.name}</h2><p className="text-xs capitalize">{product.categories?.name || "Uncategorized"} · {money(product.price_inr)} · {product.availability}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Link className="tag" to={`/admin/products/${product.id}/edit`}><Edit3 size={14}/> Edit</Link><Link className="tag" target="_blank" to={`/shop/${product.slug}`}><ExternalLink size={14}/> Preview</Link><button className="tag text-coral" onClick={() => void hide(product)}><Archive size={14}/> Hide</button></div>
      </div>
    </article>)}</div>
    {!loading && !shown.length && <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-ink/50">No products found.</div>}
  </>;
}

const emptyForm = { name: "", slug: "", categoryId: "", price: "0", availability: "Hidden", description: "", story: "", materials: "", dimensions: "", care: "", processing: "5–7 working days", featured: false };

export function DatabaseProductEditor({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    void supabase.from("categories").select("id,name,slug").eq("is_active", true).order("display_order").then(({ data }) => {
      const values = (data as Category[]) || [];
      setCategories(values);
      setForm((current) => ({ ...current, categoryId: current.categoryId || values[0]?.id || "" }));
    });
    if (id) void supabase.from("products").select("*,product_images(id,storage_path,alt_text,display_order)").eq("id", id).single().then(({ data, error: loadError }) => {
      if (loadError || !data) return setError(loadError?.message || "Product not found.");
      setForm({ name: data.name, slug: data.slug, categoryId: data.category_id || "", price: String(data.price_inr), availability: data.availability, description: data.description || "", story: data.product_story || "", materials: data.materials || "", dimensions: data.dimensions || "", care: data.care_instructions || "", processing: data.processing_time || "", featured: data.is_featured });
      setExistingImages(data.product_images || []);
    });
  }, [id]);

  const set = (key: keyof typeof emptyForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const chooseFiles = (selected: FileList | null) => {
    const valid = Array.from(selected || []).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 10485760);
    if (valid.length !== (selected?.length || 0)) setError("Use only JPG, PNG or WebP images under 10 MB.");
    setFiles((current) => [...current, ...valid]);
  };

  const save = async (publish: boolean) => {
    if (!supabase || busy) return;
    if (!form.name.trim()) return setError("Add a product name.");
    if (!existingImages.length && !files.length) return setError("Add at least one product image.");
    setBusy(true); setError("");
    const slug = (form.slug || form.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = { slug, name: form.name.trim(), description: form.description.trim() || null, category_id: form.categoryId || null, price_inr: Math.max(0, Number(form.price) || 0), availability: publish && form.availability === "Hidden" ? "In Stock" : form.availability, product_story: form.story.trim() || null, materials: form.materials.trim() || null, dimensions: form.dimensions.trim() || null, care_instructions: form.care.trim() || null, processing_time: form.processing.trim() || null, is_featured: form.featured, is_active: publish };
    const result = id
      ? await supabase.from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    if (result.error || !result.data) { setError(result.error?.message || "Product could not be saved."); setBusy(false); return; }
    const productId = result.data.id;
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${productId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setError(`Product saved, but an image failed: ${uploadError.message}`); setBusy(false); return; }
      const { error: imageError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: form.name.trim(), display_order: existingImages.length + index });
      if (imageError) { setError(`Product saved, but its image record failed: ${imageError.message}`); setBusy(false); return; }
    }
    navigate("/admin/products");
  };

  const removeExisting = async (image: ProductImage) => {
    if (!supabase || !confirm("Remove this image?")) return;
    const { error: deleteError } = await supabase.from("product_images").delete().eq("id", image.id);
    if (deleteError) return setError(deleteError.message);
    await supabase.storage.from("products").remove([image.storage_path]);
    setExistingImages((current) => current.filter((item) => item.id !== image.id));
  };

  const field = (label: string, key: keyof typeof emptyForm, type = "text") => <label><span className="label">{label}</span><input className="field" type={type} value={String(form[key])} onChange={(event) => set(key, event.target.value)}/></label>;
  return <form onSubmit={(event: FormEvent) => event.preventDefault()} className="grid gap-6 xl:grid-cols-[1fr_320px]">
    <section className="card grid gap-5 p-6 md:grid-cols-2">
      {field("Product name", "name")}<label><span className="label">Category</span><select className="field" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      {field("Slug", "slug")}{field("Price", "price", "number")}{field("Short description", "description")}{field("Product story", "story")}{field("Materials", "materials")}{field("Dimensions", "dimensions")}{field("Care", "care")}{field("Processing time", "processing")}
      <label><span className="label">Availability</span><select className="field" value={form.availability} onChange={(event) => set("availability", event.target.value)}>{["In Stock", "Made to Order", "Sold Out", "Hidden"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => set("featured", event.target.checked)}/> Featured</label>
      <label className="md:col-span-2"><span className="label">Images</span><input className="field" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFiles(event.target.files)}/><div className="mt-3 flex flex-wrap gap-3">
        {existingImages.map((image) => <div className="relative" key={image.id}><img src={publicImage(image.storage_path)} className="h-24 w-24 rounded-xl object-cover" alt=""/><button type="button" aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-wine p-1 text-white" onClick={() => void removeExisting(image)}><X size={13}/></button></div>)}
        {files.map((file, index) => <div className="relative" key={`${file.name}-${index}`}><img src={URL.createObjectURL(file)} className="h-24 w-24 rounded-xl object-cover" alt=""/><button type="button" aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-wine p-1 text-white" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={13}/></button></div>)}
      </div></label>
      {error && <p role="alert" className="md:col-span-2 rounded-2xl bg-blush/30 p-4 text-coral">{error}</p>}
    </section>
    <aside className="card h-fit p-6"><h2 className="text-3xl">Publish</h2><button type="button" disabled={busy} className="tag mt-6 w-full" onClick={() => void save(false)}>{busy ? "Saving…" : "Save Draft"}</button><button type="button" disabled={busy} className="btn mt-3 w-full" onClick={() => void save(true)}>{busy ? "Saving…" : id ? "Update Product" : "Publish Product"}</button><button type="button" className="mt-4 w-full underline" onClick={() => navigate("/admin/products")}>Cancel</button></aside>
  </form>;
}
