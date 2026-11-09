/**
 * GOM Picker - Image Color Extractor & K-Means Quantizer
 * Extracts color palettes from images using K-Means clustering,
 * interactive spatial selection tools (Rect, Ellipse, Lasso, Polygon, Brush),
 * exclusion masks, pan & zoom, loupe magnifier, and multi-image batch analytics.
 */

import { ColorMath } from './colorMath.js';

export class ImageExtractor {
  static PRESETS = {
    preset_balanced: {
      id: 'preset_balanced',
      name: '🎨 Maestro Equilibrado (Fidelidad Pro)',
      desc: 'Equilibrio perceptual entre dominancias y acentos armónicos',
      method: 'kmeans_density',
      filterMode: 'dominant',
      dedupTolerance: 0.075,
      sortBy: 'dominance'
    },
    preset_dominant: {
      id: 'preset_dominant',
      name: '👑 Dominancia Pura / Frecuencia',
      desc: 'Prioriza los colores que ocupan la mayor superficie física',
      method: 'histogram_peaks',
      filterMode: 'dominant',
      dedupTolerance: 0.070,
      sortBy: 'dominance'
    },
    preset_vibrant: {
      id: 'preset_vibrant',
      name: '✨ Alta Saturación & Énfasis',
      desc: 'Rescata los tonos vivos, cromáticos y expresivos',
      method: 'kmeans_density',
      filterMode: 'vibrant',
      dedupTolerance: 0.080,
      sortBy: 'saturation'
    },
    preset_portrait: {
      id: 'preset_portrait',
      name: '👤 Academia & Retrato (Carnaciones)',
      desc: 'Calibrado para tonos de piel, luces cálidas y semitonos',
      method: 'kmeans_density',
      filterMode: 'flesh',
      dedupTolerance: 0.065,
      sortBy: 'warmth'
    },
    preset_tonal_range: {
      id: 'preset_tonal_range',
      name: '🌓 Rango Tonal Completo (Luces/Sombras)',
      desc: 'Cubre todo el espectro dinámico desde sombras a altas luces',
      method: 'kmeans_furthest',
      filterMode: 'contrast',
      dedupTolerance: 0.085,
      sortBy: 'luminance'
    },
    preset_pastel: {
      id: 'preset_pastel',
      name: '🍬 Pasteles & Atmósfera Suave',
      desc: 'Luminosidad alta con saturación aterciopelada suave',
      method: 'kmeans_density',
      filterMode: 'pastel',
      dedupTolerance: 0.060,
      sortBy: 'luminance_desc'
    },
    preset_contrast: {
      id: 'preset_contrast',
      name: '⚡ Alto Contraste & Polarización Tonal',
      desc: 'Maximiza la separación entre luces y sombras',
      method: 'kmeans_furthest',
      filterMode: 'contrast',
      dedupTolerance: 0.090,
      sortBy: 'dominance'
    },
    preset_median_cut: {
      id: 'preset_median_cut',
      name: '📐 Geometría Median Cut (MMCQ)',
      desc: 'Cuantización ortogonal de volumen de caja RGB',
      method: 'median_cut',
      filterMode: 'dominant',
      dedupTolerance: 0.075,
      sortBy: 'dominance'
    }
  };

  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    this.currentImage = null;
    this.extractedColors = [];
    this.options = {
      colorCount: 6,
      filterMode: 'dominant', // 'dominant' | 'vibrant' | 'pastel' | 'dark' | 'contrast' | 'flesh' | 'warm' | 'cool'
      sortBy: 'dominance', // 'dominance' | 'hue' | 'luminance' | 'saturation' | 'warmth' | 'harmonic'
      method: 'kmeans_density', // 'kmeans_density' | 'kmeans_furthest' | 'median_cut' | 'histogram_peaks' | 'octree'
      preset: 'preset_balanced',
      quality: 'fine', // 'ultra' | 'fine' | 'fast'
      dedupTolerance: 0.075, // 0.045 to 0.120
      ...options
    };

    // Offscreen high-res working buffers
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true });

    this.selectionMaskCanvas = document.createElement('canvas');
    this.selectionMaskCtx = this.selectionMaskCanvas.getContext('2d', { willReadFrequently: true });

    this.exclusionMaskCanvas = document.createElement('canvas');
    this.exclusionMaskCtx = this.exclusionMaskCanvas.getContext('2d', { willReadFrequently: true });

    // Dimensional state
    this.sourceWidth = 0;
    this.sourceHeight = 0;

    // Viewport transform state (Zoom & Pan)
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.minZoom = 0.2;
    this.maxZoom = 12.0;

    // Tool state
    // 'eyedropper' | 'rect' | 'ellipse' | 'lasso' | 'polygon' | 'brush_sel' | 'mask_brush' | 'mask_eraser' | 'pan' | 'zoom'
    this.activeTool = 'eyedropper';
    this.selectionMode = 'new'; // 'new' | 'add' | 'sub'
    this.brushSize = 24; // In source image pixels
    this.hasSelection = false;
    this.hasExclusionMask = false;
    this.maskVisible = true;
    this.selectionBBox = null;

    // Interactive drawing temporary state
    this.isDrawing = false;
    this.isPanning = false;
    this.isSpacebarDown = false;
    this.dragStart = { x: 0, y: 0, imgX: 0, imgY: 0 };
    this.currentMousePos = { x: 0, y: 0, imgX: 0, imgY: 0, inBounds: false };
    this.lassoPoints = [];
    this.polygonPoints = [];
    this.lastBrushPoint = null;

    // Loupe inspector HUD
    this.showLoupe = true;
    this.mouseInside = false;

    // Callbacks
    this.onSelectionChange = null;
    this.onColorSampled = null;
    this.onZoomChange = null;
    this.onHoverPixel = null;

    this._bindEvents();
  }

  // --- EVENT BINDINGS FOR INTERACTIVE VIEWPORT ---

  _bindEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => this._handlePointerDown(e));
    window.addEventListener('pointermove', (e) => this._handlePointerMove(e));
    window.addEventListener('pointerup', (e) => this._handlePointerUp(e));

    this.canvas.addEventListener('mouseenter', () => {
      this.mouseInside = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseInside = false;
      this._hideLoupe();
      if (!this.isDrawing && !this.isPanning) {
        this.redraw();
      }
    });

    this.canvas.addEventListener('wheel', (e) => this._handleWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', (e) => this._handleDblClick(e));

    // Global spacebar listener for panning like Photoshop
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (!this.isSpacebarDown) {
          this.isSpacebarDown = true;
          this.canvas.style.cursor = 'grab';
        }
      } else if (e.code === 'Escape') {
        if (this.polygonPoints.length > 0) {
          this.polygonPoints = [];
          this.redraw();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacebarDown = false;
        this._updateCanvasCursor();
      }
    });
  }

  // Convert mouse/pointer client coords to canvas internal coords and image coords
  clientToImage(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (rect.width || 1);
    const scaleY = this.canvas.height / (rect.height || 1);
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    const imgX = (canvasX - this.panX) / this.zoom;
    const imgY = (canvasY - this.panY) / this.zoom;

    return {
      canvasX,
      canvasY,
      imgX: Math.round(imgX),
      imgY: Math.round(imgY),
      inBounds: imgX >= 0 && imgX < this.sourceWidth && imgY >= 0 && imgY < this.sourceHeight
    };
  }

  // Convert image coords to canvas internal coords
  imageToCanvas(imgX, imgY) {
    return {
      x: imgX * this.zoom + this.panX,
      y: imgY * this.zoom + this.panY
    };
  }

  _updateCanvasCursor() {
    if (this.isSpacebarDown || this.activeTool === 'pan') {
      this.canvas.style.cursor = this.isPanning ? 'grabbing' : 'grab';
    } else if (this.activeTool === 'eyedropper') {
      this.canvas.style.cursor = 'crosshair';
    } else if (this.activeTool === 'zoom') {
      this.canvas.style.cursor = 'zoom-in';
    } else if (['rect', 'ellipse', 'lasso', 'polygon'].includes(this.activeTool)) {
      this.canvas.style.cursor = 'crosshair';
    } else if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool)) {
      this.canvas.style.cursor = 'none'; // Custom circular brush cursor drawn in redraw()
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  _handlePointerDown(e) {
    if (!this.currentImage || e.button === 2) return; // Ignore right-click
    const pos = this.clientToImage(e.clientX, e.clientY);
    this.currentMousePos = pos;

    // 1. Middle mouse button OR Spacebar down OR Pan tool -> Pan Viewport
    if (e.button === 1 || this.isSpacebarDown || this.activeTool === 'pan') {
      this.isPanning = true;
      this.dragStart = { x: e.clientX, y: e.clientY, panX: this.panX, panY: this.panY };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 2. Eyedropper Tool -> Sample single pixel
    if (this.activeTool === 'eyedropper') {
      if (pos.inBounds) {
        const sampled = this.getColorAtImageCoords(pos.imgX, pos.imgY);
        if (sampled) {
          this.onColorSampled?.(sampled, e);
        }
      }
      return;
    }

    // 3. Zoom Tool -> Interactive click zoom
    if (this.activeTool === 'zoom') {
      const factor = e.altKey ? 0.7 : 1.45;
      this.zoomAt(pos.canvasX, pos.canvasY, factor);
      return;
    }

    // 4. Polygon Tool -> Add vertex or close
    if (this.activeTool === 'polygon') {
      if (this.polygonPoints.length > 2) {
        // Check if close to first point (within 14px in screen space)
        const firstPt = this.imageToCanvas(this.polygonPoints[0].x, this.polygonPoints[0].y);
        const dist = Math.hypot(pos.canvasX - firstPt.x, pos.canvasY - firstPt.y);
        if (dist < 14) {
          this._commitPolygonSelection();
          return;
        }
      }
      this.polygonPoints.push({ x: pos.imgX, y: pos.imgY });
      this.redraw();
      return;
    }

    // 5. Geometric & Organic Selection Tools
    if (['rect', 'ellipse', 'lasso', 'brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool)) {
      this.isDrawing = true;
      this.dragStart = { x: pos.canvasX, y: pos.canvasY, imgX: pos.imgX, imgY: pos.imgY };

      if (this.activeTool === 'lasso') {
        this.lassoPoints = [{ x: pos.imgX, y: pos.imgY }];
      } else if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool)) {
        this.lastBrushPoint = { x: pos.imgX, y: pos.imgY };
        this._paintBrushPoint(pos.imgX, pos.imgY);
      }
      this.redraw();
    }
  }

  _handlePointerMove(e) {
    if (!this.currentImage) return;
    const pos = this.clientToImage(e.clientX, e.clientY);
    this.currentMousePos = pos;

    // Live Hover color inspection & loupe
    if (pos.inBounds) {
      const sampled = this.getColorAtImageCoords(pos.imgX, pos.imgY);
      if (sampled) {
        this.onHoverPixel?.({ ...pos, ...sampled });
        this._updateLoupe(pos, sampled);
      }
    } else {
      this._hideLoupe();
    }

    // Pan Viewport
    if (this.isPanning) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.panX = Math.round(this.dragStart.panX + dx);
      this.panY = Math.round(this.dragStart.panY + dy);
      this.redraw();
      return;
    }

    // Active Drawing
    if (this.isDrawing) {
      if (this.activeTool === 'lasso') {
        this.lassoPoints.push({ x: pos.imgX, y: pos.imgY });
      } else if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool)) {
        if (this.lastBrushPoint) {
          this._paintBrushLine(this.lastBrushPoint.x, this.lastBrushPoint.y, pos.imgX, pos.imgY);
          this.lastBrushPoint = { x: pos.imgX, y: pos.imgY };
        }
      }
      this.redraw();
    } else if (this.activeTool === 'polygon' && this.polygonPoints.length > 0) {
      this.redraw(); // Draw elastic rubber-band line to mouse
    } else if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool) && this.mouseInside) {
      this.redraw(); // Draw circle brush cursor at pointer
    }
  }

  _handlePointerUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this._updateCanvasCursor();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.lastBrushPoint = null;

    const pos = this.clientToImage(e.clientX, e.clientY);

    if (this.activeTool === 'rect') {
      const minX = Math.min(this.dragStart.imgX, pos.imgX);
      const minY = Math.min(this.dragStart.imgY, pos.imgY);
      const w = Math.abs(pos.imgX - this.dragStart.imgX);
      const h = Math.abs(pos.imgY - this.dragStart.imgY);

      if (w > 2 && h > 2) {
        this._applyShapeToSelection((ctx) => {
          ctx.beginPath();
          ctx.rect(minX, minY, w, h);
          ctx.fill();
        });
      }
    } else if (this.activeTool === 'ellipse') {
      const rx = Math.abs(pos.imgX - this.dragStart.imgX) / 2;
      const ry = Math.abs(pos.imgY - this.dragStart.imgY) / 2;
      const cx = Math.min(this.dragStart.imgX, pos.imgX) + rx;
      const cy = Math.min(this.dragStart.imgY, pos.imgY) + ry;

      if (rx > 2 && ry > 2) {
        this._applyShapeToSelection((ctx) => {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (this.activeTool === 'lasso') {
      if (this.lassoPoints.length > 2) {
        this._applyShapeToSelection((ctx) => {
          ctx.beginPath();
          ctx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
          for (let i = 1; i < this.lassoPoints.length; i++) {
            ctx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
          }
          ctx.closePath();
          ctx.fill();
        });
      }
      this.lassoPoints = [];
    } else if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool)) {
      this._recomputeSelectionStats();
    }

    this.redraw();
  }

  _handleDblClick(e) {
    if (this.activeTool === 'polygon' && this.polygonPoints.length > 2) {
      this._commitPolygonSelection();
    }
  }

  _commitPolygonSelection() {
    if (this.polygonPoints.length < 3) return;
    const pts = [...this.polygonPoints];
    this.polygonPoints = [];

    this._applyShapeToSelection((ctx) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fill();
    });

    this.redraw();
  }

  _handleWheel(e) {
    e.preventDefault();
    const pos = this.clientToImage(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    this.zoomAt(pos.canvasX, pos.canvasY, factor);
  }

  // --- SELECTION & MASK COMPOSITION ENGINE ---

  _applyShapeToSelection(drawShapeFn) {
    const ctx = this.selectionMaskCtx;
    ctx.save();

    if (this.selectionMode === 'new') {
      ctx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFFFFF';
      drawShapeFn(ctx);
    } else if (this.selectionMode === 'add') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFFFFF';
      drawShapeFn(ctx);
    } else if (this.selectionMode === 'sub') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#FFFFFF';
      drawShapeFn(ctx);
    }

    ctx.restore();
    this._recomputeSelectionStats();
  }

  _paintBrushPoint(x, y) {
    const radius = Math.max(1, this.brushSize / 2);
    const isMask = this.activeTool === 'mask_brush';
    const isEraser = this.activeTool === 'mask_eraser';
    const ctx = (isMask || isEraser) ? this.exclusionMaskCtx : this.selectionMaskCtx;

    ctx.save();
    if (isEraser || (!isMask && this.selectionMode === 'sub')) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = isMask ? '#EF4444' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _paintBrushLine(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const radius = Math.max(1, this.brushSize / 2);
    const step = Math.max(1, radius * 0.4);
    const steps = Math.ceil(dist / step);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this._paintBrushPoint(x, y);
    }
  }

  _recomputeSelectionStats() {
    if (!this.sourceWidth || !this.sourceHeight) return;

    const total = this.sourceWidth * this.sourceHeight;
    const selData = this.selectionMaskCtx.getImageData(0, 0, this.sourceWidth, this.sourceHeight).data;
    const maskData = this.exclusionMaskCtx.getImageData(0, 0, this.sourceWidth, this.sourceHeight).data;

    let selectedCount = 0;
    let maskCount = 0;
    let minX = this.sourceWidth, maxX = 0, minY = this.sourceHeight, maxY = 0;

    for (let i = 0; i < total; i++) {
      const alpha = selData[i * 4 + 3];
      const maskAlpha = maskData[i * 4 + 3];

      if (alpha > 64) {
        selectedCount++;
        const x = i % this.sourceWidth;
        const y = Math.floor(i / this.sourceWidth);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      if (maskAlpha > 64) {
        maskCount++;
      }
    }

    this.hasSelection = selectedCount > 0;
    this.hasExclusionMask = maskCount > 0;

    if (this.hasSelection) {
      this.selectionBBox = { minX, maxX, minY, maxY };
    } else {
      this.selectionBBox = null;
    }

    const stats = this.getSelectionStats();
    this.onSelectionChange?.(stats);
  }

  getSelectionStats() {
    const total = this.sourceWidth * this.sourceHeight || 1;
    let selCount = 0;
    let maskCount = 0;

    if (this.hasSelection) {
      const sData = this.selectionMaskCtx.getImageData(0, 0, this.sourceWidth, this.sourceHeight).data;
      for (let i = 0; i < total; i++) {
        if (sData[i * 4 + 3] > 64) selCount++;
      }
    }

    if (this.hasExclusionMask) {
      const mData = this.exclusionMaskCtx.getImageData(0, 0, this.sourceWidth, this.sourceHeight).data;
      for (let i = 0; i < total; i++) {
        if (mData[i * 4 + 3] > 64) maskCount++;
      }
    }

    const selPct = this.hasSelection ? Math.max(1, Math.round((selCount / total) * 100)) : 100;
    const maskPct = this.hasExclusionMask ? Math.max(1, Math.round((maskCount / total) * 100)) : 0;

    return {
      hasSelection: this.hasSelection,
      selectedCount: this.hasSelection ? selCount : total,
      selectedPercent: selPct,
      hasExclusionMask: this.hasExclusionMask,
      maskedCount: maskCount,
      maskedPercent: maskPct,
      totalPixels: total
    };
  }

  // --- SELECTION & MASK MANIPULATION ACTIONS ---

  applyPreset(presetId) {
    const preset = ImageExtractor.PRESETS[presetId];
    if (!preset) return null;
    this.options.preset = presetId;
    this.options.method = preset.method;
    this.options.filterMode = preset.filterMode;
    this.options.dedupTolerance = preset.dedupTolerance;
    this.options.sortBy = preset.sortBy;
    return preset;
  }

  setTool(tool) {
    this.activeTool = tool;
    this.polygonPoints = [];
    this._updateCanvasCursor();
    this.redraw();
  }

  setSelectionMode(mode) {
    this.selectionMode = mode;
  }

  setBrushSize(size) {
    this.brushSize = Math.max(2, Math.min(120, parseInt(size, 10)));
    this.redraw();
  }

  clearSelection() {
    this.selectionMaskCtx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);
    this.hasSelection = false;
    this.selectionBBox = null;
    this.polygonPoints = [];
    this.redraw();
    this.onSelectionChange?.(this.getSelectionStats());
  }

  selectAll() {
    this.selectionMaskCtx.fillStyle = '#FFFFFF';
    this.selectionMaskCtx.fillRect(0, 0, this.sourceWidth, this.sourceHeight);
    this.hasSelection = true;
    this.selectionBBox = { minX: 0, maxX: this.sourceWidth, minY: 0, maxY: this.sourceHeight };
    this.redraw();
    this.onSelectionChange?.(this.getSelectionStats());
  }

  invertSelection() {
    if (!this.sourceWidth) return;
    const ctx = this.selectionMaskCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.sourceWidth, this.sourceHeight);
    ctx.restore();
    this._recomputeSelectionStats();
    this.redraw();
  }

  clearExclusionMask() {
    this.exclusionMaskCtx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);
    this.hasExclusionMask = false;
    this.redraw();
    this.onSelectionChange?.(this.getSelectionStats());
  }

  invertExclusionMask() {
    if (!this.sourceWidth) return;
    const ctx = this.exclusionMaskCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.sourceWidth, this.sourceHeight);
    ctx.restore();
    this.hasExclusionMask = true;
    this._recomputeSelectionStats();
    this.redraw();
  }

  toggleMaskVisibility() {
    this.maskVisible = !this.maskVisible;
    this.redraw();
    return this.maskVisible;
  }

  // --- ZOOM & PAN CONTROLS ---

  zoomAt(canvasX, canvasY, factor) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    if (Math.abs(newZoom - this.zoom) < 0.001) return;

    // Zoom centered at the target canvas coordinate
    this.panX = canvasX - ((canvasX - this.panX) / this.zoom) * newZoom;
    this.panY = canvasY - ((canvasY - this.panY) / this.zoom) * newZoom;
    this.zoom = newZoom;

    this.onZoomChange?.(this.zoom);
    this.redraw();
  }

  setZoom(level) {
    const target = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.zoomAt(cx, cy, target / this.zoom);
  }

  fitToContainer() {
    if (!this.currentImage || !this.sourceWidth) return;
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : 700;
    const h = 380;

    this.canvas.width = Math.max(300, w);
    this.canvas.height = h;

    const pad = 24;
    const scale = Math.min((this.canvas.width - pad) / this.sourceWidth, (this.canvas.height - pad) / this.sourceHeight, 1.0);
    this.zoom = Math.max(0.05, scale);
    this.panX = Math.round((this.canvas.width - this.sourceWidth * this.zoom) / 2);
    this.panY = Math.round((this.canvas.height - this.sourceHeight * this.zoom) / 2);

    this.onZoomChange?.(this.zoom);
    this.redraw();
  }

  // --- RENDERING PIPELINE ---

  redraw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.currentImage || !this.sourceWidth) {
      // Empty state prompt
      ctx.fillStyle = '#64748B';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Carga una imagen para comenzar la extracción cromática', w / 2, h / 2);
      return;
    }

    // 1. Subtle studio checkerboard pattern for transparent regions
    this._drawCheckerboard(ctx, w, h);

    // 2. Base Image with Zoom & Pan
    ctx.save();
    ctx.imageSmoothingEnabled = this.zoom <= 2.5;
    ctx.drawImage(
      this.sourceCanvas,
      Math.round(this.panX),
      Math.round(this.panY),
      Math.round(this.sourceWidth * this.zoom),
      Math.round(this.sourceHeight * this.zoom)
    );
    ctx.restore();

    // 3. Exclusion Mask Overlay (Rubylith Red)
    if (this.hasExclusionMask && this.maskVisible) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.drawImage(
        this.exclusionMaskCanvas,
        Math.round(this.panX),
        Math.round(this.panY),
        Math.round(this.sourceWidth * this.zoom),
        Math.round(this.sourceHeight * this.zoom)
      );
      ctx.restore();
    }

    // 4. Selection Area Overlay (Glow Cyan & Vignette)
    if (this.hasSelection) {
      ctx.save();
      // Draw cyan overlay on selected areas
      ctx.globalAlpha = 0.22;
      ctx.drawImage(
        this.selectionMaskCanvas,
        Math.round(this.panX),
        Math.round(this.panY),
        Math.round(this.sourceWidth * this.zoom),
        Math.round(this.sourceHeight * this.zoom)
      );
      ctx.restore();

      // Draw dashed selection bounds
      this._drawSelectionBorder(ctx);
    }

    // 5. In-progress Interactive Shapes
    this._drawInteractiveShape(ctx);
  }

  _drawCheckerboard(ctx, w, h) {
    const size = 16;
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#161926';
    for (let y = 0; y < h; y += size) {
      for (let x = (y / size) % 2 === 0 ? 0 : size; x < w; x += size * 2) {
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  _drawSelectionBorder(ctx) {
    if (!this.selectionBBox) return;
    const b = this.selectionBBox;
    const c1 = this.imageToCanvas(b.minX, b.minY);
    const c2 = this.imageToCanvas(b.maxX, b.maxY);

    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = (Date.now() / 80) % 9;
    ctx.strokeRect(c1.x, c1.y, Math.max(1, c2.x - c1.x), Math.max(1, c2.y - c1.y));
    ctx.restore();
  }

  _drawInteractiveShape(ctx) {
    ctx.save();

    // 1. Rect preview
    if (this.isDrawing && this.activeTool === 'rect') {
      const minX = Math.min(this.dragStart.x, this.currentMousePos.canvasX);
      const minY = Math.min(this.dragStart.y, this.currentMousePos.canvasY);
      const w = Math.abs(this.currentMousePos.canvasX - this.dragStart.x);
      const h = Math.abs(this.currentMousePos.canvasY - this.dragStart.y);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, w, h);
    }

    // 2. Ellipse preview
    else if (this.isDrawing && this.activeTool === 'ellipse') {
      const rx = Math.abs(this.currentMousePos.canvasX - this.dragStart.x) / 2;
      const ry = Math.abs(this.currentMousePos.canvasY - this.dragStart.y) / 2;
      const cx = Math.min(this.dragStart.x, this.currentMousePos.canvasX) + rx;
      const cy = Math.min(this.dragStart.y, this.currentMousePos.canvasY) + ry;

      if (rx > 0 && ry > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fill();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }
    }

    // 3. Lasso preview
    else if (this.isDrawing && this.activeTool === 'lasso' && this.lassoPoints.length > 1) {
      ctx.beginPath();
      const p0 = this.imageToCanvas(this.lassoPoints[0].x, this.lassoPoints[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < this.lassoPoints.length; i++) {
        const pt = this.imageToCanvas(this.lassoPoints[i].x, this.lassoPoints[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }

    // 4. Polygon preview & Elastic Line
    else if (this.activeTool === 'polygon' && this.polygonPoints.length > 0) {
      ctx.beginPath();
      const p0 = this.imageToCanvas(this.polygonPoints[0].x, this.polygonPoints[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < this.polygonPoints.length; i++) {
        const pt = this.imageToCanvas(this.polygonPoints[i].x, this.polygonPoints[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      // Elastic line to mouse position
      ctx.lineTo(this.currentMousePos.canvasX, this.currentMousePos.canvasY);

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();

      // Highlight starting anchor
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Circular Brush / Eraser Cursor
    if (['brush_sel', 'mask_brush', 'mask_eraser'].includes(this.activeTool) && this.mouseInside) {
      const radius = Math.max(2, (this.brushSize * this.zoom) / 2);
      ctx.beginPath();
      ctx.arc(this.currentMousePos.canvasX, this.currentMousePos.canvasY, radius, 0, Math.PI * 2);

      if (this.activeTool === 'mask_brush') {
        ctx.strokeStyle = '#EF4444';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      } else if (this.activeTool === 'mask_eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      } else {
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      }

      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- LOUPE MAGNIFIER HUD ---

  _updateLoupe(pos, sampled) {
    if (!this.showLoupe) return;
    const hud = document.getElementById('extractLoupeHud');
    const lCanvas = document.getElementById('loupeCanvas');
    const lHex = document.getElementById('loupeHex');
    const lCoords = document.getElementById('loupeCoords');

    if (!hud || !lCanvas) return;
    hud.style.display = 'flex';

    if (lHex) lHex.textContent = sampled.hex;
    if (lCoords) lCoords.textContent = `X:${pos.imgX} Y:${pos.imgY}`;

    // Render 4x magnified pixel patch with crosshair
    const lCtx = lCanvas.getContext('2d');
    const patchSize = 20; // 20x20 image pixels
    const half = patchSize / 2;
    lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);

    lCtx.save();
    lCtx.imageSmoothingEnabled = false; // Nearest neighbor for pixel grid
    lCtx.drawImage(
      this.sourceCanvas,
      pos.imgX - half,
      pos.imgY - half,
      patchSize,
      patchSize,
      0,
      0,
      lCanvas.width,
      lCanvas.height
    );

    // Center Crosshair
    const cx = lCanvas.width / 2;
    const cy = lCanvas.height / 2;
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    lCtx.lineWidth = 1;
    lCtx.strokeRect(cx - 3, cy - 3, 6, 6);

    lCtx.restore();
  }

  _hideLoupe() {
    const hud = document.getElementById('extractLoupeHud');
    if (hud) hud.style.display = 'none';
  }

  // --- COLOR EXTRACTION & COLOR GETTERS ---

  getColorAtImageCoords(imgX, imgY) {
    if (!this.sourceCanvas || this.sourceWidth === 0) return null;
    const x = ColorMath.clamp(Math.floor(imgX), 0, this.sourceWidth - 1);
    const y = ColorMath.clamp(Math.floor(imgY), 0, this.sourceHeight - 1);

    const pixel = this.sourceCtx.getImageData(x, y, 1, 1).data;
    const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
    return {
      rgb,
      hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
      hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
      cmyk: ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b)
    };
  }

  getColorAt(canvasX, canvasY) {
    const imgX = (canvasX - this.panX) / this.zoom;
    const imgY = (canvasY - this.panY) / this.zoom;
    return this.getColorAtImageCoords(imgX, imgY);
  }

  // Load an image from URL or dataURL
  loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImage = img;
        this._setupImageBuffers(img);
        this.fitToContainer();
        resolve(img);
      };
      img.onerror = (err) => reject(err);
      img.src = source;
    });
  }

  // Load from File object (drag-and-drop or file input)
  loadFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('El archivo no es una imagen válida'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.loadImage(e.target.result).then(resolve).catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  _setupImageBuffers(img) {
    const maxDim = 1200;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));

    this.sourceWidth = Math.max(1, Math.round(w * scale));
    this.sourceHeight = Math.max(1, Math.round(h * scale));

    this.sourceCanvas.width = this.sourceWidth;
    this.sourceCanvas.height = this.sourceHeight;
    this.sourceCtx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);
    this.sourceCtx.drawImage(img, 0, 0, this.sourceWidth, this.sourceHeight);

    this.selectionMaskCanvas.width = this.sourceWidth;
    this.selectionMaskCanvas.height = this.sourceHeight;
    this.selectionMaskCtx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);

    this.exclusionMaskCanvas.width = this.sourceWidth;
    this.exclusionMaskCanvas.height = this.sourceHeight;
    this.exclusionMaskCtx.clearRect(0, 0, this.sourceWidth, this.sourceHeight);

    this.hasSelection = false;
    this.hasExclusionMask = false;
    this.selectionBBox = null;
    this.polygonPoints = [];
    this.lassoPoints = [];

    this.onSelectionChange?.(this.getSelectionStats());
  }

  // Backwards compatibility shim
  renderImage() {
    this.fitToContainer();
  }

  // Sort extracted colors array according to sorting mode
  sortExtracted(colors = this.extractedColors, sortBy = this.options.sortBy) {
    if (!colors || colors.length === 0) return [];
    const list = [...colors];

    switch (sortBy) {
      case 'luminance':
        list.sort((a, b) => a.luminance - b.luminance);
        break;
      case 'luminance_desc':
        list.sort((a, b) => b.luminance - a.luminance);
        break;
      case 'hue':
        list.sort((a, b) => a.hsv.h - b.hsv.h);
        break;
      case 'saturation':
        list.sort((a, b) => (b.hsv.s || 0) - (a.hsv.s || 0));
        break;
      case 'warmth': {
        const getWarmthScore = (hsv) => {
          let h = hsv.h;
          let distFromWarm = Math.abs(h - 30);
          if (distFromWarm > 180) distFromWarm = 360 - distFromWarm;
          return (1 - distFromWarm / 180) * (0.4 + hsv.s * 0.6);
        };
        list.sort((a, b) => getWarmthScore(b.hsv) - getWarmthScore(a.hsv));
        break;
      }
      case 'harmonic':
        list.sort((a, b) => {
          const scoreA = (a.hsv.h / 360) * 0.6 + a.luminance * 0.4;
          const scoreB = (b.hsv.h / 360) * 0.6 + b.luminance * 0.4;
          return scoreA - scoreB;
        });
        break;
      case 'dominance':
      default:
        list.sort((a, b) => (b.dominancePercent || 0) - (a.dominancePercent || 0));
        break;
    }

    this.extractedColors = list;
    return list;
  }

  // --- ULTRA-PRECISE 100% DETERMINISTIC PALETTE EXTRACTION ---

  // Redmean color distance (perceptual, fast, integer-shift friendly)
  _perceptualDistSq(p, c) {
    const rmean = (p[0] + c[0]) * 0.5;
    const dr = p[0] - c[0];
    const dg = p[1] - c[1];
    const db = p[2] - c[2];
    return (((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8);
  }

  // 1. K-Means Determinista (Siembra por Picos de Densidad 3D o Voronoi Furthest-Point)
  _runDeterministicKMeans(data, k, maxIterations = 15, seedingMode = 'density') {
    if (data.length <= k) {
      return data.map(p => ({ centroid: p, count: 1 }));
    }

    let centroids = [];

    if (seedingMode === 'furthest') {
      // Voronoi Furthest-Point Seeding (Gonzalez algorithm)
      // Centroid 0: global mean of all pixels
      let sumR = 0, sumG = 0, sumB = 0;
      for (let i = 0; i < data.length; i++) {
        sumR += data[i][0]; sumG += data[i][1]; sumB += data[i][2];
      }
      centroids.push([sumR / data.length, sumG / data.length, sumB / data.length]);

      while (centroids.length < k) {
        let maxDistSq = -1;
        let bestP = data[0];
        for (let i = 0; i < data.length; i++) {
          const p = data[i];
          let minDistSq = Infinity;
          for (let j = 0; j < centroids.length; j++) {
            const d = this._perceptualDistSq(p, centroids[j]);
            if (d < minDistSq) minDistSq = d;
          }
          if (minDistSq > maxDistSq) {
            maxDistSq = minDistSq;
            bestP = p;
          }
        }
        centroids.push(bestP);
      }
    } else {
      // 3D Histogram Density Mode Seeding (Picos de densidad estadísticos reales)
      const bins = new Map();
      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const key = ((p[0] >> 3) << 10) | ((p[1] >> 3) << 5) | (p[2] >> 3);
        let b = bins.get(key);
        if (!b) {
          b = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
          bins.set(key, b);
        }
        b.count++;
        b.sumR += p[0];
        b.sumG += p[1];
        b.sumB += p[2];
      }

      const activeBins = [];
      for (const [key, b] of bins.entries()) {
        activeBins.push({
          key,
          count: b.count,
          centroid: [b.sumR / b.count, b.sumG / b.count, b.sumB / b.count]
        });
      }

      // Sort deterministically by count descending, tie-break by key
      activeBins.sort((a, b) => b.count - a.count || a.key - b.key);

      centroids.push(activeBins[0].centroid);
      const chosenIndices = new Set([0]);

      while (centroids.length < k && centroids.length < activeBins.length) {
        let bestScore = -1;
        let bestIdx = -1;

        for (let i = 0; i < activeBins.length; i++) {
          if (chosenIndices.has(i)) continue;
          const b = activeBins[i];
          let minDistSq = Infinity;
          for (let j = 0; j < centroids.length; j++) {
            const dSq = this._perceptualDistSq(b.centroid, centroids[j]);
            if (dSq < minDistSq) minDistSq = dSq;
          }

          const score = b.count * minDistSq;
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }

        if (bestIdx >= 0) {
          chosenIndices.add(bestIdx);
          centroids.push(activeBins[bestIdx].centroid);
        } else {
          break;
        }
      }
    }

    // Lloyd's iterative refinement (100% deterministic)
    let assignments = new Array(data.length).fill(0);
    let counts = new Array(centroids.length).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      counts.fill(0);

      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        let minDist = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < centroids.length; j++) {
          const d = this._perceptualDistSq(p, centroids[j]);
          if (d < minDist) {
            minDist = d;
            bestCluster = j;
          }
        }
        assignments[i] = bestCluster;
        counts[bestCluster]++;
      }

      const sums = Array.from({ length: centroids.length }, () => [0, 0, 0]);
      for (let i = 0; i < data.length; i++) {
        const cluster = assignments[i];
        const p = data[i];
        sums[cluster][0] += p[0];
        sums[cluster][1] += p[1];
        sums[cluster][2] += p[2];
      }

      let maxShift = 0;
      for (let j = 0; j < centroids.length; j++) {
        if (counts[j] > 0) {
          const newC = [
            sums[j][0] / counts[j],
            sums[j][1] / counts[j],
            sums[j][2] / counts[j]
          ];
          const shift = this._perceptualDistSq(centroids[j], newC);
          if (shift > maxShift) maxShift = shift;
          centroids[j] = newC;
        }
      }

      if (maxShift < 0.01) break;
    }

    return centroids.map((c, idx) => ({
      centroid: c,
      count: counts[idx]
    })).filter(c => c.count > 0);
  }

  // 2. Modified Median Cut Quantization (MMCQ)
  _runMedianCut(data, k) {
    if (data.length <= k) return data.map(p => ({ centroid: p, count: 1 }));

    const getVBox = (pixels) => {
      let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        if (p[0] < rMin) rMin = p[0]; if (p[0] > rMax) rMax = p[0];
        if (p[1] < gMin) gMin = p[1]; if (p[1] > gMax) gMax = p[1];
        if (p[2] < bMin) bMin = p[2]; if (p[2] > bMax) bMax = p[2];
        sumR += p[0]; sumG += p[1]; sumB += p[2];
      }
      const dr = rMax - rMin, dg = gMax - gMin, db = bMax - bMin;
      const volume = (dr + 1) * (dg + 1) * (db + 1);
      const count = pixels.length;
      return {
        pixels,
        rMin, rMax, gMin, gMax, bMin, bMax,
        dr, dg, db,
        volume,
        count,
        priority: count * Math.sqrt(volume),
        centroid: [sumR / count, sumG / count, sumB / count]
      };
    };

    const boxes = [getVBox(data)];

    while (boxes.length < k) {
      boxes.sort((a, b) => b.priority - a.priority || b.count - a.count);
      const box = boxes[0];
      if (box.pixels.length <= 1 || (box.dr === 0 && box.dg === 0 && box.db === 0)) break;

      boxes.shift();

      let axis = 0;
      if (box.dr >= box.dg && box.dr >= box.db) axis = 0;
      else if (box.dg >= box.dr && box.dg >= box.db) axis = 1;
      else axis = 2;

      box.pixels.sort((a, b) => a[axis] - b[axis] || a[(axis + 1) % 3] - b[(axis + 1) % 3]);
      const mid = Math.floor(box.pixels.length / 2);
      const left = box.pixels.slice(0, mid);
      const right = box.pixels.slice(mid);

      if (left.length > 0) boxes.push(getVBox(left));
      if (right.length > 0) boxes.push(getVBox(right));
    }

    return boxes.map(b => ({ centroid: b.centroid, count: b.count }));
  }

  // 3. Perceptual Histogram Peaks with Non-Maximum Suppression
  _runHistogramPeaks(data, k, minDistanceSq = 350) {
    if (data.length <= k) return data.map(p => ({ centroid: p, count: 1 }));

    const bins = new Map();
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const key = ((p[0] >> 3) << 10) | ((p[1] >> 3) << 5) | (p[2] >> 3);
      let b = bins.get(key);
      if (!b) {
        b = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
        bins.set(key, b);
      }
      b.count++;
      b.sumR += p[0];
      b.sumG += p[1];
      b.sumB += p[2];
    }

    const activeBins = [];
    for (const [key, b] of bins.entries()) {
      activeBins.push({
        key,
        count: b.count,
        centroid: [b.sumR / b.count, b.sumG / b.count, b.sumB / b.count]
      });
    }

    activeBins.sort((a, b) => b.count - a.count || a.key - b.key);

    const selected = [];
    for (const b of activeBins) {
      let tooClose = false;
      for (const s of selected) {
        if (this._perceptualDistSq(b.centroid, s.centroid) < minDistanceSq) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        selected.push(b);
        if (selected.length >= k) break;
      }
    }

    if (selected.length < k) {
      for (const b of activeBins) {
        if (!selected.includes(b)) {
          selected.push(b);
          if (selected.length >= k) break;
        }
      }
    }

    return selected.map(s => ({ centroid: s.centroid, count: s.count }));
  }

  // 4. Hierarchical Octree Color Quantization
  _runOctree(data, k) {
    if (data.length <= k) return data.map(p => ({ centroid: p, count: 1 }));

    class OctreeNode {
      constructor(level) {
        this.level = level;
        this.isLeaf = level === 7;
        this.count = 0;
        this.sumR = 0;
        this.sumG = 0;
        this.sumB = 0;
        this.children = new Array(8).fill(null);
      }
    }

    const levels = Array.from({ length: 8 }, () => []);
    const root = new OctreeNode(0);
    let leafCount = 0;

    const insert = (node, p, depth) => {
      if (node.isLeaf) {
        if (node.count === 0) leafCount++;
        node.count++;
        node.sumR += p[0];
        node.sumG += p[1];
        node.sumB += p[2];
        return;
      }

      const shift = 7 - depth;
      const rBit = (p[0] >> shift) & 1;
      const gBit = (p[1] >> shift) & 1;
      const bBit = (p[2] >> shift) & 1;
      const childIdx = (rBit << 2) | (gBit << 1) | bBit;

      if (!node.children[childIdx]) {
        const child = new OctreeNode(depth + 1);
        node.children[childIdx] = child;
        if (depth + 1 < 7) levels[depth + 1].push(child);
      }

      insert(node.children[childIdx], p, depth + 1);
    };

    for (let i = 0; i < data.length; i++) insert(root, data[i], 0);

    for (let lv = 6; lv >= 0 && leafCount > k; lv--) {
      const nodesAtLevel = levels[lv];
      nodesAtLevel.sort((a, b) => a.count - b.count);

      for (let i = 0; i < nodesAtLevel.length && leafCount > k; i++) {
        const node = nodesAtLevel[i];
        if (node.isLeaf) continue;

        let childrenCount = 0;
        for (let c = 0; c < 8; c++) {
          const child = node.children[c];
          if (child) {
            node.count += child.count;
            node.sumR += child.sumR;
            node.sumG += child.sumG;
            node.sumB += child.sumB;
            node.children[c] = null;
            childrenCount++;
          }
        }

        if (childrenCount > 0) {
          node.isLeaf = true;
          leafCount -= (childrenCount - 1);
        }
      }
    }

    const leaves = [];
    const collect = (node) => {
      if (node.isLeaf && node.count > 0) {
        leaves.push({
          centroid: [node.sumR / node.count, node.sumG / node.count, node.sumB / node.count],
          count: node.count
        });
        return;
      }
      for (let c = 0; c < 8; c++) {
        if (node.children[c]) collect(node.children[c]);
      }
    };
    collect(root);

    return leaves;
  }

  // Backwards compatibility shim
  _runKMeans(data, k, maxIterations = 15) {
    return this._runDeterministicKMeans(data, k, maxIterations, 'density');
  }

  // Extract palette using 100% deterministic algorithms, strictly bounded by spatial selection & exclusion mask
  extractPalette(
    count = this.options.colorCount,
    filterMode = this.options.filterMode,
    sortBy = this.options.sortBy,
    method = this.options.method,
    quality = this.options.quality,
    dedupTolerance = this.options.dedupTolerance
  ) {
    if (!this.sourceCanvas || this.sourceWidth === 0) return [];

    const width = this.sourceWidth;
    const height = this.sourceHeight;
    const imgData = this.sourceCtx.getImageData(0, 0, width, height).data;

    let selData = null;
    if (this.hasSelection) {
      selData = this.selectionMaskCtx.getImageData(0, 0, width, height).data;
    }

    let maskData = null;
    if (this.hasExclusionMask) {
      maskData = this.exclusionMaskCtx.getImageData(0, 0, width, height).data;
    }

    const isPixelValid = (idx) => {
      // Transparency check
      if (imgData[idx + 3] < 128) return false;
      // Exclusion mask check
      if (maskData && maskData[idx + 3] > 64) return false;
      // Spatial selection check (if selection active, pixel must be selected)
      if (selData && selData[idx + 3] < 64) return false;
      return true;
    };

    // Estimate valid pixel volume to dynamically scale the sampling step
    let sampleVolumeEstimate = 0;
    const probeStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 1600)));
    for (let y = 0; y < height; y += probeStep) {
      for (let x = 0; x < width; x += probeStep) {
        const idx = (y * width + x) * 4;
        if (isPixelValid(idx)) sampleVolumeEstimate++;
      }
    }
    const estimatedValidPixels = sampleVolumeEstimate * (probeStep * probeStep);

    // Target pool size based on quality preset
    let targetPoolSize = 8500;
    if (quality === 'ultra') targetPoolSize = 20000;
    else if (quality === 'fast') targetPoolSize = 4000;

    const step = Math.max(1, Math.floor(Math.sqrt(Math.max(estimatedValidPixels, 100) / targetPoolSize)));

    const generalPixels = [];
    const targetedFeaturePixels = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        if (!isPixelValid(idx)) continue;

        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const p = [r, g, b];
        generalPixels.push(p);

        // Targeted feature-biased sampling
        const hsv = ColorMath.rgbToHsv(r, g, b);
        const lum = ColorMath.getLuminance(r, g, b);

        if (filterMode === 'flesh') {
          if (hsv.h >= 10 && hsv.h <= 48 && hsv.s >= 0.16 && hsv.s <= 0.72 && lum >= 0.22 && lum <= 0.88) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'dark') {
          if (lum < 0.32) targetedFeaturePixels.push(p);
        } else if (filterMode === 'vibrant') {
          if (hsv.s > 0.42 && lum > 0.12 && lum < 0.92) targetedFeaturePixels.push(p);
        } else if (filterMode === 'pastel') {
          if (lum > 0.65 && hsv.s < 0.55 && hsv.s > 0.08) targetedFeaturePixels.push(p);
        } else if (filterMode === 'warm') {
          if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) targetedFeaturePixels.push(p);
        } else if (filterMode === 'cool') {
          if (hsv.h >= 145 && hsv.h <= 270) targetedFeaturePixels.push(p);
        } else if (filterMode === 'contrast') {
          if (lum < 0.25 || lum > 0.78) targetedFeaturePixels.push(p);
        }
      }
    }

    if (generalPixels.length === 0) return [];

    // Blend targeted pixels into training pool
    let trainingPixels = generalPixels;
    if (targetedFeaturePixels.length > 50 && filterMode !== 'dominant') {
      const sampleWeightRatio = Math.min(targetedFeaturePixels.length * 3, 4000);
      const stride = Math.max(1, Math.floor(targetedFeaturePixels.length / sampleWeightRatio));
      const boostedFeatures = [];
      for (let i = 0; i < targetedFeaturePixels.length; i += stride) {
        boostedFeatures.push(targetedFeaturePixels[i]);
      }
      trainingPixels = [...generalPixels, ...boostedFeatures];
    }

    // Number of initial candidate clusters
    const kInitial = Math.min(Math.max(count * 3, 12), 36);
    let clusters = [];

    switch (method) {
      case 'kmeans_furthest':
        clusters = this._runDeterministicKMeans(trainingPixels, kInitial, 15, 'furthest');
        break;
      case 'median_cut':
        clusters = this._runMedianCut(trainingPixels, kInitial);
        break;
      case 'histogram_peaks':
        clusters = this._runHistogramPeaks(trainingPixels, kInitial, 350);
        break;
      case 'octree':
        clusters = this._runOctree(trainingPixels, kInitial);
        break;
      case 'kmeans_density':
      default:
        clusters = this._runDeterministicKMeans(trainingPixels, kInitial, 15, 'density');
        break;
    }

    // Score and filter clusters based on filterMode
    let scored = clusters.map(c => {
      const rgb = { r: Math.round(c.centroid[0]), g: Math.round(c.centroid[1]), b: Math.round(c.centroid[2]) };
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const dominance = (c.count / trainingPixels.length);

      let score = dominance * 100;

      if (filterMode === 'vibrant') {
        score = hsv.s * 75 + (1 - Math.abs(lum - 0.5) * 2) * 20 + dominance * 5;
      } else if (filterMode === 'pastel') {
        score = lum * 60 + (1 - Math.abs(hsv.s - 0.28) * 2) * 25 + dominance * 15;
      } else if (filterMode === 'dark') {
        score = (1 - lum) * 85 + (hsv.s * 15) + dominance * 5;
      } else if (filterMode === 'contrast') {
        score = Math.abs(lum - 0.5) * 80 + hsv.s * 20;
      } else if (filterMode === 'flesh') {
        const isSkinHue = hsv.h >= 10 && hsv.h <= 48;
        const skinHueDist = Math.abs(hsv.h - 26);
        const skinFactor = isSkinHue ? (1 - skinHueDist / 30) : 0;
        score = skinFactor * 70 + (1 - Math.abs(lum - 0.6) * 1.5) * 20 + dominance * 10;
      } else if (filterMode === 'warm') {
        const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;
        score = (isWarm ? 65 : 0) + hsv.s * 25 + dominance * 10;
      } else if (filterMode === 'cool') {
        const isCool = hsv.h >= 145 && hsv.h <= 270;
        score = (isCool ? 65 : 0) + hsv.s * 25 + dominance * 10;
      }

      return {
        rgb,
        hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
        hsv,
        luminance: lum,
        dominancePercent: Math.max(1, Math.round(dominance * 100)),
        score
      };
    });

    // Deduplication with configurable Delta-E tolerance in OKLab
    const dedupDist = typeof dedupTolerance === 'number' ? dedupTolerance : (
      dedupTolerance === 'strict' ? 0.045 :
      dedupTolerance === 'distinct' ? 0.120 : 0.075
    );

    const unique = [];
    scored.sort((a, b) => b.score - a.score || a.hex.localeCompare(b.hex));

    for (const item of scored) {
      const ok1 = ColorMath.rgbToOklch(item.rgb.r, item.rgb.g, item.rgb.b);
      const isDuplicate = unique.some(existing => {
        const ok2 = ColorMath.rgbToOklch(existing.rgb.r, existing.rgb.g, existing.rgb.b);
        const dL = ok1.l - ok2.l;
        const dH_rad = ((ok1.h - ok2.h) * Math.PI) / 180;
        const dC = Math.sqrt(Math.max(0, ok1.c * ok1.c + ok2.c * ok2.c - 2 * ok1.c * ok2.c * Math.cos(dH_rad)));
        const dE = Math.sqrt(dL * dL + dC * dC);
        return dE < dedupDist;
      });

      if (!isDuplicate) {
        unique.push(item);
      }
      if (unique.length >= count) break;
    }

    if (unique.length < count && scored.length > unique.length) {
      for (const item of scored) {
        if (!unique.some(u => u.hex === item.hex)) {
          unique.push(item);
          if (unique.length >= count) break;
        }
      }
    }

    const sorted = this.sortExtracted(unique, sortBy || this.options.sortBy);
    this.extractedColors = sorted;
    return sorted;
  }

  // --- MULTI-IMAGE BATCH ANALYSIS ENGINE ---

  async processSingleImageFile(file, count = this.options.colorCount, filterMode = this.options.filterMode) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    const maxDim = 180;
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    offCanvas.width = Math.max(1, Math.round(img.width * scale));
    offCanvas.height = Math.max(1, Math.round(img.height * scale));
    offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
    const filePixels = [];
    const step = 2;
    let lumSum = 0;
    let satSum = 0;
    let warmCount = 0;
    let coolCount = 0;
    let minLum = 1;
    let maxLum = 0;

    for (let y = 0; y < offCanvas.height; y += step) {
      for (let x = 0; x < offCanvas.width; x += step) {
        const idx = (y * offCanvas.width + x) * 4;
        if (imgData[idx + 3] < 128) continue;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const p = [r, g, b];
        filePixels.push(p);

        const lum = ColorMath.getLuminance(r, g, b);
        const hsv = ColorMath.rgbToHsv(r, g, b);
        lumSum += lum;
        satSum += hsv.s;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;

        if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) warmCount++;
        else if (hsv.h >= 150 && hsv.h <= 270) coolCount++;
      }
    }

    const totalValid = filePixels.length || 1;
    const avgLum = lumSum / totalValid;
    const avgSat = satSum / totalValid;
    const warmPct = Math.round((warmCount / totalValid) * 100);
    const coolPct = Math.round((coolCount / totalValid) * 100);

    const clusters = this._runDeterministicKMeans(filePixels, Math.min(count * 2, 12), 10, 'density');
    const palette = clusters.map(c => {
      const r = Math.round(c.centroid[0]);
      const g = Math.round(c.centroid[1]);
      const b = Math.round(c.centroid[2]);
      return {
        rgb: { r, g, b },
        hex: ColorMath.rgbToHex(r, g, b),
        hsv: ColorMath.rgbToHsv(r, g, b),
        luminance: ColorMath.getLuminance(r, g, b),
        weight: Math.round((c.count / totalValid) * 100)
      };
    }).slice(0, count);

    // Deterministic item ID from name and size
    const safeHash = Math.abs((file.name + file.size).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36);

    return {
      id: 'img_' + safeHash,
      file,
      name: file.name,
      width: img.width,
      height: img.height,
      dataUrl,
      palette,
      pixels: filePixels,
      selected: true,
      stats: {
        avgLum: Math.round(avgLum * 100),
        avgSat: Math.round(avgSat * 100),
        warmPct,
        coolPct,
        dynamicRange: Math.round((maxLum - minLum) * 100),
        keyType: avgLum > 0.6 ? 'High-Key' : (avgLum < 0.35 ? 'Low-Key' : 'Mid-Key')
      }
    };
  }

  calculateBatchMetrics(items, count = this.options.colorCount) {
    const selectedItems = items.filter(it => it.selected !== false);
    if (selectedItems.length === 0) {
      return {
        selectedCount: 0,
        totalCount: items.length,
        avgLum: 0,
        avgSat: 0,
        warmPct: 0,
        coolPct: 0,
        highKeyPct: 0,
        midKeyPct: 0,
        lowKeyPct: 0,
        dynamicRange: 0,
        masterPalette: []
      };
    }

    let sumLum = 0;
    let sumSat = 0;
    let sumWarm = 0;
    let sumCool = 0;
    let sumDR = 0;
    let countHighKey = 0;
    let countMidKey = 0;
    let countLowKey = 0;
    const aggregatedPixels = [];

    selectedItems.forEach(it => {
      sumLum += it.stats.avgLum;
      sumSat += it.stats.avgSat;
      sumWarm += it.stats.warmPct;
      sumCool += it.stats.coolPct;
      sumDR += it.stats.dynamicRange;

      if (it.stats.keyType === 'High-Key') countHighKey++;
      else if (it.stats.keyType === 'Low-Key') countLowKey++;
      else countMidKey++;

      if (it.pixels) {
        const step = Math.max(1, Math.floor(it.pixels.length / 500));
        for (let i = 0; i < it.pixels.length && aggregatedPixels.length < 16000; i += step) {
          aggregatedPixels.push(it.pixels[i]);
        }
      }
    });

    const len = selectedItems.length;
    let masterPalette = [];
    if (aggregatedPixels.length > 0) {
      const masterClusters = this._runDeterministicKMeans(aggregatedPixels, count * 2, 12, 'density');
      masterPalette = masterClusters.map(c => {
        const rgb = { r: Math.round(c.centroid[0]), g: Math.round(c.centroid[1]), b: Math.round(c.centroid[2]) };
        return {
          rgb,
          hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
          hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
          luminance: ColorMath.getLuminance(rgb.r, rgb.g, rgb.b),
          weight: Math.round((c.count / aggregatedPixels.length) * 100)
        };
      }).slice(0, count);
    }

    return {
      selectedCount: len,
      totalCount: items.length,
      avgLum: Math.round(sumLum / len),
      avgSat: Math.round(sumSat / len),
      warmPct: Math.round(sumWarm / len),
      coolPct: Math.round(sumCool / len),
      highKeyPct: Math.round((countHighKey / len) * 100),
      midKeyPct: Math.round((countMidKey / len) * 100),
      lowKeyPct: Math.round((countLowKey / len) * 100),
      dynamicRange: Math.round(sumDR / len),
      masterPalette
    };
  }

  async processBatch(files, count = this.options.colorCount, filterMode = this.options.filterMode, onProgress = null) {
    const validFiles = Array.from(files).filter(f => f.type ? f.type.startsWith('image/') : /\.(jpe?g|png|webp|svg|bmp|gif)$/i.test(f.name));
    if (validFiles.length === 0) return { items: [], metrics: null, masterPalette: [] };

    const items = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      if (onProgress) onProgress(i + 1, validFiles.length, file.name);

      try {
        const item = await this.processSingleImageFile(file, count, filterMode);
        items.push(item);
      } catch (err) {
        console.warn(`Error processing ${file.name}`, err);
      }
    }

    const metrics = this.calculateBatchMetrics(items, count);

    return {
      items,
      metrics,
      masterPalette: metrics.masterPalette
    };
  }
}
