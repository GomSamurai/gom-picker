/**
 * GOM Picker - Floating Interactive Swatch Tooltip & Inspection Engine
 * Displays rich chromatic intelligence on hover over ANY swatch in the application.
 * Non-intrusive vertical positioning (centered above/below) so neighboring swatches are never blocked.
 * Features grand hero color preview, 6 quick clickable harmony variations (complementary, triads, analogous, tint, shade),
 * clean essential metrics (RGB, CMYK, HSL, Munsell), and quick load/pin actions.
 * Can be completely toggled ON/OFF from user options.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';

export class TooltipEngine {
  constructor(appInstance) {
    this.app = appInstance;
    this.container = null;
    this.isPinned = false;
    this.currentData = null;
    this.currentElement = null;
    this.hoverTimeout = null;
    this.hideTimeout = null;

    // Persisted toggle: enabled by default
    let savedState = true;
    try {
      savedState = localStorage.getItem('gom_tooltips_enabled') !== '0';
    } catch (_) {}
    this.isEnabled = savedState;

    this._createDom();
    this._bindEvents();
  }

  _createDom() {
    this.container = document.createElement('div');
    this.container.id = 'floatingSwatchTooltip';
    this.container.className = 'floating-swatch-tooltip';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
  }

  _bindEvents() {
    // 1. Mouse enters a swatch element
    document.addEventListener('mouseover', (e) => {
      if (this.isPinned || !this.isEnabled) return;

      const target = e.target.closest('[data-swatch-hex], .matrix-swatch, .harmony-card, .swatch-color-block, .swatch-color-pill, .history-item, .atmo-stage-card, .atmo-stage-color-pill, .endpoint-chip, .pigment-step, .extracted-swatch, .companion-band-item, .painter-swatch');
      
      if (target) {
        this._suppressNativeTitle(target);

        clearTimeout(this.hideTimeout);
        clearTimeout(this.hoverTimeout);

        // 200ms debounce: skimming across swatches won't trigger frantic popups
        this.hoverTimeout = setTimeout(() => {
          this.showForElement(target);
        }, 200);
      }
    });

    // 2. Mouse leaves swatch element
    document.addEventListener('mouseout', (e) => {
      if (this.isPinned || !this.isEnabled) return;

      const target = e.target.closest('[data-swatch-hex], .matrix-swatch, .harmony-card, .swatch-color-block, .swatch-color-pill, .history-item, .atmo-stage-card, .atmo-stage-color-pill, .endpoint-chip, .pigment-step, .extracted-swatch, .companion-band-item, .painter-swatch');
      
      if (target) {
        // If cursor moved inside the target or into the tooltip container, do not hide
        if (e.relatedTarget && (target.contains(e.relatedTarget) || this.container.contains(e.relatedTarget))) {
          return;
        }

        clearTimeout(this.hoverTimeout);
        this.hideTimeout = setTimeout(() => {
          this.hide();
        }, 220);
      }
    });

    // 3. Keep tooltip open when cursor moves into the tooltip card itself
    this.container.addEventListener('mouseenter', () => {
      clearTimeout(this.hideTimeout);
      clearTimeout(this.hoverTimeout);
    });

    this.container.addEventListener('mouseleave', (e) => {
      if (!this.isPinned) {
        if (e.relatedTarget && this.currentElement && this.currentElement.contains(e.relatedTarget)) {
          return;
        }
        this.hideTimeout = setTimeout(() => {
          this.hide();
        }, 180);
      }
    });

    // 4. Keyboard shortcuts: 'P' to pin/unpin, 'Escape' to unpin
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'p' || e.key === 'P') {
        if (this.container.style.display !== 'none' || this.currentData) {
          this.togglePin();
        }
      } else if (e.key === 'Escape') {
        if (this.isPinned) {
          this.unpin();
        } else {
          this.hide();
        }
      }
    });
  }

  // Prevent duplicate browser tooltip by stripping native title attribute
  _suppressNativeTitle(el) {
    if (el.hasAttribute('title')) {
      el.dataset.swatchLabel = el.getAttribute('title');
      el.removeAttribute('title');
    }
    el.querySelectorAll('[title]').forEach(child => {
      child.dataset.swatchLabel = child.getAttribute('title');
      child.removeAttribute('title');
    });
  }

  // Extract color data from element
  _extractColorFromElement(el) {
    let hex = el.dataset?.swatchHex;
    if (!hex) {
      const bg = el.style.backgroundColor || window.getComputedStyle(el).backgroundColor;
      if (bg) {
        const rgbMatch = bg.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
          hex = ColorMath.rgbToHex(parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2]));
        }
      }
    }

    if (!hex || !hex.startsWith('#')) return null;

    const rgb = ColorMath.hexToRgb(hex);
    const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const lum = Math.round(ColorMath.getLuminance(rgb.r, rgb.g, rgb.b) * 100);

    // Thermal temperature approximation
    let tempDesc = 'Neutro';
    let tempColor = '#94A3B8';
    if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 325) {
      tempDesc = 'Cálido Solar';
      tempColor = '#F59E0B';
    } else if (hsv.h >= 165 && hsv.h <= 270) {
      tempDesc = 'Frío Espectral';
      tempColor = '#06B6D4';
    } else if (hsv.h > 75 && hsv.h < 165) {
      tempDesc = 'Vegetal / Follaje';
      tempColor = '#10B981';
    } else {
      tempDesc = 'Violeta Crepuscular';
      tempColor = '#A855F7';
    }

    // Label / Title clean extraction
    let label = el.dataset?.swatchLabel || el.dataset?.role || el.querySelector('.harmony-card-role')?.textContent || 'Muestra de Color';
    if (label.includes('(')) label = label.split('(')[0].trim();
    if (label.includes('•')) label = label.split('•')[0].trim();

    // 6 Quick Companion Variations for painters
    const variations = this._generateVariations(hsv, rgb);

    return {
      hex,
      rgb,
      cmyk,
      hsl,
      hsv,
      munsell,
      lum,
      tempDesc,
      tempColor,
      label,
      variations
    };
  }

  _generateVariations(hsv, rgb) {
    // 1. Complementary (180°)
    const hComp = (hsv.h + 180) % 360;
    const rgbComp = ColorMath.hsvToRgb(hComp, hsv.s, hsv.v);

    // 2. Triad + (+120°)
    const hTri1 = (hsv.h + 120) % 360;
    const rgbTri1 = ColorMath.hsvToRgb(hTri1, hsv.s, hsv.v);

    // 3. Triad - (-120°)
    const hTri2 = (hsv.h + 240) % 360;
    const rgbTri2 = ColorMath.hsvToRgb(hTri2, hsv.s, hsv.v);

    // 4. Analogous (+30°)
    const hAna = (hsv.h + 30) % 360;
    const rgbAna = ColorMath.hsvToRgb(hAna, hsv.s, hsv.v);

    // 5. Painterly Highlight / Tint (higher value, reduced saturation)
    const vTint = Math.min(1, hsv.v * 1.25 + 0.15);
    const sTint = Math.max(0, hsv.s * 0.7);
    const rgbTint = ColorMath.hsvToRgb(hsv.h, sTint, vTint);

    // 6. Painterly Shadow (reduced value, cooler shift +15°)
    const vShade = Math.max(0.12, hsv.v * 0.55);
    const sShade = Math.min(1, hsv.s * 1.15);
    const hShade = (hsv.h + 15) % 360;
    const rgbShade = ColorMath.hsvToRgb(hShade, sShade, vShade);

    return [
      { label: 'Comp', name: 'Complementario (180°)', hex: ColorMath.rgbToHex(rgbComp.r, rgbComp.g, rgbComp.b), rgb: rgbComp },
      { label: 'Tríada+', name: 'Tríada Superior (+120°)', hex: ColorMath.rgbToHex(rgbTri1.r, rgbTri1.g, rgbTri1.b), rgb: rgbTri1 },
      { label: 'Tríada-', name: 'Tríada Inferior (-120°)', hex: ColorMath.rgbToHex(rgbTri2.r, rgbTri2.g, rgbTri2.b), rgb: rgbTri2 },
      { label: 'Análogo', name: 'Análogo (+30°)', hex: ColorMath.rgbToHex(rgbAna.r, rgbAna.g, rgbAna.b), rgb: rgbAna },
      { label: 'Luz', name: 'Tinte / Luz Pictórica', hex: ColorMath.rgbToHex(rgbTint.r, rgbTint.g, rgbTint.b), rgb: rgbTint },
      { label: 'Sombra', name: 'Sombra Pictórica Fría', hex: ColorMath.rgbToHex(rgbShade.r, rgbShade.g, rgbShade.b), rgb: rgbShade }
    ];
  }

  showForElement(el) {
    if (!this.isEnabled) return;

    const data = this._extractColorFromElement(el);
    if (!data) return;

    this.currentData = data;
    this.currentElement = el;

    this.container.innerHTML = this._buildTooltipHtml(data, this.isPinned);
    this.container.style.display = 'flex';
    this._attachTooltipInnerEvents(this.container);

    this._positionTooltip(el);
  }

  /**
   * Vertically places the popup centered ABOVE the swatch (or BELOW if top has no room).
   * Never places to the right, ensuring neighboring swatches in the row/grid are 100% visible!
   */
  _positionTooltip(el) {
    const tt = this.container;
    const rect = el.getBoundingClientRect();
    const w = tt.offsetWidth || 300;
    const h = tt.offsetHeight || 320;

    // Horizontally centered on the swatch
    let posX = rect.left + (rect.width / 2) - (w / 2);

    // Prefer placing ABOVE the swatch
    let posY = rect.top - h - 12;

    // If near the top edge of the window, place BELOW the swatch
    if (posY < 12) {
      posY = rect.bottom + 12;
    }

    // Clamp horizontal boundaries
    if (posX + w > window.innerWidth - 12) {
      posX = window.innerWidth - w - 12;
    }
    if (posX < 12) {
      posX = 12;
    }

    // Clamp vertical boundaries
    if (posY + h > window.innerHeight - 12) {
      posY = Math.max(12, window.innerHeight - h - 12);
    }

    tt.style.left = `${Math.round(posX)}px`;
    tt.style.top = `${Math.round(posY)}px`;
  }

  _buildTooltipHtml(data, isPinnedMode) {
    return `
      <div class="swatch-tooltip-card ${isPinnedMode ? 'is-pinned-card' : ''}">
        <!-- Grand Hero Swatch Preview Header -->
        <div class="swatch-tooltip-hero-block" style="background-color: ${data.hex};">
          <div class="hero-block-overlay">
            <div class="hero-block-meta">
              <span class="hero-block-label" title="${data.label}">${data.label}</span>
              <button class="hero-hex-badge copyable-hex" data-hex="${data.hex}" title="Click para copiar código HEX">
                <span>${data.hex}</span>
                <span class="copy-icon">📋</span>
              </button>
            </div>
            <div class="hero-block-controls">
              <button class="tooltip-icon-btn btn-pin-toggle" title="${isPinnedMode ? 'Desanclar popup (Esc)' : 'Fijar información en pantalla (Tecla P)'}">
                <span>${isPinnedMode ? '📌 Fijado' : '📌 Fijar'}</span>
              </button>
              ${isPinnedMode ? `<button class="tooltip-icon-btn btn-close-tooltip" title="Cerrar (Esc)">✕</button>` : ''}
            </div>
          </div>
        </div>

        <!-- Quick Companion Variations Strip (Clickable to load directly) -->
        <div class="tooltip-variations-box">
          <div class="tooltip-section-header">
            <span class="tooltip-section-title">VARIACIONES & ARMONÍAS RÁPIDAS</span>
            <span class="tooltip-section-sub">Click para seleccionar</span>
          </div>
          <div class="tooltip-variations-strip">
            ${data.variations.map(v => `
              <div class="tooltip-var-chip" style="background-color: ${v.hex};" data-hex="${v.hex}" title="${v.name}: ${v.hex}">
                <span class="var-chip-tag">${v.label}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Coordinates & Analysis Grid -->
        <div class="swatch-tooltip-grid">
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">RGB</span>
            <span class="stat-val">${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b}</span>
          </div>
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">CMYK</span>
            <span class="stat-val">${data.cmyk.c}C ${data.cmyk.m}M ${data.cmyk.y}Y ${data.cmyk.k}K</span>
          </div>
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">HSL</span>
            <span class="stat-val">${data.hsl.h}°, ${Math.round(data.hsl.s * 100)}%, ${Math.round(data.hsl.l * 100)}%</span>
          </div>
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">MUNSELL</span>
            <span class="stat-val stat-munsell">${data.munsell.notation}</span>
          </div>
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">LUMINOSIDAD</span>
            <span class="stat-val">${data.lum}% (Y)</span>
          </div>
          <div class="swatch-tooltip-stat">
            <span class="stat-lbl">TEMPERATURA</span>
            <span class="stat-val" style="color: ${data.tempColor};">${data.tempDesc}</span>
          </div>
        </div>

        <!-- Action Buttons Toolbar -->
        <div class="swatch-tooltip-actions">
          <button class="tooltip-act-btn btn-set-fg" title="Cargar como color frontal">
            <span>●</span> Color Frontal
          </button>
          <button class="tooltip-act-btn btn-set-bg" title="Cargar como color de fondo">
            <span>○</span> Fondo
          </button>
          <button class="tooltip-act-btn btn-add-swatch" title="Añadir a biblioteca de muestras">
            <span>+</span> A Paleta
          </button>
        </div>
      </div>
    `;
  }

  _attachTooltipInnerEvents(container) {
    const pinBtn = container.querySelector('.btn-pin-toggle');
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePin();
      });
    }

    const closeBtn = container.querySelector('.btn-close-tooltip');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unpin();
      });
    }

    const hexEl = container.querySelector('.copyable-hex');
    if (hexEl) {
      hexEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentData) {
          navigator.clipboard.writeText(this.currentData.hex);
          if (this.app?.showToast) this.app.showToast(`HEX copiado: ${this.currentData.hex}`);
        }
      });
    }

    // Mini companion variation chips: click to load directly!
    const varChips = container.querySelectorAll('.tooltip-var-chip');
    varChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = chip.dataset.hex;
        if (hex && this.app) {
          const rgb = ColorMath.hexToRgb(hex);
          this.app.setColorDirectly(rgb);
          if (this.app?.showToast) this.app.showToast(`Color cargado: ${hex}`);
          // If in pinned mode, re-render tooltip with this newly selected color
          if (this.isPinned) {
            this.showForElement(chip);
          }
        }
      });
    });

    const btnFg = container.querySelector('.btn-set-fg');
    if (btnFg) {
      btnFg.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentData && this.app) {
          this.app.activeWell = 'fg';
          this.app.setColorDirectly(this.currentData.rgb);
          if (this.app?.showToast) this.app.showToast(`Color frontal: ${this.currentData.hex}`);
        }
      });
    }

    const btnBg = container.querySelector('.btn-set-bg');
    if (btnBg) {
      btnBg.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentData && this.app) {
          this.app.activeWell = 'bg';
          this.app.setColorDirectly(this.currentData.rgb);
          if (this.app?.showToast) this.app.showToast(`Color de fondo: ${this.currentData.hex}`);
        }
      });
    }

    const btnAdd = container.querySelector('.btn-add-swatch');
    if (btnAdd) {
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentData && this.app?.swatchManager) {
          this.app.swatchManager.addToHistory(this.currentData.hex);
          if (this.app.swatchManager.palettes.length > 0) {
            this.app.swatchManager.palettes[0].colors.push(this.currentData.hex);
            this.app.swatchManager.savePalettes();
            if (this.app.renderSwatchesCollection) this.app.renderSwatchesCollection();
            if (this.app.renderQuickPalette) this.app.renderQuickPalette();
          }
          if (this.app?.showToast) this.app.showToast(`Añadido a muestras: ${this.currentData.hex}`);
        }
      });
    }
  }

  // --- POPUP TOGGLE SYSTEM ---

  toggleEnabled() {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('gom_tooltips_enabled', this.isEnabled ? '1' : '0');
    } catch (_) {}

    if (!this.isEnabled) {
      this.unpin();
      this.hide();
    }

    this.syncToggleButtons();
    if (this.app?.showToast) {
      this.app.showToast(this.isEnabled ? 'Popups de muestra: ACTIVADOS' : 'Popups de muestra: DESACTIVADOS');
    }
  }

  syncToggleButtons() {
    const btns = document.querySelectorAll('.btn-toggle-swatch-popups');
    btns.forEach(btn => {
      btn.classList.toggle('active-toggle', this.isEnabled);
      const textEl = btn.querySelector('.btn-tool-text');
      if (textEl) {
        textEl.textContent = this.isEnabled ? 'Popups Muestras: ON' : 'Popups Muestras: OFF';
      }
    });
  }

  togglePin() {
    if (this.isPinned) {
      this.unpin();
    } else {
      this.pin();
    }
  }

  pin() {
    if (!this.currentData) return;
    this.isPinned = true;
    this.container.innerHTML = this._buildTooltipHtml(this.currentData, true);
    this.container.classList.add('pinned-tooltip');
    this._attachTooltipInnerEvents(this.container);
    if (this.app?.showToast) this.app.showToast('📌 Información anclada en pantalla. Pulsa Esc o ✕ para liberar.');
  }

  unpin() {
    this.isPinned = false;
    this.container.classList.remove('pinned-tooltip');
    this.hide();
  }

  hide() {
    if (this.isPinned) return;
    this.container.style.display = 'none';
  }
}
