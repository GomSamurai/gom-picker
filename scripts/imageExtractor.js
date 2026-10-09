/**
 * GOM Picker - Image Color Extractor & K-Means Quantizer
 * Extracts color palettes from images using K-Means clustering,
 * dominance ranking, vibrance filtering, and live canvas eyedropper.
 */

import { ColorMath } from './colorMath.js';

export class ImageExtractor {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    this.currentImage = null;
    this.extractedColors = [];
    this.options = {
      colorCount: 6,
      filterMode: 'dominant', // 'dominant' | 'vibrant' | 'pastel' | 'dark' | 'contrast'
      sortBy: 'dominance', // 'dominance' | 'hue' | 'luminance'
      ...options
    };
  }

  // Load an image from URL or dataURL
  loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImage = img;
        this.renderImage();
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

  // Render image scaled preserving aspect ratio
  renderImage() {
    if (!this.currentImage) return;

    const canvas = this.canvas;
    const ctx = this.ctx;
    const maxW = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    const maxH = 400;

    let w = this.currentImage.naturalWidth || this.currentImage.width;
    let h = this.currentImage.naturalHeight || this.currentImage.height;

    const ratio = Math.min(maxW / w, maxH / h, 1);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height);
  }

  // Get color at specific pixel coordinates (for live eyedropper)
  getColorAt(x, y) {
    if (!this.canvas || this.canvas.width === 0) return null;
    const clX = ColorMath.clamp(Math.floor(x), 0, this.canvas.width - 1);
    const clY = ColorMath.clamp(Math.floor(y), 0, this.canvas.height - 1);

    const pixel = this.ctx.getImageData(clX, clY, 1, 1).data;
    const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
    return {
      rgb,
      hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
      hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
      cmyk: ColorMath.rgbToCmyk(rgb.r, rgb.g, rgb.b)
    };
  }

  // Extract palette using K-Means and filtering
  extractPalette(count = this.options.colorCount, filterMode = this.options.filterMode) {
    if (!this.canvas || this.canvas.width === 0) return [];

    const width = this.canvas.width;
    const height = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, width, height).data;

    // Sample pixels (downsample for performance: step of ~4-8 pixels)
    const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 8000)));
    const pixels = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha < 128) continue; // Skip transparent

        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) return [];

    // Run K-Means with K = count * 2 to give room for filtering
    const kInitial = Math.min(Math.max(count * 2, 8), 24);
    const clusters = this._runKMeans(pixels, kInitial, 12);

    // Score and filter clusters based on filterMode
    let scored = clusters.map(c => {
      const rgb = { r: Math.round(c.centroid[0]), g: Math.round(c.centroid[1]), b: Math.round(c.centroid[2]) };
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const dominance = (c.count / pixels.length);

      let score = dominance * 100;

      if (filterMode === 'vibrant') {
        // Boost high saturation & mid luminance
        score = hsv.s * 60 + (1 - Math.abs(lum - 0.5) * 2) * 30 + dominance * 10;
      } else if (filterMode === 'pastel') {
        // Boost light & soft saturation
        score = lum * 50 + (1 - hsv.s) * 30 + dominance * 20;
      } else if (filterMode === 'dark') {
        // Boost dark shadows
        score = (1 - lum) * 70 + dominance * 30;
      } else if (filterMode === 'contrast') {
        // Balance across dynamic range
        score = dominance * 40 + Math.abs(lum - 0.5) * 60;
      }

      return {
        rgb,
        hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
        hsv,
        luminance: lum,
        dominancePercent: Math.round(dominance * 100),
        score
      };
    });

    // Remove near-duplicates (Delta E < 18)
    const unique = [];
    scored.sort((a, b) => b.score - a.score);

    for (const item of scored) {
      const isDuplicate = unique.some(existing => {
        const dist = Math.sqrt(
          Math.pow(item.rgb.r - existing.rgb.r, 2) +
          Math.pow(item.rgb.g - existing.rgb.g, 2) +
          Math.pow(item.rgb.b - existing.rgb.b, 2)
        );
        return dist < 32;
      });
      if (!isDuplicate) {
        unique.push(item);
      }
      if (unique.length >= count) break;
    }

    // Sort according to preference
    if (this.options.sortBy === 'hue') {
      unique.sort((a, b) => a.hsv.h - b.hsv.h);
    } else if (this.options.sortBy === 'luminance') {
      unique.sort((a, b) => a.luminance - b.luminance);
    } else {
      unique.sort((a, b) => b.dominancePercent - a.dominancePercent);
    }

    this.extractedColors = unique;
    return unique;
  }

  // K-Means clustering internal implementation
  _runKMeans(data, k, maxIterations = 10) {
    if (data.length <= k) {
      return data.map(p => ({ centroid: p, count: 1 }));
    }

    // K-Means++ initialization for better centroid spread
    const centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const distances = data.map(p => {
        let minDist = Infinity;
        for (const c of centroids) {
          const d = Math.pow(p[0] - c[0], 2) + Math.pow(p[1] - c[1], 2) + Math.pow(p[2] - c[2], 2);
          if (d < minDist) minDist = d;
        }
        return minDist;
      });

      const totalDist = distances.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalDist;
      let nextCentroid = data[0];

      for (let i = 0; i < data.length; i++) {
        rand -= distances[i];
        if (rand <= 0) {
          nextCentroid = data[i];
          break;
        }
      }
      centroids.push(nextCentroid);
    }

    let assignments = new Array(data.length).fill(0);
    let counts = new Array(k).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      counts.fill(0);

      // Assign points to nearest centroid
      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        let minDist = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < k; j++) {
          const c = centroids[j];
          const d = Math.pow(p[0] - c[0], 2) + Math.pow(p[1] - c[1], 2) + Math.pow(p[2] - c[2], 2);
          if (d < minDist) {
            minDist = d;
            bestCluster = j;
          }
        }
        assignments[i] = bestCluster;
        counts[bestCluster]++;
      }

      // Recompute centroids
      const sums = Array.from({ length: k }, () => [0, 0, 0]);
      for (let i = 0; i < data.length; i++) {
        const cluster = assignments[i];
        const p = data[i];
        sums[cluster][0] += p[0];
        sums[cluster][1] += p[1];
        sums[cluster][2] += p[2];
      }

      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          centroids[j] = [
            sums[j][0] / counts[j],
            sums[j][1] / counts[j],
            sums[j][2] / counts[j]
          ];
        }
      }
    }

    return centroids.map((c, idx) => ({
      centroid: c,
      count: counts[idx]
    })).filter(c => c.count > 0);
  }

  // Process a batch of image files or folder
  async processBatch(files, count = this.options.colorCount, filterMode = this.options.filterMode, onProgress = null) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return { items: [], masterPalette: [] };

    const items = [];
    const aggregatedPixels = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      if (onProgress) onProgress(i + 1, validFiles.length, file.name);

      try {
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

        // Offscreen sampling canvas
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        const maxDim = 150;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        offCanvas.width = Math.round(img.width * scale);
        offCanvas.height = Math.round(img.height * scale);
        offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
        const filePixels = [];
        const step = 3;

        for (let y = 0; y < offCanvas.height; y += step) {
          for (let x = 0; x < offCanvas.width; x += step) {
            const idx = (y * offCanvas.width + x) * 4;
            if (imgData[idx + 3] < 128) continue;
            const p = [imgData[idx], imgData[idx + 1], imgData[idx + 2]];
            filePixels.push(p);
            if (aggregatedPixels.length < 15000) aggregatedPixels.push(p);
          }
        }

        const clusters = this._runKMeans(filePixels, Math.min(count, 8), 8);
        const palette = clusters.map(c => {
          const r = Math.round(c.centroid[0]);
          const g = Math.round(c.centroid[1]);
          const b = Math.round(c.centroid[2]);
          return {
            rgb: { r, g, b },
            hex: ColorMath.rgbToHex(r, g, b)
          };
        });

        items.push({
          name: file.name,
          dataUrl,
          palette
        });
      } catch (err) {
        console.warn(`Error processing ${file.name}`, err);
      }
    }

    // Compute master fused palette across all batch images
    let masterPalette = [];
    if (aggregatedPixels.length > 0) {
      const masterClusters = this._runKMeans(aggregatedPixels, count * 2, 10);
      masterPalette = masterClusters.map(c => {
        const rgb = { r: Math.round(c.centroid[0]), g: Math.round(c.centroid[1]), b: Math.round(c.centroid[2]) };
        return {
          rgb,
          hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b),
          hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
          luminance: ColorMath.getLuminance(rgb.r, rgb.g, rgb.b)
        };
      }).slice(0, count);
    }

    return {
      items,
      masterPalette
    };
  }
}

