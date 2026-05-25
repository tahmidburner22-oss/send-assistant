/**
 * SlidePollQR — pupil-facing AfL poll for a single quiz/MCQ/exit-ticket slide.
 *
 * Issues a QR code that opens a stripped-down companion page where pupils tap
 * an option (or enter a short answer). Backend wiring is intentionally light:
 * the QR encodes the slide question and options into a stateless URL hash so
 * the MVP works without server changes. A real backend tally can replace
 * `buildPollUrl` later — the dialog UX stays the same.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Printer, RefreshCw, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: {
    title: string;
    question?: string;
    options?: string[];
    answer?: string;
    type: string;
  } | null;
  /** Optional class identifier so the same poll can be re-opened across lessons. */
  classCode?: string;
}

function buildPollUrl(slide: NonNullable<Props["slide"]>, classCode?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const payload = {
    q: (slide.question || slide.title || "").slice(0, 240),
    o: (slide.options || []).slice(0, 6).map(o => o.slice(0, 80)),
    c: classCode || undefined,
    t: slide.type,
  };
  // Encode into the URL hash so the poll page is purely client-side until a
  // real backend exists.
  const enc = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    : "";
  return `${origin}/share/poll#${enc}`;
}

export default function SlidePollQR({ open, onOpenChange, slide, classCode }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const url = useMemo(() => (slide ? buildPollUrl(slide, classCode) : ""), [slide, classCode]);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const QR = await import("qrcode");
        const data = await QR.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: "M" });
        if (!cancelled) setQrDataUrl(data);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, url]);

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const w = window.open("", "_blank", "width=480,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Poll QR — ${slide?.title || ""}</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:24px">
        <h2>${slide?.title || ""}</h2>
        <p style="color:#555;font-size:14px;margin-bottom:24px">${slide?.question || ""}</p>
        <img src="${qrDataUrl}" style="width:300px;height:300px" />
        <p style="font-family:monospace;font-size:12px;color:#888;margin-top:16px;word-break:break-all">${url}</p>
        <script>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Live poll — pupils scan to answer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
            <div className="font-semibold text-gray-800">{slide?.title}</div>
            {slide?.question && <div className="text-gray-600 mt-1">{slide.question}</div>}
            {slide?.options && slide.options.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {slide.options.map((o, i) => (
                  <li key={i} className="text-gray-700">{String.fromCharCode(65 + i)}. {o}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Generating QR…</div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Slide poll QR" className="w-60 h-60 rounded-md border" />
            ) : (
              <div className="text-xs text-red-600">Could not generate QR — copy the link instead.</div>
            )}
            <div className="font-mono text-[10px] text-gray-500 break-all text-center px-2">{url}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}>
              <Copy className="w-3.5 h-3.5" />Copy link
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handlePrint} disabled={!qrDataUrl}>
              <Printer className="w-3.5 h-3.5" />Print
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setQrDataUrl(null)}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            MVP: pupil responses are local-only on each device. Backend tally is a follow-up — replace
            <code className="bg-gray-100 px-1 mx-1">buildPollUrl</code>
            once a poll endpoint is live.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
