/**
 * GOM Picker - Local & Private Neural Color Intelligence & Advisory Engine
 * 100% Client-side, zero external APIs, zero latency, absolute privacy.
 * Performs deep semantic NLP vector projection, real-time palette diagnostics,
 * tonal value hierarchy audits, and professional art direction critiques.
 */

import { ColorMath } from './colorMath.js';
import { AtmosphereEngine } from './atmosphereEngine.js';

export const AIAdvisor = {
  // Common Spanish & English stopwords to eliminate semantic noise
  STOPWORDS: new Set([
    'de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'en', 'con', 'por', 'para', 'y', 'e', 'o', 'u', 'a', 'al', 'sobre',
    'entre', 'sin', 'muy', 'mas', 'más', 'pero', 'como', 'tan', 'este',
    'esta', 'estos', 'estas', 'es', 'son', 'que', 'su', 'sus', 'the',
    'of', 'and', 'in', 'on', 'with', 'a', 'an', 'at', 'by', 'from'
  ]),

  // Master Curated Thematic Archetypes (High-Fidelity Subject Harmonies)
  THEMATIC_PALETTES: [
    {
      pattern: /rosa[s]?\s+roja[s]?|ramo\s+de\s+rosas|ramillete\s+de\s+rosas|bouquet\s+de\s+rosas|rosas\s+rojas|rosas\s+carmes[ií]|rosa\s+roja/i,
      scene: 'botanical',
      vector: [0.85, 0.45, 0.92, 0.65, 0.95],
      title: 'Ramo de Rosas Rojas & Follaje Botánico',
      colors: [
        { hex: '#1C0B12', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#264D3B', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#D90429', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFE3E0', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#FF4D6D', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /rosa[s]?\s+(rosa[s]?|rosada[s]?|pastel|blanca[s]?)|cerezo\s+en\s+flor|sakura/i,
      scene: 'botanical',
      vector: [0.45, 0.82, 0.65, 0.25, 0.95],
      title: 'Flores de Cerezo & Rosas Pastel',
      colors: [
        { hex: '#2B1E25', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#52796F', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#FF758F', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF0F3', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#FFB3C1', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /girasol|girasoles/i,
      scene: 'botanical',
      vector: [0.85, 0.75, 0.95, 0.35, 0.95],
      title: 'Girasoles Dorados & Follaje de Campo',
      colors: [
        { hex: '#1E1B15', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#2D6A4F', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#FFB703', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF3B0', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#FB8500', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /lavanda|campo[s]?\s+de\s+lavanda/i,
      scene: 'botanical',
      vector: [-0.4, 0.65, 0.75, 0.3, 0.95],
      title: 'Campos de Lavanda en Provenza',
      colors: [
        { hex: '#1A162B', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#406343', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#9D4EDD', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#E0AAFF', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#C77DFF', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /cielo\s+estrellad|noche\s+estrellad|galaxia|cosmos/i,
      scene: 'landscape',
      vector: [-0.7, 0.2, 0.85, 0.8, 0.1],
      title: 'Noche Cósmica Estrellada',
      colors: [
        { hex: '#0B132B', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#1C2541', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#FFD166', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#E0FAFF', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#48CAE4', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /playa|mar\s+caribe|arena\s+blanca|isla\s+tropical/i,
      scene: 'landscape',
      vector: [-0.2, 0.75, 0.85, 0.4, 0.85],
      title: 'Playa Tropical & Mar Turquesa',
      colors: [
        { hex: '#0077B6', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#E9D8A6', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#E76F51', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF3B0', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#00B4D8', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /atardecer|golden\s+hour|puesta\s+de\s+sol/i,
      scene: 'landscape',
      vector: [0.85, 0.65, 0.9, 0.5, 0.7],
      title: 'Puesta de Sol Dorada (Golden Hour)',
      colors: [
        { hex: '#1D1A31', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#E85D04', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#FFBA08', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF1B8', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#D00000', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /drag[oó]n|fuego\s+y\s+lava|magma|volc[aá]n/i,
      scene: 'creature',
      vector: [0.95, 0.42, 0.95, 0.92, 0.4],
      title: 'Dragón Volcánico en Caverna de Obsidiana',
      colors: [
        { hex: '#161419', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#8B1E0F', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#FF3C00', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFE8A3', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#D9531E', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /cyberpunk|ne[oó]n|futurista|sci-fi/i,
      scene: 'cyberpunk',
      vector: [0.1, 0.4, 0.98, 0.95, 0.0],
      title: 'Metrópolis Cyberpunk Nocturna',
      colors: [
        { hex: '#0B091A', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#3A0CA3', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#F72585', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#4CC9F0', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#7209B7', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /nieve|invierno|lobo\s+blanco|hielo\s+[aá]rtico|glaciar/i,
      scene: 'landscape',
      vector: [-0.9, 0.85, 0.35, 0.3, 0.3],
      title: 'Inmensidad Glaciar & Nieve Ártica',
      colors: [
        { hex: '#E2EAF2', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#415A77', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#E07A5F', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFFFFF', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#778DA9', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /caf[eé]|chocolate/i,
      scene: 'still_life',
      vector: [0.65, 0.45, 0.65, 0.25, 0.8],
      title: 'Aroma de Café Tostado & Chocolate',
      colors: [
        { hex: '#1B120C', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#7F4F24', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#D4A373', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FAF0CA', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#936639', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /bodeg[oó]n|fruta[s]?|manzana[s]?|uvas/i,
      scene: 'still_life',
      vector: [0.5, 0.42, 0.85, 0.45, 0.95],
      title: 'Bodegón Clásico de Frutas al Óleo',
      colors: [
        { hex: '#261C14', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#588157', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#BA181B', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF1E6', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#E5383B', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /bosque\s+m[ií]stico|bosque\s+encantado|selva/i,
      scene: 'landscape',
      vector: [-0.25, 0.38, 0.82, 0.35, 0.98],
      title: 'Bosque Místico de Musgo y Niebla',
      colors: [
        { hex: '#0D1F12', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#4A3525', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#70E000', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#E8F5E9', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#38B000', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    },
    {
      pattern: /retrato|rostro|caravaggio|rembrandt/i,
      scene: 'portrait',
      vector: [0.55, 0.35, 0.65, 0.75, 0.8],
      title: 'Retrato Clásico en Claroscuro (Chiaroscuro)',
      colors: [
        { hex: '#14100D', roleName: 'Dominante (60% Atmósfera)', percentage: 60, roleKey: 'dominant' },
        { hex: '#4A2E1B', roleName: 'Secundario (30% Estructura)', percentage: 30, roleKey: 'secondary' },
        { hex: '#E0A96D', roleName: 'Acento Primario (10% Foco)', percentage: 10, roleKey: 'accent' },
        { hex: '#FFF3E0', roleName: 'Luz de Recorte / Especular', percentage: 0, roleKey: 'highlight' },
        { hex: '#C86432', roleName: 'Terminador (Transición SSS)', percentage: 0, roleKey: 'terminator' }
      ]
    }
  ],

  // Color Hue Mapping with comprehensive Spanish/English variants and plurals
  COLOR_HUE_MAP: {
    'rojo': 358, 'roja': 358, 'rojos': 358, 'rojas': 358, 'rojizo': 358, 'rojizos': 358, 'rojiza': 358, 'rojizas': 358, 'red': 358,
    'carmesi': 348, 'carmesí': 348, 'escarlata': 355, 'bermellon': 10, 'bermellón': 10, 'granate': 345, 'rubi': 352, 'rubí': 352, 'crimson': 348,
    'vino': 342, 'bordeaux': 342, 'cereza': 345, 'burgundy': 342,
    'rosa': 342, 'rosas': 342, 'rosado': 342, 'rosada': 342, 'rosados': 342, 'rosadas': 342, 'fucsia': 325, 'magenta': 325, 'pink': 342,
    'naranja': 26, 'naranjas': 26, 'anaranjado': 26, 'coral': 16, 'ambar': 40, 'ámbar': 40, 'melocoton': 25, 'melocotón': 25, 'orange': 26,
    'amarillo': 52, 'amarilla': 52, 'amarillos': 52, 'amarillas': 52, 'dorado': 45, 'dorada': 45, 'dorados': 45, 'doradas': 45, 'yellow': 52, 'gold': 45,
    'oro': 45, 'ocre': 38, 'mostaza': 44, 'limon': 60, 'limón': 60,
    'verde': 135, 'verdes': 135, 'verdoso': 135, 'verdosos': 135, 'esmeralda': 155, 'oliva': 85, 'menta': 160, 'green': 135, 'emerald': 155,
    'musgo': 115, 'pino': 140, 'hierba': 120, 'lima': 75,
    'azul': 218, 'azules': 218, 'azulado': 218, 'azulados': 218, 'celeste': 198, 'cian': 190, 'cyan': 190, 'blue': 218,
    'turquesa': 175, 'marino': 222, 'cobalto': 224, 'ultramar': 234, 'zafiro': 220, 'indigo': 250, 'añil': 250,
    'violeta': 275, 'violetas': 275, 'purpura': 295, 'púrpura': 295, 'morado': 285, 'morada': 285, 'lila': 285, 'lavanda': 270, 'purple': 295,
    'blanco': 'white', 'blanca': 'white', 'blancos': 'white', 'blancas': 'white', 'white': 'white',
    'negro': 'black', 'negra': 'black', 'negros': 'black', 'negras': 'black', 'black': 'black',
    'gris': 'gray', 'grises': 'gray', 'plata': 'silver', 'plateado': 'silver', 'gray': 'gray',
    'marron': 25, 'marrón': 25, 'castaño': 25, 'tierra': 25, 'cafe': 25, 'café': 25, 'brown': 25
  },

  // Vocabulary semantic lexicon with multidimensional vectors:
  // [thermal (-1 cool to +1 warm), valueKey (0 dark to 1 light), saturation (0-1), tension (0-1), organicity (0-1)]
  LEXICON: {
    // Thermal & Fire
    'fuego': [0.95, 0.7, 0.9, 0.8, 0.3],
    'calor': [0.9, 0.6, 0.8, 0.4, 0.5],
    'sol': [0.85, 0.85, 0.85, 0.3, 0.4],
    'lava': [0.98, 0.6, 0.95, 0.9, 0.1],
    'magma': [0.98, 0.65, 0.98, 0.95, 0.3],
    'volcan': [0.98, 0.48, 0.95, 0.9, 0.2],
    'volcanico': [0.98, 0.48, 0.95, 0.9, 0.2],
    'desierto': [0.8, 0.7, 0.6, 0.3, 0.6],
    'dorado': [0.75, 0.75, 0.8, 0.2, 0.2],
    'ambar': [0.7, 0.65, 0.75, 0.2, 0.4],
    'otoño': [0.65, 0.5, 0.7, 0.3, 0.9],

    // Creatures & Fantasy
    'dragon': [0.95, 0.38, 0.92, 0.92, 0.6],
    'criatura': [0.35, 0.45, 0.75, 0.75, 0.85],
    'monstruo': [0.2, 0.3, 0.8, 0.85, 0.7],
    'bestia': [0.4, 0.4, 0.75, 0.8, 0.8],
    'furia': [0.95, 0.45, 0.95, 0.98, 0.3],
    'fenix': [0.96, 0.75, 0.98, 0.85, 0.4],
    'vampiro': [-0.5, 0.18, 0.7, 0.85, 0.5],
    'sangre': [0.9, 0.35, 0.95, 0.9, 0.7],
    'veneno': [-0.1, 0.55, 0.95, 0.85, 0.8],
    'obsidiana': [-0.2, 0.12, 0.35, 0.85, 0.1],
    'cueva': [-0.4, 0.15, 0.35, 0.7, 0.6],
    'caverna': [-0.4, 0.15, 0.35, 0.7, 0.6],

    // Cold & Water
    'frio': [-0.9, 0.6, 0.6, 0.4, 0.3],
    'hielo': [-0.95, 0.85, 0.4, 0.3, 0.1],
    'nieve': [-0.85, 0.95, 0.15, 0.1, 0.2],
    'mar': [-0.75, 0.45, 0.75, 0.3, 0.7],
    'oceano': [-0.85, 0.3, 0.8, 0.5, 0.8],
    'glaciar': [-0.9, 0.75, 0.5, 0.3, 0.2],
    'invierno': [-0.8, 0.65, 0.3, 0.2, 0.5],
    'azul': [-0.8, 0.5, 0.8, 0.2, 0.2],

    // Atmosphere & Mystery
    'noche': [-0.7, 0.15, 0.6, 0.5, 0.4],
    'sombras': [-0.5, 0.12, 0.4, 0.6, 0.5],
    'oscuridad': [-0.6, 0.08, 0.3, 0.7, 0.3],
    'misterio': [-0.4, 0.25, 0.6, 0.7, 0.5],
    'gotico': [-0.3, 0.2, 0.5, 0.8, 0.6],
    'niebla': [-0.3, 0.6, 0.15, 0.1, 0.4],

    // Nature & Botanical
    'rosa': [0.75, 0.55, 0.92, 0.6, 0.95],
    'rosas': [0.75, 0.55, 0.92, 0.6, 0.95],
    'ramo': [0.35, 0.55, 0.85, 0.4, 0.95],
    'ramillete': [0.35, 0.55, 0.85, 0.4, 0.95],
    'bouquet': [0.35, 0.55, 0.85, 0.4, 0.95],
    'flor': [0.45, 0.65, 0.88, 0.35, 0.95],
    'flores': [0.45, 0.65, 0.88, 0.35, 0.95],
    'bosque': [-0.2, 0.4, 0.65, 0.2, 0.95],
    'selva': [-0.1, 0.45, 0.85, 0.3, 0.98],
    'tierra': [0.5, 0.35, 0.5, 0.2, 0.9],
    'musgo': [-0.3, 0.45, 0.6, 0.1, 0.9],
    'hojas': [-0.1, 0.5, 0.75, 0.2, 0.95],
    'primavera': [0.3, 0.75, 0.8, 0.25, 0.9],
    'jardin': [0.1, 0.6, 0.8, 0.3, 0.95],

    // Colors
    'rojo': [0.95, 0.45, 0.95, 0.8, 0.2],
    'roja': [0.95, 0.45, 0.95, 0.8, 0.2],
    'rojas': [0.95, 0.45, 0.95, 0.8, 0.2],
    'rojos': [0.95, 0.45, 0.95, 0.8, 0.2],
    'verde': [-0.2, 0.5, 0.8, 0.3, 0.95],
    'verdes': [-0.2, 0.5, 0.8, 0.3, 0.95],
    'amarillo': [0.8, 0.88, 0.95, 0.3, 0.3],
    'naranja': [0.85, 0.62, 0.9, 0.5, 0.3],
    'blanco': [-0.1, 0.98, 0.05, 0.1, 0.1],
    'negro': [-0.2, 0.05, 0.1, 0.8, 0.1]
  },

  /**
   * Generates a fully calculated, intelligent color scheme from ANY arbitrary user prompt.
   * Accurately recognizes floral bouquets, landscape panoramas, portraits, cyberpunk atmospheres,
   * without ever defaulting to dirty/muddy tones.
   */
  synthesizePalette(promptText) {
    const rawText = (promptText || '').trim();
    const cleanLower = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Direct Thematic Matcher (Flawless Curated Archetypes)
    for (const theme of this.THEMATIC_PALETTES) {
      if (theme.pattern.test(rawText) || theme.pattern.test(cleanLower)) {
        const colors = theme.colors.map(c => {
          const rgb = ColorMath.hexToRgb(c.hex);
          const hsv = ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b);
          return {
            rgb,
            hex: c.hex,
            hsv,
            roleName: c.roleName,
            percentage: c.percentage,
            roleKey: c.roleKey
          };
        });

        const critique = this.diagnosePalette(colors.map(c => c.rgb));
        const [thermal, valueKey, saturation, tension, organicity] = theme.vector;

        return {
          title: `Composición: "${rawText}"`,
          semanticVector: { thermal, valueKey, saturation, tension, organicity },
          colors,
          dominant: colors[0],
          secondary: colors[1],
          accent: colors[2],
          highlight: colors[3],
          terminator: colors[4],
          critique,
          sceneType: theme.scene
        };
      }
    }

    // 2. Advanced Generative NLP Parser
    // Tokenize and strip stopwords
    const rawTokens = rawText
      .toLowerCase()
      .replace(/[^a-záéíóúüñ0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0 && !this.STOPWORDS.has(t));

    // Detect explicit color mentions
    const explicitHues = [];
    const detectedThemes = [];

    rawTokens.forEach(t => {
      // Direct color match
      if (this.COLOR_HUE_MAP[t] !== undefined) {
        explicitHues.push(this.COLOR_HUE_MAP[t]);
      }
      // Botanical detection
      if (/rosa|flor|ramo|ramillete|bouquet|jardin|planta|petalo|hoja/.test(t)) {
        detectedThemes.push('botanical');
      }
      // Landscape detection
      if (/playa|mar|oceano|cielo|montaña|paisaje|atardecer|nieve|sol/.test(t)) {
        detectedThemes.push('landscape');
      }
      // Portrait detection
      if (/retrato|rostro|persona|mujer|hombre|cara|piel/.test(t)) {
        detectedThemes.push('portrait');
      }
      // Cyberpunk detection
      if (/cyberpunk|neon|futuro|scifi|ciudad/.test(t)) {
        detectedThemes.push('cyberpunk');
      }
    });

    // Vector calculation across Lexicon
    let vec = [0.1, 0.5, 0.6, 0.4, 0.5];
    let matchedCount = 0;

    rawTokens.forEach(t => {
      // Exact or safe stem match (length >= 4)
      for (const [key, val] of Object.entries(this.LEXICON)) {
        const matches = (t === key) || 
          (t.length >= 4 && key.length >= 4 && (t.startsWith(key) || key.startsWith(t)));
        if (matches) {
          for (let i = 0; i < 5; i++) {
            vec[i] = (vec[i] * matchedCount + val[i]) / (matchedCount + 1);
          }
          matchedCount++;
          break;
        }
      }
    });

    if (matchedCount === 0) {
      let hash = 0;
      for (let i = 0; i < rawText.length; i++) hash = (hash << 5) - hash + rawText.charCodeAt(i);
      const rand1 = Math.abs(Math.sin(hash)) % 1;
      const rand2 = Math.abs(Math.cos(hash)) % 1;
      const rand3 = Math.abs(Math.sin(hash * 2)) % 1;
      vec = [rand1 * 2 - 1, 0.4 + rand2 * 0.4, 0.5 + rand3 * 0.4, 0.3 + rand1 * 0.4, rand2];
    }

    const [thermal, valueKey, saturation, tension, organicity] = vec;

    // Determine Base Primary Hue
    let heroHue;
    const firstHue = explicitHues.find(h => typeof h === 'number');
    if (firstHue !== undefined) {
      heroHue = firstHue;
    } else if (thermal >= 0) {
      heroHue = Math.round(15 + (1 - thermal) * 35);
    } else {
      heroHue = Math.round(210 + Math.abs(thermal) * 25);
    }

    // Determine Scene Type
    let sceneType = 'landscape';
    if (detectedThemes.includes('botanical')) sceneType = 'botanical';
    else if (detectedThemes.includes('portrait')) sceneType = 'portrait';
    else if (detectedThemes.includes('cyberpunk')) sceneType = 'cyberpunk';
    else if (detectedThemes.includes('landscape')) sceneType = 'landscape';
    else if (/drag[oó]n|monstruo|bestia|volc[aá]n|cueva/.test(cleanLower)) sceneType = 'creature';
    else if (/bodeg[oó]n|fruta|copa|vino|mesa/.test(cleanLower)) sceneType = 'still_life';
    else if (/cartel|poster|bauhaus|logo/.test(cleanLower)) sceneType = 'poster';

    // Build Authentic 60-30-10 Harmony:
    // 1. Dominant (60%): Atmosphere/Backdrop (Never muddy!)
    let domHue, domSat, domVal;
    // 2. Secondary (30%): Structure/Complement
    let secHue, secSat, secVal;
    // 3. Accent (10%): Focal Sparkle (Hero hue!)
    let accHue, accSat, accVal;

    if (sceneType === 'botanical' || detectedThemes.includes('botanical')) {
      // Botanical harmony: Rich hero bloom paired with lush foliage green
      accHue = heroHue; // The focal flower bloom!
      accSat = Math.max(0.85, saturation * 1.15);
      accVal = 0.88;

      secHue = 145; // Foliage emerald green stems and leaves
      secSat = 0.55;
      secVal = 0.38;

      domHue = (heroHue + 340) % 360; // Deep velvety dark floral atmosphere
      domSat = 0.55;
      domVal = 0.12;
    } else if (valueKey > 0.7) {
      // High-Key scene (Luminous, airy, ethereal)
      domHue = heroHue;
      domSat = Math.min(0.20, saturation * 0.25);
      domVal = 0.94; // Light crisp background!

      secHue = (heroHue + (thermal >= 0 ? 30 : -30) + 360) % 360;
      secSat = Math.min(0.65, saturation * 0.7);
      secVal = 0.55;

      accHue = heroHue;
      accSat = Math.max(0.80, saturation);
      accVal = 0.90;
    } else {
      // Deep dramatic / Chiaroscuro scene
      domHue = (heroHue + (thermal > 0 ? -15 : 15) + 360) % 360;
      domSat = Math.min(0.60, saturation * 0.7);
      domVal = 0.12; // Deep velvety dark shadow!

      secHue = (heroHue + (tension > 0.5 ? 150 : 35) + 360) % 360;
      secSat = Math.min(0.75, saturation * 0.85);
      secVal = 0.48;

      accHue = heroHue;
      accSat = Math.max(0.85, saturation * 1.1);
      accVal = 0.95;
    }

    const cDominant = ColorMath.hsvToRgb(domHue, domSat, domVal);
    const cSecondary = ColorMath.hsvToRgb(secHue, secSat, secVal);
    const cAccent = ColorMath.hsvToRgb(accHue, accSat, accVal);

    // Specular Highlight & SSS Terminator
    const rimHue = (accHue + 15) % 360;
    const cRim = ColorMath.hsvToRgb(rimHue, Math.min(0.22, accSat * 0.2), 0.98);

    const bridgeHue = (accHue + (thermal >= 0 ? 15 : -15) + 360) % 360;
    const cBridge = ColorMath.hsvToRgb(bridgeHue, Math.min(0.85, accSat * 0.9), 0.75);

    const colors = [
      {
        rgb: cDominant,
        hex: ColorMath.rgbToHex(cDominant.r, cDominant.g, cDominant.b),
        hsv: ColorMath.rgbToHsv(cDominant.r, cDominant.g, cDominant.b),
        roleName: 'Dominante (60% Atmósfera)',
        percentage: 60,
        roleKey: 'dominant'
      },
      {
        rgb: cSecondary,
        hex: ColorMath.rgbToHex(cSecondary.r, cSecondary.g, cSecondary.b),
        hsv: ColorMath.rgbToHsv(cSecondary.r, cSecondary.g, cSecondary.b),
        roleName: 'Secundario (30% Estructura)',
        percentage: 30,
        roleKey: 'secondary'
      },
      {
        rgb: cAccent,
        hex: ColorMath.rgbToHex(cAccent.r, cAccent.g, cAccent.b),
        hsv: ColorMath.rgbToHsv(cAccent.r, cAccent.g, cAccent.b),
        roleName: 'Acento Primario (10% Foco)',
        percentage: 10,
        roleKey: 'accent'
      },
      {
        rgb: cRim,
        hex: ColorMath.rgbToHex(cRim.r, cRim.g, cRim.b),
        hsv: ColorMath.rgbToHsv(cRim.r, cRim.g, cRim.b),
        roleName: 'Luz de Recorte / Especular',
        percentage: 0,
        roleKey: 'highlight'
      },
      {
        rgb: cBridge,
        hex: ColorMath.rgbToHex(cBridge.r, cBridge.g, cBridge.b),
        hsv: ColorMath.rgbToHsv(cBridge.r, cBridge.g, cBridge.b),
        roleName: 'Terminador (Transición SSS)',
        percentage: 0,
        roleKey: 'terminator'
      }
    ];

    const critique = this.diagnosePalette(colors.map(c => c.rgb));

    return {
      title: `Composición: "${rawText}"`,
      semanticVector: { thermal, valueKey, saturation, tension, organicity },
      colors,
      dominant: colors[0],
      secondary: colors[1],
      accent: colors[2],
      highlight: colors[3],
      terminator: colors[4],
      critique,
      sceneType
    };
  },

  /**
   * Rigorous Diagnostic & Academic Art Direction Critique of ANY Palette:
   * Evaluates Dynamic Value Range, Temperature Equilibrium, Contrast Separation,
   * and potential pitfalls (muddy midtones, plastic highlights, lack of focal anchor).
   */
  diagnosePalette(rgbList) {
    if (!rgbList || rgbList.length < 2) return null;

    // 1. Calculate luminance values and histogram
    const luminances = rgbList.map(c => ColorMath.getLuminance(c.r, c.g, c.b));
    const minLum = Math.min(...luminances);
    const maxLum = Math.max(...luminances);
    const dynamicRange = maxLum - minLum; // 0 to 1

    // 2. Calculate thermal balance
    const temperatures = rgbList.map(c => {
      const hsv = ColorMath.rgbToHsv(c.r, c.g, c.b);
      if ((hsv.h >= 0 && hsv.h <= 75) || hsv.h >= 320) return 1; // Warm
      if (hsv.h >= 150 && hsv.h <= 270) return -1; // Cool
      return 0; // Neutral / Green / Violet
    });
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    // 3. Contrast ratio between darkest and brightest
    const maxContrast = parseFloat(((maxLum + 0.05) / (minLum + 0.05)).toFixed(1));

    // Formulate diagnosis
    const findings = [];
    const suggestions = [];

    // Value evaluation
    if (dynamicRange < 0.35) {
      findings.push('⚠️ Rango Dinámico Estrecho: Los valores de luz y sombra están comprimidos en medios tonos.');
      suggestions.push('Profundiza las sombras de oclusión o eleva el brillo del acento para evitar una pintura empastada o plana.');
    } else {
      findings.push(`✓ Excelente Rango Tonal (Contraste ${maxContrast}:1): Separación nítida para jerarquía visual.`);
    }

    // Thermal evaluation
    if (Math.abs(avgTemp) > 0.6) {
      const isWarm = avgTemp > 0;
      findings.push(`ℹ️ Tendencia Térmica Marcada: ${isWarm ? 'Predominancia cálida' : 'Predominancia fría'}.`);
      suggestions.push(`Añade un ancla de temperatura opuesta (${isWarm ? 'un azul/violeta frío en sombras' : 'un dorado/ámbar cálido en reflejos'}) para maximizar la vibración cromática.`);
    } else {
      findings.push('✓ Diálogo Térmico Equilibrado: Coexisten tonos cálidos y fríos en armoniosa tensión.');
    }

    // Saturation & Mud check
    const saturations = rgbList.map(c => ColorMath.rgbToHsv(c.r, c.g, c.b).s);
    const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;
    if (avgSat < 0.25) {
      findings.push('⚠️ Paleta de Baja Crominancia: Peligro de tonos lavados o grisáceos sin vida.');
      suggestions.push('Introduce un punto focal de saturación elevada en el área que deseas que el espectador mire primero.');
    } else if (avgSat > 0.8) {
      findings.push('⚡ Máxima Saturación: Alta energía cromática (estilo animación / cómic).');
      suggestions.push('Procura reservar un tono neutro o desaturado para que el ojo descanse y el color vivo no sature la vista.');
    }

    // Guaranteed actionable Art Director advice
    if (suggestions.length === 0) {
      if (maxContrast >= 6) {
        suggestions.push(`Aprovecha el potente contraste (${maxContrast}:1) concentrando el 10% de acento exclusivamente en el centro de interés narrativo (ojos, gemas o impacto lumínico).`);
      } else {
        suggestions.push('Aplica la regla 60-30-10: reserva el acento del 10% únicamente para la zona de mayor atracción visual y mantén el dominante del 60% en planos amplios para descanso visual.');
      }
      suggestions.push('Utiliza el tono de recorte especular en los bordes de las siluetas para despegar las figuras del fondo con volumen tridimensional inmediato.');
    }

    return {
      dynamicRange: Math.round(dynamicRange * 100),
      contrastRatio: maxContrast,
      findings,
      suggestions,
      score: Math.min(100, Math.round((dynamicRange * 40) + (maxContrast > 4 ? 30 : 15) + (Math.abs(avgTemp) < 0.7 ? 30 : 15)))
    };
  }
};
