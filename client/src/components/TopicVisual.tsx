/**
 * TopicVisual — Adaptly
 *
 * Renders a copyright-free topic image card with prev/next scrolling.
 * Images come from the topic-image-bank (Unsplash + Bioicons MIT).
 * Selection persisted in localStorage per subject+topic.
 *
 * Usage:
 *   <TopicVisual subject="mathematics" topic="Fractions" size="md" />
 *   <TopicVisual subject="biology" topic="Cell Biology" editable />
 */

import { useState, useCallback } from "react";
import {
  getTopicImages,
  getTopicVariant,
  setTopicVariant,
  nextTopicVariant,
  prevTopicVariant,
  type TopicImage,
} from "@/lib/topic-image-bank";
import { ChevronLeft, ChevronRight, ImageIcon, ExternalLink } from "lucide-react";

// ── Size presets ──────────────────────────────────────────────────────────────
const SIZES = {
  sm:   { h: 72,  textSize: "text-xs" },
  md:   { h: 140, textSize: "text-sm" },
  lg:   { h: 200, textSize: "text-base" },
  full: { h: 160, textSize: "text-sm" },
};

type SizeKey = keyof typeof SIZES;

interface TopicVisualProps {
  subject: string;
  topic: string;
  size?: SizeKey;
  /** Show prev/next arrows to cycle images on hover */
  editable?: boolean;
  className?: string;
}

// ── Bioicon SVG overlay card ──────────────────────────────────────────────────
function BioiconCard({
  image, topic, h,
}: { image: TopicImage; topic: string; h: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="w-full flex items-center justify-center relative overflow-hidden"
      style={{ height: h, background: image.bg || "#dbeafe", borderRadius: 12 }}
    >
      {!imgError ? (
        <img
          src={image.url}
          alt={topic}
          onError={() => setImgError(true)}
          className="h-3/4 max-h-28 w-auto object-contain drop-shadow-sm"
          style={{ imageRendering: "crisp-edges" }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-blue-400 opacity-60">
          <ImageIcon className="w-10 h-10" />
          <span className="text-xs font-medium">{topic}</span>
        </div>
      )}
      {/* Topic label bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.25))" }}
      >
        <span className="text-xs font-semibold text-white/90 truncate">{topic}</span>
        <span className="text-[8px] text-white/60 font-medium ml-2 shrink-0">{image.credit}</span>
      </div>
    </div>
  );
}

// ── Photo card ────────────────────────────────────────────────────────────────
function PhotoCard({
  image, topic, h,
}: { image: TopicImage; topic: string; h: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="w-full relative overflow-hidden bg-muted"
      style={{ height: h, borderRadius: 12 }}
    >
      {/* Skeleton shimmer while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted" />
      )}

      {!error && (
        <img
          src={image.url}
          alt={image.label}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ borderRadius: 12 }}
        />
      )}

      {error && (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60"
          style={{ borderRadius: 12 }}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">{topic}</span>
        </div>
      )}

      {/* Gradient overlay + label */}
      {loaded && (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.45))", borderRadius: "0 0 12px 12px" }}
        >
          <span className="text-xs font-semibold text-white/90 truncate">{topic}</span>
          <span className="text-[8px] text-white/60 font-medium ml-2 shrink-0">{image.credit}</span>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TopicVisual({
  subject,
  topic,
  size = "md",
  editable = false,
  className = "",
}: TopicVisualProps) {
  const [variantIndex, setVariantIndex] = useState(() => getTopicVariant(subject, topic));
  const [showControls, setShowControls] = useState(false);

  const images = getTopicImages(subject, topic);
  const total = images.length;
  const current: TopicImage = images[variantIndex] || images[0];
  const dim = SIZES[size];

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = nextTopicVariant(subject, topic);
    setVariantIndex(v);
  }, [subject, topic]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = prevTopicVariant(subject, topic);
    setVariantIndex(v);
  }, [subject, topic]);

  const handleDot = useCallback((e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setTopicVariant(subject, topic, i);
    setVariantIndex(i);
  }, [subject, topic]);

  return (
    <div
      className={`relative select-none group ${className}`}
      style={{ width: "100%", height: dim.h }}
      onMouseEnter={() => editable && setShowControls(true)}
      onMouseLeave={() => editable && setShowControls(false)}
    >
      {/* Image card */}
      {current.type === "bioicon" ? (
        <BioiconCard image={current} topic={topic} h={dim.h} />
      ) : (
        <PhotoCard image={current} topic={topic} h={dim.h} />
      )}

      {/* Editable overlay controls */}
      {editable && showControls && total > 1 && (
        <div
          className="absolute inset-0 flex items-center justify-between px-2 rounded-xl"
          style={{ background: "rgba(0,0,0,0.15)" }}
        >
          {/* Prev */}
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
            title="Previous image"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>

          {/* Centre: dot indicators + label */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1.5 items-center">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => handleDot(e, i)}
                  className={`rounded-full transition-all shadow-sm ${
                    i === variantIndex
                      ? "w-5 h-2 bg-white"
                      : "w-2 h-2 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-white font-semibold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {variantIndex + 1} / {total}
            </span>
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
            title="Next image"
          >
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        </div>
      )}

      {/* Static "click to change" hint badge when not hovering */}
      {editable && !showControls && total > 1 && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white rounded-full px-2 py-0.5">
            <ImageIcon className="w-2.5 h-2.5" />
            <span className="text-[9px] font-medium">{total} images</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export for external use
export { setTopicVariant } from "@/lib/topic-image-bank";
