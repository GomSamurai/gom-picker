/**
 * GOM Picker - Florent Farges Practical Color Theory & Color Mixing System
 * Implements Florent Farges' "Three Wheel System", Real Pigment Mapping,
 * Inherent Value Scales, Subtractive Bow Curves, Academic Flesh Gamut,
 * and the Classic "Yellow + Black" Olive Phenomenon.
 */

import { ColorMath } from './colorMath.js';

export const FlorentFargesEngine = {
  // --- FLORENT FARGES PIGMENT DATABASE ---
  // Pigments mapped by their optical hue angle, inherent value (1-9), tinting strength, and properties
  PIGMENTS: [
    {
      id: 'cad_lemon',
      name: 'Amarillo Limón Cadmio',
      intlName: 'Cadmium Lemon / Light',
      ci: 'PY35',
      angle: 62,
      inherentValue: 8.5,
      tintingStrength: 8,
      opacity: 'Opaco',
      temperature: 'Frío (vira a verde)',
      hex: '#FFF200',
      rgb: { r: 255, g: 242, b: 0 },
      role: 'Primario amarillo frío'
    },
    {
      id: 'cad_yellow_med',
      name: 'Amarillo Cadmio Medio',
      intlName: 'Cadmium Yellow Medium',
      ci: 'PY35',
      angle: 48,
      inherentValue: 8.0,
      tintingStrength: 8,
      opacity: 'Opaco',
      temperature: 'Cálido (dorado profundo)',
      hex: '#FFD700',
      rgb: { r: 255, g: 215, b: 0 },
      role: 'Primario amarillo cálido'
    },
    {
      id: 'yellow_ochre',
      name: 'Ocre Amarillo',
      intlName: 'Yellow Ochre',
      ci: 'PY43',
      angle: 42,
      inherentValue: 6.2,
      tintingStrength: 5,
      opacity: 'Semi-opaco',
      temperature: 'Tierra cálida moderada',
      hex: '#CC9933',
      rgb: { r: 204, g: 153, b: 51 },
      role: 'Tierra esencial / carnaciones'
    },
    {
      id: 'raw_sienna',
      name: 'Siena Natural',
      intlName: 'Raw Sienna',
      ci: 'PBr7',
      angle: 35,
      inherentValue: 5.5,
      tintingStrength: 4,
      opacity: 'Semi-transparente',
      temperature: 'Tierra dorada cálida',
      hex: '#C67128',
      rgb: { r: 198, g: 113, b: 40 },
      role: 'Tierra de veladura luminosa'
    },
    {
      id: 'cad_orange',
      name: 'Naranja de Cadmio',
      intlName: 'Cadmium Orange',
      ci: 'PO20',
      angle: 28,
      inherentValue: 6.0,
      tintingStrength: 7,
      opacity: 'Opaco',
      temperature: 'Extremadamente cálido',
      hex: '#FF5E00',
      rgb: { r: 255, g: 94, b: 0 },
      role: 'Secundario de alta intensidad'
    },
    {
      id: 'burnt_sienna',
      name: 'Siena Tostada',
      intlName: 'Burnt Sienna',
      ci: 'PBr7',
      angle: 18,
      inherentValue: 4.2,
      tintingStrength: 6,
      opacity: 'Semi-transparente',
      temperature: 'Tierra rojiza cálida',
      hex: '#8D361F',
      rgb: { r: 141, g: 54, b: 31 },
      role: 'Neutralizador de azules y sombra cálida'
    },
    {
      id: 'cad_red_light',
      name: 'Rojo Cadmio Claro',
      intlName: 'Cadmium Red Light',
      ci: 'PR108',
      angle: 10,
      inherentValue: 4.8,
      tintingStrength: 8,
      opacity: 'Opaco',
      temperature: 'Cálido (bermellón escarlata)',
      hex: '#E62E00',
      rgb: { r: 230, g: 46, b: 0 },
      role: 'Primario rojo cálido'
    },
    {
      id: 'cad_red_med',
      name: 'Rojo Cadmio Medio',
      intlName: 'Cadmium Red Medium',
      ci: 'PR108',
      angle: 0,
      inherentValue: 4.0,
      tintingStrength: 8,
      opacity: 'Opaco',
      temperature: 'Cálido puro y denso',
      hex: '#D91424',
      rgb: { r: 217, g: 20, b: 36 },
      role: 'Rojo puro de estudio'
    },
    {
      id: 'alizarin_crimson',
      name: 'Carmín de Alizarina / Rosa Perm.',
      intlName: 'Alizarin Crimson / Perm. Rose',
      ci: 'PR177 / PV19',
      angle: 345,
      inherentValue: 3.2,
      tintingStrength: 7,
      opacity: 'Transparente',
      temperature: 'Frío (rojo azulado)',
      hex: '#9E1338',
      rgb: { r: 158, g: 19, b: 56 },
      role: 'Rojo frío tradicional de veladura'
    },
    {
      id: 'quin_magenta',
      name: 'Magenta Quinacridona',
      intlName: 'Quinacridone Magenta',
      ci: 'PR122',
      angle: 328,
      inherentValue: 3.5,
      tintingStrength: 9,
      opacity: 'Transparente',
      temperature: 'Frío puro (el auténtico primario sustractivo)',
      hex: '#C01368',
      rgb: { r: 192, g: 19, b: 104 },
      role: 'Primario sustractivo magenta'
    },
    {
      id: 'dioxazine_violet',
      name: 'Violeta Dioxacina',
      intlName: 'Dioxazine Violet',
      ci: 'PV23',
      angle: 282,
      inherentValue: 1.8,
      tintingStrength: 10,
      opacity: 'Semi-transparente',
      temperature: 'Frío extremo (fuerza de tinte descomunal)',
      hex: '#4A154B',
      rgb: { r: 74, g: 21, b: 75 },
      role: 'Violeta oscuro de máxima potencia'
    },
    {
      id: 'ultramarine_blue',
      name: 'Azul Ultramar Francés',
      intlName: 'French Ultramarine',
      ci: 'PB29',
      angle: 236,
      inherentValue: 2.2,
      tintingStrength: 6,
      opacity: 'Semi-transparente',
      temperature: 'Cálido para ser azul (vira a violeta)',
      hex: '#1B2682',
      rgb: { r: 27, g: 38, b: 130 },
      role: 'Primario azul clásico de atelier'
    },
    {
      id: 'cobalt_blue',
      name: 'Azul Cobalto',
      intlName: 'Cobalt Blue',
      ci: 'PB28',
      angle: 218,
      inherentValue: 3.5,
      tintingStrength: 5,
      opacity: 'Semi-opaco',
      temperature: 'Azul puro y neutral',
      hex: '#0047AB',
      rgb: { r: 0, g: 71, b: 171 },
      role: 'Azul atmosférico y cielo puro'
    },
    {
      id: 'cerulean_blue',
      name: 'Azul Cerúleo',
      intlName: 'Cerulean Blue',
      ci: 'PB35',
      angle: 202,
      inherentValue: 4.8,
      tintingStrength: 4,
      opacity: 'Opaco',
      temperature: 'Frío (vira a verde)',
      hex: '#2A82BE',
      rgb: { r: 42, g: 130, b: 190 },
      role: 'Azul verdoso opaco para atmósfera'
    },
    {
      id: 'phthalo_blue',
      name: 'Azul Ftalo (Sombra Verde)',
      intlName: 'Phthalo Blue (GS)',
      ci: 'PB15:3',
      angle: 190,
      inherentValue: 2.0,
      tintingStrength: 10,
      opacity: 'Transparente',
      temperature: 'Frío cortante (el auténtico primario cian)',
      hex: '#003366',
      rgb: { r: 0, g: 51, b: 102 },
      role: 'Primario sustractivo cian'
    },
    {
      id: 'viridian',
      name: 'Verde Viridián (Esmeralda)',
      intlName: 'Viridian',
      ci: 'PG18',
      angle: 162,
      inherentValue: 3.2,
      tintingStrength: 5,
      opacity: 'Transparente',
      temperature: 'Verde frío de veladura',
      hex: '#126848',
      rgb: { r: 18, g: 104, b: 72 },
      role: 'Verde frío clásico'
    },
    {
      id: 'phthalo_green',
      name: 'Verde Ftalo',
      intlName: 'Phthalo Green',
      ci: 'PG7',
      angle: 150,
      inherentValue: 2.1,
      tintingStrength: 10,
      opacity: 'Transparente',
      temperature: 'Frío extremo de enorme intensidad',
      hex: '#005E3D',
      rgb: { r: 0, g: 94, b: 61 },
      role: 'Verde de máxima saturación'
    },
    {
      id: 'chromium_oxide',
      name: 'Óxido de Cromo Verde',
      intlName: 'Chromium Oxide Green',
      ci: 'PG17',
      angle: 124,
      inherentValue: 4.5,
      tintingStrength: 8,
      opacity: 'Opaco denso',
      temperature: 'Verde tierra apagado / oliva',
      hex: '#4A6538',
      rgb: { r: 74, g: 101, b: 56 },
      role: 'Verde tierra opaco natural'
    },
    {
      id: 'raw_umber',
      name: 'Sombra Natural',
      intlName: 'Raw Umber',
      ci: 'PBr7',
      angle: 50,
      inherentValue: 2.3,
      tintingStrength: 6,
      opacity: 'Semi-opaco',
      temperature: 'Tierra neutra fría / verdosa',
      hex: '#463A2B',
      rgb: { r: 70, g: 58, b: 43 },
      role: 'Oscurecedor universal / mata el amarillo sin verde chillón'
    },
    {
      id: 'burnt_umber',
      name: 'Sombra Tostada',
      intlName: 'Burnt Umber',
      ci: 'PBr7',
      angle: 24,
      inherentValue: 2.1,
      tintingStrength: 6,
      opacity: 'Semi-opaco',
      temperature: 'Tierra cálida oscura (chocolate)',
      hex: '#462C1E',
      rgb: { r: 70, g: 44, b: 30 },
      role: 'Sombra profunda cálida'
    },
    {
      id: 'ivory_black',
      name: 'Negro Marfil',
      intlName: 'Ivory Black',
      ci: 'PBk9',
      angle: 240, // Acts optically as dark blue
      inherentValue: 1.0,
      tintingStrength: 6,
      opacity: 'Semi-transparente',
      temperature: 'Frío (en rebaje con blanco es azul grisáceo)',
      hex: '#1E1D1B',
      rgb: { r: 30, g: 29, b: 27 },
      role: 'El azul frío secreto de la pintura al óleo'
    },
    {
      id: 'titanium_white',
      name: 'Blanco de Titanio',
      intlName: 'Titanium White',
      ci: 'PW6',
      angle: 0,
      inherentValue: 9.8,
      tintingStrength: 10,
      opacity: 'Completamente opaco',
      temperature: 'Neutro a ligeramente frío',
      hex: '#FDFBF7',
      rgb: { r: 253, g: 251, b: 247 },
      role: 'Aclarador de máxima potencia y opacidad'
    },
    {
      id: 'zinc_white',
      name: 'Blanco de Zinc',
      intlName: 'Zinc White',
      ci: 'PW4',
      angle: 0,
      inherentValue: 9.5,
      tintingStrength: 3,
      opacity: 'Transparente / veladuras',
      temperature: 'Frío limpio',
      hex: '#F9FBFD',
      rgb: { r: 249, g: 251, b: 253 },
      role: 'Aclarador delicado sin enturbiar'
    }
  ],

  // Current active wheel in the Three-Wheel-System viewer:
  // 1: Pigment Placement Wheel, 2: Mixing Lines & Bow Curves, 3: Inherent Value Scale
  activeWheelIndex: 1,

  // --- ACADEMIC FLESH TONE GAMUT (TRÍADA FACIAL DE FLORENT FARGES) ---
  FLESH_ZONES: [
    {
      id: 'zone_forehead',
      title: 'Zona Superior: Frente & Sienes (Amarilla / Dorada)',
      anatomical: 'Hueso craneal y piel delgada con menos irrigación capilar superficial.',
      temperature: 'Cálido dorado / amarillento suave',
      recipe: 'Ocre Amarillo (PY43) + Blanco de Titanio (PW6) + pizca de Rojo Cadmio (PR108)',
      ratio: '60% Blanco Titanio, 30% Ocre Amarillo, 10% Rojo Cadmio',
      hex: '#F2D3AC',
      rgb: { r: 242, g: 211, b: 172 }
    },
    {
      id: 'zone_cheeks',
      title: 'Zona Media: Mejillas, Nariz, Orejas & Labios (Roja / Rosada)',
      anatomical: 'Alta densidad de capilares sanguíneos y tejido muscular subcutáneo activo.',
      temperature: 'Cálido rojizo / encarnado vivo',
      recipe: 'Rojo Cadmio Claro (PR108) + Ocre Amarillo (PY43) + toque de Carmín (PR177) + Blanco',
      ratio: '45% Blanco Titanio, 30% Rojo Cadmio, 20% Ocre Amarillo, 5% Carmín',
      hex: '#EAA68C',
      rgb: { r: 234, g: 166, b: 140 }
    },
    {
      id: 'zone_jaw',
      title: 'Zona Inferior: Mandíbula, Cuello & Mentón (Fría / Oliva / Perla)',
      anatomical: 'Folículos pilosos microscópicos de la barba en hombres, y retorno venoso en mujeres.',
      temperature: 'Frío / Oliva perlado / Gris cromático delicado',
      recipe: 'Azul Ultramar (PB29) o Negro Marfil (PBk9) + Ocre Amarillo (PY43) + Blanco Titanio',
      ratio: '65% Blanco Titanio, 25% Ocre Amarillo, 10% Azul Ultramar',
      hex: '#C8BAA9',
      rgb: { r: 200, g: 186, b: 169 }
    },
    {
      id: 'zone_shadow',
      title: 'Sombras de la Piel & Pliegues Oculares',
      anatomical: 'Luz ambiental rebotada cálida, sin perder la profundidad del valor.',
      temperature: 'Cálido profundo / sin negro plano',
      recipe: 'Siena Tostada (PBr7) + Rojo Cadmio (PR108) + toque de Azul Ultramar (PB29)',
      ratio: '55% Siena Tostada, 30% Rojo Cadmio, 15% Azul Ultramar',
      hex: '#7A4333',
      rgb: { r: 122, g: 67, b: 51 }
    }
  ],

  // --- SOLVER DE MEZCLA DE FLORENT FARGES ---
  // Identifica los 2 pigmentos candidatos, la línea de mezcla, el neutralizador complementario
  // y el ajuste tonal de valor
  solveMixingForColor(rgb) {
    const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const targetAngle = hsl.h;
    const targetSaturation = hsl.s; // 0 to 1
    const targetLightness = hsl.l;  // 0 to 1
    const targetValue = hsv.v * 9;   // Scaled to 1-9 value scale

    // Chromatic pigments with specific angle (filter out pure whites and blacks)
    const spectralPigs = this.PIGMENTS.filter(p => !['titanium_white', 'zinc_white', 'ivory_black'].includes(p.id));

    // Sort pigments by angular distance along the wheel
    const sortedByAngle = [...spectralPigs].sort((a, b) => {
      const diffA = this._angularDiff(a.angle, targetAngle);
      const diffB = this._angularDiff(b.angle, targetAngle);
      return diffA - diffB;
    });

    // Top 2 candidate pigments that flank the target hue
    let cand1 = sortedByAngle[0];
    let cand2 = sortedByAngle[1];

    // Ensure cand1 and cand2 bracket the target angle if possible
    const angle1 = cand1.angle;
    const angle2 = cand2.angle;
    let weight1 = 0.5;
    let weight2 = 0.5;

    const span = this._angularDiff(angle1, angle2);
    if (span > 0) {
      const dist1 = this._angularDiff(angle1, targetAngle);
      weight2 = Math.min(1, Math.max(0, dist1 / span));
      weight1 = 1 - weight2;
    }

    // Complementary pigment on opposite side of wheel (180 deg)
    const oppAngle = (targetAngle + 180) % 360;
    const complement = [...spectralPigs].sort((a, b) => {
      return this._angularDiff(a.angle, oppAngle) - this._angularDiff(b.angle, oppAngle);
    })[0];

    // Value adjustment advice
    let valueAdvice = '';
    let whitePigment = 'Blanco de Titanio (PW6)';
    let darkPigment = 'Sombra Natural (PBr7) o Ultramar (PB29)';

    if (targetLightness > 0.7) {
      valueAdvice = `Añadir ${whitePigment} generosamente para elevar el valor. Si buscas una veladura transparente, usa Blanco de Zinc (PW4).`;
    } else if (targetLightness < 0.3) {
      if (targetAngle >= 30 && targetAngle <= 80) {
        // Special yellow rule by Florent Farges!
        valueAdvice = `¡ATENCIÓN DE FARGES!: El amarillo NO se oscurece con negro (lo convertiría en verde oliva). Usa Sombra Natural (PBr7) o Siena Tostada para mantener la calidez dorada.`;
      } else {
        valueAdvice = `Bajar el valor utilizando ${darkPigment}. Evita el negro puro para no matar la vibración luminosa del lienzo.`;
      }
    } else {
      valueAdvice = `Valor medio equilibrado. Ajusta la opacidad con pinceladas directas sin exceso de médium.`;
    }

    // Chroma / Neutralization advice
    let chromaAdvice = '';
    if (targetSaturation < 0.35) {
      chromaAdvice = `El color es un GRIS CROMÁTICO. No añadas negro ni gris manufacturado. Desatura la mezcla de (${cand1.name} + ${cand2.name}) añadiendo una pizca de su complementario óptico: ${complement.name} (${complement.ci}). Esto creará un neutro vivo y vibrante.`;
    } else if (targetSaturation < 0.7) {
      chromaAdvice = `Saturación moderada / natural. Usa una tierra como Ocre Amarillo (PY43) o Siena Tostada para aplacar la intensidad artificial de los cadmios.`;
    } else {
      chromaAdvice = `Máxima pureza cromática. Mantén la mezcla pura entre los dos pigmentos candidatos y utiliza pintura fresca en masa.`;
    }

    // Physical Pigment Behavior Note
    let behaviorNote = '';
    if (cand1.id.includes('phthalo') || cand2.id.includes('phthalo') || cand1.id.includes('dioxazine') || cand2.id.includes('dioxazine')) {
      behaviorNote = '⚠️ ADVERTENCIA DE TINTE: Este pigmento orgánico moderno tiene una fuerza de tinte monstruosa. Añádelo solo con la punta del pincel o devorará toda la mezcla.';
    } else if (cand1.id.includes('cad') || cand2.id.includes('cad')) {
      behaviorNote = '💡 PROPIEDAD: Los cadmios minerales son pesados, densos y cubrientes. Otorgan un cuerpo pictórico incomparable.';
    } else {
      behaviorNote = '💡 PROPIEDAD: Los óxidos de hierro y tierras aportan armonía óptica orgánica y secan rápidamente al óleo.';
    }

    return {
      targetHsl: hsl,
      targetAngle: Math.round(targetAngle),
      cand1: {
        ...cand1,
        percent: Math.round(weight1 * 100)
      },
      cand2: {
        ...cand2,
        percent: Math.round(weight2 * 100)
      },
      complement: {
        ...complement,
        oppAngle: Math.round(oppAngle)
      },
      valueAdvice,
      chromaAdvice,
      behaviorNote
    };
  },

  _angularDiff(a1, a2) {
    const diff = Math.abs(a1 - a2) % 360;
    return diff > 180 ? 360 - diff : diff;
  },

  // --- RENDER DEDICATED FLORENT FARGES WHEEL CANVAS ---
  drawFargesWheel(canvas, activeColorRgb) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 24;
    const innerRadius = radius - 30;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background Ring
    for (let i = 0; i < 360; i++) {
      const startAngle = (i - 0.5) * (Math.PI / 180);
      const endAngle = (i + 1.5) * (Math.PI / 180);
      ctx.beginPath();
      ctx.arc(cx, cy, (radius + innerRadius) / 2, startAngle, endAngle);
      ctx.lineWidth = radius - innerRadius;
      ctx.strokeStyle = `hsl(${i}, 85%, 48%)`;
      ctx.stroke();
    }

    // Outer & Inner circle borders
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Central Chromatic Gray Area (The Neutral Heart)
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
    centerGrad.addColorStop(0, '#555555');
    centerGrad.addColorStop(0.5, '#333333');
    centerGrad.addColorStop(1, '#18181B');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Mode-specific overlays:
    const solver = this.solveMixingForColor(activeColorRgb);

    if (this.activeWheelIndex === 2) {
      // WHEEL 2: Mixing Trajectories & Bow Curves
      // Draw subtractive bow curve between Cand1 and Cand2 through center
      const rad1 = (solver.cand1.angle * Math.PI) / 180;
      const rad2 = (solver.cand2.angle * Math.PI) / 180;
      const radComp = (solver.complement.angle * Math.PI) / 180;

      const p1 = { x: cx + innerRadius * Math.cos(rad1), y: cy + innerRadius * Math.sin(rad1) };
      const p2 = { x: cx + innerRadius * Math.cos(rad2), y: cy + innerRadius * Math.sin(rad2) };
      const pComp = { x: cx + innerRadius * Math.cos(radComp), y: cy + innerRadius * Math.sin(radComp) };

      // Neutral complementary bow curve
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(cx, cy, pComp.x, pComp.y);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center neutral intersection point
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gris Neutro', cx, cy - 10);
    } else if (this.activeWheelIndex === 3) {
      // WHEEL 3: Inherent Value Circles
      // Draw concentric rings for Value 2, 4, 6, 8
      [0.25, 0.5, 0.75].forEach((ratio, idx) => {
        const r = innerRadius * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px monospace';
        ctx.fillText(`Val ${[2, 5, 8][idx]}`, cx + r - 12, cy - 4);
      });
    }

    // 4. Draw Genuine Artist Pigment Beads on the Ring
    const spectralPigs = this.PIGMENTS.filter(p => !['titanium_white', 'zinc_white', 'ivory_black'].includes(p.id));
    const ringMidR = (radius + innerRadius) / 2;

    spectralPigs.forEach(p => {
      const rad = (p.angle * Math.PI) / 180;
      const x = cx + ringMidR * Math.cos(rad);
      const y = cy + ringMidR * Math.sin(rad);

      const isCandidate = p.id === solver.cand1.id || p.id === solver.cand2.id;
      const isComplement = p.id === solver.complement.id;

      ctx.beginPath();
      ctx.arc(x, y, isCandidate ? 8 : (isComplement ? 7 : 5), 0, Math.PI * 2);
      ctx.fillStyle = p.hex;
      ctx.fill();
      ctx.strokeStyle = isCandidate ? '#FFFFFF' : (isComplement ? '#F59E0B' : '#000000');
      ctx.lineWidth = isCandidate ? 2.5 : 1.5;
      ctx.stroke();

      // Label candidate pigments
      if (isCandidate || isComplement) {
        const textDist = radius + 14;
        const tx = cx + textDist * Math.cos(rad);
        const ty = cy + textDist * Math.sin(rad);
        ctx.fillStyle = isCandidate ? '#FFFFFF' : '#FBBF24';
        ctx.font = isCandidate ? 'bold 9px sans-serif' : '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.ci, tx, ty);
      }
    });

    // 5. Draw active target color indicator in the center
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${activeColorRgb.r}, ${activeColorRgb.g}, ${activeColorRgb.b})`;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
};
