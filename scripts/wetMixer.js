/**
 * GOM Picker - Wet Paint Palette & Digital Palette Knife Mixer
 * Interactive physical paint mixing canvas with authentic subtractive Kubelka-Munk pigment dynamics.
 * Allows artists to deposit thick oil/acrylic paint dabs, blend them with a virtual palette knife,
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

    // Dedicated offscreen pure-pigment paint layer (avoids blending dark palette background)
    this.paintCanvas = document.createElement('canvas');
    this.paintCtx = this.paintCanvas.getContext('2d', { willReadFrequently: true });

    this.tool = 'blend'; // 'blend' | 'dab' | 'pipette'
    this.brushSize = 36;
    this.blendStrength = 0.65;
    this.isDrawing = false;
    this.lastX = null;
    this.lastY = null;

    // Virtual knife blade paint reservoir
    this.knifeColor = null; // { r, g, b }
    this.knifeAmount = 0.0;
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
    this.paintCanvas.width = w;
    this.paintCanvas.height = h;

    this.width = w;
    this.height = h;
  }

  clearPalette() {
    if (!this.ctx || !this.paintCtx) return;

    // Clear paint pigment buffer
    this.paintCtx.clearRect(0, 0, this.width, this.height);
    this.knifeColor = null;
    this.knifeAmount = 0.0;

    this._renderToScreen();
  }

  _renderBackground() {
    // Elegant artist studio glass palette background
    const grad = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 40,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75
    );
    grad.addColorStop(0, '#1E202B');
    grad.addColorStop(1, '#111218');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle wooden/glass palette texture grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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
  }

  // Composite pure paint layer onto glass palette with realistic impasto depth
  _renderToScreen() {
    if (!this.ctx) return;
    this._renderBackground();

    // Soft drop shadow beneath the oil paint mass
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;
    this.ctx.drawImage(this.paintCanvas, 0, 0);
    this.ctx.restore();

    // Draw pristine pigment layer on top
    this.ctx.drawImage(this.paintCanvas, 0, 0);
  }

  _depositInitialDabs() {
    // Deposit sample artist primaries: Cadmium Yellow, Cobalt Blue, Crimson
    this.depositDab(this.width * 0.35, this.height * 0.45, { r: 246, g: 255, b: 0 }, 48); // Pure Bright Yellow
    this.depositDab(this.width * 0.65, this.height * 0.45, { r: 26, g: 69, b: 255 }, 48);  // Rich Cobalt Blue
    this.depositDab(this.width * 0.50, this.height * 0.76, { r: 244, g: 63, b: 94 }, 42);  // Crimson Rose
  }

  // Deposit a generous mound of opaque oil paint
  depositDab(x, y, rgb, radius = this.brushSize) {
    if (!this.paintCtx) return;
    this.paintCtx.save();

    // Opaque paint core with soft feathered edge
    const radGrad = this.paintCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    radGrad.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(0.85, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    this.paintCtx.beginPath();
    this.paintCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.paintCtx.fillStyle = radGrad;
    this.paintCtx.fill();

    // Specular light sheen on fresh oil paint body
    this.paintCtx.beginPath();
    this.paintCtx.arc(x - radius * 0.22, y - radius * 0.22, radius * 0.24, 0, Math.PI * 2);
    this.paintCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.paintCtx.fill();

    this.paintCtx.restore();
    this._renderToScreen();
  }

  // Draw continuous stroke when dragging with the paint dab tool
  _strokeDab(x0, y0, x1, y1, rgb, radius = this.brushSize) {
    if (!this.paintCtx) return;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const stepDist = Math.max(2, radius * 0.22);
    const steps = Math.max(1, Math.ceil(dist / stepDist));

    this.paintCtx.save();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;

      const radGrad = this.paintCtx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      radGrad.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      radGrad.addColorStop(0.82, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      radGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      this.paintCtx.beginPath();
      this.paintCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.paintCtx.fillStyle = radGrad;
      this.paintCtx.fill();
    }
    this.paintCtx.restore();
    this._renderToScreen();
  }

  // Authentic Subtractive Physical Paint Blending via 8-Band Kubelka-Munk
  // Yields true artist greens for Yellow + Blue, warm orange for Red + Yellow, etc.
  static blendSubtractive(c1, c2, weight = 0.5) {
    return ColorMath.mixPigments(c1, c2, weight);
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
        const rgb = this.app.fgColor ? this.app.fgColor : { r: 246, g: 255, b: 0 };
        this.depositDab(pos.x, pos.y, rgb, this.brushSize);
      } else if (this.tool === 'blend') {
        // Knife tip touches surface and picks up paint if present
        const sample = this.getColorAt(pos.x, pos.y);
        if (sample) {
          this.knifeColor = { r: sample.r, g: sample.g, b: sample.b };
          this.knifeAmount = 1.0;
        } else {
          this.knifeColor = null;
          this.knifeAmount = 0.0;
        }
      }
    };

    const onMove = (e) => {
      const pos = getPos(e);
      this._updatePreviewCoordinates(pos.x, pos.y);

      if (!this.isDrawing) return;
      e.preventDefault();

      if (this.tool === 'blend') {
        this._knifeStroke(this.lastX, this.lastY, pos.x, pos.y);
      } else if (this.tool === 'dab') {
        const rgb = this.app.fgColor ? this.app.fgColor : { r: 246, g: 255, b: 0 };
        this._strokeDab(this.lastX, this.lastY, pos.x, pos.y, rgb, this.brushSize);
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

    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        this._setupCanvasResolution();
        this._renderToScreen();
      }).observe(this.canvas);
    }
  }

  // Digital Palette Knife Stroke with Subtractive Pigment Smearing
  _knifeStroke(x0, y0, x1, y1) {
    if (!this.paintCtx) return;

    const dist = Math.hypot(x1 - x0, y1 - y0);
    const stepDist = Math.max(3, this.brushSize * 0.18);
    const steps = Math.max(1, Math.ceil(dist / stepDist));

    this.paintCtx.save();

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;

      const surfaceCol = this.getColorAt(cx, cy);

      if (surfaceCol) {
        // Palette knife touches wet paint on canvas
        if (this.knifeColor) {
          // Authentic subtractive Kubelka-Munk blend between knife blade paint and surface paint!
          const mixed = WetMixerEngine.blendSubtractive(this.knifeColor, surfaceCol, 0.5);

          // Stamp mixed pigment onto paint buffer
          const r = this.brushSize * 0.9;
          const grad = this.paintCtx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
          grad.addColorStop(0, `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`);
          grad.addColorStop(0.75, `rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, 0.92)`);
          grad.addColorStop(1, `rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, 0)`);

          this.paintCtx.beginPath();
          this.paintCtx.arc(cx, cy, r, 0, Math.PI * 2);
          this.paintCtx.fillStyle = grad;
          this.paintCtx.fill();

          // Knife blade absorbs the newly mixed color
          this.knifeColor = mixed;
          this.knifeAmount = Math.min(1.0, this.knifeAmount + 0.15);
        } else {
          // Pick up surface paint on the clean blade
          this.knifeColor = { r: surfaceCol.r, g: surfaceCol.g, b: surfaceCol.b };
          this.knifeAmount = 1.0;
        }
      } else {
        // Knife moves across dry/empty palette glass:
        // Leaves a streak of carried paint if blade has paint
        if (this.knifeColor && this.knifeAmount > 0.05) {
          const r = this.brushSize * 0.75 * this.knifeAmount;
          const k = this.knifeColor;

          const grad = this.paintCtx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
          grad.addColorStop(0, `rgba(${k.r}, ${k.g}, ${k.b}, ${this.knifeAmount * 0.85})`);
          grad.addColorStop(1, `rgba(${k.r}, ${k.g}, ${k.b}, 0)`);

          this.paintCtx.beginPath();
          this.paintCtx.arc(cx, cy, r, 0, Math.PI * 2);
          this.paintCtx.fillStyle = grad;
          this.paintCtx.fill();

          this.knifeAmount *= 0.93; // Gradually deplete knife paint
        }
      }
    }

    this.paintCtx.restore();
    this._renderToScreen();
  }

  // Samples pigment strictly from the offscreen paint buffer (never from the dark background)
  getColorAt(x, y) {
    if (!this.paintCtx || x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const pixel = this.paintCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    if (pixel[3] < 15) return null; // No paint deposited here
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  }

  sampleColorAt(x, y) {
    const col = this.getColorAt(x, y);
    if (!col) return;

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
