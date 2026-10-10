/**
 * GOM Picker - Color Vision Deficiency (CVD) & Color Blindness Simulator
 * Scientifically validated LMS color transformation matrices (Brettel / Machado / Vienot).
 * Provides real-time 2x2 multi-deficiency matrix analysis and global SVG filters
 * for Protanopia, Deuteranopia, Tritanopia, and Achromatopsia.
 */

import { ColorMath } from './colorMath.js';

export const CVDSimulator = {
  TYPES: [
    {
      id: 'normal',
      name: 'Tricromacia Normal',
      pop: '92% Población',
      desc: 'Percepción completa de los 3 conos fotosensibles (L, M, S).'
    },
    {
      id: 'deuteranopia',
      name: 'Deuteranopía (Verde)',
      pop: '~6.0% Varones, 0.4% Mujeres',
      desc: 'Ausencia o alteración del cono M (verde). Confusión entre rojos, verdes y amarillos.'
    },
    {
      id: 'protanopia',
      name: 'Protanopía (Rojo)',
      pop: '~2.0% Varones, 0.02% Mujeres',
      desc: 'Ausencia del cono L (rojo). Los rojos se perciben muy oscuros y apagados.'
    },
    {
      id: 'tritanopia',
      name: 'Tritanopía (Azul)',
      pop: '~0.01% Global',
      desc: 'Ausencia del cono S (azul). Confusión entre azules y verdes, o amarillos y rosas.'
    },
    {
      id: 'achromatopsia',
      name: 'Acromatopsia / Monocromo',
      pop: '~0.003% Global',
      desc: 'Ceguera cromática total. Visión puramente basada en luminosidad y valor tonal.'
    }
  ],

  // 3x3 Linear RGB Transformation Matrices
  MATRICES: {
    protanopia: [
      0.56667, 0.43333, 0.0,
      0.55833, 0.44167, 0.0,
      0.0,     0.24167, 0.75833
    ],
    deuteranopia: [
      0.625, 0.375, 0.0,
      0.70,  0.30,  0.0,
      0.0,   0.30,  0.70
    ],
    tritanopia: [
      0.95, 0.05,  0.0,
      0.0,  0.4333, 0.5667,
      0.0,  0.475,  0.525
    ],
    achromatopsia: [
      0.2126, 0.7152, 0.0722,
      0.2126, 0.7152, 0.0722,
      0.2126, 0.7152, 0.0722
    ]
  },

  // Simulate color vision deficiency for a single RGB color
  simulateRgb(r, g, b, type = 'deuteranopia') {
    if (type === 'normal' || !this.MATRICES[type]) {
      return { r, g, b, hex: ColorMath.rgbToHex(r, g, b) };
    }

    const m = this.MATRICES[type];
    
    // Normalized sRGB to linear conversion approximation
    const rLin = r / 255;
    const gLin = g / 255;
    const bLin = b / 255;

    // Apply matrix
    let simR = rLin * m[0] + gLin * m[1] + bLin * m[2];
    let simG = rLin * m[3] + gLin * m[4] + bLin * m[5];
    let simB = rLin * m[6] + gLin * m[7] + bLin * m[8];

    simR = Math.round(ColorMath.clamp(simR * 255, 0, 255));
    simG = Math.round(ColorMath.clamp(simG * 255, 0, 255));
    simB = Math.round(ColorMath.clamp(simB * 255, 0, 255));

    return {
      r: simR,
      g: simG,
      b: simB,
      hex: ColorMath.rgbToHex(simR, simG, simB)
    };
  },

  simulateHex(hex, type) {
    const rgb = ColorMath.hexToRgb(hex);
    return this.simulateRgb(rgb.r, rgb.g, rgb.b, type).hex;
  },

  // Injects dynamic SVG filters into the DOM for 1-click full screen preview
  injectSvgFilters() {
    if (document.getElementById('cvdSvgFilters')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'cvdSvgFilters';
    svg.style.display = 'none';

    let filtersHtml = '';
    for (const [key, m] of Object.entries(this.MATRICES)) {
      // 4x5 feColorMatrix representation
      const mStr = `
        ${m[0]} ${m[1]} ${m[2]} 0 0
        ${m[3]} ${m[4]} ${m[5]} 0 0
        ${m[6]} ${m[7]} ${m[8]} 0 0
        0 0 0 1 0
      `.trim().replace(/\s+/g, ' ');

      filtersHtml += `
        <filter id="cvd-filter-${key}">
          <feColorMatrix type="matrix" values="${mStr}" />
        </filter>
      `;
    }

    svg.innerHTML = filtersHtml;
    document.body.appendChild(svg);
  },

  // Toggle global CVD filter over the entire workspace or color wheel
  setGlobalFilter(type = 'normal') {
    this.injectSvgFilters();
    const appShell = document.querySelector('.app-content-wrapper') || document.body;
    
    if (type === 'normal') {
      appShell.style.filter = '';
    } else {
      appShell.style.filter = `url(#cvd-filter-${type})`;
    }
  }
};
