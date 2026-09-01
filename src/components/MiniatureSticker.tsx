import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

type MiniatureStickerProps = { src: string; size: CSSProperties["width"]; rotation?: number; position: CSSProperties; className?: string; hideOnMobile?: boolean; flipHorizontal?: boolean };

export function MiniatureSticker({ src, size, rotation = 0, position, className = "", hideOnMobile = false, flipHorizontal = false }: MiniatureStickerProps) {
  const reduceMotion = useReducedMotion();
  return <motion.img src={src} alt="" aria-hidden="true" className={`pointer-events-none absolute z-10 select-none object-contain drop-shadow-[0_8px_12px_rgba(74,16,40,0.18)] ${hideOnMobile ? "hidden md:block" : ""} ${className}`} style={{ width: size, height: "auto", rotate: rotation, scaleX: flipHorizontal ? -1 : 1, ...position }} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: "easeOut" }} />;
}
