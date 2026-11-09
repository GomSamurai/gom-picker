/**
 * GOM Picker - Multi-Library Harmonizer Studio & Cross-Collection Fusion Engine
 * Sincronización armónica cruzada, veladuras comunes, proyección de gama y fusión de colecciones.
 * 
 * Permite seleccionar cualquier número de bibliotecas de color simultáneamente
 * (de usuario, maestros históricos, catálogos Copic/Pantone, o tubos de taller),
 * evaluar su dispersión en el radar polar, armonizar sus muestras mediante múltiples
 * estrategias matemáticas y físicas, y generar nuevas bibliotecas comunes fusionadas,
 * actualizar colecciones en lote o extraer paletas de consenso y acentos.
 * 
 * 100% Offline, Zero dependencias externas.
 */

import { ColorMath } from './colorMath.js';
import { BrandPigments } from './brandPigments.js';
import { PaletteCatalogs } from './paletteCatalogs.js';
import { MASTER_PALETTES } from './masterPalettes.js';
import { PaletteStudioEngine } from './paletteStudio.js';
import { SwatchSheetExporter } from './swatchSheetExporter.js';

export const LibraryHarmonizerEngine = {
  app: null,
  isInitialized: false,

  // Selected libraries active in the harmonization deck
  // Each item: { id, source, name, category, weight, enabled, swatches: [...] }
  deck: [],

  // Current harmonization strategy:
  // 'glaze' | 'gamut' | 'anchor' | 'oklch' | 'pigment' | 'temperature' | 'hierarchy'
  activeStrategy: 'glaze',

  // Strategy parameters
  params: {
    glaze: {
      color: '#F59E0B',
      rgb: { r: 245, g: 158, b: 11 },
      intensity: 0.35,
      blendMode: 'soft_light', // 'soft_light' | 'multiply' | 'overlay' | 'color' | 'screen' | 'kubelka_munk'
      target: 'all',           // 'all' | 'highlights' | 'shadows' | 'split'
      secondaryColor: '#38BDF8',
      secondaryRgb: { r: 56, g: 189, b: 248 }
    },
    gamut: {
      shape: 'triangle',       // 'triangle' | 'diamond' | 'slit' | 'sector' | 'ellipse'
      angle: 45,
      scale: 0.65,
      centerOffset: 0.15,
      mode: 'soft_attract'     // 'soft_attract' | 'strict_clamp'
    },
    anchor: {
      anchorMode: 'hero_fg',   // 'hero_fg' | 'first_swatch' | 'pool_average' | 'custom'
      customColor: '#6366F1',
      customRgb: { r: 99, g: 102, b: 241 },
      chord: 'analogous',      // 'analogous' | 'split_complementary' | 'triadic' | 'tetradic' | 'monochrome'
      strength: 0.60
    },
    oklch: {
      minL: 0.18,
      maxL: 0.92,
      curve: 's_curve',        // 'linear' | 's_curve' | 'golden_ratio' | 'farges_ladder'
      maxChroma: 0.22,
      clampCmyk: false
    },
    pigment: {
      tubeId: 'py43_ochre',
      ratio: 0.20,
      medium: 'oil'
    },
    temperature: {
      kelvinShift: 1500,       // -4000 to +4000
      polarity: 'warm_light_cool_shadow' // 'warm_light_cool_shadow' | 'cool_light_warm_shadow'
    },
    hierarchy: {
      baseRatio: 60,
      secondaryRatio: 30,
      accentRatio: 10,
      boostContrast: true
    }
  },

  // Color palette presets for glazes
  GLAZE_PRESETS: [
    { name: 'Luz Dorada 2800K', hex: '#F59E0B', desc: 'Atardecer cálido solar' },
    { name: 'Cielo Azul 9500K', hex: '#38BDF8', desc: 'Domo celeste y sombras frías' },
    { name: 'Crepúsculo Añil', hex: '#6366F1', desc: 'Misterio nocturno equilibrado' },
    { name: 'Bruma Nórdica', hex: '#94A3B8', desc: 'Niebla fría y desaturación suave' },
    { name: 'Bosque Esmeralda', hex: '#10B981', desc: 'Atmósfera botánica vegetal' },
    { name: 'Cyberpunk Neón', hex: '#EC4899', desc: 'Magenta sintético de alto impacto' },
    { name: 'Sepia Vintage', hex: '#B45309', desc: 'Tinte clásico de grabado antiguo' },
    { name: 'Cuarzo Rosa', hex: '#FB7185', desc: 'Suavidad pastel floral' }
  ],

  // Real artist tubes for subtractive binding
  BINDING_TUBES: [
    { id: 'py43_ochre', name: 'Ocre Amarillo (PY43)', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
    { id: 'pbr7_burnt_umber', name: 'Tierra Siena Tostada (PBr7)', ci: 'PBr7', hex: '#7A3816', rgb: { r: 122, g: 56, b: 22 } },
    { id: 'pw6_titanium', name: 'Blanco Titanio (PW6)', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
    { id: 'pb29_ultramarine', name: 'Azul Ultramar Francés (PB29)', ci: 'PB29', hex: '#1C2E8A', rgb: { r: 28, g: 46, b: 138 } },
    { id: 'pbk9_ivory_black', name: 'Negro Marfil / Hueso (PBk9)', ci: 'PBk9', hex: '#1C1B1A', rgb: { r: 28, g: 27, b: 26 } },
    { id: 'pr102_venetian_red', name: 'Rojo Veneciano / Sinopia (PR102)', ci: 'PR102', hex: '#A93226', rgb: { r: 169, g: 50, b: 38 } },
    { id: 'pg7_phthalo_green', name: 'Verde Ftalo Esmeralda (PG7)', ci: 'PG7', hex: '#0B6623', rgb: { r: 11, g: 102, b: 35 } }
  ],

  // Distinct chromatic badges for libraries in the radar and deck
  LIBRARY_BADGE_COLORS: [
    '#6366F1', '#EC4899', '#06B6D4', '#10B981', '#F59E0B',
    '#8B5CF6', '#F43F5E', '#14B8A6', '#EAB308', '#3B82F6'
  ],

  // Cached computed harmonization results
  results: {
    swatches: [], // Array of all processed swatches
    cohesionBefore: 0,
    cohesionAfter: 0,
    gradeBefore: 'C',
    gradeAfter: 'S+',
    diagnostics: [],
    consensusPalette: [],
    accentRecommendations: [],
    gamutHullBefore: [],
    gamutHullAfter: []
  },

  // Hovered item on radar
  hoveredRadarPoint: null,

  // Drawer state
  isDrawerOpen: false,
  drawerFilter: 'all', // 'all' | 'user' | 'masters' | 'atelier' | 'catalogs'
  drawerSearch: '',

  // Active view filter in comparison list: 'all' | libraryId
  activeComparisonView: 'all',

  init(appInstance) {
    if (this.isInitialized) return;
    this.app = appInstance;
    this.isInitialized = true;

    // Load initial demo deck if empty
    this._loadInitialDeck();

    // Bind all UI controls
    this._bindDOMEvents();

    // Compute initial harmonization
    this.computeHarmonization();

    console.log('[LibraryHarmonizer] Motor de armonización inter-bibliotecas inicializado con éxito.');
  },

  _loadInitialDeck() {
    // Look for existing saved user palettes, or fallback to Monet + Zorn Classic Duo
    const userPalettes = this.app.swatchManager?.palettes || [];
    
    if (userPalettes.length >= 2) {
      // Pick first two user palettes
      this.addLibraryToDeck({
        id: userPalettes[0].id,
        source: 'user',
        name: userPalettes[0].name,
        category: 'Mi Paleta',
        colors: userPalettes[0].colors
      });
      this.addLibraryToDeck({
        id: userPalettes[1].id,
        source: 'user',
        name: userPalettes[1].name,
        category: 'Mi Paleta',
        colors: userPalettes[1].colors
      });
    } else {
      // Demo preset: Zorn Palette + Monet Waterlilies
      this.addLibraryToDeck({
        id: 'zorn_atelier_demo',
        source: 'atelier',
        name: 'Paleta Zorn (4 Tubos Canónicos)',
        category: 'Taller Clásico',
        colors: ['#FFFFFF', '#C89332', '#E32636', '#1C1B1A']
      });

      const monet = MASTER_PALETTES.find(p => p.id === 'monet_waterlilies') || MASTER_PALETTES[0];
      if (monet) {
        this.addLibraryToDeck({
          id: monet.id,
          source: 'masters',
          name: `${monet.title} (${monet.artist})`,
          category: 'Gran Maestro',
          colors: monet.colors.map(c => typeof c === 'string' ? c : c.hex)
        });
      }
    }
  },

  getAllAvailableLibraries() {
    const list = [];

    // 1. User saved palettes
    const userPals = this.app.swatchManager?.palettes || [];
    userPals.forEach(p => {
      list.push({
        id: p.id,
        source: 'user',
        name: p.name,
        category: 'Mis Paletas',
        colors: (p.colors || []).map(c => typeof c === 'string' ? c : c.hex),
        count: (p.colors || []).length
      });
    });

    // 2. Master Painters palettes
    MASTER_PALETTES.forEach(m => {
      list.push({
        id: m.id,
        source: 'masters',
        name: `${m.title} — ${m.artist}`,
        category: 'Grandes Maestros',
        colors: (m.colors || []).map(c => typeof c === 'string' ? c : c.hex),
        count: (m.colors || []).length
      });
    });

    // 3. Classic Atelier Palettes
    if (PaletteStudioEngine && PaletteStudioEngine.MASTER_PALETTES) {
      PaletteStudioEngine.MASTER_PALETTES.forEach(a => {
        list.push({
          id: 'atelier_' + a.id,
          source: 'atelier',
          name: a.name,
          category: 'Taller Clásico',
          colors: (a.tubes || []).map(t => t.hex),
          count: (a.tubes || []).length
        });
      });
    }

    // 4. Copic & Pantone Catalogs
    if (PaletteCatalogs && PaletteCatalogs.DEFAULT_LIBRARIES) {
      PaletteCatalogs.DEFAULT_LIBRARIES.forEach(cat => {
        list.push({
          id: 'catalog_' + cat.id,
          source: 'catalogs',
          name: cat.name,
          category: 'Copic & Pantone',
          colors: (cat.colors || []).slice(0, 16).map(c => c.hex),
          count: (cat.colors || []).length
        });
      });
    }

    return list;
  },

  addLibraryToDeck(libData) {
    if (this.deck.some(d => d.id === libData.id)) {
      this.app.showToast?.(`La biblioteca "${libData.name}" ya está en el muelle activo.`);
      return;
    }

    const colorList = libData.colors || [];
    const swatches = colorList.map((c, i) => {
      const hex = typeof c === 'string' ? c : (c.hex || '#888888');
      const rgb = ColorMath.hexToRgb(hex);
      return {
        id: `sw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        originalHex: hex,
        originalRgb: rgb,
        harmonizedHex: hex,
        harmonizedRgb: { ...rgb },
        name: typeof c === 'object' && c.name ? c.name : `Muestra ${i + 1}`,
        locked: false,   // Pin: if true, will NOT be shifted by harmonization
        included: true, // Checkbox: if true, included in final output
        deltaE: 0,
        role: 'base'
      };
    });

    const badgeIndex = this.deck.length % this.LIBRARY_BADGE_COLORS.length;
    const badgeColor = this.LIBRARY_BADGE_COLORS[badgeIndex];

    const deckItem = {
      id: libData.id,
      source: libData.source || 'user',
      name: libData.name || 'Biblioteca sin nombre',
      category: libData.category || 'General',
      badgeColor,
      weight: 1.0,     // 0.2 to 2.0
      enabled: true,
      swatches
    };

    this.deck.push(deckItem);
    this.computeHarmonization();
    this.render();
    this.app.showToast?.(`"${deckItem.name}" añadida al muelle de armonización.`);
  },

  removeLibraryFromDeck(libId) {
    this.deck = this.deck.filter(d => d.id !== libId);
    this.computeHarmonization();
    this.render();
  },

  clearDeck() {
    this.deck = [];
    this.computeHarmonization();
    this.render();
  },

  setLibraryWeight(libId, weight) {
    const item = this.deck.find(d => d.id === libId);
    if (item) {
      item.weight = Math.max(0.2, Math.min(2.0, parseFloat(weight) || 1.0));
      this.computeHarmonization();
      this.renderPreviewOnly();
    }
  },

  toggleLibraryEnabled(libId, enabled) {
    const item = this.deck.find(d => d.id === libId);
    if (item) {
      item.enabled = !!enabled;
      this.computeHarmonization();
      this.render();
    }
  },

  toggleSwatchLocked(libId, swatchId) {
    const lib = this.deck.find(d => d.id === libId);
    if (!lib) return;
    const sw = lib.swatches.find(s => s.id === swatchId);
    if (sw) {
      sw.locked = !sw.locked;
      this.computeHarmonization();
      this.render();
      this.app.showToast?.(sw.locked ? `Muestra ${sw.originalHex} fijada como inmutable 📌` : `Muestra liberada para armonización`);
    }
  },

  toggleSwatchIncluded(libId, swatchId) {
    const lib = this.deck.find(d => d.id === libId);
    if (!lib) return;
    const sw = lib.swatches.find(s => s.id === swatchId);
    if (sw) {
      sw.included = !sw.included;
      this.computeHarmonization();
      this.renderPreviewOnly();
    }
  },

  setStrategy(strategyKey) {
    if (this.params[strategyKey]) {
      this.activeStrategy = strategyKey;
      this.computeHarmonization();
      this.render();
    }
  },

  updateParam(strategyKey, paramKey, value) {
    if (this.params[strategyKey] && this.params[strategyKey][paramKey] !== undefined) {
      this.params[strategyKey][paramKey] = value;
      this.computeHarmonization();
      this.renderPreviewOnly();
    }
  },

  // -------------------------------------------------------------------------
  // CORE HARMONIZATION LOGIC & ALGORITHMS
  // -------------------------------------------------------------------------

  computeHarmonization() {
    const enabledLibs = this.deck.filter(d => d.enabled);
    if (enabledLibs.length === 0) {
      this.results = {
        swatches: [],
        cohesionBefore: 0,
        cohesionAfter: 0,
        gradeBefore: 'D',
        gradeAfter: 'D',
        diagnostics: ['Añade al menos una biblioteca al muelle para calcular la armonización.'],
        consensusPalette: [],
        accentRecommendations: [],
        gamutHullBefore: [],
        gamutHullAfter: []
      };
      return;
    }

    // 1. Gather all active swatches
    const allSwatches = [];
    enabledLibs.forEach(lib => {
      lib.swatches.forEach(sw => {
        allSwatches.push({
          ...sw,
          libraryId: lib.id,
          libraryName: lib.name,
          libraryWeight: lib.weight,
          badgeColor: lib.badgeColor
        });
      });
    });

    if (allSwatches.length === 0) return;

    // 2. Pre-calculate pool statistics (Anchor hue, luminance center, average chromaticity)
    const oklchListBefore = allSwatches.map(sw => ColorMath.rgbToOklch(sw.originalRgb.r, sw.originalRgb.g, sw.originalRgb.b));
    const avgH_rad = Math.atan2(
      oklchListBefore.reduce((acc, c) => acc + Math.sin(c.h * Math.PI / 180), 0) / oklchListBefore.length,
      oklchListBefore.reduce((acc, c) => acc + Math.cos(c.h * Math.PI / 180), 0) / oklchListBefore.length
    );
    const poolAvgHue = ((avgH_rad * 180 / Math.PI) + 360) % 360;

    // 3. Process each swatch according to active strategy
    const processedSwatches = allSwatches.map(sw => {
      if (sw.locked) {
        // Pinned swatches act as anchors and NEVER change
        return {
          ...sw,
          harmonizedHex: sw.originalHex,
          harmonizedRgb: { ...sw.originalRgb },
          deltaE: 0
        };
      }

      // Compute transformed RGB based on strategy
      const targetRgb = this._applyStrategyTransform(sw.originalRgb, sw.libraryWeight, poolAvgHue);
      const targetHex = ColorMath.rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
      const deltaE = parseFloat(ColorMath.getDeltaE(sw.originalRgb, targetRgb).toFixed(1));

      return {
        ...sw,
        harmonizedHex: targetHex,
        harmonizedRgb: targetRgb,
        deltaE
      };
    });

    // 4. Update internal references on the deck
    this.deck.forEach(lib => {
      lib.swatches.forEach(sw => {
        const found = processedSwatches.find(p => p.id === sw.id);
        if (found) {
          sw.harmonizedHex = found.harmonizedHex;
          sw.harmonizedRgb = found.harmonizedRgb;
          sw.deltaE = found.deltaE;
        }
      });
    });

    // 5. Evaluate Cohesion Metrics (Before vs After)
    const beforeMetrics = this._calculatePoolCohesion(allSwatches.map(s => s.originalRgb));
    const afterMetrics = this._calculatePoolCohesion(processedSwatches.map(s => s.harmonizedRgb));

    // 6. Compute Consensus Palette (K-Means distillation of the harmonized pool)
    const consensusPalette = this._extractConsensusPalette(processedSwatches.filter(s => s.included), 8);

    // 7. Compute Contrapoint Accent Recommendations
    const accentRecommendations = this._generateContrapointAccents(processedSwatches);

    // 8. Compute Gamut Hulls for the Radar
    const gamutHullBefore = this._computeGamutHull(allSwatches.map(s => s.originalRgb));
    const gamutHullAfter = this._computeGamutHull(processedSwatches.map(s => s.harmonizedRgb));

    // Save final results
    this.results = {
      swatches: processedSwatches,
      cohesionBefore: beforeMetrics.score,
      cohesionAfter: afterMetrics.score,
      gradeBefore: beforeMetrics.grade,
      gradeAfter: afterMetrics.grade,
      diagnostics: afterMetrics.diagnostics,
      consensusPalette,
      accentRecommendations,
      gamutHullBefore,
      gamutHullAfter
    };
  },

  _applyStrategyTransform(baseRgb, libWeight, poolAvgHue) {
    const strat = this.activeStrategy;
    const p = this.params[strat];
    const weightFactor = ColorMath.clamp(libWeight, 0.2, 2.0);

    switch (strat) {
      case 'glaze': {
        const intensity = ColorMath.clamp(p.intensity * weightFactor, 0, 1);
        let tintRgb = p.rgb;

        // Split-toning target support
        if (p.target === 'split') {
          const lum = ColorMath.getLuminance(baseRgb.r, baseRgb.g, baseRgb.b);
          tintRgb = lum >= 0.5 ? p.rgb : p.secondaryRgb;
        } else if (p.target === 'highlights') {
          const lum = ColorMath.getLuminance(baseRgb.r, baseRgb.g, baseRgb.b);
          if (lum < 0.45) return { ...baseRgb };
        } else if (p.target === 'shadows') {
          const lum = ColorMath.getLuminance(baseRgb.r, baseRgb.g, baseRgb.b);
          if (lum > 0.55) return { ...baseRgb };
        }

        return this._blendTint(baseRgb, tintRgb, intensity, p.blendMode);
      }

      case 'gamut': {
        const okl = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
        const targetAngle = p.angle;
        let dH = (okl.h - targetAngle) % 360;
        if (dH > 180) dH -= 360;
        if (dH < -180) dH += 360;

        // Scale controls gamut width
        const allowedWidth = Math.max(25, (1 - p.scale) * 180);
        let newH = okl.h;
        let newC = okl.c;

        if (p.mode === 'strict_clamp') {
          if (Math.abs(dH) > allowedWidth) {
            newH = (targetAngle + Math.sign(dH) * allowedWidth + 360) % 360;
            newC = okl.c * p.scale;
          }
        } else {
          // Soft attraction toward gamut center
          const pull = ColorMath.clamp(0.55 * weightFactor, 0.1, 0.95);
          newH = (okl.h - dH * pull + 360) % 360;
          newC = ColorMath.clamp(okl.c * (0.85 + p.scale * 0.2), 0.02, 0.28);
        }

        return ColorMath.oklchToRgb(okl.l, newC, newH);
      }

      case 'anchor': {
        let anchorHue = 0;
        if (p.anchorMode === 'hero_fg' && this.app?.fgColor) {
          const hsv = ColorMath.rgbToHsv(this.app.fgColor.r, this.app.fgColor.g, this.app.fgColor.b);
          anchorHue = hsv.h;
        } else if (p.anchorMode === 'custom') {
          const hsv = ColorMath.rgbToHsv(p.customRgb.r, p.customRgb.g, p.customRgb.b);
          anchorHue = hsv.h;
        } else {
          anchorHue = poolAvgHue;
        }

        const okl = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
        const targetHues = this._getHarmonicAngles(anchorHue, p.chord);

        // Find nearest target angle along shortest circular arc
        let minDiff = 999;
        let bestTarget = anchorHue;
        targetHues.forEach(th => {
          let diff = Math.abs(okl.h - th) % 360;
          if (diff > 180) diff = 360 - diff;
          if (diff < minDiff) {
            minDiff = diff;
            bestTarget = th;
          }
        });

        // Pull toward nearest target hue
        const pull = ColorMath.clamp(p.strength * 0.8 * weightFactor, 0, 1);
        let dH = (bestTarget - okl.h) % 360;
        if (dH > 180) dH -= 360;
        if (dH < -180) dH += 360;
        const finalH = (okl.h + dH * pull + 360) % 360;

        return ColorMath.oklchToRgb(okl.l, okl.c, finalH);
      }

      case 'oklch': {
        const okl = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);

        // Normalise lightness along specified curve
        let newL = okl.l;
        if (p.curve === 's_curve') {
          // S-curve contrast adjustment
          newL = okl.l < 0.5 ? 2 * okl.l * okl.l : 1 - 2 * (1 - okl.l) * (1 - okl.l);
        } else if (p.curve === 'golden_ratio') {
          newL = Math.pow(okl.l, 0.618);
        }
        newL = ColorMath.clamp(p.minL + newL * (p.maxL - p.minL), 0.05, 0.98);

        // Clamp chroma to ceiling
        const newC = Math.min(okl.c, p.maxChroma);

        let res = ColorMath.oklchToRgb(newL, newC, okl.h);
        if (p.clampCmyk) {
          res = ColorMath.compressToCmykGamut(res.r, res.g, res.b);
        }
        return res;
      }

      case 'pigment': {
        const tube = this.BINDING_TUBES.find(t => t.id === p.tubeId) || this.BINDING_TUBES[0];
        const ratio = ColorMath.clamp(p.ratio * weightFactor * 0.5, 0.05, 0.45);
        
        // Physical Subtractive Pigment Blend
        return this._subtractivePigmentBlend(baseRgb, tube.rgb, ratio);
      }

      case 'temperature': {
        const okl = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
        const lum = okl.l;
        const shiftKelvin = p.kelvinShift * weightFactor;

        // Sorolla law: warm lights create cool shadows, or vice versa
        let localShift = shiftKelvin;
        if (p.polarity === 'warm_light_cool_shadow') {
          localShift = lum >= 0.5 ? shiftKelvin : -shiftKelvin * 0.7;
        } else {
          localShift = lum >= 0.5 ? -shiftKelvin : shiftKelvin * 0.7;
        }

        // Apply shift along orange-blue axis (45° warm, 225° cool)
        const warmFactor = ColorMath.clamp(localShift / 4000, -1, 1);
        let newH = okl.h;
        if (warmFactor > 0) {
          // Pull toward 45°
          let dH = (45 - okl.h) % 360;
          if (dH > 180) dH -= 360;
          if (dH < -180) dH += 360;
          newH = (okl.h + dH * warmFactor * 0.5 + 360) % 360;
        } else {
          // Pull toward 225°
          let dH = (225 - okl.h) % 360;
          if (dH > 180) dH -= 360;
          if (dH < -180) dH += 360;
          newH = (okl.h + dH * Math.abs(warmFactor) * 0.5 + 360) % 360;
        }

        return ColorMath.oklchToRgb(okl.l, okl.c, newH);
      }

      case 'hierarchy': {
        const okl = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
        // Regulate chroma per luminosity (halftones have maximum punch, deep shadows and highlights stay reserved)
        const curveFactor = Math.sin(okl.l * Math.PI);
        const tunedC = ColorMath.clamp(okl.c * (0.6 + curveFactor * 0.6), 0.02, 0.26);
        return ColorMath.oklchToRgb(okl.l, tunedC, okl.h);
      }

      default:
        return { ...baseRgb };
    }
  },

  _blendTint(baseRgb, tintRgb, amount, blendMode) {
    const f = ColorMath.clamp(amount, 0, 1);
    const br = baseRgb.r / 255;
    const bg = baseRgb.g / 255;
    const bb = baseRgb.b / 255;
    const tr = tintRgb.r / 255;
    const tg = tintRgb.g / 255;
    const tb = tintRgb.b / 255;

    let resR, resG, resB;

    switch (blendMode) {
      case 'multiply':
        resR = br * tr;
        resG = bg * tg;
        resB = bb * tb;
        break;

      case 'overlay':
        resR = br < 0.5 ? 2 * br * tr : 1 - 2 * (1 - br) * (1 - tr);
        resG = bg < 0.5 ? 2 * bg * tg : 1 - 2 * (1 - bg) * (1 - tg);
        resB = bb < 0.5 ? 2 * bb * tb : 1 - 2 * (1 - bb) * (1 - tb);
        break;

      case 'color': {
        const okBase = ColorMath.rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
        const okTint = ColorMath.rgbToOklch(tintRgb.r, tintRgb.g, tintRgb.b);
        const mixed = ColorMath.oklchToRgb(okBase.l, okTint.c * 0.8, okTint.h);
        return {
          r: ColorMath.clamp255(baseRgb.r * (1 - f) + mixed.r * f),
          g: ColorMath.clamp255(baseRgb.g * (1 - f) + mixed.g * f),
          b: ColorMath.clamp255(baseRgb.b * (1 - f) + mixed.b * f)
        };
      }

      case 'kubelka_munk':
        return this._subtractivePigmentBlend(baseRgb, tintRgb, f * 0.5);

      case 'soft_light':
      default:
        resR = (1 - 2 * tr) * br * br + 2 * tr * br;
        resG = (1 - 2 * tg) * bg * bg + 2 * tg * bg;
        resB = (1 - 2 * tb) * bb * bb + 2 * tb * bb;
        break;
    }

    return {
      r: ColorMath.clamp255((br * (1 - f) + resR * f) * 255),
      g: ColorMath.clamp255((bg * (1 - f) + resG * f) * 255),
      b: ColorMath.clamp255((bb * (1 - f) + resB * f) * 255)
    };
  },

  _subtractivePigmentBlend(rgbA, rgbB, ratio) {
    // Subtractive Kubelka-Munk optical absorption approximation
    const rA = Math.pow(rgbA.r / 255, 2.2);
    const gA = Math.pow(rgbA.g / 255, 2.2);
    const bA = Math.pow(rgbA.b / 255, 2.2);

    const rB = Math.pow(rgbB.r / 255, 2.2);
    const gB = Math.pow(rgbB.g / 255, 2.2);
    const bB = Math.pow(rgbB.b / 255, 2.2);

    // Cyan, Magenta, Yellow absorbances
    const cA = 1 - rA, mA = 1 - gA, yA = 1 - bA;
    const cB = 1 - rB, mB = 1 - gB, yB = 1 - bB;

    const cMix = cA * (1 - ratio) + cB * ratio;
    const mMix = mA * (1 - ratio) + mB * ratio;
    const yMix = yA * (1 - ratio) + yB * ratio;

    const rOut = Math.pow(Math.max(0, 1 - cMix), 1 / 2.2);
    const gOut = Math.pow(Math.max(0, 1 - mMix), 1 / 2.2);
    const bOut = Math.pow(Math.max(0, 1 - yMix), 1 / 2.2);

    return {
      r: ColorMath.clamp255(rOut * 255),
      g: ColorMath.clamp255(gOut * 255),
      b: ColorMath.clamp255(bOut * 255)
    };
  },

  _getHarmonicAngles(anchorHue, chord) {
    const a = (anchorHue + 360) % 360;
    switch (chord) {
      case 'analogous':
        return [a, (a + 30) % 360, (a - 30 + 360) % 360];
      case 'split_complementary':
        return [a, (a + 150) % 360, (a + 210) % 360];
      case 'triadic':
        return [a, (a + 120) % 360, (a + 240) % 360];
      case 'tetradic':
        return [a, (a + 90) % 360, (a + 180) % 360, (a + 270) % 360];
      case 'monochrome':
      default:
        return [a];
    }
  },

  _calculatePoolCohesion(rgbList) {
    if (!rgbList || rgbList.length < 2) {
      return { score: 100, grade: 'S+', diagnostics: ['Una sola muestra: coherencia unitaria perfecta.'] };
    }

    const oklchList = rgbList.map(c => ColorMath.rgbToOklch(c.r, c.g, c.b));
    const count = oklchList.length;

    // 1. Angular Hue Circular Variance (lower variance = higher unity)
    const sinSum = oklchList.reduce((acc, c) => acc + Math.sin(c.h * Math.PI / 180), 0);
    const cosSum = oklchList.reduce((acc, c) => acc + Math.cos(c.h * Math.PI / 180), 0);
    const R = Math.sqrt(sinSum * sinSum + cosSum * cosSum) / count; // 0 to 1
    const hueCohesionScore = Math.round(R * 100);

    // 2. Dynamic Range & Value Ladder Spacing
    const lums = oklchList.map(c => c.l);
    const minL = Math.min(...lums);
    const maxL = Math.max(...lums);
    const range = maxL - minL;
    const valueScore = Math.min(100, Math.round(range * 120));

    // 3. Chroma dispersion (penalize extreme clashes between hyper-neon and dull grey)
    const chromas = oklchList.map(c => c.c);
    const avgC = chromas.reduce((a, b) => a + b, 0) / count;
    const cVariance = chromas.reduce((a, b) => a + Math.pow(b - avgC, 2), 0) / count;
    const chromaScore = Math.max(40, Math.min(100, Math.round(100 - cVariance * 700)));

    // Combined score
    const totalScore = Math.round(hueCohesionScore * 0.45 + valueScore * 0.35 + chromaScore * 0.20);
    const clampedScore = ColorMath.clamp(totalScore, 10, 100);

    let grade = 'C';
    if (clampedScore >= 92) grade = 'S+';
    else if (clampedScore >= 82) grade = 'A';
    else if (clampedScore >= 70) grade = 'B';
    else if (clampedScore >= 50) grade = 'C';
    else grade = 'D';

    const diagnostics = [];
    if (R > 0.70) {
      diagnostics.push('✨ Excelente unificación de matices: las colecciones dialogan sin discordancias.');
    } else if (R < 0.40) {
      diagnostics.push('⚠️ Dispersión angular amplia: matices opuestos compiten por atención visual.');
    } else {
      diagnostics.push('🎨 Equilibrio armónico templado con contraste secundario controlado.');
    }

    if (range >= 0.55) {
      diagnostics.push('🌓 Excelente rango dinámico: sombras profundas y luces focales bien diferenciadas.');
    } else {
      diagnostics.push('🔍 Valores concentrados en tonos medios: convendría abrir la escala lumínica.');
    }

    return { score: clampedScore, grade, diagnostics };
  },

  _extractConsensusPalette(swatches, targetCount = 8) {
    if (!swatches || swatches.length === 0) return [];
    const count = Math.min(targetCount, swatches.length);
    if (swatches.length <= count) {
      return swatches.map(s => ({ hex: s.harmonizedHex, name: s.name, originalHex: s.originalHex }));
    }

    // Fast K-Means clustering over OKLCH coordinates
    const points = swatches.map(s => {
      const ok = ColorMath.rgbToOklch(s.harmonizedRgb.r, s.harmonizedRgb.g, s.harmonizedRgb.b);
      return {
        swatch: s,
        l: ok.l,
        a: ok.c * Math.cos(ok.h * Math.PI / 180),
        b: ok.c * Math.sin(ok.h * Math.PI / 180)
      };
    });

    // Initialize centroids evenly spaced by lightness
    points.sort((a, b) => a.l - b.l);
    const centroids = [];
    const step = points.length / count;
    for (let i = 0; i < count; i++) {
      centroids.push({ ...points[Math.floor(i * step)] });
    }

    // 4 K-Means iterations
    for (let iter = 0; iter < 4; iter++) {
      const clusters = Array.from({ length: count }, () => []);
      points.forEach(p => {
        let bestDist = Infinity;
        let bestIdx = 0;
        centroids.forEach((c, idx) => {
          const dist = Math.pow(p.l - c.l, 2) + Math.pow(p.a - c.a, 2) + Math.pow(p.b - c.b, 2);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        clusters[bestIdx].push(p);
      });

      clusters.forEach((cluster, idx) => {
        if (cluster.length > 0) {
          centroids[idx] = {
            l: cluster.reduce((sum, p) => sum + p.l, 0) / cluster.length,
            a: cluster.reduce((sum, p) => sum + p.a, 0) / cluster.length,
            b: cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length
          };
        }
      });
    }

    // Convert centroids back to RGB / Hex
    return centroids.map((c, i) => {
      const h_rad = Math.atan2(c.b, c.a);
      const h = ((h_rad * 180 / Math.PI) + 360) % 360;
      const chroma = Math.sqrt(c.a * c.a + c.b * c.b);
      const rgb = ColorMath.oklchToRgb(c.l, chroma, h);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      return {
        hex,
        name: `Consenso Armónico ${i + 1}`,
        rgb
      };
    });
  },

  _generateContrapointAccents(swatches) {
    if (!swatches || swatches.length === 0) return [];
    
    // Find average hue vector
    const oklList = swatches.map(s => ColorMath.rgbToOklch(s.harmonizedRgb.r, s.harmonizedRgb.g, s.harmonizedRgb.b));
    const avgH_rad = Math.atan2(
      oklList.reduce((acc, c) => acc + Math.sin(c.h * Math.PI / 180), 0) / oklList.length,
      oklList.reduce((acc, c) => acc + Math.cos(c.h * Math.PI / 180), 0) / oklList.length
    );
    const dominantHue = ((avgH_rad * 180 / Math.PI) + 360) % 360;
    const complementHue = (dominantHue + 180) % 360;

    // Generate 4 punchy accents around the complementary zone
    const accentAngles = [
      (complementHue - 20 + 360) % 360,
      complementHue,
      (complementHue + 20) % 360,
      (complementHue + 45) % 360
    ];

    return accentAngles.map((ang, idx) => {
      // High chroma, medium-high lightness for focal pop
      const lum = 0.65 + (idx % 2 === 0 ? 0.1 : -0.1);
      const chroma = 0.22;
      const rgb = ColorMath.oklchToRgb(lum, chroma, ang);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      return {
        hex,
        rgb,
        name: `Acento Focal ${idx + 1} (${Math.round(ang)}°)`,
        angle: Math.round(ang)
      };
    });
  },

  _computeGamutHull(rgbList) {
    // Converts RGB to polar coordinates and extracts outer bounding polygon
    const points = rgbList.map(c => {
      const ok = ColorMath.rgbToOklch(c.r, c.g, c.b);
      const ang_rad = ok.h * Math.PI / 180;
      return {
        x: ok.c * Math.cos(ang_rad),
        y: ok.c * Math.sin(ang_rad),
        h: ok.h,
        c: ok.c
      };
    });

    if (points.length < 3) return points;

    // Simple Gift Wrapping / Monotone Chain Convex Hull algorithm
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower = [];
    for (const p of points) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  },

  // -------------------------------------------------------------------------
  // OUTPUT ACTIONS & GENERATION
  // -------------------------------------------------------------------------

  createUnifiedMasterLibrary(options = {}) {
    const defaultName = `Fusión Armonizada: ${this.deck.map(d => d.name.split(' ')[0]).join(' + ')}`;
    const name = (options.name || defaultName).trim();
    const mode = options.mode || 'all'; // 'all' | 'deduplicate' | 'consensus' | 'selected_only'

    let rawList = [];
    if (mode === 'selected_only') {
      this.deck.forEach(d => {
        d.swatches.filter(s => s.included).forEach(s => rawList.push(s.harmonizedHex));
      });
    } else if (mode === 'consensus') {
      rawList = this.results.consensusPalette.map(c => c.hex);
    } else {
      this.deck.forEach(d => {
        d.swatches.forEach(s => rawList.push(s.harmonizedHex));
      });
    }

    if (rawList.length === 0) {
      this.app.showToast?.('No hay muestras seleccionadas para crear la biblioteca.');
      return null;
    }

    // Deduplication if requested
    let finalColors = rawList;
    if (mode === 'deduplicate') {
      const threshold = options.dedupeThreshold || 4.0;
      const unique = [];
      rawList.forEach(hex => {
        const rgb = ColorMath.hexToRgb(hex);
        const isDuplicate = unique.some(uHex => {
          const uRgb = ColorMath.hexToRgb(uHex);
          return ColorMath.getDeltaE(rgb, uRgb) < threshold;
        });
        if (!isDuplicate) unique.push(hex);
      });
      finalColors = unique;
    }

    // Save into SwatchManager
    if (this.app.swatchManager) {
      const newPal = this.app.swatchManager.addPalette(name, finalColors);
      this.app.renderSwatchesCollection?.();
      this.app.showToast?.(`✨ Biblioteca común "${name}" creada con ${finalColors.length} muestras.`);
      return newPal;
    }

    return null;
  },

  updateSelectedLibrariesInPlace() {
    const userLibs = this.deck.filter(d => d.source === 'user');
    if (userLibs.length === 0) {
      this.app.showToast?.('Ninguna de las bibliotecas en el muelle es una paleta de usuario editable.');
      return;
    }

    let updatedCount = 0;
    userLibs.forEach(lib => {
      const targetPal = this.app.swatchManager?.palettes.find(p => p.id === lib.id);
      if (targetPal) {
        targetPal.colors = lib.swatches.map(s => s.harmonizedHex);
        updatedCount++;
      }
    });

    if (this.app.swatchManager) {
      this.app.swatchManager.savePalettes();
      this.app.renderSwatchesCollection?.();
      this.app.showToast?.(`🔄 ${updatedCount} biblioteca(s) de usuario actualizada(s) con sus colores armonizados.`);
    }
  },

  cloneAsHarmonizedLibraries() {
    if (!this.app.swatchManager) return;
    let count = 0;

    this.deck.forEach(lib => {
      const cloneName = `[Armonizada] ${lib.name}`;
      const colors = lib.swatches.map(s => s.harmonizedHex);
      this.app.swatchManager.addPalette(cloneName, colors);
      count++;
    });

    this.app.renderSwatchesCollection?.();
    this.app.showToast?.(`📦 ${count} biblioteca(s) clonada(s) como nuevas paletas armonizadas.`);
  },

  extractAccentPaletteAsNewLibrary() {
    if (!this.results.accentRecommendations || this.results.accentRecommendations.length === 0) {
      this.app.showToast?.('No hay acentos disponibles.');
      return;
    }

    const name = `Acentos de Contrapunto (${this.deck.map(d => d.name.split(' ')[0]).join(' + ')})`;
    const colors = this.results.accentRecommendations.map(a => a.hex);

    if (this.app.swatchManager) {
      this.app.swatchManager.addPalette(name, colors);
      this.app.renderSwatchesCollection?.();
      this.app.showToast?.(`🎯 Minipaleta de acentos "${name}" guardada con éxito.`);
    }
  },

  openInSwatchSheetExporter() {
    const allHarmonized = [];
    this.deck.forEach(d => {
      d.swatches.filter(s => s.included).forEach(s => {
        allHarmonized.push({
          hex: s.harmonizedHex,
          name: `${s.name} (${d.name.split(' ')[0]})`
        });
      });
    });

    if (allHarmonized.length === 0) {
      this.app.showToast?.('No hay muestras en el muelle.');
      return;
    }

    const title = `Colección Armonizada: ${this.deck.map(d => d.name.split(' ')[0]).join(' + ')}`;
    SwatchSheetExporter.openExportModal(title, allHarmonized, this.app, {
      template: 'cinematic_pro',
      subtitle: `ARMONIZACIÓN MULTI-BIBLIOTECA • COHESIÓN CROMÁTICA ${this.results.cohesionAfter}/100`
    });
  },

  sendToWetMixer() {
    if (!this.app) return;
    const swatches = [];
    this.deck.forEach(d => {
      d.swatches.filter(s => s.included).forEach(s => swatches.push(s.harmonizedRgb));
    });

    if (swatches.length === 0) return;

    this.app.switchTab('wetmixer');
    if (!this.app.wetMixer) this.app._initWetMixer();

    if (this.app.wetMixer) {
      const stepX = this.app.wetMixer.width / (swatches.length + 1);
      const cy = this.app.wetMixer.height * 0.45;
      swatches.forEach((rgb, idx) => {
        const cx = stepX * (idx + 1);
        this.app.wetMixer.depositDab(cx, cy, rgb, 38);
      });
      this.app.showToast?.(`🖌️ ${swatches.length} muestras armonizadas depositadas en el lienzo Wet Mixer.`);
    }
  },

  sendToHyper4D() {
    if (!this.app) return;
    this.app.switchTab('hyper4d');
    this.app.showToast?.('🔮 Sincronización multi-biblioteca proyectada en el Hiperespacio 4D.');
  },

  // -------------------------------------------------------------------------
  // DOM RENDERING & EVENT BINDINGS
  // -------------------------------------------------------------------------

  _bindDOMEvents() {
    // Strategy switcher buttons
    const stratBtns = document.querySelectorAll('.lib-harm-strategy-btn');
    stratBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stratBtns.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        const strat = btn.dataset.strategy;
        this.setStrategy(strat);
      });
    });

    // Drawer toggle button
    const btnOpenDrawer = document.getElementById('btnLibHarmOpenDrawer');
    const btnCloseDrawer = document.getElementById('btnLibHarmCloseDrawer');
    if (btnOpenDrawer) {
      btnOpenDrawer.addEventListener('click', () => this.openDrawer());
    }
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => this.closeDrawer());
    }

    // Quick deck actions
    const btnClearDeck = document.getElementById('btnLibHarmClearDeck');
    if (btnClearDeck) btnClearDeck.addEventListener('click', () => this.clearDeck());

    const btnDemoDuo = document.getElementById('btnLibHarmDemoDuo');
    if (btnDemoDuo) btnDemoDuo.addEventListener('click', () => {
      this.clearDeck();
      this._loadInitialDeck();
      this.app.showToast?.('Dúo de demostración cargado en el muelle.');
    });

    const btnAllUser = document.getElementById('btnLibHarmAllUser');
    if (btnAllUser) btnAllUser.addEventListener('click', () => {
      const userPals = this.app.swatchManager?.palettes || [];
      userPals.forEach(p => {
        this.addLibraryToDeck({
          id: p.id,
          source: 'user',
          name: p.name,
          category: 'Mi Paleta',
          colors: p.colors
        });
      });
    });

    // Output Action buttons
    const btnCreateMaster = document.getElementById('btnLibHarmCreateMaster');
    if (btnCreateMaster) {
      btnCreateMaster.addEventListener('click', () => {
        const inputName = document.getElementById('libHarmMasterNameInput')?.value;
        const selectMode = document.getElementById('libHarmExportModeSelect')?.value || 'all';
        this.createUnifiedMasterLibrary({ name: inputName, mode: selectMode });
      });
    }

    const btnUpdateInPlace = document.getElementById('btnLibHarmUpdateInPlace');
    if (btnUpdateInPlace) {
      btnUpdateInPlace.addEventListener('click', () => this.updateSelectedLibrariesInPlace());
    }

    const btnCloneHarmonized = document.getElementById('btnLibHarmCloneHarmonized');
    if (btnCloneHarmonized) {
      btnCloneHarmonized.addEventListener('click', () => this.cloneAsHarmonizedLibraries());
    }

    const btnExtractAccents = document.getElementById('btnLibHarmExtractAccents');
    if (btnExtractAccents) {
      btnExtractAccents.addEventListener('click', () => this.extractAccentPaletteAsNewLibrary());
    }

    const btnOpenSheet = document.getElementById('btnLibHarmOpenSheet');
    if (btnOpenSheet) {
      btnOpenSheet.addEventListener('click', () => this.openInSwatchSheetExporter());
    }

    const btnSendWet = document.getElementById('btnLibHarmSendWetMixer');
    if (btnSendWet) {
      btnSendWet.addEventListener('click', () => this.sendToWetMixer());
    }

    const btnSend4D = document.getElementById('btnLibHarmSendHyper4D');
    if (btnSend4D) {
      btnSend4D.addEventListener('click', () => this.sendToHyper4D());
    }

    // Radar canvas resizing & interactions
    const radarCanvas = document.getElementById('libHarmRadarCanvas');
    if (radarCanvas) {
      radarCanvas.addEventListener('mousemove', (e) => this._handleRadarMouseMove(e, radarCanvas));
      radarCanvas.addEventListener('mouseleave', () => {
        this.hoveredRadarPoint = null;
        this.drawRadarCanvas();
      });
    }

    // Drawer search & filter tabs
    const drawerSearchInput = document.getElementById('libHarmDrawerSearch');
    if (drawerSearchInput) {
      drawerSearchInput.addEventListener('input', (e) => {
        this.drawerSearch = e.target.value.toLowerCase().trim();
        this.renderDrawerLibraries();
      });
    }

    const drawerFilterTabs = document.querySelectorAll('.lib-harm-drawer-filter');
    drawerFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        drawerFilterTabs.forEach(t => t.classList.remove('active-toggle'));
        tab.classList.add('active-toggle');
        this.drawerFilter = tab.dataset.filter;
        this.renderDrawerLibraries();
      });
    });
  },

  openDrawer() {
    this.isDrawerOpen = true;
    const drawer = document.getElementById('libHarmPickerDrawer');
    if (drawer) {
      drawer.style.display = 'block';
      this.renderDrawerLibraries();
    }
  },

  closeDrawer() {
    this.isDrawerOpen = false;
    const drawer = document.getElementById('libHarmPickerDrawer');
    if (drawer) drawer.style.display = 'none';
  },

  render(appInstance) {
    if (appInstance) this.app = appInstance;
    this.renderDeckCards();
    this.renderStrategyControls();
    this.renderMetricsAndCohesion();
    this.drawRadarCanvas();
    this.renderComparisonList();
    this.renderOutputHub();
  },

  renderPreviewOnly() {
    this.renderMetricsAndCohesion();
    this.drawRadarCanvas();
    this.renderComparisonList();
    this.renderOutputHub();
  },

  renderDeckCards() {
    const container = document.getElementById('libHarmDeckCardsContainer');
    const countTag = document.getElementById('libHarmDeckCountBadge');
    if (countTag) {
      const totalSwatches = this.deck.reduce((sum, d) => sum + d.swatches.length, 0);
      countTag.textContent = `${this.deck.length} Bibliotecas • ${totalSwatches} Muestras`;
    }

    if (!container) return;
    container.innerHTML = '';

    if (this.deck.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); background: rgba(0,0,0,0.2);">
          <span style="font-size: 2rem; display: block; margin-bottom: 8px;">📭</span>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">El muelle de armonización está vacío.</p>
          <button id="btnLibHarmDeckAddEmpty" class="tool-action-btn active-toggle" style="margin: 0 auto;">
            <span>➕</span> Añadir Bibliotecas al Muelle
          </button>
        </div>
      `;
      const btn = document.getElementById('btnLibHarmDeckAddEmpty');
      if (btn) btn.addEventListener('click', () => this.openDrawer());
      return;
    }

    this.deck.forEach(lib => {
      const card = document.createElement('div');
      card.className = `lib-harm-deck-card ${lib.enabled ? '' : 'deck-card-disabled'}`;
      card.style.borderLeft = `4px solid ${lib.badgeColor}`;

      // Swatch pills preview with lock pin & inclusion
      const swatchesHtml = lib.swatches.map(sw => {
        return `
          <div class="lib-harm-deck-swatch ${sw.locked ? 'swatch-locked' : ''} ${sw.included ? '' : 'swatch-excluded'}" 
               data-swatch-id="${sw.id}" data-lib-id="${lib.id}" title="${sw.name} (${sw.originalHex})">
            <span class="deck-swatch-dot" style="background-color: ${sw.originalHex};"></span>
            <span class="deck-swatch-hex">${sw.originalHex}</span>
            <button class="deck-swatch-pin-btn" title="${sw.locked ? 'Desbloquear' : 'Fijar como inmutable 📌'}">
              ${sw.locked ? '📌' : '🔓'}
            </button>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="deck-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" class="lib-deck-toggle-chk" ${lib.enabled ? 'checked' : ''} title="Activar/desactivar en el cálculo">
            <span class="deck-badge-dot" style="background-color: ${lib.badgeColor};"></span>
            <strong class="deck-card-title">${lib.name}</strong>
            <span class="deck-category-badge">${lib.category}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="deck-weight-control" title="Ponderación / Peso de influencia en la armonización">
              <label>Influencia:</label>
              <input type="range" class="deck-weight-slider" min="0.2" max="2.0" step="0.1" value="${lib.weight}">
              <span class="deck-weight-val">${lib.weight.toFixed(1)}x</span>
            </div>
            <button class="deck-card-remove-btn" title="Quitar biblioteca del muelle">✕</button>
          </div>
        </div>
        <div class="deck-card-swatches-strip">
          ${swatchesHtml}
        </div>
      `;

      // Card event listeners
      const chk = card.querySelector('.lib-deck-toggle-chk');
      if (chk) chk.addEventListener('change', (e) => this.toggleLibraryEnabled(lib.id, e.target.checked));

      const weightSlider = card.querySelector('.deck-weight-slider');
      const weightVal = card.querySelector('.deck-weight-val');
      if (weightSlider) {
        weightSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (weightVal) weightVal.textContent = val.toFixed(1) + 'x';
          this.setLibraryWeight(lib.id, val);
        });
      }

      const removeBtn = card.querySelector('.deck-card-remove-btn');
      if (removeBtn) removeBtn.addEventListener('click', () => this.removeLibraryFromDeck(lib.id));

      // Swatch pin toggles
      card.querySelectorAll('.deck-swatch-pin-btn').forEach(pinBtn => {
        pinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const swEl = pinBtn.closest('.lib-harm-deck-swatch');
          const swId = swEl?.dataset.swatchId;
          if (swId) this.toggleSwatchLocked(lib.id, swId);
        });
      });

      // Swatch click to set active color
      card.querySelectorAll('.lib-harm-deck-swatch').forEach(swEl => {
        swEl.addEventListener('click', (e) => {
          if (e.target.tagName.toLowerCase() === 'button') return;
          const swId = swEl.dataset.swatchId;
          const sw = lib.swatches.find(s => s.id === swId);
          if (sw && this.app) {
            this.app.setActiveWell('fg');
            this.app.setColorDirectly(sw.originalRgb);
            this.app.showToast?.(`Muestra ${sw.originalHex} cargada en color frontal`);
          }
        });
      });

      container.appendChild(card);
    });
  },

  renderDrawerLibraries() {
    const container = document.getElementById('libHarmDrawerListContainer');
    if (!container) return;
    container.innerHTML = '';

    const allLibs = this.getAllAvailableLibraries();
    const filter = this.drawerFilter;
    const search = this.drawerSearch;

    const filtered = allLibs.filter(lib => {
      if (filter === 'user' && lib.source !== 'user') return false;
      if (filter === 'masters' && lib.source !== 'masters') return false;
      if (filter === 'atelier' && lib.source !== 'atelier') return false;
      if (filter === 'catalogs' && lib.source !== 'catalogs') return false;
      if (search && !lib.name.toLowerCase().includes(search) && !lib.category.toLowerCase().includes(search)) return false;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p style="padding: 20px; color: var(--text-muted); font-size: 0.82rem; text-align: center;">No se encontraron bibliotecas con el filtro actual.</p>`;
      return;
    }

    filtered.forEach(lib => {
      const isAlreadyInDeck = this.deck.some(d => d.id === lib.id);
      const row = document.createElement('div');
      row.className = `lib-harm-drawer-item ${isAlreadyInDeck ? 'drawer-item-in-deck' : ''}`;

      const chipsHtml = lib.colors.slice(0, 10).map(c => `
        <span class="drawer-swatch-chip" style="background-color: ${c};" title="${c}"></span>
      `).join('');

      row.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <strong style="font-size: 0.82rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lib.name}</strong>
            <span class="drawer-category-badge">${lib.category}</span>
          </div>
          <div style="display: flex; gap: 3px; align-items: center;">
            ${chipsHtml}
            ${lib.colors.length > 10 ? `<span style="font-size: 0.65rem; color: var(--text-muted); margin-left: 4px;">+${lib.colors.length - 10}</span>` : ''}
          </div>
        </div>
        <button class="tool-action-btn ${isAlreadyInDeck ? '' : 'active-toggle'} drawer-add-btn" ${isAlreadyInDeck ? 'disabled' : ''}>
          ${isAlreadyInDeck ? '✓ En Muelle' : '➕ Añadir'}
        </button>
      `;

      const addBtn = row.querySelector('.drawer-add-btn');
      if (addBtn && !isAlreadyInDeck) {
        addBtn.addEventListener('click', () => {
          this.addLibraryToDeck(lib);
          this.renderDrawerLibraries();
        });
      }

      container.appendChild(row);
    });
  },

  renderStrategyControls() {
    const strat = this.activeStrategy;
    const container = document.getElementById('libHarmStrategyControlsContainer');
    if (!container) return;

    // Update active state on strategy tabs
    document.querySelectorAll('.lib-harm-strategy-btn').forEach(btn => {
      if (btn.dataset.strategy === strat) btn.classList.add('active-toggle');
      else btn.classList.remove('active-toggle');
    });

    let html = '';

    if (strat === 'glaze') {
      const p = this.params.glaze;
      const presetsHtml = this.GLAZE_PRESETS.map(gp => `
        <button class="glaze-preset-pill ${p.color.toUpperCase() === gp.hex.toUpperCase() ? 'preset-active' : ''}" 
                data-hex="${gp.hex}" title="${gp.desc}">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${gp.hex}; vertical-align:middle; margin-right:4px;"></span>
          ${gp.name}
        </button>
      `).join('');

      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <label class="strat-label">Tinte / Veladura Principal:</label>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <input type="color" id="libHarmGlazeColor" value="${p.color}" class="color-picker-input">
              <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-primary);">${p.color}</span>
            </div>
            <div class="glaze-presets-row">
              ${presetsHtml}
            </div>
          </div>

          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Intensidad de la Veladura: <span id="libHarmGlazeIntensityVal">${Math.round(p.intensity * 100)}%</span></label>
              <input type="range" id="libHarmGlazeIntensity" min="0" max="1" step="0.01" value="${p.intensity}">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div>
                <label class="strat-label">Modo de Fusión:</label>
                <select id="libHarmGlazeBlendMode" class="chip-select" style="width: 100%;">
                  <option value="soft_light" ${p.blendMode === 'soft_light' ? 'selected' : ''}>Soft Light (Cinemático)</option>
                  <option value="multiply" ${p.blendMode === 'multiply' ? 'selected' : ''}>Multiply (Acuarela/Óleo)</option>
                  <option value="overlay" ${p.blendMode === 'overlay' ? 'selected' : ''}>Overlay (Alto Contraste)</option>
                  <option value="color" ${p.blendMode === 'color' ? 'selected' : ''}>Color (Re-tintado OKLCH)</option>
                  <option value="kubelka_munk" ${p.blendMode === 'kubelka_munk' ? 'selected' : ''}>Kubelka-Munk (Físico)</option>
                </select>
              </div>

              <div>
                <label class="strat-label">Rango Tonal:</label>
                <select id="libHarmGlazeTarget" class="chip-select" style="width: 100%;">
                  <option value="all" ${p.target === 'all' ? 'selected' : ''}>Todo el Espectro</option>
                  <option value="highlights" ${p.target === 'highlights' ? 'selected' : ''}>Solo Luces (L > 50%)</option>
                  <option value="shadows" ${p.target === 'shadows' ? 'selected' : ''}>Solo Sombras (L < 50%)</option>
                  <option value="split" ${p.target === 'split' ? 'selected' : ''}>Split-Toning Cruzado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (strat === 'gamut') {
      const p = this.params.gamut;
      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <label class="strat-label" style="margin-bottom: 0;">Geometría de la Máscara:</label>
              <select id="libHarmGamutShape" class="chip-select">
                <option value="triangle" ${p.shape === 'triangle' ? 'selected' : ''}>Triángulo Armónico</option>
                <option value="diamond" ${p.shape === 'diamond' ? 'selected' : ''}>Diamante Equilibrado</option>
                <option value="slit" ${p.shape === 'slit' ? 'selected' : ''}>Hendidura Complementaria</option>
                <option value="sector" ${p.shape === 'sector' ? 'selected' : ''}>Sector Análogo</option>
                <option value="ellipse" ${p.shape === 'ellipse' ? 'selected' : ''}>Elipse Orgánica</option>
              </select>
            </div>

            <div class="strat-slider-row">
              <label class="strat-label">Rotación Angular: <span id="libHarmGamutAngleVal">${p.angle}°</span></label>
              <input type="range" id="libHarmGamutAngle" min="0" max="360" step="1" value="${p.angle}">
            </div>
          </div>

          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Apertura / Escala del Gamut: <span id="libHarmGamutScaleVal">${Math.round(p.scale * 100)}%</span></label>
              <input type="range" id="libHarmGamutScale" min="0.2" max="0.9" step="0.02" value="${p.scale}">
            </div>

            <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
              <label class="strat-label" style="margin-bottom: 0;">Modo de Contención:</label>
              <select id="libHarmGamutMode" class="chip-select">
                <option value="soft_attract" ${p.mode === 'soft_attract' ? 'selected' : ''}>Atracción Centrípeta Suave</option>
                <option value="strict_clamp" ${p.mode === 'strict_clamp' ? 'selected' : ''}>Proyección Estricta al Borde</option>
              </select>
            </div>
          </div>
        </div>
      `;
    } else if (strat === 'anchor') {
      const p = this.params.anchor;
      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <label class="strat-label">Origen del Ancla Maestra:</label>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <select id="libHarmAnchorMode" class="chip-select" style="flex: 1;">
                <option value="hero_fg" ${p.anchorMode === 'hero_fg' ? 'selected' : ''}>Color Frontal Activo (FG)</option>
                <option value="pool_average" ${p.anchorMode === 'pool_average' ? 'selected' : ''}>Tono Promedio del Muelle</option>
                <option value="custom" ${p.anchorMode === 'custom' ? 'selected' : ''}>Color Personalizado</option>
              </select>
              <input type="color" id="libHarmAnchorCustomColor" value="${p.customColor}" class="color-picker-input">
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <label class="strat-label" style="margin-bottom: 0;">Acorde Armónico Objetivo:</label>
              <select id="libHarmAnchorChord" class="chip-select">
                <option value="analogous" ${p.chord === 'analogous' ? 'selected' : ''}>Análoga (±30°)</option>
                <option value="split_complementary" ${p.chord === 'split_complementary' ? 'selected' : ''}>Split-Complementario (150°/210°)</option>
                <option value="triadic" ${p.chord === 'triadic' ? 'selected' : ''}>Tríada Equilátera (120°/240°)</option>
                <option value="tetradic" ${p.chord === 'tetradic' ? 'selected' : ''}>Tétrada Rectangular</option>
                <option value="monochrome" ${p.chord === 'monochrome' ? 'selected' : ''}>Monocromático Estilizado</option>
              </select>
            </div>
          </div>

          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Fuerza de Sintonización / Atracción: <span id="libHarmAnchorStrengthVal">${Math.round(p.strength * 100)}%</span></label>
              <input type="range" id="libHarmAnchorStrength" min="0" max="1" step="0.02" value="${p.strength}">
            </div>
            <p style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; margin-top: 8px;">
              Las muestras no bloqueadas de todas las bibliotecas son atraídas gradualmente hacia los intervalos armónicos exactos del ancla maestra.
            </p>
          </div>
        </div>
      `;
    } else if (strat === 'oklch') {
      const p = this.params.oklch;
      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Sombra Ancla ($L_{\\min}$): <span id="libHarmOklchMinLVal">${Math.round(p.minL * 100)}%</span></label>
              <input type="range" id="libHarmOklchMinL" min="0.05" max="0.35" step="0.01" value="${p.minL}">
            </div>
            <div class="strat-slider-row" style="margin-top: 8px;">
              <label class="strat-label">Luz Focal Ancla ($L_{\\max}$): <span id="libHarmOklchMaxLVal">${Math.round(p.maxL * 100)}%</span></label>
              <input type="range" id="libHarmOklchMaxL" min="0.75" max="0.98" step="0.01" value="${p.maxL}">
            </div>
          </div>

          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Techo de Croma ($C_{\\max}$): <span id="libHarmOklchMaxCVal">${p.maxChroma.toFixed(2)}</span></label>
              <input type="range" id="libHarmOklchMaxC" min="0.08" max="0.32" step="0.01" value="${p.maxChroma}">
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
              <label class="strat-label" style="margin-bottom: 0;">Curva Tonal:</label>
              <select id="libHarmOklchCurve" class="chip-select">
                <option value="s_curve" ${p.curve === 's_curve' ? 'selected' : ''}>Curva S de Contraste</option>
                <option value="linear" ${p.curve === 'linear' ? 'selected' : ''}>Lineal Uniforme</option>
                <option value="golden_ratio" ${p.curve === 'golden_ratio' ? 'selected' : ''}>Proporción Áurea</option>
              </select>
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--text-secondary); margin-left: 8px;">
                <input type="checkbox" id="libHarmOklchCmyk" ${p.clampCmyk ? 'checked' : ''}> Límite CMYK
              </label>
            </div>
          </div>
        </div>
      `;
    } else if (strat === 'pigment') {
      const p = this.params.pigment;
      const tubesOptions = this.BINDING_TUBES.map(t => `
        <option value="${t.id}" ${p.tubeId === t.id ? 'selected' : ''}>${t.name}</option>
      `).join('');

      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <label class="strat-label">Tubo Real de Taller para Unificación:</label>
            <select id="libHarmPigmentTube" class="chip-select" style="width: 100%; margin-bottom: 8px;">
              ${tubesOptions}
            </select>
            <p style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
              Simula la práctica renacentista de mezclar una pizca de un mismo pigmento terroso en todos los colores de la paleta.
            </p>
          </div>

          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Proporción de Mezcla Sustractiva: <span id="libHarmPigmentRatioVal">${Math.round(p.ratio * 100)}%</span></label>
              <input type="range" id="libHarmPigmentRatio" min="0.05" max="0.50" step="0.01" value="${p.ratio}">
            </div>
          </div>
        </div>
      `;
    } else if (strat === 'temperature') {
      const p = this.params.temperature;
      html = `
        <div class="strat-controls-grid">
          <div class="strat-control-col">
            <div class="strat-slider-row">
              <label class="strat-label">Ajuste Kelvin Térmico: <span id="libHarmKelvinVal">${p.kelvinShift > 0 ? '+' : ''}${p.kelvinShift} K</span></label>
              <input type="range" id="libHarmKelvinShift" min="-4000" max="4000" step="100" value="${p.kelvinShift}">
            </div>
          </div>

          <div class="strat-control-col">
            <label class="strat-label">Polaridad Térmica de Sorolla:</label>
            <select id="libHarmKelvinPolarity" class="chip-select" style="width: 100%;">
              <option value="warm_light_cool_shadow" ${p.polarity === 'warm_light_cool_shadow' ? 'selected' : ''}>Luces Cálidas / Sombras Frías (Luminismo Solar)</option>
              <option value="cool_light_warm_shadow" ${p.polarity === 'cool_light_warm_shadow' ? 'selected' : ''}>Luces Frías / Sombras Cálidas (Nórdico / Crepúsculo)</option>
            </select>
          </div>
        </div>
      `;
    } else if (strat === 'hierarchy') {
      html = `
        <div style="padding: 10px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
          <strong>Regla Áurea de Composición 60 • 30 • 10:</strong> Modula la saturación para reservar el máximo croma exclusivamente al 10% de acentos focales, dejando un 30% en medios tonos secundarios y un 60% en tonos de base atmosférica desaturados.
        </div>
      `;
    }

    container.innerHTML = html;
    this._bindStrategyDynamicEvents(strat);
  },

  _bindStrategyDynamicEvents(strat) {
    if (strat === 'glaze') {
      const colorInput = document.getElementById('libHarmGlazeColor');
      if (colorInput) {
        colorInput.addEventListener('input', (e) => {
          this.params.glaze.color = e.target.value;
          this.params.glaze.rgb = ColorMath.hexToRgb(e.target.value);
          this.computeHarmonization();
          this.renderPreviewOnly();
        });
      }

      const intensitySlider = document.getElementById('libHarmGlazeIntensity');
      const intensityVal = document.getElementById('libHarmGlazeIntensityVal');
      if (intensitySlider) {
        intensitySlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.params.glaze.intensity = val;
          if (intensityVal) intensityVal.textContent = Math.round(val * 100) + '%';
          this.computeHarmonization();
          this.renderPreviewOnly();
        });
      }

      const blendSelect = document.getElementById('libHarmGlazeBlendMode');
      if (blendSelect) {
        blendSelect.addEventListener('change', (e) => {
          this.params.glaze.blendMode = e.target.value;
          this.computeHarmonization();
          this.renderPreviewOnly();
        });
      }

      const targetSelect = document.getElementById('libHarmGlazeTarget');
      if (targetSelect) {
        targetSelect.addEventListener('change', (e) => {
          this.params.glaze.target = e.target.value;
          this.computeHarmonization();
          this.renderPreviewOnly();
        });
      }

      document.querySelectorAll('.glaze-preset-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const hex = pill.dataset.hex;
          this.params.glaze.color = hex;
          this.params.glaze.rgb = ColorMath.hexToRgb(hex);
          this.computeHarmonization();
          this.renderStrategyControls();
          this.renderPreviewOnly();
        });
      });
    } else if (strat === 'gamut') {
      const shapeSel = document.getElementById('libHarmGamutShape');
      if (shapeSel) shapeSel.addEventListener('change', (e) => {
        this.params.gamut.shape = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const angleSlider = document.getElementById('libHarmGamutAngle');
      const angleVal = document.getElementById('libHarmGamutAngleVal');
      if (angleSlider) angleSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.params.gamut.angle = val;
        if (angleVal) angleVal.textContent = val + '°';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const scaleSlider = document.getElementById('libHarmGamutScale');
      const scaleVal = document.getElementById('libHarmGamutScaleVal');
      if (scaleSlider) scaleSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.gamut.scale = val;
        if (scaleVal) scaleVal.textContent = Math.round(val * 100) + '%';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const modeSel = document.getElementById('libHarmGamutMode');
      if (modeSel) modeSel.addEventListener('change', (e) => {
        this.params.gamut.mode = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });
    } else if (strat === 'anchor') {
      const modeSel = document.getElementById('libHarmAnchorMode');
      if (modeSel) modeSel.addEventListener('change', (e) => {
        this.params.anchor.anchorMode = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const colorInput = document.getElementById('libHarmAnchorCustomColor');
      if (colorInput) colorInput.addEventListener('input', (e) => {
        this.params.anchor.customColor = e.target.value;
        this.params.anchor.customRgb = ColorMath.hexToRgb(e.target.value);
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const chordSel = document.getElementById('libHarmAnchorChord');
      if (chordSel) chordSel.addEventListener('change', (e) => {
        this.params.anchor.chord = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const strengthSlider = document.getElementById('libHarmAnchorStrength');
      const strengthVal = document.getElementById('libHarmAnchorStrengthVal');
      if (strengthSlider) strengthSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.anchor.strength = val;
        if (strengthVal) strengthVal.textContent = Math.round(val * 100) + '%';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });
    } else if (strat === 'oklch') {
      const minL = document.getElementById('libHarmOklchMinL');
      const minLVal = document.getElementById('libHarmOklchMinLVal');
      if (minL) minL.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.oklch.minL = val;
        if (minLVal) minLVal.textContent = Math.round(val * 100) + '%';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const maxL = document.getElementById('libHarmOklchMaxL');
      const maxLVal = document.getElementById('libHarmOklchMaxLVal');
      if (maxL) maxL.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.oklch.maxL = val;
        if (maxLVal) maxLVal.textContent = Math.round(val * 100) + '%';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const maxC = document.getElementById('libHarmOklchMaxC');
      const maxCVal = document.getElementById('libHarmOklchMaxCVal');
      if (maxC) maxC.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.oklch.maxChroma = val;
        if (maxCVal) maxCVal.textContent = val.toFixed(2);
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const curveSel = document.getElementById('libHarmOklchCurve');
      if (curveSel) curveSel.addEventListener('change', (e) => {
        this.params.oklch.curve = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const cmykChk = document.getElementById('libHarmOklchCmyk');
      if (cmykChk) cmykChk.addEventListener('change', (e) => {
        this.params.oklch.clampCmyk = e.target.checked;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });
    } else if (strat === 'pigment') {
      const tubeSel = document.getElementById('libHarmPigmentTube');
      if (tubeSel) tubeSel.addEventListener('change', (e) => {
        this.params.pigment.tubeId = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const ratioSlider = document.getElementById('libHarmPigmentRatio');
      const ratioVal = document.getElementById('libHarmPigmentRatioVal');
      if (ratioSlider) ratioSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params.pigment.ratio = val;
        if (ratioVal) ratioVal.textContent = Math.round(val * 100) + '%';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });
    } else if (strat === 'temperature') {
      const kSlider = document.getElementById('libHarmKelvinShift');
      const kVal = document.getElementById('libHarmKelvinVal');
      if (kSlider) kSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.params.temperature.kelvinShift = val;
        if (kVal) kVal.textContent = (val > 0 ? '+' : '') + val + ' K';
        this.computeHarmonization();
        this.renderPreviewOnly();
      });

      const polSel = document.getElementById('libHarmKelvinPolarity');
      if (polSel) polSel.addEventListener('change', (e) => {
        this.params.temperature.polarity = e.target.value;
        this.computeHarmonization();
        this.renderPreviewOnly();
      });
    }
  },

  renderMetricsAndCohesion() {
    const scoreBeforeEl = document.getElementById('libHarmScoreBefore');
    const scoreAfterEl = document.getElementById('libHarmScoreAfter');
    const badgeAfterEl = document.getElementById('libHarmGradeBadgeAfter');
    const diffEl = document.getElementById('libHarmScoreDiff');
    const barEl = document.getElementById('libHarmScoreBarFill');
    const diagContainer = document.getElementById('libHarmDiagnosticsList');

    if (scoreBeforeEl) scoreBeforeEl.textContent = this.results.cohesionBefore;
    if (scoreAfterEl) scoreAfterEl.textContent = this.results.cohesionAfter;
    if (badgeAfterEl) {
      badgeAfterEl.textContent = this.results.gradeAfter;
      badgeAfterEl.className = `grade-badge grade-${this.results.gradeAfter.toLowerCase().replace('+', '-plus')}`;
    }

    if (diffEl) {
      const diff = this.results.cohesionAfter - this.results.cohesionBefore;
      diffEl.textContent = (diff >= 0 ? '+' : '') + diff + ' pts';
      diffEl.style.color = diff >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)';
    }

    if (barEl) {
      barEl.style.width = `${this.results.cohesionAfter}%`;
    }

    if (diagContainer) {
      diagContainer.innerHTML = this.results.diagnostics.map(d => `
        <li style="margin-bottom: 4px; font-size: 0.74rem; color: var(--text-secondary);">${d}</li>
      `).join('');
    }
  },

  drawRadarCanvas() {
    const canvas = document.getElementById('libHarmRadarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = rect.width || 340;
    const height = rect.height || 340;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(cx, cy) - 24;

    ctx.clearRect(0, 0, width, height);

    // 1. Polar Background concentric rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [0.25, 0.50, 0.75, 1.0].forEach(rRatio => {
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * rRatio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 2. Polar radial rays (every 30°)
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = deg * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(rad), cy + maxRadius * Math.sin(rad));
      ctx.stroke();
    }

    // 3. Hue Labels
    ctx.font = '9px var(--font-sans)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [0, 60, 120, 180, 240, 300].forEach(deg => {
      const rad = deg * Math.PI / 180;
      const lx = cx + (maxRadius + 14) * Math.cos(rad);
      const ly = cy + (maxRadius + 14) * Math.sin(rad);
      ctx.fillText(`${deg}°`, lx, ly);
    });

    // 4. Draw Before Gamut Hull (Dashed translucent grey outline)
    if (this.results.gamutHullBefore && this.results.gamutHullBefore.length > 2) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this.results.gamutHullBefore.forEach((pt, i) => {
        const r = (pt.c / 0.32) * maxRadius;
        const rad = pt.h * Math.PI / 180;
        const px = cx + r * Math.cos(rad);
        const py = cy + r * Math.sin(rad);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw After Gamut Hull (Glowing solid colored area)
    if (this.results.gamutHullAfter && this.results.gamutHullAfter.length > 2) {
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.results.gamutHullAfter.forEach((pt, i) => {
        const r = (pt.c / 0.32) * maxRadius;
        const rad = pt.h * Math.PI / 180;
        const px = cx + r * Math.cos(rad);
        const py = cy + r * Math.sin(rad);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw Transition Vectors (Dashed lines from original point to harmonized point)
    this.results.swatches.forEach(sw => {
      if (sw.locked || sw.deltaE < 1.0) return;
      const okOrig = ColorMath.rgbToOklch(sw.originalRgb.r, sw.originalRgb.g, sw.originalRgb.b);
      const okHarm = ColorMath.rgbToOklch(sw.harmonizedRgb.r, sw.harmonizedRgb.g, sw.harmonizedRgb.b);

      const rOrig = (okOrig.c / 0.32) * maxRadius;
      const radOrig = okOrig.h * Math.PI / 180;
      const x1 = cx + rOrig * Math.cos(radOrig);
      const y1 = cy + rOrig * Math.sin(radOrig);

      const rHarm = (okHarm.c / 0.32) * maxRadius;
      const radHarm = okHarm.h * Math.PI / 180;
      const x2 = cx + rHarm * Math.cos(radHarm);
      const y2 = cy + rHarm * Math.sin(radHarm);

      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = sw.badgeColor || 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    });

    // 7. Draw Points
    this.results.swatches.forEach(sw => {
      const okHarm = ColorMath.rgbToOklch(sw.harmonizedRgb.r, sw.harmonizedRgb.g, sw.harmonizedRgb.b);
      const rHarm = (okHarm.c / 0.32) * maxRadius;
      const radHarm = okHarm.h * Math.PI / 180;
      const px = cx + rHarm * Math.cos(radHarm);
      const py = cy + rHarm * Math.sin(radHarm);

      // Save coords for mouse hit-testing
      sw._radarX = px;
      sw._radarY = py;

      // Outer ring colored by library badge
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = sw.badgeColor || '#FFFFFF';
      ctx.fill();

      // Inner fill with the actual harmonized color
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = sw.harmonizedHex;
      ctx.fill();

      // Pin badge icon if locked
      if (sw.locked) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px sans-serif';
        ctx.fillText('📌', px, py - 8);
      }
    });

    // 8. Tooltip on hovered point
    if (this.hoveredRadarPoint) {
      const sw = this.hoveredRadarPoint;
      const tx = Math.min(width - 90, Math.max(90, sw._radarX));
      const ty = Math.max(35, sw._radarY - 20);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 17, 26, 0.95)';
      ctx.strokeStyle = sw.badgeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx - 65, ty - 24, 130, 48, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText(sw.name, tx, ty - 12);

      ctx.font = '8px var(--font-mono)';
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.fillText(`${sw.originalHex} → ${sw.harmonizedHex} (ΔE ${sw.deltaE})`, tx, ty);
      ctx.fillText(sw.libraryName, tx, ty + 12);
      ctx.restore();
    }
  },

  _handleRadarMouseMove(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = null;
    this.results.swatches.forEach(sw => {
      if (sw._radarX !== undefined && sw._radarY !== undefined) {
        const dist = Math.hypot(mouseX - sw._radarX, mouseY - sw._radarY);
        if (dist <= 9) found = sw;
      }
    });

    if (found !== this.hoveredRadarPoint) {
      this.hoveredRadarPoint = found;
      this.drawRadarCanvas();
    }
  },

  renderComparisonList() {
    const container = document.getElementById('libHarmComparisonListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (this.deck.length === 0) {
      container.innerHTML = `<p style="padding: 20px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">Sin bibliotecas para comparar.</p>`;
      return;
    }

    const filteredDeck = this.activeComparisonView === 'all' 
      ? this.deck 
      : this.deck.filter(d => d.id === this.activeComparisonView);

    filteredDeck.forEach(lib => {
      const section = document.createElement('div');
      section.className = 'lib-harm-comp-section';

      const avgDeltaE = lib.swatches.length > 0
        ? (lib.swatches.reduce((sum, s) => sum + (s.deltaE || 0), 0) / lib.swatches.length).toFixed(1)
        : '0.0';

      section.innerHTML = `
        <div class="comp-section-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="deck-badge-dot" style="background-color: ${lib.badgeColor};"></span>
            <strong>${lib.name}</strong>
            <span class="deck-category-badge">${lib.category}</span>
          </div>
          <span class="comp-avg-delta">ΔE Promedio: ${avgDeltaE}</span>
        </div>
        <div class="comp-swatches-grid">
          <!-- Populated below -->
        </div>
      `;

      const grid = section.querySelector('.comp-swatches-grid');

      lib.swatches.forEach(sw => {
        const item = document.createElement('div');
        item.className = `comp-swatch-card ${sw.locked ? 'card-locked' : ''} ${sw.included ? '' : 'card-excluded'}`;

        item.innerHTML = `
          <div class="comp-swatch-chips-pair">
            <div class="comp-chip-wrap">
              <span class="comp-chip" style="background-color: ${sw.originalHex};" title="Original: ${sw.originalHex}"></span>
              <span class="comp-chip-label">Orig</span>
            </div>
            <span class="comp-arrow">→</span>
            <div class="comp-chip-wrap">
              <span class="comp-chip" style="background-color: ${sw.harmonizedHex};" title="Armonizado: ${sw.harmonizedHex}"></span>
              <span class="comp-chip-label">Arm</span>
            </div>
          </div>
          <div class="comp-swatch-info">
            <span class="comp-name" title="${sw.name}">${sw.name}</span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
              <span class="comp-hex">${sw.harmonizedHex}</span>
              <span class="comp-delta-badge">ΔE ${sw.deltaE}</span>
            </div>
          </div>
          <div class="comp-swatch-actions">
            <button class="comp-action-btn btn-pin" title="${sw.locked ? 'Desbloquear' : 'Fijar como inmutable 📌'}">
              ${sw.locked ? '📌' : '🔓'}
            </button>
            <input type="checkbox" class="comp-include-chk" ${sw.included ? 'checked' : ''} title="Incluir en biblioteca común">
            <button class="comp-action-btn btn-fg" title="Cargar como color frontal">🎨</button>
          </div>
        `;

        // Action events
        const pinBtn = item.querySelector('.btn-pin');
        if (pinBtn) pinBtn.addEventListener('click', () => this.toggleSwatchLocked(lib.id, sw.id));

        const chk = item.querySelector('.comp-include-chk');
        if (chk) chk.addEventListener('change', () => this.toggleSwatchIncluded(lib.id, sw.id));

        const fgBtn = item.querySelector('.btn-fg');
        if (fgBtn && this.app) {
          fgBtn.addEventListener('click', () => {
            this.app.setActiveWell('fg');
            this.app.setColorDirectly(sw.harmonizedRgb);
            this.app.showToast?.(`Color armonizado ${sw.harmonizedHex} cargado en frontal`);
          });
        }

        grid.appendChild(item);
      });

      container.appendChild(section);
    });
  },

  renderOutputHub() {
    // Consensus palette preview
    const consensusContainer = document.getElementById('libHarmConsensusChipsContainer');
    if (consensusContainer) {
      consensusContainer.innerHTML = '';
      if (this.results.consensusPalette && this.results.consensusPalette.length > 0) {
        this.results.consensusPalette.forEach(c => {
          const chip = document.createElement('div');
          chip.className = 'output-preview-chip';
          chip.style.backgroundColor = c.hex;
          chip.title = `${c.name} (${c.hex})`;
          chip.addEventListener('click', () => {
            if (this.app) {
              this.app.setActiveWell('fg');
              this.app.setColorDirectly(c.rgb || ColorMath.hexToRgb(c.hex));
              this.app.showToast?.(`Color consenso ${c.hex} cargado en frontal`);
            }
          });
          consensusContainer.appendChild(chip);
        });
      } else {
        consensusContainer.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">Sin muestras suficientes.</span>`;
      }
    }

    // Accents recommendation preview
    const accentsContainer = document.getElementById('libHarmAccentsChipsContainer');
    if (accentsContainer) {
      accentsContainer.innerHTML = '';
      if (this.results.accentRecommendations && this.results.accentRecommendations.length > 0) {
        this.results.accentRecommendations.forEach(a => {
          const chip = document.createElement('div');
          chip.className = 'output-preview-chip';
          chip.style.backgroundColor = a.hex;
          chip.title = `${a.name} (${a.hex})`;
          chip.addEventListener('click', () => {
            if (this.app) {
              this.app.setActiveWell('fg');
              this.app.setColorDirectly(a.rgb || ColorMath.hexToRgb(a.hex));
              this.app.showToast?.(`Acento ${a.hex} cargado en frontal`);
            }
          });
          accentsContainer.appendChild(chip);
        });
      }
    }
  }
};

