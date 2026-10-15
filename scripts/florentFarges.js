/**
 * GOM Picker - Florent Farges Practical Color Theory & Physical Color Mixing System
 * Implements Florent Farges' "Three Wheel System", Real Pigment Mapping,
 * Inherent Value Scales, Subtractive Bow Curves, Academic Flesh Gamut,
 * Automatic Workshop Library Generation, Physical Mixture Simulator with
 * Tinting Strength Non-Linearity, and Pedagogical "Por Qué de las Cosas".
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js?v=3.2';

export const FlorentFargesEngine = {
  // Current active wheel in the Three-Wheel-System viewer:
  // 1: Pigment Placement & Tinting Strength, 2: Mixing Lines & Bow Curves, 3: Inherent Value 3D Spiral
  activeWheelIndex: 1,

  // Selected pigments in the physical mixing lab
  labPigment1Id: 'cad_yellow_med',
  labPigment2Id: 'ivory_black',
  labRatio: 0.5,

  // Paradas configurables para el comparador dinámico y transición multi-muestra
  transitionStops: [
    { id: 'farges_stop_1', hex: '#6366F1', rgb: { r: 99, g: 102, b: 241 }, name: 'Muestra A (Frontal)' },
    { id: 'farges_stop_2', hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, name: 'Muestra B (Fondo)' }
  ],
  transitionStepsCount: 9,

  // --- FLORENT FARGES PIGMENT DATABASE ---
  // Pigments mapped by their optical hue angle, inherent value (1-9.8), tinting strength (1-10), and properties
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

  getPigmentById(id) {
    return this.PIGMENTS.find(p => p.id === id) || this.PIGMENTS[0];
  },

  // --- COLECCIÓN CANÓNICA DE BIBLIOTECAS DE ESTUDIO DE FLORENT FARGES ---
  CANONICAL_PALETTES: [
    {
      id: 'farges_split_primaries',
      name: 'Florent Farges — 6 Primarios Divididos de Taller',
      desc: 'La paleta fundamental de caballete recomendada por Florent Farges: 2 amarillos (frío/cálido), 2 rojos (cálido/frío), 2 azules (cálido/frío), con Blanco de Titanio y Sombra Natural.',
      colors: [
        { id: 'cad_lemon', name: 'Amarillo Limón (PY35)', hex: '#FFF200', role: 'Primario Amarillo Frío' },
        { id: 'cad_yellow_med', name: 'Amarillo Cadmio Medio (PY35)', hex: '#FFD700', role: 'Primario Amarillo Cálido' },
        { id: 'cad_red_light', name: 'Rojo Cadmio Claro (PR108)', hex: '#E62E00', role: 'Primario Rojo Cálido' },
        { id: 'quin_magenta', name: 'Magenta Quinacridona (PR122)', hex: '#C01368', role: 'Primario Rojo/Magenta Frío' },
        { id: 'phthalo_blue', name: 'Azul Ftalo S.V. (PB15:3)', hex: '#003366', role: 'Primario Azul Frío (Cian)' },
        { id: 'ultramarine_blue', name: 'Azul Ultramar Francés (PB29)', hex: '#1B2682', role: 'Primario Azul Cálido' },
        { id: 'titanium_white', name: 'Blanco de Titanio (PW6)', hex: '#FDFBF7', role: 'Aclarador Opaco' },
        { id: 'raw_umber', name: 'Sombra Natural (PBr7)', hex: '#463A2B', role: 'Oscurecedor Universal' }
      ]
    },
    {
      id: 'farges_academic_portrait',
      name: 'Florent Farges — Retrato Académico & Tríada Facial',
      desc: 'Formulación para el modelado de la encarnación y las 3 zonas térmicas del rostro humano según Florent Farges.',
      colors: [
        { id: 'titanium_white', name: 'Blanco de Titanio (PW6)', hex: '#FDFBF7', role: 'Luz y Valor' },
        { id: 'yellow_ochre', name: 'Ocre Amarillo (PY43)', hex: '#CC9933', role: 'Frente & Sienes' },
        { id: 'burnt_sienna', name: 'Siena Tostada (PBr7)', hex: '#8D361F', role: 'Sombras Cálidas' },
        { id: 'cad_red_light', name: 'Rojo Cadmio Claro (PR108)', hex: '#E62E00', role: 'Mejillas & Nariz' },
        { id: 'alizarin_crimson', name: 'Carmín Alizarina (PR177)', hex: '#9E1338', role: 'Labios & Acentos Fríos' },
        { id: 'ultramarine_blue', name: 'Azul Ultramar (PB29)', hex: '#1B2682', role: 'Mandíbula & Cuello' },
        { id: 'ivory_black', name: 'Negro Marfil (PBk9)', hex: '#1E1D1B', role: 'Azul Frío Secreto' }
      ]
    },
    {
      id: 'farges_plein_air',
      name: 'Florent Farges — Paisaje de Estudio & Plenairismo',
      desc: 'Equilibrio de atmósfera exterior, verdes orgánicos no chillones, cielos limpios y veladuras transparentes.',
      colors: [
        { id: 'titanium_white', name: 'Blanco de Titanio (PW6)', hex: '#FDFBF7', role: 'Nubes & Luces' },
        { id: 'cad_lemon', name: 'Amarillo Limón (PY35)', hex: '#FFF200', role: 'Sol Radiante' },
        { id: 'yellow_ochre', name: 'Ocre Amarillo (PY43)', hex: '#CC9933', role: 'Suelo & Hierba Seca' },
        { id: 'burnt_sienna', name: 'Siena Tostada (PBr7)', hex: '#8D361F', role: 'Troncos & Rocas' },
        { id: 'cobalt_blue', name: 'Azul Cobalto (PB28)', hex: '#0047AB', role: 'Bóveda Celeste' },
        { id: 'phthalo_blue', name: 'Azul Ftalo (PB15:3)', hex: '#003366', role: 'Distancias Profundas' },
        { id: 'viridian', name: 'Verde Viridián (PG18)', hex: '#126848', role: 'Agua & Hojas Transparentes' },
        { id: 'raw_umber', name: 'Sombra Natural (PBr7)', hex: '#463A2B', role: 'Sombra Terrestre' }
      ]
    },
    {
      id: 'farges_chiaroscuro',
      name: 'Florent Farges — Claroscuro & Tierras Nobles',
      desc: 'Para modelado tonal estricto, bodegón clásico y atmósfera de luz lateral dirigida estilo barroco atelier.',
      colors: [
        { id: 'titanium_white', name: 'Blanco de Titanio (PW6)', hex: '#FDFBF7', role: 'Foco Lumínico' },
        { id: 'raw_sienna', name: 'Siena Natural (PBr7)', hex: '#C67128', role: 'Halftone Luminoso' },
        { id: 'yellow_ochre', name: 'Ocre Amarillo (PY43)', hex: '#CC9933', role: 'Medio Tono' },
        { id: 'burnt_sienna', name: 'Siena Tostada (PBr7)', hex: '#8D361F', role: 'Penumbra Cálida' },
        { id: 'raw_umber', name: 'Sombra Natural (PBr7)', hex: '#463A2B', role: 'Núcleo de Sombra Fría' },
        { id: 'burnt_umber', name: 'Sombra Tostada (PBr7)', hex: '#462C1E', role: 'Sombra Chocolate Profunda' },
        { id: 'ivory_black', name: 'Negro Marfil (PBk9)', hex: '#1E1D1B', role: 'Oclusión Tonal Absoluta' }
      ]
    },
    {
      id: 'farges_natural_greens',
      name: 'Florent Farges — Verdes Orgánicos sin Viridián',
      desc: 'Formulación magistral de verdes vivos y naturales mezclando amarillos y tierras con negros y azules, evitando el verde sintético estridente.',
      colors: [
        { name: 'Oliva Farges (Limón + Negro)', hex: '#4D511A', role: 'Verde Oliva Vegetal (Olive Shift)' },
        { name: 'Verde Musgo (Cadmio + Ultramar)', hex: '#2F4F24', role: 'Verde Bosque Cálido Profundo' },
        { name: 'Verde Césped Claro (Limón + Cobalto)', hex: '#589139', role: 'Pradera Soleada Vibrante' },
        { name: 'Oliva Dorado (Ocre + Negro)', hex: '#484422', role: 'Follaje de Sombra Envejecido' },
        { name: 'Verde Esmeralda Velado (Ftalo + Ocre)', hex: '#1B6344', role: 'Agua y Vegetación Húmeda' },
        { name: 'Sombra Verde Fría (Sombra + Ultramar)', hex: '#222C2E', role: 'Sombra de Vegetación Profunda' }
      ]
    }
  ],

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

    // Chromatic pigments with specific angle (filter out pure whites and blacks)
    const spectralPigs = this.PIGMENTS.filter(p => !['titanium_white', 'zinc_white', 'ivory_black'].includes(p.id));

    // Sort pigments by angular distance along the wheel
    const sortedByAngle = [...spectralPigs].sort((a, b) => {
      const diffA = this._angularDiff(a.angle, targetAngle);
      const diffB = this._angularDiff(b.angle, targetAngle);
      return diffA - diffB;
    });

    let cand1 = sortedByAngle[0];
    let cand2 = sortedByAngle[1];

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
        valueAdvice = `¡REGLA DE ORO DE FARGES!: El amarillo NUNCA se oscurece con negro (lo viraría a verde oliva). Usa Sombra Natural (PBr7) o Siena Tostada para mantener la calidez dorada.`;
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
      behaviorNote = '⚠️ ADVERTENCIA DE TINTE: Este pigmento orgánico moderno tiene una fuerza de tinte monstruosa (10/10). Añádelo solo con la punta del pincel o devorará toda la mezcla.';
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

  // --- GENERADOR AUTOMÁTICO DE BIBLIOTECA DE TALLER SEGÚN REGLAS DE FARGES ---
  generateFargesWorkshopPalette(activeRgb) {
    const hex = ColorMath.rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);
    const solver = this.solveMixingForColor(activeRgb);
    const hsl = solver.targetHsl;

    // Build the tailored workshop palette:
    const paletteColors = [
      {
        name: `Color Objetivo (${hex})`,
        hex: hex,
        rgb: activeRgb,
        role: 'Tono Local de Referencia'
      },
      {
        name: `${solver.cand1.name} (${solver.cand1.ci})`,
        hex: solver.cand1.hex,
        rgb: solver.cand1.rgb,
        role: `Primario Flanqueante Principal (${solver.cand1.percent}%)`
      },
      {
        name: `${solver.cand2.name} (${solver.cand2.ci})`,
        hex: solver.cand2.hex,
        rgb: solver.cand2.rgb,
        role: `Primario Secundario (${solver.cand2.percent}%)`
      },
      {
        name: `${solver.complement.name} (${solver.complement.ci})`,
        hex: solver.complement.hex,
        rgb: solver.complement.rgb,
        role: 'Neutralizador Óptico Complementario (Gris Cromático)'
      }
    ];

    // Lightening pigment: Zinc if transparent/high saturation needed, Titanium if opaque
    if (hsl.s > 0.65 || hsl.l > 0.75) {
      const p = this.getPigmentById('zinc_white');
      paletteColors.push({
        name: `${p.name} (${p.ci})`,
        hex: p.hex,
        rgb: p.rgb,
        role: 'Aclarador de Veladura Luminosa (Sin blanquear en exceso)'
      });
    } else {
      const p = this.getPigmentById('titanium_white');
      paletteColors.push({
        name: `${p.name} (${p.ci})`,
        hex: p.hex,
        rgb: p.rgb,
        role: 'Aclarador Opaco de Máximo Poder Cubriente'
      });
    }

    // Shading pigment: Strictly follow Farges rule (Never black on yellow!)
    if (solver.targetAngle >= 25 && solver.targetAngle <= 85) {
      const p = this.getPigmentById('raw_umber');
      paletteColors.push({
        name: `${p.name} (${p.ci})`,
        hex: p.hex,
        rgb: p.rgb,
        role: 'Sombra Tonal Farges (Mantiene oro sin virar a verde oliva)'
      });
    } else if (solver.targetAngle >= 0 && solver.targetAngle < 25) {
      const p = this.getPigmentById('burnt_sienna');
      paletteColors.push({
        name: `${p.name} (${p.ci})`,
        hex: p.hex,
        rgb: p.rgb,
        role: 'Sombra Cálida Transparente de Gran Vibración'
      });
    } else {
      const p = this.getPigmentById('ultramarine_blue');
      paletteColors.push({
        name: `${p.name} (${p.ci})`,
        hex: p.hex,
        rgb: p.rgb,
        role: 'Sombra Fría Atmosférica y Profundidad Clásica'
      });
    }

    // Earth bridging pigment
    const ochre = this.getPigmentById('yellow_ochre');
    paletteColors.push({
      name: `${ochre.name} (${ochre.ci})`,
      hex: ochre.hex,
      rgb: ochre.rgb,
      role: 'Tierra de Enlace y Carnaciones'
    });

    return {
      id: `farges_workshop_${Date.now()}`,
      name: `Paleta Taller Farges (${hex})`,
      desc: `Paleta física de caballete calculada para el tono ${hex}. Combina primarios divididos, neutralizador de gris cromático y oscurecimiento libre de efecto oliva.`,
      colors: paletteColors
    };
  },

  // --- SIMULADOR DE MEZCLA FÍSICA & COMPARADOR DINÁMICO DE TUBOS ---
  simulatePigmentMixture(pig1, pig2, ratio = 0.5) {
    const p1 = typeof pig1 === 'string' ? this.getPigmentById(pig1) : pig1;
    const p2 = typeof pig2 === 'string' ? this.getPigmentById(pig2) : pig2;

    const r = Math.max(0, Math.min(1, ratio));
    const s1 = p1.tintingStrength || 6;
    const s2 = p2.tintingStrength || 6;

    // Non-linear tinting strength curve:
    // Real pigments with strength 10 (e.g. Phthalo Blue) physically overpower strength 5 (Ochre)
    const effectiveWeight = (r * s2) / ((1 - r) * s1 + r * s2);

    // Check for Olive Shift (Yellow + Carbon Black)
    const isP1Yellow = (p1.id === 'cad_lemon' || p1.id === 'cad_yellow_med' || p1.id === 'yellow_ochre');
    const isP2Yellow = (p2.id === 'cad_lemon' || p2.id === 'cad_yellow_med' || p2.id === 'yellow_ochre');
    const isP1Black = (p1.id === 'ivory_black');
    const isP2Black = (p2.id === 'ivory_black');

    let mixedRgb;
    let isOliveShift = false;

    if ((isP1Yellow && isP2Black) || (isP2Yellow && isP1Black)) {
      isOliveShift = true;
      // Empirically simulated Olive Shift absorption spectrum
      const yellowPig = isP1Yellow ? p1 : p2;
      const yellowWeight = isP1Yellow ? (1 - effectiveWeight) : effectiveWeight;
      const blackWeight = 1 - yellowWeight;

      // When black enters, the absorption of red wavelengths causes chlorophyll olive shift
      const oliveR = Math.round(yellowPig.rgb.r * Math.pow(yellowWeight, 1.2) * (1 - blackWeight * 0.72));
      const oliveG = Math.round(yellowPig.rgb.g * Math.pow(yellowWeight, 0.65) * (1 - blackWeight * 0.45));
      const oliveB = Math.round(25 + yellowPig.rgb.b * Math.pow(yellowWeight, 2) * (1 - blackWeight * 0.9));

      mixedRgb = {
        r: Math.max(20, Math.min(255, oliveR)),
        g: Math.max(25, Math.min(255, oliveG)),
        b: Math.max(15, Math.min(255, oliveB))
      };
    } else {
      // Subtractive RYB physical mixture with natural bow curvature
      mixedRgb = ColorMath.mixRyb(p1.rgb, p2.rgb, effectiveWeight);
    }

    const mixedHex = ColorMath.rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b);
    const mixedHsv = ColorMath.rgbToHsv(mixedRgb.r, mixedRgb.g, mixedRgb.b);

    // Inherent Value Calculation
    const v1 = p1.inherentValue || 5.0;
    const v2 = p2.inherentValue || 5.0;
    const deltaV = Math.abs(v1 - v2);

    // Angular span between pigments on the wheel
    const angSpan = (p1.angle !== undefined && p2.angle !== undefined) ? this._angularDiff(p1.angle, p2.angle) : 60;
    const bowDip = Math.sin(r * Math.PI) * (angSpan / 180) * 0.65;
    const mixedValue = Math.max(1.0, Math.min(9.8, (1 - effectiveWeight) * v1 + effectiveWeight * v2 - bowDip));

    // Tinting strength ratio & dominance
    const tintRatio = s1 >= s2 ? (s1 / s2) : (s2 / s1);
    const dominant = s1 >= s2 ? p1 : p2;
    const submissive = s1 >= s2 ? p2 : p1;

    // Resulting film opacity
    let resultingOpacity = 'Semi-opaco equilibrado';
    if (p1.opacity?.includes('Opaco') && p2.opacity?.includes('Opaco')) {
      resultingOpacity = 'Opaco denso (Cuerpo cubriente)';
    } else if (p1.opacity?.includes('Transparente') && p2.opacity?.includes('Transparente')) {
      resultingOpacity = 'Transparente puro (Ideal para veladuras / glazes)';
    } else if (p1.opacity?.includes('Transparente') || p2.opacity?.includes('Transparente')) {
      resultingOpacity = 'Semi-transparente (Permite visibilidad de capas inferiores)';
    }

    // Pedagogical insight based on the pair
    let pedagogicalNote = '';
    if (isOliveShift) {
      pedagogicalNote = '🔬 FENÓMENO OLIVE SHIFT: El Negro Marfil (PBk9) absorbe selectivamente el rojo y refleja sutilmente el azul-cian. Al encontrarse con el amarillo, la física sustractiva produce este Verde Oliva. Para una sombra dorada natural, sustituye el negro por Sombra Natural (PBr7).';
    } else if ((p1.id === 'ultramarine_blue' && isP2Yellow) || (p2.id === 'ultramarine_blue' && isP1Yellow)) {
      pedagogicalNote = '🔬 POR QUÉ EL VERDE RESULTA APAGADO: El Azul Ultramar (PB29) posee un subtono rojizo cálido. Ese componente rojo actúa como neutralizador complementario del verde, hundiendo el croma hacia el centro de la rueda. Si buscas un verde eléctrico vibrante, usa Azul Ftalo o Cerúleo.';
    } else if ((p1.id === 'ultramarine_blue' && p2.id === 'burnt_sienna') || (p2.id === 'ultramarine_blue' && p1.id === 'burnt_sienna')) {
      pedagogicalNote = '🎨 NEUTRO MAGISTRAL DE ATELIER: Azul Ultramar + Siena Tostada es la mezcla maestra de los grandes maestros para obtener negros cromáticos profundos y grises perlados sin usar negro mineral plano.';
    } else if (p1.id.includes('phthalo') || p2.id.includes('phthalo')) {
      pedagogicalNote = `⚡ DOMINANCIA DE TINTE: El pigmento Ftalo tiene fuerza 10/10. Incluso con solo un 15% en volumen, tiñe más del 40% del color visible.`;
    } else if (deltaV > 4.5) {
      pedagogicalNote = `📊 GRAN SALTO TONAL (ΔV=${deltaV.toFixed(1)}): Hay una disparidad extrema de valor entre ambos tubos. Mezcla en pequeños toques para no apagar el tubo más luminoso.`;
    } else {
      pedagogicalNote = `✨ MEZCLA ARMÓNICA: Intervalo de ángulo de ${angSpan}° en la rueda cromática con transición suave de valor.`;
    }

    return {
      p1,
      p2,
      ratio: r,
      effectiveWeight,
      rgb: mixedRgb,
      hex: mixedHex,
      hsv: mixedHsv,
      deltaV: parseFloat(deltaV.toFixed(1)),
      inherentValue: parseFloat(mixedValue.toFixed(1)),
      angSpan,
      tintRatio: parseFloat(tintRatio.toFixed(1)),
      dominant,
      submissive,
      resultingOpacity,
      isOliveShift,
      pedagogicalNote
    };
  },

  // Generates 7 intermediate physical mixture steps for the interactive gradient strip
  generateMixingSteps(pig1, pig2, stepsCount = 7) {
    const steps = [];
    for (let i = 0; i < stepsCount; i++) {
      const ratio = i / (stepsCount - 1);
      const sim = this.simulatePigmentMixture(pig1, pig2, ratio);
      steps.push({
        stepIndex: i,
        ratio: Math.round(ratio * 100),
        rgb: sim.rgb,
        hex: sim.hex,
        inherentValue: sim.inherentValue,
        isOliveShift: sim.isOliveShift,
        name: i === 0 ? sim.p1.name : (i === stepsCount - 1 ? sim.p2.name : `Mezcla ${Math.round(ratio * 100)}%`)
      });
    }
    return steps;
  },

  // --- COMPARADOR DINÁMICO MULTI-MUESTRA & TRANSICIONES FARGES ---

  findClosestPigment(color) {
    const rgb = typeof color === 'string' ? ColorMath.hexToRgb(color) : (color.rgb || color);
    let best = this.PIGMENTS[0];
    let minDist = Infinity;
    this.PIGMENTS.forEach(p => {
      const dist = Math.hypot(rgb.r - p.rgb.r, rgb.g - p.rgb.g, rgb.b - p.rgb.b);
      if (dist < minDist) {
        minDist = dist;
        best = p;
      }
    });
    return { pigment: best, distance: Math.round(minDist) };
  },

  solveArbitraryColorMixing(c1, c2, ratio = 0.5) {
    const rgb1 = typeof c1 === 'string' ? ColorMath.hexToRgb(c1) : (c1.rgb || c1);
    const rgb2 = typeof c2 === 'string' ? ColorMath.hexToRgb(c2) : (c2.rgb || c2);
    const hex1 = ColorMath.rgbToHex(rgb1.r, rgb1.g, rgb1.b);
    const hex2 = ColorMath.rgbToHex(rgb2.r, rgb2.g, rgb2.b);

    const match1 = this.findClosestPigment(rgb1);
    const match2 = this.findClosestPigment(rgb2);

    const r = Math.max(0, Math.min(1, ratio));
    const s1 = match1.pigment.tintingStrength || 6;
    const s2 = match2.pigment.tintingStrength || 6;

    // Ponderación de masa no lineal por fuerza de tinte
    const effectiveWeight = (r * s2) / ((1 - r) * s1 + r * s2);

    // Detección de viraje Olive Shift
    const hsv1 = ColorMath.rgbToHsv(rgb1.r, rgb1.g, rgb1.b);
    const hsv2 = ColorMath.rgbToHsv(rgb2.r, rgb2.g, rgb2.b);

    const isYellow1 = (hsv1.h >= 35 && hsv1.h <= 75 && hsv1.s > 0.4 && hsv1.v > 0.6);
    const isYellow2 = (hsv2.h >= 35 && hsv2.h <= 75 && hsv2.s > 0.4 && hsv2.v > 0.6);
    const isDarkNeutral1 = (hsv1.v < 0.28 || (hsv1.s < 0.25 && hsv1.v < 0.4));
    const isDarkNeutral2 = (hsv2.v < 0.28 || (hsv2.s < 0.25 && hsv2.v < 0.4));

    let mixedRgb;
    let isOliveShift = false;

    if ((isYellow1 && isDarkNeutral2) || (isYellow2 && isDarkNeutral1)) {
      isOliveShift = true;
      const yellowRgb = isYellow1 ? rgb1 : rgb2;
      const yellowWeight = isYellow1 ? (1 - effectiveWeight) : effectiveWeight;
      const darkWeight = 1 - yellowWeight;

      const oliveR = Math.round(yellowRgb.r * Math.pow(yellowWeight, 1.25) * (1 - darkWeight * 0.7));
      const oliveG = Math.round(yellowRgb.g * Math.pow(yellowWeight, 0.68) * (1 - darkWeight * 0.42));
      const oliveB = Math.round(25 + yellowRgb.b * Math.pow(yellowWeight, 2) * (1 - darkWeight * 0.88));

      mixedRgb = {
        r: Math.max(20, Math.min(255, oliveR)),
        g: Math.max(25, Math.min(255, oliveG)),
        b: Math.max(15, Math.min(255, oliveB))
      };
    } else {
      // Mezcla sustractiva física RYB con compensación de bow curve
      mixedRgb = ColorMath.mixRyb(rgb1, rgb2, effectiveWeight);
    }

    const mixedHex = ColorMath.rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b);
    const mixedHsv = ColorMath.rgbToHsv(mixedRgb.r, mixedRgb.g, mixedRgb.b);
    const mixedMunsell = MunsellSystem ? MunsellSystem.rgbToMunsell(mixedRgb.r, mixedRgb.g, mixedRgb.b) : null;

    // Cálculo del valor inherente Farges (1 a 9)
    const lum = (0.299 * mixedRgb.r + 0.587 * mixedRgb.g + 0.114 * mixedRgb.b) / 255;
    const angDiff = this._angularDiff(hsv1.h, hsv2.h);
    const bowDip = Math.sin(r * Math.PI) * (angDiff / 180) * 0.8;
    const inherentValue = parseFloat(Math.max(1.0, Math.min(9.0, lum * 8 + 1 - bowDip * 0.5)).toFixed(1));

    return {
      c1: { hex: hex1, rgb: rgb1, pigment: match1.pigment.name },
      c2: { hex: hex2, rgb: rgb2, pigment: match2.pigment.name },
      ratio: r,
      effectiveWeight,
      rgb: mixedRgb,
      hex: mixedHex,
      hsv: mixedHsv,
      munsell: mixedMunsell?.notation || '',
      inherentValue,
      angSpan: angDiff,
      isOliveShift,
      pedagogicalNote: isOliveShift
        ? 'Fenómeno Olive Shift detectado: el amarilleo con absorción selectiva de longitudes de onda cortas vira físicamente a verde oliva.'
        : (angDiff > 130
          ? `Neutralización complementaria: ángulo amplio (${angDiff}°), la curva bow atraviesa el baricentro desaturando el croma central.`
          : `Mezcla armónica suave: intervalo de ${angDiff}° en la rueda cromática con transición tonal estable.`)
    };
  },

  generateMultiSampleTransition(stops = null, totalSteps = 9) {
    const list = stops && stops.length >= 2 ? stops : this.transitionStops;
    if (!list || list.length < 2) return [];

    const segmentsCount = list.length - 1;
    const stepsPerSegment = Math.max(3, Math.ceil(totalSteps / segmentsCount));
    const allSteps = [];

    for (let s = 0; s < segmentsCount; s++) {
      const stopA = list[s];
      const stopB = list[s + 1];

      for (let i = 0; i <= stepsPerSegment; i++) {
        // En el primer paso del segmento posterior, evitar duplicar el nodo de unión
        if (s > 0 && i === 0) continue;

        const localRatio = i / stepsPerSegment;
        const mix = this.solveArbitraryColorMixing(stopA, stopB, localRatio);

        const isStopA = (i === 0 && s === 0);
        const isStopB = (i === stepsPerSegment);
        const isStop = isStopA || isStopB;
        const stopName = isStopA ? (stopA.name || `Parada ${s + 1}`) : (isStopB ? (stopB.name || `Parada ${s + 2}`) : `Paso ${(localRatio * 100).toFixed(0)}%`);

        allSteps.push({
          globalIndex: allSteps.length,
          segmentIndex: s,
          localRatio,
          rgb: mix.rgb,
          hex: mix.hex,
          hsv: mix.hsv,
          munsell: mix.munsell,
          inherentValue: mix.inherentValue,
          isOliveShift: mix.isOliveShift,
          isStop,
          stopName,
          pedagogicalNote: mix.pedagogicalNote
        });
      }
    }

    return allSteps;
  },

  addTransitionStop(color = null, name = '') {
    const defaultHexes = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#38BDF8', '#8B5CF6'];
    const id = `farges_stop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    let hex = '#6366F1';
    let rgb = { r: 99, g: 102, b: 241 };
    if (color) {
      if (typeof color === 'string') {
        hex = color.toUpperCase();
        rgb = ColorMath.hexToRgb(hex);
      } else if (color.r !== undefined) {
        rgb = color;
        hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      } else if (color.hex) {
        hex = color.hex.toUpperCase();
        rgb = ColorMath.hexToRgb(hex);
      }
    } else {
      const fallbackHex = defaultHexes[this.transitionStops.length % defaultHexes.length];
      hex = fallbackHex;
      rgb = ColorMath.hexToRgb(hex);
    }
    const stopName = name || `Muestra ${String.fromCharCode(65 + this.transitionStops.length)}`;
    const stop = { id, hex, rgb, name: stopName };
    this.transitionStops.push(stop);
    return stop;
  },

  removeTransitionStop(index) {
    if (this.transitionStops.length <= 2) return false;
    if (index >= 0 && index < this.transitionStops.length) {
      this.transitionStops.splice(index, 1);
      return true;
    }
    return false;
  },

  updateTransitionStop(index, color, name = null) {
    if (index < 0 || index >= this.transitionStops.length) return null;
    const stop = this.transitionStops[index];
    if (color) {
      if (typeof color === 'string') {
        stop.hex = color.toUpperCase();
        stop.rgb = ColorMath.hexToRgb(stop.hex);
      } else if (color.r !== undefined) {
        stop.rgb = color;
        stop.hex = ColorMath.rgbToHex(color.r, color.g, color.b);
      } else if (color.hex) {
        stop.hex = color.hex.toUpperCase();
        stop.rgb = ColorMath.hexToRgb(stop.hex);
      }
    }
    if (name !== null && name !== undefined) {
      stop.name = name;
    }
    return stop;
  },

  setTransitionStops(stops) {
    if (Array.isArray(stops) && stops.length >= 2) {
      this.transitionStops = stops.map((s, idx) => {
        const hex = (typeof s === 'string' ? s : (s.hex || '#FFFFFF')).toUpperCase();
        const rgb = typeof s === 'object' && s.rgb ? s.rgb : ColorMath.hexToRgb(hex);
        return {
          id: s.id || `farges_stop_${idx + 1}`,
          hex,
          rgb,
          name: s.name || `Muestra ${String.fromCharCode(65 + idx)}`
        };
      });
      return this.transitionStops;
    }
    return null;
  },

  // --- RENDER DEDICATED FLORENT FARGES WHEEL CANVAS ---
  drawFargesWheel(canvas, activeColorRgb, customPig1 = null, customPig2 = null) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 26;
    const innerRadius = radius - 34;

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

    // 2. Central Chromatic Gray Core
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
    centerGrad.addColorStop(0, '#555555');
    centerGrad.addColorStop(0.5, '#333333');
    centerGrad.addColorStop(1, '#18181B');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    const solver = this.solveMixingForColor(activeColorRgb);
    const pigA = customPig1 || solver.cand1;
    const pigB = customPig2 || solver.cand2;

    // 3. Wheel Specific Visualizations
    if (this.activeWheelIndex === 2) {
      // WHEEL 2: Mixing Trajectories & Subtractive Bow Curves
      if (pigA && pigB && pigA.angle !== undefined && pigB.angle !== undefined) {
        const rad1 = (pigA.angle * Math.PI) / 180;
        const rad2 = (pigB.angle * Math.PI) / 180;
        const p1 = { x: cx + innerRadius * Math.cos(rad1), y: cy + innerRadius * Math.sin(rad1) };
        const p2 = { x: cx + innerRadius * Math.cos(rad2), y: cy + innerRadius * Math.sin(rad2) };

        // Bow curve pulling towards central gray
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Intermediate step beads along bow curve
        for (let t = 0.2; t <= 0.8; t += 0.2) {
          const invT = 1 - t;
          const bx = invT * invT * p1.x + 2 * invT * t * cx + t * t * p2.x;
          const by = invT * invT * p1.y + 2 * invT * t * cy + t * t * p2.y;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#34D399';
          ctx.fill();
          ctx.strokeStyle = '#064E3B';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Draw complementary neutral line
        const radComp = (solver.complement.angle * Math.PI) / 180;
        const pComp = { x: cx + innerRadius * Math.cos(radComp), y: cy + innerRadius * Math.sin(radComp) };
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(pComp.x, pComp.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

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
      // WHEEL 3: Inherent Value Circles & 3D Spiral Gamut
      [0.2, 0.4, 0.6, 0.8].forEach((ratio, idx) => {
        const r = innerRadius * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px monospace';
        ctx.fillText(`Val ${[2, 4, 6, 8][idx]}`, cx + r - 14, cy - 4);
      });

      // Plot pigments at their inherent value depth
      this.PIGMENTS.forEach(p => {
        if (p.angle !== undefined && p.inherentValue) {
          const valRatio = (p.inherentValue / 10);
          const rPos = innerRadius * valRatio;
          const rad = (p.angle * Math.PI) / 180;
          const px = cx + rPos * Math.cos(rad);
          const py = cy + rPos * Math.sin(rad);

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = p.hex;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    // 4. Draw Genuine Artist Pigment Beads on the Perimeter Ring
    const spectralPigs = this.PIGMENTS.filter(p => !['titanium_white', 'zinc_white', 'ivory_black'].includes(p.id));
    const ringMidR = (radius + innerRadius) / 2;

    spectralPigs.forEach(p => {
      const rad = (p.angle * Math.PI) / 180;
      const x = cx + ringMidR * Math.cos(rad);
      const y = cy + ringMidR * Math.sin(rad);

      const isCandidate = p.id === solver.cand1.id || p.id === solver.cand2.id;
      const isLabPig = p.id === pigA.id || p.id === pigB.id;
      const isComplement = p.id === solver.complement.id;

      ctx.beginPath();
      ctx.arc(x, y, isLabPig || isCandidate ? 8.5 : (isComplement ? 7 : 5), 0, Math.PI * 2);
      ctx.fillStyle = p.hex;
      ctx.fill();
      ctx.strokeStyle = isLabPig ? '#10B981' : (isCandidate ? '#FFFFFF' : (isComplement ? '#F59E0B' : '#000000'));
      ctx.lineWidth = isLabPig || isCandidate ? 2.5 : 1.5;
      ctx.stroke();

      if (isLabPig || isCandidate || isComplement) {
        const textDist = radius + 15;
        const tx = cx + textDist * Math.cos(rad);
        const ty = cy + textDist * Math.sin(rad);
        ctx.fillStyle = isLabPig ? '#34D399' : (isCandidate ? '#FFFFFF' : '#FBBF24');
        ctx.font = isLabPig || isCandidate ? 'bold 9px sans-serif' : '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.ci, tx, ty);
      }
    });

    // 5. Active Target Color Center Indicator
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${activeColorRgb.r}, ${activeColorRgb.g}, ${activeColorRgb.b})`;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  },

  // --- PEDAGOGICAL "POR QUÉ DE LAS COSAS" KNOWLEDGE BASE ---
  explainWhy(topicKey) {
    const topics = {
      olive_shift: {
        title: 'El Fenómeno del Amarillo + Negro (Olive Shift)',
        subtitle: 'La física de absorción selectiva de longitudes de onda del carbón',
        explanation: 'En las escuelas de arte tradicionales se enseña erróneamente que "el negro solo oscurece". Sin embargo, al mezclar Amarillo Cadmio (PY35) con Negro Marfil (PBk9), ¡el resultado no es un amarillo oscuro, sino un VERDE OLIVA inconfundible! Esto se debe a que el Negro Marfil se fabrica calcinando huesos de animales; su espectro de reflectancia no es neutro, sino que refleja más energía en la banda del azul-cian (480nm). Al combinarse con el amarillo, la absorción sustractiva actúa como una mezcla de amarillo + azul, generando clorofila viva.',
        solution: 'Florent Farges enseña que para oscurecer el amarillo manteniendo su calidez dorada, se debe usar Tierra de Sombra Natural (Raw Umber, PBr7) o Siena Tostada (Burnt Sienna).'
      },
      ultramarine_green: {
        title: 'Por qué Azul Ultramar + Amarillo produce un Verde Apagado',
        subtitle: 'El subtono rojizo cálido del pigmento PB29',
        explanation: 'Muchos estudiantes se frustran porque al mezclar Azul Ultramar con Amarillo Limón obtienen un verde oliva apagado en vez de un verde esmeralda brillante. La razón radica en que el Azul Ultramar es un azul CÁLIDO que vira hacia el violeta (ángulo ~236°), conteniendo longitudes de onda rojas. En la síntesis sustractiva, el rojo actúa como el complementario directo del verde, neutralizándolo y reduciendo su croma.',
        solution: 'Para obtener verdes intensos, puros y luminosos, Florent Farges recomienda usar un azul FRÍO con matiz verdoso: Azul Ftalo (PB15:3) o Azul Cerúleo (PB35).'
      },
      titanium_vs_zinc: {
        title: 'Blanco de Titanio (PW6) vs Blanco de Zinc (PW4)',
        subtitle: 'Opacidad total cubriente vs transparencia cristalina para veladuras',
        explanation: 'El Blanco de Titanio posee un índice de refracción colosal (2.7) y una fuerza de tinte de 10/10. Es indispensable para bloquear la luz y crear empastes luminosos, pero tiene el defecto de "empolvar" y enfriar los colores, volviéndolos lechosos. En contraste, el Blanco de Zinc tiene fuerza de tinte 3/10 y es translúcido, permitiendo elevar el valor tonal sin matar la luminosidad interior de los pigmentos transparentes.',
        solution: 'Usa Blanco de Titanio para luces altas y pintura directa (alla prima). Usa Blanco de Zinc para veladuras, tonos medios delicados y carnes transparentes.'
      },
      inherent_value: {
        title: 'La Escala de Valor Intrínseco de los Pigmentos',
        subtitle: 'Por qué no existe un amarillo puro oscuro ni un violeta puro claro',
        explanation: 'Cada pigmento en su estado de máxima pureza química reside en un valor tonal fijo (1 a 9). El Amarillo Limón puro solo puede existir en valores altos (8.5), mientras que el Violeta Dioxacina o el Azul Ultramar residen en valores bajos (1.8 a 2.2). No es posible físicamente oscurecer un amarillo manteniendo su pureza cromática, ni aclarar un violeta sin convertirlo en lavanda desaturada.',
        solution: 'Aprende a mapear los tubos en el espacio 3D según su valor intrínseco para no forzar mezclas imposibles.'
      }
    };
    return topics[topicKey] || topics.olive_shift;
  }
};
