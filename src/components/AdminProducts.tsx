import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Edit3,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../lib/data";
import { supabase } from "../lib/supabase";

type Category = { id: string; name: string; slug: string };
type Collection = { id: string; name: string; slug: string };
type Media = {
  id: string;
  media_type: "image" | "video" | "external_video";
  storage_path: string | null;
  external_url: string | null;
  thumbnail_path: string | null;
  poster_path: string | null;
  alt_text: string | null;
  caption: string | null;
  display_order: number;
  is_primary: boolean;
  mime_type: string | null;
  file_size: number | null;
};
type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_inr: number;
  availability: string;
  product_story: string | null;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  processing_time: string | null;
  is_featured: boolean;
  is_active: boolean;
  categories?: Category | null;
  product_media?: Media[];
};
type Draft = {
  id: string;
  file: File;
  type: "image" | "video";
  alt: string;
  caption: string;
  preview: string;
  isPrimary: boolean;
};
const emptyForm = {
  name: "",
  slug: "",
  categoryId: "",
  price: "0",
  availability: "Hidden",
  description: "",
  story: "",
  materials: "",
  dimensions: "",
  care: "",
  processing: "5–7 working days",
  featured: false,
};
const asset = (path?: string | null) =>
  path && supabase
    ? supabase.storage.from("products").getPublicUrl(path).data.publicUrl
    : "/images/frame1.jpg";

export function DatabaseProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const load = async () => {
    if (!supabase) return setError("Supabase is not configured.");
    setLoading(true);
    const { data, error: e } = await supabase
      .from("products")
      .select(
        "*,categories(id,name,slug),product_media(id,media_type,storage_path,thumbnail_path,poster_path,display_order,is_primary)",
      )
      .order("created_at", { ascending: false });
    setRows((data as Product[]) || []);
    setError(e?.message || "");
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);
  const shown = rows.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const hide = async (p: Product) => {
    if (!supabase || !confirm(`Hide ${p.name}?`)) return;
    const { error: e } = await supabase
      .from("products")
      .update({ is_active: false, availability: "Hidden" })
      .eq("id", p.id);
    e ? setError(e.message) : await load();
  };
  const deleteProduct = async (product: Product) => {
    if (!supabase || deletingId) return;
    const confirmed = confirm(
      `Permanently delete “${product.name}”?\n\nThis removes the product and all of its uploaded media. This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(product.id);
    setError("");
    const [{ data: productMedia }, { data: legacyImages }] = await Promise.all([
      supabase
        .from("product_media")
        .select("storage_path,thumbnail_path,poster_path")
        .eq("product_id", product.id),
      supabase
        .from("product_images")
        .select("storage_path")
        .eq("product_id", product.id),
    ]);
    const paths = Array.from(
      new Set(
        [
          ...(productMedia || []).flatMap((item) => [
            item.storage_path,
            item.thumbnail_path,
            item.poster_path,
          ]),
          ...(legacyImages || []).map((item) => item.storage_path),
        ].filter(Boolean) as string[],
      ),
    );
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    if (deleteError) {
      setError(
        deleteError.code === "23503"
          ? "This product belongs to an existing order and cannot be permanently deleted. Use Hide to preserve the order history."
          : deleteError.message,
      );
      setDeletingId(null);
      return;
    }
    if (paths.length) {
      const { error: storageError } = await supabase.storage
        .from("products")
        .remove(paths);
      if (storageError)
        setError(
          `Product deleted, but some stored media could not be removed: ${storageError.message}`,
        );
    }
    setDeletingId(null);
    await load();
  };
  return (
    <>
      <div className="flex gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4">
          <Search size={17} />
          <input
            className="min-h-12 w-full bg-transparent outline-none"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Link className="btn" to="/admin/products/new">
          <Plus /> Add
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-blush/30 p-4 text-coral">
          {error}
        </p>
      )}
      {loading && <p className="mt-5 text-sm text-ink/50">Loading products…</p>}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shown.map((p) => {
          const cover = [...(p.product_media || [])].sort(
            (a, b) =>
              Number(b.is_primary) - Number(a.is_primary) ||
              a.display_order - b.display_order,
          )[0];
          return (
            <article className="card flex gap-4 p-4" key={p.id}>
              <img
                src={asset(
                  cover?.thumbnail_path ||
                    cover?.poster_path ||
                    cover?.storage_path,
                )}
                className="h-28 w-28 rounded-2xl object-cover"
                alt=""
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl">{p.name}</h2>
                <p className="text-xs capitalize">
                  {p.categories?.name || "Uncategorized"} · {money(p.price_inr)}{" "}
                  · {p.availability}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="tag" to={`/admin/products/${p.id}/edit`}>
                    <Edit3 size={14} /> Edit
                  </Link>
                  <Link className="tag" target="_blank" to={`/shop/${p.slug}`}>
                    <ExternalLink size={14} /> Preview
                  </Link>
                  <button
                    className="tag text-coral"
                    onClick={() => void hide(p)}
                  >
                    <Archive size={14} /> Hide
                  </button>
                  <button
                    className="tag text-coral"
                    disabled={deletingId === p.id}
                    onClick={() => void deleteProduct(p)}
                  >
                    <Trash2 size={14} />
                    {deletingId === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!loading && !shown.length && (
        <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-ink/50">
          No products found.
        </div>
      )}
    </>
  );
}

async function imageThumbnail(file: File) {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Thumbnail generation failed")),
      "image/webp",
      0.82,
    ),
  );
}

export function DatabaseProductEditor({ id }: { id?: string }) {
  const nav = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [personal, setPersonal] = useState({isPersonalised:false,photoRequired:false,instructionsRequired:false,startingPrice:false,maxPeople:"",maxPets:"",photosRequired:"",sizes:"",variants:"",instructions:""});
  const [media, setMedia] = useState<Media[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const ordered = useMemo(
    () => [...media].sort((a, b) => a.display_order - b.display_order),
    [media],
  );
  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("categories")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        const values = (data as Category[]) || [];
        setCategories(values);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || values[0]?.id || "",
        }));
      });
    void supabase.from("collections").select("id,name,slug").eq("is_active",true).order("display_order").then(({data})=>setCollections((data as Collection[])||[]));
    if (id)
      void supabase
        .from("products")
        .select("*,product_media(*)")
        .eq("id", id)
        .single()
        .then(({ data, error: e }) => {
          if (e || !data) return setError(e?.message || "Product not found.");
          setForm({
            name: data.name,
            slug: data.slug,
            categoryId: data.category_id || "",
            price: String(data.price_inr),
            availability: data.availability,
            description: data.description || "",
            story: data.product_story || "",
            materials: data.materials || "",
            dimensions: data.dimensions || "",
            care: data.care_instructions || "",
            processing: data.processing_time || "",
            featured: data.is_featured,
          });
          setMedia(
            (data.product_media || []).sort(
              (a: Media, b: Media) => a.display_order - b.display_order,
            ),
          );
          void supabase!.from("product_collections").select("collection_id").eq("product_id",id).then(({data:links})=>setSelectedCollections((links||[]).map(link=>link.collection_id)));
          void supabase!.from("product_personalisation_options").select("*").eq("product_id",id).maybeSingle().then(({data:option})=>{if(option)setPersonal({isPersonalised:option.is_personalised,photoRequired:option.customer_photo_required,instructionsRequired:option.customer_instructions_required,startingPrice:option.starting_price,maxPeople:String(option.max_people??""),maxPets:String(option.max_pets??""),photosRequired:String(option.photos_required??""),sizes:(option.available_sizes||[]).join(", "),variants:(option.available_variants||[]).join(", "),instructions:option.instructions||""})});
        });
  }, [id]);
  const set = (key: keyof typeof emptyForm, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const choose = (list: FileList | null) => {
    const additions: Draft[] = [];
    for (const file of Array.from(list || [])) {
      const image =
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size <= 10485760;
      const video =
        ["video/mp4", "video/webm"].includes(file.type) &&
        file.size <= 52428800;
      if (!image && !video) {
        setError(
          "Images must be JPG, PNG or WebP under 10 MB. Videos must be MP4 or WebM under 50 MB.",
        );
        continue;
      }
      additions.push({
        id: crypto.randomUUID(),
        file,
        type: image ? "image" : "video",
        alt: form.name,
        caption: "",
        preview: URL.createObjectURL(file),
        isPrimary: false,
      });
    }
    setDrafts((current) => {
      const next = [...current, ...additions];
      if (
        !media.some((item) => item.is_primary) &&
        !next.some((item) => item.isPrimary)
      ) {
        const first = next.find((item) => item.type === "image");
        if (first) first.isPrimary = true;
      }
      return next;
    });
  };
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setMedia((current) => {
      const next = [...current].sort(
        (a, b) => a.display_order - b.display_order,
      );
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((entry, index) => ({ ...entry, display_order: index }));
    });
  };
  const primary = (kind: "existing" | "draft", target: string) => {
    setMedia((current) =>
      current.map((item) => ({
        ...item,
        is_primary: kind === "existing" && item.id === target,
      })),
    );
    setDrafts((current) =>
      current.map((item) => ({
        ...item,
        isPrimary: kind === "draft" && item.id === target,
      })),
    );
  };
  const remove = async (item: Media) => {
    if (!supabase || !confirm("Delete this media item?")) return;
    const wasPrimary = item.is_primary;
    const { error: e } = await supabase
      .from("product_media")
      .delete()
      .eq("id", item.id);
    if (e) return setError(e.message);
    const paths = [
      item.storage_path,
      item.thumbnail_path,
      item.poster_path,
    ].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("products").remove(paths);
    const remaining = ordered
      .filter((entry) => entry.id !== item.id)
      .map((entry, index) => ({
        ...entry,
        display_order: index,
        is_primary: wasPrimary && index === 0 ? true : entry.is_primary,
      }));
    setMedia(remaining);
    if (wasPrimary && remaining[0])
      await supabase
        .from("product_media")
        .update({ is_primary: true })
        .eq("id", remaining[0].id);
  };
  const save = async (publish: boolean) => {
    if (!supabase || busy) return;
    if (!form.name.trim()) return setError("Add a product name.");
    const hasImage =
      media.some((item) => item.media_type === "image") ||
      drafts.some((item) => item.type === "image");
    const hasPrimaryImage =
      media.some((item) => item.media_type === "image" && item.is_primary) ||
      drafts.some((item) => item.type === "image" && item.isPrimary);
    if (publish && (!hasImage || !hasPrimaryImage))
      return setError(
        "Choose at least one image as the primary product cover before publishing.",
      );
    setBusy(true);
    setError("");
    setProgress(5);
    const slug = (form.slug || form.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const payload = {
      slug,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.categoryId || null,
      price_inr: Math.max(0, Number(form.price) || 0),
      availability:
        publish && form.availability === "Hidden"
          ? "In Stock"
          : form.availability,
      product_story: form.story.trim() || null,
      materials: form.materials.trim() || null,
      dimensions: form.dimensions.trim() || null,
      care_instructions: form.care.trim() || null,
      processing_time: form.processing.trim() || null,
      is_featured: form.featured,
      is_active: publish,
    };
    const result = id
      ? await supabase
          .from("products")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("id")
          .single()
      : await supabase.from("products").insert(payload).select("id").single();
    if (result.error || !result.data) {
      setError(result.error?.message || "Product could not be saved.");
      setBusy(false);
      return;
    }
    const productId = result.data.id;
    try {
      await supabase.from("product_collections").delete().eq("product_id",productId);
      if(selectedCollections.length){const{error:collectionError}=await supabase.from("product_collections").insert(selectedCollections.map(collection_id=>({product_id:productId,collection_id})));if(collectionError)throw collectionError}
      const{error:optionError}=await supabase.from("product_personalisation_options").upsert({product_id:productId,is_personalised:personal.isPersonalised,customer_photo_required:personal.photoRequired,customer_instructions_required:personal.instructionsRequired,starting_price:personal.startingPrice,max_people:Number(personal.maxPeople)||null,max_pets:Number(personal.maxPets)||null,photos_required:Number(personal.photosRequired)||null,available_sizes:personal.sizes.split(",").map(v=>v.trim()).filter(Boolean),available_variants:personal.variants.split(",").map(v=>v.trim()).filter(Boolean),instructions:personal.instructions.trim()||null,updated_at:new Date().toISOString()});if(optionError)throw optionError;
      if (media.length) {
        await supabase
          .from("product_media")
          .update({ display_order: 9999, is_primary: false })
          .eq("product_id", productId);
        for (let index = 0; index < ordered.length; index++) {
          const { error: e } = await supabase
            .from("product_media")
            .update({
              display_order: index,
              is_primary: ordered[index].is_primary,
              alt_text: ordered[index].alt_text,
              caption: ordered[index].caption,
              updated_at: new Date().toISOString(),
            })
            .eq("id", ordered[index].id);
          if (e) throw e;
        }
      }
      for (let index = 0; index < drafts.length; index++) {
        const draft = drafts[index];
        setProgress(10 + Math.round((index / Math.max(1, drafts.length)) * 80));
        const ext =
          draft.file.name.split(".").pop()?.toLowerCase() ||
          (draft.type === "image" ? "jpg" : "mp4");
        const path = `${productId}/${draft.type === "image" ? "images" : "videos"}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(path, draft.file, { contentType: draft.file.type });
        if (uploadError) throw uploadError;
        let thumbnailPath: string | null = null;
        if (draft.type === "image") {
          const thumb = await imageThumbnail(draft.file);
          thumbnailPath = `${productId}/thumbnails/${crypto.randomUUID()}.webp`;
          const { error: thumbError } = await supabase.storage
            .from("products")
            .upload(thumbnailPath, thumb, { contentType: "image/webp" });
          if (thumbError) throw thumbError;
        }
        const { error: recordError } = await supabase
          .from("product_media")
          .insert({
            product_id: productId,
            media_type: draft.type,
            storage_path: path,
            thumbnail_path: thumbnailPath,
            alt_text: draft.alt || form.name,
            caption: draft.caption || null,
            display_order: ordered.length + index,
            is_primary: draft.isPrimary,
            is_active: true,
            mime_type: draft.file.type,
            file_size: draft.file.size,
          });
        if (recordError) throw recordError;
      }
      setProgress(100);
      nav("/admin/products");
    } catch (caught) {
      setError(
        `Product saved, but media upload failed: ${caught instanceof Error ? caught.message : "Unknown error"}`,
      );
      setBusy(false);
    }
  };
  const field = (label: string, key: keyof typeof emptyForm, type = "text") => (
    <label>
      <span className="label">{label}</span>
      <input
        className="field"
        type={type}
        value={String(form[key])}
        onChange={(event) => set(key, event.target.value)}
      />
    </label>
  );
  return (
    <form
      onSubmit={(event: FormEvent) => event.preventDefault()}
      className="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      <section className="card grid gap-5 p-6 md:grid-cols-2">
        {field("Product name", "name")}
        <label>
          <span className="label">Category</span>
          <select
            className="field"
            value={form.categoryId}
            onChange={(event) => set("categoryId", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {field("Slug", "slug")}
        {field("Price", "price", "number")}
        {field("Short description", "description")}
        {field("Product story", "story")}
        {field("Materials", "materials")}
        {field("Dimensions", "dimensions")}
        {field("Care", "care")}
        {field("Processing time", "processing")}
        <label>
          <span className="label">Availability</span>
          <select
            className="field"
            value={form.availability}
            onChange={(event) => set("availability", event.target.value)}
          >
            {["In Stock", "Made to Order", "Sold Out", "Hidden"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => set("featured", event.target.checked)}
          />{" "}
          Featured
        </label>
        <div className="md:col-span-2 rounded-2xl bg-cream p-5"><span className="label">Also show this product in</span><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{collections.map(collection=><label className="flex items-center gap-2 text-sm" key={collection.id}><input type="checkbox" checked={selectedCollections.includes(collection.id)} onChange={event=>setSelectedCollections(current=>event.target.checked?[...current,collection.id]:current.filter(value=>value!==collection.id))}/>{collection.name}</label>)}</div></div>
        <div className="md:col-span-2 rounded-2xl border p-5"><span className="label">Personalisation</span><div className="mt-3 grid gap-3 md:grid-cols-3">{[["isPersonalised","This is a personalised product"],["photoRequired","Customer photo required"],["instructionsRequired","Customer instructions required"],["startingPrice","Display as starting price"]].map(([key,label])=><label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={Boolean(personal[key as keyof typeof personal])} onChange={event=>setPersonal(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}</div>{personal.isPersonalised&&<div className="mt-5 grid gap-4 md:grid-cols-3"><label><span className="label">Maximum people</span><input className="field" type="number" value={personal.maxPeople} onChange={event=>setPersonal({...personal,maxPeople:event.target.value})}/></label><label><span className="label">Maximum pets</span><input className="field" type="number" value={personal.maxPets} onChange={event=>setPersonal({...personal,maxPets:event.target.value})}/></label><label><span className="label">Photos required</span><input className="field" type="number" value={personal.photosRequired} onChange={event=>setPersonal({...personal,photosRequired:event.target.value})}/></label><label><span className="label">Available sizes (comma separated)</span><input className="field" value={personal.sizes} onChange={event=>setPersonal({...personal,sizes:event.target.value})}/></label><label><span className="label">Available variants (comma separated)</span><input className="field" value={personal.variants} onChange={event=>setPersonal({...personal,variants:event.target.value})}/></label><label className="md:col-span-3"><span className="label">Personalisation instructions</span><textarea className="field min-h-24" value={personal.instructions} onChange={event=>setPersonal({...personal,instructions:event.target.value})}/></label></div>}</div>
        <div className="md:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="label">Product Media</span>
              <p className="text-sm text-ink/55">
                Upload images and videos. Drag existing media to reorder and
                select an image as the cover.
              </p>
            </div>
            <label className="tag cursor-pointer">
              <Plus size={15} /> Add media
              <input
                className="hidden"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={(event) => choose(event.target.files)}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3">
            {ordered.map((item, index) => (
              <div
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", String(index))
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event: DragEvent) =>
                  reorder(
                    Number(event.dataTransfer.getData("text/plain")),
                    index,
                  )
                }
                key={item.id}
                className="grid items-center gap-3 rounded-2xl border bg-cream p-3 sm:grid-cols-[24px_90px_1fr_auto]"
              >
                <GripVertical className="cursor-grab text-ink/35" />
                <MediaPreview item={item} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="field !min-h-9"
                    placeholder="Alt text"
                    value={item.alt_text || ""}
                    onChange={(event) =>
                      setMedia((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, alt_text: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                  <input
                    className="field !min-h-9"
                    placeholder="Optional caption"
                    value={item.caption || ""}
                    onChange={(event) =>
                      setMedia((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, caption: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex gap-2">
                  {item.media_type === "image" && (
                    <button
                      type="button"
                      className={`tag ${item.is_primary ? "active" : ""}`}
                      onClick={() => primary("existing", item.id)}
                      aria-label="Set as primary cover"
                    >
                      <Star
                        size={15}
                        fill={item.is_primary ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    className="tag text-coral"
                    onClick={() => void remove(item)}
                    aria-label="Delete media"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
            {drafts.map((item, index) => (
              <div
                key={item.id}
                className="grid items-center gap-3 rounded-2xl border border-dashed bg-cream p-3 sm:grid-cols-[90px_1fr_auto]"
              >
                <DraftPreview item={item} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="field !min-h-9"
                    placeholder="Alt text"
                    value={item.alt}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, alt: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                  <input
                    className="field !min-h-9"
                    placeholder="Optional caption"
                    value={item.caption}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, caption: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex gap-2">
                  {item.type === "image" && (
                    <button
                      type="button"
                      className={`tag ${item.isPrimary ? "active" : ""}`}
                      onClick={() => primary("draft", item.id)}
                      aria-label="Set as primary cover"
                    >
                      <Star
                        size={15}
                        fill={item.isPrimary ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    className="tag text-coral"
                    onClick={() =>
                      setDrafts((current) =>
                        current.filter((entry) => entry.id !== item.id),
                      )
                    }
                    aria-label="Remove selected file"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!ordered.length && !drafts.length && (
            <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-ink/50">
              <ImageIcon className="mx-auto mb-2" />
              Add at least one product image.
            </div>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="md:col-span-2 rounded-2xl bg-blush/30 p-4 text-coral"
          >
            {error}
          </p>
        )}
      </section>
      <aside className="card h-fit p-6">
        <h2 className="text-3xl">Publish</h2>
        {busy && (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-wine/10">
              <div
                className="h-full bg-wine"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs">Uploading… {progress}%</p>
          </div>
        )}
        <button
          type="button"
          disabled={busy}
          className="tag mt-6 w-full"
          onClick={() => void save(false)}
        >
          {busy ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="btn mt-3 w-full"
          onClick={() => void save(true)}
        >
          {busy ? "Saving…" : id ? "Update Product" : "Publish Product"}
        </button>
        <button
          type="button"
          className="mt-4 w-full underline"
          onClick={() => nav("/admin/products")}
        >
          Cancel
        </button>
      </aside>
    </form>
  );
}

function MediaPreview({ item }: { item: Media }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
      {item.media_type === "video" ? (
        <>
          <video
            src={asset(item.storage_path)}
            className="h-full w-full object-cover"
            preload="metadata"
          />
          <Play className="absolute inset-0 m-auto text-white" />
        </>
      ) : (
        <img
          src={asset(item.thumbnail_path || item.storage_path)}
          className="h-full w-full object-cover"
          alt=""
        />
      )}
    </div>
  );
}
function DraftPreview({ item }: { item: Draft }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white">
      {item.type === "video" ? (
        <>
          <video
            src={item.preview}
            className="h-full w-full object-cover"
            muted
          />
          <Play className="absolute inset-0 m-auto text-white" />
        </>
      ) : (
        <img src={item.preview} className="h-full w-full object-cover" alt="" />
      )}
    </div>
  );
}
