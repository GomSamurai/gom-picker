/**
 * GOM Picker - Swatches & Multi-Format Palette Exporter
 * Supports Adobe Swatch Exchange (.ase binary), GIMP/Krita (.gpl),
 * CSS Custom Properties, JSON Design Tokens, and SVG Palette Cards.
 */

import { ColorMath } from './colorMath.js';

export class SwatchManager {
  constructor(storageKey = 'gom_picker_palettes') {
    this.storageKey = storageKey;
    this.historyKey = 'gom_picker_history';
    this.activeKey = 'gom_picker_active_palette_id';
    this.palettes = this.loadPalettes();
    this.history = this.loadHistory();
    this.activePaletteId = this.loadActivePaletteId();
    this.lastDeleted = null;
  }

  loadActivePaletteId() {
    try {
      const saved = localStorage.getItem(this.activeKey);
      if (saved && this.palettes.some(p => p.id === saved)) return saved;
    } catch (e) {}
    return this.palettes[0]?.id || null;
  }

  getActivePalette() {
    if (!this.palettes || this.palettes.length === 0) return null;
    const found = this.palettes.find(p => p.id === this.activePaletteId);
    return found || this.palettes[0];
  }

  setActivePalette(id) {
    if (this.palettes.some(p => p.id === id)) {
      this.activePaletteId = id;
      try {
        localStorage.setItem(this.activeKey, id);
      } catch (e) {}
      return this.getActivePalette();
    }
    return null;
  }

  // Load saved palettes from LocalStorage
  loadPalettes() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error loading palettes from storage', e);
    }

    // Default starter palettes
    return [
      {
        id: 'starter_cyber',
        name: 'Cyberpunk Neon Studio',
        colors: ['#0A0915', '#161938', '#00F0FF', '#FF007F', '#FFE600']
      },
      {
        id: 'starter_earth',
        name: 'Ocre & Terracota Cálido',
        colors: ['#2B1B17', '#5C2C16', '#C25925', '#E69C24', '#F4D06F']
      },
      {
        id: 'starter_ocean',
        name: 'Ultramar & Celadón',
        colors: ['#030C1A', '#0B2545', '#134074', '#8DA9C4', '#5CF2BD']
      }
    ];
  }

  savePalettes() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.palettes));
    } catch (e) {
      console.warn('Error saving palettes to storage', e);
    }
  }

  addPalette(name, hexColors) {
    const newPal = {
      id: 'pal_' + Date.now(),
      name: name.trim() || 'Mi Paleta ' + (this.palettes.length + 1),
      colors: hexColors.map(c => this._normalizeHex(c))
    };
    this.palettes.unshift(newPal);
    this.setActivePalette(newPal.id);
    this.savePalettes();
    return newPal;
  }

  createPalette(name, hexColors = []) {
    return this.addPalette(name, hexColors);
  }

  deletePalette(id) {
    this.palettes = this.palettes.filter(p => p.id !== id);
    if (this.activePaletteId === id) {
      this.activePaletteId = this.palettes[0]?.id || null;
      try {
        localStorage.setItem(this.activeKey, this.activePaletteId || '');
      } catch (e) {}
    }
    this.savePalettes();
  }

  // --- SWATCH-LEVEL MUTATIONS & REORDERING ---

  removeColorFromPalette(paletteId, index) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors) || index < 0 || index >= pal.colors.length) {
      return null;
    }
    const removedHex = pal.colors[index];
    pal.colors.splice(index, 1);
    this.lastDeleted = {
      paletteId: pal.id,
      paletteName: pal.name,
      index,
      hex: removedHex,
      timestamp: Date.now()
    };
    this.savePalettes();
    return { success: true, removedColor: removedHex, palette: pal };
  }

  undoLastDelete() {
    if (!this.lastDeleted) return null;
    const { paletteId, index, hex, paletteName } = this.lastDeleted;
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal) return null;

    const insertIdx = Math.min(Math.max(0, index), pal.colors.length);
    pal.colors.splice(insertIdx, 0, hex);
    this.savePalettes();

    const restored = { ...this.lastDeleted };
    this.lastDeleted = null;
    return restored;
  }

  addColorToPalette(paletteId, colorItem, index = -1) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal) return null;
    const rawHex = typeof colorItem === 'string' ? colorItem : colorItem?.hex;
    const cleanHex = this._normalizeHex(rawHex);
    const toStore = (typeof colorItem === 'object' && colorItem?.name && colorItem.name.trim())
      ? { hex: cleanHex, name: colorItem.name.trim() }
      : cleanHex;

    if (index >= 0 && index <= pal.colors.length) {
      pal.colors.splice(index, 0, toStore);
    } else {
      pal.colors.push(toStore);
    }
    this.savePalettes();
    return pal;
  }

  renameColorInPalette(paletteId, index, newName) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors) || index < 0 || index >= pal.colors.length) {
      return null;
    }
    const current = pal.colors[index];
    const hex = this._normalizeHex(typeof current === 'string' ? current : current.hex);
    const trimmed = (newName || '').trim();

    if (trimmed) {
      pal.colors[index] = { hex, name: trimmed };
    } else {
      pal.colors[index] = hex;
    }

    this.savePalettes();
    return pal.colors[index];
  }

  batchRenamePaletteColors(paletteId, namesMapOrList) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors)) return null;

    pal.colors = pal.colors.map((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      let newName = '';
      if (Array.isArray(namesMapOrList)) {
        newName = (namesMapOrList[idx] || '').trim();
      } else if (typeof namesMapOrList === 'function') {
        newName = (namesMapOrList(hex, idx, col) || '').trim();
      } else if (typeof namesMapOrList === 'object' && namesMapOrList !== null) {
        newName = (namesMapOrList[idx] || namesMapOrList[hex] || '').trim();
      }

      return newName ? { hex, name: newName } : hex;
    });

    this.savePalettes();
    return pal;
  }

  addColorToActivePalette(hex) {
    const activePal = this.getActivePalette();
    if (!activePal) return null;
    return this.addColorToPalette(activePal.id, hex);
  }

  reorderColorInPalette(paletteId, fromIndex, toIndex) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors)) return null;
    if (fromIndex < 0 || fromIndex >= pal.colors.length) return null;
    if (toIndex < 0 || toIndex >= pal.colors.length) return null;
    if (fromIndex === toIndex) return pal;

    const [moved] = pal.colors.splice(fromIndex, 1);
    pal.colors.splice(toIndex, 0, moved);
    this.savePalettes();
    return pal;
  }

  renamePalette(paletteId, newName) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal) return null;
    const trimmed = (newName || '').trim();
    if (trimmed) {
      pal.name = trimmed;
      this.savePalettes();
    }
    return pal;
  }

  duplicatePalette(paletteId, fallbackSource = null) {
    let pal = this.palettes.find(p => p.id === paletteId);
    if (!pal && fallbackSource) {
      pal = fallbackSource;
    }
    if (!pal) return null;

    const colors = Array.isArray(pal.colors) 
      ? pal.colors.map(c => typeof c === 'string' ? c : { ...c })
      : [];

    const clone = {
      id: 'pal_' + Date.now(),
      name: `${pal.name} (Copia)`,
      category: 'Paleta Personalizada',
      colors: [...colors]
    };

    this.palettes.unshift(clone);
    this.setActivePalette(clone.id);
    this.savePalettes();
    return clone;
  }

  sortPalette(paletteId, criterion = 'hue') {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors) || pal.colors.length < 2) return pal;

    if (criterion === 'reverse') {
      pal.colors.reverse();
    } else {
      pal.colors.sort((hexA, hexB) => {
        const rgbA = ColorMath.hexToRgb(hexA);
        const rgbB = ColorMath.hexToRgb(hexB);
        const hsvA = ColorMath.rgbToHsv(rgbA.r, rgbA.g, rgbA.b);
        const hsvB = ColorMath.rgbToHsv(rgbB.r, rgbB.g, rgbB.b);
        const lumA = ColorMath.getLuminance(rgbA.r, rgbA.g, rgbA.b);
        const lumB = ColorMath.getLuminance(rgbB.r, rgbB.g, rgbB.b);

        switch (criterion) {
          case 'hue':
            if (Math.abs(hsvA.h - hsvB.h) > 1) return hsvA.h - hsvB.h;
            if (Math.abs(hsvA.s - hsvB.s) > 1) return hsvA.s - hsvB.s;
            return hsvA.v - hsvB.v;
          case 'lum-asc':
            return lumA - lumB; // Más oscuro a más claro
          case 'lum-desc':
            return lumB - lumA; // Más claro a más oscuro
          case 'sat-desc':
            return hsvB.s - hsvA.s; // Más saturado a más neutro
          case 'sat-asc':
            return hsvA.s - hsvB.s;
          default:
            return 0;
        }
      });
    }

    this.savePalettes();
    return pal;
  }

  invertColorsInPalette(paletteId) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal || !Array.isArray(pal.colors)) return pal;
    pal.colors = pal.colors.map(hex => {
      const rgb = ColorMath.hexToRgb(hex);
      return ColorMath.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    });
    this.savePalettes();
    return pal;
  }

  clearPaletteColors(paletteId) {
    const pal = this.palettes.find(p => p.id === paletteId);
    if (!pal) return null;
    pal.colors = [];
    this.savePalettes();
    return pal;
  }

  // Smart parser: extracts hexes from pasted text, CSS, GPL, or JSON
  importFromText(text, paletteName = '') {
    if (!text || typeof text !== 'string') return null;
    const hexRegex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    const matches = text.match(hexRegex) || [];
    const validHexes = [];

    matches.forEach(rawHex => {
      let hex = rawHex.toUpperCase();
      if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      if (!validHexes.includes(hex)) {
        validHexes.push(hex);
      }
    });

    if (validHexes.length === 0) return null;

    const name = (paletteName || '').trim() || `Paleta Importada (${validHexes.length} colores)`;
    return this.addPalette(name, validHexes);
  }

  exportAllPalettesAsJson() {
    const payload = {
      app: 'GOM Color Picker Studio',
      exportedAt: new Date().toISOString(),
      version: '2.0',
      palettes: this.palettes
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    this._downloadBlob(blob, `gom_palettes_collection_${Date.now()}.json`);
  }

  importPalettesFromJson(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const incoming = Array.isArray(data) ? data : (data.palettes || []);
      if (!Array.isArray(incoming) || incoming.length === 0) return 0;

      let added = 0;
      incoming.forEach(p => {
        if (p && p.name && Array.isArray(p.colors) && p.colors.length > 0) {
          this.palettes.push({
            id: 'pal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: p.name,
            category: p.category || 'Importada',
            colors: p.colors.map(c => this._normalizeHex(typeof c === 'string' ? c : c.hex))
          });
          added++;
        }
      });
      if (added > 0) this.savePalettes();
      return added;
    } catch (e) {
      console.error('Error importing palettes JSON', e);
      return 0;
    }
  }

  _normalizeHex(hex) {
    let clean = (hex || '').trim().toUpperCase();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean;
  }

  // Color picking history trail
  loadHistory() {
    try {
      const data = localStorage.getItem(this.historyKey);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error loading history', e);
    }
    return ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#141419'];
  }

  addToHistory(hex) {
    const cleanHex = this._normalizeHex(hex);
    this.history = [cleanHex, ...this.history.filter(h => h !== cleanHex)].slice(0, 32);
    try {
      localStorage.setItem(this.historyKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Error saving history', e);
    }
  }

  // --- EXPORT ENGINES ---

  // 1. Export as Adobe Swatch Exchange (.ase) Binary Format
  exportAsAse(palette) {
    const colors = palette.colors;
    const name = palette.name || 'GOM_Palette';

    // Calculate buffer size
    // Header: 4 bytes 'ASEF' + 2 bytes major + 2 bytes minor + 4 bytes block count
    let bufferSize = 4 + 2 + 2 + 4;

    // For each color block:
    // Block header: 2 bytes (0x0001) + 4 bytes block length
    // Name: 2 bytes (len) + len * 2 bytes UTF-16BE
    // Color space: 4 bytes 'RGB '
    // Values: 3 * 4 bytes floats = 12 bytes
    // Color type: 2 bytes (0 = global)
    const blocksData = colors.map((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const rgb = ColorMath.hexToRgb(hex);
      const customName = (typeof col === 'object' && col.name) ? col.name.trim() : '';
      const colorName = customName || `${name}_${idx + 1} (${hex})`;
      const nameLenWithNull = colorName.length + 1;
      const blockLength = 2 + (nameLenWithNull * 2) + 4 + 12 + 2;
      return {
        rgb,
        colorName,
        nameLenWithNull,
        blockLength
      };
    });

    blocksData.forEach(b => {
      bufferSize += 2 + 4 + b.blockLength;
    });

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Header: 'ASEF'
    view.setUint8(offset++, 0x41);
    view.setUint8(offset++, 0x53);
    view.setUint8(offset++, 0x45);
    view.setUint8(offset++, 0x46);

    // Version 1.0
    view.setUint16(offset, 1, false); offset += 2;
    view.setUint16(offset, 0, false); offset += 2;

    // Block count
    view.setUint32(offset, colors.length, false); offset += 4;

    // Write Color Blocks
    blocksData.forEach(b => {
      // Block type: 0x0001 (Color)
      view.setUint16(offset, 0x0001, false); offset += 2;
      // Block length
      view.setUint32(offset, b.blockLength, false); offset += 4;

      // Color Name length (including null terminator)
      view.setUint16(offset, b.nameLenWithNull, false); offset += 2;

      // UTF-16 BE name
      for (let i = 0; i < b.colorName.length; i++) {
        view.setUint16(offset, b.colorName.charCodeAt(i), false);
        offset += 2;
      }
      view.setUint16(offset, 0, false); offset += 2; // Null terminator

      // Color Space: 'RGB '
      view.setUint8(offset++, 0x52); // 'R'
      view.setUint8(offset++, 0x47); // 'G'
      view.setUint8(offset++, 0x42); // 'B'
      view.setUint8(offset++, 0x20); // ' '

      // RGB Float values (0.0 - 1.0)
      view.setFloat32(offset, b.rgb.r / 255, false); offset += 4;
      view.setFloat32(offset, b.rgb.g / 255, false); offset += 4;
      view.setFloat32(offset, b.rgb.b / 255, false); offset += 4;

      // Color type (0 = Global, 2 = Normal)
      view.setUint16(offset, 0, false); offset += 2;
    });

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    this._downloadBlob(blob, `${this._sanitizeFilename(name)}.ase`);
  }

  // 2. Export as GIMP / Krita / Inkscape Palette (.gpl)
  exportAsGpl(palette) {
    const name = palette.name || 'GOM_Palette';
    let content = `GIMP Palette\nName: ${name}\nColumns: 4\n# Generated by GOM Color Picker Pro\n#\n`;

    palette.colors.forEach((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const rgb = ColorMath.hexToRgb(hex);
      const customName = (typeof col === 'object' && col.name) ? col.name.trim() : '';
      const r = String(rgb.r).padStart(3, ' ');
      const g = String(rgb.g).padStart(3, ' ');
      const b = String(rgb.b).padStart(3, ' ');
      content += `${r} ${g} ${b}  ${customName ? `${customName} (${hex})` : `Color ${idx + 1} (${hex})`}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this._downloadBlob(blob, `${this._sanitizeFilename(name)}.gpl`);
  }

  // 3. Export as CSS Variables
  exportAsCss(palette) {
    const name = palette.name || 'GOM_Palette';
    let css = `/* GOM Color Picker - ${name} */\n:root {\n`;
    palette.colors.forEach((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const rgb = ColorMath.hexToRgb(hex);
      const customName = (typeof col === 'object' && col.name) ? col.name.trim() : '';
      const varSlug = customName 
        ? customName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') 
        : `color-${idx + 1}`;
      css += `  --${varSlug}: ${hex}; /* ${customName || `Color ${idx + 1}`} - rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) */\n`;
    });
    css += `}\n`;
    return css;
  }

  // 4. Export as JSON Design Tokens
  exportAsJson(palette) {
    const payload = {
      name: palette.name,
      exportedAt: new Date().toISOString(),
      generator: 'GOM Color Picker Suite',
      colors: palette.colors.map((col, idx) => {
        const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
        const customName = (typeof col === 'object' && col.name) ? col.name.trim() : '';
        const rgb = ColorMath.hexToRgb(hex);
        const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
        const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
        const oklch = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
        return {
          id: `color_${idx + 1}`,
          name: customName || `Color ${idx + 1}`,
          hex,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
          hsv,
          oklch
        };
      })
    };
    return JSON.stringify(payload, null, 2);
  }

  // 5. Export as High-Res SVG Palette Presentation Card
  exportAsSvgCard(palette) {
    const colors = palette.colors;
    const name = palette.name || 'GOM Palette';
    const cardWidth = Math.max(colors.length * 120 + 40, 600);
    const cardHeight = 320;
    const swatchWidth = (cardWidth - 40 - ((colors.length - 1) * 12)) / colors.length;

    let swatchesSvg = '';
    colors.forEach((col, i) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const customName = (typeof col === 'object' && col.name) ? col.name.trim() : '';
      const x = 20 + i * (swatchWidth + 12);
      const rgb = ColorMath.hexToRgb(hex);
      const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const textColor = lum > 0.4 ? '#000000' : '#ffffff';

      swatchesSvg += `
        <g transform="translate(${x}, 90)">
          <rect width="${swatchWidth}" height="180" rx="12" fill="${hex}" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.3))" />
          ${customName ? `<text x="12" y="120" fill="${textColor}" font-family="sans-serif" font-size="11" font-weight="700">${customName}</text>` : ''}
          <text x="12" y="140" fill="${textColor}" font-family="monospace" font-size="13" font-weight="bold">${hex}</text>
          <text x="12" y="158" fill="${textColor}" opacity="0.8" font-family="sans-serif" font-size="10">RGB ${rgb.r},${rgb.g},${rgb.b}</text>
          <text x="12" y="172" fill="${textColor}" opacity="0.7" font-family="sans-serif" font-size="9">C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}</text>
        </g>
      `;
    });

    const svg = `
      <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#141419" />
            <stop offset="100%" stop-color="#0b0b0e" />
          </linearGradient>
        </defs>
        <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="url(#bg)" stroke="#272733" stroke-width="2" />
        <text x="24" y="44" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="700">${name}</text>
        <text x="24" y="66" fill="#888899" font-family="sans-serif" font-size="12">GOM Color Picker Studio • CMYK & RGB Accurate</text>
        ${swatchesSvg}
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    this._downloadBlob(blob, `${this._sanitizeFilename(name)}_card.svg`);
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _sanitizeFilename(str) {
    return str.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }
}
