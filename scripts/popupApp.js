/**
 * GOM Picker - Floating Independent Mini Window Application (Pro Edition)
 * Engineered for digital painters, illustrators, and 3D artists.
 * Synchronizes seamlessly with Photoshop, Krita, Blender, and the main studio window
 * via BroadcastChannel, UXP Bridge, and localStorage.
 */

import { ColorMath } from './colorMath.js';
import { ColorWheel } from './colorWheel.js';
import { CompanionBands } from './companionBands.js';
import { MunsellSystem } from './munsellSystem.js';
import { FlorentFargesEngine } from './florentFarges.js';
import { AtmosphereEngine } from './atmosphereEngine.js';
import { SwatchManager } from './swatches.js';
import { HarmonyEngine } from './harmonies.js';
import { GamutMaskEngine } from './gamutMask.js';

class GomPopupApp {
  constructor() {
    this.activeWell = 'fg';
    this.fgColor = { r: 99, g: 102, b: 241, hex: '#6366F1' };
    this.bgColor = { r: 244, g: 63, b: 94, hex: '#F43F5E' };
    this.activeSpace = 'rgb';
    this.density = localStorage.getItem('gom_mini_density') || 'studio';
    this.mixMode = 'ryb';
    this.activeSwatchesTab = 'recents'; // 'recents' | 'palette'

    this.colorWheel = null;
    this.syncChannel = null;
    this.swatchManager = new SwatchManager();
    this.resizeObserver = null;

    this.init();
  }

  init() {
    // 1. Setup BroadcastChannel bidirectional synchronization
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('gom_picker_sync');
      this.syncChannel.onmessage = (e) => this._handleBroadcastMessage(e.data);
    }

    // 2. Setup localStorage sync fallback
    window.addEventListener('storage', (e) => {
      if (e.key === 'gom_picker_palettes' || e.key === 'gom_picker_history') {
        this.renderHistoryAndPalette();
      }
    });

    // 3. Initialize Responsive Color Wheel
    const canvas = document.getElementById('colorWheelCanvasMini');
    const initialHsv = ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b);

    this.colorWheel = new ColorWheel(canvas, {
      mode: 'triangle',
      harmonyRule: 'triadic',
      onChange: (colorData) => this.handleColorChange(colorData, true)
    });

    // 4. Setup ResizeObserver on wheel container for fluid scaling
    this._setupResponsiveWheel();

    // 5. Bind All UI Controls, Tools & Shortcuts
    this._bindControls();
    this._bindShortcuts();

    // 6. Set initial view density
    this.setDensity(this.density);

    // 7. Request initial state sync from main app
    this._requestMainStateSync();

    // 8. Initial Render
    this.colorWheel.setColor(initialHsv, true);
  }

  // --- RESPONSIVE WHEEL SCALING ---

  _setupResponsiveWheel() {
    const container = document.getElementById('wheelContainerMini');
    if (container && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.colorWheel) {
          this.colorWheel.resize();
        }
      });
      this.resizeObserver.observe(container);
    }

    window.addEventListener('resize', () => {
      if (this.colorWheel) {
        this.colorWheel.resize();
      }
    });
  }

  // --- BIDIRECTIONAL SYNC ---

  _handleBroadcastMessage(data) {
    if (!data) return;

    if (data.type === 'MAIN_COLOR_UPDATE') {
      const { rgb, hex, activeWell, fgColor, bgColor } = data;
      if (fgColor) this.fgColor = { ...fgColor };
      if (bgColor) this.bgColor = { ...bgColor };
      
      if (activeWell && activeWell !== this.activeWell) {
        this.setActiveWell(activeWell, false);
      }

      const curColor = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
      const targetRgb = rgb || curColor;
      const hsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);
      this.colorWheel.setColor(hsv, false);
      this.handleColorChange({ rgb: targetRgb, hex: hex || ColorMath.rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b) }, false);
    } else if (data.type === 'MAIN_STATE_SYNC') {
      if (data.fgColor) this.fgColor = { ...data.fgColor };
      if (data.bgColor) this.bgColor = { ...data.bgColor };
      if (data.activeWell) this.setActiveWell(data.activeWell, false);
      if (data.wheelMode && this.colorWheel) {
        this.colorWheel.setMode(data.wheelMode);
        const sel = document.getElementById('wheelModeSelectMini');
        if (sel) sel.value = data.wheelMode;
      }
      if (data.harmonyRule && this.colorWheel) {
        this.colorWheel.setHarmonyRule(data.harmonyRule);
        const sel = document.getElementById('harmonyRuleSelectMini');
        if (sel) sel.value = data.harmonyRule;
      }
      this.renderHistoryAndPalette();
      const curColor = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
      this.colorWheel.setColor(ColorMath.rgbToHsv(curColor.r, curColor.g, curColor.b), false);
    }
  }

  _requestMainStateSync() {
    if (this.syncChannel) {
      this.syncChannel.postMessage({ type: 'POPUP_REQUEST_SYNC' });
    }
  }

  // --- VIEW DENSITY (Mini, Studio, Pro) ---

  setDensity(density) {
    this.density = density;
    document.body.dataset.density = density;
    try {
      localStorage.setItem('gom_mini_density', density);
    } catch (e) {}

    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.density === density);
    });

    setTimeout(() => {
      if (this.colorWheel) this.colorWheel.resize();
    }, 50);
  }

  // --- WELL SELECTION & CONTROLS ---

  setActiveWell(well, updateWheel = true) {
    this.activeWell = well;
    const fg = document.getElementById('fgWellMini');
    const bg = document.getElementById('bgWellMini');

    if (well === 'fg') {
      fg.classList.add('active-well');
      bg.classList.remove('active-well');
      if (updateWheel) {
        this.colorWheel.setColor(ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b), false);
      }
    } else {
      bg.classList.add('active-well');
      fg.classList.remove('active-well');
      if (updateWheel) {
        this.colorWheel.setColor(ColorMath.rgbToHsv(this.bgColor.r, this.bgColor.g, this.bgColor.b), false);
      }
    }

    const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.updateAuxiliaryPanels(cur);
  }

  swapWells() {
    const temp = { ...this.fgColor };
    this.fgColor = { ...this.bgColor };
    this.bgColor = temp;

    document.getElementById('fgWellMini').style.backgroundColor = this.fgColor.hex;
    document.getElementById('bgWellMini').style.backgroundColor = this.bgColor.hex;

    const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.colorWheel.setColor(ColorMath.rgbToHsv(cur.r, cur.g, cur.b), true);

    if (this.syncChannel) {
      this.syncChannel.postMessage({ type: 'POPUP_SWAP_WELLS' });
    }
    this.showToast('⇄ Colores FG y BG intercambiados');
  }

  setDefaultColors() {
    this.fgColor = { r: 255, g: 255, b: 255, hex: '#FFFFFF' };
    this.bgColor = { r: 0, g: 0, b: 0, hex: '#000000' };

    document.getElementById('fgWellMini').style.backgroundColor = '#FFFFFF';
    document.getElementById('bgWellMini').style.backgroundColor = '#000000';

    const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.colorWheel.setColor(ColorMath.rgbToHsv(cur.r, cur.g, cur.b), true);
    this.showToast('⚪⚫ Colores restablecidos a Blanco y Negro');
  }

  // --- EYEDROPPER / PIPETTE ---

  async openEyeDropper() {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          this.setColorFromHex(result.sRGBHex);
          this.showToast(`🧪 Muestra capturada: ${result.sRGBHex}`);
        }
      } catch (err) {
        // User cancelled sampling
      }
    } else {
      this.showToast('Pipeta de pantalla no soportada en este navegador (usa Chrome/Edge/Opera)', 'warning');
    }
  }

  // --- VALUE CHECK MODE (GRAYSCALE) ---

  toggleValueCheck() {
    const isVal = document.body.classList.toggle('value-check-mode');
    const btn = document.getElementById('btnValueCheckMini');
    if (btn) btn.classList.toggle('active', isVal);
    this.showToast(isVal ? '👁️ Modo Valor Tonal B/N Activado' : '👁️ Modo Color Normal');
  }

  // --- COLOR CHANGE HANDLER ---

  handleColorChange(colorData, broadcast = true) {
    const { rgb, hex } = colorData;

    if (this.activeWell === 'fg') {
      this.fgColor = { ...rgb, hex };
      document.getElementById('fgWellMini').style.backgroundColor = hex;
    } else {
      this.bgColor = { ...rgb, hex };
      document.getElementById('bgWellMini').style.backgroundColor = hex;
    }

    // Update HEX & Munsell
    document.getElementById('displayHexMini').textContent = hex;
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    document.getElementById('displayMunsellMini').textContent = munsell.notation;

    // CMYK Gamut Check
    const cmykCheck = ColorMath.checkCmykGamut(rgb.r, rgb.g, rgb.b);
    const gamutEl = document.getElementById('displayGamutMini');
    const btnFix = document.getElementById('btnFixGamutMini');

    if (cmykCheck.isOutOfGamut) {
      gamutEl.className = 'hero-gamut-badge out-gamut';
      gamutEl.textContent = `⚠️ CMYK Δ${cmykCheck.delta}`;
      if (btnFix) btnFix.style.display = 'inline-block';
    } else {
      gamutEl.className = 'hero-gamut-badge in-gamut';
      gamutEl.textContent = `● CMYK ${cmykCheck.totalInk}%`;
      if (btnFix) btnFix.style.display = 'none';
    }

    // WCAG contrast ratio with default dark canvas
    const contrastRatio = ColorMath.calculateContrastRatio(rgb, { r: 9, g: 10, b: 15 });
    const wcagEl = document.getElementById('displayWcagMini');
    if (wcagEl) {
      wcagEl.textContent = `${contrastRatio.toFixed(1)}:1`;
      wcagEl.style.color = contrastRatio >= 4.5 ? '#10B981' : '#F59E0B';
    }

    // Update All Sub-Panels
    this.updateAuxiliaryPanels(rgb);

    // Save to history debounce
    this._recordHistory(hex);

    // Broadcast update to main window
    if (broadcast && this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'POPUP_COLOR_UPDATE',
        activeWell: this.activeWell,
        rgb,
        hex
      });
    }
  }

  setColorFromHex(hex, targetWell = null) {
    if (!ColorMath.isValidHex(hex)) return;
    const rgb = ColorMath.hexToRgb(hex);
    if (targetWell && targetWell !== this.activeWell) {
      this.setActiveWell(targetWell, false);
    }
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.colorWheel.setColor(hsv, true);
  }

  // --- AUXILIARY PANELS UPDATE ---

  updateAuxiliaryPanels(rgb) {
    try { this.renderWheelHarmonies(); } catch (e) { console.warn(e); }
    try { this.renderPhysicalMixStrip(); } catch (e) { console.warn(e); }
    try { this.renderLightShadowGrid(rgb); } catch (e) { console.warn(e); }
    try { this.renderPigmentRecipe(rgb); } catch (e) { console.warn(e); }
    try { this.renderCompanionBands(rgb); } catch (e) { console.warn(e); }
    try { this.renderSliders(rgb); } catch (e) { console.warn(e); }
  }

  // 1. Wheel Harmonies quick chips under wheel
  renderWheelHarmonies() {
    const container = document.getElementById('wheelHarmoniesMini');
    if (!container || !this.colorWheel) return;
    container.innerHTML = '';

    const harmony = HarmonyEngine.getHarmony(this.colorWheel.hsv, this.colorWheel.harmonyRule, this.colorWheel.mode === 'ryb' ? 'ryb' : 'rgb');
    const colors = harmony.colors || [];

    colors.forEach(col => {
      const chip = document.createElement('div');
      chip.className = 'harmony-node-chip';
      chip.title = `${col.name} (${col.hex}) - Click para cargar en FG | Alt+Click: BG`;
      chip.innerHTML = `
        <span class="harmony-chip-dot" style="background:${col.hex};"></span>
        <span>${col.hex}</span>
      `;
      chip.addEventListener('click', (e) => {
        const well = e.altKey ? 'bg' : 'fg';
        this.setColorFromHex(col.hex, well);
      });
      container.appendChild(chip);
    });
  }

  // 2. Physical Subtractive FG <-> BG Transition Ramp
  renderPhysicalMixStrip() {
    const container = document.getElementById('physicalMixStripMini');
    if (!container) return;
    container.innerHTML = '';

    const fgRgb = { r: this.fgColor.r, g: this.fgColor.g, b: this.fgColor.b };
    const bgRgb = { r: this.bgColor.r, g: this.bgColor.g, b: this.bgColor.b };

    const steps = [
      { weight: 0.0, label: '100% FG' },
      { weight: 0.2, label: '80/20' },
      { weight: 0.4, label: '60/40' },
      { weight: 0.5, label: '50/50' },
      { weight: 0.6, label: '40/60' },
      { weight: 0.8, label: '20/80' },
      { weight: 1.0, label: '100% BG' }
    ];

    steps.forEach(st => {
      const mixedRgb = ColorMath.mixByMode(fgRgb, bgRgb, st.weight, this.mixMode);
      const hex = ColorMath.rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b);

      const swatch = document.createElement('div');
      swatch.className = 'mix-swatch';
      swatch.style.backgroundColor = hex;
      swatch.title = `Mezcla ${st.label}: ${hex} (Click: Cargar FG | Alt+Click: Cargar BG)`;
      
      const txt = document.createElement('span');
      txt.className = 'mix-swatch-txt';
      txt.textContent = st.weight === 0 ? 'FG' : (st.weight === 1 ? 'BG' : `${Math.round((1 - st.weight) * 100)}%`);
      swatch.appendChild(txt);

      swatch.addEventListener('click', (e) => {
        const well = e.altKey ? 'bg' : 'fg';
        this.setColorFromHex(hex, well);
      });

      container.appendChild(swatch);
    });
  }

  // 3. Scientific Light & Shadow Grid (Sorolla / Gurney)
  renderLightShadowGrid(rgb) {
    const physics = AtmosphereEngine.calculateLightingStages ? AtmosphereEngine.calculateLightingStages(rgb) : AtmosphereEngine.calculateShadowPhysics(rgb);
    if (!physics) return;

    const updateItem = (cardId, swatchId, hexId, item) => {
      const card = document.getElementById(cardId);
      const swatch = document.getElementById(swatchId);
      const hexSpan = document.getElementById(hexId);

      if (swatch) swatch.style.backgroundColor = item.hex;
      if (hexSpan) hexSpan.textContent = item.hex;

      if (card) {
        card.onclick = (e) => {
          const well = e.altKey ? 'bg' : 'fg';
          this.setColorFromHex(item.hex, well);
        };
      }
    };

    updateItem('lightCardHighlight', 'lightSwatchHighlight', 'lightHexHighlight', physics.highlight);
    updateItem('lightCardLocal', 'lightSwatchLocal', 'lightHexLocal', physics.local);
    updateItem('lightCardShadow', 'lightSwatchShadow', 'lightHexShadow', physics.shadow);
    updateItem('lightCardTerminator', 'lightSwatchTerminator', 'lightHexTerminator', physics.terminator);
  }

  // 4. Florent Farges Physical Pigment Solver
  renderPigmentRecipe(rgb) {
    const formulaEl = document.getElementById('pigmentFormulaText');
    const notesEl = document.getElementById('pigmentNotesText');
    const valEl = document.getElementById('pigmentInherentValBadge');

    if (!formulaEl || !notesEl) return;

    try {
      const solver = FlorentFargesEngine.solveMixingForColor(rgb);
      formulaEl.textContent = `${solver.cand1?.name || 'Pigmento 1'} (${solver.cand1?.ci || ''}) + ${solver.cand2?.name || 'Pigmento 2'} (${solver.cand2?.ci || ''})`;
      notesEl.textContent = `${solver.valueAdvice || ''} ${solver.chromaAdvice || ''}`;
      
      if (valEl) {
        const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
        const val = (hsv.v * 9).toFixed(1);
        valEl.textContent = `Val ${val} / 9`;
      }
    } catch (e) {
      console.warn('Error rendering pigment recipe:', e);
    }
  }

  // 5. Recent Swatches & Project Palette
  renderHistoryAndPalette() {
    // Recents
    const recentsContainer = document.getElementById('recentsStripMini');
    if (recentsContainer) {
      recentsContainer.innerHTML = '';
      const history = this.swatchManager.history.slice(0, 16);
      history.forEach(hex => {
        const chip = document.createElement('div');
        chip.className = 'swatch-chip';
        chip.style.backgroundColor = hex;
        chip.title = `${hex} (Click: Cargar FG | Alt+Click: BG)`;
        chip.addEventListener('click', (e) => {
          const well = e.altKey ? 'bg' : 'fg';
          this.setColorFromHex(hex, well);
        });
        recentsContainer.appendChild(chip);
      });
    }

    // Active Palette
    const paletteContainer = document.getElementById('activePaletteStripMini');
    if (paletteContainer) {
      paletteContainer.innerHTML = '';
      const activePal = this.swatchManager.getActivePalette();
      const colors = activePal?.colors || [];

      if (colors.length === 0) {
        paletteContainer.innerHTML = `<span style="font-size:0.62rem; color:#64748B;">Paleta vacía. Añade con '+ Paleta'.</span>`;
      } else {
        colors.forEach(hex => {
          const chip = document.createElement('div');
          chip.className = 'swatch-chip';
          chip.style.backgroundColor = hex;
          chip.title = `${hex} de '${activePal.name}' (Click: FG | Alt+Click: BG)`;
          chip.addEventListener('click', (e) => {
            const well = e.altKey ? 'bg' : 'fg';
            this.setColorFromHex(hex, well);
          });
          paletteContainer.appendChild(chip);
        });
      }
    }
  }

  _recordHistory(hex) {
    clearTimeout(this._historyTimer);
    this._historyTimer = setTimeout(() => {
      this.swatchManager.addToHistory(hex);
      this.renderHistoryAndPalette();
    }, 600);
  }

  pinCurrentColorToPalette() {
    const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    const hex = cur.hex;
    this.swatchManager.addColorToActivePalette(hex);
    this.renderHistoryAndPalette();
    this.showToast(`📥 ${hex} guardado en la paleta activa`);

    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'POPUP_ADD_TO_PALETTE',
        paletteColor: hex
      });
    }
  }

  clearHistory() {
    this.swatchManager.clearHistory();
    this.renderHistoryAndPalette();
    this.showToast('Historial reciente limpiado');
  }

  // 6. Companion Bands
  renderCompanionBands(rgb) {
    const container = document.getElementById('companionBandsListMini');
    if (!container) return;
    container.innerHTML = '';

    const bands = CompanionBands.calculateBands(rgb);
    bands.forEach(b => {
      const stripe = document.createElement('div');
      stripe.className = 'companion-stripe';
      stripe.style.backgroundColor = b.hex;
      stripe.title = `${b.label}: ${b.hex} (Click: FG | Alt+Click: BG)`;
      stripe.addEventListener('click', (e) => {
        const well = e.altKey ? 'bg' : 'fg';
        this.setColorFromHex(b.hex, well);
      });
      container.appendChild(stripe);
    });
  }

  // 7. Multi-Space Numeric Sliders (RGB / CMYK / HSL / OKLCH)
  renderSliders(rgb) {
    const container = document.getElementById('slidersContainerMini');
    if (!container) return;
    container.innerHTML = '';

    let channels = [];
    if (this.activeSpace === 'rgb') {
      channels = [
        { label: 'R', val: rgb.r, min: 0, max: 255, key: 'r' },
        { label: 'G', val: rgb.g, min: 0, max: 255, key: 'g' },
        { label: 'B', val: rgb.b, min: 0, max: 255, key: 'b' }
      ];
    } else if (this.activeSpace === 'cmyk') {
      const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
      channels = [
        { label: 'C', val: cmyk.c, min: 0, max: 100, key: 'c' },
        { label: 'M', val: cmyk.m, min: 0, max: 100, key: 'm' },
        { label: 'Y', val: cmyk.y, min: 0, max: 100, key: 'y' },
        { label: 'K', val: cmyk.k, min: 0, max: 100, key: 'k' }
      ];
    } else if (this.activeSpace === 'oklch') {
      const oklch = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
      channels = [
        { label: 'L', val: Math.round(oklch.l * 100), min: 0, max: 100, key: 'l' },
        { label: 'C', val: Math.round(oklch.c * 100), min: 0, max: 40, key: 'c' },
        { label: 'H', val: Math.round(oklch.h), min: 0, max: 360, key: 'h' }
      ];
    } else {
      const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
      channels = [
        { label: 'H', val: hsl.h, min: 0, max: 360, key: 'h' },
        { label: 'S', val: Math.round(hsl.s * 100), min: 0, max: 100, key: 's' },
        { label: 'L', val: Math.round(hsl.l * 100), min: 0, max: 100, key: 'l' }
      ];
    }

    channels.forEach(ch => {
      const row = document.createElement('div');
      row.className = 'slider-row';

      const lbl = document.createElement('span');
      lbl.className = 'slider-label';
      lbl.textContent = ch.label;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'color-slider';
      slider.min = ch.min;
      slider.max = ch.max;
      slider.value = ch.val;

      const num = document.createElement('input');
      num.type = 'number';
      num.className = 'slider-input';
      num.min = ch.min;
      num.max = ch.max;
      num.value = ch.val;

      const onChange = (v) => {
        v = parseInt(v, 10) || 0;
        slider.value = v;
        num.value = v;

        if (this.activeSpace === 'rgb') {
          const r = ch.key === 'r' ? v : rgb.r;
          const g = ch.key === 'g' ? v : rgb.g;
          const b = ch.key === 'b' ? v : rgb.b;
          this.colorWheel.setColor(ColorMath.rgbToHsv(r, g, b), true);
        } else if (this.activeSpace === 'cmyk') {
          const currentCmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
          currentCmyk[ch.key] = v;
          const newRgb = ColorMath.cmykToRgb(currentCmyk.c, currentCmyk.m, currentCmyk.y, currentCmyk.k);
          this.colorWheel.setColor(ColorMath.rgbToHsv(newRgb.r, newRgb.g, newRgb.b), true);
        } else if (this.activeSpace === 'oklch') {
          const currentOk = ColorMath.rgbToOklch(rgb.r, rgb.g, rgb.b);
          if (ch.key === 'l') currentOk.l = v / 100;
          else if (ch.key === 'c') currentOk.c = v / 100;
          else currentOk.h = v;
          const newRgb = ColorMath.oklchToRgb(currentOk.l, currentOk.c, currentOk.h);
          this.colorWheel.setColor(ColorMath.rgbToHsv(newRgb.r, newRgb.g, newRgb.b), true);
        } else {
          const currentHsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
          if (ch.key === 'h') currentHsl.h = v;
          else if (ch.key === 's') currentHsl.s = v / 100;
          else currentHsl.l = v / 100;
          const newRgb = ColorMath.hslToRgb(currentHsl.h, currentHsl.s, currentHsl.l);
          this.colorWheel.setColor(ColorMath.rgbToHsv(newRgb.r, newRgb.g, newRgb.b), true);
        }
      };

      slider.addEventListener('input', (e) => onChange(e.target.value));
      num.addEventListener('change', (e) => onChange(e.target.value));

      row.appendChild(lbl);
      row.appendChild(slider);
      row.appendChild(num);
      container.appendChild(row);
    });
  }

  // --- UI BINDINGS ---

  _bindControls() {
    // 1. EyeDropper
    const btnPipette = document.getElementById('btnPipetteMini');
    if (btnPipette) {
      btnPipette.addEventListener('click', () => this.openEyeDropper());
    }

    // 2. Value Check Mode
    const btnValue = document.getElementById('btnValueCheckMini');
    if (btnValue) {
      btnValue.addEventListener('click', () => this.toggleValueCheck());
    }

    // 3. Density Mode Switcher
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setDensity(btn.dataset.density));
    });

    // 4. Wheel Mode Select
    const modeSelect = document.getElementById('wheelModeSelectMini');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.colorWheel.setMode(e.target.value);
        this.renderWheelHarmonies();
      });
    }

    // 5. Harmony Rule Select
    const harmSelect = document.getElementById('harmonyRuleSelectMini');
    if (harmSelect) {
      harmSelect.addEventListener('change', (e) => {
        this.colorWheel.setHarmonyRule(e.target.value);
        this.renderWheelHarmonies();
      });
    }

    // 6. Gamut Mask Select
    const maskSelect = document.getElementById('gamutMaskSelectMini');
    if (maskSelect) {
      maskSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        GamutMaskEngine.state.enabled = (val !== 'none');
        GamutMaskEngine.state.type = val;
        this.colorWheel.render();
      });
    }

    // 7. Dual Wells FG & BG
    const fg = document.getElementById('fgWellMini');
    const bg = document.getElementById('bgWellMini');
    if (fg) fg.addEventListener('click', () => this.setActiveWell('fg'));
    if (bg) bg.addEventListener('click', () => this.setActiveWell('bg'));

    // 8. Actions (Swap, Default, Copy)
    const btnSwap = document.getElementById('btnSwapWellsMini');
    if (btnSwap) btnSwap.addEventListener('click', () => this.swapWells());

    const btnDefault = document.getElementById('btnDefaultColorsMini');
    if (btnDefault) btnDefault.addEventListener('click', () => this.setDefaultColors());

    const copyHex = () => {
      const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
      navigator.clipboard.writeText(cur.hex);
      this.showToast(`📋 ${cur.hex} copiado al portapapeles`);
    };

    const hexDisplay = document.getElementById('displayHexMini');
    if (hexDisplay) hexDisplay.addEventListener('click', copyHex);

    const btnCopy = document.getElementById('btnCopyHexMini');
    if (btnCopy) btnCopy.addEventListener('click', copyHex);

    // 9. Fix CMYK Gamut Button
    const btnFix = document.getElementById('btnFixGamutMini');
    if (btnFix) {
      btnFix.addEventListener('click', () => {
        const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const compressed = ColorMath.compressToCmykGamut(cur.r, cur.g, cur.b);
        const hex = ColorMath.rgbToHex(compressed.r, compressed.g, compressed.b);
        this.setColorFromHex(hex);
        this.showToast(`✨ Color comprimido al gamut CMYK más cercano (${hex})`);
      });
    }

    // 10. Physical Mix Mode Select
    const mixSelect = document.getElementById('mixModeSelectMini');
    if (mixSelect) {
      mixSelect.addEventListener('change', (e) => {
        this.mixMode = e.target.value;
        this.renderPhysicalMixStrip();
      });
    }

    // 11. Companion Algorithm Select
    const algoSelect = document.getElementById('companionAlgoSelectMini');
    if (algoSelect) {
      algoSelect.addEventListener('change', (e) => {
        CompanionBands.activeAlgorithm = e.target.value;
        const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderCompanionBands(cur);
      });
    }

    // 12. Swatches Tabs (Recents vs Palette)
    const tabRecents = document.getElementById('tabRecentSwatches');
    const tabPal = document.getElementById('tabActivePalette');
    const stripRecents = document.getElementById('recentsStripMini');
    const stripPal = document.getElementById('activePaletteStripMini');

    if (tabRecents && tabPal) {
      tabRecents.addEventListener('click', () => {
        tabRecents.style.color = '#FFF';
        tabRecents.style.fontWeight = '700';
        tabPal.style.color = '#94A3B8';
        tabPal.style.fontWeight = 'normal';
        stripRecents.style.display = 'flex';
        stripPal.style.display = 'none';
      });

      tabPal.addEventListener('click', () => {
        tabPal.style.color = '#FFF';
        tabPal.style.fontWeight = '700';
        tabRecents.style.color = '#94A3B8';
        tabRecents.style.fontWeight = 'normal';
        stripRecents.style.display = 'none';
        stripPal.style.display = 'flex';
      });
    }

    // 13. Pin Color & Clear History
    const btnPin = document.getElementById('btnPinCurrentColor');
    if (btnPin) btnPin.addEventListener('click', () => this.pinCurrentColorToPalette());

    const btnClearHist = document.getElementById('btnClearHistoryMini');
    if (btnClearHist) btnClearHist.addEventListener('click', () => this.clearHistory());

    // 14. Numeric Space Tabs
    const spaceTabs = document.querySelectorAll('.space-tab');
    spaceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        spaceTabs.forEach(t => t.classList.remove('active-space'));
        tab.classList.add('active-space');
        this.activeSpace = tab.dataset.space;
        const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderSliders(cur);
      });
    });
  }

  // --- KEYBOARD SHORTCUTS FOR DIGITAL ARTISTS ---

  _bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger when typing in input fields
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'x') {
        e.preventDefault();
        this.swapWells();
      } else if (key === 'd') {
        e.preventDefault();
        this.setDefaultColors();
      } else if (key === 'i' || key === 'p') {
        e.preventDefault();
        this.openEyeDropper();
      } else if (key === 'v') {
        e.preventDefault();
        this.toggleValueCheck();
      } else if (key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        navigator.clipboard.writeText(cur.hex);
        this.showToast(`📋 ${cur.hex} copiado`);
      } else if (key === '1') {
        this.setDensity('mini');
      } else if (key === '2') {
        this.setDensity('studio');
      } else if (key === '3') {
        this.setDensity('pro');
      }
    });
  }

  // --- TOAST NOTIFICATIONS ---

  showToast(message, type = 'info') {
    const existing = document.querySelector('.popup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'popup-toast';
    toast.textContent = message;
    if (type === 'warning') {
      toast.style.borderColor = '#F59E0B';
      toast.style.color = '#FDE68A';
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1600);
  }
}

// Start mini app when DOM is ready or immediately if already loaded
function startPopupApp() {
  if (!window.gomPopupApp) {
    window.gomPopupApp = new GomPopupApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPopupApp);
} else {
  startPopupApp();
}
