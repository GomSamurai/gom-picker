/**
 * GOM Picker - Hero Color Well & Relative Companion Bands Engine
 * Displays the active color in a large prominent preview with dual-space stats,
 * and renders relative companion bands calculated by selectable algorithms.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';

export const CompanionBands = {
  activeAlgorithm: 'shades_tints', // 'shades_tints' | 'analogous' | 'temperature' | 'complementary' | 'saturation'

  ALGORITHMS: [
    { id: 'shades_tints', label: 'Escala Tonal (Luces, Medios y Sombras)' },
    { id: 'analogous', label: 'Matices Análogos Próximos (±15°, ±30°)' },
    { id: 'temperature', label: 'Variación Térmica (Cálido ↔ Frío)' },
    { id: 'complementary', label: 'Eje Complementario & Neutros' },
    { id: 'saturation', label: 'Rampa de Saturación (Gris a Puro)' }
  ],

  // Calculate the 6 companion swatches for an RGB color based on the selected algorithm
  calculateBands(rgb, algorithm = this.activeAlgorithm) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const bands = [];

    switch (algorithm) {
      case 'shades_tints': {
        // From deep shadow (v: 0.15) to bright tint (v: 0.98, s reduced)
        const steps = [
          { s: hsv.s * 0.9, v: Math.max(0.12, hsv.v * 0.3), label: 'Sombra Profunda' },
          { s: hsv.s * 0.95, v: Math.max(0.25, hsv.v * 0.55), label: 'Sombra Media' },
          { s: hsv.s, v: Math.max(0.4, hsv.v * 0.8), label: 'Medio Tono Sombrío' },
          { s: hsv.s, v: hsv.v, label: 'Tono Local (Actual)' },
          { s: hsv.s * 0.75, v: Math.min(1, hsv.v * 1.15), label: 'Luz Directa' },
          { s: hsv.s * 0.35, v: 0.98, label: 'Luz Especular / Brillo' }
        ];
        steps.forEach(st => {
          const cRgb = ColorMath.hsvToRgb(hsv.h, ColorMath.clamp(st.s, 0, 1), ColorMath.clamp(st.v, 0, 1));
          bands.push({
            rgb: cRgb,
            hex: ColorMath.rgbToHex(cRgb.r, cRgb.g, cRgb.b),
            label: st.label
          });
        });
        break;
      }

      case 'analogous': {
        // Shift hue around the active color
        const offsets = [-30, -15, 0, 15, 30, 45];
        offsets.forEach(off => {
          const newH = (hsv.h + off + 360) % 360;
          const cRgb = ColorMath.hsvToRgb(newH, hsv.s, hsv.v);
          bands.push({
            rgb: cRgb,
            hex: ColorMath.rgbToHex(cRgb.r, cRgb.g, cRgb.b),
            label: off === 0 ? 'Color Actual' : `Análogo ${off > 0 ? '+' : ''}${off}°`
          });
        });
        break;
      }

      case 'temperature': {
        // Shift temperature: move towards warm (35°) or cool (220°) without destroying value
        const warmSteps = [
          { factor: -0.6, label: 'Frío Glacial (-60%)' },
          { factor: -0.3, label: 'Frío Moderado (-30%)' },
          { factor: 0, label: 'Temperatura Base' },
          { factor: 0.3, label: 'Cálido Suave (+30%)' },
          { factor: 0.6, label: 'Cálido Solar (+60%)' },
          { factor: 0.9, label: 'Calor Ígneo (+90%)' }
        ];
        warmSteps.forEach(st => {
          let newH = hsv.h;
          if (st.factor > 0) {
            // Shift towards golden warm 35°
            newH = (hsv.h * (1 - st.factor) + 35 * st.factor + 360) % 360;
          } else if (st.factor < 0) {
            // Shift towards cyan-blue cool 215°
            const f = Math.abs(st.factor);
            newH = (hsv.h * (1 - f) + 215 * f + 360) % 360;
          }
          const cRgb = ColorMath.hsvToRgb(newH, hsv.s, hsv.v);
          bands.push({
            rgb: cRgb,
            hex: ColorMath.rgbToHex(cRgb.r, cRgb.g, cRgb.b),
            label: st.label
          });
        });
        break;
      }

      case 'complementary': {
        // Step across the complementary axis towards 180°
        const compH = (hsv.h + 180) % 360;
        const blendFactors = [0, 0.25, 0.45, 0.55, 0.75, 1.0];
        blendFactors.forEach((factor, idx) => {
          let cRgb;
          if (factor === 0) {
            cRgb = rgb;
          } else if (factor === 1.0) {
            cRgb = ColorMath.hsvToRgb(compH, hsv.s, hsv.v);
          } else {
            // Optical chromatic neutral in center
            const curH = factor < 0.5 ? hsv.h : compH;
            const sat = ColorMath.clamp(hsv.s * (1 - Math.sin(factor * Math.PI) * 0.8), 0.05, 1);
            cRgb = ColorMath.hsvToRgb(curH, sat, hsv.v);
          }
          bands.push({
            rgb: cRgb,
            hex: ColorMath.rgbToHex(cRgb.r, cRgb.g, cRgb.b),
            label: factor === 0 ? 'Color Actual' : (factor === 1.0 ? 'Complementario (180°)' : `Gris Neutro Mezcla ${Math.round(factor * 100)}%`)
          });
        });
        break;
      }

      case 'saturation': {
        // From muted chromatic gray to intense pure chroma
        const satSteps = [0.08, 0.25, 0.45, 0.7, 0.88, 1.0];
        satSteps.forEach(sat => {
          const cRgb = ColorMath.hsvToRgb(hsv.h, sat, hsv.v);
          bands.push({
            rgb: cRgb,
            hex: ColorMath.rgbToHex(cRgb.r, cRgb.g, cRgb.b),
            label: `Saturación ${Math.round(sat * 100)}%`
          });
        });
        break;
      }
    }

    return bands;
  },

  // Generate an intelligent artist mixing recipe for the color
  getArtistRecipeAdvice(rgb) {
    const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);

    let basePigments = '';
    let opacity = 'Semi-opaco';
    let lightfastness = 'Excelente (ASTM I)';
    let artistTip = '';

    if (hsl.h >= 10 && hsl.h <= 45) {
      if (hsl.s < 0.45) {
        basePigments = 'Ocre Amarillo (PY43) + Sombra Natural (PBr7) + Blanco de Titanio (PW6)';
        opacity = 'Opaco';
        artistTip = 'Tono tierra ideal para carnaciones en semitonos y paisajes orgánicos.';
      } else {
        basePigments = 'Rojo Cadmio (PR108) + Amarillo Cadmio (PY35) + Blanco de Titanio (PW6)';
        opacity = 'Opaco denso';
        artistTip = 'Alta potencia cubriente. Usa Blanco de Zinc si buscas veladuras luminosas.';
      }
    } else if (hsl.h > 45 && hsl.h <= 75) {
      basePigments = 'Amarillo Limón (PY35) + Ocre (PY43) + pizca de Blanco (PW6)';
      opacity = 'Semi-opaco';
      artistTip = 'Para sombrear este amarillo, usa Sombra Natural (PBr7) o Siena Tostada en lugar de negro.';
    } else if (hsl.h > 75 && hsl.h <= 165) {
      basePigments = 'Verde Viridián (PG18) + Ocre Amarillo (PY43) + Blanco de Titanio (PW6)';
      opacity = 'Semi-transparente';
      artistTip = 'El verde tierra no compite con la luz; añade siena tostada para romper la artificialidad.';
    } else if (hsl.h > 165 && hsl.h <= 260) {
      basePigments = 'Azul Ultramar (PB29) + Azul Cobalto (PB28) + Blanco de Titanio (PW6)';
      opacity = 'Semi-transparente';
      artistTip = 'El azul ultramar rebajado con siena tostada crea grises perla magistrales para cielos y fondos.';
    } else {
      basePigments = 'Magenta Quinacridona (PR122) + Azul Ultramar (PB29) + Blanco (PW6)';
      opacity = 'Transparente / Veladuras';
      artistTip = 'El carmín puro se ensucia fácilmente; mantén el pincel limpio al aplicarlo en luces.';
    }

    return {
      munsellNotation: munsell.notation,
      munsellLabel: munsell.label,
      basePigments,
      opacity,
      lightfastness,
      artistTip
    };
  }
};
