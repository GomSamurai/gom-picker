/**
 * GOM Picker - Color Harmonies & Color Theory Studio
 * Computes classic & modern color harmonies, tint/shade/tone matrices,
 * realistic physical pigment blends, and light/shadow recommendations.
 */

import { ColorMath } from './colorMath.js';

export const HarmonyEngine = {
  // Harmony rules list
  RULES: [
    { id: 'complementary', name: 'Complementario', angles: [180] },
    { id: 'split-complementary', name: 'Complementario Dividido', angles: [150, 210] },
    { id: 'triadic', name: 'Triádico', angles: [120, 240] },
    { id: 'tetradic', name: 'Tetrádico (Rectangular)', angles: [60, 180, 240] },
    { id: 'square', name: 'Cuadrado', angles: [90, 180, 270] },
    { id: 'analogous', name: 'Análogo', angles: [-30, 30] },
    { id: 'analogous-extended', name: 'Análogo Extendido', angles: [-60, -30, 30, 60] },
    { id: 'monochromatic', name: 'Monocromático', angles: [] },
    { id: 'double-split', name: 'Doble Dividido', angles: [-30, 30, 150, 210] }
  ],

  // Compute harmony palette for given base HSV or RGB
  getHarmony(baseColorHsv, ruleId = 'triadic', wheelType = 'rgb') {
    const rule = this.RULES.find(r => r.id === ruleId) || this.RULES[0];
    const { h, s, v } = baseColorHsv;
    const baseRgb = ColorMath.hsvToRgb(h, s, v);

    const colors = [
      {
        role: 'Base',
        h,
        s,
        v,
        rgb: baseRgb,
        hex: ColorMath.rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b),
        angle: 0
      }
    ];

    if (rule.id === 'monochromatic') {
      // 4 tonal steps
      const steps = [
        { sOffset: -0.4, vOffset: 0.25, role: 'Luz Alta' },
        { sOffset: -0.2, vOffset: 0.1, role: 'Medio Tono Claro' },
        { sOffset: 0.1, vOffset: -0.2, role: 'Sombra' },
        { sOffset: 0.25, vOffset: -0.45, role: 'Sombra Profunda' }
      ];
      steps.forEach((step, idx) => {
        const newS = ColorMath.clamp(s + step.sOffset, 0.05, 1);
        const newV = ColorMath.clamp(v + step.vOffset, 0.05, 1);
        const rgb = ColorMath.hsvToRgb(h, newS, newV);
        colors.push({
          role: step.role,
          h,
          s: newS,
          v: newV,
          rgb,
          hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
          angle: 0
        });
      });
      return { rule, colors };
    }

    // Angular rules
    rule.angles.forEach((offset, idx) => {
      let targetHue;
      if (wheelType === 'ryb') {
        // Map in RYB artist wheel space
        const currentRyb = ColorMath.rgbToRybHue(h);
        const targetRyb = (currentRyb + offset + 360) % 360;
        targetHue = ColorMath.rybToRgbHue(targetRyb);
      } else {
        targetHue = (h + offset + 360) % 360;
      }

      // Slight natural saturation adjustment for harmonious balance
      const newRgb = ColorMath.hsvToRgb(targetHue, s, v);
      colors.push({
        role: `Armonía ${idx + 1}`,
        h: Math.round(targetHue),
        s,
        v,
        rgb: newRgb,
        hex: ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b),
        angle: offset
      });
    });

    return { rule, colors };
  },

  // Generates Tint, Shade and Tone variations
  getTintsShadesTones(rgb, stepsCount = 7) {
    const tints = [];
    const shades = [];
    const tones = [];

    for (let i = 0; i < stepsCount; i++) {
      const factor = i / (stepsCount - 1); // 0 to 1

      // Tint: Blend with Pure White (255, 255, 255)
      const tintR = ColorMath.clamp255(rgb.r + (255 - rgb.r) * factor);
      const tintG = ColorMath.clamp255(rgb.g + (255 - rgb.g) * factor);
      const tintB = ColorMath.clamp255(rgb.b + (255 - rgb.b) * factor);
      tints.push({
        label: `Tint ${Math.round(factor * 100)}%`,
        rgb: { r: tintR, g: tintG, b: tintB },
        hex: ColorMath.rgbToHex(tintR, tintG, tintB)
      });

      // Shade: Blend with Pure Black (0, 0, 0)
      const shadeR = ColorMath.clamp255(rgb.r * (1 - factor));
      const shadeG = ColorMath.clamp255(rgb.g * (1 - factor));
      const shadeB = ColorMath.clamp255(rgb.b * (1 - factor));
      shades.push({
        label: `Shade ${Math.round(factor * 100)}%`,
        rgb: { r: shadeR, g: shadeG, b: shadeB },
        hex: ColorMath.rgbToHex(shadeR, shadeG, shadeB)
      });

      // Tone: Blend with 50% Neutral Gray (128, 128, 128)
      const toneR = ColorMath.clamp255(rgb.r + (128 - rgb.r) * factor);
      const toneG = ColorMath.clamp255(rgb.g + (128 - rgb.g) * factor);
      const toneB = ColorMath.clamp255(rgb.b + (128 - rgb.b) * factor);
      tones.push({
        label: `Tone ${Math.round(factor * 100)}%`,
        rgb: { r: toneR, g: toneG, b: toneB },
        hex: ColorMath.rgbToHex(toneR, toneG, toneB)
      });
    }

    return { tints, shades, tones };
  },

  // Generates Physical Pigment Mix ramp between two colors
  getPigmentBlendRamp(colorA, colorB, steps = 7) {
    const ramp = [];
    for (let i = 0; i < steps; i++) {
      const weight = i / (steps - 1);
      const blendedRgb = ColorMath.mixPigments(colorA, colorB, weight);
      ramp.push({
        weight: Math.round(weight * 100),
        rgb: blendedRgb,
        hex: ColorMath.rgbToHex(blendedRgb.r, blendedRgb.g, blendedRgb.b)
      });
    }
    return ramp;
  },

  // Painter's Light & Shadow temperature advice
  // Classical rule: Warm Light => Cool Shadows, Cool Light => Warm Shadows
  getLightShadowAdvice(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    // Determine temperature (Red/Yellow/Orange = warm, Blue/Cyan = cool)
    const isWarm = (hsv.h >= 0 && hsv.h <= 70) || hsv.h >= 320;
    
    // Warm light setup
    let shadowHue, highlightHue, bounceHue;
    if (isWarm) {
      // Warm light: cool shadow (shift towards blue/violet), warm bounce
      shadowHue = (hsv.h + 160) % 360;
      highlightHue = (hsv.h + 10) % 360;
      bounceHue = (hsv.h + 30) % 360;
    } else {
      // Cool light: warm shadow (shift towards amber/burnt umber), cool bounce
      shadowHue = (hsv.h + 180) % 360;
      highlightHue = (hsv.h - 10 + 360) % 360;
      bounceHue = (hsv.h - 40 + 360) % 360;
    }

    const highlightRgb = ColorMath.hsvToRgb(highlightHue, ColorMath.clamp(hsv.s * 0.7, 0.1, 1), ColorMath.clamp(hsv.v * 1.25, 0.3, 1));
    const shadowRgb = ColorMath.hsvToRgb(shadowHue, ColorMath.clamp(hsv.s * 1.15, 0.2, 1), ColorMath.clamp(hsv.v * 0.45, 0.1, 0.8));
    const bounceRgb = ColorMath.hsvToRgb(bounceHue, ColorMath.clamp(hsv.s * 0.9, 0.2, 1), ColorMath.clamp(hsv.v * 0.65, 0.1, 0.9));

    return {
      lightType: isWarm ? 'Luz Cálida (Sol / Fuego)' : 'Luz Fría (Cielo / Fluorescente)',
      recommendation: isWarm 
        ? 'Las sombras deben enfriarse hacia azules/violetas para un contraste cromático realista.'
        : 'Las sombras deben calentarse hacia tonos tierra/ocres para evitar apariencia plástica o muerta.',
      highlight: { rgb: highlightRgb, hex: ColorMath.rgbToHex(highlightRgb.r, highlightRgb.g, highlightRgb.b), role: 'Luz Especular' },
      base: { rgb, hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b), role: 'Color Local' },
      shadow: { rgb: shadowRgb, hex: ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b), role: 'Sombra Proyectada' },
      bounce: { rgb: bounceRgb, hex: ColorMath.rgbToHex(bounceRgb.r, bounceRgb.g, bounceRgb.b), role: 'Luz Rebotada' }
    };
  }
};
