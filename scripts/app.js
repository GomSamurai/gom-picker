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
    this.tooltipEngine = null;
    this.currentAiPalette = null;
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
        const { type, rgb, hsv } = event.data || {};
        if (type === 'POPUP_COLOR_UPDATE' && rgb) {
          this.setColorDirectly(rgb, false);
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
        hsv
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

  _bindHeroColorAndCompanionBands() {
    const fg = document.getElementById('fgWell');
    const bg = document.getElementById('bgWell');
    const btnSwap = document.getElementById('btnSwapWells');
    const btnFix = document.getElementById('btnFixGamut');
    const companionSelect = document.getElementById('companionAlgoSelect');

    if (fg) {
      fg.addEventListener('click', () => {
        this.activeWell = 'fg';
        fg.classList.add('active');
        if (bg) bg.classList.remove('active');
        this.setColorDirectly(this.fgColor);
      });
    }

    if (bg) {
      bg.addEventListener('click', () => {
        this.activeWell = 'bg';
        bg.classList.add('active');
        if (fg) fg.classList.remove('active');
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
    } else {
      this.showToast('Por favor, permite ventanas emergentes en tu navegador para abrir el panel flotante', 'warning');
    }
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

      card.addEventListener('click', () => {
        this.setColorDirectly(col.rgb);
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
          this.showToast(`Color ${hex} eliminado de "${pal.name}"`, 'info', 4500, {
            text: 'Deshacer',
            onClick: () => {
              this.swatchManager.undoLastDelete();
              this.renderQuickPalette();
              this.renderSwatchesCollection();
              this.showToast(`Color ${hex} restaurado`, 'success');
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

  showSwatchContextMenu(e, pal, index, hex, isBuiltIn) {
    const existing = document.getElementById('swatchContextMenu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'swatchContextMenu';
    menu.className = 'swatch-context-menu';

    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const rgb = ColorMath.hexToRgb(hex);

    const items = [
      {
        icon: '🎯',
        label: 'Color Frontal (FG)',
        action: () => {
          this.setActiveWell('fg');
          this.setColorDirectly(rgb);
          this.showToast(`Establecido como Frontal: ${hex}`);
        }
      },
      {
        icon: '🎨',
        label: 'Color Fondo (BG)',
        action: () => {
          this.setActiveWell('bg');
          this.setColorDirectly(rgb);
          this.showToast(`Establecido como Fondo: ${hex}`);
        }
      },
      {
        icon: '📋',
        label: `Copiar ${hex}`,
        action: () => {
          this.copyToClipboard(hex);
          this.showToast(`Copiado: ${hex}`);
        }
      },
      {
        icon: '📋',
        label: `Copiar RGB (${rgb.r}, ${rgb.g}, ${rgb.b})`,
        action: () => {
          this.copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          this.showToast(`Copiado RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
      }
    ];

    if (!isBuiltIn) {
      items.push({ divider: true });
      items.push({
        icon: '🔄',
        label: 'Invertir muestra',
        action: () => {
          const invRgb = { r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b };
          const invHex = ColorMath.rgbToHex(invRgb.r, invRgb.g, invRgb.b);
          pal.colors[index] = invHex;
          this.swatchManager.savePalettes();
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color invertido a ${invHex}`);
        }
      });
      items.push({
        icon: '➕',
        label: 'Duplicar muestra',
        action: () => {
          this.swatchManager.addColorToPalette(pal.id, hex, index + 1);
          this.renderSwatchesCollection();
          this.renderQuickPalette();
          this.showToast(`Color ${hex} duplicado`);
        }
      });
      items.push({ divider: true });
      items.push({
        icon: '🗑️',
        label: 'Eliminar de paleta',
        danger: true,
        action: () => {
          const res = this.swatchManager.removeColorFromPalette(pal.id, index);
          if (res) {
            this.renderSwatchesCollection();
            this.renderQuickPalette();
            this.showToast(`Color ${hex} eliminado de "${pal.name}"`, 'info', 4500, {
              text: 'Deshacer',
              onClick: () => {
                this.swatchManager.undoLastDelete();
                this.renderSwatchesCollection();
                this.renderQuickPalette();
                this.showToast(`Color ${hex} restaurado`, 'success');
              }
            });
          }
        }
      });
    }

    items.forEach(it => {
      if (it.divider) {
        const div = document.createElement('div');
        div.className = 'context-menu-divider';
        menu.appendChild(div);
        return;
      }
      const btn = document.createElement('button');
      btn.className = `context-menu-item ${it.danger ? 'danger' : ''}`;
      btn.innerHTML = `<span>${it.icon}</span><span>${it.label}</span>`;
      btn.addEventListener('click', () => {
        it.action();
        menu.remove();
      });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    const closeHandler = (evt) => {
      if (!menu.contains(evt.target)) {
        menu.remove();
        document.removeEventListener('pointerdown', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', closeHandler), 10);
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
        label: 'Lámina Swatch PNG (1200x630)',
        run: () => {
          SwatchSheetExporter.exportPaletteToPng(pal.name, pal.colors);
          this.showToast('✓ Lámina Swatch Sheet PNG descargada', 'success');
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

  // --- CHROMILLA PHYSICAL TUBE INVENTORY & BRANDS ---

  _bindChromillaControls() {
    const brandSelect = document.getElementById('chromillaBrandFilterSelect');
    const medSelect = document.getElementById('chromillaMediumSelect');
    const batchInput = document.getElementById('chromillaBatchInput');
    const batchUnit = document.getElementById('chromillaBatchUnit');

    if (brandSelect) {
      brandSelect.addEventListener('change', () => {
        this.renderChromillaBrandTubes(brandSelect.value);
      });
    }

    if (medSelect) {
      medSelect.addEventListener('change', (e) => {
        ChromillaMixer.config.selectedMedium = e.target.value;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    if (batchInput) {
      batchInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 20;
        ChromillaMixer.config.batchAmount = val;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    if (batchUnit) {
      batchUnit.addEventListener('change', (e) => {
        ChromillaMixer.config.batchUnit = e.target.value;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderChromillaMixer(currentRgb);
      });
    }

    this.renderChromillaBrandTubes('all');
  }

  renderChromillaBrandTubes(brandId = 'all') {
    const grid = document.getElementById('chromillaTubeInventoryGrid');
    const countBadge = document.getElementById('chromillaTubesCountBadge');
    if (!grid) return;
    grid.innerHTML = '';

    const tubes = brandId === 'all' 
      ? BrandPigments.TUBES 
      : BrandPigments.TUBES.filter(t => t.brand === brandId);

    if (countBadge) countBadge.textContent = `${tubes.length} Tubos Disponibles`;

    tubes.forEach(tube => {
      const card = document.createElement('div');
      card.style.background = 'rgba(0,0,0,0.35)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = '6px';
      card.style.padding = '8px 10px';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '8px';
      card.style.cursor = 'pointer';
      card.title = `${tube.brandName}: ${tube.name} (${tube.ci})\n${tube.opacity} • ${tube.lightfastness}\n${tube.description}`;
      card.draggable = true;
      card.dataset.swatchHex = tube.hex;

      const dot = document.createElement('div');
      dot.style.width = '16px';
      dot.style.height = '16px';
      dot.style.borderRadius = '4px';
      dot.style.backgroundColor = tube.hex;
      dot.style.border = '1px solid rgba(255,255,255,0.3)';
      dot.style.flexShrink = '0';

      const textWrap = document.createElement('div');
      textWrap.style.flex = '1';
      textWrap.style.minWidth = '0';

      const title = document.createElement('div');
      title.style.fontSize = '0.72rem';
      title.style.fontWeight = '600';
      title.style.color = '#FFFFFF';
      title.style.whiteSpace = 'nowrap';
      title.style.overflow = 'hidden';
      title.style.textOverflow = 'ellipsis';
      title.textContent = tube.name;

      const sub = document.createElement('div');
      sub.style.fontSize = '0.64rem';
      sub.style.color = 'var(--text-muted)';
      sub.textContent = `${tube.ci} • S.${tube.series} • ${tube.opacity}`;

      textWrap.appendChild(title);
      textWrap.appendChild(sub);
      card.appendChild(dot);
      card.appendChild(textWrap);

      card.addEventListener('click', () => {
        this.setColorDirectly(tube.rgb);
        this.showToast(`Tubo: ${tube.name} (${tube.brandName})`);
      });

      grid.appendChild(card);
    });
  }

  renderChromillaMixer(targetRgb) {
    const dryDown = ChromillaMixer.getDryDownPrediction(targetRgb);
    const badge = document.getElementById('chromillaShiftBadge');
    const wetSwatch = document.getElementById('chromillaWetSwatch');
    const wetHex = document.getElementById('chromillaWetHex');
    const drySwatch = document.getElementById('chromillaDrySwatch');
    const dryHex = document.getElementById('chromillaDryHex');

    if (badge) badge.textContent = dryDown.shiftDesc;
    if (wetSwatch) wetSwatch.style.backgroundColor = dryDown.wetHex;
    if (wetHex) wetHex.textContent = dryDown.wetHex;
    if (drySwatch) drySwatch.style.backgroundColor = dryDown.dryHex;
    if (dryHex) dryHex.textContent = dryDown.dryHex;

    const recipe = ChromillaMixer.solveRecipe(targetRgb);
    const recipeList = document.getElementById('chromillaRecipeList');

    if (recipeList && recipe) {
      recipeList.innerHTML = '';
      recipe.items.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.style.display = 'flex';
        itemRow.style.alignItems = 'center';
        itemRow.style.justifyContent = 'space-between';
        itemRow.style.gap = '10px';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '8px';

        const dot = document.createElement('div');
        dot.style.width = '14px';
        dot.style.height = '14px';
        dot.style.borderRadius = '4px';
        dot.style.backgroundColor = item.tube.hex;

        const name = document.createElement('span');
        name.style.fontSize = '0.74rem';
        name.textContent = `${item.tube.name} (${item.tube.ci})`;

        left.appendChild(dot);
        left.appendChild(name);

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.gap = '8px';

        const partsTag = document.createElement('span');
        partsTag.style.fontFamily = 'var(--font-mono)';
        partsTag.style.fontSize = '0.74rem';
        partsTag.style.color = 'var(--accent-amber)';
        partsTag.textContent = `${item.parts} partes`;

        const amountTag = document.createElement('span');
        amountTag.style.fontFamily = 'var(--font-mono)';
        amountTag.style.fontSize = '0.74rem';
        amountTag.style.color = '#FFFFFF';
        amountTag.textContent = `${item.amount} ${item.unit}`;

        right.appendChild(partsTag);
        right.appendChild(amountTag);
        itemRow.appendChild(left);
        itemRow.appendChild(right);
        recipeList.appendChild(itemRow);
      });
    }

    const adviceEl = document.getElementById('chromillaCorrectionAdvice');
    if (adviceEl && recipe) {
      adviceEl.innerHTML = `Para conseguir este tono con exactitud física: <strong>${recipe.items.map(i => `${i.parts}p de ${i.tube.name}`).join(' + ')}</strong>.`;
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

    if (sliderTime) {
      sliderTime.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        AtmosphereEngine.state.timeOfDay = val;
        const hours = Math.floor(val);
        const mins = Math.round((val - hours) * 60);
        if (dispTime) dispTime.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        onAtmosphereParamChange();
      });
    }

    if (sliderKelvin) {
      sliderKelvin.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sunTempK = val;
        if (dispKelvin) dispKelvin.textContent = `${val}K`;
        onAtmosphereParamChange();
      });
    }

    if (sliderSky) {
      sliderSky.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.skyAmbientHue = val;
        if (dispSky) dispSky.textContent = `${val}°`;
        onAtmosphereParamChange();
      });
    }

    if (sliderBounce) {
      sliderBounce.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.bounceIntensity = val / 100;
        if (dispBounce) dispBounce.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    if (sliderSss) {
      sliderSss.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.sssIntensity = val / 100;
        if (dispSss) dispSss.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    if (sliderHaze) {
      sliderHaze.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.aerialHaze = val / 100;
        if (dispHaze) dispHaze.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    if (sliderIntensity) {
      sliderIntensity.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AtmosphereEngine.state.intensity = val / 100;
        if (dispIntensity) dispIntensity.textContent = `${val}%`;
        onAtmosphereParamChange();
      });
    }

    if (checkPurkinje) {
      checkPurkinje.addEventListener('change', (e) => {
        AtmosphereEngine.state.purkinjeShift = e.target.checked;
        onAtmosphereParamChange();
      });
    }

    // Atmospheric Presets
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

          if (sliderTime) sliderTime.value = p.time;
          if (sliderKelvin) sliderKelvin.value = p.sunTempK;
          if (sliderSky) sliderSky.value = p.skyHue;
          if (sliderBounce) sliderBounce.value = Math.round(p.bounce * 100);
          if (sliderSss) sliderSss.value = Math.round(p.sss * 100);
          if (checkPurkinje) checkPurkinje.checked = !!p.purkinje;

          if (dispTime) dispTime.textContent = p.name;
          if (dispKelvin) dispKelvin.textContent = `${p.sunTempK}K`;
          if (dispSky) dispSky.textContent = `${p.skyHue}°`;

          onAtmosphereParamChange();
          this.showToast(`Atmósfera: ${p.name}`);
        }
      });
    });
  }

  renderAtmosphereStages() {
    const grid = document.getElementById('atmoShadingStagesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const baseRgb = this.activeWell === 'fg' ? this.baseFgColor : this.baseBgColor;
    const stages = AtmosphereEngine.calculateLightingStages(baseRgb);

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

  // --- FLORENT FARGES ---

  _bindFlorentControls() {
    const wheelTabs = document.querySelectorAll('#florentWheelTabs button');
    wheelTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        wheelTabs.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        const idx = parseInt(btn.dataset.fwheel, 10);
        FlorentFargesEngine.activeWheelIndex = idx;
        const currentRgb = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
        this.renderFlorentFarges(currentRgb);
        this.showToast(`Modo Farges: Rueda ${idx}`);
      });
    });

    const fleshGrid = document.getElementById('florentFleshGrid');
    if (fleshGrid) {
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

        const recipe = document.createElement('div');
        recipe.style.fontSize = '0.68rem';
        recipe.style.color = '#E2E8F0';
        recipe.style.marginTop = '6px';
        recipe.innerHTML = `<strong>Receta:</strong> ${zone.recipe}`;

        card.appendChild(topRow);
        card.appendChild(recipe);

        card.addEventListener('click', () => {
          this.setColorDirectly(zone.rgb);
          this.showToast(`Carnación: ${zone.title}`);
        });

        fleshGrid.appendChild(card);
      });
    }

    const tubesList = document.getElementById('florentStudioTubesList');
    if (tubesList) {
      tubesList.innerHTML = '';
      FlorentFargesEngine.PIGMENTS.forEach(p => {
        const pill = document.createElement('div');
        pill.style.display = 'flex';
        pill.style.alignItems = 'center';
        pill.style.gap = '6px';
        pill.style.background = 'rgba(0,0,0,0.3)';
        pill.style.padding = '3px 8px';
        pill.style.borderRadius = '6px';
        pill.style.cursor = 'pointer';
        pill.draggable = true;
        pill.dataset.swatchHex = p.hex;

        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = p.hex;

        const name = document.createElement('span');
        name.style.fontSize = '0.72rem';
        name.textContent = `${p.name} (${p.ci})`;

        pill.appendChild(dot);
        pill.appendChild(name);
        pill.addEventListener('click', () => {
          this.setColorDirectly(p.rgb);
          this.showToast(`Pigmento Farges: ${p.name}`);
        });

        tubesList.appendChild(pill);
      });
    }
  }

  renderFlorentFarges(targetRgb) {
    const canvas = document.getElementById('florentWheelCanvas');
    if (canvas) {
      FlorentFargesEngine.drawFargesWheel(canvas, targetRgb);
    }

    const solver = FlorentFargesEngine.solveMixingForColor(targetRgb);
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
      actionsRow.appendChild(btnSave);

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

    if (btnExtract) {
      btnExtract.addEventListener('click', () => this.runImageExtraction());
    }

    if (btnSaveExtracted) {
      btnSaveExtracted.addEventListener('click', () => {
        if (this.imageExtractor.extractedColors.length > 0) {
          const hexes = this.imageExtractor.extractedColors.map(c => c.hex);
          this.swatchManager.addPalette('Paleta K-Means Extraída', hexes);
          this.renderSwatchesCollection();
          this.showToast('Paleta K-Means guardada en Bibliotecas');
        }
      });
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

    const results = this.imageExtractor.extractPalette(count, filter);
    this.renderExtractedPalette(results);
  }

  renderExtractedPalette(results) {
    const container = document.getElementById('extractedSwatchesGrid');
    if (!container) return;
    container.innerHTML = '';

    results.forEach(res => {
      const sw = document.createElement('div');
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
      sw.dataset.swatchLabel = `Dominancia ${res.dominancePercent || 10}%`;

      const tag = document.createElement('span');
      tag.style.fontSize = '0.65rem';
      tag.style.fontWeight = 'bold';
      tag.style.color = res.luminance > 0.5 ? '#000' : '#fff';
      tag.textContent = `${res.dominancePercent || ''}%`;

      sw.appendChild(tag);
      sw.addEventListener('click', () => this.setColorDirectly(res.rgb));
      container.appendChild(sw);
    });
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
        SwatchSheetExporter.exportPaletteToPng(name, this.currentAiPalette.colors);
        this.showToast('✓ Lámina Swatch Sheet generada en PNG de alta resolución (1200x630px)', 'success');
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

    // Smart Import Palette Modal
    const importModal = document.getElementById('importPaletteModal');
    const btnCloseImport = document.getElementById('btnCloseImportPaletteModal');
    const btnCancelImport = document.getElementById('btnCancelImportPalette');
    const btnConfirmImport = document.getElementById('btnConfirmImportPalette');
    const importTextarea = document.getElementById('importPaletteTextarea');
    const importNameInput = document.getElementById('importPaletteNameInput');
    const importPreview = document.getElementById('importPaletteLivePreview');
    const importCount = document.getElementById('importPaletteCount');

    let detectedHexes = [];

    const updateImportPreview = () => {
      if (!importTextarea) return;
      const text = importTextarea.value;
      const hexRegex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
      const matches = text.match(hexRegex) || [];
      detectedHexes = [];

      matches.forEach(rawHex => {
        let hex = rawHex.toUpperCase();
        if (hex.length === 4) {
          hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (!detectedHexes.includes(hex)) {
          detectedHexes.push(hex);
        }
      });

      if (importCount) {
        importCount.textContent = `${detectedHexes.length} colores detectados`;
      }
      if (importPreview) {
        importPreview.innerHTML = '';
        if (detectedHexes.length === 0) {
          importPreview.innerHTML = '<span style="font-size: 0.72rem; color: var(--text-muted); padding: 4px;">Sin colores detectados todavía</span>';
        } else {
          detectedHexes.forEach(hex => {
            const dot = document.createElement('div');
            dot.style.width = '24px';
            dot.style.height = '24px';
            dot.style.borderRadius = '4px';
            dot.style.backgroundColor = hex;
            dot.style.border = '1px solid rgba(255,255,255,0.2)';
            dot.title = hex;
            importPreview.appendChild(dot);
          });
        }
      }
      if (btnConfirmImport) {
        btnConfirmImport.disabled = detectedHexes.length === 0;
      }
    };

    if (btnImportModal && importModal) {
      btnImportModal.addEventListener('click', () => {
        importModal.style.display = 'flex';
        if (importTextarea) {
          importTextarea.value = '';
          updateImportPreview();
          setTimeout(() => importTextarea.focus(), 60);
        }
        if (importNameInput) {
          importNameInput.value = `Paleta Importada #${this.swatchManager.palettes.length + 1}`;
        }
      });
    }

    const closeImport = () => {
      if (importModal) importModal.style.display = 'none';
    };

    if (btnCloseImport) btnCloseImport.addEventListener('click', closeImport);
    if (btnCancelImport) btnCancelImport.addEventListener('click', closeImport);

    if (importTextarea) {
      importTextarea.addEventListener('input', updateImportPreview);
    }

    if (btnConfirmImport) {
      btnConfirmImport.addEventListener('click', () => {
        if (detectedHexes.length === 0) return;
        const name = (importNameInput?.value || '').trim() || `Paleta Importada (${detectedHexes.length} colores)`;
        const newPal = this.swatchManager.addPalette(name, detectedHexes);
        closeImport();
        this.renderSwatchesCollection();
        this.renderQuickPalette();
        this.showToast(`✓ Paleta '${newPal.name}' creada con ${detectedHexes.length} colores`, 'success');
      });
    }

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
        SwatchSheetExporter.exportPaletteToPng(activePal.name, activePal.colors);
        this.showToast('✓ Lámina Swatch Sheet descargada en PNG (1200x630px)', 'success');
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
        this.colorWheel.setHarmonyRule(e.target.value);
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
    const container = document.getElementById('toastContainer');
    if (!container) return;

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
      actBtn.textContent = action.text;
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
});
