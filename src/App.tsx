import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Lock,
  Package,
  Palette,
  PenTool,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Layout, PageHero } from "./components/Layout";
import {
  FrameSizePage,
  ProductPreview,
  OldMoodRedirect,
} from "./components/CreateFlows";
import { StudioEditor } from "./components/StudioEditor";
import { MiniatureSticker } from "./components/MiniatureSticker";
import { DesignRequestFlow } from "./components/DesignRequestFlow";
import { OwnerDesignRequests } from "./components/OwnerDesignRequests";
import { ProductDetails, ShopCatalogue } from "./components/ShopExperience";
import { CartPage, CheckoutPage, OrderConfirmation } from "./components/CartCheckout";
import { FrameTemplateCustomizer } from "./components/FrameTemplateCustomizer";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { TrackOrderPage } from "./components/TrackOrderPage";
import {
  frameSizes,
  getPricing,
  money,
  pricingKey,
  products,
  statuses,
  studioImage,
  styles,
} from "./lib/data";
import { readSelection } from "./lib/design";
const Fade = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55 }}
  >
    {children}
  </motion.div>
);
function Home() {
  return (
    <>
      <section className="grid min-h-[680px] lg:grid-cols-2">
        <div className="noise flex flex-col justify-center px-7 py-20 text-cream md:px-16">
          <p className="mb-7 text-xs uppercase tracking-[.3em] text-blush">
            Personalised, slowly & by hand
          </p>
          <h1 className="max-w-xl text-6xl leading-[.88] md:text-8xl">
            Little pieces,
            <br />
            <i>big feelings.</i>
          </h1>
          <p className="mt-8 max-w-lg text-lg text-cream/75">
            Discover handmade art, personalised keepsakes and editable
            memory-frame templates created to hold the moments you never want
            to forget.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className="btn-light" to="/shop">
              Shop Handmade <ArrowRight size={17} />
            </Link>
            <Link
              className="rounded-full border border-cream/40 px-6 py-3 text-sm font-semibold"
              to="/shop?category=frame-templates"
            >
              Create a Memory Frame
            </Link>
          </div>
        </div>
        <div className="relative min-h-[520px] overflow-hidden bg-blush">
          <img
            src="/images/frame1.jpg"
            className="h-full w-full object-cover"
            alt="Personalised blue gingham scrapbook memory frame"
          />
          <img
            src="/images/tote1.jpg"
            className="absolute bottom-8 right-6 h-[44%] w-[38%] rotate-3 rounded-2xl border-[10px] border-cream object-cover shadow-2xl md:right-10"
            alt="Hand-painted botanical tote bag"
          />
          <span className="hand absolute bottom-8 left-8 -rotate-3 rounded-full bg-butter px-5 py-2 text-2xl text-wine">
            made for your story ✿
          </span>
        </div>
      </section>
      <section className="section">
        <Fade>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="label">What I offer</p>
              <h2 className="text-5xl md:text-6xl">Made by hand, for you.</h2>
            </div>
            <Link to="/shop" className="hidden text-sm underline md:block">
              Shop all
            </Link>
          </div>
        </Fade>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { id: "ashtrays", name: "Handmade Ashtrays", short: "Small sculpted pieces for colourful corners.", image: "/images/moonmuse-studio.png" },
            { id: "totes", name: "Painted Tote Bags", short: "Original art you can carry everywhere.", image: "/images/tote1.jpg" },
            { id: "keychains", name: "Handmade Keychains", short: "Tiny keepsakes made with personality.", image: "/images/tote5.jpg" },
            { id: "paintings", name: "Paintings", short: "One-of-one colour, feeling and brushwork.", image: "/images/tote4.jpg" },
            { id: "frames", name: "Memory Frames", short: "Layered stories, framed by hand.", image: "/images/frame1.jpg" },
            { id: "frame-templates", name: "Editable Frame Templates", short: "Janvi’s layouts, personalised with your memories.", image: "/images/frame2.jpg" },
          ].map((p) => (
            <Fade key={p.id}>
              <Link
                to={`/shop?category=${p.id}`}
                className="card group block"
              >
                <div className="h-80 overflow-hidden">
                  <img
                    src={p.image}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    alt={p.name}
                  />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-3xl">{p.name}</h3>
                    <p className="mt-1 text-sm text-ink/60">{p.short}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-cream">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            </Fade>
          ))}
        </div>
      </section>
      <section className="bg-blush/15">
        <div className="section">
          <Fade>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="label">Why MoonMuse?</p>
              <h2 className="text-5xl md:text-6xl">Made with meaning.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-ink/65">
                No mass-produced magic here—every piece is created, painted or
                finished personally by Janvi.
              </p>
            </div>
          </Fade>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Palette />, title: "Made by Hand" },
              { icon: <Heart />, title: "Created from Stories" },
              { icon: <Sparkles />, title: "Personalised by You" },
              { icon: <Check />, title: "Crafted with Care" },
            ].map((point) => (
              <div
                key={point.title}
                className="rounded-3xl bg-white p-6 text-center shadow-sm"
              >
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lilac/30 text-wine">
                  {point.icon}
                </span>
                <h3 className="mt-5 text-2xl">{point.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <Fade>
          <div className="mx-auto max-w-4xl">
            <div className="mb-9 text-center">
              <p className="label">How ordering works</p>
              <h2 className="text-5xl md:text-6xl">From idea to your door.</h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-4">
              {[
                "Pick or personalize your piece.",
                "Place your order request.",
                "Confirm delivery and payment with Janvi.",
                "Your piece is handmade and delivered.",
              ].map((text, index) => (
                <li className="rounded-3xl bg-white p-6" key={text}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-wine font-semibold text-cream">
                    {index + 1}
                  </span>
                  <p className="mt-5 text-sm leading-6 text-ink/70">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Fade>
      </section>
      <section className="px-5 pb-20 md:px-10">
        <Fade>
          <div className="noise mx-auto max-w-7xl rounded-[2rem] px-7 py-12 text-cream md:px-12 md:py-14">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <p className="hand text-2xl text-blush">your idea, made tangible</p>
                <h2 className="mt-2 text-5xl md:text-6xl">
                  Have something else in mind?
                </h2>
                <p className="mt-4 text-cream/70">
                  Tell me your idea, occasion and favourite little details—and
                  let’s create something that feels completely yours.
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
                <a
                  className="btn-light"
                  href={`https://wa.me/${import.meta.env.VITE_OWNER_WHATSAPP || "919999999999"}?text=${encodeURIComponent("Hi Janvi! I have a custom MoonMuse idea I’d love to discuss.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with Janvi
                </a>
                <Link
                  className="rounded-full border border-cream/40 px-6 py-3 text-center text-sm font-semibold transition hover:bg-cream hover:text-wine focus-visible:bg-cream focus-visible:text-wine focus-visible:outline-none"
                  to="/design-service"
                >
                  Request a Custom Piece
                </Link>
              </div>
            </div>
          </div>
        </Fade>
      </section>
      <section className="relative min-h-[425px] overflow-hidden px-5 py-20 text-center md:px-10">
        <MiniatureSticker
          src="/images/stickers/janvi-doodle-portrait.png"
          size="clamp(180px, 14.3vw, 205px)"
          position={{ left: 0, bottom: 0 }}
          className="hidden lg:block"
        />
        <MiniatureSticker
          src="/images/stickers/janvi-miniature.png"
          size="clamp(190px, 15.5vw, 225px)"
          position={{ right: 18, bottom: 0 }}
          className="hidden lg:block"
        />
        <div className="relative z-20">
          <p className="hand text-3xl text-coral">
            little pieces, big feelings
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-5xl md:text-7xl">
            Not just a product. A tiny place for your story to live.
          </h2>
        </div>
      </section>
    </>
  );
}
function Mode({
  icon,
  title,
  text,
  to,
  color,
  accent = "bg-white/15",
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  to: string;
  color: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className={`${color} group rounded-[2rem] p-9 text-cream md:p-12`}
    >
      <span
        className={`mb-16 grid h-12 w-12 place-items-center rounded-full ${accent}`}
      >
        {icon}
      </span>
      <h3 className="text-4xl">{title}</h3>
      <p className="mt-3 max-w-md text-cream/70">{text}</p>
      <div className="mt-7 flex items-center gap-2 text-sm font-semibold">
        Choose this path{" "}
        <ArrowRight
          className="transition group-hover:translate-x-1"
          size={17}
        />
      </div>
    </Link>
  );
}
function Studio() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState("frame");
  const [size, setSize] = useState("Small Frame");
  const [style, setStyle] = useState("Black");
  const steps = ["Product", "Size", "Style"];
  return (
    <>
      <PageHero
        eyebrow="Enter the studio"
        title="Let’s make something yours."
        text="Three little choices, then the creative part begins."
        image={false}
      />
      <section className="section !max-w-5xl">
        <div className="mb-12 flex items-center">
          {steps.map((s, i) => (
            <div className="flex flex-1 items-center" key={s}>
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm ${i <= step ? "bg-wine text-white" : "bg-wine/10"}`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </span>
              <span className="ml-3 hidden text-sm font-semibold sm:block">
                {s}
              </span>
              {i < 2 && <div className="mx-4 h-px flex-1 bg-wine/15" />}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step === 0 && (
              <Choice title="What are we creating?">
                {products.map((p) => (
                  <button
                    onClick={() => setProduct(p.id)}
                    key={p.id}
                    className={`card text-left ${product === p.id ? "ring-2 ring-wine" : ""}`}
                  >
                    <img
                      src={p.image}
                      className={`h-56 w-full object-cover ${p.crop}`}
                      alt=""
                    />
                    <div className="p-5">
                      <h3 className="text-2xl">{p.name}</h3>
                      <p className="text-sm text-ink/60">{p.short}</p>
                      <b className="mt-3 block">from {money(p.price)}</b>
                    </div>
                  </button>
                ))}
              </Choice>
            )}
            {step === 1 && (
              <Choice title="Choose your size">
                <button
                  onClick={() => setSize("Small Frame")}
                  className={`card p-8 text-left ${size === "Small Frame" ? "ring-2 ring-wine" : ""}`}
                >
                  <h3 className="text-3xl">Small Frame</h3>
                  <p>Sweet, compact and desk-ready.</p>
                  <b className="mt-6 block">₹350 + shipping</b>
                </button>
                <button
                  onClick={() => setSize("Medium Frame")}
                  className={`card p-8 text-left ${size === "Medium Frame" ? "ring-2 ring-wine" : ""}`}
                >
                  <h3 className="text-3xl">
                    Medium Frame · 9 × 12 inches (A4)
                  </h3>
                  <p>More room for every little detail.</p>
                  <b className="mt-6 block">₹550 + shipping</b>
                </button>
              </Choice>
            )}
            {step === 2 && (
              <div>
                <h2 className="mb-7 text-4xl">Choose frame colour.</h2>
                <div className="flex flex-wrap gap-3">
                  {["Black", "White"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`tag ${style === s ? "active" : ""}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-10 rounded-3xl bg-blush/30 p-8">
                  <p className="label">Your selection</p>
                  <h3 className="text-3xl">
                    {products.find((p) => p.id === product)?.name} · {size}
                  </h3>
                  <p className="mt-2">
                    {style} frame · {size === "Medium Frame" ? "₹550" : "₹350"}{" "}
                    + shipping
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-10 flex justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className={step === 0 ? "invisible" : "tag"}
          >
            Back
          </button>
          <button
            onClick={() => (step < 2 ? setStep(step + 1) : nav("/editor"))}
            className="btn"
          >
            {step < 2 ? "Continue" : "Start creating"}{" "}
            <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </>
  );
}
function Choice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-7 text-4xl">{title}</h2>
      <div className="grid gap-5 md:grid-cols-3">{children}</div>
    </div>
  );
}
function DesignService() {
  return <DesignRequestFlow />;
}
function FormShell() {
  const nav = useNavigate();
  return (
    <form
      className="bg-cream p-7 md:p-14"
      onSubmit={(e) => {
        e.preventDefault();
        nav("/preview");
      }}
    >
      <p className="label">Design it for me</p>
      <h2 className="mb-8 text-5xl">What’s the story?</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <Select label="Product" values={products.map((p) => p.name)} />
        <Select
          label="Occasion"
          values={["Birthday", "Anniversary", "Best Friend", "Just Because"]}
        />
        <Select label="Aesthetic" values={styles} />
        <Field label="Names" />
        <Field label="Important date" type="date" />
        <Field label="Message or quote" />
        <label className="md:col-span-2">
          <span className="label">Detailed instructions</span>
          <textarea
            className="field min-h-28"
            placeholder="Colours they love, an inside joke, the feeling..."
          />
        </label>
        <label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-wine/30 bg-white p-8">
          <Upload />
          <span>
            <b>Upload photos & references</b>
            <small className="block text-ink/50">
              JPG, PNG or WebP · 10 MB each
            </small>
          </span>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
      </div>
      <button className="btn mt-8">
        Continue to Preview <ArrowRight size={17} />
      </button>
    </form>
  );
}
function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input type={type} className="field" />
    </label>
  );
}
function Select({ label, values }: { label: string; values: string[] }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field">
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
function Preview() {
  return (
    <>
      <PageHero
        eyebrow="Almost yours"
        title="Meet your memory piece."
        text="Take a close look. Handmade details may vary a little—that’s part of their charm."
      />
      <section className="section grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid grid-cols-2 gap-4">
          <img
            src="/images/frame1.jpg"
            className="col-span-2 h-[480px] w-full rounded-3xl object-cover"
            alt="Blue gingham memory frame"
          />
          <img
            src="/images/frame2.jpg"
            className="h-52 w-full rounded-3xl object-cover object-[50%_35%]"
            alt="Black and white collage memory frame"
          />
          <img
            src="/images/frame1.jpg"
            className="h-52 w-full rounded-3xl object-cover object-bottom"
            alt="Memory frame close-up"
          />
        </div>
        <div className="rounded-[2rem] bg-wine p-8 text-cream md:p-10">
          <p className="label !text-blush">Your order</p>
          <h2 className="text-5xl">Small Memory Frame</h2>
          <div className="my-8 space-y-4 border-y border-white/15 py-6 text-sm">
            <p className="flex justify-between">
              <span>Creation mode</span>
              <b>Create It Myself</b>
            </p>
            <p className="flex justify-between">
              <span>Product price</span>
              <b>₹350 + shipping</b>
            </p>
          </div>
          <p className="text-sm text-cream/60">
            Every MoonMuse piece is finished by hand. Tiny shifts in colour,
            brushwork and placement are natural—and uniquely yours.
          </p>
          <div className="mt-9 grid gap-3">
            <Link className="btn-light" to="/editor">
              Back to Edit
            </Link>
            <Link
              className="rounded-full bg-coral px-6 py-3 text-center font-semibold"
              to="/order"
            >
              Continue to Order
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
function Order() {
  const [done, setDone] = useState("");
  const selection = readSelection();
  const orderProduct = String(selection.product || "frame");
  const orderFrameSize =
    frameSizes.find((s) => s.id === selection.frameSize) || frameSizes[0];
  const orderPrice =
    orderProduct === "tote"
      ? products.find((p) => p.id === "tote")?.price || 499
      : orderFrameSize.price;
  const orderName =
    orderProduct === "tote"
      ? "Painted Tote"
      : `${orderFrameSize.name} Memory Frame`;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = "MM" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem(
      "moonmuse-order",
      JSON.stringify({
        id,
        status: 0,
        updated: "Your request has reached our studio.",
      }),
    );
    setDone(id);
  };
  if (done) {
    const msg = encodeURIComponent(
      `Hi MoonMuse! I placed order ${done} for ${orderName}. I would like to confirm the design, delivery charge and payment.`,
    );
    return (
      <section className="section text-center">
        <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage text-white">
            <Check />
          </span>
          <p className="label mt-6">Request received</p>
          <h1 className="text-6xl">Thank you!</h1>
          <p className="mt-4">
            Your order ID is <b>{done}</b>. Keep it safe for tracking.
          </p>
          <a
            className="btn mt-8"
            href={`https://wa.me/${import.meta.env.VITE_OWNER_WHATSAPP || "919999999999"}?text=${msg}`}
            target="_blank"
          >
            Continue on WhatsApp
          </a>
        </div>
      </section>
    );
  }
  return (
    <>
      <PageHero
        eyebrow="Order request"
        title="Let’s bring it to life."
        text="No payment yet. We’ll confirm delivery and every design detail with you first."
        image={false}
      />
      <section className="section grid gap-8 lg:grid-cols-[1fr_420px]">
        <form
          onSubmit={submit}
          className="grid gap-5 rounded-[2rem] bg-white p-7 md:grid-cols-2 md:p-10"
        >
          <Field label="Full name" />
          <Field label="Email" type="email" />
          <Field label="WhatsApp number" type="tel" />
          <Field label="City" />
          <Field label="PIN code" />
          <Field label="Optional order note" />
          <label className="flex items-start gap-3 md:col-span-2">
            <input required type="checkbox" className="mt-1 accent-wine" />
            <span className="text-sm">
              I understand that small handmade variations make every piece
              unique.
            </span>
          </label>
          <button className="btn md:col-span-2">Submit Order Request</button>
        </form>
        <aside className="rounded-[2rem] bg-wine p-8 text-cream">
          <p className="label !text-blush">Order summary</p>
          <img
            src={
              orderProduct === "tote"
                ? "/images/tote1.jpg"
                : "/images/frame1.jpg"
            }
            className="mb-6 h-40 w-full rounded-2xl object-cover"
            alt={orderName}
          />
          <h3 className="text-3xl">{orderName}</h3>
          {orderProduct === "frame" && (
            <p className="mt-1 text-sm capitalize text-cream/60">
              {String(selection.frameColour || "black")} frame
            </p>
          )}
          <div className="my-6 space-y-3 border-y border-white/15 py-5 text-sm">
            <p className="flex justify-between">
              <span>Product</span>
              <b>{money(orderPrice)}</b>
            </p>
            <p className="flex justify-between">
              <span>Delivery</span>
              <b>To be confirmed</b>
            </p>
            <p className="flex justify-between text-lg">
              <span>Current total</span>
              <b>{money(orderPrice)}</b>
            </p>
          </div>
          <p className="text-xs text-cream/60">
            Delivery is calculated after PIN-code confirmation.
            <br />
            Your photos remain private.
          </p>
        </aside>
      </section>
    </>
  );
}
function Gallery() {
  const [filter, setFilter] = useState("All");
  const cats = ["Frames", "Totes"];
  const items = [
    {
      cat: "Frames",
      title: "Sisters in every season",
      image: "/images/frame1.jpg",
    },
    {
      cat: "Frames",
      title: "Our favourite universe",
      image: "/images/frame2.jpg",
    },
    { cat: "Totes", title: "Stargirl energy", image: "/images/tote1.jpg" },
    { cat: "Totes", title: "Hello, fall", image: "/images/tote2.jpg" },
    { cat: "Totes", title: "Stargirl close-up", image: "/images/tote1.jpg" },
    { cat: "Totes", title: "A universe to carry", image: "/images/tote4.jpg" },
    { cat: "Totes", title: "You are priceless", image: "/images/tote5.jpg" },
  ];
  return (
    <>
      <PageHero
        eyebrow="Made with meaning"
        title="The story shelf."
        text="Colourful keepsakes inspired by real people, favourite days and tiny inside jokes."
      />
      <section className="section">
        <div className="mb-10 flex flex-wrap gap-3">
          {["All", ...cats].map((f) => (
            <button
              className={`tag ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
          {items
            .filter((i) => filter === "All" || i.cat === filter)
            .map((it, i) => (
              <motion.article
                layout
                key={it.title}
                className="card mb-5 break-inside-avoid"
              >
                <img
                  src={it.image}
                  className={`w-full object-cover ${i % 2 ? "h-72" : "h-96"}`}
                  alt={it.title}
                />
                <div className="p-6">
                  <p className="label">{it.cat}</p>
                  <h3 className="text-3xl">{it.title}</h3>
                  <p className="mt-2 text-sm text-ink/60">
                    A joyful collage made from favourite little moments.
                  </p>
                  <button className="mt-4 text-sm font-semibold underline">
                    View Story
                  </button>
                </div>
              </motion.article>
            ))}
        </div>
      </section>
    </>
  );
}
function About() {
  return (
    <>
      <section className="relative grid overflow-hidden lg:grid-cols-2">
        <MiniatureSticker
          src="/images/stickers/janvi-doodle-portrait.png"
          size="clamp(145px, 12vw, 175px)"
          position={{ right: 0, bottom: 0 }}
          className="hidden lg:block"
          flipHorizontal
        />
        <img
          src="/images/tote2.jpg"
          className="h-[620px] w-full object-cover"
          alt="Hand-painted MoonMuse tote outdoors"
        />
        <div className="noise flex flex-col justify-center p-8 text-cream md:p-16">
          <p className="label !text-blush">Our story</p>
          <h1 className="text-6xl md:text-7xl">The hands behind MoonMuse.</h1>
          <h2 className="mt-8 text-3xl">Hi, I’m Janvi.</h2>
          <p className="mt-4 max-w-xl leading-7 text-cream/70">
            I’ve always returned to art when the world felt too loud. MoonMuse
            is my little space for turning photographs, feelings and tiny
            details into something meaningful.
          </p>
          <p className="hand mt-8 text-3xl text-blush">
            “Little pieces, big feelings.”
          </p>
          <Link className="btn-light mt-9 w-fit" to="/shop">
            Create Something Together
          </Link>
        </div>
      </section>
      <section className="section grid gap-5 md:grid-cols-4">
        {[
          "Made by hand",
          "Built from stories",
          "Created with care",
          "Made to be treasured",
        ].map((v, i) => (
          <div className="rounded-3xl bg-white p-7">
            <span className="text-2xl">{["✿", "♡", "☾", "✦"][i]}</span>
            <h3 className="mt-10 text-2xl">{v}</h3>
          </div>
        ))}
      </section>
    </>
  );
}
function Status() {
  const [search, setSearch] = useState(false);
  const order = JSON.parse(localStorage.getItem("moonmuse-order") || "null");
  const active = order?.status || 0;
  return (
    <>
      <PageHero
        eyebrow="Order status"
        title="Your piece is on its way."
        text="Enter your details to see where your MoonMuse order is in its journey."
      />
      <section className="section !max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(true);
          }}
          className="grid gap-4 rounded-3xl bg-white p-6 md:grid-cols-[1fr_1fr_auto]"
        >
          <input className="field" placeholder="Order ID, e.g. MM1042" />
          <input className="field" placeholder="WhatsApp number" />
          <button className="btn">Track order</button>
        </form>
        {search && (
          <div className="mt-8 rounded-3xl bg-white p-7">
            <div className="flex items-center gap-4">
              <img
                src="/images/frame1.jpg"
                className="h-24 w-24 rounded-2xl object-cover"
                alt="Order thumbnail"
              />
              <div>
                <p className="label">{order?.id || "MM1042"}</p>
                <h2 className="text-3xl">Memory Frame</h2>
                <p className="text-sm text-ink/60">
                  {order?.updated || "Your request has reached our studio."}
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-2 md:grid-cols-5">
              {statuses.map((s, i) => (
                <div>
                  <div
                    className={`mb-3 h-2 rounded-full ${i <= active ? "bg-wine" : "bg-wine/10"}`}
                  />
                  <p
                    className={`text-xs ${i <= active ? "font-bold" : "text-ink/40"}`}
                  >
                    {s}
                  </p>
                </div>
              ))}
            </div>
            <a
              className="btn mt-8"
              href="https://wa.me/919999999999"
              target="_blank"
            >
              Chat on WhatsApp
            </a>
          </div>
        )}
      </section>
    </>
  );
}
function Admin() {
  return <OwnerDesignRequests />;
  /* Legacy dashboard retained below temporarily for its pricing/template managers. */
  const [login, setLogin] = useState(false);
  if (!login)
    return (
      <div className="grid min-h-screen place-items-center bg-wine p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLogin(true);
          }}
          className="w-full max-w-md rounded-[2rem] bg-cream p-9"
        >
          <Lock className="mb-5 text-wine" />
          <h1 className="text-5xl">Owner studio</h1>
          <p className="mb-7 mt-2 text-sm text-ink/60">
            Private access for MoonMuse only.
          </p>
          <Field label="Email" type="email" />
          <div className="mt-4">
            <Field label="Password" type="password" />
          </div>
          <button className="btn mt-7 w-full">Sign in</button>
          <Link className="mt-4 block text-center text-xs" to="/">
            Back to website
          </Link>
        </form>
      </div>
    );
  const sections = [
    "Dashboard",
    "Orders",
    "Products",
    "Prices",
    "Images",
    "Gallery",
    "Templates",
    "Stickers",
    "About Page",
    "Site Content",
  ];
  return (
    <div className="min-h-screen bg-[#efe9e1] md:grid md:grid-cols-[250px_1fr]">
      <aside className="bg-wine p-6 text-cream">
        <Link to="/" className="font-serif text-2xl">
          ☾ MoonMuse
        </Link>
        <p className="mb-8 mt-1 text-xs text-cream/50">Owner dashboard</p>
        {sections.map((s, i) => (
          <button
            className={`mb-1 block w-full rounded-xl px-4 py-2.5 text-left text-sm ${i === 0 ? "bg-white/15" : ""}`}
          >
            {s}
          </button>
        ))}
      </aside>
      <main className="p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="label">Monday, 24 August</p>
            <h1 className="text-5xl">Studio overview</h1>
          </div>
          <button className="tag bg-white">Edit Website</button>
        </div>
        <div className="my-8 grid gap-4 md:grid-cols-3">
          <Stat icon={<Package />} n="12" t="Open orders" />
          <Stat icon={<Palette />} n="5" t="In creation" />
          <Stat icon={<Users />} n="28" t="This month" />
        </div>
        <PricingManager />
        <TemplateManager />
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="card p-7">
            <div className="flex justify-between">
              <h2 className="text-3xl">Recent orders</h2>
              <button className="text-sm underline">View all</button>
            </div>
            <p className="mt-3 text-xs capitalize text-ink/50">
              Latest frame selection:{" "}
              {String(readSelection().frameSize || "small")} ·{" "}
              {String(readSelection().frameColour || "black")} frame
            </p>
            {[
              "MM1042 · Memory Frame",
              "MM1041 · Painted Tote",
              "MM1040 · Memory Frame",
            ].map((o, i) => (
              <div className="mt-5 flex items-center justify-between border-t border-wine/10 pt-5">
                <div>
                  <b>{o}</b>
                  <p className="text-xs text-ink/50">
                    {["New request", "Creating", "Awaiting confirmation"][i]}
                  </p>
                </div>
                <button className="rounded-full bg-cream p-2">
                  <ArrowRight size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="card p-7">
            <h2 className="text-3xl">Media manager</h2>
            <img
              src="/images/tote5.jpg"
              className="my-5 h-44 w-full rounded-2xl object-cover"
              alt="Tote image in the media manager"
            />
            <button className="btn w-full">
              <ImageIcon size={17} />
              Upload image
            </button>
            <p className="mt-3 text-center text-xs text-ink/50">
              Replace, reorder, hide and edit alt text
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
function PricingManager() {
  const initial = getPricing();
  const [values, setValues] = useState(initial);
  const save = () => {
    localStorage.setItem(pricingKey, JSON.stringify(values));
    location.reload();
  };
  return (
    <div className="card mb-6 p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Product settings</p>
          <h2 className="text-3xl">Prices & availability</h2>
        </div>
        <button className="btn" onClick={save}>
          Save prices
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <label>
          <span className="label">Small frame · 5×7</span>
          <input
            className="field"
            type="number"
            min="0"
            value={values.frameSmall}
            onChange={(e) =>
              setValues({ ...values, frameSmall: +e.target.value })
            }
          />
        </label>
        <label>
          <span className="label">Medium · 9×12/A4</span>
          <input
            className="field"
            type="number"
            min="0"
            value={values.frameMedium}
            onChange={(e) =>
              setValues({ ...values, frameMedium: +e.target.value })
            }
          />
        </label>
        <label>
          <span className="label">Painted tote</span>
          <input
            className="field"
            type="number"
            min="0"
            value={values.tote}
            onChange={(e) => setValues({ ...values, tote: +e.target.value })}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className="tag bg-white">Frame colours: Black · White</span>
        <span className="tag bg-white">Tote: One size</span>
      </div>
    </div>
  );
}
function TemplateManager() {
  const key = "moonmuse-owner-templates";
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]") as any[];
    } catch {
      return [];
    }
  };
  const [templates, setTemplates] = useState<any[]>(read);
  const persist = (next: any[]) => {
    setTemplates(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const template = {
        name: raw.name || file.name.replace(/\.json$/i, ""),
        background: raw.background || "#F8F3EC",
        elements: Array.isArray(raw.elements) ? raw.elements : [],
      };
      persist([...templates, template]);
    } catch {
      alert("Please upload a valid MoonMuse template JSON file.");
    }
  };
  return (
    <div className="card mb-6 p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Editable templates</p>
          <h2 className="text-3xl">Owner template library</h2>
        </div>
        <label className="btn cursor-pointer">
          <Upload size={17} />
          Upload template JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="mt-3 text-sm text-ink/55">
        Uploaded templates appear in every relevant editor and all their
        elements remain editable.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {templates.map((template, index) => (
          <div className="rounded-2xl bg-cream p-4">
            <b>{template.name}</b>
            <p className="text-xs text-ink/50">
              {template.elements?.length || 0} editable layers
            </p>
            <button
              className="mt-3 text-xs text-coral underline"
              onClick={() => persist(templates.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        {!templates.length && (
          <p className="text-sm text-ink/45">
            No owner templates uploaded yet.
          </p>
        )}
      </div>
    </div>
  );
}
function Stat({ icon, n, t }: { icon: React.ReactNode; n: string; t: string }) {
  return (
    <div className="card flex items-center gap-5 p-6">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-blush/40 text-wine">
        {icon}
      </span>
      <div>
        <b className="font-serif text-4xl">{n}</b>
        <p className="text-xs text-ink/50">{t}</p>
      </div>
    </div>
  );
}
function Shop() {
  return <ShopCatalogue />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/reset-password" element={<Navigate to="/admin/reset-password" replace />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:slug" element={<ProductDetails />} />
              <Route path="/templates/:slug/options" element={<FrameTemplateCustomizer />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="/account" element={<Navigate to="/" replace />} />
              <Route path="/profile" element={<Navigate to="/" replace />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/studio" element={<Navigate to="/shop" replace />} />
              <Route path="/create/frame/size" element={<FrameSizePage />} />
              <Route path="/create/wallpaper/*" element={<Navigate to="/shop" replace />} />
              <Route
                path="/create/:product/editor"
                element={<StudioEditor />}
              />
              <Route
                path="/create/:product/preview"
                element={<ProductPreview />}
              />
              <Route
                path="/editor"
                element={<Navigate to="/create/frame/editor" replace />}
              />
              <Route
                path="/create/:product/mood"
                element={<OldMoodRedirect />}
              />
              <Route path="/design-service" element={<DesignService />} />
              <Route
                path="/preview"
                element={<Navigate to="/create/frame/preview" replace />}
              />
              <Route path="/order" element={<Order />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/about" element={<About />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/status" element={<TrackOrderPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
