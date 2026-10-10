/**
 * GOM Picker - Wet Paint Palette & Digital Palette Knife Mixer
 * Professional physical paint mixing canvas with authentic subtractive Kubelka-Munk pigment dynamics.
 * Supports creamy, buttery continuous gradient diffusion, realistic impasto palette knife,
 * customizable feathering/softness, wetness flow, and live brush reticle.
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

    // Active tool: 'blend' (filbert/mop brush) | 'knife' (firm palette knife) | 'dab' (paint mound) | 'pipette' (sampler)
    this.tool = 'blend';
    this.brushSize = 36;
    this.softness = 0.70;       // 0.10 (crisp edge) to 0.95 (velvety soft)
    this.brushHardness = 0.30;  // 1.0 - softness * 0.85
    this.blendStrength = 0.45;  // 0.15 (long progressive gradient) to 0.90 (fast merge)

    this.isDrawing = false;
    this.lastX = null;
    this.lastY = null;

    // Virtual tool blade/bristle paint reservoir
    this.knifeColor = null; // { r, g, b }
    this.knifeAmount = 0.0;

    // Snapshot buffer to prevent self-overwriting feedback loop
    this.snapshotData = null;
    this.snapshotWidth = 0;
    this.snapshotHeight = 0;

    // Mixing mode: 'ryb' (Artist Pigment) | 'cmy' (Subtractive CMY) | 'oklch' (Perceptual) | 'smudge' (Optical)
    this.blendMode = 'ryb';

    // Interactive cursor reticle element references
    this.reticleEl = null;
    this.reticleCoreEl = null;
    this.reticlePipEl = null;
  }

  setBlendMode(mode) {
    const validModes = ['ryb', 'cmy', 'oklch', 'smudge'];
    this.blendMode = validModes.includes(mode) ? mode : 'ryb';
  }

  setSoftness(val) {
    this.softness = Math.max(0.05, Math.min(0.95, val));
    this.brushHardness = Math.max(0.05, Math.min(0.95, 1.0 - this.softness * 0.85));
  }

  setBlendStrength(val) {
    this.blendStrength = Math.max(0.10, Math.min(0.90, val));
  }

  setBrushSize(val) {
    this.brushSize = Math.max(10, Math.min(80, val));
  }

  setTool(tool) {
    const valid = ['blend', 'knife', 'dab', 'pipette'];
    this.tool = valid.includes(tool) ? tool : 'blend';
  }

  applyPreset(presetName) {
    if (presetName === 'creamy') {
      this.setSoftness(0.70);
      this.setBlendStrength(0.45);
      this.tool = 'blend';
    } else if (presetName === 'knife') {
      this.setSoftness(0.35);
      this.setBlendStrength(0.60);
      this.tool = 'knife';
    } else if (presetName === 'glaze') {
      this.setSoftness(0.90);
      this.setBlendStrength(0.30);
      this.tool = 'blend';
    }
  }

  blend(c1, c2, weight = 0.5) {
    return ColorMath.mixByMode(c1, c2, weight, this.blendMode);
  }

  static blendSubtractive(c1, c2, weight = 0.5, mode = 'ryb') {
    return ColorMath.mixByMode(c1, c2, weight, mode);
  }

  init(canvasId = 'wetMixerCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this._initReticle();
    this._setupCanvasResolution();
    this.clearPalette();
    this._bindEvents();
    this._depositInitialDabs();
  }

  _initReticle() {
    this.reticleEl = document.getElementById('mixerBrushCursor');
    this.reticleCoreEl = document.getElementById('mixerCursorCore');
    this.reticlePipEl = document.getElementById('mixerCursorPip');
  }

  _setupCanvasResolution() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width) || 680;
    const h = Math.round(rect.height) || 420;

    if (this.width !== w || this.height !== h) {
      let backup = null;
      if (this.paintCanvas && this.width > 0 && this.height > 0) {
        backup = document.createElement('canvas');
        backup.width = this.width;
        backup.height = this.height;
        const bctx = backup.getContext('2d');
        bctx.drawImage(this.paintCanvas, 0, 0);
      }

      this.canvas.width = w;
      this.canvas.height = h;
      this.paintCanvas.width = w;
      this.paintCanvas.height = h;

      this.width = w;
      this.height = h;

      if (backup && this.paintCtx) {
        this.paintCtx.drawImage(backup, 0, 0);
      }
    }
  }

  _takeSnapshot() {
    if (!this.paintCtx) return;
    try {
      const w = this.paintCanvas.width || this.width;
      const h = this.paintCanvas.height || this.height;
      if (w > 0 && h > 0) {
        const img = this.paintCtx.getImageData(0, 0, w, h);
        this.snapshotData = img.data;
        this.snapshotWidth = img.width;
        this.snapshotHeight = img.height;
      }
    } catch (_) {
      this.snapshotData = null;
      this.snapshotWidth = 0;
      this.snapshotHeight = 0;
    }
  }

  getSnapshotColorAt(x, y) {
    if (!this.snapshotData || !this.snapshotWidth) return null;
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || px >= this.snapshotWidth || py < 0 || py >= this.snapshotHeight) return null;
    const idx = (py * this.snapshotWidth + px) * 4;
    const a = this.snapshotData[idx + 3];
    if (typeof a !== 'number' || a < 25) return null;
    const r = this.snapshotData[idx];
    const g = this.snapshotData[idx + 1];
    const b = this.snapshotData[idx + 2];
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }
    return { r, g, b };
  }

  clearPalette() {
    if (!this.ctx || !this.paintCtx) return;

    // Clear paint pigment buffer
    this.paintCtx.clearRect(0, 0, this.width, this.height);
    this.knifeColor = null;
    this.knifeAmount = 0.0;
    this.snapshotData = null;
    this.snapshotWidth = 0;
    this.snapshotHeight = 0;

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
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetY = 5;
    this.ctx.drawImage(this.paintCanvas, 0, 0);
    this.ctx.restore();

    // Draw pristine pigment layer on top
    this.ctx.drawImage(this.paintCanvas, 0, 0);
  }

  _depositInitialDabs() {
    // Deposit master artist primaries: Cadmium Yellow, Primary Cyan, Crimson Rose, Titanium White
    this.depositDab(this.width * 0.35, this.height * 0.42, { r: 255, g: 232, b: 0 }, 54);
    this.depositDab(this.width * 0.65, this.height * 0.42, { r: 0, g: 185, b: 245 }, 54);
    this.depositDab(this.width * 0.50, this.height * 0.74, { r: 240, g: 45, b: 90 }, 48);
    this.depositDab(this.width * 0.18, this.height * 0.68, { r: 255, g: 255, b: 255 }, 38);
  }

  depositPrimaries() {
    // Deposit 5 quintessential tubes of painter's studio
    const primaries = [
      { rgb: { r: 255, g: 230, b: 0 }, rx: 0.28, ry: 0.38, size: 52 },  // Amarillo Cadmio
      { rgb: { r: 0, g: 180, b: 235 }, rx: 0.72, ry: 0.38, size: 52 },  // Cyan / Cobalto
      { rgb: { r: 235, g: 30, b: 95 }, rx: 0.50, ry: 0.74, size: 48 },  // Magenta Carmín
      { rgb: { r: 255, g: 255, b: 255 }, rx: 0.16, ry: 0.68, size: 40 }, // Blanco Titanio
      { rgb: { r: 26, g: 24, b: 22 }, rx: 0.84, ry: 0.68, size: 38 }    // Negro Marfil
    ];

    primaries.forEach(p => {
      this.depositDab(this.width * p.rx, this.height * p.ry, p.rgb, p.size);
    });
  }

  // Deposit a generous mound of oil paint with organic feathering and impasto gleam
  depositDab(x, y, rgb, radius = this.brushSize) {
    if (!this.paintCtx) return;
    this.paintCtx.save();

    const h = Math.max(0.1, Math.min(0.9, 1.0 - this.softness * 0.75));
    const coreStop = Math.max(0.12, Math.min(0.75, h * 0.75));

    const radGrad = this.paintCtx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    radGrad.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(coreStop, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    radGrad.addColorStop(coreStop + (1 - coreStop) * 0.45, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`);
    radGrad.addColorStop(coreStop + (1 - coreStop) * 0.82, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`);
    radGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    this.paintCtx.beginPath();
    this.paintCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.paintCtx.fillStyle = radGrad;
    this.paintCtx.fill();

    // Oil paint specular light sheen on fresh impasto mound
    const specR = radius * 0.24;
    const specGrad = this.paintCtx.createRadialGradient(
      x - radius * 0.22, y - radius * 0.22, 0,
      x - radius * 0.22, y - radius * 0.22, specR
    );
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.paintCtx.beginPath();
    this.paintCtx.arc(x - radius * 0.22, y - radius * 0.22, specR, 0, Math.PI * 2);
    this.paintCtx.fillStyle = specGrad;
    this.paintCtx.fill();

    this.paintCtx.restore();
    this._renderToScreen();
  }

  // Draw continuous stroke when dragging with the paint dab tool
  _strokeDab(x0, y0, x1, y1, rgb, radius = this.brushSize) {
    if (!this.paintCtx) return;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const stepDist = Math.max(1.5, radius * 0.10);
    const steps = Math.max(1, Math.ceil(dist / stepDist));

    const h = Math.max(0.1, Math.min(0.9, 1.0 - this.softness * 0.75));
    const coreStop = Math.max(0.12, Math.min(0.75, h * 0.75));

    this.paintCtx.save();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;

      const radGrad = this.paintCtx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      radGrad.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      radGrad.addColorStop(coreStop, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      radGrad.addColorStop(coreStop + (1 - coreStop) * 0.45, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.65)`);
      radGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      this.paintCtx.beginPath();
      this.paintCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.paintCtx.fillStyle = radGrad;
      this.paintCtx.fill();
    }
    this.paintCtx.restore();
    this._renderToScreen();
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
      } else if (this.tool === 'blend' || this.tool === 'knife') {
        // Blade or brush touches surface and picks up initial pigment
        const sample = this.getColorAt(pos.x, pos.y);
        if (sample) {
          this.knifeColor = { r: sample.r, g: sample.g, b: sample.b };
          this.knifeAmount = 1.0;
        } else {
          this.knifeColor = null;
          this.knifeAmount = 0.0;
        }
        // Capture pristine snapshot of palette state before this stroke begins
        this._takeSnapshot();
      }

      this._updateReticle(pos.x, pos.y);
    };

    const onMove = (e) => {
      const pos = getPos(e);
      this._updatePreviewCoordinates(pos.x, pos.y);
      this._updateReticle(pos.x, pos.y);

      if (!this.isDrawing) return;
      e.preventDefault();

      if (this.tool === 'blend' || this.tool === 'knife') {
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
      this.snapshotData = null;
      this.snapshotWidth = 0;
      this.snapshotHeight = 0;
    };

    const onLeave = () => {
      this._hideReticle();
      if (this.isDrawing) onUp();
    };

    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('mouseleave', onLeave);

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

  // Digital Palette Knife & Soft Blending Engine with Continuous Multi-Stage Degradados
  _knifeStroke(x0, y0, x1, y1) {
    if (!this.paintCtx) return;

    const dist = Math.hypot(x1 - x0, y1 - y0);
    if (dist < 0.5) return;

    // Adaptive micro-stepping: ensures buttery continuity without scalloping
    const stepDist = Math.max(1.2, this.brushSize * 0.07);
    const steps = Math.max(1, Math.ceil(dist / stepDist));

    // Tool personality tuning
    const isKnife = (this.tool === 'knife');
    const effectiveHardness = isKnife
      ? Math.max(0.40, Math.min(0.85, 1.0 - this.softness * 0.65))
      : Math.max(0.06, Math.min(0.45, (1.0 - this.softness) * 0.65));

    // Base deposit alpha per micro-stamp (calibrated to glaze smoothly over overlapping steps)
    const baseAlpha = isKnife
      ? Math.min(0.45, 0.16 + 0.28 * this.blendStrength)
      : Math.min(0.35, 0.08 + 0.22 * this.blendStrength);

    // Rate of continuous pigment exchange per microstep distance
    const transferRate = Math.min(
      0.18,
      (stepDist / (this.brushSize * 2.4)) * (0.12 + 0.65 * this.blendStrength)
    );

    // Ratio of surface paint absorbed into current stamp
    const surfaceMixRatio = Math.min(
      0.80,
      Math.max(0.20, 0.25 + 0.50 * this.blendStrength)
    );

    this.paintCtx.save();
    try {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x0 + (x1 - x0) * t;
        const cy = y0 + (y1 - y0) * t;

        // Sample underlying palette state from snapshot first (to avoid self-contamination)
        let surfaceCol = this.getSnapshotColorAt(cx, cy);
        if (!surfaceCol) {
          surfaceCol = this.getColorAt(cx, cy);
        }

        if (surfaceCol) {
          if (this.knifeColor) {
            // Authentic physical pigment blend between tool blade and palette surface
            const mixed = this.blend(this.knifeColor, surfaceCol, surfaceMixRatio);

            // Stamp mixed pigment with multi-stop smoothstep radial falloff
            const r = this.brushSize;
            const grad = this.paintCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
            const rgbStr = `${mixed.r}, ${mixed.g}, ${mixed.b}`;

            // Core plateau
            grad.addColorStop(0, `rgba(${rgbStr}, ${baseAlpha})`);
            const shoulder = Math.max(0.04, Math.min(0.75, effectiveHardness * 0.8));
            grad.addColorStop(shoulder, `rgba(${rgbStr}, ${baseAlpha * 0.90})`);

            // Mid falloff (Hermite-smooth)
            const mid = shoulder + (1.0 - shoulder) * 0.42;
            grad.addColorStop(mid, `rgba(${rgbStr}, ${baseAlpha * 0.42})`);

            // Feathery fringe
            const fringe = shoulder + (1.0 - shoulder) * 0.80;
            grad.addColorStop(fringe, `rgba(${rgbStr}, ${baseAlpha * 0.10})`);
            grad.addColorStop(1, `rgba(${rgbStr}, 0)`);

            this.paintCtx.beginPath();
            this.paintCtx.arc(cx, cy, r, 0, Math.PI * 2);
            this.paintCtx.fillStyle = grad;
            this.paintCtx.fill();

            // Subtle impasto highlight along knife edge if in knife mode
            if (isKnife && i % 2 === 0) {
              const nx = -(y1 - y0) / (dist || 1);
              const ny = (x1 - x0) / (dist || 1);
              const hx = cx + nx * (r * 0.28);
              const hy = cy + ny * (r * 0.28);
              this.paintCtx.beginPath();
              this.paintCtx.arc(hx, hy, r * 0.22, 0, Math.PI * 2);
              this.paintCtx.fillStyle = `rgba(255, 255, 255, ${0.04 * this.blendStrength})`;
              this.paintCtx.fill();
            }

            // Continuous, gradual pigment transfer to the blade reservoir
            this.knifeColor = this.blend(this.knifeColor, surfaceCol, transferRate);
            this.knifeAmount = Math.min(1.0, this.knifeAmount + 0.04);
          } else {
            // Clean blade touches paint mound: load paint reservoir
            this.knifeColor = { r: surfaceCol.r, g: surfaceCol.g, b: surfaceCol.b };
            this.knifeAmount = 1.0;
          }
        } else {
          // Blade carries paint over dry / empty glass area: leaves a fading streak
          if (this.knifeColor && this.knifeAmount > 0.02) {
            const k = this.knifeColor;
            const r = this.brushSize * Math.max(0.25, this.knifeAmount);
            const streakAlpha = baseAlpha * this.knifeAmount * 0.75;
            const rgbStr = `${k.r}, ${k.g}, ${k.b}`;

            const grad = this.paintCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, `rgba(${rgbStr}, ${streakAlpha})`);
            grad.addColorStop(0.35, `rgba(${rgbStr}, ${streakAlpha * 0.85})`);
            grad.addColorStop(1, `rgba(${rgbStr}, 0)`);

            this.paintCtx.beginPath();
            this.paintCtx.arc(cx, cy, r, 0, Math.PI * 2);
            this.paintCtx.fillStyle = grad;
            this.paintCtx.fill();

            this.knifeAmount = Math.max(0, this.knifeAmount - 0.012);
          }
        }
      }
    } finally {
      this.paintCtx.restore();
      this._renderToScreen();
    }
  }

  // Update dynamic brush reticle on canvas
  _updateReticle(x, y) {
    if (!this.reticleEl || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.width;
    const scaleY = rect.height / this.height;
    const screenX = x * scaleX;
    const screenY = y * scaleY;

    const diam = Math.max(12, this.brushSize * 2 * scaleX);
    this.reticleEl.style.width = `${diam}px`;
    this.reticleEl.style.height = `${diam}px`;
    this.reticleEl.style.left = `${screenX}px`;
    this.reticleEl.style.top = `${screenY}px`;
    this.reticleEl.style.display = 'block';

    if (this.reticleCoreEl) {
      const coreDiam = Math.max(4, diam * (1.0 - this.softness * 0.75));
      this.reticleCoreEl.style.width = `${coreDiam}px`;
      this.reticleCoreEl.style.height = `${coreDiam}px`;
    }

    if (this.reticlePipEl) {
      if (this.tool === 'pipette') {
        const col = this.getColorAt(x, y);
        this.reticlePipEl.style.backgroundColor = col ? `rgb(${col.r}, ${col.g}, ${col.b})` : '#ffffff';
      } else if (this.tool === 'dab') {
        const rgb = this.app.fgColor ? this.app.fgColor : { r: 246, g: 255, b: 0 };
        this.reticlePipEl.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      } else if (this.knifeColor) {
        this.reticlePipEl.style.backgroundColor = `rgb(${this.knifeColor.r}, ${this.knifeColor.g}, ${this.knifeColor.b})`;
      } else {
        this.reticlePipEl.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      }
    }
  }

  _hideReticle() {
    if (this.reticleEl) {
      this.reticleEl.style.display = 'none';
    }
  }

  // Samples pigment strictly from the offscreen paint buffer (never from the dark background)
  getColorAt(x, y) {
    if (!this.paintCtx) return null;
    const w = this.paintCanvas.width || this.width;
    const h = this.paintCanvas.height || this.height;
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || px >= w || py < 0 || py >= h) return null;
    try {
      const pixel = this.paintCtx.getImageData(px, py, 1, 1).data;
      if (typeof pixel[3] !== 'number' || pixel[3] < 25) return null;
      return { r: pixel[0], g: pixel[1], b: pixel[2] };
    } catch (_) {
      return null;
    }
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
