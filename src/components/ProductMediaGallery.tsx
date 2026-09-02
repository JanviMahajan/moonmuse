import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import type { ProductMedia } from "../lib/commerce";

const placeholder = "/images/frame1.jpg";

export function ProductMediaGallery({ media, productName }: { media: ProductMedia[]; productName: string }) {
  const items = media.length ? media : [{ id: "placeholder", type: "image" as const, url: placeholder, thumbnailUrl: placeholder, alt: productName, caption: "", isPrimary: true }];
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const current = items[selected] || items[0];

  const select = (index: number) => {
    video.current?.pause();
    setSelected((index + items.length) % items.length);
    setZoomed(false);
  };
  const previous = () => select(selected - 1);
  const next = () => select(selected + 1);

  useEffect(() => {
    const likely = items[(selected + 1) % items.length];
    if (likely?.type === "image" && likely.url) { const image = new Image(); image.src = likely.url; }
  }, [selected, items]);
  useEffect(() => {
    if (!lightbox) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { video.current?.pause(); setLightbox(false); setZoomed(false); }
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); };
  });

  const mediaNode = (fullScreen = false) => current.type === "video"
    ? <video ref={video} key={current.id} src={current.url} poster={current.posterUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={current.alt || `${productName} video`}/>
    : <button type="button" className="h-full w-full cursor-zoom-in" onClick={() => fullScreen ? setZoomed(!zoomed) : setLightbox(true)} aria-label={`Open full-screen image: ${current.alt || productName}`}>
      <img src={failed[current.id] ? placeholder : current.url} onError={() => setFailed((old) => ({ ...old, [current.id]: true }))} className={`h-full w-full object-contain transition-transform duration-200 ${fullScreen && zoomed ? "scale-150 cursor-zoom-out" : ""}`} alt={current.alt || productName}/>
    </button>;

  return <>
    <div className="grid min-w-0 gap-3 md:grid-cols-[82px_minmax(0,1fr)]">
      <div className="hidden max-h-[min(600px,75vh)] flex-col gap-3 overflow-y-auto pr-1 md:flex" aria-label="Product media thumbnails">
        {items.map((item, index) => <button key={item.id} type="button" onClick={() => select(index)} className={`relative h-[82px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-[#eee8df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine ${selected === index ? "border-wine" : "border-transparent"}`} aria-label={`Show ${item.type === "video" ? "video" : "image"} ${index + 1} of ${items.length}`} aria-current={selected === index}>
          {item.type === "image"
            ? <img src={item.thumbnailUrl || item.url || placeholder} className="h-full w-full object-cover" alt=""/>
            : item.posterUrl
              ? <img src={item.posterUrl} className="h-full w-full object-cover" alt=""/>
              : <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden="true"/>}
          {item.type !== "image" && <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Play size={22} fill="currentColor"/></span>}
        </button>)}
      </div>
      <div className="relative aspect-[4/5] max-h-[min(600px,75vh)] min-h-[340px] overflow-hidden rounded-3xl bg-[#eee8df] md:aspect-square" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 45) distance > 0 ? previous() : next(); touchStart.current = null; }}>
        {mediaNode()}
        {items.length > 1 && <><button type="button" onClick={previous} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine" aria-label="Previous product media"><ChevronLeft/></button><button type="button" onClick={next} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine" aria-label="Next product media"><ChevronRight/></button></>}
        {current.type === "image" && <button type="button" onClick={() => setLightbox(true)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow" aria-label="Open full-screen gallery"><Expand size={18}/></button>}
        <span className="absolute bottom-3 right-3 rounded-full bg-wine/85 px-3 py-1 text-xs text-white" aria-live="polite">{selected + 1} / {items.length}</span>
      </div>
      <div className="flex justify-center gap-2 md:hidden" aria-hidden="true">{items.map((item, index) => <span key={item.id} className={`h-2 rounded-full transition-all ${selected === index ? "w-6 bg-wine" : "w-2 bg-wine/25"}`}/>)}</div>
      {current.caption && <p className="text-center text-xs text-ink/55 md:col-start-2">{current.caption}</p>}
    </div>
    {lightbox && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${productName} media viewer`}>
      <button type="button" onClick={() => { video.current?.pause(); setLightbox(false); setZoomed(false); }} className="absolute right-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-white text-wine" aria-label="Close full-screen gallery"><X/></button>
      <div className="h-[88vh] w-full max-w-6xl overflow-hidden">{mediaNode(true)}</div>
      {items.length > 1 && <><button type="button" onClick={previous} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-wine" aria-label="Previous product media"><ChevronLeft/></button><button type="button" onClick={next} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-wine" aria-label="Next product media"><ChevronRight/></button></>}
    </div>}
  </>;
}
