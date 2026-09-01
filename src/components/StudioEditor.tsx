import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Image as KImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import {
  AlignCenter,
  ArrowDown,
  ArrowUp,
  Brush,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Layers3,
  Lock,
  LockOpen,
  Minus,
  MousePointer2,
  Palette,
  Redo2,
  RotateCcw,
  Save,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  designKey,
  readSelection,
  saveSelection,
  type DesignDocument,
  type DesignElement,
} from "../lib/design";
import {
  frameColours,
  frameSizes,
  products,
  wallpaperPresets,
  type ProductId,
} from "../lib/data";

const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `moonmuse-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normaliseElement = (item: Partial<DesignElement>): DesignElement => ({
  id: typeof item.id === "string" ? item.id : uid(),
  kind: ["image", "text", "shape", "sticker", "drawing"].includes(
    String(item.kind),
  )
    ? (item.kind as DesignElement["kind"])
    : "shape",
  name: typeof item.name === "string" ? item.name : "Element",
  x: Number.isFinite(item.x) ? Number(item.x) : 80,
  y: Number.isFinite(item.y) ? Number(item.y) : 90,
  width: Number.isFinite(item.width) ? Number(item.width) : 140,
  height: Number.isFinite(item.height) ? Number(item.height) : 90,
  rotation: Number.isFinite(item.rotation) ? Number(item.rotation) : 0,
  visible: item.visible !== false,
  locked: item.locked === true,
  opacity: Number.isFinite(item.opacity) ? Number(item.opacity) : 1,
  scaleX: Number.isFinite(item.scaleX) ? Number(item.scaleX) : 1,
  scaleY: Number.isFinite(item.scaleY) ? Number(item.scaleY) : 1,
  fill: item.fill,
  stroke: item.stroke,
  text: item.text,
  fontFamily: item.fontFamily,
  fontSize: item.fontSize,
  fontStyle: item.fontStyle,
  align: item.align,
  letterSpacing: item.letterSpacing,
  lineHeight: item.lineHeight,
  src: item.src,
  points: Array.isArray(item.points) ? item.points : undefined,
  strokeWidth: item.strokeWidth,
  cropMode: item.cropMode,
  brightness: item.brightness,
});
const base = (kind: DesignElement["kind"], name: string): DesignElement => ({
  id: uid(),
  kind,
  name,
  x: 80,
  y: 90,
  width: 220,
  height: 120,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
});
const stickerSet = [
  { label: "Heart", text: "♥" },
  { label: "Star", text: "★" },
  { label: "Flower", text: "✿" },
  { label: "Bow", text: "୨୧" },
  { label: "Sparkle", text: "✦" },
  { label: "Arrow", text: "➜" },
];
const backgrounds = [
  "#F8F3EC",
  "#F4D8D2",
  "#D9B7F2",
  "#C8D8F0",
  "#F2C85B",
  "#AAB7A1",
  "#4A1028",
];

function CanvasImage({
  item,
  selected,
  onSelect,
  onChange,
}: {
  item: DesignElement;
  selected: boolean;
  onSelect: () => void;
  onChange: (x: DesignElement) => void;
}) {
  const [image] = useImage(item.src || "", "anonymous");
  const node = useRef<Konva.Image>(null);
  const tr = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (selected && tr.current && node.current) {
      tr.current.nodes([node.current]);
      tr.current.getLayer()?.batchDraw();
    }
  }, [selected]);
  useEffect(() => {
    if (image && node.current) {
      node.current.cache();
      node.current.getLayer()?.batchDraw();
    }
  }, [image, item.brightness]);
  return (
    <>
      <KImage
        ref={node}
        image={image}
        filters={[Konva.Filters.Brighten]}
        brightness={item.brightness || 0}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        opacity={item.opacity}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        visible={item.visible}
        draggable={!item.locked}
        crop={
          item.cropMode === "square" && image
            ? {
                x: Math.max(0, (image.width - image.height) / 2),
                y: 0,
                width: Math.min(image.width, image.height),
                height: Math.min(image.width, image.height),
              }
            : undefined
        }
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          onChange({ ...item, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const n = node.current!;
          onChange({
            ...item,
            x: n.x(),
            y: n.y(),
            width: Math.max(20, n.width() * n.scaleX()),
            height: Math.max(20, n.height() * n.scaleY()),
            rotation: n.rotation(),
            scaleX: item.scaleX < 0 ? -1 : 1,
            scaleY: 1,
          });
          n.scaleX(item.scaleX < 0 ? -1 : 1);
          n.scaleY(1);
        }}
      />
      {selected && !item.locked && (
        <Transformer ref={tr} rotateEnabled keepRatio={false} />
      )}
    </>
  );
}

function CanvasNode({
  item,
  selected,
  onSelect,
  onChange,
}: {
  item: DesignElement;
  selected: boolean;
  onSelect: () => void;
  onChange: (x: DesignElement) => void;
}) {
  const shapeNode = useRef<Konva.Rect>(null);
  const textNode = useRef<Konva.Text>(null);
  const drawingNode = useRef<Konva.Line>(null);
  const tr = useRef<Konva.Transformer>(null);
  useEffect(() => {
    const target =
      item.kind === "text" || item.kind === "sticker" ? textNode.current : null;
    if (selected && tr.current && target) {
      tr.current.nodes([target]);
      tr.current.getLayer()?.batchDraw();
    }
  }, [selected, item.kind]);
  const transformEnd = (node: Konva.Node) => {
    onChange({
      ...item,
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * node.scaleX()),
      height: Math.max(20, node.height() * node.scaleY()),
      rotation: node.rotation(),
      scaleX: item.scaleX < 0 ? -1 : 1,
      scaleY: 1,
    });
    node.scaleX(item.scaleX < 0 ? -1 : 1);
    node.scaleY(1);
  };
  const common = {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    opacity: item.opacity,
    scaleX: item.scaleX,
    scaleY: item.scaleY,
    visible: item.visible,
    draggable: !item.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: any) =>
      onChange({ ...item, x: e.target.x(), y: e.target.y() }),
  };
  return (
    <>
      {item.kind === "drawing" ? (
        <Line
          ref={drawingNode}
          points={item.points || []}
          x={item.x}
          y={item.y}
          stroke={item.stroke}
          strokeWidth={item.strokeWidth}
          opacity={item.opacity}
          visible={item.visible}
          lineCap="round"
          lineJoin="round"
          draggable={!item.locked}
          onClick={onSelect}
          onTap={onSelect}
        />
      ) : item.kind === "shape" ? (
        <Rect
          ref={shapeNode}
          {...common}
          fill={item.fill}
          stroke={
            item.name.includes("frame") || item.name === "Polaroid"
              ? "#4A1028"
              : undefined
          }
          strokeWidth={
            item.name.includes("frame") || item.name === "Polaroid" ? 5 : 0
          }
          cornerRadius={item.name === "Paper note" ? 4 : 12}
          onTransformEnd={(e) => transformEnd(e.target)}
        />
      ) : (
        <Text
          ref={textNode}
          {...common}
          text={item.text}
          fill={item.fill}
          fontSize={item.fontSize}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          align={item.align}
          letterSpacing={item.letterSpacing}
          lineHeight={item.lineHeight}
          onTransformEnd={(e) => transformEnd(e.target)}
        />
      )}{" "}
      {selected &&
        !item.locked &&
        (item.kind === "text" || item.kind === "sticker") && (
          <Transformer ref={tr} rotateEnabled />
        )}
    </>
  );
}

export function StudioEditor() {
  const { product = "frame" } = useParams<{ product: ProductId }>();
  const nav = useNavigate();
  const selection = readSelection();
  const spec = useMemo(() => {
    if (product === "frame") {
      const s =
        frameSizes.find((x) => x.id === selection.frameSize) || frameSizes[0];
      return {
        variant: s.name,
        width: s.canvas.width,
        height: s.canvas.height,
        frame: String(selection.frameColour || "black") as "black" | "white",
      };
    }
    if (product === "tote")
      return { variant: "One Size", width: 520, height: 600 };
    const p = wallpaperPresets.find((x) => x.id === selection.wallpaperPreset);
    return {
      variant: p?.name || "Custom",
      width: p?.width || Number(selection.customWidth) || 1080,
      height: p?.height || Number(selection.customHeight) || 1920,
    };
  }, [product]);
  const initial = useMemo<DesignDocument>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(designKey(product)) || "null",
      );
      if (saved && typeof saved === "object")
        return {
          ...saved,
          product,
          variant: spec.variant,
          frameColour: spec.frame,
          canvasWidth: spec.width,
          canvasHeight: spec.height,
          background:
            product === "tote"
              ? "#EFE4D0"
              : typeof saved.background === "string"
                ? saved.background
                : "#F8F3EC",
          elements: Array.isArray(saved.elements)
            ? saved.elements.map(normaliseElement)
            : [],
        };
    } catch {}
    return {
      product,
      variant: spec.variant,
      frameColour: spec.frame,
      canvasWidth: spec.width,
      canvasHeight: spec.height,
      background: product === "tote" ? "#EFE4D0" : "#F8F3EC",
      elements: [],
      updatedAt: new Date().toISOString(),
    };
  }, [product]);
  const [doc, setDoc] = useState(initial);
  const [selected, setSelected] = useState<string>();
  const [tab, setTab] = useState("Templates");
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const [saveState, setSaveState] = useState<
    "Saved" | "Saving…" | "Save failed"
  >("Saved");
  const [zoom, setZoom] = useState(0.72);
  const [drawing, setDrawing] = useState(false);
  const [drawColour, setDrawColour] = useState("#315CA8");
  const [brushSize, setBrushSize] = useState(8);
  const [brushType, setBrushType] = useState<"Pencil" | "Marker" | "Brush">(
    "Pencil",
  );
  const [dragLayer, setDragLayer] = useState<number>();
  const stage = useRef<Konva.Stage>(null);
  const guideLayer = useRef<Konva.Layer>(null);
  const file = useRef<HTMLInputElement>(null);
  const replaceFile = useRef<HTMLInputElement>(null);
  const clipboard = useRef<DesignElement>();
  const current = doc.elements.find((e) => e.id === selected);
  const ownerTemplates = useMemo(() => {
    try {
      const templates = JSON.parse(
        localStorage.getItem("moonmuse-owner-templates") || "[]",
      ) as Array<{
        name: string;
        background?: string;
        elements: DesignElement[];
      }>;
      return Array.isArray(templates)
        ? templates
            .filter((template) => template && typeof template === "object")
            .map((template) => ({
              ...template,
              name:
                typeof template.name === "string"
                  ? template.name
                  : "Owner template",
              elements: Array.isArray(template.elements)
                ? template.elements.map(normaliseElement)
                : [],
            }))
        : [];
    } catch {
      return [];
    }
  }, []);
  useEffect(() => saveSelection({ product }), [product]);
  const commit = useCallback(
    (next: DesignDocument) => {
      setHistory((h) => [...h.slice(-39), doc]);
      setFuture([]);
      setDoc(next);
      setSaveState("Saving…");
    },
    [doc],
  );
  const update = (item: DesignElement) =>
    commit({
      ...doc,
      elements: doc.elements.map((x) => (x.id === item.id ? item : x)),
    });
  const add = (item: DesignElement) => {
    commit({ ...doc, elements: [...doc.elements, item] });
    setSelected(item.id);
  };
  const remove = () => {
    if (!selected) return;
    commit({ ...doc, elements: doc.elements.filter((x) => x.id !== selected) });
    setSelected(undefined);
  };
  const duplicate = () => {
    if (!current) return;
    const copy = {
      ...current,
      id: uid(),
      name: `${current.name} copy`,
      x: current.x + 20,
      y: current.y + 20,
    };
    add(copy);
  };
  const undo = useCallback(() => {
    if (!history.length) return;
    setFuture((f) => [doc, ...f]);
    setDoc(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }, [doc, history]);
  const redo = useCallback(() => {
    if (!future.length) return;
    setHistory((h) => [...h, doc]);
    setDoc(future[0]);
    setFuture((f) => f.slice(1));
  }, [doc, future]);
  const upload = (files: FileList | null, replace = false) => {
    [...(files || [])].forEach((f) => {
      if (
        f.size > 10 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(f.type)
      ) {
        alert("Use a JPG, PNG or WebP under 10 MB.");
        return;
      }
      const src = URL.createObjectURL(f);
      if (replace && current) update({ ...current, src, name: f.name });
      else add({ ...base("image", f.name), src, width: 240, height: 180 });
    });
  };
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          designKey(product),
          JSON.stringify({ ...doc, updatedAt: new Date().toISOString() }),
        );
        setSaveState("Saved");
      } catch {
        setSaveState("Save failed");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [doc, product]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
      } else if (mod && e.key.toLowerCase() === "c" && current) {
        e.preventDefault();
        clipboard.current = { ...current };
      } else if (mod && e.key.toLowerCase() === "v" && clipboard.current) {
        e.preventDefault();
        add({
          ...clipboard.current,
          id: uid(),
          name: `${clipboard.current.name} copy`,
          x: clipboard.current.x + 20,
          y: clipboard.current.y + 20,
        });
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        remove();
      } else if (
        current &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        update({
          ...current,
          x:
            current.x +
            (e.key === "ArrowRight" ? d : e.key === "ArrowLeft" ? -d : 0),
          y:
            current.y +
            (e.key === "ArrowDown" ? d : e.key === "ArrowUp" ? -d : 0),
        });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, current, undo, redo]);
  const preview = () => {
    setSelected(undefined);
    setTimeout(() => {
      guideLayer.current?.hide();
      const url = stage.current?.toDataURL({
        pixelRatio: Math.max(
          1,
          spec.width / (stage.current?.width() || spec.width),
        ),
      });
      guideLayer.current?.show();
      const saved = { ...doc, preview: url };
      localStorage.setItem(designKey(product), JSON.stringify(saved));
      nav(`/create/${product}/preview`);
    }, 50);
  };
  const displayW = Math.min(
    product === "tote" ? 520 : 560,
    typeof window !== "undefined" ? window.innerWidth - 32 : 560,
  );
  const displayH = displayW * (spec.height / spec.width);
  const scale = displayW / spec.width;
  const tools = [
    "Templates",
    "Uploads",
    "Photos",
    "Elements",
    "Stickers",
    "Text",
    "Backgrounds",
    "Draw",
    "Layers",
  ].filter((tool) => !(product === "tote" && tool === "Backgrounds"));
  const startDraw = (e: any) => {
    if (tab !== "Draw") return;
    setDrawing(true);
    const p = e.target.getStage().getPointerPosition();
    add({
      ...base("drawing", "Drawing"),
      x: 0,
      y: 0,
      width: spec.width,
      height: spec.height,
      points: [p.x / (scale * zoom), p.y / (scale * zoom)],
      stroke: drawColour,
      strokeWidth:
        brushType === "Marker"
          ? brushSize * 2
          : brushType === "Brush"
            ? brushSize * 1.5
            : brushSize,
      opacity: brushType === "Marker" ? 0.45 : 1,
    });
  };
  const moveDraw = (e: any) => {
    if (!drawing) return;
    const p = e.target.getStage().getPointerPosition();
    const last = doc.elements[doc.elements.length - 1];
    if (last?.kind === "drawing")
      setDoc({
        ...doc,
        elements: doc.elements.map((x) =>
          x.id === last.id
            ? {
                ...x,
                points: [
                  ...(x.points || []),
                  p.x / (scale * zoom),
                  p.y / (scale * zoom),
                ],
              }
            : x,
        ),
      });
  };
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#eee9e2] text-ink">
      <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-wine/10 bg-cream px-4 py-3">
        <div>
          <b className="font-serif text-xl">
            {product === "frame"
              ? `${spec.variant} Memory Frame`
              : product === "tote"
                ? "Painted Tote"
                : "Digital Wallpaper"}
          </b>
          <span className="ml-3 text-xs text-ink/50">{saveState}</span>
        </div>
        <div className="flex items-center gap-1">
          <ToolButton label="Undo" onClick={undo} disabled={!history.length}>
            <RotateCcw />
          </ToolButton>
          <ToolButton label="Redo" onClick={redo} disabled={!future.length}>
            <Redo2 />
          </ToolButton>
          <ToolButton label="Duplicate" onClick={duplicate} disabled={!current}>
            <Copy />
          </ToolButton>
          <ToolButton label="Delete" onClick={remove} disabled={!current}>
            <Trash2 />
          </ToolButton>
          <ToolButton
            label="Save"
            onClick={() => {
              try {
                localStorage.setItem(
                  designKey(product),
                  JSON.stringify({
                    ...doc,
                    updatedAt: new Date().toISOString(),
                  }),
                );
                setSaveState("Saved");
              } catch {
                setSaveState("Save failed");
              }
            }}
          >
            <Save />
          </ToolButton>
          <ToolButton
            label="Reset design"
            onClick={() => {
              if (confirm("Reset this design?"))
                commit({ ...doc, background: "#F8F3EC", elements: [] });
            }}
          >
            <Minus />
          </ToolButton>
          <button className="btn !px-5 !py-2" onClick={preview}>
            Preview
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[104px_250px_1fr_280px]">
        <nav className="flex overflow-x-auto border-b border-wine/10 bg-wine p-2 text-cream lg:block lg:min-h-[calc(100vh-140px)] lg:border-b-0">
          {tools.map((t) => (
            <button
              key={t}
              onClick={() => setTab((open) => (open === t ? "" : t))}
              className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs ${tab === t ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              {toolIcon(t)}
              {t}
            </button>
          ))}
        </nav>
        {tab && (
          <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[46vh] overflow-y-auto rounded-t-[1.5rem] border-r border-wine/10 bg-cream p-4 shadow-2xl lg:static lg:max-h-none lg:rounded-none lg:shadow-none">
            <Panel title={tab} onClose={() => setTab("")}>
              {tab === "Templates" && (
                <div className="grid gap-3">
                  {ownerTemplates.length ? (
                    ownerTemplates.map((template) => (
                      <button
                        className="card p-4 text-left"
                        onClick={() =>
                          commit({
                            ...doc,
                            background:
                              product === "tote"
                                ? "#EFE4D0"
                                : template.background || doc.background,
                            elements: template.elements.map((element) => ({
                              ...element,
                              id: uid(),
                            })),
                          })
                        }
                      >
                        <b>{template.name}</b>
                        <span className="mt-1 block text-xs text-ink/50">
                          Owner template · fully editable
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-wine/20 p-5 text-sm text-ink/55">
                      No templates yet. The owner can upload editable template
                      JSON from the dashboard.
                    </div>
                  )}
                </div>
              )}
              {(tab === "Uploads" || tab === "Photos") && (
                <>
                  <button
                    className="btn w-full"
                    onClick={() => file.current?.click()}
                  >
                    <Upload size={17} />
                    Upload photos
                  </button>
                  <input
                    ref={file}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => upload(e.target.files)}
                  />
                  <p className="mt-4 text-xs text-ink/50">
                    Multiple JPG, PNG or WebP files · 10 MB each
                  </p>
                </>
              )}
              {tab === "Elements" && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { n: "Paper note", c: "#F2C85B" },
                    { n: "Polaroid", c: "#fffdf8" },
                    { n: "Gingham tape", c: "#D9A5A5" },
                    { n: "Film strip", c: "#2D1821" },
                    { n: "Rounded frame", c: "#D9B7F2" },
                    { n: "Photo grid", c: "#315CA8" },
                    { n: "Circle graphic", c: "#F07368" },
                    { n: "Pastel shape", c: "#AAB7A1" },
                    { n: "Decorative border", c: "#4A1028" },
                    { n: "Caption card", c: "#F8F3EC" },
                  ].map((x) => (
                    <button
                      className="card p-4"
                      onClick={() =>
                        add({
                          ...base("shape", x.n),
                          fill: x.c,
                          width:
                            x.n.includes("frame") || x.n.includes("border")
                              ? 180
                              : 140,
                          height:
                            x.n.includes("frame") || x.n.includes("border")
                              ? 180
                              : 90,
                        })
                      }
                    >
                      {x.n}
                    </button>
                  ))}
                </div>
              )}
              {tab === "Stickers" && (
                <div className="grid grid-cols-3 gap-2">
                  {stickerSet.map((x) => (
                    <button
                      className="card p-4 text-3xl"
                      title={x.label}
                      onClick={() =>
                        add({
                          ...base("sticker", x.label),
                          text: x.text,
                          fill: "#F07368",
                          fontSize: 64,
                          width: 90,
                          height: 90,
                        })
                      }
                    >
                      {x.text}
                    </button>
                  ))}
                </div>
              )}
              {tab === "Text" && (
                <div className="grid gap-3">
                  <button
                    className="card p-4 text-left font-serif text-2xl"
                    onClick={() =>
                      add({
                        ...base("text", "Heading"),
                        text: "Add a heading",
                        fill: "#4A1028",
                        fontFamily: "Cormorant Garamond",
                        fontSize: 44,
                        width: 320,
                      })
                    }
                  >
                    Add a heading
                  </button>
                  <button
                    className="card p-4 text-left"
                    onClick={() =>
                      add({
                        ...base("text", "Body text"),
                        text: "Add body text",
                        fill: "#2D1821",
                        fontFamily: "DM Sans",
                        fontSize: 24,
                        width: 260,
                      })
                    }
                  >
                    Add body text
                  </button>
                  <button
                    className="card p-4 text-left font-hand"
                    onClick={() =>
                      add({
                        ...base("text", "Handwritten note"),
                        text: "a little note ♡",
                        fill: "#315CA8",
                        fontFamily: "Caveat",
                        fontSize: 38,
                        width: 280,
                      })
                    }
                  >
                    Add handwritten text
                  </button>
                </div>
              )}
              {tab === "Backgrounds" && (
                <div>
                  <p className="mb-3 text-sm text-ink/55">
                    Recommended MoonMuse pastels
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      ...backgrounds,
                      "#FBE4E6",
                      "#E8DFF5",
                      "#DDEDEA",
                      "#FCF4DD",
                      "#DAEAF6",
                      "#FCE1E4",
                      "#E2F0CB",
                      "#FDF1D6",
                    ].map((c) => (
                      <button
                        aria-label={`Background ${c}`}
                        className="aspect-square rounded-xl border border-wine/15"
                        style={{ background: c }}
                        onClick={() => commit({ ...doc, background: c })}
                      />
                    ))}
                  </div>
                  <label className="label mt-6">
                    Choose any colour
                    <input
                      type="color"
                      value={doc.background}
                      onChange={(e) =>
                        commit({ ...doc, background: e.target.value })
                      }
                      className="mt-2 h-12 w-full cursor-pointer rounded-xl"
                    />
                  </label>
                </div>
              )}
              {tab === "Draw" && (
                <div className="space-y-5">
                  <p className="text-sm">Draw directly on the canvas.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Pencil", "Marker", "Brush"] as const).map((brush) => (
                      <button
                        className={`tag ${brushType === brush ? "active" : ""}`}
                        onClick={() => setBrushType(brush)}
                      >
                        {brush}
                      </button>
                    ))}
                  </div>
                  <label className="label">
                    Brush colour
                    <input
                      type="color"
                      value={drawColour}
                      onChange={(e) => setDrawColour(e.target.value)}
                      className="mt-2 h-10 w-full"
                    />
                  </label>
                  <label className="label">
                    Brush size
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={brushSize}
                      onChange={(e) => setBrushSize(+e.target.value)}
                      className="mt-2 w-full accent-wine"
                    />
                  </label>
                  <button
                    className="tag w-full"
                    onClick={() => setDrawColour(doc.background)}
                  >
                    Eraser
                  </button>
                </div>
              )}
              {tab === "Layers" && (
                <div className="space-y-2">
                  {[...doc.elements].reverse().map((x, ri) => {
                    const i = doc.elements.length - 1 - ri;
                    return (
                      <div
                        draggable
                        onDragStart={() => setDragLayer(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragLayer === undefined) return;
                          const els = [...doc.elements];
                          const [m] = els.splice(dragLayer, 1);
                          els.splice(i, 0, m);
                          commit({ ...doc, elements: els });
                        }}
                        className={`flex items-center gap-1 rounded-xl border p-2 ${selected === x.id ? "border-wine bg-blush/20" : "border-wine/10 bg-white"}`}
                      >
                        <button
                          className="min-w-0 flex-1 truncate text-left text-sm"
                          onClick={() => setSelected(x.id)}
                          onDoubleClick={() => {
                            const name = prompt("Rename layer", x.name);
                            if (name?.trim())
                              update({ ...x, name: name.trim() });
                          }}
                          title="Double-click to rename"
                        >
                          {x.name}
                        </button>
                        <button
                          onClick={() => update({ ...x, visible: !x.visible })}
                        >
                          {x.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => update({ ...x, locked: !x.locked })}
                        >
                          {x.locked ? (
                            <Lock size={15} />
                          ) : (
                            <LockOpen size={15} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </aside>
        )}
        <main className="relative flex min-h-[650px] items-center justify-center overflow-hidden p-4 paper">
          <div
            className={
              product === "frame"
                ? "border-[18px] p-2 shadow-xl"
                : product === "tote"
                  ? "relative mt-20 rounded-b-[3rem] bg-[#EFE4D0] p-10 shadow-xl before:absolute before:-top-20 before:left-1/4 before:h-24 before:w-1/2 before:rounded-t-full before:border-[18px] before:border-b-0 before:border-[#EFE4D0] before:content-['']"
                  : "rounded-2xl border-[10px] border-ink bg-ink shadow-xl"
            }
            style={
              product === "frame"
                ? {
                    borderColor: frameColours.find((c) => c.id === spec.frame)
                      ?.colour,
                  }
                : undefined
            }
          >
            <Stage
              ref={stage}
              width={displayW * zoom}
              height={displayH * zoom}
              scaleX={scale * zoom}
              scaleY={scale * zoom}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) setSelected(undefined);
                startDraw(e);
              }}
              onMouseMove={moveDraw}
              onMouseUp={() => setDrawing(false)}
            >
              <Layer>
                <Rect
                  width={spec.width}
                  height={spec.height}
                  fill={doc.background}
                />
                {doc.elements.map((x) =>
                  x.kind === "image" ? (
                    <CanvasImage
                      key={x.id}
                      item={x}
                      selected={selected === x.id}
                      onSelect={() => setSelected(x.id)}
                      onChange={update}
                    />
                  ) : (
                    <CanvasNode
                      key={x.id}
                      item={x}
                      selected={selected === x.id}
                      onSelect={() => setSelected(x.id)}
                      onChange={update}
                    />
                  ),
                )}
              </Layer>
              <Layer ref={guideLayer} listening={false}>
                {product === "wallpaper" && (
                  <>
                    <Rect
                      x={spec.width * 0.08}
                      y={spec.height * 0.05}
                      width={spec.width * 0.84}
                      height={spec.height * 0.15}
                      stroke="#4A102866"
                      dash={[18, 12]}
                    />
                    <Rect
                      x={spec.width * 0.06}
                      y={spec.height * 0.86}
                      width={spec.width * 0.88}
                      height={spec.height * 0.09}
                      stroke="#4A102866"
                      dash={[18, 12]}
                    />
                  </>
                )}
                {product === "tote" && (
                  <Rect
                    x={30}
                    y={30}
                    width={spec.width - 60}
                    height={spec.height - 60}
                    stroke="#4A102855"
                    dash={[12, 10]}
                  />
                )}
              </Layer>
            </Stage>
          </div>
          <div className="absolute bottom-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))}
            >
              <ZoomOut size={18} />
            </button>
            <span className="w-12 text-center text-xs">
              {Math.round(zoom * 100)}%
            </span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            >
              <ZoomIn size={18} />
            </button>
            <button className="ml-2 text-xs" onClick={() => setZoom(0.72)}>
              Fit
            </button>
          </div>
        </main>
        <aside className="border-l border-wine/10 bg-cream p-5">
          <p className="label">Properties</p>
          {!current ? (
            <p className="text-sm text-ink/50">
              Select an element to edit its properties.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <b>{current.name}</b>
                <p className="text-xs capitalize text-ink/50">{current.kind}</p>
              </div>
              {current.kind === "shape" && (
                <div className="space-y-4">
                  <label className="label">
                    Width
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="30"
                      max={spec.width}
                      value={current.width}
                      onChange={(e) =>
                        update({ ...current, width: +e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Height
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="30"
                      max={spec.height}
                      value={current.height}
                      onChange={(e) =>
                        update({ ...current, height: +e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Rotation
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="-180"
                      max="180"
                      value={current.rotation}
                      onChange={(e) =>
                        update({ ...current, rotation: +e.target.value })
                      }
                    />
                  </label>
                </div>
              )}
              {(current.kind === "text" || current.kind === "sticker") && (
                <>
                  <label className="label">
                    Text
                    <textarea
                      className="field normal-case"
                      value={current.text}
                      onChange={(e) =>
                        update({ ...current, text: e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Font
                    <select
                      className="field normal-case"
                      value={current.fontFamily}
                      onChange={(e) =>
                        update({ ...current, fontFamily: e.target.value })
                      }
                    >
                      <option>Cormorant Garamond</option>
                      <option>DM Sans</option>
                      <option>Caveat</option>
                      <option>Georgia</option>
                    </select>
                  </label>
                  <label className="label">
                    Size
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="10"
                      max="120"
                      value={current.fontSize}
                      onChange={(e) =>
                        update({ ...current, fontSize: +e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Alignment
                    <select
                      className="field normal-case"
                      value={current.align || "left"}
                      onChange={(e) =>
                        update({
                          ...current,
                          align: e.target.value as "left" | "center" | "right",
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="label">
                    Letter spacing
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="-2"
                      max="20"
                      value={current.letterSpacing || 0}
                      onChange={(e) =>
                        update({ ...current, letterSpacing: +e.target.value })
                      }
                    />
                  </label>
                  <label className="label">
                    Line height
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="0.8"
                      max="2.5"
                      step=".1"
                      value={current.lineHeight || 1.2}
                      onChange={(e) =>
                        update({ ...current, lineHeight: +e.target.value })
                      }
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      className={`tag ${current.fontStyle?.includes("bold") ? "active" : ""}`}
                      onClick={() =>
                        update({
                          ...current,
                          fontStyle: current.fontStyle?.includes("bold")
                            ? "normal"
                            : "bold",
                        })
                      }
                    >
                      Bold
                    </button>
                    <button
                      className={`tag ${current.fontStyle?.includes("italic") ? "active" : ""}`}
                      onClick={() =>
                        update({
                          ...current,
                          fontStyle: current.fontStyle?.includes("italic")
                            ? "normal"
                            : "italic",
                        })
                      }
                    >
                      Italic
                    </button>
                  </div>
                </>
              )}
              {current.kind === "image" && (
                <>
                  <button
                    className="tag w-full"
                    onClick={() =>
                      update({
                        ...current,
                        cropMode:
                          current.cropMode === "square" ? "fit" : "square",
                      })
                    }
                  >
                    Crop: {current.cropMode === "square" ? "Square" : "Fit"}
                  </button>
                  <button
                    className="tag w-full"
                    onClick={() => replaceFile.current?.click()}
                  >
                    Replace image
                  </button>
                  <label className="label">
                    Adjust brightness
                    <input
                      className="w-full accent-wine"
                      type="range"
                      min="-.8"
                      max=".8"
                      step=".05"
                      value={current.brightness || 0}
                      onChange={(e) =>
                        update({ ...current, brightness: +e.target.value })
                      }
                    />
                  </label>
                  <input
                    ref={replaceFile}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => upload(e.target.files, true)}
                  />
                </>
              )}{" "}
              {current.kind !== "drawing" && (
                <label className="label">
                  Colour
                  <input
                    type="color"
                    className="mt-2 h-10 w-full"
                    value={current.fill || "#F07368"}
                    onChange={(e) =>
                      update({ ...current, fill: e.target.value })
                    }
                  />
                </label>
              )}
              <label className="label">
                Transparency
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step=".05"
                  value={current.opacity}
                  onChange={(e) =>
                    update({ ...current, opacity: +e.target.value })
                  }
                  className="w-full accent-wine"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="tag"
                  onClick={() =>
                    update({ ...current, scaleX: current.scaleX * -1 })
                  }
                >
                  Flip
                </button>
                <button className="tag" onClick={duplicate}>
                  Duplicate
                </button>
                <button
                  className="tag"
                  onClick={() => {
                    const i = doc.elements.findIndex(
                      (x) => x.id === current.id,
                    );
                    if (i < doc.elements.length - 1) {
                      const e = [...doc.elements];
                      [e[i], e[i + 1]] = [e[i + 1], e[i]];
                      commit({ ...doc, elements: e });
                    }
                  }}
                >
                  <ChevronUp size={16} /> Forward
                </button>
                <button
                  className="tag"
                  onClick={() => {
                    const i = doc.elements.findIndex(
                      (x) => x.id === current.id,
                    );
                    if (i > 0) {
                      const e = [...doc.elements];
                      [e[i], e[i - 1]] = [e[i - 1], e[i]];
                      commit({ ...doc, elements: e });
                    }
                  }}
                >
                  <ChevronDown size={16} /> Backward
                </button>
                <button
                  className="tag"
                  onClick={() =>
                    commit({
                      ...doc,
                      elements: [
                        ...doc.elements.filter((x) => x.id !== current.id),
                        current,
                      ],
                    })
                  }
                >
                  Bring to front
                </button>
                <button
                  className="tag"
                  onClick={() =>
                    commit({
                      ...doc,
                      elements: [
                        current,
                        ...doc.elements.filter((x) => x.id !== current.id),
                      ],
                    })
                  }
                >
                  Send to back
                </button>
              </div>
              <button
                className="tag w-full border-coral text-coral"
                onClick={remove}
              >
                <Trash2 className="inline" size={16} /> Delete
              </button>
            </div>
          )}
        </aside>
      </div>
      {product === "tote" && (
        <div className="bg-wine p-4 text-center text-sm text-cream">
          Your design will be recreated by hand. Small variations make every
          tote unique. · ₹{products.find((p) => p.id === "tote")?.price || 499}{" "}
          + shipping
        </div>
      )}
    </div>
  );
}
function ToolButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full p-2 hover:bg-wine/10 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-3xl">{title}</h2>
        <button className="tag lg:hidden" onClick={onClose}>
          Close
        </button>
      </div>
      {children}
    </>
  );
}
function toolIcon(t: string) {
  const p = { size: 20 };
  return t === "Uploads" ? (
    <Upload {...p} />
  ) : t === "Photos" ? (
    <ImagePlus {...p} />
  ) : t === "Elements" ? (
    <Shapes {...p} />
  ) : t === "Stickers" ? (
    <Sparkles {...p} />
  ) : t === "Text" ? (
    <Type {...p} />
  ) : t === "Backgrounds" ? (
    <Palette {...p} />
  ) : t === "Draw" ? (
    <Brush {...p} />
  ) : t === "Layers" ? (
    <Layers3 {...p} />
  ) : (
    <MousePointer2 {...p} />
  );
}
