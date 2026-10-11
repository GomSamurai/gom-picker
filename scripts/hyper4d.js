/**
 * GOM Picker - Hiperespacio 4D del Color (4D Chromatic Hyper-Studio)
 * Revolucionario motor de visualización, comparación e inspiración cuadridimensional.
 * Proyecta el color en el espacio cuadridimensional SO(4) a través de rotaciones hiperdimensionales
 * en 6 planos (XY, XZ, YZ, XW, YW, ZW), combinando el Sólido Munsell real asimétrico,
 * el Hipercubo Tesseract, el espacio perceptivo CIELAB y la teoría física de Florent Farges y James Gurney.
 * 
 * 100% Offline, sin dependencias externas, con aceleración Canvas interactiva a 60fps.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';
import { FlorentFargesEngine } from './florentFarges.js';

export class Hyper4DStudio {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Estado de la Cámara 3D
    this.camera = {
      rotX: 0.35,     // Pitch (elevación)
      rotY: -0.65,    // Yaw (azimut)
      zoom: 1.05,
      panX: 0,
      panY: 0,
      isDragging: false,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      autoRotate: true,
      autoRotateSpeed: 0.003,
      invertX: localStorage.getItem('gom_hyper4d_invert_x') === 'true',
      invertY: localStorage.getItem('gom_hyper4d_invert_y') === 'true'
    };

    // Estado Hiperdimensional 4D
    this.dimension4D = {
      wValue: 0,            // -100 a +100
      wMode: 'thermal',     // 'thermal' (Kelvin) | 'subtractive' (Glaze/Tint) | 'tesseract' (Hiper-rotación) | 'diurnal' (Ciclo solar)
      angleXW: 0,           // Ángulo de rotación hiperdimensional en plano XW
      angleYW: 0,           // Ángulo de rotación en plano YW
      angleZW: 0,           // Ángulo de rotación en plano ZW
      isAnimatingW: false,
      animSpeed: 0.015,
      animDirection: 1,
      camDist4D: 320        // Distancia focal hiperdimensional para proyección estereográfica
    };

    // Modelo de Geometría Seleccionado
    this.activeModel = 'munsell'; // 'munsell' | 'tesseract' | 'cielab' | 'hsl_cone'

    // Opciones de Visualización de Nodos y Vectores
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

    // Presets Didácticos de Maestros
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
  }

  init() {
    this.canvas = document.getElementById('hyper4dCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this._bindEvents();
    this._bindUI();
    this._bindCompareControls();
    this.renderCompareSlots();
    this._resizeCanvas();
    this.syncWithActiveColor();

    // Iniciar loop de animación
    this._startRenderLoop();
  }

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 600,
        w: (Math.random() - 0.5) * 100,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: ['#818CF8', '#38BDF8', '#F472B6', '#34D399', '#FBBF24'][Math.floor(Math.random() * 5)]
      });
    }
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(300, Math.floor(rect.height || 540));

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.scale(dpr, dpr);
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
    // Evita singularidades en el polo hiperdimensional
    const denom = Math.max(40, d4 - pt4D.w);
    const scale = d4 / denom;

    return {
      x: pt4D.x * scale,
      y: pt4D.y * scale,
      z: pt4D.z * scale,
      origW: pt4D.w,
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
    const fov = 480 * this.camera.zoom;
    const dist = 520 + z2;
    const factor = dist > 20 ? fov / dist : 0;

    const screenX = cx + x2 * factor;
    const screenY = cy - y2 * factor; // Invertir Y para coordenadas de pantalla estándar

    return {
      screenX,
      screenY,
      depth: z2,
      scale: factor,
      visible: dist > 30
    };
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
        y: (val - 5) * 32,
        z: 0,
        w: 0,
        hex,
        rgb: { r: grayVal, g: grayVal, b: grayVal },
        name: `N ${val}/ (Gris Neutral)`,
        munsell: `N ${val}/`,
        value: val,
        chroma: 0,
        size: 5
      });
    }

    // Gajos de color del Libro de Munsell
    hues.forEach(hue => {
      const rad = (hue.angle * Math.PI) / 180;
      const isWarm = (hue.angle >= 10 && hue.angle <= 90) || hue.angle >= 330;

      for (let val = 2; val <= 9; val++) {
        // En Munsell real, el croma máximo alcanzable depende de la física del pigmento:
        // Amarillos (5Y, 10YR) alcanzan croma 14 en valores 8; Azules (5B, 5PB) en valores 3-4
        let maxChromaForHue = 10;
        if (hue.name.includes('Y')) {
          maxChromaForHue = val >= 7 ? 14 : 6;
        } else if (hue.name.includes('R') || hue.name.includes('YR')) {
          maxChromaForHue = val >= 4 && val <= 6 ? 14 : 8;
        } else if (hue.name.includes('B') || hue.name.includes('PB')) {
          maxChromaForHue = val <= 4 ? 12 : 8;
        }

        for (let chr = 2; chr <= maxChromaForHue; chr += 3) {
          const radius = chr * 14;
          const x = radius * Math.cos(rad);
          const z = radius * Math.sin(rad);
          const y = (val - 5) * 32;

          // La 4ª dimensión W refleja la temperatura cromática intrínseca
          const w = (isWarm ? 28 : -28) * (chr / 14);

          // Genera el color exacto aproximado
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
            size: 3.5
          });
        }
      }
    });

    this._geometryCache['munsell'] = nodes;
    return nodes;
  }

  /**
   * Genera los 16 vértices y las 32 aristas del Hipercubo Tesseract 4D.
   */
  getTesseractGeometry() {
    const nodes = [];
    const edges = [];
    const size = 80;

    // 16 Vértices en 4D: (±1, ±1, ±1, ±1)
    let idx = 0;
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          for (let w of [-1, 1]) {
            // Mapea las coordenadas al cubo RGB (0 a 255)
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
              name: `Vértice Hiperdimensional ${idx + 1}`,
              size: 5
            });
            idx++;
          }
        }
      }
    }

    // 32 Aristas: conectan vértices que difieren exactamente en 1 coordenada
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
    const stepL = 15;
    const stepA = 22;

    for (let L = 15; L <= 90; L += stepL) {
      for (let a = -70; a <= 70; a += stepA) {
        for (let b = -70; b <= 70; b += stepA) {
          const rgb = this._labToRgb(L, a, b);
          // Si el punto cae dentro del gamut RGB visible:
          if (rgb.inside) {
            const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
            const w = (a * 0.4) - (b * 0.2); // Eje térmico 4D
            nodes.push({
              id: `lab_${L}_${a}_${b}`,
              type: 'cielab_node',
              x: a * 1.8,
              y: (L - 50) * 3.2,
              z: b * 1.8,
              w,
              hex,
              rgb,
              name: `L*${L} a*${a} b*${b}`,
              size: 3
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
      const radiusFactor = 1 - Math.abs(2 * l - 1); // Cero en polos blanco y negro, máximo en centro

      for (let h = 0; h < 360; h += 24) {
        for (let sStep = 2; sStep <= 4; sStep++) {
          const s = sStep / 4;
          const radius = radiusFactor * s * 140;
          const rad = (h * Math.PI) / 180;
          const x = radius * Math.cos(rad);
          const z = radius * Math.sin(rad);
          const y = (l - 0.5) * 260;
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
            size: 3
          });
        }
      }
    }

    this._geometryCache['hsl_cone'] = nodes;
    return nodes;
  }

  // --- DESGLOSE MULTIDIMENSIONAL DE LA MUESTRA ACTIVA EN 4D ---

  getActiveColorNodes(activeRgb) {
    if (!activeRgb) return [];

    const nodes = [];
    const lines = [];
    const faces = [];

    const hsv = ColorMath.rgbToHsv(activeRgb.r, activeRgb.g, activeRgb.b);
    const hsl = ColorMath.rgbToHsl(activeRgb.r, activeRgb.g, activeRgb.b);
    const munsell = MunsellSystem.rgbToMunsell(activeRgb.r, activeRgb.g, activeRgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;
    const activeHex = ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

    // Coordenadas base en el espacio
    const rad = (hsv.h * Math.PI) / 180;
    const chromaRadius = (munsell.chroma || (hsv.s * 14)) * 14;
    const baseX = chromaRadius * Math.cos(rad);
    const baseZ = chromaRadius * Math.sin(rad);
    const baseY = ((munsell.value || (hsv.v * 9)) - 5) * 32;

    // 4ª Dimensión W según el modo seleccionado
    let baseW = 0;
    if (this.dimension4D.wMode === 'thermal') {
      // W influenciada por temperatura kelvin del slider (-100 a +100)
      baseW = (isWarm ? 30 : -30) + (this.dimension4D.wValue * 0.6);
    } else if (this.dimension4D.wMode === 'subtractive') {
      baseW = this.dimension4D.wValue;
    } else if (this.dimension4D.wMode === 'diurnal') {
      baseW = Math.sin(this.dimension4D.wValue * 0.05) * 50;
    } else {
      baseW = this.dimension4D.wValue * 0.8;
    }

    // 1. NODO CENTRAL: La muestra activa principal
    const centerNode = {
      id: 'active_sample_center',
      type: 'active_center',
      x: baseX,
      y: baseY,
      z: baseZ,
      w: baseW,
      hex: activeHex,
      rgb: activeRgb,
      name: `MUESTRA ACTIVA (${activeHex})`,
      munsell: munsell.notation,
      hsv,
      isPrimary: true,
      size: 11
    };
    nodes.push(centerNode);

    // 2. VECTOR DE LUZ SUPERIOR (James Gurney & Florent Farges: Light Plane)
    // El tono en la luz asciende en valor, aumenta temperatura dorada con Blanco Titanio + Ocre
    const lightHue = (hsv.h + (isWarm ? 5 : 15)) % 360;
    const lightRgb = ColorMath.hsvToRgb(lightHue, Math.max(0.15, hsv.s * 0.6), Math.min(1, hsv.v * 1.25 + 0.15));
    const lightHex = ColorMath.rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);
    const lightNode = {
      id: 'active_vector_light',
      type: 'vector_light',
      x: baseX * 0.75,
      y: Math.min(140, baseY + 55),
      z: baseZ * 0.75,
      w: baseW + 25,
      hex: lightHex,
      rgb: lightRgb,
      name: `Luz / Resalte Foco (${lightHex})`,
      desc: 'Tintado luminoso hacia Blanco Titanio (PW6) con micro-calidez solar.',
      size: 7
    };
    nodes.push(lightNode);
    lines.push({ from: centerNode, to: lightNode, color: '#FBBF24', dash: [4, 2], label: 'Vector Luz' });

    // 3. VECTOR DE SOMBRA PROFUNDA (Sorolla Colored Shadow Vector)
    // Desciende en valor, viraje térmico complementario (azul-violeta si es cálido, siena si es frío)
    const shadowHue = isWarm ? (hsv.h + 200) % 360 : (hsv.h + 40) % 360;
    const shadowRgb = ColorMath.hsvToRgb(shadowHue, 0.45, Math.max(0.15, hsv.v * 0.45));
    const shadowHex = ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b);
    const shadowNode = {
      id: 'active_vector_shadow',
      type: 'vector_shadow',
      x: baseX * 0.6,
      y: Math.max(-130, baseY - 55),
      z: baseZ * 0.6,
      w: baseW - 35,
      hex: shadowHex,
      rgb: shadowRgb,
      name: `Sombra Atmosférica (${shadowHex})`,
      desc: 'Sombra coloreada transparente. Evita negro puro para conservar profundidad.',
      size: 7
    };
    nodes.push(shadowNode);
    lines.push({ from: centerNode, to: shadowNode, color: '#818CF8', dash: [4, 2], label: 'Vector Sombra' });

    // 4. POLIEDRO DE ARMONÍAS (Complementario Directo & Tríadas)
    if (this.options.showHarmonyPolyhedron) {
      // Complementario
      const compHue = (hsv.h + 180) % 360;
      const compRad = (compHue * Math.PI) / 180;
      const compRgb = ColorMath.hsvToRgb(compHue, hsv.s, hsv.v);
      const compHex = ColorMath.rgbToHex(compRgb.r, compRgb.g, compRgb.b);
      const compNode = {
        id: 'active_harmony_comp',
        type: 'harmony_node',
        x: chromaRadius * Math.cos(compRad),
        y: baseY * 0.9,
        z: chromaRadius * Math.sin(compRad),
        w: -baseW,
        hex: compHex,
        rgb: compRgb,
        name: `Complementario Óptico (${compHex})`,
        role: 'Contraste simultáneo máximo',
        size: 7.5
      };
      nodes.push(compNode);
      lines.push({ from: centerNode, to: compNode, color: '#F43F5E', width: 2, label: 'Eje Complementario' });

      // Tríada 1 (+120°)
      const tri1Hue = (hsv.h + 120) % 360;
      const tri1Rad = (tri1Hue * Math.PI) / 180;
      const tri1Rgb = ColorMath.hsvToRgb(tri1Hue, hsv.s * 0.9, hsv.v);
      const tri1Hex = ColorMath.rgbToHex(tri1Rgb.r, tri1Rgb.g, tri1Rgb.b);
      const tri1Node = {
        id: 'active_harmony_tri1',
        type: 'harmony_node',
        x: chromaRadius * 0.9 * Math.cos(tri1Rad),
        y: baseY,
        z: chromaRadius * 0.9 * Math.sin(tri1Rad),
        w: baseW * 0.5,
        hex: tri1Hex,
        rgb: tri1Rgb,
        name: `Tríada A (+120°) (${tri1Hex})`,
        size: 6.5
      };
      nodes.push(tri1Node);

      // Tríada 2 (+240°)
      const tri2Hue = (hsv.h + 240) % 360;
      const tri2Rad = (tri2Hue * Math.PI) / 180;
      const tri2Rgb = ColorMath.hsvToRgb(tri2Hue, hsv.s * 0.9, hsv.v);
      const tri2Hex = ColorMath.rgbToHex(tri2Rgb.r, tri2Rgb.g, tri2Rgb.b);
      const tri2Node = {
        id: 'active_harmony_tri2',
        type: 'harmony_node',
        x: chromaRadius * 0.9 * Math.cos(tri2Rad),
        y: baseY,
        z: chromaRadius * 0.9 * Math.sin(tri2Rad),
        w: -baseW * 0.5,
        hex: tri2Hex,
        rgb: tri2Rgb,
        name: `Tríada B (+240°) (${tri2Hex})`,
        size: 6.5
      };
      nodes.push(tri2Node);

      // Conectar triángulo armónico
      lines.push({ from: centerNode, to: tri1Node, color: 'rgba(255,255,255,0.4)', width: 1.5 });
      lines.push({ from: tri1Node, to: tri2Node, color: 'rgba(255,255,255,0.4)', width: 1.5 });
      lines.push({ from: tri2Node, to: centerNode, color: 'rgba(255,255,255,0.4)', width: 1.5 });

      faces.push({
        p1: centerNode,
        p2: tri1Node,
        p3: tri2Node,
        fillColor: 'rgba(99, 102, 241, 0.12)'
      });
    }

    // 5. CURVA DE MEZCLA SUSTRACTIVA (Florent Farges Bow Curve)
    if (this.options.showMixingBowCurve) {
      const solver = FlorentFargesEngine.solveMixingForColor(activeRgb);
      if (solver && solver.cand1 && solver.cand2) {
        // Puntos intermedios de mezcla física
        const curveSteps = 5;
        const curveNodes = [];
        for (let i = 0; i <= curveSteps; i++) {
          const t = i / curveSteps;
          const mixRgb = ColorMath.mixRyb(solver.cand1.rgb, solver.cand2.rgb, t);
          const mixHsv = ColorMath.rgbToHsv(mixRgb.r, mixRgb.g, mixRgb.b);
          const mRad = (mixHsv.h * Math.PI) / 180;
          const mChr = (mixHsv.s * 14) * 14;
          const mX = mChr * Math.cos(mRad);
          const mZ = mChr * Math.sin(mRad);
          const mY = (mixHsv.v * 9 - 5) * 32;

          curveNodes.push({
            id: `farges_curve_${i}`,
            type: 'bow_curve_pt',
            x: mX, y: mY, z: mZ, w: baseW * (1 - t * 0.3),
            hex: ColorMath.rgbToHex(mixRgb.r, mixRgb.g, mixRgb.b),
            rgb: mixRgb,
            size: i === 0 || i === curveSteps ? 6 : 3,
            name: i === 0 ? solver.cand1.name : (i === curveSteps ? solver.cand2.name : `Mezcla ${(t * 100).toFixed(0)}%`)
          });
        }

        nodes.push(...curveNodes);
        for (let i = 0; i < curveNodes.length - 1; i++) {
          lines.push({
            from: curveNodes[i],
            to: curveNodes[i + 1],
            color: '#10B981',
            width: 2.2,
            label: i === 2 ? 'Curva Bow Farges' : ''
          });
        }
      }
    }

    // 6. VECTOR DE DISPERSIÓN SUBCUTÁNEA (Subsurface Scattering SSS - James Gurney)
    if (this.options.showSSSVector) {
      // El terminador se sitúa en la frontera entre luz y sombra, con un salto térmico hacia carmín/naranja saturado
      const sssHue = (hsv.h >= 20 && hsv.h <= 180) ? (hsv.h - 25 + 360) % 360 : (hsv.h + 20) % 360;
      const sssRgb = ColorMath.hsvToRgb(sssHue, Math.min(1, hsv.s * 1.35 + 0.25), Math.max(0.2, hsv.v * 0.75));
      const sssHex = ColorMath.rgbToHex(sssRgb.r, sssRgb.g, sssRgb.b);
      const sssNode = {
        id: 'active_vector_sss',
        type: 'vector_sss',
        x: (baseX + (baseX * 0.6)) / 2 + 15,
        y: (baseY + Math.max(-130, baseY - 55)) / 2,
        z: (baseZ + (baseZ * 0.6)) / 2 + 15,
        w: baseW + 15,
        hex: sssHex,
        rgb: sssRgb,
        name: `Terminador SSS (${sssHex})`,
        desc: 'Dispersión subsuperficial (luz filtrada en la carne/materia orgánica translúcida).',
        size: 7.5
      };
      nodes.push(sssNode);
      lines.push({ from: centerNode, to: sssNode, color: '#EC4899', width: 2, dash: [3, 2], label: 'SSS Terminador' });
      lines.push({ from: sssNode, to: shadowNode, color: 'rgba(236, 72, 153, 0.45)', width: 1.5 });
    }

    // 7. DISCOS DE EXTENSIÓN ARMÓNICA DE SUPERFICIE (J.W. Goethe)
    if (this.options.showGoetheExtension) {
      const goetheInfo = this.getGoetheHarmonicProportion(activeRgb);
      const discCount = 6;
      const ringRadius = (goetheInfo.suggestedAreaPct / 100) * 150 + 20;
      for (let i = 0; i < discCount; i++) {
        const angle = (i * (360 / discCount) * Math.PI) / 180;
        const gX = baseX + ringRadius * Math.cos(angle);
        const gZ = baseZ + ringRadius * Math.sin(angle);
        const gNode = {
          id: `goethe_disc_${i}`,
          type: 'goethe_node',
          x: gX,
          y: baseY,
          z: gZ,
          w: baseW,
          hex: activeHex,
          rgb: activeRgb,
          name: `Extensión Goethe (${goetheInfo.suggestedAreaPct.toFixed(0)}% área)`,
          size: 2.8
        };
        nodes.push(gNode);
      }
    }

    return { nodes, lines, faces };
  }

  /**
   * Genera la constelación 4D de una paleta activa de Bibliotecas.
   */
  getPaletteConstellationGeometry() {
    if (!this.options.showPaletteConstellation) return { nodes: [], lines: [] };

    let paletteColors = [];
    if (this.app?.swatchManager) {
      const activePal = this.app.swatchManager.getActivePalette();
      if (activePal && Array.isArray(activePal.colors) && activePal.colors.length > 0) {
        paletteColors = activePal.colors;
      }
    }

    // Fallback con muestra activa y secundarios
    if (paletteColors.length === 0) return { nodes: [], lines: [] };

    const nodes = [];
    const lines = [];

    paletteColors.forEach((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
      const rad = (hsv.h * Math.PI) / 180;
      const chromaRadius = (hsv.s * 14) * 14;
      const x = chromaRadius * Math.cos(rad);
      const z = chromaRadius * Math.sin(rad);
      const y = (hsv.v * 9 - 5) * 32;
      const w = ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320 ? 30 : -30) * hsv.s;

      const node = {
        id: `pal_swatch_${idx}`,
        type: 'palette_swatch',
        x, y, z, w,
        hex,
        rgb,
        name: `Paleta #${idx + 1} (${hex})`,
        size: 7
      };
      nodes.push(node);
    });

    // Conectar nodos de la paleta en red estelar / convex hull simplificado
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 180) {
          lines.push({
            from: nodes[i],
            to: nodes[j],
            color: 'rgba(56, 189, 248, 0.35)',
            width: 1
          });
        }
      }
    }

    return { nodes, lines };
  }

  // --- RENDERIZADOR PRINCIPAL EN CANVAS ---

  _startRenderLoop() {
    const loop = () => {
      this._renderFrame();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  _renderFrame() {
    if (!this.ctx || !this.canvas) return;

    // Auto-rotación 3D orbital cinemática
    if (this.camera.autoRotate && !this.camera.isDragging) {
      this.camera.rotY += this.camera.autoRotateSpeed;
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

    const w = this.displayWidth;
    const h = this.displayHeight;

    // 1. Limpieza y Fondo Cósmico con Gradiente Espacial
    this.ctx.clearRect(0, 0, w, h);
    const bgGrad = this.ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, '#0F121C');
    bgGrad.addColorStop(0.5, '#0B0D14');
    bgGrad.addColorStop(1, '#05060A');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Partículas Cósmicas de Fondo
    if (this.options.particleStars) {
      this._renderBackgroundParticles();
    }

    // 3. Ejes de Coordenadas y Anillos de Espacio
    if (this.options.showGridAxes) {
      this._renderSpatialAxes();
    }

    // 4. Recopilar todos los elementos a dibujar (Nodos, Líneas, Polígonos)
    const elementsToDraw = [];
    const linesToDraw = [];
    const facesToDraw = [];

    // Nube de Modelo Base
    if (this.options.showSolidCloud) {
      let baseNodes = [];
      if (this.activeModel === 'munsell') {
        baseNodes = this.getMunsellGeometry();
      } else if (this.activeModel === 'tesseract') {
        const tess = this.getTesseractGeometry();
        baseNodes = tess.nodes;
        tess.edges.forEach(e => {
          const n1 = baseNodes.find(n => n.id === e.from);
          const n2 = baseNodes.find(n => n.id === e.to);
          if (n1 && n2) linesToDraw.push({ from: n1, to: n2, color: 'rgba(99, 102, 241, 0.4)', width: 1.5 });
        });
      } else if (this.activeModel === 'cielab') {
        baseNodes = this.getCieLabGeometry();
      } else if (this.activeModel === 'hsl_cone') {
        baseNodes = this.getHslConeGeometry();
      }
      elementsToDraw.push(...baseNodes);
    }

    // Muestra Activa y sus Desgloses
    const curRgb = this.app?.fgColor || { r: 99, g: 102, b: 241 };
    const activeData = this.getActiveColorNodes(curRgb);
    elementsToDraw.push(...activeData.nodes);
    linesToDraw.push(...activeData.lines);
    facesToDraw.push(...activeData.faces);

    // Constelación de Paleta
    const palData = this.getPaletteConstellationGeometry();
    elementsToDraw.push(...palData.nodes);
    linesToDraw.push(...palData.lines);

    // Muestras en Modo Comparador
    this._collectCompareNodes(elementsToDraw, linesToDraw);

    // 5. PROYECCIÓN 4D -> 3D -> 2D
    const projectedNodes = [];
    elementsToDraw.forEach(node => {
      // Rotación 4D
      const r4 = this.rotatePoint4D(node, this.dimension4D.angleXW, this.dimension4D.angleYW, this.dimension4D.angleZW);
      // Proyección 4D -> 3D
      const p3 = this.project4DTo3D(r4);
      // Proyección 3D -> 2D
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

    // Guardar para hit-testing de ratón
    this.renderedNodes = projectedNodes;

    // 6. DIBUJAR CARAS TRANSLÚCIDAS (Depth sorted)
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
        this.ctx.fillStyle = face.fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });

    // 7. DIBUJAR LÍNEAS Y VECTORES CON RESPLANDOR
    linesToDraw.forEach(line => {
      const p1 = projectedNodes.find(pn => pn.node.id === line.from.id);
      const p2 = projectedNodes.find(pn => pn.node.id === line.to.id);
      if (p1 && p2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = line.color || '#FFFFFF';
        this.ctx.lineWidth = (line.width || 1.5) * Math.min(1.5, Math.max(0.5, p1.scale * 1.2));
        if (line.dash) this.ctx.setLineDash(line.dash);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rótulo del vector en el punto medio
        if (line.label && this.options.showLabels) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          this.ctx.fillStyle = line.color || '#E2E8F0';
          this.ctx.font = 'bold 9px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(line.label, midX, midY - 4);
        }
      }
    });

    // 8. DIBUJAR NODOS ORDENADOS POR PROFUNDIDAD (Z-Sorting)
    projectedNodes.sort((a, b) => b.depth - a.depth);

    projectedNodes.forEach(item => {
      const { node, x, y, scale } = item;
      const isHovered = this.hoveredNode && this.hoveredNode.node.id === node.id;
      const isPrimary = node.isPrimary;
      const baseRadius = (node.size || 4) * scale;
      const radius = Math.max(1.8, Math.min(30, isHovered ? baseRadius * 1.4 : baseRadius));

      // Halo resplandeciente para nodos primarios o hovered
      if (isPrimary || isHovered || node.type === 'active_center') {
        const glowRad = radius * 2.8;
        const glowGrad = this.ctx.createRadialGradient(x, y, radius * 0.4, x, y, glowRad);
        glowGrad.addColorStop(0, node.hex + '99');
        glowGrad.addColorStop(0.6, node.hex + '33');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowRad, 0, Math.PI * 2);
        this.ctx.fill();

        // Anillo exterior pulsante
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // Esfera del color
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.hex;
      this.ctx.fill();

      // Borde del nodo
      this.ctx.strokeStyle = isHovered ? '#FFFFFF' : (isPrimary ? '#FBBF24' : 'rgba(0,0,0,0.5)');
      this.ctx.lineWidth = isHovered ? 2 : 1;
      this.ctx.stroke();

      // Rótulos para nodos clave
      if (this.options.showLabels && (isPrimary || isHovered || node.type === 'vector_light' || node.type === 'vector_shadow' || node.type === 'compare_sample')) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = isPrimary ? 'bold 11px sans-serif' : '9px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(node.name || node.hex, x, y - radius - 4);
      }
    });

    // 9. DIBUJAR TOOLTIP FLOTANTE SI HAY HOVER
    if (this.hoveredNode) {
      this._drawTooltip(this.hoveredNode);
    }
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
    // Anillos de referencia cromática
    const center2D = this.project3DTo2D({ x: 0, y: 0, z: 0 });
    if (!center2D.visible) return;

    // Eje Vertical de Luminosidad / Valor (Luz a Sombra)
    const top2D = this.project3DTo2D({ x: 0, y: 150, z: 0 });
    const bottom2D = this.project3DTo2D({ x: 0, y: -150, z: 0 });
    if (top2D.visible && bottom2D.visible) {
      this.ctx.beginPath();
      this.ctx.moveTo(bottom2D.screenX, bottom2D.screenY);
      this.ctx.lineTo(top2D.screenX, top2D.screenY);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.font = '8px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('▲ Valor 10 (Luz)', top2D.screenX, top2D.screenY - 6);
      this.ctx.fillText('▼ Valor 0 (Sombra)', bottom2D.screenX, bottom2D.screenY + 12);
    }

    // Anillo ecuatorial cromático (Croma / Saturación)
    const ringRadius = 140;
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
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
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
      const coords = this._getColor4DCoords(slot.rgb);
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
        size: 9.5
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
        if (N === 2 && i === 1) break; // Si solo son 2 muestras, un solo vector de ida
        lines.push({
          from: slotNodes[i],
          to: slotNodes[nextIdx],
          color: '#F59E0B',
          width: 2.2,
          dash: [5, 3],
          label: N === 2 ? 'Vector Comparativo A ↔ B' : (i === 0 ? 'Polígono 4D Comparativo' : '')
        });
      }

      // Si hay de 4 a 6 muestras, trazar cuerdas diagonales sutiles para formar la red
      if (N >= 4 && N <= 6) {
        for (let i = 0; i < N; i++) {
          for (let j = i + 2; j < N; j++) {
            if (i === 0 && j === N - 1) continue;
            lines.push({
              from: slotNodes[i],
              to: slotNodes[j],
              color: 'rgba(245, 158, 11, 0.22)',
              width: 1,
              dash: [2, 4]
            });
          }
        }
      }

      // Baricentro Colectivo Físico en 4D (Mezcla 1/N exacta)
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
        size: 7.5
      };
      elements.push(mixNode);

      // Rayos de conexión punteados desde cada muestra hacia el baricentro
      slotNodes.forEach(sn => {
        lines.push({
          from: sn,
          to: mixNode,
          color: 'rgba(56, 189, 248, 0.35)',
          width: 1.2,
          dash: [3, 3]
        });
      });
    }
  }

  _drawTooltip(item) {
    const { node, x, y } = item;
    const padding = 8;
    const title = node.name || node.hex;
    const sub = node.munsell ? `Munsell: ${node.munsell}` : (node.coords4D ? `4D: ${node.coords4D}` : node.hex);

    this.ctx.font = 'bold 11px sans-serif';
    const titleWidth = this.ctx.measureText(title).width;
    this.ctx.font = '9px monospace';
    const subWidth = this.ctx.measureText(sub).width;
    const boxW = Math.max(titleWidth, subWidth) + padding * 2 + 20;
    const boxH = 40;

    const boxX = Math.min(this.displayWidth - boxW - 10, Math.max(10, x - boxW / 2));
    const boxY = Math.max(10, y - boxH - 14);

    // Fondo tarjeta flotante
    this.ctx.fillStyle = 'rgba(15, 18, 28, 0.92)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Muestra de color
    this.ctx.fillStyle = node.hex;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX + 8, boxY + 10, 18, 20, 3);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    this.ctx.stroke();

    // Textos
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(title, boxX + 32, boxY + 8);

    this.ctx.fillStyle = '#94A3B8';
    this.ctx.font = '9px monospace';
    this.ctx.fillText(sub, boxX + 32, boxY + 22);
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
      this.camera.autoRotate = false; // Detener auto-rotación al interactuar
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
        this.camera.rotY += dx * 0.007 * signX;
        this.camera.rotX = Math.max(-1.4, Math.min(1.4, this.camera.rotX + dy * 0.007 * signY));
        this.camera.lastMouseX = e.clientX;
        this.camera.lastMouseY = e.clientY;
        return;
      }

      if (this.camera.isPanning) {
        const dx = e.clientX - this.camera.lastMouseX;
        const dy = e.clientY - this.camera.lastMouseY;
        this.camera.panX += dx;
        this.camera.panY += dy;
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
          if (dist <= Math.max(12, (item.node.size || 4) * item.scale + 6)) {
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

    // Zoom con rueda del ratón
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.camera.zoom = Math.max(0.3, Math.min(3.8, this.camera.zoom * zoomFactor));
    }, { passive: false });

    // Clic para seleccionar nodo y cargarlo en la rueda cromática
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

    // 5. Controles de Cámara Rápida
    const btnResetCam = document.getElementById('btnHyper4DResetCam');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        this.camera.rotX = 0.35;
        this.camera.rotY = -0.65;
        this.camera.zoom = 1.05;
        this.camera.panX = 0;
        this.camera.panY = 0;
      });
    }

    const btnAutoRotate = document.getElementById('btnHyper4DAutoRotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        this.camera.autoRotate = !this.camera.autoRotate;
        btnAutoRotate.classList.toggle('active', this.camera.autoRotate);
      });
    }

    // 6. Vistas Ortogonales (Cenital, Frontal, Lateral, Isométrica)
    const btnViewTop = document.getElementById('btnHyper4DViewTop');
    if (btnViewTop) {
      btnViewTop.addEventListener('click', () => {
        this.camera.rotX = Math.PI / 2;
        this.camera.rotY = 0;
        this.camera.autoRotate = false;
      });
    }

    const btnViewFront = document.getElementById('btnHyper4DViewFront');
    if (btnViewFront) {
      btnViewFront.addEventListener('click', () => {
        this.camera.rotX = 0;
        this.camera.rotY = 0;
        this.camera.autoRotate = false;
      });
    }

    const btnViewSide = document.getElementById('btnHyper4DViewSide');
    if (btnViewSide) {
      btnViewSide.addEventListener('click', () => {
        this.camera.rotX = 0;
        this.camera.rotY = Math.PI / 2;
        this.camera.autoRotate = false;
      });
    }

    // 7. Toggles de Opciones de Visualización
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

    // Toggles de Inversión de Ejes del Ratón
    const chkInvX = document.getElementById('chkHyper4DInvertX');
    if (chkInvX) {
      chkInvX.checked = this.camera.invertX;
      chkInvX.addEventListener('change', (e) => {
        this.camera.invertX = e.target.checked;
        localStorage.setItem('gom_hyper4d_invert_x', this.camera.invertX);
        if (this.app?.showToast) {
          this.app.showToast(this.camera.invertX ? 'Eje horizontal X del ratón invertido' : 'Eje horizontal X normal', 'info');
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
          this.app.showToast(this.camera.invertY ? 'Eje vertical Y del ratón invertido' : 'Eje vertical Y normal', 'info');
        }
      });
    }

    // 8. Control de Pantalla Completa Inmersiva
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

    // Atajos de Teclado (Tecla F para Pantalla Completa, Escape para salir)
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o chat
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      // Solo si la pestaña 4D está visible
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

    // 9. Pestañas del Panel Lateral (Inspector, Composición, Comparador, Constelación, Maestros)
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

    // 10. Presets de Maestros
    document.querySelectorAll('.hyper4d-master-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.master;
        this._loadMasterPreset(key);
      });
    });

    // 11. Botón de Exportar Captura HD
    const btnSnapshot = document.getElementById('btnHyper4DSnapshot');
    if (btnSnapshot) {
      btnSnapshot.addEventListener('click', () => this.exportSnapshot());
    }

    // 12. Botón Inspirar Paleta
    const btnInspire = document.getElementById('btnHyper4DInspirePalette');
    if (btnInspire) {
      btnInspire.addEventListener('click', () => this.generateInspiredPalette());
    }
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

    setTimeout(() => this._resizeCanvas(), 60);

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

    setTimeout(() => this._resizeCanvas(), 60);
  }

  toggleSidebar() {
    const wrapper = document.getElementById('hyper4dMainWrapper');
    if (!wrapper) return;

    this.options.isSidebarHidden = !this.options.isSidebarHidden;
    wrapper.classList.toggle('sidebar-hidden', this.options.isSidebarHidden);

    const btnToggle = document.getElementById('btnHyper4DFsToggleSidebar');
    if (btnToggle) {
      const txtSpan = btnToggle.querySelector('.fs-btn-txt');
      if (txtSpan) txtSpan.textContent = this.options.isSidebarHidden ? 'Mostrar Panel' : 'Ocultar Panel';
    }

    setTimeout(() => this._resizeCanvas(), 60);
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

  syncWithActiveColor(rgb = null) {
    const curRgb = rgb || this.app?.fgColor || { r: 99, g: 102, b: 241 };
    const hex = ColorMath.rgbToHex(curRgb.r, curRgb.g, curRgb.b);
    const munsell = MunsellSystem.rgbToMunsell(curRgb.r, curRgb.g, curRgb.b);
    const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;

    // Actualizar Muestra seleccionada del Comparador si autoSyncWheel está activo
    if (this.autoSyncWheel && this.compareSlots && this.compareSlots.length > 0) {
      const targetSlot = this.compareSlots.find(s => s.id === this.activeTargetSlotId) || this.compareSlots[0];
      if (targetSlot) {
        targetSlot.hex = hex;
        targetSlot.rgb = curRgb;
        this._updateSlotCardDOM(targetSlot.id);
      }
    }

    // Actualizar Tarjeta de Inspección HTML
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

  // --- MOTOR DE COMPARACIÓN MULTIMUESTRAS DINÁMICO (4D MULTI-SAMPLE COMPARATOR) ---

  _getColor4DCoords(rgb) {
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const munsell = MunsellSystem.rgbToMunsell(rgb.r, rgb.g, rgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;
    const rad = (hsv.h * Math.PI) / 180;
    const chromaRadius = (munsell.chroma || (hsv.s * 14)) * 14;
    const x = chromaRadius * Math.cos(rad);
    const z = chromaRadius * Math.sin(rad);
    const y = ((munsell.value || (hsv.v * 9)) - 5) * 32;

    let w = 0;
    if (this.dimension4D.wMode === 'thermal') {
      w = (isWarm ? 30 : -30) + (this.dimension4D.wValue * 0.6);
    } else if (this.dimension4D.wMode === 'subtractive') {
      w = this.dimension4D.wValue;
    } else if (this.dimension4D.wMode === 'diurnal') {
      w = Math.sin(this.dimension4D.wValue * 0.05) * 50;
    } else {
      w = this.dimension4D.wValue * 0.8;
    }

    return { x, y, z, w, hsv, munsell, isWarm };
  }

  _calculateMultiPhysicalMix(rgbList) {
    if (!rgbList || rgbList.length === 0) return { r: 128, g: 128, b: 128 };
    if (rgbList.length === 1) return { ...rgbList[0] };

    // Mezcla sustractiva física 1/N iterativa en espacio RYB
    let accum = { ...rgbList[0] };
    for (let i = 1; i < rgbList.length; i++) {
      const weight = 1 / (i + 1);
      accum = ColorMath.mixRyb(accum, rgbList[i], weight);
    }
    return accum;
  }

  _bindCompareControls() {
    // 1. Botón Añadir Muestra
    const btnAdd = document.getElementById('btnHyper4DAddCompareSlot');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.addCompareSlot());
    }

    // 2. Botón Cargar Paleta Activa
    const btnPal = document.getElementById('btnHyper4DLoadActivePalette');
    if (btnPal) {
      btnPal.addEventListener('click', () => this.loadActivePaletteIntoSlots());
    }

    // 3. Botón Cargar FG & BG
    const btnFgBg = document.getElementById('btnHyper4DLoadFgBg');
    if (btnFgBg) {
      btnFgBg.addEventListener('click', () => this.loadFgBgIntoSlots());
    }

    // 4. Checkbox Auto-sync Rueda con la Muestra Objetivo
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

    // 5. Selector de Muestra Objetivo para la Rueda
    const selTarget = document.getElementById('hyper4dWheelTargetSelect');
    if (selTarget) {
      selTarget.addEventListener('change', (e) => {
        this.setActiveTargetSlot(e.target.value);
      });
    }

    // 6. Pestañas de Sub-vistas (Métricas, Composición, Mezcla 4D)
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

    // Actualizar estilo de selección activa en tarjetas
    document.querySelectorAll('.hyper4d-compare-slot-card').forEach(card => {
      const isTarget = card.dataset.slotId === slotId;
      card.classList.toggle('slot-is-target', isTarget);
      const targetBadge = card.querySelector('.hyper4d-slot-target-badge');
      if (targetBadge) {
        targetBadge.style.display = isTarget ? 'inline-block' : 'none';
      }
    });

    // Actualizar select de la barra
    const select = document.getElementById('hyper4dWheelTargetSelect');
    if (select && select.value !== slotId) {
      select.value = slotId;
    }

    // Actualizar botones de asignación rápida
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

    // Actualizar indicador en barra de asignación rápida
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

    // Actualizar barra de asignación rápida
    this.renderQuickAssignBar();

    // Event bindings para las tarjetas
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

    // 1. Datos cromáticos y 4D para cada muestra
    const slotData = activeSlots.map(slot => {
      const lab = this._rgbToLab(slot.rgb);
      const coords = this._getColor4DCoords(slot.rgb);
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

    // 2. Matriz Cruzada Pairwise (CIE76 ΔE y Contraste WCAG)
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

    // 3. Rango de Luminosidad y Balance Térmico
    const luminances = slotData.map(d => d.lab.L);
    const minL = Math.min(...luminances);
    const maxL = Math.max(...luminances);
    const deltaL = maxL - minL;

    const warmCount = slotData.filter(d => d.isWarm).length;
    const coolCount = N - warmCount;
    const warmPct = Math.round((warmCount / N) * 100);
    const coolPct = 100 - warmPct;

    // --- VISTA 1: ESTADÍSTICAS GLOBALES ---
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

    // --- VISTA 1: MATRIZ PAIRWISE ---
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

    // --- VISTA 1: TABLA DE COORDENADAS 4D ---
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

    // --- VISTA 2: RELACIÓN ARMÓNICA Y GOETHE ---
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

    // Proporciones de Goethe
    const goetheBox = document.getElementById('hyper4dCompGoetheHierarchyBox');
    if (goetheBox) {
      const goetheWeights = slotData.map(d => {
        const h = d.hsv.h;
        let w = 6;
        if (h >= 45 && h < 75) w = 9;       // Amarillo = 9
        else if (h >= 25 && h < 45) w = 8;  // Naranja = 8
        else if (h >= 340 || h < 25) w = 6; // Rojo = 6
        else if (h >= 270 && h < 340) w = 3;// Violeta = 3
        else if (h >= 200 && h < 270) w = 4;// Azul = 4
        else if (h >= 75 && h < 200) w = 6; // Verde = 6

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

    // Roles Compositivos
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

    // --- VISTA 3: BARICENTRO Y MEZCLA FÍSICA COLECTIVA ---
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

    // Actualizar clase active en chips
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

      // Bind chips
      descEl.querySelectorAll('.chat-color-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const hex = btn.dataset.hex;
          if (hex && this.app) {
            this.app.setColorDirectly(ColorMath.hexToRgb(hex));
          }
        });
      });
    }

    // Cargar el primer color en la rueda
    if (preset.colors.length > 0 && this.app) {
      this.app.setColorDirectly(ColorMath.hexToRgb(preset.colors[0]));
      if (this.app.showToast) {
        this.app.showToast(`Constelación 4D de ${preset.author} cargada`, 'info');
      }
    }
  }



  generateInspiredPalette() {
    const curRgb = this.app?.fgColor || { r: 99, g: 102, b: 241 };
    const hsv = ColorMath.rgbToHsv(curRgb.r, curRgb.g, curRgb.b);

    // Crea un esquema armónico pentacromático en el espacio 4D
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

    // XYZ a sRGB
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
