import { useMemo, useState } from "react";
import { ArrowRight, MessageCircle, Search, ShoppingBag } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { PageHero } from "./Layout";
import {
  addToCart,
  categories,
  ShopProduct,
  useShopProducts,
} from "../lib/commerce";
import { money } from "../lib/data";
import { ProductMediaGallery } from "./ProductMediaGallery";
import { PersonalisationForm } from "./PersonalisedGifts";

export function ShopCatalogue() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const active = params.get("category") || "all";
  const { products, loading } = useShopProducts();
  const shown = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.availability !== "Hidden" &&
            (active === "all" || p.category === active) &&
            `${p.title} ${p.description}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : sort === "new"
                ? b.createdAt.localeCompare(a.createdAt)
                : Number(b.featured) - Number(a.featured),
        ),
    [products, active, query, sort],
  );
  return (
    <>
      <PageHero
        eyebrow="The collection"
        title="Choose your canvas."
        text="Handmade art, personalised keepsakes and editable memory-frame templates—created to hold a feeling."
      />
      <section className="section">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map(([name, id]) => (
            <button
              key={id}
              className={`tag min-h-11 shrink-0 ${active === id ? "active" : ""}`}
              onClick={() => setParams(id === "all" ? {} : { category: id })}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="mb-9 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-2">
            <Search size={18} />
            <input
              className="w-full bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search MoonMuse pieces"
            />
          </label>
          <select
            className="field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured first</option>
            <option value="new">Newest</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
        {loading ? (
          <div className="rounded-[2rem] bg-white p-12 text-center text-xl">
            Loading the collection…
          </div>
        ) : shown.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-12 text-center text-xl">
            Janvi is creating something for this collection ✦ Check back soon.
          </div>
        )}
      </section>
    </>
  );
}
function ProductCard({ product: p }: { product: ShopProduct }) {
  const template = p.category === "frame-templates";
  return (
    <article className="card overflow-hidden">
      <Link to={`/shop/${p.slug}`}>
        <img
          src={p.images[0]}
          className="h-72 w-full object-cover"
          alt={p.title}
        />
      </Link>
      <div className="p-6">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="label">
            {categories.find(([, id]) => id === p.category)?.[0]}
          </span>
          <span className="rounded-full bg-blush/25 px-3 py-1 text-xs text-wine">
            {p.badge}
          </span>
        </div>
        <h2 className="mt-2 text-3xl">{p.title}</h2>
        <p className="mt-2 text-sm text-ink/60">{p.description}</p>
        {template && (
          <p className="mt-3 text-xs font-semibold">
            {p.photoSlots} editable photo slots
          </p>
        )}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <b>
              {template ? "From " : ""}
              {money(p.price)}
            </b>
            <small className="block text-ink/45">{p.availability}</small>
          </div>
          <Link
            className="btn !px-5 !py-2.5"
            to={template ? `/templates/${p.slug}/options` : `/shop/${p.slug}`}
          >
            {template ? "Customize Frame" : "View Product"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductDetails() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { products, loading } = useShopProducts();
  const p = products.find(
    (item) => item.slug === slug && item.availability !== "Hidden",
  );
  const [qty, setQty] = useState(1);
  if (loading)
    return (
      <section className="section text-center">
        <h1 className="text-5xl">Loading this piece…</h1>
      </section>
    );
  if (!p)
    return (
      <section className="section text-center">
        <h1 className="text-5xl">This piece isn’t available.</h1>
        <Link className="btn mt-6" to="/shop">
          Back to Shop
        </Link>
      </section>
    );
  const add = () => {
    for (let i = 0; i < qty; i++) addToCart(p);
    nav("/cart");
  };
  const msg = encodeURIComponent(
    `Hi Janvi! I would like to ask about ${p.title}: ${location.href}`,
  );
  const media =
    p.media ||
    p.images.map((url, index) => ({
      id: `legacy-${index}`,
      type: "image" as const,
      url,
      thumbnailUrl: url,
      alt: `${p.title} ${index + 1}`,
      caption: "",
      isPrimary: index === 0,
    }));
  return (
    <>
      <PageHero
        eyebrow={p.badge}
        title={p.title}
        text={p.description}
        image={false}
      />
      <section className="section grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <ProductMediaGallery media={media} productName={p.title} />
        <aside className="self-start lg:sticky lg:top-24">
          <p className="label">
            {categories.find(([, id]) => id === p.category)?.[0]}
          </p>
          <h1 className="text-5xl">{p.title}</h1>
          <p className="mt-4 text-2xl font-semibold text-wine">
            {money(p.price)}
          </p>
          <span className="mt-3 inline-block rounded-full bg-blush/25 px-4 py-2 text-sm">
            {p.availability}
          </span>
          <p className="mt-7 leading-7 text-ink/70">{p.story}</p>
          <dl className="my-7 space-y-3 border-y border-wine/10 py-6 text-sm">
            <Info n="Materials" v={p.materials} />
            <Info n="Dimensions" v={p.dimensions} />
            <Info n="Care" v={p.care} />
            <Info n="Processing" v={p.processingTime} />
          </dl>
          <p className="rounded-2xl bg-lilac/20 p-4 text-sm">
            Every MoonMuse piece is made by hand, so tiny variations make your
            piece beautifully unique.
          </p>
          {p.availability !== "Sold Out" && (
            <div className="mt-7 flex items-center gap-3">
              <label className="label">
                Quantity{" "}
                <input
                  className="field mt-1 w-24"
                  type="number"
                  min="1"
                  max={p.stock || 10}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, +e.target.value))}
                />
              </label>
              <button className="btn mt-5" onClick={add}>
                <ShoppingBag size={17} /> Add to Cart
              </button>
            </div>
          )}
          <div className="mt-3 flex gap-3">
            <button
              disabled={p.availability === "Sold Out"}
              className="btn-light !bg-blush !text-wine"
              onClick={add}
            >
              Buy Now
            </button>
            <a
              className="tag min-h-11"
              href={`https://wa.me/${import.meta.env.VITE_OWNER_WHATSAPP || "919999999999"}?text=${msg}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Ask Janvi
            </a>
          </div>
        </aside>
      </section>
      {p.personalisation?.isPersonalised && (
        <div className="section pt-0">
          <PersonalisationForm product={p} />
        </div>
      )}
    </>
  );
}
function Info({ n, v }: { n: string; v: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-ink/50">{n}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
