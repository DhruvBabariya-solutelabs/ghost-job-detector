import { useEffect, useRef, useState } from 'react';
import { Brand } from './Brand';
import { GhostMascot } from './GhostMascot';
import { AlertTriangleIcon, ArrowRightIcon, FlagIcon, ScanIcon, ShieldCheckIcon } from './icons';
import { useReducedMotion } from './useReducedMotion';

interface OnboardingProps {
  onFinish: () => void;
  onSkip: () => void;
}

const STEPS = 3;

function MiniArc() {
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path
        d="M 24.7 95.3 A 50 50 0 1 1 95.3 95.3"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M 24.7 95.3 A 50 50 0 1 1 95.3 95.3"
        fill="none"
        stroke="var(--brand)"
        strokeWidth={9}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={0.18}
      />
      <text
        x="60"
        y="64"
        textAnchor="middle"
        fontSize="26"
        fontWeight={700}
        fill="var(--ink)"
        className="gjd-tnum"
      >
        82
      </text>
    </svg>
  );
}

export function Onboarding({ onFinish, onSkip }: OnboardingProps) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(0);
  const dragRef = useRef(0);
  stepRef.current = step;

  const go = (next: number): void => setStep(Math.max(0, Math.min(STEPS - 1, next)));

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let startX: number | null = null;
    const goTo = (next: number): void => setStep(Math.max(0, Math.min(STEPS - 1, next)));
    const setBoth = (v: number): void => {
      dragRef.current = v;
      setDrag(v);
    };
    const down = (e: PointerEvent): void => {
      startX = e.clientX;
      setDragging(true);
    };
    const move = (e: PointerEvent): void => {
      if (startX !== null) setBoth(e.clientX - startX);
    };
    const up = (): void => {
      if (Math.abs(dragRef.current) > 48) goTo(stepRef.current + (dragRef.current < 0 ? 1 : -1));
      startX = null;
      setDragging(false);
      setBoth(0);
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') goTo(stepRef.current + 1);
      if (e.key === 'ArrowLeft') goTo(stepRef.current - 1);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', up);
      window.removeEventListener('keydown', key);
    };
  }, []);

  const slides = [
    {
      art: <GhostMascot mode="idle" size={84} still={reduced} />,
      title: 'Meet your job-hunt bodyguard',
      body: 'Ghost listings, scams, and AI-spam waste your time. I read the posting you’re looking at and tell you if it’s worth your energy.',
    },
    {
      art: <MiniArc />,
      title: 'A Trust Score, instantly',
      body: 'Every listing gets a 0–100 score from real signals — salary specifics, buzzword spam, scam patterns — with plain-English reasons you can read in seconds.',
    },
    {
      art: (
        <div style={{ display: 'flex', gap: 10 }}>
          <ShieldCheckIcon size={34} style={{ color: '#1fce9f' }} />
          <AlertTriangleIcon size={34} style={{ color: '#f5a623' }} />
          <FlagIcon size={34} style={{ color: '#ff4763' }} />
        </div>
      ),
      title: 'See it in action',
      body: 'Watch the score reveal on a sample listing. On a real LinkedIn or Indeed job, it appears right on the page.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand size={20} />
        <button
          type="button"
          onClick={onSkip}
          className="gjd-focus"
          style={{
            all: 'unset',
            cursor: 'pointer',
            fontSize: 'var(--t-xs)',
            color: 'var(--ink-muted)',
            padding: 4,
          }}
        >
          Skip
        </button>
      </div>

      <div
        ref={viewportRef}
        style={{ flex: 1, overflow: 'hidden', marginTop: 8, touchAction: 'pan-y' }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            transform: `translateX(calc(${-step * 100}% + ${drag}px))`,
            transition:
              !dragging && !reduced ? 'transform var(--dur-standard) var(--ease-expo)' : 'none',
          }}
        >
          {slides.map((s, i) => (
            <div
              key={s.title}
              aria-hidden={i !== step}
              style={{
                flex: '0 0 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 16,
                padding: '8px 4px',
              }}
            >
              <div
                style={{ height: 116, display: 'grid', placeItems: 'center', overflow: 'visible' }}
              >
                {s.art}
              </div>
              <div style={{ maxWidth: 300 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--t-lg)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}
                >
                  {s.title}
                </h2>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 'var(--t-sm)',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '12px 0' }}>
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === step}
            className="gjd-focus"
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: i === step ? 20 : 7,
              height: 7,
              borderRadius: 'var(--r-pill)',
              background: i === step ? 'var(--brand)' : 'var(--border-strong)',
              transition: 'width var(--dur-standard) var(--ease-expo), background var(--dur-micro)',
            }}
          />
        ))}
      </div>

      {step < STEPS - 1 ? (
        <button
          type="button"
          onClick={() => go(step + 1)}
          className="gjd-focus gjd-cta"
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--brand)',
            color: 'var(--brand-ink)',
            fontWeight: 600,
            fontSize: 'var(--t-base)',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Next
          <ArrowRightIcon size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onFinish}
          className="gjd-focus gjd-cta"
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--brand)',
            color: 'var(--brand-ink)',
            fontWeight: 700,
            fontSize: 'var(--t-base)',
            cursor: 'pointer',
          }}
        >
          <ScanIcon size={17} />
          Scan a sample
        </button>
      )}
    </div>
  );
}
