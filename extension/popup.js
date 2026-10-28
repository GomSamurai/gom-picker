/**
 * GOM Color Picker Pro — Chromium Extension Popup Application
 * Pure Vanilla JavaScript — High-Performance, Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentColor = { r: 99, g: 102, b: 241, hex: '#6366F1' };
  let previousColor = { r: 255, g: 255, b: 255, hex: '#FFFFFF' };
  let currentHsv = { h: 238, s: 0.59, v: 0.95 };
  let activeTab = 'history'; // 'history' | 'palette'
  let historyColors = [];
  let paletteColors = [];
  let isDraggingWheel = false;
  let isDraggingInner = false;

  // DOM Elements
  const canvas = document.getElementById('colorWheelCanvas');
  const ctx = canvas.getContext('2d');
  const swatchCurrent = document.getElementById('swatchCurrent');
  const swatchPrevious = document.getElementById('swatchPrevious');
  const txtHex = document.getElementById('txtHex');
  const txtRgb = document.getElementById('txtRgb');
  const txtHsl = document.getElementById('txtHsl');
  const txtCmyk = document.getElementById('txtCmyk');
  const txtOklch = document.getElementById('txtOklch');
  const txtMunsell = document.getElementById('txtMunsell');
  const txtColorTemp = document.getElementById('txtColorTemp');
  const txtInherentValue = document.getElementById('txtInherentValue');
  const txtPigmentFormula = document.getElementById('txtPigmentFormula');
  const txtPigmentNotes = document.getElementById('txtPigmentNotes');
  const harmoniesRow = document.getElementById('harmoniesRow');
  const lightShadowRow = document.getElementById('lightShadowRow');
  const swatchCollectionRow = document.getElementById('swatchCollectionRow');
  const countHistory = document.getElementById('countHistory');
  const countPalette = document.getElementById('countPalette');
  const tabHistory = document.getElementById('tabHistory');
  const tabPalette = document.getElementById('tabPalette');
  const selHarmonyRule = document.getElementById('selHarmonyRule');
  const btnPickColor = document.getElementById('btnPickColor');
  const btnPinColor = document.getElementById('btnPinColor');
  const btnExportPalette = document.getElementById('btnExportPalette');
  const btnClearCurrentTab = document.getElementById('btnClearCurrentTab');
  const btnOpenFullSuite = document.getElementById('btnOpenFullSuite');
  const toastNotification = document.getElementById('toastNotification');

  // Load Saved State
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['gom_history', 'gom_palette', 'gom_last_color'], (res) => {
      if (res.gom_history && Array.isArray(res.gom_history)) {
        historyColors = res.gom_history;
      }
      if (res.gom_palette && Array.isArray(res.gom_palette)) {
        paletteColors = res.gom_palette;
      }
      if (res.gom_last_color) {
        setColorFromHex(res.gom_last_color, false);
      } else {
        updateAllUI();
      }
      renderCollection();
    });
  } else {
    updateAllUI();
    renderCollection();
  }

  // --- COLOR MATH ENGINE ---

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function hexToRgb(hex) {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, v };
  }

  function hsvToRgb(h, s, v) {
    h = (h % 360 + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r1, g1, b1;
    if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    return { c, m, y, k };
  }

  function rgbToOklch(r, g, b) {
    // Linear sRGB
    const srgbToLinear = c => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const bOk = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    const C = Math.sqrt(a * a + bOk * bOk);
    let h = Math.atan2(bOk, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    return { l: L.toFixed(2), c: C.toFixed(2), h: Math.round(h) };
  }

  function rgbToMunsell(r, g, b) {
    const hsv = rgbToHsv(r, g, b);
    const vMunsell = (hsv.v * 10).toFixed(1);
    const cMunsell = Math.round(hsv.s * 14);
    const hues = [
      { max: 25, name: '5R' },
      { max: 55, name: '5YR' },
      { max: 95, name: '5Y' },
      { max: 155, name: '5GY' },
      { max: 195, name: '5G' },
      { max: 235, name: '5BG' },
      { max: 275, name: '5B' },
      { max: 315, name: '5PB' },
      { max: 345, name: '5P' },
      { max: 360, name: '5RP' }
    ];
    const match = hues.find(h => hsv.h <= h.max) || hues[0];
    return `${match.name} ${vMunsell}/${cMunsell}`;
  }

  function getSorollaRamp(hsv) {
    // 5 pasos tonales: Luz Cenital, Luz Media, Tono Local, Sombra Propia, Sombra Ambiente
    const warmShift = (hsv.h >= 15 && hsv.h <= 75) ? -15 : 18; // Desplazamiento cálido en luz, frío en sombra
    return [
      { name: 'Brillo / Luz Solar', hsv: { h: (hsv.h - warmShift + 360) % 360, s: Math.max(0.1, hsv.s * 0.45), v: Math.min(1.0, hsv.v * 1.25) } },
      { name: 'Tono Medio Claro', hsv: { h: (hsv.h - (warmShift * 0.5) + 360) % 360, s: Math.max(0.2, hsv.s * 0.75), v: Math.min(0.95, hsv.v * 1.1) } },
      { name: 'Tono Local (Masa)', hsv: { ...hsv } },
      { name: 'Sombra de Forma', hsv: { h: (hsv.h + warmShift * 0.7 + 360) % 360, s: Math.min(1.0, hsv.s * 1.15), v: Math.max(0.15, hsv.v * 0.6) } },
      { name: 'Sombra Fría / Oclusión', hsv: { h: (hsv.h + warmShift * 1.4 + 360) % 360, s: Math.min(1.0, hsv.s * 1.25), v: Math.max(0.08, hsv.v * 0.35) } }
    ];
  }

  function getHarmonies(hsv, rule) {
    const list = [{ name: 'Base', hsv: { ...hsv } }];
    const h = hsv.h, s = hsv.s, v = hsv.v;
    switch (rule) {
      case 'complementary':
        list.push({ name: 'Complementario', hsv: { h: (h + 180) % 360, s, v } });
        break;
      case 'triadic':
        list.push({ name: 'Tríada 1', hsv: { h: (h + 120) % 360, s, v } });
        list.push({ name: 'Tríada 2', hsv: { h: (h + 240) % 360, s, v } });
        break;
      case 'analogous':
        list.push({ name: 'Análogo -30°', hsv: { h: (h - 30 + 360) % 360, s, v } });
        list.push({ name: 'Análogo +30°', hsv: { h: (h + 30) % 360, s, v } });
        break;
      case 'split':
        list.push({ name: 'Split 1', hsv: { h: (h + 150) % 360, s, v } });
        list.push({ name: 'Split 2', hsv: { h: (h + 210) % 360, s, v } });
        break;
      case 'tetradic':
        list.push({ name: 'Tétrada 1', hsv: { h: (h + 90) % 360, s, v } });
        list.push({ name: 'Tétrada 2', hsv: { h: (h + 180) % 360, s, v } });
        list.push({ name: 'Tétrada 3', hsv: { h: (h + 270) % 360, s, v } });
        break;
      case 'monochromatic':
        list.push({ name: 'Tint +', hsv: { h, s: Math.max(0.1, s * 0.5), v: Math.min(1, v * 1.3) } });
        list.push({ name: 'Shade -', hsv: { h, s: Math.min(1, s * 1.2), v: Math.max(0.2, v * 0.6) } });
        break;
    }
    return list;
  }

  function getPigmentRecipe(rgb) {
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    const inherentStep = Math.max(1, Math.min(9, Math.round(1 + lum * 8)));

    let formula = 'Tierra de Siena Tostada (PBr7) + Blanco Titanio (PW6)';
    let notes = 'Mezcla neutral cálida clásica con excelente opacidad de lienzo.';

    if (hsv.s < 0.15) {
      if (hsv.v > 0.8) {
        formula = 'Blanco de Titanio (PW6) + Pizca Ocre Amarillo (PY43)';
        notes = 'Blanco cálido de alta cobertura luminosa.';
      } else if (hsv.v < 0.25) {
        formula = 'Negro Marfil (PBk9) + PBr7 Sombra Natural';
        notes = 'Negro cromático profundo sin reflejo azulado.';
      } else {
        formula = 'Gris de Payne (PB15 + PBk9) + Blanco Titanio (PW6)';
        notes = 'Gris neutro de atelier para medias tintas de modelado.';
      }
    } else {
      if (hsv.h >= 345 || hsv.h < 25) {
        formula = 'Rojo Cadmio Medio (PR108) + Carmín de Alizarina (PR83)';
        notes = 'Rojo vivo con profundidad en las sombras.';
      } else if (hsv.h < 65) {
        formula = 'Amarillo de Cadmio Limón (PY35) + Ocre Amarillo (PY43)';
        notes = 'Amarillo luminoso de gran solidez a la luz.';
      } else if (hsv.h < 165) {
        formula = 'Verde Viridian (PG18) + PBr7 Sombra Tostada';
        notes = 'Verde vegetal realista para follaje plein-air.';
      } else if (hsv.h < 265) {
        formula = 'Azul Ultramar Francés (PB29) + Blanco Titanio (PW6)';
        notes = 'Azul cálido atmosférico de granulado aterciopelado.';
      } else {
        formula = 'Violeta Cobalto (PV14) + Magenta Quinacridona (PV19)';
        notes = 'Violeta luminoso de alta saturación y veladura.';
      }
    }

    return { formula, notes, inherentStep };
  }

  // --- UI RENDER ENGINE ---

  function updateAllUI() {
    const hex = currentColor.hex;
    const rgb = currentColor.r !== undefined ? currentColor : hexToRgb(hex);

    // 1. Swatches
    swatchCurrent.style.backgroundColor = hex;
    swatchPrevious.style.backgroundColor = previousColor.hex;

    // 2. Multiformats
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const munsell = rgbToMunsell(rgb.r, rgb.g, rgb.b);

    txtHex.textContent = hex;
    txtRgb.textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    txtHsl.textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
    txtCmyk.textContent = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
    txtOklch.textContent = `${oklch.l}, ${oklch.c}, ${oklch.h}°`;
    txtMunsell.textContent = munsell;

    // Temperature Badge
    const isWarm = (currentHsv.h >= 0 && currentHsv.h <= 75) || currentHsv.h >= 320;
    txtColorTemp.textContent = isWarm ? '☀️ Cálido' : '🌙 Frío';
    txtColorTemp.style.color = isWarm ? '#F59E0B' : '#38BDF8';
    txtColorTemp.style.background = isWarm ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)';

    // Pigment Formula
    const recipe = getPigmentRecipe(rgb);
    txtInherentValue.textContent = `Valor ${recipe.inherentStep}/9`;
    txtPigmentFormula.textContent = recipe.formula;
    txtPigmentNotes.textContent = recipe.notes;

    // Harmonies
    const harmonies = getHarmonies(currentHsv, selHarmonyRule.value);
    harmoniesRow.innerHTML = harmonies.map(item => {
      const itemRgb = hsvToRgb(item.hsv.h, item.hsv.s, item.hsv.v);
      const itemHex = rgbToHex(itemRgb.r, itemRgb.g, itemRgb.b);
      return `<div class="swatch-item" style="background-color: ${itemHex};" title="${item.name}: ${itemHex}" data-hex="${itemHex}"></div>`;
    }).join('');

    harmoniesRow.querySelectorAll('.swatch-item').forEach(el => {
      el.addEventListener('click', () => setColorFromHex(el.dataset.hex, true));
    });

    // Light and Shadow Ramp
    const sorollaSteps = getSorollaRamp(currentHsv);
    lightShadowRow.innerHTML = sorollaSteps.map(step => {
      const stepRgb = hsvToRgb(step.hsv.h, step.hsv.s, step.hsv.v);
      const stepHex = rgbToHex(stepRgb.r, stepRgb.g, stepRgb.b);
      return `<div class="swatch-item" style="background-color: ${stepHex};" title="${step.name}: ${stepHex}" data-hex="${stepHex}"></div>`;
    }).join('');

    lightShadowRow.querySelectorAll('.swatch-item').forEach(el => {
      el.addEventListener('click', () => setColorFromHex(el.dataset.hex, true));
    });

    // Draw Wheel
    drawColorWheel();
  }

  // --- INTERACTIVE COLOR WHEEL CANVAS ---

  function drawColorWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 104;
    const ringWidth = 20;
    const innerRadius = outerRadius - ringWidth;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Hue Ring
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 90 - 1) * Math.PI / 180;
      const endAngle = (angle - 90 + 1) * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle);
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.lineWidth = ringWidth + 1;
      ctx.stroke();
    }

    // 2. Draw Hue Marker (Indicator on ring)
    const markerAngle = (currentHsv.h - 90) * Math.PI / 180;
    const markerR = (outerRadius + innerRadius) / 2;
    const mx = centerX + Math.cos(markerAngle) * markerR;
    const my = centerY + Math.sin(markerAngle) * markerR;

    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.restore();

    // 3. Draw Inner Saturation / Value Box
    const boxSize = 105;
    const bx = centerX - boxSize / 2;
    const by = centerY - boxSize / 2;

    // Base Hue background
    ctx.fillStyle = `hsl(${currentHsv.h}, 100%, 50%)`;
    ctx.fillRect(bx, by, boxSize, boxSize);

    // White to transparent gradient (Horizontal -> Saturation)
    const whiteGrad = ctx.createLinearGradient(bx, by, bx + boxSize, by);
    whiteGrad.addColorStop(0, '#FFFFFF');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(bx, by, boxSize, boxSize);

    // Transparent to black gradient (Vertical -> Value)
    const blackGrad = ctx.createLinearGradient(bx, by, bx, by + boxSize);
    blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    blackGrad.addColorStop(1, '#000000');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(bx, by, boxSize, boxSize);

    // Box Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxSize, boxSize);

    // SV Crosshair
    const crossX = bx + currentHsv.s * boxSize;
    const crossY = by + (1 - currentHsv.v) * boxSize;

    ctx.save();
    ctx.beginPath();
    ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = currentHsv.v > 0.5 ? '#000000' : '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Handle Wheel Mouse & Drag
  function handleWheelInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const outerRadius = 104;
    const ringWidth = 20;
    const innerRadius = outerRadius - ringWidth;
    const boxSize = 105;
    const bx = centerX - boxSize / 2;
    const by = centerY - boxSize / 2;

    if (isDraggingWheel || (dist >= innerRadius - 4 && dist <= outerRadius + 8 && !isDraggingInner)) {
      isDraggingWheel = true;
      let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (angle < 0) angle += 360;
      currentHsv.h = angle;
      applyHsvChange(false);
    } else if (isDraggingInner || (x >= bx - 5 && x <= bx + boxSize + 5 && y >= by - 5 && y <= by + boxSize + 5)) {
      isDraggingInner = true;
      const s = Math.max(0, Math.min(1, (x - bx) / boxSize));
      const v = Math.max(0, Math.min(1, 1 - (y - by) / boxSize));
      currentHsv.s = s;
      currentHsv.v = v;
      applyHsvChange(false);
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    handleWheelInteraction(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingWheel || isDraggingInner) {
      handleWheelInteraction(e);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingWheel || isDraggingInner) {
      isDraggingWheel = false;
      isDraggingInner = false;
      commitColorToHistory(currentColor.hex);
    }
  });

  function applyHsvChange(saveToHistory = false) {
    const rgb = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    currentColor = { r: rgb.r, g: rgb.g, b: rgb.b, hex };
    updateAllUI();
    if (saveToHistory) commitColorToHistory(hex);
  }

  function setColorFromHex(hex, saveHistory = true) {
    if (!hex) return;
    const rgb = hexToRgb(hex);
    previousColor = { ...currentColor };
    currentColor = { ...rgb, hex: hex.toUpperCase() };
    currentHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    updateAllUI();
    if (saveHistory) commitColorToHistory(currentColor.hex);
  }

  function commitColorToHistory(hex) {
    hex = hex.toUpperCase();
    if (!historyColors.includes(hex)) {
      historyColors = [hex, ...historyColors].slice(0, 32);
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ gom_history: historyColors, gom_last_color: hex });
      }
      renderCollection();
    }
  }

  // --- EYEDROPPER WEB PIPETTE ---

  btnPickColor.addEventListener('click', async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const pickedHex = result.sRGBHex.toUpperCase();
          setColorFromHex(pickedHex, true);
          copyToClipboard(pickedHex, `🎯 Pipeta: ${pickedHex} copiado al portapapeles`);
        }
      } catch (e) {
        console.log('[GOM Picker] Pipeta cerrada o cancelada');
      }
    } else {
      // Message active tab to use content script
      if (chrome?.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'trigger_eyedropper' });
          window.close(); // Close popup so user can sample page
        }
      } else {
        showToast('⚠️ EyeDropper no soportado en esta ventana');
      }
    }
  });

  // --- CLIPBOARD COPIES & TOAST ---

  function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(message || `Copiado: ${text}`);
    }).catch(() => {
      showToast(`Copiado: ${text}`);
    });
  }

  function showToast(msg) {
    toastNotification.textContent = msg;
    toastNotification.classList.add('visible');
    setTimeout(() => {
      toastNotification.classList.remove('visible');
    }, 2200);
  }

  // Bind format cards clicks
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', () => {
      const valEl = card.querySelector('.format-val');
      const lblEl = card.querySelector('.format-lbl');
      if (valEl) {
        copyToClipboard(valEl.textContent, `${lblEl.textContent} ${valEl.textContent} copiado`);
      }
    });
  });

  // Swap current with previous
  swatchPrevious.addEventListener('click', () => {
    const temp = { ...currentColor };
    currentColor = { ...previousColor };
    previousColor = temp;
    currentHsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
    updateAllUI();
    showToast(`Color restaurado: ${currentColor.hex}`);
  });

  // Harmony Rule Change
  selHarmonyRule.addEventListener('change', () => {
    updateAllUI();
  });

  // Tab Switching (History vs Palette)
  tabHistory.addEventListener('click', () => {
    activeTab = 'history';
    tabHistory.classList.add('active');
    tabPalette.classList.remove('active');
    renderCollection();
  });

  tabPalette.addEventListener('click', () => {
    activeTab = 'palette';
    tabPalette.classList.add('active');
    tabHistory.classList.remove('active');
    renderCollection();
  });

  // Pin Color to Palette
  btnPinColor.addEventListener('click', () => {
    const hex = currentColor.hex;
    if (!paletteColors.includes(hex)) {
      paletteColors.push(hex);
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ gom_palette: paletteColors });
      }
      activeTab = 'palette';
      tabPalette.classList.add('active');
      tabHistory.classList.remove('active');
      renderCollection();
      showToast(`🎨 Guardado en Mi Paleta: ${hex}`);
    } else {
      showToast(`El color ${hex} ya está en Mi Paleta`);
    }
  });

  // Clear Tab
  btnClearCurrentTab.addEventListener('click', () => {
    if (activeTab === 'history') {
      historyColors = [];
      if (chrome?.storage?.local) chrome.storage.local.set({ gom_history: [] });
      showToast('Historial vaciado');
    } else {
      paletteColors = [];
      if (chrome?.storage?.local) chrome.storage.local.set({ gom_palette: [] });
      showToast('Mi Paleta vaciada');
    }
    renderCollection();
  });

  // Export Palette
  btnExportPalette.addEventListener('click', () => {
    const list = activeTab === 'palette' ? paletteColors : historyColors;
    if (list.length === 0) {
      showToast('No hay colores en la lista para exportar');
      return;
    }

    const cssContent = `:root {\n` + list.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n') + `\n}`;
    const blob = new Blob([cssContent], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GOM_Palette_${Date.now()}.css`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Paleta exportada como CSS (${list.length} colores)`);
  });

  // Open Full Suite in Web/Desktop
  btnOpenFullSuite.addEventListener('click', () => {
    const suiteUrl = 'http://localhost:5050/';
    if (chrome?.tabs) {
      chrome.tabs.create({ url: suiteUrl });
    } else {
      window.open(suiteUrl, '_blank');
    }
  });

  // Render Collection Grid
  function renderCollection() {
    countHistory.textContent = historyColors.length;
    countPalette.textContent = paletteColors.length;

    const list = activeTab === 'history' ? historyColors : paletteColors;
    if (list.length === 0) {
      swatchCollectionRow.innerHTML = `<div style="grid-column: span 8; font-size: 0.65rem; color: #64748B; text-align: center; padding: 12px 0;">(Lista vacía)</div>`;
      return;
    }

    swatchCollectionRow.innerHTML = list.map(hex => {
      return `<div class="collection-swatch" style="background-color: ${hex};" title="${hex} (clic para cargar)" data-hex="${hex}"></div>`;
    }).join('');

    swatchCollectionRow.querySelectorAll('.collection-swatch').forEach(el => {
      el.addEventListener('click', () => {
        setColorFromHex(el.dataset.hex, false);
      });
    });
  }

  // Keyboard Shortcuts (I for pipette, C for copy hex, X for swap)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'i' || e.key === 'I') {
      btnPickColor.click();
    } else if (e.key === 'c' || e.key === 'C') {
      copyToClipboard(currentColor.hex, `HEX ${currentColor.hex} copiado`);
    } else if (e.key === 'x' || e.key === 'X') {
      swatchPrevious.click();
    }
  });
});
