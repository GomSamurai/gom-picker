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
      case 'warmth':
        // Warmest (Reds/Oranges ~25°) to Coolest (Blues/Cyans ~200°)
        const getWarmthScore = (hsv) => {
          let h = hsv.h;
          let distFromWarm = Math.abs(h - 30);
          if (distFromWarm > 180) distFromWarm = 360 - distFromWarm;
          return (1 - distFromWarm / 180) * (0.4 + hsv.s * 0.6);
        };
        list.sort((a, b) => getWarmthScore(b.hsv) - getWarmthScore(a.hsv));
        break;
      case 'harmonic':
        // Order by harmonic progression (luminance wave with sorted hues)
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

  // Extract palette using perceptual K-Means, targeted sampling, and filtering
  extractPalette(count = this.options.colorCount, filterMode = this.options.filterMode, sortBy = this.options.sortBy) {
    if (!this.canvas || this.canvas.width === 0) return [];

    const width = this.canvas.width;
    const height = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, width, height).data;

    // Sample general grid pixels
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 9000)));
    const generalPixels = [];
    const targetedFeaturePixels = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha < 128) continue; // Skip transparent

        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const p = [r, g, b];
        generalPixels.push(p);

        // Targeted feature-biased sampling
        const hsv = ColorMath.rgbToHsv(r, g, b);
        const lum = ColorMath.getLuminance(r, g, b);

        if (filterMode === 'flesh') {
          // Human skin tone bounds: Hue 10°-48°, mid-sat, mid-high value
          if (hsv.h >= 10 && hsv.h <= 48 && hsv.s >= 0.16 && hsv.s <= 0.72 && lum >= 0.22 && lum <= 0.88) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'dark') {
          // Shadow tones: deep darks and low luminance
          if (lum < 0.32) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'vibrant') {
          // High saturation accents
          if (hsv.s > 0.42 && lum > 0.12 && lum < 0.92) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'pastel') {
          // Soft tints: high luminance, moderate saturation
          if (lum > 0.65 && hsv.s < 0.55 && hsv.s > 0.08) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'warm') {
          // Warm solar hues
          if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'cool') {
          // Cool marine & sky hues
          if (hsv.h >= 145 && hsv.h <= 270) {
            targetedFeaturePixels.push(p);
          }
        } else if (filterMode === 'contrast') {
          // Darks and extreme highlights
          if (lum < 0.25 || lum > 0.78) {
            targetedFeaturePixels.push(p);
          }
        }
      }
    }

    if (generalPixels.length === 0) return [];

    // Blend targeted pixels into training pool to ensure critical features are not drowned out by large backgrounds
    let trainingPixels = generalPixels;
    if (targetedFeaturePixels.length > 50 && filterMode !== 'dominant') {
      // Inject targeted pixels with high representation
      const sampleWeightRatio = Math.min(targetedFeaturePixels.length * 3, 4000);
      const stride = Math.max(1, Math.floor(targetedFeaturePixels.length / sampleWeightRatio));
      const boostedFeatures = [];
      for (let i = 0; i < targetedFeaturePixels.length; i += stride) {
        boostedFeatures.push(targetedFeaturePixels[i]);
      }
      trainingPixels = [...generalPixels, ...boostedFeatures];
    }

    // Run K-Means with K = count * 3 to give wide room for analytical filtering
    const kInitial = Math.min(Math.max(count * 3, 10), 30);
    const clusters = this._runKMeans(trainingPixels, kInitial, 12);

    // Score and filter clusters based on filterMode
    let scored = clusters.map(c => {
      const rgb = { r: Math.round(c.centroid[0]), g: Math.round(c.centroid[1]), b: Math.round(c.centroid[2]) };
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
      const dominance = (c.count / trainingPixels.length);

      let score = dominance * 100;

      if (filterMode === 'vibrant') {
        // Boost high saturation & clean chromatic intensity
        score = hsv.s * 75 + (1 - Math.abs(lum - 0.5) * 2) * 20 + dominance * 5;
      } else if (filterMode === 'pastel') {
        // Boost light & delicate soft chroma
        score = lum * 60 + (1 - Math.abs(hsv.s - 0.28) * 2) * 25 + dominance * 15;
      } else if (filterMode === 'dark') {
        // Heavy boost for deep shadows and dark accents
        score = (1 - lum) * 85 + (hsv.s * 15) + dominance * 5;
      } else if (filterMode === 'contrast') {
        // Spans the dynamic range: bonus for high polarity away from mid-gray
        score = Math.abs(lum - 0.5) * 80 + hsv.s * 20;
      } else if (filterMode === 'flesh') {
        // Skin tone affinity
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

    // Remove near-duplicates using Perceptual Delta-E in OKLab
    const unique = [];
    scored.sort((a, b) => b.score - a.score);

    for (const item of scored) {
      const ok1 = ColorMath.rgbToOklch(item.rgb.r, item.rgb.g, item.rgb.b);
      const isDuplicate = unique.some(existing => {
        const ok2 = ColorMath.rgbToOklch(existing.rgb.r, existing.rgb.g, existing.rgb.b);
        const dL = ok1.l - ok2.l;
        const dH_rad = ((ok1.h - ok2.h) * Math.PI) / 180;
        const dC = Math.sqrt(Math.max(0, ok1.c * ok1.c + ok2.c * ok2.c - 2 * ok1.c * ok2.c * Math.cos(dH_rad)));
        const dE = Math.sqrt(dL * dL + dC * dC);
        return dE < 0.075; // Perceptual threshold: ~18 CIELAB units
      });

      if (!isDuplicate) {
        unique.push(item);
      }
      if (unique.length >= count) break;
    }

    // Fallback if filtering was overly strict
    if (unique.length < count && scored.length > unique.length) {
      for (const item of scored) {
        if (!unique.some(u => u.hex === item.hex)) {
          unique.push(item);
          if (unique.length >= count) break;
        }
      }
    }

    // Apply sorting
    const sorted = this.sortExtracted(unique, sortBy || this.options.sortBy);
    this.extractedColors = sorted;
    return sorted;
  }

  // K-Means clustering internal implementation
  _runKMeans(data, k, maxIterations = 10) {
    if (data.length <= k) {
      return data.map(p => ({ centroid: p, count: 1 }));
    }

    // Perceptual distance helper (Redmean metric, accurately models human eye perception)
    const perceptualDistSq = (p, c) => {
      const rmean = (p[0] + c[0]) * 0.5;
      const dr = p[0] - c[0];
      const dg = p[1] - c[1];
      const db = p[2] - c[2];
      return (((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8);
    };

    // K-Means++ initialization for better centroid spread
    const centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const distances = data.map(p => {
        let minDist = Infinity;
        for (const c of centroids) {
          const d = perceptualDistSq(p, c);
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
          const d = perceptualDistSq(p, c);
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

  // Analyze single image data and extract palette + metrics
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

        // Thermal evaluation
        if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) warmCount++;
        else if (hsv.h >= 150 && hsv.h <= 270) coolCount++;
      }
    }

    const totalValid = filePixels.length || 1;
    const avgLum = lumSum / totalValid;
    const avgSat = satSum / totalValid;
    const warmPct = Math.round((warmCount / totalValid) * 100);
    const coolPct = Math.round((coolCount / totalValid) * 100);

    const clusters = this._runKMeans(filePixels, Math.min(count * 2, 12), 8);
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

    return {
      id: 'img_' + Math.random().toString(36).substring(2, 9),
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

  // Calculate aggregated batch statistics across selected items
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
        // Sample subset into aggregated pool
        const step = Math.max(1, Math.floor(it.pixels.length / 500));
        for (let i = 0; i < it.pixels.length && aggregatedPixels.length < 16000; i += step) {
          aggregatedPixels.push(it.pixels[i]);
        }
      }
    });

    const len = selectedItems.length;
    let masterPalette = [];
    if (aggregatedPixels.length > 0) {
      const masterClusters = this._runKMeans(aggregatedPixels, count * 2, 10);
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

  // Process a batch of image files or folder
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

