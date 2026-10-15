/**
 * GOM Picker - Smart Palette Harmonizer, Quality Scoring Engine & Library Optimizer
 * Evaluates palettes with academic color theory metrics (Florent Farges, Munsell, Goethe, Itten)
 * and provides algorithmic transformations to achieve harmonic perfection (Grade S+).
 * 
 * 100% Offline, Zero external dependencies.
 */

import { ColorMath } from './colorMath.js';

export class PaletteOptimizer {
  /**
   * Evaluates any list of HEX or RGB colors and produces an objective 0-100 score,
   * tier badge (S+, A, B, C, D), multi-dimensional metrics, and diagnostic critique.
   */
  static calculateScore(colors) {
    if (!colors || colors.length === 0) {
      return this._getDefaultEmptyScore();
    }

    const rgbList = colors.map(c => {
      if (typeof c === 'string') return ColorMath.hexToRgb(c);
      if (c.rgb) return c.rgb;
      if (c.r !== undefined) return c;
      return { r: 128, g: 128, b: 128 };
    });

    const oklchList = rgbList.map(rgb => ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b));
    const hsvList = rgbList.map(rgb => ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b));
    const count = rgbList.length;

    // 1. Dynamic Range & Value Contrast (Florent Farges Value Ladder)
    const lums = oklchList.map(c => c.l);
    const minL = Math.min(...lums);
    const maxL = Math.max(...lums);
    const dynamicRange = maxL - minL; // 0 to 1

    // Evaluate distribution of steps across value ladder
    const sortedLums = [...lums].sort((a, b) => a - b);
    let minGap = 1.0;
    for (let i = 1; i < sortedLums.length; i++) {
      const gap = sortedLums[i] - sortedLums[i - 1];
      if (gap < minGap) minGap = gap;
    }
    const idealGap = count > 1 ? (dynamicRange / (count - 1)) : 0.5;
    const gapScore = count > 1 ? Math.min(100, Math.round((minGap / Math.max(0.02, idealGap * 0.45)) * 100)) : 100;
    const valueRangeScore = Math.min(100, Math.round(dynamicRange * 125));
    const metricContrast = Math.round(valueRangeScore * 0.6 + gapScore * 0.4);

    // 2. Harmonic Angular Cohesion (Wheel distribution)
    const hues = hsvList.map(h => h.h);
    let harmonicType = 'Monocromático';
    let metricHarmony = 75;

    if (count >= 2) {
      // Find circular distances between hues
      const hueDistances = [];
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          let d = Math.abs(hues[i] - hues[j]) % 360;
          if (d > 180) d = 360 - d;
          hueDistances.push(d);
        }
      }

      const avgDist = hueDistances.reduce((a, b) => a + b, 0) / hueDistances.length;
      const maxDist = Math.max(...hueDistances);

      if (maxDist < 45) {
        harmonicType = 'Análoga Pura (Alta Unidad)';
        metricHarmony = 94;
      } else if (maxDist < 75) {
        harmonicType = 'Análoga Expandida';
        metricHarmony = 90;
      } else if (hueDistances.some(d => Math.abs(d - 180) < 25)) {
        harmonicType = 'Complementaria Directa';
        metricHarmony = 96;
      } else if (hueDistances.some(d => Math.abs(d - 120) < 25)) {
        harmonicType = 'Tríada Equilibrada';
        metricHarmony = 93;
      } else if (hueDistances.some(d => Math.abs(d - 150) < 20)) {
        harmonicType = 'Split-Complementario';
        metricHarmony = 95;
      } else if (avgDist > 80 && avgDist < 140) {
        harmonicType = 'Polifonía Cromática / Tetrádica';
        metricHarmony = 86;
      } else {
        harmonicType = 'Cromática Compleja';
        metricHarmony = Math.max(55, Math.min(85, Math.round(100 - Math.abs(avgDist - 90) * 0.5)));
      }
    }

    // 3. Thermal Balance (Warm vs Cool Sorolla/Gurney dynamics)
    let warmCount = 0;
    let coolCount = 0;
    hsvList.forEach(h => {
      if ((h.h >= 0 && h.h <= 75) || h.h >= 320) warmCount++;
      else if (h.h >= 140 && h.h <= 270) coolCount++;
    });

    const warmRatio = warmCount / count;
    const coolRatio = coolCount / count;
    let metricThermal = 80;
    let thermalDesc = 'Equilibrada';

    if (warmCount > 0 && coolCount > 0) {
      // Classic light-shadow temperature interplay (e.g. 60/40 or 70/30)
      const balance = 1 - Math.abs(warmRatio - coolRatio);
      metricThermal = Math.round(75 + balance * 24);
      thermalDesc = warmRatio > coolRatio ? 'Cálido Dominante con Contraste Frío' : 'Frío Dominante con Contraste Cálido';
    } else if (warmCount > 0) {
      metricThermal = 84;
      thermalDesc = 'Cálida Solar Pura';
    } else if (coolCount > 0) {
      metricThermal = 84;
      thermalDesc = 'Fría Celeste / Nocturna';
    } else {
      metricThermal = 72;
      thermalDesc = 'Neutro / Tierras';
    }

    // 4. Perceptual Distinctness (Pairwise Delta-E in OKLab space)
    let minDeltaE = 1.0;
    let totalDeltaE = 0;
    let pairCount = 0;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const c1 = oklchList[i];
        const c2 = oklchList[j];
        const dL = c1.l - c2.l;
        const dH_rad = ((c1.h - c2.h) * Math.PI) / 180;
        const dC = Math.sqrt(Math.max(0, c1.c * c1.c + c2.c * c2.c - 2 * c1.c * c2.c * Math.cos(dH_rad)));
        const dE = Math.sqrt(dL * dL + dC * dC);

        if (dE < minDeltaE) minDeltaE = dE;
        totalDeltaE += dE;
        pairCount++;
      }
    }

    const avgDeltaE = pairCount > 0 ? (totalDeltaE / pairCount) : 0.4;
    // Penalize if any two colors are indistinguishably close (dE < 0.06)
    let metricDistinctness = Math.round(Math.min(100, (avgDeltaE / 0.32) * 85));
    if (minDeltaE < 0.05) {
      metricDistinctness = Math.max(35, Math.round(metricDistinctness * 0.6));
    }

    // 5. Pigment Viability & Physical Feasibility
    let outOfGamutCount = 0;
    let muddyCount = 0;
    rgbList.forEach((rgb, idx) => {
      const check = ColorMath.checkCmykGamut(rgb.r, rgb.g, rgb.b);
      if (check.isOutOfGamut) outOfGamutCount++;
      const hsv = hsvList[idx];
      // Muddy check: desaturated midtone with high value compression
      if (hsv.s < 0.12 && hsv.v > 0.3 && hsv.v < 0.7) muddyCount++;
    });

    let metricPigments = Math.round(100 - (outOfGamutCount / count) * 25 - (muddyCount / count) * 20);
    metricPigments = Math.max(45, Math.min(100, metricPigments));

    // Weighted Overall Score (0 to 100)
    const rawTotal = (
      metricContrast * 0.25 +
      metricHarmony * 0.25 +
      metricDistinctness * 0.20 +
      metricThermal * 0.15 +
      metricPigments * 0.15
    );

    const totalScore = Math.max(25, Math.min(99, Math.round(rawTotal)));

    // Tier Badging
    let grade = 'B';
    let gradeTitle = 'Armonía Sólida';
    let gradeBadgeClass = 'grade-b';

    if (totalScore >= 95) {
      grade = 'S+';
      gradeTitle = 'Armonía de Grado Maestro';
      gradeBadgeClass = 'grade-s';
    } else if (totalScore >= 85) {
      grade = 'A';
      gradeTitle = 'Excelente Cohesión & Rango';
      gradeBadgeClass = 'grade-a';
    } else if (totalScore >= 70) {
      grade = 'B';
      gradeTitle = 'Buena Armonía con Potencial';
      gradeBadgeClass = 'grade-b';
    } else if (totalScore >= 50) {
      grade = 'C';
      gradeTitle = 'Desbalance Tonal o Contraste Pobre';
      gradeBadgeClass = 'grade-c';
    } else {
      grade = 'D';
      gradeTitle = 'Paleta Plana o Colores Barro';
      gradeBadgeClass = 'grade-d';
    }

    // Diagnostic Critique & Actionable Tips
    const diagnostics = [];
    const recommendations = [];

    if (dynamicRange < 0.45) {
      diagnostics.push({
        type: 'warning',
        icon: '⚠️',
        text: `Rango dinámico comprimido (${Math.round(dynamicRange * 100)}%): Los valores tonales están apelmazados en la zona media.`
      });
      recommendations.push('Aplica "Escalonamiento de Valor (Farges)" para abrir una sombra profunda y una luz focal.');
    } else {
      diagnostics.push({
        type: 'success',
        icon: '✨',
        text: `Excelente jerarquía de valores tonales (Amplitud: ${Math.round(dynamicRange * 100)}%).`
      });
    }

    if (minDeltaE < 0.06) {
      diagnostics.push({
        type: 'warning',
        icon: '🔍',
        text: 'Hay muestras casi gemelas o indistinguibles que compiten entre sí.'
      });
      recommendations.push('Separa los matices o valores contiguos para mayor legibilidad y claridad cromática.');
    }

    if (outOfGamutCount > 0) {
      diagnostics.push({
        type: 'info',
        icon: '🖨️',
        text: `${outOfGamutCount} color(es) fuera de gamut imprimible CMYK (brillos sintéticos RGB).`
      });
      recommendations.push('Usa "Corrección de Gamut CMYK" si planeas imprimir o buscar tubos reales de óleo/acrílico.');
    }

    diagnostics.push({
      type: 'info',
      icon: '🎨',
      text: `Estructura armónica detectada: ${harmonicType} • Temperatura: ${thermalDesc}.`
    });

    if (recommendations.length === 0) {
      recommendations.push('¡Paleta magistral! Lista para composición pictórica, ilustración o identidad visual.');
    }

    return {
      totalScore,
      grade,
      gradeTitle,
      gradeBadgeClass,
      harmonicType,
      thermalDesc,
      metrics: {
        contrast: metricContrast,
        harmony: metricHarmony,
        distinctness: metricDistinctness,
        thermal: metricThermal,
        pigments: metricPigments
      },
      stats: {
        dynamicRange: Math.round(dynamicRange * 100),
        minLuminance: Math.round(minL * 100),
        maxLuminance: Math.round(maxL * 100),
        warmPercent: Math.round(warmRatio * 100),
        coolPercent: Math.round(coolRatio * 100),
        avgDeltaE: (avgDeltaE * 100).toFixed(1)
      },
      diagnostics,
      recommendations,
      suggestedMode: dynamicRange < 0.5 ? 'farges_ladder' : (metricHarmony < 80 ? 'harmonic' : 'auto_master')
    };
  }

  static _getDefaultEmptyScore() {
    return {
      totalScore: 0,
      grade: 'D',
      gradeTitle: 'Sin muestras',
      gradeBadgeClass: 'grade-d',
      harmonicType: 'Ninguna',
      thermalDesc: 'Neutro',
      metrics: { contrast: 0, harmony: 0, distinctness: 0, thermal: 0, pigments: 0 },
      stats: { dynamicRange: 0, minLuminance: 0, maxLuminance: 0, warmPercent: 0, coolPercent: 0, avgDeltaE: '0' },
      diagnostics: [{ type: 'info', icon: '📷', text: 'Carga una imagen o extrae una paleta para ver la puntuación en vivo.' }],
      recommendations: ['Extrae una paleta K-Means o selecciona una biblioteca.'],
      suggestedMode: 'auto_master'
    };
  }

  /**
   * Applies smart algorithmic transformations to elevate any palette.
   * 
   * Modes:
   * - 'harmonic': Geometrically snaps hues toward classical chords (Triad, Analogous, Complementary)
   * - 'farges_ladder': Evenly spaces luminance across the value spectrum (Florent Farges)
   * - 'farges_physics': Regulates chroma per value (peak chroma at halftones, desaturated in deep darks and highlights)
   * - 'cmyk_gamut': Clamps to realistic, printable pigment gamuts
   * - 'goethe_weights': Goethe optical weight & proportion balancing
   * - 'auto_master': Combines harmonic tuning + value laddering + chroma curve to reach Grade S+!
   * 
   * @param {Array<string|Object>} colors - List of HEX or RGB colors
   * @param {string} mode - Optimization algorithm
   * @param {number} intensity - 0.1 to 1.0 (interpolation weight)
   * @returns {Object} { optimizedColors, scoreBefore, scoreAfter }
   */
  static optimize(colors, mode = 'auto_master', intensity = 1.0) {
    if (!colors || colors.length === 0) return { optimizedColors: [], scoreBefore: null, scoreAfter: null };

    const scoreBefore = this.calculateScore(colors);
    const count = colors.length;
    const clampedIntensity = ColorMath.clamp(intensity, 0.1, 1.0);

    const rgbList = colors.map(c => {
      if (typeof c === 'string') return ColorMath.hexToRgb(c);
      if (c.rgb) return c.rgb;
      if (c.r !== undefined) return c;
      return { r: 128, g: 128, b: 128 };
    });

    let transformedRgb = [];

    switch (mode) {
      case 'harmonic':
        transformedRgb = this._optimizeHarmonicGeometry(rgbList, clampedIntensity);
        break;

      case 'farges_ladder':
        transformedRgb = this._optimizeValueLadder(rgbList, clampedIntensity);
        break;

      case 'farges_physics':
        transformedRgb = this._optimizeChromaCurve(rgbList, clampedIntensity);
        break;

      case 'cmyk_gamut':
        transformedRgb = this._optimizeCmykGamut(rgbList, clampedIntensity);
        break;

      case 'goethe_weights':
        transformedRgb = this._optimizeGoetheHarmony(rgbList, clampedIntensity);
        break;

      case 'auto_master':
      default:
        // Pipeline: Harmonic Geometry -> Value Laddering -> Chroma Curvature
        const pass1 = this._optimizeHarmonicGeometry(rgbList, clampedIntensity * 0.75);
        const pass2 = this._optimizeValueLadder(pass1, clampedIntensity * 0.85);
        transformedRgb = this._optimizeChromaCurve(pass2, clampedIntensity * 0.7);
        break;
    }

    // Blend between original and transformed based on intensity
    const finalHexList = rgbList.map((orig, idx) => {
      const target = transformedRgb[idx] || orig;
      const blendedR = Math.round(orig.r + (target.r - orig.r) * clampedIntensity);
      const blendedG = Math.round(orig.g + (target.g - orig.g) * clampedIntensity);
      const blendedB = Math.round(orig.b + (target.b - orig.b) * clampedIntensity);
      return ColorMath.rgbToHex(blendedR, blendedG, blendedB);
    });

    const scoreAfter = this.calculateScore(finalHexList);

    return {
      optimizedColors: finalHexList,
      scoreBefore,
      scoreAfter,
      improvement: scoreAfter.totalScore - scoreBefore.totalScore
    };
  }

  // --- INTERNAL OPTIMIZATION ALGORITHMS ---

  /**
   * Harmonizes hues by gently snapping to the nearest classical harmonic relationship
   * relative to the primary dominant color (first swatch or highest saturation).
   */
  static _optimizeHarmonicGeometry(rgbList, intensity) {
    if (rgbList.length <= 1) return [...rgbList];

    // Find primary anchor color (highest saturation / focal presence)
    let anchorIdx = 0;
    let maxChroma = -1;
    const oklchList = rgbList.map((rgb, idx) => {
      const ok = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
      if (ok.c > maxChroma) {
        maxChroma = ok.c;
        anchorIdx = idx;
      }
      return ok;
    });

    const baseHue = oklchList[anchorIdx].h;

    // Available canonical harmonic targets from anchor
    const targets = [
      0,               // Anchor itself
      30, -30,         // Analogous tight
      60, -60,         // Analogous wide / Sextile
      120, -120,       // Triadic
      150, -150,       // Split-Complementary
      180              // Pure Complementary
    ];

    return oklchList.map((col, idx) => {
      if (idx === anchorIdx || col.c < 0.03) {
        // Keep anchor or near-neutral grays intact
        return ColorMath.oklchToRgb(col.l, col.c, col.h);
      }

      // Find closest harmonic angle relative to baseHue
      let bestTargetAngle = col.h;
      let minDiff = Infinity;

      targets.forEach(offset => {
        const targetH = (baseHue + offset + 360) % 360;
        let diff = Math.abs(col.h - targetH) % 360;
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          bestTargetAngle = targetH;
        }
      });

      // Shortest arc interpolation
      let dH = bestTargetAngle - col.h;
      if (dH > 180) dH -= 360;
      if (dH < -180) dH += 360;

      const newH = (col.h + dH * intensity * 0.8 + 360) % 360;
      return ColorMath.oklchToRgb(col.l, col.c, newH);
    });
  }

  /**
   * Florent Farges Value Laddering:
   * Sorts swatches by inherent luminance and spaces them proportionally across a rich dynamic range (0.12 to 0.90)
   * while preserving individual hue and saturation identities.
   */
  static _optimizeValueLadder(rgbList, intensity) {
    const count = rgbList.length;
    if (count <= 1) return [...rgbList];

    const indexed = rgbList.map((rgb, idx) => {
      const ok = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
      return { idx, rgb, ok };
    });

    // Sort by lightness
    indexed.sort((a, b) => a.ok.l - b.ok.l);

    // Target dynamic ladder from deep shadow (0.14) to bright highlight (0.92)
    const minTargetL = 0.15;
    const maxTargetL = 0.90;

    const result = new Array(count);
    indexed.forEach((item, rank) => {
      const targetL = minTargetL + (rank / (count - 1)) * (maxTargetL - minTargetL);
      const blendedL = item.ok.l + (targetL - item.ok.l) * (intensity * 0.75);

      // Reconstruct with adjusted L
      const newRgb = ColorMath.oklchToRgb(blendedL, item.ok.c, item.ok.h);
      result[item.idx] = newRgb;
    });

    return result;
  }

  /**
   * Florent Farges Chroma Curvature (Physical Pigment Dynamics):
   * In oil painting, pure pigments lose chroma in deep darks (absorbing all light)
   * and in extreme highlights (diluted with white pigment). Peak chroma lives in midtones (L = 0.45 - 0.65).
   */
  static _optimizeChromaCurve(rgbList, intensity) {
    return rgbList.map(rgb => {
      const ok = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
      // Bell curve factor: peak at L=0.55
      const bell = 1 - Math.pow((ok.l - 0.55) / 0.45, 2);
      const maxAllowedC = Math.max(0.04, 0.28 * Math.max(0.1, bell));

      let newC = ok.c;
      if (newC > maxAllowedC) {
        newC = ok.c + (maxAllowedC - ok.c) * intensity;
      } else if (newC < 0.03 && ok.l > 0.3 && ok.l < 0.7) {
        // Give a subtle breath of chromatic warmth to muddy midtone grays
        newC = ok.c + 0.03 * intensity;
      }

      return ColorMath.oklchToRgb(ok.l, newC, ok.h);
    });
  }

  /**
   * Compresses colors to CMYK printable gamut without color destruction.
   */
  static _optimizeCmykGamut(rgbList, intensity) {
    return rgbList.map(rgb => {
      const clamped = ColorMath.compressToCmykGamut(rgb.r, rgb.g, rgb.b);
      return {
        r: Math.round(rgb.r + (clamped.r - rgb.r) * intensity),
        g: Math.round(rgb.g + (clamped.g - rgb.g) * intensity),
        b: Math.round(rgb.b + (clamped.b - rgb.b) * intensity)
      };
    });
  }

  /**
   * Johann Wolfgang von Goethe Light & Weight Balancing:
   * Rebalances saturation and brightness according to historical Goethe light values.
   */
  static _optimizeGoetheHarmony(rgbList, intensity) {
    // Goethe light coefficients: Yellow=9, Orange=8, Red=6, Violet=3, Blue=4, Green=6
    return rgbList.map(rgb => {
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      let goetheFactor = 6; // default mid

      if (hsv.h >= 45 && hsv.h <= 70) goetheFactor = 9; // Yellow
      else if (hsv.h > 20 && hsv.h < 45) goetheFactor = 8; // Orange
      else if (hsv.h <= 20 || hsv.h >= 340) goetheFactor = 6; // Red
      else if (hsv.h >= 80 && hsv.h <= 160) goetheFactor = 6; // Green
      else if (hsv.h > 180 && hsv.h <= 260) goetheFactor = 4; // Blue
      else if (hsv.h > 260 && hsv.h < 340) goetheFactor = 3; // Violet

      // Adjust value so lighter Goethe colors occupy delicate light values
      const targetV = Math.min(1.0, 0.35 + (goetheFactor / 9) * 0.6);
      const newV = hsv.v + (targetV - hsv.v) * (intensity * 0.4);

      return ColorMath.hsvToRgb(hsv.h, hsv.s, newV);
    });
  }
}
