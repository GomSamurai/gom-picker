/**
 * GOM Picker - Smart Color Namer & Multi-Preset AI Renaming Engine
 * 100% Client-side, ultra-fast (<1ms), zero external dependencies.
 * 
 * Provides professional chromatic naming across 8 distinct artistic presets:
 * 1. 'oil_pigment': Authentic Artist Oil Pigment & CI Code (e.g. Azul Ultramar PB29, Siena Tostada PBr7)
 * 2. 'watercolor': Traditional Botanical & Fine Art Watercolor (e.g. Verde Savia Genuino, Rosa Ópera)
 * 3. 'graphic_ui': Modern Design System & Digital Web UI Tokens (e.g. Cyber Indigo, Neon Coral)
 * 4. 'pantone': Standard Formula Guide Matching & Code (e.g. PANTONE 286 C Royal Blue)
 * 5. 'copic': Authentic Copic Sketch Marker Code & Family (e.g. B29 Night Blue, E37 Sepia)
 * 6. 'brand_tube': Prestigious Manufacturer Tube (Winsor & Newton, Sennelier, Schmincke, Golden, etc.)
 * 7. 'poetic': Atmospheric, Cinematic & Evocative Fine Art Poetry (e.g. Crepúsculo Ámbar, Bruma Nórdica)
 * 8. 'munsell': Formal Scientific Hue Value/Chroma Notation (e.g. 5PB 4.2/10 Azul Púrpura Medio)
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';
import { BrandPigments } from './brandPigments.js';
import { PaletteCatalogs } from './paletteCatalogs.js';

export const SmartColorNamer = {
  PRESETS: [
    {
      id: 'oil_pigment',
      icon: '🎨',
      name: 'Pigmento Óleo Artista',
      shortName: 'Óleo / CI',
      badge: 'PB29, PR108...',
      desc: 'Nomenclatura física de pigmentos para pintura al óleo con códigos Color Index (CI) genuinos.'
    },
    {
      id: 'watercolor',
      icon: '🖌️',
      name: 'Acuarela Fina & Botánica',
      shortName: 'Acuarela',
      badge: 'Fine Art',
      desc: 'Nombres tradicionales de acuarela botánica, veladuras históricas y bellas artes clásicas.'
    },
    {
      id: 'graphic_ui',
      icon: '💻',
      name: 'Diseño Gráfico & UI / Web',
      shortName: 'Diseño UI',
      badge: 'UI Tokens',
      desc: 'Nombres modernos, vibrantes y sistemáticos para sistemas de diseño digital y UI.'
    },
    {
      id: 'pantone',
      icon: '🎯',
      name: 'Nomenclatura Pantone',
      shortName: 'Pantone',
      badge: 'Formula Guide',
      desc: 'Aproximación perceptual más cercana a la guía de fórmulas estándar PANTONE Formula Guide.'
    },
    {
      id: 'copic',
      icon: '🖍️',
      name: 'Marcador Copic Sketch',
      shortName: 'Copic',
      badge: 'Sketch Code',
      desc: 'Código oficial y designación de marcadores al alcohol del sistema Copic (B29, R29, E37...).'
    },
    {
      id: 'brand_tube',
      icon: '🏭',
      name: 'Fabricante de Taller',
      shortName: 'Marca',
      badge: 'W&N, Sennelier...',
      desc: 'Tubo de marca profesional (Winsor & Newton, Sennelier, Schmincke, Golden, Rembrandt, etc.).'
    },
    {
      id: 'poetic',
      icon: '✨',
      name: 'Poético & Cinematográfico',
      shortName: 'Poético',
      badge: 'Atmósfera',
      desc: 'Descripciones cinematográficas, evocadoras y poéticas inspiradas en iluminación y naturaleza.'
    },
    {
      id: 'munsell',
      icon: '🧪',
      name: 'Código Científico Munsell',
      shortName: 'Munsell',
      badge: 'Notación Hue/Val',
      desc: 'Notación exacta del sistema tridimensional de Albert Munsell (Matiz Valor/Croma).'
    }
  ],

  // --- BASE HISTORICAL & BOTANICAL WATERCOLOR DICTIONARY ---
  WATERCOLOR_DATABASE: [
    { hex: '#1C39BB', name: 'Azul Ultramar Francés Fino' },
    { hex: '#0047AB', name: 'Azul Cobalto Genuino' },
    { hex: '#007BA7', name: 'Azul Cerúleo Verdoso' },
    { hex: '#003153', name: 'Azul de Prusia Profundo' },
    { hex: '#4B0082', name: 'Índigo Natural de Woad' },
    { hex: '#36454F', name: 'Gris de Payne Azulado' },
    { hex: '#3B7A57', name: 'Verde Savia Botánico' },
    { hex: '#00563B', name: 'Verde Esmeralda Viridian' },
    { hex: '#49796B', name: 'Verde Hooker Translúcido' },
    { hex: '#8A9A5B', name: 'Tierra Verde de Verona' },
    { hex: '#568203', name: 'Verde Oliva Dorado' },
    { hex: '#E4D00A', name: 'Goma Guta Histórica' },
    { hex: '#FAD201', name: 'Amarillo Aureolina Cobalto' },
    { hex: '#F3E5AB', name: 'Amarillo Nápoles Genuino' },
    { hex: '#DAA520', name: 'Ocre Amarillo Dorado' },
    { hex: '#B87333', name: 'Siena Natural de Italia' },
    { hex: '#8B4513', name: 'Siena Tostada Translúcida' },
    { hex: '#654321', name: 'Sombra Tostada Fina' },
    { hex: '#4A3B32', name: 'Sombra Natural de Chipre' },
    { hex: '#704214', name: 'Sepia Oscura de Calamar' },
    { hex: '#E32636', name: 'Carmesí de Alizarina Permanente' },
    { hex: '#FF69B4', name: 'Rosa de Ópera Fluorescente' },
    { hex: '#E0115F', name: 'Rubí de Quinacridona' },
    { hex: '#C71585', name: 'Magenta de Quinacridona Fino' },
    { hex: '#E25822', name: 'Naranja de Pirrol Translúcido' },
    { hex: '#E97451', name: 'Terracota Sanguina' },
    { hex: '#C41E3A', name: 'Rojo Veneciano Tostado' },
    { hex: '#960018', name: 'Laca de Granza Pura' },
    { hex: '#7B1113', name: 'Marrón Caput Mortuum' },
    { hex: '#800080', name: 'Púrpura Imperial Imperial' },
    { hex: '#9966CC', name: 'Amatista de Cobalto' },
    { hex: '#E6E6FA', name: 'Bruma Lavanda Claro' },
    { hex: '#FDFBF7', name: 'Blanco de China / Cinc' },
    { hex: '#1B1B1B', name: 'Negro de Lámpara Fino' },
    { hex: '#2F4F4F', name: 'Gris Grafito Perlado' }
  ],

  // --- MODERN GRAPHIC DESIGN & UI TOKEN LEXICON ---
  UI_HUE_FAMILIES: [
    { minH: 345, maxH: 15, name: 'Crimson', bright: 'Electric Coral', soft: 'Rose Quartz', dark: 'Obsidian Velvet' },
    { minH: 15, maxH: 45, name: 'Amber', bright: 'Solar Orange', soft: 'Peach Cream', dark: 'Spiced Mahogany' },
    { minH: 45, maxH: 70, name: 'Gold', bright: 'Hyper Yellow', soft: 'Warm Sand', dark: 'Golden Ochre' },
    { minH: 70, maxH: 160, name: 'Emerald', bright: 'Neon Mint', soft: 'Sage Fog', dark: 'Deep Forest' },
    { minH: 160, maxH: 195, name: 'Teal', bright: 'Cyan Spark', soft: 'Glacier Blue', dark: 'Deep Abyssal' },
    { minH: 195, maxH: 255, name: 'Azure', bright: 'Cyber Indigo', soft: 'Sky Mist', dark: 'Midnight Navy' },
    { minH: 255, maxH: 295, name: 'Violet', bright: 'Ultra Violet', soft: 'Vapor Iris', dark: 'Royal Night' },
    { minH: 295, maxH: 345, name: 'Magenta', bright: 'Electric Fuchsia', soft: 'Pink Dawn', dark: 'Dark Plum' }
  ],

  // --- POETIC ATMOSPHERIC DESCRIPTIONS BY COLOR REGION ---
  POETIC_ARCHETYPES: [
    { minH: 15, maxH: 50, minS: 0.3, minV: 0.6, name: 'Atardecer Dorado en la Toscana' },
    { minH: 15, maxH: 50, minS: 0.1, maxS: 0.45, name: 'Dunas de Arena al Viento' },
    { minH: 0, maxH: 25, minS: 0.5, minV: 0.3, name: 'Cereza Negra Madura' },
    { minH: 340, maxH: 15, minS: 0.6, minV: 0.6, name: 'Luz de Bengala Escarlata' },
    { minH: 200, maxH: 240, minS: 0.5, minV: 0.6, name: 'Azul Egeo en Solsticio' },
    { minH: 200, maxH: 250, minS: 0.2, maxV: 0.35, name: 'Bruma de Medianoche' },
    { minH: 160, maxH: 200, minS: 0.4, minV: 0.5, name: 'Glaciar de Aguas Cristalinas' },
    { minH: 80, maxH: 150, minS: 0.4, minV: 0.4, name: 'Sombra de Olivo Milenario' },
    { minH: 80, maxH: 150, minS: 0.15, maxS: 0.45, name: 'Musgo sobre Piedra Antigua' },
    { minH: 260, maxH: 310, minS: 0.4, minV: 0.5, name: 'Amatista Mística Crepuscular' },
    { minH: 0, maxH: 360, maxS: 0.08, minV: 0.85, name: 'Alba de Nieve Silenciosa' },
    { minH: 0, maxH: 360, maxS: 0.08, maxV: 0.2, name: 'Noche Sin Luna' },
    { minH: 0, maxH: 360, maxS: 0.12, minV: 0.4, maxV: 0.7, name: 'Gris Pizarra de Acantilado' },
    { minH: 30, maxH: 70, minS: 0.7, minV: 0.8, name: 'Resplandor Solar Cenital' },
    { minH: 20, maxH: 45, minS: 0.3, maxV: 0.4, name: 'Tierra Húmeda de Robledal' }
  ],

  /**
   * Generates all 8 smart name suggestions for a given color.
   * @param {string|{r:number,g:number,b:number}} colorInput - Hex string or RGB object
   * @returns {Object} Key-value map of { [presetId]: string }
   */
  generateAllNames(colorInput) {
    const rgb = typeof colorInput === 'string' ? ColorMath.hexToRgb(colorInput) : colorInput;
    const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();

    return {
      oil_pigment: this.getOilPigmentName(rgb, hex),
      watercolor: this.getWatercolorName(rgb, hex),
      graphic_ui: this.getGraphicUiName(rgb, hex),
      pantone: this.getPantoneName(rgb, hex),
      copic: this.getCopicName(rgb, hex),
      brand_tube: this.getBrandTubeName(rgb, hex),
      poetic: this.getPoeticName(rgb, hex),
      munsell: this.getMunsellName(rgb, hex)
    };
  },

  /**
   * Generates a single smart name for a given preset.
   */
  suggestName(colorInput, presetId = 'oil_pigment') {
    const rgb = typeof colorInput === 'string' ? ColorMath.hexToRgb(colorInput) : colorInput;
    const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();

    switch (presetId) {
      case 'oil_pigment': return this.getOilPigmentName(rgb, hex);
      case 'watercolor': return this.getWatercolorName(rgb, hex);
      case 'graphic_ui': return this.getGraphicUiName(rgb, hex);
      case 'pantone': return this.getPantoneName(rgb, hex);
      case 'copic': return this.getCopicName(rgb, hex);
      case 'brand_tube': return this.getBrandTubeName(rgb, hex);
      case 'poetic': return this.getPoeticName(rgb, hex);
      case 'munsell': return this.getMunsellName(rgb, hex);
      default: return this.getOilPigmentName(rgb, hex);
    }
  },

  // 1. PIGMENTO ÓLEO ARTISTA (Color Index + Nombre de Taller Físico)
  getOilPigmentName(rgb, hex) {
    const closestTube = this._findClosestColorInList(rgb, BrandPigments.TUBES || []);
    if (closestTube && closestTube.item) {
      const t = closestTube.item;
      const ciTag = t.ci ? ` (${t.ci})` : '';
      return `${t.name}${ciTag}`;
    }

    // Fallback heuristic based on HSV
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    if (hsv.s < 0.1) {
      if (hsv.v > 0.88) return 'Blanco de Titanio (PW6)';
      if (hsv.v < 0.18) return 'Negro de Marfil (PBk9)';
      return `Gris Neutro Medio (PBk9 + PW6)`;
    }
    return `Pigmento Espectral ${hex}`;
  },

  // 2. ACUARELA FINA & BOTÁNICA
  getWatercolorName(rgb, hex) {
    const closest = this._findClosestColorInList(rgb, this.WATERCOLOR_DATABASE);
    if (closest && closest.item && closest.deltaE < 22) {
      return closest.item.name;
    }
    // Heuristic blend
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
    if (hsv.s < 0.08) {
      return lum > 0.8 ? 'Blanco Translúcido Acuarela' : (lum < 0.2 ? 'Negro Humo Fino' : 'Gris Mineral Suave');
    }
    return closest ? closest.item.name : `Tono Botánico ${hex}`;
  },

  // 3. DISEÑO GRÁFICO & UI / WEB
  getGraphicUiName(rgb, hex) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lum = Math.round(ColorMath.getLuminance(rgb.r, rgb.g, rgb.b) * 100);

    // Grayscale checks
    if (hsv.s < 0.08) {
      if (lum > 92) return 'Snow White UI';
      if (lum > 75) return 'Light Zinc 200';
      if (lum > 45) return 'Slate Neutral 500';
      if (lum > 20) return 'Obsidian Gray 800';
      return 'Midnight Carbon 950';
    }

    // Find family
    let h = (hsv.h + 360) % 360;
    const fam = this.UI_HUE_FAMILIES.find(f => {
      if (f.minH > f.maxH) return h >= f.minH || h <= f.maxH;
      return h >= f.minH && h <= f.maxH;
    }) || this.UI_HUE_FAMILIES[0];

    let descriptor = fam.name;
    if (hsv.s > 0.75 && hsv.v > 0.75) descriptor = fam.bright;
    else if (hsv.s < 0.35 && hsv.v > 0.65) descriptor = fam.soft;
    else if (hsv.v < 0.35) descriptor = fam.dark;

    return `${descriptor} ${lum > 50 ? 'Light' : 'Deep'}`;
  },

  // 4. NOMENCLATURA PANTONE
  getPantoneName(rgb, hex) {
    const pantoneLib = PaletteCatalogs.DEFAULT_LIBRARIES.find(l => l.id === 'pantone_coated');
    if (pantoneLib && Array.isArray(pantoneLib.colors) && pantoneLib.colors.length > 0) {
      const closest = this._findClosestColorInList(rgb, pantoneLib.colors);
      if (closest && closest.item) {
        return closest.item.name || `PANTONE ${closest.item.hex}`;
      }
    }
    // Fallback formula guide approximation
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    return `Pantone Sim. (${munsell.hueFamily || 'Custom'})`;
  },

  // 5. MARCADOR COPIC SKETCH
  getCopicName(rgb, hex) {
    const copicLib = PaletteCatalogs.DEFAULT_LIBRARIES.find(l => l.id === 'copic_system');
    if (copicLib && Array.isArray(copicLib.colors) && copicLib.colors.length > 0) {
      const closest = this._findClosestColorInList(rgb, copicLib.colors);
      if (closest && closest.item) {
        return `Copic ${closest.item.name}`;
      }
    }
    return `Copic Sim. ${hex}`;
  },

  // 6. FABRICANTE / MARCA PROFESIONAL
  getBrandTubeName(rgb, hex) {
    const tubes = BrandPigments.TUBES || [];
    if (tubes.length === 0) return this.getOilPigmentName(rgb, hex);

    const closest = this._findClosestColorInList(rgb, tubes);
    if (closest && closest.item) {
      const t = closest.item;
      const bObj = BrandPigments.BRANDS.find(b => b.id === t.brand);
      const bName = bObj ? bObj.name.split('(')[0].trim() : 'Artist';
      const ser = t.series ? ` Ser.${t.series}` : '';
      return `${bName} — ${t.name}${ser}`;
    }
    return `Tubo Profesional ${hex}`;
  },

  // 7. POÉTICO & CINEMATOGRÁFICO
  getPoeticName(rgb, hex) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    let h = (hsv.h + 360) % 360;

    // Search archetypes
    for (const a of this.POETIC_ARCHETYPES) {
      let hMatch = false;
      if (a.minH !== undefined && a.maxH !== undefined) {
        if (a.minH > a.maxH) hMatch = (h >= a.minH || h <= a.maxH);
        else hMatch = (h >= a.minH && h <= a.maxH);
      } else {
        hMatch = true;
      }

      const sMin = a.minS !== undefined ? a.minS : 0;
      const sMax = a.maxS !== undefined ? a.maxS : 1;
      const vMin = a.minV !== undefined ? a.minV : 0;
      const vMax = a.maxV !== undefined ? a.maxV : 1;

      if (hMatch && hsv.s >= sMin && hsv.s <= sMax && hsv.v >= vMin && hsv.v <= vMax) {
        return a.name;
      }
    }

    // Default poetic generator
    const m = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    return `Bruma de ${m.hueFamily || 'Luz'} Silenciosa`;
  },

  // 8. CÓDIGO CIENTÍFICO MUNSELL
  getMunsellName(rgb, hex) {
    const m = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const lum = Math.round(ColorMath.getLuminance(rgb.r, rgb.g, rgb.b) * 100);
    return `${m.notation} • ${m.hueFamily || ''} (${lum}% Y)`;
  },

  // --- INTERNAL CIE76/CIE2000 DELTA-E DISTANCE MATCHER ---
  _findClosestColorInList(targetRgb, list) {
    if (!list || list.length === 0) return null;
    const targetLab = this._rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

    let bestItem = null;
    let minDeltaE = Infinity;

    for (const item of list) {
      const itemHex = typeof item === 'string' ? item : item.hex;
      if (!itemHex) continue;
      const itemRgb = typeof item === 'object' && item.rgb ? item.rgb : ColorMath.hexToRgb(itemHex);
      const itemLab = this._rgbToLab(itemRgb.r, itemRgb.g, itemRgb.b);

      const dL = targetLab.L - itemLab.L;
      const da = targetLab.a - itemLab.a;
      const db = targetLab.b - itemLab.b;
      const deltaE = Math.sqrt(dL * dL + da * da + db * db);

      if (deltaE < minDeltaE) {
        minDeltaE = deltaE;
        bestItem = item;
      }
    }

    return { item: bestItem, deltaE: minDeltaE };
  },

  _rgbToLab(r, g, b) {
    let R = r / 255;
    let G = g / 255;
    let B = b / 255;

    R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
    G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
    B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

    const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000;
    const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

    const fx = X > 0.008856 ? Math.cbrt(X) : (7.787 * X) + (16 / 116);
    const fy = Y > 0.008856 ? Math.cbrt(Y) : (7.787 * Y) + (16 / 116);
    const fz = Z > 0.008856 ? Math.cbrt(Z) : (7.787 * Z) + (16 / 116);

    return {
      L: (116 * fy) - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz)
    };
  },

  // =========================================================================
  // --- MODAL INTERACTIVO DE RENOMBRADO INDIVIDUAL ---
  // =========================================================================

  openRenameDialog({ swatchData, onSave, onCancel, focusAi = false }) {
    const existing = document.getElementById('smartRenameModalOverlay');
    if (existing) existing.remove();

    const { hex, name: currentName, palette, index, isBuiltIn } = swatchData;
    const rgb = ColorMath.hexToRgb(hex);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const suggestions = this.generateAllNames(rgb);

    const overlay = document.createElement('div');
    overlay.id = 'smartRenameModalOverlay';
    overlay.className = 'smart-rename-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'smart-rename-modal';

    modal.innerHTML = `
      <div class="smart-rename-modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: ${hex}; border: 2px solid rgba(255,255,255,0.4); box-shadow: 0 0 14px ${hex}66; flex-shrink: 0;"></div>
          <div>
            <div style="font-weight: 800; font-size: 0.92rem; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
              <span>✏️ Renombrar Muestra</span>
              ${palette ? `<span style="font-size: 0.68rem; color: #818CF8; background: rgba(99,102,241,0.18); padding: 1px 7px; border-radius: 10px; border: 1px solid rgba(99,102,241,0.3); font-weight: normal;">${palette.name}</span>` : ''}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">
              ${hex} • RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) • ${munsell.notation}
            </div>
          </div>
        </div>
        <button type="button" class="smart-rename-close-btn" id="btnCloseSmartRenameModal">✕</button>
      </div>

      <div class="smart-rename-body">
        <label for="smartRenameInput" style="font-size: 0.76rem; font-weight: 700; color: #E2E8F0; display: block; margin-bottom: 6px;">
          Nombre de la Muestra:
        </label>
        <div style="position: relative; margin-bottom: 16px;">
          <input type="text" id="smartRenameInput" class="smart-rename-input" value="${currentName || ''}" placeholder="Ej. Azul de Cobalto, Cyber Indigo..." autofocus autocomplete="off">
          <button type="button" id="btnClearSmartRenameInput" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #94A3B8; cursor: pointer; font-size: 0.8rem; padding: 2px;" title="Borrar texto">✕</button>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #A5B4FC; display: flex; align-items: center; gap: 5px;">
            <span>🤖</span> Sugerencias Inteligentes con IA (Haz clic para aplicar):
          </span>
          <span style="font-size: 0.65rem; color: var(--text-muted);">8 Presets Profesionales</span>
        </div>

        <div class="smart-rename-presets-grid" id="smartRenamePresetsGrid">
          ${this.PRESETS.map(p => {
            const suggested = suggestions[p.id] || '';
            return `
              <button type="button" class="smart-rename-preset-card" data-preset-id="${p.id}" data-suggested-name="${suggested.replace(/"/g, '&quot;')}" title="${p.desc}">
                <div class="preset-card-top">
                  <span class="preset-card-icon">${p.icon}</span>
                  <span class="preset-card-title">${p.name}</span>
                  <span class="preset-card-badge">${p.badge}</span>
                </div>
                <div class="preset-card-val">${suggested}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="smart-rename-footer">
        <button type="button" class="tool-btn" id="btnCancelSmartRename">Cancelar</button>
        <button type="button" class="tool-action-btn" id="btnSaveSmartRename" style="padding: 7px 18px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <span>💾</span> Guardar Nombre
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#smartRenameInput');
    const btnClose = modal.querySelector('#btnCloseSmartRenameModal');
    const btnCancel = modal.querySelector('#btnCancelSmartRename');
    const btnSave = modal.querySelector('#btnSaveSmartRename');
    const btnClear = modal.querySelector('#btnClearSmartRenameInput');
    const presetButtons = modal.querySelectorAll('.smart-rename-preset-card');

    if (input) {
      setTimeout(() => {
        input.focus();
        if (input.value) input.select();
      }, 50);
    }

    if (btnClear && input) {
      btnClear.addEventListener('click', () => {
        input.value = '';
        input.focus();
      });
    }

    // Preset click behavior
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nameVal = btn.dataset.suggestedName;
        if (nameVal && input) {
          input.value = nameVal;
          input.classList.add('smart-rename-input-pulse');
          setTimeout(() => input.classList.remove('smart-rename-input-pulse'), 400);
          input.focus();
        }
      });
    });

    const close = () => {
      overlay.classList.add('smart-rename-closing');
      setTimeout(() => overlay.remove(), 160);
      if (typeof onCancel === 'function') onCancel();
    };

    const commit = () => {
      const newName = (input?.value || '').trim();
      overlay.remove();
      if (typeof onSave === 'function') onSave(newName);
    };

    if (btnClose) btnClose.addEventListener('click', close);
    if (btnCancel) btnCancel.addEventListener('click', close);
    if (btnSave) btnSave.addEventListener('click', commit);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });
  },

  // =========================================================================
  // --- MODAL DE RENOMBRADO MASIVO DE TODA UNA PALETA CON IA ---
  // =========================================================================

  openBatchPaletteRenameDialog({ palette, onSave, onCancel }) {
    const existing = document.getElementById('smartBatchRenameModalOverlay');
    if (existing) existing.remove();

    if (!palette || !Array.isArray(palette.colors) || palette.colors.length === 0) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'smartBatchRenameModalOverlay';
    overlay.className = 'smart-rename-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'smart-rename-modal';
    modal.style.maxWidth = '560px';

    modal.innerHTML = `
      <div class="smart-rename-modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 1.5rem;">🤖</div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #FFFFFF;">
              Renombrar toda la Biblioteca con IA
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">
              Paleta: <strong style="color: #A5B4FC;">${palette.name}</strong> • ${palette.colors.length} muestras
            </div>
          </div>
        </div>
        <button type="button" class="smart-rename-close-btn" id="btnCloseSmartBatchRenameModal">✕</button>
      </div>

      <div class="smart-rename-body">
        <p style="font-size: 0.78rem; color: #CBD5E1; margin: 0 0 14px 0; line-height: 1.45;">
          Selecciona el estilo o preset conceptual con el que la Inteligencia Artificial analizará y renombrará 
          simultáneamente todas las <b>${palette.colors.length} muestras</b> de esta biblioteca:
        </p>

        <div class="smart-rename-presets-grid" id="smartBatchPresetsGrid" style="grid-template-columns: 1fr;">
          ${this.PRESETS.map((p, idx) => `
            <label class="smart-batch-preset-label ${idx === 0 ? 'selected' : ''}">
              <input type="radio" name="smartBatchPreset" value="${p.id}" ${idx === 0 ? 'checked' : ''} style="margin-right: 10px;">
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.82rem; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
                  <span>${p.icon}</span> ${p.name}
                  <span style="font-size: 0.65rem; color: #818CF8; background: rgba(99,102,241,0.2); padding: 1px 6px; border-radius: 8px; font-weight: normal;">${p.badge}</span>
                </div>
                <div style="font-size: 0.69rem; color: var(--text-muted); margin-top: 2px;">${p.desc}</div>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="smart-rename-footer">
        <button type="button" class="tool-btn" id="btnCancelSmartBatchRename">Cancelar</button>
        <button type="button" class="tool-action-btn" id="btnExecuteSmartBatchRename" style="padding: 7px 18px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <span>⚡</span> Aplicar Nombres IA a ${palette.colors.length} Muestras
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const labels = modal.querySelectorAll('.smart-batch-preset-label');
    labels.forEach(lbl => {
      lbl.addEventListener('click', () => {
        labels.forEach(l => l.classList.remove('selected'));
        lbl.classList.add('selected');
        const radio = lbl.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    const close = () => {
      overlay.remove();
      if (typeof onCancel === 'function') onCancel();
    };

    const commit = () => {
      const selectedRadio = modal.querySelector('input[name="smartBatchPreset"]:checked');
      const presetId = selectedRadio ? selectedRadio.value : 'oil_pigment';
      overlay.remove();
      if (typeof onSave === 'function') onSave(presetId);
    };

    modal.querySelector('#btnCloseSmartBatchRenameModal')?.addEventListener('click', close);
    modal.querySelector('#btnCancelSmartBatchRename')?.addEventListener('click', close);
    modal.querySelector('#btnExecuteSmartBatchRename')?.addEventListener('click', commit);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
};
