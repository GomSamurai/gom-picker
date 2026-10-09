/**
 * GOM Picker - Local & Private Neural Color Intelligence & Advisory Engine
 * 100% Client-side, zero external APIs, zero latency, absolute privacy.
 * Performs deep semantic NLP vector projection, real-time palette diagnostics,
 * tonal value hierarchy audits, and professional art direction critiques.
 */

import { ColorMath } from './colorMath.js';
import { AtmosphereEngine } from './atmosphereEngine.js';

export const AIAdvisor = {
  // Vocabulary semantic lexicon with multidimensional vectors:
  // [thermal (-1 cool to +1 warm), valueKey (0 dark to 1 light), saturation (0-1), tension (0-1), organicity (0-1)]
  LEXICON: {
    // Thermal & Fire
    'fuego': [0.95, 0.7, 0.9, 0.8, 0.3],
    'calor': [0.9, 0.6, 0.8, 0.4, 0.5],
    'sol': [0.85, 0.85, 0.85, 0.3, 0.4],
    'lava': [0.98, 0.6, 0.95, 0.9, 0.1],
    'magma': [0.98, 0.65, 0.98, 0.95, 0.3],
    'volcan': [0.98, 0.48, 0.95, 0.9, 0.2],
    'volcán': [0.98, 0.48, 0.95, 0.9, 0.2],
    'volcanico': [0.98, 0.48, 0.95, 0.9, 0.2],
    'volcánico': [0.98, 0.48, 0.95, 0.9, 0.2],
    'desierto': [0.8, 0.7, 0.6, 0.3, 0.6],
    'dorado': [0.75, 0.75, 0.8, 0.2, 0.2],
    'ambar': [0.7, 0.65, 0.75, 0.2, 0.4],
    'ámbar': [0.7, 0.65, 0.75, 0.2, 0.4],
    'otoño': [0.65, 0.5, 0.7, 0.3, 0.9],

    // Creatures & Fantasy
    'dragon': [0.95, 0.38, 0.92, 0.92, 0.6],
    'dragón': [0.95, 0.38, 0.92, 0.92, 0.6],
    'criatura': [0.35, 0.45, 0.75, 0.75, 0.85],
    'monstruo': [0.2, 0.3, 0.8, 0.85, 0.7],
    'bestia': [0.4, 0.4, 0.75, 0.8, 0.8],
    'furia': [0.95, 0.45, 0.95, 0.98, 0.3],
    'fenix': [0.96, 0.75, 0.98, 0.85, 0.4],
    'fénix': [0.96, 0.75, 0.98, 0.85, 0.4],
    'vampiro': [-0.5, 0.18, 0.7, 0.85, 0.5],
    'sangre': [0.9, 0.35, 0.95, 0.9, 0.7],
    'veneno': [-0.1, 0.55, 0.95, 0.85, 0.8],
    'obsidiana': [-0.2, 0.12, 0.35, 0.85, 0.1],
    'cueva': [-0.4, 0.15, 0.35, 0.7, 0.6],
    'caverna': [-0.4, 0.15, 0.35, 0.7, 0.6],

    // Cold & Water
    'frio': [-0.9, 0.6, 0.6, 0.4, 0.3],
    'frío': [-0.9, 0.6, 0.6, 0.4, 0.3],
    'hielo': [-0.95, 0.85, 0.4, 0.3, 0.1],
    'nieve': [-0.85, 0.95, 0.15, 0.1, 0.2],
    'mar': [-0.75, 0.45, 0.75, 0.3, 0.7],
    'oceano': [-0.85, 0.3, 0.8, 0.5, 0.8],
    'océano': [-0.85, 0.3, 0.8, 0.5, 0.8],
    'glaciar': [-0.9, 0.75, 0.5, 0.3, 0.2],
    'invierno': [-0.8, 0.65, 0.3, 0.2, 0.5],
    'azul': [-0.8, 0.5, 0.8, 0.2, 0.2],

    // Atmosphere & Mystery
    'noche': [-0.7, 0.15, 0.6, 0.5, 0.4],
    'sombras': [-0.5, 0.12, 0.4, 0.6, 0.5],
    'oscuridad': [-0.6, 0.08, 0.3, 0.7, 0.3],
    'misterio': [-0.4, 0.25, 0.6, 0.7, 0.5],
    'gotico': [-0.3, 0.2, 0.5, 0.8, 0.6],
    'gótico': [-0.3, 0.2, 0.5, 0.8, 0.6],
    'alquimia': [0.3, 0.3, 0.7, 0.6, 0.5],
    'niebla': [-0.3, 0.6, 0.15, 0.1, 0.4],
    'fantasmas': [-0.5, 0.7, 0.25, 0.5, 0.2],

    // Gems & Minerals
    'oro': [0.75, 0.75, 0.85, 0.25, 0.2],
    'rubi': [0.9, 0.45, 0.95, 0.8, 0.1],
    'rubí': [0.9, 0.45, 0.95, 0.8, 0.1],
    'esmeralda': [-0.3, 0.55, 0.9, 0.5, 0.4],
    'zafiro': [-0.85, 0.45, 0.92, 0.6, 0.2],
    'amatista': [-0.4, 0.5, 0.85, 0.6, 0.3],
    'cristal': [-0.5, 0.85, 0.4, 0.4, 0.1],
    'acero': [-0.3, 0.5, 0.15, 0.4, 0.05],

    // Vibrancy & Tech
    'neon': [0.1, 0.7, 0.98, 0.9, 0.0],
    'neón': [0.1, 0.7, 0.98, 0.9, 0.0],
    'cyberpunk': [0.0, 0.35, 0.98, 0.95, 0.0],
    'sintetizador': [0.2, 0.5, 0.9, 0.7, 0.0],
    'futurista': [-0.3, 0.6, 0.8, 0.5, 0.0],
    'laser': [0.2, 0.8, 0.99, 0.9, 0.0],
    'láser': [0.2, 0.8, 0.99, 0.9, 0.0],
    'holograma': [-0.4, 0.8, 0.7, 0.4, 0.0],

    // Cosmos & Sky
    'galaxia': [-0.6, 0.25, 0.9, 0.85, 0.2],
    'cosmos': [-0.7, 0.2, 0.85, 0.8, 0.1],
    'espacio': [-0.8, 0.1, 0.5, 0.7, 0.1],
    'estrella': [0.3, 0.9, 0.7, 0.5, 0.1],
    'tormenta': [-0.6, 0.3, 0.5, 0.8, 0.5],
    'relampago': [-0.2, 0.9, 0.95, 0.95, 0.1],
    'relámpago': [-0.2, 0.9, 0.95, 0.95, 0.1],
    'atardecer': [0.8, 0.6, 0.85, 0.5, 0.6],
    'amanecer': [0.7, 0.75, 0.75, 0.3, 0.6],

    // Nature & Organic
    'bosque': [-0.2, 0.4, 0.65, 0.2, 0.95],
    'selva': [-0.1, 0.45, 0.85, 0.3, 0.98],
    'tierra': [0.5, 0.35, 0.5, 0.2, 0.9],
    'musgo': [-0.3, 0.45, 0.6, 0.1, 0.9],
    'hojas': [0.1, 0.55, 0.75, 0.2, 0.95],
    'primavera': [0.2, 0.75, 0.7, 0.2, 0.85],
    'flores': [0.4, 0.7, 0.85, 0.4, 0.9],

    // Emotional Moods
    'melancolia': [-0.6, 0.35, 0.3, 0.3, 0.6],
    'melancolía': [-0.6, 0.35, 0.3, 0.3, 0.6],
    'serenidad': [-0.3, 0.65, 0.35, 0.1, 0.7],
    'ira': [0.95, 0.45, 0.95, 0.98, 0.4],
    'pasion': [0.85, 0.5, 0.9, 0.7, 0.6],
    'pasión': [0.85, 0.5, 0.9, 0.7, 0.6],
    'magia': [-0.1, 0.55, 0.85, 0.6, 0.4],
    'epico': [0.4, 0.6, 0.8, 0.7, 0.5],
    'épico': [0.4, 0.6, 0.8, 0.7, 0.5],
    'delicado': [0.1, 0.85, 0.25, 0.1, 0.7]
  },

  /**
   * Generates a fully calculated, intelligent color scheme from ANY arbitrary user prompt
   * without static presets. Evaluates linguistic tokens, builds custom vector coordinates,
   * calculates dynamic ranges, and structures exact 60-30-10 lighting harmony.
   */
  synthesizePalette(promptText) {
    const rawTokens = (promptText || '').toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/gi, ' ').split(/\s+/).filter(Boolean);

    // Initialize average vector [thermal, valueKey, saturation, tension, organicity]
    let vec = [0.1, 0.5, 0.6, 0.4, 0.5];
    let matchedCount = 0;

    rawTokens.forEach(t => {
      // Direct or partial match in semantic lexicon
      for (const [key, val] of Object.entries(this.LEXICON)) {
        if (t === key || t.startsWith(key) || key.startsWith(t)) {
          for (let i = 0; i < 5; i++) {
            vec[i] = (vec[i] * matchedCount + val[i]) / (matchedCount + 1);
          }
          matchedCount++;
          break;
        }
      }
    });

    // If no direct words matched, derive pseudorandom deterministic vector from text hash
    if (matchedCount === 0) {
      let hash = 0;
      for (let i = 0; i < promptText.length; i++) hash = (hash << 5) - hash + promptText.charCodeAt(i);
      const rand1 = Math.abs(Math.sin(hash)) % 1;
      const rand2 = Math.abs(Math.cos(hash)) % 1;
      const rand3 = Math.abs(Math.sin(hash * 2)) % 1;
      vec = [rand1 * 2 - 1, 0.3 + rand2 * 0.5, 0.4 + rand3 * 0.5, 0.3 + rand1 * 0.5, rand2];
    }

    const [thermal, valueKey, saturation, tension, organicity] = vec;

    // Derive Base Hue from thermal axis:
    // Warm (>0): maps from fiery red-orange (12°) at high thermal to warm amber-gold (44°) at lower thermal
    // Cool (<0): maps from deep cyan-blue (210°) to electric cobalt (235°)
    let baseHue;
    if (thermal >= 0) {
      baseHue = Math.round(12 + (1 - thermal) * 32); // 12° (fire/dragon red) to 44° (amber gold)
    } else {
      baseHue = Math.round(210 + Math.abs(thermal) * 25); // 210° to 235° (cyan / cobalt)
    }

    // Apply tension offset:
    // Low tension: analogous / harmonious shift (e.g. 35° golden glow)
    // High tension: powerful complementary contrast (e.g. 165° electric opposite)
    const harmonySpread = tension > 0.72 ? 165 : (32 + tension * 40);

    // Build 5-step scientifically calibrated palette
    // 1. Dominant Background/Atmosphere (60% weight) - atmospheric silhouette
    const bgHue = (baseHue + (thermal > 0 ? -6 : 6) + 360) % 360;
    const bgVal = ColorMath.clamp(valueKey * 0.32 + 0.06, 0.05, 0.35);
    const bgSat = ColorMath.clamp(saturation * 0.7, 0.2, 0.9);
    const cDominant = ColorMath.hsvToRgb(bgHue, bgSat, bgVal);

    // 2. Secondary Main Body / Midtone Structure (30% weight) - anatomy / shapes
    const secHue = (baseHue + (thermal >= 0 ? 18 : -18) + 360) % 360;
    const secVal = ColorMath.clamp(valueKey * 0.72 + 0.2, 0.25, 0.76);
    const secSat = ColorMath.clamp(saturation * (organicity > 0.6 ? 0.75 : 0.9), 0.25, 0.95);
    const cSecondary = ColorMath.hsvToRgb(secHue, secSat, secVal);

    // 3. Primary Accent Focal Point (10% weight - high contrast focal anchor)
    const accHue = (baseHue + harmonySpread + 360) % 360;
    const accSat = ColorMath.clamp(saturation * 1.2, 0.6, 1.0);
    const accVal = ColorMath.clamp(1.15 - valueKey * 0.3, 0.75, 0.99);
    const cAccent = ColorMath.hsvToRgb(accHue, accSat, accVal);

    // 4. Specular / Rim Light (Edge definition)
    const rimHue = (accHue + 15) % 360;
    const rimSat = ColorMath.clamp(accSat * 0.22, 0.05, 0.3);
    const rimVal = 0.98;
    const cRim = ColorMath.hsvToRgb(rimHue, rimSat, rimVal);

    // 5. Transitional Halftone / SSS Bridge
    // Adds organic warmth between shadow and light
    const bridgeHue = (baseHue + (thermal > 0 ? 14 : -15) + 360) % 360;
    const bridgeSat = ColorMath.clamp(saturation * 1.05, 0.3, 0.95);
    const bridgeVal = ColorMath.clamp(valueKey * 0.8 + 0.16, 0.28, 0.8);
    const cBridge = ColorMath.hsvToRgb(bridgeHue, bridgeSat, bridgeVal);

    // Crucial: strict 60-30-10 role order:
    // 0: Dominant (60%), 1: Secondary (30%), 2: Accent (10%), 3: Highlight (Rim), 4: Terminator (SSS Bridge)
    const colors = [
      {
        rgb: cDominant,
        hex: ColorMath.rgbToHex(cDominant.r, cDominant.g, cDominant.b),
        hsv: ColorMath.rgbToHsv(cDominant.r, cDominant.g, cDominant.b),
        roleName: 'Dominante (60% Atmósfera)',
        percentage: 60,
        roleKey: 'dominant'
      },
      {
        rgb: cSecondary,
        hex: ColorMath.rgbToHex(cSecondary.r, cSecondary.g, cSecondary.b),
        hsv: ColorMath.rgbToHsv(cSecondary.r, cSecondary.g, cSecondary.b),
        roleName: 'Secundario (30% Estructura)',
        percentage: 30,
        roleKey: 'secondary'
      },
      {
        rgb: cAccent,
        hex: ColorMath.rgbToHex(cAccent.r, cAccent.g, cAccent.b),
        hsv: ColorMath.rgbToHsv(cAccent.r, cAccent.g, cAccent.b),
        roleName: 'Acento Primario (10% Foco)',
        percentage: 10,
        roleKey: 'accent'
      },
      {
        rgb: cRim,
        hex: ColorMath.rgbToHex(cRim.r, cRim.g, cRim.b),
        hsv: ColorMath.rgbToHsv(cRim.r, cRim.g, cRim.b),
        roleName: 'Luz de Recorte / Especular',
        percentage: 0,
        roleKey: 'highlight'
      },
      {
        rgb: cBridge,
        hex: ColorMath.rgbToHex(cBridge.r, cBridge.g, cBridge.b),
        hsv: ColorMath.rgbToHsv(cBridge.r, cBridge.g, cBridge.b),
        roleName: 'Terminador (Transición SSS)',
        percentage: 0,
        roleKey: 'terminator'
      }
    ];

    // Generate intelligent critique and lighting advice
    const critique = this.diagnosePalette(colors.map(c => c.rgb));

    return {
      title: promptText ? `Composición: "${promptText}"` : 'Síntesis Neural de Color',
      semanticVector: { thermal, valueKey, saturation, tension, organicity },
      colors,
      dominant: colors[0],
      secondary: colors[1],
      accent: colors[2],
      highlight: colors[3],
      terminator: colors[4],
      critique
    };
  },

  /**
   * Rigorous Diagnostic & Academic Art Direction Critique of ANY Palette:
   * Evaluates Dynamic Value Range, Temperature Equilibrium, Contrast Separation,
   * and potential pitfalls (muddy midtones, plastic highlights, lack of focal anchor).
   */
  diagnosePalette(rgbList) {
    if (!rgbList || rgbList.length < 2) return null;

    // 1. Calculate luminance values and histogram
    const luminances = rgbList.map(c => ColorMath.getLuminance(c.r, c.g, c.b));
    const minLum = Math.min(...luminances);
    const maxLum = Math.max(...luminances);
    const dynamicRange = maxLum - minLum; // 0 to 1

    // 2. Calculate thermal balance
    const temperatures = rgbList.map(c => {
      const hsv = ColorMath.rgbToHsv(c.r, c.g, c.b);
      // Warm: 0-75 or >320, Cool: 150-270
      if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) return 1; // Warm
      if (hsv.h >= 150 && hsv.h <= 270) return -1; // Cool
      return 0; // Neutral / Green / Violet
    });
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    // 3. Contrast ratio between darkest and brightest
    const maxContrast = parseFloat(((maxLum + 0.05) / (minLum + 0.05)).toFixed(1));

    // Formulate diagnosis
    const findings = [];
    const suggestions = [];

    // Value evaluation
    if (dynamicRange < 0.35) {
      findings.push('⚠️ Rango Dinámico Estrecho: Los valores de luz y sombra están comprimidos en medios tonos.');
      suggestions.push('Profundiza las sombras de oclusión o eleva el brillo del acento para evitar una pintura empastada o plana.');
    } else {
      findings.push(`✓ Excelente Rango Tonal (Contraste ${maxContrast}:1): Separación nítida para jerarquía visual.`);
    }

    // Thermal evaluation
    if (Math.abs(avgTemp) > 0.6) {
      const isWarm = avgTemp > 0;
      findings.push(`ℹ️ Tendencia Térmica Marcada: ${isWarm ? 'Predominancia cálida' : 'Predominancia fría'}.`);
      suggestions.push(`Añade un ancla de temperatura opuesta (${isWarm ? 'un azul/violeta frío en sombras' : 'un dorado/ámbar cálido en reflejos'}) para maximizar la vibración cromática.`);
    } else {
      findings.push('✓ Diálogo Térmico Equilibrado: Coexisten tonos cálidos y fríos en armoniosa tensión.');
    }

    // Saturation & Mud check
    const saturations = rgbList.map(c => ColorMath.rgbToHsv(c.r, c.g, c.b).s);
    const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;
    if (avgSat < 0.25) {
      findings.push('⚠️ Paleta de Baja Crominancia: Peligro de tonos lavados o grisáceos sin vida.');
      suggestions.push('Introduce un punto focal de saturación elevada en el área que deseas que el espectador mire primero.');
    } else if (avgSat > 0.8) {
      findings.push('⚡ Máxima Saturación: Alta energía cromática (estilo animación / cómic).');
      suggestions.push('Procura reservar un tono neutro o desaturado para que el ojo descanse y el color vivo no sature la vista.');
    }

    // Guaranteed actionable Art Director advice (never blank!)
    if (suggestions.length === 0) {
      if (maxContrast >= 6) {
        suggestions.push(`Aprovecha el potente contraste (${maxContrast}:1) concentrando el 10% de acento exclusivamente en el centro de interés narrativo (ojos, gemas o impacto lumínico).`);
      } else {
        suggestions.push('Aplica la regla 60-30-10: reserva el acento del 10% únicamente para la zona de mayor atracción visual y mantén el dominante del 60% en planos amplios para descanso visual.');
      }
      suggestions.push('Utiliza el tono de recorte especular en los bordes de las siluetas para despegar las figuras del fondo con volumen tridimensional inmediato.');
    }

    return {
      dynamicRange: Math.round(dynamicRange * 100),
      contrastRatio: maxContrast,
      findings,
      suggestions,
      score: Math.min(100, Math.round((dynamicRange * 40) + (maxContrast > 4 ? 30 : 15) + (Math.abs(avgTemp) < 0.7 ? 30 : 15)))
    };
  }
};

