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
    this.palettes = this.loadPalettes();
    this.history = this.loadHistory();
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
      colors: hexColors.map(c => c.toUpperCase())
    };
    this.palettes.unshift(newPal);
    this.savePalettes();
    return newPal;
  }

  deletePalette(id) {
    this.palettes = this.palettes.filter(p => p.id !== id);
    this.savePalettes();
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
    const cleanHex = hex.toUpperCase();
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
    const blocksData = colors.map((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const colorName = `${name}_${idx + 1} (${hex})`;
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

    palette.colors.forEach((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const r = String(rgb.r).padStart(3, ' ');
      const g = String(rgb.g).padStart(3, ' ');
      const b = String(rgb.b).padStart(3, ' ');
      content += `${r} ${g} ${b}  Color ${idx + 1} (${hex})\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this._downloadBlob(blob, `${this._sanitizeFilename(name)}.gpl`);
  }

  // 3. Export as CSS Variables
  exportAsCss(palette) {
    const name = palette.name || 'GOM_Palette';
    let css = `/* GOM Color Picker - ${name} */\n:root {\n`;
    palette.colors.forEach((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      css += `  --color-${idx + 1}: ${hex}; /* rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) */\n`;
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
      colors: palette.colors.map((hex, idx) => {
        const rgb = ColorMath.hexToRgb(hex);
        const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
        const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
        const oklch = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
        return {
          id: `color_${idx + 1}`,
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
    colors.forEach((hex, i) => {
      const x = 20 + i * (swatchWidth + 12);
      const rgb = ColorMath.hexToRgb(hex);
      const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const textColor = lum > 0.4 ? '#000000' : '#ffffff';

      swatchesSvg += `
        <g transform="translate(${x}, 90)">
          <rect width="${swatchWidth}" height="180" rx="12" fill="${hex}" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.3))" />
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
