import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  Archive,
  Bell,
  Boxes,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  categories as categoryOptions,
  readProducts,
  ShopCategory,
  ShopProduct,
  writeProducts,
} from "../lib/commerce";
import { money } from "../lib/data";
import { supabase } from "../lib/supabase";
import { DatabaseProductEditor, DatabaseProducts } from "./AdminProducts";

type Order = {
  id: string;
  status?: number | string;
  createdAt?: string;
  subtotal?: number;
  paymentStatus?: string;
  customer?: Record<string, unknown>;
  items?: Array<{ title: string; quantity: number; image: string }>;
};
const navItems = [
  ["Overview", "/admin/dashboard", LayoutDashboard],
  ["Orders", "/admin/orders", ShoppingBag],
  ["Products", "/admin/products", Package],
  ["Categories", "/admin/categories", Tags],
  ["Prices", "/admin/prices", Boxes],
  ["Settings", "/admin/settings", Settings],
  ["Email", "/admin/settings/email", Mail],
] as const;
const readOrders = (): Order[] => {
  try {
    const v = JSON.parse(localStorage.getItem("moonmuse-shop-orders") || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export function OwnerDesignRequests() {
  const { pathname, search } = useLocation();
  const [access, setAccess] = useState<
    "checking" | "anonymous" | "owner" | "denied"
  >(supabase ? "checking" : "anonymous");
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const checkOwner = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setAccess("anonymous");
        return;
      }
      const { data: p } = await client
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!active) return;
      setAccess(p?.role === "owner" ? "owner" : "denied");
    };
    void checkOwner();
    const { data } = client.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      )
        void checkOwner();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  if (access === "checking")
    return (
      <div className="grid min-h-screen place-items-center bg-wine text-cream">
        Opening owner studio…
      </div>
    );
  if (access === "anonymous") {
    if (pathname === "/admin/forgot-password") return <ForgotPassword />;
    if (pathname !== "/admin/login")
      return (
        <Navigate
          replace
          to={`/admin/login?next=${encodeURIComponent(pathname + search)}`}
        />
      );
    return <Login />;
  }
  if (access === "denied") return <AccessDenied />;
  return <Router />;
}
function Router() {
  const { pathname } = useLocation();
  let page: ReactNode = <Overview />;
  let title = "Overview";
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password"
  )
    return <Redirect />;
  if (pathname === "/admin/products/new") {
    page = <DatabaseProductEditor />;
    title = "Add Product";
  } else if (/^\/admin\/products\/[^/]+\/edit/.test(pathname)) {
    page = <DatabaseProductEditor id={pathname.split("/")[3]} />;
    title = "Edit Product";
  } else if (pathname.startsWith("/admin/products")) {
    page = <DatabaseProducts />;
    title = "Products";
  } else if (pathname.startsWith("/admin/categories")) {
    page = <Categories />;
    title = "Categories";
  } else if (pathname.startsWith("/admin/orders/")) {
    page = <OrderDetails id={pathname.split("/")[3]} />;
    title = "Order Details";
  } else if (pathname.startsWith("/admin/orders")) {
    page = <Orders />;
    title = "Orders";
  } else if (pathname.startsWith("/admin/prices")) {
    page = <Prices />;
    title = "Prices & Inventory";
  } else if (pathname === "/admin/settings/email") {
    page = <EmailSettings />;
    title = "Email Diagnostics";
  } else if (pathname.startsWith("/admin/settings")) {
    page = <OwnerSettings />;
    title = "Settings";
  }
  return <Shell title={title}>{page}</Shell>;
}
function Redirect() {
  const nav = useNavigate();
  useEffect(() => nav("/admin/dashboard", { replace: true }), []);
  return null;
}
function Shell({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const logout = async () => {
    localStorage.removeItem("moonmuse-owner-settings");
    await supabase?.auth.signOut();
    nav("/admin/login", { replace: true });
  };
  return (
    <div className="min-h-screen bg-[#efe9e1] md:grid md:grid-cols-[250px_1fr]">
      <aside
        className={`${open ? "fixed inset-0 z-[70] block" : "hidden"} bg-wine p-5 text-cream md:sticky md:top-0 md:block md:h-screen`}
      >
        <div className="flex justify-between">
          <Link to="/" className="font-serif text-2xl">
            ☾ MoonMuse
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <p className="mb-8 mt-1 text-xs text-cream/50">
          Private owner dashboard
        </p>
        <nav className="space-y-1">
          {navItems.map(([name, path, Icon]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${pathname === path || pathname.startsWith(`${path}/`) ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-50 flex min-h-20 items-center justify-between border-b border-wine/10 bg-cream/95 px-5">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu />
            </button>
            <div>
              <p className="label">Owner studio</p>
              <h1 className="text-3xl">{title}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link className="btn !px-4 !py-2" to="/admin/products/new">
              <Plus size={16} />
              <span className="hidden sm:inline">Quick Add</span>
            </Link>
            <button className="rounded-full border p-2.5">
              <Bell size={18} />
            </button>
            <button
              aria-label="Log out"
              className="rounded-full border p-2.5"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function Overview() {
  const products = readProducts();
  const [orders, setOrders] = useState<any[]>([]);
  const [warnings, setWarnings] = useState(0);
  useEffect(() => {
    supabase
      ?.from("orders")
      .select("id,order_number,full_name,email,status,subtotal,created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setOrders(data || []));
    supabase
      ?.from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setWarnings(count || 0));
  }, []);
  const cards = [
    ["New Orders", orders.filter((o) => o.status === "New Request").length],
    [
      "Awaiting Confirmation",
      orders.filter((o) => o.status === "Awaiting Confirmation").length,
    ],
    [
      "Products in Stock",
      products.filter((p) => p.availability === "In Stock").length,
    ],
    [
      "Sold-Out Products",
      products.filter((p) => p.availability === "Sold Out").length,
    ],
    ["Email / Admin Warnings", warnings],
    ["Total Customers", new Set(orders.map((o) => o.email)).size],
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([n, v]) => (
          <div className="card p-5" key={n}>
            <b className="font-serif text-4xl">{v}</b>
            <p className="text-sm text-ink/55">{n}</p>
          </div>
        ))}
      </div>
      <section className="card mt-7 p-6">
        <div className="flex justify-between">
          <h2 className="text-3xl">Recent orders</h2>
          <Link className="underline" to="/admin/orders">
            View all
          </Link>
        </div>
        {orders.slice(0, 5).map((o) => (
          <div className="mt-4 flex justify-between border-t pt-4" key={o.id}>
            <div>
              <b>{o.order_number}</b>
              <p className="text-xs">
                {o.full_name} · {money(o.subtotal || 0)}
              </p>
            </div>
            <Link className="tag" to={`/admin/orders/${o.id}`}>
              Open
            </Link>
          </div>
        ))}
        {!orders.length && <Empty text="No orders yet." />}
      </section>
    </>
  );
}
function Products() {
  const [rows, setRows] = useState(readProducts);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const shown = rows.filter(
    (p) =>
      (filter === "all" ||
        p.category === filter ||
        p.availability === filter) &&
      p.title.toLowerCase().includes(q.toLowerCase()),
  );
  const save = (v: ShopProduct[]) => {
    setRows(v);
    writeProducts(v);
  };
  return (
    <>
      <div className="flex gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4">
          <Search size={17} />
          <input
            className="min-h-12 w-full bg-transparent outline-none"
            placeholder="Search products"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Link className="btn" to="/admin/products/new">
          <Plus /> Add
        </Link>
      </div>
      <div className="my-5 flex gap-2 overflow-x-auto">
        {[
          ["All", "all"],
          ...categoryOptions.slice(1),
          ["Sold Out", "Sold Out"],
          ["Hidden", "Hidden"],
        ].map(([n, id]) => (
          <button
            key={id}
            className={`tag shrink-0 ${filter === id ? "active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((p) => (
          <article className="card flex gap-4 p-4" key={p.id}>
            <img
              src={p.images[0]}
              className="h-28 w-28 rounded-2xl object-cover"
              alt=""
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl">{p.title}</h2>
              <p className="text-xs capitalize">
                {p.category} · {money(p.price)} · {p.availability}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="tag" to={`/admin/products/${p.id}/edit`}>
                  <Edit3 size={14} /> Edit
                </Link>
                <button
                  className="tag"
                  onClick={() =>
                    save([
                      {
                        ...p,
                        id: `${p.id}-${Date.now()}`,
                        slug: `${p.slug}-copy-${Date.now()}`,
                        title: `${p.title} Copy`,
                        availability: "Hidden",
                      },
                      ...rows,
                    ])
                  }
                >
                  <Copy size={14} /> Duplicate
                </button>
                <Link className="tag" target="_blank" to={`/shop/${p.slug}`}>
                  <ExternalLink size={14} /> Preview
                </Link>
                <button
                  className="tag text-coral"
                  onClick={() =>
                    confirm(`Hide ${p.title}?`) &&
                    save(
                      rows.map((x) =>
                        x.id === p.id ? { ...x, availability: "Hidden" } : x,
                      ),
                    )
                  }
                >
                  <Archive size={14} /> Hide
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && <Empty text="No products match this filter." />}
    </>
  );
}

function ProductEditor({ id }: { id?: string }) {
  const nav = useNavigate();
  const old = readProducts().find((p) => p.id === id);
  const [f, setF] = useState<ShopProduct>(
    old || {
      id: `product-${Date.now()}`,
      slug: "",
      title: "",
      category: "ashtrays",
      price: 0,
      availability: "Hidden",
      badge: "Handmade",
      description: "",
      story: "",
      materials: "",
      dimensions: "",
      care: "",
      processingTime: "5–7 working days",
      images: [],
      featured: false,
      stock: 0,
      createdAt: new Date().toISOString(),
    },
  );
  const set = <K extends keyof ShopProduct>(k: K, v: ShopProduct[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const upload = async (files: FileList | null) => {
    for (const file of Array.from(files || [])) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10485760
      ) {
        alert("Use JPG, PNG or WebP under 10 MB.");
        continue;
      }
      const src = await new Promise<string>((r) => {
        const reader = new FileReader();
        reader.onload = () => r(String(reader.result));
        reader.readAsDataURL(file);
      });
      setF((x) => ({ ...x, images: [...x.images, src] }));
    }
  };
  const save = (publish: boolean) => {
    if (!f.title || !f.images.length) return alert("Add a title and image.");
    const item = {
      ...f,
      slug:
        f.slug ||
        f.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      availability:
        publish && f.availability === "Hidden" ? "In Stock" : f.availability,
    };
    const rows = readProducts();
    writeProducts(
      old ? rows.map((p) => (p.id === id ? item : p)) : [item, ...rows],
    );
    nav("/admin/products");
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="card grid gap-5 p-6 md:grid-cols-2">
        <Input
          label="Product name"
          value={f.title}
          change={(v) => set("title", v)}
        />
        <Select
          label="Category"
          value={f.category}
          change={(v) => set("category", v as ShopCategory)}
          options={categoryOptions.slice(1).map(([n, v]) => [n, String(v)])}
        />
        <Input
          label="Short description"
          value={f.description}
          change={(v) => set("description", v)}
        />
        <Input
          label="Product story"
          value={f.story}
          change={(v) => set("story", v)}
        />
        <Input
          label="Materials"
          value={f.materials}
          change={(v) => set("materials", v)}
        />
        <Input
          label="Dimensions"
          value={f.dimensions}
          change={(v) => set("dimensions", v)}
        />
        <Input label="Care" value={f.care} change={(v) => set("care", v)} />
        <Input
          label="Processing time"
          value={f.processingTime}
          change={(v) => set("processingTime", v)}
        />
        <Input
          label="Price"
          type="number"
          value={String(f.price)}
          change={(v) => set("price", +v)}
        />
        <Input
          label="Stock"
          type="number"
          value={String(f.stock ?? 0)}
          change={(v) => set("stock", +v)}
        />
        <Select
          label="Availability"
          value={f.availability}
          change={(v) => set("availability", v as ShopProduct["availability"])}
          options={["In Stock", "Made to Order", "Sold Out", "Hidden"].map(
            (v) => [v, v],
          )}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={f.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />{" "}
          Featured
        </label>
        <label className="md:col-span-2">
          <span className="label">Images</span>
          <input
            className="field"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => upload(e.target.files)}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            {f.images.map((src, i) => (
              <div className="relative" key={i}>
                <img
                  src={src}
                  className="h-24 w-24 rounded-xl object-cover"
                  alt=""
                />
                <button
                  className="absolute right-1 top-1 rounded-full bg-wine p-1 text-white"
                  onClick={() =>
                    set(
                      "images",
                      f.images.filter((_, n) => n !== i),
                    )
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </label>
      </section>
      <aside className="card h-fit p-6">
        <h2 className="text-3xl">Publish</h2>
        <button className="tag mt-6 w-full" onClick={() => save(false)}>
          Save Draft
        </button>
        <button className="btn mt-3 w-full" onClick={() => save(true)}>
          {old ? "Update Product" : "Publish Product"}
        </button>
        <button
          className="mt-4 w-full underline"
          onClick={() => nav("/admin/products")}
        >
          Cancel
        </button>
      </aside>
    </div>
  );
}

function Categories() {
  const initial = categoryOptions
    .slice(1)
    .map(([name, slug], i) => ({
      name,
      slug: String(slug),
      active: true,
      order: i + 1,
    }));
  const [rows, setRows] = useState<any[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("moonmuse-categories") || "null") ||
        initial
      );
    } catch {
      return initial;
    }
  });
  const save = (v: any[]) => {
    setRows(v);
    localStorage.setItem("moonmuse-categories", JSON.stringify(v));
  };
  return (
    <section className="card p-6">
      <div className="flex justify-between">
        <h2 className="text-3xl">Shop categories</h2>
        <button
          className="btn"
          onClick={() =>
            save([
              ...rows,
              {
                name: "New Category",
                slug: `category-${Date.now()}`,
                active: false,
                order: rows.length + 1,
              },
            ])
          }
        >
          <Plus /> Add
        </button>
      </div>
      {rows.map((r, i) => (
        <div
          className="mt-3 grid gap-3 rounded-2xl bg-cream p-4 md:grid-cols-[70px_1fr_1fr_auto]"
          key={r.slug}
        >
          <input
            className="field"
            type="number"
            value={r.order}
            onChange={(e) =>
              save(
                rows.map((x, n) =>
                  n === i ? { ...x, order: +e.target.value } : x,
                ),
              )
            }
          />
          <input
            className="field"
            value={r.name}
            onChange={(e) =>
              save(
                rows.map((x, n) =>
                  n === i ? { ...x, name: e.target.value } : x,
                ),
              )
            }
          />
          <input className="field" disabled value={r.slug} />
          <label>
            <input
              type="checkbox"
              checked={r.active}
              onChange={(e) =>
                save(
                  rows.map((x, n) =>
                    n === i ? { ...x, active: e.target.checked } : x,
                  ),
                )
              }
            />{" "}
            Active
          </label>
        </div>
      ))}
    </section>
  );
}
function Orders() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      ?.from("orders")
      .select(
        "id,order_number,full_name,email,status,subtotal,created_at,order_items(product_name,preview_path)",
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, []);
  const shown = rows.filter((o) =>
    `${o.order_number} ${o.full_name} ${o.email}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <>
      <label className="flex max-w-xl items-center gap-2 rounded-2xl bg-white px-4">
        <Search />
        <input
          className="min-h-12 w-full bg-transparent outline-none"
          placeholder="Search orders"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {loading && <p className="mt-5 text-sm text-ink/50">Loading orders…</p>}
      {shown.map((o) => (
        <article className="card mt-4 flex items-center gap-4 p-5" key={o.id}>
          <img
            src={o.order_items?.[0]?.preview_path || "/images/frame1.jpg"}
            className="h-20 w-20 rounded-xl object-cover"
            alt=""
          />
          <div className="flex-1">
            <b>{o.order_number}</b>
            <h2 className="text-2xl">{o.full_name}</h2>
            <p className="text-xs text-ink/50">{o.status}</p>
          </div>
          <b>{money(o.subtotal || 0)}</b>
          <Link className="btn !py-2" to={`/admin/orders/${o.id}`}>
            Open
          </Link>
        </article>
      ))}
      {!loading && !shown.length && <Empty text="No orders found." />}
    </>
  );
}
function OrderDetails({ id }: { id: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("orders")
      .select("*,order_items(*),email_deliveries(*)")
      .eq("id", id)
      .maybeSingle();
    setOrder(data);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, [id]);
  if (loading) return <p>Loading order…</p>;
  if (!order) return <Empty text="Order not found." />;
  const update = async (patch: Record<string, unknown>) => {
    setMessage("Updating…");
    const { data, error } = await supabase!.functions.invoke("admin-order", {
      body: { orderId: id, patch },
    });
    if (error || !data?.success)
      setMessage(data?.error || error?.message || "Update failed.");
    else {
      setMessage(
        data.emailStatus === "failed"
          ? "Order updated, but the status email failed."
          : "Order updated.",
      );
      await load();
    }
  };
  const resend = async (deliveryId: string) => {
    setMessage("Sending…");
    const { data, error } = await supabase!.functions.invoke("admin-email", {
      body: { action: "resend", deliveryId },
    });
    setMessage(
      data?.success
        ? `Email accepted. Provider message ID: ${data.providerMessageId}`
        : data?.error || error?.message || "Resend failed.",
    );
    await load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="card p-6">
        <p className="label">{order.order_number}</p>
        <h2 className="text-4xl">{order.full_name}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            ["Email", order.email],
            ["WhatsApp", order.whatsapp],
            ["Address", order.address],
            ["City", `${order.city}, ${order.state} ${order.pin_code}`],
            ["Subtotal", money(order.subtotal || 0)],
            ["Created", new Date(order.created_at).toLocaleString()],
          ].map(([k, v]) => (
            <p key={k}>
              <small className="block">{k}</small>
              {v}
            </p>
          ))}
        </div>
        {order.order_items?.map((item: any) => (
          <div
            className="mt-5 flex gap-4 rounded-2xl bg-cream p-4"
            key={item.id}
          >
            <img
              src={item.preview_path || "/images/frame1.jpg"}
              className="h-20 w-20 rounded-xl object-cover"
              alt=""
            />
            <div>
              <b>
                {item.product_name} · Qty {item.quantity}
              </b>
              <p className="text-xs">
                {Object.values(item.selected_options || {}).join(" · ")}
              </p>
            </div>
          </div>
        ))}
        <PersonalisedOrderPanel orderId={id} />
        <h3 className="mt-8 text-3xl">Email delivery</h3>
        {order.email_deliveries?.map((delivery: any) => (
          <div key={delivery.id} className="mt-3 rounded-2xl border p-4">
            <div className="flex justify-between">
              <b>{delivery.email_type}</b>
              <span
                className={`tag ${delivery.status === "Failed" ? "text-coral" : ""}`}
              >
                {delivery.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink/55">
              Attempts: {delivery.attempt_count}
              {delivery.sent_at
                ? ` · Sent ${new Date(delivery.sent_at).toLocaleString()}`
                : ""}
            </p>
            {delivery.last_error_message_safe && (
              <p className="mt-2 text-sm text-coral">
                {delivery.last_error_message_safe}
              </p>
            )}
            {delivery.status === "Failed" && (
              <button className="tag mt-3" onClick={() => resend(delivery.id)}>
                {delivery.email_type === "Customer order confirmation"
                  ? "Resend Customer Email"
                  : "Resend Owner Notification"}
              </button>
            )}
          </div>
        ))}
        {message && (
          <p className="mt-5 rounded-2xl bg-blush/20 p-4 text-sm">{message}</p>
        )}
      </section>
      <aside className="card h-fit space-y-5 p-6">
        <Select
          label="Order status"
          value={order.status || "New Request"}
          change={(v) =>
            confirm(`Change status to ${v}?`) &&
            update({
              status: v,
              latest_update: `Your order status is now ${v}.`,
            })
          }
          options={[
            "New Request",
            "Awaiting Confirmation",
            "Payment Pending",
            "Confirmed",
            "Creating",
            "Ready",
            "Dispatched",
            "Delivered",
            "Cancelled",
          ].map((v) => [v, v])}
        />
        <Select
          label="Payment"
          value={order.payment_status || "Pending"}
          change={(v) => update({ payment_status: v })}
          options={[
            ["Pending", "Pending"],
            ["Received", "Received"],
            ["Refunded", "Refunded"],
          ]}
        />
        <a
          className="btn w-full"
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/${String(order.whatsapp || "").replace(/\D/g, "")}`}
        >
          Contact on WhatsApp
        </a>
      </aside>
    </div>
  );
}
function PersonalisedOrderPanel({orderId}:{orderId:string}){const[details,setDetails]=useState<any>(null);const[files,setFiles]=useState<any[]>([]);useEffect(()=>{if(!supabase)return;void supabase.from("personalised_order_details").select("*").eq("order_id",orderId).maybeSingle().then(({data})=>setDetails(data));void supabase.from("personalised_order_files").select("*").eq("order_id",orderId).order("display_order").then(async({data})=>{const rows=await Promise.all((data||[]).map(async file=>{const{data:signed}=await supabase!.storage.from("custom-orders").createSignedUrl(file.storage_path,3600);return{...file,url:signed?.signedUrl}}));setFiles(rows)})},[orderId]);if(!details)return null;return <section className="mt-8 rounded-2xl bg-blush/15 p-5"><p className="label">Personalised order</p><h3 className="text-3xl">Customer’s idea</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{[["Occasion",details.occasion],["People",details.people_count],["Pets",details.pets_count],["Names",details.names],["Important date",details.important_date],["Preferred colours",details.preferred_colours],["Requested deadline",details.requested_deadline],["Special details",details.special_details],["Instructions",details.customer_instructions]].filter(([,value])=>value).map(([label,value])=><p key={label}><small className="block text-ink/50">{label}</small>{value}</p>)}</div>{files.length>0&&<div className="mt-5"><p className="label">Private original photographs</p><div className="mt-2 flex flex-wrap gap-3">{files.map(file=><a key={file.id} href={file.url} target="_blank" rel="noreferrer" download={file.filename} className="block"><img src={file.url} className="h-28 w-28 rounded-xl object-cover" alt={file.filename}/><span className="mt-1 block max-w-28 truncate text-xs underline">Download original</span></a>)}</div></div>}</section>}
function Prices() {
  const [rows, setRows] = useState(readProducts);
  return (
    <section className="card p-6">
      <div className="flex justify-between">
        <h2 className="text-3xl">Prices & inventory</h2>
        <button className="btn" onClick={() => writeProducts(rows)}>
          Save Changes
        </button>
      </div>
      {rows.map((p, i) => (
        <div
          className="mt-3 grid items-center gap-3 rounded-2xl bg-cream p-4 md:grid-cols-[1fr_150px_150px]"
          key={p.id}
        >
          <b>{p.title}</b>
          <input
            className="field"
            type="number"
            value={p.price}
            onChange={(e) =>
              setRows(
                rows.map((x, n) =>
                  n === i ? { ...x, price: +e.target.value } : x,
                ),
              )
            }
          />
          <input
            className="field"
            type="number"
            value={p.stock ?? 0}
            disabled={p.stock === null}
            onChange={(e) =>
              setRows(
                rows.map((x, n) =>
                  n === i ? { ...x, stock: +e.target.value } : x,
                ),
              )
            }
          />
        </div>
      ))}
    </section>
  );
}
function OwnerSettings() {
  const key = "moonmuse-owner-settings";
  const [f, setF] = useState<any>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(key) || "null") || {
          shopName: "MoonMuse",
          ownerName: "Janvi Mahajan",
          email: "",
          whatsapp: import.meta.env.VITE_OWNER_WHATSAPP || "",
          processing: "5–7 working days",
          shipping: "manual",
        }
      );
    } catch {
      return {};
    }
  });
  return (
    <form
      className="card grid max-w-4xl gap-5 p-6 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        localStorage.setItem(key, JSON.stringify(f));
        alert("Settings saved.");
      }}
    >
      <h2 className="text-3xl md:col-span-2">Business settings</h2>
      {[
        ["shopName", "Shop name"],
        ["ownerName", "Owner name"],
        ["email", "Contact email"],
        ["whatsapp", "WhatsApp"],
        ["processing", "Processing time"],
      ].map(([k, l]) => (
        <Input
          key={k}
          label={l}
          value={f[k] || ""}
          change={(v) => setF({ ...f, [k]: v })}
        />
      ))}
      <button className="btn md:col-span-2">Save Settings</button>
    </form>
  );
}
function EmailSettings() {
  const [config, setConfig] = useState<Record<string, boolean> | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (action: "config-status" | "test") => {
    if (!supabase) return setMessage("Supabase is not configured.");
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("admin-email", {
      body: { action },
    });
    if (action === "config-status" && data?.configuration)
      setConfig(data.configuration);
    else if (data?.success)
      setMessage(
        "Test notification accepted by Web3Forms. Check the verified owner inbox.",
      );
    else
      setMessage(data?.error || error?.message || "Notification check failed.");
    setBusy(false);
  };
  useEffect(() => {
    void run("config-status");
  }, []);
  const labels: Record<string, string> = {
    web3FormsAccessKey: "Web3Forms access key",
    ownerNotificationEmail: "Owner notification email",
    resendApiKey: "Resend API key (customer emails)",
    senderEmail: "Sender email (customer emails)",
    publicSiteUrl: "Public website URL",
  };
  return (
    <section className="card max-w-3xl p-6">
      <h2 className="text-3xl">Email configuration</h2>
      <p className="mt-2 text-sm text-ink/55">
        Values stay hidden. Only configuration status is shown.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="rounded-2xl bg-cream p-4">
            <span className="label">{label}</span>
            <b className={config?.[key] ? "text-sage" : "text-coral"}>
              {config?.[key] ? "Configured" : "Missing"}
            </b>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-ink/55">
        Owner order notifications use Web3Forms. Customer confirmations continue
        to use Resend.
      </p>
      {message && (
        <p role="status" className="mt-5 rounded-2xl bg-blush/20 p-4 text-sm">
          {message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={busy} className="btn" onClick={() => run("test")}>
          {busy ? "Checking…" : "Send Test Notification"}
        </button>
        <button
          disabled={busy}
          className="tag"
          onClick={() => run("config-status")}
        >
          Refresh Status
        </button>
      </div>
    </section>
  );
}
function Login() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return setError("Supabase is not configured.");
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const { data: auth, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: String(data.get("password")),
      });
    if (authError || !auth.user) {
      setError(
        authError?.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : authError?.message || "Login failed.",
      );
      setBusy(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (profile?.role !== "owner") {
      await supabase.auth.signOut();
      setError("This account is not authorized for the owner dashboard.");
      setBusy(false);
      return;
    }
    const next = params.get("next");
    nav(next?.startsWith("/admin") ? next : "/admin/dashboard", {
      replace: true,
    });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-wine p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[2rem] bg-cream p-9"
      >
        <Lock className="mb-5" />
        <p className="label">Private owner access</p>
        <h1 className="text-5xl">Owner studio</h1>
        <Input label="Email" type="email" value={email} change={setEmail} />
        <label className="mt-4 block">
          <span className="label">Password</span>
          <span className="relative block">
            <input
              required
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="field pr-12"
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input name="remember" type="checkbox" defaultChecked /> Remember me
        </label>
        {error && (
          <p role="alert" className="mt-4 text-coral">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn mt-7 w-full">
          {busy ? "Signing in…" : "Login"}
        </button>
        <Link
          className="mt-4 block text-center text-xs underline"
          to="/admin/forgot-password"
        >
          Forgot password?
        </Link>
      </form>
    </div>
  );
}
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return setMessage("Supabase is not configured.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${location.origin}/admin/reset-password` },
    );
    setMessage(
      error?.message ||
        "Password-reset email sent. Check your inbox and spam folder.",
    );
    setBusy(false);
  };
  return (
    <div className="grid min-h-screen place-items-center bg-wine p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[2rem] bg-cream p-9"
      >
        <Lock className="mb-5" />
        <p className="label">Owner account</p>
        <h1 className="text-5xl">Reset password.</h1>
        <p className="my-5 text-sm text-ink/60">
          Enter the owner email address to receive a secure reset link.
        </p>
        <Input label="Email" type="email" value={email} change={setEmail} />
        {message && (
          <p className="mt-4 rounded-2xl bg-blush/20 p-4 text-sm">{message}</p>
        )}
        <button disabled={busy} className="btn mt-7 w-full">
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <Link
          className="mt-4 block text-center text-xs underline"
          to="/admin/login"
        >
          Back to login
        </Link>
      </form>
    </div>
  );
}
function AccessDenied() {
  const nav = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-wine p-5">
      <div className="w-full max-w-md rounded-[2rem] bg-cream p-9 text-center">
        <Lock className="mx-auto mb-5" />
        <h1 className="text-5xl">Access denied.</h1>
        <p className="mt-4 text-sm text-ink/60">
          This signed-in account is not an authorized MoonMuse owner.
        </p>
        <button
          className="btn mt-7"
          onClick={async () => {
            await supabase?.auth.signOut();
            nav("/admin/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-ink/50">
      {text}
    </div>
  );
}
function Input({
  label,
  value,
  change,
  type = "text",
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        name={label === "Email" ? "email" : undefined}
        required={label === "Email"}
        className="field"
        type={type}
        value={value}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  change,
  options,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  options: string[][];
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <select
        className="field"
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        {options.map(([n, id]) => (
          <option key={id} value={id}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
