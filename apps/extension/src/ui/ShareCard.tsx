import { useEffect, useRef, useState } from 'react';
import type { HistoryEntry } from '@/src/lib/messages';
import { CheckIcon, DownloadIcon, ShareIcon } from './icons';
import { BRAND_VIOLET, VERDICTS } from './verdict';

const SIZE = 1080;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function draw(canvas: HTMLCanvasElement, entry: HistoryEntry): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { response, posting } = entry;
  const v = VERDICTS[response.risk];
  const cx = SIZE / 2;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const amb = ctx.createRadialGradient(cx, 120, 80, cx, 120, 900);
  amb.addColorStop(0, `${v.from}33`);
  amb.addColorStop(1, '#0a0a0f00');
  ctx.fillStyle = amb;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = BRAND_VIOLET;
  ctx.beginPath();
  ctx.arc(cx - 118, 96, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 34px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#c2c3cf';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Ghost Job Detector', cx - 92, 98);

  const gcx = cx;
  const gcy = 470;
  const r = 230;
  const lw = 34;
  const start = (135 * Math.PI) / 180;
  const sweep = (270 * Math.PI) / 180;
  const frac = Math.max(0, Math.min(100, response.score)) / 100;

  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(gcx, gcy, r, start, start + sweep);
  ctx.stroke();

  const grad = ctx.createLinearGradient(gcx - r, gcy - r, gcx + r, gcy + r);
  grad.addColorStop(0, v.from);
  grad.addColorStop(1, v.to);
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(gcx, gcy, r, start, start + sweep * frac);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f4f8';
  ctx.font = '700 168px Inter, system-ui, sans-serif';
  ctx.fillText(String(response.score), gcx, gcy + 4);
  ctx.font = '600 44px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#5c5d6e';
  ctx.fillText('/ 100', gcx, gcy + 120);

  ctx.font = '700 46px Inter, system-ui, sans-serif';
  const word = v.word.toUpperCase();
  const wMetrics = ctx.measureText(word);
  const pillW = wMetrics.width + 110;
  const pillH = 84;
  const pillX = cx - pillW / 2;
  const pillY = 720;
  ctx.fillStyle = `${v.solid}26`;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `${v.solid}88`;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();
  ctx.fillStyle = v.solid;
  ctx.beginPath();
  ctx.arc(pillX + 44, pillY + pillH / 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = v.from;
  ctx.textAlign = 'left';
  ctx.fillText(word, pillX + 72, pillY + pillH / 2 + 2);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#c2c3cf';
  ctx.font = '500 38px Inter, system-ui, sans-serif';
  wrapText(ctx, v.line, cx, 870, 880, 50);

  ctx.fillStyle = '#8b8c9b';
  ctx.font = '500 30px Inter, system-ui, sans-serif';
  const sub = [posting.title, posting.company].filter(Boolean).join(' — ');
  ctx.fillText(truncate(ctx, sub, 940), cx, 1010);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

export function ShareCard({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (canvasRef.current) draw(canvasRef.current, entry);
    });
    draw(canvas, entry);
  }, [entry]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filename = `ghost-job-${entry.response.risk}-${entry.response.score}.png`;

  const handleDownload = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleCopy = (): void => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ClipboardItem === 'undefined') return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      void navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => undefined);
    }, 'image/png');
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: dismissed via the Escape key (window listener above) and the Close button; backdrop click is a redundant convenience
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share this verdict"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 18,
        animation: 'gjd-fade var(--dur-standard) var(--ease-expo)',
      }}
    >
      <div
        style={{
          animation: 'gjd-pop var(--dur-recolor) var(--ease-expo)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{
            width: 300,
            height: 300,
            borderRadius: 'var(--r-container)',
            boxShadow: 'var(--shadow-pop)',
            border: '1px solid var(--border)',
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleDownload}
            className="gjd-focus gjd-cta"
            style={{
              all: 'unset',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--brand)',
              color: 'var(--brand-ink)',
              fontWeight: 600,
              fontSize: 'var(--t-sm)',
              cursor: 'pointer',
            }}
          >
            <DownloadIcon size={15} />
            Download
          </button>
          {typeof ClipboardItem !== 'undefined' && (
            <button
              type="button"
              onClick={handleCopy}
              className="gjd-focus gjd-chip"
              style={{
                all: 'unset',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border-strong)',
                color: 'var(--ink)',
                fontWeight: 600,
                fontSize: 'var(--t-sm)',
                cursor: 'pointer',
              }}
            >
              {copied ? <CheckIcon size={15} /> : <ShareIcon size={15} />}
              {copied ? 'Copied!' : 'Copy image'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="gjd-focus"
          style={{
            all: 'unset',
            cursor: 'pointer',
            fontSize: 'var(--t-xs)',
            color: 'var(--ink-soft)',
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-pill)',
            padding: '6px 16px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
