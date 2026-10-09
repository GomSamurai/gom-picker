/**
 * GOM Picker - Munsell Color System Engine
 * Converts between RGB / HSV and Munsell Color Notation (Hue Value/Chroma - e.g. "5R 4/14"),
 * and generates Munsell Book of Color slices and Value steps.
 */

import { ColorMath } from './colorMath.js';

export const MunsellSystem = {
  // 10 Major Munsell Hue families (each divided into 2.5, 5, 7.5, 10)
  // Total 40 standard hues around the circle
  HUES: [
    { name: '5R', angle: 15, label: 'Red' },
    { name: '10R', angle: 30, label: 'Red-YellowRed' },
    { name: '5YR', angle: 45, label: 'Yellow-Red (Orange)' },
    { name: '10YR', angle: 60, label: 'YellowRed-Yellow' },
    { name: '5Y', angle: 75, label: 'Yellow' },
    { name: '10Y', angle: 95, label: 'Yellow-GreenYellow' },
    { name: '5GY', angle: 115, label: 'Green-Yellow' },
    { name: '10GY', angle: 135, label: 'GreenYellow-Green' },
    { name: '5G', angle: 155, label: 'Green' },
    { name: '10G', angle: 175, label: 'Green-BlueGreen' },
    { name: '5BG', angle: 195, label: 'Blue-Green' },
    { name: '10BG', angle: 215, label: 'BlueGreen-Blue' },
    { name: '5B', angle: 235, label: 'Blue' },
    { name: '10B', angle: 255, label: 'Blue-PurpleBlue' },
    { name: '5PB', angle: 275, label: 'Purple-Blue' },
    { name: '10PB', angle: 295, label: 'PurpleBlue-Purple' },
    { name: '5P', angle: 315, label: 'Purple' },
    { name: '10P', angle: 335, label: 'Purple-RedPurple' },
    { name: '5RP', angle: 350, label: 'Red-Purple' },
    { name: '10RP', angle: 5, label: 'RedPurple-Red' }
  ],

  // Convert RGB to approximate Munsell notation { hueStr, value, chroma, notation }
  rgbToMunsell(r, g, b) {
    const hsv = ColorMath.rgbToHsv(r, g, b);
    const lum = ColorMath.getLuminance(r, g, b);

    // 1. Munsell Value: Square root approximation of luminance scaled from 0 (Black) to 10 (White)
    // Precise ASTM D1535 polynomial approximation: V = 10 * sqrt(lum)
    let value = 10 * Math.sqrt(lum);
    value = Math.max(0.5, Math.min(9.5, Math.round(value * 10) / 10));

    // 2. Munsell Chroma: saturation * value * maxChroma factor (typically up to /16)
    // Pure neutral gray has chroma /0
    let chroma = Math.round(hsv.s * (value / 5) * 14);
    if (chroma % 2 !== 0 && chroma > 1) chroma -= 1; // Munsell standard uses steps of 2: /2, /4, /6, /8, /10, /12, /14

    // 3. Munsell Hue: find closest Hue sector
    const hAngle = hsv.h;
    let closestHue = this.HUES[0];
    let minDiff = 360;

    for (const h of this.HUES) {
      let diff = Math.abs(hAngle - h.angle);
      if (diff > 180) diff = 360 - diff;
      if (diff < minDiff) {
        minDiff = diff;
        closestHue = h;
      }
    }

    if (chroma === 0 || hsv.s < 0.05) {
      return {
        hueStr: 'N',
        value,
        chroma: 0,
        notation: `N ${value.toFixed(1)}/`,
        label: 'Neutral Gray'
      };
    }

    const notation = `${closestHue.name} ${value.toFixed(1)}/${chroma}`;
    return {
      hueStr: closestHue.name,
      value,
      chroma,
      notation,
      label: closestHue.label
    };
  },

  generateSliceGrid(hueAngle) {
    return { rows: this.getHueSliceChart(hueAngle) };
  },

  // Generates Munsell Book of Color Value/Chroma chart slice for current Hue
  getHueSliceChart(hueAngle) {
    const rows = []; // Values 9 down to 2
    for (let val = 9; val >= 2; val -= 1) {
      const row = { value: val, chips: [] };
      for (let chr = 0; chr <= 14; chr += 2) {
        if (chr === 0) {
          // Neutral gray chip
          const grayLum = Math.pow(val / 10, 2);
          const gRgb = ColorMath.clamp255(grayLum * 255);
          row.chips.push({
            value: val,
            chroma: 0,
            notation: `N ${val}/`,
            rgb: { r: gRgb, g: gRgb, b: gRgb },
            hex: ColorMath.rgbToHex(gRgb, gRgb, gRgb)
          });
        } else {
          // Chroma saturation step
          const sat = ColorMath.clamp((chr / 14) * (5 / Math.max(1, val)), 0, 1);
          const v = ColorMath.clamp(val / 10 + (sat * 0.1), 0, 1);
          const rgb = ColorMath.hsvToRgb(hueAngle, sat, v);
          row.chips.push({
            value: val,
            chroma: chr,
            notation: `${val}/${chr}`,
            rgb,
            hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b)
          });
        }
      }
      rows.push(row);
    }
    return rows;
  }
};
