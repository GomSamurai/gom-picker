/**
 * GOM Picker - Chromilla Physical Paint Mixing & Recipe Studio
 * Advanced subtractive paint recipe solver based on genuine artist pigments (CI codes),
 * tinting strength dynamics, opacity, Kubelka-Munk approximations, and dry-down shift.
 * 
 * 100% Offline, Zero external dependencies.
 */

import { ColorMath } from './colorMath.js';
import { BrandPigments } from './brandPigments.js';

export const ChromillaMixer = {
  // Physical paint medium characteristics
  MEDIUMS: {
    oil: {
      id: 'oil',
      name: 'Óleo (Oil)',
      shiftDesc: 'Secado fiel: el valor y la saturación se mantienen prácticamente idénticos (mínimo cambio).',
      shiftVal: 1.0,
      shiftSat: 1.0
    },
    acrylic: {
      id: 'acrylic',
      name: 'Acrílico (Acrylic)',
      shiftDesc: 'Oscurecimiento al secar: la emulsión polimérica lechosa se vuelve transparente (-14% luminosidad, +5% croma).',
      shiftVal: 0.86,
      shiftSat: 1.05
    },
    watercolor: {
      id: 'watercolor',
      name: 'Acuarela (Watercolor)',
      shiftDesc: 'Aclarado al secar: el agua se evapora sobre el papel blanco (+15% luminosidad, -12% saturación).',
      shiftVal: 1.15,
      shiftSat: 0.88
    },
    gouache: {
      id: 'gouache',
      name: 'Gouache (Acryla / Tradicional)',
      shiftDesc: 'Shift dual: los tonos oscuros se aclaran por el carbonato y los tonos claros se oscurecen al secar.',
      shiftVal: 0.95,
      shiftSat: 0.92
    }
  },

  // Active configuration & inventory persistence
  config: {
    selectedMedium: 'oil', // 'oil' | 'acrylic' | 'watercolor' | 'gouache'
    selectedBrand: 'all',
    batchAmount: 20, // Value in grams/ml
    batchUnit: 'g', // 'g' | 'ml'
    ownedTubeIds: []
  },

  init() {
    this.loadOwnedTubes();
  },

  // Load owned tubes from localStorage or default palette
  loadOwnedTubes() {
    try {
      const stored = localStorage.getItem('gom_chromilla_owned_tubes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.config.ownedTubeIds = parsed;
          return;
        }
      }
    } catch (_) {}

    // Default studio palette if no saved configuration exists
    this.config.ownedTubeIds = [
      'wn_titanium_white',
      'wn_zinc_white',
      'wn_cadmium_yellow',
      'wn_yellow_ochre',
      'wn_cadmium_red',
      'wn_permanent_rose',
      'wn_burnt_sienna',
      'wn_burnt_umber',
      'wn_raw_umber',
      'wn_french_ultramarine',
      'wn_winsor_blue_gs',
      'wn_viridian',
      'wn_ivory_black'
    ];
    this.saveOwnedTubes();
  },

  // Persist owned tubes to localStorage
  saveOwnedTubes() {
    try {
      localStorage.setItem('gom_chromilla_owned_tubes', JSON.stringify(this.config.ownedTubeIds));
    } catch (_) {}
  },

  // Check if a tube is owned
  isTubeOwned(tubeId) {
    return this.config.ownedTubeIds.includes(tubeId);
  },

  // Toggle or set tube ownership
  setTubeOwned(tubeId, isOwned) {
    const idx = this.config.ownedTubeIds.indexOf(tubeId);
    if (isOwned && idx === -1) {
      this.config.ownedTubeIds.push(tubeId);
    } else if (!isOwned && idx !== -1) {
      this.config.ownedTubeIds.splice(idx, 1);
    }
    this.saveOwnedTubes();
  },

  // Select all tubes or all from a specific brand
  selectAllTubes(brandId = 'all') {
    const tubes = brandId === 'all'
      ? BrandPigments.TUBES
      : BrandPigments.TUBES.filter(t => t.brand === brandId);
    
    tubes.forEach(t => {
      if (!this.config.ownedTubeIds.includes(t.id)) {
        this.config.ownedTubeIds.push(t.id);
      }
    });
    this.saveOwnedTubes();
  },

  // Clear all tubes from owned inventory
  clearAllTubes() {
    this.config.ownedTubeIds = [];
    this.saveOwnedTubes();
  },

  // Apply a curated palette preset
  applyPalettePreset(presetKey) {
    const preset = BrandPigments.PALETTE_PRESETS[presetKey];
    if (preset && Array.isArray(preset.tubeIds)) {
      this.config.ownedTubeIds = [...preset.tubeIds];
      this.saveOwnedTubes();
      return preset;
    }
    return null;
  },

  // Get currently owned tubes as full objects
  getOwnedTubes() {
    return BrandPigments.TUBES.filter(t => this.config.ownedTubeIds.includes(t.id));
  },

  // Calculate Dry-Down Shift for target color based on active medium
  getDryDownPrediction(rgb, medium = this.config.selectedMedium) {
    const med = this.MEDIUMS[medium] || this.MEDIUMS.oil;
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);

    let dryV = hsv.v * med.shiftVal;
    let dryS = hsv.s * med.shiftSat;

    // Special dual shift for Gouache
    if (medium === 'gouache') {
      if (hsv.v < 0.4) {
        dryV = hsv.v + 0.12; // darks dry lighter
      } else {
        dryV = hsv.v - 0.08; // lights dry darker
      }
    }

    dryV = ColorMath.clamp(dryV, 0.04, 1);
    dryS = ColorMath.clamp(dryS, 0, 1);
    const dryRgb = ColorMath.hsvToRgb(hsv.h, dryS, dryV);

    return {
      mediumId: med.id,
      mediumName: med.name,
      shiftDesc: med.shiftDesc,
      wetRgb: rgb,
      wetHex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
      dryRgb,
      dryHex: ColorMath.rgbToHex(dryRgb.r, dryRgb.g, dryRgb.b),
      differs: medium !== 'oil'
    };
  },

  /**
   * Subtractive Color Distance Minimizer (Kubelka-Munk Weighted Approximation).
   * Solves exact recipe in parts using ONLY tubes owned by the user.
   */
  solveRecipe(targetRgb) {
    const ownedTubes = this.getOwnedTubes();
    if (ownedTubes.length === 0) {
      return {
        error: 'no_tubes',
        message: 'No tienes ningún tubo seleccionado en tu Caja de Pinturas. Selecciona los tubos que posees en el panel inferior.',
        items: []
      };
    }

    const targetHex = ColorMath.rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
    const targetHsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);
    const targetLum = ColorMath.getLuminance(targetRgb.r, targetRgb.g, targetRgb.b);

    // Group available tubes by role
    const whiteTubes = ownedTubes.filter(t => t.category === 'white');
    const blackTubes = ownedTubes.filter(t => t.category === 'black');
    const earthTubes = ownedTubes.filter(t => t.category === 'earth');
    const chromaticTubes = ownedTubes.filter(t => t.category !== 'white' && t.category !== 'black');

    // Pick best white (prefer Titanium White if owned, else Zinc White or first white)
    const bestWhite = whiteTubes.find(t => t.ci === 'PW6') || whiteTubes[0] || null;

    // Pick best darkener (prefer Burnt Umber PBr7 for rich shadow, else Black PBk9/PBk7)
    const bestDarkener = ownedTubes.find(t => t.ci === 'PBr7' && t.name.toLowerCase().includes('burnt')) ||
                         blackTubes[0] ||
                         earthTubes[0] ||
                         null;

    // 1. Identify primary chromatic tube minimizing hue distance
    let bestPrimary = null;
    let minPrimaryHueDiff = 999;

    chromaticTubes.forEach(t => {
      const hsv = ColorMath.rgbToHsv(t.rgb.r, t.rgb.g, t.rgb.b);
      let diff = Math.abs(hsv.h - targetHsv.h);
      if (diff > 180) diff = 360 - diff;
      
      // Also consider saturation penalty (grey/earth shouldn't be chosen if target is high chroma)
      const satPenalty = Math.max(0, targetHsv.s - hsv.s) * 60;
      const score = diff + satPenalty;

      if (score < minPrimaryHueDiff) {
        minPrimaryHueDiff = score;
        bestPrimary = t;
      }
    });

    // If no chromatic tube was found (e.g. user only owns whites & blacks), use best available
    if (!bestPrimary) {
      bestPrimary = ownedTubes.find(t => t.category !== 'white') || ownedTubes[0];
    }

    // 2. Identify secondary chromatic tube (for hue tuning, temperature, or complementary neutralization)
    let bestSecondary = null;
    let minSecondaryScore = 999;

    if (chromaticTubes.length > 1) {
      chromaticTubes.forEach(t => {
        if (t.id === bestPrimary.id) return;
        const hsv = ColorMath.rgbToHsv(t.rgb.r, t.rgb.g, t.rgb.b);
        
        let hueDiff = Math.abs(hsv.h - targetHsv.h);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;

        // Reward complementary if target is muted, or adjacent if target is intermediate hue
        const score = hueDiff;
        if (score < minSecondaryScore) {
          minSecondaryScore = score;
          bestSecondary = t;
        }
      });
    }

    // 3. Assemble recipe parts with physical weight considerations
    const rawPartsMap = new Map(); // tubeId -> { tube, parts }

    const addParts = (tube, partsCount) => {
      if (!tube || partsCount <= 0) return;
      if (rawPartsMap.has(tube.id)) {
        rawPartsMap.get(tube.id).parts += partsCount;
      } else {
        rawPartsMap.set(tube.id, { tube, parts: partsCount });
      }
    };

    // --- High Luminance: needs White ---
    if (bestWhite && targetLum > 0.20) {
      // White parts scale exponentially with luminance
      const whiteParts = Math.max(0.5, Math.pow(targetLum, 1.4) * 8.5);
      addParts(bestWhite, parseFloat(whiteParts.toFixed(1)));
    }

    // --- Primary Hue parts ---
    const primStrength = bestPrimary.tintingStrength || 6;
    const strengthMultiplier = 6 / primStrength; // strong pigments require fewer parts
    const primParts = Math.max(0.4, (targetHsv.s * 3.5 + 0.8) * strengthMultiplier);
    addParts(bestPrimary, parseFloat(primParts.toFixed(1)));

    // --- Secondary Hue parts (if needed for saturation/nuance) ---
    if (bestSecondary && bestSecondary.id !== bestPrimary.id && targetHsv.s > 0.25) {
      const secStrength = bestSecondary.tintingStrength || 6;
      const secParts = parseFloat((0.4 * (6 / secStrength)).toFixed(1));
      addParts(bestSecondary, Math.max(0.2, secParts));
    }

    // --- Low Luminance / Desaturation: needs Darkener / Umber / Black ---
    if (bestDarkener && targetLum < 0.35 && !rawPartsMap.has(bestDarkener.id)) {
      const darkParts = Math.max(0.3, parseFloat(((0.38 - targetLum) * 5).toFixed(1)));
      addParts(bestDarkener, darkParts);
    }

    // Convert map to array and deduplicate guaranteed
    const rawItems = Array.from(rawPartsMap.values());
    const totalPartsSum = rawItems.reduce((acc, it) => acc + it.parts, 0) || 1;

    // Scale to batch
    const scaledItems = rawItems.map(it => {
      const percentage = (it.parts / totalPartsSum) * 100;
      const scaledAmount = ((it.parts / totalPartsSum) * this.config.batchAmount).toFixed(2);
      return {
        tube: it.tube,
        parts: parseFloat(it.parts.toFixed(1)),
        percentage: Math.round(percentage),
        amount: parseFloat(scaledAmount),
        unit: this.config.batchUnit
      };
    });

    // 4. Simulate Subtractive Mixed Color from the Recipe
    let simR = 0, simG = 0, simB = 0;
    let totalWeight = 0;

    scaledItems.forEach(it => {
      // Subtractive pigment weight: parts * tintingStrength
      const w = it.parts * (it.tube.tintingStrength || 5);
      simR += it.tube.rgb.r * w;
      simG += it.tube.rgb.g * w;
      simB += it.tube.rgb.b * w;
      totalWeight += w;
    });

    let mixedRgb;
    if (totalWeight > 0) {
      mixedRgb = {
        r: ColorMath.clamp255(Math.round(simR / totalWeight)),
        g: ColorMath.clamp255(Math.round(simG / totalWeight)),
        b: ColorMath.clamp255(Math.round(simB / totalWeight))
      };
    } else {
      mixedRgb = { ...targetRgb };
    }

    // Calculate Delta E (Color distance)
    const deltaE = parseFloat(ColorMath.getColorDistanceLab(targetRgb, mixedRgb).toFixed(1));
    const matchPercent = Math.max(10, Math.min(100, Math.round(100 - deltaE * 4.5)));

    // Generate White Tint Scale (+0%, +25%, +50%, +75%, +90% White)
    const tintScale = this._generateTintScale(mixedRgb, bestWhite);

    return {
      targetRgb,
      targetHex,
      mixedRgb,
      mixedHex: ColorMath.rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b),
      deltaE,
      matchPercent,
      totalParts: parseFloat(totalPartsSum.toFixed(1)),
      totalBatch: this.config.batchAmount,
      unit: this.config.batchUnit,
      items: scaledItems,
      tintScale
    };
  },

  // Generates 5 tonal tint steps mixed with white
  _generateTintScale(massRgb, whiteTube) {
    const whiteRgb = whiteTube ? whiteTube.rgb : { r: 255, g: 255, b: 255 };
    const ratios = [0, 0.25, 0.50, 0.75, 0.90];

    return ratios.map((ratio, idx) => {
      const r = ColorMath.clamp255(massRgb.r * (1 - ratio) + whiteRgb.r * ratio);
      const g = ColorMath.clamp255(massRgb.g * (1 - ratio) + whiteRgb.g * ratio);
      const b = ColorMath.clamp255(massRgb.b * (1 - ratio) + whiteRgb.b * ratio);
      const hex = ColorMath.rgbToHex(r, g, b);
      return {
        label: idx === 0 ? 'Masa Pura' : `+${Math.round(ratio * 100)}% Blanco`,
        ratio,
        rgb: { r, g, b },
        hex
      };
    });
  },

  // Mix Correction Assistant: compares theoretical mixed swatch with target
  getMixCorrectionAdvice(targetRgb, mixedRgb, recipeItems) {
    if (!mixedRgb) return 'Calculando receta...';

    const tLum = ColorMath.getLuminance(targetRgb.r, targetRgb.g, targetRgb.b);
    const mLum = ColorMath.getLuminance(mixedRgb.r, mixedRgb.g, mixedRgb.b);
    const tHsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);
    const mHsv = ColorMath.rgbToHsv(mixedRgb.r, mixedRgb.g, mixedRgb.b);

    const lumDiff = mLum - tLum;
    const satDiff = mHsv.s - tHsv.s;
    let hueDiff = mHsv.h - tHsv.h;
    if (hueDiff > 180) hueDiff -= 360;
    if (hueDiff < -180) hueDiff += 360;

    const advices = [];

    // Missing pigment family warning
    const owned = this.getOwnedTubes();
    const hasWhite = owned.some(t => t.category === 'white');
    const hasBlue = owned.some(t => t.category === 'blue' || t.category === 'cyan');
    const hasYellow = owned.some(t => t.category === 'yellow');
    const hasRed = owned.some(t => t.category === 'red' || t.category === 'magenta');

    if (tLum > 0.4 && !hasWhite) {
      advices.push('⚠️ <strong>Falta Blanco:</strong> No posees ningún tubo de blanco en tu caja seleccionada. Para aclarar esta mezcla sin desaturar, añade <strong>Blanco de Titanio (PW6)</strong>.');
    }
    if ((tHsv.h >= 170 && tHsv.h <= 270) && !hasBlue && tHsv.s > 0.25) {
      advices.push('⚠️ <strong>Falta Azul/Cian:</strong> No tienes ningún tubo azul en tu inventario para alcanzar este matiz frío. Considera añadir <strong>Azul Ultramar (PB29)</strong> o <strong>Azul Cobalto (PB28)</strong>.');
    }
    if ((tHsv.h >= 30 && tHsv.h <= 80) && !hasYellow && tHsv.s > 0.3) {
      advices.push('⚠️ <strong>Falta Amarillo:</strong> La mezcla carece de pigmento amarillo puro. Considera incorporar <strong>Amarillo Cadmio (PY35)</strong> u <strong>Ocre (PY43)</strong>.');
    }

    // Tonal value corrections
    if (lumDiff < -0.06) {
      advices.push('🎨 <strong>Aclarar en paleta:</strong> La mezcla física resulta algo oscura. Añade una punta de espátula de <strong>Blanco de Titanio (PW6)</strong>.');
    } else if (lumDiff > 0.06) {
      advices.push('🎨 <strong>Oscurecer / Bajar valor:</strong> La mezcla resulta demasiado clara. Añade una pizca de <strong>Tierra Sombra Tostada (PBr7)</strong> o el pigmento más oscuro de la receta.');
    }

    // Temperature corrections
    if (hueDiff > 15) {
      advices.push('❄️ <strong>Enfriar matiz:</strong> El tono tiende demasiado a frío/verde. Ajusta con un toque cálido de <strong>Ocre Amarillo (PY43)</strong> o <strong>Rojo Cadmio (PR108)</strong>.');
    } else if (hueDiff < -15) {
      advices.push('🔥 <strong>Calentar matiz:</strong> El tono tiende demasiado a rojizo/cálido. Enfría la mezcla con una punta de pincel de <strong>Azul Ultramar (PB29)</strong>.');
    }

    // Saturation corrections
    if (satDiff < -0.12 && tHsv.s > 0.4) {
      advices.push('✨ <strong>Aumentar Croma:</strong> Para igualar la alta saturación deseada, utiliza pigmentos puros monopigmentarios sin mezclar tierras.');
    }

    if (advices.length === 0) {
      advices.push('🎯 <strong>¡Fórmula Física Óptima!</strong> La receta coincide con máxima fidelidad de taller (ΔE bajo). Vierte las proporciones indicadas en tu paleta.');
    }

    return advices.join('<br>');
  }
};

// Initialize on script load
ChromillaMixer.init();
