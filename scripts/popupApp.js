/**
 * GOM Picker - Floating Independent Mini Window Application
 * Communicates bidirectionally with the main window via BroadcastChannel and localStorage.
 */

import { ColorMath } from './colorMath.js';
import { ColorWheel } from './colorWheel.js';
import { CompanionBands } from './companionBands.js';
import { MunsellSystem } from './munsellSystem.js';

class GomPopupApp {
  constructor() {
    this.activeWell = 'fg';
    this.fgColor = { r: 99, g: 102, b: 241, hex: '#6366F1' };
    this.bgColor = { r: 244, g: 63, b: 94, hex: '#F43F5E' };
    this.activeSpace = 'rgb';
    this.colorWheel = null;
    this.syncChannel = null;

    this.init();
  }

  init() {
    // 1. Setup BroadcastChannel for 2-way sync
    if (window.BroadcastChannel) {
      this.syncChannel = new BroadcastChannel('gom_picker_sync');
      this.syncChannel.onmessage = (e) => {
        if (e.data && e.data.type === 'color_update') {
          this._applyExternalColor(e.data);
        }
      };
    }

    // 2. Initialize Wheel
    const canvas = document.getElementById('colorWheelCanvasMini');
    const initialHsv = ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b);

    this.colorWheel = new ColorWheel(canvas, {
      mode: 'triangle',
      harmonyRule: 'triadic',
      onChange: (colorData) => this.handleColorChange(colorData, true)
    });

    // 3. Bind UI Controls
    this._bindControls();

    // 4. Initial Render
    this.colorWheel.setColor(initialHsv, true);
  }

  _bindControls() {
    // Wheel mode
    const modeSelect = document.getElementById('wheelModeSelectMini');
    modeSelect.addEventListener('change', (e) => {
      this.colorWheel.setMode(e.target.value);
    });

    // Dual wells
    const fg = document.getElementById('fgWellMini');
    const bg = document.getElementById('bgWellMini');
    const btnSwap = document.getElementById('btnSwapWellsMini');

    fg.addEventListener('click', () => {
      this.activeWell = 'fg';
      fg.classList.add('active-well');
      bg.classList.remove('active-well');
      this.colorWheel.setColor(ColorMath.rgbToHsv(this.fgColor.r, this.fgColor.g, this.fgColor.b), false);
    });

    bg.addEventListener('click', () => {
      this.activeWell = 'bg';
      bg.classList.add('active-well');
      fg.classList.remove('active-well');
      this.colorWheel.setColor(ColorMath.rgbToHsv(this.bgColor.r, this.bgColor.g, this.bgColor.b), false);
    });

    btnSwap.addEventListener('click', () => {
      const temp = { ...this.fgColor };
      this.fgColor = { ...this.bgColor };
      this.bgColor = temp;
      fg.style.backgroundColor = this.fgColor.hex;
      bg.style.backgroundColor = this.bgColor.hex;
      const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
      this.colorWheel.setColor(ColorMath.rgbToHsv(cur.r, cur.g, cur.b), true);
    });

    // Companion algorithm select
    const algoSelect = document.getElementById('companionAlgoSelectMini');
    algoSelect.addEventListener('change', (e) => {
      CompanionBands.activeAlgorithm = e.target.value;
      const cur = this.activeWell === 'fg' ? this.fgColor : this.bgColor;
      this.renderCompanionBands(cur);
    });

    // Color space tabs
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

    // Click to copy HEX
    const hexEl = document.getElementById('displayHexMini');
    hexEl.addEventListener('click', () => {
      navigator.clipboard.writeText(hexEl.textContent);
      const original = hexEl.textContent;
      hexEl.textContent = '¡Copiado!';
      setTimeout(() => hexEl.textContent = original, 1200);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'x' || e.key === 'X') {
        btnSwap.click();
      }
    });
  }

  handleColorChange(colorData, broadcast = true) {
    const { rgb, hex } = colorData;

    if (this.activeWell === 'fg') {
      this.fgColor = { ...rgb, hex };
      document.getElementById('fgWellMini').style.backgroundColor = hex;
    } else {
      this.bgColor = { ...rgb, hex };
      document.getElementById('bgWellMini').style.backgroundColor = hex;
    }

    document.getElementById('displayHexMini').textContent = hex;

    // Munsell
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    document.getElementById('displayMunsellMini').textContent = munsell.notation;

    // Gamut
    const cmykCheck = ColorMath.checkCmykGamut(rgb.r, rgb.g, rgb.b);
    const gamutEl = document.getElementById('displayGamutMini');
    if (cmykCheck.isOutOfGamut) {
      gamutEl.style.color = '#F43F5E';
      gamutEl.textContent = `⚠️ CMYK Δ${cmykCheck.delta}`;
    } else {
      gamutEl.style.color = '#10B981';
      gamutEl.textContent = `● CMYK ${cmykCheck.totalInk}%`;
    }

    this.renderCompanionBands(rgb);
    this.renderSliders(rgb);

    // Broadcast to main window
    if (broadcast && this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'color_update',
        activeWell: this.activeWell,
        rgb,
        hex
      });
    }
  }

  _applyExternalColor(data) {
    if (data.activeWell === 'fg') {
      this.fgColor = { ...data.rgb, hex: data.hex };
      document.getElementById('fgWellMini').style.backgroundColor = data.hex;
    } else {
      this.bgColor = { ...data.rgb, hex: data.hex };
      document.getElementById('bgWellMini').style.backgroundColor = data.hex;
    }

    if (this.activeWell === data.activeWell) {
      const hsv = ColorMath.rgbToHsv(data.rgb.r, data.rgb.g, data.rgb.b);
      this.colorWheel.setColor(hsv, false);
      this.handleColorChange({ rgb: data.rgb, hex: data.hex }, false);
    }
  }

  renderCompanionBands(rgb) {
    const container = document.getElementById('companionBandsListMini');
    container.innerHTML = '';

    const bands = CompanionBands.calculateBands(rgb);
    bands.forEach(b => {
      const stripe = document.createElement('div');
      stripe.style.flex = '1';
      stripe.style.height = '100%';
      stripe.style.backgroundColor = b.hex;
      stripe.style.cursor = 'pointer';
      stripe.dataset.swatchLabel = `${b.label}: ${b.hex}`;
      stripe.addEventListener('click', () => {
        const hsv = ColorMath.rgbToHsv(b.rgb.r, b.rgb.g, b.rgb.b);
        this.colorWheel.setColor(hsv, true);
      });
      container.appendChild(stripe);
    });
  }

  renderSliders(rgb) {
    const container = document.getElementById('slidersContainerMini');
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
}

window.addEventListener('DOMContentLoaded', () => {
  new GomPopupApp();
});
