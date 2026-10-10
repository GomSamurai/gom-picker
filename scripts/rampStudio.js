/**
 * GOM Picker - Perceptual Ramp Studio & Art Gradient Generator
 * Advanced color ramps in Perceptual OKLCH and Subtractive Pigment spaces.
 * Eliminates the muddy desaturated middle zone of standard RGB interpolation.
 * Supports discrete steps (3-16), S-curves, and instant CSS / SVG / PNG export.
 */

import { ColorMath } from './colorMath.js';
import { WetMixerEngine } from './wetMixer.js';

export const RampStudio = {
  // Generates an array of interpolated RGB and Hex color steps
  generateRamp(c1, c2, steps = 8, mode = 'oklch', curve = 'linear') {
    const list = [];

    for (let i = 0; i < steps; i++) {
      let t = i / (steps - 1);

      // Curve easing
      if (curve === 's_curve') {
        t = t * t * (3 - 2 * t); // Smoothstep
      } else if (curve === 'ease_in') {
        t = Math.pow(t, 1.8);
      } else if (curve === 'ease_out') {
        t = 1 - Math.pow(1 - t, 1.8);
      }

      let col;
      if (mode === 'subtractive') {
        col = WetMixerEngine.blendSubtractive(c1, c2, t);
      } else if (mode === 'oklch') {
        col = this._interpolateOklch(c1, c2, t);
      } else {
        // Standard RGB Linear
        col = {
          r: Math.round(c1.r + (c2.r - c1.r) * t),
          g: Math.round(c1.g + (c2.g - c1.g) * t),
          b: Math.round(c1.b + (c2.b - c1.b) * t)
        };
      }

      const hex = ColorMath.rgbToHex(col.r, col.g, col.b);
      list.push({
        rgb: col,
        hex,
        step: i + 1,
        ratio: Math.round(t * 100)
      });
    }

    return list;
  },

  // Perceptual OKLCH interpolation between two sRGB colors
  _interpolateOklch(c1, c2, t) {
    const oklch1 = this._rgbToOklch(c1);
    const oklch2 = this._rgbToOklch(c2);

    // Shortest arc hue interpolation
    let dH = oklch2.h - oklch1.h;
    if (dH > 180) dH -= 360;
    else if (dH < -180) dH += 360;

    const l = oklch1.l + (oklch2.l - oklch1.l) * t;
    const c = oklch1.c + (oklch2.c - oklch1.c) * t;
    const h = (oklch1.h + dH * t + 360) % 360;

    return this._oklchToRgb({ l, c, h });
  },

  // RGB -> OKLCH
  _rgbToOklch({ r, g, b }) {
    // sRGB to Linear RGB
    const toLin = v => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const rL = toLin(r), gL = toLin(g), bL = toLin(b);

    // Linear RGB to LMS
    const l_ = Math.cbrt(0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL);
    const m_ = Math.cbrt(0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL);
    const s_ = Math.cbrt(0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL);

    // LMS to OKLab
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    // OKLab to OKLCH
    const C = Math.hypot(a, bLab);
    let H = (Math.atan2(bLab, a) * 180) / Math.PI;
    if (H < 0) H += 360;

    return { l: L, c: C, h: H };
  },

  // OKLCH -> RGB
  _oklchToRgb({ l, c, h }) {
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * bLab;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * bLab;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * bLab;

    const lCub = l_ * l_ * l_;
    const mCub = m_ * m_ * m_;
    const sCub = s_ * s_ * s_;

    // LMS to Linear RGB
    const rL = +4.0767416621 * lCub - 3.3077115913 * mCub + 0.2309699292 * sCub;
    const gL = -1.2684380046 * lCub + 2.6097574011 * mCub - 0.3413193965 * sCub;
    const bL = -0.0041960863 * lCub - 0.7034186147 * mCub + 1.7076147010 * sCub;

    // Linear to sRGB
    const toSrgb = v => {
      const clamped = Math.max(0, Math.min(1, v));
      return clamped <= 0.0031308
        ? clamped * 12.92
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    return {
      r: Math.round(toSrgb(rL) * 255),
      g: Math.round(toSrgb(gL) * 255),
      b: Math.round(toSrgb(bL) * 255)
    };
  },

  // Export formats
  generateCssGradient(ramp) {
    const stops = ramp.map((s, idx) => {
      const pct = Math.round((idx / (ramp.length - 1)) * 100);
      return `${s.hex} ${pct}%`;
    }).join(', ');
    return `linear-gradient(90deg, ${stops})`;
  },

  generateSvgGradient(ramp, id = 'artRamp') {
    const stops = ramp.map((s, idx) => {
      const pct = Math.round((idx / (ramp.length - 1)) * 100);
      return `  <stop offset="${pct}%" stop-color="${s.hex}" />`;
    }).join('\n');
    return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">\n${stops}\n</linearGradient>`;
  },

  // Export palette ramp as a downloadable PNG image
  downloadRampPng(ramp, filename = 'gom_palette_ramp.png') {
    const canvas = document.createElement('canvas');
    const stepW = 48;
    const h = 48;
    canvas.width = ramp.length * stepW;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ramp.forEach((s, idx) => {
      ctx.fillStyle = s.hex;
      ctx.fillRect(idx * stepW, 0, stepW, h);
    });

    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }
};
