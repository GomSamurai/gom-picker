/**
 * GOM Picker - Universal Palette & Library Importer Engine
 * Supports Adobe Swatch Exchange (.ase binary parser), GIMP/Krita (.gpl parser),
 * Design Tokens (.json), CSS Variables (.css/.scss), Text/CSV/HEX lists,
 * and Smart Perceptual Deduplication with Delta-E filtering.
 * 
 * 100% Offline, Zero external dependencies.
 */

import { ColorMath } from './colorMath.js';
import { BrandPigments } from './brandPigments.js';
import { PaletteCatalogs } from './paletteCatalogs.js';

export class PaletteImporterEngine {
  /**
   * Main entry point: Parses any File object or raw data based on extension/type.
   * @param {File|Blob|string} input - File object, ArrayBuffer, or text string.
   * @param {string} [fileName=''] - Original filename for extension hint.
   * @returns {Promise<{success: boolean, title: string, colors: Array<{hex: string, name: string}>, format: string, error?: string}>}
   */
  static async parseFile(input, fileName = '') {
    const name = fileName || (input && input.name) || 'paleta_importada';
    const ext = name.split('.').pop().toLowerCase();

    try {
      if (ext === 'ase') {
        const buffer = input instanceof ArrayBuffer 
          ? input 
          : (input.arrayBuffer ? await input.arrayBuffer() : null);
        if (!buffer) throw new Error('No se pudo leer el archivo binario .ASE');
        return this.parseAseBinary(buffer, name);
      }

      // Text-based files
      let text = '';
      if (typeof input === 'string') {
        text = input;
      } else if (input.text) {
        text = await input.text();
      } else if (input instanceof ArrayBuffer) {
        text = new TextDecoder('utf-8').decode(input);
      }

      if (ext === 'gpl' || text.startsWith('GIMP Palette')) {
        return this.parseGplText(text, name);
      }

      if (ext === 'json' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          return this.parseJson(text, name);
        } catch (jsonErr) {
          // Fallback to text parsing if JSON is malformed
          return this.parseRawText(text, name);
        }
      }

      if (ext === 'css' || ext === 'scss') {
        return this.parseCssVariables(text, name);
      }

      // Default smart text/hex extractor
      return this.parseRawText(text, name);
    } catch (err) {
      console.error('[PaletteImporterEngine] Error parseando archivo:', err);
      return {
        success: false,
        title: name,
        colors: [],
        format: ext.toUpperCase(),
        error: err.message || 'Error desconocido al parsear el archivo'
      };
    }
  }

  // --- 1. ADOBE SWATCH EXCHANGE (.ASE) BINARY PARSER ---

  /**
   * Parses binary .ASE format used by Adobe Photoshop, Illustrator, InDesign, and Procreate.
   * Format specification:
   * - 4 bytes: 'ASEF' signature
   * - 2 bytes: Version Major (1)
   * - 2 bytes: Version Minor (0)
   * - 4 bytes: Number of blocks
   * Each block:
   * - 2 bytes: Block type (0x0001 = Color, 0xc001 = Group Start, 0xc002 = Group End)
   * - 4 bytes: Block length
   * - Data: Name length (2 bytes, count of UTF-16 characters including null), UTF-16BE chars,
   *         Color space ('RGB ', 'CMYK', 'LAB ', 'Gray'), Values (float32s), Type (2 bytes).
   */
  static parseAseBinary(arrayBuffer, fallbackTitle = 'Paleta Adobe ASE') {
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 12) {
      throw new Error('El archivo .ASE es demasiado pequeño o está corrupto.');
    }

    // Verify signature 'ASEF' (0x41 0x53 0x45 0x46)
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'ASEF') {
      throw new Error('Formato no válido: La firma binaria no corresponde a Adobe Swatch Exchange (ASEF).');
    }

    const versionMajor = view.getUint16(4, false);
    const versionMinor = view.getUint16(6, false);
    const numBlocks = view.getUint32(8, false);

    let offset = 12;
    const colors = [];
    let detectedGroupName = '';

    for (let b = 0; b < numBlocks && offset < view.byteLength; b++) {
      if (offset + 6 > view.byteLength) break;
      const blockType = view.getUint16(offset, false);
      const blockLength = view.getUint32(offset + 2, false);
      offset += 6;

      const blockEnd = offset + blockLength;

      if (blockType === 0xC001) {
        // Group start
        if (offset + 2 <= blockEnd) {
          const nameLen = view.getUint16(offset, false);
          offset += 2;
          let groupName = '';
          for (let i = 0; i < nameLen - 1; i++) {
            if (offset + 2 <= blockEnd) {
              groupName += String.fromCharCode(view.getUint16(offset, false));
              offset += 2;
            }
          }
          offset += 2; // skip null terminator
          if (groupName.trim()) detectedGroupName = groupName.trim();
        }
      } else if (blockType === 0x0001) {
        // Color block
        let colorName = '';
        if (offset + 2 <= blockEnd) {
          const nameLen = view.getUint16(offset, false);
          offset += 2;
          for (let i = 0; i < nameLen - 1; i++) {
            if (offset + 2 <= blockEnd) {
              colorName += String.fromCharCode(view.getUint16(offset, false));
              offset += 2;
            }
          }
          offset += 2; // skip null terminator
        }

        // Color Space (4 ASCII bytes)
        if (offset + 4 <= blockEnd) {
          const mode = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
          );
          offset += 4;

          let hex = null;

          if (mode === 'RGB ') {
            if (offset + 12 <= blockEnd) {
              const r = Math.round(ColorMath.clamp(view.getFloat32(offset, false), 0, 1) * 255);
              const g = Math.round(ColorMath.clamp(view.getFloat32(offset + 4, false), 0, 1) * 255);
              const bl = Math.round(ColorMath.clamp(view.getFloat32(offset + 8, false), 0, 1) * 255);
              offset += 12;
              hex = ColorMath.rgbToHex(r, g, bl);
            }
          } else if (mode === 'CMYK') {
            if (offset + 16 <= blockEnd) {
              const c = ColorMath.clamp(view.getFloat32(offset, false), 0, 1);
              const m = ColorMath.clamp(view.getFloat32(offset + 4, false), 0, 1);
              const y = ColorMath.clamp(view.getFloat32(offset + 8, false), 0, 1);
              const k = ColorMath.clamp(view.getFloat32(offset + 12, false), 0, 1);
              offset += 16;
              // Standard CMYK to RGB
              const r = Math.round(255 * (1 - c) * (1 - k));
              const g = Math.round(255 * (1 - m) * (1 - k));
              const bl = Math.round(255 * (1 - y) * (1 - k));
              hex = ColorMath.rgbToHex(r, g, bl);
            }
          } else if (mode === 'LAB ') {
            if (offset + 12 <= blockEnd) {
              const L = view.getFloat32(offset, false) * 100; // 0.0 - 1.0 to 0 - 100
              const a = view.getFloat32(offset + 4, false);
              const bVal = view.getFloat32(offset + 8, false);
              offset += 12;
              const rgb = this._labToRgb(L, a, bVal);
              hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
            }
          } else if (mode === 'Gray') {
            if (offset + 4 <= blockEnd) {
              const gray = Math.round(ColorMath.clamp(view.getFloat32(offset, false), 0, 1) * 255);
              offset += 4;
              hex = ColorMath.rgbToHex(gray, gray, gray);
            }
          }

          if (hex) {
            colors.push({
              hex: hex.toUpperCase(),
              name: colorName.trim() || `Muestra ${colors.length + 1}`
            });
          }
        }
      }

      // Fast-forward to block end if needed
      offset = blockEnd;
    }

    const cleanTitle = detectedGroupName || fallbackTitle.replace(/\.[^/.]+$/, '');
    return {
      success: colors.length > 0,
      title: cleanTitle,
      colors,
      format: 'Adobe ASE (Binario)',
      count: colors.length
    };
  }

  // --- 2. GIMP / KRITA / INKSCAPE PALETTE (.GPL) PARSER ---

  static parseGplText(text, fallbackTitle = 'Paleta GIMP/Krita') {
    const lines = text.split(/\r?\n/);
    const colors = [];
    let paletteName = '';

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('Name:')) {
        paletteName = trimmed.replace('Name:', '').trim();
        continue;
      }
      if (trimmed.startsWith('#') || trimmed.startsWith('GIMP Palette') || trimmed.startsWith('Columns:')) {
        continue;
      }

      // Standard GPL line: R G B [Name]
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const r = parseInt(parts[0], 10);
        const g = parseInt(parts[1], 10);
        const b = parseInt(parts[2], 10);

        if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
          const colorName = parts.slice(3).join(' ').trim();
          colors.push({
            hex: ColorMath.rgbToHex(r, g, b).toUpperCase(),
            name: colorName || `Color ${colors.length + 1}`
          });
        }
      }
    }

    const title = paletteName || fallbackTitle.replace(/\.[^/.]+$/, '');
    return {
      success: colors.length > 0,
      title,
      colors,
      format: 'GIMP/Krita GPL',
      count: colors.length
    };
  }

  // --- 3. JSON PALETTES & DESIGN TOKENS PARSER ---

  static parseJson(jsonStr, fallbackTitle = 'Paleta JSON') {
    const data = JSON.parse(jsonStr);
    const colors = [];
    let title = fallbackTitle.replace(/\.[^/.]+$/, '');
    const palettesFound = [];

    // Case A: GOM Picker Full Collection Export { app: '...', palettes: [...] }
    if (data && Array.isArray(data.palettes)) {
      data.palettes.forEach(p => {
        if (p && Array.isArray(p.colors) && p.colors.length > 0) {
          const cleanColors = p.colors.map((c, idx) => ({
            hex: this._normalizeHex(typeof c === 'string' ? c : c.hex),
            name: (typeof c === 'object' && c.name) ? c.name : `Muestra ${idx + 1}`
          }));
          palettesFound.push({
            name: p.name || 'Paleta',
            colors: cleanColors
          });
          colors.push(...cleanColors);
        }
      });
      return {
        success: colors.length > 0,
        title: data.name || (palettesFound[0]?.name) || title,
        colors,
        multiplePalettes: palettesFound.length > 1 ? palettesFound : null,
        format: 'GOM JSON Collection',
        count: colors.length
      };
    }

    // Case B: Single Palette Object { name: '...', colors: [...] }
    if (data && (Array.isArray(data.colors) || Array.isArray(data.swatches))) {
      title = data.name || data.title || title;
      const rawList = data.colors || data.swatches;
      rawList.forEach((c, idx) => {
        const hex = this._extractHexFromValue(c);
        if (hex) {
          colors.push({
            hex,
            name: (typeof c === 'object' && (c.name || c.id)) ? (c.name || c.id) : `Muestra ${idx + 1}`
          });
        }
      });
    } else if (Array.isArray(data)) {
      // Case C: Raw Array of colors ["#FF0000", "#00FF00"] or [{hex: ...}]
      data.forEach((item, idx) => {
        const hex = this._extractHexFromValue(item);
        if (hex) {
          colors.push({
            hex,
            name: (typeof item === 'object' && item.name) ? item.name : `Muestra ${idx + 1}`
          });
        }
      });
    } else if (typeof data === 'object') {
      // Case D: Design Tokens / Key-Value Map
      this._traverseTokens(data, colors);
    }

    return {
      success: colors.length > 0,
      title,
      colors,
      format: 'JSON Design Tokens',
      count: colors.length
    };
  }

  // --- 4. CSS / SCSS VARIABLES PARSER ---

  static parseCssVariables(cssText, fallbackTitle = 'Variables CSS') {
    const colors = [];
    const varRegex = /(--[a-zA-Z0-9_-]+|\$[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = varRegex.exec(cssText)) !== null) {
      const varName = match[1];
      const val = match[2].trim();
      const hex = this._parseColorStringToHex(val);
      if (hex) {
        colors.push({
          hex: hex.toUpperCase(),
          name: varName
        });
      }
    }

    if (colors.length === 0) {
      // Fallback to searching all hexes in the CSS
      return this.parseRawText(cssText, fallbackTitle);
    }

    return {
      success: colors.length > 0,
      title: fallbackTitle.replace(/\.[^/.]+$/, ''),
      colors,
      format: 'CSS Custom Properties',
      count: colors.length
    };
  }

  // --- 5. SMART TEXT / CLIPBOARD / REGEX PARSER ---

  static parseRawText(text, fallbackTitle = 'Paleta Pegada') {
    const colors = [];
    const seen = new Set();

    // 1. HEX matches (#FFF or #FFFFFF)
    const hexRegex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    let match;
    while ((match = hexRegex.exec(text)) !== null) {
      const clean = this._normalizeHex(match[0]);
      if (!seen.has(clean)) {
        seen.add(clean);
        colors.push({ hex: clean, name: clean });
      }
    }

    // 2. RGB/RGBA matches: rgb(255, 0, 0)
    const rgbRegex = /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
    while ((match = rgbRegex.exec(text)) !== null) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      if (r <= 255 && g <= 255 && b <= 255) {
        const clean = ColorMath.rgbToHex(r, g, b).toUpperCase();
        if (!seen.has(clean)) {
          seen.add(clean);
          colors.push({ hex: clean, name: `rgb(${r}, ${g}, ${b})` });
        }
      }
    }

    // 3. HSL/HSLA matches: hsl(240, 100%, 50%)
    const hslRegex = /hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/gi;
    while ((match = hslRegex.exec(text)) !== null) {
      const h = parseInt(match[1], 10);
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      const rgb = ColorMath.hslToRgb(h, s, l);
      const clean = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
      if (!seen.has(clean)) {
        seen.add(clean);
        colors.push({ hex: clean, name: `hsl(${h}, ${match[2]}%, ${match[3]}%)` });
      }
    }

    return {
      success: colors.length > 0,
      title: fallbackTitle.replace(/\.[^/.]+$/, ''),
      colors,
      format: 'Texto Detectado',
      count: colors.length
    };
  }

  // --- FILTROS INTELIGENTES Y DEDUPLICACIÓN ---

  /**
   * Applies options like deduplication, perceptual delta-E filtering, and sorting.
   * @param {Array<{hex: string, name: string}>} colors
   * @param {Object} options - { removeDuplicates: bool, deltaEThreshold: number, sort: string }
   */
  static processColors(colors, options = {}) {
    if (!Array.isArray(colors)) return [];
    let list = [...colors];

    // 1. Remove exact duplicate hexes
    if (options.removeDuplicates) {
      const seen = new Set();
      list = list.filter(item => {
        const h = item.hex.toUpperCase();
        if (seen.has(h)) return false;
        seen.add(h);
        return true;
      });
    }

    // 2. Perceptual Delta-E filtering (remove colors that look nearly identical)
    if (options.deltaEThreshold && options.deltaEThreshold > 0 && list.length > 1) {
      const filtered = [];
      list.forEach(candidate => {
        const candRgb = ColorMath.hexToRgb(candidate.hex);
        const candLab = this._rgbToLab(candRgb);
        const isTooClose = filtered.some(existing => {
          const exRgb = ColorMath.hexToRgb(existing.hex);
          const exLab = this._rgbToLab(exRgb);
          const dE = Math.sqrt(
            Math.pow(candLab.L - exLab.L, 2) +
            Math.pow(candLab.a - exLab.a, 2) +
            Math.pow(candLab.b - exLab.b, 2)
          );
          return dE < options.deltaEThreshold;
        });

        if (!isTooClose) {
          filtered.push(candidate);
        }
      });
      list = filtered;
    }

    // 3. Sorting
    if (options.sort && options.sort !== 'original') {
      list.sort((a, b) => {
        const rgbA = ColorMath.hexToRgb(a.hex);
        const rgbB = ColorMath.hexToRgb(b.hex);
        const hsvA = ColorMath.rgbToHsv(rgbA.r, rgbA.g, rgbA.b);
        const hsvB = ColorMath.rgbToHsv(rgbB.r, rgbB.g, rgbB.b);
        const lumA = (0.299 * rgbA.r + 0.587 * rgbA.g + 0.114 * rgbA.b);
        const lumB = (0.299 * rgbB.r + 0.587 * rgbB.g + 0.114 * rgbB.b);

        switch (options.sort) {
          case 'hue':
            return hsvA.h - hsvB.h;
          case 'lum-asc':
            return lumA - lumB; // oscuro a claro
          case 'lum-desc':
            return lumB - lumA; // claro a oscuro
          case 'sat-desc':
            return hsvB.s - hsvA.s; // saturado a neutro
          default:
            return 0;
        }
      });
    }

    return list;
  }

  /**
   * Generates harmony variations from an existing palette:
   * 'shadow' (noche/sombra), 'light' (luz pastel), 'muted' (tierra), 'complementary' (tensión).
   */
  static generatePaletteVariation(palette, variationType = 'shadow') {
    if (!palette || !Array.isArray(palette.colors) || palette.colors.length === 0) return null;

    const baseHexes = palette.colors.map(c => typeof c === 'string' ? c : c.hex);
    let newName = '';
    let transformedColors = [];

    switch (variationType) {
      case 'shadow':
        newName = `${palette.name} (Modo Sombra / Noche)`;
        transformedColors = baseHexes.map(hex => {
          const rgb = ColorMath.hexToRgb(hex);
          const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
          // Shift hue toward cool blue/violet (+30° if warm, -20° if cool), drop value, keep translucent saturation
          const newH = (hsv.h >= 30 && hsv.h <= 200) ? (hsv.h + 25) % 360 : (hsv.h + 15) % 360;
          const newV = Math.max(0.12, hsv.v * 0.45);
          const newS = Math.min(1, hsv.s * 0.85 + 0.1);
          const newRgb = ColorMath.hsvToRgb(newH, newS, newV);
          return ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        });
        break;

      case 'light':
        newName = `${palette.name} (Luz Solar / Pastel)`;
        transformedColors = baseHexes.map(hex => {
          const rgb = ColorMath.hexToRgb(hex);
          const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
          // Boost value, shift slightly warm (+10° towards yellow), moderate saturation
          const newH = (hsv.h + 8) % 360;
          const newV = Math.min(1, hsv.v * 1.35 + 0.2);
          const newS = Math.max(0.15, hsv.s * 0.65);
          const newRgb = ColorMath.hsvToRgb(newH, newS, newV);
          return ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        });
        break;

      case 'muted':
        newName = `${palette.name} (Tierras Nobles / Desaturada)`;
        transformedColors = baseHexes.map(hex => {
          const rgb = ColorMath.hexToRgb(hex);
          const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
          // Halve saturation, shift toward warm earth ochres (35°-45°)
          const newS = Math.max(0.08, hsv.s * 0.45);
          const newRgb = ColorMath.hsvToRgb(hsv.h, newS, hsv.v * 0.9);
          return ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        });
        break;

      case 'complementary':
        newName = `${palette.name} (Tensión Complementaria)`;
        transformedColors = baseHexes.map(hex => {
          const rgb = ColorMath.hexToRgb(hex);
          const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
          const newH = (hsv.h + 180) % 360;
          const newRgb = ColorMath.hsvToRgb(newH, hsv.s, hsv.v);
          return ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        });
        break;

      default:
        return null;
    }

    return {
      name: newName,
      colors: transformedColors
    };
  }

  // --- MÉTODOS AUXILIARES ---

  static _extractHexFromValue(val) {
    if (!val) return null;
    if (typeof val === 'string') return this._parseColorStringToHex(val);
    if (typeof val === 'object') {
      const candidate = val.hex || val.value || val.$value || val.color || val.code;
      if (candidate && typeof candidate === 'string') {
        return this._parseColorStringToHex(candidate);
      }
      if (val.r !== undefined && val.g !== undefined && val.b !== undefined) {
        return ColorMath.rgbToHex(val.r, val.g, val.b).toUpperCase();
      }
    }
    return null;
  }

  static _parseColorStringToHex(str) {
    if (!str || typeof str !== 'string') return null;
    const clean = str.trim();
    if (clean.startsWith('#')) return this._normalizeHex(clean);

    // rgb(...)
    const rgbMatch = clean.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      return ColorMath.rgbToHex(parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)).toUpperCase();
    }

    // hsl(...)
    const hslMatch = clean.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i);
    if (hslMatch) {
      const rgb = ColorMath.hslToRgb(parseInt(hslMatch[1], 10), parseInt(hslMatch[2], 10) / 100, parseInt(hslMatch[3], 10) / 100);
      return ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
    }

    return null;
  }

  static _traverseTokens(obj, results) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        const hex = this._parseColorStringToHex(val);
        if (hex) results.push({ hex, name: key });
      } else if (typeof val === 'object' && val !== null) {
        if (val.$value || val.value) {
          const hex = this._extractHexFromValue(val);
          if (hex) results.push({ hex, name: key });
        } else {
          this._traverseTokens(val, results);
        }
      }
    }
  }

  static _normalizeHex(hex) {
    let clean = (hex || '').trim().toUpperCase();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean;
  }

  static _labToRgb(L, a, b) {
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    x = (x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787) * 95.047;
    y = (y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787) * 100.000;
    z = (z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787) * 108.883;

    let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
    let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
    let bl = x * 0.000557 + y * -0.002040 + z * 0.010570;

    const toGamma = (v) => {
      v = v / 100;
      return v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v;
    };

    return {
      r: ColorMath.clamp255(toGamma(r) * 255),
      g: ColorMath.clamp255(toGamma(g) * 255),
      b: ColorMath.clamp255(toGamma(bl) * 255)
    };
  }

  static _rgbToLab(rgb) {
    const toLinear = (c) => {
      const v = c / 255;
      return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    };

    const r = toLinear(rgb.r) * 100;
    const g = toLinear(rgb.g) * 100;
    const b = toLinear(rgb.b) * 100;

    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 95.047;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 100.000;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 108.883;

    x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

    return {
      L: 116 * y - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  // --- 6. COLOR BRIDGE: PUENTE FÍSICO A PIGMENTOS REALES Y COPIC/PANTONE ---

  /**
   * Matches each color in a palette to the closest physical artist tube (Winsor&Newton, Sennelier, Golden, etc.),
   * Copic Sketch marker, and Pantone PMS ink using Delta-E in CIELAB.
   * @param {Array<string|{hex: string, name?: string}>} colors
   * @returns {Array<Object>} List of match objects per swatch
   */
  static findPhysicalColorBridge(colors) {
    if (!Array.isArray(colors) || colors.length === 0) return [];

    const tubes = BrandPigments.TUBES || [];
    const copicColors = (PaletteCatalogs.DEFAULT_LIBRARIES.find(l => l.id === 'copic_system')?.colors) || [];
    const pantoneColors = (PaletteCatalogs.DEFAULT_LIBRARIES.find(l => l.id === 'pantone_coated')?.colors) || [];

    // Precalculate Lab for tubes, copic and pantone
    const tubesWithLab = tubes.map(t => ({
      ...t,
      lab: this._rgbToLab(t.rgb || ColorMath.hexToRgb(t.hex))
    }));

    const copicWithLab = copicColors.map(c => ({
      ...c,
      lab: this._rgbToLab(ColorMath.hexToRgb(c.hex))
    }));

    const pantoneWithLab = pantoneColors.map(p => ({
      ...p,
      lab: this._rgbToLab(ColorMath.hexToRgb(p.hex))
    }));

    const calcDeltaE = (lab1, lab2) => Math.sqrt(
      Math.pow(lab1.L - lab2.L, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
    );

    return colors.map((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const name = (typeof col === 'object' && col.name) ? col.name : `Muestra #${idx + 1}`;
      const rgb = ColorMath.hexToRgb(hex);
      const lab = this._rgbToLab(rgb);

      // 1. Closest artist paint tube
      let bestTube = null;
      let minTubeDE = Infinity;
      tubesWithLab.forEach(t => {
        const dE = calcDeltaE(lab, t.lab);
        if (dE < minTubeDE) {
          minTubeDE = dE;
          bestTube = t;
        }
      });

      // 2. Closest Copic Marker
      let bestCopic = null;
      let minCopicDE = Infinity;
      copicWithLab.forEach(c => {
        const dE = calcDeltaE(lab, c.lab);
        if (dE < minCopicDE) {
          minCopicDE = dE;
          bestCopic = c;
        }
      });

      // 3. Closest Pantone PMS
      let bestPantone = null;
      let minPantoneDE = Infinity;
      pantoneWithLab.forEach(p => {
        const dE = calcDeltaE(lab, p.lab);
        if (dE < minPantoneDE) {
          minPantoneDE = dE;
          bestPantone = p;
        }
      });

      return {
        hex,
        name,
        rgb,
        lab,
        tubeMatch: bestTube ? {
          name: bestTube.name,
          brand: bestTube.brandName,
          ci: bestTube.ci,
          medium: bestTube.medium,
          hex: bestTube.hex,
          deltaE: Math.round(minTubeDE * 10) / 10
        } : null,
        copicMatch: bestCopic ? {
          name: bestCopic.name,
          hex: bestCopic.hex,
          deltaE: Math.round(minCopicDE * 10) / 10
        } : null,
        pantoneMatch: bestPantone ? {
          name: bestPantone.name,
          hex: bestPantone.hex,
          deltaE: Math.round(minPantoneDE * 10) / 10
        } : null
      };
    });
  }

  // --- 7. AUDITORÍA DE ACCESIBILIDAD Y CONTRASTE WCAG 2.1 ---

  /**
   * Computes relative luminance and pairwise contrast ratios for a palette.
   * Checks compliance with WCAG AA (>= 4.5) and AAA (>= 7.0).
   * @param {Array<string|{hex: string, name?: string}>} colors
   * @returns {Object} { swatches: [...], pairs: [...] }
   */
  static analyzeWcagAccessibility(colors) {
    if (!Array.isArray(colors) || colors.length === 0) return { swatches: [], pairs: [] };

    const getLuminance = (rgb) => {
      const a = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const swatches = colors.map((col, idx) => {
      const hex = this._normalizeHex(typeof col === 'string' ? col : col.hex);
      const name = (typeof col === 'object' && col.name) ? col.name : `Muestra #${idx + 1}`;
      const rgb = ColorMath.hexToRgb(hex);
      const lum = getLuminance(rgb);
      return { hex, name, rgb, lum };
    });

    const pairs = [];
    for (let i = 0; i < swatches.length; i++) {
      for (let j = i + 1; j < swatches.length; j++) {
        const c1 = swatches[i];
        const c2 = swatches[j];
        const l1 = Math.max(c1.lum, c2.lum);
        const l2 = Math.min(c1.lum, c2.lum);
        const ratio = (l1 + 0.05) / (l2 + 0.05);

        pairs.push({
          fg: c1.lum < c2.lum ? c1 : c2, // darker as text
          bg: c1.lum < c2.lum ? c2 : c1, // lighter as background
          colorA: c1,
          colorB: c2,
          ratio: Math.round(ratio * 100) / 100,
          passAA: ratio >= 4.5,
          passAALarge: ratio >= 3.0,
          passAAA: ratio >= 7.0
        });
      }
    }

    pairs.sort((a, b) => b.ratio - a.ratio);

    return {
      swatches,
      pairs
    };
  }
}

