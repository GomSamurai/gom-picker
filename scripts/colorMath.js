/**
 * GOM Picker - Color Math Engine
 * Precise transformations across RGB, CMYK, HSL, HSV, LAB, OKLCH, RYB, and Pigment Mixing.
 */

export const ColorMath = {
  // Clamp helper
  clamp(val, min = 0, max = 1) {
    return Math.max(min, Math.min(max, val));
  },

  // Clamp 0-255
  clamp255(val) {
    return Math.max(0, Math.min(255, Math.round(val)));
  },

  // RGB (0-255) to HEX
  rgbToHex(r, g, b, a = 1) {
    const toHex = (n) => {
      const hex = Math.round(ColorMath.clamp(n, 0, 255)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    if (a < 1) {
      const alphaHex = Math.round(ColorMath.clamp(a, 0, 1) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`.toUpperCase();
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  },

  // HEX to RGB {r, g, b, a}
  hexToRgb(hex) {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('') + 'FF';
    } else if (clean.length === 4) {
      clean = clean.split('').map(c => c + c).join('');
    } else if (clean.length === 6) {
      clean += 'FF';
    }
    if (clean.length !== 8) return { r: 0, g: 0, b: 0, a: 1 };

    const num = parseInt(clean, 16);
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: parseFloat(((num & 255) / 255).toFixed(3))
    };
  },

  // RGB (0-255) to HSV {h: 0-360, s: 0-1, v: 0-1}
  rgbToHsv(r, g, b) {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rf) {
        h = ((gf - bf) / delta) % 6;
      } else if (max === gf) {
        h = (bf - rf) / delta + 2;
      } else {
        h = (rf - gf) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
  },

  // HSV {h: 0-360, s: 0-1, v: 0-1} to RGB {r, g, b}
  hsvToRgb(h, s, v) {
    h = (h % 360 + 360) % 360;
    s = ColorMath.clamp(s, 0, 1);
    v = ColorMath.clamp(v, 0, 1);

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let rf = 0, gf = 0, bf = 0;

    if (h >= 0 && h < 60) {
      rf = c; gf = x; bf = 0;
    } else if (h >= 60 && h < 120) {
      rf = x; gf = c; bf = 0;
    } else if (h >= 120 && h < 180) {
      rf = 0; gf = c; bf = x;
    } else if (h >= 180 && h < 240) {
      rf = 0; gf = x; bf = c;
    } else if (h >= 240 && h < 300) {
      rf = x; gf = 0; bf = c;
    } else {
      rf = c; gf = 0; bf = x;
    }

    return {
      r: ColorMath.clamp255((rf + m) * 255),
      g: ColorMath.clamp255((gf + m) * 255),
      b: ColorMath.clamp255((bf + m) * 255)
    };
  },

  // RGB to HSL {h: 0-360, s: 0-1, l: 0-1}
  rgbToHsl(r, g, b) {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      if (max === rf) {
        h = ((gf - bf) / delta + (gf < bf ? 6 : 0)) * 60;
      } else if (max === gf) {
        h = ((bf - rf) / delta + 2) * 60;
      } else {
        h = ((rf - gf) / delta + 4) * 60;
      }
    }

    return { h: Math.round(h), s, l };
  },

  // HSL to RGB {r, g, b}
  hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360 / 360;
    s = ColorMath.clamp(s, 0, 1);
    l = ColorMath.clamp(l, 0, 1);

    if (s === 0) {
      const val = ColorMath.clamp255(l * 255);
      return { r: val, g: val, b: val };
    }

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: ColorMath.clamp255(hue2rgb(p, q, h + 1 / 3) * 255),
      g: ColorMath.clamp255(hue2rgb(p, q, h) * 255),
      b: ColorMath.clamp255(hue2rgb(p, q, h - 1 / 3) * 255)
    };
  },

  // RGB (0-255) to CMYK {c: 0-100, m: 0-100, y: 0-100, k: 0-100}
  // Incorporating Under Color Removal (UCR) for realistic print simulation
  rgbToCmyk(r, g, b) {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    let k = 1 - Math.max(rf, gf, bf);
    if (k >= 0.999) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - rf - k) / (1 - k);
    const m = (1 - gf - k) / (1 - k);
    const y = (1 - bf - k) / (1 - k);

    return {
      c: Math.round(ColorMath.clamp(c, 0, 1) * 100),
      m: Math.round(ColorMath.clamp(m, 0, 1) * 100),
      y: Math.round(ColorMath.clamp(y, 0, 1) * 100),
      k: Math.round(ColorMath.clamp(k, 0, 1) * 100)
    };
  },

  // CMYK {c: 0-100, m: 0-100, y: 0-100, k: 0-100} to RGB {r, g, b}
  cmykToRgb(c, m, y, k) {
    const cf = ColorMath.clamp(c / 100, 0, 1);
    const mf = ColorMath.clamp(m / 100, 0, 1);
    const yf = ColorMath.clamp(y / 100, 0, 1);
    const kf = ColorMath.clamp(k / 100, 0, 1);

    const rf = 1 - Math.min(1, cf * (1 - kf) + kf);
    const gf = 1 - Math.min(1, mf * (1 - kf) + kf);
    const bf = 1 - Math.min(1, yf * (1 - kf) + kf);

    return {
      r: ColorMath.clamp255(rf * 255),
      g: ColorMath.clamp255(gf * 255),
      b: ColorMath.clamp255(bf * 255)
    };
  },

  // Check if RGB is Out-Of-Gamut for standard CMYK (SWOP coated approximation)
  // Highly saturated greens/cyans/magentas are typical culprits
  checkCmykGamut(r, g, b) {
    const cmyk = ColorMath.rgbToCmyk(r, g, b);
    const roundtrip = ColorMath.cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
    
    // Total Area Coverage (TAC / Ink Limit) standard print ~300%
    const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
    
    // Perceptual Delta difference
    const diff = Math.sqrt(
      Math.pow(r - roundtrip.r, 2) +
      Math.pow(g - roundtrip.g, 2) +
      Math.pow(b - roundtrip.b, 2)
    );

    const isOutOfGamut = diff > 14 || totalInk > 320;
    return {
      isOutOfGamut,
      totalInk,
      delta: Math.round(diff),
      nearestGamutRgb: roundtrip,
      nearestGamutCmyk: cmyk
    };
  },

  // Relative Luminance according to WCAG 2.1 (0 = Black, 1 = White)
  getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },

  // Contrast ratio between two colors (1 to 21)
  getContrastRatio(rgb1, rgb2) {
    const lum1 = ColorMath.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = ColorMath.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
  },

  // Perceptual Grayscale value (0-255)
  toGrayscaleRgb(r, g, b) {
    const gray = ColorMath.clamp255(0.299 * r + 0.587 * g + 0.114 * b);
    return { r: gray, g: gray, b: gray };
  },

  // Traditional Artist's RYB (Red-Yellow-Blue) Color Wheel Interpolation
  // Artist color wheel: Red at 0°, Yellow at 120° (in RYB), Blue at 240° (in RYB)
  // Maps standard HSV hue (0-360) to Painter RYB Hue
  rybToRgbHue(rybHue) {
    rybHue = (rybHue % 360 + 360) % 360;
    // Cubic Bézier / piecewise mapping of RYB artist angle to standard RGB angle
    // In RYB:
    // 0 = Red (RGB 0)
    // 60 = Orange (RGB 30)
    // 120 = Yellow (RGB 60)
    // 180 = Green (RGB 120)
    // 240 = Blue (RGB 240)
    // 300 = Purple (RGB 285)
    const points = [
      { ryb: 0, rgb: 0 },
      { ryb: 60, rgb: 30 },
      { ryb: 120, rgb: 60 },
      { ryb: 180, rgb: 120 },
      { ryb: 240, rgb: 240 },
      { ryb: 300, rgb: 285 },
      { ryb: 360, rgb: 360 }
    ];

    for (let i = 0; i < points.length - 1; i++) {
      if (rybHue >= points[i].ryb && rybHue <= points[i + 1].ryb) {
        const t = (rybHue - points[i].ryb) / (points[i + 1].ryb - points[i].ryb);
        return points[i].rgb + t * (points[i + 1].rgb - points[i].rgb);
      }
    }
    return rybHue;
  },

  rgbToRybHue(rgbHue) {
    rgbHue = (rgbHue % 360 + 360) % 360;
    const points = [
      { ryb: 0, rgb: 0 },
      { ryb: 60, rgb: 30 },
      { ryb: 120, rgb: 60 },
      { ryb: 180, rgb: 120 },
      { ryb: 240, rgb: 240 },
      { ryb: 300, rgb: 285 },
      { ryb: 360, rgb: 360 }
    ];

    for (let i = 0; i < points.length - 1; i++) {
      if (rgbHue >= points[i].rgb && rgbHue <= points[i + 1].rgb) {
        const t = (rgbHue - points[i].rgb) / (points[i + 1].rgb - points[i].rgb);
        return points[i].ryb + t * (points[i + 1].ryb - points[i].ryb);
      }
    }
    return rgbHue;
  },

  // RGB to OKLCH (Perceptually Uniform Color Space)
  // OKLCH: L (0-1), C (0-0.4), H (0-360)
  rgbToOklch(r, g, b) {
    // sRGB to linear sRGB
    const toLinear = (c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const lr = toLinear(r);
    const lg = toLinear(g);
    const lb = toLinear(b);

    // Linear sRGB to OKLab LMS
    const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    const C = Math.sqrt(a * a + b_ * b_);
    let H = (Math.atan2(b_, a) * 180) / Math.PI;
    if (H < 0) H += 360;

    return {
      l: ColorMath.clamp(L, 0, 1),
      c: ColorMath.clamp(C, 0, 0.4),
      h: Math.round(H)
    };
  },

  // OKLCH to RGB
  oklchToRgb(l, c, h) {
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;

    const lr = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const lg = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const lb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    const toGamma = (v) => {
      const cv = ColorMath.clamp(v, 0, 1);
      return cv <= 0.0031308 ? 12.92 * cv : 1.055 * Math.pow(cv, 1 / 2.4) - 0.055;
    };

    return {
      r: ColorMath.clamp255(toGamma(lr) * 255),
      g: ColorMath.clamp255(toGamma(lg) * 255),
      b: ColorMath.clamp255(toGamma(lb) * 255)
    };
  },

  // Realistic Spectral Pigment Blending (Kubelka-Munk Spectral Reflectance Model)
  // Simulates authentic physical pigment mixing:
  // - Yellow + Blue = Rich Natural Green (Sap / Viridian / Forest Green)
  // - Red + Yellow = Vibrant Warm Orange
  // - Red + Blue = Deep Violet / Purple
  // - Ultramarine + Burnt Sienna = Pearlescent Neutral Gray
  mixPigments(color1, color2, weight = 0.5) {
    const w = ColorMath.clamp(weight, 0, 1);
    return ColorMath.blendKubelkaMunk(color1, color2, w);
  },

  // 8-Band Kubelka-Munk Spectral Pigment Mixing Engine
  blendKubelkaMunk(c1, c2, w = 0.5) {
    const ks1 = this._rgbToPigmentAbsorption(c1.r, c1.g, c1.b);
    const ks2 = this._rgbToPigmentAbsorption(c2.r, c2.g, c2.b);
    const ksMix = new Float32Array(8);
    for (let i = 0; i < 8; i++) {
      ksMix[i] = (1 - w) * ks1[i] + w * ks2[i];
    }
    return this._pigmentAbsorptionToRgb(ksMix);
  },

  _rgbToPigmentAbsorption(r255, g255, b255) {
    const r = r255 / 255;
    const g = g255 / 255;
    const b = b255 / 255;

    // Estimate 8 spectral reflectance bands R(lambda)
    // 0: Violet (420nm), 1: Blue (460nm), 2: Cyan (490nm), 3: Green (530nm),
    // 4: Yellow (580nm), 5: Orange (610nm), 6: Red (650nm), 7: Deep Red (680nm)
    const R = new Float32Array(8);

    // Violet (420nm):
    R[0] = b * 0.90 + r * 0.10 * (1 - g);
    // Blue (460nm):
    R[1] = b * 0.95 + g * 0.08;
    // Cyan (490nm):
    R[2] = b * 0.65 + g * 0.55;
    // Green (530nm):
    // In physical pigments, Yellow reflects heavily across green and red wavelengths (absorbs only blue).
    // Blue pigments have a secondary reflectance window in cyan/green.
    const yellowTail = Math.min(r, g) * Math.max(0, 1 - b * 1.2);
    const blueTail = b * Math.max(0, 1 - r) * 0.28;
    R[3] = g * 0.75 + yellowTail * 0.65 + blueTail;
    // Yellow (580nm):
    R[4] = Math.min(1, (r * 0.65 + g * 0.60) * Math.max(0, 1 - b * 0.85));
    // Orange (610nm):
    R[5] = r * 0.85 + g * 0.30 * Math.max(0, 1 - b);
    // Red (650nm):
    R[6] = r * 0.95;
    // Deep Red (680nm):
    R[7] = r * 0.90 + b * 0.05 * (1 - g);

    // Convert to Kubelka-Munk K/S (Absorption/Scattering):
    // K/S = (1 - R)^2 / (2 * R)
    const ks = new Float32Array(8);
    for (let i = 0; i < 8; i++) {
      const refl = Math.max(0.015, Math.min(0.985, R[i]));
      ks[i] = Math.pow(1 - refl, 2) / (2 * refl);
    }
    return ks;
  },

  _pigmentAbsorptionToRgb(ksMix) {
    // Invert Kubelka-Munk equation: R = 1 + ks - sqrt(ks^2 + 2*ks)
    const R = new Float32Array(8);
    for (let i = 0; i < 8; i++) {
      const k = ksMix[i];
      R[i] = 1 + k - Math.sqrt(k * k + 2 * k);
    }

    // Synthesize sRGB based on CIE standard observer spectral response
    let r = R[4] * 0.25 + R[5] * 0.35 + R[6] * 0.50 + R[7] * 0.25;
    let g = R[2] * 0.20 + R[3] * 0.85 + R[4] * 0.30;
    let b = R[0] * 0.40 + R[1] * 0.75 + R[2] * 0.15;

    return {
      r: Math.round(ColorMath.clamp(r * 255, 0, 255)),
      g: Math.round(ColorMath.clamp(g * 255, 0, 255)),
      b: Math.round(ColorMath.clamp(b * 255, 0, 255))
    };
  }
};
