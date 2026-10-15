/**
 * GOM Picker Pro - Main Application Orchestrator
 * Coordinates color wheel, hero well, companion bands, tooltip engine,
 * numerical dual-space, harmony engine, atmospheric lighting, master painters,
 * batch K-Means extractor, local AI advisor, professional swatches catalogs,
 * popup synchronization via BroadcastChannel, and Photoshop UXP bridge.
 */

import { ColorMath } from './colorMath.js';
import { HarmonyEngine } from './harmonies.js';
import { AtmosphereEngine } from './atmosphereEngine.js';
import { AIAdvisor } from './aiAdvisor.js';
import { MunsellSystem } from './munsellSystem.js';
import { GamutMaskEngine } from './gamutMask.js';
import { ChromillaMixer } from './paintMixerChromilla.js';
import { LimitedPalettes } from './limitedPalettes.js';
import { MasterCatalogManager, MASTER_PALETTES, DEFAULT_CATALOGS } from './masterPalettes.js';
import { ImageExtractor } from './imageExtractor.js';
import { AIAssistant } from './aiAssistant.js';
import { SwatchManager } from './swatches.js';
import { UXPBridge } from './uxpBridge.js';
import { ColorWheel } from './colorWheel.js';
import { FlorentFargesEngine } from './florentFarges.js';
import { TooltipEngine } from './tooltipEngine.js';
import { CompanionBands } from './companionBands.js';
import { PaletteCatalogs } from './paletteCatalogs.js';
import { BrandPigments } from './brandPigments.js';
import { AIChatStudio } from './aiChat.js';
import { WetMixerEngine } from './wetMixer.js';
import { CVDSimulator } from './cvdSimulator.js';
import { RampStudio } from './rampStudio.js';
import { SwatchSheetExporter } from './swatchSheetExporter.js';
import { ProfileBackup } from './profileBackup.js';
import { Hyper4DStudio } from './hyper4d.js?v=3.2';
import { PaletteImporterEngine } from './paletteImporter.js';
import { PaletteOptimizer } from './paletteOptimizer.js';

class GomPickerApp {
  constructor() {
    this.activeWell = 'fg'; // 'fg' | 'bg'
    this.fgColor = { r: 99, g: 102, b: 241, hex: '#6366F1' };
    this.bgColor = { r: 244, g: 63, b: 94, hex: '#F43F5E' };
    this.baseFgColor = { r: 99, g: 102, b: 241, hex: '#6366F1' };
    this.baseBgColor = { r: 244, g: 63, b: 94, hex: '#F43F5E' };
    this.activeSpace = 'rgb'; // 'rgb' | 'cmyk' | 'hsl'
    this.lastGamutCheck = null;

    this.wetMixer = null;
    this.currentRamp = [];
    this._isCvdModalOpen = false;

    this.swatchManager = new SwatchManager();
    this.imageExtractor = null;
    this.colorWheel = null;
    this.hyper4dStudio = null;
    this.tooltipEngine = null;
    this.currentAiPalette = null;
    this.currentExtractedColors = [];
    this.currentOptimizedColors = [];
    this.currentPaletteScore = null;
    this.aiChat = null;
    this.activeCatalogFilter = 'all';
    this.broadcastChannel = null;
    this.batchResults = null;

    this.masterCatalogManager = new MasterCatalogManager();
    this.activeMasterCatalog = 'all';
    this.batchItems = [];
    this.isAppendBatchMode = false;

    // Undo/Redo history stack
    this.colorHistory = [];
    this.colorHistoryIndex = -1;
    this.historyDebounceTimer = null;

    // Command palette & shortcuts state
    this.commandPaletteOpen = false;
    this.commandPaletteIndex = 0;
    this.filteredCommands = [];
  }

  init() {
    console.log(
      '%c🎨 GOM Color Picker Pro %c Creado por Fran Gómez %c https://github.com/GomSamurai/gom-picker',
      'background: #4F46E5; color: #FFFFFF; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-family: sans-serif;',
      'color: #A5B4FC; font-size: 11px; padding: 2px 6px; font-family: sans-serif;',
      'color: #64748B; font-size: 10px; font-family: sans-serif;'
    );

    // 1. Initialize UXP Bridge
    UXPBridge.init();

    // 2. Setup Real-Time Bi-Directional Sync with Independent Floating Window
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('gom_picker_sync');
      this.broadcastChannel.onmessage = (event) => {
        const { type, rgb, activeWell, hex, action, paletteColor } = event.data || {};
        if (type === 'POPUP_COLOR_UPDATE' && rgb) {
          if (activeWell && activeWell !== this.activeWell) {
            this.setActiveWell(activeWell);
          }
          this.setColorDirectly(rgb, false);
        } else if (type === 'POPUP_SWAP_WELLS') {
          const btnSwap = document.getElementById('btnSwapWells');
          if (btnSwap) btnSwap.click();
        } else if (type === 'POPUP_REQUEST_SYNC') {
          this.broadcastCurrentState();
        } else if (type === 'POPUP_ADD_TO_PALETTE' && paletteColor) {
          if (this.swatchManager) {
            this.swatchManager.addColorToActivePalette(paletteColor);
            if (typeof this.renderCustomPaletteStrip === 'function') this.renderCustomPaletteStrip();
            this.showToast(`Color ${paletteColor} añadido a la paleta activa`);
            this.broadcastCurrentState();
          }
        }
      };
    }

    // 3. Initialize Floating Swatch Tooltip Engine (Hover info + Pinned card)
    this.tooltipEngine = new TooltipEngine(this);

    // 4. Initialize Core Canvases First (Color Wheel & Image Extractor)
    try {
      const wheelCanvas = document.getElementById('colorWheelCanvas');
      const initialHsv = ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b);
      this.colorWheel = new ColorWheel(wheelCanvas, {
        mode: 'triangle',
        harmonyRule: 'triadic',
        onChange: (colorData) => this.handleWheelColorChange(colorData)
      });
      this.colorWheel.setColor(initialHsv, true);
    } catch (err) {
      console.error('[GOM Picker Pro] Error initializing ColorWheel:', err);
    }

    try {
      const extractCanvas = document.getElementById('extractCanvas');
      this.imageExtractor = new ImageExtractor(extractCanvas);
    } catch (err) {
      console.error('[GOM Picker Pro] Error initializing ImageExtractor:', err);
    }

    // 5. Bind UI Controls & Event Listeners
    const safeBind = (name, fn) => {
      try {
        fn.call(this);
      } catch (err) {
        console.error(`[GOM Picker Pro] Error in ${name}:`, err);
      }
    };

    safeBind('_bindHeaderTools', this._bindHeaderTools);
    safeBind('_bindRightColumnControls', this._bindRightColumnControls);
    safeBind('_bindNavigationTabs', this._bindNavigationTabs);
    safeBind('_bindWheelOptions', this._bindWheelOptions);
    safeBind('_bindHeroColorAndCompanionBands', this._bindHeroColorAndCompanionBands);
    safeBind('_bindNumericSliders', this._bindNumericSliders);
    safeBind('_bindAtmosphereControls', this._bindAtmosphereControls);
    safeBind('_bindGamutMaskControls', this._bindGamutMaskControls);
    safeBind('_bindMunsellControls', this._bindMunsellControls);
    safeBind('_bindLimitedPalettesControls', this._bindLimitedPalettesControls);
    safeBind('_bindChromillaControls', this._bindChromillaControls);
    safeBind('_bindFlorentControls', this._bindFlorentControls);
    safeBind('_bindMasterPainters', this._bindMasterPainters);
    safeBind('_bindImageExtractor', this._bindImageExtractor);
    safeBind('_bindAiAssistant', this._bindAiAssistant);
    safeBind('_bindSwatchesAndExporters', this._bindSwatchesAndExporters);
    safeBind('_bindUniversalSwatchContextMenu', this._bindUniversalSwatchContextMenu);
    safeBind('_bindGlobalClickToCopyHex', this._bindGlobalClickToCopyHex);
    safeBind('_bindGlobalSwatchDragAndDrop', this._bindGlobalSwatchDragAndDrop);
    safeBind('_bindHistoryControls', this._bindHistoryControls);
    safeBind('_bindKeyboardShortcuts', this._bindKeyboardShortcuts);
    safeBind('_bindCommandPalette', this._bindCommandPalette);
    safeBind('_bindShortcutsModal', this._bindShortcutsModal);
    safeBind('_bindEyeDropper', this._bindEyeDropper);
    safeBind('_bindWetMixerControls', this._bindWetMixerControls);
    safeBind('_bindRampStudioControls', this._bindRampStudioControls);
    safeBind('_bindCvdControls', this._bindCvdControls);
    safeBind('_bindProfileBackupControls', this._bindProfileBackupControls);
    this.hyper4dStudio = new Hyper4DStudio(this);
    safeBind('hyper4dInit', () => this.hyper4dStudio.init());
    safeBind('_restoreSavedSession', this._restoreSavedSession);

    // 6. Initial Renderings and Trigger Sync
    safeBind('renderHistoryRibbon', this.renderHistoryRibbon);
    safeBind('renderQuickPalette', this.renderQuickPalette);
    safeBind('renderSwatchesCollection', this.renderSwatchesCollection);
    safeBind('renderAtmosphereStages', this.renderAtmosphereStages);
    safeBind('renderLimitedPalettes', () => this.renderLimitedPalettes('zorn'));
    safeBind('renderChromillaMixer', () => this.renderChromillaMixer(this.fgColor));
    safeBind('renderFlorentFarges', () => this.renderFlorentFarges(this.fgColor));
    safeBind('renderRampStudio', this.renderRampStudio);
    safeBind('generateInitialAiPalette', this.generateInitialAiPalette);
    safeBind('loadSampleImage', () => this.loadSampleImage('assets/samples/monet.png'));
    safeBind('updateWcagBadge', this.updateWcagBadge);
    safeBind('updateLiveAccentTheme', () => this.updateLiveAccentTheme(this.fgColor.hex, this.fgColor));
    safeBind('initialHistoryPush', () => this.pushColorHistory(true));

    console.log('[GOM Picker Pro] Inicializado con éxito. Todos los sistemas operativos.');
  }

  // --- CORE COLOR SYNC & ATMOSPHERE MODIFIER ---

  handleWheelColorChange(colorData, broadcast = true) {
    let { rgb, hex, cmyk, hsv, harmonies, baseRgb } = colorData;

    // Preserve the pristine unlit studio color
    const rawBase = baseRgb || (AtmosphereEngine.state.enabled ? (this.activeWell === 'fg' ? this.baseFgColor : this.baseBgColor) : rgb);
    if (this.activeWell === 'fg') {
      this.baseFgColor = { ...rawBase, hex: ColorMath.rgbToHex(rawBase.r, rawBase.g, rawBase.b) };
    } else {
      this.baseBgColor = { ...rawBase, hex: ColorMath.rgbToHex(rawBase.r, rawBase.g, rawBase.b) };
    }

    // Apply Atmosphere modifier if enabled
    if (AtmosphereEngine.state.enabled) {
      rgb = AtmosphereEngine.transformColor(rawBase);
      hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    }

    // Update active well
    if (this.activeWell === 'fg') {
      this.fgColor = { ...rgb, hex };
      const fg = document.getElementById('fgWell');
      if (fg) fg.style.backgroundColor = hex;
    } else {
      this.bgColor = { ...rgb, hex };
      const bg = document.getElementById('bgWell');
      if (bg) bg.style.backgroundColor = hex;
    }

    // Update HEX text & Munsell
    const hexEl = document.getElementById('displayHex');
    if (hexEl) hexEl.textContent = hex;

    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const munsellEl = document.getElementById('displayMunsell');
    const munsellLarge = document.getElementById('munsellActiveNotationLarge');
    if (munsellEl) munsellEl.textContent = munsell.notation;
    if (munsellLarge) munsellLarge.textContent = `${munsell.notation} (${munsell.label})`;

    // CMYK Gamut Check
    this.checkGamut(rgb);

    // Update Hero Color Details & Companion Bands
    this.renderHeroColorAndCompanionBands(rgb);

    // Update Sliders based on active space
    this.updateNumericInputs(rgb, cmyk, colorData.hsl);

    // Update Studio Panels
    this.renderHarmonySwatches(harmonies);
    this.renderTintShadeToneMatrix(rgb);
    this.renderPigmentBlender();
    this.renderAtmosphereStages();
    this.renderMunsellSliceChart(hsv.h);
    this.renderChromillaMixer(rgb);
    this.renderFlorentFarges(rgb);
    this.runPaletteDiagnostic();
    if (typeof this.renderRampStudio === 'function') {
      this.renderRampStudio();
    }
    if (this._isCvdModalOpen && typeof this.renderCvdMatrix === 'function') {
      this.renderCvdMatrix(this.fgColor);
    }

    // Broadcast update to independent floating window
    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'MAIN_COLOR_UPDATE',
        rgb,
        hex,
        hsv,
        activeWell: this.activeWell,
        fgColor: this.fgColor,
        bgColor: this.bgColor
      });
    }

    // Dispatch to Photoshop via UXP Bridge
    if (this.activeWell === 'fg') {
      UXPBridge.setForegroundColor(rgb.r, rgb.g, rgb.b);
    } else {
      UXPBridge.setBackgroundColor(rgb.r, rgb.g, rgb.b);
    }

    // Live reactive theme & WCAG contrast update
    this.updateLiveAccentTheme(hex, rgb);
    this.updateWcagBadge();
    if (this.hyper4dStudio) {
      this.hyper4dStudio.updateActiveColor(rgb);
    }
    if (this.aiChat) {
      this.aiChat.updateContextDisplay();
    }
    this.pushColorHistory(false);
  }

  checkGamut(rgb) {
    const check = ColorMath.checkCmykGamut(rgb.r, rgb.g, rgb.b);
    this.lastGamutCheck = check;

    const gamutTag = document.getElementById('gamutTag');
    const warningBox = document.getElementById('gamutWarningBox');

    if (gamutTag) {
      if (check.isOutOfGamut) {
        gamutTag.className = 'gamut-tag out-gamut';
        gamutTag.innerHTML = `<span>⚠️</span> Fuera de Gamut CMYK (Δ${check.delta})`;
        if (warningBox) warningBox.style.display = 'block';
      } else {
        gamutTag.className = 'gamut-tag in-gamut';
        gamutTag.innerHTML = `<span>●</span> En Gamut CMYK`;
        if (warningBox) warningBox.style.display = 'none';
      }
    }
  }

  setColorDirectly(rgb, broadcast = true) {
    // Preserve as pristine base studio color
    if (this.activeWell === 'fg') {
      this.baseFgColor = { ...rgb, hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b) };
    } else {
      this.baseBgColor = { ...rgb, hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b) };
    }

    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.colorWheel.setColor(hsv, false);

    let activeRgb = rgb;
    if (AtmosphereEngine.state.enabled) {
      activeRgb = AtmosphereEngine.transformColor(rgb);
    }
    const hex = ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

    if (this.activeWell === 'fg') {
      this.fgColor = { ...activeRgb, hex };
    } else {
      this.bgColor = { ...activeRgb, hex };
    }

    this.handleWheelColorChange({
      hsv,
      baseRgb: rgb,
      rgb: activeRgb,
      hex,
      cmyk: ColorMath.rgbToCmyk(activeRgb.r, activeRgb.g, activeRgb.b),
      hsl: ColorMath.rgbToHsl(activeRgb.r, activeRgb.g, activeRgb.b),
      harmonies: HarmonyEngine.getHarmony(hsv, this.colorWheel.harmonyRule)
    }, broadcast);

    this.swatchManager.addToHistory(hex);
    this.renderHistoryRibbon();
    this.pushColorHistory(true);
  }

  // --- HERO ACTIVE COLOR DISPLAY & RELATIVE COMPANION BANDS ---

  setActiveWell(well) {
    this.activeWell = well;
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    const wFg = document.getElementById('wellFg');
    const wBg = document.getElementById('wellBg');
    if (well === 'fg') {
      if (fg) fg.classList.add('active');
      if (bg) bg.classList.remove('active');
      if (wFg) wFg.classList.add('active');
      if (wBg) wBg.classList.remove('active');
    } else {
      if (bg) bg.classList.add('active');
      if (fg) fg.classList.remove('active');
      if (wBg) wBg.classList.add('active');
      if (wFg) wFg.classList.remove('active');
    }
    if (this.hyper4dStudio) {
      const activeColor = well === 'fg' ? this.fgColor : this.bgColor;
      this.hyper4dStudio.updateActiveColor(activeColor);
    }
  }

  _bindHeroColorAndCompanionBands() {
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    const btnSwap = document.getElementById('btnSwapWells');
    const btnFix = document.getElementById('btnFixGamut');
    const companionSelect = document.getElementById('companionAlgoSelect');

    if (fg) {
      fg.addEventListener('click', () => {
        this.setActiveWell('fg');
        this.setColorDirectly(this.fgColor);
      });
    }

    if (bg) {
      bg.addEventListener('click', () => {
        this.setActiveWell('bg');
        this.setColorDirectly(this.bgColor);
      });
    }

    if (btnSwap) {
      btnSwap.addEventListener('click', () => this.swapWells());
    }

    if (btnFix) {
      btnFix.addEventListener('click', () => {
        if (this.lastGamutCheck && this.lastGamutCheck.nearestGamutRgb) {
          this.setColorDirectly(this.lastGamutCheck.nearestGamutRgb);
          this.showToast('Color ajustado al límite imprimible CMYK', 'info');
        }
      });
    }

    if (companionSelect) {
      companionSelect.addEventListener('change', (e) => {
        CompanionBands.activeAlgorithm = e.target.value;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderHeroColorAndCompanionBands(currentRgb);
      });
    }
  }

  renderHeroColorAndCompanionBands(targetRgb = this.fgColor) {
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    const hexEl = document.getElementById('displayHex');
    const tempBadge = document.getElementById('heroTempBadge');
    const recipeText = document.getElementById('heroRecipeText');
    const recipeTip = document.getElementById('heroArtistTip');
    const opacityBadge = document.getElementById('heroPigmentOpacity');
    const bandsContainer = document.getElementById('companionBandsList');

    const curHex = (this.activeWell === 'fg' ? this.fgColor.hex : this.bgColor.hex);
    if (fg) fg.style.backgroundColor = this.fgColor.hex;
    if (bg) bg.style.backgroundColor = this.bgColor.hex;
    if (hexEl) hexEl.textContent = curHex;

    const topPill = document.getElementById('topbarColorPill');
    const topHex = document.getElementById('topbarHex');
    if (topPill) topPill.style.backgroundColor = curHex;
    if (topHex) topHex.textContent = curHex;

    // Thermal badge & mixing recipe advice
    const advice = CompanionBands.getArtistRecipeAdvice(targetRgb);
    const hsv = ColorMath.rgbToHsv(targetRgb.r, targetRgb.g, targetRgb.b);

    if (tempBadge) {
      if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 325) {
        tempBadge.textContent = '☀️ Cálido Solar';
        tempBadge.style.color = '#F59E0B';
      } else if (hsv.h >= 165 && hsv.h <= 270) {
        tempBadge.textContent = '❄️ Frío Espectral';
        tempBadge.style.color = '#06B6D4';
      } else if (hsv.h > 75 && hsv.h < 165) {
        tempBadge.textContent = '🌿 Vegetal / Clorofila';
        tempBadge.style.color = '#10B981';
      } else {
        tempBadge.textContent = '🌌 Crepuscular Violeta';
        tempBadge.style.color = '#A855F7';
      }
    }

    if (recipeText) recipeText.textContent = advice.basePigments;
    if (recipeTip) recipeTip.textContent = `💡 ${advice.artistTip}`;
    if (opacityBadge) opacityBadge.textContent = advice.opacity;

    // Render Companion Bands
    if (bandsContainer) {
      bandsContainer.innerHTML = '';
      const bands = CompanionBands.calculateBands(targetRgb);

      bands.forEach(band => {
        const item = document.createElement('div');
        item.className = 'companion-band-item';
        item.style.backgroundColor = band.hex;
        item.dataset.swatchHex = band.hex;
        item.dataset.swatchLabel = band.label;
        item.draggable = true;

        item.addEventListener('click', () => {
          this.setColorDirectly(band.rgb);
          this.showToast(`Banda compañera: ${band.label} (${band.hex})`);
        });

        bandsContainer.appendChild(item);
      });
    }
  }

  swapWells() {
    const temp = { ...this.fgColor };
    this.fgColor = { ...this.bgColor };
    this.bgColor = temp;

    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    if (fg) fg.style.backgroundColor = this.fgColor.hex;
    if (bg) bg.style.backgroundColor = this.bgColor.hex;

    const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.setColorDirectly(currentRgb);
    this.renderPigmentBlender();
    this.showToast('Colores frontal y fondo intercambiados (Tecla X)');
  }

  // --- GLOBAL HEX CLICK-TO-COPY & DRAG-AND-DROP ---

  _bindGlobalClickToCopyHex() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.copyable-hex, [data-hex]');
      if (target) {
        const hex = target.dataset.hex || target.textContent.trim();
        if (hex && hex.startsWith('#')) {
          this.copyToClipboard(hex);
          this.showToast(`Código HEX copiado al portapapeles: ${hex}`);

          // Visual feedback
          const origColor = target.style.color;
          target.style.color = '#10B981';
          target.style.transform = 'scale(1.08)';
          target.style.transition = 'all 0.15s ease';
          setTimeout(() => {
            target.style.color = origColor;
            target.style.transform = '';
          }, 350);
        }
      }
    });
  }

  _bindGlobalSwatchDragAndDrop() {
    // When dragging any swatch across the UI
    document.addEventListener('dragstart', (e) => {
      const target = e.target.closest('[data-swatch-hex], .swatch-color-pill, .matrix-swatch, .harmony-card-color, .endpoint-chip, .history-item, .companion-band-item');
      if (target) {
        let hex = target.dataset?.swatchHex;
        if (!hex) {
          const bg = target.style.backgroundColor;
          if (bg) {
            const rgbMatch = bg.match(/\d+/g);
            if (rgbMatch && rgbMatch.length >= 3) {
              hex = ColorMath.rgbToHex(parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2]));
            }
          }
        }
        if (hex) {
          e.dataTransfer.setData('text/plain', hex);
          e.dataTransfer.effectAllowed = 'copy';
        }
      }
    });

    // Handle dropping onto Quick Palette in Studio
    const quickBar = document.getElementById('quickPaletteContainer');
    if (quickBar) {
      quickBar.addEventListener('dragover', (e) => {
        e.preventDefault();
        quickBar.classList.add('drag-over');
      });
      quickBar.addEventListener('dragleave', (e) => {
        if (!quickBar.contains(e.relatedTarget)) {
          quickBar.classList.remove('drag-over');
        }
      });
      quickBar.addEventListener('drop', (e) => {
        e.preventDefault();
        quickBar.classList.remove('drag-over');
        
        const rawSwatchData = e.dataTransfer.getData('application/gom-swatch');
        const hex = e.dataTransfer.getData('text/plain');
        const activePal = this.swatchManager.getActivePalette();

        if (!activePal) return;

        if (rawSwatchData) {
          try {
            const { paletteId: sourcePalId, hex: sourceHex } = JSON.parse(rawSwatchData);
            if (sourcePalId !== activePal.id) {
              this.swatchManager.addColorToPalette(activePal.id, sourceHex);
              this.renderQuickPalette();
              this.renderSwatchesCollection();
              this.showToast(`Color ${sourceHex} copiado a '${activePal.name}'`);
              return;
            }
          } catch (err) {}
        }

        if (hex && hex.startsWith('#')) {
          this.swatchManager.addColorToPalette(activePal.id, hex);
          this.renderQuickPalette();
          this.renderSwatchesCollection();
          this.showToast(`Color ${hex} añadido a '${activePal.name}'`);
        }
      });
    }
  }

  // --- FLOATING WINDOW POPUP (FOR PHOTOSHOP / SECOND MONITOR) ---

  openFloatingWindow() {
    const popupW = 390;
    const popupH = 750;
    const left = window.screen.availWidth - popupW - 30;
    const top = 50;

    const popupWindow = window.open(
      'popup.html',
      'GomPickerFloatingWindow',
      `width=${popupW},height=${popupH},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
    );

    if (popupWindow) {
      popupWindow.focus();
      this.showToast('🪟 Ventana Flotante abierta y sincronizada en tiempo real');
      setTimeout(() => this.broadcastCurrentState(), 500);
    } else {
      this.showToast('Por favor, permite ventanas emergentes en tu navegador para abrir el panel flotante', 'warning');
    }
  }

  broadcastCurrentState() {
    if (!this.broadcastChannel) return;
    const activePalette = this.swatchManager?.getActivePalette();
    const history = this.swatchManager?.history || [];
    this.broadcastChannel.postMessage({
      type: 'MAIN_STATE_SYNC',
      activeWell: this.activeWell,
      fgColor: this.fgColor,
      bgColor: this.bgColor,
      activePalette,
      history,
      wheelMode: this.colorWheel?.mode || 'triangle',
      harmonyRule: this.colorWheel?.harmonyRule || 'triadic'
    });
  }

  // --- HEADER TOOLS & NAVIGATION ---

  _bindHeaderTools() {
    const btnValue = document.getElementById('btnValueCheck');
    const btnCompact = document.getElementById('btnCompactMode');
    const btnAtmo = document.getElementById('btnAtmosphereToggle');

    if (btnAtmo) {
      btnAtmo.addEventListener('click', () => this.toggleAtmosphereModifier());
    }

    // Toggle for swatch hover popups
    const togglePopupBtns = document.querySelectorAll('.btn-toggle-swatch-popups');
    togglePopupBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.tooltipEngine) {
          this.tooltipEngine.toggleEnabled();
        }
      });
    });
    if (this.tooltipEngine) {
      this.tooltipEngine.syncToggleButtons();
    }

    if (btnValue) {
      btnValue.addEventListener('click', () => {
        document.body.classList.toggle('value-check-mode');
        const isActive = document.body.classList.contains('value-check-mode');
        btnValue.classList.toggle('active-toggle', isActive);
        this.showToast(isActive ? 'Modo Blanco y Negro activo (Inspección de Valores Tonales)' : 'Modo Color normal restablecido');
      });
    }

    if (btnCompact) {
      btnCompact.addEventListener('click', () => {
        this.openFloatingWindow();
      });
    }
  }

  toggleAtmosphereModifier() {
    AtmosphereEngine.state.enabled = !AtmosphereEngine.state.enabled;
    this.applyAtmosphereUpdate();
  }

  applyAtmosphereUpdate(options = {}) {
    const isEn = AtmosphereEngine.state.enabled;

    const btnHeader = document.getElementById('btnAtmosphereToggle');
    const btnPanel = document.getElementById('btnAtmospherePanelToggle');
    const btnPanelText = document.getElementById('btnAtmospherePanelToggleText');

    if (btnHeader) {
      btnHeader.classList.toggle('active-toggle', isEn);
      btnHeader.innerHTML = isEn ? '<span>🌅</span> Modificador: ON' : '<span>🌅</span> Modificador: OFF';
    }
    if (btnPanel) {
      btnPanel.classList.toggle('active-toggle', isEn);
    }
    if (btnPanelText) {
      btnPanelText.textContent = isEn ? 'Modificador: ON (Activo)' : 'Modificador: DESACTIVADO (OFF)';
    }

    const appShell = document.getElementById('appShell');
    if (appShell) {
      appShell.classList.toggle('atmosphere-mode-active', isEn);
    }

    // 4. Transform active well colors from pristine base studio colors
    if (isEn) {
      const transFg = AtmosphereEngine.transformColor(this.baseFgColor);
      this.fgColor = { ...transFg, hex: ColorMath.rgbToHex(transFg.r, transFg.g, transFg.b) };

      const transBg = AtmosphereEngine.transformColor(this.baseBgColor);
      this.bgColor = { ...transBg, hex: ColorMath.rgbToHex(transBg.r, transBg.g, transBg.b) };
    } else {
      this.fgColor = { ...this.baseFgColor };
      this.bgColor = { ...this.baseBgColor };
    }

    const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    const currentHex = currentRgb.hex;
    const currentHsv = ColorMath.rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
    const currentCmyk = ColorMath.rgbToCmyk(currentRgb.r, currentRgb.g, currentRgb.b);
    const currentHsl = ColorMath.rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

    // 5. Update Color Wells in UI
    const fgWell = document.getElementById('fgWell');
    const bgWell = document.getElementById('bgWell');
    if (fgWell) fgWell.style.backgroundColor = this.fgColor.hex;
    if (bgWell) bgWell.style.backgroundColor = this.bgColor.hex;

    // 6. Re-render Color Wheel (hue ring, triangle/square, active indicator)
    if (this.colorWheel) {
      this.colorWheel.render();
    }

    // 7. Update Hero Color Details & Companion Bands
    this.renderHeroColorAndCompanionBands(currentRgb);

    // 8. Update Numeric Sliders & Gamut Check
    this.updateNumericInputs(currentRgb, currentCmyk, currentHsl);
    this.checkGamut(currentRgb);

    // 9. Re-render Studio Swatches & Harmonizers
    const harmonies = HarmonyEngine.getHarmony(
      this.colorWheel ? this.colorWheel.hsv : currentHsv,
      this.colorWheel ? this.colorWheel.harmonyRule : 'triadic'
    );
    this.renderHarmonySwatches(harmonies);
    this.renderTintShadeToneMatrix(currentRgb);
    this.renderPigmentBlender();
    this.renderQuickPalette();
    this.renderSwatchesCollection();
    this.renderAtmosphereStages();
    this.renderChromillaMixer(currentRgb);
    this.renderFlorentFarges(currentRgb);
    this.renderLimitedPalettes();
    this._bindMasterPainters();

    // 10. Sync floating window via BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'MAIN_COLOR_UPDATE',
        rgb: currentRgb,
        hex: currentHex,
        hsv: currentHsv
      });
    }

    // 11. Dispatch to Photoshop via UXP Bridge
    if (this.activeWell === 'fg') {
      UXPBridge.setForegroundColor(currentRgb.r, currentRgb.g, currentRgb.b);
    } else {
      UXPBridge.setBackgroundColor(currentRgb.r, currentRgb.g, currentRgb.b);
    }

    this.showToast(isEn ? 'Modificador Dinámico de Luz y Atmósfera Activado' : 'Modificador Dinámico Desactivado');
  }

  _bindRightColumnControls() {
    const tabAi = document.getElementById('rTabAi');
    const tabSwatches = document.getElementById('rTabSwatches');
    const viewAi = document.getElementById('viewAi');
    const viewSwatches = document.getElementById('viewSwatches');
    const btnToggleRight = document.getElementById('btnToggleRightColumn');
    const appMain = document.querySelector('.app-main');
    const collapsedRailBtns = document.querySelectorAll('.collapsed-rail-icon-btn');

    const switchTab = (tabKey) => {
      // If right column was collapsed, uncollapse it
      if (appMain && appMain.classList.contains('right-collapsed')) {
        appMain.classList.remove('right-collapsed');
        if (btnToggleRight) btnToggleRight.querySelector('span').textContent = '▶';
        btnToggleRight.title = 'Colapsar columna derecha';
        try {
          localStorage.setItem('gom_right_col_collapsed', '0');
        } catch (_) {}
      }

      if (tabKey === 'ai') {
        if (tabAi) tabAi.classList.add('active');
        if (tabSwatches) tabSwatches.classList.remove('active');
        if (viewAi) viewAi.style.display = 'flex';
        if (viewSwatches) viewSwatches.style.display = 'none';
      } else {
        if (tabSwatches) tabSwatches.classList.add('active');
        if (tabAi) tabAi.classList.remove('active');
        if (viewSwatches) {
          viewSwatches.style.display = 'flex';
          this.renderSwatchesCollection();
        }
        if (viewAi) viewAi.style.display = 'none';
      }
    };

    this.switchRightTab = switchTab;

    if (tabAi) tabAi.addEventListener('click', () => switchTab('ai'));
    if (tabSwatches) tabSwatches.addEventListener('click', () => switchTab('swatches'));

    collapsedRailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.rtab;
        switchTab(target);
      });
    });

    if (btnToggleRight && appMain) {
      btnToggleRight.addEventListener('click', () => {
        appMain.classList.toggle('right-collapsed');
        const isCollapsed = appMain.classList.contains('right-collapsed');
        btnToggleRight.querySelector('span').textContent = isCollapsed ? '◀' : '▶';
        btnToggleRight.title = isCollapsed ? 'Expandir columna derecha' : 'Colapsar columna derecha';
        try {
          localStorage.setItem('gom_right_col_collapsed', isCollapsed ? '1' : '0');
        } catch (_) {}
        window.dispatchEvent(new Event('resize'));
        if (this.hyper4dStudio) {
          requestAnimationFrame(() => this.hyper4dStudio._resizeCanvas());
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 160);
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 320);
        }
      });

      // Restore collapsed preference
      try {
        if (localStorage.getItem('gom_right_col_collapsed') === '1') {
          appMain.classList.add('right-collapsed');
          btnToggleRight.querySelector('span').textContent = '◀';
          btnToggleRight.title = 'Expandir columna derecha';
        }
      } catch (_) {}
    }

    const btnExpandRight = document.getElementById('btnExpandRightColumn');
    if (btnExpandRight && appMain) {
      btnExpandRight.addEventListener('click', () => {
        if (appMain.classList.contains('right-collapsed')) {
          appMain.classList.remove('right-collapsed');
          if (btnToggleRight) btnToggleRight.querySelector('span').textContent = '▶';
        }
        appMain.classList.toggle('right-expanded');
        const isExp = appMain.classList.contains('right-expanded');
        btnExpandRight.classList.toggle('active-toggle', isExp);
        btnExpandRight.title = isExp ? 'Reducir a ancho estándar' : 'Ampliar ancho de columna derecha';
        try {
          localStorage.setItem('gom_right_col_expanded', isExp ? '1' : '0');
        } catch (_) {}
        this.showToast(isExp ? 'Columna derecha en modo extendido espacioso' : 'Columna derecha en modo estándar');
        window.dispatchEvent(new Event('resize'));
        if (this.hyper4dStudio) {
          requestAnimationFrame(() => this.hyper4dStudio._resizeCanvas());
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 160);
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 320);
        }
      });

      try {
        if (localStorage.getItem('gom_right_col_expanded') === '1') {
          appMain.classList.add('right-expanded');
          btnExpandRight.classList.add('active-toggle');
        }
      } catch (_) {}
    }
  }

  _bindNavigationTabs() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const centerViews = {
      studio: document.getElementById('viewStudio'),
      hyper4d: document.getElementById('viewHyper4D'),
      gamut_munsell: document.getElementById('viewGamutMunsell'),
      chromilla: document.getElementById('viewChromilla'),
      florent: document.getElementById('viewFlorent'),
      atmosphere: document.getElementById('viewAtmosphere'),
      masters: document.getElementById('viewMasters'),
      extractor: document.getElementById('viewExtractor'),
      wetmixer: document.getElementById('viewWetMixer'),
      ramps: document.getElementById('viewRamps')
    };

    const tabMeta = {
      studio: { title: 'Estudio Cromático', sub: 'Rueda Coolorus, Armonías interactivas y Bandas Compañeras', icon: '🎨' },
      hyper4d: { title: 'Hiperespacio 4D del Color', sub: 'Visualizador, Comparador & Desglose Cuadridimensional SO(4)', icon: '🔮' },
      gamut_munsell: { title: 'Máscaras de Gama & Sistema Munsell', sub: 'Gamut Masking de James Gurney y espacio tridimensional Munsell', icon: '🎯' },
      chromilla: { title: 'Chromilla: Catálogo de Tubos Reales', sub: 'Inventario físico de pigmentos (Óleo, Acrílico, Acuarela)', icon: '🧪' },
      florent: { title: 'Teoría del Color de Florent Farges', sub: 'Rueda de mezcla sustractiva y paletas primarias de artista', icon: '👨‍🎨' },
      atmosphere: { title: 'Modificador Dinámico de Atmósfera', sub: 'Luz ambiental y cálculo térmico para sombras realistas', icon: '🌅' },
      masters: { title: 'Paletas de Grandes Maestros', sub: 'Colección histórica: Sorolla, Monet, Rembrandt, Van Gogh, Vermeer...', icon: '🏛️' },
      extractor: { title: 'Extractor K-Means & Análisis de Imagen', sub: 'Extracción por clustering, dominancias y paletas armónicas', icon: '📷' },
      wetmixer: { title: 'Lienzo de Mezcla Física & Espátula Digital', sub: 'Paleta húmeda interactiva con mezcla sustractiva de pigmentos', icon: '🖌️' },
      ramps: { title: 'Generador de Rampas Tonales & Degradados OKLCH', sub: 'Degradados de alta fidelidad perceptual sin zona muerta de gris', icon: '📐' },
      ai: { title: 'Asesor Cromático IA (Columna Derecha)', sub: 'Consultor inteligente 100% offline para esquemas y composiciones', icon: '🧠' },
      swatches: { title: 'Bibliotecas de Muestras (Columna Derecha)', sub: 'Gestión de paletas, importación/exportación .ASE binario y catálogos', icon: '📚' }
    };

    const breadcrumbTitle = document.getElementById('workspaceBreadcrumbTitle');
    const breadcrumbSub = document.getElementById('workspaceBreadcrumbSub');
    const breadcrumbIcon = document.getElementById('workspaceBreadcrumbIcon');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.dataset.tab;

        // If clicking AI or Swatches from sidebar, route directly to the persistent Right Column
        if (tabKey === 'ai') {
          if (this.switchRightTab) this.switchRightTab('ai');
          tabBtns.forEach(b => {
            if (b.dataset.tab === 'ai' || b.dataset.tab === 'swatches') b.classList.remove('active');
          });
          btn.classList.add('active');
          if (tabMeta[tabKey]) {
            if (breadcrumbTitle) breadcrumbTitle.textContent = tabMeta[tabKey].title;
            if (breadcrumbSub) breadcrumbSub.textContent = tabMeta[tabKey].sub;
            if (breadcrumbIcon) breadcrumbIcon.textContent = tabMeta[tabKey].icon;
          }
          return;
        }

        if (tabKey === 'swatches') {
          if (this.switchRightTab) this.switchRightTab('swatches');
          tabBtns.forEach(b => {
            if (b.dataset.tab === 'ai' || b.dataset.tab === 'swatches') b.classList.remove('active');
          });
          btn.classList.add('active');
          if (tabMeta[tabKey]) {
            if (breadcrumbTitle) breadcrumbTitle.textContent = tabMeta[tabKey].title;
            if (breadcrumbSub) breadcrumbSub.textContent = tabMeta[tabKey].sub;
            if (breadcrumbIcon) breadcrumbIcon.textContent = tabMeta[tabKey].icon;
          }
          return;
        }

        // Center Views (Studio, Gamut Masks, Chromilla, Florent, Atmosphere, Masters, Extractor, WetMixer, Ramps)
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        Object.entries(centerViews).forEach(([key, v]) => {
          if (v) {
            if (key === tabKey) {
              v.classList.add('active-view');
              v.classList.remove('tab-hidden');
              v.style.display = 'flex';
            } else {
              v.classList.remove('active-view');
              v.classList.add('tab-hidden');
              v.style.display = 'none';
            }
          }
        });

        // Trigger fresh tab renders upon switching
        if (tabKey === 'masters') this._bindMasterPainters();
        if (tabKey === 'gamut_munsell') {
          const hsv = this.colorWheel?.currentHsv || { h: 210 };
          this.renderMunsellSliceChart(hsv.h);
          const sel = document.getElementById('limitedPaletteSelect');
          this.renderLimitedPalettes(sel ? sel.value : 'zorn');
        }
        if (tabKey === 'chromilla') {
          const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
          this.renderChromillaMixer(curRgb);
        }
        if (tabKey === 'florent') {
          const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
          this.renderFlorentFarges(curRgb);
        }
        if (tabKey === 'atmosphere') {
          this.renderAtmosphereStages();
        }
        if (tabKey === 'wetmixer') {
          if (!this.wetMixer) this._initWetMixer();
        }
        if (tabKey === 'ramps') {
          this.renderRampStudio();
        }
        if (tabKey === 'hyper4d' && this.hyper4dStudio) {
          requestAnimationFrame(() => {
            this.hyper4dStudio._resizeCanvas();
            this.hyper4dStudio.syncWithActiveColor();
            this.hyper4dStudio._startRenderLoop();
          });
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 80);
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 250);
        }

        // Scroll content wrapper smoothly to top when switching workspaces
        const contentWrapper = document.querySelector('.app-content-wrapper');
        if (contentWrapper) {
          contentWrapper.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (tabMeta[tabKey]) {
          if (breadcrumbTitle) breadcrumbTitle.textContent = tabMeta[tabKey].title;
          if (breadcrumbSub) breadcrumbSub.textContent = tabMeta[tabKey].sub;
          if (breadcrumbIcon) breadcrumbIcon.textContent = tabMeta[tabKey].icon;
        }
      });
    });

    // Sidebar collapse/expand toggle button
    const btnToggle = document.getElementById('btnToggleSidebar');
    const appShell = document.getElementById('appShell');
    if (btnToggle && appShell) {
      btnToggle.addEventListener('click', () => {
        appShell.classList.toggle('sidebar-collapsed');
        const isCollapsed = appShell.classList.contains('sidebar-collapsed');
        btnToggle.querySelector('span').textContent = isCollapsed ? '▶' : '◀';
        try {
          localStorage.setItem('gom_sidebar_collapsed', isCollapsed ? '1' : '0');
        } catch (_) {}
        window.dispatchEvent(new Event('resize'));
        if (this.hyper4dStudio) {
          requestAnimationFrame(() => this.hyper4dStudio._resizeCanvas());
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 160);
          setTimeout(() => this.hyper4dStudio?._resizeCanvas(), 320);
        }
      });

      // Restore collapsed preference
      try {
        if (localStorage.getItem('gom_sidebar_collapsed') === '1') {
          appShell.classList.add('sidebar-collapsed');
          btnToggle.querySelector('span').textContent = '▶';
        }
      } catch (_) {}
    }

    // Topbar live preview hex click to copy
    const topHex = document.getElementById('topbarHex');
    if (topHex) {
      topHex.addEventListener('click', () => {
        navigator.clipboard.writeText(topHex.textContent);
        this.showToast(`HEX copiado: ${topHex.textContent}`);
      });
    }

    const btnOpenSwatches = document.getElementById('btnOpenFullSwatches');
    if (btnOpenSwatches) {
      btnOpenSwatches.addEventListener('click', () => {
        const swTab = document.querySelector('.nav-tab-btn[data-tab="swatches"]');
        if (swTab) swTab.click();
      });
    }
  }

  // --- NUMERIC CONTROLS & DUAL SPACE ---

  _bindNumericSliders() {
    const spaceBtns = document.querySelectorAll('.space-tab-btn');
    spaceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        spaceBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeSpace = e.target.dataset.space;
        this.renderNumericSliders();
      });
    });

    this.renderNumericSliders();
  }

  renderNumericSliders() {
    const container = document.getElementById('numControlsGrid');
    if (!container) return;
    container.innerHTML = '';

    const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    const cmyk = ColorMath.rgbToCmyk(currentRgb.r, currentRgb.g, currentRgb.b);
    const hsl = ColorMath.rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

    let channels = [];

    if (this.activeSpace === 'rgb') {
      channels = [
        { key: 'r', label: 'R', min: 0, max: 255, val: currentRgb.r, color: '#EF4444' },
        { key: 'g', label: 'G', min: 0, max: 255, val: currentRgb.g, color: '#10B981' },
        { key: 'b', label: 'B', min: 0, max: 255, val: currentRgb.b, color: '#3B82F6' }
      ];
    } else if (this.activeSpace === 'cmyk') {
      channels = [
        { key: 'c', label: 'C', min: 0, max: 100, val: cmyk.c, color: '#06B6D4' },
        { key: 'm', label: 'M', min: 0, max: 100, val: cmyk.m, color: '#EC4899' },
        { key: 'y', label: 'Y', min: 0, max: 100, val: cmyk.y, color: '#FACC15' },
        { key: 'k', label: 'K', min: 0, max: 100, val: cmyk.k, color: '#6B7280' }
      ];
    } else if (this.activeSpace === 'hsl') {
      channels = [
        { key: 'h', label: 'H', min: 0, max: 360, val: hsl.h, color: '#8B5CF6' },
        { key: 's', label: 'S', min: 0, max: 100, val: Math.round(hsl.s * 100), color: '#3B82F6' },
        { key: 'l', label: 'L', min: 0, max: 100, val: Math.round(hsl.l * 100), color: '#9CA3AF' }
      ];
    }

    channels.forEach(ch => {
      const row = document.createElement('div');
      row.className = 'slider-row';

      const label = document.createElement('span');
      label.className = 'slider-label';
      label.textContent = ch.label;
      label.style.color = ch.color;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'color-slider';
      slider.min = ch.min;
      slider.max = ch.max;
      slider.value = ch.val;
      slider.id = `slider_${ch.key}`;

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.className = 'slider-input';
      numInput.min = ch.min;
      numInput.max = ch.max;
      numInput.value = ch.val;
      numInput.id = `input_${ch.key}`;

      const onInput = (val) => {
        val = parseInt(val, 10);
        if (isNaN(val)) val = 0;
        slider.value = val;
        numInput.value = val;
        this._handleSliderChange(ch.key, val);
      };

      slider.addEventListener('input', (e) => onInput(e.target.value));
      numInput.addEventListener('change', (e) => onInput(e.target.value));

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(numInput);
      container.appendChild(row);
    });
  }

  _handleSliderChange(channelKey, val) {
    if (this.activeSpace === 'rgb') {
      const r = channelKey === 'r' ? val : parseInt(document.getElementById('slider_r').value, 10);
      const g = channelKey === 'g' ? val : parseInt(document.getElementById('slider_g').value, 10);
      const b = channelKey === 'b' ? val : parseInt(document.getElementById('slider_b').value, 10);
      this.setColorDirectly({ r, g, b });
    } else if (this.activeSpace === 'cmyk') {
      const c = channelKey === 'c' ? val : parseInt(document.getElementById('slider_c').value, 10);
      const m = channelKey === 'm' ? val : parseInt(document.getElementById('slider_m').value, 10);
      const y = channelKey === 'y' ? val : parseInt(document.getElementById('slider_y').value, 10);
      const k = channelKey === 'k' ? val : parseInt(document.getElementById('slider_k').value, 10);
      const rgb = ColorMath.cmykToRgb(c, m, y, k);
      this.setColorDirectly(rgb);
    } else if (this.activeSpace === 'hsl') {
      const h = channelKey === 'h' ? val : parseInt(document.getElementById('slider_h').value, 10);
      const s = channelKey === 's' ? val / 100 : parseInt(document.getElementById('slider_s').value, 10) / 100;
      const l = channelKey === 'l' ? val / 100 : parseInt(document.getElementById('slider_l').value, 10) / 100;
      const rgb = ColorMath.hslToRgb(h, s, l);
      this.setColorDirectly(rgb);
    }
  }

  updateNumericInputs(rgb, cmyk, hsl) {
    if (this.activeSpace === 'rgb') {
      const r = document.getElementById('slider_r');
      const g = document.getElementById('slider_g');
      const b = document.getElementById('slider_b');
      const ir = document.getElementById('input_r');
      const ig = document.getElementById('input_g');
      const ib = document.getElementById('input_b');
      if (r && ir) { r.value = rgb.r; ir.value = rgb.r; }
      if (g && ig) { g.value = rgb.g; ig.value = rgb.g; }
      if (b && ib) { b.value = rgb.b; ib.value = rgb.b; }
    } else if (this.activeSpace === 'cmyk') {
      const c = document.getElementById('slider_c');
      const m = document.getElementById('slider_m');
      const y = document.getElementById('slider_y');
      const k = document.getElementById('slider_k');
      const ic = document.getElementById('input_c');
      const im = document.getElementById('input_m');
      const iy = document.getElementById('input_y');
      const ik = document.getElementById('input_k');
      if (c && ic) { c.value = cmyk.c; ic.value = cmyk.c; }
      if (m && im) { m.value = cmyk.m; im.value = cmyk.m; }
      if (y && iy) { y.value = cmyk.y; iy.value = cmyk.y; }
      if (k && ik) { k.value = cmyk.k; ik.value = cmyk.k; }
    } else if (this.activeSpace === 'hsl') {
      const h = document.getElementById('slider_h');
      const s = document.getElementById('slider_s');
      const l = document.getElementById('slider_l');
      const ih = document.getElementById('input_h');
      const is = document.getElementById('input_s');
      const il = document.getElementById('input_l');
      if (h && ih) { h.value = hsl.h; ih.value = hsl.h; }
      if (s && is) { s.value = Math.round(hsl.s * 100); is.value = Math.round(hsl.s * 100); }
      if (l && il) { l.value = Math.round(hsl.l * 100); il.value = Math.round(hsl.l * 100); }
    }
  }

  // --- STUDIO HARMONIES, MATRIX & PIGMENT BLENDER ---

  renderHarmonySwatches(harmonies) {
    const grid = document.getElementById('harmonySwatchesGrid');
    if (!grid || !harmonies || !harmonies.colors) return;
    grid.innerHTML = '';

    const isAtmo = AtmosphereEngine.state.enabled;

    harmonies.colors.forEach((col) => {
      const displayRgb = isAtmo ? AtmosphereEngine.transformColor(col.rgb) : col.rgb;
      const displayHex = ColorMath.rgbToHex(displayRgb.r, displayRgb.g, displayRgb.b);

      const card = document.createElement('div');
      card.className = 'harmony-card';
      card.dataset.swatchHex = displayHex;
      card.dataset.swatchLabel = col.role;
      card.draggable = true;
      card.title = `${col.role} (${displayHex}) • Click: Frontal (FG) • Alt+Click: Fondo (BG) • Arrastra para guardar`;

      const colorBox = document.createElement('div');
      colorBox.className = 'harmony-card-color';
      colorBox.style.backgroundColor = displayHex;

      const info = document.createElement('div');
      info.className = 'harmony-card-info';

      const role = document.createElement('span');
      role.className = 'harmony-card-role';
      role.textContent = col.role;

      const hex = document.createElement('span');
      hex.className = 'harmony-card-hex copyable-hex';
      hex.textContent = displayHex;

      info.appendChild(role);
      info.appendChild(hex);
      card.appendChild(colorBox);
      card.appendChild(info);

      card.addEventListener('click', (e) => {
        if (e.altKey) {
          this.activeWell = 'bg';
          const bgWell = document.getElementById('bgWell');
          const fgWell = document.getElementById('fgWell');
          if (bgWell) bgWell.classList.add('active');
          if (fgWell) fgWell.classList.remove('active');
          this.setColorDirectly(col.rgb);
          this.showToast(`Fondo (BG) actualizado: ${displayHex}`);
        } else {
          this.activeWell = 'fg';
          const bgWell = document.getElementById('bgWell');
          const fgWell = document.getElementById('fgWell');
          if (fgWell) fgWell.classList.add('active');
          if (bgWell) bgWell.classList.remove('active');
          this.setColorDirectly(col.rgb);
          this.showToast(`Color armónico aplicado: ${col.role} (${displayHex})`);
        }
      });

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', displayHex);
        e.dataTransfer.setData('application/gom-swatch', JSON.stringify({
          paletteId: 'harmony',
          hex: displayHex
        }));
      });

      grid.appendChild(card);
    });
  }

  renderTintShadeToneMatrix(rgb) {
    const container = document.getElementById('matrixContainer');
    if (!container) return;
    container.innerHTML = '';

    const matrix = HarmonyEngine.getTintsShadesTones(rgb, 7);

    const rows = [
      { label: 'Tints', list: matrix.tints },
      { label: 'Shades', list: matrix.shades },
      { label: 'Tones', list: matrix.tones }
    ];

    rows.forEach(r => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'matrix-row';

      const lbl = document.createElement('span');
      lbl.className = 'matrix-label';
      lbl.textContent = r.label;

      const swatchesDiv = document.createElement('div');
      swatchesDiv.className = 'matrix-swatches';

      r.list.forEach(item => {
        const sw = document.createElement('div');
        sw.className = 'matrix-swatch';
        sw.style.backgroundColor = item.hex;
        sw.dataset.swatchHex = item.hex;
        sw.dataset.swatchLabel = item.label;
        sw.draggable = true;
        sw.addEventListener('click', () => this.setColorDirectly(item.rgb));
        swatchesDiv.appendChild(sw);
      });

      rowDiv.appendChild(lbl);
      rowDiv.appendChild(swatchesDiv);
      container.appendChild(rowDiv);
    });
  }

  renderPigmentBlender() {
    const chipA = document.getElementById('pigmentChipA');
    const chipB = document.getElementById('pigmentChipB');
    const rampContainer = document.getElementById('pigmentRamp');

    if (chipA) chipA.style.backgroundColor = this.fgColor.hex;
    if (chipB) chipB.style.backgroundColor = this.bgColor.hex;
    if (!rampContainer) return;
    rampContainer.innerHTML = '';

    const blendSteps = HarmonyEngine.getPigmentBlendRamp(this.fgColor, this.bgColor, 9);

    blendSteps.forEach((step) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'pigment-step';
      stepDiv.style.backgroundColor = step.hex;
      stepDiv.dataset.swatchHex = step.hex;
      stepDiv.dataset.swatchLabel = `Mezcla ${step.weight}%`;
      stepDiv.draggable = true;
      stepDiv.addEventListener('click', () => this.setColorDirectly(step.rgb));
      rampContainer.appendChild(stepDiv);
    });
  }

  renderQuickPalette() {
    const container = document.getElementById('quickPaletteContainer');
    if (!container) return;
    container.innerHTML = '';

    // Synchronize quick undo button in studio toolbar
    const btnUndo = document.getElementById('btnQuickUndoPalette');
    if (btnUndo) {
      if (this.swatchManager.lastDeleted) {
        btnUndo.style.display = 'inline-flex';
        btnUndo.innerHTML = `<span>↩️</span> Deshacer (${this.swatchManager.lastDeleted.hex})`;
        btnUndo.title = `Restaurar ${this.swatchManager.lastDeleted.hex} en '${this.swatchManager.lastDeleted.paletteName}' (Ctrl+Z)`;
        btnUndo.onclick = () => {
          const res = this.swatchManager.undoLastDelete();
          this.renderQuickPalette();
          this.renderSwatchesCollection();
          if (res) this.showToast(`Color ${res.hex} restaurado en '${res.paletteName}'`, 'success');
        };
      } else {
        btnUndo.style.display = 'none';
      }
    }

    const selector = document.getElementById('quickPaletteSelector');
    if (selector) {
      selector.innerHTML = '';
      this.swatchManager.palettes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.colors.length})`;
        if (p.id === this.swatchManager.activePaletteId) {
          opt.selected = true;
        }
        selector.appendChild(opt);
      });
    }

    const activePal = this.swatchManager.getActivePalette() || { id: 'temp', name: 'Paleta Rápida', colors: [] };

    if (!activePal.colors || activePal.colors.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'palette-empty-dropzone';
      emptyNotice.innerHTML = '<span>🎨</span><span>Paleta vacía. Arrastra cualquier muestra aquí o pulsa <b>+ Añadir FG</b></span>';
      container.appendChild(emptyNotice);
      return;
    }

    activePal.colors.forEach((hex, idx) => {
      const pill = this._createSwatchPillDom(activePal, hex, idx, false);
      container.appendChild(pill);
    });
  }

  _createSwatchPillDom(pal, hex, idx, isBuiltIn = false) {
    const isAtmo = AtmosphereEngine.state.enabled;
    const baseRgb = ColorMath.hexToRgb(hex);
    const dispRgb = isAtmo ? AtmosphereEngine.transformColor(baseRgb) : baseRgb;
    const dispHex = ColorMath.rgbToHex(dispRgb.r, dispRgb.g, dispRgb.b);

    const pill = document.createElement('div');
    pill.className = 'swatch-color-pill';
    pill.style.backgroundColor = dispHex;
    pill.dataset.swatchHex = dispHex;
    pill.dataset.paletteId = pal.id;
    pill.dataset.index = idx;
    pill.dataset.swatchLabel = isAtmo ? `${pal.name} (Atmo: ${dispHex})` : `${pal.name}: ${dispHex}`;
    pill.draggable = true;
    pill.title = `${dispHex} • Click: seleccionar | Arrastra: ordenar | Click derecho: opciones`;

    // 1. Delete button badge (for user palettes)
    if (!isBuiltIn) {
      const btnDel = document.createElement('button');
      btnDel.className = 'swatch-delete-badge';
      btnDel.innerHTML = '✕';
      btnDel.title = 'Eliminar color de la paleta';
      btnDel.setAttribute('aria-label', 'Eliminar color');

      btnDel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const res = this.swatchManager.removeColorFromPalette(pal.id, idx);
        if (res) {
          this.renderQuickPalette();
          this.renderSwatchesCollection();
          this.showToast(`Color ${hex} eliminado de "${pal.name}"`, 'info', 7500, {
            text: '↩️ Deshacer',
            onClick: () => {
              const und = this.swatchManager.undoLastDelete();
              this.renderQuickPalette();
              this.renderSwatchesCollection();
              if (und) this.showToast(`Color ${und.hex} restaurado en '${und.paletteName}'`, 'success');
            }
          });
        }
      });
      pill.appendChild(btnDel);
    }

    // 2. Drag and drop reordering
    pill.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', dispHex);
      e.dataTransfer.setData('application/gom-swatch', JSON.stringify({
        paletteId: pal.id,
        index: idx,
        hex: hex
      }));
      e.dataTransfer.effectAllowed = 'move';
      pill.classList.add('is-dragging');
    });

    pill.addEventListener('dragend', () => {
      pill.classList.remove('is-dragging');
      document.querySelectorAll('.drag-insert-before, .drag-insert-after').forEach(el => {
        el.classList.remove('drag-insert-before', 'drag-insert-after');
      });
    });

    pill.addEventListener('dragover', (e) => {
      if (isBuiltIn) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = pill.getBoundingClientRect();
      const isLeft = (e.clientX - rect.left) < (rect.width / 2);
      if (isLeft) {
        pill.classList.add('drag-insert-before');
        pill.classList.remove('drag-insert-after');
      } else {
        pill.classList.add('drag-insert-after');
        pill.classList.remove('drag-insert-before');
      }
    });

    pill.addEventListener('dragleave', () => {
      pill.classList.remove('drag-insert-before', 'drag-insert-after');
    });

    pill.addEventListener('drop', (e) => {
      if (isBuiltIn) return;
      e.preventDefault();
      e.stopPropagation();
      const isInsertBefore = pill.classList.contains('drag-insert-before');
      pill.classList.remove('drag-insert-before', 'drag-insert-after');

      const rawSwatchData = e.dataTransfer.getData('application/gom-swatch');
      const rawHex = e.dataTransfer.getData('text/plain');

      if (rawSwatchData) {
        try {
          const { paletteId: sourcePalId, index: sourceIdx, hex: sourceHex } = JSON.parse(rawSwatchData);
          if (sourcePalId === pal.id) {
            // Reordering within the same palette
            let targetIdx = isInsertBefore ? idx : idx + 1;
            if (sourceIdx < targetIdx) targetIdx--;
            this.swatchManager.reorderColorInPalette(pal.id, sourceIdx, targetIdx);
            this.renderQuickPalette();
            this.renderSwatchesCollection();
            return;
          } else {
            // Dragged from another palette
            const targetIdx = isInsertBefore ? idx : idx + 1;
            this.swatchManager.addColorToPalette(pal.id, sourceHex, targetIdx);
            this.renderQuickPalette();
            this.renderSwatchesCollection();
            this.showToast(`Color ${sourceHex} copiado a '${pal.name}'`);
            return;
          }
        } catch (err) {}
      }

      if (rawHex && rawHex.startsWith('#')) {
        const targetIdx = isInsertBefore ? idx : idx + 1;
        this.swatchManager.addColorToPalette(pal.id, rawHex.toUpperCase(), targetIdx);
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        this.showToast(`Color ${rawHex} añadido a '${pal.name}'`);
      }
    });

    // 3. Selection
    pill.addEventListener('click', () => {
      this.setColorDirectly(baseRgb);
      this.showToast(`Muestra seleccionada: ${dispHex}`);
    });

    // 4. Right-click context menu
    pill.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showSwatchContextMenu(e, pal, idx, hex, isBuiltIn);
    });

    return pill;
  }

  _bindUniversalSwatchContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      // Never intercept right clicks in text inputs or textareas so native context menus work
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const swatchData = this.resolveSwatchTarget(e.target);
      if (swatchData) {
        e.preventDefault();
        e.stopPropagation();
        this.openUniversalSwatchContextMenu(e, swatchData);
      }
    });
  }

  resolveSwatchTarget(target) {
    if (!target || target.tagName === 'CANVAS') return null;

    // 1. Color Wells (Hero wells FG / BG)
    const wellBox = target.closest('#fgWell, #bgWell, #wellFg, #wellBg, .hero-swatch-box');
    if (wellBox) {
      const isFg = wellBox.id.toLowerCase().includes('fg') || wellBox.classList.contains('fg');
      const color = isFg ? this.fgColor : this.bgColor;
      return {
        hex: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        label: isFg ? 'Color Frontal (Principal)' : 'Color de Fondo (Secundario)',
        source: 'well',
        element: wellBox
      };
    }

    // 2. Element swatch lookup
    const swatchEl = target.closest(`
      [data-swatch-hex],
      [data-hex],
      [data-color],
      .swatch-color-pill,
      .swatch-color-block,
      .matrix-swatch,
      .harmony-card,
      .harmony-card-color,
      .history-item,
      .atmo-stage-card,
      .atmo-stage-color-pill,
      .shadow-swatch-chip,
      .endpoint-chip,
      .pigment-step,
      .extracted-swatch,
      .companion-band-item,
      .painter-swatch,
      .ai-swatch-card,
      .munsell-chip,
      .chromilla-tube-chip,
      .pigment-tube-item,
      .cvd-swatch-sample,
      .cvd-quadrant-card,
      .tooltip-var-chip,
      .ramp-swatch-cell
    `);

    const el = swatchEl || target;

    let hex = el.dataset?.swatchHex || el.dataset?.hex || el.dataset?.color;
    if (!hex && el.querySelector) {
      const child = el.querySelector('[data-swatch-hex], [data-hex], [data-color]');
      if (child) {
        hex = child.dataset.swatchHex || child.dataset.hex || child.dataset.color;
      }
    }

    if (!hex) {
      const isCandidate = swatchEl !== null || 
        /(swatch|chip|pill|color|sample|step|band|stage)/i.test(el.className || '');
      if (isCandidate) {
        const bg = el.style?.backgroundColor || window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
          const rgbMatch = bg.match(/\d+/g);
          if (rgbMatch && rgbMatch.length >= 3) {
            hex = ColorMath.rgbToHex(parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2]));
          }
        }
      }
    }

    if (!hex || typeof hex !== 'string') return null;
    hex = hex.trim();
    if (!hex.startsWith('#')) return null;

    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
    } else if (hex.length === 7) {
      hex = hex.toUpperCase();
    } else {
      return null;
    }

    const rgb = ColorMath.hexToRgb(hex);

    let label = el.dataset?.swatchLabel || el.dataset?.role || el.getAttribute?.('aria-label') || el.getAttribute?.('title') || '';
    if (!label && el.querySelector) {
      const textChild = el.querySelector('.harmony-card-role, .var-chip-tag, .cvd-card-desc, .hero-block-label, .swatch-label, .ai-swatch-tag');
      if (textChild) label = textChild.textContent.trim();
    }
    if (!label) {
      if (el.classList.contains('history-item')) label = 'Historial Reciente';
      else if (el.classList.contains('matrix-swatch')) label = 'Matriz de Gama';
      else if (el.classList.contains('pigment-step')) label = 'Paso de Mezcla';
      else if (el.classList.contains('extracted-swatch')) label = 'Color Extraído';
      else if (el.classList.contains('painter-swatch')) label = 'Pigmento de Maestro';
      else if (el.classList.contains('munsell-chip')) label = 'Muestra Munsell';
      else if (el.classList.contains('companion-band-item')) label = 'Banda Compañera';
      else if (el.classList.contains('atmo-stage-card') || el.classList.contains('atmo-stage-color-pill') || el.classList.contains('shadow-swatch-chip')) label = 'Atmósfera / Sombra';
      else label = `Muestra ${hex}`;
    }

    if (label.includes('(') && !label.includes('PB') && !label.includes('PR') && !label.includes('PY') && !label.includes('PG')) {
      label = label.split('(')[0].trim();
    }
    if (label.includes('•')) label = label.split('•')[0].trim();

    let paletteId = el.dataset?.paletteId;
    let index = el.dataset?.index !== undefined ? parseInt(el.dataset.index) : -1;
    let palette = null;
    let isBuiltIn = false;

    if (!paletteId) {
      const card = el.closest?.('.palette-collection-card, [data-palette-id]');
      if (card && card.dataset.paletteId) {
        paletteId = card.dataset.paletteId;
      }
    }

    if (paletteId) {
      palette = this.swatchManager.palettes.find(p => p.id === paletteId);
      if (!palette) {
        const cat = PaletteCatalogs.DEFAULT_LIBRARIES.find(c => c.id === paletteId);
        if (cat) {
          palette = cat;
          isBuiltIn = true;
        }
      }
    }

    return {
      hex,
      rgb,
      label,
      paletteId,
      palette,
      index,
      isBuiltIn,
      element: el
    };
  }

  openUniversalSwatchContextMenu(e, swatchData) {
    const existing = document.getElementById('swatchContextMenu');
    if (existing) existing.remove();
    const existingSub = document.querySelector('.swatch-context-submenu');
    if (existingSub) existingSub.remove();

    const menu = document.createElement('div');
    menu.id = 'swatchContextMenu';
    menu.className = 'swatch-context-menu';

    const { hex, rgb, label, palette, index, isBuiltIn } = swatchData;
    const cmyk = ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const lum = Math.round(ColorMath.getLuminance(rgb.r, rgb.g, rgb.b) * 100);
    const activePal = this.swatchManager.getActivePalette() || this.swatchManager.palettes[0];

    const compRgb = { r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b };
    const compHex = ColorMath.rgbToHex(compRgb.r, compRgb.g, compRgb.b);
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const tintRgb = ColorMath.hsvToRgb(hsv.h, Math.max(0, hsv.s * 0.7), Math.min(1, hsv.v * 1.25 + 0.15));
    const tintHex = ColorMath.rgbToHex(tintRgb.r, tintRgb.g, tintRgb.b);
    const shadeRgb = ColorMath.hsvToRgb((hsv.h + 15) % 360, Math.min(1, hsv.s * 1.15), Math.max(0.12, hsv.v * 0.55));
    const shadeHex = ColorMath.rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);

    // 1. Chromatic intelligence header
    const header = document.createElement('div');
    header.className = 'context-menu-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background-color: ${hex}; border: 1.5px solid rgba(255,255,255,0.45); box-shadow: 0 0 10px ${hex}55; flex-shrink: 0;"></div>
        <div style="overflow: hidden; line-height: 1.25;">
          <div style="font-weight: 700; font-size: 0.76rem; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;" title="${label}">${label}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">${hex} • ${munsell.notation} • ${lum}%Y</div>
        </div>
      </div>
    `;
    menu.appendChild(header);

    const items = [];

    // Core Well assignments
    items.push({
      icon: '🎯',
      label: 'Color Frontal (FG)',
      action: () => {
        this.setActiveWell('fg');
        this.setColorDirectly(rgb);
        this.showToast(`Establecido como Frontal: ${hex}`);
      }
    });

    items.push({
      icon: '🎨',
      label: 'Color Fondo (BG)',
      action: () => {
        this.setActiveWell('bg');
        this.setColorDirectly(rgb);
        this.showToast(`Establecido como Fondo: ${hex}`);
      }
    });

    // Palette operations
    if (activePal) {
      items.push({
        icon: '➕',
        label: `Añadir a '${activePal.name}'`,
        badge: 'Activa',
        action: () => {
          this.swatchManager.addColorToPalette(activePal.id, hex);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color ${hex} añadido a '${activePal.name}'`);
        }
      });
    }

    if (this.swatchManager.palettes.length > 1) {
      items.push({
        icon: '📥',
        label: 'Enviar a Paleta...',
        badge: '▶',
        hasSubmenu: true,
        submenuItems: this.swatchManager.palettes.map(p => ({
          label: p.name,
          badge: `${p.colors?.length || 0}`,
          action: () => {
            this.swatchManager.addColorToPalette(p.id, hex);
            this.renderSwatchesCollection();
            this.renderQuickPalette();
            this.showToast(`Color ${hex} añadido a '${p.name}'`);
          }
        }))
      });
    }

    items.push({
      icon: '🆕',
      label: 'Crear nueva paleta con este color',
      action: () => {
        const createFn = this.swatchManager.createPalette || this.swatchManager.addPalette;
        const newPal = createFn.call(this.swatchManager, `Paleta ${hex}`, [hex]);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Nueva paleta creada con ${hex}`, 'success');
      }
    });

    items.push({ divider: true });

    // Creative physical & studio workflows
    items.push({
      icon: '🖌️',
      label: 'Depositar en Mesa de Mezclas',
      badge: 'Wet Mixer',
      action: () => {
        this.switchTab('wetmixer');
        if (this.wetMixer) {
          const rx = this.wetMixer.width * (0.3 + Math.random() * 0.4);
          const ry = this.wetMixer.height * (0.35 + Math.random() * 0.35);
          this.wetMixer.depositDab(rx, ry, rgb, 46);
        }
        this.showToast(`Pintura ${hex} depositada en el lienzo de mezclas`, 'success');
      }
    });

    items.push({
      icon: '🌈',
      label: 'Cargar en Armonías Dinámicas',
      action: () => {
        this.switchTab('studio');
        this.setActiveWell('fg');
        this.setColorDirectly(rgb);
        this.showToast(`Armonías calculadas para ${hex}`);
      }
    });

    items.push({
      icon: '🌤️',
      label: 'Cargar en Simulador de Atmósfera',
      action: () => {
        this.switchTab('atmosphere');
        this.setActiveWell('fg');
        this.setColorDirectly(rgb);
        this.showToast(`Color cargado en atmósfera: ${hex}`);
      }
    });

    items.push({ divider: true });

    // Chromatic variations
    items.push({
      icon: '🔄',
      label: 'Complementario (180°)',
      badge: compHex,
      action: () => {
        this.setActiveWell('fg');
        this.setColorDirectly(compRgb);
        this.showToast(`Complementario cargado: ${compHex}`);
      }
    });

    items.push({
      icon: '☀️',
      label: 'Tinte Iluminado (+Luz)',
      badge: tintHex,
      action: () => {
        this.setActiveWell('fg');
        this.setColorDirectly(tintRgb);
        this.showToast(`Tinte iluminado: ${tintHex}`);
      }
    });

    items.push({
      icon: '🌑',
      label: 'Sombra Pictórica (+Oscuro)',
      badge: shadeHex,
      action: () => {
        this.setActiveWell('fg');
        this.setColorDirectly(shadeRgb);
        this.showToast(`Sombra pictórica: ${shadeHex}`);
      }
    });

    items.push({ divider: true });

    // Copy options
    items.push({
      icon: '📋',
      label: `Copiar HEX (${hex})`,
      action: () => {
        this.copyToClipboard(hex);
      }
    });

    items.push({
      icon: '📋',
      label: `Copiar RGB (${rgb.r}, ${rgb.g}, ${rgb.b})`,
      action: () => {
        this.copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      }
    });

    items.push({
      icon: '📋',
      label: `Copiar CMYK (${cmyk.c}C ${cmyk.m}M ${cmyk.y}Y ${cmyk.k}K)`,
      action: () => {
        this.copyToClipboard(`${cmyk.c}% ${cmyk.m}% ${cmyk.y}% ${cmyk.k}%`);
      }
    });

    items.push({
      icon: '📋',
      label: `Copiar Munsell (${munsell.notation})`,
      action: () => {
        this.copyToClipboard(munsell.notation);
      }
    });

    items.push({ divider: true });
    items.push({
      icon: '🖼️',
      label: palette ? `Exportar Lámina de '${palette.name}'...` : `Exportar Ficha de ${hex}...`,
      action: () => {
        const palColors = palette ? palette.colors : [hex];
        const palName = palette ? palette.name : `Muestra ${hex}`;
        SwatchSheetExporter.openExportModal(palName, palColors, this);
      }
    });

    // In-palette options if this swatch is part of an editable palette
    if (palette && !isBuiltIn && index >= 0) {
      items.push({ divider: true });
      items.push({
        icon: '📑',
        label: 'Duplicar muestra en paleta',
        action: () => {
          this.swatchManager.addColorToPalette(palette.id, hex, index + 1);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color ${hex} duplicado`);
        }
      });

      items.push({
        icon: '🔄',
        label: 'Invertir muestra en paleta',
        action: () => {
          palette.colors[index] = compHex;
          this.swatchManager.savePalettes();
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color invertido a ${compHex}`);
        }
      });

      items.push({
        icon: '🗑️',
        label: `Eliminar de "${palette.name}"`,
        danger: true,
        action: () => {
          const res = this.swatchManager.removeColorFromPalette(palette.id, index);
          if (res) {
            this.renderSwatchesCollection();
            this.renderQuickPalette();
            this.showToast(`Color ${hex} eliminado de "${palette.name}"`, 'info', 7500, {
              text: '↩️ Deshacer',
              onClick: () => {
                const und = this.swatchManager.undoLastDelete();
                this.renderSwatchesCollection();
                this.renderQuickPalette();
                if (und) this.showToast(`Color ${und.hex} restaurado en '${und.paletteName}'`, 'success');
              }
            });
          }
        }
      });
    }

    // Global Undo if lastDeleted exists
    if (this.swatchManager.lastDeleted) {
      const del = this.swatchManager.lastDeleted;
      items.push({ divider: true });
      items.push({
        icon: '↩️',
        label: `Deshacer eliminación (${del.hex})`,
        badge: 'Ctrl+Z',
        highlight: true,
        action: () => {
          const und = this.swatchManager.undoLastDelete();
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          if (und) this.showToast(`Color ${und.hex} restaurado en '${und.paletteName}'`, 'success');
        }
      });
    }

    // Render items into menu DOM
    items.forEach(it => {
      if (it.divider) {
        const div = document.createElement('div');
        div.className = 'context-menu-divider';
        menu.appendChild(div);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `context-menu-item ${it.danger ? 'danger' : ''} ${it.highlight ? 'btn-undo-glow' : ''}`;
      btn.innerHTML = `
        <span style="font-size: 0.9rem;">${it.icon}</span>
        <span style="flex-grow: 1;">${it.label}</span>
        ${it.badge ? `<span class="context-item-badge">${it.badge}</span>` : ''}
      `;

      if (it.hasSubmenu && it.submenuItems) {
        btn.addEventListener('mouseenter', () => {
          this.openSwatchSubmenu(btn, it.submenuItems, menu);
        });
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.openSwatchSubmenu(btn, it.submenuItems, menu);
        });
      } else {
        btn.addEventListener('mouseenter', () => {
          const oldSub = document.querySelector('.swatch-context-submenu');
          if (oldSub) oldSub.remove();
        });
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            if (typeof it.action === 'function') {
              it.action();
            }
          } catch (err) {
            console.error('[GOM Context Menu] Error executing action:', err);
          } finally {
            menu.remove();
            const oldSub = document.querySelector('.swatch-context-submenu');
            if (oldSub) oldSub.remove();
          }
        });
      }

      menu.appendChild(btn);
    });

    // Isolate clicks/pointer events inside menu from outside dismiss listeners
    menu.addEventListener('pointerdown', (e) => e.stopPropagation());
    menu.addEventListener('mousedown', (e) => e.stopPropagation());
    menu.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(menu);

    // Viewport-aware positioning
    const menuWidth = 230;
    const menuHeight = menu.offsetHeight || 380;
    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > window.innerWidth - 12) {
      posX = window.innerWidth - menuWidth - 12;
    }
    if (posY + menuHeight > window.innerHeight - 12) {
      posY = Math.max(12, window.innerHeight - menuHeight - 12);
    }

    menu.style.left = `${Math.round(posX)}px`;
    menu.style.top = `${Math.round(posY)}px`;

    // Global click dismiss
    const closeHandler = (evt) => {
      const sub = document.querySelector('.swatch-context-submenu');
      if (!menu.contains(evt.target) && (!sub || !sub.contains(evt.target))) {
        menu.remove();
        if (sub) sub.remove();
        document.removeEventListener('pointerdown', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', closeHandler), 60);
  }

  openSwatchSubmenu(parentBtn, items, parentMenu) {
    const existing = document.querySelector('.swatch-context-submenu');
    if (existing) existing.remove();

    const sub = document.createElement('div');
    sub.className = 'swatch-context-submenu';
    sub.addEventListener('pointerdown', (e) => e.stopPropagation());
    sub.addEventListener('mousedown', (e) => e.stopPropagation());
    sub.addEventListener('click', (e) => e.stopPropagation());

    items.forEach(it => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'context-menu-item';
      btn.innerHTML = `
        <span style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${it.label}</span>
        ${it.badge ? `<span class="context-item-badge">${it.badge}</span>` : ''}
      `;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        try {
          if (typeof it.action === 'function') {
            it.action();
          }
        } catch (err) {
          console.error('[GOM Context Menu] Error in submenu action:', err);
        } finally {
          sub.remove();
          if (parentMenu) parentMenu.remove();
        }
      });
      sub.appendChild(btn);
    });

    document.body.appendChild(sub);

    const rect = parentBtn.getBoundingClientRect();
    let subX = rect.right + 4;
    let subY = rect.top;

    if (subX + 210 > window.innerWidth - 12) {
      subX = rect.left - 210 - 4;
    }
    if (subY + (sub.offsetHeight || 200) > window.innerHeight - 12) {
      subY = Math.max(12, window.innerHeight - (sub.offsetHeight || 200) - 12);
    }

    sub.style.left = `${Math.max(12, Math.round(subX))}px`;
    sub.style.top = `${Math.max(12, Math.round(subY))}px`;
  }

  showSwatchContextMenu(e, pal, index, hex, isBuiltIn) {
    const swatchData = {
      hex,
      rgb: ColorMath.hexToRgb(hex),
      label: pal ? `${pal.name}: ${hex}` : `Muestra ${hex}`,
      paletteId: pal?.id,
      palette: pal,
      index,
      isBuiltIn,
      element: e.currentTarget
    };
    this.openUniversalSwatchContextMenu(e, swatchData);
  }

  showPaletteSortPopover(anchorBtn, pal) {
    const existing = document.querySelector('.palette-popover-menu');
    if (existing) {
      const wasSame = existing.dataset.anchorId === (anchorBtn.id || pal.id);
      existing.remove();
      if (wasSame) return;
    }

    const pop = document.createElement('div');
    pop.className = 'palette-popover-menu';
    pop.dataset.anchorId = anchorBtn.id || pal.id;

    const rect = anchorBtn.getBoundingClientRect();
    pop.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
    pop.style.top = `${rect.bottom + 4}px`;

    const sorts = [
      { icon: '🌈', label: 'Por Tono (Hue 0°→360°)', key: 'hue' },
      { icon: '☀️', label: 'Luz: Claro a Oscuro', key: 'lum-desc' },
      { icon: '🌙', label: 'Luz: Oscuro a Claro', key: 'lum-asc' },
      { icon: '⚡', label: 'Saturación (Vivo a Neutro)', key: 'sat-desc' },
      { icon: '🔁', label: 'Invertir Orden Actual', key: 'reverse' }
    ];

    sorts.forEach(s => {
      const item = document.createElement('button');
      item.className = 'context-menu-item';
      item.innerHTML = `<span>${s.icon}</span><span>${s.label}</span>`;
      item.addEventListener('click', () => {
        this.swatchManager.sortPalette(pal.id, s.key);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Paleta '${pal.name}' ordenada`);
        pop.remove();
      });
      pop.appendChild(item);
    });

    document.body.appendChild(pop);
    const close = (e) => {
      if (!pop.contains(e.target) && e.target !== anchorBtn) {
        pop.remove();
        document.removeEventListener('pointerdown', close);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', close), 10);
  }

  showPaletteExportPopover(anchorBtn, pal) {
    const existing = document.querySelector('.palette-popover-menu');
    if (existing) {
      const wasSame = existing.dataset.anchorId === (anchorBtn.id || pal.id);
      existing.remove();
      if (wasSame) return;
    }

    const pop = document.createElement('div');
    pop.className = 'palette-popover-menu';
    pop.dataset.anchorId = anchorBtn.id || pal.id;

    const rect = anchorBtn.getBoundingClientRect();
    pop.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;
    pop.style.top = `${rect.bottom + 4}px`;

    const exports = [
      {
        icon: '📦',
        label: 'Adobe Swatch (.ASE)',
        run: () => {
          this.swatchManager.exportAsAse(pal);
          this.showToast('Descargado archivo .ASE (Photoshop/Illustrator)');
        }
      },
      {
        icon: '🎨',
        label: 'GIMP / Krita (.GPL)',
        run: () => {
          this.swatchManager.exportAsGpl(pal);
          this.showToast('Descargado archivo .GPL (Krita/GIMP/Inkscape)');
        }
      },
      {
        icon: '💻',
        label: 'Variables CSS (:root)',
        run: () => {
          const css = this.swatchManager.exportAsCss(pal);
          this.copyToClipboard(css);
          this.showToast('Variables CSS copiadas al portapapeles');
        }
      },
      {
        icon: '⚙️',
        label: 'Tokens de Diseño JSON',
        run: () => {
          const json = this.swatchManager.exportAsJson(pal);
          this.copyToClipboard(json);
          this.showToast('Tokens JSON copiados al portapapeles');
        }
      },
      {
        icon: '🖼️',
        label: 'Ficha Gráfica SVG',
        run: () => {
          this.swatchManager.exportAsSvgCard(pal);
          this.showToast('Ficha SVG descargada');
        }
      },
      {
        icon: '🖼️',
        label: 'Taller de Láminas & Exportación Pro...',
        run: () => {
          SwatchSheetExporter.openExportModal(pal.name, pal.colors, this);
        }
      },
      {
        icon: '🌉',
        label: 'Puente a Pigmentos & Copic (ΔE)...',
        run: () => {
          this.openColorBridgeModal(pal, 'physical');
        }
      },
      {
        icon: '👁️',
        label: 'Auditoría Accesibilidad WCAG 2.1...',
        run: () => {
          this.openColorBridgeModal(pal, 'wcag');
        }
      }
    ];

    exports.forEach(ex => {
      const item = document.createElement('button');
      item.className = 'context-menu-item';
      item.innerHTML = `<span>${ex.icon}</span><span>${ex.label}</span>`;
      item.addEventListener('click', () => {
        ex.run();
        pop.remove();
      });
      pop.appendChild(item);
    });

    document.body.appendChild(pop);
    const close = (e) => {
      if (!pop.contains(e.target) && e.target !== anchorBtn) {
        pop.remove();
        document.removeEventListener('pointerdown', close);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', close), 10);
  }

  showPaletteVariationsPopover(anchorBtn, pal) {
    const existing = document.querySelector('.palette-variations-menu');
    if (existing) {
      const wasSame = existing.dataset.anchorId === (anchorBtn.id || pal.id);
      existing.remove();
      if (wasSame) return;
    }

    const pop = document.createElement('div');
    pop.className = 'palette-variations-menu';
    pop.dataset.anchorId = anchorBtn.id || pal.id;

    const rect = anchorBtn.getBoundingClientRect();
    pop.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
    pop.style.top = `${rect.bottom + 4}px`;

    const variations = [
      {
        icon: '🌑',
        title: 'Sombras / Noche (Nocturne)',
        desc: 'Enfría matices hacia azules, reduce valor y preserva luminosidad ambiental.',
        type: 'shadow'
      },
      {
        icon: '☀️',
        title: 'Luz Solar / Pastel (High Key)',
        desc: 'Aclara tonos, añade calidez y suaviza contraste para claves altas.',
        type: 'light'
      },
      {
        icon: '🍂',
        title: 'Tierras Nobles / Desaturadas',
        desc: 'Reduce saturación con tintes terrosos para fondos o realismo pictórico.',
        type: 'muted'
      },
      {
        icon: '⚡',
        title: 'Tensión Complementaria (Clash)',
        desc: 'Invierte los matices a sus opuestos directos manteniendo brillo y saturación.',
        type: 'complementary'
      }
    ];

    variations.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'palette-variations-item';
      btn.innerHTML = `
        <span style="font-size: 1.2rem; flex-shrink: 0;">${v.icon}</span>
        <div style="flex-grow: 1;">
          <div style="font-weight: 700; color: #FFFFFF;">${v.title}</div>
          <span class="palette-variations-desc">${v.desc}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        const result = PaletteImporterEngine.generatePaletteVariation(pal, v.type);
        if (result && result.colors.length > 0) {
          const newPal = this.swatchManager.addPalette(result.name, result.colors);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`✓ Paleta derivada '${newPal.name}' creada con éxito`, 'success');
        }
        pop.remove();
      });
      pop.appendChild(btn);
    });

    document.body.appendChild(pop);
    const close = (e) => {
      if (!pop.contains(e.target) && e.target !== anchorBtn) {
        pop.remove();
        document.removeEventListener('pointerdown', close);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', close), 10);
  }

  openColorBridgeModal(pal, initialTab = 'physical') {
    const modal = document.getElementById('colorBridgeModal');
    if (!modal) return;

    const modalTitle = document.getElementById('colorBridgeModalTitle');
    if (modalTitle) {
      modalTitle.textContent = `Puente de Color & WCAG: ${pal.name} (${pal.colors.length} muestras)`;
    }

    const tabPhys = document.getElementById('tabBridgePhysical');
    const tabWcag = document.getElementById('tabBridgeWcag');
    const secPhys = document.getElementById('bridgePhysicalSection');
    const secWcag = document.getElementById('bridgeWcagSection');
    const tbodyPhys = document.getElementById('bridgePhysicalTableBody');
    const tbodyWcag = document.getElementById('bridgeWcagTableBody');
    const btnClose = document.getElementById('btnCloseColorBridgeModal');
    const btnDismiss = document.getElementById('btnDismissColorBridge');

    const setTab = (tab) => {
      if (tab === 'physical') {
        tabPhys?.classList.add('active-toggle');
        tabWcag?.classList.remove('active-toggle');
        if (secPhys) secPhys.style.display = 'flex';
        if (secWcag) secWcag.style.display = 'none';
      } else {
        tabWcag?.classList.add('active-toggle');
        tabPhys?.classList.remove('active-toggle');
        if (secWcag) secWcag.style.display = 'flex';
        if (secPhys) secPhys.style.display = 'none';
      }
    };

    if (tabPhys) tabPhys.onclick = () => setTab('physical');
    if (tabWcag) tabWcag.onclick = () => setTab('wcag');
    setTab(initialTab);

    // 1. Populate Physical Matches
    if (tbodyPhys) {
      tbodyPhys.innerHTML = '';
      const bridges = PaletteImporterEngine.findPhysicalColorBridge(pal.colors);
      bridges.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 22px; height: 22px; border-radius: 4px; background: ${b.hex}; border: 1px solid rgba(255,255,255,0.25); flex-shrink: 0;"></div>
              <div>
                <strong style="color: #FFFFFF; font-size: 0.76rem;">${b.hex}</strong>
                <div style="color: var(--text-muted); font-size: 0.68rem;">${b.name}</div>
              </div>
            </div>
          </td>
          <td>
            ${b.tubeMatch ? `
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 14px; height: 14px; border-radius: 3px; background: ${b.tubeMatch.hex}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></div>
                <div>
                  <strong style="color: #FCD34D;">${b.tubeMatch.brand}: ${b.tubeMatch.name}</strong>
                  <div style="color: var(--text-muted); font-size: 0.68rem;">Pigmento: ${b.tubeMatch.ci} (${b.tubeMatch.medium}) • <span style="color: ${b.tubeMatch.deltaE < 3 ? '#6EE7B7' : '#94A3B8'};">ΔE: ${b.tubeMatch.deltaE}</span></div>
                </div>
              </div>
            ` : '<span style="color: var(--text-muted);">-</span>'}
          </td>
          <td>
            ${b.copicMatch ? `
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 14px; height: 14px; border-radius: 3px; background: ${b.copicMatch.hex}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></div>
                <div>
                  <strong style="color: #67E8F9;">${b.copicMatch.name}</strong>
                  <div style="color: var(--text-muted); font-size: 0.68rem;">ΔE CIELAB: ${b.copicMatch.deltaE}</div>
                </div>
              </div>
            ` : '<span style="color: var(--text-muted);">-</span>'}
          </td>
          <td>
            ${b.pantoneMatch ? `
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 14px; height: 14px; border-radius: 3px; background: ${b.pantoneMatch.hex}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></div>
                <div>
                  <strong style="color: #F472B6;">${b.pantoneMatch.name}</strong>
                  <div style="color: var(--text-muted); font-size: 0.68rem;">ΔE PMS: ${b.pantoneMatch.deltaE}</div>
                </div>
              </div>
            ` : '<span style="color: var(--text-muted);">-</span>'}
          </td>
        `;
        tbodyPhys.appendChild(tr);
      });
    }

    // 2. Populate WCAG Accessibility Matrix
    if (tbodyWcag) {
      tbodyWcag.innerHTML = '';
      const audit = PaletteImporterEngine.analyzeWcagAccessibility(pal.colors);
      if (audit.pairs.length === 0) {
        tbodyWcag.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">Se necesitan al menos 2 colores para calcular contrastes.</td></tr>';
      } else {
        audit.pairs.slice(0, 30).forEach(pair => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-family: monospace; font-size: 0.74rem;">${pair.fg.hex} / ${pair.bg.hex}</span>
              </div>
            </td>
            <td>
              <div style="background: ${pair.bg.hex}; color: ${pair.fg.hex}; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 0.74rem; display: inline-block; border: 1px solid rgba(255,255,255,0.15);">
                Texto Muestra
              </div>
            </td>
            <td>
              <strong style="color: ${pair.ratio >= 4.5 ? '#6EE7B7' : '#FCA5A5'}; font-size: 0.8rem;">
                ${pair.ratio}:1
              </strong>
            </td>
            <td>
              <span class="${pair.passAA ? 'badge-wcag-pass' : 'badge-wcag-fail'}">
                ${pair.passAA ? '✓ Cumple AA' : '✕ No cumple'}
              </span>
            </td>
            <td>
              <span class="${pair.passAAA ? 'badge-wcag-pass' : 'badge-wcag-fail'}">
                ${pair.passAAA ? '✓ Cumple AAA' : '✕ No cumple'}
              </span>
            </td>
          `;
          tbodyWcag.appendChild(tr);
        });
      }
    }

    const closeModal = () => {
      modal.style.display = 'none';
    };

    if (btnClose) btnClose.onclick = closeModal;
    if (btnDismiss) btnDismiss.onclick = closeModal;
    modal.style.display = 'flex';
  }

  // --- CHROMILLA PHYSICAL TUBE INVENTORY & BRANDS STUDIO ---

  _bindChromillaControls() {
    this._chromillaActiveBrand = 'all';
    this._chromillaActiveCategory = 'all';
    this._chromillaSearchQuery = '';
    this._lastChromillaRecipe = null;

    const brandSelect = document.getElementById('chromillaBrandFilterSelect');
    const medSelect = document.getElementById('chromillaMediumSelect');
    const batchInput = document.getElementById('chromillaBatchInput');
    const batchUnit = document.getElementById('chromillaBatchUnit');
    const searchInput = document.getElementById('chromillaSearchInput');
    const categoryChips = document.querySelectorAll('.chromilla-cat-chip');
    const presetBtns = document.querySelectorAll('.chromilla-preset-btn');
    const btnSelectAll = document.getElementById('btnChromillaSelectAll');
    const btnClearAll = document.getElementById('btnChromillaClearAll');
    const btnSaveLibrary = document.getElementById('btnChromillaSaveToLibrary');
    const btnSendWetMixer = document.getElementById('btnChromillaSendToWetMixer');
    const btnCopyRecipe = document.getElementById('btnChromillaCopyRecipe');

    // Brand filter dropdown
    if (brandSelect) {
      brandSelect.addEventListener('change', () => {
        this._chromillaActiveBrand = brandSelect.value;
        this.renderChromillaBrandTubes();
      });
    }

    // Search filter input (real-time debounced/direct)
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._chromillaSearchQuery = (e.target.value || '').trim().toLowerCase();
        this.renderChromillaBrandTubes();
      });
    }

    // Category / Color Family filter chips
    if (categoryChips && categoryChips.length > 0) {
      categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
          categoryChips.forEach(c => c.classList.remove('active-toggle'));
          chip.classList.add('active-toggle');
          this._chromillaActiveCategory = chip.dataset.cat || 'all';
          this.renderChromillaBrandTubes();
        });
      });
    }

    // Studio Palette Presets
    if (presetBtns && presetBtns.length > 0) {
      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const presetKey = btn.dataset.preset;
          const preset = ChromillaMixer.applyPalettePreset(presetKey);
          if (preset) {
            this.renderChromillaBrandTubes();
            const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
            this.renderChromillaMixer(currentRgb);
            this.showToast(`Caja de pintura: ${preset.name}`, 'info');
          }
        });
      });
    }

    // Select all visible / all brand tubes
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        ChromillaMixer.selectAllTubes(this._chromillaActiveBrand || 'all');
        this.renderChromillaBrandTubes();
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
        this.showToast('Todos los tubos del catálogo han sido marcados', 'success');
      });
    }

    // Clear all tubes
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        ChromillaMixer.clearAllTubes();
        this.renderChromillaBrandTubes();
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
        this.showToast('Inventario de tubos vaciado. Selecciona al menos un tubo para formular recetas.', 'warning');
      });
    }

    // Medium select (Oil, Acrylic, Watercolor, Gouache)
    if (medSelect) {
      medSelect.addEventListener('change', (e) => {
        ChromillaMixer.config.selectedMedium = e.target.value;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    // Batch Amount scaling
    if (batchInput) {
      batchInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 20;
        ChromillaMixer.config.batchAmount = val;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    // Batch Unit (g / ml)
    if (batchUnit) {
      batchUnit.addEventListener('change', (e) => {
        ChromillaMixer.config.batchUnit = e.target.value;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    // Suite Action: Save recipe to palette library
    if (btnSaveLibrary) {
      btnSaveLibrary.addEventListener('click', () => {
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const recipe = this._lastChromillaRecipe || ChromillaMixer.solveRecipe(currentRgb);
        if (!recipe || !recipe.items || recipe.items.length === 0) {
          this.showToast('No hay una receta formulada con tubos disponibles.', 'warning');
          return;
        }
        const colors = [recipe.targetHex, recipe.mixedHex, ...recipe.items.map(i => i.tube.hex)];
        const uniqueColors = Array.from(new Set(colors));
        const createFn = this.swatchManager.createPalette || this.swatchManager.addPalette;
        createFn.call(this.swatchManager, `Chromilla ${recipe.targetHex} (${recipe.items.length}p)`, uniqueColors);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Receta guardada en Bibliotecas con ${uniqueColors.length} colores`, 'success');
      });
    }

    // Suite Action: Send recipe tubes to Wet Mixer palette
    if (btnSendWetMixer) {
      btnSendWetMixer.addEventListener('click', () => {
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const recipe = this._lastChromillaRecipe || ChromillaMixer.solveRecipe(currentRgb);
        if (!recipe || !recipe.items || recipe.items.length === 0) {
          this.showToast('No hay tubos en la receta para transferir al Wet Mixer.', 'warning');
          return;
        }
        this.switchTab('wetmixer');
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) {
          const cx = this.wetMixer.width * 0.5;
          const cy = this.wetMixer.height * 0.5;
          const rad = Math.min(this.wetMixer.width, this.wetMixer.height) * 0.32;
          const n = recipe.items.length;
          recipe.items.forEach((item, idx) => {
            const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
            const px = cx + Math.cos(angle) * rad;
            const py = cy + Math.sin(angle) * rad;
            const size = Math.max(28, Math.min(65, Math.round(25 + item.percentage * 0.55)));
            this.wetMixer.depositDab(px, py, item.tube.rgb, size);
          });
          this.showToast(`${recipe.items.length} tubos físicos depositados en la paleta húmeda`, 'success');
        }
      });
    }

    // Suite Action: Copy recipe sheet to clipboard
    if (btnCopyRecipe) {
      btnCopyRecipe.addEventListener('click', () => {
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const recipe = this._lastChromillaRecipe || ChromillaMixer.solveRecipe(currentRgb);
        if (!recipe) return;
        const dryDown = ChromillaMixer.getDryDownPrediction(currentRgb);
        const mediumName = ChromillaMixer.MEDIUMS[ChromillaMixer.config.selectedMedium]?.name || 'Óleo';
        
        let sheet = `🧪 FICHA DE TALLER: RECETA DE MEZCLA FÍSICA CHROMILLA\n`;
        sheet += `══════════════════════════════════════════════════════════════\n`;
        sheet += `🎯 Color Objetivo: ${recipe.targetHex}\n`;
        sheet += `🎨 Mezcla en Paleta (Húmeda): ${recipe.mixedHex} (ΔE: ${recipe.deltaE} | Coincidencia: ${recipe.matchPercent}%)\n`;
        sheet += `🖼️ Muestra Seca en Lienzo (${mediumName}): ${dryDown.dryHex}\n`;
        sheet += `ℹ️ Comportamiento de Secado: ${dryDown.shiftDesc}\n`;
        sheet += `⚖️ Lote de Trabajo: ${recipe.totalBatch} ${recipe.unit} (${recipe.totalParts} partes totales en la mezcla)\n\n`;
        sheet += `📦 FORMULACIÓN EXACTA POR TUBOS:\n`;
        if (recipe.items.length > 0) {
          recipe.items.forEach(it => {
            sheet += `  • ${it.parts} partes (${it.percentage}%) = ${it.amount} ${it.unit}  ➔  ${it.tube.name} [CI: ${it.tube.ci}] (${it.tube.brandName}) | Opacidad: ${it.tube.opacity} | Serie ${it.tube.series}\n`;
          });
        } else {
          sheet += `  (No hay tubos seleccionados en el inventario de taller)\n`;
        }
        sheet += `\n🛠️ ASISTENTE DE CORRECCIÓN EN CABALLETE:\n`;
        const adviceDiv = document.getElementById('chromillaCorrectionAdvice');
        sheet += `  ${adviceDiv ? adviceDiv.innerText.replace(/\\n+/g, ' ') : ''}\n`;
        sheet += `══════════════════════════════════════════════════════════════\n`;

        navigator.clipboard.writeText(sheet).then(() => {
          this.showToast('📋 Ficha de receta física copiada al portapapeles', 'success');
        }).catch(() => {
          this.showToast('Error al copiar al portapapeles', 'error');
        });
      });
    }

    this.renderChromillaBrandTubes();
  }

  renderChromillaBrandTubes() {
    const grid = document.getElementById('chromillaTubeInventoryGrid');
    const countBadge = document.getElementById('chromillaTubesCountBadge');
    if (!grid) return;
    grid.innerHTML = '';

    const brandFilter = this._chromillaActiveBrand || 'all';
    const categoryFilter = this._chromillaActiveCategory || 'all';
    const query = this._chromillaSearchQuery || '';

    let filtered = BrandPigments.TUBES;

    // Filter by brand
    if (brandFilter !== 'all') {
      filtered = filtered.filter(t => t.brand === brandFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Filter by query
    if (query) {
      filtered = filtered.filter(t => {
        const nameMatch = (t.name || '').toLowerCase().includes(query);
        const ciMatch = (t.ci || '').toLowerCase().includes(query);
        const brandMatch = (t.brandName || '').toLowerCase().includes(query);
        const descMatch = (t.description || '').toLowerCase().includes(query);
        return nameMatch || ciMatch || brandMatch || descMatch;
      });
    }

    // Calculate owned counts
    const totalOwned = ChromillaMixer.config.ownedTubeIds.length;
    const filteredOwned = filtered.filter(t => ChromillaMixer.isTubeOwned(t.id)).length;

    if (countBadge) {
      countBadge.textContent = `${totalOwned} en caja (${filtered.length} visibles / ${filteredOwned} marcados)`;
    }

    if (filtered.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.gridColumn = '1 / -1';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '30px 20px';
      emptyMsg.style.color = 'var(--text-muted)';
      emptyMsg.style.fontSize = '0.85rem';
      emptyMsg.innerHTML = `🔍 No se encontraron tubos con el filtro actual ("${query || categoryFilter}").<br><span style="font-size:0.75rem; color:var(--text-secondary);">Prueba cambiando de familia o buscando por código CI como "PW6", "PB29" o "PR108".</span>`;
      grid.appendChild(emptyMsg);
      return;
    }

    filtered.forEach(tube => {
      const isOwned = ChromillaMixer.isTubeOwned(tube.id);
      const card = document.createElement('div');
      card.className = `chromilla-tube-card${isOwned ? ' owned' : ''}`;
      card.title = `${tube.brandName}: ${tube.name} (${tube.ci})\n${tube.opacity} • Serie ${tube.series} • Fuerza: ${tube.tintingStrength || 5}/10\n${tube.description || ''}\n\n[Click en la casilla para marcar si lo tienes en tu taller | Click en la tarjeta para activar el color]`;
      card.draggable = true;
      card.dataset.swatchHex = tube.hex;
      card.dataset.tubeId = tube.id;

      // Custom Checkbox
      const checkboxWrap = document.createElement('label');
      checkboxWrap.className = 'chromilla-tube-check-wrap';
      checkboxWrap.onclick = (e) => e.stopPropagation();

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'chromilla-tube-checkbox';
      checkbox.checked = isOwned;
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const checked = checkbox.checked;
        ChromillaMixer.setTubeOwned(tube.id, checked);
        if (checked) {
          card.classList.add('owned');
        } else {
          card.classList.remove('owned');
        }
        // Update badge count
        const newTotal = ChromillaMixer.config.ownedTubeIds.length;
        const newFilteredOwned = filtered.filter(t => ChromillaMixer.isTubeOwned(t.id)).length;
        if (countBadge) {
          countBadge.textContent = `${newTotal} en caja (${filtered.length} visibles / ${newFilteredOwned} marcados)`;
        }
        // Recalculate recipe immediately with updated physical paint box!
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });

      checkboxWrap.appendChild(checkbox);

      // Tube color dot / swatch
      const dot = document.createElement('div');
      dot.className = 'chromilla-tube-dot';
      dot.style.backgroundColor = tube.hex;

      // Tube information column
      const textWrap = document.createElement('div');
      textWrap.className = 'chromilla-tube-info';

      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.justifyContent = 'space-between';
      titleRow.style.alignItems = 'center';
      titleRow.style.gap = '4px';

      const title = document.createElement('div');
      title.className = 'chromilla-tube-name';
      title.textContent = tube.name;

      const brandBadge = document.createElement('span');
      brandBadge.className = 'chromilla-tube-brand-badge';
      brandBadge.textContent = tube.brandName.split(' ')[0];

      titleRow.appendChild(title);
      titleRow.appendChild(brandBadge);

      const sub = document.createElement('div');
      sub.className = 'chromilla-tube-meta';
      sub.textContent = `${tube.ci} • S.${tube.series} • ${tube.opacity}`;

      textWrap.appendChild(titleRow);
      textWrap.appendChild(sub);

      card.appendChild(checkboxWrap);
      card.appendChild(dot);
      card.appendChild(textWrap);

      // Clicking card body activates the color in the suite
      card.addEventListener('click', (e) => {
        if (e.target === checkbox) return;
        this.setColorDirectly(tube.rgb);
        this.showToast(`Tubo activo: ${tube.name} (${tube.brandName})`);
      });

      grid.appendChild(card);
    });
  }

  renderChromillaMixer(targetRgb) {
    if (!targetRgb) {
      targetRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    }

    const targetHex = ColorMath.rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
    const dryDown = ChromillaMixer.getDryDownPrediction(targetRgb);

    // Update Swatches
    const targetSwatch = document.getElementById('chromillaTargetSwatch');
    const targetHexEl = document.getElementById('chromillaTargetHex');
    const wetSwatch = document.getElementById('chromillaWetSwatch');
    const wetHex = document.getElementById('chromillaWetHex');
    const drySwatch = document.getElementById('chromillaDrySwatch');
    const dryHex = document.getElementById('chromillaDryHex');
    const shiftBadge = document.getElementById('chromillaShiftBadge');

    if (targetSwatch) targetSwatch.style.backgroundColor = targetHex;
    if (targetHexEl) targetHexEl.textContent = targetHex;
    if (drySwatch) drySwatch.style.backgroundColor = dryDown.dryHex;
    if (dryHex) dryHex.textContent = dryDown.dryHex;
    if (shiftBadge) shiftBadge.textContent = dryDown.shiftDesc;

    // Solve Physical Recipe strictly from owned studio tubes
    const recipe = ChromillaMixer.solveRecipe(targetRgb);
    this._lastChromillaRecipe = recipe;

    if (wetSwatch && recipe) wetSwatch.style.backgroundColor = recipe.mixedHex;
    if (wetHex && recipe) wetHex.textContent = recipe.mixedHex;

    // Delta-E & Match Quality
    const deltaBadge = document.getElementById('chromillaDeltaEBadge');
    const qualityBadge = document.getElementById('chromillaMatchQualityBadge');

    if (deltaBadge && recipe) {
      deltaBadge.textContent = `ΔE ${recipe.deltaE}`;
      if (recipe.deltaE <= 1.5) {
        deltaBadge.style.borderColor = 'rgba(16, 185, 129, 0.6)';
        deltaBadge.style.color = '#10B981';
      } else if (recipe.deltaE <= 4.0) {
        deltaBadge.style.borderColor = 'rgba(245, 158, 11, 0.6)';
        deltaBadge.style.color = '#F59E0B';
      } else {
        deltaBadge.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        deltaBadge.style.color = '#EF4444';
      }
    }

    if (qualityBadge && recipe) {
      let qualityText = 'Excelente';
      let qualityColor = '#10B981';
      if (recipe.deltaE <= 1.5) {
        qualityText = 'Fidelidad Máxima';
        qualityColor = '#10B981';
      } else if (recipe.deltaE <= 3.5) {
        qualityText = 'Muy Cercana';
        qualityColor = '#34D399';
      } else if (recipe.deltaE <= 6.0) {
        qualityText = 'Aproximación';
        qualityColor = '#F59E0B';
      } else {
        qualityText = 'Diferencia Notable';
        qualityColor = '#EF4444';
      }
      qualityBadge.textContent = `${recipe.matchPercent}% • ${qualityText}`;
      qualityBadge.style.color = qualityColor;
    }

    // Visual Proportion Bar
    const proportionBar = document.getElementById('chromillaProportionBar');
    const proportionSummary = document.getElementById('chromillaProportionSummary');

    if (proportionBar && recipe) {
      proportionBar.innerHTML = '';
      if (recipe.items.length === 0) {
        proportionBar.innerHTML = '<div style="flex:1; height:100%; display:flex; align-items:center; justify-content:center; font-size:0.68rem; color:var(--text-muted);">Sin tubos en caja</div>';
      } else {
        recipe.items.forEach(it => {
          const seg = document.createElement('div');
          seg.className = 'chromilla-proportion-segment';
          seg.style.width = `${it.percentage}%`;
          seg.style.backgroundColor = it.tube.hex;
          seg.title = `${it.tube.name}: ${it.percentage}% (${it.parts} partes)`;
          proportionBar.appendChild(seg);
        });
      }
    }

    if (proportionSummary && recipe) {
      if (recipe.items.length > 0) {
        proportionSummary.textContent = `${recipe.items.length} pigmentos en mezcla • ${recipe.totalParts} partes totales`;
      } else {
        proportionSummary.textContent = '0 tubos';
      }
    }

    // Recipe Items Breakdown List
    const recipeList = document.getElementById('chromillaRecipeList');
    if (recipeList && recipe) {
      recipeList.innerHTML = '';
      if (recipe.items.length === 0) {
        const noTubesMsg = document.createElement('div');
        noTubesMsg.style.padding = '12px';
        noTubesMsg.style.background = 'rgba(239, 68, 68, 0.1)';
        noTubesMsg.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        noTubesMsg.style.borderRadius = '6px';
        noTubesMsg.style.fontSize = '0.76rem';
        noTubesMsg.style.color = '#FCA5A5';
        noTubesMsg.innerHTML = '⚠️ <strong>No hay tubos seleccionados en tu caja de pinturas.</strong><br>Baja a "Mi Caja de Pinturas" y marca los tubos que posees en tu taller o pulsa uno de los presets rápidos (Básica, Split-Primary, Zorn...) para generar la receta.';
        recipeList.appendChild(noTubesMsg);
      } else {
        recipe.items.forEach(item => {
          const itemRow = document.createElement('div');
          itemRow.style.display = 'flex';
          itemRow.style.alignItems = 'center';
          itemRow.style.justifyContent = 'space-between';
          itemRow.style.gap = '10px';
          itemRow.style.padding = '5px 8px';
          itemRow.style.background = 'rgba(0,0,0,0.2)';
          itemRow.style.borderRadius = '4px';
          itemRow.style.border = '1px solid rgba(255,255,255,0.05)';

          const left = document.createElement('div');
          left.style.display = 'flex';
          left.style.alignItems = 'center';
          left.style.gap = '8px';
          left.style.cursor = 'pointer';
          left.title = 'Click para cargar este pigmento individual';
          left.onclick = () => {
            this.setColorDirectly(item.tube.rgb);
            this.showToast(`Pigmento: ${item.tube.name}`);
          };

          const dot = document.createElement('div');
          dot.style.width = '14px';
          dot.style.height = '14px';
          dot.style.borderRadius = '3px';
          dot.style.backgroundColor = item.tube.hex;
          dot.style.border = '1px solid rgba(255,255,255,0.25)';
          dot.style.flexShrink = '0';

          const name = document.createElement('span');
          name.style.fontSize = '0.75rem';
          name.style.color = '#FFFFFF';
          name.textContent = `${item.tube.name} (${item.tube.ci})`;

          const brandTag = document.createElement('span');
          brandTag.style.fontSize = '0.64rem';
          brandTag.style.color = 'var(--text-muted)';
          brandTag.textContent = `• ${item.tube.brandName.split(' ')[0]}`;

          left.appendChild(dot);
          left.appendChild(name);
          left.appendChild(brandTag);

          const right = document.createElement('div');
          right.style.display = 'flex';
          right.style.alignItems = 'center';
          right.style.gap = '8px';

          const pctTag = document.createElement('span');
          pctTag.style.fontFamily = 'var(--font-mono)';
          pctTag.style.fontSize = '0.72rem';
          pctTag.style.color = 'var(--text-muted)';
          pctTag.textContent = `${item.percentage}%`;

          const partsTag = document.createElement('span');
          partsTag.style.fontFamily = 'var(--font-mono)';
          partsTag.style.fontSize = '0.74rem';
          partsTag.style.fontWeight = '600';
          partsTag.style.color = 'var(--accent-amber)';
          partsTag.textContent = `${item.parts} partes`;

          const amountTag = document.createElement('span');
          amountTag.style.fontFamily = 'var(--font-mono)';
          amountTag.style.fontSize = '0.74rem';
          amountTag.style.fontWeight = '700';
          amountTag.style.color = '#FFFFFF';
          amountTag.textContent = `${item.amount} ${item.unit}`;

          right.appendChild(pctTag);
          right.appendChild(partsTag);
          right.appendChild(amountTag);

          itemRow.appendChild(left);
          itemRow.appendChild(right);
          recipeList.appendChild(itemRow);
        });
      }
    }

    // White Tint Ramp / Glaze Scale
    const tintContainer = document.getElementById('chromillaTintScaleContainer');
    if (tintContainer && recipe && recipe.tintScale) {
      tintContainer.innerHTML = '';
      recipe.tintScale.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'chromilla-tint-step';
        stepEl.style.backgroundColor = step.hex;
        stepEl.title = `${step.label}: ${step.hex}\nClick para cargar este tono aclarado`;

        const stepLabel = document.createElement('span');
        stepLabel.className = 'chromilla-tint-label';
        // Auto high contrast text
        const lum = ColorMath.getLuminance(step.rgb.r, step.rgb.g, step.rgb.b);
        stepLabel.style.color = lum > 0.45 ? '#111827' : '#F9FAFB';
        stepLabel.textContent = step.label;

        stepEl.appendChild(stepLabel);
        stepEl.addEventListener('click', () => {
          this.setColorDirectly(step.rgb);
          this.showToast(`Tinte cargado: ${step.hex} (${step.label})`);
        });

        tintContainer.appendChild(stepEl);
      });
    }

    // Actionable Correction Advice Box
    const adviceEl = document.getElementById('chromillaCorrectionAdvice');
    if (adviceEl && recipe) {
      adviceEl.innerHTML = ChromillaMixer.getMixCorrectionAdvice(targetRgb, recipe.mixedRgb, recipe.items);
    }
  }

  // --- ATMOSPHERE & SHADOWS STUDIO ---

  _bindAtmosphereControls() {
    const sliderTime = document.getElementById('sliderTimeOfDay');
    const dispTime = document.getElementById('displayTimeOfDay');
    const sliderKelvin = document.getElementById('sliderSunKelvin');
    const dispKelvin = document.getElementById('displaySunKelvin');
    const sliderSky = document.getElementById('sliderSkyHue');
    const dispSky = document.getElementById('displaySkyHue');
    const sliderSkySat = document.getElementById('sliderSkySat');
    const dispSkySat = document.getElementById('displaySkySat');
    const sliderBounce = document.getElementById('sliderBounce');
    const dispBounce = document.getElementById('displayBounce');
    const sliderSss = document.getElementById('sliderSss');
    const dispSss = document.getElementById('displaySss');
    const sliderHaze = document.getElementById('sliderHaze');
    const dispHaze = document.getElementById('displayHaze');
    const sliderIntensity = document.getElementById('sliderAtmoIntensity');
    const dispIntensity = document.getElementById('displayAtmoIntensity');
    const checkPurkinje = document.getElementById('checkPurkinje');
    const btnPanelToggle = document.getElementById('btnAtmospherePanelToggle');
    const btnApplyLibrary = document.getElementById('btnApplyAtmosphereToLibrary');

    // 3D Solar Vector Elements
    const sliderElevation = document.getElementById('sliderSunElevation');
    const dispElevation = document.getElementById('displaySunElevation');
    const sliderAzimuth = document.getElementById('sliderSunAzimuth');
    const dispAzimuth = document.getElementById('displaySunAzimuth');
    const sphereCanvas = document.getElementById('atmoSphereCanvas');

    // Terrain Elements
    const terrainSelect = document.getElementById('atmoTerrainSelect');
    const displayTerrainName = document.getElementById('displayTerrainName');
    const customGroundContainer = document.getElementById('atmoCustomGroundContainer');
    const customGroundColorInput = document.getElementById('atmoCustomGroundColor');

    // Sky Dome Gradient Elements
    const btnCopyCssGrad = document.getElementById('btnCopyAtmoCssGrad');
    const btnGradToLibrary = document.getElementById('btnAtmoGradToLibrary');
    const chipZenith = document.getElementById('atmoGradZenithChip');
    const chipHorizon = document.getElementById('atmoGradHorizonChip');
    const chipGround = document.getElementById('atmoGradGroundChip');

    // Global Tint & Glaze Elements
    const tintEnableCheck = document.getElementById('atmoTintEnableCheck');
    const tintColorInput = document.getElementById('atmoTintColorInput');
    const tintColorText = document.getElementById('atmoTintColorText');
    const dispTintColorHex = document.getElementById('displayTintColorHex');
    const tintTargetSelect = document.getElementById('atmoTintTargetSelect');
    const tintSecondaryContainer = document.getElementById('atmoTintSecondaryContainer');
    const tintSecondaryColorInput = document.getElementById('atmoTintSecondaryColorInput');
    const tintSecondaryColorText = document.getElementById('atmoTintSecondaryColorText');
    const dispTintSecondaryColorHex = document.getElementById('displayTintSecondaryColorHex');
    const tintBlendSelect = document.getElementById('atmoTintBlendSelect');
    const tintIntensitySlider = document.getElementById('atmoTintIntensitySlider');
    const dispTintIntensity = document.getElementById('displayTintIntensity');
    const btnTintPickActive = document.getElementById('btnAtmoTintPickActiveColor');
    const tintPresetBtns = document.querySelectorAll('.atmo-tint-preset-btn');

    // Suite Integration Action Buttons
    const btnSaveBreakdown = document.getElementById('btnAtmoSaveBreakdownToLibrary');
    const btnProject4D = document.getElementById('btnAtmoProjectTo4D');
    const btnSendFlorent = document.getElementById('btnAtmoSendToFlorent');
    const btnSendRamps = document.getElementById('btnAtmoSendToRampStudio');
    const btnSendWetMixer = document.getElementById('btnAtmoSendToWetMixer');

    if (btnPanelToggle) {
      btnPanelToggle.addEventListener('click', () => this.toggleAtmosphereModifier());
    }

    if (btnApplyLibrary) {
      btnApplyLibrary.addEventListener('click', () => {
        const activePal = this.swatchManager.palettes[0];
        if (!activePal || activePal.colors.length === 0) {
          this.showToast('No hay una paleta activa para transformar', 'warning');
          return;
        }

        const transformedHexes = activePal.colors.map(hex => {
          const rgb = ColorMath.hexToRgb(hex);
          const atmoRgb = AtmosphereEngine.transformColor(rgb);
          return ColorMath.rgbToHex(atmoRgb.r, atmoRgb.g, atmoRgb.b);
        });

        const newName = `${activePal.name} (Atmo ${AtmosphereEngine.state.timeOfDay}h)`;
        this.swatchManager.addPalette(newName, transformedHexes);
        this.renderSwatchesCollection();
        this.showToast(`Nueva paleta creada: '${newName}' con iluminación atmosférica`);
      });
    }

    const onAtmosphereParamChange = () => {
      this.renderAtmosphereStages();
      if (AtmosphereEngine.state.enabled) {
        this.applyAtmosphereUpdate({ isSilent: true });
      }
    };

    // Time of Day Slider
    if (sliderTime) {
      sliderTime.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        AtmosphereEngine.state.timeOfDay = val;
        const hours = Math.floor(val);
        const mins = Math.round((val - hours) * 60);
        if (dispTime) dispTime.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        
        // Auto-update sun angles corresponding to time of day
        const normAngle = ((val - 6) / 12) * 180;
        const calcAzimuth = Math.round((normAngle + 360) % 360);
        const calcElevation = Math.max(0, Math.round(Math.sin(((val - 6) / 12) * Math.PI) * 75));
        
        AtmosphereEngine.state.sunAzimuth = calcAzimuth;
        AtmosphereEngine.state.sunElevation = calcElevation;
        
        if (sliderAzimuth) sliderAzimuth.value = calcAzimuth;
        if (dispAzimuth) dispAzimuth.textContent = `${calcAzimuth}°`;
        if (sliderElevation) sliderElevation.value = calcElevation;
        if (dispElevation) dispElevation.textContent = `${calcElevation}°`;

        onAtmosphereParamChange();
      });
    }

    // Kelvin Sunlight Slider
    if (sliderKelvin) {
      sliderKelvin.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sunTempK = val;
        if (dispKelvin) dispKelvin.textContent = `${val}K`;
        onAtmosphereParamChange();
      });
    }

    // Sky Ambient Hue Slider
    if (sliderSky) {
      sliderSky.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.skyAmbientHue = val;
        if (dispSky) dispSky.textContent = `${val}°`;
        onAtmosphereParamChange();
      });
    }

    // Sky Ambient Saturation Slider
    if (sliderSkySat) {
      sliderSkySat.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.skyAmbientSat = val / 100;
        if (dispSkySat) dispSkySat.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    // Ground Bounce Intensity Slider
    if (sliderBounce) {
      sliderBounce.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.bounceIntensity = val / 100;
        if (dispBounce) dispBounce.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    // Terminator SSS Saturation Slider
    if (sliderSss) {
      sliderSss.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sssIntensity = val / 100;
        if (dispSss) dispSss.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    // Aerial Perspective (Haze) Slider
    if (sliderHaze) {
      sliderHaze.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.aerialHaze = val / 100;
        if (dispHaze) dispHaze.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    // Master Modifier Intensity Slider
    if (sliderIntensity) {
      sliderIntensity.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.intensity = val / 100;
        if (dispIntensity) dispIntensity.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    // Purkinje Shift Checkbox
    if (checkPurkinje) {
      checkPurkinje.addEventListener('change', (e) => {
        AtmosphereEngine.state.purkinjeShift = e.target.checked;
        onAtmosphereParamChange();
      });
    }

    // Solar Elevation Slider
    if (sliderElevation) {
      sliderElevation.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sunElevation = val;
        if (dispElevation) dispElevation.textContent = `${val}°`;
        onAtmosphereParamChange();
      });
    }

    // Solar Azimuth Slider
    if (sliderAzimuth) {
      sliderAzimuth.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sunAzimuth = val;
        if (dispAzimuth) dispAzimuth.textContent = `${val}°`;
        onAtmosphereParamChange();
      });
    }

    // Interactive Dragging on 3D Optical Sphere Canvas
    if (sphereCanvas) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initAzimuth = 140;
      let initElevation = 65;

      const onDragStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        initAzimuth = AtmosphereEngine.state.sunAzimuth !== undefined ? AtmosphereEngine.state.sunAzimuth : 140;
        initElevation = AtmosphereEngine.state.sunElevation !== undefined ? AtmosphereEngine.state.sunElevation : 65;
      };

      const onDragMove = (clientX, clientY) => {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;

        let newAzimuth = Math.round((initAzimuth + dx * 0.75) % 360);
        if (newAzimuth < 0) newAzimuth += 360;
        let newElevation = Math.round(Math.max(0, Math.min(90, initElevation - dy * 0.5)));

        AtmosphereEngine.state.sunAzimuth = newAzimuth;
        AtmosphereEngine.state.sunElevation = newElevation;

        if (sliderAzimuth) sliderAzimuth.value = newAzimuth;
        if (dispAzimuth) dispAzimuth.textContent = `${newAzimuth}°`;
        if (sliderElevation) sliderElevation.value = newElevation;
        if (dispElevation) dispElevation.textContent = `${newElevation}°`;

        onAtmosphereParamChange();
      };

      const onDragEnd = () => {
        isDragging = false;
      };

      sphereCanvas.addEventListener('mousedown', (e) => onDragStart(e.clientX, e.clientY));
      window.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onDragEnd);

      sphereCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          onDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
          onDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', onDragEnd);
    }

    // Atmospheric Presets Buttons
    const presetBtns = document.querySelectorAll('.atmo-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.preset;
        const p = AtmosphereEngine.TIME_PRESETS.find(x => x.id === pId);
        if (p) {
          AtmosphereEngine.state.timeOfDay = p.time;
          AtmosphereEngine.state.sunTempK = p.sunTempK;
          AtmosphereEngine.state.skyAmbientHue = p.skyHue;
          AtmosphereEngine.state.skyAmbientSat = p.skySat;
          AtmosphereEngine.state.bounceIntensity = p.bounce;
          AtmosphereEngine.state.sssIntensity = p.sss;
          AtmosphereEngine.state.purkinjeShift = !!p.purkinje;
          if (p.sunElevation !== undefined) AtmosphereEngine.state.sunElevation = p.sunElevation;
          if (p.sunAzimuth !== undefined) AtmosphereEngine.state.sunAzimuth = p.sunAzimuth;
          if (p.groundType) AtmosphereEngine.state.groundType = p.groundType;

          if (sliderTime) sliderTime.value = p.time;
          if (sliderKelvin) sliderKelvin.value = p.sunTempK;
          if (sliderSky) sliderSky.value = p.skyHue;
          if (sliderSkySat) sliderSkySat.value = Math.round(p.skySat * 100);
          if (sliderBounce) sliderBounce.value = Math.round(p.bounce * 100);
          if (sliderSss) sliderSss.value = Math.round(p.sss * 100);
          if (checkPurkinje) checkPurkinje.checked = !!p.purkinje;
          if (sliderElevation && p.sunElevation !== undefined) sliderElevation.value = p.sunElevation;
          if (sliderAzimuth && p.sunAzimuth !== undefined) sliderAzimuth.value = p.sunAzimuth;
          if (terrainSelect && p.groundType) {
            terrainSelect.value = p.groundType;
            if (displayTerrainName) displayTerrainName.textContent = AtmosphereEngine.TERRAIN_TYPES[p.groundType]?.name || 'Terreno';
          }

          if (dispTime) dispTime.textContent = p.name;
          if (dispKelvin) dispKelvin.textContent = `${p.sunTempK}K`;
          if (dispSky) dispSky.textContent = `${p.skyHue}°`;
          if (dispSkySat) dispSkySat.textContent = `${Math.round(p.skySat * 100)}%`;
          if (dispElevation && p.sunElevation !== undefined) dispElevation.textContent = `${p.sunElevation}°`;
          if (dispAzimuth && p.sunAzimuth !== undefined) dispAzimuth.textContent = `${p.sunAzimuth}°`;

          onAtmosphereParamChange();
          this.showToast(`Escena: ${p.name}`);
        }
      });
    });

    // Ground Terrain Selector
    if (terrainSelect) {
      terrainSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        AtmosphereEngine.state.groundType = type;
        if (displayTerrainName) {
          displayTerrainName.textContent = AtmosphereEngine.TERRAIN_TYPES[type]?.name || 'Terreno';
        }
        if (customGroundContainer) {
          customGroundContainer.style.display = type === 'custom' ? 'flex' : 'none';
        }
        onAtmosphereParamChange();
      });
    }

    if (customGroundColorInput) {
      customGroundColorInput.addEventListener('input', (e) => {
        AtmosphereEngine.state.customGroundRgb = ColorMath.hexToRgb(e.target.value);
        onAtmosphereParamChange();
      });
    }

    // Sky Dome Gradient Export Buttons & Color Chips
    if (btnCopyCssGrad) {
      btnCopyCssGrad.addEventListener('click', () => {
        const grad = AtmosphereEngine.getAtmosphereGradient();
        navigator.clipboard.writeText(grad.cssGradient);
        this.showToast('Gradiente CSS copiado al portapapeles');
      });
    }

    if (btnGradToLibrary) {
      btnGradToLibrary.addEventListener('click', () => {
        const grad = AtmosphereEngine.getAtmosphereGradient();
        const hexes = [grad.zenith.hex, grad.horizon.hex, grad.ground.hex];
        const palName = `Domo Rayleigh (${Math.floor(AtmosphereEngine.state.timeOfDay)}h)`;
        this.swatchManager.addPalette(palName, hexes);
        this.renderSwatchesCollection();
        this.showToast(`Añadida paleta: '${palName}' a Muestras`);
      });
    }

    if (chipZenith) {
      chipZenith.addEventListener('click', () => {
        const grad = AtmosphereEngine.getAtmosphereGradient();
        this.setColorDirectly(grad.zenith.rgb);
        this.showToast(`Cargado color Zenith: ${grad.zenith.hex}`);
      });
    }

    if (chipHorizon) {
      chipHorizon.addEventListener('click', () => {
        const grad = AtmosphereEngine.getAtmosphereGradient();
        this.setColorDirectly(grad.horizon.rgb);
        this.showToast(`Cargado color Horizonte: ${grad.horizon.hex}`);
      });
    }

    if (chipGround) {
      chipGround.addEventListener('click', () => {
        const grad = AtmosphereEngine.getAtmosphereGradient();
        this.setColorDirectly(grad.ground.rgb);
        this.showToast(`Cargado color Terreno: ${grad.ground.hex}`);
      });
    }

    // Global Tint & Glaze Studio Controls
    if (tintEnableCheck) {
      tintEnableCheck.addEventListener('change', (e) => {
        AtmosphereEngine.state.tintEnabled = e.target.checked;
        if (e.target.checked && AtmosphereEngine.state.tintAmount <= 0) {
          AtmosphereEngine.state.tintAmount = 0.45;
          if (tintIntensitySlider) tintIntensitySlider.value = 45;
          if (dispTintIntensity) dispTintIntensity.textContent = '45%';
        }
        onAtmosphereParamChange();
        this.showToast(e.target.checked ? 'Tinte Global Activado' : 'Tinte Global Desactivado');
      });
    }

    const setTintColor = (hex) => {
      AtmosphereEngine.state.tintColor = hex;
      AtmosphereEngine.state.tintRgb = ColorMath.hexToRgb(hex);
      if (tintColorInput) tintColorInput.value = hex;
      if (tintColorText) tintColorText.value = hex;
      if (dispTintColorHex) dispTintColorHex.textContent = hex;
    };

    if (tintColorInput) {
      tintColorInput.addEventListener('input', (e) => {
        setTintColor(e.target.value.toUpperCase());
        onAtmosphereParamChange();
      });
    }

    if (tintColorText) {
      tintColorText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          setTintColor(val.toUpperCase());
          onAtmosphereParamChange();
        }
      });
    }

    if (tintTargetSelect) {
      tintTargetSelect.addEventListener('change', (e) => {
        AtmosphereEngine.state.tintTarget = e.target.value;
        if (tintSecondaryContainer) {
          tintSecondaryContainer.style.display = e.target.value === 'split' ? 'block' : 'none';
        }
        onAtmosphereParamChange();
      });
    }

    const setSecondaryTintColor = (hex) => {
      AtmosphereEngine.state.tintSecondaryColor = hex;
      AtmosphereEngine.state.tintSecondaryRgb = ColorMath.hexToRgb(hex);
      if (tintSecondaryColorInput) tintSecondaryColorInput.value = hex;
      if (tintSecondaryColorText) tintSecondaryColorText.value = hex;
      if (dispTintSecondaryColorHex) dispTintSecondaryColorHex.textContent = hex;
    };

    if (tintSecondaryColorInput) {
      tintSecondaryColorInput.addEventListener('input', (e) => {
        setSecondaryTintColor(e.target.value.toUpperCase());
        onAtmosphereParamChange();
      });
    }

    if (tintSecondaryColorText) {
      tintSecondaryColorText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          setSecondaryTintColor(val.toUpperCase());
          onAtmosphereParamChange();
        }
      });
    }

    if (tintBlendSelect) {
      tintBlendSelect.addEventListener('change', (e) => {
        AtmosphereEngine.state.tintBlendMode = e.target.value;
        onAtmosphereParamChange();
      });
    }

    if (tintIntensitySlider) {
      tintIntensitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.tintAmount = val / 100;
        if (dispTintIntensity) dispTintIntensity.textContent = `${val}%`;

        if (val > 0 && !AtmosphereEngine.state.tintEnabled) {
          AtmosphereEngine.state.tintEnabled = true;
          if (tintEnableCheck) tintEnableCheck.checked = true;
        }

        onAtmosphereParamChange();
      });
    }

    tintPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.hex;
        const mode = btn.dataset.mode || 'soft_light';
        setTintColor(hex);
        if (tintBlendSelect) tintBlendSelect.value = mode;
        AtmosphereEngine.state.tintBlendMode = mode;
        AtmosphereEngine.state.tintEnabled = true;
        if (tintEnableCheck) tintEnableCheck.checked = true;

        if (AtmosphereEngine.state.tintAmount <= 0) {
          AtmosphereEngine.state.tintAmount = 0.5;
          if (tintIntensitySlider) tintIntensitySlider.value = 50;
          if (dispTintIntensity) dispTintIntensity.textContent = '50%';
        }

        onAtmosphereParamChange();
        this.showToast(`Tinte aplicado: ${btn.textContent.trim()}`);
      });
    });

    if (btnTintPickActive) {
      btnTintPickActive.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const hex = curRgb.hex;
        setTintColor(hex);
        AtmosphereEngine.state.tintEnabled = true;
        if (tintEnableCheck) tintEnableCheck.checked = true;

        if (AtmosphereEngine.state.tintAmount <= 0) {
          AtmosphereEngine.state.tintAmount = 0.5;
          if (tintIntensitySlider) tintIntensitySlider.value = 50;
          if (dispTintIntensity) dispTintIntensity.textContent = '50%';
        }

        onAtmosphereParamChange();
        this.showToast(`Tinte global establecido desde color activo: ${hex}`);
      });
    }

    // Suite Integration Action Buttons
    if (btnSaveBreakdown) {
      btnSaveBreakdown.addEventListener('click', () => {
        const baseRgb = this.activeWell === 'fg' ? this.baseFgColor : this.baseBgColor;
        const stages = AtmosphereEngine.calculateLightingStages(baseRgb);
        const hexes = [
          stages.highlight.hex,
          stages.directLight.hex,
          stages.terminator.hex,
          stages.shadow.hex,
          stages.occlusion.hex
        ];
        const palName = `Física Sombras (${Math.floor(AtmosphereEngine.state.timeOfDay)}h - ${baseRgb.hex || ''})`;
        this.swatchManager.addPalette(palName, hexes);
        this.renderSwatchesCollection();
        this.showToast(`Guardada paleta de 5 etapas en Biblioteca: '${palName}'`);
      });
    }

    if (btnProject4D) {
      btnProject4D.addEventListener('click', () => {
        const navBtn = document.querySelector('.nav-tab-btn[data-tab="hyper4d"]');
        if (navBtn) navBtn.click();
        this.showToast('Desglose de iluminación proyectado en el Hiperespacio 4D');
      });
    }

    if (btnSendFlorent) {
      btnSendFlorent.addEventListener('click', () => {
        const navBtn = document.querySelector('.nav-tab-btn[data-tab="florent"]');
        if (navBtn) navBtn.click();
        this.showToast('Luz y sombras transferidas al estudio Florent Farges');
      });
    }

    if (btnSendRamps) {
      btnSendRamps.addEventListener('click', () => {
        const navBtn = document.querySelector('.nav-tab-btn[data-tab="ramps"]');
        if (navBtn) navBtn.click();
        this.showToast('Desglose de sombras enviado a Ramps Studio');
      });
    }

    if (btnSendWetMixer) {
      btnSendWetMixer.addEventListener('click', () => {
        const navBtn = document.querySelector('.nav-tab-btn[data-tab="wetmixer"]');
        if (navBtn) navBtn.click();
        this.showToast('Tonos transferidos a la paleta húmeda Wet Mixer');
      });
    }
  }

  renderAtmosphereStages() {
    const grid = document.getElementById('atmoShadingStagesGrid');
    const sphereCanvas = document.getElementById('atmoSphereCanvas');
    const baseRgb = this.activeWell === 'fg' ? this.baseFgColor : this.baseBgColor;

    // 1. Calculate lighting stages using the updated atmosphereEngine
    const stages = AtmosphereEngine.calculateLightingStages(baseRgb);

    // 2. Render 6 Scientific Stage Cards
    if (grid) {
      grid.innerHTML = '';
      Object.values(stages).forEach(stage => {
        const card = document.createElement('div');
        card.className = 'atmo-stage-card';
        card.dataset.swatchHex = stage.hex;
        card.dataset.swatchLabel = stage.name;
        card.draggable = true;

        const pill = document.createElement('div');
        pill.className = 'atmo-stage-color-pill';
        pill.style.backgroundColor = stage.hex;

        const title = document.createElement('div');
        title.className = 'atmo-stage-name';
        title.textContent = stage.name;

        const hex = document.createElement('div');
        hex.className = 'atmo-stage-hex copyable-hex';
        hex.textContent = stage.hex;

        const desc = document.createElement('div');
        desc.className = 'atmo-stage-desc';
        desc.textContent = stage.desc;

        card.title = `${stage.name} (${stage.hex}) - ${stage.desc}`;

        card.appendChild(pill);
        card.appendChild(title);
        card.appendChild(hex);
        card.appendChild(desc);

        card.addEventListener('click', () => {
          this.setColorDirectly(stage.rgb);
          this.showToast(`Tono ${stage.name} cargado: ${stage.hex}`);
        });

        grid.appendChild(card);
      });
    }

    // 3. Render 3D Physically Lit Optical Sphere
    if (sphereCanvas) {
      AtmosphereEngine.renderSphere(sphereCanvas, baseRgb);
    }

    // 4. Update Continuous Sky Dome Gradient Bar & Chips
    const atmoGrad = AtmosphereEngine.getAtmosphereGradient();
    const skyDomeBar = document.getElementById('atmoSkyDomeBar');
    if (skyDomeBar) {
      skyDomeBar.style.background = atmoGrad.cssGradient;
    }

    const zChip = document.getElementById('atmoGradZenithChip');
    if (zChip) {
      const dot = zChip.querySelector('.atmo-stop-dot');
      const hex = zChip.querySelector('.atmo-stop-hex');
      if (dot) dot.style.backgroundColor = atmoGrad.zenith.hex;
      if (hex) hex.textContent = atmoGrad.zenith.hex;
    }

    const hChip = document.getElementById('atmoGradHorizonChip');
    if (hChip) {
      const dot = hChip.querySelector('.atmo-stop-dot');
      const hex = hChip.querySelector('.atmo-stop-hex');
      if (dot) dot.style.backgroundColor = atmoGrad.horizon.hex;
      if (hex) hex.textContent = atmoGrad.horizon.hex;
    }

    const gChip = document.getElementById('atmoGradGroundChip');
    if (gChip) {
      const dot = gChip.querySelector('.atmo-stop-dot');
      const hex = gChip.querySelector('.atmo-stop-hex');
      const lbl = gChip.querySelector('.atmo-stop-label');
      if (dot) dot.style.backgroundColor = atmoGrad.ground.hex;
      if (hex) hex.textContent = atmoGrad.ground.hex;
      if (lbl) lbl.textContent = atmoGrad.ground.label;
    }
  }

  // --- MUNSELL & JAMES GURNEY MASKS ---

  _bindGamutMaskControls() {
    const btnToggle = document.getElementById('btnGamutMaskToggle');
    const shapeSelect = document.getElementById('maskShapeSelect');
    const sliderRot = document.getElementById('sliderMaskRot');
    const dispRot = document.getElementById('dispMaskRot');
    const sliderScale = document.getElementById('sliderMaskScale');
    const dispScale = document.getElementById('dispMaskScale');
    const sliderOffset = document.getElementById('sliderMaskOffset');
    const dispOffset = document.getElementById('dispMaskOffset');

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        GamutMaskEngine.state.enabled = !GamutMaskEngine.state.enabled;
        const isEn = GamutMaskEngine.state.enabled;
        btnToggle.classList.toggle('active-toggle', isEn);
        btnToggle.innerHTML = isEn ? '<span>🎭</span> Máscara: ON' : '<span>🎭</span> Máscara: OFF';
        this.colorWheel.render();
        this.showToast(isEn ? 'Máscara de Gama Activada' : 'Máscara de Gama Desactivada');
      });
    }

    if (shapeSelect) {
      shapeSelect.addEventListener('change', (e) => {
        GamutMaskEngine.state.shape = e.target.value;
        this.colorWheel.render();
      });
    }

    if (sliderRot) {
      sliderRot.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        GamutMaskEngine.state.rotation = val;
        if (dispRot) dispRot.textContent = `${val}°`;
        this.colorWheel.render();
      });
    }

    if (sliderScale) {
      sliderScale.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        GamutMaskEngine.state.scale = val / 100;
        if (dispScale) dispScale.textContent = `${val}%`;
        this.colorWheel.render();
      });
    }

    if (sliderOffset) {
      sliderOffset.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        GamutMaskEngine.state.centerOffset = val / 100;
        if (dispOffset) dispOffset.textContent = `${val}%`;
        this.colorWheel.render();
      });
    }

    const presetBtns = document.querySelectorAll('.gamut-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.preset;
        const p = GamutMaskEngine.PRESETS.find(x => x.id === pId);
        if (p) {
          GamutMaskEngine.state.shape = p.shape;
          GamutMaskEngine.state.rotation = p.rotation;
          GamutMaskEngine.state.scale = p.scale;
          GamutMaskEngine.state.centerOffset = p.centerOffset;
          GamutMaskEngine.state.enabled = true;

          if (btnToggle) {
            btnToggle.classList.add('active-toggle');
            btnToggle.innerHTML = '<span>🎭</span> Máscara: ON';
          }
          if (shapeSelect) shapeSelect.value = p.shape;
          if (sliderRot) sliderRot.value = p.rotation;
          if (sliderScale) sliderScale.value = Math.round(p.scale * 100);
          if (sliderOffset) sliderOffset.value = Math.round(p.centerOffset * 100);

          this.colorWheel.render();
          this.showToast(`Máscara de Gama: ${btn.textContent}`);
        }
      });
    });
  }

  _bindMunsellControls() {}

  renderMunsellSliceChart(hueAngle) {
    const container = document.getElementById('munsellSliceChartContainer');
    if (!container) return;
    container.innerHTML = '';

    const slice = MunsellSystem.generateSliceGrid(hueAngle);

    const table = document.createElement('div');
    table.style.display = 'flex';
    table.style.flexDirection = 'column';
    table.style.gap = '5px';
    table.style.width = '100%';

    // Chroma Column Headers Row
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.gap = '8px';
    headerRow.style.paddingBottom = '6px';
    headerRow.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
    headerRow.style.marginBottom = '2px';

    const cornerLabel = document.createElement('span');
    cornerLabel.style.width = '42px';
    cornerLabel.style.fontSize = '0.62rem';
    cornerLabel.style.fontFamily = 'var(--font-mono)';
    cornerLabel.style.color = 'var(--text-muted)';
    cornerLabel.style.fontWeight = '700';
    cornerLabel.textContent = 'VAL \\ C';
    headerRow.appendChild(cornerLabel);

    const chromaHeaders = document.createElement('div');
    chromaHeaders.style.display = 'flex';
    chromaHeaders.style.gap = '5px';
    chromaHeaders.style.flex = '1';

    const cLabels = ['/0 (Gris)', '/2', '/4', '/6', '/8', '/10', '/12', '/14 (Puro)'];
    cLabels.forEach(cl => {
      const chSpan = document.createElement('span');
      chSpan.style.flex = '1';
      chSpan.style.textAlign = 'center';
      chSpan.style.fontSize = '0.62rem';
      chSpan.style.fontFamily = 'var(--font-mono)';
      chSpan.style.color = '#FBBF24';
      chSpan.style.fontWeight = '600';
      chSpan.textContent = cl;
      chromaHeaders.appendChild(chSpan);
    });
    headerRow.appendChild(chromaHeaders);
    table.appendChild(headerRow);

    // Value Rows (V9 down to V2)
    slice.rows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.style.display = 'flex';
      rowDiv.style.alignItems = 'center';
      rowDiv.style.gap = '8px';

      const label = document.createElement('span');
      label.style.width = '42px';
      label.style.fontSize = '0.7rem';
      label.style.fontFamily = 'var(--font-mono)';
      label.style.color = 'var(--text-secondary)';
      label.style.fontWeight = '600';
      label.textContent = `V${row.value}`;

      const chipsDiv = document.createElement('div');
      chipsDiv.style.display = 'flex';
      chipsDiv.style.gap = '5px';
      chipsDiv.style.flex = '1';

      row.chips.forEach(chip => {
        const sw = document.createElement('div');
        sw.style.flex = '1';
        sw.style.height = '26px';
        sw.style.borderRadius = '4px';
        sw.style.backgroundColor = chip.hex;
        sw.style.cursor = 'pointer';
        sw.style.border = '1px solid rgba(255, 255, 255, 0.12)';
        sw.style.transition = 'transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease';
        sw.title = `Ficha Munsell: ${chip.notation} (${chip.hex})`;
        sw.dataset.swatchHex = chip.hex;
        sw.dataset.swatchLabel = `Munsell ${chip.notation}`;
        sw.draggable = true;

        sw.addEventListener('mouseenter', () => {
          sw.style.transform = 'scale(1.08)';
          sw.style.borderColor = '#FFFFFF';
          sw.style.zIndex = '5';
          sw.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        });
        sw.addEventListener('mouseleave', () => {
          sw.style.transform = 'scale(1)';
          sw.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          sw.style.zIndex = '1';
          sw.style.boxShadow = 'none';
        });

        sw.addEventListener('click', () => {
          this.setColorDirectly(chip.rgb);
          this.showToast(`Ficha Munsell seleccionada: ${chip.notation} (${chip.hex})`);
        });

        chipsDiv.appendChild(sw);
      });

      rowDiv.appendChild(label);
      rowDiv.appendChild(chipsDiv);
      table.appendChild(rowDiv);
    });

    container.appendChild(table);
  }

  _bindLimitedPalettesControls() {
    const select = document.getElementById('limitedPaletteSelect');
    if (select) {
      select.innerHTML = '';
      LimitedPalettes.PALETTES.forEach(pal => {
        const opt = document.createElement('option');
        opt.value = pal.id;
        opt.textContent = pal.name;
        if (pal.id === 'zorn') opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        this.renderLimitedPalettes(e.target.value);
      });
    }
  }

  renderLimitedPalettes(paletteId = 'zorn') {
    const data = LimitedPalettes.generateMixMatrix(paletteId);
    const descEl = document.getElementById('limitedPaletteDesc');
    const tubesList = document.getElementById('limitedPaletteTubesList');
    const matrixGrid = document.getElementById('limitedPaletteMatrixGrid');

    if (descEl) descEl.textContent = data.palette.desc;

    if (tubesList) {
      tubesList.innerHTML = '';
      data.palette.tubes.forEach(t => {
        const pill = document.createElement('div');
        pill.style.display = 'flex';
        pill.style.alignItems = 'center';
        pill.style.gap = '6px';
        pill.style.background = 'rgba(0,0,0,0.3)';
        pill.style.padding = '4px 8px';
        pill.style.borderRadius = '6px';
        pill.style.cursor = 'pointer';
        pill.draggable = true;
        pill.dataset.swatchHex = t.hex;

        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = t.hex;

        const name = document.createElement('span');
        name.style.fontSize = '0.72rem';
        name.textContent = `${t.name} (${t.ci})`;

        pill.appendChild(dot);
        pill.appendChild(name);
        pill.addEventListener('click', () => this.setColorDirectly(t.rgb));
        tubesList.appendChild(pill);
      });
    }

    if (matrixGrid) {
      matrixGrid.innerHTML = '';
      data.matrix.forEach(pair => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';

        const title = document.createElement('span');
        title.style.width = '160px';
        title.style.fontSize = '0.68rem';
        title.style.color = 'var(--text-secondary)';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.textContent = `${pair.tubeA.ci} + ${pair.tubeB.ci}`;

        const ramp = document.createElement('div');
        ramp.style.display = 'flex';
        ramp.style.flex = '1';
        ramp.style.gap = '3px';
        ramp.style.height = '24px';

        pair.steps.forEach(step => {
          const isAtmo = AtmosphereEngine.state.enabled;
          const dispRgb = isAtmo ? AtmosphereEngine.transformColor(step.rgb) : step.rgb;
          const dispHex = ColorMath.rgbToHex(dispRgb.r, dispRgb.g, dispRgb.b);

          const sw = document.createElement('div');
          sw.style.flex = '1';
          sw.style.backgroundColor = dispHex;
          sw.style.borderRadius = '3px';
          sw.style.cursor = 'pointer';
          sw.draggable = true;
          sw.dataset.swatchHex = dispHex;
          sw.dataset.swatchLabel = `${pair.tubeA.name} + ${pair.tubeB.name}`;
          sw.addEventListener('click', () => this.setColorDirectly(step.rgb));
          ramp.appendChild(sw);
        });

        row.appendChild(title);
        row.appendChild(ramp);
        matrixGrid.appendChild(row);
      });
    }
  }

  // --- TAB NAVIGATION HELPER ---
  switchTab(tabKey) {
    const btn = document.querySelector(`.nav-tab-btn[data-tab="${tabKey}"]`);
    if (btn) {
      btn.click();
    }
  }

  // --- FLORENT FARGES FINE ART STUDIO & PHYSICAL MIXING LAB ---

  _bindFlorentControls() {
    // 1. Wheel Mode Tabs (1: Pigmentos, 2: Curvas de Arco, 3: Valores 3D)
    const wheelTabs = document.querySelectorAll('#florentWheelTabs button[data-fwheel]');
    wheelTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        wheelTabs.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        const idx = parseInt(btn.dataset.fwheel, 10);
        FlorentFargesEngine.activeWheelIndex = idx;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderFlorentFarges(currentRgb);
        this.showToast(`Modo Farges: Rueda ${idx} (${['Pigmentos & Tinte', 'Curvas de Arco', 'Valores 3D'][idx - 1]})`);
      });
    });

    // 2. Direct Bridge to Hyper4D Studio
    const btnJump4D = document.getElementById('btnFlorentJump4D');
    if (btnJump4D) {
      btnJump4D.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const solver = FlorentFargesEngine.solveMixingForColor(curRgb);
        if (this.hyper4dStudio) {
          this.hyper4dStudio.options.showMixingBowCurve = true;
          this.hyper4dStudio.compareSlots = [
            { id: 'A', name: `${solver.cand1.name} (${solver.cand1.ci})`, hex: solver.cand1.hex, rgb: solver.cand1.rgb, active: true },
            { id: 'B', name: `${solver.cand2.name} (${solver.cand2.ci})`, hex: solver.cand2.hex, rgb: solver.cand2.rgb, active: true }
          ];
          this.hyper4dStudio.renderCompareSlots();
          this.hyper4dStudio.updateActiveColor(curRgb);
        }
        this.switchTab('hyper4d');
        this.showToast('🔮 Rueda y Curvas de Arco de Farges proyectadas en el Hiperespacio 4D');
      });
    }

    // 3. Auto Palette Generator Scroll Button
    const btnAutoPal = document.getElementById('btnFlorentAutoPalette');
    if (btnAutoPal) {
      btnAutoPal.addEventListener('click', () => {
        const genCard = document.getElementById('florentGenPalTitle');
        if (genCard) {
          genCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderFlorentWorkshopPalette(curRgb);
        this.showToast('✨ Paleta de taller generada según las reglas de Florent Farges');
      });
    }

    // 4. Physical Mixing Lab: Populate Tube Selectors
    this._populateFlorentLabSelects();

    const selectT1 = document.getElementById('florentLabTube1Select');
    const selectT2 = document.getElementById('florentLabTube2Select');
    const ratioSlider = document.getElementById('florentLabRatioSlider');

    if (selectT1) {
      selectT1.value = FlorentFargesEngine.labPigment1Id;
      selectT1.addEventListener('change', (e) => {
        FlorentFargesEngine.labPigment1Id = e.target.value;
        this.renderFlorentMixingLab();
      });
    }

    if (selectT2) {
      selectT2.value = FlorentFargesEngine.labPigment2Id;
      selectT2.addEventListener('change', (e) => {
        FlorentFargesEngine.labPigment2Id = e.target.value;
        this.renderFlorentMixingLab();
      });
    }

    if (ratioSlider) {
      ratioSlider.value = Math.round(FlorentFargesEngine.labRatio * 100);
      ratioSlider.addEventListener('input', (e) => {
        FlorentFargesEngine.labRatio = parseInt(e.target.value, 10) / 100;
        this.renderFlorentMixingLab();
      });
    }

    // Ratio Quick Buttons
    const btnR20 = document.getElementById('btnLabRatio20');
    const btnR50 = document.getElementById('btnLabRatio50');
    const btnR80 = document.getElementById('btnLabRatio80');

    if (btnR20) {
      btnR20.addEventListener('click', () => {
        FlorentFargesEngine.labRatio = 0.2;
        if (ratioSlider) ratioSlider.value = 20;
        this.renderFlorentMixingLab();
      });
    }
    if (btnR50) {
      btnR50.addEventListener('click', () => {
        FlorentFargesEngine.labRatio = 0.5;
        if (ratioSlider) ratioSlider.value = 50;
        this.renderFlorentMixingLab();
      });
    }
    if (btnR80) {
      btnR80.addEventListener('click', () => {
        FlorentFargesEngine.labRatio = 0.8;
        if (ratioSlider) ratioSlider.value = 80;
        this.renderFlorentMixingLab();
      });
    }

    // Lab Presets Chips
    const presetChips = document.querySelectorAll('#florentLabPresetChips button');
    presetChips.forEach(btn => {
      btn.addEventListener('click', () => {
        presetChips.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        const p1Id = btn.dataset.p1;
        const p2Id = btn.dataset.p2;
        if (p1Id && p2Id) {
          FlorentFargesEngine.labPigment1Id = p1Id;
          FlorentFargesEngine.labPigment2Id = p2Id;
          if (selectT1) selectT1.value = p1Id;
          if (selectT2) selectT2.value = p2Id;
          this.renderFlorentMixingLab();
          this.showToast(`Caso de estudio cargado: ${btn.textContent.trim()}`);
        }
      });
    });

    // Lab Action: Usar en Caballete (FG)
    const btnLabSetFg = document.getElementById('btnFlorentLabSetFg');
    if (btnLabSetFg) {
      btnLabSetFg.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const p1 = this._getLabPigment(FlorentFargesEngine.labPigment1Id, curRgb);
        const p2 = this._getLabPigment(FlorentFargesEngine.labPigment2Id, curRgb);
        const sim = FlorentFargesEngine.simulatePigmentMixture(p1, p2, FlorentFargesEngine.labRatio);
        this.setColorDirectly(sim.rgb);
        this.showToast(`🎯 Color de mezcla (${sim.hex}) fijado como Primer Plano (FG)`);
      });
    }

    // Lab Action: Añadir a Paleta Activa
    const btnLabAddPal = document.getElementById('btnFlorentLabAddToPalette');
    if (btnLabAddPal) {
      btnLabAddPal.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const p1 = this._getLabPigment(FlorentFargesEngine.labPigment1Id, curRgb);
        const p2 = this._getLabPigment(FlorentFargesEngine.labPigment2Id, curRgb);
        const sim = FlorentFargesEngine.simulatePigmentMixture(p1, p2, FlorentFargesEngine.labRatio);
        this.swatchManager.addColorToActivePalette(sim.hex);
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        this.showToast(`➕ Mezcla ${sim.hex} añadida a tu paleta activa`);
      });
    }

    // Lab Action: Proyectar Mezcla en Hiperespacio 4D
    const btnLabJump4D = document.getElementById('btnFlorentLabJump4D');
    if (btnLabJump4D) {
      btnLabJump4D.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const p1 = this._getLabPigment(FlorentFargesEngine.labPigment1Id, curRgb);
        const p2 = this._getLabPigment(FlorentFargesEngine.labPigment2Id, curRgb);
        const sim = FlorentFargesEngine.simulatePigmentMixture(p1, p2, FlorentFargesEngine.labRatio);

        if (this.hyper4dStudio) {
          this.hyper4dStudio.options.showMixingBowCurve = true;
          this.hyper4dStudio.compareSlots = [
            { id: 'A', name: `T1: ${p1.name}`, hex: p1.hex, rgb: p1.rgb, active: true },
            { id: 'B', name: `T2: ${p2.name}`, hex: p2.hex, rgb: p2.rgb, active: true },
            { id: 'C', name: `Mezcla (${Math.round(FlorentFargesEngine.labRatio * 100)}%)`, hex: sim.hex, rgb: sim.rgb, active: true }
          ];
          this.hyper4dStudio.renderCompareSlots();
          this.hyper4dStudio.updateActiveColor(sim.rgb);
        }
        this.switchTab('hyper4d');
        this.showToast(`🔮 Curva Bow de ${p1.name} + ${p2.name} proyectada en el Hiperespacio 4D`);
      });
    }

    // 5. Automatic Generated Palette Actions
    const btnSaveGenPal = document.getElementById('btnFlorentSaveGenPal');
    if (btnSaveGenPal) {
      btnSaveGenPal.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const genPal = FlorentFargesEngine.generateFargesWorkshopPalette(curRgb);
        const hexArray = genPal.colors.map(c => c.hex);
        this.swatchManager.addPalette(genPal.name, hexArray);
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        this.showToast(`💾 Paleta '${genPal.name}' guardada con éxito en Bibliotecas`);
      });
    }

    const btn4DGenPal = document.getElementById('btnFlorent4DGenPal');
    if (btn4DGenPal) {
      btn4DGenPal.addEventListener('click', () => {
        const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        const genPal = FlorentFargesEngine.generateFargesWorkshopPalette(curRgb);
        if (this.hyper4dStudio) {
          this.hyper4dStudio.options.showPaletteConstellation = true;
          this.hyper4dStudio.options.showMixingBowCurve = true;
          this.hyper4dStudio.compareSlots = genPal.colors.slice(0, 6).map((c, idx) => ({
            id: String.fromCharCode(65 + idx),
            name: c.name,
            hex: c.hex,
            rgb: c.rgb || ColorMath.hexToRgb(c.hex),
            active: true
          }));
          this.hyper4dStudio.renderCompareSlots();
        }
        this.switchTab('hyper4d');
        this.showToast(`🔮 Constelación Farges proyectada en el Hiperespacio 4D`);
      });
    }

    // 6. "Por Qué de las Cosas" Tabs
    const whyTabs = document.querySelectorAll('#florentWhyTabs button[data-why]');
    whyTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        whyTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderFlorentWhy(btn.dataset.why);
      });
    });

    // Initial renders
    const initialRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.renderFlorentFarges(initialRgb);
    this.renderFlorentMixingLab();
    this.renderFlorentWorkshopPalette(initialRgb);
    this.renderFlorentCanonicalPalettes();
    this.renderFlorentWhy('olive_shift');
    this.renderFlorentFleshGrid();
    this.renderFlorentStudioTubes();
    this._bindFlorentTransitionControls();
    this.renderFlorentTransitionComparator();
  }

  _populateFlorentLabSelects() {
    const sel1 = document.getElementById('florentLabTube1Select');
    const sel2 = document.getElementById('florentLabTube2Select');
    if (!sel1 || !sel2) return;

    let html = `<option value="active_color">🎨 Color Activo del Caballete</option>`;
    FlorentFargesEngine.PIGMENTS.forEach(p => {
      html += `<option value="${p.id}">${p.name} (${p.ci}) — Tinte: ${p.tintingStrength}/10</option>`;
    });

    sel1.innerHTML = html;
    sel2.innerHTML = html;
  }

  _getLabPigment(id, activeRgb) {
    if (id === 'active_color') {
      const hex = ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);
      const hsv = ColorMath.rgbToHsv(activeRgb.r, activeRgb.g, activeRgb.b);
      return {
        id: 'active_color',
        name: `Color Caballete (${hex})`,
        ci: 'Muestra',
        hex,
        rgb: activeRgb,
        angle: hsv.h,
        inherentValue: parseFloat((hsv.v * 9).toFixed(1)),
        tintingStrength: 7,
        opacity: 'Semi-opaco',
        temperature: (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320 ? 'Cálido' : 'Frío'
      };
    }
    return FlorentFargesEngine.getPigmentById(id);
  }

  renderFlorentMixingLab() {
    const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    const p1 = this._getLabPigment(FlorentFargesEngine.labPigment1Id, curRgb);
    const p2 = this._getLabPigment(FlorentFargesEngine.labPigment2Id, curRgb);
    const ratio = FlorentFargesEngine.labRatio;

    // Run simulation
    const sim = FlorentFargesEngine.simulatePigmentMixture(p1, p2, ratio);

    // Update Strength Badges & Details
    const t1Badge = document.getElementById('florentLabT1StrengthBadge');
    const t2Badge = document.getElementById('florentLabT2StrengthBadge');
    const t1Details = document.getElementById('florentLabT1Details');
    const t2Details = document.getElementById('florentLabT2Details');

    if (t1Badge) t1Badge.textContent = `Fuerza: ${p1.tintingStrength || 6}/10`;
    if (t2Badge) t2Badge.textContent = `Fuerza: ${p2.tintingStrength || 6}/10`;

    if (t1Details) {
      t1Details.innerHTML = `
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${p1.hex};"></div>
        <span>Val: ${p1.inherentValue || 5.0} | ${p1.opacity || 'Semi-opaco'}</span>
      `;
    }
    if (t2Details) {
      t2Details.innerHTML = `
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${p2.hex};"></div>
        <span>Val: ${p2.inherentValue || 5.0} | ${p2.opacity || 'Semi-opaco'}</span>
      `;
    }

    // Ratio display
    const ratioDisp = document.getElementById('florentLabRatioDisplay');
    if (ratioDisp) {
      const p1Pct = Math.round((1 - ratio) * 100);
      const p2Pct = Math.round(ratio * 100);
      const effPct = Math.round(sim.effectiveWeight * 100);
      ratioDisp.textContent = `${p1Pct}% T1 / ${p2Pct}% T2 (Efectivo Físico: ${effPct}% T2)`;
    }

    // Result swatch pill & labels
    const pill = document.getElementById('florentLabResultPill');
    const resName = document.getElementById('florentLabResultName');
    const resHex = document.getElementById('florentLabResultHex');
    const resVal = document.getElementById('florentLabResultValue');
    const resOpac = document.getElementById('florentLabResultOpacity');

    if (pill) pill.style.backgroundColor = sim.hex;
    if (resName) {
      resName.textContent = sim.isOliveShift ? 'Verde Oliva Farges (Olive Shift)' : `Mezcla: ${p1.name.split(' ')[0]} + ${p2.name.split(' ')[0]}`;
    }
    if (resHex) {
      resHex.textContent = sim.hex;
      resHex.dataset.hex = sim.hex;
    }
    if (resVal) resVal.textContent = `Valor: ${sim.inherentValue} / 9`;
    if (resOpac) resOpac.textContent = sim.resultingOpacity;

    // 7-step physical mixing gradient strip
    const stepStrip = document.getElementById('florentLabStepStrip');
    if (stepStrip) {
      stepStrip.innerHTML = '';
      const steps = FlorentFargesEngine.generateMixingSteps(p1, p2, 7);
      steps.forEach(st => {
        const item = document.createElement('div');
        item.className = 'farges-step-item';
        item.style.backgroundColor = st.hex;
        item.title = `${st.name} (${st.hex}) — Haz clic para usar`;
        item.dataset.swatchHex = st.hex;

        const ratioTag = document.createElement('span');
        ratioTag.className = 'farges-step-ratio';
        ratioTag.textContent = `${st.ratio}%`;

        item.appendChild(ratioTag);
        item.addEventListener('click', () => {
          FlorentFargesEngine.labRatio = st.ratio / 100;
          const slider = document.getElementById('florentLabRatioSlider');
          if (slider) slider.value = st.ratio;
          this.renderFlorentMixingLab();
          this.setColorDirectly(st.rgb);
          this.showToast(`Paso seleccionado: ${st.name} (${st.hex})`);
        });

        stepStrip.appendChild(item);
      });
    }

    // Statistics Meters
    const tintMeter = document.getElementById('florentLabTintMeter');
    const deltaVMeter = document.getElementById('florentLabDeltaVMeter');
    const bowMeter = document.getElementById('florentLabBowMeter');
    const pedNote = document.getElementById('florentLabPedagogicalNote');

    if (tintMeter) {
      tintMeter.textContent = `${sim.dominant.name.split(' ')[0]} domina ${sim.tintRatio}x sobre ${sim.submissive.name.split(' ')[0]}`;
    }
    if (deltaVMeter) {
      deltaVMeter.textContent = `ΔV: ${sim.deltaV} (${sim.deltaV >= 4.0 ? 'Disparidad Extrema' : 'Transición Gradual'})`;
    }
    if (bowMeter) {
      bowMeter.textContent = `Arco: ${sim.angSpan}° (${sim.angSpan >= 120 ? 'Desaturación Profunda al Centro' : 'Mantiene Pureza'})`;
    }
    if (pedNote) {
      pedNote.textContent = sim.pedagogicalNote;
    }

    // Refresh canvas to highlight this lab pair in wheel 2 and wheel 1
    const canvas = document.getElementById('florentWheelCanvas');
    if (canvas) {
      FlorentFargesEngine.drawFargesWheel(canvas, curRgb, p1, p2);
    }
  }

  renderFlorentWorkshopPalette(targetRgb) {
    const pal = FlorentFargesEngine.generateFargesWorkshopPalette(targetRgb);
    const titleEl = document.getElementById('florentGenPalTitle');
    const descEl = document.getElementById('florentGenPalDesc');
    const swatchesEl = document.getElementById('florentGenPalSwatches');

    if (titleEl) titleEl.textContent = `🎨 ${pal.name}`;
    if (descEl) descEl.textContent = pal.desc;

    if (swatchesEl) {
      swatchesEl.innerHTML = '';
      pal.colors.forEach(col => {
        const card = document.createElement('div');
        card.style.background = 'rgba(0,0,0,0.4)';
        card.style.border = '1px solid rgba(255,255,255,0.08)';
        card.style.borderRadius = '6px';
        card.style.padding = '8px';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '8px';
        card.style.cursor = 'pointer';
        card.draggable = true;
        card.dataset.swatchHex = col.hex;
        card.title = `${col.name} — ${col.role}`;

        const pill = document.createElement('div');
        pill.style.width = '32px';
        pill.style.height = '32px';
        pill.style.borderRadius = '6px';
        pill.style.backgroundColor = col.hex;
        pill.style.border = '1px solid rgba(255,255,255,0.2)';
        pill.style.flexShrink = '0';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.flexDirection = 'column';
        info.style.gap = '1px';

        const nameSpan = document.createElement('span');
        nameSpan.style.fontSize = '0.73rem';
        nameSpan.style.fontWeight = '700';
        nameSpan.style.color = '#FFFFFF';
        nameSpan.textContent = col.name;

        const roleSpan = document.createElement('span');
        roleSpan.style.fontSize = '0.64rem';
        roleSpan.style.color = 'var(--text-muted)';
        roleSpan.textContent = col.role;

        const hexSpan = document.createElement('span');
        hexSpan.className = 'copyable-hex';
        hexSpan.style.fontFamily = 'var(--font-mono)';
        hexSpan.style.fontSize = '0.65rem';
        hexSpan.style.color = 'var(--accent-cyan)';
        hexSpan.textContent = col.hex;

        info.appendChild(nameSpan);
        info.appendChild(roleSpan);
        info.appendChild(hexSpan);

        card.appendChild(pill);
        card.appendChild(info);

        card.addEventListener('click', () => {
          this.setColorDirectly(col.rgb || ColorMath.hexToRgb(col.hex));
          this.showToast(`Color cargado: ${col.name}`);
        });

        swatchesEl.appendChild(card);
      });
    }
  }

  _bindFlorentTransitionControls() {
    const btnJump4D = document.getElementById('btnFargesTransitionJump4D');
    const btnSavePal = document.getElementById('btnFargesTransitionSavePalette');
    const btnAddStop = document.getElementById('btnFargesAddStop');
    const stepsSelect = document.getElementById('fargesTransitionStepsSelect');

    if (btnJump4D) {
      btnJump4D.addEventListener('click', () => {
        if (this.hyper4dStudio) {
          this.hyper4dStudio.options.showMixingBowCurve = true;
          this.hyper4dStudio.activeDeployment = 'farges';
          const deployPills = document.querySelectorAll('#hyper4dDeployPills button');
          deployPills.forEach(p => p.classList.remove('active'));
          const fargesPill = document.querySelector('#hyper4dDeployPills button[data-deploy="farges"]');
          if (fargesPill) fargesPill.classList.add('active');
          const curRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
          this.hyper4dStudio.syncWithActiveColor(curRgb);
        }
        this.switchTab('hyper4d');
        this.showToast('🔮 Transición Farges multi-muestra proyectada en el Hiperespacio 4D', 'success');
      });
    }

    if (btnSavePal) {
      btnSavePal.addEventListener('click', () => {
        const steps = FlorentFargesEngine.generateMultiSampleTransition(
          FlorentFargesEngine.transitionStops,
          FlorentFargesEngine.transitionStepsCount || 9
        );
        if (!steps || steps.length < 2) return;
        const hexArray = steps.map(s => s.hex);
        const palName = `Transición Farges (${FlorentFargesEngine.transitionStops.length} Muestras)`;
        this.swatchManager.addPalette(palName, hexArray);
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        this.showToast(`💾 Paleta '${palName}' guardada con éxito en tus Bibliotecas`, 'success');
      });
    }

    if (btnAddStop) {
      btnAddStop.addEventListener('click', () => {
        FlorentFargesEngine.addTransitionStop();
        this.renderFlorentTransitionComparator();
        if (this.hyper4dStudio) {
          this.hyper4dStudio.syncFargesWithCompare();
          if (this.hyper4dStudio.activeDeployment === 'farges') {
            this.hyper4dStudio.syncWithActiveColor();
          }
        }
        this.showToast('➕ Nueva muestra añadida a la transición de Farges');
      });
    }

    if (stepsSelect) {
      stepsSelect.value = FlorentFargesEngine.transitionStepsCount || 9;
      stepsSelect.addEventListener('change', (e) => {
        FlorentFargesEngine.transitionStepsCount = parseInt(e.target.value, 10);
        if (this.hyper4dStudio) {
          this.hyper4dStudio.fargesStepsResolution = FlorentFargesEngine.transitionStepsCount;
          this.hyper4dStudio._updateFargesSubBar();
        }
        this.renderFlorentTransitionComparator();
        if (this.hyper4dStudio && this.hyper4dStudio.activeDeployment === 'farges') {
          this.hyper4dStudio.syncWithActiveColor();
        }
      });
    }

    // Preset Chips
    const presetChips = document.querySelectorAll('#fargesTransitionPresetChips button[data-fpreset]');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        presetChips.forEach(c => c.classList.remove('active-toggle'));
        chip.classList.add('active-toggle');
        const presetKey = chip.dataset.fpreset;

        if (presetKey === 'fgbg') {
          FlorentFargesEngine.setTransitionStops([
            { hex: this.fgColor.hex, rgb: this.fgColor, name: 'Color Frontal (FG)' },
            { hex: this.bgColor.hex, rgb: this.bgColor, name: 'Color Fondo (BG)' }
          ]);
        } else if (presetKey === 'warm_cool') {
          FlorentFargesEngine.setTransitionStops([
            { hex: '#FFF200', rgb: { r: 255, g: 242, b: 0 }, name: 'Amarillo Limón (PY35)' },
            { hex: '#CC9933', rgb: { r: 204, g: 153, b: 51 }, name: 'Ocre Dorado (PY43)' },
            { hex: '#0055A5', rgb: { r: 0, g: 85, b: 165 }, name: 'Azul Ftalo (PB15:3)' }
          ]);
        } else if (presetKey === 'sorolla') {
          FlorentFargesEngine.setTransitionStops([
            { hex: '#FFF8D6', rgb: { r: 255, g: 248, b: 214 }, name: 'Luz Solar Sorolla' },
            { hex: '#E89758', rgb: { r: 232, g: 151, b: 88 }, name: 'Halftone Siena' },
            { hex: '#856B96', rgb: { r: 133, g: 107, b: 150 }, name: 'Sombra Violeta Cobalto' }
          ]);
        } else if (presetKey === 'flesh') {
          FlorentFargesEngine.setTransitionStops([
            { hex: '#9B4722', rgb: { r: 155, g: 71, b: 34 }, name: 'Siena Tostada (Sombra)' },
            { hex: '#CC9933', rgb: { r: 204, g: 153, b: 51 }, name: 'Ocre Amarillo (Medio)' },
            { hex: '#E8B869', rgb: { r: 232, g: 184, b: 105 }, name: 'Carne Luminosa' },
            { hex: '#FFF5E1', rgb: { r: 255, g: 245, b: 225 }, name: 'Luz Empastada Blanco' }
          ]);
        } else if (presetKey === 'palette') {
          const activePal = this.swatchManager.getActivePalette();
          if (activePal && activePal.colors && activePal.colors.length >= 2) {
            const stops = activePal.colors.slice(0, 6).map((c, i) => {
              const hex = (typeof c === 'string' ? c : c.hex).toUpperCase();
              return { hex, rgb: ColorMath.hexToRgb(hex), name: `Muestra ${i + 1}` };
            });
            FlorentFargesEngine.setTransitionStops(stops);
          } else {
            this.showToast('La paleta activa debe tener al menos 2 colores', 'warning');
            return;
          }
        }

        this.renderFlorentTransitionComparator();
        if (this.hyper4dStudio) {
          this.hyper4dStudio.syncFargesWithCompare();
          if (this.hyper4dStudio.activeDeployment === 'farges') {
            this.hyper4dStudio.syncWithActiveColor();
          }
        }
        this.showToast(`Preset Farges aplicado: ${chip.textContent.trim()}`);
      });
    });
  }

  renderFlorentTransitionComparator() {
    const stopsContainer = document.getElementById('fargesTransitionStopsGrid');
    const stepsStrip = document.getElementById('fargesTransitionStepsStrip');
    const countBadge = document.getElementById('fargesStopsCount');
    const physicsReport = document.getElementById('fargesTransitionSegmentsReport');

    if (!stopsContainer || !stepsStrip) return;

    const stops = FlorentFargesEngine.transitionStops;
    if (countBadge) countBadge.textContent = stops.length;

    // 1. Render Stops Cards
    stopsContainer.innerHTML = '';
    stops.forEach((stop, idx) => {
      const card = document.createElement('div');
      card.className = 'farges-stop-card';

      const closest = FlorentFargesEngine.findClosestPigment(stop.rgb);
      const letter = String.fromCharCode(65 + idx);

      card.innerHTML = `
        <div class="farges-stop-header">
          <span class="farges-stop-badge">Muestra ${letter}</span>
          <div class="farges-stop-actions">
            <button class="farges-stop-btn-mini btn-stop-fg" title="Asignar el color frontal actual">Usar FG</button>
            <button class="farges-stop-btn-mini btn-stop-bg" title="Asignar el color de fondo actual">Usar BG</button>
            ${stops.length > 2 ? `<button class="farges-stop-btn-del btn-del-stop" title="Eliminar esta parada">✕</button>` : ''}
          </div>
        </div>
        <div class="farges-stop-body">
          <div class="farges-stop-color-input-wrap" style="background-color: ${stop.hex};">
            <input type="color" class="farges-stop-color-picker" value="${stop.hex}">
          </div>
          <div class="farges-stop-inputs">
            <input type="text" class="farges-stop-name-input" value="${stop.name || `Muestra ${letter}`}" placeholder="Nombre de la parada">
            <input type="text" class="farges-stop-hex-input" value="${stop.hex}" maxlength="7">
            <div class="farges-stop-pigment-tag" title="Pigmento genuino más afín de Bellas Artes">
              🎨 ${closest.pigment.name} (Val ${closest.pigment.inherentValue}, Tinte ${closest.pigment.tintingStrength}/10)
            </div>
          </div>
        </div>
      `;

      // Event listeners for Stop Card
      const picker = card.querySelector('.farges-stop-color-picker');
      const hexInput = card.querySelector('.farges-stop-hex-input');
      const nameInput = card.querySelector('.farges-stop-name-input');
      const btnFg = card.querySelector('.btn-stop-fg');
      const btnBg = card.querySelector('.btn-stop-bg');
      const btnDel = card.querySelector('.btn-del-stop');

      if (picker) {
        picker.addEventListener('input', (e) => {
          FlorentFargesEngine.updateTransitionStop(idx, e.target.value);
          this.renderFlorentTransitionComparator();
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncFargesWithCompare();
            if (this.hyper4dStudio.activeDeployment === 'farges') {
              this.hyper4dStudio.syncWithActiveColor();
            }
          }
        });
      }

      if (hexInput) {
        hexInput.addEventListener('change', (e) => {
          let val = e.target.value.trim();
          if (!val.startsWith('#')) val = '#' + val;
          if (/^#[0-9A-F]{6}$/i.test(val)) {
            FlorentFargesEngine.updateTransitionStop(idx, val);
            this.renderFlorentTransitionComparator();
            if (this.hyper4dStudio) {
              this.hyper4dStudio.syncFargesWithCompare();
              if (this.hyper4dStudio.activeDeployment === 'farges') {
                this.hyper4dStudio.syncWithActiveColor();
              }
            }
          }
        });
      }

      if (nameInput) {
        nameInput.addEventListener('change', (e) => {
          FlorentFargesEngine.updateTransitionStop(idx, null, e.target.value.trim());
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncFargesWithCompare();
          }
        });
      }

      if (btnFg) {
        btnFg.addEventListener('click', () => {
          FlorentFargesEngine.updateTransitionStop(idx, this.fgColor.hex, `FG (${this.fgColor.hex})`);
          this.renderFlorentTransitionComparator();
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncFargesWithCompare();
            if (this.hyper4dStudio.activeDeployment === 'farges') {
              this.hyper4dStudio.syncWithActiveColor();
            }
          }
          this.showToast(`Muestra ${letter} actualizada con Color Frontal (FG)`);
        });
      }

      if (btnBg) {
        btnBg.addEventListener('click', () => {
          FlorentFargesEngine.updateTransitionStop(idx, this.bgColor.hex, `BG (${this.bgColor.hex})`);
          this.renderFlorentTransitionComparator();
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncFargesWithCompare();
            if (this.hyper4dStudio.activeDeployment === 'farges') {
              this.hyper4dStudio.syncWithActiveColor();
            }
          }
          this.showToast(`Muestra ${letter} actualizada con Color Fondo (BG)`);
        });
      }

      if (btnDel) {
        btnDel.addEventListener('click', () => {
          FlorentFargesEngine.removeTransitionStop(idx);
          this.renderFlorentTransitionComparator();
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncFargesWithCompare();
            if (this.hyper4dStudio.activeDeployment === 'farges') {
              this.hyper4dStudio.syncWithActiveColor();
            }
          }
          this.showToast(`Muestra eliminada de la transición`);
        });
      }

      stopsContainer.appendChild(card);
    });

    // 2. Compute Intermediate Steps
    const totalSteps = FlorentFargesEngine.transitionStepsCount || 9;
    const steps = FlorentFargesEngine.generateMultiSampleTransition(stops, totalSteps);

    // 3. Render Intermediate Steps Strip
    stepsStrip.innerHTML = '';
    const detailBox = document.getElementById('fargesStepDetailBox');

    steps.forEach((step) => {
      const pill = document.createElement('div');
      pill.className = `farges-multi-step-pill ${step.isStop ? 'is-stop-pill' : ''}`;
      pill.style.backgroundColor = step.hex;
      pill.title = `${step.stopName} (${step.hex})\nMunsell: ${step.munsell}\nValor Farges: ${step.inherentValue}/9\nClick: Cargar como FG`;

      pill.innerHTML = `
        <span class="farges-pill-ratio">${step.isStop ? '★' : `${Math.round(step.localRatio * 100)}%`}</span>
        <span class="farges-pill-val">V${step.inherentValue}</span>
        ${step.isOliveShift ? `<span class="farges-pill-olive-badge" title="Viraje Olive Shift detectado">Oliva</span>` : ''}
      `;

      pill.addEventListener('click', () => {
        this.setColorDirectly(step.rgb);
        this.showToast(`🎯 Paso Farges seleccionado: ${step.stopName} (${step.hex})`);

        if (detailBox) {
          detailBox.style.display = 'block';
          detailBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 6px; background-color: ${step.hex}; border: 1px solid #FFF;"></div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: #FFF;">${step.stopName}</div>
                  <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #38BDF8;">${step.hex} • Munsell: ${step.munsell} • Valor Farges: ${step.inherentValue}/9</div>
                </div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="farges-action-btn" id="btnFargesDetailBg">Usar Fondo (BG)</button>
                <button class="farges-action-btn farges-action-btn-emerald" id="btnFargesDetailAddPal">➕ Añadir a Paleta</button>
              </div>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
              💡 <strong>Física Sustractiva:</strong> ${step.pedagogicalNote}
            </div>
          `;

          const btnBg = document.getElementById('btnFargesDetailBg');
          const btnPal = document.getElementById('btnFargesDetailAddPal');
          if (btnBg) {
            btnBg.addEventListener('click', () => {
              this.activeWell = 'bg';
              this.setColorDirectly(step.rgb);
              this.showToast(`Color ${step.hex} fijado como Fondo (BG)`);
            });
          }
          if (btnPal) {
            btnPal.addEventListener('click', () => {
              this.swatchManager.addColorToActivePalette(step.hex);
              this.renderQuickPalette();
              this.renderSwatchesCollection();
              this.showToast(`Color ${step.hex} añadido a tu paleta activa`);
            });
          }
        }
      });

      stepsStrip.appendChild(pill);
    });

    // 4. Render Segments Physics Report
    if (physicsReport) {
      physicsReport.innerHTML = '';
      for (let s = 0; s < stops.length - 1; s++) {
        const stopA = stops[s];
        const stopB = stops[s + 1];
        const mix = FlorentFargesEngine.solveArbitraryColorMixing(stopA, stopB, 0.5);

        const segItem = document.createElement('div');
        segItem.className = 'farges-segment-item';
        segItem.innerHTML = `
          <div class="farges-segment-header">
            <span>Segmento ${s + 1}: ${stopA.name || stopA.hex} ➔ ${stopB.name || stopB.hex}</span>
            <span style="font-family: var(--font-mono); color: #FBBF24;">Intervalo: ${mix.angSpan}° • Valor Central: ${mix.inherentValue}</span>
          </div>
          <div class="farges-segment-note">
            ${mix.pedagogicalNote}
          </div>
        `;
        physicsReport.appendChild(segItem);
      }
    }
  }

  renderFlorentCanonicalPalettes() {
    const container = document.getElementById('florentCanonicalPalettesList');
    if (!container) return;
    container.innerHTML = '';

    FlorentFargesEngine.CANONICAL_PALETTES.forEach(pal => {
      const card = document.createElement('div');
      card.className = 'farges-canon-card';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'flex-start';
      header.style.gap = '8px';

      const titleBox = document.createElement('div');
      const title = document.createElement('span');
      title.style.fontSize = '0.78rem';
      title.style.fontWeight = '700';
      title.style.color = '#FFFFFF';
      title.textContent = pal.name;

      const desc = document.createElement('p');
      desc.style.fontSize = '0.68rem';
      desc.style.color = 'var(--text-secondary)';
      desc.style.margin = '4px 0 0 0';
      desc.style.lineHeight = '1.35';
      desc.textContent = pal.desc;

      titleBox.appendChild(title);
      titleBox.appendChild(desc);
      header.appendChild(titleBox);

      // Swatches row
      const swatchRow = document.createElement('div');
      swatchRow.style.display = 'flex';
      swatchRow.style.gap = '4px';
      swatchRow.style.flexWrap = 'wrap';
      swatchRow.style.margin = '4px 0';

      pal.colors.forEach(c => {
        const dot = document.createElement('div');
        dot.style.width = '20px';
        dot.style.height = '20px';
        dot.style.borderRadius = '4px';
        dot.style.backgroundColor = c.hex;
        dot.style.border = '1px solid rgba(255,255,255,0.2)';
        dot.style.cursor = 'pointer';
        dot.title = `${c.name} (${c.role || c.hex})`;
        dot.dataset.swatchHex = c.hex;
        dot.draggable = true;

        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const rgb = ColorMath.hexToRgb(c.hex);
          this.setColorDirectly(rgb);
          this.showToast(`Tubo: ${c.name}`);
        });

        swatchRow.appendChild(dot);
      });

      // Actions row
      const actRow = document.createElement('div');
      actRow.style.display = 'flex';
      actRow.style.gap = '6px';
      actRow.style.flexWrap = 'wrap';
      actRow.style.marginTop = '4px';

      const btnSave = document.createElement('button');
      btnSave.className = 'farges-action-btn farges-action-btn-emerald';
      btnSave.innerHTML = '<span>💾</span> Guardar en Bibliotecas';
      btnSave.addEventListener('click', () => {
        this.swatchManager.addPalette(pal.name, pal.colors.map(c => c.hex));
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        this.showToast(`✅ Paleta '${pal.name}' guardada en tus Bibliotecas`);
      });

      const btnLoad = document.createElement('button');
      btnLoad.className = 'farges-action-btn';
      btnLoad.innerHTML = '<span>🎨</span> Cargar Caballete';
      btnLoad.addEventListener('click', () => {
        const first = pal.colors.find(c => c.hex !== '#FDFBF7') || pal.colors[0];
        this.setColorDirectly(ColorMath.hexToRgb(first.hex));
        this.showToast(`Paleta cargada en caballete: ${pal.name}`);
      });

      const btn4D = document.createElement('button');
      btn4D.className = 'farges-action-btn farges-action-btn-amber';
      btn4D.innerHTML = '<span>🔮</span> 4D';
      btn4D.title = 'Ver paleta en Hiperespacio 4D';
      btn4D.addEventListener('click', () => {
        if (this.hyper4dStudio) {
          this.hyper4dStudio.options.showPaletteConstellation = true;
          this.hyper4dStudio.compareSlots = pal.colors.slice(0, 6).map((c, idx) => ({
            id: String.fromCharCode(65 + idx),
            name: c.name,
            hex: c.hex,
            rgb: ColorMath.hexToRgb(c.hex),
            active: true
          }));
          this.hyper4dStudio.renderCompareSlots();
        }
        this.switchTab('hyper4d');
        this.showToast(`🔮 '${pal.name}' proyectada en el Hiperespacio 4D`);
      });

      actRow.appendChild(btnSave);
      actRow.appendChild(btnLoad);
      actRow.appendChild(btn4D);

      card.appendChild(header);
      card.appendChild(swatchRow);
      card.appendChild(actRow);
      container.appendChild(card);
    });
  }

  renderFlorentWhy(topicKey = 'olive_shift') {
    const box = document.getElementById('florentWhyDisplayBox');
    if (!box) return;
    const why = FlorentFargesEngine.explainWhy(topicKey);

    let visualDemoHtml = '';
    if (topicKey === 'olive_shift') {
      visualDemoHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(239,68,68,0.3);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #FCA5A5;">❌ Error Clásico: Amarillo + Negro Marfil</span>
              <span style="font-size: 0.65rem; color: #F87171;">Vira a Verde Oliva</span>
            </div>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #FFD700 0%, #4D511A 100%); border: 1px solid rgba(255,255,255,0.15);"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Cadmium Yellow (PY35) + Ivory Black (PBk9) = Clorofila deslucida</div>
          </div>
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.3);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #6EE7B7;">✔️ Solución Farges: Amarillo + Tierras</span>
              <span style="font-size: 0.65rem; color: #34D399;">Mantiene Oro Luminoso</span>
            </div>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #FFD700 0%, #8D541B 50%, #463A2B 100%); border: 1px solid rgba(255,255,255,0.15);"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Cadmium Yellow (PY35) + Siena Tostada / Raw Umber = Oro profundo vivo</div>
          </div>
        </div>
      `;
    } else if (topicKey === 'ultramarine_green') {
      visualDemoHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(245,158,11,0.3);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #FCD34D;">⚠️ Ultramar (PB29) + Amarillo Limón</span>
              <span style="font-size: 0.65rem; color: #FBBF24;">Subtono Rojo Desatura</span>
            </div>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #FFF200 0%, #2F4F24 50%, #1B2682 100%); border: 1px solid rgba(255,255,255,0.15);"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Produce Verde Musgo de bajo croma (el rojo actúa como neutralizador)</div>
          </div>
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.3);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #6EE7B7;">✔️ Ftalo Verde (PB15:3) + Amarillo Limón</span>
              <span style="font-size: 0.65rem; color: #34D399;">Verde Eléctrico Puro</span>
            </div>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #FFF200 0%, #00B050 50%, #003366 100%); border: 1px solid rgba(255,255,255,0.15);"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Sin interferencia de longitudes rojas: máxima saturación espectral</div>
          </div>
        </div>
      `;
    } else if (topicKey === 'titanium_vs_zinc') {
      visualDemoHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
            <span style="font-size: 0.72rem; font-weight: 700; color: #FFFFFF;">Blanco de Titanio (PW6) — Fuerza 10/10</span>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #C01368 0%, #F59DB8 50%, #FDFBF7 100%); border: 1px solid rgba(255,255,255,0.15); margin-top: 4px;"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Opaco, empaste denso. Puede empolvar y volver lechosos los medios tonos.</div>
          </div>
          <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid rgba(56,189,248,0.3);">
            <span style="font-size: 0.72rem; font-weight: 700; color: #38BDF8;">Blanco de Zinc (PW4) — Fuerza 3/10</span>
            <div style="height: 32px; border-radius: 4px; background: linear-gradient(to right, #C01368 0%, #E83884 50%, #F9FBFD 100%); border: 1px solid rgba(255,255,255,0.15); margin-top: 4px;"></div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">Transparente y limpio. Eleva el valor sin destruir la vibración cromática interior.</div>
          </div>
        </div>
      `;
    } else if (topicKey === 'inherent_value') {
      visualDemoHtml = `
        <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; border: 1px solid var(--border-subtle); margin-top: 10px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #FBBF24; margin-bottom: 6px;">Escala de Valor Intrínseco de los Pigmentos (1-9):</div>
          <div style="display: flex; gap: 4px; align-items: flex-end; height: 50px;">
            <div style="flex: 1; height: 12%; background: #1E1D1B; border-radius: 3px;" title="Negro Marfil (Val 1.0)"></div>
            <div style="flex: 1; height: 20%; background: #4A154B; border-radius: 3px;" title="Dioxacina (Val 1.8)"></div>
            <div style="flex: 1; height: 24%; background: #1B2682; border-radius: 3px;" title="Azul Ultramar (Val 2.2)"></div>
            <div style="flex: 1; height: 35%; background: #9E1338; border-radius: 3px;" title="Alizarina (Val 3.2)"></div>
            <div style="flex: 1; height: 44%; background: #D91424; border-radius: 3px;" title="Rojo Cadmio (Val 4.0)"></div>
            <div style="flex: 1; height: 60%; background: #C67128; border-radius: 3px;" title="Siena Natural (Val 5.5)"></div>
            <div style="flex: 1; height: 68%; background: #CC9933; border-radius: 3px;" title="Ocre Amarillo (Val 6.2)"></div>
            <div style="flex: 1; height: 85%; background: #FFD700; border-radius: 3px;" title="Cadmio Medio (Val 8.0)"></div>
            <div style="flex: 1; height: 92%; background: #FFF200; border-radius: 3px;" title="Cadmio Limón (Val 8.5)"></div>
            <div style="flex: 1; height: 100%; background: #FDFBF7; border-radius: 3px;" title="Blanco Titanio (Val 9.8)"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
            <span>Val 1 (Oscuro / Frío)</span>
            <span>Val 5 (Tierra / Equilibrado)</span>
            <span>Val 9 (Luz / Amarillo)</span>
          </div>
        </div>
      `;
    }

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 0.84rem; font-weight: 700; color: #FFFFFF;">${why.title}</span>
        <span style="font-size: 0.68rem; color: var(--accent-amber); font-weight: 600;">${why.subtitle}</span>
      </div>
      <p style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 6px 0;">
        ${why.explanation}
      </p>
      <div style="background: rgba(16,185,129,0.08); border-left: 3px solid #10B981; padding: 6px 10px; border-radius: 0 4px 4px 0; font-size: 0.72rem; color: #A7F3D0; line-height: 1.4;">
        <strong>Regla Magistral de Taller:</strong> ${why.solution}
      </div>
      ${visualDemoHtml}
    `;
  }

  renderFlorentFleshGrid() {
    const fleshGrid = document.getElementById('florentFleshGrid');
    if (!fleshGrid) return;
    fleshGrid.innerHTML = '';

    FlorentFargesEngine.FLESH_ZONES.forEach(zone => {
      const card = document.createElement('div');
      card.style.background = 'rgba(0,0,0,0.3)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = 'var(--radius-md)';
      card.style.padding = '10px';
      card.style.cursor = 'pointer';
      card.draggable = true;
      card.dataset.swatchHex = zone.hex;

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.alignItems = 'center';
      topRow.style.gap = '8px';

      const pill = document.createElement('div');
      pill.style.width = '30px';
      pill.style.height = '30px';
      pill.style.borderRadius = '6px';
      pill.style.backgroundColor = zone.hex;
      pill.style.border = '1px solid rgba(255,255,255,0.2)';

      const titleBox = document.createElement('div');
      const title = document.createElement('span');
      title.style.fontSize = '0.74rem';
      title.style.fontWeight = '600';
      title.style.color = '#FFFFFF';
      title.textContent = zone.title;

      const hex = document.createElement('span');
      hex.style.fontFamily = 'var(--font-mono)';
      hex.style.fontSize = '0.68rem';
      hex.className = 'copyable-hex';
      hex.textContent = zone.hex;

      titleBox.appendChild(title);
      titleBox.appendChild(hex);
      topRow.appendChild(pill);
      topRow.appendChild(titleBox);

      const anat = document.createElement('div');
      anat.style.fontSize = '0.65rem';
      anat.style.color = 'var(--text-muted)';
      anat.style.marginTop = '4px';
      anat.textContent = zone.anatomical;

      const recipe = document.createElement('div');
      recipe.style.fontSize = '0.68rem';
      recipe.style.color = '#E2E8F0';
      recipe.style.marginTop = '4px';
      recipe.innerHTML = `<strong>Receta:</strong> ${zone.recipe}`;

      card.appendChild(topRow);
      card.appendChild(anat);
      card.appendChild(recipe);

      card.addEventListener('click', () => {
        this.setColorDirectly(zone.rgb);
        this.showToast(`Carnación: ${zone.title}`);
      });

      fleshGrid.appendChild(card);
    });
  }

  renderFlorentStudioTubes() {
    const tubesList = document.getElementById('florentStudioTubesList');
    if (!tubesList) return;
    tubesList.innerHTML = '';

    FlorentFargesEngine.PIGMENTS.forEach(p => {
      const pill = document.createElement('div');
      pill.style.display = 'flex';
      pill.style.alignItems = 'center';
      pill.style.gap = '6px';
      pill.style.background = 'rgba(0,0,0,0.35)';
      pill.style.border = '1px solid var(--border-subtle)';
      pill.style.padding = '4px 8px';
      pill.style.borderRadius = '6px';
      pill.style.cursor = 'pointer';
      pill.draggable = true;
      pill.dataset.swatchHex = p.hex;
      pill.title = `${p.name} (${p.ci}) — Valor: ${p.inherentValue}, Tinte: ${p.tintingStrength}/10, ${p.opacity}`;

      const dot = document.createElement('div');
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = p.hex;
      dot.style.border = '1px solid rgba(255,255,255,0.2)';

      const name = document.createElement('span');
      name.style.fontSize = '0.72rem';
      name.textContent = `${p.name} (${p.ci})`;

      pill.appendChild(dot);
      pill.appendChild(name);
      pill.addEventListener('click', () => {
        this.setColorDirectly(p.rgb);
        // Also update tube 1 in lab for immediate mixing exploration
        FlorentFargesEngine.labPigment1Id = p.id;
        const sel1 = document.getElementById('florentLabTube1Select');
        if (sel1) sel1.value = p.id;
        this.renderFlorentMixingLab();
        this.showToast(`Tubo seleccionado: ${p.name}`);
      });

      tubesList.appendChild(pill);
    });
  }

  renderFlorentFarges(targetRgb) {
    const curRgb = targetRgb || (this.activeWell === 'fg' ? this.fgColor : this.bgColor);
    const canvas = document.getElementById('florentWheelCanvas');
    if (canvas) {
      const p1 = this._getLabPigment(FlorentFargesEngine.labPigment1Id, curRgb);
      const p2 = this._getLabPigment(FlorentFargesEngine.labPigment2Id, curRgb);
      FlorentFargesEngine.drawFargesWheel(canvas, curRgb, p1, p2);
    }

    const solver = FlorentFargesEngine.solveMixingForColor(curRgb);
    const badge = document.getElementById('florentActiveHueBadge');
    if (badge) {
      badge.textContent = `Matiz: ${solver.targetAngle}° (S:${Math.round(solver.targetHsl.s * 100)}% L:${Math.round(solver.targetHsl.l * 100)}%)`;
    }

    const c1 = document.getElementById('florentCand1Card');
    if (c1) {
      c1.innerHTML = `
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px;">Candidato 1: ${solver.cand1.percent}%</div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${solver.cand1.hex};"></div>
          <span style="font-size: 0.74rem; font-weight: 600; color: #fff;">${solver.cand1.name}</span>
        </div>
      `;
    }

    const c2 = document.getElementById('florentCand2Card');
    if (c2) {
      c2.innerHTML = `
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px;">Candidato 2: ${solver.cand2.percent}%</div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${solver.cand2.hex};"></div>
          <span style="font-size: 0.74rem; font-weight: 600; color: #fff;">${solver.cand2.name}</span>
        </div>
      `;
    }

    const compBox = document.getElementById('florentComplementBox');
    if (compBox) {
      compBox.innerHTML = `
        <div style="font-size: 0.72rem; font-weight: 600; color: #F59E0B;">Neutralizador Óptico Complementario:</div>
        <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${solver.complement.hex};"></div>
          <span style="font-size: 0.74rem; color: #fff;">${solver.complement.name} (${solver.complement.ci})</span>
        </div>
      `;
    }

    const valNote = document.getElementById('florentValueNote');
    if (valNote) valNote.innerHTML = `<strong>Ajuste de Valor:</strong> ${solver.valueAdvice}`;

    const behNote = document.getElementById('florentBehaviorNote');
    if (behNote) behNote.textContent = solver.behaviorNote;

    // Refresh dynamic tailored workshop palette for active color
    this.renderFlorentWorkshopPalette(curRgb);
    this.renderFlorentTransitionComparator();
  }


  // --- MASTER PAINTERS GALLERY & MULTI-CATALOG STUDIO ---

  _bindMasterPainters() {
    this._initMasterCatalogs();
    this._bindMasterLightboxModal();
    this._bindAddArtworkModal();
    this.renderMasterPainters();
  }

  _initMasterCatalogs() {
    const catalogSelect = document.getElementById('masterCatalogSelect');
    const btnNewCatalog = document.getElementById('btnNewCatalog');
    const btnDeleteCatalog = document.getElementById('btnDeleteCatalog');
    const btnAddArtwork = document.getElementById('btnAddArtworkTrigger');

    if (!catalogSelect) return;

    // Populate catalog options
    const catalogs = this.masterCatalogManager.getCatalogs();
    catalogSelect.innerHTML = '';
    catalogs.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon || '📁'} ${cat.name}`;
      if (cat.id === this.activeMasterCatalog) opt.selected = true;
      catalogSelect.appendChild(opt);
    });

    catalogSelect.onchange = (e) => {
      this.activeMasterCatalog = e.target.value;
      this.renderMasterPainters();
    };

    if (btnNewCatalog) {
      btnNewCatalog.onclick = () => {
        const modal = document.getElementById('newCatalogModal');
        if (modal) modal.style.display = 'flex';
      };
    }

    if (btnDeleteCatalog) {
      btnDeleteCatalog.onclick = () => {
        if (confirm('¿Estás seguro de que deseas eliminar este catálogo personalizado y sus obras?')) {
          this.masterCatalogManager.deleteCatalog(this.activeMasterCatalog);
          this.activeMasterCatalog = 'all';
          this._initMasterCatalogs();
          this.renderMasterPainters();
          this.showToast('Catálogo eliminado correctamente');
        }
      };
    }

    if (btnAddArtwork) {
      btnAddArtwork.onclick = () => {
        const modal = document.getElementById('addArtworkModal');
        if (modal) modal.style.display = 'flex';
      };
    }

    // Bind New Catalog Modal Buttons
    const btnCloseNewCat = document.getElementById('btnCloseNewCatModal');
    const btnCancelNewCat = document.getElementById('btnCancelNewCat');
    const btnConfirmCreateCat = document.getElementById('btnConfirmCreateCat');
    const newCatModal = document.getElementById('newCatalogModal');

    const closeNewCat = () => { if (newCatModal) newCatModal.style.display = 'none'; };
    if (btnCloseNewCat) btnCloseNewCat.onclick = closeNewCat;
    if (btnCancelNewCat) btnCancelNewCat.onclick = closeNewCat;

    if (btnConfirmCreateCat) {
      btnConfirmCreateCat.onclick = () => {
        const nameInput = document.getElementById('newCatNameInput');
        const descInput = document.getElementById('newCatDescInput');
        const name = (nameInput?.value || '').trim();
        const desc = (descInput?.value || '').trim();

        if (!name) {
          this.showToast('Por favor introduce un nombre para el catálogo', 'warn');
          return;
        }

        const newCat = this.masterCatalogManager.createCatalog(name, desc);
        this.activeMasterCatalog = newCat.id;
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        closeNewCat();
        this._initMasterCatalogs();
        this.renderMasterPainters();
        this.showToast(`Catálogo '${name}' creado con éxito`);
      };
    }
  }

  renderMasterPainters() {
    const container = document.getElementById('paintersGrid');
    const descEl = document.getElementById('masterCatalogDescription');
    const btnDelete = document.getElementById('btnDeleteCatalog');
    if (!container) return;
    container.innerHTML = '';

    const catalogs = this.masterCatalogManager.getCatalogs();
    const activeCat = catalogs.find(c => c.id === this.activeMasterCatalog) || catalogs[0];

    if (descEl && activeCat) {
      descEl.innerHTML = `<strong>${activeCat.name}:</strong> ${activeCat.description} • <em>Haz clic en cualquier obra para abrir el Visor a Pantalla Completa con cuentagotas en tiempo real.</em>`;
    }

    // Only allow deletion for custom user catalogs (not built-in ones)
    const isCustom = this.masterCatalogManager.customCatalogs.some(c => c.id === this.activeMasterCatalog);
    if (btnDelete) {
      btnDelete.style.display = isCustom ? 'inline-flex' : 'none';
    }

    const artworks = this.masterCatalogManager.getArtworksByCatalog(this.activeMasterCatalog);

    if (artworks.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.style.gridColumn = '1 / -1';
      emptyBox.style.padding = '40px 20px';
      emptyBox.style.textAlign = 'center';
      emptyBox.style.background = 'rgba(0,0,0,0.2)';
      emptyBox.style.borderRadius = '8px';
      emptyBox.style.border = '1px dashed var(--border-subtle)';
      emptyBox.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 8px;">🎨</div>
        <div style="font-size: 0.9rem; font-weight: 600; color: #FFFFFF;">Este catálogo está vacío</div>
        <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">Usa el botón "Añadir Obra" para incluir tus propias pinturas o referencias de color.</div>
      `;
      container.appendChild(emptyBox);
      return;
    }

    artworks.forEach(p => {
      const card = document.createElement('div');
      card.className = 'painter-card';

      // Header with visual preview image and full-screen hint
      const header = document.createElement('div');
      header.className = 'painter-artwork-header';
      if (p.image) {
        header.style.backgroundImage = `url(${p.image})`;
      } else {
        header.style.background = `linear-gradient(135deg, ${p.colors[0]?.hex || '#1a1a24'}, ${p.colors[1]?.hex || '#333'})`;
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'painter-artwork-overlay';
      overlay.innerHTML = `
        <span class="painter-overlay-hint">
          <span>🔍</span> Pantalla Completa & Cuentagotas
        </span>
      `;
      header.appendChild(overlay);

      // Clicking artwork header opens full-screen lightbox modal
      header.addEventListener('click', () => {
        this.openMasterViewerModal(p);
      });

      const meta = document.createElement('div');
      meta.className = 'painter-meta';

      const headerRow = document.createElement('div');
      headerRow.className = 'painter-header-row';

      const name = document.createElement('div');
      name.className = 'painter-name';
      name.textContent = p.artist;

      const tag = document.createElement('span');
      tag.className = 'painter-movement-tag';
      tag.textContent = p.movement || 'Maestro Clásico';

      headerRow.appendChild(name);
      headerRow.appendChild(tag);

      const title = document.createElement('div');
      title.className = 'painter-artwork-title';
      title.textContent = `${p.title} (${p.year || ''})`;

      const desc = document.createElement('div');
      desc.className = 'painter-description';
      desc.textContent = p.description;

      const strip = document.createElement('div');
      strip.className = 'painter-palette-strip';

      p.colors.forEach(col => {
        const baseRgb = ColorMath.hexToRgb(col.hex);
        const isAtmo = AtmosphereEngine.state.enabled;
        const dispRgb = isAtmo ? AtmosphereEngine.transformColor(baseRgb) : baseRgb;
        const dispHex = ColorMath.rgbToHex(dispRgb.r, dispRgb.g, dispRgb.b);

        const sw = document.createElement('div');
        sw.className = 'painter-swatch';
        sw.style.backgroundColor = dispHex;
        sw.dataset.swatchHex = dispHex;
        sw.dataset.swatchLabel = `${col.name} (${col.role || ''})`;
        sw.draggable = true;
        sw.title = `${col.name} (${col.hex}) • Click para seleccionar`;
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setColorDirectly(baseRgb);
          this.showToast(`Color seleccionado: ${col.name} (${dispHex})`);
        });
        strip.appendChild(sw);
      });

      // Actions row
      const actionsRow = document.createElement('div');
      actionsRow.style.display = 'flex';
      actionsRow.style.justifyContent = 'space-between';
      actionsRow.style.alignItems = 'center';
      actionsRow.style.marginTop = '8px';

      const btnSave = document.createElement('button');
      btnSave.className = 'tool-action-btn';
      btnSave.style.padding = '4px 8px';
      btnSave.style.fontSize = '0.72rem';
      btnSave.innerHTML = `<span>📥</span> Guardar Muestras`;
      btnSave.addEventListener('click', (e) => {
        e.stopPropagation();
        this.swatchManager.addPalette(p.title, p.colors.map(c => c.hex));
        this.renderSwatchesCollection();
        this.showToast(`Paleta '${p.title}' guardada en tu biblioteca`);
      });

      const btnExportMaster = document.createElement('button');
      btnExportMaster.className = 'tool-action-btn';
      btnExportMaster.style.padding = '4px 8px';
      btnExportMaster.style.fontSize = '0.72rem';
      btnExportMaster.innerHTML = `<span>🖼️</span> Lámina`;
      btnExportMaster.title = `Exportar lámina cromática de estudio de "${p.title}"`;
      btnExportMaster.addEventListener('click', (e) => {
        e.stopPropagation();
        SwatchSheetExporter.openExportModal(
          `${p.title} (${p.artist}, ${p.year || ''})`,
          p.colors,
          this,
          {
            template: 'fine_art_atelier',
            theme: 'paper',
            subtitle: `ESTUDIO DE GRAN MAESTRO: ${p.artist.toUpperCase()} • ${p.movement?.toUpperCase() || ''}`
          }
        );
      });

      const leftActions = document.createElement('div');
      leftActions.style.display = 'flex';
      leftActions.style.gap = '6px';
      leftActions.appendChild(btnExportMaster);
      leftActions.appendChild(btnSave);
      actionsRow.appendChild(leftActions);

      // If custom artwork, allow deletion
      if (p.isCustom) {
        const btnDelArt = document.createElement('button');
        btnDelArt.className = 'history-btn-action danger';
        btnDelArt.style.fontSize = '0.7rem';
        btnDelArt.style.padding = '3px 6px';
        btnDelArt.title = 'Eliminar esta obra del catálogo';
        btnDelArt.innerHTML = `<span>🗑️</span>`;
        btnDelArt.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar obra "${p.title}"?`)) {
            this.masterCatalogManager.deleteArtwork(p.id);
            this.renderMasterPainters();
            this.showToast('Obra eliminada del catálogo');
          }
        });
        actionsRow.appendChild(btnDelArt);
      }

      meta.appendChild(headerRow);
      meta.appendChild(title);
      meta.appendChild(desc);
      meta.appendChild(strip);
      meta.appendChild(actionsRow);

      card.appendChild(header);
      card.appendChild(meta);
      container.appendChild(card);
    });
  }

  // --- FULL-SCREEN MASTER VIEWER LIGHTBOX MODAL ---

  _bindMasterLightboxModal() {
    const modal = document.getElementById('masterViewerModal');
    const btnClose = document.getElementById('btnCloseMasterModal');

    if (!modal) return;

    const closeModal = () => {
      modal.style.display = 'none';
    };

    if (btnClose) btnClose.onclick = closeModal;

    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });
  }

  openMasterViewerModal(artwork) {
    const modal = document.getElementById('masterViewerModal');
    if (!modal) return;

    // Fill textual metadata
    const titleHeader = document.getElementById('modalArtworkTitleHeader');
    const titleEl = document.getElementById('modalArtworkTitle');
    const artistEl = document.getElementById('modalArtworkArtist');
    const yearEl = document.getElementById('modalArtworkYear');
    const movementEl = document.getElementById('modalArtworkMovement');
    const descEl = document.getElementById('modalArtworkDesc');
    const pigmentsEl = document.getElementById('modalArtworkPigments');
    const techniqueEl = document.getElementById('modalArtworkTechnique');
    const tipEl = document.getElementById('modalArtworkTip');

    if (titleHeader) titleHeader.textContent = artwork.title;
    if (titleEl) titleEl.textContent = artwork.title;
    if (artistEl) artistEl.textContent = artwork.artist;
    if (yearEl) yearEl.textContent = artwork.year ? `(${artwork.year})` : '';
    if (movementEl) movementEl.textContent = artwork.movement || 'Arte Histórico';
    if (descEl) descEl.textContent = artwork.description || '';
    if (pigmentsEl) pigmentsEl.textContent = artwork.pigmentsUsed || 'Pigmentos tradicionales de caballete.';
    if (techniqueEl) techniqueEl.textContent = artwork.technique || 'Estudio de armonía y claroscuro.';
    if (tipEl) tipEl.textContent = artwork.digitalTip || 'Aplica estos valores cromáticos en tus composiciones.';

    // Render palette swatches
    const grid = document.getElementById('modalPaletteGrid');
    if (grid) {
      grid.innerHTML = '';
      artwork.colors.forEach(col => {
        const baseRgb = ColorMath.hexToRgb(col.hex);
        const cell = document.createElement('div');
        cell.className = 'modal-swatch-cell';
        cell.style.backgroundColor = col.hex;
        cell.title = `${col.name} (${col.hex}) • Click para seleccionar`;
        cell.innerHTML = `<span class="modal-swatch-hex">${col.hex}</span>`;
        cell.onclick = () => {
          this.setColorDirectly(baseRgb);
          this.showToast(`Muestra seleccionada: ${col.name} (${col.hex})`);
        };
        grid.appendChild(cell);
      });
    }

    const btnSaveModal = document.getElementById('btnModalSavePalette');
    if (btnSaveModal) {
      btnSaveModal.onclick = () => {
        this.swatchManager.addPalette(artwork.title, artwork.colors.map(c => c.hex));
        this.renderSwatchesCollection();
        this.showToast(`Paleta de '${artwork.title}' guardada en Bibliotecas`);
      };
    }

    const btnExportSheetModal = document.getElementById('btnModalExportSheet');
    if (btnExportSheetModal) {
      btnExportSheetModal.onclick = () => {
        SwatchSheetExporter.openExportModal(
          `${artwork.title} (${artwork.artist}, ${artwork.year || ''})`,
          artwork.colors,
          this,
          {
            template: 'fine_art_atelier',
            theme: 'paper',
            subtitle: `ESTUDIO DE GRAN MAESTRO: ${artwork.artist.toUpperCase()} • ${artwork.movement?.toUpperCase() || ''}`
          }
        );
      };
    }

    // Draw high-resolution canvas with live eyedropper
    const canvas = document.getElementById('modalArtworkCanvas');
    const badge = document.getElementById('modalEyedropperBadge');
    const badgeDot = document.getElementById('modalEyedropperDot');
    const badgeHex = document.getElementById('modalEyedropperHex');

    if (canvas && artwork.image) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxW = 560;
        const maxH = 460;
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        canvas.width = Math.round(img.naturalWidth * ratio);
        canvas.height = Math.round(img.naturalHeight * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = artwork.image;

      // Eyedropper on hover
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = ColorMath.rgbToHex(pixel[0], pixel[1], pixel[2]);
          if (badgeHex) badgeHex.textContent = hex;
          if (badgeDot) badgeDot.style.backgroundColor = hex;
          if (badge) badge.style.display = 'flex';
        }
      };

      canvas.onmouseleave = () => {
        if (badge) badge.style.display = 'none';
      };

      // Eyedropper on click
      canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
          this.setColorDirectly(rgb);
          this.showToast(`Cuentagotas: ${ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b)}`);
        }
      };
    }

    modal.style.display = 'flex';
  }

  // --- ADD CUSTOM ARTWORK MODAL ---

  _bindAddArtworkModal() {
    const modal = document.getElementById('addArtworkModal');
    const btnClose = document.getElementById('btnCloseAddArtModal');
    const btnCancel = document.getElementById('btnCancelAddArt');
    const btnSave = document.getElementById('btnSaveAddArt');
    const dropZone = document.getElementById('addArtDropZone');
    const fileInput = document.getElementById('addArtFileInput');
    const previewContainer = document.getElementById('addArtPreviewContainer');
    const previewImg = document.getElementById('addArtPreviewImg');
    const strip = document.getElementById('addArtPalettePreviewStrip');

    if (!modal) return;

    let pendingArtworkData = {
      image: '',
      colors: []
    };

    const closeModal = () => {
      modal.style.display = 'none';
    };

    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    const processFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        pendingArtworkData.image = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
        if (previewContainer) previewContainer.style.display = 'block';

        // Auto extract 6 colors with K-Means
        try {
          const item = await this.imageExtractor.processSingleImageFile(file, 6, 'dominant');
          pendingArtworkData.colors = item.palette.map((p, idx) => ({
            hex: p.hex,
            name: `Color ${idx + 1}`,
            role: 'Extracción K-Means'
          }));

          if (strip) {
            strip.innerHTML = '';
            pendingArtworkData.colors.forEach(c => {
              const d = document.createElement('div');
              d.style.flex = '1';
              d.style.backgroundColor = c.hex;
              strip.appendChild(d);
            });
          }
        } catch (err) {
          console.warn('Auto extraction error', err);
        }
      };
      reader.readAsDataURL(file);
    };

    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
      };
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
      dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
      };
    }

    if (btnSave) {
      btnSave.onclick = () => {
        const title = (document.getElementById('addArtTitleInput')?.value || '').trim();
        const artist = (document.getElementById('addArtArtistInput')?.value || '').trim();
        const year = (document.getElementById('addArtYearInput')?.value || '').trim();
        const movement = (document.getElementById('addArtMovementInput')?.value || '').trim();
        const desc = (document.getElementById('addArtDescInput')?.value || '').trim();

        if (!title || !artist) {
          this.showToast('Por favor introduce Título y Artista', 'warn');
          return;
        }

        if (!pendingArtworkData.image) {
          this.showToast('Por favor selecciona una imagen para la obra', 'warn');
          return;
        }

        // Determine destination catalog: if current is custom use it, otherwise find or create custom catalog
        let targetCatId = this.activeMasterCatalog;
        const isCustomCat = this.masterCatalogManager.customCatalogs.some(c => c.id === targetCatId);
        if (!isCustomCat) {
          // If in built-in catalog, assign to first custom or create one
          if (this.masterCatalogManager.customCatalogs.length === 0) {
            const newCat = this.masterCatalogManager.createCatalog('Mis Obras & Referencias', 'Catálogo personal de usuario.');
            targetCatId = newCat.id;
          } else {
            targetCatId = this.masterCatalogManager.customCatalogs[0].id;
          }
          this.activeMasterCatalog = targetCatId;
          this._initMasterCatalogs();
        }

        this.masterCatalogManager.addArtworkToCatalog(targetCatId, {
          title,
          artist,
          year,
          movement,
          description: desc || 'Obra añadida por el usuario.',
          image: pendingArtworkData.image,
          colors: pendingArtworkData.colors.length > 0 ? pendingArtworkData.colors : [
            { hex: '#333333', name: 'Base' },
            { hex: '#888888', name: 'Medio' },
            { hex: '#DDDDDD', name: 'Luz' }
          ]
        });

        // Reset form
        document.getElementById('addArtTitleInput').value = '';
        document.getElementById('addArtArtistInput').value = '';
        document.getElementById('addArtYearInput').value = '';
        document.getElementById('addArtMovementInput').value = '';
        document.getElementById('addArtDescInput').value = '';
        if (previewContainer) previewContainer.style.display = 'none';
        pendingArtworkData = { image: '', colors: [] };

        closeModal();
        this.renderMasterPainters();
        this.showToast(`Obra "${title}" guardada en tu catálogo`);
      };
    }
  }

  // --- EXTRACTOR K-MEANS MULTI-IMAGEN & CARPETA COMPLETA EN LOTE ---

  _bindImageExtractor() {
    const dropArea = document.getElementById('imageDropArea');
    const fileInput = document.getElementById('imageFileInput');
    const folderInput = document.getElementById('batchFolderInput');
    const btnSelectBatch = document.getElementById('btnSelectBatchFiles');
    const btnSelectFolder = document.getElementById('btnSelectFolder');
    const extractCanvas = document.getElementById('extractCanvas');
    const btnExtract = document.getElementById('btnExtractAction');
    const btnSaveExtracted = document.getElementById('btnSaveExtracted');

    const btnBatchSelectAll = document.getElementById('btnBatchSelectAll');
    const btnBatchDeselectAll = document.getElementById('btnBatchDeselectAll');
    const btnBatchAddMore = document.getElementById('btnBatchAddMore');
    const btnBatchClear = document.getElementById('btnBatchClear');
    const btnSaveMasterPalette = document.getElementById('btnSaveMasterBatchPalette');

    const btnMonet = document.getElementById('btnSampleMonet');
    const btnVanGogh = document.getElementById('btnSampleVanGogh');
    const btnRembrandt = document.getElementById('btnSampleRembrandt');

    if (btnMonet) btnMonet.addEventListener('click', () => this.loadSampleImage('assets/samples/monet.png'));
    if (btnVanGogh) btnVanGogh.addEventListener('click', () => this.loadSampleImage('assets/samples/vangogh.png'));
    if (btnRembrandt) btnRembrandt.addEventListener('click', () => this.loadSampleImage('assets/samples/rembrandt.png'));

    if (btnSelectBatch && fileInput) {
      btnSelectBatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isAppendBatchMode = false;
        fileInput.click();
      });
    }

    // FOLDER LOADING: Primary mechanism window.showDirectoryPicker() with recursive search, fallback to webkitdirectory
    const pickFolderHandler = async () => {
      this.isAppendBatchMode = false;
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          const files = [];

          async function getFilesRecursively(handle) {
            for await (const entry of handle.values()) {
              if (entry.kind === 'file') {
                try {
                  const file = await entry.getFile();
                  if (file.type ? file.type.startsWith('image/') : /\.(jpe?g|png|webp|svg|bmp|gif)$/i.test(file.name)) {
                    files.push(file);
                  }
                } catch (e) {
                  console.warn('Error reading file from dir', e);
                }
              } else if (entry.kind === 'directory') {
                await getFilesRecursively(entry);
              }
            }
          }

          this.showToast('Explorando carpeta seleccionada...', 'info');
          await getFilesRecursively(dirHandle);

          if (files.length > 0) {
            this.handleImageFiles(files, false);
          } else {
            this.showToast('No se encontraron archivos de imagen en la carpeta', 'warn');
          }
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User closed picker
          console.warn('showDirectoryPicker failed, falling back to input:', err);
        }
      }

      // Fallback
      if (folderInput) {
        folderInput.value = '';
        folderInput.click();
      }
    };

    if (btnSelectFolder) {
      btnSelectFolder.addEventListener('click', (e) => {
        e.stopPropagation();
        pickFolderHandler();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleImageFiles(e.target.files, this.isAppendBatchMode);
        }
      });
    }

    if (folderInput) {
      folderInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleImageFiles(e.target.files, this.isAppendBatchMode);
        }
      });
    }

    // Drag and Drop supporting both individual files and entire directories
    if (dropArea) {
      dropArea.addEventListener('click', () => {
        this.isAppendBatchMode = false;
        fileInput.click();
      });
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
      });
      dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
      dropArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');

        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
          const files = [];

          const traverseEntry = (entry) => {
            return new Promise((resolve) => {
              if (entry.isFile) {
                entry.file(f => {
                  if (f.type ? f.type.startsWith('image/') : /\.(jpe?g|png|webp|svg|bmp|gif)$/i.test(f.name)) {
                    files.push(f);
                  }
                  resolve();
                }, () => resolve());
              } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                dirReader.readEntries(async (entries) => {
                  for (const ent of entries) {
                    await traverseEntry(ent);
                  }
                  resolve();
                }, () => resolve());
              } else {
                resolve();
              }
            });
          };

          const entriesToWait = [];
          for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
            if (entry) {
              entriesToWait.push(traverseEntry(entry));
            }
          }

          if (entriesToWait.length > 0) {
            await Promise.all(entriesToWait);
            if (files.length > 0) {
              this.handleImageFiles(files, false);
              return;
            }
          }
        }

        // Direct files fallback
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleImageFiles(e.dataTransfer.files, false);
        }
      });
    }

    // Canvas Live Eyedropper
    if (extractCanvas) {
      extractCanvas.addEventListener('click', (e) => {
        const rect = extractCanvas.getBoundingClientRect();
        const scaleX = extractCanvas.width / rect.width;
        const scaleY = extractCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const sampled = this.imageExtractor.getColorAt(x, y);
        if (sampled) {
          this.setColorDirectly(sampled.rgb);
          this.showToast(`Cuentagotas: ${sampled.hex}`);
        }
      });
    }

    const countSelect = document.getElementById('extractCountSelect');
    const filterSelect = document.getElementById('extractFilterSelect');
    const sortSelect = document.getElementById('extractSortSelect');

    if (countSelect) {
      countSelect.addEventListener('change', () => this.runImageExtraction());
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        this.runImageExtraction();
        const filterNames = {
          dominant: 'Dominantes (Frecuencia)',
          vibrant: 'Vibrantes / Saturados',
          pastel: 'Pasteles / Claros',
          dark: 'Sombras / Profundos',
          contrast: 'Alto Contraste Tonal',
          flesh: 'Tonos de Piel (Carnaciones / Retrato)',
          warm: 'Cálidos / Solares',
          cool: 'Fríos / Sombras Celestes'
        };
        this.showToast(`Filtro K-Means: ${filterNames[filterSelect.value] || filterSelect.value}`, 'info');
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value;
        if (this.imageExtractor && this.imageExtractor.extractedColors.length > 0) {
          const sorted = this.imageExtractor.sortExtracted(this.imageExtractor.extractedColors, sortBy);
          this.renderExtractedPalette(sorted);
          this.showToast(`Ordenado por: ${sortSelect.options[sortSelect.selectedIndex]?.text || sortBy}`, 'info');
        } else {
          this.runImageExtraction();
        }
      });
    }

    if (btnExtract) {
      btnExtract.addEventListener('click', () => this.runImageExtraction());
    }

    if (btnSaveExtracted) {
      btnSaveExtracted.addEventListener('click', () => {
        if (this.imageExtractor && this.imageExtractor.extractedColors.length > 0) {
          const hexes = this.imageExtractor.extractedColors.map(c => c.hex);
          const filterVal = filterSelect ? filterSelect.options[filterSelect.selectedIndex]?.text.split('(')[0].trim() : 'K-Means';
          const palName = `Paleta ${filterVal} (${hexes.length} colores)`;
          this.swatchManager.addPalette(palName, hexes);
          this.renderSwatchesCollection();
          this.showToast(`Paleta guardada en Bibliotecas como "${palName}"`, 'success');
        } else {
          this.showToast('Primero extrae una paleta de la imagen', 'warn');
        }
      });
    }

    // Suite Integrations from Extractor
    const btnTo4D = document.getElementById('btnExtractorToHyper4D');
    if (btnTo4D) {
      btnTo4D.addEventListener('click', () => {
        if (!this.imageExtractor || this.imageExtractor.extractedColors.length === 0) {
          this.showToast('Primero extrae una paleta de la imagen activa', 'warn');
          return;
        }
        const hexes = this.imageExtractor.extractedColors.map(c => c.hex);
        if (this.hyper4dStudio) {
          this.hyper4dStudio.compareSlots = hexes.slice(0, 8).map((hex, i) => ({
            id: String.fromCharCode(65 + i),
            name: `Muestra ${String.fromCharCode(65 + i)}`,
            hex: hex.toUpperCase(),
            rgb: ColorMath.hexToRgb(hex),
            active: true
          }));
          this.hyper4dStudio.renderCompareSlots();
          this.switchTab('hyper4d');
          this.hyper4dStudio.setDeploymentMode('compare');
          this.hyper4dStudio.frameAll();
          this.showToast('🔮 Paleta extraída proyectada en Hiperespacio 4D (Comparador y Constelación)', 'success');
        }
      });
    }

    const btnToFlorent = document.getElementById('btnExtractorToFlorent');
    if (btnToFlorent) {
      btnToFlorent.addEventListener('click', () => {
        if (!this.imageExtractor || this.imageExtractor.extractedColors.length === 0) {
          this.showToast('Primero extrae una paleta de la imagen activa', 'warn');
          return;
        }
        const colors = this.imageExtractor.extractedColors.slice(0, 7);
        if (typeof FlorentFargesEngine !== 'undefined') {
          FlorentFargesEngine.setTransitionStops(colors.map((c, i) => ({
            id: `extract_${i}`,
            name: `Color ${i + 1}`,
            hex: c.hex.toUpperCase(),
            rgb: c.rgb
          })));
          this.switchTab('florent');
          if (this.renderFlorentTransitionComparator) {
            this.renderFlorentTransitionComparator();
          }
          this.showToast('👨‍🎨 Muestras enviadas a la Curva de Transición Florent Farges', 'success');
        }
      });
    }

    const btnToRamps = document.getElementById('btnExtractorToRamps');
    if (btnToRamps) {
      btnToRamps.addEventListener('click', () => {
        if (!this.imageExtractor || this.imageExtractor.extractedColors.length === 0) {
          this.showToast('Primero extrae una paleta de la imagen activa', 'warn');
          return;
        }
        const colors = this.imageExtractor.extractedColors;
        if (colors.length >= 2) {
          const sortedByLum = [...colors].sort((a, b) => a.luminance - b.luminance);
          const c1 = sortedByLum[0];
          const c2 = sortedByLum[sortedByLum.length - 1];
          this.fgColor = { ...c1.rgb, hex: c1.hex };
          this.bgColor = { ...c2.rgb, hex: c2.hex };
          this.syncDisplay();
          this.switchTab('ramps');
          this.renderRampStudio();
          this.showToast('📐 Rampa tonal OKLCH creada con los extremos de la paleta', 'success');
        }
      });
    }

    const btnToMixer = document.getElementById('btnExtractorToWetMixer');
    if (btnToMixer) {
      btnToMixer.addEventListener('click', () => {
        if (!this.imageExtractor || this.imageExtractor.extractedColors.length === 0) {
          this.showToast('Primero extrae una paleta de la imagen activa', 'warn');
          return;
        }
        if (!this.wetMixer) this._initWetMixer();
        const colors = this.imageExtractor.extractedColors;
        const count = colors.length;
        const step = this.wetMixer.width / (count + 1);
        colors.forEach((c, idx) => {
          const x = step * (idx + 1);
          const y = this.wetMixer.height * 0.58;
          this.wetMixer.depositDab(x, y, c.rgb, 36);
        });
        this.switchTab('wetmixer');
        this.showToast(`🖌️ ${count} manchas depositadas en el Lienzo de Mezcla`, 'success');
      });
    }

    // Smart Palette Harmonizer & Quality Scoring controls
    const optModeSelect = document.getElementById('optimizerModeSelect');
    const optSlider = document.getElementById('optimizerIntensitySlider');
    const optVal = document.getElementById('optimizerIntensityVal');
    const btnAutoOpt = document.getElementById('btnRunAutoOptimize');
    const btnApplyOpt = document.getElementById('btnApplyOptimizedPalette');

    if (optModeSelect) {
      optModeSelect.addEventListener('change', () => this.updateOptimizerPreview());
    }

    if (optSlider) {
      optSlider.addEventListener('input', (e) => {
        if (optVal) optVal.textContent = `${e.target.value}%`;
        this.updateOptimizerPreview();
      });
    }

    if (btnAutoOpt) {
      btnAutoOpt.addEventListener('click', () => this.runAutoMasterOptimization());
    }

    if (btnApplyOpt) {
      btnApplyOpt.addEventListener('click', () => this.applyOptimizedPalette());
    }

    // Batch Management Buttons
    if (btnBatchSelectAll) {
      btnBatchSelectAll.onclick = () => {
        this.batchItems.forEach(it => { it.selected = true; });
        this.renderBatchThumbnails();
        this.updateBatchComparativeStats();
      };
    }

    if (btnBatchDeselectAll) {
      btnBatchDeselectAll.onclick = () => {
        this.batchItems.forEach(it => { it.selected = false; });
        this.renderBatchThumbnails();
        this.updateBatchComparativeStats();
      };
    }

    if (btnBatchAddMore) {
      btnBatchAddMore.onclick = () => {
        this.isAppendBatchMode = true;
        if (fileInput) fileInput.click();
      };
    }

    if (btnBatchClear) {
      btnBatchClear.onclick = () => {
        this.batchItems = [];
        const batchSection = document.getElementById('batchManagementSection');
        if (batchSection) batchSection.style.display = 'none';
        this.showToast('Lote limpiado');
      };
    }

    if (btnSaveMasterPalette) {
      btnSaveMasterPalette.onclick = () => {
        if (this.lastBatchMetrics && this.lastBatchMetrics.masterPalette && this.lastBatchMetrics.masterPalette.length > 0) {
          const hexes = this.lastBatchMetrics.masterPalette.map(p => p.hex);
          this.swatchManager.addPalette(`Paleta Síntesis Lote (${hexes.length} colores)`, hexes);
          this.renderSwatchesCollection();
          this.showToast('Paleta Maestra Consolidada guardada en Bibliotecas');
        } else {
          this.showToast('No hay paleta consolidada generada', 'warn');
        }
      };
    }
  }

  async handleImageFiles(filesList, append = false) {
    const validFiles = Array.from(filesList).filter(f => f.type ? f.type.startsWith('image/') : /\.(jpe?g|png|webp|svg|bmp|gif)$/i.test(f.name));

    if (validFiles.length === 0) {
      this.showToast('No se encontraron imágenes válidas para procesar', 'warn');
      return;
    }

    const count = parseInt(document.getElementById('extractCountSelect')?.value || '6', 10);
    const filter = document.getElementById('extractFilterSelect')?.value || 'dominant';

    if (!append) {
      this.batchItems = [];
    }

    this.showToast(`Procesando ${validFiles.length} imágenes con K-Means...`, 'info');

    // Process each image file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const item = await this.imageExtractor.processSingleImageFile(file, count, filter);
        this.batchItems.push(item);
      } catch (err) {
        console.warn(`Error processing ${file.name}`, err);
      }
    }

    if (this.batchItems.length === 0) return;

    // Load first image on active canvas
    const firstItem = this.batchItems[0];
    await this.imageExtractor.loadImage(firstItem.dataUrl);
    this.runImageExtraction();

    const batchSection = document.getElementById('batchManagementSection');

    if (this.batchItems.length > 1) {
      if (batchSection) batchSection.style.display = 'block';
      this.renderBatchThumbnails();
      this.updateBatchComparativeStats();
      this.showToast(`Lote activo: ${this.batchItems.length} imágenes procesadas con éxito`);
    } else {
      if (batchSection) batchSection.style.display = 'none';
      this.showToast(`Imagen ${firstItem.name} cargada`);
    }
  }

  renderBatchThumbnails() {
    const list = document.getElementById('batchThumbnailsList');
    if (!list) return;
    list.innerHTML = '';

    this.batchItems.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = `batch-item-card ${it.selected ? 'selected' : ''}`;

      // Top bar with checkbox, filename, and delete button
      const topbar = document.createElement('div');
      topbar.className = 'batch-item-topbar';

      const leftGroup = document.createElement('div');
      leftGroup.style.display = 'flex';
      leftGroup.style.alignItems = 'center';
      leftGroup.style.gap = '6px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'batch-item-checkbox';
      checkbox.checked = it.selected !== false;
      checkbox.onchange = () => {
        it.selected = checkbox.checked;
        card.classList.toggle('selected', it.selected);
        this.updateBatchComparativeStats();
      };

      const name = document.createElement('span');
      name.className = 'batch-item-name';
      name.textContent = it.name;
      name.title = it.name;

      leftGroup.appendChild(checkbox);
      leftGroup.appendChild(name);

      const btnDelete = document.createElement('button');
      btnDelete.className = 'batch-item-delete';
      btnDelete.innerHTML = '✕';
      btnDelete.title = 'Eliminar del lote';
      btnDelete.onclick = (e) => {
        e.stopPropagation();
        this.batchItems.splice(idx, 1);
        if (this.batchItems.length <= 1) {
          const batchSection = document.getElementById('batchManagementSection');
          if (batchSection) batchSection.style.display = 'none';
        }
        this.renderBatchThumbnails();
        this.updateBatchComparativeStats();
      };

      topbar.appendChild(leftGroup);
      topbar.appendChild(btnDelete);

      // Thumbnail preview - clicking loads onto canvas
      const thumb = document.createElement('div');
      thumb.className = 'batch-item-thumb';
      thumb.style.backgroundImage = `url(${it.dataUrl})`;
      thumb.title = `Click para ver y muestrear: ${it.name}`;
      thumb.onclick = async () => {
        await this.imageExtractor.loadImage(it.dataUrl);
        this.runImageExtraction();
        this.showToast(`Cargada en lienzo: ${it.name}`);
      };

      // Mini Palette strip
      const strip = document.createElement('div');
      strip.className = 'batch-item-strip';
      if (it.palette) {
        it.palette.forEach(p => {
          const sw = document.createElement('div');
          sw.style.flex = '1';
          sw.style.backgroundColor = p.hex;
          strip.appendChild(sw);
        });
      }

      // Stats row
      const statsRow = document.createElement('div');
      statsRow.className = 'batch-item-stats-row';
      statsRow.innerHTML = `
        <span>${it.stats.keyType}</span>
        <span>☀️${it.stats.warmPct}% • ❄️${it.stats.coolPct}%</span>
      `;

      card.appendChild(topbar);
      card.appendChild(thumb);
      card.appendChild(strip);
      card.appendChild(statsRow);
      list.appendChild(card);
    });
  }

  updateBatchComparativeStats() {
    const count = parseInt(document.getElementById('extractCountSelect')?.value || '6', 10);
    const metrics = this.imageExtractor.calculateBatchMetrics(this.batchItems, count);
    this.lastBatchMetrics = metrics;

    const badge = document.getElementById('batchCountBadge');
    if (badge) badge.textContent = `${metrics.selectedCount} seleccionadas de ${metrics.totalCount}`;

    const label = document.getElementById('batchMetricsSelectionLabel');
    if (label) label.textContent = `${metrics.selectedCount} imágenes activas en el cálculo`;

    // Thermal balance
    const statWarm = document.getElementById('statWarmPct');
    const statCool = document.getElementById('statCoolPct');
    const barWarm = document.getElementById('barWarm');
    const barCool = document.getElementById('barCool');

    if (statWarm) statWarm.textContent = `${metrics.warmPct}%`;
    if (statCool) statCool.textContent = `${metrics.coolPct}%`;
    if (barWarm) barWarm.style.width = `${metrics.warmPct}%`;
    if (barCool) barCool.style.width = `${metrics.coolPct}%`;

    // Tonal keys
    const statHigh = document.getElementById('statHighKey');
    const statMid = document.getElementById('statMidKey');
    const statLow = document.getElementById('statLowKey');
    const barHigh = document.getElementById('barHighKey');
    const barMid = document.getElementById('barMidKey');
    const barLow = document.getElementById('barLowKey');

    if (statHigh) statHigh.textContent = `${metrics.highKeyPct}%`;
    if (statMid) statMid.textContent = `${metrics.midKeyPct}%`;
    if (statLow) statLow.textContent = `${metrics.lowKeyPct}%`;
    if (barHigh) barHigh.style.width = `${metrics.highKeyPct}%`;
    if (barMid) barMid.style.width = `${metrics.midKeyPct}%`;
    if (barLow) barLow.style.width = `${metrics.lowKeyPct}%`;

    // Averages
    const statAvgLum = document.getElementById('statAvgLum');
    const statAvgSat = document.getElementById('statAvgSat');
    const statDynamicRange = document.getElementById('statDynamicRange');

    if (statAvgLum) statAvgLum.textContent = `${metrics.avgLum}%`;
    if (statAvgSat) statAvgSat.textContent = `${metrics.avgSat}%`;
    if (statDynamicRange) statDynamicRange.textContent = `${metrics.dynamicRange}%`;

    // Master consolidated palette
    const masterStrip = document.getElementById('masterBatchPaletteStrip');
    if (masterStrip) {
      masterStrip.innerHTML = '';
      if (metrics.masterPalette && metrics.masterPalette.length > 0) {
        metrics.masterPalette.forEach(p => {
          const sw = document.createElement('div');
          sw.style.flex = '1';
          sw.style.backgroundColor = p.hex;
          sw.style.cursor = 'pointer';
          sw.title = `${p.hex} (${p.weight || ''}%) - Click para seleccionar`;
          sw.onclick = () => {
            this.setColorDirectly(p.rgb);
            this.showToast(`Color de paleta maestra: ${p.hex}`);
          };
          masterStrip.appendChild(sw);
        });
      }
    }
  }

  loadSampleImage(path) {
    this.imageExtractor.loadImage(path).then(() => {
      this.runImageExtraction();
      const batchSection = document.getElementById('batchManagementSection');
      if (batchSection) batchSection.style.display = 'none';
      this.showToast(`Muestra cargada: ${path.split('/').pop()}`);
    }).catch(err => {
      console.warn('Could not load sample image', err);
    });
  }

  runImageExtraction() {
    const count = parseInt(document.getElementById('extractCountSelect')?.value || '6', 10);
    const filter = document.getElementById('extractFilterSelect')?.value || 'dominant';
    const sort = document.getElementById('extractSortSelect')?.value || 'dominance';

    this.imageExtractor.options.colorCount = count;
    this.imageExtractor.options.filterMode = filter;
    this.imageExtractor.options.sortBy = sort;

    const results = this.imageExtractor.extractPalette(count, filter, sort);
    this.renderExtractedPalette(results);
  }

  renderExtractedPalette(results) {
    const container = document.getElementById('extractedSwatchesGrid');
    if (!container) return;
    container.innerHTML = '';
    this.currentExtractedColors = results;

    results.forEach((res, idx) => {
      const sw = document.createElement('div');
      sw.className = 'extracted-swatch-item';
      sw.style.flex = '1';
      sw.style.backgroundColor = res.hex;
      sw.style.display = 'flex';
      sw.style.flexDirection = 'column';
      sw.style.alignItems = 'center';
      sw.style.justifyContent = 'flex-end';
      sw.style.padding = '4px';
      sw.style.cursor = 'pointer';
      sw.draggable = true;
      sw.dataset.swatchHex = res.hex;
      sw.dataset.swatchLabel = `Color ${idx + 1} (${res.dominancePercent || 10}%)`;
      sw.title = `${res.hex} • Lum: ${Math.round(res.luminance * 100)}% • Dominancia: ${res.dominancePercent || 10}%\n(Click: Color Frontal | Shift+Click: Color de Fondo | Arrastra para guardar)`;

      const tag = document.createElement('span');
      tag.style.fontSize = '0.66rem';
      tag.style.fontWeight = '700';
      tag.style.fontFamily = 'var(--font-mono, monospace)';
      tag.style.color = res.luminance > 0.45 ? '#0f172a' : '#f8fafc';
      tag.style.textShadow = res.luminance > 0.45 ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.8)';
      tag.textContent = `${res.dominancePercent || ''}%`;

      sw.appendChild(tag);

      // Left-click sets as FG, Shift-click or contextmenu sets as BG
      sw.addEventListener('click', (e) => {
        if (e.shiftKey) {
          this.bgColor = { ...res.rgb, hex: res.hex };
          this.syncDisplay();
          this.showToast(`Color ${res.hex} asignado a Color de Fondo (BG)`, 'info');
        } else {
          this.setColorDirectly(res.rgb);
          this.showToast(`Color ${res.hex} asignado a Color Frontal (FG)`, 'success');
        }
      });

      sw.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bgColor = { ...res.rgb, hex: res.hex };
        this.syncDisplay();
        this.showToast(`Color ${res.hex} asignado a Color de Fondo (BG)`, 'info');
      });

      // Drag and drop support
      sw.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/gom-swatch', JSON.stringify({ hex: res.hex, name: `Color ${idx + 1}` }));
        e.dataTransfer.setData('text/plain', res.hex);
      });

      container.appendChild(sw);
    });

    // Update Quality & Harmonizer HUD
    if (results.length > 0) {
      this.updateOptimizerHUD(results.map(r => r.hex));
    }
  }

  updateOptimizerHUD(hexList) {
    if (!hexList || hexList.length === 0) return;
    const scoreData = PaletteOptimizer.calculateScore(hexList);
    this.currentPaletteScore = scoreData;

    // Update Tier Badge
    const badge = document.getElementById('optimizerScoreBadge');
    const gradeTxt = document.getElementById('optimizerGradeText');
    const scorePoints = document.getElementById('optimizerScorePoints');
    const subTitle = document.getElementById('optimizerSubTitle');

    if (badge) {
      badge.className = `optimizer-tier-badge ${scoreData.gradeBadgeClass}`;
    }
    if (gradeTxt) gradeTxt.textContent = scoreData.grade;
    if (scorePoints) scorePoints.textContent = `${scoreData.totalScore}/100 Pts`;
    if (subTitle) {
      subTitle.textContent = `${scoreData.gradeTitle} • ${scoreData.harmonicType} • ${scoreData.thermalDesc}`;
    }

    // Update 5 Metric Mini-Gauges
    const updateGauge = (idVal, idBar, val) => {
      const elVal = document.getElementById(idVal);
      const elBar = document.getElementById(idBar);
      if (elVal) elVal.textContent = `${val}%`;
      if (elBar) elBar.style.width = `${Math.max(4, Math.min(100, val))}%`;
    };

    updateGauge('metricContrastVal', 'metricContrastBar', scoreData.metrics.contrast);
    updateGauge('metricHarmonyVal', 'metricHarmonyBar', scoreData.metrics.harmony);
    updateGauge('metricThermalVal', 'metricThermalBar', scoreData.metrics.thermal);
    updateGauge('metricDistinctVal', 'metricDistinctBar', scoreData.metrics.distinctness);
    updateGauge('metricPigmentsVal', 'metricPigmentsBar', scoreData.metrics.pigments);

    // Update Diagnostic Chips
    const diagList = document.getElementById('optimizerDiagnosticsList');
    if (diagList) {
      diagList.innerHTML = '';
      scoreData.diagnostics.forEach(diag => {
        const chip = document.createElement('div');
        chip.className = `optimizer-diag-chip ${diag.type}`;
        chip.innerHTML = `<span>${diag.icon}</span> <span>${diag.text}</span>`;
        diagList.appendChild(chip);
      });
      scoreData.recommendations.forEach(rec => {
        const chip = document.createElement('div');
        chip.className = 'optimizer-diag-chip info';
        chip.innerHTML = `<span>💡</span> <strong>Sugerencia:</strong> <span>${rec}</span>`;
        diagList.appendChild(chip);
      });
    }

    this.updateOptimizerPreview(hexList);
  }

  updateOptimizerPreview(sourceHexList = null) {
    const hexes = sourceHexList || (this.imageExtractor?.extractedColors || []).map(c => c.hex);
    if (!hexes || hexes.length === 0) return;

    const mode = document.getElementById('optimizerModeSelect')?.value || 'auto_master';
    const intensity = parseInt(document.getElementById('optimizerIntensitySlider')?.value || '100', 10) / 100;

    const optResult = PaletteOptimizer.optimize(hexes, mode, intensity);
    this.currentOptimizedColors = optResult.optimizedColors;

    // Render Before Strip
    const beforeStrip = document.getElementById('optimizerBeforeStrip');
    if (beforeStrip) {
      beforeStrip.innerHTML = '';
      hexes.forEach(h => {
        const seg = document.createElement('div');
        seg.style.flex = '1';
        seg.style.backgroundColor = h;
        beforeStrip.appendChild(seg);
      });
    }

    // Render After Strip
    const afterStrip = document.getElementById('optimizerAfterStrip');
    if (afterStrip) {
      afterStrip.innerHTML = '';
      optResult.optimizedColors.forEach(h => {
        const seg = document.createElement('div');
        seg.style.flex = '1';
        seg.style.backgroundColor = h;
        seg.style.cursor = 'pointer';
        seg.title = `Color optimizado: ${h} (Click para cargar)`;
        seg.addEventListener('click', () => {
          this.setColorDirectly(ColorMath.hexToRgb(h));
          this.showToast(`Color optimizado ${h} cargado en Color Frontal`);
        });
        afterStrip.appendChild(seg);
      });
    }

    // Update Improvement Badge
    const badge = document.getElementById('optimizerImprovementBadge');
    if (badge) {
      const imp = optResult.improvement;
      badge.textContent = imp >= 0 ? `+${imp} Pts Mejora (${optResult.scoreAfter.totalScore} Pts • Grado ${optResult.scoreAfter.grade})` : `${imp} Pts (${optResult.scoreAfter.totalScore} Pts)`;
      badge.style.color = imp >= 0 ? '#34D399' : '#F59E0B';
    }
  }

  runAutoMasterOptimization() {
    const hexes = (this.imageExtractor?.extractedColors || []).map(c => c.hex);
    if (!hexes || hexes.length === 0) {
      this.showToast('Primero extrae una paleta de la imagen activa', 'warn');
      return;
    }

    const modeSelect = document.getElementById('optimizerModeSelect');
    const slider = document.getElementById('optimizerIntensitySlider');
    const sliderVal = document.getElementById('optimizerIntensityVal');
    if (modeSelect) modeSelect.value = 'auto_master';
    if (slider) slider.value = '100';
    if (sliderVal) sliderVal.textContent = '100%';

    const optResult = PaletteOptimizer.optimize(hexes, 'auto_master', 1.0);
    this.currentOptimizedColors = optResult.optimizedColors;

    // Apply to current extracted colors
    const newItems = optResult.optimizedColors.map((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const prev = this.imageExtractor.extractedColors[idx] || {};
      return {
        rgb,
        hex,
        hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
        luminance: ColorMath.getLuminance(rgb.r, rgb.g, rgb.b),
        dominancePercent: prev.dominancePercent || 15,
        score: prev.score || 80
      };
    });

    this.imageExtractor.extractedColors = newItems;
    this.renderExtractedPalette(newItems);
    this.showToast(`✨ ¡Paleta optimizada con éxito a Grado ${optResult.scoreAfter.grade} (${optResult.scoreAfter.totalScore} Pts)!`, 'success');
  }

  applyOptimizedPalette() {
    if (!this.currentOptimizedColors || this.currentOptimizedColors.length === 0) {
      this.showToast('No hay paleta optimizada calculada', 'warn');
      return;
    }

    const newItems = this.currentOptimizedColors.map((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const prev = this.imageExtractor.extractedColors[idx] || {};
      return {
        rgb,
        hex,
        hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
        luminance: ColorMath.getLuminance(rgb.r, rgb.g, rgb.b),
        dominancePercent: prev.dominancePercent || 15,
        score: prev.score || 80
      };
    });

    this.imageExtractor.extractedColors = newItems;
    this.renderExtractedPalette(newItems);
    this.showToast('✓ Paleta armonizada aplicada. ¡Puedes guardarla en Bibliotecas o proyectarla en 4D!', 'success');
  }

  // --- AI ADVISOR & 6 COMPOSITION SCENES ---

  _bindAiAssistant() {
    const input = document.getElementById('aiPromptInput');
    const btnGen = document.getElementById('btnAiGenerate');
    const modBtns = document.querySelectorAll('.modifier-btn');
    const sceneSelect = document.getElementById('aiSceneSelect');
    const btnSaveLib = document.getElementById('btnAiSaveToLibrary');
    const promptChips = document.querySelectorAll('.ai-chip-prompt');

    const updateAll = () => {
      this.renderAiComposition(this.currentAiPalette);
      this.renderAiSwatches(this.currentAiPalette);
      this.renderSemanticGauges(this.currentAiPalette.semanticVector);
      this.renderAiDiagnosticCritique(this.currentAiPalette.critique);
    };

    const generate = (prompt) => {
      const p = (prompt || '').trim();
      if (!p) return;

      // Auto-scene detection based on keywords
      const pLower = p.toLowerCase();
      if (sceneSelect) {
        if (/rosa|rosas|flor|flores|ramo|ramillete|bouquet|bot[aá]nic|jard[ií]n|p[eé]talo|planta|tulip[aá]n|margarita|orqu[ií]dea|girasol|lavanda/.test(pLower)) {
          sceneSelect.value = 'botanical';
          AIAssistant.activeSceneType = 'botanical';
        } else if (/drag[oó]n|criatura|monstruo|bestia|reptil|volc[aá]n|cueva|obsidiana/.test(pLower)) {
          sceneSelect.value = 'creature';
          AIAssistant.activeSceneType = 'creature';
        } else if (/retrato|rostro|persona|mujer|hombre|cara|humano/.test(pLower)) {
          sceneSelect.value = 'portrait';
          AIAssistant.activeSceneType = 'portrait';
        } else if (/cyberpunk|ne[oó]n|futur|scifi|sci-fi|ciudad|holograma/.test(pLower)) {
          sceneSelect.value = 'cyberpunk';
          AIAssistant.activeSceneType = 'cyberpunk';
        } else if (/cartel|poster|bauhaus|logo|diseño|branding/.test(pLower)) {
          sceneSelect.value = 'poster';
          AIAssistant.activeSceneType = 'poster';
        } else if (/bodeg[oó]n|fruta|jarra|naturaleza muerta/.test(pLower)) {
          sceneSelect.value = 'still_life';
          AIAssistant.activeSceneType = 'still_life';
        } else if (/paisaje|bosque|monta[ñn]a|mar|oc[eé]ano|cielo/.test(pLower)) {
          sceneSelect.value = 'landscape';
          AIAssistant.activeSceneType = 'landscape';
        }
      }

      this.currentAiPalette = AIAdvisor.synthesizePalette(p);
      if (this.currentAiPalette && this.currentAiPalette.sceneType && sceneSelect) {
        sceneSelect.value = this.currentAiPalette.sceneType;
        AIAssistant.activeSceneType = this.currentAiPalette.sceneType;
      }
      updateAll();
    };

    if (btnGen) btnGen.addEventListener('click', () => generate(input?.value));
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generate(input.value);
      });
    }

    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const txt = chip.dataset.prompt || chip.textContent.trim();
        if (input) input.value = txt;
        generate(txt);
      });
    });

    if (sceneSelect) {
      sceneSelect.addEventListener('change', (e) => {
        AIAssistant.activeSceneType = e.target.value;
        if (this.currentAiPalette) {
          this.renderAiComposition(this.currentAiPalette);
        }
      });
    }

    modBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.currentAiPalette) return;
        const modType = btn.dataset.mod;
        this.currentAiPalette = AIAssistant.modifyPalette(this.currentAiPalette, modType);
        updateAll();
        this.showToast(`Modificador IA: ${btn.textContent}`);
      });
    });

    if (btnSaveLib) {
      btnSaveLib.addEventListener('click', () => {
        if (!this.currentAiPalette || !this.currentAiPalette.colors) return;
        const name = this.currentAiPalette.title || 'Paleta IA';
        const colors = this.currentAiPalette.colors.map(c => c.hex);

        if (this.swatchManager) {
          this.swatchManager.palettes.unshift({
            id: 'palette_ai_' + Date.now(),
            name: name,
            colors: colors
          });
          this.swatchManager.savePalettes();
          if (typeof this.renderSwatchesCollection === 'function') this.renderSwatchesCollection();
          if (typeof this.renderQuickPalette === 'function') this.renderQuickPalette();
          this.showToast(`✓ Paleta guardada en tu biblioteca con ${colors.length} muestras`);
        }
      });
    }

    const btnAiExportPng = document.getElementById('btnAiExportPng');
    if (btnAiExportPng) {
      btnAiExportPng.addEventListener('click', () => {
        if (!this.currentAiPalette || !this.currentAiPalette.colors) return;
        const name = this.currentAiPalette.title || 'Paleta IA 60-30-10';
        SwatchSheetExporter.openExportModal(name, this.currentAiPalette.colors, this, {
          subtitle: 'COMPOSICIÓN SINTETIZADA POR ASESOR IA • PROPORCIONES 60-30-10'
        });
      });
    }

    // AI Subtabs Toggle (60-30-10 Synthesizer vs Art Master Chat Studio)
    const tabSynth = document.getElementById('tabBtnAiSynth');
    const tabChat = document.getElementById('tabBtnAiChat');
    const panelSynth = document.getElementById('aiSynthContainer');
    const panelChat = document.getElementById('aiChatContainer');

    if (tabSynth && tabChat && panelSynth && panelChat) {
      tabSynth.addEventListener('click', () => {
        tabSynth.classList.add('active');
        tabChat.classList.remove('active');
        panelSynth.style.display = 'block';
        panelChat.style.display = 'none';
      });

      tabChat.addEventListener('click', () => {
        tabChat.classList.add('active');
        tabSynth.classList.remove('active');
        panelSynth.style.display = 'none';
        panelChat.style.display = 'flex';
        if (this.aiChat) {
          this.aiChat.updateContextDisplay();
          this.aiChat._scrollToBottom();
        }
      });
    }

    // Initialize AIChatStudio Hybrid Engine
    if (!this.aiChat) {
      this.aiChat = new AIChatStudio(this);
      this.aiChat.init();
      this.aiChat.updateContextDisplay();
    }
  }

  generateInitialAiPalette() {
    this.currentAiPalette = AIAdvisor.synthesizePalette('dragón volcánico en cueva de obsidiana');
    this.renderAiComposition(this.currentAiPalette);
    this.renderAiSwatches(this.currentAiPalette);
    this.renderSemanticGauges(this.currentAiPalette.semanticVector);
    this.renderAiDiagnosticCritique(this.currentAiPalette.critique);
  }

  renderSemanticGauges(vec) {
    const list = document.getElementById('semanticGaugesList');
    if (!list || !vec) return;
    list.innerHTML = '';

    const items = [
      {
        icon: '🌡️',
        name: 'Térmico',
        val: Math.round(((vec.thermal + 1) / 2) * 100),
        color: vec.thermal > 0 ? '#F59E0B' : '#06B6D4',
        label: vec.thermal > 0 ? `Cálido (+${Math.round(vec.thermal * 100)}%)` : `Frío (${Math.round(vec.thermal * 100)}%)`
      },
      {
        icon: '💡',
        name: 'Clave Valor',
        val: Math.round(vec.valueKey * 100),
        color: '#A5B4FC',
        label: vec.valueKey > 0.6 ? `High-Key (${Math.round(vec.valueKey * 100)}%)` : (vec.valueKey < 0.4 ? `Low-Key (${Math.round(vec.valueKey * 100)}%)` : `Mid-Key (${Math.round(vec.valueKey * 100)}%)`)
      },
      {
        icon: '🎨',
        name: 'Saturación',
        val: Math.round(vec.saturation * 100),
        color: '#EC4899',
        label: `${Math.round(vec.saturation * 100)}% Crominancia`
      },
      {
        icon: '⚡',
        name: 'Tensión Armónica',
        val: Math.round(vec.tension * 100),
        color: '#8B5CF6',
        label: vec.tension > 0.5 ? `Contraste (${Math.round(vec.tension * 100)}%)` : `Análogo (${Math.round(vec.tension * 100)}%)`
      }
    ];

    items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'semantic-gauge-item';

      const header = document.createElement('div');
      header.className = 'semantic-gauge-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'semantic-gauge-name';
      nameSpan.textContent = `${it.icon} ${it.name}`;

      const valSpan = document.createElement('span');
      valSpan.className = 'semantic-gauge-val';
      valSpan.style.color = it.color;
      valSpan.textContent = it.label;

      header.appendChild(nameSpan);
      header.appendChild(valSpan);

      const track = document.createElement('div');
      track.className = 'semantic-gauge-track';

      const fill = document.createElement('div');
      fill.className = 'semantic-gauge-fill';
      fill.style.width = `${Math.max(4, Math.min(100, it.val))}%`;
      fill.style.backgroundColor = it.color;
      fill.style.boxShadow = `0 0 8px ${it.color}66`;
      track.appendChild(fill);

      row.appendChild(header);
      row.appendChild(track);
      list.appendChild(row);
    });
  }

  runPaletteDiagnostic() {
    const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    const hsv = ColorMath.rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
    const harm = HarmonyEngine.getHarmony(hsv, this.colorWheel.harmonyRule);
    const paletteRgbs = harm.colors.map(c => c.rgb);

    const critique = AIAdvisor.diagnosePalette(paletteRgbs);
    this.renderAiDiagnosticCritique(critique);
  }

  renderAiDiagnosticCritique(critique) {
    if (!critique) return;
    const scoreEl = document.getElementById('diagnosticScore');
    const findingsEl = document.getElementById('diagnosticFindings');
    const adviceEl = document.getElementById('diagnosticAdvice');

    if (scoreEl) scoreEl.textContent = `${critique.score}/100 Pts`;
    if (findingsEl) {
      findingsEl.innerHTML = '';
      critique.findings.forEach(f => {
        const item = document.createElement('div');
        item.className = 'diagnostic-finding-item';
        item.textContent = f;
        findingsEl.appendChild(item);
      });
    }
    if (adviceEl) {
      const suggestionsText = (critique.suggestions && critique.suggestions.length > 0)
        ? critique.suggestions.join(' ')
        : 'Distribuye el 60% en masas atmosféricas, el 30% en volúmenes estructurales y el 10% únicamente en el centro de interés narrativo.';

      adviceEl.innerHTML = `
        <div class="diagnostic-advice-header">💡 Consejo del Art Director</div>
        <div class="diagnostic-advice-body">${suggestionsText}</div>
      `;
    }
  }

  renderAiComposition(palette) {
    const viewport = document.getElementById('aiCompositionViewport');
    const ratioBar = document.getElementById('ratioBar');
    const ratioLegend = document.getElementById('ratioLegend');
    if (!viewport || !palette) return;

    // Render selected scene
    viewport.innerHTML = AIAssistant.generatePreviewSvg(palette);

    // Exact 60-30-10 breakdown in ratio bar
    if (ratioBar) {
      ratioBar.innerHTML = '';
      const segs = [
        { col: palette.colors[0], pct: 60, label: 'Dominante Base (60%)' },
        { col: palette.colors[1], pct: 30, label: 'Secundario Estructural (30%)' },
        { col: palette.colors[2], pct: 10, label: 'Acento Focal (10%)' }
      ];

      segs.forEach(s => {
        if (!s.col) return;
        const seg = document.createElement('div');
        seg.className = 'ratio-bar-segment';
        seg.style.width = `${s.pct}%`;
        seg.style.backgroundColor = s.col.hex;
        seg.title = `${s.label}: ${s.col.hex} (Click para seleccionar)`;
        seg.dataset.swatchHex = s.col.hex;
        seg.dataset.swatchLabel = s.label;
        seg.draggable = true;
        seg.addEventListener('click', () => {
          this.setColorDirectly(s.col.rgb);
          this.showToast(`Color ${s.col.hex} seleccionado`);
        });
        ratioBar.appendChild(seg);
      });
    }

    // Dynamic legend with colored dots
    if (ratioLegend && palette.colors.length >= 3) {
      ratioLegend.innerHTML = `
        <span class="ratio-legend-item" title="Click para usar color">
          <span class="ratio-legend-dot" style="background: ${palette.colors[0].hex};"></span>
          Dominante Base (60%)
        </span>
        <span class="ratio-legend-item" title="Click para usar color">
          <span class="ratio-legend-dot" style="background: ${palette.colors[1].hex};"></span>
          Secundario Estructural (30%)
        </span>
        <span class="ratio-legend-item" title="Click para usar color">
          <span class="ratio-legend-dot" style="background: ${palette.colors[2].hex};"></span>
          Acento Focal (10%)
        </span>
      `;

      // Allow clicking legend items to select the color
      const items = ratioLegend.querySelectorAll('.ratio-legend-item');
      items.forEach((item, idx) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          if (palette.colors[idx]) {
            this.setColorDirectly(palette.colors[idx].rgb);
            this.showToast(`Color ${palette.colors[idx].hex} seleccionado`);
          }
        });
      });
    }
  }

  renderAiSwatches(palette) {
    const container = document.getElementById('aiSwatchesGrid');
    if (!container || !palette || !palette.colors) return;
    container.innerHTML = '';

    const roleBadges = [
      { key: 'dominant', label: 'Dominante 60%', roleName: 'Fondo y Atmósfera', tagColor: '#6366F1' },
      { key: 'secondary', label: 'Secundario 30%', roleName: 'Estructura y Formas', tagColor: '#10B981' },
      { key: 'accent', label: 'Acento 10%', roleName: 'Foco de Atención', tagColor: '#F59E0B' },
      { key: 'highlight', label: 'Luz Especular', roleName: 'Recorte y Brillo', tagColor: '#EC4899' },
      { key: 'terminator', label: 'Terminador SSS', roleName: 'Transición Orgánica', tagColor: '#8B5CF6' }
    ];

    palette.colors.forEach((col, idx) => {
      const meta = roleBadges[idx] || { label: col.roleName, roleName: '', tagColor: '#A5B4FC' };
      const card = document.createElement('div');
      card.className = 'ai-swatch-card';

      // Left: Big color chip
      const chip = document.createElement('div');
      chip.className = 'ai-swatch-chip';
      chip.style.backgroundColor = col.hex;
      chip.title = `Click: Seleccionar como principal (FG)\nArrastra a cualquier ranura`;
      chip.draggable = true;
      chip.dataset.swatchHex = col.hex;
      chip.dataset.swatchLabel = meta.label;
      chip.addEventListener('click', () => {
        this.setColorDirectly(col.rgb);
        this.showToast(`Color principal: ${col.hex}`);
      });

      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', col.hex);
        e.dataTransfer.effectAllowed = 'copy';
      });

      // Middle: Role, HEX, subtext
      const info = document.createElement('div');
      info.className = 'ai-swatch-info';

      const roleBadge = document.createElement('span');
      roleBadge.className = 'ai-swatch-role-badge';
      roleBadge.style.color = meta.tagColor;
      roleBadge.textContent = meta.label;

      const hexRow = document.createElement('div');
      hexRow.className = 'ai-swatch-hex-row';

      const hexText = document.createElement('span');
      hexText.className = 'ai-swatch-hex';
      hexText.textContent = col.hex;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'ai-swatch-copy-btn';
      copyBtn.innerHTML = '📋';
      copyBtn.title = 'Copiar HEX';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(col.hex);
        this.showToast(`Copiado: ${col.hex}`);
      });

      hexRow.appendChild(hexText);
      hexRow.appendChild(copyBtn);

      const subText = document.createElement('span');
      subText.className = 'ai-swatch-sub';
      subText.textContent = meta.roleName;

      info.appendChild(roleBadge);
      info.appendChild(hexRow);
      info.appendChild(subText);

      // Right: Actions (FG & BG buttons)
      const actions = document.createElement('div');
      actions.className = 'ai-swatch-actions';

      const btnFg = document.createElement('button');
      btnFg.className = 'ai-swatch-btn';
      btnFg.title = 'Establecer como color principal (FG)';
      btnFg.textContent = 'FG';
      btnFg.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveWell('fg');
        this.setColorDirectly(col.rgb);
      });

      const btnBg = document.createElement('button');
      btnBg.className = 'ai-swatch-btn';
      btnBg.title = 'Establecer como color secundario (BG)';
      btnBg.textContent = 'BG';
      btnBg.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveWell('bg');
        this.setColorDirectly(col.rgb);
      });

      actions.appendChild(btnFg);
      actions.appendChild(btnBg);

      card.appendChild(chip);
      card.appendChild(info);
      card.appendChild(actions);

      container.appendChild(card);
    });
  }

  // --- PROFESSIONAL SWATCH LIBRARIES & CATÁLOGOS COMPLETOS ---

  _bindSwatchesAndExporters() {
    const btnCreate = document.getElementById('btnCreatePalette');
    const btnAuto = document.getElementById('btnAutoGeneratePalette');
    const btnQuickAdd = document.getElementById('btnQuickAddToActive');
    const quickSel = document.getElementById('quickPaletteSelector');
    const btnQuickSort = document.getElementById('btnQuickSortPalette');
    const btnQuickClear = document.getElementById('btnQuickClearPalette');
    const btnImportModal = document.getElementById('btnImportPaletteModal');
    const btnExportAll = document.getElementById('btnExportAllPalettes');
    const searchInput = document.getElementById('paletteSearchInput');
    const btnClearSearch = document.getElementById('btnClearPaletteSearch');

    const btnAse = document.getElementById('btnExportAse');
    const btnGpl = document.getElementById('btnExportGpl');
    const btnCss = document.getElementById('btnExportCss');
    const btnJson = document.getElementById('btnExportJson');
    const btnSvg = document.getElementById('btnExportSvgCard');
    const btnSwatchesPng = document.getElementById('btnSwatchesExportPng');

    // Quick Palette Strip Toolbar in Studio
    if (quickSel) {
      quickSel.addEventListener('change', (e) => {
        this.swatchManager.setActivePalette(e.target.value);
        this.renderQuickPalette();
        this.renderSwatchesCollection();
        if (this.hyper4dStudio) {
          this.hyper4dStudio.syncWithActivePalette();
        }
        const act = this.swatchManager.getActivePalette();
        if (act) this.showToast(`Paleta activa: '${act.name}'`);
      });
    }

    if (btnQuickSort) {
      btnQuickSort.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = this.swatchManager.getActivePalette();
        if (act) this.showPaletteSortPopover(btnQuickSort, act);
      });
    }

    if (btnQuickClear) {
      btnQuickClear.addEventListener('click', () => {
        const act = this.swatchManager.getActivePalette();
        if (act && confirm(`¿Vaciar todas las muestras de la paleta activa "${act.name}"?`)) {
          this.swatchManager.clearPaletteColors(act.id);
          this.renderQuickPalette();
          this.renderSwatchesCollection();
          this.showToast(`Paleta '${act.name}' vaciada`);
        }
      });
    }

    if (btnQuickAdd) {
      btnQuickAdd.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette();
        if (activePal) {
          this.swatchManager.addColorToPalette(activePal.id, this.fgColor.hex);
          this.renderQuickPalette();
          this.renderSwatchesCollection();
          this.showToast(`Color ${this.fgColor.hex} añadido a '${activePal.name}'`);
        }
      });
    }

    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        const name = prompt('Nombre para tu nueva paleta:', `Paleta #${this.swatchManager.palettes.length + 1}`);
        if (name) {
          const currentPal = [this.fgColor.hex, this.bgColor.hex];
          const newPal = this.swatchManager.addPalette(name, currentPal);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Paleta '${newPal.name}' creada con éxito`, 'success');
        }
      });
    }

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        const currentRgb = this.fgColor;
        const hsv = ColorMath.rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
        const harm = HarmonyEngine.getHarmony(hsv, this.colorWheel.harmonyRule);
        const autoColors = harm.colors.map(c => c.hex);

        const newPal = this.swatchManager.addPalette(`Armonía ${this.colorWheel.harmonyRule} (${this.fgColor.hex})`, autoColors);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Paleta armónica '${newPal.name}' generada`, 'success');
      });
    }

    // Filter tabs for catalogs
    const catTabs = document.querySelectorAll('#catalogFilterTabs button');
    catTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        catTabs.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        this.activeCatalogFilter = btn.dataset.cat;
        this.renderSwatchesCollection();
      });
    });

    // Palette Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.paletteSearchQuery = e.target.value;
        if (btnClearSearch) btnClearSearch.style.display = e.target.value ? 'block' : 'none';
        this.renderSwatchesCollection();
      });
    }

    if (btnClearSearch && searchInput) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.paletteSearchQuery = '';
        btnClearSearch.style.display = 'none';
        this.renderSwatchesCollection();
        searchInput.focus();
      });
    }

    // Export All Palettes Backup (.JSON)
    if (btnExportAll) {
      btnExportAll.addEventListener('click', () => {
        this.swatchManager.exportAllPalettesAsJson();
        this.showToast('✓ Respaldo de todas tus paletas descargado en JSON', 'success');
      });
    }

    // =========================================================================
    // UNIVERSAL PALETTE & LIBRARY IMPORTER STUDIO (.ASE, .GPL, .JSON, .CSS, TXT)
    // =========================================================================
    const importModal = document.getElementById('importPaletteModal');
    const btnCloseImport = document.getElementById('btnCloseImportPaletteModal');
    const btnCancelImport = document.getElementById('btnCancelImportPalette');
    const btnConfirmImport = document.getElementById('btnConfirmImportPalette');

    const tabImportFile = document.getElementById('tabImportFile');
    const tabImportText = document.getElementById('tabImportText');
    const importFileSection = document.getElementById('importFileSection');
    const importTextSection = document.getElementById('importTextSection');

    const importDropZone = document.getElementById('importDropZone');
    const importFileInput = document.getElementById('importFileInput');
    const importFileStatus = document.getElementById('importFileStatus');
    const importFileNameText = document.getElementById('importFileNameText');
    const btnRemoveFile = document.getElementById('btnRemoveFile');

    const importTextarea = document.getElementById('importPaletteTextarea');
    const btnPasteClipboard = document.getElementById('btnPasteClipboard');
    const btnLoadSample = document.getElementById('btnLoadSamplePalette');

    const importNameInput = document.getElementById('importPaletteNameInput');
    const importDestinationSelect = document.getElementById('importDestinationSelect');
    const importSortSelect = document.getElementById('importSortSelect');
    const chkDeduplicate = document.getElementById('chkDeduplicate');
    const chkDeltaEFilter = document.getElementById('chkDeltaEFilter');

    const importCount = document.getElementById('importPaletteCount');
    const importPreview = document.getElementById('importPaletteLivePreview');
    const btnSelectAllPreview = document.getElementById('btnSelectAllPreview');
    const btnClearPreview = document.getElementById('btnClearPreview');

    // Importer state
    let extractedColors = []; // Array<{hex: string, name: string}>
    let excludedSet = new Set(); // Indices of excluded colors
    let activeImportFile = null;

    const setImportTab = (mode) => {
      if (mode === 'file') {
        tabImportFile?.classList.add('active-toggle');
        tabImportText?.classList.remove('active-toggle');
        if (importFileSection) importFileSection.style.display = 'flex';
        if (importTextSection) importTextSection.style.display = 'none';
      } else {
        tabImportText?.classList.add('active-toggle');
        tabImportFile?.classList.remove('active-toggle');
        if (importTextSection) importTextSection.style.display = 'flex';
        if (importFileSection) importFileSection.style.display = 'none';
        if (importTextarea) importTextarea.focus();
      }
    };

    if (tabImportFile) tabImportFile.addEventListener('click', () => setImportTab('file'));
    if (tabImportText) tabImportText.addEventListener('click', () => setImportTab('text'));

    const renderImportPreview = () => {
      if (!importPreview) return;

      // 1. Filter out excluded colors
      let candidateColors = extractedColors.filter((_, idx) => !excludedSet.has(idx));

      // 2. Process with options (deduplication, deltaE, sort)
      const options = {
        removeDuplicates: chkDeduplicate ? chkDeduplicate.checked : true,
        deltaEThreshold: chkDeltaEFilter && chkDeltaEFilter.checked ? 2.5 : 0,
        sort: importSortSelect ? importSortSelect.value : 'original'
      };

      const finalColors = PaletteImporterEngine.processColors(candidateColors, options);

      // 3. Update counter & confirm button
      if (importCount) {
        importCount.textContent = `${finalColors.length} colores`;
      }
      if (btnConfirmImport) {
        btnConfirmImport.disabled = finalColors.length === 0;
        btnConfirmImport.innerHTML = `<span>📥</span> Importar ${finalColors.length} Muestras`;
      }

      // 4. Render chips
      importPreview.innerHTML = '';
      if (finalColors.length === 0) {
        importPreview.innerHTML = '<span style="font-size: 0.74rem; color: var(--text-muted); padding: 10px;">Sin colores detectados o todos los colores han sido excluidos.</span>';
        return;
      }

      finalColors.forEach((col) => {
        const chip = document.createElement('div');
        chip.className = 'import-preview-chip';

        const swatchBox = document.createElement('div');
        swatchBox.className = 'import-chip-swatch';
        swatchBox.style.backgroundColor = col.hex;

        const nameLabel = document.createElement('span');
        nameLabel.className = 'import-chip-name';
        nameLabel.textContent = col.hex;
        if (col.name && col.name !== col.hex) {
          nameLabel.title = `${col.name} (${col.hex})`;
        } else {
          nameLabel.title = col.hex;
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'import-chip-del';
        delBtn.innerHTML = '✕';
        delBtn.title = `Excluir ${col.hex} de la importación`;
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const origIdx = extractedColors.findIndex(c => c.hex.toUpperCase() === col.hex.toUpperCase());
          if (origIdx !== -1) {
            excludedSet.add(origIdx);
          }
          renderImportPreview();
        });

        chip.appendChild(swatchBox);
        chip.appendChild(nameLabel);
        chip.appendChild(delBtn);
        importPreview.appendChild(chip);
      });
    };

    const processLoadedFile = async (file) => {
      if (!file) return;
      activeImportFile = file;

      if (importFileStatus) importFileStatus.style.display = 'flex';
      if (importFileNameText) {
        const sizeKb = (file.size / 1024).toFixed(1);
        importFileNameText.textContent = `📄 ${file.name} (${sizeKb} KB)`;
      }

      try {
        const res = await PaletteImporterEngine.parseFile(file);
        if (res.success && res.colors.length > 0) {
          extractedColors = res.colors;
          excludedSet.clear();
          if (importNameInput && res.title) {
            importNameInput.value = res.title;
          }
          renderImportPreview();
          this.showToast(`✓ Extraídos ${res.colors.length} colores de ${file.name} (${res.format})`, 'success');
        } else {
          this.showToast(`⚠️ No se pudieron extraer colores válidos de ${file.name}: ${res.error || 'Formato no reconocido'}`, 'warning');
        }
      } catch (err) {
        console.error('Error procesando archivo de paleta:', err);
        this.showToast(`Error al leer archivo: ${err.message}`, 'error');
      }
    };

    // File input changes
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) processLoadedFile(file);
      });
    }

    // Dropzone interaction
    if (importDropZone) {
      importDropZone.addEventListener('click', () => {
        if (importFileInput) importFileInput.click();
      });

      ['dragenter', 'dragover'].forEach(evt => {
        importDropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          importDropZone.classList.add('drag-active');
        });
      });

      ['dragleave', 'dragend'].forEach(evt => {
        importDropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          importDropZone.classList.remove('drag-active');
        });
      });

      importDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        importDropZone.classList.remove('drag-active');
        const file = e.dataTransfer?.files?.[0];
        if (file) processLoadedFile(file);
      });
    }

    if (btnRemoveFile) {
      btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        activeImportFile = null;
        if (importFileInput) importFileInput.value = '';
        if (importFileStatus) importFileStatus.style.display = 'none';
        extractedColors = [];
        excludedSet.clear();
        renderImportPreview();
      });
    }

    // Text parsing
    const parseFromTextarea = () => {
      if (!importTextarea) return;
      const text = importTextarea.value;
      if (!text.trim()) {
        extractedColors = [];
        excludedSet.clear();
        renderImportPreview();
        return;
      }
      const res = PaletteImporterEngine.parseRawText(text, importNameInput?.value || 'Paleta Pegada');
      extractedColors = res.colors;
      excludedSet.clear();
      renderImportPreview();
    };

    if (importTextarea) {
      importTextarea.addEventListener('input', parseFromTextarea);
    }

    if (btnPasteClipboard) {
      btnPasteClipboard.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && importTextarea) {
            importTextarea.value = text;
            parseFromTextarea();
            this.showToast('✓ Contenido del portapapeles pegado y procesado');
          }
        } catch (e) {
          this.showToast('No se pudo acceder al portapapeles directamente', 'warning');
        }
      });
    }

    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        const sample = `/* Paleta de Iluminación Cinematográfica */\n:root {\n  --key-light: #FFE29F;\n  --fill-cyan: #00E5FF;\n  --rim-neon: #FF0055;\n  --shadow-indigo: #1A103C;\n  --deep-ambient: #0B0818;\n  --amber-spark: #FFAE19;\n}`;
        if (importTextarea) {
          importTextarea.value = sample;
          if (importNameInput) importNameInput.value = 'Muestra Cinematográfica Studio';
          parseFromTextarea();
          this.showToast('✓ Ejemplo cromático cargado');
        }
      });
    }

    // Option change listeners
    if (chkDeduplicate) chkDeduplicate.addEventListener('change', renderImportPreview);
    if (chkDeltaEFilter) chkDeltaEFilter.addEventListener('change', renderImportPreview);
    if (importSortSelect) importSortSelect.addEventListener('change', renderImportPreview);

    if (btnSelectAllPreview) {
      btnSelectAllPreview.addEventListener('click', () => {
        excludedSet.clear();
        renderImportPreview();
      });
    }

    if (btnClearPreview) {
      btnClearPreview.addEventListener('click', () => {
        extractedColors.forEach((_, idx) => excludedSet.add(idx));
        renderImportPreview();
      });
    }

    const openImportModalWithFile = (file = null) => {
      if (!importModal) return;
      importModal.style.display = 'flex';
      excludedSet.clear();
      if (file) {
        setImportTab('file');
        processLoadedFile(file);
      } else {
        setImportTab('file');
        if (importNameInput) {
          importNameInput.value = `Paleta Importada #${this.swatchManager.palettes.length + 1}`;
        }
        renderImportPreview();
      }
    };

    if (btnImportModal && importModal) {
      btnImportModal.addEventListener('click', () => openImportModalWithFile(null));
    }

    const closeImport = () => {
      if (importModal) importModal.style.display = 'none';
      activeImportFile = null;
      if (importFileInput) importFileInput.value = '';
      if (importFileStatus) importFileStatus.style.display = 'none';
    };

    if (btnCloseImport) btnCloseImport.addEventListener('click', closeImport);
    if (btnCancelImport) btnCancelImport.addEventListener('click', closeImport);

    if (btnConfirmImport) {
      btnConfirmImport.addEventListener('click', () => {
        const candidateColors = extractedColors.filter((_, idx) => !excludedSet.has(idx));
        const options = {
          removeDuplicates: chkDeduplicate ? chkDeduplicate.checked : true,
          deltaEThreshold: chkDeltaEFilter && chkDeltaEFilter.checked ? 2.5 : 0,
          sort: importSortSelect ? importSortSelect.value : 'original'
        };
        const finalColors = PaletteImporterEngine.processColors(candidateColors, options);
        if (finalColors.length === 0) return;

        const name = (importNameInput?.value || '').trim() || `Paleta Importada (${finalColors.length} colores)`;
        const hexList = finalColors.map(c => c.hex);
        const destination = importDestinationSelect ? importDestinationSelect.value : 'new';

        if (destination === 'new') {
          const newPal = this.swatchManager.addPalette(name, hexList);
          this.showToast(`✓ Nueva paleta '${newPal.name}' creada con ${hexList.length} colores`, 'success');
        } else if (destination === 'merge') {
          const activePal = this.swatchManager.getActivePalette();
          if (activePal) {
            hexList.forEach(hex => this.swatchManager.addColorToPalette(activePal.id, hex));
            this.showToast(`✓ Fusionadas ${hexList.length} muestras en '${activePal.name}'`, 'success');
          } else {
            this.swatchManager.addPalette(name, hexList);
          }
        } else if (destination === 'replace') {
          const activePal = this.swatchManager.getActivePalette();
          if (activePal) {
            this.swatchManager.clearPaletteColors(activePal.id);
            hexList.forEach(hex => this.swatchManager.addColorToPalette(activePal.id, hex));
            this.showToast(`✓ Paleta '${activePal.name}' actualizada con ${hexList.length} colores`, 'success');
          } else {
            this.swatchManager.addPalette(name, hexList);
          }
        }

        closeImport();
        this.renderSwatchesCollection();
        this.renderQuickPalette();
      });
    }

    // Direct Drag-and-Drop of palette files onto the Swatches View
    const swatchesContainer = document.getElementById('swatchesCollection');
    const viewSwatches = document.getElementById('viewSwatches');
    [swatchesContainer, viewSwatches].forEach(zone => {
      if (!zone) return;
      zone.addEventListener('dragover', (e) => {
        if (e.dataTransfer?.types?.includes('Files')) {
          e.preventDefault();
        }
      });
      zone.addEventListener('drop', (e) => {
        if (e.dataTransfer?.files?.length > 0) {
          const file = e.dataTransfer.files[0];
          const ext = file.name.split('.').pop().toLowerCase();
          if (['ase', 'gpl', 'json', 'css', 'scss', 'txt'].includes(ext)) {
            e.preventDefault();
            e.stopPropagation();
            openImportModalWithFile(file);
          }
        }
      });
    });

    // Universal Export Bar Listeners (export active palette)
    if (btnAse) {
      btnAse.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'GOM_Harmonies', colors: [this.fgColor.hex, this.bgColor.hex] };
        this.swatchManager.exportAsAse(activePal);
        this.showToast('Descargado archivo .ASE (Adobe Swatch Exchange para Photoshop)');
      });
    }

    if (btnGpl) {
      btnGpl.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'GOM_Harmonies', colors: [this.fgColor.hex, this.bgColor.hex] };
        this.swatchManager.exportAsGpl(activePal);
        this.showToast('Descargado archivo .GPL para GIMP y Krita');
      });
    }

    if (btnCss) {
      btnCss.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'GOM_Harmonies', colors: [this.fgColor.hex, this.bgColor.hex] };
        const css = this.swatchManager.exportAsCss(activePal);
        this.copyToClipboard(css);
        this.showToast('Variables CSS copiadas al portapapeles');
      });
    }

    if (btnJson) {
      btnJson.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'GOM_Harmonies', colors: [this.fgColor.hex, this.bgColor.hex] };
        const json = this.swatchManager.exportAsJson(activePal);
        this.copyToClipboard(json);
        this.showToast('Tokens de diseño JSON copiados');
      });
    }

    if (btnSvg) {
      btnSvg.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'GOM_Harmonies', colors: [this.fgColor.hex, this.bgColor.hex] };
        this.swatchManager.exportAsSvgCard(activePal);
        this.showToast('Ficha de color en SVG descargada');
      });
    }

    if (btnSwatchesPng) {
      btnSwatchesPng.addEventListener('click', () => {
        const activePal = this.swatchManager.getActivePalette() || { name: 'Paleta Activa GOM Picker', colors: [this.fgColor.hex, this.bgColor.hex] };
        SwatchSheetExporter.openExportModal(activePal.name, activePal.colors, this);
      });
    }
  }

  renderSwatchesCollection() {
    const container = document.getElementById('swatchesCollection');
    if (!container) return;
    container.innerHTML = '';

    const filter = this.activeCatalogFilter || 'all';
    const searchQuery = (this.paletteSearchQuery || '').trim().toLowerCase();

    const matchesSearch = (item) => {
      if (!searchQuery) return true;
      if (item.name.toLowerCase().includes(searchQuery)) return true;
      if (item.category && item.category.toLowerCase().includes(searchQuery)) return true;
      const q = searchQuery.replace('#', '');
      return item.colors.some(c => {
        const hex = (typeof c === 'string' ? c : c.hex).toLowerCase().replace('#', '');
        return hex.includes(q);
      });
    };

    let renderedCount = 0;

    // 1. Render User Saved Palettes
    if (filter === 'all' || filter === 'user') {
      this.swatchManager.palettes.forEach(pal => {
        if (matchesSearch(pal)) {
          const card = this._createPaletteCardDom(pal, false);
          container.appendChild(card);
          renderedCount++;
        }
      });
    }

    // 2. Render Built-in Professional Catalogs (Copic, Pantone, Prismacolor)
    PaletteCatalogs.DEFAULT_LIBRARIES.forEach(cat => {
      if (filter === 'all' || filter === cat.id) {
        const palData = {
          id: cat.id,
          name: cat.name,
          category: cat.category,
          description: cat.description,
          colors: cat.colors.map(c => typeof c === 'string' ? c : c.hex)
        };
        if (matchesSearch(palData)) {
          const card = this._createPaletteCardDom(palData, true);
          container.appendChild(card);
          renderedCount++;
        }
      }
    });

    if (renderedCount === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.padding = '36px 12px';
      emptyDiv.style.color = 'var(--text-muted)';
      emptyDiv.style.fontSize = '0.85rem';
      emptyDiv.innerHTML = searchQuery 
        ? `No se encontraron paletas que coincidan con "<b>${searchQuery}</b>".`
        : 'No hay paletas para mostrar en esta categoría.';
      container.appendChild(emptyDiv);
    }
  }

  _createPaletteCardDom(pal, isBuiltIn = false) {
    const card = document.createElement('div');
    card.className = 'palette-collection-card';
    if (!isBuiltIn && pal.id === this.swatchManager.activePaletteId) {
      card.classList.add('palette-card-active');
    }
    card.dataset.paletteId = pal.id;

    // Header Row
    const headerRow = document.createElement('div');
    headerRow.className = 'palette-header-row';

    // Left info
    const infoCol = document.createElement('div');
    infoCol.className = 'palette-header-info';

    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'palette-title-wrapper';

    const nameText = document.createElement('div');
    nameText.className = 'palette-name-text';
    nameText.innerHTML = isBuiltIn ? pal.name : `${pal.name} <span style="font-size: 0.7rem; opacity: 0.6;">✏️</span>`;
    nameText.title = isBuiltIn ? pal.name : 'Doble click o click para renombrar esta paleta';

    // Inline rename for user palettes
    if (!isBuiltIn) {
      nameText.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'palette-name-input';
        input.value = pal.name;
        titleWrapper.replaceChild(input, nameText);
        input.focus();
        input.select();

        const commit = () => {
          const newName = input.value.trim();
          if (newName) {
            this.swatchManager.renamePalette(pal.id, newName);
            nameText.innerHTML = `${newName} <span style="font-size: 0.7rem; opacity: 0.6;">✏️</span>`;
            this.renderQuickPalette();
          }
          if (input.parentNode === titleWrapper) {
            titleWrapper.replaceChild(nameText, input);
          }
        };

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            if (input.parentNode === titleWrapper) {
              titleWrapper.replaceChild(nameText, input);
            }
          }
        });
      });
    }

    titleWrapper.appendChild(nameText);

    if (!isBuiltIn && pal.id === this.swatchManager.activePaletteId) {
      const activeBadge = document.createElement('span');
      activeBadge.className = 'palette-badge-active';
      activeBadge.innerHTML = '★ Activa';
      titleWrapper.appendChild(activeBadge);
    }

    const metaRow = document.createElement('div');
    metaRow.className = 'palette-meta-row';
    metaRow.textContent = `${pal.colors.length} colores • ${pal.category || (isBuiltIn ? 'Catálogo Oficial' : 'Paleta Personalizada')}`;

    infoCol.appendChild(titleWrapper);
    infoCol.appendChild(metaRow);

    // Continuous gradient preview bar
    if (pal.colors && pal.colors.length > 0) {
      const gradBar = document.createElement('div');
      gradBar.className = 'palette-gradient-strip';
      const cleanHexes = pal.colors.map(c => typeof c === 'string' ? c : c.hex);
      gradBar.style.background = cleanHexes.length === 1 
        ? cleanHexes[0] 
        : `linear-gradient(to right, ${cleanHexes.join(', ')})`;
      infoCol.appendChild(gradBar);
    }

    // Right: Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'palette-toolbar';

    if (!isBuiltIn) {
      // 0. Undo button (if this palette has a deleted swatch)
      if (this.swatchManager.lastDeleted && this.swatchManager.lastDeleted.paletteId === pal.id) {
        const btnUndo = document.createElement('button');
        btnUndo.className = 'palette-tool-btn btn-undo-glow';
        btnUndo.innerHTML = `<span>↩️</span> Deshacer (${this.swatchManager.lastDeleted.hex})`;
        btnUndo.title = `Restaurar ${this.swatchManager.lastDeleted.hex} en la posición original (Ctrl+Z)`;
        btnUndo.addEventListener('click', () => {
          const res = this.swatchManager.undoLastDelete();
          if (res) {
            this.renderSwatchesCollection();
            this.renderQuickPalette();
            this.showToast(`Color ${res.hex} restaurado en '${pal.name}'`, 'success');
          }
        });
        toolbar.appendChild(btnUndo);
      }

      // 1. Quick Add FG
      const btnAddFg = document.createElement('button');
      btnAddFg.className = 'palette-tool-btn btn-active-highlight';
      btnAddFg.innerHTML = '<span>+</span> FG';
      btnAddFg.title = `Añadir el color frontal actual (${this.fgColor.hex}) a esta paleta`;
      btnAddFg.addEventListener('click', () => {
        this.swatchManager.addColorToPalette(pal.id, this.fgColor.hex);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Color ${this.fgColor.hex} añadido a '${pal.name}'`);
      });
      toolbar.appendChild(btnAddFg);

      // 2. Set as Active Palette
      if (pal.id !== this.swatchManager.activePaletteId) {
        const btnSetActive = document.createElement('button');
        btnSetActive.className = 'palette-tool-btn';
        btnSetActive.innerHTML = '<span>★</span> Activar';
        btnSetActive.title = 'Establecer como la paleta activa principal';
        btnSetActive.addEventListener('click', () => {
          this.swatchManager.setActivePalette(pal.id);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          if (this.hyper4dStudio) {
            this.hyper4dStudio.syncWithActivePalette();
          }
          this.showToast(`Paleta activa: '${pal.name}'`, 'success');
        });
        toolbar.appendChild(btnSetActive);
      }

      // 3. Sort popover
      const btnSort = document.createElement('button');
      btnSort.className = 'palette-tool-btn';
      btnSort.innerHTML = '<span>↕️</span> Ordenar';
      btnSort.title = 'Ordenar muestras (Tono, Luz, Saturación)';
      btnSort.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPaletteSortPopover(btnSort, pal);
      });
      toolbar.appendChild(btnSort);

      // 4. Duplicate palette
      const btnDup = document.createElement('button');
      btnDup.className = 'palette-tool-btn';
      btnDup.innerHTML = '<span>📑</span>';
      btnDup.title = 'Duplicar esta paleta';
      btnDup.addEventListener('click', () => {
        const cloned = this.swatchManager.duplicatePalette(pal.id);
        if (cloned) {
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Paleta duplicada: '${cloned.name}'`, 'success');
        }
      });
      toolbar.appendChild(btnDup);

      // 4.5 Smart Harmonizer & Quality Optimizer
      const btnHarmonize = document.createElement('button');
      btnHarmonize.className = 'palette-tool-btn btn-active-highlight';
      btnHarmonize.innerHTML = '<span>✨</span> Armonizar';
      btnHarmonize.title = 'Mejorar y armonizar inteligentemente esta biblioteca (Algoritmo Florent Farges / Munsell)';
      btnHarmonize.addEventListener('click', () => {
        if (!pal.colors || pal.colors.length < 2) {
          this.showToast('La paleta necesita al menos 2 colores para armonizarse', 'warn');
          return;
        }
        const hexes = pal.colors.map(c => typeof c === 'string' ? c : c.hex);
        const optResult = PaletteOptimizer.optimize(hexes, 'auto_master', 0.85);
        pal.colors = optResult.optimizedColors;
        this.swatchManager.saveToStorage();
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`✨ '${pal.name}' optimizada a Grado ${optResult.scoreAfter.grade} (${optResult.scoreAfter.totalScore} Pts, +${optResult.improvement})`, 'success');
      });
      toolbar.appendChild(btnHarmonize);

      // 5. Invert colors
      const btnInvert = document.createElement('button');
      btnInvert.className = 'palette-tool-btn';
      btnInvert.innerHTML = '<span>🔄</span>';
      btnInvert.title = 'Invertir todos los colores (Complementarios)';
      btnInvert.addEventListener('click', () => {
        this.swatchManager.invertColorsInPalette(pal.id);
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`Colores invertidos en '${pal.name}'`);
      });
      toolbar.appendChild(btnInvert);

      // 5.5 Variations generator
      const btnVariations = document.createElement('button');
      btnVariations.className = 'palette-tool-btn';
      btnVariations.innerHTML = '<span>🎨</span> Variaciones';
      btnVariations.title = 'Derivar variaciones cromáticas (Noche, Pastel, Tierras, Complementarios)';
      btnVariations.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPaletteVariationsPopover(btnVariations, pal);
      });
      toolbar.appendChild(btnVariations);

      // 6. Export Menu
      const btnExport = document.createElement('button');
      btnExport.className = 'palette-tool-btn';
      btnExport.innerHTML = '<span>💾</span> Exportar';
      btnExport.title = 'Exportar paleta (.ASE, .GPL, CSS, JSON, SVG, PNG)';
      btnExport.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPaletteExportPopover(btnExport, pal);
      });
      toolbar.appendChild(btnExport);

      // 7. Clear swatches
      const btnClear = document.createElement('button');
      btnClear.className = 'palette-tool-btn btn-danger-hover';
      btnClear.innerHTML = '<span>🧹</span>';
      btnClear.title = 'Vaciar todas las muestras de esta paleta';
      btnClear.addEventListener('click', () => {
        if (confirm(`¿Vaciar todas las muestras de "${pal.name}"?`)) {
          this.swatchManager.clearPaletteColors(pal.id);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Muestras vaciadas de '${pal.name}'`);
        }
      });
      toolbar.appendChild(btnClear);

      // 8. Delete palette
      const btnDel = document.createElement('button');
      btnDel.className = 'palette-tool-btn btn-danger-hover';
      btnDel.innerHTML = '<span>✕</span>';
      btnDel.title = 'Eliminar esta paleta por completo';
      btnDel.addEventListener('click', () => {
        if (confirm(`¿Eliminar la paleta "${pal.name}"?`)) {
          this.swatchManager.deletePalette(pal.id);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Paleta '${pal.name}' eliminada`);
        }
      });
      toolbar.appendChild(btnDel);
    } else {
      // Built-in catalog card actions
      const btnClone = document.createElement('button');
      btnClone.className = 'palette-tool-btn btn-active-highlight';
      btnClone.innerHTML = '<span>📑</span> Clonar Editable';
      btnClone.title = 'Crear una copia editable de este catálogo en tus paletas';
      btnClone.addEventListener('click', () => {
        const cloned = this.swatchManager.duplicatePalette(pal.id, pal);
        if (cloned) {
          this.activeCatalogFilter = 'user';
          const userTab = document.querySelector('#catalogFilterTabs button[data-cat="user"]');
          if (userTab) {
            document.querySelectorAll('#catalogFilterTabs button').forEach(b => b.classList.remove('active-toggle'));
            userTab.classList.add('active-toggle');
          }
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`✓ Catálogo clonado como paleta editable '${cloned.name}'`, 'success');
        }
      });
      toolbar.appendChild(btnClone);

      const btnVariations = document.createElement('button');
      btnVariations.className = 'palette-tool-btn';
      btnVariations.innerHTML = '<span>🎨</span> Variaciones';
      btnVariations.title = 'Derivar variaciones cromáticas de este catálogo';
      btnVariations.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPaletteVariationsPopover(btnVariations, pal);
      });
      toolbar.appendChild(btnVariations);

      const btnExport = document.createElement('button');
      btnExport.className = 'palette-tool-btn';
      btnExport.innerHTML = '<span>💾</span> Exportar';
      btnExport.title = 'Exportar este catálogo';
      btnExport.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPaletteExportPopover(btnExport, pal);
      });
      toolbar.appendChild(btnExport);
    }

    headerRow.appendChild(infoCol);
    headerRow.appendChild(toolbar);

    // Swatches Flow Container
    const swatchesFlow = document.createElement('div');
    swatchesFlow.className = 'palette-swatches-flow';

    if (!pal.colors || pal.colors.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'palette-empty-dropzone';
      emptyNotice.innerHTML = '<span>🎨</span><span>Paleta vacía. Arrastra colores aquí o pulsa <b>+ FG</b> para empezar.</span>';
      swatchesFlow.appendChild(emptyNotice);
    } else {
      pal.colors.forEach((col, idx) => {
        const hex = typeof col === 'string' ? col : col.hex;
        const pill = this._createSwatchPillDom(pal, hex, idx, isBuiltIn);
        swatchesFlow.appendChild(pill);
      });
    }

    // Drag-and-drop listener to accept swatches onto this palette card
    if (!isBuiltIn) {
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over');
        }
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');

        const rawSwatchData = e.dataTransfer.getData('application/gom-swatch');
        const rawHex = e.dataTransfer.getData('text/plain');

        if (rawSwatchData) {
          try {
            const { paletteId: sourcePalId, hex: sourceHex } = JSON.parse(rawSwatchData);
            if (sourcePalId !== pal.id) {
              this.swatchManager.addColorToPalette(pal.id, sourceHex);
              this.renderSwatchesCollection();
              this.renderQuickPalette();
              this.showToast(`Color ${sourceHex} copiado a '${pal.name}'`);
              return;
            }
          } catch (err) {}
        }

        if (rawHex && rawHex.startsWith('#')) {
          this.swatchManager.addColorToPalette(pal.id, rawHex);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color ${rawHex} añadido a '${pal.name}'`);
        }
      });
    }

    card.appendChild(headerRow);
    card.appendChild(swatchesFlow);
    return card;
  }

  // --- SUBLIME RECENT COLOR HISTORY STUDIO ---

  _bindHistoryControls() {
    const ribbon = document.getElementById('historyRibbon');
    const wrapper = document.getElementById('historyRibbonWrapper');
    const btnLeft = document.getElementById('btnScrollHistoryLeft');
    const btnRight = document.getElementById('btnScrollHistoryRight');
    const btnGrid = document.getElementById('btnToggleHistoryGrid');
    const btnClear = document.getElementById('btnClearHistory');
    const btnAddActive = document.getElementById('btnHistoryAddActive');

    // Smooth horizontal scrolling with mouse wheel over ribbon
    if (ribbon) {
      ribbon.addEventListener('wheel', (e) => {
        if (!ribbon.classList.contains('grid-mode') && e.deltaY !== 0) {
          e.preventDefault();
          ribbon.scrollLeft += e.deltaY * 0.9;
        }
      }, { passive: false });
    }

    if (btnLeft && ribbon) {
      btnLeft.addEventListener('click', () => {
        ribbon.scrollBy({ left: -140, behavior: 'smooth' });
      });
    }

    if (btnRight && ribbon) {
      btnRight.addEventListener('click', () => {
        ribbon.scrollBy({ left: 140, behavior: 'smooth' });
      });
    }

    if (btnGrid && ribbon) {
      btnGrid.addEventListener('click', () => {
        ribbon.classList.toggle('grid-mode');
        const isGrid = ribbon.classList.contains('grid-mode');
        btnGrid.classList.toggle('active', isGrid);
        const icon = document.getElementById('historyGridIcon');
        if (icon) icon.textContent = isGrid ? '↔' : '⊞';
        btnGrid.title = isGrid ? 'Cambiar a modo Carrusel horizontal (↔)' : 'Cambiar a modo Cuadrícula completa (⊞)';
        try {
          localStorage.setItem('gom_history_grid_mode', isGrid ? '1' : '0');
        } catch (_) {}
      });

      // Restore saved grid preference
      try {
        if (localStorage.getItem('gom_history_grid_mode') === '1') {
          ribbon.classList.add('grid-mode');
          btnGrid.classList.add('active');
          const icon = document.getElementById('historyGridIcon');
          if (icon) icon.textContent = '↔';
        }
      } catch (_) {}
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (!this.swatchManager.history || this.swatchManager.history.length === 0) return;
        this.swatchManager.history = [];
        try {
          localStorage.setItem(this.swatchManager.historyKey, JSON.stringify([]));
        } catch (_) {}
        this.renderHistoryRibbon();
        this.showToast('Historial reciente vaciado', 'info');
      });
    }

    if (btnAddActive) {
      btnAddActive.addEventListener('click', () => {
        const curHex = this.activeWell === 'fg' ? this.fgColor.hex : this.bgColor.hex;
        this.swatchManager.addToHistory(curHex);
        this.renderHistoryRibbon();
        this.showToast(`Color ${curHex} añadido al historial`);
      });
    }

    // Drag and Drop support onto the history ribbon
    if (wrapper) {
      wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        wrapper.style.borderColor = 'var(--accent-primary)';
      });
      wrapper.addEventListener('dragleave', () => {
        wrapper.style.borderColor = '';
      });
      wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        wrapper.style.borderColor = '';
        const hex = e.dataTransfer.getData('text/plain');
        if (hex && hex.startsWith('#')) {
          this.swatchManager.addToHistory(hex);
          this.renderHistoryRibbon();
          this.showToast(`Color ${hex} añadido al historial`);
        }
      });
    }
  }

  renderHistoryRibbon() {
    const container = document.getElementById('historyRibbon');
    const badge = document.getElementById('historyCountBadge');
    const lastHex = document.getElementById('historyLastHex');
    if (!container) return;
    container.innerHTML = '';

    const history = this.swatchManager.history || [];
    if (badge) badge.textContent = `${history.length}`;
    if (lastHex && history.length > 0) lastHex.textContent = history[0];

    if (history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty-msg';
      empty.textContent = 'Sin colores en el historial reciente';
      container.appendChild(empty);
      return;
    }

    const currentHex = (this.activeWell === 'fg' ? this.fgColor.hex : this.bgColor.hex).toUpperCase();

    history.forEach((hex, idx) => {
      const chip = document.createElement('div');
      chip.className = 'history-item';
      if (hex.toUpperCase() === currentHex) {
        chip.classList.add('active-fg');
      }
      chip.style.backgroundColor = hex;
      chip.title = `${hex} (#${idx + 1}) • Click: Frontal • Alt+Click: Fondo • Arrastra para guardar`;
      chip.dataset.swatchHex = hex;
      chip.dataset.swatchLabel = `Historial ${hex}`;
      chip.draggable = true;

      chip.addEventListener('click', (e) => {
        if (e.altKey) {
          // Alt+click sets Background color
          this.activeWell = 'bg';
          const bgWell = document.getElementById('bgWell');
          const fgWell = document.getElementById('fgWell');
          if (bgWell) bgWell.classList.add('active');
          if (fgWell) fgWell.classList.remove('active');
          this.setColorDirectly(ColorMath.hexToRgb(hex));
          this.showToast(`Fondo (BG) actualizado: ${hex}`);
        } else {
          this.setColorDirectly(ColorMath.hexToRgb(hex));
          this.showToast(`Color del historial: ${hex}`);
        }
      });

      container.appendChild(chip);
    });
  }

  _bindWheelOptions() {
    const modeSelect = document.getElementById('wheelModeSelect');
    const harmonySelect = document.getElementById('harmonyRuleSelect');

    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.colorWheel.setMode(e.target.value);
      });
    }

    if (harmonySelect) {
      harmonySelect.addEventListener('change', (e) => {
        const ruleId = e.target.value;
        this.colorWheel.setHarmonyRule(ruleId);
        const curHsv = this.colorWheel ? this.colorWheel.hsv : ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b);
        const harmonies = HarmonyEngine.getHarmony(curHsv, ruleId, this.colorWheel?.mode === 'ryb' ? 'ryb' : 'rgb');
        this.renderHarmonySwatches(harmonies);
        if (this.hyper4dStudio) {
          const harmSelect4D = document.getElementById('hyper4dHarmonyRuleSelect');
          if (harmSelect4D) harmSelect4D.value = ruleId;
          this.hyper4dStudio.setHarmonyRule(ruleId);
        }
      });
    }
  }

  // --- NEXT LEVEL UTILITIES & ENHANCEMENTS ---

  updateLiveAccentTheme(hex, rgb) {
    if (!hex || !rgb) return;
    document.documentElement.style.setProperty('--live-accent', hex);
    document.documentElement.style.setProperty('--live-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
    document.documentElement.style.setProperty('--live-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
  }

  updateWcagBadge() {
    const badge = document.getElementById('heroWcagBadge');
    if (!badge || !this.fgColor || !this.bgColor) return;
    const ratio = ColorMath.getContrastRatio(this.fgColor, this.bgColor);
    const formatted = ratio.toFixed(1) + ':1';
    let compliance = 'Fail';
    let cls = 'wcag-fail';
    if (ratio >= 7.0) {
      compliance = 'AAA';
      cls = 'wcag-aaa';
    } else if (ratio >= 4.5) {
      compliance = 'AA';
      cls = 'wcag-aa';
    } else if (ratio >= 3.0) {
      compliance = 'AA Lg';
      cls = 'wcag-aa';
    }
    badge.className = `hero-wcag-badge ${cls}`;
    badge.textContent = `${formatted} (${compliance})`;
    badge.title = `Contraste WCAG 2.1 entre FG (${this.fgColor.hex}) y BG (${this.bgColor.hex}): ${formatted} (${compliance})`;
  }

  pushColorHistory(immediate = false) {
    const record = () => {
      const state = {
        fg: { ...this.fgColor },
        bg: { ...this.bgColor },
        activeWell: this.activeWell
      };
      if (this.colorHistory.length > 0 && this.colorHistoryIndex >= 0) {
        const prev = this.colorHistory[this.colorHistoryIndex];
        if (prev.fg.hex === state.fg.hex && prev.bg.hex === state.bg.hex && prev.activeWell === state.activeWell) {
          return;
        }
      }
      if (this.colorHistoryIndex < this.colorHistory.length - 1) {
        this.colorHistory = this.colorHistory.slice(0, this.colorHistoryIndex + 1);
      }
      this.colorHistory.push(state);
      if (this.colorHistory.length > 50) this.colorHistory.shift();
      this.colorHistoryIndex = this.colorHistory.length - 1;
      this._saveSession();
    };

    if (immediate) {
      record();
    } else {
      clearTimeout(this.historyDebounceTimer);
      this.historyDebounceTimer = setTimeout(record, 250);
    }
  }

  undoColor() {
    if (this.colorHistoryIndex > 0) {
      this.colorHistoryIndex--;
      const state = this.colorHistory[this.colorHistoryIndex];
      this._applyHistoryState(state);
      this.showToast(`Deshacer: Color restaurado (${state.activeWell === 'fg' ? state.fg.hex : state.bg.hex})`, 'info');
    } else {
      this.showToast('No hay más cambios anteriores para deshacer', 'warn');
    }
  }

  redoColor() {
    if (this.colorHistoryIndex < this.colorHistory.length - 1) {
      this.colorHistoryIndex++;
      const state = this.colorHistory[this.colorHistoryIndex];
      this._applyHistoryState(state);
      this.showToast(`Rehacer: Color restaurado (${state.activeWell === 'fg' ? state.fg.hex : state.bg.hex})`, 'info');
    } else {
      this.showToast('No hay más cambios posteriores para rehacer', 'warn');
    }
  }

  _applyHistoryState(state) {
    this.fgColor = { ...state.fg };
    this.bgColor = { ...state.bg };
    this.activeWell = state.activeWell;
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    if (fg) {
      fg.style.backgroundColor = this.fgColor.hex;
      if (this.activeWell === 'fg') fg.classList.add('active'); else fg.classList.remove('active');
    }
    if (bg) {
      bg.style.backgroundColor = this.bgColor.hex;
      if (this.activeWell === 'bg') bg.classList.add('active'); else bg.classList.remove('active');
    }
    const target = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
    this.setColorDirectly(target);
  }

  resetDefaultColors() {
    this.fgColor = { r: 0, g: 0, b: 0, hex: '#000000' };
    this.bgColor = { r: 255, g: 255, b: 255, hex: '#FFFFFF' };
    this.baseFgColor = { ...this.fgColor };
    this.baseBgColor = { ...this.bgColor };
    this.activeWell = 'fg';
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    if (fg) { fg.style.backgroundColor = '#000000'; fg.classList.add('active'); }
    if (bg) { bg.style.backgroundColor = '#FFFFFF'; bg.classList.remove('active'); }
    this.setColorDirectly(this.fgColor);
    this.pushColorHistory(true);
    this.showToast('Colores restablecidos a Blanco y Negro por defecto (D)', 'info');
  }

  async triggerEyeDropper() {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const rgb = ColorMath.hexToRgb(result.sRGBHex);
          this.setColorDirectly(rgb);
          this.pushColorHistory(true);
          this.showToast(`Pipeta: Color capturado ${result.sRGBHex}`, 'success');
        }
      } catch (err) {
        // Cancelled by user
      }
    } else {
      this.showToast('La Pipeta nativa (EyeDropper) está disponible en navegadores Chrome / Edge', 'warn');
    }
  }

  _saveSession() {
    try {
      const activeTabBtn = document.querySelector('.nav-tab-btn.active');
      const session = {
        fg: this.fgColor,
        bg: this.bgColor,
        activeWell: this.activeWell,
        tab: activeTabBtn ? activeTabBtn.dataset.tab : 'studio',
        wheelMode: document.getElementById('wheelModeSelect')?.value || 'triangle'
      };
      localStorage.setItem('gom_picker_session_v1', JSON.stringify(session));
    } catch (_) {}
  }

  _restoreSavedSession() {
    try {
      const raw = localStorage.getItem('gom_picker_session_v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.fg && data.fg.r !== undefined) {
        this.fgColor = data.fg;
        this.baseFgColor = { ...data.fg };
      }
      if (data.bg && data.bg.r !== undefined) {
        this.bgColor = data.bg;
        this.baseBgColor = { ...data.bg };
      }
      if (data.activeWell) this.activeWell = data.activeWell;
      if (data.wheelMode && this.colorWheel) {
        const sel = document.getElementById('wheelModeSelect');
        if (sel) sel.value = data.wheelMode;
        this.colorWheel.setMode(data.wheelMode);
      }
      if (data.tab && data.tab !== 'studio') {
        const btn = document.querySelector(`.nav-tab-btn[data-tab="${data.tab}"]`);
        if (btn) btn.click();
      }
    } catch (_) {}
  }

  switchTab(tabKey) {
    const btn = document.querySelector(`.nav-tab-btn[data-tab="${tabKey}"]`);
    if (btn) btn.click();
  }

  _bindEyeDropper() {
    const btn = document.getElementById('btnEyeDropper');
    if (btn) {
      btn.addEventListener('click', () => this.triggerEyeDropper());
    }
  }

  _bindShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    const btnClose = document.getElementById('btnCloseShortcutsModal');
    const btnOpen = document.getElementById('btnShortcutsHelp');

    const open = () => { if (modal) modal.style.display = 'flex'; };
    const close = () => { if (modal) modal.style.display = 'none'; };

    if (btnOpen) btnOpen.addEventListener('click', open);
    if (btnClose) btnClose.addEventListener('click', close);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }

    this.openShortcutsModal = open;
    this.closeShortcutsModal = close;
  }

  _bindCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('commandPaletteInput');
    const results = document.getElementById('commandPaletteResults');
    const btnOpen = document.getElementById('btnCommandPalette');

    if (!modal || !input || !results) return;

    const commands = [
      // Navegación
      { title: 'Ir a Estudio Cromático', category: 'Espacio', icon: '🎨', action: () => this.switchTab('studio') },
      { title: 'Ir a Máscaras de Gama & Munsell', category: 'Espacio', icon: '🎯', action: () => this.switchTab('gamut_munsell') },
      { title: 'Ir a Chromilla: Catálogo de Tubos', category: 'Espacio', icon: '🧪', action: () => this.switchTab('chromilla') },
      { title: 'Ir a Teoría del Color de Florent Farges', category: 'Espacio', icon: '👨‍🎨', action: () => this.switchTab('florent') },
      { title: 'Ir a Modificador Dinámico de Atmósfera', category: 'Espacio', icon: '🌅', action: () => this.switchTab('atmosphere') },
      { title: 'Ir a Paletas de Grandes Maestros', category: 'Espacio', icon: '🏛️', action: () => this.switchTab('masters') },
      { title: 'Ir a Extractor K-Means & Análisis de Lote', category: 'Espacio', icon: '📷', action: () => this.switchTab('extractor') },
      { title: 'Ir a Asesor Cromático IA Local', category: 'Espacio', icon: '🧠', action: () => this.switchTab('ai') },
      { title: 'Ir a Bibliotecas & Exportación .ASE', category: 'Espacio', icon: '📚', action: () => this.switchTab('swatches') },

      // Herramientas
      { title: 'Pipeta de Pantalla Completa (EyeDropper)', category: 'Herramienta', icon: '💉', action: () => this.triggerEyeDropper() },
      { title: 'Intercambiar Frontal / Fondo (Tecla X)', category: 'Color', icon: '🔄', action: () => this.swapWells() },
      { title: 'Restaurar Blanco y Negro por defecto (Tecla D)', category: 'Color', icon: '⬛', action: () => this.resetDefaultColors() },
      { title: 'Inspección Tonal B/N Grayscale (Tecla V)', category: 'Herramienta', icon: '👁️', action: () => document.getElementById('btnValueCheck')?.click() },
      { title: 'Copiar código HEX actual', category: 'Portapapeles', icon: '📋', action: () => this.copyToClipboard(this.activeWell === 'fg' ? this.fgColor.hex : this.bgColor.hex) },
      { title: 'Deshacer cambio de color (Ctrl+Z)', category: 'Historial', icon: '↩️', action: () => this.undoColor() },
      { title: 'Rehacer cambio de color (Ctrl+Y)', category: 'Historial', icon: '↪️', action: () => this.redoColor() },
      { title: 'Ver Atajos de Teclado (?)', category: 'Ayuda', icon: '⌨️', action: () => this.openShortcutsModal() },
      { title: 'Alternar Barra Lateral (Colapsar/Expandir)', category: 'Vista', icon: '◀', action: () => document.getElementById('btnToggleSidebar')?.click() },
      { title: 'Abrir Ventana Flotante UXP Independiente', category: 'Herramienta', icon: '🪟', action: () => document.getElementById('btnCompactMode')?.click() },

      // Paletas Históricas
      { title: 'Cargar Paleta Zorn (Ocre, Bermellón, Negro, Blanco)', category: 'Paleta', icon: '🎨', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('zorn'); } },
      { title: 'Cargar Paleta Apeles de la Antigua Grecia', category: 'Paleta', icon: '🏛️', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('apelles'); } },
      { title: 'Cargar Paleta William Bouguereau', category: 'Paleta', icon: '🖼️', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('bouguereau'); } },
      { title: 'Cargar Paleta Velázquez (Tenebrismo & Retrato)', category: 'Paleta', icon: '🎭', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('velazquez'); } },
      { title: 'Cargar Paleta Sorolla (Luminismo Mediterráneo)', category: 'Paleta', icon: '🏖️', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('sorolla'); } },
      { title: 'Cargar Paleta Monet (Impresionismo & Sombras)', category: 'Paleta', icon: '🌸', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('monet'); } },
      { title: 'Cargar Paleta Rembrandt (Claroscuro Cálido)', category: 'Paleta', icon: '🕯️', action: () => { this.switchTab('gamut_munsell'); this.renderLimitedPalettes('rembrandt'); } }
    ];

    const openPalette = () => {
      this.commandPaletteOpen = true;
      modal.style.display = 'flex';
      input.value = '';
      this.commandPaletteIndex = 0;
      renderResults(commands);
      setTimeout(() => input.focus(), 50);
    };

    const closePalette = () => {
      this.commandPaletteOpen = false;
      modal.style.display = 'none';
    };

    const renderResults = (list) => {
      this.filteredCommands = list;
      if (list.length === 0) {
        results.innerHTML = '<div class="command-palette-empty">No se encontraron comandos coincidentes</div>';
        return;
      }

      results.innerHTML = list.map((cmd, idx) => `
        <div class="command-item ${idx === this.commandPaletteIndex ? 'active' : ''}" data-idx="${idx}">
          <div class="command-item-left">
            <span class="command-item-icon">${cmd.icon}</span>
            <div>
              <div class="command-item-title">${cmd.title}</div>
            </div>
          </div>
          <span class="command-item-category">${cmd.category}</span>
        </div>
      `).join('');

      results.querySelectorAll('.command-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.idx, 10);
          if (this.filteredCommands[idx]) {
            closePalette();
            this.filteredCommands[idx].action();
          }
        });
      });

      const activeEl = results.querySelector('.command-item.active');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    };

    if (btnOpen) btnOpen.addEventListener('click', openPalette);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePalette();
    });

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      this.commandPaletteIndex = 0;
      if (!query) {
        renderResults(commands);
        return;
      }
      const filtered = commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
      );
      renderResults(filtered);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.filteredCommands.length > 0) {
          this.commandPaletteIndex = (this.commandPaletteIndex + 1) % this.filteredCommands.length;
          renderResults(this.filteredCommands);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.filteredCommands.length > 0) {
          this.commandPaletteIndex = (this.commandPaletteIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
          renderResults(this.filteredCommands);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.filteredCommands[this.commandPaletteIndex]) {
          const action = this.filteredCommands[this.commandPaletteIndex].action;
          closePalette();
          action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });

    this.openCommandPalette = openPalette;
    this.closeCommandPalette = closePalette;
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (this.openCommandPalette) this.openCommandPalette();
        return;
      }

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (this.swatchManager && this.swatchManager.lastDeleted) {
          const restored = this.swatchManager.undoLastDelete();
          if (restored) {
            this.renderSwatchesCollection();
            this.renderQuickPalette();
            this.showToast(`Color ${restored.hex} restaurado en '${restored.paletteName}'`, 'success');
            return;
          }
        }
        this.undoColor();
        return;
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        this.redoColor();
        return;
      }

      // Escape closes open modals
      if (e.key === 'Escape') {
        if (this.commandPaletteOpen && this.closeCommandPalette) {
          this.closeCommandPalette();
          return;
        }
        if (this.closeShortcutsModal) this.closeShortcutsModal();
        const lightBox = document.getElementById('lightBoxModal');
        if (lightBox && lightBox.style.display !== 'none') lightBox.style.display = 'none';
        const addArtModal = document.getElementById('addArtModal');
        if (addArtModal && addArtModal.style.display !== 'none') addArtModal.style.display = 'none';
        const newCatModal = document.getElementById('newCatalogModal');
        if (newCatModal && newCatModal.style.display !== 'none') newCatModal.style.display = 'none';
        return;
      }

      // Tab toggles sidebar
      if (e.key === 'Tab') {
        e.preventDefault();
        document.getElementById('btnToggleSidebar')?.click();
        return;
      }

      // EyeDropper (I)
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        this.triggerEyeDropper();
        return;
      }

      // Reset to Default Black / White (D)
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.resetDefaultColors();
        return;
      }

      // Swap Wells (X)
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        this.swapWells();
        return;
      }

      // Value check (V)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        document.getElementById('btnValueCheck')?.click();
        return;
      }

      // Help shortcuts (?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (this.openShortcutsModal) this.openShortcutsModal();
        return;
      }

      // Space generates AI palette
      if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('btnAiGenerate')?.click();
        return;
      }

      // Number keys 1-7 for instant tabs
      if (e.key >= '1' && e.key <= '7' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const tabKeys = ['studio', 'gamut_munsell', 'chromilla', 'florent', 'atmosphere', 'masters', 'extractor'];
        const targetTab = tabKeys[parseInt(e.key, 10) - 1];
        if (targetTab) {
          e.preventDefault();
          this.switchTab(targetTab);
        }
      }
    });
  }

  copyToClipboard(text, customMsg = null) {
    const doToast = () => {
      this.showToast(customMsg || `Copiado: ${text}`, 'success');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doToast).catch(() => {
        this._fallbackCopy(text);
        doToast();
      });
    } else {
      this._fallbackCopy(text);
      doToast();
    }
  }

  _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(textarea);
  }

  // --- 1. WET PAINT PALETTE & DIGITAL PALETTE KNIFE (WET MIXER) ---

  _bindWetMixerControls() {
    const btnKnife = document.getElementById('btnMixerToolKnife');
    const btnBlend = document.getElementById('btnMixerToolBlend');
    const btnDab = document.getElementById('btnMixerToolDab');
    const btnPipette = document.getElementById('btnMixerToolPipette');

    const sizeRange = document.getElementById('mixerBrushSizeRange');
    const sizeVal = document.getElementById('mixerBrushSizeVal');
    const softRange = document.getElementById('mixerSoftnessRange');
    const softVal = document.getElementById('mixerSoftnessVal');
    const wetRange = document.getElementById('mixerWetnessRange');
    const wetVal = document.getElementById('mixerWetnessVal');

    const presetBtns = document.querySelectorAll('.mixer-preset-btn');

    const btnDepFg = document.getElementById('btnMixerDepositFg');
    const btnDepBg = document.getElementById('btnMixerDepositBg');
    const btnDepPal = document.getElementById('btnMixerDepositPalette') || document.getElementById('btnMixerDepositAi');
    const btnDepPrimaries = document.getElementById('btnMixerDepositPrimaries');
    const btnClear = document.getElementById('btnMixerClear');

    const setTool = (tool) => {
      if (!this.wetMixer) this._initWetMixer();
      if (this.wetMixer) this.wetMixer.setTool(tool);
      [btnKnife, btnBlend, btnDab, btnPipette].forEach(b => {
        if (b) b.classList.toggle('active', b.dataset.tool === tool);
      });
    };

    if (btnKnife) btnKnife.addEventListener('click', () => setTool('knife'));
    if (btnBlend) btnBlend.addEventListener('click', () => setTool('blend'));
    if (btnDab) btnDab.addEventListener('click', () => setTool('dab'));
    if (btnPipette) btnPipette.addEventListener('click', () => setTool('pipette'));

    if (sizeRange) {
      sizeRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) this.wetMixer.setBrushSize(val);
        if (sizeVal) sizeVal.textContent = `${val}px`;
      });
    }

    if (softRange) {
      softRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) this.wetMixer.setSoftness(val / 100);
        if (softVal) softVal.textContent = `${val}%`;
        presetBtns.forEach(b => b.classList.remove('active'));
      });
    }

    if (wetRange) {
      wetRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) this.wetMixer.setBlendStrength(val / 100);
        if (wetVal) wetVal.textContent = `${val}%`;
        presetBtns.forEach(b => b.classList.remove('active'));
      });
    }

    // Quick Mixing Presets
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) this.wetMixer.applyPreset(preset);

        presetBtns.forEach(b => b.classList.toggle('active', b === btn));

        if (preset === 'creamy') {
          if (softRange) softRange.value = 70;
          if (softVal) softVal.textContent = '70%';
          if (wetRange) wetRange.value = 45;
          if (wetVal) wetVal.textContent = '45%';
          setTool('blend');
          this.showToast('🧈 Fusión Cremosa activa: degradados infinitos y mantecosos', 'success');
        } else if (preset === 'knife') {
          if (softRange) softRange.value = 35;
          if (softVal) softVal.textContent = '35%';
          if (wetRange) wetRange.value = 60;
          if (wetVal) wetVal.textContent = '60%';
          setTool('knife');
          this.showToast('🔪 Espátula Firme activa: arrastre de óleo con relieve e impasto', 'success');
        } else if (preset === 'glaze') {
          if (softRange) softRange.value = 90;
          if (softVal) softVal.textContent = '90%';
          if (wetRange) wetRange.value = 30;
          if (wetVal) wetVal.textContent = '30%';
          setTool('blend');
          this.showToast('💨 Veladura activa: difuminado ultra-suave sin bordes', 'success');
        }
      });
    });

    if (btnDepFg) {
      btnDepFg.addEventListener('click', () => {
        if (!this.wetMixer) this._initWetMixer();
        const rgb = this.fgColor;
        this.wetMixer.depositDab(this.wetMixer.width * 0.38, this.wetMixer.height * 0.45, rgb, this.wetMixer.brushSize * 1.25);
        this.showToast(`Mancha de color frontal depositada: ${this.fgColor.hex}`);
      });
    }

    if (btnDepBg) {
      btnDepBg.addEventListener('click', () => {
        if (!this.wetMixer) this._initWetMixer();
        const rgb = this.bgColor;
        this.wetMixer.depositDab(this.wetMixer.width * 0.62, this.wetMixer.height * 0.45, rgb, this.wetMixer.brushSize * 1.25);
        this.showToast(`Mancha de color de fondo depositada: ${this.bgColor.hex}`);
      });
    }

    if (btnDepPal) {
      btnDepPal.addEventListener('click', () => {
        if (!this.wetMixer) this._initWetMixer();
        const colors = (this.currentAiPalette && this.currentAiPalette.colors) 
          ? this.currentAiPalette.colors 
          : (this.swatchManager.palettes[0]?.colors || [this.fgColor.hex, this.bgColor.hex]);
        
        const count = colors.length;
        const step = this.wetMixer.width / (count + 1);
        colors.forEach((c, idx) => {
          const hex = typeof c === 'string' ? c : c.hex;
          const rgb = ColorMath.hexToRgb(hex);
          const x = step * (idx + 1);
          const y = this.wetMixer.height * 0.65;
          this.wetMixer.depositDab(x, y, rgb, 38);
        });
        this.showToast(`Depositadas ${count} manchas de la paleta en el lienzo`);
      });
    }

    if (btnDepPrimaries) {
      btnDepPrimaries.addEventListener('click', () => {
        if (!this.wetMixer) this._initWetMixer();
        this.wetMixer.depositPrimaries();
        this.showToast('🌈 5 Tubos maestros depositados: Amarillo Cadmio, Cyan, Carmín, Blanco y Negro', 'success');
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (this.wetMixer) this.wetMixer.clearPalette();
        this.showToast('Lienzo de mezcla limpiado');
      });
    }

    const modeSelect = document.getElementById('mixerBlendModeSelect');
    const modeBadge = document.getElementById('mixerModeBadge');
    const modeDesc = document.getElementById('mixerPhysicsDesc');

    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (!this.wetMixer) this._initWetMixer();
        if (this.wetMixer) this.wetMixer.setBlendMode(mode);

        const modeData = {
          ryb: {
            badge: '🎨 Pigmento Real de Artista (RYB)',
            tip: '💡 <strong>Modo Pigmento Real Artista (RYB):</strong> Simulación física de pigmentos (óleo, acrílico). Amarillo + Cyan/Azul genera verde vibrante; Rojo + Amarillo genera naranja; y los colores complementarios se neutralizan hacia tierras/grises de artista.',
            toast: 'Física activa: Pigmento Real Artista (RYB Óleo/Acrílico)'
          },
          cmy: {
            badge: '💧 Sustractiva Acuarela/Tintas (CMY)',
            tip: '💡 <strong>Modo Sustractivo CMY:</strong> Absorción espectral de luz según la ley de Beer-Lambert (acuarela líquida y tintas gráficas). Cyan + Amarillo genera un verde esmeralda translúcido de alta intensidad cromática.',
            toast: 'Física activa: Sustractiva Acuarela/Tintas (CMY Físico)'
          },
          oklch: {
            badge: '✨ Perceptual OKLCH (Digital Vibrante)',
            tip: '💡 <strong>Modo Perceptual OKLCH:</strong> Espacio de color uniforme que mantiene el brillo cromático sin crear zonas oscuras ("grises muertos") intermedias en la fusión de los matices.',
            toast: 'Física activa: Perceptual OKLCH (Digital Luminoso)'
          },
          smudge: {
            badge: '🌪️ Difuminado Óptico (Smudge Clásico)',
            tip: '💡 <strong>Modo Difuminado Óptico:</strong> Fusión continua lineal corregida por gamma, similar al arrastre suave de grafito y pastel con un difumino tradicional de papel.',
            toast: 'Física activa: Difuminado Óptico Suave (Smudge Clásico)'
          }
        };

        const current = modeData[mode] || modeData.ryb;
        if (modeBadge) modeBadge.textContent = current.badge;
        if (modeDesc) modeDesc.innerHTML = current.tip;
        this.showToast(current.toast);
      });
    }
  }

  _initWetMixer() {
    if (!this.wetMixer) {
      const canvas = document.getElementById('wetMixerCanvas');
      if (canvas) {
        this.wetMixer = new WetMixerEngine(this);
        const modeSelect = document.getElementById('mixerBlendModeSelect');
        if (modeSelect) {
          this.wetMixer.setBlendMode(modeSelect.value);
        }
        const sizeRange = document.getElementById('mixerBrushSizeRange');
        if (sizeRange) this.wetMixer.setBrushSize(parseInt(sizeRange.value, 10));
        const softRange = document.getElementById('mixerSoftnessRange');
        if (softRange) this.wetMixer.setSoftness(parseInt(softRange.value, 10) / 100);
        const wetRange = document.getElementById('mixerWetnessRange');
        if (wetRange) this.wetMixer.setBlendStrength(parseInt(wetRange.value, 10) / 100);
        this.wetMixer.init('wetMixerCanvas');
      }
    }
  }

  // --- 2. PERCEPTUAL RAMP STUDIO & GRADIENT GENERATOR ---

  _bindRampStudioControls() {
    const btnSwap = document.getElementById('btnRampSwap');
    const modeSelect = document.getElementById('rampModeSelect');
    const curveSelect = document.getElementById('rampCurveSelect');
    const stepsSelect = document.getElementById('rampStepsSelect');

    const btnCopyCss = document.getElementById('btnRampCopyCss');
    const btnCopySvg = document.getElementById('btnRampCopySvg');
    const btnCopyHex = document.getElementById('btnRampCopyHexList');
    const btnDownPng = document.getElementById('btnRampDownloadPng');

    if (btnSwap) {
      btnSwap.addEventListener('click', () => {
        this.swapWells();
        this.renderRampStudio();
      });
    }

    [modeSelect, curveSelect, stepsSelect].forEach(sel => {
      if (sel) sel.addEventListener('change', () => this.renderRampStudio());
    });

    if (btnCopyCss) {
      btnCopyCss.addEventListener('click', () => {
        if (!this.currentRamp || this.currentRamp.length === 0) return;
        const css = RampStudio.generateCssGradient(this.currentRamp);
        navigator.clipboard.writeText(css);
        this.showToast('✓ CSS linear-gradient copiado al portapapeles', 'success');
      });
    }

    if (btnCopySvg) {
      btnCopySvg.addEventListener('click', () => {
        if (!this.currentRamp || this.currentRamp.length === 0) return;
        const svg = RampStudio.generateSvgGradient(this.currentRamp);
        navigator.clipboard.writeText(svg);
        this.showToast('✓ SVG linearGradient copiado al portapapeles', 'success');
      });
    }

    if (btnCopyHex) {
      btnCopyHex.addEventListener('click', () => {
        if (!this.currentRamp || this.currentRamp.length === 0) return;
        const hexList = this.currentRamp.map(s => s.hex).join(', ');
        navigator.clipboard.writeText(hexList);
        this.showToast(`✓ Códigos HEX copiados: ${hexList}`, 'success');
      });
    }

    if (btnDownPng) {
      btnDownPng.addEventListener('click', () => {
        if (!this.currentRamp || this.currentRamp.length === 0) return;
        RampStudio.downloadRampPng(this.currentRamp, `rampa_${this.fgColor.hex.slice(1)}_${this.bgColor.hex.slice(1)}.png`);
        this.showToast('✓ Rampa PNG descargada');
      });
    }
  }

  renderRampStudio() {
    const c1Pill = document.getElementById('rampColor1Pill');
    const c1Hex = document.getElementById('rampColor1Hex');
    const c2Pill = document.getElementById('rampColor2Pill');
    const c2Hex = document.getElementById('rampColor2Hex');
    const modeSelect = document.getElementById('rampModeSelect');
    const curveSelect = document.getElementById('rampCurveSelect');
    const stepsSelect = document.getElementById('rampStepsSelect');
    const continuousPreview = document.getElementById('rampContinuousPreview');
    const badge = document.getElementById('rampInterpolationBadge');
    const container = document.getElementById('rampDiscreteStepsContainer');

    if (c1Pill) c1Pill.style.backgroundColor = this.fgColor.hex;
    if (c1Hex) c1Hex.textContent = this.fgColor.hex;
    if (c2Pill) c2Pill.style.backgroundColor = this.bgColor.hex;
    if (c2Hex) c2Hex.textContent = this.bgColor.hex;

    const mode = modeSelect ? modeSelect.value : 'oklch';
    const curve = curveSelect ? curveSelect.value : 'linear';
    const steps = stepsSelect ? parseInt(stepsSelect.value, 10) : 8;

    const ramp = RampStudio.generateRamp(this.fgColor, this.bgColor, steps, mode, curve);
    this.currentRamp = ramp;

    if (continuousPreview) {
      continuousPreview.style.background = RampStudio.generateCssGradient(ramp);
    }
    if (badge) {
      badge.textContent = mode === 'oklch' ? 'OKLCH Perceptual' : (mode === 'subtractive' ? 'Pigmento Sustractivo' : 'RGB Lineal');
    }

    if (container) {
      container.innerHTML = '';
      ramp.forEach((s) => {
        const chip = document.createElement('div');
        chip.className = 'ramp-step-chip draggable-swatch';
        chip.style.backgroundColor = s.hex;
        chip.draggable = true;
        chip.dataset.hex = s.hex;
        chip.title = `Paso ${s.step}: ${s.hex} (${s.ratio}%) - Click para seleccionar`;

        chip.innerHTML = `
          <div class="ramp-step-meta">
            <span class="ramp-step-hex">${s.hex}</span>
            <span class="ramp-step-ratio">${s.ratio}%</span>
          </div>
        `;

        chip.addEventListener('click', () => {
          this.setColorDirectly(s.rgb);
          this.showToast(`Color de rampa seleccionado: ${s.hex}`);
        });

        chip.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', s.hex);
          e.dataTransfer.setData('application/json', JSON.stringify({ hex: s.hex, rgb: s.rgb }));
        });

        container.appendChild(chip);
      });
    }
  }

  // --- 3. COLOR VISION DEFICIENCY (CVD) ACCESSIBILITY MATRIX ---

  _bindCvdControls() {
    const btnOpen = document.getElementById('btnOpenCvdModal');
    const modal = document.getElementById('cvdModal');
    const btnClose = document.getElementById('btnCloseCvdModal');
    const btnDone = document.getElementById('btnDoneCvdModal');
    const filterSelect = document.getElementById('cvdGlobalFilterSelect');
    const btnResetFilter = document.getElementById('btnResetCvdFilter');

    this._isCvdModalOpen = false;

    const open = () => {
      if (modal) {
        modal.style.display = 'flex';
        this._isCvdModalOpen = true;
        this.renderCvdMatrix(this.fgColor);
      }
    };

    const close = () => {
      if (modal) {
        modal.style.display = 'none';
        this._isCvdModalOpen = false;
      }
    };

    if (btnOpen) btnOpen.addEventListener('click', open);
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnDone) btnDone.addEventListener('click', close);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        CVDSimulator.setGlobalFilter(val);
        const name = val === 'normal' ? 'Normal' : filterSelect.options[filterSelect.selectedIndex].text;
        this.showToast(`Filtro de pantalla global: ${name}`);
      });
    }

    if (btnResetFilter) {
      btnResetFilter.addEventListener('click', () => {
        if (filterSelect) filterSelect.value = 'normal';
        CVDSimulator.setGlobalFilter('normal');
        this.showToast('Visión normal restablecida');
      });
    }
  }

  renderCvdMatrix(color) {
    const grid = document.getElementById('cvdMatrixGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const hex = color.hex || ColorMath.rgbToHex(color.r, color.g, color.b);

    CVDSimulator.TYPES.forEach(type => {
      const simHex = CVDSimulator.simulateHex(hex, type.id);

      const card = document.createElement('div');
      card.className = 'cvd-quadrant-card';
      card.innerHTML = `
        <div class="cvd-card-header">
          <div class="cvd-card-title">
            <span>${type.id === 'normal' ? '👁️' : '🧬'}</span>
            <span>${type.name}</span>
          </div>
          <span class="cvd-card-pop">${type.pop}</span>
        </div>
        <div class="cvd-swatch-row">
          <div class="cvd-swatch-sample" style="background-color: ${simHex};"></div>
          <div class="cvd-swatch-info">
            <span class="cvd-swatch-hex">${simHex}</span>
            <span class="cvd-card-desc">${type.desc}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        navigator.clipboard.writeText(simHex);
        this.showToast(`Copiado HEX simulado (${type.name}): ${simHex}`);
      });

      grid.appendChild(card);
    });
  }

  // --- 4. PROFILE BACKUP & RESTORE SYSTEM ---

  _bindProfileBackupControls() {
    const btnOpen = document.getElementById('btnProfileBackup');
    const modal = document.getElementById('profileBackupModal');
    const btnClose = document.getElementById('btnCloseProfileBackupModal');
    const btnExport = document.getElementById('btnDoExportBackup');
    const btnTrigger = document.getElementById('btnTriggerImportBackup');
    const fileInput = document.getElementById('backupFileInput');

    const updateStats = () => {
      const pCountEl = document.getElementById('backupPalettesCount');
      const hCountEl = document.getElementById('backupHistoryCount');
      const cCountEl = document.getElementById('backupCatalogsCount');

      let pCount = this.swatchManager.palettes?.length || 0;
      let hCount = this.swatchManager.history?.length || 0;
      let cCount = 0;

      try {
        const cRaw = localStorage.getItem('gom_custom_master_catalogs');
        if (cRaw) cCount = JSON.parse(cRaw).length;
      } catch (_) {}

      if (pCountEl) pCountEl.textContent = pCount;
      if (hCountEl) hCountEl.textContent = hCount;
      if (cCountEl) cCountEl.textContent = cCount;
    };

    const open = () => {
      if (modal) {
        modal.style.display = 'flex';
        updateStats();
      }
    };

    const close = () => {
      if (modal) modal.style.display = 'none';
    };

    if (btnOpen) btnOpen.addEventListener('click', open);
    if (btnClose) btnClose.addEventListener('click', close);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        ProfileBackup.exportBackup(this);
      });
    }

    if (btnTrigger && fileInput) {
      btnTrigger.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const success = await ProfileBackup.importBackup(file, this);
          if (success) {
            updateStats();
            setTimeout(close, 1200);
          }
        }
        fileInput.value = '';
      });
    }
  }

  showToast(message, type = 'info', duration = 2800, action = null) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      info: '💡',
      success: '✔️',
      warn: '⚠️',
      error: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span style="font-size: 1.1rem; line-height: 1;">${icons[type] || '✨'}</span><span>${message}</span>`;
    
    if (action && action.text && typeof action.onClick === 'function') {
      const actBtn = document.createElement('button');
      actBtn.className = 'toast-action-btn';
      actBtn.innerHTML = action.text;
      actBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
        toast.remove();
      });
      toast.appendChild(actBtn);
    }

    toast.onclick = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 200);
    };

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new GomPickerApp();
  app.init();
  window.gomPicker = app;
  window.app = app;
});

