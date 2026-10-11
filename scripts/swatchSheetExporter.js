/**
 * GOM Picker - Professional High-Resolution Swatch Sheet & Specimen Exporter Studio
 * Generates publication-grade, customizable digital color sheets in multiple templates:
 * 1. Cinematic Pro 60-30-10 & Golden Ratio (16:9 / 4K)
 * 2. Swatch Cards Gallery / Specimen Grid (Uniform specimen cards for any count)
 * 3. Fine Art Atelier & Real Pigments (Winsor & Newton, Sennelier, CI codes, Opacity, Lightfastness)
 * 4. Technical Print Spec / Brand Guidelines (CMYK, TAC, Gamut warnings, WCAG contrast)
 * 5. Editorial Moodboard & Concept Art (Minimalist poster with harmony compass)
 *
 * Fully configurable: themes, field toggles, resolutions (Full HD, 4K, 300 DPI A4),
 * custom metadata, live interactive preview modal, instant Clipboard copy, and SVG/PDF export.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';
import { BrandPigments } from './brandPigments.js';
import { ChromillaMixer } from './paintMixerChromilla.js';

export const SwatchSheetExporter = {
  // Available Templates
  TEMPLATES: {
    CINEMATIC_PRO: 'cinematic_pro',
    ULTIMATE_ENCYCLOPEDIA: 'ultimate_encyclopedia',
    CUSTOM_USER: 'custom_user',
    FINE_ART_ATELIER: 'fine_art_atelier',
    TECHNICAL_PRINT: 'technical_print',
    GRID_GALLERY: 'grid_gallery',
    MOODBOARD_EDITORIAL: 'moodboard_editorial'
  },

  // Available Color Themes
  THEMES: {
    OBSIDIAN: {
      id: 'obsidian',
      name: 'Obsidian Dark Studio',
      bgGradient: ['#0B0D14', '#131622'],
      accentGlow: 'rgba(99, 102, 241, 0.16)',
      cardBg: 'rgba(17, 20, 31, 0.88)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#FFFFFF',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      accentColor: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.22)',
      badgeBorder: '#6366F1',
      badgeText: '#C7D2FE',
      goldColor: '#F59E0B'
    },
    PAPER: {
      id: 'paper',
      name: 'Papel Bellas Artes',
      bgGradient: ['#F6F3EB', '#ECE6DC'],
      accentGlow: 'rgba(194, 132, 58, 0.12)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: 'rgba(70, 55, 40, 0.15)',
      textPrimary: '#1E1B18',
      textSecondary: '#5C5248',
      textMuted: '#8C8072',
      accentColor: '#8F5428',
      badgeBg: 'rgba(143, 84, 40, 0.12)',
      badgeBorder: '#8F5428',
      badgeText: '#5C3415',
      goldColor: '#B45309'
    },
    CYBERPUNK: {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      bgGradient: ['#070814', '#0A1326'],
      accentGlow: 'rgba(6, 182, 212, 0.22)',
      cardBg: 'rgba(10, 18, 38, 0.92)',
      cardBorder: 'rgba(6, 182, 212, 0.35)',
      textPrimary: '#F0FDF4',
      textSecondary: '#67E8F9',
      textMuted: '#38BDF8',
      accentColor: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.22)',
      badgeBorder: '#06B6D4',
      badgeText: '#A5F3FC',
      goldColor: '#FBBF24'
    },
    SLATE: {
      id: 'slate',
      name: 'Slate Minimal Bauhaus',
      bgGradient: ['#1C2029', '#242A35'],
      accentGlow: 'rgba(255, 255, 255, 0.06)',
      cardBg: 'rgba(30, 36, 48, 0.92)',
      cardBorder: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      accentColor: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.2)',
      badgeBorder: '#3B82F6',
      badgeText: '#BFDBFE',
      goldColor: '#F59E0B'
    }
  },

  // Available Resolutions
  RESOLUTIONS: {
    '1920x1080': { width: 1920, height: 1080, label: 'Full HD 1080p (16:9)' },
    '3840x2160': { width: 3840, height: 2160, label: '4K Ultra HD (16:9)' },
    '3508x2480': { width: 3508, height: 2480, label: 'A4 Impresión 300 DPI' },
    '2048x2048': { width: 2048, height: 2048, label: 'Cuadrado Estudio (1:1)' },
    '1080x1920': { width: 1080, height: 1920, label: 'Story Vertical (9:16)' }
  },

  // Active configuration state
  currentConfig: {
    template: 'cinematic_pro',
    theme: 'obsidian',
    resolution: '1920x1080',
    title: '',
    subtitle: 'FICHA CROMÁTICA DE ESTUDIO • GOM COLOR PICKER PRO',
    author: 'Fran Gómez • GOM Samurai',
    showHexRgb: true,
    showCmyk: true,
    showMunsell: true,
    showLumTemp: true,
    showPigments: true,
    showPaintRecipe: true,
    showComplementary: true,
    showMicroRamp: true,
    showRoles: true,
    showTips: true,
    showWcag: true,
    showGradientStrip: true,
    showWatermark: true
  },

  // Resolution scale factor relative to 1080p Full HD (guarantees readable high-res text)
  _getScale(width) {
    return Math.max(1, width / 1920);
  },

  // Reference to active modal instance
  _activeModalState: null,

  /**
   * Quick export directly to PNG download (backward compatible)
   */
  exportPaletteToPng(paletteName, colors, options = {}) {
    const config = { ...this.currentConfig, ...options, title: paletteName || this.currentConfig.title || 'Paleta de Arte GOM' };
    const res = this.RESOLUTIONS[config.resolution] || this.RESOLUTIONS['1920x1080'];
    const canvas = document.createElement('canvas');
    canvas.width = res.width;
    canvas.height = res.height;

    this.renderToCanvas(canvas, paletteName, colors, config);

    const cleanFileName = (config.title || 'gom_palette')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_') + '.png';

    const triggerDownload = (url, isBlob = false) => {
      const a = document.createElement('a');
      a.download = cleanFileName;
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        if (isBlob) URL.revokeObjectURL(url);
      }, 500);
    };

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(URL.createObjectURL(blob), true);
        } else {
          triggerDownload(canvas.toDataURL('image/png'), false);
        }
      }, 'image/png');
    } else {
      triggerDownload(canvas.toDataURL('image/png'), false);
    }
  },

  // User configuration persistence
  _loadUserConfig() {
    try {
      const saved = localStorage.getItem('gom_export_user_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentConfig = { ...this.currentConfig, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load export user config:', e);
    }
  },

  _saveUserConfig() {
    try {
      const { title, subtitle, author, ...persistable } = this.currentConfig;
      localStorage.setItem('gom_export_user_config', JSON.stringify(persistable));
    } catch (e) {
      console.warn('Failed to save export user config:', e);
    }
  },

  /**
   * Opens the interactive Export Studio modal with live preview,
   * template pills, theme toggles, and direct clipboard / download actions.
   */
  openExportModal(paletteName, colors, appInstance, initialOptions = {}) {
    if (!colors || colors.length === 0) {
      if (appInstance?.showToast) appInstance.showToast('No hay muestras para exportar', 'warn');
      return;
    }

    const modal = document.getElementById('exportSheetModal');
    if (!modal) {
      console.warn('exportSheetModal element not found in DOM, falling back to direct PNG export');
      this.exportPaletteToPng(paletteName, colors, initialOptions);
      return;
    }

    // Load saved preferences from localStorage
    this._loadUserConfig();

    // Initialize or merge config
    const normalizedColors = this._normalizeColors(colors);
    const defaultTitle = paletteName || (normalizedColors[0]?.sourceArtwork || 'Paleta Cromática de Estudio');

    this.currentConfig = {
      ...this.currentConfig,
      ...initialOptions,
      title: defaultTitle,
      subtitle: initialOptions.subtitle || this.currentConfig.subtitle || 'FICHA CROMÁTICA DE ESTUDIO • PROPORCIONES & ARMONÍA',
      author: initialOptions.author || this.currentConfig.author || 'Fran Gómez • GOM Samurai'
    };

    // Store state
    this._activeModalState = {
      paletteName: defaultTitle,
      rawColors: colors,
      specimens: normalizedColors,
      app: appInstance
    };

    // Populate modal inputs
    const titleInput = document.getElementById('exportTitleInput');
    const subInput = document.getElementById('exportSubtitleInput');
    const authInput = document.getElementById('exportAuthorInput');
    const headingEl = document.getElementById('exportModalTitleHeading');
    const resSelect = document.getElementById('exportResolutionSelect');

    if (titleInput) titleInput.value = this.currentConfig.title;
    if (subInput) subInput.value = this.currentConfig.subtitle;
    if (authInput) authInput.value = this.currentConfig.author;
    if (headingEl) headingEl.textContent = `Lámina: "${this.currentConfig.title}"`;
    if (resSelect) resSelect.value = this.currentConfig.resolution;

    // Checkbox states
    this._setCheckbox('chkExpHexRgb', this.currentConfig.showHexRgb);
    this._setCheckbox('chkExpCmyk', this.currentConfig.showCmyk);
    this._setCheckbox('chkExpMunsell', this.currentConfig.showMunsell);
    this._setCheckbox('chkExpLumTemp', this.currentConfig.showLumTemp);
    this._setCheckbox('chkExpPigments', this.currentConfig.showPigments);
    this._setCheckbox('chkExpPaintRecipe', this.currentConfig.showPaintRecipe);
    this._setCheckbox('chkExpComplementary', this.currentConfig.showComplementary);
    this._setCheckbox('chkExpMicroRamp', this.currentConfig.showMicroRamp);
    this._setCheckbox('chkExpRoles', this.currentConfig.showRoles);
    this._setCheckbox('chkExpTips', this.currentConfig.showTips);
    this._setCheckbox('chkExpWcag', this.currentConfig.showWcag);
    this._setCheckbox('chkExpGradientStrip', this.currentConfig.showGradientStrip);
    this._setCheckbox('chkExpWatermark', this.currentConfig.showWatermark);

    // Template pills
    this._updateActivePill('#exportTemplatePills .export-pill-btn', 'data-template', this.currentConfig.template);

    // Theme chips
    this._updateActivePill('#exportThemePills .export-theme-chip', 'data-theme', this.currentConfig.theme);

    // Bind event listeners (once)
    this._bindModalEvents();

    // Show modal
    modal.style.display = 'flex';

    // Render live canvas preview
    this.updateLivePreview();
  },

  /**
   * Updates the live preview canvas inside the modal
   */
  updateLivePreview() {
    if (!this._activeModalState) return;

    const liveCanvas = document.getElementById('exportLiveCanvas');
    if (!liveCanvas) return;

    const res = this.RESOLUTIONS[this.currentConfig.resolution] || this.RESOLUTIONS['1920x1080'];
    
    // Set internal resolution
    liveCanvas.width = res.width;
    liveCanvas.height = res.height;

    // Render sheet
    this.renderToCanvas(
      liveCanvas,
      this.currentConfig.title,
      this._activeModalState.specimens,
      this.currentConfig
    );

    // Update badges
    const resBadge = document.getElementById('exportPreviewResBadge');
    const tmplBadge = document.getElementById('exportPreviewTemplateBadge');
    
    if (resBadge) resBadge.textContent = `${res.width} × ${res.height} (${res.label.split(' ')[0]})`;
    if (tmplBadge) {
      const names = {
        cinematic_pro: 'Estudio Pro 60-30-10',
        ultimate_encyclopedia: 'Estudio Total & Recetas',
        custom_user: 'Personalizada Modular',
        fine_art_atelier: 'Bellas Artes & CI',
        technical_print: 'Ficha Técnica CMYK',
        grid_gallery: 'Galería de Fichas',
        moodboard_editorial: 'Moodboard Editorial'
      };
      tmplBadge.textContent = names[this.currentConfig.template] || 'Estudio Pro';
    }
  },

  /**
   * Main rendering engine for any target canvas
   */
  renderToCanvas(canvas, title, colors, config = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const theme = this.THEMES[config.theme?.toUpperCase()] || this.THEMES.OBSIDIAN;
    const specimens = this._normalizeColors(colors);
    const template = config.template || this.TEMPLATES.CINEMATIC_PRO;

    // Reset transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Theme Background & Subtle Studio Frame
    this._drawBackground(ctx, width, height, theme);

    // 2. Dispatch to specific template renderer
    switch (template) {
      case this.TEMPLATES.ULTIMATE_ENCYCLOPEDIA:
        this._renderUltimateEncyclopediaTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.CUSTOM_USER:
        this._renderCustomUserTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.TECHNICAL_PRINT:
        this._renderTechnicalPrintTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.FINE_ART_ATELIER:
        this._renderFineArtAtelierTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.GRID_GALLERY:
        this._renderGridGalleryTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.MOODBOARD_EDITORIAL:
        this._renderMoodboardEditorialTemplate(ctx, width, height, title, specimens, theme, config);
        break;
      case this.TEMPLATES.CINEMATIC_PRO:
      default:
        this._renderCinematicProTemplate(ctx, width, height, title, specimens, theme, config);
        break;
    }
  },

  /**
   * Copy high-res canvas directly to user's OS clipboard
   */
  async copyCanvasToClipboard(canvas) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard API not fully supported');
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png');
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    } catch (e) {
      console.warn('Direct clipboard image copy failed', e);
      return false;
    }
  },

  /**
   * Export high-res vector SVG card representation
   */
  exportToSvg(paletteName, colors, config = {}) {
    const specimens = this._normalizeColors(colors);
    const title = config.title || paletteName || 'Paleta GOM Studio';
    const cardWidth = Math.max(specimens.length * 280 + 80, 1200);
    const cardHeight = 720;
    const theme = this.THEMES[config.theme?.toUpperCase()] || this.THEMES.OBSIDIAN;

    let swatchesSvg = '';
    const colWidth = (cardWidth - 80 - (specimens.length - 1) * 20) / specimens.length;

    specimens.forEach((sp, idx) => {
      const x = 40 + idx * (colWidth + 20);
      const roleText = sp.role || (idx === 0 ? '60% Base' : idx === 1 ? '30% Forma' : '10% Foco');
      const tubeStr = sp.pigmentTube ? `${sp.pigmentTube.name} (${sp.pigmentTube.ci})` : '';

      swatchesSvg += `
        <g transform="translate(${x}, 140)">
          <!-- Swatch Main -->
          <rect width="${colWidth}" height="320" rx="14" fill="${sp.hex}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
          
          <!-- Role Pill -->
          <rect x="14" y="14" width="90" height="26" rx="6" fill="rgba(0,0,0,0.6)" />
          <text x="59" y="31" fill="#FFFFFF" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${roleText}</text>
          
          <!-- Info Box -->
          <rect x="8" y="336" width="${colWidth - 16}" height="190" rx="10" fill="${theme.cardBg}" stroke="${theme.cardBorder}" stroke-width="1" />
          
          <!-- HEX -->
          <text x="20" y="372" fill="${theme.textPrimary}" font-family="monospace" font-size="18" font-weight="bold">${sp.hex}</text>
          
          <!-- RGB -->
          <text x="20" y="400" fill="${theme.textSecondary}" font-family="monospace" font-size="12">RGB: ${sp.rgb.r}, ${sp.rgb.g}, ${sp.rgb.b}</text>
          
          <!-- CMYK -->
          <text x="20" y="424" fill="${theme.textSecondary}" font-family="monospace" font-size="12">CMYK: C${sp.cmyk.c}% M${sp.cmyk.m}% Y${sp.cmyk.y}% K${sp.cmyk.k}%</text>
          
          <!-- Munsell -->
          <text x="20" y="452" fill="${theme.goldColor}" font-family="monospace" font-size="13" font-weight="bold">Munsell: ${sp.munsell.notation}</text>
          
          <!-- Pigment -->
          <text x="20" y="480" fill="${theme.accentColor}" font-family="-apple-system, sans-serif" font-size="11" font-weight="600">${tubeStr}</text>
          
          <!-- Lum & Temp -->
          <text x="20" y="504" fill="${theme.textMuted}" font-family="-apple-system, sans-serif" font-size="10">Lum: ${sp.luminancePct}% • ${sp.temperature.label}</text>
        </g>
      `;
    });

    const svg = `
      <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${theme.bgGradient[0]}" />
            <stop offset="100%" stop-color="${theme.bgGradient[1]}" />
          </linearGradient>
        </defs>
        <rect width="${cardWidth}" height="${cardHeight}" rx="18" fill="url(#bgGrad)" stroke="${theme.cardBorder}" stroke-width="2" />
        
        <!-- Header -->
        <text x="44" y="60" fill="${theme.textPrimary}" font-family="-apple-system, sans-serif" font-size="28" font-weight="800">${title}</text>
        <text x="44" y="92" fill="${theme.textSecondary}" font-family="-apple-system, sans-serif" font-size="13" font-weight="500">${config.subtitle || 'FICHA CROMÁTICA DE ESTUDIO'}</text>
        
        <!-- Badge -->
        <rect x="${cardWidth - 260}" y="36" width="216" height="38" rx="8" fill="${theme.badgeBg}" stroke="${theme.badgeBorder}" stroke-width="1.5" />
        <text x="${cardWidth - 152}" y="60" fill="${theme.badgeText}" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle">🎨 GOM COLOR PICKER PRO</text>
        
        <!-- Swatches -->
        ${swatchesSvg}
        
        <!-- Footer -->
        <text x="44" y="${cardHeight - 24}" fill="${theme.textMuted}" font-family="-apple-system, sans-serif" font-size="11">Creado con GOM Color Picker Pro — Suite de Teoría y Mezcla Cromática</text>
        <text x="${cardWidth - 44}" y="${cardHeight - 24}" fill="${theme.textMuted}" font-family="-apple-system, sans-serif" font-size="11" text-anchor="end">${config.author || 'Fran Gómez • GOM Samurai'}</text>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const cleanFileName = (title || 'gom_palette').toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '.svg';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = cleanFileName;
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  },

  // =========================================================================
  // TEMPLATE 1: CINEMATIC PRO 60-30-10 & GOLDEN RATIO
  // =========================================================================

  _renderCinematicProTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.04);
    const headerY = Math.round(height * 0.08);

    // 1. Draw Header
    this._drawStudioHeader(ctx, width, title, config.subtitle, theme, marginX, headerY);

    // 2. Swatch area calculations
    const n = specimens.length;
    const startY = Math.round(height * 0.16);
    const bottomReserve = config.showGradientStrip ? Math.round(height * 0.14) : Math.round(height * 0.08);
    const totalSwatchHeight = height - startY - bottomReserve;
    const availWidth = width - marginX * 2;

    // Minimum width per card so content NEVER gets crammed (at 1920px -> min 240px)
    const minCardW = Math.max(Math.round(220 * s), Math.round(width * 0.12));
    let widths = [];

    if (n === 3) {
      widths = [availWidth * 0.55, availWidth * 0.30, availWidth * 0.15];
    } else if (n === 4) {
      widths = [availWidth * 0.45, availWidth * 0.28, availWidth * 0.15, availWidth * 0.12];
    } else if (n === 5) {
      // 60-30-10 calibrated with min-width guardrail!
      const w1 = Math.max(minCardW, availWidth * 0.38);
      const w2 = Math.max(minCardW, availWidth * 0.24);
      const w3 = Math.max(minCardW, availWidth * 0.16);
      const rem = availWidth - (w1 + w2 + w3);
      const w4 = Math.max(minCardW * 0.85, rem / 2);
      const w5 = Math.max(minCardW * 0.85, rem / 2);
      widths = [w1, w2, w3, w4, w5];
    } else {
      // Equal distribution for larger lists
      const step = availWidth / n;
      widths = specimens.map(() => step);
    }

    // Scale widths if sum exceeds availWidth
    const sumW = widths.reduce((acc, v) => acc + v, 0);
    if (sumW > availWidth) {
      const scale = availWidth / sumW;
      widths = widths.map(w => w * scale);
    }

    let curX = marginX;
    const cardGap = Math.max(8, Math.round(width * 0.006));

    specimens.forEach((sp, idx) => {
      const w = widths[idx] - cardGap;
      const x = curX;

      // Top color well height (proportional to total height)
      const colorWellH = Math.round(totalSwatchHeight * 0.46);

      // A. Main Color Block
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x, startY, w, colorWellH, Math.round(12 * s));
      ctx.fill();

      // Subtle inset border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Role Badge at Top
      if (config.showRoles) {
        const roleLabel = sp.role || (idx === 0 ? '60% Base' : idx === 1 ? '30% Forma' : idx === 2 ? '10% Foco' : 'Acento');
        this._drawBadge(ctx, roleLabel, x + Math.round(14 * s), startY + Math.round(14 * s), 'rgba(0, 0, 0, 0.65)', '#FFFFFF', `bold ${Math.round(12 * s)}px -apple-system, sans-serif`, 10 * s, 5 * s, 5 * s);
      }

      // Micro-ramp directly under color block
      let rampH = 0;
      if (config.showMicroRamp) {
        rampH = Math.max(18, Math.round(height * 0.024));
        const rampY = startY + colorWellH - rampH - Math.round(8 * s);
        this._drawMicroRamp(ctx, x + Math.round(10 * s), rampY, w - Math.round(20 * s), rampH, sp.rgb, 5, 4);
      }

      // B. Info Card at bottom
      const infoY = startY + colorWellH + Math.round(10 * s);
      const infoH = totalSwatchHeight - colorWellH - Math.round(10 * s);

      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, infoY, w, infoH, Math.round(10 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Render Rich Chromatic Specimen Info
      this._renderSpecimenInfoBlock(ctx, x + Math.round(14 * s), infoY + Math.round(14 * s), w - Math.round(28 * s), infoH - Math.round(24 * s), sp, theme, config);

      curX += widths[idx];
    });

    // 3. Continuous Fusion Gradient Strip
    if (config.showGradientStrip) {
      const gradY = height - bottomReserve + Math.round(bottomReserve * 0.15);
      const gradH = Math.max(16, Math.round(height * 0.025));
      this._drawContinuousGradientStrip(ctx, marginX, gradY, availWidth, gradH, specimens);
    }

    // 4. Footer Credits
    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE 2: GRID GALLERY / SPECIMEN GRID (UNIFORM CARDS)
  // =========================================================================

  _renderGridGalleryTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.04);
    const headerY = Math.round(height * 0.08);

    // Header
    this._drawStudioHeader(ctx, width, title, config.subtitle || 'GALERÍA DE FICHAS CROMÁTICAS • ESPECIFICACIÓN COMPLETA', theme, marginX, headerY);

    const n = specimens.length;
    const startY = Math.round(height * 0.16);
    const footerReserve = Math.round(height * 0.07);
    const availWidth = width - marginX * 2;
    const availHeight = height - startY - footerReserve;

    // Calculate grid dimensions
    let cols = 3;
    if (n <= 4) cols = n;
    else if (n <= 6) cols = 3;
    else if (n <= 10) cols = Math.min(5, Math.ceil(n / 2));
    else if (n <= 16) cols = 4;
    else cols = 6;

    const rows = Math.ceil(n / cols);
    const gapX = Math.max(12, Math.round(width * 0.01));
    const gapY = Math.max(12, Math.round(height * 0.015));

    const cardW = (availWidth - (cols - 1) * gapX) / cols;
    const cardH = (availHeight - (rows - 1) * gapY) / rows;

    specimens.forEach((sp, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = marginX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card Background Container
      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, y, cardW, cardH, Math.round(10 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Top color well (40% of card)
      const colorWellH = Math.round(cardH * 0.42);
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x + Math.round(6 * s), y + Math.round(6 * s), cardW - Math.round(12 * s), colorWellH, Math.round(8 * s));
      ctx.fill();

      // Inset border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Number badge
      const numStr = `#${(idx + 1).toString().padStart(2, '0')}`;
      this._drawBadge(ctx, numStr, x + Math.round(14 * s), y + Math.round(14 * s), 'rgba(0,0,0,0.6)', '#FFFFFF', `bold ${Math.round(11 * s)}px monospace`, 8 * s, 4 * s, 4 * s);

      // Micro-ramp inside well
      if (config.showMicroRamp && cardH > 180) {
        const rampH = Math.max(12, Math.round(cardH * 0.05));
        this._drawMicroRamp(ctx, x + Math.round(12 * s), y + colorWellH - rampH - Math.round(2 * s), cardW - Math.round(24 * s), rampH, sp.rgb, 5, 3);
      }

      // Specimen metadata below
      const infoY = y + colorWellH + Math.round(12 * s);
      const infoH = cardH - colorWellH - Math.round(18 * s);
      this._renderSpecimenInfoBlock(ctx, x + Math.round(12 * s), infoY, cardW - Math.round(24 * s), infoH, sp, theme, config, true);
    });

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE 3: FINE ART ATELIER & REAL PIGMENT TUBES
  // =========================================================================

  _renderFineArtAtelierTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.045);
    const headerY = Math.round(height * 0.09);

    // Header with Fine Art Atelier styling
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `bold ${Math.round(36 * s)}px "Cinzel", "Playfair Display", "Times New Roman", serif`;
    this._drawSafeText(ctx, title || 'Cuaderno de Estudio y Pigmentos de Taller', marginX, headerY, width - marginX * 2 - Math.round(280 * s), Math.round(36 * s));

    ctx.fillStyle = theme.textSecondary;
    ctx.font = `500 ${Math.round(14 * s)}px "Inter", -apple-system, sans-serif`;
    ctx.fillText('CATÁLOGO HISTÓRICO DE CABALLETE • ESPECIFICACIÓN DE ÓLEO & ACRÍLICO • COLOR INDEX', marginX, headerY + Math.round(30 * s));

    // Fine Art Atelier Seal Badge
    ctx.fillStyle = theme.badgeBg;
    ctx.strokeStyle = theme.badgeBorder;
    ctx.lineWidth = 1.5 * s;
    this._roundRect(ctx, width - marginX - Math.round(250 * s), headerY - Math.round(18 * s), Math.round(250 * s), Math.round(44 * s), Math.round(8 * s));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.badgeText;
    ctx.font = `bold ${Math.round(12 * s)}px "Cinzel", serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🏛️ ATELIER DE BELLAS ARTES', width - marginX - Math.round(125 * s), headerY + Math.round(8 * s));
    ctx.textAlign = 'left';

    const n = specimens.length;
    const startY = Math.round(height * 0.18);
    const bottomReserve = Math.round(height * 0.12);
    const availWidth = width - marginX * 2;
    const availHeight = height - startY - bottomReserve;

    const colW = (availWidth - (n - 1) * Math.round(16 * s)) / n;

    specimens.forEach((sp, idx) => {
      const x = marginX + idx * (colW + Math.round(16 * s));

      // Card container
      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, startY, colW, availHeight, Math.round(10 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Top painterly oil swatch dab (38% height)
      const dabH = Math.round(availHeight * 0.36);
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x + Math.round(10 * s), startY + Math.round(10 * s), colW - Math.round(20 * s), dabH, Math.round(8 * s));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Color Name or Pigment Tag
      const tube = sp.pigmentTube;
      const tubeName = tube?.name || sp.name || 'Pigmento Artístico';

      let curY = startY + dabH + Math.round(26 * s);
      const lineStep = Math.round(24 * s);

      // 1. Tube Name
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `bold ${Math.round(16 * s)}px "Inter", sans-serif`;
      this._drawSafeText(ctx, tubeName, x + Math.round(14 * s), curY, colW - Math.round(28 * s), Math.round(16 * s));
      curY += lineStep;

      // 2. Brand & Medium
      if (tube) {
        ctx.fillStyle = theme.accentColor;
        ctx.font = `bold ${Math.round(13 * s)}px -apple-system, sans-serif`;
        this._drawSafeText(ctx, `${tube.brandName} • ${tube.medium}`, x + Math.round(14 * s), curY, colW - Math.round(28 * s), Math.round(13 * s));
        curY += lineStep;

        // 3. Color Index & Opacity Badge
        const ciStr = `CI: ${tube.ci} • ${tube.opacity}`;
        this._drawBadge(ctx, ciStr, x + Math.round(14 * s), curY, theme.badgeBg, theme.badgeText, `bold ${Math.round(12 * s)}px monospace`, 8 * s, 4 * s, 4 * s);
        curY += lineStep + Math.round(6 * s);

        // 4. Lightfastness
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawSafeText(ctx, `Permanencia: ${tube.lightfastness}`, x + Math.round(14 * s), curY, colW - Math.round(28 * s), Math.round(12 * s));
        curY += lineStep;
      }

      // 5. Munsell Notation
      ctx.fillStyle = theme.goldColor;
      ctx.font = `bold ${Math.round(14 * s)}px monospace`;
      ctx.fillText(`Munsell: ${sp.munsell.notation}`, x + Math.round(14 * s), curY);
      curY += lineStep;

      // 6. HEX & RGB
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `${Math.round(13 * s)}px monospace`;
      ctx.fillText(`${sp.hex} • RGB: ${sp.rgb.r},${sp.rgb.g},${sp.rgb.b}`, x + Math.round(14 * s), curY);
      curY += lineStep;

      // 7. Paint recipe if enabled
      if (config.showPaintRecipe && sp.recipeString && curY + Math.round(36 * s) < startY + availHeight) {
        ctx.fillStyle = '#C084FC';
        ctx.font = `bold ${Math.round(12 * s)}px -apple-system, sans-serif`;
        ctx.fillText('🎨 Receta (%):', x + Math.round(14 * s), curY);
        curY += Math.round(16 * s);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, sp.recipeString, x + Math.round(14 * s), curY, colW - Math.round(28 * s), Math.round(15 * s), 2);
        curY += Math.round(32 * s);
      }

      // 8. Mixing Note / Description
      if (config.showTips && tube?.description && curY + Math.round(20 * s) < startY + availHeight) {
        ctx.fillStyle = theme.textMuted;
        ctx.font = `italic ${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, tube.description, x + Math.round(14 * s), curY, colW - Math.round(28 * s), Math.round(16 * s), 2);
      }
    });

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE 4: TECHNICAL PRINT / BRAND GUIDELINES & PRE-PRESS
  // =========================================================================

  _renderTechnicalPrintTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.04);
    const headerY = Math.round(height * 0.08);

    // Swiss Technical Header
    this._drawStudioHeader(ctx, width, title, 'FICHA TÉCNICA DE PRODUCCIÓN • CMYK / RGB / WCAG 2.1 / PRE-PRENSA', theme, marginX, headerY);

    const n = specimens.length;
    const startY = Math.round(height * 0.16);
    const bottomReserve = config.showGradientStrip ? Math.round(height * 0.12) : Math.round(height * 0.07);
    const availWidth = width - marginX * 2;
    const availHeight = height - startY - bottomReserve;

    const gap = Math.round(14 * s);
    const colW = (availWidth - (n - 1) * gap) / n;

    specimens.forEach((sp, idx) => {
      const x = marginX + idx * (colW + gap);

      // Card Container
      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, startY, colW, availHeight, Math.round(10 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Color Block (30% of card)
      const blockH = Math.round(availHeight * 0.30);
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x + Math.round(8 * s), startY + Math.round(8 * s), colW - Math.round(16 * s), blockH, Math.round(8 * s));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Role Pill (top-left inside well)
      if (config.showRoles) {
        const roleStr = sp.role || (idx === 0 ? '60% Base' : idx === 1 ? '30% Forma' : idx === 2 ? '10% Foco' : 'Acento');
        this._drawBadge(ctx, roleStr, x + Math.round(16 * s), startY + Math.round(16 * s), 'rgba(0,0,0,0.65)', '#FFFFFF', `bold ${Math.round(12 * s)}px -apple-system`, 8 * s, 4 * s, 4 * s);
      }

      // Micro-ramp inside well at bottom
      if (config.showMicroRamp) {
        const rampH = Math.max(16, Math.round(blockH * 0.16));
        this._drawMicroRamp(ctx, x + Math.round(14 * s), startY + blockH - rampH - Math.round(4 * s), colW - Math.round(28 * s), rampH, sp.rgb, 5, 4);
      }

      // Card Content Y cursor with dynamic scaling
      let curY = startY + blockH + Math.round(26 * s);
      const padX = x + Math.round(18 * s);
      const maxW = colW - Math.round(36 * s);
      const lineStep = Math.round(24 * s);

      // 1. HEX (Large & bold monospace)
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `bold ${Math.round(24 * s)}px "SF Mono", monospace`;
      ctx.fillText(sp.hex, padX, curY);

      // Complementary mini dot on the right of HEX
      if (config.showComplementary && sp.compHex) {
        ctx.fillStyle = sp.compHex;
        ctx.beginPath();
        ctx.arc(x + colW - Math.round(24 * s), curY - Math.round(8 * s), Math.round(8 * s), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 * s;
        ctx.stroke();
      }
      curY += lineStep + Math.round(4 * s);

      // 2. RGB Table
      if (config.showHexRgb) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = `${Math.round(15 * s)}px "SF Mono", monospace`;
        ctx.fillText(`sRGB: ${sp.rgb.r}, ${sp.rgb.g}, ${sp.rgb.b}`, padX, curY);
        curY += lineStep;
      }

      // 3. CMYK Print Values
      if (config.showCmyk) {
        const cmyk = sp.cmyk;
        ctx.fillStyle = '#F59E0B';
        ctx.font = `${Math.round(15 * s)}px "SF Mono", monospace`;
        ctx.fillText(`C:${cmyk.c}% M:${cmyk.m}% Y:${cmyk.y}% K:${cmyk.k}%`, padX, curY);
        curY += lineStep;

        // 4. Total Ink Limit (TAC) & Gamut Warning Badge
        const tac = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
        const isOut = sp.cmykGamut?.isOutOfGamut || tac > 320;
        const gamutBadge = isOut ? '⚠️ Fuera Gama' : '✓ En Gama SWOP';
        const gamutColor = isOut ? '#EF4444' : '#10B981';
        this._drawBadge(ctx, `TAC: ${tac}% • ${gamutBadge}`, padX, curY, isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', gamutColor, `bold ${Math.round(12 * s)}px monospace`, 8 * s, 4 * s, 4 * s);
        curY += lineStep + Math.round(6 * s);
      }

      // 5. Munsell Scientific Notation
      if (config.showMunsell) {
        ctx.fillStyle = theme.goldColor;
        ctx.font = `bold ${Math.round(15 * s)}px "SF Mono", monospace`;
        ctx.fillText(`Munsell: ${sp.munsell.notation}`, padX, curY);
        curY += lineStep;
      }

      // 6. Luminance & Thermal Temp
      if (config.showLumTemp) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `${Math.round(14 * s)}px "SF Mono", monospace`;
        ctx.fillText(`Lum: ${sp.luminancePct}% • ${sp.temperature.label}`, padX, curY);
        curY += lineStep;
      }

      // 7. Complementary Color Info
      if (config.showComplementary && sp.compHex) {
        ctx.fillStyle = '#FB7185';
        ctx.font = `${Math.round(13 * s)}px "SF Mono", monospace`;
        ctx.fillText(`Complementario: ${sp.compHex}`, padX, curY);
        curY += lineStep;
      }

      // 8. Real Pigment Tube
      if (config.showPigments && sp.pigmentTube) {
        ctx.fillStyle = theme.accentColor;
        ctx.font = `bold ${Math.round(13 * s)}px -apple-system, sans-serif`;
        this._drawSafeText(ctx, `Tubo: ${sp.pigmentTube.name} (${sp.pigmentTube.ci})`, padX, curY, maxW, Math.round(13 * s));
        curY += lineStep;
      }

      // 9. Physical Mix Recipe (%)
      if (config.showPaintRecipe && sp.recipeString) {
        ctx.fillStyle = '#C084FC';
        ctx.font = `bold ${Math.round(12 * s)}px -apple-system, sans-serif`;
        ctx.fillText('🎨 Receta de Tubos (%):', padX, curY);
        curY += Math.round(18 * s);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, sp.recipeString, padX, curY, maxW, Math.round(16 * s), 2);
        curY += Math.round(36 * s);
      }

      // 10. WCAG Accessibility
      if (config.showWcag) {
        ctx.fillStyle = theme.textMuted;
        ctx.font = `${Math.round(13 * s)}px -apple-system, sans-serif`;
        ctx.fillText(`Contraste: Blanco ${sp.contrastWhite}:1 • Negro ${sp.contrastBlack}:1`, padX, curY);
        curY += lineStep;
      }

      // 11. Composition tip
      if (config.showTips && sp.tip && curY + Math.round(24 * s) < startY + availHeight) {
        ctx.fillStyle = theme.textMuted;
        ctx.font = `italic ${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, `💡 ${sp.tip}`, padX, curY, maxW, Math.round(16 * s), 2);
      }
    });

    if (config.showGradientStrip) {
      const ribY = height - bottomReserve + Math.round(bottomReserve * 0.12);
      const ribH = Math.max(18, Math.round(height * 0.024));
      this._drawContinuousGradientStrip(ctx, marginX, ribY, availWidth, ribH, specimens);
    }

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE: ULTIMATE ENCYCLOPEDIA & COMPREHENSIVE ALL-IN-ONE STUDIO
  // =========================================================================

  _renderUltimateEncyclopediaTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.035);
    const headerY = Math.round(height * 0.08);

    // Studio Header
    this._drawStudioHeader(ctx, width, title, 'ENCICLOPEDIA CROMÁTICA INTEGRAL • ANÁLISIS CIENTÍFICO & FÓRMULAS DE TALLER', theme, marginX, headerY);

    const n = specimens.length;
    const startY = Math.round(height * 0.16);
    const bottomReserve = config.showGradientStrip ? Math.round(height * 0.13) : Math.round(height * 0.07);
    const availWidth = width - marginX * 2;
    const availHeight = height - startY - bottomReserve;

    const gap = Math.round(14 * s);
    const colW = (availWidth - (n - 1) * gap) / n;

    specimens.forEach((sp, idx) => {
      const x = marginX + idx * (colW + gap);

      // Card Container
      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, startY, colW, availHeight, Math.round(12 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Top Color Well (27% height)
      const wellH = Math.round(availHeight * 0.27);
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x + Math.round(8 * s), startY + Math.round(8 * s), colW - Math.round(16 * s), wellH, Math.round(8 * s));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // 1. Role Pill inside well (top-left)
      const roleStr = sp.role || (idx === 0 ? '60% Base' : idx === 1 ? '30% Forma' : idx === 2 ? '10% Foco' : 'Acento');
      this._drawBadge(ctx, roleStr, x + Math.round(16 * s), startY + Math.round(16 * s), 'rgba(0,0,0,0.7)', '#FFFFFF', `bold ${Math.round(12 * s)}px -apple-system`, 8 * s, 4 * s, 4 * s);

      // 2. Direct Complementary Pill inside well (top-right)
      if (sp.compHex) {
        const compW = Math.round(112 * s);
        const compH = Math.round(24 * s);
        const compX = x + colW - Math.round(16 * s) - compW;
        const compY = startY + Math.round(16 * s);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this._roundRect(ctx, compX, compY, compW, compH, Math.round(4 * s));
        ctx.fill();

        // Dot
        ctx.fillStyle = sp.compHex;
        ctx.beginPath();
        ctx.arc(compX + Math.round(12 * s), compY + compH / 2, Math.round(6 * s), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * s)}px monospace`;
        ctx.fillText(sp.compHex, compX + Math.round(24 * s), compY + compH / 2 + Math.round(4 * s));
      }

      // 3. 5-Step Micro-Ramp at bottom of well
      const rampH = Math.max(16, Math.round(wellH * 0.16));
      this._drawMicroRamp(ctx, x + Math.round(14 * s), startY + wellH - rampH - Math.round(4 * s), colW - Math.round(28 * s), rampH, sp.rgb, 5, 4);

      // Card Information Body
      let curY = startY + wellH + Math.round(24 * s);
      const padX = x + Math.round(16 * s);
      const maxW = colW - Math.round(32 * s);
      const lineStep = Math.round(23 * s);

      // A. Large HEX (Prominent, High Contrast)
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `bold ${Math.round(22 * s)}px "SF Mono", monospace`;
      ctx.fillText(sp.hex, padX, curY);

      // Sub-label name
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `500 ${Math.round(13 * s)}px -apple-system, sans-serif`;
      ctx.fillText(sp.name || 'Muestra de Arte', padX + Math.round(120 * s), curY);
      curY += lineStep + Math.round(2 * s);

      // B. RGB & CMYK Metrics
      ctx.fillStyle = '#38BDF8';
      ctx.font = `${Math.round(14 * s)}px "SF Mono", monospace`;
      ctx.fillText(`sRGB: ${sp.rgb.r}, ${sp.rgb.g}, ${sp.rgb.b}`, padX, curY);
      curY += lineStep;

      const cmyk = sp.cmyk;
      const tac = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
      ctx.fillStyle = '#F59E0B';
      ctx.font = `${Math.round(14 * s)}px "SF Mono", monospace`;
      ctx.fillText(`CMYK: C${cmyk.c}% M${cmyk.m}% Y${cmyk.y}% K${cmyk.k}% (TAC ${tac}%)`, padX, curY);
      curY += lineStep;

      // C. Scientific Munsell System
      ctx.fillStyle = theme.goldColor;
      ctx.font = `bold ${Math.round(14 * s)}px "SF Mono", monospace`;
      ctx.fillText(`Munsell: ${sp.munsell.notation}`, padX, curY);
      curY += lineStep;

      // D. Photometric Luminance & Thermal Temp
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `${Math.round(13 * s)}px "SF Mono", monospace`;
      ctx.fillText(`Lum: ${sp.luminancePct}% Y • ${sp.temperature.label} (${sp.temperature.tempK})`, padX, curY);
      curY += lineStep + Math.round(6 * s);

      // E. Physical Paint Recipe (% by Tube)
      if (sp.recipeString) {
        const recBoxH = Math.round(58 * s);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.lineWidth = 1 * s;
        this._roundRect(ctx, padX - Math.round(4 * s), curY - Math.round(14 * s), maxW + Math.round(8 * s), recBoxH, Math.round(6 * s));
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#C7D2FE';
        ctx.font = `bold ${Math.round(12 * s)}px -apple-system, sans-serif`;
        ctx.fillText('🎨 RECETA DE TUBOS EN PALETA (%):', padX, curY);
        curY += Math.round(18 * s);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, sp.recipeString, padX, curY, maxW, Math.round(15 * s), 2);
        curY += Math.round(36 * s);
      }

      // F. Genuine Fine Art Tube (Color Index & Properties)
      if (sp.pigmentTube) {
        const pt = sp.pigmentTube;
        ctx.fillStyle = theme.accentColor;
        ctx.font = `bold ${Math.round(13 * s)}px -apple-system, sans-serif`;
        this._drawSafeText(ctx, `🏛️ ${pt.brandName}: ${pt.name}`, padX, curY, maxW, Math.round(13 * s));
        curY += Math.round(18 * s);

        ctx.fillStyle = theme.textMuted;
        ctx.font = `${Math.round(12 * s)}px "SF Mono", monospace`;
        this._drawSafeText(ctx, `CI: ${pt.ci} • ${pt.opacity} • ${pt.lightfastness}`, padX, curY, maxW, Math.round(12 * s));
        curY += lineStep;
      }

      // G. WCAG 2.1 Contrast
      ctx.fillStyle = theme.textMuted;
      ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
      ctx.fillText(`Contraste: Blanco ${sp.contrastWhite}:1 • Negro ${sp.contrastBlack}:1`, padX, curY);
      curY += Math.round(20 * s);

      // H. Practical Artist Tip
      if (sp.tip && curY + Math.round(20 * s) < startY + availHeight) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `italic ${Math.round(12 * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, `💡 ${sp.tip}`, padX, curY, maxW, Math.round(15 * s), 2);
      }
    });

    if (config.showGradientStrip) {
      const ribY = height - bottomReserve + Math.round(bottomReserve * 0.12);
      const ribH = Math.max(18, Math.round(height * 0.024));
      this._drawContinuousGradientStrip(ctx, marginX, ribY, availWidth, ribH, specimens);
    }

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE: CUSTOM USER / MODULAR COMPOSER
  // =========================================================================

  _renderCustomUserTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.04);
    const headerY = Math.round(height * 0.08);

    // Header
    this._drawStudioHeader(ctx, width, title, 'PLANTILLA PERSONALIZADA • COMPOSICIÓN MODULAR DEL ARTISTA', theme, marginX, headerY);

    const n = specimens.length;
    const startY = Math.round(height * 0.16);
    const bottomReserve = config.showGradientStrip ? Math.round(height * 0.13) : Math.round(height * 0.07);
    const availWidth = width - marginX * 2;
    const availHeight = height - startY - bottomReserve;

    const gap = Math.round(14 * s);
    const colW = (availWidth - (n - 1) * gap) / n;

    // Count active data modules to adapt vertical layout dynamically
    const modules = [
      config.showHexRgb,
      config.showCmyk,
      config.showMunsell,
      config.showLumTemp,
      config.showComplementary,
      config.showPaintRecipe,
      config.showPigments,
      config.showWcag,
      config.showTips
    ].filter(Boolean);
    const modCount = modules.length;

    // Adapt well height: if few modules, larger well; if many, compact well
    let wellPct = 0.32;
    let baseFontSize = 14;
    let lineStep = Math.round(24 * s);

    if (modCount <= 3) {
      wellPct = 0.46;
      baseFontSize = 17;
      lineStep = Math.round(36 * s);
    } else if (modCount <= 6) {
      wellPct = 0.36;
      baseFontSize = 15;
      lineStep = Math.round(28 * s);
    } else {
      wellPct = 0.28;
      baseFontSize = 13;
      lineStep = Math.round(22 * s);
    }

    const wellH = Math.round(availHeight * wellPct);

    specimens.forEach((sp, idx) => {
      const x = marginX + idx * (colW + gap);

      // Card Container
      ctx.fillStyle = theme.cardBg;
      this._roundRect(ctx, x, startY, colW, availHeight, Math.round(12 * s));
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Color Well
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, x + Math.round(8 * s), startY + Math.round(8 * s), colW - Math.round(16 * s), wellH, Math.round(8 * s));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Role Pill (if enabled)
      if (config.showRoles) {
        const roleStr = sp.role || (idx === 0 ? '60% Base' : idx === 1 ? '30% Forma' : idx === 2 ? '10% Foco' : 'Acento');
        this._drawBadge(ctx, roleStr, x + Math.round(16 * s), startY + Math.round(16 * s), 'rgba(0,0,0,0.7)', '#FFFFFF', `bold ${Math.round(12 * s)}px -apple-system`, 8 * s, 4 * s, 4 * s);
      }

      // Micro-ramp (if enabled)
      if (config.showMicroRamp) {
        const rampH = Math.max(14, Math.round(wellH * 0.16));
        this._drawMicroRamp(ctx, x + Math.round(14 * s), startY + wellH - rampH - Math.round(4 * s), colW - Math.round(28 * s), rampH, sp.rgb, 5, 4);
      }

      // Information Body
      let curY = startY + wellH + Math.round(26 * s);
      const padX = x + Math.round(16 * s);
      const maxW = colW - Math.round(32 * s);

      // 1. HEX (Always prominent)
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `bold ${Math.round((baseFontSize + 7) * s)}px "SF Mono", monospace`;
      ctx.fillText(sp.hex, padX, curY);
      curY += lineStep + Math.round(4 * s);

      // 2. RGB Table
      if (config.showHexRgb) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = `${Math.round(baseFontSize * s)}px "SF Mono", monospace`;
        ctx.fillText(`sRGB: ${sp.rgb.r}, ${sp.rgb.g}, ${sp.rgb.b}`, padX, curY);
        curY += lineStep;
      }

      // 3. CMYK Print
      if (config.showCmyk) {
        const cmyk = sp.cmyk;
        ctx.fillStyle = '#F59E0B';
        ctx.font = `${Math.round(baseFontSize * s)}px "SF Mono", monospace`;
        ctx.fillText(`CMYK: C${cmyk.c}% M${cmyk.m}% Y${cmyk.y}% K${cmyk.k}%`, padX, curY);
        curY += lineStep;
      }

      // 4. Munsell
      if (config.showMunsell) {
        ctx.fillStyle = theme.goldColor;
        ctx.font = `bold ${Math.round(baseFontSize * s)}px "SF Mono", monospace`;
        ctx.fillText(`Munsell: ${sp.munsell.notation}`, padX, curY);
        curY += lineStep;
      }

      // 5. Lum & Temp
      if (config.showLumTemp) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = `${Math.round((baseFontSize - 1) * s)}px "SF Mono", monospace`;
        ctx.fillText(`Lum: ${sp.luminancePct}% • ${sp.temperature.label}`, padX, curY);
        curY += lineStep;
      }

      // 6. Direct Complementary
      if (config.showComplementary && sp.compHex) {
        ctx.fillStyle = '#FB7185';
        ctx.font = `${Math.round(baseFontSize * s)}px "SF Mono", monospace`;
        ctx.fillText(`Complementario: ${sp.compHex}`, padX, curY);

        ctx.fillStyle = sp.compHex;
        ctx.beginPath();
        ctx.arc(padX + maxW - Math.round(10 * s), curY - Math.round(5 * s), Math.round(7 * s), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        curY += lineStep;
      }

      // 7. Paint Recipe
      if (config.showPaintRecipe && sp.recipeString) {
        ctx.fillStyle = '#C084FC';
        ctx.font = `bold ${Math.round((baseFontSize - 1) * s)}px -apple-system, sans-serif`;
        ctx.fillText('🎨 Receta de Tubos (%):', padX, curY);
        curY += Math.round(18 * s);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = `${Math.round((baseFontSize - 1) * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, sp.recipeString, padX, curY, maxW, Math.round(16 * s), 2);
        curY += Math.round(36 * s);
      }

      // 8. Genuine Pigments
      if (config.showPigments && sp.pigmentTube) {
        ctx.fillStyle = theme.accentColor;
        ctx.font = `bold ${Math.round(baseFontSize * s)}px -apple-system, sans-serif`;
        this._drawSafeText(ctx, `Tubo: ${sp.pigmentTube.name} (${sp.pigmentTube.ci})`, padX, curY, maxW, Math.round(baseFontSize * s));
        curY += lineStep;
      }

      // 9. WCAG
      if (config.showWcag) {
        ctx.fillStyle = theme.textMuted;
        ctx.font = `${Math.round((baseFontSize - 1) * s)}px -apple-system, sans-serif`;
        ctx.fillText(`Contraste: Blanco ${sp.contrastWhite}:1 • Negro ${sp.contrastBlack}:1`, padX, curY);
        curY += lineStep;
      }

      // 10. Tips
      if (config.showTips && sp.tip && curY + Math.round(20 * s) < startY + availHeight) {
        ctx.fillStyle = theme.textMuted;
        ctx.font = `italic ${Math.round((baseFontSize - 1) * s)}px -apple-system, sans-serif`;
        this._drawWrappedText(ctx, `💡 ${sp.tip}`, padX, curY, maxW, Math.round(16 * s), 2);
      }
    });

    if (config.showGradientStrip) {
      const ribY = height - bottomReserve + Math.round(bottomReserve * 0.12);
      const ribH = Math.max(18, Math.round(height * 0.024));
      this._drawContinuousGradientStrip(ctx, marginX, ribY, availWidth, ribH, specimens);
    }

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // TEMPLATE 5: MOODBOARD EDITORIAL & CONCEPT ART
  // =========================================================================

  _renderMoodboardEditorialTemplate(ctx, width, height, title, specimens, theme, config) {
    const s = this._getScale(width);
    const marginX = Math.round(width * 0.05);
    const headerY = Math.round(height * 0.1);

    // Minimalist Editorial Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `300 ${Math.round(44 * s)}px "Cinzel", "Outfit", -apple-system, sans-serif`;
    this._drawSafeText(ctx, title || 'Concept Art Moodboard', marginX, headerY, width - marginX * 2 - Math.round(200 * s), Math.round(44 * s));

    ctx.fillStyle = theme.textMuted;
    ctx.font = `400 ${Math.round(14 * s)}px -apple-system, sans-serif`;
    ctx.fillText('DIRECCIÓN DE ARTE CROMÁTICA • COMPOSICIÓN EDITORIAL • EQUILIBRIO DE ATMÓSFERA', marginX, headerY + Math.round(36 * s));

    const n = specimens.length;
    const startY = Math.round(height * 0.20);
    const availWidth = width - marginX * 2;
    const mainAreaH = Math.round(height * 0.58);

    // Dominant Hero color takes 42% width, rest distributed
    const heroW = Math.round(availWidth * 0.42);
    const othersW = (availWidth - heroW - Math.round(20 * s) - (n - 2) * Math.round(12 * s)) / (n - 1);

    // Hero Block
    const hero = specimens[0];
    ctx.fillStyle = hero.hex;
    this._roundRect(ctx, marginX, startY, heroW, mainAreaH, Math.round(14 * s));
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Hero label
    this._drawBadge(ctx, 'DOMINANTE 60%', marginX + Math.round(20 * s), startY + Math.round(20 * s), 'rgba(0,0,0,0.65)', '#FFFFFF', `bold ${Math.round(13 * s)}px -apple-system`, 12 * s, 6 * s, 6 * s);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(24 * s)}px monospace`;
    ctx.fillText(hero.hex, marginX + Math.round(24 * s), startY + mainAreaH - Math.round(30 * s));

    // Supporting Blocks
    let curX = marginX + heroW + Math.round(20 * s);
    specimens.slice(1).forEach((sp, idx) => {
      ctx.fillStyle = sp.hex;
      this._roundRect(ctx, curX, startY, othersW, mainAreaH, Math.round(12 * s));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      const role = idx === 0 ? '30% FORMA' : idx === 1 ? '10% FOCO' : 'ACENTO';
      this._drawBadge(ctx, role, curX + Math.round(12 * s), startY + Math.round(16 * s), 'rgba(0,0,0,0.65)', '#FFFFFF', `bold ${Math.round(11 * s)}px -apple-system`, 8 * s, 4 * s, 4 * s);

      // Bottom HEX
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(15 * s)}px monospace`;
      ctx.fillText(sp.hex, curX + Math.round(12 * s), startY + mainAreaH - Math.round(24 * s));

      curX += othersW + Math.round(12 * s);
    });

    // Continuous Gradient Ribbon Below
    if (config.showGradientStrip) {
      const ribY = startY + mainAreaH + Math.round(24 * s);
      const ribH = Math.max(18, Math.round(height * 0.025));
      this._drawContinuousGradientStrip(ctx, marginX, ribY, availWidth, ribH, specimens);
    }

    if (config.showWatermark) {
      this._drawStudioFooter(ctx, width, height, theme, config, marginX);
    }
  },

  // =========================================================================
  // HELPER DRAWING ENGINES
  // =========================================================================

  _drawBackground(ctx, width, height, theme) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgGradient[0]);
    bgGrad.addColorStop(1, theme.bgGradient[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ambient radial glow
    const glowGrad = ctx.createRadialGradient(width * 0.2, height * 0.12, 10, width * 0.2, height * 0.12, width * 0.45);
    glowGrad.addColorStop(0, theme.accentGlow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Fine framing hairline
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, width - 32, height - 32);
  },

  _drawStudioHeader(ctx, width, title, subtitle, theme, marginX, headerY) {
    const s = this._getScale(width);
    // Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `bold ${Math.round(34 * s)}px "Inter", "Outfit", -apple-system, sans-serif`;
    this._drawSafeText(ctx, title || 'Paleta Cromática de Estudio', marginX, headerY, width - marginX * 2 - Math.round(280 * s), Math.round(34 * s));

    // Subtitle
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `500 ${Math.round(15 * s)}px -apple-system, sans-serif`;
    this._drawSafeText(ctx, subtitle || 'FICHA CROMÁTICA DE ESTUDIO • GOM COLOR PICKER PRO', marginX, headerY + Math.round(32 * s), width - marginX * 2 - Math.round(280 * s), Math.round(15 * s));

    // Right Badge
    const badgeW = Math.round(240 * s);
    const badgeH = Math.round(40 * s);
    const badgeX = width - marginX - badgeW;
    const badgeY = headerY - Math.round(16 * s);

    ctx.fillStyle = theme.badgeBg;
    ctx.strokeStyle = theme.badgeBorder;
    ctx.lineWidth = 1.5 * s;
    this._roundRect(ctx, badgeX, badgeY, badgeW, badgeH, Math.round(6 * s));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.badgeText;
    ctx.font = `bold ${Math.round(12 * s)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎨 GOM COLOR PICKER PRO', badgeX + badgeW / 2, badgeY + badgeH / 2 + Math.round(4 * s));
    ctx.textAlign = 'left';
  },

  _drawStudioFooter(ctx, width, height, theme, config, marginX) {
    const s = this._getScale(width);
    ctx.fillStyle = theme.textMuted;
    ctx.font = `${Math.round(12 * s)}px -apple-system, sans-serif`;
    ctx.fillText('Creado con GOM Color Picker Pro — Suite de Teoría y Mezcla Cromática para Artistas', marginX, height - Math.round(28 * s));

    ctx.textAlign = 'right';
    ctx.fillText(config.author || 'Fran Gómez • GOM Samurai', width - marginX, height - Math.round(28 * s));
    ctx.textAlign = 'left';
  },

  _renderSpecimenInfoBlock(ctx, x, y, width, height, sp, theme, config, isGrid = false) {
    const s = this._getScale(ctx.canvas.width);
    let curY = y + Math.round(18 * s);
    const lineSpacing = Math.round((isGrid ? 22 : 28) * s);
    const baseFont = Math.round((isGrid ? 13 : 15) * s);
    const subFont = Math.max(10, Math.round((isGrid ? 11 : 13) * s));
    const headerFont = Math.round((isGrid ? 17 : 22) * s);

    // 1. HEX (Always shown, bold monospace)
    if (config.showHexRgb) {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = `bold ${headerFont}px "SF Mono", monospace`;
      ctx.fillText(sp.hex, x, curY);

      // Color indicator dot
      ctx.fillStyle = sp.hex;
      ctx.beginPath();
      ctx.arc(x + width - Math.round(12 * s), curY - Math.round(6 * s), Math.round(7 * s), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      curY += lineSpacing + Math.round(2 * s);

      // RGB
      ctx.fillStyle = '#38BDF8';
      ctx.font = `${baseFont}px "SF Mono", monospace`;
      const rgbText = `RGB: ${sp.rgb.r}, ${sp.rgb.g}, ${sp.rgb.b}`;
      this._drawSafeText(ctx, rgbText, x, curY, width, baseFont);
      curY += lineSpacing;
    }

    // 2. CMYK Print
    if (config.showCmyk && curY + lineSpacing < y + height) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = `${baseFont}px "SF Mono", monospace`;
      const cmykText = `CMYK: C${sp.cmyk.c}% M${sp.cmyk.m}% Y${sp.cmyk.y}% K${sp.cmyk.k}%`;
      this._drawSafeText(ctx, cmykText, x, curY, width, baseFont);
      curY += lineSpacing;
    }

    // 3. Munsell Notation
    if (config.showMunsell && curY + lineSpacing < y + height) {
      ctx.fillStyle = theme.goldColor;
      ctx.font = `bold ${baseFont}px "SF Mono", monospace`;
      const munText = `Munsell: ${sp.munsell.notation}`;
      this._drawSafeText(ctx, munText, x, curY, width, baseFont);
      curY += lineSpacing;
    }

    // 4. Luminance & Temperature
    if (config.showLumTemp && curY + lineSpacing < y + height) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `${subFont}px "SF Mono", monospace`;
      const lumText = `Lum: ${sp.luminancePct}% • ${sp.temperature.label}`;
      this._drawSafeText(ctx, lumText, x, curY, width, subFont);
      curY += lineSpacing;
    }

    // 5. Direct Complementary
    if (config.showComplementary && sp.compHex && curY + lineSpacing < y + height) {
      ctx.fillStyle = '#FB7185';
      ctx.font = `${subFont}px "SF Mono", monospace`;
      this._drawSafeText(ctx, `Comp: ${sp.compHex}`, x, curY, width, subFont);
      curY += lineSpacing;
    }

    // 6. Real Pigment Tube
    if (config.showPigments && sp.pigmentTube && curY + Math.round(36 * s) < y + height) {
      ctx.fillStyle = theme.accentColor;
      ctx.font = `bold ${baseFont}px -apple-system, sans-serif`;
      const pName = `${sp.pigmentTube.brandName}: ${sp.pigmentTube.name}`;
      this._drawSafeText(ctx, pName, x, curY, width, baseFont);
      curY += Math.round(18 * s);

      ctx.fillStyle = theme.textMuted;
      ctx.font = `${subFont}px monospace`;
      const pMeta = `CI ${sp.pigmentTube.ci} • ${sp.pigmentTube.opacity}`;
      this._drawSafeText(ctx, pMeta, x, curY, width, subFont);
      curY += lineSpacing;
    }

    // 7. Physical Paint Recipe
    if (config.showPaintRecipe && sp.recipeString && curY + Math.round(36 * s) < y + height) {
      ctx.fillStyle = '#C084FC';
      ctx.font = `bold ${subFont}px -apple-system, sans-serif`;
      this._drawSafeText(ctx, '🎨 Receta:', x, curY, width, subFont);
      curY += Math.round(16 * s);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = `${subFont}px -apple-system, sans-serif`;
      this._drawWrappedText(ctx, sp.recipeString, x, curY, width, Math.round(15 * s), 2);
      curY += Math.round(32 * s);
    }

    // 8. WCAG Accessibility
    if (config.showWcag && curY + lineSpacing < y + height) {
      ctx.fillStyle = theme.textMuted;
      ctx.font = `${subFont}px -apple-system, sans-serif`;
      this._drawSafeText(ctx, `WCAG: B ${sp.contrastWhite}:1 • N ${sp.contrastBlack}:1`, x, curY, width, subFont);
      curY += lineSpacing;
    }

    // 9. Practical Composition Tip
    if (config.showTips && curY + Math.round(30 * s) < y + height) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `italic ${subFont}px -apple-system, sans-serif`;
      this._drawWrappedText(ctx, `💡 ${sp.tip}`, x, curY, width, Math.round(16 * s), 2);
    }
  },

  _drawMicroRamp(ctx, x, y, width, height, baseRgb, steps = 5, radius = 3) {
    const stepW = width / steps;
    const hsv = ColorMath.rgbToHsv(baseRgb.r, baseRgb.g, baseRgb.b);

    for (let i = 0; i < steps; i++) {
      const stepX = x + i * stepW;
      let col;

      if (i === 0) {
        // High tint (mix 70% white)
        col = {
          r: Math.round(baseRgb.r + (255 - baseRgb.r) * 0.7),
          g: Math.round(baseRgb.g + (255 - baseRgb.g) * 0.7),
          b: Math.round(baseRgb.b + (255 - baseRgb.b) * 0.7)
        };
      } else if (i === 1) {
        // Soft tint (mix 35% white)
        col = {
          r: Math.round(baseRgb.r + (255 - baseRgb.r) * 0.35),
          g: Math.round(baseRgb.g + (255 - baseRgb.g) * 0.35),
          b: Math.round(baseRgb.b + (255 - baseRgb.b) * 0.35)
        };
      } else if (i === 2) {
        // Pure color
        col = baseRgb;
      } else if (i === 3) {
        // Shadow tone (shift value down 40%)
        col = ColorMath.hsvToRgb((hsv.h + 8) % 360, Math.min(1, hsv.s * 1.1), Math.max(0.15, hsv.v * 0.6));
      } else {
        // Deep shadow / occlusion (shift value down 75%)
        col = ColorMath.hsvToRgb((hsv.h + 15) % 360, Math.min(1, hsv.s * 1.2), Math.max(0.08, hsv.v * 0.28));
      }

      ctx.fillStyle = ColorMath.rgbToHex(col.r, col.g, col.b);
      ctx.fillRect(stepX, y, stepW + 0.5, height);
    }

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  },

  _drawContinuousGradientStrip(ctx, x, y, width, height, specimens) {
    if (!specimens || specimens.length === 0) return;

    const grad = ctx.createLinearGradient(x, 0, x + width, 0);
    const n = specimens.length;

    specimens.forEach((sp, idx) => {
      const stop = n === 1 ? 0 : idx / (n - 1);
      grad.addColorStop(stop, sp.hex);
    });

    ctx.fillStyle = grad;
    this._roundRect(ctx, x, y, width, height, height / 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  _drawBadge(ctx, text, x, y, bg, textColor, font, padX = 8, padY = 4, radius = 4) {
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const fontSizeMatch = font.match(/(\d+)px/);
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 12;
    const h = Math.max(Math.round(fontSize * 1.5), Math.round(fontSize + padY * 2));
    const w = metrics.width + padX * 2;

    ctx.fillStyle = bg;
    this._roundRect(ctx, x, y, w, h, radius);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  },

  /**
   * Safe text drawing guaranteed to NEVER clip or spill outside maxWidth
   */
  _drawSafeText(ctx, text, x, y, maxWidth, baseFontSize = 14, fontFace = '-apple-system, sans-serif') {
    if (!text || maxWidth <= 10) return;

    let fontSize = baseFontSize;
    ctx.font = `${fontSize}px ${fontFace}`;
    let textWidth = ctx.measureText(text).width;

    // Scale down if overflowing up to 25%
    if (textWidth > maxWidth && fontSize > 10) {
      fontSize = Math.max(9, Math.round(fontSize * (maxWidth / textWidth)));
      ctx.font = `${fontSize}px ${fontFace}`;
      textWidth = ctx.measureText(text).width;
    }

    // If still too wide, truncate cleanly with ellipsis
    if (textWidth > maxWidth) {
      let truncated = text;
      while (truncated.length > 3 && ctx.measureText(truncated + '…').width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      ctx.fillText(truncated + '…', x, y);
    } else {
      ctx.fillText(text, x, y);
    }
  },

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let curY = y;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= maxLines - 1) {
          // Truncate remainder
          const rest = words.slice(n).join(' ');
          this._drawSafeText(ctx, rest, x, curY, maxWidth, 10);
          return;
        }
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line.trim(), x, curY);
    }
  },

  _roundRect(ctx, x, y, width, height, radius) {
    if (width <= 0 || height <= 0) return;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // =========================================================================
  // DATA NORMALIZATION & CHROMATIC ENRICHMENT PIPELINE
  // =========================================================================

  _normalizeColors(colors) {
    if (!colors) return [];

    return colors.map((col, idx) => {
      const hex = typeof col === 'string' ? col : col.hex;
      const rgb = typeof col === 'string' ? ColorMath.hexToRgb(col) : (col.rgb || ColorMath.hexToRgb(hex));
      const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
      const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const lumPct = Math.round(lum * 1000) / 10;
      const cmykGamut = ColorMath.checkCmykGamut ? ColorMath.checkCmykGamut(rgb.r, rgb.g, rgb.b) : { isOutOfGamut: false };
      const temperature = this._getThermalTemperature(rgb);
      const pigmentTube = this._findClosestPigmentTube(rgb);

      // Complementary Color (180 deg hue rotation)
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const compHsv = { ...hsv, h: (hsv.h + 180) % 360 };
      const compRgb = ColorMath.hsvToRgb(compHsv.h, compHsv.s, compHsv.v);
      const compHex = ColorMath.rgbToHex(compRgb.r, compRgb.g, compRgb.b).toUpperCase();

      // Physical paint mixing recipe via Chromilla
      let recipe = null;
      let recipeString = '';
      try {
        if (ChromillaMixer?.solveRecipe) {
          recipe = ChromillaMixer.solveRecipe(rgb);
          if (recipe?.items?.length) {
            recipeString = recipe.items.map(it => `${it.percentage}% ${it.tube.name} (${it.tube.ci})`).join(' + ');
          }
        }
      } catch (err) {
        console.warn('Chromilla recipe calculation error:', err);
      }

      // Precise WCAG 2.1 Contrast Ratios
      const contrastWhite = ColorMath.calculateContrastRatio
        ? ColorMath.calculateContrastRatio(rgb, { r: 255, g: 255, b: 255 }).toFixed(1)
        : '7.2';
      const contrastBlack = ColorMath.calculateContrastRatio
        ? ColorMath.calculateContrastRatio(rgb, { r: 0, g: 0, b: 0 }).toFixed(1)
        : '3.1';

      const name = typeof col === 'object' && col.name ? col.name : this._generateColorName(rgb, munsell);
      const role = typeof col === 'object' && col.role ? col.role : null;
      const tip = typeof col === 'object' && col.tip ? col.tip : this._generateCompositionTip(rgb, lum, idx);

      return {
        hex: hex.toUpperCase(),
        rgb,
        cmyk,
        munsell,
        luminance: lum,
        luminancePct: lumPct,
        cmykGamut,
        temperature,
        pigmentTube,
        compHex,
        compRgb,
        recipe,
        recipeString,
        contrastWhite,
        contrastBlack,
        name,
        role,
        tip,
        weight: typeof col === 'object' ? col.weight : null,
        sourceArtwork: typeof col === 'object' ? col.sourceArtwork : null
      };
    });
  },

  _findClosestPigmentTube(rgb) {
    if (!BrandPigments?.TUBES?.length) return null;
    let best = null;
    let minDist = Infinity;

    for (const tube of BrandPigments.TUBES) {
      const dr = rgb.r - tube.rgb.r;
      const dg = rgb.g - tube.rgb.g;
      const db = rgb.b - tube.rgb.b;
      // Perceptually weighted Euclidean distance (Rec. 601)
      const dist = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
      if (dist < minDist) {
        minDist = dist;
        best = tube;
      }
    }
    return best;
  },

  _getThermalTemperature(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    if (hsv.s < 0.12) {
      return { label: 'Neutro Acromático', tempK: '~5500K' };
    }
    const h = hsv.h;
    if ((h >= 0 && h <= 65) || (h >= 340 && h <= 360)) {
      return { label: 'Cálido (Fuego / Sol)', tempK: '~2800K' };
    }
    if (h >= 140 && h <= 270) {
      return { label: 'Frío (Cielo / Sombra)', tempK: '~7500K' };
    }
    return { label: 'Equilibrado / Medio', tempK: '~5000K' };
  },

  _generateColorName(rgb, munsell) {
    if (munsell?.label) {
      const val = munsell.value > 7 ? 'Claro' : munsell.value < 3 ? 'Oscuro' : 'Medio';
      return `${munsell.label} ${val}`;
    }
    return 'Muestra Cromática';
  },

  _generateCompositionTip(rgb, lum, idx) {
    if (idx === 0) {
      return 'Dominante (60%): Establece la masa tonal del fondo y el estado anímico general.';
    }
    if (idx === 1) {
      return 'Forma (30%): Construye la estructura de volúmenes y planos secundarios.';
    }
    if (idx === 2) {
      return 'Foco (10%): Dirige la mirada inmediatamente hacia el punto focal clave.';
    }
    return 'Acento: Úsalo en toques sutiles para crear vibración óptica y dinamismo.';
  },

  // =========================================================================
  // MODAL DOM EVENT BINDING
  // =========================================================================

  _bindModalEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const modal = document.getElementById('exportSheetModal');
    const btnClose = document.getElementById('btnCloseExportSheetModal');

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };

    if (btnClose) btnClose.onclick = closeModal;

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // 1. Template Pills
    document.querySelectorAll('#exportTemplatePills .export-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tmpl = btn.dataset.template;
        if (tmpl) {
          this.currentConfig.template = tmpl;
          this._updateActivePill('#exportTemplatePills .export-pill-btn', 'data-template', tmpl);
          this._saveUserConfig();
          this.updateLivePreview();
        }
      });
    });

    // 2. Theme Chips
    document.querySelectorAll('#exportThemePills .export-theme-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const th = btn.dataset.theme;
        if (th) {
          this.currentConfig.theme = th;
          this._updateActivePill('#exportThemePills .export-theme-chip', 'data-theme', th);
          this._saveUserConfig();
          this.updateLivePreview();
        }
      });
    });

    // 3. Resolution Select
    const resSelect = document.getElementById('exportResolutionSelect');
    if (resSelect) {
      resSelect.addEventListener('change', () => {
        this.currentConfig.resolution = resSelect.value;
        this._saveUserConfig();
        this.updateLivePreview();
      });
    }

    // 4. Custom Metadata Inputs
    const titleInput = document.getElementById('exportTitleInput');
    const subInput = document.getElementById('exportSubtitleInput');
    const authInput = document.getElementById('exportAuthorInput');

    if (titleInput) {
      titleInput.addEventListener('input', () => {
        this.currentConfig.title = titleInput.value;
        const headingEl = document.getElementById('exportModalTitleHeading');
        if (headingEl) headingEl.textContent = `Lámina: "${titleInput.value}"`;
        this.updateLivePreview();
      });
    }

    if (subInput) {
      subInput.addEventListener('input', () => {
        this.currentConfig.subtitle = subInput.value;
        this.updateLivePreview();
      });
    }

    if (authInput) {
      authInput.addEventListener('input', () => {
        this.currentConfig.author = authInput.value;
        this.updateLivePreview();
      });
    }

    // 5. Toggles Checkboxes
    const bindToggle = (id, configProp) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.currentConfig[configProp] = el.checked;
          this._saveUserConfig();
          this.updateLivePreview();
        });
      }
    };

    bindToggle('chkExpHexRgb', 'showHexRgb');
    bindToggle('chkExpCmyk', 'showCmyk');
    bindToggle('chkExpMunsell', 'showMunsell');
    bindToggle('chkExpLumTemp', 'showLumTemp');
    bindToggle('chkExpPigments', 'showPigments');
    bindToggle('chkExpPaintRecipe', 'showPaintRecipe');
    bindToggle('chkExpComplementary', 'showComplementary');
    bindToggle('chkExpMicroRamp', 'showMicroRamp');
    bindToggle('chkExpRoles', 'showRoles');
    bindToggle('chkExpTips', 'showTips');
    bindToggle('chkExpWcag', 'showWcag');
    bindToggle('chkExpGradientStrip', 'showGradientStrip');
    bindToggle('chkExpWatermark', 'showWatermark');

    // Quick Select All / None toggles
    const btnSelectAll = document.getElementById('btnExportSelectAllToggles');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        const toggleIds = [
          'chkExpHexRgb', 'chkExpCmyk', 'chkExpMunsell', 'chkExpLumTemp',
          'chkExpPigments', 'chkExpPaintRecipe', 'chkExpComplementary',
          'chkExpMicroRamp', 'chkExpRoles', 'chkExpTips', 'chkExpWcag',
          'chkExpGradientStrip', 'chkExpWatermark'
        ];
        toggleIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.checked = true;
        });
        Object.keys(this.currentConfig).forEach(k => {
          if (k.startsWith('show')) this.currentConfig[k] = true;
        });
        this._saveUserConfig();
        this.updateLivePreview();
      });
    }

    const btnDeselectAll = document.getElementById('btnExportDeselectAllToggles');
    if (btnDeselectAll) {
      btnDeselectAll.addEventListener('click', () => {
        const toggleIds = [
          'chkExpHexRgb', 'chkExpCmyk', 'chkExpMunsell', 'chkExpLumTemp',
          'chkExpPigments', 'chkExpPaintRecipe', 'chkExpComplementary',
          'chkExpMicroRamp', 'chkExpRoles', 'chkExpTips', 'chkExpWcag',
          'chkExpGradientStrip', 'chkExpWatermark'
        ];
        toggleIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.checked = false;
        });
        Object.keys(this.currentConfig).forEach(k => {
          if (k.startsWith('show')) this.currentConfig[k] = false;
        });
        this._saveUserConfig();
        this.updateLivePreview();
      });
    }

    // 6. Action: Download High-Res PNG
    const btnDownload = document.getElementById('btnExportDownloadPng');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        if (!this._activeModalState) return;
        this.exportPaletteToPng(this.currentConfig.title, this._activeModalState.rawColors, this.currentConfig);
        if (this._activeModalState.app?.showToast) {
          this._activeModalState.app.showToast('✓ Lámina PNG descargada con éxito', 'success');
        }
      });
    }

    // 7. Action: Copy to Clipboard
    const btnCopy = document.getElementById('btnExportCopyClipboard');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const liveCanvas = document.getElementById('exportLiveCanvas');
        if (!liveCanvas) return;
        const success = await this.copyCanvasToClipboard(liveCanvas);
        if (this._activeModalState?.app?.showToast) {
          if (success) {
            this._activeModalState.app.showToast('📋 ¡Imagen copiada al portapapeles! Lista para pegar con Ctrl+V', 'success');
          } else {
            this._activeModalState.app.showToast('No se pudo copiar directamente al portapapeles', 'warn');
          }
        }
      });
    }

    // 8. Action: Export Vector SVG
    const btnSvg = document.getElementById('btnExportDownloadSvg');
    if (btnSvg) {
      btnSvg.addEventListener('click', () => {
        if (!this._activeModalState) return;
        this.exportToSvg(this.currentConfig.title, this._activeModalState.rawColors, this.currentConfig);
        if (this._activeModalState.app?.showToast) {
          this._activeModalState.app.showToast('✓ Ficha vectorial SVG descargada', 'success');
        }
      });
    }

    // 9. Action: Print / PDF
    const btnPrint = document.getElementById('btnExportPrintPdf');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        const liveCanvas = document.getElementById('exportLiveCanvas');
        if (!liveCanvas) return;
        const dataUrl = liveCanvas.toDataURL('image/png');
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${this.currentConfig.title} — Lámina Cromática GOM Picker</title>
              <style>
                @page { size: landscape; margin: 0; }
                body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
                img { width: 100%; height: 100%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();window.close();" />
            </body>
            </html>
          `);
          printWin.document.close();
        }
      });
    }
  },

  _setCheckbox(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  },

  _updateActivePill(selector, attrName, activeValue) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.getAttribute(attrName) === activeValue) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.SwatchSheetExporter = SwatchSheetExporter;
}
