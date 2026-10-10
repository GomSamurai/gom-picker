/**
 * GOM Picker - Wet Paint Palette & Digital Palette Knife Mixer
 * Interactive physical paint mixing canvas with subtractive pigment dynamics.
 * Allows artists to deposit paint dabs, blend them with a virtual palette knife,
 * and sample nuanced transitional colors with an integrated eyedropper.
 */

import { ColorMath } from './colorMath.js';

export class WetMixerEngine {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.width = 680;
    this.height = 420;
    
    this.tool = 'blend'; // 'blend' | 'dab' | 'pipette'
    this.brushSize = 36;
    this.blendStrength = 0.55;
    this.isDrawing = false;
    this.lastX = null;
    this.lastY = null;
    
    // Virtual knife paint pickup
    this.knifeColor = null; // { r, g, b, amount }
  }

  init(canvasId = 'wetMixerCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    this._setupCanvasResolution();
    this.clearPalette();
    this._bindEvents();
    this._depositInitialDabs();
  }

  _setupCanvasResolution() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 680;
    const h = rect.height || 420;
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
  }

  clearPalette() {
    if (!this.ctx) return;
    // Elegant artist studio glass palette background
    const grad = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 40,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    grad.addColorStop(0, '#1E202B');
    grad.addColorStop(1, '#111218');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle wooden/glass palette texture grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    this.knifeColor = null;
  }

  _depositInitialDabs() {
    // Deposit 3 sample dabs to invite immediate interaction
    this.depositDab(this.width * 0.28, this.height * 0.45, { r: 245, g: 158, b: 11 }, 48); // Golden Yellow
    this.depositDab(this.width * 0.72, this.height * 0.45, { r: 59, g: 130, b: 246 }, 48);  // Cobalt Blue
    this.depositDab(this.width * 0.50, this.height * 0.75, { r: 244, g: 63, b: 94 }, 42);  // Crimson Rose
  }

  // Deposit a dab of thick paint
  depositDab(x, y, rgb, radius = this.brushSize) {
    if (!this.ctx) return;
    this.ctx.save();
    
    // Substantive impasto paint drop with soft feathered edges
    const radGrad = this.ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
    radGrad.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(0.75, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = radGrad;
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 3;
    this.ctx.fill();

    // Specular highlight on the fresh oil paint mound
    this.ctx.beginPath();
    this.ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.28, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.ctx.shadowBlur = 0;
    this.ctx.fill();

    this.ctx.restore();
  }

  // Subtractive physical paint blending between two RGB colors (Kubelka-Munk CMY approximation)
  static blendSubtractive(c1, c2, weight = 0.5) {
    // Convert to CMY spectral absorption
    const cmy1 = { c: 1 - c1.r / 255, m: 1 - c1.g / 255, y: 1 - c1.b / 255 };
    const cmy2 = { c: 1 - c2.r / 255, m: 1 - c2.g / 255, y: 1 - c2.b / 255 };

    // Subtractive logarithmic dye absorption
    const w1 = 1 - weight;
    const w2 = weight;

    // Density weighted geometric mean
    const c = 1 - Math.pow(Math.max(0, 1 - cmy1.c), w1) * Math.pow(Math.max(0, 1 - cmy2.c), w2);
    const m = 1 - Math.pow(Math.max(0, 1 - cmy1.m), w1) * Math.pow(Math.max(0, 1 - cmy2.m), w2);
    const y = 1 - Math.pow(Math.max(0, 1 - cmy1.y), w1) * Math.pow(Math.max(0, 1 - cmy2.y), w2);

    return {
      r: Math.round(ColorMath.clamp((1 - c) * 255, 0, 255)),
      g: Math.round(ColorMath.clamp((1 - m) * 255, 0, 255)),
      b: Math.round(ColorMath.clamp((1 - y) * 255, 0, 255))
    };
  }

  _bindEvents() {
    if (!this.canvas) return;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (this.canvas.width / rect.width),
        y: (clientY - rect.top) * (this.canvas.height / rect.height)
      };
    };

    const onDown = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.lastX = pos.x;
      this.lastY = pos.y;

      if (this.tool === 'pipette') {
        this.sampleColorAt(pos.x, pos.y);
      } else if (this.tool === 'dab') {
        const rgb = this.app.fgColor ? this.app.fgColor : { r: 99, g: 102, b: 241 };
        this.depositDab(pos.x, pos.y, rgb, this.brushSize);
      } else if (this.tool === 'blend') {
        // Pick up initial paint on knife tip
        this._knifeSmudge(pos.x, pos.y);
      }
    };

    const onMove = (e) => {
      const pos = getPos(e);
      
      // Update mixer tooltip preview
      this._updatePreviewCoordinates(pos.x, pos.y);

      if (!this.isDrawing) return;
      e.preventDefault();

      if (this.tool === 'blend') {
        this._knifeStroke(this.lastX, this.lastY, pos.x, pos.y);
      } else if (this.tool === 'dab') {
        const dist = Math.hypot(pos.x - this.lastX, pos.y - this.lastY);
        if (dist > this.brushSize * 0.45) {
          const rgb = this.app.fgColor ? this.app.fgColor : { r: 99, g: 102, b: 241 };
          this.depositDab(pos.x, pos.y, rgb, this.brushSize * 0.85);
          this.lastX = pos.x;
          this.lastY = pos.y;
        }
      } else if (this.tool === 'pipette') {
        this.sampleColorAt(pos.x, pos.y);
      }

      this.lastX = pos.x;
      this.lastY = pos.y;
    };

    const onUp = () => {
      this.isDrawing = false;
      this.lastX = null;
      this.lastY = null;
    };

    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    // Resize observer for responsive canvas scaling
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        this._setupCanvasResolution();
      }).observe(this.canvas);
    }
  }

  _knifeSmudge(x, y) {
    const sample = this.getColorAt(x, y);
    if (sample) {
      this.knifeColor = { ...sample, amount: 1.0 };
    }
  }

  _knifeStroke(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / (this.brushSize * 0.25)));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;

      const surfaceCol = this.getColorAt(cx, cy);
      if (!surfaceCol) continue;

      if (!this.knifeColor) {
        this.knifeColor = { ...surfaceCol, amount: 0.8 };
        continue;
      }

      // Blend knife tip with surface paint using real subtractive pigment model
      const mixed = WetMixerEngine.blendSubtractive(this.knifeColor, surfaceCol, 0.45);
      
      // Paint onto canvas
      this.ctx.save();
      const r = this.brushSize * (0.65 + Math.random() * 0.2);
      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, ${this.blendStrength})`);
      grad.addColorStop(0.8, `rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, ${this.blendStrength * 0.6})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
      this.ctx.restore();

      // Knife picks up mixed paint for continuous dragging
      this.knifeColor = {
        r: mixed.r,
        g: mixed.g,
        b: mixed.b,
        amount: Math.max(0.2, this.knifeColor.amount * 0.96)
      };
    }
  }

  getColorAt(x, y) {
    if (!this.ctx || x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const pixel = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    if (pixel[3] < 10) return null; // Transparent background
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  }

  sampleColorAt(x, y) {
    const col = this.getColorAt(x, y);
    if (!col) return;
    
    // Ignore background dark canvas pixels
    if (col.r < 35 && col.g < 35 && col.b < 45) return;

    if (this.app) {
      this.app.setColorDirectly(col);
      if (this.app.showToast) {
        const hex = ColorMath.rgbToHex(col.r, col.g, col.b);
        this.app.showToast(`Color extraído de la paleta: ${hex}`, 'success');
      }
    }
  }

  _updatePreviewCoordinates(x, y) {
    const col = this.getColorAt(x, y);
    const pill = document.getElementById('mixerHoverPill');
    const hexLabel = document.getElementById('mixerHoverHex');
    if (col && pill && hexLabel) {
      const hex = ColorMath.rgbToHex(col.r, col.g, col.b);
      pill.style.backgroundColor = hex;
      hexLabel.textContent = hex;
    }
  }
}
