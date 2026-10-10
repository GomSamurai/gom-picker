/**
 * GOM Picker - High-Resolution Swatch Sheet PNG Generator
 * Renders an elegant, publication-grade digital palette sheet (1200x630px PNG)
 * with proportional 60-30-10 swatches, HEX codes, Munsell notations,
 * and pigment labels ready to drag directly into Photoshop, Procreate, or Clip Studio.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';

export const SwatchSheetExporter = {
  exportPaletteToPng(paletteName, colors, options = {}) {
    if (!colors || colors.length === 0) return;

    const width = 1200;
    const height = 630;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Sleek Dark Studio Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0E0F17');
    bgGrad.addColorStop(1, '#161824');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient accent glow behind header
    const glowGrad = ctx.createRadialGradient(240, 80, 20, 240, 80, 280);
    glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
    glowGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, 300);

    // Outer subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 2. Header: Title, Logo & Subtitle
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Inter", "Outfit", -apple-system, sans-serif';
    ctx.fillText(paletteName || 'Paleta de Arte GOM Picker Pro', 48, 68);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 15px -apple-system, sans-serif';
    ctx.fillText('FICHA CROMÁTICA DE ESTUDIO • PROPORCIONES 60 • 30 • 10 • NOTACIÓN MUNSELL', 48, 96);

    // Header Right Badge
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, width - 260, 42, 210, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#C7D2FE';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 GOM COLOR PICKER', width - 155, 65);
    ctx.textAlign = 'left';

    // 3. Render Large Swatch Bands
    const startY = 130;
    const bandHeight = 360;
    const marginX = 48;
    const availWidth = width - marginX * 2;
    
    // Proportional widths for 5 colors (60%, 25%, 15%) or even distribution
    let widths = [];
    const n = colors.length;
    if (n === 5) {
      // 60-30-10 distribution
      widths = [availWidth * 0.40, availWidth * 0.25, availWidth * 0.15, availWidth * 0.10, availWidth * 0.10];
    } else {
      const step = availWidth / n;
      widths = colors.map(() => step);
    }

    let curX = marginX;
    colors.forEach((col, idx) => {
      const hex = typeof col === 'string' ? col : col.hex;
      const rgb = typeof col === 'string' ? ColorMath.hexToRgb(col) : (col.rgb || ColorMath.hexToRgb(hex));
      const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
      const w = widths[idx];

      // Draw Swatch Block
      ctx.fillStyle = hex;
      this._roundRect(ctx, curX, startY, w - 8, bandHeight, 10);
      ctx.fill();

      // Inner shadow / border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Swatch Bottom Info Card
      const cardY = startY + bandHeight - 110;
      ctx.fillStyle = 'rgba(11, 12, 18, 0.85)';
      this._roundRect(ctx, curX + 6, cardY, w - 20, 100, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      // Color HEX Code
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "SF Mono", monospace';
      ctx.fillText(hex.toUpperCase(), curX + 16, cardY + 28);

      // RGB
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px "SF Mono", monospace';
      ctx.fillText(`RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`, curX + 16, cardY + 52);

      // Munsell
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 12px "SF Mono", monospace';
      ctx.fillText(`Munsell: ${munsell.notation}`, curX + 16, cardY + 76);

      // Role tag at top of swatch
      const roleText = idx === 0 ? '60% Base' : (idx === 1 ? '30% Forma' : (idx === 2 ? '10% Foco' : 'Acento'));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this._roundRect(ctx, curX + 10, startY + 12, 85, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText(roleText, curX + 20, startY + 28);

      curX += w;
    });

    // 4. Footer: Author Credit & Copyright
    ctx.fillStyle = '#64748B';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillText('Creado con GOM Color Picker Pro — Suite de Teoría y Mezcla Cromática para Artistas', 48, height - 32);

    ctx.textAlign = 'right';
    ctx.fillText('Fran Gómez • GOM Samurai', width - 48, height - 32);
    ctx.textAlign = 'left';

    // 5. Trigger download
    const cleanFileName = (paletteName || 'gom_palette')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_') + '.png';

    const a = document.createElement('a');
    a.download = cleanFileName;
    a.href = canvas.toDataURL('image/png');
    a.click();
  },

  _roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
};
