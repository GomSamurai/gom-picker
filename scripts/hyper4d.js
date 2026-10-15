/**
 * GOM Picker - Hiperespacio 4D del Color (4D Chromatic Hyper-Studio)
 * Revolucionario motor de visualización, comparación e inspiración cuadridimensional.
 * Proyecta el color en el espacio cuadridimensional SO(4) a través de rotaciones hiperdimensionales
 * en 6 planos (XY, XZ, YZ, XW, YW, ZW), combinando el Sólido Munsell real asimétrico,
 * el Hipercubo Tesseract, el espacio perceptivo CIELAB y la teoría física de Florent Farges y James Gurney.
 * 
 * Incluye 7 Modos de Despliegue Espacial (Armonías, Paletas, Rampas Tonales, Luz/Sombra Gurney,
 * Curva Bow Farges, Multicomparador y Tesseract SO(4)), sombreado volumétrico 3D Phong con niebla
 * de profundidad cósmica y motor anti-colisión de rótulos con cápsulas de cristal y líneas guía.
 * 
 * 100% Offline, sin dependencias externas, con aceleración Canvas interactiva a 60fps.
 */

import { ColorMath } from './colorMath.js?v=3.1';
import { MunsellSystem } from './munsellSystem.js?v=3.1';
import { FlorentFargesEngine } from './florentFarges.js?v=3.2';
import { HarmonyEngine } from './harmonies.js?v=3.1';
import { RampStudio } from './rampStudio.js?v=3.1';

export class Hyper4DStudio {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Estado de la Cámara 3D y Navegación Suave (Lerp)
    this.camera = {
      rotX: 0.35,          // Pitch actual (elevación)
      rotY: -0.65,         // Yaw actual (azimut)
      zoom: 1.05,
      panX: 0,
      panY: 0,
      targetRotX: 0.35,    // Destino para interpolación suave
      targetRotY: -0.65,
      targetZoom: 1.05,
      targetPanX: 0,
      targetPanY: 0,
      isDragging: false,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      autoRotate: true,
      autoRotateSpeed: 0.003,
      cinematicFly: false, // Modo Vuelo Cinemático
      flyTime: 0,
      invertX: localStorage.getItem('gom_hyper4d_invert_x') === 'true',
      invertY: localStorage.getItem('gom_hyper4d_invert_y') === 'true'
    };

    // Estado Hiperdimensional 4D (SO(4))
    this.dimension4D = {
      wValue: 0,            // -100 a +100
      wMode: 'thermal',     // 'thermal' (Kelvin) | 'subtractive' (Glaze/Tint) | 'tesseract' (Hiper-rotación) | 'diurnal' (Ciclo solar)
      angleXW: 0,           // Ángulo de rotación hiperdimensional en plano XW
      angleYW: 0,           // Ángulo de rotación en plano YW
      angleZW: 0,           // Ángulo de rotación en plano ZW
      isAnimatingW: false,
      animSpeed: 0.015,
      animDirection: 1,
      camDist4D: 360        // Distancia focal hiperdimensional para proyección estereográfica
    };

    // Modelo de Geometría Base de Fondo
    this.activeModel = 'munsell'; // 'munsell' | 'tesseract' | 'cielab' | 'hsl_cone'

    // NUEVO SISTEMA REVOLUCIONARIO: Modo de Despliegue Espacial Activo
    // 'all' | 'harmonies' | 'palette' | 'ramp' | 'gurney' | 'farges' | 'compare' | 'tesseract'
    this.activeDeployment = 'all';

    // Sub-opciones de Despliegue
    this.activeHarmonyRule = 'triadic'; // 'triadic' | 'complementary' | 'split-complementary' | 'tetradic' | 'square' | 'analogous' | 'monochromatic'
    this.activeRampType = 'active_studio'; // 'active_studio' | 'light_shadow' | 'thermal' | 'saturation'
    this.activeFargesPair = 'cad_yellow_ivory_black'; // 'cad_yellow_ivory_black' | 'cad_red_viridian' | 'lemon_ultramarine' | 'burnt_umber_ultramarine'
    this.showGamutHull = true;
    this.showRgbVsOklchComparison = true;

    // Opciones de Visualización de Nodos y Capas
    this.options = {
      showSolidCloud: true,
      showGridAxes: true,
      showHarmonyPolyhedron: true,
      showLightShadowVector: true,
      showMixingBowCurve: true,
      showSSSVector: true,
      showGoetheExtension: true,
      showPaletteConstellation: true,
      showLabels: true,
      antiCollisionLabels: true,
      particleStars: true,
      isFullscreen: false,
      isSidebarHidden: false
    };

    // Muestras en el Comparador Dinámico (Multimuestras A, B, C, D...)
    this.autoSyncSlotA = true;
    this.autoSyncWheel = true;
    this.activeTargetSlotId = 'A'; // Muestra que se ajusta en vivo al interactuar con la Rueda Cromática
    this.activeCompareSubView = 'metrics'; // 'metrics' | 'composition' | 'mix'
    this.compareSlots = [
      { id: 'A', name: 'Muestra A (Principal)', hex: '#6366F1', rgb: { r: 99, g: 102, b: 241 }, active: true },
      { id: 'B', name: 'Muestra B (Comparada)', hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, active: true }
    ];

    // Presets Didácticos de Grandes Maestros
    this.masterPresets = {
      sorolla: {
        title: 'Joaquín Sorolla — Luminismo Mediterráneo',
        author: 'Joaquín Sorolla (1863-1923)',
        desc: 'Distribución hiperdimensional de luz solar ardiente (#FFF2A3) y sombras violetas frías (#856B96). Sorolla evitaba el negro; su vector de sombra viaja directamente a violetas de cobalto de alto croma.',
        colors: ['#FFF8D6', '#F5D77F', '#E89758', '#C95A40', '#856B96', '#4D6B9C', '#284E7A']
      },
      rembrandt: {
        title: 'Rembrandt — Claroscuro & Tenebrismo Tonal',
        author: 'Rembrandt van Rijn (1606-1669)',
        desc: 'Estructura piramidal en 4D: densa concentración en valores bajos (Tierras PBr7, Betún) con una cúspide focal de luz empastada (#FCE5B8) y transición halftone en siena natural.',
        colors: ['#1C1613', '#2D2018', '#523725', '#8C5A2B', '#C98A3C', '#E8B869', '#FCE5B8']
      },
      monet: {
        title: 'Claude Monet — Impresionismo y Nebulosa Atmosférica',
        author: 'Claude Monet (1840-1926)',
        desc: 'Gamut suspendido en valores altos y medios. Los colores vibran por contraste simultáneo sin depender de contrastes de valor extremos. Constelación abierta y difusa.',
        colors: ['#F7EBE8', '#E6C2D6', '#A3B8E0', '#74A7C9', '#82C4A2', '#CDE59C', '#F3D97C']
      },
      zorn: {
        title: 'Anders Zorn — La Tetra-Paleta de Atelier',
        author: 'Anders Zorn (1860-1920)',
        desc: 'Tetraedro puro de 4 pigmentos físicos: Blanco de Titanio (PW6), Negro Marfil (PBk9 actuando como azul), Ocre Amarillo (PY43) y Rojo Cadmio (PR108). Demuestra que con 4 vértices se modela todo el cuerpo humano.',
        colors: ['#F8F9FA', '#CFA356', '#BD3A29', '#21201F']
      },
      farges: {
        title: 'Florent Farges — La Curva Convexa y Fenómeno Oliva',
        author: 'Florent Farges (Pedagogía Clásica)',
        desc: 'Muestra la curvatura física no lineal al mezclar pigmentos. Resalta el fenómeno del Amarillo + Negro que vira a verde oliva orgánico sin pasar por pigmentos verdes.',
        colors: ['#FFF200', '#CC9933', '#8D361F', '#D91424', '#1B2682', '#126848', '#1E1D1B']
      },
      vermeer: {
        title: 'Johannes Vermeer — Luz de Ventana Norte & Azul Ultramar',
        author: 'Johannes Vermeer (1632-1675)',
        desc: 'Luz ambiental fría difusa de cielo nórdico equilibrada con la transparencia dorada de ocres y el lujo óptico del lapislázuli genuino (PB29). Máxima pureza de valor en luces altas.',
        colors: ['#FAF6EE', '#DFBA53', '#1E3F78', '#4A3528', '#E0A370']
      },
      velazquez: {
        title: 'Diego Velázquez — La Armonía de Plata y Tierras Nobles',
        author: 'Diego Velázquez (1599-1660)',
        desc: 'Maestría compositiva de grises nacarados y sombras de tierra neutra, con acentos vibrantes de bermellón aplicados en puntos estratégicos para focalizar la mirada.',
        colors: ['#D9D7CE', '#8C867D', '#3D352E', '#A83B38', '#1C1A18']
      }
    };

    // Nodos en el espacio proyectado para hit-testing
    this.renderedNodes = [];
    this.hoveredNode = null;
    this.selectedNode = null;

    // Cache de Geometría Base
    this._geometryCache = {};
    this.particles = [];
    this._initParticles();

    // Dimensiones de pantalla seguras por defecto (evita divisiones por 0 o NaN antes del primer resize)
    this.displayWidth = 800;
    this.displayHeight = 560;
    this.animId = null;
  }

  init() {
    this.canvas = document.getElementById('hyper4dCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this._bindEvents();
    this._bindUI();
    this._bindCompareControls();
    this._bindResizeControls();
    this.renderCompareSlots();
    this._resizeCanvas();
    this.syncWithActiveColor();

    // Iniciar loop de animación a 60fps
    this._startRenderLoop();
  }

  _initParticles() {
    this.particles = [];
    const colors = ['#818CF8', '#38BDF8', '#F472B6', '#34D399', '#FBBF24', '#A78BFA'];
    for (let i = 0; i < 110; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 750,
        y: (Math.random() - 0.5) * 750,
        z: (Math.random() - 0.5) * 750,
        w: (Math.random() - 0.5) * 120,
        size: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.45 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement || document.getElementById('hyper4dCanvasContainer');
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = Math.floor(rect.width);
    let h = Math.floor(rect.height || parent.clientHeight);

    // Si el contenedor está temporalmente oculto (display: none al cargar la suite)
    if (w <= 0 || h <= 0) {
      const stage = document.getElementById('hyper4dStageLayout');
      const stageRect = stage ? stage.getBoundingClientRect() : null;
      if (stageRect && stageRect.width > 0) {
        w = Math.max(280, Math.floor(stageRect.width - (this.options.isSidebarHidden ? 0 : 380)));
      } else {
        w = this.displayWidth || 800;
      }
      h = this.displayHeight || 560;
    }

    w = Math.max(280, w);
    h = Math.max(320, h);

    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    // Asegurar que la transformación siempre esté correctamente escalada con el DPR
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.displayWidth = w;
    this.displayHeight = h;
  }

  // --- MATEMÁTICAS HIPERDIMENSIONALES 4D (SO(4)) ---

  /**
   * Aplica rotación ortogonal en 4 dimensiones en los planos XW, YW y ZW.
   * En 4D, un punto (x, y, z, w) puede rotar simultáneamente alrededor de hiper-planos.
   */
  rotatePoint4D(pt, axw, ayw, azw) {
    let { x, y, z, w } = pt;

    // Rotación en plano XW
    if (axw !== 0) {
      const cos = Math.cos(axw);
      const sin = Math.sin(axw);
      const nx = x * cos - w * sin;
      const nw = x * sin + w * cos;
      x = nx;
      w = nw;
    }

    // Rotación en plano YW
    if (ayw !== 0) {
      const cos = Math.cos(ayw);
      const sin = Math.sin(ayw);
      const ny = y * cos - w * sin;
      const nw = y * sin + w * cos;
      y = ny;
      w = nw;
    }

    // Rotación en plano ZW
    if (azw !== 0) {
      const cos = Math.cos(azw);
      const sin = Math.sin(azw);
      const nz = z * cos - w * sin;
      const nw = z * sin + w * cos;
      z = nz;
      w = nw;
    }

    return { x, y, z, w };
  }

  /**
   * Proyección estereográfica / perspectiva desde 4D hacia 3D.
   * Utiliza la 4ª coordenada W como factor de escala y profundidad hiperdimensional.
   */
  project4DTo3D(pt4D) {
    const d4 = this.dimension4D.camDist4D;
    const denom = Math.max(40, d4 - (pt4D.w || 0));
    const scale = d4 / denom;

    return {
      x: pt4D.x * scale,
      y: pt4D.y * scale,
      z: pt4D.z * scale,
      origW: pt4D.w || 0,
      hyperScale: scale
    };
  }

  /**
   * Proyección de cámara 3D orbital hacia pantalla 2D con matriz de rotación y zoom.
   */
  project3DTo2D(pt3D) {
    const cx = this.displayWidth / 2 + this.camera.panX;
    const cy = this.displayHeight / 2 + this.camera.panY;

    // 1. Rotación Yaw (alrededor del eje Y vertical)
    const cosY = Math.cos(this.camera.rotY);
    const sinY = Math.sin(this.camera.rotY);
    let x1 = pt3D.x * cosY + pt3D.z * sinY;
    let z1 = -pt3D.x * sinY + pt3D.z * cosY;
    let y1 = pt3D.y;

    // 2. Rotación Pitch (alrededor del eje X horizontal)
    const cosX = Math.cos(this.camera.rotX);
    const sinX = Math.sin(this.camera.rotX);
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    let x2 = x1;

    // 3. Proyección en perspectiva 3D
    const fov = 500 * this.camera.zoom;
    const dist = 540 + z2;
    const factor = dist > 20 ? fov / dist : 0;

    const screenX = cx + x2 * factor;
    const screenY = cy - y2 * factor; // Invertir Y para pantalla estándar

    return {
      screenX,
      screenY,
      depth: z2,
      scale: factor,
      visible: dist > 30
    };
  }

  // --- COORDENADAS 4D NORMALIZADAS Y ANTI-COLAPSO ---

  /**
   * Genera coordenadas espaciales equilibradas para cualquier color RGB.
   * Evita que las muestras oscuras o de bajo croma queden aplastadas en una aglomeración microscópica.
   */
  _getColor4DCoords(rgb, { minVisualChroma = 0 } = {}) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;
    const rad = (hsv.h * Math.PI) / 180;

    // Escala de Croma con mínimo visual para garantizar despliegue amplio y legible
    const effectiveChroma = Math.max(minVisualChroma, munsell.chroma || (hsv.s * 14));
    const chromaRadius = effectiveChroma * 15;
    const x = chromaRadius * Math.cos(rad);
    const z = chromaRadius * Math.sin(rad);

    // Escala de Valor Y: de -160 (negro N0/) a +160 (blanco N10/)
    const munsellVal = typeof munsell.value === 'number' ? munsell.value : (hsv.v * 9);
    const y = (munsellVal - 5) * 34;

    // 4ª Dimensión W
    let w = 0;
    if (this.dimension4D.wMode === 'thermal') {
      w = (isWarm ? 32 : -32) * (hsv.s * 0.7 + 0.3) + (this.dimension4D.wValue * 0.65);
    } else if (this.dimension4D.wMode === 'subtractive') {
      w = this.dimension4D.wValue * 0.85;
    } else if (this.dimension4D.wMode === 'diurnal') {
      w = Math.sin(this.dimension4D.wValue * 0.05) * 55;
    } else {
      w = this.dimension4D.wValue * 0.8;
    }

    return { x, y, z, w, hsv, munsell, isWarm, chromaRadius };
  }

  // --- GENERACIÓN DE GEOMETRÍAS Y NUBES DE COLOR EN 4D ---

  /**
   * Genera el sólido asimétrico real del Sistema Munsell en 4D.
   * Reproduce la asimetría física (los amarillos suben a alto valor y croma; los azules a valor bajo).
   */
  getMunsellGeometry() {
    if (this._geometryCache['munsell']) return this._geometryCache['munsell'];

    const nodes = [];
    const hues = MunsellSystem.HUES;

    // Eje Central Acromático (Columna de Grises Neutrales N 1/ a N 9/)
    for (let val = 1; val <= 9; val++) {
      const lum = Math.pow(val / 10, 2);
      const grayVal = ColorMath.clamp255(lum * 255);
      const hex = ColorMath.rgbToHex(grayVal, grayVal, grayVal);
      nodes.push({
        id: `munsell_neutral_${val}`,
        type: 'axis_neutral',
        x: 0,
        y: (val - 5) * 34,
        z: 0,
        w: 0,
        hex,
        rgb: { r: grayVal, g: grayVal, b: grayVal },
        name: `N ${val}/ (Gris)`,
        munsell: `N ${val}/`,
        value: val,
        chroma: 0,
        size: 5
      });
    }

    // Gajos de color del Sólido Munsell
    hues.forEach(hue => {
      const rad = (hue.angle * Math.PI) / 180;
      const isWarm = (hue.angle >= 10 && hue.angle <= 90) || hue.angle >= 330;

      for (let val = 2; val <= 9; val++) {
        let maxChromaForHue = 10;
        if (hue.name.includes('Y')) {
          maxChromaForHue = val >= 7 ? 14 : 6;
        } else if (hue.name.includes('R') || hue.name.includes('YR')) {
          maxChromaForHue = val >= 4 && val <= 6 ? 14 : 8;
        } else if (hue.name.includes('B') || hue.name.includes('PB')) {
          maxChromaForHue = val <= 4 ? 12 : 8;
        }

        for (let chr = 2; chr <= maxChromaForHue; chr += 3) {
          const radius = chr * 15;
          const x = radius * Math.cos(rad);
          const z = radius * Math.sin(rad);
          const y = (val - 5) * 34;
          const w = (isWarm ? 28 : -28) * (chr / 14);

          const sat = ColorMath.clamp((chr / 14) * (5 / Math.max(1, val)), 0, 1);
          const v = ColorMath.clamp(val / 10 + (sat * 0.1), 0, 1);
          const rgb = ColorMath.hsvToRgb(hue.angle, sat, v);
          const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);

          nodes.push({
            id: `munsell_${hue.name}_${val}_${chr}`,
            type: 'munsell_chip',
            x, y, z, w,
            hex,
            rgb,
            name: `${hue.name} ${val}/${chr}`,
            munsell: `${hue.name} ${val}/${chr}`,
            family: hue.label,
            value: val,
            chroma: chr,
            size: 3.8
          });
        }
      }
    });

    this._geometryCache['munsell'] = nodes;
    return nodes;
  }

  /**
   * Genera los 16 vértices y las 32 aristas del Hipercubo Tesseract 4D en SO(4).
   */
  getTesseractGeometry() {
    const nodes = [];
    const edges = [];
    const size = 95;

    let idx = 0;
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          for (let w of [-1, 1]) {
            const r = Math.round((x + 1) * 127.5);
            const g = Math.round((y + 1) * 127.5);
            const b = Math.round((z + 1) * 127.5);
            const hex = ColorMath.rgbToHex(r, g, b);

            nodes.push({
              id: `tesseract_v_${idx}`,
              type: 'tesseract_node',
              x: x * size,
              y: y * size,
              z: z * size,
              w: w * size,
              hex,
              rgb: { r, g, b },
              coords4D: `[${x > 0 ? '+1' : '-1'}, ${y > 0 ? '+1' : '-1'}, ${z > 0 ? '+1' : '-1'}, ${w > 0 ? '+1' : '-1'}]`,
              name: `Vértice Tesseract #${idx + 1}`,
              size: 5.5
            });
            idx++;
          }
        }
      }
    }

    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        const p1 = nodes[i];
        const p2 = nodes[j];
        let diffs = 0;
        if (Math.abs(p1.x - p2.x) > 1) diffs++;
        if (Math.abs(p1.y - p2.y) > 1) diffs++;
        if (Math.abs(p1.z - p2.z) > 1) diffs++;
        if (Math.abs(p1.w - p2.w) > 1) diffs++;

        if (diffs === 1) {
          edges.push({ from: p1.id, to: p2.id });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Genera el sólido de percepción visual CIELAB / OKLab 4D.
   */
  getCieLabGeometry() {
    if (this._geometryCache['cielab']) return this._geometryCache['cielab'];

    const nodes = [];
    const stepL = 16;
    const stepA = 24;

    for (let L = 16; L <= 92; L += stepL) {
      for (let a = -70; a <= 70; a += stepA) {
        for (let b = -70; b <= 70; b += stepA) {
          const rgb = this._labToRgb(L, a, b);
          if (rgb.inside) {
            const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
            const w = (a * 0.45) - (b * 0.25);
            nodes.push({
              id: `lab_${L}_${a}_${b}`,
              type: 'cielab_node',
              x: a * 1.9,
              y: (L - 50) * 3.4,
              z: b * 1.9,
              w,
              hex,
              rgb,
              name: `L*${L} a*${a} b*${b}`,
              size: 3.5
            });
          }
        }
      }
    }

    this._geometryCache['cielab'] = nodes;
    return nodes;
  }

  /**
   * Genera el doble cono HSL en 4D.
   */
  getHslConeGeometry() {
    if (this._geometryCache['hsl_cone']) return this._geometryCache['hsl_cone'];

    const nodes = [];
    for (let lStep = 1; lStep <= 9; lStep++) {
      const l = lStep / 10;
      const radiusFactor = 1 - Math.abs(2 * l - 1);

      for (let h = 0; h < 360; h += 24) {
        for (let sStep = 2; sStep <= 4; sStep++) {
          const s = sStep / 4;
          const radius = radiusFactor * s * 145;
          const rad = (h * Math.PI) / 180;
          const x = radius * Math.cos(rad);
          const z = radius * Math.sin(rad);
          const y = (l - 0.5) * 270;
          const w = ((h >= 0 && h <= 90) || h >= 320 ? 30 : -30) * s;

          const rgb = ColorMath.hslToRgb(h, s, l);
          const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);

          nodes.push({
            id: `hsl_${h}_${sStep}_${lStep}`,
            type: 'hsl_node',
            x, y, z, w,
            hex,
            rgb,
            name: `H:${h}° S:${Math.round(s * 100)}% L:${Math.round(l * 100)}%`,
            size: 3.4
          });
        }
      }
    }

    this._geometryCache['hsl_cone'] = nodes;
    return nodes;
  }

  // =========================================================================
  // --- 7 MODOS DE DESPLIEGUE ESPACIAL 4D (REVOLUCIÓN VISUAL) ---
  // =========================================================================

  /**
   * MODO 1: Despliegue de Armonías y Poliedros Cuadridimensionales
   * Despliega Tríadas, Complementarios, Split-Complementarios, Tétradas o Análogos
   * con caras translúcidas de resonancia, ejes acromáticos y vértices volumétricos.
   */
  deployHarmonies(activeHsv, curRgb) {
    const nodes = [];
    const lines = [];
    const faces = [];

    const ruleId = this.activeHarmonyRule || 'triadic';
    const harmonyRes = HarmonyEngine.getHarmony(activeHsv, ruleId);
    const harmonyColors = harmonyRes?.colors || (Array.isArray(harmonyRes) ? harmonyRes : []);
    if (!harmonyColors || harmonyColors.length === 0) {
      return { nodes, lines, faces };
    }

    const baseCoords = this._getColor4DCoords(curRgb, { minVisualChroma: 6 });
    const centerNode = {
      id: 'active_sample_center',
      type: 'active_center',
      x: baseCoords.x,
      y: baseCoords.y,
      z: baseCoords.z,
      w: baseCoords.w,
      hex: ColorMath.rgbToHex(curRgb.r, curRgb.g, curRgb.b),
      rgb: curRgb,
      name: `MUESTRA ACTIVA (${ColorMath.rgbToHex(curRgb.r, curRgb.g, curRgb.b)})`,
      munsell: baseCoords.munsell.notation,
      role: 'Centro Armónico Base',
      isPrimary: true,
      size: 12
    };
    nodes.push(centerNode);

    // Eje hacia el gris neutral para evidenciar el contraste simultáneo
    const neutralNode = {
      id: 'harmony_neutral_axis',
      type: 'axis_neutral',
      x: 0,
      y: baseCoords.y,
      z: 0,
      w: 0,
      hex: '#888888',
      rgb: { r: 136, g: 136, b: 136 },
      name: 'Pivote Acromático Neutral',
      size: 5
    };
    nodes.push(neutralNode);
    lines.push({
      from: centerNode,
      to: neutralNode,
      color: 'rgba(255, 255, 255, 0.35)',
      width: 1.2,
      dash: [3, 3]
    });

    // Desplegar cada vértice armónico en el espacio 4D
    const polyNodes = [centerNode];
    harmonyColors.forEach((hItem, idx) => {
      if (idx === 0) return; // Omitir el primero si es el base ya creado

      const hCoords = this._getColor4DCoords(hItem.rgb, { minVisualChroma: 7 });
      const hNode = {
        id: `harmony_vert_${idx}`,
        type: 'harmony_node',
        x: hCoords.x,
        y: hCoords.y,
        z: hCoords.z,
        w: hCoords.w,
        hex: hItem.hex,
        rgb: hItem.rgb,
        name: `${hItem.role || ('Vértice ' + (idx + 1))} (${hItem.hex})`,
        munsell: hCoords.munsell.notation,
        role: hItem.role,
        isPrimary: true,
        size: 10
      };
      nodes.push(hNode);
      polyNodes.push(hNode);

      // Rayo conector desde el centro
      lines.push({
        from: centerNode,
        to: hNode,
        color: '#818CF8',
        width: 2.2,
        dash: [4, 2],
        label: hItem.role
      });
    });

    // Conectar el polígono/poliedro armónico perimetral y caras translúcidas
    if (polyNodes.length === 2) {
      lines.push({
        from: polyNodes[0],
        to: polyNodes[1],
        color: '#F43F5E',
        width: 2.5,
        label: 'Eje Complementario'
      });
    } else if (polyNodes.length >= 3) {
      for (let i = 0; i < polyNodes.length; i++) {
        const next = (i + 1) % polyNodes.length;
        lines.push({
          from: polyNodes[i],
          to: polyNodes[next],
          color: 'rgba(129, 140, 248, 0.85)',
          width: 2.0
        });
      }

      // Caras translúcidas de resonancia armónica
      if (polyNodes.length === 3) {
        faces.push({
          p1: polyNodes[0],
          p2: polyNodes[1],
          p3: polyNodes[2],
          fillColor: 'rgba(99, 102, 241, 0.22)'
        });
      } else if (polyNodes.length === 4) {
        faces.push({
          p1: polyNodes[0],
          p2: polyNodes[1],
          p3: polyNodes[2],
          fillColor: 'rgba(99, 102, 241, 0.18)'
        });
        faces.push({
          p1: polyNodes[0],
          p2: polyNodes[2],
          p3: polyNodes[3],
          fillColor: 'rgba(99, 102, 241, 0.18)'
        });
      } else {
        for (let i = 1; i < polyNodes.length - 1; i++) {
          faces.push({
            p1: polyNodes[0],
            p2: polyNodes[i],
            p3: polyNodes[i + 1],
            fillColor: 'rgba(99, 102, 241, 0.14)'
          });
        }
      }
    }

    return { nodes, lines, faces };
  }

  /**
   * MODO 2: Despliegue de Bibliotecas & Constelaciones de Paleta con Gamut Hull 4D
   * Unfolds all swatches of active or chosen palette in 4D space, calculates interconnecting
   * celestial edges, and generates the Gamut Hull wireframe and facets.
   */
  deployPaletteConstellation() {
    const nodes = [];
    const lines = [];
    const faces = [];

    let paletteColors = [];
    let paletteName = 'Paleta Activa';
    if (this.app?.swatchManager) {
      const activePal = this.app.swatchManager.getActivePalette();
      if (activePal && Array.isArray(activePal.colors) && activePal.colors.length > 0) {
        paletteColors = activePal.colors;
        paletteName = activePal.name || 'Paleta Activa';
      }
    }

    if (paletteColors.length === 0) {
      paletteColors = ['#FFF8D6', '#F5D77F', '#E89758', '#C95A40', '#856B96', '#4D6B9C'];
    }

    const swatchNodes = [];
    paletteColors.forEach((colorItem, idx) => {
      const hex = (typeof colorItem === 'string' ? colorItem : (colorItem?.hex || '#FFFFFF')).toUpperCase();
      const rgb = typeof colorItem === 'object' && colorItem?.rgb ? colorItem.rgb : ColorMath.hexToRgb(hex);
      const coords = this._getColor4DCoords(rgb, { minVisualChroma: 4 });
      const node = {
        id: `pal_swatch_${idx}`,
        type: 'palette_swatch',
        x: coords.x,
        y: coords.y,
        z: coords.z,
        w: coords.w,
        hex,
        rgb,
        name: `[${paletteName}] #${idx + 1} (${hex})`,
        munsell: coords.munsell.notation,
        role: `Muestra ${idx + 1} de la paleta`,
        size: 9
      };
      nodes.push(node);
      swatchNodes.push(node);
    });

    // Conectar nodos de la paleta en red estelar / Gamut Hull
    for (let i = 0; i < swatchNodes.length; i++) {
      for (let j = i + 1; j < swatchNodes.length; j++) {
        const dx = swatchNodes[i].x - swatchNodes[j].x;
        const dy = swatchNodes[i].y - swatchNodes[j].y;
        const dz = swatchNodes[i].z - swatchNodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 220) {
          lines.push({
            from: swatchNodes[i],
            to: swatchNodes[j],
            color: 'rgba(56, 189, 248, 0.4)',
            width: 1.4
          });
        }
      }
    }

    // Caras translúcidas de Gamut Hull para tríos cercanos
    if (this.showGamutHull && swatchNodes.length >= 3) {
      for (let i = 0; i < Math.min(6, swatchNodes.length - 2); i++) {
        faces.push({
          p1: swatchNodes[i],
          p2: swatchNodes[i + 1],
          p3: swatchNodes[(i + 2) % swatchNodes.length],
          fillColor: 'rgba(56, 189, 248, 0.08)'
        });
      }
    }

    return { nodes, lines, faces };
  }

  /**
   * MODO 3: Despliegue de Degradados y Rampas Tonales (Spline 4D Continua)
   * Genera una cinta o tubo 4D continuo que atraviesa el espacio hiperdimensional,
   * permitiendo comparar la trayectoria OKLCH vs RGB vs Sustractiva y sus pasos intermedios.
   */
  deployRampTrajectory(curRgb) {
    const nodes = [];
    const lines = [];
    const faces = [];

    // Colores extremos según el tipo de rampa activa
    let c1 = curRgb;
    let c2 = this.app?.bgColor || { r: 245, g: 158, b: 11 };

    if (this.activeRampType === 'light_shadow') {
      const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);
      c1 = ColorMath.hsvToRgb((hsv.h + 15) % 360, Math.max(0.12, hsv.s * 0.45), Math.min(1, hsv.v * 1.25 + 0.2));
      c2 = ColorMath.hsvToRgb((hsv.h + 200) % 360, 0.65, Math.max(0.1, hsv.v * 0.35));
    } else if (this.activeRampType === 'thermal') {
      c1 = { r: 165, g: 215, b: 255 }; // 9500K Azul Gélido
      c2 = { r: 255, g: 140, b: 40 };  // 2500K Naranja Cálido
    } else if (this.activeRampType === 'saturation') {
      const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);
      c1 = ColorMath.hsvToRgb(hsv.h, 1.0, hsv.v);
      const grayVal = Math.round(curRgb.r * 0.299 + curRgb.g * 0.587 + curRgb.b * 0.114);
      c2 = { r: grayVal, g: grayVal, b: grayVal };
    }

    const steps = 9;

    let oklchList = [];
    let rgbList = [];
    try {
      oklchList = RampStudio.generateRamp(c1, c2, steps, 'oklch', 's_curve');
      rgbList = RampStudio.generateRamp(c1, c2, steps, 'rgb', 'linear');
    } catch (e) {
      oklchList = [];
    }

    // Nodos de la rampa Perceptual OKLCH (Curva Luminous Spline)
    const oklchNodes = [];
    oklchList.forEach((item, idx) => {
      const coords = this._getColor4DCoords(item.rgb, { minVisualChroma: 4 });
      const node = {
        id: `ramp_oklch_${idx}`,
        type: 'ramp_node',
        x: coords.x,
        y: coords.y,
        z: coords.z,
        w: coords.w + 10,
        hex: item.hex,
        rgb: item.rgb,
        name: `Rampa OKLCH Paso ${item.step}/${steps} (${item.hex})`,
        munsell: coords.munsell.notation,
        role: `Interpolación Perceptual ${item.ratio}%`,
        isPrimary: idx === 0 || idx === steps - 1,
        size: idx === 0 || idx === steps - 1 ? 11 : 7
      };
      nodes.push(node);
      oklchNodes.push(node);
    });

    // Conectar spline continua OKLCH
    for (let i = 0; i < oklchNodes.length - 1; i++) {
      lines.push({
        from: oklchNodes[i],
        to: oklchNodes[i + 1],
        color: '#10B981',
        width: 3.2,
        label: i === Math.floor(steps / 2) ? 'Spline Perceptual OKLCH' : ''
      });
    }

    // Opcional: Proyectar la rampa RGB lineal para evidenciar la "zona muerta de gris sucio"
    if (this.showRgbVsOklchComparison && rgbList.length > 0) {
      const rgbLineNodes = [];
      rgbList.forEach((item, idx) => {
        if (idx === 0 || idx === steps - 1) return; // Los extremos son los mismos
        const coords = this._getColor4DCoords(item.rgb);
        const node = {
          id: `ramp_rgb_line_${idx}`,
          type: 'ramp_dead_zone',
          x: coords.x,
          y: coords.y,
          z: coords.z,
          w: coords.w - 15,
          hex: item.hex,
          rgb: item.rgb,
          name: `Rampa RGB Lineal (Zona Muerta ${item.ratio}%)`,
          munsell: coords.munsell.notation,
          role: 'RGB estándar (Desaturación sucia)',
          size: 5
        };
        nodes.push(node);
        rgbLineNodes.push(node);
      });

      // Trazar línea punteada roja para la rampa RGB defectuosa
      const allRgbPoints = [oklchNodes[0], ...rgbLineNodes, oklchNodes[oklchNodes.length - 1]];
      for (let i = 0; i < allRgbPoints.length - 1; i++) {
        lines.push({
          from: allRgbPoints[i],
          to: allRgbPoints[i + 1],
          color: 'rgba(239, 68, 68, 0.65)',
          width: 1.5,
          dash: [4, 4],
          label: i === 1 ? 'RGB Lineal (Pérdida Tonal)' : ''
        });
      }
    }

    return { nodes, lines, faces };
  }

  /**
   * MODO 4: Despliegue Estudio de Luz & Sombra (James Gurney - Color and Light)
   * Light Plane, Shadow Plane, Bounce Light y Terminador SSS (Subsurface Scattering).
   */
  deployGurneyLightShadow(activeRgb) {
    const nodes = [];
    const lines = [];
    const faces = [];

    const hsv = ColorMath.rgbToHsv(activeRgb.r, activeRgb.g, activeRgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;
    const baseCoords = this._getColor4DCoords(activeRgb, { minVisualChroma: 5 });

    // 1. Centro: Tono Local (Halftone / Masa Principal)
    const centerNode = {
      id: 'active_sample_center',
      type: 'active_center',
      x: baseCoords.x,
      y: baseCoords.y,
      z: baseCoords.z,
      w: baseCoords.w,
      hex: ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b),
      rgb: activeRgb,
      name: `Tono Local (${ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b)})`,
      munsell: baseCoords.munsell.notation,
      role: 'Tono Local de Atelier',
      isPrimary: true,
      size: 11
    };
    nodes.push(centerNode);

    // 2. Vector Luz Superior (Plano de Luz / Light Plane)
    // Desplaza al menos 65px verticalmente y rota hacia calidez solar
    const lightHue = (hsv.h + (isWarm ? 8 : 18)) % 360;
    const lightRgb = ColorMath.hsvToRgb(lightHue, Math.max(0.12, hsv.s * 0.55), Math.min(1, hsv.v * 1.25 + 0.2));
    const lightHex = ColorMath.rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);
    const lightCoords = this._getColor4DCoords(lightRgb, { minVisualChroma: 4 });
    const lightNode = {
      id: 'active_vector_light',
      type: 'vector_light',
      x: baseCoords.x * 0.7 + 15,
      y: Math.min(150, baseCoords.y + 68),
      z: baseCoords.z * 0.7 + 15,
      w: baseCoords.w + 35,
      hex: lightHex,
      rgb: lightRgb,
      name: `Luz Solar Foco (${lightHex})`,
      munsell: lightCoords.munsell.notation,
      role: 'Plano de Luz (Blanco Titanio + Luz Solar)',
      isPrimary: true,
      size: 10
    };
    nodes.push(lightNode);
    lines.push({ from: centerNode, to: lightNode, color: '#FBBF24', width: 2.2, dash: [4, 2], label: 'Vector Luz Solar' });

    // 3. Vector Sombra Profunda (Sorolla Colored Shadow)
    // Desplaza hacia abajo al menos 65px y hacia el complementario violeta/azul
    const shadowHue = isWarm ? (hsv.h + 200) % 360 : (hsv.h + 45) % 360;
    const shadowRgb = ColorMath.hsvToRgb(shadowHue, 0.5, Math.max(0.12, hsv.v * 0.42));
    const shadowHex = ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b);
    const shadowCoords = this._getColor4DCoords(shadowRgb, { minVisualChroma: 4 });
    const shadowNode = {
      id: 'active_vector_shadow',
      type: 'vector_shadow',
      x: baseCoords.x * 0.5 - 20,
      y: Math.max(-145, baseCoords.y - 68),
      z: baseCoords.z * 0.5 - 20,
      w: baseCoords.w - 40,
      hex: shadowHex,
      rgb: shadowRgb,
      name: `Sombra Sorolla (${shadowHex})`,
      munsell: shadowCoords.munsell.notation,
      role: 'Sombra Coloreada Luminista',
      isPrimary: true,
      size: 10
    };
    nodes.push(shadowNode);
    lines.push({ from: centerNode, to: shadowNode, color: '#818CF8', width: 2.2, dash: [4, 2], label: 'Vector Sombra Fría' });

    // 4. Terminador SSS (Subsurface Scattering - James Gurney)
    // El punto de máxima saturación en el borde entre luz y sombra
    const sssHue = (hsv.h >= 20 && hsv.h <= 180) ? (hsv.h - 22 + 360) % 360 : (hsv.h + 22) % 360;
    const sssRgb = ColorMath.hsvToRgb(sssHue, Math.min(1, hsv.s * 1.4 + 0.3), Math.max(0.25, hsv.v * 0.8));
    const sssHex = ColorMath.rgbToHex(sssRgb.r, sssRgb.g, sssRgb.b);
    const sssNode = {
      id: 'active_vector_sss',
      type: 'vector_sss',
      x: (centerNode.x + shadowNode.x) / 2 + 35,
      y: (centerNode.y + shadowNode.y) / 2 + 5,
      z: (centerNode.z + shadowNode.z) / 2 + 35,
      w: baseCoords.w + 22,
      hex: sssHex,
      rgb: sssRgb,
      name: `Terminador SSS (${sssHex})`,
      role: 'Dispersión Subcutánea Translúcida',
      isPrimary: true,
      size: 10.5
    };
    nodes.push(sssNode);
    lines.push({ from: centerNode, to: sssNode, color: '#EC4899', width: 2.4, dash: [3, 2], label: 'Banda SSS' });
    lines.push({ from: sssNode, to: shadowNode, color: 'rgba(236, 72, 153, 0.45)', width: 1.6 });

    // 5. Luz Rebotada Ambiental (Bounce Light)
    const bounceHue = (shadowHue + 60) % 360;
    const bounceRgb = ColorMath.hsvToRgb(bounceHue, 0.35, Math.max(0.18, hsv.v * 0.55));
    const bounceHex = ColorMath.rgbToHex(bounceRgb.r, bounceRgb.g, bounceRgb.b);
    const bounceNode = {
      id: 'active_vector_bounce',
      type: 'vector_bounce',
      x: shadowNode.x + 25,
      y: shadowNode.y + 28,
      z: shadowNode.z - 25,
      w: baseCoords.w - 15,
      hex: bounceHex,
      rgb: bounceRgb,
      name: `Luz Rebotada (${bounceHex})`,
      role: 'Reflejo Ambiental del Suelo',
      isPrimary: true,
      size: 8.5
    };
    nodes.push(bounceNode);
    lines.push({ from: shadowNode, to: bounceNode, color: '#38BDF8', width: 1.6, dash: [2, 3], label: 'Luz Rebotada' });

    // Caras translúcidas que separan el hemisferio de luz del de sombra
    faces.push({
      p1: lightNode,
      p2: centerNode,
      p3: sssNode,
      fillColor: 'rgba(251, 191, 36, 0.22)'
    });
    faces.push({
      p1: centerNode,
      p2: sssNode,
      p3: shadowNode,
      fillColor: 'rgba(129, 140, 248, 0.22)'
    });

    return { nodes, lines, faces };
  }

  /**
   * MODO 5: Despliegue Curva Bow de Florent Farges & Mezcla Sustractiva Multi-Muestra
   * Traza la curva física no lineal entre 2 o más muestras reales o arbitrarias,
   * calculando su flexión respecto a la cuerda recta teórica y destacando fenómenos
   * de taller (Olive Shift, absorción selectiva y valor intrínseco).
   */
  deployFargesBowCurve(activeRgb) {
    const nodes = [];
    const lines = [];
    const faces = [];

    // Obtener paradas multi-muestra configuradas en el motor de Farges
    let stops = FlorentFargesEngine.transitionStops;
    if (!stops || stops.length < 2) {
      const fg = activeRgb || this.app?.fgColor || { r: 99, g: 102, b: 241 };
      const bg = this.app?.bgColor || { r: 245, g: 158, b: 11 };
      stops = [
        { id: 'farges_stop_1', hex: ColorMath.rgbToHex(fg.r, fg.g, fg.b), rgb: fg, name: 'Muestra A (Frontal)' },
        { id: 'farges_stop_2', hex: ColorMath.rgbToHex(bg.r, bg.g, bg.b), rgb: bg, name: 'Muestra B (Fondo)' }
      ];
    }

    // Generar la transición multi-muestra física
    const totalDesiredSteps = Math.max(9, (stops.length - 1) * 5);
    const transitionSteps = FlorentFargesEngine.generateMultiSampleTransition(stops, totalDesiredSteps);

    const stepNodes = [];
    transitionSteps.forEach((step, idx) => {
      const coords = this._getColor4DCoords(step.rgb, { minVisualChroma: 3 });
      const node = {
        id: `farges_step_${idx}`,
        type: step.isStop ? 'farges_stop' : 'bow_curve_pt',
        x: coords.x,
        y: coords.y,
        z: coords.z,
        w: coords.w,
        hex: step.hex,
        rgb: step.rgb,
        munsell: step.munsell,
        name: `${step.stopName} (${step.hex})`,
        role: step.isStop ? `Parada ${step.stopName}` : `Paso Físico ${(step.localRatio * 100).toFixed(0)}%`,
        inherentValue: step.inherentValue,
        isOliveShift: step.isOliveShift,
        isPrimary: step.isStop,
        size: step.isStop ? 11 : 6
      };
      nodes.push(node);
      stepNodes.push(node);
    });

    // 1. Trazar la curva conectiva física sustractiva (Verde esmeralda o Amarillo si hay Olive Shift)
    for (let i = 0; i < stepNodes.length - 1; i++) {
      const isMiddle = i === Math.floor(stepNodes.length / 2);
      lines.push({
        from: stepNodes[i],
        to: stepNodes[i + 1],
        color: stepNodes[i].isOliveShift || stepNodes[i + 1].isOliveShift ? '#EAB308' : '#10B981',
        width: 3.2,
        label: isMiddle ? 'Curva Física Farges' : ''
      });
    }

    // 2. Trazar las cuerdas rectas teóricas (Gris punteado) entre cada par consecutivo de paradas
    // Esto permite al artista contrastar visualmente la no-linealidad de la mezcla física frente a la línea recta
    const stopIndices = [];
    transitionSteps.forEach((s, idx) => {
      if (s.isStop) stopIndices.push(idx);
    });

    for (let s = 0; s < stopIndices.length - 1; s++) {
      const idxA = stopIndices[s];
      const idxB = stopIndices[s + 1];
      const nodeA = stepNodes[idxA];
      const nodeB = stepNodes[idxB];
      if (nodeA && nodeB) {
        lines.push({
          from: nodeA,
          to: nodeB,
          color: 'rgba(255, 255, 255, 0.35)',
          width: 1.4,
          dash: [4, 4],
          label: s === 0 ? 'Cuerda Recta Teórica' : ''
        });

        // Cara translúcida triangular entre la cuerda y el punto medio curvado
        const midIdx = Math.floor((idxA + idxB) / 2);
        const nodeMid = stepNodes[midIdx];
        if (nodeMid && nodeMid !== nodeA && nodeMid !== nodeB) {
          faces.push({
            p1: nodeA,
            p2: nodeMid,
            p3: nodeB,
            fillColor: 'rgba(16, 185, 129, 0.08)'
          });
        }
      }
    }

    return { nodes, lines, faces };
  }

  /**
   * MODO 6: Desglose Multidimensional Estándar de la Muestra Activa
   */
  getActiveColorNodes(activeRgb) {
    if (!activeRgb) return { nodes: [], lines: [], faces: [] };

    // Si hay un modo de despliegue exclusivo activo, canalizarlo:
    const hsv = ColorMath.rgbToHsv(activeRgb.r, activeRgb.g, activeRgb.b);
    if (this.activeDeployment === 'harmonies') {
      return this.deployHarmonies(hsv, activeRgb);
    } else if (this.activeDeployment === 'ramp') {
      return this.deployRampTrajectory(activeRgb);
    } else if (this.activeDeployment === 'gurney') {
      return this.deployGurneyLightShadow(activeRgb);
    } else if (this.activeDeployment === 'farges') {
      return this.deployFargesBowCurve(activeRgb);
    } else if (this.activeDeployment === 'palette') {
      return this.deployPaletteConstellation();
    } else if (this.activeDeployment === 'compare' || this.activeDeployment === 'tesseract') {
      return { nodes: [], lines: [], faces: [] };
    }

    // MODO 'all': Integra la muestra con sus vectores principales
    const nodes = [];
    const lines = [];
    const faces = [];

    const baseCoords = this._getColor4DCoords(activeRgb, { minVisualChroma: 5 });
    const activeHex = ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

    // 1. NODO CENTRAL
    const centerNode = {
      id: 'active_sample_center',
      type: 'active_center',
      x: baseCoords.x,
      y: baseCoords.y,
      z: baseCoords.z,
      w: baseCoords.w,
      hex: activeHex,
      rgb: activeRgb,
      name: `MUESTRA ACTIVA (${activeHex})`,
      munsell: baseCoords.munsell.notation,
      hsv,
      isPrimary: true,
      size: 11
    };
    nodes.push(centerNode);

    // 2. Vector Luz Superior
    if (this.options.showLightShadowVector) {
      const lightHue = (hsv.h + 12) % 360;
      const lightRgb = ColorMath.hsvToRgb(lightHue, Math.max(0.15, hsv.s * 0.6), Math.min(1, hsv.v * 1.25 + 0.15));
      const lightHex = ColorMath.rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);
      const lightNode = {
        id: 'active_vector_light',
        type: 'vector_light',
        x: baseCoords.x * 0.75,
        y: Math.min(145, baseCoords.y + 60),
        z: baseCoords.z * 0.75,
        w: baseCoords.w + 25,
        hex: lightHex,
        rgb: lightRgb,
        name: `Luz Solar (${lightHex})`,
        size: 7
      };
      nodes.push(lightNode);
      lines.push({ from: centerNode, to: lightNode, color: '#FBBF24', dash: [4, 2], label: 'Vector Luz' });

      // Vector Sombra
      const shadowHue = baseCoords.isWarm ? (hsv.h + 200) % 360 : (hsv.h + 40) % 360;
      const shadowRgb = ColorMath.hsvToRgb(shadowHue, 0.45, Math.max(0.15, hsv.v * 0.45));
      const shadowHex = ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b);
      const shadowNode = {
        id: 'active_vector_shadow',
        type: 'vector_shadow',
        x: baseCoords.x * 0.6,
        y: Math.max(-135, baseCoords.y - 60),
        z: baseCoords.z * 0.6,
        w: baseCoords.w - 35,
        hex: shadowHex,
        rgb: shadowRgb,
        name: `Sombra Atmosférica (${shadowHex})`,
        size: 7
      };
      nodes.push(shadowNode);
      lines.push({ from: centerNode, to: shadowNode, color: '#818CF8', dash: [4, 2], label: 'Vector Sombra' });
    }

    // 3. Eje Complementario
    if (this.options.showHarmonyPolyhedron) {
      const compHue = (hsv.h + 180) % 360;
      const compRad = (compHue * Math.PI) / 180;
      const compRgb = ColorMath.hsvToRgb(compHue, hsv.s, hsv.v);
      const compHex = ColorMath.rgbToHex(compRgb.r, compRgb.g, compRgb.b);
      const compNode = {
        id: 'active_harmony_comp',
        type: 'harmony_node',
        x: baseCoords.chromaRadius * Math.cos(compRad),
        y: baseCoords.y * 0.9,
        z: baseCoords.chromaRadius * Math.sin(compRad),
        w: -baseCoords.w,
        hex: compHex,
        rgb: compRgb,
        name: `Complementario (${compHex})`,
        size: 7.5
      };
      nodes.push(compNode);
      lines.push({ from: centerNode, to: compNode, color: '#F43F5E', width: 2, label: 'Eje Complementario' });
    }

    // 4. SSS Terminador
    if (this.options.showSSSVector) {
      const sssHue = (hsv.h >= 20 && hsv.h <= 180) ? (hsv.h - 25 + 360) % 360 : (hsv.h + 20) % 360;
      const sssRgb = ColorMath.hsvToRgb(sssHue, Math.min(1, hsv.s * 1.35 + 0.25), Math.max(0.2, hsv.v * 0.75));
      const sssHex = ColorMath.rgbToHex(sssRgb.r, sssRgb.g, sssRgb.b);
      const sssNode = {
        id: 'active_vector_sss',
        type: 'vector_sss',
        x: (baseCoords.x * 0.8) + 20,
        y: baseCoords.y - 25,
        z: (baseCoords.z * 0.8) + 20,
        w: baseCoords.w + 18,
        hex: sssHex,
        rgb: sssRgb,
        name: `Terminador SSS (${sssHex})`,
        size: 7.5
      };
      nodes.push(sssNode);
      lines.push({ from: centerNode, to: sssNode, color: '#EC4899', width: 2, dash: [3, 2], label: 'SSS Terminador' });
    }

    return { nodes, lines, faces };
  }

  // --- RENDERIZADOR PRINCIPAL EN CANVAS ---

  _startRenderLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    const loop = () => {
      try {
        this._renderFrame();
      } catch (err) {
        console.warn('Hyper4DStudio render frame warning:', err);
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  _renderFrame() {
    if (!this.ctx || !this.canvas) return;

    // Si la vista está oculta en el DOM (display: none), evitar cálculos innecesarios
    const view = document.getElementById('viewHyper4D');
    if (view && (view.style.display === 'none' || view.classList.contains('tab-hidden')) && !this.options.isFullscreen) {
      return;
    }

    let w = this.displayWidth;
    let h = this.displayHeight;

    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 50 || h <= 50) {
      this._resizeCanvas();
      w = this.displayWidth;
      h = this.displayHeight;
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 50 || h <= 50) {
        return; // Aún sin dimensiones válidas en el DOM, saltar frame limpiamente
      }
    }

    // 1. Interpolación suave de cámara (Lerp)
    const lerpSpeed = 0.08;
    this.camera.rotX += (this.camera.targetRotX - this.camera.rotX) * lerpSpeed;
    this.camera.rotY += (this.camera.targetRotY - this.camera.rotY) * lerpSpeed;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * lerpSpeed;
    this.camera.panX += (this.camera.targetPanX - this.camera.panX) * lerpSpeed;
    this.camera.panY += (this.camera.targetPanY - this.camera.panY) * lerpSpeed;

    // Auto-rotación o Vuelo Cinemático
    if (this.camera.cinematicFly) {
      this.camera.flyTime += 0.01;
      this.camera.targetRotY += 0.004;
      this.camera.targetRotX = 0.28 + Math.sin(this.camera.flyTime * 0.7) * 0.18;
      this.camera.targetPanY = Math.sin(this.camera.flyTime * 0.5) * 20;
    } else if (this.camera.autoRotate && !this.camera.isDragging) {
      this.camera.targetRotY += this.camera.autoRotateSpeed;
      this.camera.rotY = this.camera.targetRotY;
    }

    // Animación continua de la 4ª Dimensión W
    if (this.dimension4D.isAnimatingW) {
      if (this.dimension4D.wMode === 'tesseract') {
        this.dimension4D.angleXW += this.dimension4D.animSpeed * 0.8;
        this.dimension4D.angleYW += this.dimension4D.animSpeed * 0.6;
        this.dimension4D.angleZW += this.dimension4D.animSpeed * 0.4;
      } else {
        this.dimension4D.wValue += this.dimension4D.animSpeed * 30 * this.dimension4D.animDirection;
        if (this.dimension4D.wValue > 95) {
          this.dimension4D.wValue = 95;
          this.dimension4D.animDirection = -1;
        } else if (this.dimension4D.wValue < -95) {
          this.dimension4D.wValue = -95;
          this.dimension4D.animDirection = 1;
        }
        const wSlider = document.getElementById('hyper4dWSlider');
        if (wSlider) wSlider.value = Math.round(this.dimension4D.wValue);
      }
      this._updateWDisplayLabel();
    }

    // 2. Fondo Cósmico con Gradiente Espacial Profundo
    this.ctx.clearRect(0, 0, w, h);
    const gradR = Math.max(10, Math.max(w, h) * 0.75);
    const bgGrad = this.ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, gradR);
    bgGrad.addColorStop(0, '#0F1322');
    bgGrad.addColorStop(0.5, '#090B12');
    bgGrad.addColorStop(1, '#040508');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 3. Partículas Cósmicas de Fondo
    if (this.options.particleStars) {
      this._renderBackgroundParticles();
    }

    // 4. Ejes de Coordenadas y Anillos de Espacio
    if (this.options.showGridAxes) {
      this._renderSpatialAxes();
    }

    // 5. Recopilar todos los elementos a dibujar (Nodos, Líneas, Polígonos)
    const elementsToDraw = [];
    const linesToDraw = [];
    const facesToDraw = [];

    // Nube de Modelo Base (si no estamos en modo exclusivo de tesseract)
    const isExclusiveMode = this.activeDeployment === 'tesseract';
    if (this.options.showSolidCloud && !isExclusiveMode) {
      let baseNodes = [];
      if (this.activeModel === 'munsell') {
        baseNodes = this.getMunsellGeometry();
      } else if (this.activeModel === 'cielab') {
        baseNodes = this.getCieLabGeometry();
      } else if (this.activeModel === 'hsl_cone') {
        baseNodes = this.getHslConeGeometry();
      }
      if (this.activeDeployment !== 'all') {
        // En modos específicos de despliegue, atenuar como polvo estelar de referencia galáctica
        baseNodes.forEach(bn => { bn._ghost = true; });
      }
      elementsToDraw.push(...baseNodes);
    } else if (this.activeDeployment === 'tesseract' || (this.options.showSolidCloud && this.activeModel === 'tesseract')) {
      const tess = this.getTesseractGeometry();
      elementsToDraw.push(...tess.nodes);
      tess.edges.forEach(e => {
        const n1 = tess.nodes.find(n => n.id === e.from);
        const n2 = tess.nodes.find(n => n.id === e.to);
        if (n1 && n2) linesToDraw.push({ from: n1, to: n2, color: 'rgba(99, 102, 241, 0.45)', width: 1.8 });
      });
    }

    // Muestra Activa y sus Desgloses según el Modo de Despliegue
    const curRgb = this.activeColor || (this.app?.activeWell === 'bg' ? this.app?.bgColor : this.app?.fgColor) || { r: 99, g: 102, b: 241 };
    const activeData = this.getActiveColorNodes(curRgb);
    elementsToDraw.push(...activeData.nodes);
    linesToDraw.push(...activeData.lines);
    facesToDraw.push(...activeData.faces);

    // Constelación de Paleta (si está activada y no estamos en modo exclusivo)
    if (this.options.showPaletteConstellation && this.activeDeployment === 'all') {
      const palData = this.deployPaletteConstellation();
      elementsToDraw.push(...palData.nodes);
      linesToDraw.push(...palData.lines);
    }

    // Muestras en Modo Comparador (solo si se selecciona el comparador)
    if (this.activeDeployment === 'compare') {
      this._collectCompareNodes(elementsToDraw, linesToDraw);
    }

    // 6. PROYECCIÓN 4D -> 3D -> 2D
    const projectedNodes = [];
    elementsToDraw.forEach(node => {
      const r4 = this.rotatePoint4D(node, this.dimension4D.angleXW, this.dimension4D.angleYW, this.dimension4D.angleZW);
      const p3 = this.project4DTo3D(r4);
      const p2 = this.project3DTo2D(p3);

      if (p2.visible) {
        projectedNodes.push({
          node,
          x: p2.screenX,
          y: p2.screenY,
          depth: p2.depth,
          scale: p2.scale,
          hyperScale: p3.hyperScale
        });
      }
    });

    // Guardar para hit-testing
    this.renderedNodes = projectedNodes;

    // 7. DIBUJAR CARAS TRANSLÚCIDAS (Z-Sorted)
    facesToDraw.forEach(face => {
      const p1 = projectedNodes.find(pn => pn.node.id === face.p1.id);
      const p2 = projectedNodes.find(pn => pn.node.id === face.p2.id);
      const p3 = projectedNodes.find(pn => pn.node.id === face.p3.id);
      if (p1 && p2 && p3) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        this.ctx.fillStyle = face.fillColor || 'rgba(99, 102, 241, 0.15)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });

    // 8. DIBUJAR LÍNEAS Y VECTORES CON RESPLANDOR
    linesToDraw.forEach(line => {
      const p1 = projectedNodes.find(pn => pn.node.id === line.from.id);
      const p2 = projectedNodes.find(pn => pn.node.id === line.to.id);
      if (p1 && p2) {
        const lineDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = line.color || '#FFFFFF';
        this.ctx.lineWidth = (line.width || 1.6) * Math.min(1.6, Math.max(0.6, p1.scale * 1.2));
        if (line.dash) this.ctx.setLineDash(line.dash);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rótulo del vector solo si la línea es suficientemente larga para no apiñarse
        if (line.label && this.options.showLabels && lineDist > 75) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          this._drawVectorLineTag(line.label, midX, midY, line.color);
        }
      }
    });

    // 9. DIBUJAR ESFERAS VOLUMÉTRICAS 3D (Z-Sorting estricto)
    projectedNodes.sort((a, b) => b.depth - a.depth);

    const minDepth = -300;
    const maxDepth = 300;
    const badgesToRender = [];

    projectedNodes.forEach(item => {
      const { node, x, y, scale, depth } = item;
      const isHovered = this.hoveredNode && this.hoveredNode.node.id === node.id;
      const isPrimary = node.isPrimary;
      const isGhost = !!node._ghost;
      const baseRadius = (node.size || 4) * scale;
      const radius = Math.max(2, Math.min(32, isHovered ? baseRadius * 1.35 : baseRadius));

      // Factor de niebla de profundidad (0 = más lejano, 1 = más cercano)
      const depthFactor = Math.max(0, Math.min(1, (depth - minDepth) / (maxDepth - minDepth)));

      // Renderizado de esfera 3D Phong (o polvo galáctico atenuado si es ghost)
      this._drawSphere(x, y, radius, node.hex, depthFactor, isHovered, isPrimary, isGhost);

      // Recopilar rótulos para el motor anti-colisión
      if (this.options.showLabels && !isGhost) {
        const isMilestone = isPrimary || isHovered || node.type === 'compare_sample' ||
          (this.activeDeployment !== 'all' && (
            node.type === 'vector_light' ||
            node.type === 'vector_shadow' ||
            node.type === 'vector_sss' ||
            node.type === 'vector_bounce' ||
            node.type === 'harmony_node' ||
            node.type === 'farges_stop' ||
            (node.type === 'bow_curve_pt' && node.isPrimary) ||
            (node.type === 'ramp_node' && node.isPrimary) ||
            (node.type === 'palette_swatch' && this.activeDeployment === 'palette')
          ));

        if (isMilestone) {
          badgesToRender.push({
            node,
            x,
            y,
            radius,
            name: node.name || node.hex,
            sub: node.munsell || node.role || node.hex,
            isPrimary: isPrimary || node.type === 'active_center',
            isHovered
          });
        }
      }
    });

    // 10. MOTOR ANTI-COLISIÓN DE RÓTULOS (CÁPSULAS DE CRISTAL FROSTED GLASS)
    if (this.options.showLabels && badgesToRender.length > 0) {
      this._renderAntiCollisionBadges(badgesToRender);
    }

    // 11. TOOLTIP HOLOGRÁFICO FLOTANTE SI HAY HOVER
    if (this.hoveredNode) {
      this._drawHolographicHUD(this.hoveredNode);
    }
  }

  /**
   * Dibuja una esfera volumétrica 3D Phong con brillo especular,
   * reflejo ambiental, oclusión en limbo y niebla atmosférica.
   */
  _drawSphere(x, y, radius, hex, depthFactor, isHovered, isPrimary, isGhost = false) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) return;
    const ctx = this.ctx;
    const rad = Math.max(1.8, radius);

    // Si es nodo fantasma de fondo, renderizado ultraligero y sutil como polvo estelar
    if (isGhost) {
      ctx.save();
      const safeDepth = Number.isFinite(depthFactor) ? depthFactor : 0.5;
      ctx.globalAlpha = Math.max(0.06, Math.min(0.18, 0.09 + safeDepth * 0.08));
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, rad * 0.65), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Niebla de profundidad (alpha atenuada y fusión cósmica)
    const safeDepth = Number.isFinite(depthFactor) ? depthFactor : 0.5;
    const alpha = Math.max(0.25, Math.min(1.0, 0.4 + safeDepth * 0.6));

    // Halo / Bloom cuántico para nodos primarios o hovered
    if (isPrimary || isHovered) {
      const glowRad = rad * 3.2;
      if (Number.isFinite(glowRad) && glowRad > rad * 0.2) {
        const glowGrad = ctx.createRadialGradient(x, y, rad * 0.2, x, y, glowRad);
        glowGrad.addColorStop(0, hex + '99');
        glowGrad.addColorStop(0.5, hex + '33');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de energía hiperdimensional
        ctx.save();
        ctx.strokeStyle = isPrimary ? '#FBBF24' : '#38BDF8';
        ctx.lineWidth = isHovered ? 2.2 : 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, rad + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Gradiente Phong 3D con luz especular desplazada al cuadrante superior izquierdo
    const lightOffsetX = -rad * 0.32;
    const lightOffsetY = -rad * 0.35;
    const rInner = Math.max(0.1, rad * 0.08);
    const rOuter = Math.max(rInner + 0.1, rad);
    const sphereGrad = ctx.createRadialGradient(
      x + lightOffsetX, y + lightOffsetY, rInner,
      x, y, rOuter
    );

    const rgb = ColorMath.hexToRgb(hex);
    const specR = Math.min(255, rgb.r + 140);
    const specG = Math.min(255, rgb.g + 140);
    const specB = Math.min(255, rgb.b + 140);
    const shadowR = Math.max(0, Math.round(rgb.r * 0.38));
    const shadowG = Math.max(0, Math.round(rgb.g * 0.38));
    const shadowB = Math.max(0, Math.round(rgb.b * 0.38));

    sphereGrad.addColorStop(0, `rgba(${specR}, ${specG}, ${specB}, ${alpha})`);
    sphereGrad.addColorStop(0.25, `rgba(${Math.min(255, rgb.r + 50)}, ${Math.min(255, rgb.g + 50)}, ${Math.min(255, rgb.b + 50)}, ${alpha})`);
    sphereGrad.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
    sphereGrad.addColorStop(0.95, `rgba(${shadowR}, ${shadowG}, ${shadowB}, ${alpha})`);
    sphereGrad.addColorStop(1.0, `rgba(${Math.min(255, rgb.r + 25)}, ${Math.min(255, rgb.g + 25)}, ${Math.min(255, rgb.b + 25)}, ${alpha * 0.8})`);

    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Borde de definición
    ctx.strokeStyle = isPrimary ? '#FBBF24' : (isHovered ? '#FFFFFF' : `rgba(255,255,255,${alpha * 0.28})`);
    ctx.lineWidth = isHovered ? 2 : (isPrimary ? 1.5 : 0.8);
    ctx.stroke();
  }

  /**
   * Motor Anti-Colisión de Rótulos:
   * Coloca cápsulas de cristal (Pills) con cálculo de proximidad. Si dos rótulos
   * están cerca, desplaza el secundario y traza una línea guía (leader line).
   */
  _renderAntiCollisionBadges(badges) {
    const ctx = this.ctx;
    ctx.font = 'bold 10px sans-serif';

    // Ordenar por prioridad: hovered primero, luego primario, luego el resto
    badges.sort((a, b) => {
      if (a.isHovered) return -1;
      if (b.isHovered) return 1;
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.y - b.y;
    });

    const occupiedBoxes = [];

    badges.forEach((b) => {
      const nameWidth = ctx.measureText(b.name).width;
      const boxW = Math.max(60, nameWidth + 14);
      const boxH = 18;

      let targetX = b.x;
      let targetY = b.y - b.radius - 12;

      // Detectar colisión con cajas ya colocadas
      let hasCollision = false;
      for (const occ of occupiedBoxes) {
        const dx = Math.abs(targetX - occ.x);
        const dy = Math.abs(targetY - occ.y);
        if (dx < (boxW + occ.w) / 2 + 6 && dy < 24) {
          hasCollision = true;
          break;
        }
      }

      let drawLeaderLine = false;
      if (hasCollision) {
        // Desplazar a la derecha y arriba con línea guía
        targetX = b.x + boxW / 2 + 18;
        targetY = b.y - 18;
        drawLeaderLine = true;
      }

      // Mantener dentro de los bordes del canvas
      targetX = Math.max(boxW / 2 + 8, Math.min(this.displayWidth - boxW / 2 - 8, targetX));
      targetY = Math.max(16, Math.min(this.displayHeight - 20, targetY));

      const rectX = targetX - boxW / 2;
      const rectY = targetY - boxH / 2;

      // Trazar línea guía elegante si fue desplazado
      if (drawLeaderLine) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(rectX, targetY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      // Fondo Cápsula Frosted Glass
      ctx.fillStyle = b.isPrimary ? 'rgba(24, 20, 10, 0.92)' : 'rgba(10, 14, 24, 0.88)';
      ctx.strokeStyle = b.isPrimary ? '#FBBF24' : (b.isHovered ? '#38BDF8' : 'rgba(255, 255, 255, 0.22)');
      ctx.lineWidth = b.isPrimary || b.isHovered ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(rectX, rectY, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      // Texto de la cápsula
      ctx.fillStyle = b.isPrimary ? '#FDE68A' : '#FFFFFF';
      ctx.font = b.isPrimary ? 'bold 10px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.name, targetX, targetY);

      occupiedBoxes.push({ x: targetX, y: targetY, w: boxW, h: boxH });
    });
  }

  /**
   * Rótulo de línea de vector centrado en pastilla limpia
   */
  _drawVectorLineTag(text, x, y, color) {
    const ctx = this.ctx;
    ctx.font = 'bold 9px sans-serif';
    const textW = ctx.measureText(text).width;
    const pad = 6;
    const boxW = textW + pad * 2;
    const boxH = 15;

    ctx.fillStyle = 'rgba(10, 14, 24, 0.88)';
    ctx.strokeStyle = color || '#818CF8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color || '#E2E8F0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  _renderBackgroundParticles() {
    this.particles.forEach(p => {
      const p3 = this.project4DTo3D(p);
      const p2 = this.project3DTo2D(p3);
      if (p2.visible) {
        this.ctx.beginPath();
        this.ctx.arc(p2.screenX, p2.screenY, p.size * p2.scale, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      }
    });
  }

  _renderSpatialAxes() {
    const center2D = this.project3DTo2D({ x: 0, y: 0, z: 0 });
    if (!center2D.visible) return;

    // Eje Vertical de Luminosidad / Valor (Luz a Sombra)
    const top2D = this.project3DTo2D({ x: 0, y: 165, z: 0 });
    const bottom2D = this.project3DTo2D({ x: 0, y: -165, z: 0 });
    if (top2D.visible && bottom2D.visible) {
      this.ctx.beginPath();
      this.ctx.moveTo(bottom2D.screenX, bottom2D.screenY);
      this.ctx.lineTo(top2D.screenX, top2D.screenY);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = '8px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('▲ Valor 10 (Luz)', top2D.screenX, top2D.screenY - 8);
      this.ctx.fillText('▼ Valor 0 (Sombra)', bottom2D.screenX, bottom2D.screenY + 14);
    }

    // Anillo ecuatorial cromático (Croma / Saturación en Valor 5)
    const ringRadius = 145;
    this.ctx.beginPath();
    for (let a = 0; a <= 360; a += 10) {
      const rad = (a * Math.PI) / 180;
      const pt = this.project3DTo2D({
        x: ringRadius * Math.cos(rad),
        y: 0,
        z: ringRadius * Math.sin(rad)
      });
      if (pt.visible) {
        if (a === 0) this.ctx.moveTo(pt.screenX, pt.screenY);
        else this.ctx.lineTo(pt.screenX, pt.screenY);
      }
    }
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  _collectCompareNodes(elements, lines) {
    const activeSlots = this.compareSlots.filter(s => s.active !== false);
    if (activeSlots.length < 2) return;

    const slotNodes = [];
    const rgbList = [];
    let sumX = 0, sumY = 0, sumZ = 0, sumW = 0;

    activeSlots.forEach((slot) => {
      const coords = this._getColor4DCoords(slot.rgb, { minVisualChroma: 5 });
      const node = {
        id: `compare_slot_${slot.id}`,
        type: 'compare_sample',
        slotId: slot.id,
        x: coords.x,
        y: coords.y,
        z: coords.z,
        w: coords.w,
        hex: slot.hex,
        rgb: slot.rgb,
        name: `[${slot.id}] ${slot.name || ('Muestra ' + slot.id)}`,
        munsell: coords.munsell.notation,
        coords4D: `X:${coords.x.toFixed(0)} Y:${coords.y.toFixed(0)} Z:${coords.z.toFixed(0)} W:${coords.w.toFixed(0)}`,
        isPrimary: true,
        size: 11
      };
      elements.push(node);
      slotNodes.push(node);
      rgbList.push(slot.rgb);

      sumX += coords.x;
      sumY += coords.y;
      sumZ += coords.z;
      sumW += coords.w;
    });

    const N = slotNodes.length;
    if (N >= 2) {
      // Conectar polígono perimetral dinámico
      for (let i = 0; i < N; i++) {
        const nextIdx = (i + 1) % N;
        if (N === 2 && i === 1) break;
        lines.push({
          from: slotNodes[i],
          to: slotNodes[nextIdx],
          color: '#F59E0B',
          width: 2.2,
          dash: [5, 3],
          label: N === 2 ? 'Vector Comparativo A ↔ B' : (i === 0 ? 'Polígono 4D Comparativo' : '')
        });
      }

      // Baricentro Colectivo Físico en 4D
      const baryX = sumX / N;
      const baryY = sumY / N;
      const baryZ = sumZ / N;
      const baryW = sumW / N;
      const mixRgb = this._calculateMultiPhysicalMix(rgbList);
      const mixHex = ColorMath.rgbToHex(mixRgb.r, mixRgb.g, mixRgb.b);

      const mixNode = {
        id: 'compare_mix_point',
        type: 'compare_mix',
        x: baryX,
        y: baryY,
        z: baryZ,
        w: baryW,
        hex: mixHex,
        rgb: mixRgb,
        name: `🪐 Baricentro 4D (${mixHex})`,
        coords4D: `Baricentro Colectivo 1/${N}`,
        isPrimary: true,
        size: 9
      };
      elements.push(mixNode);

      slotNodes.forEach(sn => {
        lines.push({
          from: sn,
          to: mixNode,
          color: 'rgba(56, 189, 248, 0.4)',
          width: 1.3,
          dash: [3, 3]
        });
      });
    }
  }

  /**
   * HUD Holográfico Flotante de Alta Definición
   */
  _drawHolographicHUD(item) {
    const { node, x, y } = item;
    const padding = 10;
    const title = node.name || node.hex;
    const sub = node.munsell ? `Munsell: ${node.munsell}` : (node.coords4D ? `4D: ${node.coords4D}` : node.hex);
    const roleText = node.role || (node.type === 'active_center' ? 'Muestra Activa en la Suite' : '');

    this.ctx.font = 'bold 11px sans-serif';
    const titleW = this.ctx.measureText(title).width;
    this.ctx.font = '9px monospace';
    const subW = this.ctx.measureText(sub).width;
    const roleW = roleText ? this.ctx.measureText(roleText).width : 0;
    const boxW = Math.max(titleW, subW, roleW) + padding * 2 + 32;
    const boxH = roleText ? 52 : 42;

    const boxX = Math.min(this.displayWidth - boxW - 12, Math.max(12, x - boxW / 2));
    const boxY = Math.max(12, y - boxH - 18);

    // Fondo tarjeta flotante de cristal
    this.ctx.fillStyle = 'rgba(10, 14, 24, 0.94)';
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Muestra de color con bisel especular
    this.ctx.fillStyle = node.hex;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX + 10, boxY + 11, 20, 20, 4);
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Textos
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(title, boxX + 38, boxY + 9);

    this.ctx.fillStyle = '#38BDF8';
    this.ctx.font = '9px monospace';
    this.ctx.fillText(sub, boxX + 38, boxY + 23);

    if (roleText) {
      this.ctx.fillStyle = '#FBBF24';
      this.ctx.font = 'italic 9px sans-serif';
      this.ctx.fillText(roleText, boxX + 38, boxY + 36);
    }
  }

  // --- HIT-TESTING & EVENTOS DE RATÓN Y CÁMARA ---

  _bindEvents() {
    if (!this.canvas) return;

    window.addEventListener('resize', () => this._resizeCanvas());

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !e.shiftKey) {
        this.camera.isDragging = true;
      } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        this.camera.isPanning = true;
      }
      this.camera.lastMouseX = e.clientX;
      this.camera.lastMouseY = e.clientY;
      this.camera.autoRotate = false;
      this.camera.cinematicFly = false;
      const btnFly = document.getElementById('btnHyper4DCinematicFly');
      if (btnFly) btnFly.classList.remove('active');
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.camera.isDragging) {
        const dx = e.clientX - this.camera.lastMouseX;
        const dy = e.clientY - this.camera.lastMouseY;
        const signX = this.camera.invertX ? -1 : 1;
        const signY = this.camera.invertY ? -1 : 1;
        this.camera.targetRotY += dx * 0.007 * signX;
        this.camera.targetRotX = Math.max(-1.45, Math.min(1.45, this.camera.targetRotX + dy * 0.007 * signY));
        this.camera.rotY = this.camera.targetRotY;
        this.camera.rotX = this.camera.targetRotX;
        this.camera.lastMouseX = e.clientX;
        this.camera.lastMouseY = e.clientY;
        return;
      }

      if (this.camera.isPanning) {
        const dx = e.clientX - this.camera.lastMouseX;
        const dy = e.clientY - this.camera.lastMouseY;
        this.camera.targetPanX += dx;
        this.camera.targetPanY += dy;
        this.camera.panX = this.camera.targetPanX;
        this.camera.panY = this.camera.targetPanY;
        this.camera.lastMouseX = e.clientX;
        this.camera.lastMouseY = e.clientY;
        return;
      }

      // Hit-testing para Hover
      if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
        let found = null;
        for (let i = this.renderedNodes.length - 1; i >= 0; i--) {
          const item = this.renderedNodes[i];
          const dist = Math.hypot(mouseX - item.x, mouseY - item.y);
          if (dist <= Math.max(14, (item.node.size || 4) * item.scale + 6)) {
            found = item;
            break;
          }
        }
        this.hoveredNode = found;
        this.canvas.style.cursor = found ? 'pointer' : 'grab';
      } else {
        this.hoveredNode = null;
      }
    });

    window.addEventListener('mouseup', () => {
      this.camera.isDragging = false;
      this.camera.isPanning = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
      this.camera.targetZoom = Math.max(0.25, Math.min(4.2, this.camera.targetZoom * zoomFactor));
    }, { passive: false });

    // Clic para seleccionar nodo y cargarlo en la suite
    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode) {
        const hex = this.hoveredNode.node.hex;
        if (hex && this.app) {
          const rgb = ColorMath.hexToRgb(hex);
          this.app.setColorDirectly(rgb);
          if (this.app.showToast) {
            this.app.showToast(`Color ${hex} cargado en la Rueda Cromática`, 'success');
          }
        }
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // --- AUTO-ENCUADRE Y CÁMARA CINEMÁTICA ---

  /**
   * Auto-encuadra todos los nodos visibles calculando su centro y radio contenedor.
   */
  frameAll() {
    this.camera.targetPanX = 0;
    this.camera.targetPanY = 0;

    // Si estamos en un modo específico, enfocar hacia ese despliegue
    const activeNodes = this.renderedNodes.filter(rn => !rn.node._ghost);
    const nodes = activeNodes.length > 0 ? activeNodes : this.renderedNodes;

    if (!nodes.length) {
      this.camera.targetRotX = 0.35;
      this.camera.targetRotY = -0.65;
      this.camera.targetZoom = 1.05;
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    nodes.forEach(rn => {
      minX = Math.min(minX, rn.node.x);
      maxX = Math.max(maxX, rn.node.x);
      minY = Math.min(minY, rn.node.y);
      maxY = Math.max(maxY, rn.node.y);
      minZ = Math.min(minZ, rn.node.z || 0);
      maxZ = Math.max(maxZ, rn.node.z || 0);
    });

    const spanX = Math.max(30, maxX - minX);
    const spanY = Math.max(30, maxY - minY);
    const spanZ = Math.max(30, maxZ - minZ);
    const maxSpan = Math.max(spanX, spanY, spanZ);

    // Zoom adaptativo suave para encuadrar la estructura geométricamente
    const targetZoom = Math.max(0.75, Math.min(2.2, 330 / maxSpan));
    this.camera.targetZoom = targetZoom;
    this.camera.targetRotX = 0.32;
    this.camera.targetRotY = -0.58;

    if (this.app?.showToast) {
      this.app.showToast('Escena 4D auto-encuadrada en vista óptima', 'info');
    }
  }

  toggleCinematicFly() {
    this.camera.cinematicFly = !this.camera.cinematicFly;
    this.camera.autoRotate = false;
    const btnFly = document.getElementById('btnHyper4DCinematicFly');
    if (btnFly) {
      btnFly.classList.toggle('active', this.camera.cinematicFly);
    }
    if (this.app?.showToast) {
      this.app.showToast(this.camera.cinematicFly ? 'Vuelo Cinemático 4D activado' : 'Vuelo Cinemático pausado', 'info');
    }
  }

  // --- BINDING DE LA INTERFAZ HTML ---

  _bindUI() {
    // 1. Selector de Geometría / Modelo 4D
    const modelSelect = document.getElementById('hyper4dModelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        this.activeModel = e.target.value;
      });
    }

    // 2. Selector de la 4ª Dimensión (W)
    const wModeSelect = document.getElementById('hyper4dWModeSelect');
    if (wModeSelect) {
      wModeSelect.addEventListener('change', (e) => {
        this.dimension4D.wMode = e.target.value;
        this._updateWDisplayLabel();
      });
    }

    // 3. Slider de la 4ª Dimensión (W)
    const wSlider = document.getElementById('hyper4dWSlider');
    if (wSlider) {
      wSlider.addEventListener('input', (e) => {
        this.dimension4D.wValue = parseFloat(e.target.value);
        this._updateWDisplayLabel();
      });
    }

    // 4. Botón Play/Pause de Animación 4D
    const btnPlayW = document.getElementById('btnHyper4DPlayW');
    if (btnPlayW) {
      btnPlayW.addEventListener('click', () => {
        this.dimension4D.isAnimatingW = !this.dimension4D.isAnimatingW;
        btnPlayW.textContent = this.dimension4D.isAnimatingW ? '⏸️' : '▶️';
        btnPlayW.title = this.dimension4D.isAnimatingW ? 'Pausar animación 4D' : 'Reproducir ciclo 4D continuo';
      });
    }

    // 5. Botones de Modo de Despliegue Espacial (Pills 4D)
    document.querySelectorAll('.hyper4d-deploy-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const deployKey = pill.dataset.deploy;
        this.setDeploymentMode(deployKey);
      });
    });

    // 6. Sub-selectores de Armonías y Rampas
    const harmonyRuleSelect = document.getElementById('hyper4dHarmonyRuleSelect');
    if (harmonyRuleSelect) {
      harmonyRuleSelect.addEventListener('change', (e) => {
        this.activeHarmonyRule = e.target.value;
        setTimeout(() => this.frameAll(), 80);
      });
    }

    const rampTypeSelect = document.getElementById('hyper4dRampTypeSelect');
    if (rampTypeSelect) {
      rampTypeSelect.addEventListener('change', (e) => {
        this.activeRampType = e.target.value;
        setTimeout(() => this.frameAll(), 80);
      });
    }

    // 7. Controles de Cámara Rápida
    const btnResetCam = document.getElementById('btnHyper4DResetCam');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        this.camera.targetRotX = 0.35;
        this.camera.targetRotY = -0.65;
        this.camera.targetZoom = 1.05;
        this.camera.targetPanX = 0;
        this.camera.targetPanY = 0;
        this.camera.cinematicFly = false;
      });
    }

    const btnFrame = document.getElementById('btnHyper4DFrame');
    if (btnFrame) {
      btnFrame.addEventListener('click', () => this.frameAll());
    }

    const btnAutoRotate = document.getElementById('btnHyper4DAutoRotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        this.camera.autoRotate = !this.camera.autoRotate;
        this.camera.cinematicFly = false;
        btnAutoRotate.classList.toggle('active', this.camera.autoRotate);
      });
    }

    const btnCinematicFly = document.getElementById('btnHyper4DCinematicFly');
    if (btnCinematicFly) {
      btnCinematicFly.addEventListener('click', () => this.toggleCinematicFly());
    }

    // 8. Vistas Ortogonales
    const btnViewTop = document.getElementById('btnHyper4DViewTop');
    if (btnViewTop) {
      btnViewTop.addEventListener('click', () => {
        this.camera.targetRotX = Math.PI / 2;
        this.camera.targetRotY = 0;
        this.camera.autoRotate = false;
        this.camera.cinematicFly = false;
      });
    }

    const btnViewFront = document.getElementById('btnHyper4DViewFront');
    if (btnViewFront) {
      btnViewFront.addEventListener('click', () => {
        this.camera.targetRotX = 0;
        this.camera.targetRotY = 0;
        this.camera.autoRotate = false;
        this.camera.cinematicFly = false;
      });
    }

    const btnViewSide = document.getElementById('btnHyper4DViewSide');
    if (btnViewSide) {
      btnViewSide.addEventListener('click', () => {
        this.camera.targetRotX = 0;
        this.camera.targetRotY = Math.PI / 2;
        this.camera.autoRotate = false;
        this.camera.cinematicFly = false;
      });
    }

    // 9. Toggles de Opciones de Capas
    const bindToggle = (id, prop) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          this.options[prop] = e.target.checked;
        });
      }
    };
    bindToggle('chkHyper4DSolid', 'showSolidCloud');
    bindToggle('chkHyper4DAxes', 'showGridAxes');
    bindToggle('chkHyper4DHarmony', 'showHarmonyPolyhedron');
    bindToggle('chkHyper4DLightShadow', 'showLightShadowVector');
    bindToggle('chkHyper4DBowCurve', 'showMixingBowCurve');
    bindToggle('chkHyper4DSSS', 'showSSSVector');
    bindToggle('chkHyper4DGoethe', 'showGoetheExtension');
    bindToggle('chkHyper4DPalette', 'showPaletteConstellation');

    // Inversión de ratón
    const chkInvX = document.getElementById('chkHyper4DInvertX');
    if (chkInvX) {
      chkInvX.checked = this.camera.invertX;
      chkInvX.addEventListener('change', (e) => {
        this.camera.invertX = e.target.checked;
        localStorage.setItem('gom_hyper4d_invert_x', this.camera.invertX);
        if (this.app?.showToast) {
          this.app.showToast(this.camera.invertX ? 'Eje horizontal X invertido' : 'Eje horizontal X normal', 'info');
        }
      });
    }

    const chkInvY = document.getElementById('chkHyper4DInvertY');
    if (chkInvY) {
      chkInvY.checked = this.camera.invertY;
      chkInvY.addEventListener('change', (e) => {
        this.camera.invertY = e.target.checked;
        localStorage.setItem('gom_hyper4d_invert_y', this.camera.invertY);
        if (this.app?.showToast) {
          this.app.showToast(this.camera.invertY ? 'Eje vertical Y invertido' : 'Eje vertical Y normal', 'info');
        }
      });
    }

    // 10. Pantalla Completa Inmersiva
    const btnFullscreen = document.getElementById('btnHyper4DFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    const btnExitFs = document.getElementById('btnHyper4DExitFullscreen');
    if (btnExitFs) {
      btnExitFs.addEventListener('click', () => this.exitFullscreen());
    }

    const btnToggleSidebar = document.getElementById('btnHyper4DFsToggleSidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => this.toggleSidebar());
    }

    // Atajos de teclado
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }
      const view4D = document.getElementById('viewHyper4D');
      if (!view4D || view4D.style.display === 'none') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'Escape' && this.options.isFullscreen) {
        e.preventDefault();
        this.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.options.isFullscreen) {
        this.exitFullscreen();
      }
    });

    // 11. Pestañas del Panel Lateral
    const subTabs = document.querySelectorAll('.hyper4d-subtab-btn');
    const subPanels = {
      inspect: document.getElementById('hyper4dPanelInspect'),
      composition: document.getElementById('hyper4dPanelComposition'),
      compare: document.getElementById('hyper4dPanelCompare'),
      palette: document.getElementById('hyper4dPanelPalette'),
      masters: document.getElementById('hyper4dPanelMasters')
    };

    subTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.subtab;
        subTabs.forEach(t => t.classList.toggle('active', t === tab));
        Object.keys(subPanels).forEach(k => {
          if (subPanels[k]) subPanels[k].style.display = k === target ? 'block' : 'none';
        });
      });
    });

    // 12. Presets de Maestros
    document.querySelectorAll('.hyper4d-master-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.master;
        this._loadMasterPreset(key);
      });
    });

    // 13. Captura HD & Inspiración
    const btnSnapshot = document.getElementById('btnHyper4DSnapshot');
    if (btnSnapshot) {
      btnSnapshot.addEventListener('click', () => this.exportSnapshot());
    }

    const btnInspire = document.getElementById('btnHyper4DInspirePalette');
    if (btnInspire) {
      btnInspire.addEventListener('click', () => this.generateInspiredPalette());
    }
  }

  setDeploymentMode(modeKey) {
    this.activeDeployment = modeKey;

    document.querySelectorAll('.hyper4d-deploy-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.deploy === modeKey);
    });

    // Mostrar sub-controles contextuales
    const harmonySubBar = document.getElementById('hyper4dHarmonySubBar');
    if (harmonySubBar) {
      harmonySubBar.style.display = modeKey === 'harmonies' ? 'flex' : 'none';
    }

    const rampSubBar = document.getElementById('hyper4dRampSubBar');
    if (rampSubBar) {
      rampSubBar.style.display = modeKey === 'ramp' ? 'flex' : 'none';
    }

    if (this.app?.showToast) {
      const labels = {
        all: 'Modo Sólido Integral 4D',
        harmonies: 'Despliegue de Poliedros de Armonías 4D',
        palette: 'Constelación y Gamut Hull de Paleta',
        ramp: 'Spline 4D Continua de Rampas Tonales',
        gurney: 'Estudio de Luz, Sombra y SSS de James Gurney',
        farges: 'Curva Bow y Mezcla Sustractiva de Farges',
        compare: 'Comparador Multimuestras y Baricentro 4D',
        tesseract: 'Hipercubo Tesseract SO(4)'
      };
      this.app.showToast(labels[modeKey] || 'Modo de Despliegue 4D activado', 'info');
    }

    // Auto-encuadre dinámico para la nueva geometría desplegada
    setTimeout(() => this.frameAll(), 80);
  }

  // --- CONTROL DEL MODO PANTALLA COMPLETA INMERSIVA ---

  toggleFullscreen() {
    if (!this.options.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen() {
    const wrapper = document.getElementById('hyper4dMainWrapper');
    if (!wrapper) return;

    this.options.isFullscreen = true;
    wrapper.classList.add('fullscreen-mode');

    const fsControls = wrapper.querySelector('.hyper4d-fs-floating-controls');
    if (fsControls) fsControls.style.display = 'flex';

    const btnFs = document.getElementById('btnHyper4DFullscreen');
    if (btnFs) btnFs.textContent = '❌ Salir (Esc)';

    if (wrapper.requestFullscreen && !document.fullscreenElement) {
      wrapper.requestFullscreen().catch(() => {});
    }

    setTimeout(() => this._resizeCanvas(), 70);

    if (this.app?.showToast) {
      this.app.showToast('Modo Pantalla Completa Inmersiva 4D activado (F / Esc)', 'info');
    }
  }

  exitFullscreen() {
    const wrapper = document.getElementById('hyper4dMainWrapper');
    if (!wrapper) return;

    this.options.isFullscreen = false;
    wrapper.classList.remove('fullscreen-mode');
    wrapper.classList.remove('sidebar-hidden');

    const fsControls = wrapper.querySelector('.hyper4d-fs-floating-controls');
    if (fsControls) fsControls.style.display = 'none';

    const btnFs = document.getElementById('btnHyper4DFullscreen');
    if (btnFs) btnFs.textContent = '⛶ Pantalla Completa';

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    setTimeout(() => this._resizeCanvas(), 70);
  }

  _bindResizeControls() {
    const stage = document.getElementById('hyper4dStageLayout') || document.querySelector('.hyper4d-stage-layout');
    const container = document.getElementById('hyper4dCanvasContainer');
    const grip = document.getElementById('hyper4dResizeGrip');
    const splitter = document.getElementById('hyper4dSplitter');
    const btnToggle = document.getElementById('btnHyper4DToggleSidebar');

    // 1. Restaurar preferencias guardadas
    try {
      const savedH = localStorage.getItem('gom_hyper4d_height');
      if (savedH && stage && container) {
        const hVal = parseInt(savedH, 10);
        if (hVal >= 380 && hVal <= 1400) {
          stage.style.setProperty('--hyper4d-canvas-h', `${hVal}px`);
        }
      }
      const savedW = localStorage.getItem('gom_hyper4d_sidebar_w');
      if (savedW && stage) {
        const wVal = parseInt(savedW, 10);
        if (wVal >= 250 && wVal <= 700) {
          stage.style.setProperty('--hyper4d-sidebar-w', `${wVal}px`);
        }
      }
      if (localStorage.getItem('gom_hyper4d_sidebar_hidden') === '1') {
        this.options.isSidebarHidden = false; // para que toggleSidebar lo active a true
        this.toggleSidebar();
      }
    } catch (_) {}

    // 2. Botón Visor Amplio (Toolbar)
    if (btnToggle) {
      btnToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // 3. Arrastre Vertical de Altura (Grip)
    if (grip && stage && container) {
      let isDraggingGrip = false;
      let startY = 0;
      let startH = 0;

      const onGripMove = (e) => {
        if (!isDraggingGrip) return;
        const delta = e.clientY - startY;
        const maxH = Math.max(700, window.innerHeight - 80);
        const newH = Math.max(380, Math.min(maxH, Math.round(startH + delta)));
        stage.style.setProperty('--hyper4d-canvas-h', `${newH}px`);
        this._resizeCanvas();
      };

      const onGripUp = () => {
        if (!isDraggingGrip) return;
        isDraggingGrip = false;
        grip.classList.remove('active-dragging');
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onGripMove);
        window.removeEventListener('mouseup', onGripUp);
        try {
          const curH = parseInt(stage.style.getPropertyValue('--hyper4d-canvas-h'), 10) || container.clientHeight;
          localStorage.setItem('gom_hyper4d_height', curH);
        } catch (_) {}
      };

      grip.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDraggingGrip = true;
        startY = e.clientY;
        startH = container.getBoundingClientRect().height;
        grip.classList.add('active-dragging');
        document.body.style.cursor = 'row-resize';
        window.addEventListener('mousemove', onGripMove);
        window.addEventListener('mouseup', onGripUp);
      });
    }

    // 4. Arrastre Horizontal Lateral (Splitter entre Canvas e Inspector)
    if (splitter && stage) {
      let isDraggingSplitter = false;
      let startX = 0;
      let startW = 0;

      const onSplitterMove = (e) => {
        if (!isDraggingSplitter) return;
        const deltaX = e.clientX - startX;
        const newW = Math.max(260, Math.min(650, Math.round(startW - deltaX)));
        stage.style.setProperty('--hyper4d-sidebar-w', `${newW}px`);
        this._resizeCanvas();
      };

      const onSplitterUp = () => {
        if (!isDraggingSplitter) return;
        isDraggingSplitter = false;
        splitter.classList.remove('active-dragging');
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onSplitterMove);
        window.removeEventListener('mouseup', onSplitterUp);
        try {
          const curW = parseInt(stage.style.getPropertyValue('--hyper4d-sidebar-w'), 10);
          if (curW) localStorage.setItem('gom_hyper4d_sidebar_w', curW);
        } catch (_) {}
      };

      splitter.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDraggingSplitter = true;
        startX = e.clientX;
        const sidebar = document.getElementById('hyper4dSidebarPanel');
        startW = sidebar ? sidebar.getBoundingClientRect().width : 380;
        splitter.classList.add('active-dragging');
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', onSplitterMove);
        window.addEventListener('mouseup', onSplitterUp);
      });
    }

    // 5. Setup ResizeObserver para respuesta inmediata a cualquier cambio en DOM
    if (window.ResizeObserver && container) {
      this._resizeObserver = new ResizeObserver(() => {
        if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
        this._resizeRaf = requestAnimationFrame(() => {
          this._resizeCanvas();
        });
      });
      this._resizeObserver.observe(container);
      if (stage) this._resizeObserver.observe(stage);
      const view4D = document.getElementById('viewHyper4D');
      if (view4D) this._resizeObserver.observe(view4D);
    }
  }

  toggleSidebar() {
    const wrapper = document.getElementById('hyper4dMainWrapper');
    const stage = document.getElementById('hyper4dStageLayout') || document.querySelector('.hyper4d-stage-layout');
    if (!wrapper && !stage) return;

    this.options.isSidebarHidden = !this.options.isSidebarHidden;
    if (wrapper) wrapper.classList.toggle('sidebar-hidden', this.options.isSidebarHidden);
    if (stage) stage.classList.toggle('inspector-hidden', this.options.isSidebarHidden);

    const btnMain = document.getElementById('btnHyper4DToggleSidebar');
    if (btnMain) {
      btnMain.innerHTML = this.options.isSidebarHidden ? '📑 Mostrar Inspector' : '↔️ Visor Amplio';
      btnMain.classList.toggle('active', this.options.isSidebarHidden);
    }

    const btnFs = document.getElementById('btnHyper4DFsToggleSidebar');
    if (btnFs) {
      const txtSpan = btnFs.querySelector('.fs-btn-txt');
      if (txtSpan) txtSpan.textContent = this.options.isSidebarHidden ? 'Mostrar Panel' : 'Ocultar Panel';
    }

    try {
      localStorage.setItem('gom_hyper4d_sidebar_hidden', this.options.isSidebarHidden ? '1' : '0');
    } catch (_) {}

    requestAnimationFrame(() => this._resizeCanvas());
    setTimeout(() => this._resizeCanvas(), 80);
    setTimeout(() => this._resizeCanvas(), 250);
  }

  // --- MÉTODOS DE ANÁLISIS DE TEORÍA DEL COLOR (FARGES, GOETHE, ITTEN, GURNEY) ---

  getFargesInherentValue(rgb) {
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    const valueStep = Math.max(1, Math.min(9, Math.round(lum * 8 + 1)));

    const valueNames = {
      9: { label: 'High Light (Paso 9)', pigment: 'Blanco de Titanio (PW6)', leeway: 'Máximo valor. Solo admite oscurecimiento; cualquier adición de blanco no altera su valor.' },
      8: { label: 'Light (Paso 8)', pigment: 'Amarillo Limón / Amarillo Cadmio (PY35)', leeway: 'Valor intrínseco alto. Soporta muy poco blanco antes de lavarse y quedar lechoso.' },
      7: { label: 'Low Light (Paso 7)', pigment: 'Amarillo Ocre aclarado / Nápoles', leeway: 'Excelente para transiciones luminosas y medias tintas de luz cálida.' },
      6: { label: 'Medium Light (Paso 6)', pigment: 'Ocre Amarillo (PY43) / Naranja Cadmio (PO20)', leeway: 'Pivote clásico de medias tintas en retratos y naturalezas muertas.' },
      5: { label: 'Middle Value (Paso 5)', pigment: 'Tono Medio Clave / 50% Gris Neutral', leeway: 'Punto de equilibrio del claroscuro. Separa rigurosamente la masa de luz de la masa de sombra.' },
      4: { label: 'High Dark (Paso 4)', pigment: 'Rojo Cadmio Medio (PR108) / Bermellón', leeway: 'Valor medio-oscuro denso. Admite aclarado moderado hacia luz o bajada hacia sombra profunda.' },
      3: { label: 'Dark (Paso 3)', pigment: 'Carmín de Alizarina (PR177) / Viridián (PG18)', leeway: 'Excelente para sombras ricas y transparentes de alto croma sin usar negro plano.' },
      2: { label: 'Low Dark (Paso 2)', pigment: 'Azul Ultramar (PB29) / Sombra Tostada (PBr7)', leeway: 'Casi el valor más oscuro de la paleta. Ideal para oscurecer mezclas sin ensuciarlas.' },
      1: { label: 'Darkest (Paso 1)', pigment: 'Negro Marfil (PBk9) / Negro Humo', leeway: 'Máxima profundidad acromática. En óleo se aconseja templar con siena o ultramar para dar aire.' }
    };

    return {
      step: valueStep,
      lum: Math.round(lum * 100),
      info: valueNames[valueStep]
    };
  }

  getFargesHueBias(hue) {
    if (hue >= 35 && hue < 80) {
      if (hue >= 56) {
        return {
          bias: 'Amarillo Frío (Sesgo Verde)',
          pigmentRef: 'Amarillo Limón Cadmio (PY35)',
          advice: 'Ideal para mezclar verdes limpios, luminosos y vibrantes con ftalo o viridián. Si se mezcla con rojos, produce naranjas ligeramente apagados.'
        };
      } else {
        return {
          bias: 'Amarillo Cálido (Sesgo Rojo/Dorado)',
          pigmentRef: 'Amarillo Cadmio Medio (PY35)',
          advice: 'Ideal para naranjas brillantes, encarnados y tierras doradas. Si se mezcla con azules da verdes oliva quebrados (el clásico fenómeno amarillo+negro de Farges).'
        };
      }
    } else if (hue >= 330 || hue < 35) {
      if (hue >= 330 || hue < 10) {
        return {
          bias: 'Rojo Frío (Sesgo Azul / Magenta)',
          pigmentRef: 'Carmín de Alizarina (PR177) / Rosa Quinacridona (PV19)',
          advice: 'El auténtico primario frío para violetas y púrpuras limpios al mezclarse con azul ultramar. Si se mezcla con amarillo da naranjas terrosos.'
        };
      } else {
        return {
          bias: 'Rojo Cálido (Sesgo Amarillo / Naranja)',
          pigmentRef: 'Rojo Cadmio Claro / Bermellón (PR108)',
          advice: 'Produce naranjas ardientes con amarillo cadmio. Si se mezcla con ultramar produce marrones o grises quebrados por contener las 3 componentes primarias.'
        };
      }
    } else if (hue >= 180 && hue < 270) {
      if (hue >= 225) {
        return {
          bias: 'Azul Cálido (Sesgo Rojo / Violeta)',
          pigmentRef: 'Azul Ultramar Francés (PB29)',
          advice: 'Cálido dentro de los azules. Produce violetas resonantes con carmín. Con amarillo produce verdes oliva apagados por su componente rojiza inherente.'
        };
      } else {
        return {
          bias: 'Azul Frío (Sesgo Verde / Cian)',
          pigmentRef: 'Azul Cobalto (PB28) / Azul Ftalo (PB15:3)',
          advice: 'El primario frío perfecto para cielos, atmósfera y mezclas de verde de máxima luminosidad y pureza.'
        };
      }
    } else if (hue >= 80 && hue < 180) {
      return {
        bias: hue < 130 ? 'Verde Cálido (Sesgo Amarillo / Oliva)' : 'Verde Frío (Sesgo Azul / Viridián)',
        pigmentRef: hue < 130 ? 'Tierra Verde / Verde Oliva' : 'Viridián (PG18) / Ftalo (PG7)',
        advice: hue < 130 ? 'Verde orgánico natural de vegetación soleada.' : 'Verde de veladura profunda para sombras frías y atmósfera acuática.'
      };
    } else {
      return {
        bias: 'Violeta / Púrpura (Secundario Resonante)',
        pigmentRef: 'Violeta Dioxacina (PV23) / Azul Ultramar + Carmín',
        advice: 'Máxima potencia para quebrar amarillos y crear sombras cromáticas según la técnica de Sorolla.'
      };
    }
  }

  getMatchingFineArtPigments(rgb) {
    if (!FlorentFargesEngine || !FlorentFargesEngine.PIGMENTS) return [];
    const distances = FlorentFargesEngine.PIGMENTS.map(p => {
      const d = Math.hypot(rgb.r - p.rgb.r, rgb.g - p.rgb.g, rgb.b - p.rgb.b);
      return { pigment: p, dist: d };
    });
    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, 3).map(item => item.pigment);
  }

  getFleshZoneAffinity(rgb) {
    if (!FlorentFargesEngine || !FlorentFargesEngine.FLESH_ZONES) return null;
    let closestZone = null;
    let minDist = Infinity;
    FlorentFargesEngine.FLESH_ZONES.forEach(zone => {
      const d = Math.hypot(rgb.r - zone.rgb.r, rgb.g - zone.rgb.g, rgb.b - zone.rgb.b);
      if (d < minDist) {
        minDist = d;
        closestZone = zone;
      }
    });

    if (minDist > 160) {
      return {
        isFleshTone: false,
        note: 'Tono no carnal directo: Ideal para vestiduras, fondos, atmósfera o acentos focales complementarios.'
      };
    }

    return {
      isFleshTone: true,
      zone: closestZone,
      distance: Math.round(minDist)
    };
  }

  getGoetheHarmonicProportion(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    let goetheWeight = 6;
    let colorName = 'Neutro / Tierra';

    if (hsv.s < 0.15) {
      goetheWeight = lum > 0.6 ? 8 : (lum < 0.3 ? 3 : 5);
      colorName = 'Gris Acromático';
    } else if (hsv.h >= 45 && hsv.h < 75) {
      goetheWeight = 9;
      colorName = 'Amarillo (Fuerza Lumínica Máxima)';
    } else if (hsv.h >= 20 && hsv.h < 45) {
      goetheWeight = 8;
      colorName = 'Naranja';
    } else if (hsv.h >= 340 || hsv.h < 20) {
      goetheWeight = 6;
      colorName = 'Rojo';
    } else if (hsv.h >= 75 && hsv.h < 170) {
      goetheWeight = 6;
      colorName = 'Verde';
    } else if (hsv.h >= 170 && hsv.h < 260) {
      goetheWeight = 4;
      colorName = 'Azul';
    } else {
      goetheWeight = 3;
      colorName = 'Violeta / Púrpura (Luz Sombría)';
    }

    const areaPct = ((11 - goetheWeight) / 24) * 100;

    return {
      colorName,
      goetheWeight,
      suggestedAreaPct: Math.max(10, Math.min(65, areaPct)),
      ratioRule: goetheWeight >= 8 ? 'Usar en áreas pequeñas y acentos (1:3 contra tonos oscuros).' : (goetheWeight <= 4 ? 'Usar en grandes masas de descanso o fondo (3:1 contra luces).' : 'Superficie equilibrada (1:1 con su par complementario).')
    };
  }

  getIttenDominantContrast(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;

    if (lum > 0.82 || lum < 0.18) {
      return {
        name: 'Contraste de Claro-Oscuro (Luminosidad)',
        desc: `Esta muestra explota el valor extremo (${lum > 0.82 ? 'Luz Alta' : 'Sombra Profunda'}). Su poder compositivo radica en jerarquizar la silueta y recortar figuras sobre el fondo.`
      };
    } else if (hsv.s > 0.75) {
      return {
        name: 'Contraste de Calidad (Saturación Pura vs Neutro)',
        desc: 'Saturación muy alta. Funciona como imán visual. Si se rodea de tierras o grises apagados, su intensidad resplandecerá sin necesitar contrastes de valor bruscos.'
      };
    } else if (hsv.s < 0.25) {
      return {
        name: 'Contraste de Modulación Atmosférica (Gris Cromático)',
        desc: 'Tono desaturado y noble. Sirve de amortiguador de la paleta para que los colores vivos de la composición no compitan entre sí.'
      };
    } else if (isWarm) {
      return {
        name: 'Contraste Térmico (Cálido Adelantado)',
        desc: 'Psicológicamente los tonos cálidos avanzan hacia el espectador. Ideal para primeros planos, volumen iluminado o áreas de calidez emocional.'
      };
    } else {
      return {
        name: 'Contraste Térmico (Frío Recesivo)',
        desc: 'Los tonos fríos retroceden visualmente en el espacio, generando sensación de lejanía, aire, perspectiva atmosférica y serenidad.'
      };
    }
  }

  getGurneyLightingAnalysis(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;

    let lightSource = 'Luz Natural Equilibrada (5500K)';
    let atmosphereMood = 'Atmósfera Neutra de Estudio';
    if (isWarm && hsv.s > 0.4) {
      lightSource = 'Luz Solar Dorada (Golden Hour ~3200K) o Fuego/Vela';
      atmosphereMood = 'Cálida, envolvente, con sombras azules complementarias';
    } else if (!isWarm && hsv.s > 0.3) {
      lightSource = 'Luz Difusa de Ventana Norte / Domo Celeste (6500K - 8500K)';
      atmosphereMood = 'Fresco, diáfano, sombras templadas por rebote del suelo';
    }

    return {
      lightSource,
      atmosphereMood,
      sssFactor: (hsv.s * 0.6 + (isWarm ? 0.4 : 0.1)).toFixed(2)
    };
  }

  getCompositionRole(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    if (hsv.s > 0.7 && hsv.v > 0.6) {
      return {
        role: 'Protagonista / Foco Focal Primario (Punto Focal)',
        desc: 'Atrae la mirada al instante. Debe usarse con moderación en el centro de interés para no saturar la lectura.'
      };
    } else if (hsv.s >= 0.3 && hsv.v >= 0.35) {
      return {
        role: 'Mediatinta Estructural / Transición (Halftone)',
        desc: 'Modela el volumen y la forma entre la luz plena y la penumbra. Ocupa la mayor superficie informativa del objeto.'
      };
    } else {
      return {
        role: 'Fondo / Clima Atmosférico / Masa de Reposo',
        desc: 'Proporciona descanso al ojo del espectador y sostiene la jerarquía de los acentos vivos.'
      };
    }
  }

  _updateWDisplayLabel() {
    const labelEl = document.getElementById('hyper4dWLabel');
    if (!labelEl) return;

    const val = Math.round(this.dimension4D.wValue);
    if (this.dimension4D.wMode === 'thermal') {
      const kelvin = Math.round(5500 + val * 40);
      labelEl.textContent = `T° Luz: ${kelvin}K (${val > 15 ? 'Cálido Solar' : (val < -15 ? 'Sombra Azul' : 'Blanco Neutro')})`;
    } else if (this.dimension4D.wMode === 'subtractive') {
      labelEl.textContent = `Pigmento: ${val > 0 ? `+${val}% Blanco Titanio (Tint)` : `${val}% Sombra Tostada`}`;
    } else if (this.dimension4D.wMode === 'tesseract') {
      labelEl.textContent = `Hiper-Ángulo: ${(this.dimension4D.angleXW * 180 / Math.PI).toFixed(0)}° (Plano XW)`;
    } else if (this.dimension4D.wMode === 'diurnal') {
      labelEl.textContent = `Ciclo Solar: ${val > 30 ? 'Mediodía Cenital' : (val < -30 ? 'Crepúsculo / Atardecer' : 'Luz Difusa')}`;
    }
  }

  // --- SINCRONIZACIÓN CON EL ESTUDIO GLOBAL ---

  updateActiveColor(rgb) {
    this.syncWithActiveColor(rgb);
  }

  syncWithActivePalette() {
    this._updateComparisonPanel();
  }

  setHarmonyRule(ruleId) {
    this.activeHarmonyRule = ruleId;
    const harmSelect4D = document.getElementById('hyper4dHarmonyRuleSelect');
    if (harmSelect4D && harmSelect4D.value !== ruleId) {
      harmSelect4D.value = ruleId;
    }
  }

  syncWithActiveColor(rgb = null) {
    const curRgb = rgb || (this.app?.activeWell === 'bg' ? this.app?.bgColor : this.app?.fgColor) || { r: 99, g: 102, b: 241 };
    this.activeColor = curRgb;
    const hex = ColorMath.rgbToHex(curRgb.r, curRgb.g, curRgb.b);
    const munsell = MunsellSystem.rgbToMunsell(curRgb.r, curRgb.g, curRgb.b);
    const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;

    if (this.autoSyncWheel && this.compareSlots && this.compareSlots.length > 0) {
      const targetSlot = this.compareSlots.find(s => s.id === this.activeTargetSlotId) || this.compareSlots[0];
      if (targetSlot) {
        targetSlot.hex = hex;
        targetSlot.rgb = curRgb;
        this._updateSlotCardDOM(targetSlot.id);
        this._updateComparisonPanel();
      }
    }

    const swatchEl = document.getElementById('hyper4dActiveSwatch');
    if (swatchEl) swatchEl.style.backgroundColor = hex;

    const hexEl = document.getElementById('hyper4dActiveHex');
    if (hexEl) hexEl.textContent = hex;

    const munsellEl = document.getElementById('hyper4dActiveMunsell');
    if (munsellEl) munsellEl.textContent = munsell.notation;

    const coordsEl = document.getElementById('hyper4dActiveCoords');
    if (coordsEl) {
      coordsEl.textContent = `H:${Math.round(hsv.h)}° S:${Math.round(hsv.s * 100)}% V:${Math.round(hsv.v * 100)}% | ${isWarm ? 'Cálido' : 'Frío'}`;
    }

    // 1. Escala de Valor Inherente (Farges 1-9)
    const inherentVal = this.getFargesInherentValue(curRgb);
    const inherentBox = document.getElementById('hyper4dInherentValueBox');
    if (inherentBox) {
      const scaleSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(step => {
        const lumVal = Math.round(((step - 1) / 8) * 255);
        const bgHex = ColorMath.rgbToHex(lumVal, lumVal, lumVal);
        const isActive = step === inherentVal.step;
        return `<div class="hyper4d-val-step ${isActive ? 'active' : ''}" style="background-color: ${bgHex}; color: ${step > 5 ? '#000' : '#FFF'};">${step}</div>`;
      }).join('');

      inherentBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #FBBF24;">${inherentVal.info.label}</strong>
          <span style="font-size: 0.68rem; color: #94A3B8;">Luminancia: ${inherentVal.lum}%</span>
        </div>
        <div class="hyper4d-val-scale-strip">${scaleSteps}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">
          <strong>Referencia:</strong> ${inherentVal.info.pigment}.<br>
          <em>${inherentVal.info.leeway}</em>
        </div>
      `;
    }

    // 2. Sesgo de Matiz (Hue Bias) & Regla de Farges
    const biasInfo = this.getFargesHueBias(hsv.h);
    const biasBox = document.getElementById('hyper4dHueBiasBox');
    if (biasBox) {
      biasBox.innerHTML = `
        <div style="margin-bottom: 4px;">
          <span class="hyper4d-badge-sub" style="background: rgba(99, 102, 241, 0.25); color: #C7D2FE;">${biasInfo.bias}</span>
          <span style="font-size: 0.7rem; color: #94A3B8;">Ref: ${biasInfo.pigmentRef}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">${biasInfo.advice}</div>
      `;
    }

    // 3. Pigmentos Reales Afines de Atelier
    const matchingPigments = this.getMatchingFineArtPigments(curRgb);
    const pigmentsBox = document.getElementById('hyper4dMatchingPigmentsBox');
    if (pigmentsBox && matchingPigments.length > 0) {
      pigmentsBox.innerHTML = matchingPigments.map(p => `
        <div class="hyper4d-pigment-row">
          <div class="hyper4d-pigment-chip" style="background-color: ${p.hex};"></div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="color: #FFFFFF; font-size: 0.71rem;">${p.name}</strong>
              <span style="font-family: var(--font-mono); font-size: 0.68rem; color: #38BDF8;">${p.ci}</span>
            </div>
            <div style="font-size: 0.66rem; color: var(--text-muted); display: flex; gap: 6px;">
              <span>Valor: ${p.inherentValue}/9</span> • 
              <span>${p.opacity}</span> • 
              <span>Fuerza tinte: ${p.tintingStrength}/10</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // 4. Afinidad con Carnaciones de Farges
    const fleshInfo = this.getFleshZoneAffinity(curRgb);
    const fleshBox = document.getElementById('hyper4dFleshZoneBox');
    if (fleshBox && fleshInfo) {
      if (fleshInfo.isFleshTone) {
        fleshBox.innerHTML = `
          <div style="margin-bottom: 3px;">
            <strong style="color: #F472B6;">${fleshInfo.zone.title}</strong>
          </div>
          <div style="font-size: 0.69rem; color: var(--text-muted); margin-bottom: 4px;">
            ${fleshInfo.zone.anatomical}
          </div>
          <div style="font-size: 0.68rem; color: #38BDF8;">
            <strong>Fórmula Farges:</strong> ${fleshInfo.zone.recipe}
          </div>
        `;
      } else {
        fleshBox.innerHTML = `<div style="font-size: 0.7rem; color: var(--text-muted);">${fleshInfo.note}</div>`;
      }
    }

    // 5. Composición: Extensión de Goethe
    const goetheInfo = this.getGoetheHarmonicProportion(curRgb);
    const goetheBox = document.getElementById('hyper4dGoetheBox');
    if (goetheBox) {
      goetheBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #FFFFFF;">${goetheInfo.colorName}</strong>
          <span style="font-family: var(--font-mono); color: #FBBF24;">Fuerza: ${goetheInfo.goetheWeight}/9</span>
        </div>
        <div class="hyper4d-goethe-meter">
          <div style="display: flex; justify-content: space-between; font-size: 0.68rem;">
            <span>Área Recomendada en Lienzo:</span>
            <strong style="color: #38BDF8;">${goetheInfo.suggestedAreaPct.toFixed(0)}% del cuadro</strong>
          </div>
          <div class="hyper4d-goethe-bar-bg">
            <div class="hyper4d-goethe-bar-fill" style="width: ${goetheInfo.suggestedAreaPct}%;"></div>
          </div>
          <div style="font-size: 0.68rem; color: var(--text-muted);">${goetheInfo.ratioRule}</div>
        </div>
      `;
    }

    // 6. Composición: Contrastes de Itten
    const ittenInfo = this.getIttenDominantContrast(curRgb);
    const ittenBox = document.getElementById('hyper4dIttenBox');
    if (ittenBox) {
      ittenBox.innerHTML = `
        <div style="margin-bottom: 4px;">
          <strong style="color: #A78BFA;">${ittenInfo.name}</strong>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">${ittenInfo.desc}</div>
      `;
    }

    // 7. Iluminación y SSS de James Gurney
    const gurneyInfo = this.getGurneyLightingAnalysis(curRgb);
    const gurneyBox = document.getElementById('hyper4dGurneyBox');
    if (gurneyBox) {
      gurneyBox.innerHTML = `
        <div style="margin-bottom: 3px;">
          <span style="color: #F59E0B; font-weight: 700;">Fuente de Luz Óptima:</span>
          <span>${gurneyInfo.lightSource}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">
          <strong>Clima de Escena:</strong> ${gurneyInfo.atmosphereMood}
        </div>
        <div style="font-size: 0.69rem; color: #EC4899;">
          <strong>Factor SSS (Dispersión Subcutánea):</strong> ${gurneyInfo.sssFactor} (Intensidad de color vivo en el terminador de sombra).
        </div>
      `;
    }

    // 8. Rol Compositivo
    const roleInfo = this.getCompositionRole(curRgb);
    const roleBox = document.getElementById('hyper4dCompositionRoleBox');
    if (roleBox) {
      roleBox.innerHTML = `
        <div style="margin-bottom: 3px;">
          <strong style="color: #34D399;">${roleInfo.role}</strong>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">${roleInfo.desc}</div>
      `;
    }

    // 9. Actualizar datos del Comparador
    this._updateComparisonPanel();

    // 10. Reporte de Cobertura de Paleta
    const coverageReport = document.getElementById('hyper4dPaletteCoverageReport');
    if (coverageReport && this.app?.swatchManager) {
      const activePal = this.app.swatchManager.getActivePalette();
      if (activePal && Array.isArray(activePal.colors) && activePal.colors.length > 0) {
        const count = activePal.colors.length;
        coverageReport.innerHTML = `
          <div style="color: #38BDF8; font-weight: 600; margin-bottom: 2px;">Paleta activa: "${activePal.name}" (${count} muestras)</div>
          <div style="color: var(--text-muted);">Constelación desplegada en 4D con cálculo de límites cromáticos y balance de valores.</div>
        `;
      } else {
        coverageReport.innerHTML = `<span style="color: var(--text-muted);">Selecciona o crea una paleta en la pestaña Bibliotecas para proyectar su volumen.</span>`;
      }
    }
  }

  // --- MOTOR DE COMPARACIÓN MULTIMUESTRAS DINÁMICO ---

  _calculateMultiPhysicalMix(rgbList) {
    if (!rgbList || rgbList.length === 0) return { r: 128, g: 128, b: 128 };
    if (rgbList.length === 1) return { ...rgbList[0] };

    let accum = { ...rgbList[0] };
    for (let i = 1; i < rgbList.length; i++) {
      const weight = 1 / (i + 1);
      accum = ColorMath.mixRyb(accum, rgbList[i], weight);
    }
    return accum;
  }

  _bindCompareControls() {
    const btnAdd = document.getElementById('btnHyper4DAddCompareSlot');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.addCompareSlot());
    }

    const btnPal = document.getElementById('btnHyper4DLoadActivePalette');
    if (btnPal) {
      btnPal.addEventListener('click', () => this.loadActivePaletteIntoSlots());
    }

    const btnFgBg = document.getElementById('btnHyper4DLoadFgBg');
    if (btnFgBg) {
      btnFgBg.addEventListener('click', () => this.loadFgBgIntoSlots());
    }

    const chkSync = document.getElementById('chkHyper4DAutoSyncSlotA');
    if (chkSync) {
      chkSync.checked = this.autoSyncWheel;
      chkSync.addEventListener('change', (e) => {
        this.autoSyncWheel = e.target.checked;
        if (this.app?.showToast) {
          this.app.showToast(this.autoSyncWheel ? 'Sincronización de Rueda activada' : 'Sincronización de Rueda pausada', 'info');
        }
      });
    }

    const selTarget = document.getElementById('hyper4dWheelTargetSelect');
    if (selTarget) {
      selTarget.addEventListener('change', (e) => {
        this.setActiveTargetSlot(e.target.value);
      });
    }

    const viewButtons = document.querySelectorAll('.hyper4d-comp-view-btn');
    const subViews = {
      metrics: document.getElementById('hyper4dCompViewMetrics'),
      composition: document.getElementById('hyper4dCompViewComposition'),
      mix: document.getElementById('hyper4dCompViewMix')
    };

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewKey = btn.dataset.view;
        this.activeCompareSubView = viewKey;
        viewButtons.forEach(b => b.classList.toggle('active-toggle', b === btn));
        Object.keys(subViews).forEach(k => {
          if (subViews[k]) subViews[k].style.display = k === viewKey ? 'flex' : 'none';
        });
      });
    });
  }

  _isValidHex(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{4}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(clean);
  }

  setActiveTargetSlot(slotId, { loadIntoWheel = false } = {}) {
    const slot = this.compareSlots.find(s => s.id === slotId);
    if (!slot) return;

    this.activeTargetSlotId = slotId;

    document.querySelectorAll('.hyper4d-compare-slot-card').forEach(card => {
      const isTarget = card.dataset.slotId === slotId;
      card.classList.toggle('slot-is-target', isTarget);
      const targetBadge = card.querySelector('.hyper4d-slot-target-badge');
      if (targetBadge) {
        targetBadge.style.display = isTarget ? 'inline-block' : 'none';
      }
    });

    const select = document.getElementById('hyper4dWheelTargetSelect');
    if (select && select.value !== slotId) {
      select.value = slotId;
    }

    document.querySelectorAll('.hyper4d-assign-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.slot === slotId);
    });

    if (loadIntoWheel && this.app) {
      this.app.setColorDirectly(slot.rgb);
    }
  }

  assignCurrentColorToSlot(slotId, source = 'fg') {
    let sourceRgb;
    let sourceName;
    if (source === 'bg') {
      sourceRgb = this.app?.bgColor || { r: 245, g: 158, b: 11 };
      sourceName = 'Fondo (BG)';
    } else {
      sourceRgb = this.app?.fgColor || { r: 99, g: 102, b: 241 };
      sourceName = 'Frontal (FG)';
    }

    const hex = ColorMath.rgbToHex(sourceRgb.r, sourceRgb.g, sourceRgb.b).toUpperCase();
    this.updateSlotColor(slotId, hex, { reRender: false });
    this.setActiveTargetSlot(slotId);

    if (this.app?.showToast) {
      this.app.showToast(`Color ${hex} (${sourceName}) asignado a Muestra [${slotId}]`, 'success');
    }
  }

  renderQuickAssignBar() {
    const container = document.getElementById('hyper4dQuickAssignSlotsContainer');
    const select = document.getElementById('hyper4dWheelTargetSelect');

    if (container) {
      container.innerHTML = this.compareSlots.map(slot => `
        <button type="button" class="hyper4d-assign-btn ${slot.id === this.activeTargetSlotId ? 'active' : ''}" data-slot="${slot.id}" data-slot-id="${slot.id}" title="Click: Asignar FG actual a [${slot.id}] | Alt+Click: Asignar BG">
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${slot.hex}; vertical-align:middle; border:1px solid rgba(255,255,255,0.6);"></span>
          <span>[${slot.id}]</span>
        </button>
      `).join('');

      container.querySelectorAll('.hyper4d-assign-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const slotId = btn.dataset.slot || btn.dataset.slotId;
          const source = e.altKey ? 'bg' : 'fg';
          this.assignCurrentColorToSlot(slotId, source);
        });
      });
    }

    if (select) {
      select.innerHTML = this.compareSlots.map(slot => `
        <option value="${slot.id}" ${slot.id === this.activeTargetSlotId ? 'selected' : ''}>[${slot.id}] ${slot.name}</option>
      `).join('');
    }
  }

  _updateSlotCardDOM(slotId) {
    const slot = this.compareSlots.find(s => s.id === slotId);
    if (!slot) return;

    const card = document.querySelector(`.hyper4d-compare-slot-card[data-slot-id="${slotId}"]`);
    if (card) {
      const swatch = card.querySelector('.hyper4d-slot-swatch');
      if (swatch) swatch.style.backgroundColor = slot.hex;

      const picker = card.querySelector('.hyper4d-slot-color-picker');
      if (picker && picker.value.toUpperCase() !== slot.hex.toUpperCase()) {
        picker.value = slot.hex;
      }

      const input = card.querySelector('.hyper4d-slot-hex-input');
      if (input && document.activeElement !== input) {
        input.value = slot.hex;
      }
    }

    const assignBtnDot = document.querySelector(`.hyper4d-assign-btn[data-slot="${slotId}"] span`);
    if (assignBtnDot) {
      assignBtnDot.style.background = slot.hex;
    }
  }

  addCompareSlot(customHex = null, customName = null) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    if (this.compareSlots.length >= 8) {
      if (this.app?.showToast) this.app.showToast('Máximo 8 muestras en comparativa simultánea', 'warning');
      return;
    }

    const usedLetters = this.compareSlots.map(s => s.id);
    const nextLetter = letters.find(l => !usedLetters.includes(l)) || `S${this.compareSlots.length + 1}`;

    let hex = customHex;
    if (!hex) {
      const baseRgb = this.compareSlots[this.compareSlots.length - 1]?.rgb || { r: 99, g: 102, b: 241 };
      const hsv = ColorMath.rgbToHsv(baseRgb.r, baseRgb.g, baseRgb.b);
      const stepHue = (hsv.h + 137.5) % 360;
      const newRgb = ColorMath.hsvToRgb(stepHue, Math.max(0.45, hsv.s), Math.max(0.65, hsv.v));
      hex = ColorMath.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    }
    const rgb = ColorMath.hexToRgb(hex);

    const newSlot = {
      id: nextLetter,
      name: customName || `Muestra ${nextLetter}`,
      hex: hex.toUpperCase(),
      rgb: rgb,
      active: true
    };

    this.compareSlots.push(newSlot);
    this.activeTargetSlotId = nextLetter;
    this.renderCompareSlots();
    this._updateComparisonPanel();

    if (this.app?.showToast) {
      this.app.showToast(`Muestra [${nextLetter}] añadida a la comparativa 4D`, 'success');
    }
  }

  removeCompareSlot(slotId) {
    if (this.compareSlots.length <= 2) {
      if (this.app?.showToast) this.app.showToast('Se requieren al menos 2 muestras para comparar', 'warning');
      return;
    }

    const idx = this.compareSlots.findIndex(s => s.id === slotId);
    if (idx !== -1) {
      const removed = this.compareSlots.splice(idx, 1)[0];
      if (this.activeTargetSlotId === slotId) {
        this.activeTargetSlotId = this.compareSlots[0].id;
      }
      this.renderCompareSlots();
      this._updateComparisonPanel();
      if (this.app?.showToast) {
        this.app.showToast(`Muestra [${removed.id}] eliminada`, 'info');
      }
    }
  }

  updateSlotColor(slotId, newHex, { reRender = false } = {}) {
    const slot = this.compareSlots.find(s => s.id === slotId);
    if (!slot) return;

    if (!this._isValidHex(newHex)) return;
    const cleanHex = (newHex.startsWith('#') ? newHex : '#' + newHex).toUpperCase();
    slot.hex = cleanHex;
    slot.rgb = ColorMath.hexToRgb(cleanHex);

    if (reRender) {
      this.renderCompareSlots();
    } else {
      this._updateSlotCardDOM(slotId);
      this.renderQuickAssignBar();
    }
    this._updateComparisonPanel();
  }

  loadActivePaletteIntoSlots() {
    let colors = [];
    if (this.app?.swatchManager) {
      const pal = this.app.swatchManager.getActivePalette();
      if (pal && Array.isArray(pal.colors) && pal.colors.length >= 2) {
        colors = pal.colors;
      }
    }

    if (colors.length < 2) {
      if (this.app?.showToast) this.app.showToast('La paleta activa debe contener al menos 2 colores', 'warning');
      return;
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const maxToLoad = Math.min(8, colors.length);
    this.compareSlots = [];

    for (let i = 0; i < maxToLoad; i++) {
      const hex = colors[i].toUpperCase();
      const rgb = ColorMath.hexToRgb(hex);
      this.compareSlots.push({
        id: letters[i] || `S${i+1}`,
        name: `Color ${i+1}`,
        hex: hex,
        rgb: rgb,
        active: true
      });
    }

    this.activeTargetSlotId = this.compareSlots[0].id;
    this.renderCompareSlots();
    this._updateComparisonPanel();

    if (this.app?.showToast) {
      this.app.showToast(`${this.compareSlots.length} muestras de la paleta cargadas en el Comparador`, 'success');
    }
  }

  loadFgBgIntoSlots() {
    const fg = this.app?.fgColor || { r: 99, g: 102, b: 241 };
    const bg = this.app?.bgColor || { r: 245, g: 158, b: 11 };
    const fgHex = ColorMath.rgbToHex(fg.r, fg.g, fg.b).toUpperCase();
    const bgHex = ColorMath.rgbToHex(bg.r, bg.g, bg.b).toUpperCase();

    this.compareSlots = [
      { id: 'A', name: 'Color Frontal (FG)', hex: fgHex, rgb: fg, active: true },
      { id: 'B', name: 'Color Fondo (BG)', hex: bgHex, rgb: bg, active: true }
    ];

    this.activeTargetSlotId = 'A';
    this.renderCompareSlots();
    this._updateComparisonPanel();

    if (this.app?.showToast) {
      this.app.showToast('Comparando Color Frontal (FG) vs Fondo (BG)', 'info');
    }
  }

  renderCompareSlots() {
    const container = document.getElementById('hyper4dCompareSlotsGrid');
    if (!container) return;

    const canDelete = this.compareSlots.length > 2;

    container.innerHTML = this.compareSlots.map((slot) => {
      const isTarget = slot.id === this.activeTargetSlotId;
      return `
        <div class="hyper4d-compare-slot-card ${isTarget ? 'slot-is-target' : ''}" data-slot-id="${slot.id}" title="Click para seleccionar y vincular con la Rueda">
          <div class="hyper4d-slot-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hyper4d-slot-badge">[${slot.id}]</span>
              <span class="hyper4d-slot-target-badge" style="display: ${isTarget ? 'inline-block' : 'none'};">🎯 Rueda</span>
            </div>
            <span class="hyper4d-slot-title" title="${slot.name}">${slot.name}</span>
            ${canDelete ? `<button type="button" class="hyper4d-slot-delete-btn" data-slot-id="${slot.id}" title="Eliminar esta muestra de la comparativa">✕</button>` : ''}
          </div>
          <div class="hyper4d-slot-body">
            <div class="hyper4d-slot-swatch-wrapper" title="Click para abrir selector cromático">
              <div class="hyper4d-slot-swatch" style="background-color: ${slot.hex};"></div>
              <input type="color" class="hyper4d-slot-color-picker" data-slot-id="${slot.id}" value="${slot.hex}">
            </div>
            <div class="hyper4d-slot-controls">
              <input type="text" class="hyper4d-slot-hex-input" data-slot-id="${slot.id}" value="${slot.hex}" spellcheck="false" maxlength="7">
              <div class="hyper4d-slot-quick-btns">
                <button type="button" class="hyper4d-slot-qbtn" data-action="set-fg" data-slot-id="${slot.id}" title="Asignar color Frontal (FG) actual de la suite">📥 FG</button>
                <button type="button" class="hyper4d-slot-qbtn" data-action="set-bg" data-slot-id="${slot.id}" title="Asignar color Fondo (BG) actual de la suite">📥 BG</button>
                <button type="button" class="hyper4d-slot-qbtn" data-action="target-wheel" data-slot-id="${slot.id}" title="Vincular con la Rueda Cromática para ajuste en vivo">🎯 Rueda</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.renderQuickAssignBar();

    container.querySelectorAll('.hyper4d-compare-slot-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, input')) return;
        const slotId = card.dataset.slotId;
        this.setActiveTargetSlot(slotId, { loadIntoWheel: false });
      });
    });

    container.querySelectorAll('.hyper4d-slot-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotId = btn.dataset.slotId;
        this.removeCompareSlot(slotId);
      });
    });

    container.querySelectorAll('.hyper4d-slot-color-picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const slotId = picker.dataset.slotId;
        this.updateSlotColor(slotId, e.target.value, { reRender: false });
      });
      picker.addEventListener('change', (e) => {
        const slotId = picker.dataset.slotId;
        this.updateSlotColor(slotId, e.target.value, { reRender: false });
      });
    });

    container.querySelectorAll('.hyper4d-slot-hex-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const slotId = input.dataset.slotId;
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (this._isValidHex(val)) {
          this.updateSlotColor(slotId, val, { reRender: false });
        } else {
          const slot = this.compareSlots.find(s => s.id === slotId);
          if (slot) input.value = slot.hex;
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
      });
    });

    container.querySelectorAll('.hyper4d-slot-qbtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const slotId = btn.dataset.slotId;
        const slot = this.compareSlots.find(s => s.id === slotId);
        if (!slot) return;

        if (action === 'set-fg') {
          this.assignCurrentColorToSlot(slotId, 'fg');
        } else if (action === 'set-bg') {
          this.assignCurrentColorToSlot(slotId, 'bg');
        } else if (action === 'target-wheel') {
          this.setActiveTargetSlot(slotId, { loadIntoWheel: true });
        }
      });
    });
  }

  _updateComparisonPanel() {
    const activeSlots = this.compareSlots.filter(s => s.active !== false);
    if (activeSlots.length < 2) return;

    const slotData = activeSlots.map(slot => {
      const lab = this._rgbToLab(slot.rgb);
      const coords = this._getColor4DCoords(slot.rgb, { minVisualChroma: 5 });
      return {
        slot,
        lab,
        coords,
        hsv: coords.hsv,
        munsell: coords.munsell,
        isWarm: coords.isWarm
      };
    });

    const N = slotData.length;

    let sumDeltaE = 0;
    let pairCount = 0;
    let maxDeltaE = -1;
    let maxPair = null;
    let minDeltaE = 999999;
    let minPair = null;

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const itemA = slotData[i];
        const itemB = slotData[j];
        const de = Math.sqrt(
          Math.pow(itemA.lab.L - itemB.lab.L, 2) +
          Math.pow(itemA.lab.a - itemB.lab.a, 2) +
          Math.pow(itemA.lab.b - itemB.lab.b, 2)
        );
        const cr = ColorMath.calculateContrastRatio(itemA.slot.rgb, itemB.slot.rgb);

        sumDeltaE += de;
        pairCount++;

        if (de > maxDeltaE) {
          maxDeltaE = de;
          maxPair = { a: itemA.slot, b: itemB.slot, de, cr };
        }
        if (de < minDeltaE) {
          minDeltaE = de;
          minPair = { a: itemA.slot, b: itemB.slot, de, cr };
        }
      }
    }

    const avgDeltaE = pairCount > 0 ? (sumDeltaE / pairCount) : 0;
    const luminances = slotData.map(d => d.lab.L);
    const minL = Math.min(...luminances);
    const maxL = Math.max(...luminances);
    const deltaL = maxL - minL;

    const warmCount = slotData.filter(d => d.isWarm).length;
    const coolCount = N - warmCount;
    const warmPct = Math.round((warmCount / N) * 100);
    const coolPct = 100 - warmPct;

    const statsBox = document.getElementById('hyper4dComparisonStats');
    if (statsBox) {
      let deltaInterpretation = 'Diferencia tonal sutil y armónica';
      if (avgDeltaE > 45) deltaInterpretation = 'Contraste perceptual extremo (Foco de atención)';
      else if (avgDeltaE > 25) deltaInterpretation = 'Contraste cromático nítido y vivo';
      else if (avgDeltaE > 12) deltaInterpretation = 'Diferenciación armónica clara';

      statsBox.innerHTML = `
        <div class="hyper4d-stat-row">
          <span>Muestras Simultáneas Activas:</span>
          <strong style="color: #FFFFFF;">${N} muestras dinámicas</strong>
        </div>
        <div class="hyper4d-stat-row">
          <span>Distancia Perceptual Media ΔE (CIE76):</span>
          <strong style="color: #38BDF8;">${avgDeltaE.toFixed(1)} <small style="font-size:0.68rem; color:#94A3B8;">(${deltaInterpretation})</small></strong>
        </div>
        <div class="hyper4d-stat-row">
          <span>Mayor Tensión Visual (Max ΔE):</span>
          <strong style="color: #F43F5E;">[${maxPair.a.id}] ↔ [${maxPair.b.id}]: ΔE ${maxDeltaE.toFixed(1)} (${maxPair.cr.toFixed(1)}:1)</strong>
        </div>
        <div class="hyper4d-stat-row">
          <span>Mayor Afinidad / Transición (Min ΔE):</span>
          <strong style="color: #34D399;">[${minPair.a.id}] ↔ [${minPair.b.id}]: ΔE ${minDeltaE.toFixed(1)} (${minPair.cr.toFixed(1)}:1)</strong>
        </div>
        <div class="hyper4d-stat-row">
          <span>Rango Dinámico Luminoso (ΔL*):</span>
          <strong style="color: #FBBF24;">${deltaL.toFixed(1)}% <small style="font-size:0.68rem; color:#94A3B8;">(L* ${minL.toFixed(0)}% a ${maxL.toFixed(0)}%)</small></strong>
        </div>
        <div class="hyper4d-stat-row">
          <span>Polaridad Térmica Colectiva:</span>
          <strong style="color: ${warmPct > coolPct ? '#F59E0B' : (coolPct > warmPct ? '#38BDF8' : '#A78BFA')};">
            ${warmPct}% Cálido (${warmCount}) / ${coolPct}% Frío (${coolCount})
          </strong>
        </div>
      `;
    }

    const matrixBox = document.getElementById('hyper4dPairwiseMatrixBox');
    if (matrixBox) {
      let tableHtml = `<table class="hyper4d-table-styled"><thead><tr><th>ΔE / Ratio</th>`;
      for (let j = 0; j < N; j++) {
        tableHtml += `<th><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${slotData[j].slot.hex}; margin-right:3px;"></span>[${slotData[j].slot.id}]</th>`;
      }
      tableHtml += `</tr></thead><tbody>`;

      for (let i = 0; i < N; i++) {
        tableHtml += `<tr><td><strong>[${slotData[i].slot.id}]</strong></td>`;
        for (let j = 0; j < N; j++) {
          if (i === j) {
            tableHtml += `<td style="color: var(--text-muted); opacity: 0.35;">—</td>`;
          } else {
            const de = Math.sqrt(
              Math.pow(slotData[i].lab.L - slotData[j].lab.L, 2) +
              Math.pow(slotData[i].lab.a - slotData[j].lab.a, 2) +
              Math.pow(slotData[i].lab.b - slotData[j].lab.b, 2)
            );
            const cr = ColorMath.calculateContrastRatio(slotData[i].slot.rgb, slotData[j].slot.rgb);
            const isWcagAA = cr >= 4.5;
            const deColor = de > 40 ? '#38BDF8' : (de > 20 ? '#FBBF24' : '#94A3B8');

            tableHtml += `
              <td>
                <div style="font-weight:700; color:${deColor};">${de.toFixed(1)}</div>
                <div style="font-size:0.65rem; color:${isWcagAA ? '#34D399' : '#94A3B8'};">
                  ${cr.toFixed(1)}:1 ${isWcagAA ? 'AA' : ''}
                </div>
              </td>
            `;
          }
        }
        tableHtml += `</tr>`;
      }
      tableHtml += `</tbody></table>`;
      matrixBox.innerHTML = tableHtml;
    }

    const coordsBox = document.getElementById('hyper4dCoordsTableBox');
    if (coordsBox) {
      let coordsHtml = `
        <table class="hyper4d-table-styled">
          <thead>
            <tr>
              <th>Muestra</th>
              <th>Color</th>
              <th>Munsell</th>
              <th>X (Hue·Chroma)</th>
              <th>Y (Valor)</th>
              <th>Z (Ortogonal)</th>
              <th>W (4ª Dim)</th>
              <th>T°</th>
            </tr>
          </thead>
          <tbody>
      `;
      slotData.forEach(d => {
        coordsHtml += `
          <tr>
            <td><strong>[${d.slot.id}] ${d.slot.name}</strong></td>
            <td>
              <div style="display:flex; align-items:center; gap:5px;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${d.slot.hex};"></span>
                <code>${d.slot.hex}</code>
              </div>
            </td>
            <td><code>${d.munsell.notation}</code></td>
            <td>${d.coords.x.toFixed(1)}</td>
            <td>${d.coords.y.toFixed(1)}</td>
            <td>${d.coords.z.toFixed(1)}</td>
            <td><strong style="color:#38BDF8;">${d.coords.w.toFixed(1)}</strong></td>
            <td><span class="hyper4d-badge-sub" style="font-size:0.64rem;">${d.isWarm ? '🔥 Cálido' : '❄️ Frío'}</span></td>
          </tr>
        `;
      });
      coordsHtml += `</tbody></table>`;
      coordsBox.innerHTML = coordsHtml;
    }

    const harmonyBox = document.getElementById('hyper4dCompHarmonyBox');
    if (harmonyBox) {
      let patternDesc = '';
      if (N === 2) {
        const diff = Math.min(Math.abs(slotData[0].hsv.h - slotData[1].hsv.h), 360 - Math.abs(slotData[0].hsv.h - slotData[1].hsv.h));
        if (diff >= 160 && diff <= 200) patternDesc = '🔥 Oposición Complementaria Pura (Máxima Tensión y Resonancia)';
        else if (diff <= 35) patternDesc = '🌿 Diada Análoga (Adyacencia Armónica y Unidad Calmada)';
        else if (diff >= 80 && diff <= 100) patternDesc = '⚖️ Cuadratura Ortogonal (Contraste de Matiz Equilibrado)';
        else patternDesc = `📐 Ángulo Cromático de ${diff.toFixed(0)}° (Relación Cromática Libre)`;
      } else if (N === 3) {
        patternDesc = '🔺 Tríada Compositiva en el Hiperespacio';
      } else if (N === 4) {
        patternDesc = '💎 Tétrada / Cuadrilátero Armónico Cuadridimensional';
      } else {
        patternDesc = `🌌 Polígono Estelar de ${N} Vértices Cromáticos`;
      }

      harmonyBox.innerHTML = `
        <div style="font-size: 0.76rem; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">
          ${patternDesc}
        </div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.4;">
          El polígono generado en el visualizador 4D define el gamut dinámico de tu combinación, mostrando el equilibrio de distancias angulares y las fuerzas de oposición tonal.
        </div>
      `;
    }

    const goetheBox = document.getElementById('hyper4dCompGoetheHierarchyBox');
    if (goetheBox) {
      const goetheWeights = slotData.map(d => {
        const h = d.hsv.h;
        let w = 6;
        if (h >= 45 && h < 75) w = 9;
        else if (h >= 25 && h < 45) w = 8;
        else if (h >= 340 || h < 25) w = 6;
        else if (h >= 270 && h < 340) w = 3;
        else if (h >= 200 && h < 270) w = 4;
        else if (h >= 75 && h < 200) w = 6;

        const invWeight = 1 / w;
        return { slot: d.slot, weight: w, invWeight };
      });

      const totalInv = goetheWeights.reduce((acc, cur) => acc + cur.invWeight, 0);
      const proportions = goetheWeights.map(gw => {
        const pct = (gw.invWeight / totalInv) * 100;
        return { slot: gw.slot, pct, weight: gw.weight };
      });

      let barSegments = proportions.map(p => `
        <div style="flex: ${p.pct}; background-color: ${p.slot.hex}; height: 14px; border-right: 1px solid rgba(0,0,0,0.5);" title="[${p.slot.id}] Goethe: ${p.pct.toFixed(1)}% de superficie recomendada"></div>
      `).join('');

      let detailList = proportions.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; padding: 2px 0;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${p.slot.hex};"></span>
            <strong>[${p.slot.id}] ${p.slot.name}:</strong>
          </div>
          <span style="font-family:var(--font-mono); color:#FBBF24;"><strong>${p.pct.toFixed(1)}%</strong> del lienzo <small style="color:#94A3B8;">(Potencia ${p.weight}/9)</small></span>
        </div>
      `).join('');

      goetheBox.innerHTML = `
        <div style="display:flex; border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.2); margin-bottom:8px;">
          ${barSegments}
        </div>
        <div>${detailList}</div>
      `;
    }

    const rolesBox = document.getElementById('hyper4dCompRolesBox');
    if (rolesBox) {
      const sortedByVal = [...slotData].sort((a, b) => b.hsv.v - a.hsv.v);
      const sortedByChroma = [...slotData].sort((a, b) => b.hsv.s - a.hsv.s);

      const focalLight = sortedByVal[0];
      const shadowAnchor = sortedByVal[sortedByVal.length - 1];
      const chromaSpark = sortedByChroma[0];

      rolesBox.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px; font-size:0.71rem;">
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <span class="hyper4d-badge-sub" style="background:rgba(251,191,36,0.2); color:#FDE68A;">💡 Foco Lumínico</span>
            <div><strong>[${focalLight.slot.id}] ${focalLight.slot.name} (${focalLight.slot.hex})</strong>: Conduce la mirada por mayor energía lumínica inherente.</div>
          </div>
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <span class="hyper4d-badge-sub" style="background:rgba(129,140,248,0.2); color:#C7D2FE;">⚓ Anclaje de Sombra</span>
            <div><strong>[${shadowAnchor.slot.id}] ${shadowAnchor.slot.name} (${shadowAnchor.slot.hex})</strong>: Otorga masa gravitacional y profundidad espacial.</div>
          </div>
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <span class="hyper4d-badge-sub" style="background:rgba(236,72,153,0.2); color:#FBCFE8;">⚡ Vibración Cromática</span>
            <div><strong>[${chromaSpark.slot.id}] ${chromaSpark.slot.name} (${chromaSpark.slot.hex})</strong>: Máxima saturación pura; actúa como resonador armónico.</div>
          </div>
        </div>
      `;
    }

    const mixBox = document.getElementById('hyper4dCompareMixActionBox');
    if (mixBox) {
      const rgbList = slotData.map(d => d.slot.rgb);
      const mixRgb = this._calculateMultiPhysicalMix(rgbList);
      const mixHex = ColorMath.rgbToHex(mixRgb.r, mixRgb.g, mixRgb.b).toUpperCase();
      const mixMunsell = MunsellSystem.rgbToMunsell(mixRgb.r, mixRgb.g, mixRgb.b);

      mixBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
          <div style="width:38px; height:38px; border-radius:6px; background-color:${mixHex}; border:2px solid #FFF; box-shadow:0 0 12px ${mixHex}88;"></div>
          <div>
            <div style="font-weight:700; color:#FFFFFF; font-size:0.84rem;">Mezcla Baricéntrica (1/${N} partes iguales en RYB)</div>
            <div style="font-size:0.72rem; color:#38BDF8; font-family:var(--font-mono);">${mixHex} • Munsell: ${mixMunsell.notation}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="btnHyper4DLoadMultiMix" class="tool-action-btn" style="padding:5px 12px; font-size:0.73rem; background:rgba(99,102,241,0.25); border-color:#6366F1; color:#C7D2FE;">
            <span>🎨</span> Cargar Mezcla en Rueda (FG)
          </button>
          <button id="btnHyper4DSaveMultiMix" class="tool-action-btn" style="padding:5px 12px; font-size:0.73rem;">
            <span>💾</span> Añadir a Paleta Activa
          </button>
        </div>
      `;

      const btnLoad = document.getElementById('btnHyper4DLoadMultiMix');
      if (btnLoad && this.app) {
        btnLoad.addEventListener('click', () => {
          this.app.setColorDirectly(mixRgb);
          if (this.app.showToast) {
            this.app.showToast(`Mezcla baricéntrica 4D (${mixHex}) cargada en la suite`, 'success');
          }
        });
      }

      const btnSave = document.getElementById('btnHyper4DSaveMultiMix');
      if (btnSave && this.app?.swatchManager) {
        btnSave.addEventListener('click', () => {
          this.app.swatchManager.addColorToActivePalette(mixHex);
          if (this.app.renderSwatches) this.app.renderSwatches();
          if (this.app.showToast) {
            this.app.showToast(`Muestra ${mixHex} añadida a la paleta activa`, 'success');
          }
        });
      }
    }
  }

  _loadMasterPreset(key) {
    const preset = this.masterPresets[key];
    if (!preset) return;

    document.querySelectorAll('.hyper4d-master-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.master === key);
    });

    const descEl = document.getElementById('hyper4dMasterDesc');
    if (descEl) {
      descEl.innerHTML = `
        <h4 style="margin: 0 0 6px 0; color: #FFFFFF; font-size: 0.86rem;">${preset.title}</h4>
        <p style="margin: 0 0 8px 0; font-size: 0.74rem; color: var(--text-secondary); line-height: 1.45;">${preset.desc}</p>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${preset.colors.map(c => `
            <button class="chat-color-chip" data-hex="${c}" style="font-size: 0.7rem;" title="Cargar ${c}">
              <span class="chat-chip-swatch" style="background-color: ${c};"></span>
              <span>${c}</span>
            </button>
          `).join('')}
        </div>
      `;

      descEl.querySelectorAll('.chat-color-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const hex = btn.dataset.hex;
          if (hex && this.app) {
            this.app.setColorDirectly(ColorMath.hexToRgb(hex));
          }
        });
      });
    }

    if (preset.colors.length > 0 && this.app) {
      this.app.setColorDirectly(ColorMath.hexToRgb(preset.colors[0]));
      if (this.app?.showToast) {
        this.app.showToast(`Constelación 4D de ${preset.author} cargada`, 'info');
      }
    }
  }

  generateInspiredPalette() {
    const curRgb = this.app?.fgColor || { r: 99, g: 102, b: 241 };
    const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);

    const colors = [
      ColorMath.rgbToHex(curRgb.r, curRgb.g, curRgb.b),
      ColorMath.rgbToHex(...Object.values(ColorMath.hsvToRgb((hsv.h + 35) % 360, hsv.s * 0.85, Math.min(1, hsv.v * 1.1)))),
      ColorMath.rgbToHex(...Object.values(ColorMath.hsvToRgb((hsv.h + 180) % 360, hsv.s, hsv.v))),
      ColorMath.rgbToHex(...Object.values(ColorMath.hsvToRgb((hsv.h + 215) % 360, 0.45, Math.max(0.2, hsv.v * 0.45)))),
      ColorMath.rgbToHex(...Object.values(ColorMath.hsvToRgb((hsv.h + 15) % 360, 0.25, Math.min(1, hsv.v * 1.3))))
    ];

    if (this.app?.swatchManager) {
      const title = `Inspiración 4D (${colors[0]})`;
      this.app.swatchManager.addPalette(title, colors);
      if (this.app.renderSwatches) this.app.renderSwatches();
      if (this.app.showToast) {
        this.app.showToast(`¡Paleta "${title}" creada con éxito en Bibliotecas!`, 'success');
      }
    }
  }

  exportSnapshot() {
    if (!this.canvas) return;
    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `GOM_Picker_Hiperespacio_4D_${Date.now()}.png`;
      a.click();
      if (this.app?.showToast) {
        this.app.showToast('Captura HD del Hiperespacio 4D descargada con éxito', 'success');
      }
    } catch (e) {
      console.warn('Error exportando captura 4D:', e);
    }
  }

  // --- MATEMÁTICAS AUXILIARES CIE LAB ---

  _labToRgb(L, a, b) {
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    x = (x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787) * 95.047;
    y = (y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787) * 100.000;
    z = (z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787) * 108.883;

    let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
    let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
    let bl = x * 0.000557 + y * -0.002040 + z * 0.010570;

    const inside = r >= 0 && r <= 100 && g >= 0 && g <= 100 && bl >= 0 && bl <= 100;

    const toGamma = (v) => {
      v = v / 100;
      return v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v;
    };

    return {
      r: ColorMath.clamp255(toGamma(r) * 255),
      g: ColorMath.clamp255(toGamma(g) * 255),
      b: ColorMath.clamp255(toGamma(bl) * 255),
      inside
    };
  }

  _rgbToLab(rgb) {
    const toLinear = (c) => {
      const v = c / 255;
      return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    };

    const r = toLinear(rgb.r) * 100;
    const g = toLinear(rgb.g) * 100;
    const b = toLinear(rgb.b) * 100;

    let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    x /= 95.047;
    y /= 100.000;
    z /= 108.883;

    x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

    return {
      L: 116 * y - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }
}
