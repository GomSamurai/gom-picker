/**
 * GOM Picker - Interactive Color Wheel Canvas Engine
 * Supports Coolorus-style Triangle inside Hue Ring, Box/Square inside Hue Ring,
 * RYB Painter's Wheel, and OKLCH Perceptually Uniform Wheel with live Harmony Overlays.
 */

import { ColorMath } from './colorMath.js';
import { HarmonyEngine } from './harmonies.js';
import { GamutMaskEngine } from './gamutMask.js';
import { FlorentFargesEngine } from './florentFarges.js';
import { AtmosphereEngine } from './atmosphereEngine.js';

export class ColorWheel {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    this.mode = options.mode || 'triangle'; // 'triangle' | 'square' | 'ryb' | 'oklch'
    this.harmonyRule = options.harmonyRule || 'triadic';
    this.hsv = { h: 210, s: 0.8, v: 0.9 }; // Default blue

    this.isDraggingRing = false;
    this.isDraggingInner = false;
    this.onChange = options.onChange || null;

    this.size = 320;
    this.ringWidth = 28;
    this.ringGap = 12;

    this._setupCanvas();
    this._bindEvents();
    this.render();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.render();
  }

  setHarmonyRule(ruleId) {
    this.harmonyRule = ruleId;
    this.render();
  }

  setColor(hsv, triggerCallback = true) {
    this.hsv = {
      h: (hsv.h % 360 + 360) % 360,
      s: ColorMath.clamp(hsv.s, 0, 1),
      v: ColorMath.clamp(hsv.v, 0, 1)
    };
    this.render();
    if (triggerCallback && this.onChange) {
      this._emitChange();
    }
  }

  resize() {
    this._setupCanvas();
    this.render();
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const parent = this.canvas.parentElement;
    const parentWidth = parent ? parent.clientWidth : 320;
    const baseWidth = rect.width > 20 ? rect.width : (parentWidth > 20 ? parentWidth : 320);
    this.size = Math.max(160, Math.min(Math.floor(baseWidth), 360));
    this.canvas.width = Math.round(this.size * dpr);
    this.canvas.height = Math.round(this.size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.center = this.size / 2;
    this.ringWidth = Math.max(16, Math.min(28, Math.round(this.size * 0.088)));
    this.radius = this.center - Math.max(6, Math.round(this.size * 0.04));
    this.innerRadius = this.radius - this.ringWidth;
  }

  _emitChange() {
    const rawRgb = ColorMath.hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
    const displayRgb = AtmosphereEngine?.state?.enabled ? AtmosphereEngine.transformColor(rawRgb) : rawRgb;
    const hex = ColorMath.rgbToHex(displayRgb.r, displayRgb.g, displayRgb.b);
    const cmyk = ColorMath.rgbToCmyk(displayRgb.r, displayRgb.g, displayRgb.b);
    const hsl = ColorMath.rgbToHsl(displayRgb.r, displayRgb.g, displayRgb.b);
    const oklch = ColorMath.rgbToOklch(displayRgb.r, displayRgb.g, displayRgb.b);
    const harmonies = HarmonyEngine.getHarmony(this.hsv, this.harmonyRule, this.mode === 'ryb' ? 'ryb' : 'rgb');

    this.onChange({
      hsv: { ...this.hsv },
      baseRgb: rawRgb,
      rgb: displayRgb,
      hex,
      cmyk,
      hsl,
      oklch,
      harmonies
    });
  }

  // --- RENDERING ---

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.size, this.size);

    // 1. Draw Outer Hue Ring
    this._drawHueRing();

    // 2. Draw Inner Picking Area (Triangle, Square, or Spectrum)
    if (this.mode === 'triangle' || this.mode === 'florent') {
      this._drawTrianglePicker();
    } else if (this.mode === 'square') {
      this._drawSquarePicker();
    } else if (this.mode === 'ryb') {
      this._drawRybCenter();
    } else if (this.mode === 'oklch') {
      this._drawOklchCenter();
    }

    // 2.5 Florent Farges Pigment Markers & Bow Curve Overlays
    if (this.mode === 'florent') {
      this._drawFlorentOverlays();
    }

    // 3. Draw James Gurney Gamut Mask Overlay if enabled
    if (GamutMaskEngine.state.enabled) {
      GamutMaskEngine.drawMask(this.ctx, this.center, this.innerRadius - this.ringGap);
    }

    // 4. Draw Harmony Overlays & Markers on the Hue Ring
    this._drawHarmonyOverlays();

    // 5. Draw Active Ring Indicator Handle
    this._drawRingHandle();
  }

  _drawHueRing() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const outerR = this.radius;
    const innerR = this.innerRadius;

    // Draw smooth circular hue gradient
    const segments = 360;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i - 0.5) * (Math.PI / 180);
      const endAngle = (i + 1.5) * (Math.PI / 180);

      let hue = i;
      if (this.mode === 'ryb') {
        hue = ColorMath.rybToRgbHue(i);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, (outerR + innerR) / 2, startAngle, endAngle);
      ctx.lineWidth = outerR - innerR;

      if (AtmosphereEngine?.state?.enabled) {
        const rawRgb = ColorMath.hsvToRgb(hue, 1, 1);
        const atmoRgb = AtmosphereEngine.transformColor(rawRgb);
        ctx.strokeStyle = `rgb(${atmoRgb.r}, ${atmoRgb.g}, ${atmoRgb.b})`;
      } else {
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      }
      ctx.stroke();
    }

    // Outer subtle border
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner subtle border
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Equilateral triangle inside the circle
  _drawTrianglePicker() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const triR = this.innerRadius - this.ringGap;

    // Rotate triangle with current hue angle
    const angleRad = (this.hsv.h * Math.PI) / 180;
    const pApex = { x: cx + triR * Math.cos(angleRad), y: cy + triR * Math.sin(angleRad) };
    const pWhite = { x: cx + triR * Math.cos(angleRad + (2 * Math.PI) / 3), y: cy + triR * Math.sin(angleRad + (2 * Math.PI) / 3) };
    const pBlack = { x: cx + triR * Math.cos(angleRad + (4 * Math.PI) / 3), y: cy + triR * Math.sin(angleRad + (4 * Math.PI) / 3) };

    this._triVertices = { pApex, pWhite, pBlack };

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pApex.x, pApex.y);
    ctx.lineTo(pWhite.x, pWhite.y);
    ctx.lineTo(pBlack.x, pBlack.y);
    ctx.closePath();
    ctx.clip();

    // Render pure hue gradient from white to pure hue
    const gradHue = ctx.createLinearGradient(pWhite.x, pWhite.y, pApex.x, pApex.y);
    let pureRgb = ColorMath.hsvToRgb(this.hsv.h, 1, 1);
    let whiteRgb = { r: 255, g: 255, b: 255 };
    let blackRgb = { r: 0, g: 0, b: 0 };

    if (AtmosphereEngine?.state?.enabled) {
      pureRgb = AtmosphereEngine.transformColor(pureRgb);
      whiteRgb = AtmosphereEngine.transformColor(whiteRgb);
      blackRgb = AtmosphereEngine.transformColor(blackRgb);
    }

    gradHue.addColorStop(0, `rgb(${whiteRgb.r}, ${whiteRgb.g}, ${whiteRgb.b})`);
    gradHue.addColorStop(1, `rgb(${pureRgb.r}, ${pureRgb.g}, ${pureRgb.b})`);
    ctx.fillStyle = gradHue;
    ctx.fill();

    // Black shade gradient from Black corner
    const gradBlack = ctx.createLinearGradient(pBlack.x, pBlack.y, (pApex.x + pWhite.x) / 2, (pApex.y + pWhite.y) / 2);
    gradBlack.addColorStop(0, `rgb(${blackRgb.r}, ${blackRgb.g}, ${blackRgb.b})`);
    gradBlack.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradBlack;
    ctx.fill();

    ctx.restore();

    // Triangle border
    ctx.beginPath();
    ctx.moveTo(pApex.x, pApex.y);
    ctx.lineTo(pWhite.x, pWhite.y);
    ctx.lineTo(pBlack.x, pBlack.y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw active picker cursor in triangle
    const curPos = this._getTriangleCursorPos();
    this._drawCursorHandle(curPos.x, curPos.y);
  }

  // Calculate current triangle handle position from HSV
  _getTriangleCursorPos() {
    if (!this._triVertices) return { x: this.center, y: this.center };
    const { pApex, pWhite, pBlack } = this._triVertices;
    const { s, v } = this.hsv;

    // Barycentric coordinates:
    // v = lambdaApex + lambdaWhite
    // lambdaApex = s * v
    // lambdaWhite = v * (1 - s)
    // lambdaBlack = 1 - v
    const lApex = s * v;
    const lWhite = v * (1 - s);
    const lBlack = 1 - v;

    const x = lApex * pApex.x + lWhite * pWhite.x + lBlack * pBlack.x;
    const y = lApex * pApex.y + lWhite * pWhite.y + lBlack * pBlack.y;
    return { x, y };
  }

  // Square picker (Saturation X, Value Y)
  _drawSquarePicker() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const boxHalf = Math.floor((this.innerRadius - this.ringGap) / Math.SQRT2);

    const x1 = cx - boxHalf;
    const y1 = cy - boxHalf;
    const size = boxHalf * 2;

    this._squareBox = { x1, y1, size };

    ctx.save();
    ctx.beginPath();
    ctx.rect(x1, y1, size, size);
    ctx.clip();

    // Base Hue fill
    let pureRgb = ColorMath.hsvToRgb(this.hsv.h, 1, 1);
    let whiteRgb = { r: 255, g: 255, b: 255 };
    let blackRgb = { r: 0, g: 0, b: 0 };

    if (AtmosphereEngine?.state?.enabled) {
      pureRgb = AtmosphereEngine.transformColor(pureRgb);
      whiteRgb = AtmosphereEngine.transformColor(whiteRgb);
      blackRgb = AtmosphereEngine.transformColor(blackRgb);
    }

    ctx.fillStyle = `rgb(${pureRgb.r}, ${pureRgb.g}, ${pureRgb.b})`;
    ctx.fillRect(x1, y1, size, size);

    // Saturation horizontal gradient (White -> Transparent)
    const satGrad = ctx.createLinearGradient(x1, y1, x1 + size, y1);
    satGrad.addColorStop(0, `rgb(${whiteRgb.r}, ${whiteRgb.g}, ${whiteRgb.b})`);
    satGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = satGrad;
    ctx.fillRect(x1, y1, size, size);

    // Value vertical gradient (Transparent -> Black)
    const valGrad = ctx.createLinearGradient(x1, y1, x1, y1 + size);
    valGrad.addColorStop(0, 'rgba(0,0,0,0)');
    valGrad.addColorStop(1, `rgb(${blackRgb.r}, ${blackRgb.g}, ${blackRgb.b})`);
    ctx.fillStyle = valGrad;
    ctx.fillRect(x1, y1, size, size);

    ctx.restore();

    // Box border
    ctx.strokeRect(x1, y1, size, size);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;

    // Cursor position
    const curX = x1 + this.hsv.s * size;
    const curY = y1 + (1 - this.hsv.v) * size;
    this._drawCursorHandle(curX, curY);
  }

  _drawRybCenter() {
    // Uses Square mode inside RYB hue circle
    this._drawSquarePicker();
  }

  _drawOklchCenter() {
    this._drawSquarePicker();
  }

  // Florent Farges Pigment Markers & Bow Curves Overlay
  _drawFlorentOverlays() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const ringMidR = (this.radius + this.innerRadius) / 2;

    const rgb = ColorMath.hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
    const solver = FlorentFargesEngine.solveMixingForColor(rgb);

    // 1. Draw dashed bow curve connecting active hue to its optical complement through center
    const activeAngleRad = (this.hsv.h * Math.PI) / 180;
    const compAngleRad = (solver.complement.angle * Math.PI) / 180;
    const pActive = { x: cx + (this.innerRadius - this.ringGap) * Math.cos(activeAngleRad), y: cy + (this.innerRadius - this.ringGap) * Math.sin(activeAngleRad) };
    const pComp = { x: cx + (this.innerRadius - this.ringGap) * Math.cos(compAngleRad), y: cy + (this.innerRadius - this.ringGap) * Math.sin(compAngleRad) };

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pActive.x, pActive.y);
    ctx.quadraticCurveTo(cx, cy, pComp.x, pComp.y);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central Chromatic Gray marker
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Draw beads for actual pigments on the ring
    const spectralPigs = FlorentFargesEngine.PIGMENTS.filter(p => !['titanium_white', 'zinc_white', 'ivory_black'].includes(p.id));
    spectralPigs.forEach(p => {
      const rad = (p.angle * Math.PI) / 180;
      const bx = cx + ringMidR * Math.cos(rad);
      const by = cy + ringMidR * Math.sin(rad);

      const isCandidate = p.id === solver.cand1.id || p.id === solver.cand2.id;
      const isComplement = p.id === solver.complement.id;

      ctx.beginPath();
      ctx.arc(bx, by, isCandidate ? 6 : (isComplement ? 5 : 3.5), 0, Math.PI * 2);
      ctx.fillStyle = p.hex;
      ctx.fill();
      ctx.strokeStyle = isCandidate ? '#FFFFFF' : (isComplement ? '#F59E0B' : 'rgba(0,0,0,0.7)');
      ctx.lineWidth = isCandidate ? 2 : 1;
      ctx.stroke();

      if (isCandidate) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelR = this.radius + 10;
        ctx.fillText(p.ci, cx + labelR * Math.cos(rad), cy + labelR * Math.sin(rad));
      }
    });

    ctx.restore();
  }

  // Harmony overlays (connecting geometric polygons & beads on hue ring)
  _drawHarmonyOverlays() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const ringMidR = (this.radius + this.innerRadius) / 2;

    const harmony = HarmonyEngine.getHarmony(this.hsv, this.harmonyRule, this.mode === 'ryb' ? 'ryb' : 'rgb');
    const colors = harmony.colors;

    if (colors.length <= 1) return;

    // Draw connecting geometry lines between harmony nodes
    ctx.beginPath();
    colors.forEach((col, idx) => {
      let angle = col.h;
      if (this.mode === 'ryb') {
        angle = ColorMath.rgbToRybHue(col.h);
      }
      const rad = (angle * Math.PI) / 180;
      const x = cx + ringMidR * Math.cos(rad);
      const y = cy + ringMidR * Math.sin(rad);

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw harmony bead nodes
    colors.slice(1).forEach((col) => {
      let angle = col.h;
      if (this.mode === 'ryb') {
        angle = ColorMath.rgbToRybHue(col.h);
      }
      const rad = (angle * Math.PI) / 180;
      const x = cx + ringMidR * Math.cos(rad);
      const y = cy + ringMidR * Math.sin(rad);

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = col.hex;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Draw Primary active Hue handle on the ring
  _drawRingHandle() {
    const ctx = this.ctx;
    const cx = this.center;
    const cy = this.center;
    const ringMidR = (this.radius + this.innerRadius) / 2;

    let angle = this.hsv.h;
    if (this.mode === 'ryb') {
      angle = ColorMath.rgbToRybHue(this.hsv.h);
    }
    const rad = (angle * Math.PI) / 180;
    const x = cx + ringMidR * Math.cos(rad);
    const y = cy + ringMidR * Math.sin(rad);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    const pureRgb = ColorMath.hsvToRgb(this.hsv.h, 1, 1);
    ctx.fillStyle = `rgb(${pureRgb.r}, ${pureRgb.g}, ${pureRgb.b})`;
    ctx.fill();
    ctx.restore();
  }

  _drawCursorHandle(x, y) {
    const ctx = this.ctx;
    const rgb = ColorMath.hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
    const isDark = this.hsv.v < 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    ctx.fill();
    ctx.restore();
  }

  // --- INTERACTION & EVENTS ---

  _bindEvents() {
    const c = this.canvas;
    const handleDown = (e) => {
      const pos = this._getEventPos(e);
      const distFromCenter = Math.hypot(pos.x - this.center, pos.y - this.center);

      if (distFromCenter >= this.innerRadius - 4 && distFromCenter <= this.radius + 6) {
        this.isDraggingRing = true;
        this._updateHueFromPos(pos);
      } else if (distFromCenter < this.innerRadius - this.ringGap + 6) {
        this.isDraggingInner = true;
        this._updateInnerFromPos(pos);
      }
    };

    const handleMove = (e) => {
      if (!this.isDraggingRing && !this.isDraggingInner) return;
      e.preventDefault();
      const pos = this._getEventPos(e);

      if (this.isDraggingRing) {
        this._updateHueFromPos(pos);
      } else if (this.isDraggingInner) {
        this._updateInnerFromPos(pos);
      }
    };

    const handleUp = () => {
      this.isDraggingRing = false;
      this.isDraggingInner = false;
    };

    c.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    c.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }

  _getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  _updateHueFromPos(pos) {
    const dx = pos.x - this.center;
    const dy = pos.y - this.center;
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    let targetHue = Math.round(angleDeg);
    if (this.mode === 'ryb') {
      targetHue = Math.round(ColorMath.rybToRgbHue(angleDeg));
    }

    this.hsv.h = targetHue;
    this.render();
    this._emitChange();
  }

  _updateInnerFromPos(pos) {
    if ((this.mode === 'triangle' || this.mode === 'florent') && this._triVertices) {
      // Calculate barycentric coordinates
      const { pApex, pWhite, pBlack } = this._triVertices;
      const x = pos.x, y = pos.y;

      const denom = (pWhite.y - pBlack.y) * (pApex.x - pBlack.x) + (pBlack.x - pWhite.x) * (pApex.y - pBlack.y);
      let lApex = ((pWhite.y - pBlack.y) * (x - pBlack.x) + (pBlack.x - pWhite.x) * (y - pBlack.y)) / denom;
      let lWhite = ((pBlack.y - pApex.y) * (x - pBlack.x) + (pApex.x - pBlack.x) * (y - pBlack.y)) / denom;
      let lBlack = 1 - lApex - lWhite;

      // Clamp into triangle bounds
      lApex = ColorMath.clamp(lApex, 0, 1);
      lWhite = ColorMath.clamp(lWhite, 0, 1);
      lBlack = ColorMath.clamp(lBlack, 0, 1);

      const sum = lApex + lWhite + lBlack;
      lApex /= sum;
      lWhite /= sum;
      lBlack /= sum;

      const v = ColorMath.clamp(lApex + lWhite, 0, 1);
      const s = v > 0.001 ? ColorMath.clamp(lApex / v, 0, 1) : 0;

      this.hsv.s = parseFloat(s.toFixed(3));
      this.hsv.v = parseFloat(v.toFixed(3));
    } else if (this._squareBox) {
      const { x1, y1, size } = this._squareBox;
      const s = ColorMath.clamp((pos.x - x1) / size, 0, 1);
      const v = ColorMath.clamp(1 - (pos.y - y1) / size, 0, 1);

      this.hsv.s = parseFloat(s.toFixed(3));
      this.hsv.v = parseFloat(v.toFixed(3));
    }

    this.render();
    this._emitChange();
  }
}
