import { ArrowRight, Check, Download } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PageHero } from "./Layout";
import {
  frameColours,
  frameSizes,
  money,
  products,
  wallpaperPresets,
  type ProductId,
} from "../lib/data";
import {
  designKey,
  readSelection,
  saveSelection,
  type DesignDocument,
} from "../lib/design";

export function ProductPicker() {
  const nav = useNavigate();
  const choose = (id: ProductId) => {
    saveSelection({ product: id });
    nav(
      id === "frame"
        ? "/create/frame/size"
        : id === "tote"
          ? "/create/tote/editor"
          : "/create/wallpaper/size",
    );
  };
  return (
    <>
      <PageHero
        eyebrow="Enter the studio"
        title="What shall we make?"
        text="Choose your keepsake and we’ll take you straight to the right studio."
        image={false}
      />
      <section className="section grid gap-5 md:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => choose(p.id)}
            className="card group text-left"
          >
            <img
              src={p.image}
              className={`h-72 w-full object-cover ${p.crop}`}
              alt={p.name}
            />
            <div className="p-6">
              <h2 className="text-3xl">{p.name}</h2>
              <p className="mt-1 text-sm text-ink/60">{p.short}</p>
              <div className="mt-5 flex items-center justify-between font-semibold text-wine">
                <span>{p.priceLabel}</span>
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </div>
          </button>
        ))}
      </section>
    </>
  );
}
export function OldMoodRedirect() {
  const { product = "frame" } = useParams();
  return (
    <Navigate
      to={
        product === "wallpaper"
          ? "/create/wallpaper/editor"
          : product === "tote"
            ? "/create/tote/editor"
            : "/create/frame/editor"
      }
      replace
    />
  );
}

export function FrameSizePage() {
  const nav = useNavigate();
  const current = readSelection();
  const selectedSize = String(current.frameSize || "small");
  const selectedColour = String(current.frameColour || "black");
  const select = (value: Record<string, string>) => {
    saveSelection(value);
    location.reload();
  };
  return (
    <>
      <PageHero
        eyebrow="Memory frame · Step 2"
        title="Choose your frame."
        text="Pick the size and physical frame colour. You can change the artwork background later."
        image={false}
      />
      <section className="section !max-w-5xl">
        <h2 className="mb-6 text-4xl">1. Select a size</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {frameSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => select({ frameSize: size.id })}
              className={`card p-7 text-left transition ${selectedSize === size.id ? "bg-wine text-cream ring-2 ring-wine ring-offset-4 ring-offset-cream" : ""}`}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-3xl">{size.name}</h3>
                  <p
                    className={
                      selectedSize === size.id ? "text-cream/70" : "text-ink/60"
                    }
                  >
                    {size.dimensions}
                  </p>
                </div>
                {selectedSize === size.id && <Check />}
              </div>
              <b className="mt-8 block text-xl">
                {money(size.price)} + shipping
              </b>
              <p
                className={`mt-2 text-xs ${selectedSize === size.id ? "text-cream/60" : "text-ink/50"}`}
              >
                Shipping charges will be confirmed using your delivery PIN code.
              </p>
            </button>
          ))}
        </div>
        <h2 className="mb-6 mt-12 text-4xl">2. Choose frame colour</h2>
        <div className="flex gap-4">
          {frameColours.map((c) => (
            <button
              key={c.id}
              onClick={() => select({ frameColour: c.id })}
              className={`flex items-center gap-3 rounded-2xl border p-4 pr-7 ${selectedColour === c.id ? "border-wine bg-blush/20 ring-2 ring-wine" : "border-wine/15 bg-white"}`}
            >
              <span
                className="h-14 w-11 rounded-sm border-[7px] shadow-inner"
                style={{ borderColor: c.colour, background: "#F8F3EC" }}
              />
              <b>{c.name}</b>
            </button>
          ))}
        </div>
        <button
          className="btn mt-10"
          onClick={() => nav("/create/frame/editor")}
        >
          Continue to Customize <ArrowRight size={17} />
        </button>
      </section>
    </>
  );
}

export function WallpaperSizePage() {
  const nav = useNavigate();
  const saved = readSelection();
  const selected = String(saved.wallpaperPreset || "mobile");
  const choose = (id: string) => {
    saveSelection({ wallpaperPreset: id });
    location.reload();
  };
  return (
    <>
      <PageHero
        eyebrow="Free digital wallpaper"
        title="Choose your screen."
        text="Pick a device preset or enter your own safe dimensions."
        image={false}
      />
      <section className="section !max-w-5xl">
        <div className="grid gap-5 md:grid-cols-3">
          {wallpaperPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={`card p-7 text-left ${selected === p.id ? "bg-wine text-cream ring-2 ring-wine ring-offset-4 ring-offset-cream" : ""}`}
            >
              <h3 className="text-3xl">{p.name}</h3>
              <b className="mt-5 block">{p.dimensions}</b>
              <p className="text-sm opacity-65">{p.note}</p>
            </button>
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-white p-6">
          <p className="label">Custom size</p>
          <div className="flex flex-wrap gap-3">
            <input
              id="custom-w"
              className="field max-w-44"
              type="number"
              min="640"
              max="3840"
              placeholder="Width"
            />
            <input
              id="custom-h"
              className="field max-w-44"
              type="number"
              min="640"
              max="3840"
              placeholder="Height"
            />
            <button
              className="tag"
              onClick={() => {
                const w = Number(
                  (document.getElementById("custom-w") as HTMLInputElement)
                    .value,
                );
                const h = Number(
                  (document.getElementById("custom-h") as HTMLInputElement)
                    .value,
                );
                if (w >= 640 && w <= 3840 && h >= 640 && h <= 3840) {
                  saveSelection({
                    wallpaperPreset: "custom",
                    customWidth: w,
                    customHeight: h,
                  });
                  nav("/create/wallpaper/editor");
                }
              }}
            >
              Use custom size
            </button>
          </div>
        </div>
        <button
          className="btn mt-8"
          onClick={() => nav("/create/wallpaper/editor")}
        >
          Continue to Customize <ArrowRight size={17} />
        </button>
      </section>
    </>
  );
}

function loadDesign(product: ProductId) {
  try {
    return JSON.parse(
      localStorage.getItem(designKey(product)) || "null",
    ) as DesignDocument | null;
  } catch {
    return null;
  }
}
export function ProductPreview() {
  const { product = "frame" } = useParams<{ product: ProductId }>();
  const nav = useNavigate();
  const design = loadDesign(product as ProductId);
  const selection = readSelection();
  if (!design)
    return (
      <section className="section text-center">
        <h1 className="text-5xl">No saved design yet.</h1>
        <button
          className="btn mt-6"
          onClick={() => nav(`/create/${product}/editor`)}
        >
          Open editor
        </button>
      </section>
    );
  const frameSize =
    frameSizes.find((s) => s.id === selection.frameSize) || frameSizes[0];
  const frameColour = String(selection.frameColour || "black");
  const price =
    product === "frame"
      ? frameSize.price
      : product === "tote"
        ? products.find((p) => p.id === "tote")?.price || 499
        : 0;
  const download = () => {
    if (!design.preview) return;
    const a = document.createElement("a");
    a.href = design.preview;
    a.download = "moonmuse-wallpaper.png";
    a.click();
  };
  return (
    <>
      <PageHero
        eyebrow="Your finished design"
        title={
          product === "frame"
            ? "Meet your memory frame."
            : product === "tote"
              ? "Your tote, imagined."
              : "Your screen, made yours."
        }
        text={
          product === "wallpaper"
            ? "Preview your free wallpaper before downloading the full-resolution PNG."
            : "See the placement and details before sending your request."
        }
        image={false}
      />
      <section className="section grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div
          className={`relative grid min-h-[560px] place-items-center overflow-hidden rounded-[2rem] ${product === "wallpaper" ? "bg-lilac/30" : "bg-[#ded4c8] paper"}`}
        >
          {product === "frame" && (
            <div className="absolute bottom-0 h-28 w-full bg-[#b99575]" />
          )}
          <div
            className={
              product === "frame"
                ? "relative border-[18px] bg-white p-2 shadow-2xl"
                : product === "tote"
                  ? "relative rounded-b-[3rem] bg-[#eee1c8] p-12 shadow-2xl before:absolute before:-top-24 before:left-1/4 before:h-32 before:w-1/2 before:rounded-t-full before:border-[18px] before:border-[#eee1c8]"
                  : "relative rounded-[2rem] border-[12px] border-ink bg-ink p-1 shadow-2xl"
            }
            style={
              product === "frame"
                ? {
                    borderColor:
                      frameColour === "black" ? "#171417" : "#fffdf8",
                  }
                : undefined
            }
          >
            <img
              src={design.preview}
              className={`block max-h-[430px] max-w-full object-contain ${product === "tote" ? "w-64" : ""}`}
              alt="Your saved MoonMuse design"
            />
          </div>
        </div>
        <aside className="rounded-[2rem] bg-wine p-8 text-cream">
          <p className="label !text-blush">Final preview</p>
          <h2 className="text-4xl">
            {product === "frame"
              ? `${frameSize.name} · ${frameSize.dimensions}`
              : product === "tote"
                ? "Painted Tote"
                : `${design.variant} Wallpaper`}
          </h2>
          <div className="my-7 space-y-3 border-y border-white/15 py-5 text-sm">
            {product === "frame" && (
              <p className="flex justify-between">
                <span>Frame colour</span>
                <b className="capitalize">{frameColour}</b>
              </p>
            )}
            <p className="flex justify-between">
              <span>Price</span>
              <b>
                {money(price)}
                {product !== "wallpaper" && " + shipping"}
              </b>
            </p>
            {product !== "wallpaper" && (
              <p className="flex justify-between">
                <span>Shipping</span>
                <b>To be confirmed</b>
              </p>
            )}
          </div>
          {product === "tote" && (
            <p className="mb-5 text-sm text-cream/65">
              Your design will be recreated by hand. Small variations make every
              tote unique.
            </p>
          )}
          <div className="grid gap-3">
            <button
              className="btn-light"
              onClick={() => nav(`/create/${product}/editor`)}
            >
              Back to Edit
            </button>
            {product === "wallpaper" ? (
              <button
                className="rounded-full bg-coral px-6 py-3 font-semibold"
                onClick={download}
              >
                <Download className="inline" size={17} /> Download Free
                Wallpaper
              </button>
            ) : (
              <button
                className="rounded-full bg-coral px-6 py-3 font-semibold"
                onClick={() => nav("/order")}
              >
                Continue to Order
              </button>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
