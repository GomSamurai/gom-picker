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
      autoRotateSpeed: 0.003
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
      showPaletteConstellation: true,
      showLabels: true,
      particleStars: true
    };

    // Muestras en el Comparador (Hasta 4)
    this.compareSlots = [
      { id: 'A', name: 'Muestra Activa A', hex: '#6366F1', rgb: { r: 99, g: 102, b: 241 }, active: true },
      { id: 'B', name: 'Muestra Comparada B', hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, active: true },
      { id: 'C', name: 'Muestra C', hex: '#10B981', rgb: { r: 16, g: 185, b: 129 }, active: false },
      { id: 'D', name: 'Muestra D', hex: '#EC4899', rgb: { r: 236, g: 72, b: 153 }, active: false }
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
    const activeSlots = this.compareSlots.filter(s => s.active);
    if (activeSlots.length < 2) return;

    const slotNodes = [];
    activeSlots.forEach(slot => {
      const hsv = ColorMath.rgbToHsv(slot.rgb.r, slot.rgb.g, slot.rgb.b);
      const rad = (hsv.h * Math.PI) / 180;
      const chromaRadius = (hsv.s * 14) * 14;
      const x = chromaRadius * Math.cos(rad);
      const z = chromaRadius * Math.sin(rad);
      const y = (hsv.v * 9 - 5) * 32;

      const node = {
        id: `compare_slot_${slot.id}`,
        type: 'compare_sample',
        slotId: slot.id,
        x, y, z, w: 0,
        hex: slot.hex,
        rgb: slot.rgb,
        name: `[${slot.id}] ${slot.name}`,
        size: 9
      };
      elements.push(node);
      slotNodes.push(node);
    });

    // Conectar A y B con vector de comparación analítico
    if (slotNodes.length >= 2) {
      const nodeA = slotNodes[0];
      const nodeB = slotNodes[1];
      lines.push({
        from: nodeA,
        to: nodeB,
        color: '#F59E0B',
        width: 2.5,
        dash: [5, 3],
        label: 'Vector Comparativo A ↔ B'
      });

      // Punto medio de colisión física (Mezcla 50/50)
      const mixRgb = ColorMath.mixRyb(nodeA.rgb, nodeB.rgb, 0.5);
      const mixHex = ColorMath.rgbToHex(mixRgb.r, mixRgb.g, mixRgb.b);
      const mixNode = {
        id: 'compare_mix_point',
        type: 'compare_mix',
        x: (nodeA.x + nodeB.x) / 2,
        y: (nodeA.y + nodeB.y) / 2,
        z: (nodeA.z + nodeB.z) / 2,
        w: 0,
        hex: mixHex,
        rgb: mixRgb,
        name: `Mezcla 50/50 (${mixHex})`,
        size: 6
      };
      elements.push(mixNode);
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
        this.camera.rotY += dx * 0.007;
        this.camera.rotX = Math.max(-1.4, Math.min(1.4, this.camera.rotX + dy * 0.007));
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
    bindToggle('chkHyper4DPalette', 'showPaletteConstellation');

    // 8. Pestañas del Panel Lateral (Inspector, Comparador, Constelación, Maestros)
    const subTabs = document.querySelectorAll('.hyper4d-subtab-btn');
    const subPanels = {
      inspect: document.getElementById('hyper4dPanelInspect'),
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

    // 9. Presets de Maestros
    document.querySelectorAll('.hyper4d-master-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.master;
        this._loadMasterPreset(key);
      });
    });

    // 10. Botón de Exportar Captura HD
    const btnSnapshot = document.getElementById('btnHyper4DSnapshot');
    if (btnSnapshot) {
      btnSnapshot.addEventListener('click', () => this.exportSnapshot());
    }

    // 11. Botón Inspirar Paleta
    const btnInspire = document.getElementById('btnHyper4DInspirePalette');
    if (btnInspire) {
      btnInspire.addEventListener('click', () => this.generateInspiredPalette());
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
    const lab = ColorMath.rgbToOklch(curRgb.r, curRgb.g, curRgb.b);
    const isWarm = (hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320;

    // Actualizar Muestra A del Comparador
    if (this.compareSlots[0]) {
      this.compareSlots[0].hex = hex;
      this.compareSlots[0].rgb = curRgb;
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

    // Actualizar análisis de Florent Farges en la tarjeta
    const solver = FlorentFargesEngine.solveMixingForColor(curRgb);
    const adviceEl = document.getElementById('hyper4dFargesAdvice');
    if (adviceEl && solver) {
      adviceEl.innerHTML = `
        <div style="margin-bottom: 4px;"><strong>Pigmentos recomendados:</strong> ${solver.cand1.name} (${solver.cand1.percent}%) + ${solver.cand2.name} (${solver.cand2.percent}%)</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">${solver.valueAdvice}</div>
      `;
    }

    // Actualizar datos del Comparador
    this._updateComparisonPanel();
  }

  _updateComparisonPanel() {
    const slotA = this.compareSlots[0];
    const slotB = this.compareSlots[1];
    if (!slotA || !slotB) return;

    const compEl = document.getElementById('hyper4dComparisonStats');
    if (!compEl) return;

    // Calcular Delta-E (CIE76 aproximado)
    const labA = this._rgbToLab(slotA.rgb);
    const labB = this._rgbToLab(slotB.rgb);
    const deltaE = Math.sqrt(
      Math.pow(labA.L - labB.L, 2) +
      Math.pow(labA.a - labB.a, 2) +
      Math.pow(labA.b - labB.b, 2)
    );

    // Contraste WCAG
    const contrast = ColorMath.calculateContrastRatio(slotA.rgb, slotB.rgb);

    // Salto de temperatura
    const hsvA = ColorMath.rgbToHsv(slotA.rgb.r, slotA.rgb.g, slotA.rgb.b);
    const hsvB = ColorMath.rgbToHsv(slotB.rgb.r, slotB.rgb.g, slotB.rgb.b);
    const warmA = (hsvA.h >= 0 && hsvA.h <= 75) || hsvA.h >= 320;
    const warmB = (hsvB.h >= 0 && hsvB.h <= 75) || hsvB.h >= 320;

    let deltaInterpretation = 'Imperceptible a simple vista';
    if (deltaE > 45) deltaInterpretation = 'Contraste perceptual extremo (Foco de atención)';
    else if (deltaE > 25) deltaInterpretation = 'Contraste elevado y nítido';
    else if (deltaE > 10) deltaInterpretation = 'Diferencia tonal clara y armónica';
    else if (deltaE > 3) deltaInterpretation = 'Variación sutil / matiz cercano';

    compEl.innerHTML = `
      <div class="hyper4d-stat-row">
        <span>Distancia Perceptual ΔE:</span>
        <strong style="color: #38BDF8;">${deltaE.toFixed(1)} (${deltaInterpretation})</strong>
      </div>
      <div class="hyper4d-stat-row">
        <span>Ratio de Contraste Luminoso:</span>
        <strong style="color: #FBBF24;">${contrast.toFixed(2)}:1 ${contrast >= 4.5 ? '✅ Legible en B/N' : '⚠️ Contraste suave'}</strong>
      </div>
      <div class="hyper4d-stat-row">
        <span>Diálogo Térmico:</span>
        <strong style="color: #F472B6;">${warmA !== warmB ? '⚡ Contraste Cálido / Frío directo' : 'Unidad térmica homogénea'}</strong>
      </div>
    `;
  }

  _loadMasterPreset(key) {
    const preset = this.masterPresets[key];
    if (!preset) return;

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
