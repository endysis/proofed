import React, { useMemo } from 'react';
import LottieView from 'lottie-react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const diamondData = require('../../../assets/Diamond.json');

interface Props {
  color: string;
  size: number;
  glow?: boolean;
}

// ─── HSL helpers ───────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p: number, q: number, t: number) => {
    const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

// ─── Lottie recoloring ─────────────────────────────────────────────

// Reference: the main body red in the source Lottie ≈ HSL(355, 0.80, 0.54)
const SRC_HUE = 355 / 360;
const SRC_SAT = 0.8;

function recolorLottie(json: unknown, targetHex: string): unknown {
  const [tH, tS] = rgbToHsl(...hexToRgb(targetHex));
  const hueShift = tH - SRC_HUE;
  const satScale = tS / SRC_SAT;

  const clone = JSON.parse(JSON.stringify(json));

  function shiftColor(rgb: number[]) {
    if (rgb.length < 3) return;
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    if (s < 0.05) return; // skip white/black/grey
    const newH = ((h + hueShift) % 1 + 1) % 1;
    const newS = Math.min(1, s * satScale);
    const [nr, ng, nb] = hslToRgb(newH, newS, l);
    rgb[0] = nr;
    rgb[1] = ng;
    rgb[2] = nb;
  }

  function recolorProp(c: { a?: number; k?: unknown }) {
    if (!c) return;
    if (c.a === 0 && Array.isArray(c.k)) {
      shiftColor(c.k);
    } else if (c.a === 1 && Array.isArray(c.k)) {
      c.k.forEach((kf: { s?: number[] }) => {
        if (Array.isArray(kf.s)) shiftColor(kf.s);
      });
    }
  }

  function walk(obj: unknown): void {
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj && typeof obj === 'object') {
      const o = obj as Record<string, unknown>;
      // Fill or stroke shape
      if (o.ty === 'fl' || o.ty === 'st') {
        recolorProp(o.c as { a?: number; k?: unknown });
      }
      Object.values(o).forEach(walk);
    }
  }

  walk(clone);
  return clone;
}

// ─── Component ─────────────────────────────────────────────────────

export default function GemStone({ color, size }: Props) {
  const source = useMemo(() => recolorLottie(diamondData, color), [color]);

  return (
    <LottieView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source={source as any}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
