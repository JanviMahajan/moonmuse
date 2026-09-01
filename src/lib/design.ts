import type { ProductId } from "./data";
export type ElementKind = "image" | "text" | "shape" | "sticker" | "drawing";
export type DesignElement = {
  id: string;
  kind: ElementKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  scaleX: number;
  scaleY: number;
  fill?: string;
  stroke?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  src?: string;
  points?: number[];
  strokeWidth?: number;
  cropMode?: "fit" | "square";
  brightness?: number;
};
export type DesignDocument = {
  product: ProductId;
  variant: string;
  frameColour?: "black" | "white";
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  elements: DesignElement[];
  updatedAt: string;
  preview?: string;
};
export const designKey = (product: ProductId) => `moonmuse-design-${product}`;
export const selectionKey = "moonmuse-selection";
export const readSelection = () => {
  try {
    const value = JSON.parse(localStorage.getItem(selectionKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string | number>)
      : {};
  } catch {
    localStorage.removeItem(selectionKey);
    return {};
  }
};
export const saveSelection = (value: Record<string, string | number>) =>
  localStorage.setItem(
    selectionKey,
    JSON.stringify({ ...readSelection(), ...value }),
  );
