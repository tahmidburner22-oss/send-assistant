/**
 * PupilModeQr — small QR code for a pupil-mode share link.
 *
 * Uses api.qrserver.com (free, no API key, no auth) which renders a PNG
 * directly. Falls back to a plain link if the image fails to load.
 *
 * No tracking, no analytics. The URL passed in is the only thing the QR
 * encodes.
 */
import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface PupilModeQrProps {
  /** Full URL to encode (e.g. https://adaptly.co.uk/shared/abc123?mode=pupil). */
  url: string;
  /** Pixel size of the QR (square). Default 160. */
  size?: number;
  /** Optional caption rendered under the QR. */
  caption?: string;
  className?: string;
}

export default function PupilModeQr({ url, size = 160, caption, className }: PupilModeQrProps) {
  const [imgError, setImgError] = useState(false);
  if (!url) return null;

  // api.qrserver.com — public, free, no key required, supports PNG output.
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&qzone=2&margin=0`;

  return (
    <div className={`flex flex-col items-center gap-2 ${className || ""}`}>
      {!imgError ? (
        <img
          src={src}
          width={size}
          height={size}
          alt="QR code — pupil mode link"
          className="rounded-md border border-border bg-white p-2"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand hover:underline inline-flex items-center gap-1"
        >
          QR unavailable — open link <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {caption && (
        <p className="text-[10px] text-muted-foreground text-center max-w-[200px] leading-tight">
          {caption}
        </p>
      )}
    </div>
  );
}
