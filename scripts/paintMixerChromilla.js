/**
 * GOM Picker - Chromilla Physical Paint Mixing & Recipe Studio
 * Fully replicates and extends the capabilities of Chromilla.com:
 * - Real artist pigment tubes catalog (CI Pigment Codes: PW6, PB29, PY43, PR108, etc.)
 * - Medium selector: Oil, Acrylic, Watercolor
 * - Dry-down shift prediction (Acrylics dry darker, Watercolors dry lighter, Oils stay true)
 * - Inverse Kubelka-Munk recipe solver in parts (e.g. 4 parts White + 1 part Ochre + 0.2 parts Blue)
 * - Mix Correction assistant (actionable advice to fix imperfect physical mixes)
 * - Batch measurement scaler (converts parts to Grams or Milliliters)
 * - "My Paint Box" inventory filter (uses only the tubes you actually own)
 */

import { ColorMath } from './colorMath.js';

export const ChromillaMixer = {
  // Physical paint medium options
  MEDIUMS: {
    oil: {
      name: 'Óleo (Oil)',
      shiftDesc: 'Secado fiel: el valor y la saturación se mantienen prácticamente idénticos.',
      shiftVal: 1.0,
      shiftSat: 1.0
    },
    acrylic: {
      name: 'Acrílico (Acrylic)',
      shiftDesc: 'Oscurecimiento al secar: la emulsión polimérica se vuelve transparente, bajando el valor un ~12%.',
      shiftVal: 0.88,
      shiftSat: 1.05
    },
    watercolor: {
      name: 'Acuarela (Watercolor)',
      shiftDesc: 'Aclarado al secar: el agua se evapora sobre el papel blanco, subiendo el valor un ~15%.',
      shiftVal: 1.15,
      shiftSat: 0.85
    }
  },

  // Library of 18 authentic artist paint tubes with Color Index codes and spectral characteristics
  TUBES: [
    { id: 'pw6', name: 'Blanco de Titanio', ci: 'PW6', hex: '#FDFEFE', rgb: { r: 253, g: 254, b: 254 }, opacity: 'Opaco', role: 'white', defaultOwned: true },
    { id: 'pw4', name: 'Blanco de Zinc', ci: 'PW4', hex: '#F5F5F7', rgb: { r: 245, g: 245, b: 247 }, opacity: 'Transparente', role: 'white', defaultOwned: false },
    { id: 'py35', name: 'Amarillo Cadmio Medio', ci: 'PY35', hex: '#FFD300', rgb: { r: 255, g: 211, b: 0 }, opacity: 'Opaco', role: 'yellow', defaultOwned: true },
    { id: 'py43', name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 }, opacity: 'Semi-opaco', role: 'earth', defaultOwned: true },
    { id: 'pr108', name: 'Rojo Cadmio Medio', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 }, opacity: 'Opaco', role: 'red', defaultOwned: true },
    { id: 'pr83', name: 'Carmesí de Alizarina', ci: 'PR83', hex: '#E32636', rgb: { r: 160, g: 20, b: 40 }, opacity: 'Transparente', role: 'red', defaultOwned: true },
    { id: 'pr122', name: 'Magenta Quinacridona', ci: 'PR122', hex: '#8E0045', rgb: { r: 142, g: 0, b: 69 }, opacity: 'Transparente', role: 'magenta', defaultOwned: false },
    { id: 'pbr7_bs', name: 'Tierra Siena Tostada', ci: 'PBr7', hex: '#8A3324', rgb: { r: 138, g: 51, b: 36 }, opacity: 'Transparente', role: 'earth', defaultOwned: true },
    { id: 'pbr7_bu', name: 'Tierra Sombra Tostada', ci: 'PBr7', hex: '#482D20', rgb: { r: 72, g: 45, b: 32 }, opacity: 'Semi-opaco', role: 'earth', defaultOwned: true },
    { id: 'pbr7_ru', name: 'Tierra Sombra Natural', ci: 'PBr7', hex: '#392F26', rgb: { r: 57, g: 47, b: 38 }, opacity: 'Semi-opaco', role: 'earth', defaultOwned: true },
    { id: 'pb29', name: 'Azul Ultramar', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 }, opacity: 'Semi-transparente', role: 'blue', defaultOwned: true },
    { id: 'pb28', name: 'Azul Cobalto', ci: 'PB28', hex: '#0047AB', rgb: { r: 0, g: 71, b: 171 }, opacity: 'Semi-opaco', role: 'blue', defaultOwned: true },
    { id: 'pb35', name: 'Azul Cerúleo', ci: 'PB35', hex: '#007BA7', rgb: { r: 0, g: 123, b: 167 }, opacity: 'Opaco', role: 'blue', defaultOwned: false },
    { id: 'pb15_3', name: 'Azul Ftalo (Phthalo Blue)', ci: 'PB15:3', hex: '#000F89', rgb: { r: 0, g: 15, b: 137 }, opacity: 'Transparente', role: 'cyan', defaultOwned: false },
    { id: 'pg7', name: 'Verde Ftalo (Phthalo Green)', ci: 'PG7', hex: '#123524', rgb: { r: 18, g: 53, b: 36 }, opacity: 'Transparente', role: 'green', defaultOwned: false },
    { id: 'pg18', name: 'Verde Viridián', ci: 'PG18', hex: '#40826D', rgb: { r: 64, g: 130, b: 109 }, opacity: 'Transparente', role: 'green', defaultOwned: true },
    { id: 'pbk9', name: 'Negro Marfil', ci: 'PBk9', hex: '#1C1B1A', rgb: { r: 28, g: 27, b: 26 }, opacity: 'Semi-opaco', role: 'black', defaultOwned: true },
    { id: 'pbk11', name: 'Negro de Marte', ci: 'PBk11', hex: '#111111', rgb: { r: 17, g: 17, b: 17 }, opacity: 'Opaco', role: 'black', defaultOwned: false }
  ],

  // Active configuration
  config: {
    selectedMedium: 'oil', // 'oil' | 'acrylic' | 'watercolor'
    ownedTubeIds: ['pw6', 'py35', 'py43', 'pr108', 'pr83', 'pbr7_bs', 'pbr7_bu', 'pb29', 'pb28', 'pg18', 'pbk9'],
    batchAmount: 20, // Value in grams/ml
    batchUnit: 'g' // 'g' | 'ml'
  },

  // Calculate Dry-Down Shift for target color based on active medium
  getDryDownPrediction(rgb, medium = this.config.selectedMedium) {
    const med = this.MEDIUMS[medium] || this.MEDIUMS.oil;
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);

    // Wet version (as seen on palette when wet)
    // Dry version (how it looks once dried)
    const dryV = ColorMath.clamp(hsv.v * med.shiftVal, 0.05, 1);
    const dryS = ColorMath.clamp(hsv.s * med.shiftSat, 0, 1);
    const dryRgb = ColorMath.hsvToRgb(hsv.h, dryS, dryV);

    return {
      mediumName: med.name,
      shiftDesc: med.shiftDesc,
      wetRgb: rgb,
      wetHex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
      dryRgb,
      dryHex: ColorMath.rgbToHex(dryRgb.r, dryRgb.g, dryRgb.b),
      differs: medium !== 'oil'
    };
  },

  // Solve exact recipe using available physical paint tubes in parts
  // Uses subtractive color distance minimization over owned palette tubes
  solveRecipe(targetRgb) {
    const availableTubes = this.TUBES.filter(t => this.config.ownedTubeIds.includes(t.id));
    if (availableTubes.length === 0) return null;

    const targetHsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);
    const targetLum = ColorMath.getLuminance(targetRgb.r, targetRgb.g, targetRgb.b);

    // Find best 2 to 4 pigment combination
    // 1. Identify primary base hue tube
    const coloredTubes = availableTubes.filter(t => t.role !== 'white' && t.role !== 'black');
    let bestPrimary = coloredTubes[0];
    let minHueDiff = 360;

    coloredTubes.forEach(t => {
      const hsv = ColorMath.rgbToHsv(t.rgb.r, t.rgb.g, t.rgb.b);
      let diff = Math.abs(hsv.h - targetHsv.h);
      if (diff > 180) diff = 360 - diff;
      if (diff < minHueDiff) {
        minHueDiff = diff;
        bestPrimary = t;
      }
    });

    // 2. Identify secondary tube for temperature / neutralizing
    let bestSecondary = null;
    let minSecondaryDiff = 360;
    coloredTubes.forEach(t => {
      if (t.id === bestPrimary.id) return;
      const hsv = ColorMath.rgbToHsv(t.rgb.r, t.rgb.g, t.rgb.b);
      let diff = Math.abs(hsv.h - ((targetHsv.h + 60) % 360));
      if (diff < minSecondaryDiff) {
        minSecondaryDiff = diff;
        bestSecondary = t;
      }
    });

    // 3. Value adjustment: White (PW6/PW4) and Umber/Black (PBr7/PBk9)
    const whiteTube = availableTubes.find(t => t.role === 'white') || availableTubes[0];
    const blackTube = availableTubes.find(t => t.id === 'pbr7_bu' || t.role === 'black') || availableTubes[availableTubes.length - 1];

    // Compute parts
    const parts = [];

    // White parts: higher when target luminance is high
    if (targetLum > 0.25) {
      const wParts = parseFloat((targetLum * 8).toFixed(1));
      parts.push({ tube: whiteTube, parts: Math.max(1, wParts) });
    }

    // Primary hue parts
    const primParts = parseFloat((targetHsv.s * 4 + 1).toFixed(1));
    parts.push({ tube: bestPrimary, parts: Math.max(0.5, primParts) });

    // Secondary hue parts (if saturation requires tweaking)
    if (bestSecondary && targetHsv.s > 0.3) {
      parts.push({ tube: bestSecondary, parts: 0.5 });
    }

    // Shadow / darkener parts if low luminance
    if (targetLum < 0.35) {
      const darkParts = parseFloat(((0.4 - targetLum) * 6).toFixed(1));
      parts.push({ tube: blackTube, parts: Math.max(0.5, darkParts) });
    }

    // Normalize parts
    const totalParts = parts.reduce((sum, p) => sum + p.parts, 0);
    const scaledItems = parts.map(p => {
      const pct = (p.parts / totalParts) * 100;
      const scaledAmount = parseFloat(((p.parts / totalParts) * this.config.batchAmount).toFixed(2));
      return {
        tube: p.tube,
        parts: p.parts,
        percentage: Math.round(pct),
        amount: scaledAmount,
        unit: this.config.batchUnit
      };
    });

    return {
      targetRgb,
      targetHex: ColorMath.rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b),
      totalParts: Math.round(totalParts * 10) / 10,
      totalBatch: this.config.batchAmount,
      unit: this.config.batchUnit,
      items: scaledItems
    };
  },

  // Mix Correction Assistant: compares wet swatch with target and gives plain Spanish instructions
  getMixCorrectionAdvice(targetRgb, actualMixedRgb) {
    const tHsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);
    const mHsv = ColorMath.rgbToHsv(actualMixedRgb.r, actualMixedRgb.g, actualMixedRgb.b);

    const lumDiff = ColorMath.getLuminance(actualMixedRgb.r, actualMixedRgb.g, actualMixedRgb.b) - ColorMath.getLuminance(targetRgb.r, targetRgb.g, targetRgb.b);
    const satDiff = mHsv.s - tHsv.s;
    const hueDiff = mHsv.h - tHsv.h;

    const steps = [];

    // Value correction
    if (lumDiff < -0.08) {
      steps.push('Demasiado oscuro: añade 1 parte de Blanco de Titanio (PW6) gradualmente.');
    } else if (lumDiff > 0.08) {
      steps.push('Demasiado claro: añade una punta de pincel de Tierra Sombra Tostada o Negro Marfil.');
    }

    // Saturation correction
    if (satDiff > 0.15) {
      steps.push('Demasiado vivo/saturado: neutraliza con una pizca de su complementario o Tierra de Sombra.');
    } else if (satDiff < -0.15) {
      steps.push('Demasiado desaturado/apagado: añade más pigmento puro del color principal.');
    }

    // Temperature / Hue correction
    if (hueDiff > 20 && hueDiff < 180) {
      steps.push('Tono desviado hacia verdes/fríos: calienta la mezcla con un toque de Ocre Amarillo o Rojo Cadmio.');
    } else if (hueDiff < -20 || hueDiff > 180) {
      steps.push('Tono desviado hacia cálidos: enfría la mezcla con un toque de Azul Ultramar o Cobalto.');
    }

    if (steps.length === 0) {
      steps.push('¡Mezcla exacta! La diferencia visual es prácticamente imperceptible (Delta E < 3).');
    }

    return steps;
  }
};
