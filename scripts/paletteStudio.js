/**
 * GOM Picker - Palette Studio Engine
 * Advanced Studio for Master, Library, and Custom Live Palettes.
 * Computes 2D physical subtractive mixing matrices, gamut hull coverage,
 * tonal ramps, and chromatic balance diagnostics.
 * 
 * 100% Offline, Zero external dependencies.
 */

import { ColorMath } from './colorMath.js';
import { AtmosphereEngine } from './atmosphereEngine.js';
import { GamutMaskEngine } from './gamutMask.js';

export const PaletteStudioEngine = {
  app: null,
  activeMode: 'master', // 'master' | 'library' | 'custom'
  activeMasterId: 'zorn',
  activeLibraryId: null,
  customColors: [
    { name: 'Blanco Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
    { name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
    { name: 'Rojo Cadmio', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
    { name: 'Negro Marfil', ci: 'PBk9', hex: '#1C1B1A', rgb: { r: 28, g: 27, b: 26 } }
  ],

  // Comprehensive Catalog of Master & Studio Palettes
  MASTER_PALETTES: [
    {
      id: 'zorn',
      category: 'masters',
      name: 'Paleta Zorn (Anders Zorn - 4 Tubos Canónicos)',
      era: 'Siglo XIX / Realismo Sueco & Retrato',
      desc: 'La paleta limitada más célebre de la historia: Blanco de Titanio, Ocre Amarillo, Rojo Cadmio y Negro Marfil. El Negro Marfil actúa como azul frío al mezclarse con blanco, creando verdes oliva naturales con el ocre y violetas apacibles con el rojo.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
        { name: 'Rojo Cadmio', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
        { name: 'Negro Marfil (Azul frío)', ci: 'PBk9', hex: '#1C1B1A', rgb: { r: 28, g: 27, b: 26 } }
      ]
    },
    {
      id: 'apelles_tetrachrome',
      category: 'masters',
      name: 'Tetracromatismo de Apeles (Grecia Clásica)',
      era: 'Antigüedad Clásica (Plinio el Viejo)',
      desc: 'Los 4 pigmentos primigenios con los que según Plinio pintaban Apeles y Zeuxis: Leukon (Blanco Melos), Ochra (Ocre ático), Sinopis (Rojo póntico) y Melas (Negro carbón de vid). La madre histórica de la paleta Zorn.',
      tubes: [
        { name: 'Blanco de Melos (Leukon)', ci: 'PW18', hex: '#FDFBF7', rgb: { r: 253, g: 251, b: 247 } },
        { name: 'Ocre Ático Dorado (Ochra)', ci: 'PY43', hex: '#CF9B38', rgb: { r: 207, g: 155, b: 56 } },
        { name: 'Rojo Sinopia Póntico (Milphos)', ci: 'PR102', hex: '#A93226', rgb: { r: 169, g: 50, b: 38 } },
        { name: 'Negro de Sarmientos (Melas)', ci: 'PBk8', hex: '#1B1C1D', rgb: { r: 27, g: 28, b: 29 } }
      ]
    },
    {
      id: 'caravaggio_tenebrism',
      category: 'masters',
      name: 'Tenebrismo Caravaggesco (Chiaroscuro Extremo)',
      era: 'Barroco Temprano (Roma c. 1600)',
      desc: 'Fondo oscuro con imprimatura de bol de Armenia y tierras densas. La luz focal incide con potencia esculpiendo las figuras sobre un vacío misterioso.',
      tubes: [
        { name: 'Blanco de Plomo', ci: 'PW1', hex: '#F8F6F0', rgb: { r: 248, g: 246, b: 240 } },
        { name: 'Ocre Rojo Pozzuoli', ci: 'PR102', hex: '#9E382A', rgb: { r: 158, g: 56, b: 42 } },
        { name: 'Tierra Siena Natural', ci: 'PBr7', hex: '#BD762A', rgb: { r: 189, g: 118, b: 42 } },
        { name: 'Tierra Colonia / Asfalto', ci: 'N/A', hex: '#3B271A', rgb: { r: 59, g: 39, b: 26 } },
        { name: 'Negro Hueso Calcinado', ci: 'PBk9', hex: '#141414', rgb: { r: 20, g: 20, b: 20 } }
      ]
    },
    {
      id: 'velazquez_court',
      category: 'masters',
      name: 'Paleta Regia de Velázquez (Siglo de Oro Español)',
      era: 'Barroco Madrileño (c. 1650)',
      desc: 'Maestría atmosférica y pincelada fluida con pigmentos sobrios. El esmalte azul (vidrio potásico con cobalto) y las tierras de Sevilla creaban grises plateados inigualables.',
      tubes: [
        { name: 'Blanco de Albayalde', ci: 'PW1', hex: '#FAF7EE', rgb: { r: 250, g: 247, b: 238 } },
        { name: 'Ocre de Sevilla', ci: 'PY43', hex: '#B88630', rgb: { r: 184, g: 134, b: 48 } },
        { name: 'Bermellón de Cinabrio', ci: 'PR106', hex: '#C23B22', rgb: { r: 194, g: 59, b: 34 } },
        { name: 'Esmalte Azul (Smalt)', ci: 'PB32', hex: '#3C5A85', rgb: { r: 60, g: 90, b: 133 } },
        { name: 'Tierra Sombras Natural', ci: 'PBr7', hex: '#4A3B32', rgb: { r: 74, g: 59, b: 50 } },
        { name: 'Negro Carbón Vegetal', ci: 'PBk8', hex: '#1E1E1E', rgb: { r: 30, g: 30, b: 30 } }
      ]
    },
    {
      id: 'rembrandt_chiaroscuro',
      category: 'masters',
      name: 'Claro-Oscuro y Glaseados de Rembrandt',
      era: 'Edad de Oro Holandesa (c. 1660)',
      desc: 'Empastes gruesos y veladuras de resinas ámbar. Los ocres dorados y tierras de Cassel funden las sombras en un halo dorado cálido de recogimiento interior.',
      tubes: [
        { name: 'Blanco de Plomo', ci: 'PW1', hex: '#F9F5EB', rgb: { r: 249, g: 245, b: 235 } },
        { name: 'Ocre Oro Holandés', ci: 'PY43', hex: '#D29C38', rgb: { r: 210, g: 156, b: 56 } },
        { name: 'Rojo Laca de Grana', ci: 'NR4', hex: '#8C1D2A', rgb: { r: 140, g: 29, b: 42 } },
        { name: 'Tierra de Cassel (Sombra)', ci: 'N/A', hex: '#402E23', rgb: { r: 64, g: 46, b: 35 } },
        { name: 'Negro de Lámpara', ci: 'PBk6', hex: '#1A1816', rgb: { r: 26, g: 24, b: 22 } }
      ]
    },
    {
      id: 'vermeer_delft',
      category: 'masters',
      name: 'Johannes Vermeer (Lapis Láser & Sombras de Delft)',
      era: 'Barroco Holandés (c. 1665)',
      desc: 'La perla de Delft. Uso extravagante del costoso Lapislázuli natural genuino, incluso en las sombras de los paños blancos, complementado con amarillo de plomo-estaño y ocre.',
      tubes: [
        { name: 'Blanco de Cerusa', ci: 'PW1', hex: '#FDFBF7', rgb: { r: 253, g: 251, b: 247 } },
        { name: 'Amarillo Plomo-Estaño', ci: 'NY3', hex: '#EAD15B', rgb: { r: 234, g: 209, b: 91 } },
        { name: 'Ocre Amarillo Claro', ci: 'PY43', hex: '#D4A346', rgb: { r: 212, g: 163, b: 70 } },
        { name: 'Lapis Ultramar Genuino', ci: 'PB29', hex: '#1C3B82', rgb: { r: 28, g: 59, b: 130 } },
        { name: 'Laca de Rubia / Madder', ci: 'NR9', hex: '#9E2A2B', rgb: { r: 158, g: 42, b: 43 } },
        { name: 'Tierra Sombra Natural', ci: 'PBr7', hex: '#463A2F', rgb: { r: 70, g: 58, b: 47 } }
      ]
    },
    {
      id: 'monet_impressionist',
      category: 'masters',
      name: 'Paleta Impresionista de Claude Monet (Sin Negro)',
      era: 'Impresionismo Francés (Giverny 1890)',
      desc: 'Monet desterró el negro absoluto. La luz solar refracta sombras violáceas, turquesas y complementarias coloreadas vivas.',
      tubes: [
        { name: 'Blanco de Cinc / Titanio', ci: 'PW4', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cadmio Claro', ci: 'PY35', hex: '#FBE844', rgb: { r: 251, g: 232, b: 68 } },
        { name: 'Verde Esmeralda (Viridian)', ci: 'PG18', hex: '#007F5C', rgb: { r: 0, g: 127, b: 92 } },
        { name: 'Azul Cobalto Profundo', ci: 'PB28', hex: '#0047AB', rgb: { r: 0, g: 71, b: 171 } },
        { name: 'Violeta de Cobalto', ci: 'PV14', hex: '#72397B', rgb: { r: 114, g: 57, b: 123 } },
        { name: 'Laca de Alizarina', ci: 'PR83', hex: '#B82846', rgb: { r: 184, g: 40, b: 70 } }
      ]
    },
    {
      id: 'sorolla_luminism',
      category: 'masters',
      name: 'Luminismo Mediterráneo de Joaquín Sorolla',
      era: 'Post-Impresionismo / Luminismo Valenciano (c. 1910)',
      desc: 'El maestro del sol radiante. Blancos tintados con reflejos violáceos, turquesas vibrantes y sombras coloreadas por el rebote solar en la arena.',
      tubes: [
        { name: 'Blanco de Cinc Extra', ci: 'PW4', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cromo / Nápoles', ci: 'PY34', hex: '#F5D76E', rgb: { r: 245, g: 215, b: 110 } },
        { name: 'Azul Cerúleo Genuino', ci: 'PB35', hex: '#2A82BE', rgb: { r: 42, g: 130, b: 190 } },
        { name: 'Violeta Cobalto Profundo', ci: 'PV14', hex: '#683679', rgb: { r: 104, g: 54, b: 121 } },
        { name: 'Rosa Alizarina / Garance', ci: 'PR83', hex: '#D7385E', rgb: { r: 215, g: 56, b: 94 } },
        { name: 'Ocre Dorado Valenciano', ci: 'PY43', hex: '#C28938', rgb: { r: 194, g: 137, b: 56 } }
      ]
    },
    {
      id: 'cezanne_modulation',
      category: 'masters',
      name: 'Paul Cézanne (Modulación Térmica Cálido/Frío)',
      era: 'Post-Impresionismo (Aix-en-Provence c. 1895)',
      desc: 'No modelaba con claro-oscuro sino modulando la temperatura: planos que avanzan con tonos cálidos y planos que retroceden con matices azules y grises ultramar.',
      tubes: [
        { name: 'Blanco de Cinc', ci: 'PW4', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cadmio Medio', ci: 'PY35', hex: '#F5C22D', rgb: { r: 245, g: 194, b: 45 } },
        { name: 'Rojo Laca Garance', ci: 'PR83', hex: '#BE263E', rgb: { r: 190, g: 38, b: 62 } },
        { name: 'Azul Ultramar Francés', ci: 'PB29', hex: '#1E358A', rgb: { r: 30, g: 53, b: 138 } },
        { name: 'Verde Viridián', ci: 'PG18', hex: '#1C7C54', rgb: { r: 28, g: 124, b: 84 } },
        { name: 'Tierra Siena Tostada', ci: 'PBr7', hex: '#873E23', rgb: { r: 135, g: 62, b: 35 } }
      ]
    },
    {
      id: 'van_gogh_starry',
      category: 'masters',
      name: 'Vincent van Gogh (Noche Estrellada & Contrastes)',
      era: 'Post-Impresionismo Expresivo (Saint-Rémy 1889)',
      desc: 'Poderosos choques complementarios entre amarillo cadmio fosforescente y azules ultramarinos profundos que transmiten angustia, vida y emoción mística.',
      tubes: [
        { name: 'Blanco de Cinc', ci: 'PW4', hex: '#FDFBF7', rgb: { r: 253, g: 251, b: 247 } },
        { name: 'Amarillo Cromo Vibrante', ci: 'PY34', hex: '#FFD400', rgb: { r: 255, g: 212, b: 0 } },
        { name: 'Azul de Prusia (Nocturno)', ci: 'PB27', hex: '#0B2D48', rgb: { r: 11, g: 45, b: 72 } },
        { name: 'Azul Ultramar Intenso', ci: 'PB29', hex: '#1A3F8B', rgb: { r: 26, g: 63, b: 139 } },
        { name: 'Verde Cromo / Oliva', ci: 'PG17', hex: '#3E5C35', rgb: { r: 62, g: 92, b: 53 } }
      ]
    },
    {
      id: 'degas_pastels',
      category: 'masters',
      name: 'Edgar Degas (Pasteles Luminosos & Teatrales)',
      era: 'Impresionismo de París (c. 1880)',
      desc: 'Especialista en iluminación artificial escénica, tutús de bailarinas y contrastes sutiles entre sombras cálidas ocres y turquesas escarchados.',
      tubes: [
        { name: 'Blanco Creta / Cinc', ci: 'PW4', hex: '#FAF8F5', rgb: { r: 250, g: 248, b: 245 } },
        { name: 'Rosa Pastel Neoclásico', ci: 'PR122', hex: '#EAA6B8', rgb: { r: 234, g: 166, b: 184 } },
        { name: 'Azul Turquesa Pastel', ci: 'PB15', hex: '#68B0C4', rgb: { r: 104, g: 176, b: 196 } },
        { name: 'Ocre Amarillo Pálido', ci: 'PY43', hex: '#DFBA6D', rgb: { r: 223, g: 186, b: 109 } },
        { name: 'Sombra Tostada de Café', ci: 'PBr7', hex: '#4D3628', rgb: { r: 77, g: 54, b: 40 } }
      ]
    },
    {
      id: 'turner_atmospheric',
      category: 'masters',
      name: 'Atmósferas y Tormentas de J.M.W. Turner',
      era: 'Romanticismo Británico (c. 1840)',
      desc: 'Fusión de vapor, fuego y mar. Turner utilizaba amarillos incandescentes y azules de índigo velados para disolver la materia física en energía pura lumínica.',
      tubes: [
        { name: 'Blanco de Cerusa', ci: 'PW1', hex: '#FBF9F2', rgb: { r: 251, g: 249, b: 242 } },
        { name: 'Amarillo de Turner (Patent Yellow)', ci: 'PY41', hex: '#F0BA35', rgb: { r: 240, g: 186, b: 53 } },
        { name: 'Bermellón Escarlata', ci: 'PR106', hex: '#DB3426', rgb: { r: 219, g: 52, b: 38 } },
        { name: 'Azul Índigo Natural', ci: 'NB1', hex: '#1D2F4E', rgb: { r: 29, g: 47, b: 78 } },
        { name: 'Siena Tostada Profunda', ci: 'PBr7', hex: '#7E3622', rgb: { r: 126, g: 54, b: 34 } }
      ]
    },
    {
      id: 'hokusai_ukiyo_e',
      category: 'masters',
      name: 'Grabado Ukiyo-e Tradicional (Katsushika Hokusai)',
      era: 'Período Edo Japonés (c. 1830)',
      desc: 'La paleta de las 36 vistas del Monte Fuji. El empleo del Azul de Berlín (Prusia importado) combinado con bermellón mineral y ocre cúrcuma.',
      tubes: [
        { name: 'Blanco Gofun (Concha Marina)', ci: 'PW18', hex: '#F5F5ED', rgb: { r: 245, g: 245, b: 237 } },
        { name: 'Azul de Berlín / Prusia (Aizuri-e)', ci: 'PB27', hex: '#0B3A64', rgb: { r: 11, g: 58, b: 100 } },
        { name: 'Rojo Bermellón Mineral (Shu)', ci: 'PR106', hex: '#D23724', rgb: { r: 210, g: 55, b: 36 } },
        { name: 'Amarillo Cúrcuma / Ocre (Ki)', ci: 'PY43', hex: '#CBA048', rgb: { r: 203, g: 160, b: 72 } },
        { name: 'Tinta Sumi Carbón de Pino', ci: 'PBk6', hex: '#18191A', rgb: { r: 24, g: 25, b: 26 } }
      ]
    },
    {
      id: 'matisse_fauve',
      category: 'masters',
      name: 'Fauvismo Expresivo Puro (Henri Matisse)',
      era: 'Vanguardias / Fauvismo (Collioure 1905)',
      desc: 'Color directo del tubo. Liberación total del color respecto al objeto representado: máximo choque cromático primario.',
      tubes: [
        { name: 'Blanco Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Rojo Cadmio Puro', ci: 'PR108', hex: '#E61E28', rgb: { r: 230, g: 30, b: 40 } },
        { name: 'Amarillo Limón Puro', ci: 'PY3', hex: '#FFF200', rgb: { r: 255, g: 242, b: 0 } },
        { name: 'Azul Cobalto Eléctrico', ci: 'PB28', hex: '#0047AB', rgb: { r: 0, g: 71, b: 171 } },
        { name: 'Verde Viridián Intenso', ci: 'PG18', hex: '#008C5A', rgb: { r: 0, g: 140, b: 90 } },
        { name: 'Violeta Manganeso', ci: 'PV16', hex: '#8B2252', rgb: { r: 139, g: 34, b: 82 } }
      ]
    },

    // STUDIO & TRADITIONAL PALETTES
    {
      id: 'primary_triad',
      category: 'studio',
      name: 'Tríada Primaria Clásica (Cyan, Magenta, Amarillo)',
      era: 'Color Tradicional de Estudio',
      desc: 'Tríada sustractiva pura de alta pureza cromática. Permite recorrer el círculo cromático completo manteniendo saturación brillante en secundarios.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cadmio Medio', ci: 'PY35', hex: '#FFD300', rgb: { r: 255, g: 211, b: 0 } },
        { name: 'Magenta Quinacridona', ci: 'PR122', hex: '#C71585', rgb: { r: 199, g: 21, b: 133 } },
        { name: 'Azul Ultramar Francés', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } }
      ]
    },
    {
      id: 'split_primary',
      category: 'studio',
      name: 'Split-Primary (6 Primarios Cálidos & Fríos)',
      era: 'Ilustración & Taller Moderno',
      desc: 'Un primario cálido y uno frío para cada color básico. Evita mezclas desaturadas no deseadas garantizando colores secundarios de máxima viveza.',
      tubes: [
        { name: 'Amarillo Limón (Frío)', ci: 'PY3', hex: '#FFF44F', rgb: { r: 255, g: 244, b: 79 } },
        { name: 'Amarillo Cadmio (Cálido)', ci: 'PY35', hex: '#FFAE42', rgb: { r: 255, g: 174, b: 66 } },
        { name: 'Rojo Cadmio (Cálido)', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
        { name: 'Carmesí Alizarina (Frío)', ci: 'PR83', hex: '#A31934', rgb: { r: 163, g: 25, b: 52 } },
        { name: 'Azul Ultramar (Cálido)', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } },
        { name: 'Azul Ftalo (Frío)', ci: 'PB15:3', hex: '#000F89', rgb: { r: 0, g: 15, b: 137 } }
      ]
    },
    {
      id: 'renaissance_earth',
      category: 'studio',
      name: 'Paleta Tierra Renacentista (Ocre, Sombra, Almagre)',
      era: 'Renacimiento & Siglo de Oro',
      desc: 'Tierras ricas en óxidos de hierro para retratos y paisajes atmosféricos. Produce armonías orgánicamente unificadas.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Ocre Amarillo Natural', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
        { name: 'Tierra Siena Tostada', ci: 'PBr7', hex: '#8A3324', rgb: { r: 138, g: 51, b: 36 } },
        { name: 'Tierra Sombra Tostada', ci: 'PBr7', hex: '#482D20', rgb: { r: 72, g: 45, b: 32 } },
        { name: 'Azul Ultramar Lapis', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } }
      ]
    },
    {
      id: 'farges_academic_portrait',
      category: 'studio',
      name: 'Paleta Académica de Retrato (Florent Farges & Bouguereau)',
      era: 'Atelier Académico Contemporáneo',
      desc: 'Selección rigurosa para carnaciones humanas vivas sin saturación excesiva. Los tonos carne se modulan suavemente entre el amarillo, el rojo óxido y el semitono frío.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo de Nápoles Claro', ci: 'PW4/PY42', hex: '#FADA8F', rgb: { r: 250, g: 218, b: 143 } },
        { name: 'Rojo Óxido Transparente', ci: 'PR101', hex: '#A83B24', rgb: { r: 168, g: 59, b: 36 } },
        { name: 'Tierra de Sombra Natural', ci: 'PBr7', hex: '#4B3F33', rgb: { r: 75, g: 63, b: 51 } },
        { name: 'Azul Ultramar Claro', ci: 'PB29', hex: '#2C4FA2', rgb: { r: 44, g: 79, b: 162 } },
        { name: 'Negro Marfil', ci: 'PBk9', hex: '#1C1A18', rgb: { r: 28, g: 26, b: 24 } }
      ]
    },
    {
      id: 'grisaille_verdaccio',
      category: 'studio',
      name: 'Grisalla y Verdaccio Florentino (Bottega Quintoceño)',
      era: 'Renacimiento Temprano (Giotto & Leonardo)',
      desc: 'El Verdaccio es la mezcla de tierra verde, ocre y blanco usada en el Renacimiento italiano para la subcapa de las figuras. Los matices rosáceos translúcidos cobran vida vibrante sobre esta base neutra verdosa.',
      tubes: [
        { name: 'Blanco de San Juan (Caliza)', ci: 'PW18', hex: '#FAF9F5', rgb: { r: 250, g: 249, b: 245 } },
        { name: 'Tierra Verde de Verona', ci: 'PG23', hex: '#586A55', rgb: { r: 88, g: 106, b: 85 } },
        { name: 'Ocre Amarillo Tosco', ci: 'PY43', hex: '#C2963B', rgb: { r: 194, g: 150, b: 59 } },
        { name: 'Tierra Sombra Cipriota', ci: 'PBr7', hex: '#443A32', rgb: { r: 68, g: 58, b: 50 } },
        { name: 'Negro Carbón de Vid', ci: 'PBk8', hex: '#191817', rgb: { r: 25, g: 24, b: 23 } }
      ]
    },
    {
      id: 'nordic_landscape',
      category: 'studio',
      name: 'Paisaje Plein-Air Nórdico & Bosque',
      era: 'Paisajismo Escandinavo & Realismo',
      desc: 'Formulación para vegetación húmeda, cielo cubierto y rocas con líquenes. Evita verdes estridentes artificiales mediante mezclas de ocres y sombras naturales.',
      tubes: [
        { name: 'Blanco Titanio', ci: 'PW6', hex: '#FAFBF8', rgb: { r: 250, g: 251, b: 248 } },
        { name: 'Ocre Amarillo Óxido', ci: 'PY42', hex: '#C79A45', rgb: { r: 199, g: 154, b: 69 } },
        { name: 'Verde Cromo Óxido', ci: 'PG17', hex: '#526E4A', rgb: { r: 82, g: 110, b: 74 } },
        { name: 'Azul Cobalto Grisáceo', ci: 'PB28', hex: '#48688A', rgb: { r: 72, g: 104, b: 138 } },
        { name: 'Tierra Sombra Tostada', ci: 'PBr7', hex: '#442F24', rgb: { r: 68, g: 47, b: 36 } }
      ]
    },

    // CONCEPT ART & GAMUT MASKS
    {
      id: 'gurney_triad_mask',
      category: 'concept',
      name: 'Gamut Mask Triádico Armónico (James Gurney - Color & Light)',
      era: 'Arte Conceptual & Gouache Moderno',
      desc: 'Enfoque de color ambiental: restringir la rueda cromática a un triángulo deliberado con baja saturación relativa. Todos los colores se subordinan a una clave térmica estricta.',
      tubes: [
        { name: 'Blanco Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Óxido Transparente', ci: 'PY42', hex: '#D49B28', rgb: { r: 212, g: 155, b: 40 } },
        { name: 'Rojo Veneciano / Mars Red', ci: 'PR101', hex: '#993D33', rgb: { r: 153, g: 61, b: 51 } },
        { name: 'Gris de Payne Azulado', ci: 'PB15/PBk9', hex: '#2F3C48', rgb: { r: 47, g: 60, b: 72 } },
        { name: 'Verde Cromo Cálido', ci: 'PG17', hex: '#58673F', rgb: { r: 88, g: 103, b: 63 } }
      ]
    },
    {
      id: 'cyberpunk_neo_limited',
      category: 'concept',
      name: 'Sci-Fi Neón Synth (Digital Concept Art)',
      era: 'Arte Digital Contemporáneo',
      desc: 'Tríada neón saturada sobre base de grafito profundo. Choque violento entre cian eléctrico y magenta sobre fondos oscuros bajo lluvia ácida.',
      tubes: [
        { name: 'Blanco Lumínico', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Cian Neón', ci: 'PB15:3', hex: '#00E5FF', rgb: { r: 0, g: 229, b: 255 } },
        { name: 'Magenta Eléctrico', ci: 'PR122', hex: '#FF007F', rgb: { r: 255, g: 0, b: 127 } },
        { name: 'Ámbar Radiactivo', ci: 'PY110', hex: '#FFB300', rgb: { r: 255, g: 179, b: 0 } },
        { name: 'Negro Carbón Grafito', ci: 'PBk7', hex: '#0D0F14', rgb: { r: 13, g: 15, b: 20 } }
      ]
    }
  ],

  init(app) {
    this.app = app;
    this._bindControls();
  },

  _bindControls() {
    // Mode Buttons
    const modeBtns = document.querySelectorAll('.pal-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active-toggle'));
        btn.classList.add('active-toggle');
        this.setMode(btn.dataset.mode);
      });
    });

    // Master Palette Selector
    const masterSelect = document.getElementById('palStudioMasterSelect');
    if (masterSelect) {
      this._populateMasterSelect(masterSelect);
      masterSelect.addEventListener('change', (e) => {
        this.activeMasterId = e.target.value;
        this.render();
      });
    }

    // Library Palette Selector
    const libSelect = document.getElementById('palStudioLibrarySelect');
    if (libSelect) {
      libSelect.addEventListener('change', (e) => {
        this.activeLibraryId = e.target.value;
        this.render();
      });
    }

    // Custom Mode Buttons
    const btnAddFg = document.getElementById('btnPalCustomAddFg');
    if (btnAddFg) {
      btnAddFg.addEventListener('click', () => {
        const fg = this.app ? this.app.fgColor : { r: 99, g: 102, b: 241, hex: '#6366F1' };
        this.addCustomColor(fg, `Color Activo (${fg.hex})`);
      });
    }

    const btnAddBg = document.getElementById('btnPalCustomAddBg');
    if (btnAddBg) {
      btnAddBg.addEventListener('click', () => {
        const bg = this.app ? this.app.bgColor : { r: 244, g: 63, b: 94, hex: '#F43F5E' };
        this.addCustomColor(bg, `Fondo BG (${bg.hex})`);
      });
    }

    const picker = document.getElementById('palCustomColorPicker');
    const hexInput = document.getElementById('palCustomHexInput');
    const btnAddHex = document.getElementById('btnPalCustomAddHex');

    if (picker && hexInput) {
      picker.addEventListener('input', (e) => {
        hexInput.value = e.target.value.toUpperCase();
      });
      hexInput.addEventListener('input', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
        }
      });
    }

    if (btnAddHex && hexInput) {
      btnAddHex.addEventListener('click', () => {
        let hex = hexInput.value.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          const rgb = ColorMath.hexToRgb(hex);
          this.addCustomColor({ ...rgb, hex }, `Color Personalizado`);
        } else if (this.app) {
          this.app.showToast('Introduce un código HEX válido (#RRGGBB)', 'warning');
        }
      });
    }

    const harmonicPreset = document.getElementById('palCustomHarmonicPreset');
    if (harmonicPreset) {
      harmonicPreset.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type) {
          this.generateHarmonicPreset(type);
          harmonicPreset.selectedIndex = 0;
        }
      });
    }

    const btnClear = document.getElementById('btnPalCustomClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.clearCustomPalette();
      });
    }

    // Suite Integration Action Buttons
    const btnSaveLib = document.getElementById('btnPalStudioSaveLibrary');
    if (btnSaveLib) {
      btnSaveLib.addEventListener('click', () => this.saveToLibrary());
    }

    const btnSendWet = document.getElementById('btnPalStudioSendWetMixer');
    if (btnSendWet) {
      btnSendWet.addEventListener('click', () => this.sendToWetMixer());
    }

    const btnApplyMask = document.getElementById('btnPalStudioApplyGamutMask');
    if (btnApplyMask) {
      btnApplyMask.addEventListener('click', () => this.applyAsGamutMask());
    }

    const btnCopy = document.getElementById('btnPalStudioCopySheet');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copySheet());
    }
  },

  _populateMasterSelect(select) {
    select.innerHTML = '';
    const groups = {
      masters: { label: '🏛️ Grandes Maestros Históricos', items: [] },
      studio: { label: '🎨 Paletas de Taller & Estudio', items: [] },
      concept: { label: '⚡ Gamut Design & Concept Art', items: [] }
    };

    this.MASTER_PALETTES.forEach(pal => {
      const cat = pal.category || 'masters';
      if (groups[cat]) groups[cat].items.push(pal);
    });

    Object.values(groups).forEach(grp => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = grp.label;
      grp.items.forEach(pal => {
        const opt = document.createElement('option');
        opt.value = pal.id;
        opt.textContent = pal.name;
        if (pal.id === this.activeMasterId) opt.selected = true;
        optGroup.appendChild(opt);
      });
      select.appendChild(optGroup);
    });
  },

  setMode(mode) {
    this.activeMode = mode;
    const masterCtrls = document.getElementById('palStudioMasterControls');
    const libCtrls = document.getElementById('palStudioLibraryControls');
    const customCtrls = document.getElementById('palStudioCustomControls');

    if (masterCtrls) masterCtrls.style.display = mode === 'master' ? 'flex' : 'none';
    if (libCtrls) libCtrls.style.display = mode === 'library' ? 'flex' : 'none';
    if (customCtrls) customCtrls.style.display = mode === 'custom' ? 'flex' : 'none';

    if (mode === 'library') {
      this._refreshLibrarySelect();
    }

    this.render();
  },

  _refreshLibrarySelect() {
    const libSelect = document.getElementById('palStudioLibrarySelect');
    const countTag = document.getElementById('palStudioLibraryCountTag');
    if (!libSelect) return;
    libSelect.innerHTML = '';

    const palettes = this.app?.swatchManager?.palettes || [];
    if (palettes.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(No hay paletas en Bibliotecas. Crea una en la suite)';
      libSelect.appendChild(opt);
      if (countTag) countTag.textContent = '0 paletas';
      return;
    }

    palettes.forEach((pal, idx) => {
      const opt = document.createElement('option');
      opt.value = pal.id;
      opt.textContent = `${pal.name} (${pal.colors?.length || 0} tonos)`;
      if (this.activeLibraryId === pal.id || (!this.activeLibraryId && idx === 0)) {
        opt.selected = true;
        this.activeLibraryId = pal.id;
      }
      libSelect.appendChild(opt);
    });

    if (countTag) {
      const cur = palettes.find(p => p.id === this.activeLibraryId) || palettes[0];
      countTag.textContent = `${cur?.colors?.length || 0} colores en esta paleta`;
    }
  },

  addCustomColor(color, defaultName = 'Color') {
    if (this.customColors.length >= 12) {
      if (this.app) this.app.showToast('Límite de 12 colores por paleta de estudio alcanzado', 'warning');
      return;
    }
    const hex = color.hex || ColorMath.rgbToHex(color.r, color.g, color.b);
    const rgb = color.rgb || { r: color.r, g: color.g, b: color.b };
    this.customColors.push({
      name: defaultName,
      ci: 'Custom',
      hex,
      rgb
    });
    if (this.app) this.app.showToast(`Color añadido a la paleta (${hex})`, 'success');
    this.render();
  },

  removeCustomColor(index) {
    if (this.customColors.length <= 2) {
      if (this.app) this.app.showToast('La paleta debe tener al menos 2 colores para calcular mezclas', 'warning');
      return;
    }
    this.customColors.splice(index, 1);
    this.render();
  },

  clearCustomPalette() {
    this.customColors = [];
    // Reset to a basic high-chroma primary duo
    this.customColors = [
      { name: 'Blanco Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'Azul Ultramar', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } },
      { name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } }
    ];
    if (this.app) this.app.showToast('Paleta personalizada restablecida a tríada base', 'info');
    this.render();
  },

  generateHarmonicPreset(type) {
    const baseRgb = this.app ? this.app.fgColor : { r: 227, g: 38, b: 54 };
    const hsv = ColorMath.rgbToHsv(baseRgb.r, baseRgb.g, baseRgb.b);
    const newColors = [];

    // Always include a mixing white
    newColors.push({ name: 'Blanco de Mezcla', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } });
    newColors.push({ name: 'Color Base', ci: 'Primario', hex: ColorMath.rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b), rgb: { ...baseRgb } });

    if (type === 'triad') {
      const h2 = (hsv.h + 120) % 360;
      const h3 = (hsv.h + 240) % 360;
      const rgb2 = ColorMath.hsvToRgb(h2, hsv.s, hsv.v);
      const rgb3 = ColorMath.hsvToRgb(h3, hsv.s, hsv.v);
      newColors.push({ name: 'Tríada 2', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb2.r, rgb2.g, rgb2.b), rgb: rgb2 });
      newColors.push({ name: 'Tríada 3', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb3.r, rgb3.g, rgb3.b), rgb: rgb3 });
    } else if (type === 'split') {
      const h2 = (hsv.h + 150) % 360;
      const h3 = (hsv.h + 210) % 360;
      const rgb2 = ColorMath.hsvToRgb(h2, hsv.s, hsv.v);
      const rgb3 = ColorMath.hsvToRgb(h3, hsv.s, hsv.v);
      newColors.push({ name: 'Split 1', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb2.r, rgb2.g, rgb2.b), rgb: rgb2 });
      newColors.push({ name: 'Split 2', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb3.r, rgb3.g, rgb3.b), rgb: rgb3 });
    } else if (type === 'tetrad') {
      const h2 = (hsv.h + 90) % 360;
      const h3 = (hsv.h + 180) % 360;
      const h4 = (hsv.h + 270) % 360;
      const rgb2 = ColorMath.hsvToRgb(h2, hsv.s, hsv.v);
      const rgb3 = ColorMath.hsvToRgb(h3, hsv.s, hsv.v);
      const rgb4 = ColorMath.hsvToRgb(h4, hsv.s, hsv.v);
      newColors.push({ name: 'Tétrada 2', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb2.r, rgb2.g, rgb2.b), rgb: rgb2 });
      newColors.push({ name: 'Tétrada 3', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb3.r, rgb3.g, rgb3.b), rgb: rgb3 });
      newColors.push({ name: 'Tétrada 4', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb4.r, rgb4.g, rgb4.b), rgb: rgb4 });
    } else if (type === 'analogous') {
      const h2 = (hsv.h + 30) % 360;
      const h3 = (hsv.h - 30 + 360) % 360;
      const rgb2 = ColorMath.hsvToRgb(h2, hsv.s, hsv.v);
      const rgb3 = ColorMath.hsvToRgb(h3, hsv.s, hsv.v);
      newColors.push({ name: 'Análogo +30°', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb2.r, rgb2.g, rgb2.b), rgb: rgb2 });
      newColors.push({ name: 'Análogo -30°', ci: 'Armonía', hex: ColorMath.rgbToHex(rgb3.r, rgb3.g, rgb3.b), rgb: rgb3 });
    } else if (type === 'earth_warm') {
      newColors.push({ name: 'Ocre Tonal', ci: 'Tierra', hex: '#C68E36', rgb: { r: 198, g: 142, b: 54 } });
      newColors.push({ name: 'Sombra Tostada', ci: 'PBr7', hex: '#4A3125', rgb: { r: 74, g: 49, b: 37 } });
    }

    this.customColors = newColors;
    if (this.app) this.app.showToast(`Armonía ${type} generada en paleta de usuario`, 'success');
    this.render();
  },

  getActiveData() {
    if (this.activeMode === 'master') {
      const found = this.MASTER_PALETTES.find(p => p.id === this.activeMasterId) || this.MASTER_PALETTES[0];
      return {
        name: found.name,
        era: found.era,
        desc: found.desc,
        colors: found.tubes.map(t => ({
          name: t.name,
          ci: t.ci,
          hex: t.hex,
          rgb: t.rgb
        }))
      };
    }

    if (this.activeMode === 'library') {
      const palettes = this.app?.swatchManager?.palettes || [];
      const found = palettes.find(p => p.id === this.activeLibraryId) || palettes[0];
      if (!found) {
        return {
          name: 'Biblioteca Vacía',
          era: 'Colección de Usuario',
          desc: 'No hay colores registrados en esta biblioteca de muestras.',
          colors: []
        };
      }
      return {
        name: found.name,
        era: found.category ? `Categoría: ${found.category}` : 'Biblioteca Guardada',
        desc: `Paleta de ${found.colors?.length || 0} muestras guardada por el usuario.`,
        colors: (found.colors || []).map((hex, idx) => {
          const rgb = ColorMath.hexToRgb(hex);
          return {
            name: `Tono ${idx + 1}`,
            ci: `M${idx + 1}`,
            hex: hex.toUpperCase(),
            rgb
          };
        })
      };
    }

    // Custom Mode
    return {
      name: 'Paleta Personalizada de Estudio (En Vivo)',
      era: 'Configuración Dinámica de Caballete',
      desc: 'Paleta viva construida interactivamente. Añade tonos con el color activo o el selector para explorar sus matrices de mezcla física y comportamiento de gama.',
      colors: this.customColors
    };
  },

  // Generates complete 2D pairwise physical mixing matrix for ANY color list
  generateMixMatrix(colors) {
    if (!colors || colors.length < 2) return [];
    const matrix = [];

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const colorA = colors[i];
        const colorB = colors[j];
        const steps = [];

        // 5 Physical subtractive pigment mixing steps
        for (let s = 0; s <= 4; s++) {
          const w = s / 4;
          const blendedRgb = ColorMath.mixPigments(colorA.rgb, colorB.rgb, w);
          steps.push({
            ratioA: Math.round((1 - w) * 100),
            ratioB: Math.round(w * 100),
            rgb: blendedRgb,
            hex: ColorMath.rgbToHex(blendedRgb.r, blendedRgb.g, blendedRgb.b)
          });
        }

        matrix.push({
          colorA,
          colorB,
          steps
        });
      }
    }

    return matrix;
  },

  // Generates high-key tints (with white) and low-key shades (with dark umber)
  generateTonalRamps(colors) {
    if (!colors || colors.length === 0) return [];
    const whiteRgb = { r: 255, g: 255, b: 255 };
    const darkRgb = { r: 25, g: 20, b: 18 }; // Deep raw umber / physical black

    return colors.map(col => {
      const tints = [];
      const shades = [];

      // 4 Tint steps (+20%, +40%, +60%, +80% white)
      for (let s = 1; s <= 4; s++) {
        const w = s / 5;
        const rgb = ColorMath.mixPigments(col.rgb, whiteRgb, w);
        tints.push({
          label: `+${Math.round(w * 100)}% Bco`,
          rgb,
          hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b)
        });
      }

      // 4 Shade steps (-20%, -40%, -60%, -80% dark)
      for (let s = 1; s <= 4; s++) {
        const w = s / 5;
        const rgb = ColorMath.mixPigments(col.rgb, darkRgb, w);
        shades.push({
          label: `-${Math.round(w * 100)}% Sombra`,
          rgb,
          hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b)
        });
      }

      return {
        color: col,
        shades: shades.reverse(), // darkest to near-color
        tints // near-color to whitest
      };
    });
  },

  // Computes Gamut & Chromatic Intelligence Diagnostics
  calculateGamutDiagnostics(colors) {
    if (!colors || colors.length === 0) {
      return {
        tonal: { minLum: 0, maxLum: 0, meanLum: 0, contrastRatio: '1:1', highlightColor: '#FFF', shadowColor: '#000' },
        chroma: { maxSat: 0, meanSat: 0, classification: 'Sin Datos' },
        thermal: { warmPct: 0, coolPct: 0, neutralPct: 0, dominant: 'Neutro' },
        span: { angleDegrees: 0, classification: 'Vacía' },
        advice: 'Añade colores para calcular el diagnóstico cromático.'
      };
    }

    let minLum = 1.0, maxLum = 0.0, sumLum = 0;
    let minColor = colors[0], maxColor = colors[0];
    let maxSat = 0, sumSat = 0;
    let warmCount = 0, coolCount = 0, neutralCount = 0;
    const hues = [];

    colors.forEach(col => {
      const lum = ColorMath.getLuminance(col.rgb.r, col.rgb.g, col.rgb.b);
      sumLum += lum;
      if (lum < minLum) { minLum = lum; minColor = col; }
      if (lum > maxLum) { maxLum = lum; maxColor = col; }

      const hsv = ColorMath.rgbToHsv(col.rgb.r, col.rgb.g, col.rgb.b);
      sumSat += hsv.s;
      if (hsv.s > maxSat) maxSat = hsv.s;

      if (hsv.s < 0.16) {
        neutralCount++;
      } else if ((hsv.h >= 0 && hsv.h <= 75) || (hsv.h >= 300 && hsv.h <= 360)) {
        warmCount++;
      } else if (hsv.h >= 140 && hsv.h <= 270) {
        coolCount++;
      } else {
        warmCount++; // intermediate yellow-greens tend to act warm
      }

      if (hsv.s >= 0.12) {
        hues.push(hsv.h);
      }
    });

    const total = colors.length;
    const meanLum = sumLum / total;
    const meanSat = sumSat / total;
    const contrastRatio = ColorMath.getContrastRatio(maxColor.rgb, minColor.rgb);

    const warmPct = Math.round((warmCount / total) * 100);
    const coolPct = Math.round((coolCount / total) * 100);
    const neutralPct = Math.round((neutralCount / total) * 100);

    let thermalDom = 'Equilibrada';
    if (warmPct >= 60) thermalDom = 'Dominio Cálido 🔥';
    else if (coolPct >= 60) thermalDom = 'Dominio Frío ❄️';
    else if (neutralPct >= 50) thermalDom = 'Clave de Tierras / Neutros ⚖️';

    let chromaClass = 'Media Saturation';
    if (meanSat >= 0.65) chromaClass = 'Alta Pureza (High-Chroma)';
    else if (meanSat <= 0.35) chromaClass = 'Muted / Tierras Naturales';

    // Calculate angular span of hues
    let angleDegrees = 0;
    if (hues.length >= 2) {
      hues.sort((a, b) => a - b);
      let maxGap = 0;
      for (let i = 0; i < hues.length; i++) {
        const next = (i === hues.length - 1) ? hues[0] + 360 : hues[i + 1];
        const gap = next - hues[i];
        if (gap > maxGap) maxGap = gap;
      }
      angleDegrees = Math.min(360, Math.round(360 - maxGap));
    }

    let spanClass = 'Armonía Restringida';
    if (angleDegrees >= 270) spanClass = 'Gama Amplia / Integral (360°)';
    else if (angleDegrees >= 150) spanClass = 'Gama Media / Complementaria';
    else if (angleDegrees <= 90) spanClass = 'Gama Análoga / Clave Unificada';

    // Actionable studio advice
    const advices = [];
    if (contrastRatio >= 10) {
      advices.push('🎯 <strong>Excelente Rango de Contraste:</strong> La paleta abarca desde luces luminosas hasta sombras profundas sin necesidad de recurrir a negros artificiales.');
    } else {
      advices.push('⚠️ <strong>Rango Tonal Estrecho:</strong> La paleta se concentra en tonos medios. Para dotar a la obra de impacto espacial, añade un blanco de plomo/titanio puro o un pigmento de sombra profunda.');
    }

    if (warmPct >= 65) {
      advices.push('☀️ <strong>Clave Térmica Solar/Cálida:</strong> Ideal para retratos, interiores con luz artificial y amaneceres. Asegúrate de incluir un semitono neutro o frío para evitar sensación febril.');
    } else if (coolPct >= 65) {
      advices.push('🌊 <strong>Clave Atmosférica Fría:</strong> Óptima para marinas, brumas invernales y paisajes nocturnos. Los puntos de luz cálidos actuarán como acentos de altísima atracción visual.');
    }

    if (meanSat < 0.4) {
      advices.push('🏛️ <strong>Armonía Orgánica Académica:</strong> Los pigmentos desaturados y tierras garantizan que cualquier mezcla entre ellos mantenga coherencia sin producir ruido discordante.');
    } else if (meanSat > 0.7) {
      advices.push('⚡ <strong>Alta Energía Cromática:</strong> Mezclar estos tonos directamente puede producir secundarios vibrantes o choque violento; modula con veladuras o tonos de transición.');
    }

    return {
      tonal: {
        minLum: Math.round(minLum * 100),
        maxLum: Math.round(maxLum * 100),
        meanLum: Math.round(meanLum * 100),
        contrastRatio: `${contrastRatio}:1`,
        highlightColor: maxColor.hex,
        shadowColor: minColor.hex
      },
      chroma: {
        maxSat: Math.round(maxSat * 100),
        meanSat: Math.round(meanSat * 100),
        classification: chromaClass
      },
      thermal: {
        warmPct,
        coolPct,
        neutralPct,
        dominant: thermalDom
      },
      span: {
        angleDegrees,
        classification: spanClass
      },
      advice: advices.join(' ')
    };
  },

  // Main Render Function
  render() {
    const data = this.getActiveData();

    // 1. Update Header Information
    const titleEl = document.getElementById('palStudioTitle');
    const eraEl = document.getElementById('palStudioEra');
    const descEl = document.getElementById('palStudioDesc');
    const countEl = document.getElementById('palStudioChipsCount');

    if (titleEl) titleEl.textContent = data.name;
    if (eraEl) eraEl.textContent = data.era;
    if (descEl) descEl.textContent = data.desc;
    if (countEl) countEl.textContent = `${data.colors.length} Colores`;

    // 2. Render Interactive Palette Color Chips
    const chipsContainer = document.getElementById('palStudioColorsContainer');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      if (data.colors.length === 0) {
        chipsContainer.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); padding:10px;">No hay colores en la paleta. Añade colores arriba.</div>';
      } else {
        data.colors.forEach((col, idx) => {
          const chip = document.createElement('div');
          chip.className = 'palette-studio-color-card';
          chip.draggable = true;
          chip.dataset.swatchHex = col.hex;

          const lum = ColorMath.getLuminance(col.rgb.r, col.rgb.g, col.rgb.b);
          const hsv = ColorMath.rgbToHsv(col.rgb.r, col.rgb.g, col.rgb.b);
          let tempIcon = '⚖️';
          if (hsv.s >= 0.15) {
            if ((hsv.h >= 0 && hsv.h <= 75) || (hsv.h >= 300 && hsv.h <= 360)) tempIcon = '🔥';
            else if (hsv.h >= 140 && hsv.h <= 270) tempIcon = '❄️';
          }

          chip.innerHTML = `
            <div class="pal-card-swatch" style="background-color: ${col.hex};"></div>
            <div class="pal-card-info">
              <div class="pal-card-name" title="${col.name}">${col.name}</div>
              <div class="pal-card-meta">
                <span class="pal-card-hex">${col.hex}</span>
                <span class="pal-card-ci">${col.ci || 'CI'}</span>
                <span class="pal-card-temp" title="Temperatura">${tempIcon} L:${Math.round(lum * 100)}%</span>
              </div>
            </div>
            ${this.activeMode === 'custom' ? `<button class="pal-card-del-btn" title="Eliminar color de la paleta" data-idx="${idx}">✕</button>` : ''}
          `;

          // Click chip body to set suite active color
          chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('pal-card-del-btn')) return;
            if (this.app) {
              this.app.setColorDirectly(col.rgb);
              this.app.showToast(`Color cargado: ${col.name} (${col.hex})`);
            }
          });

          // Delete button in custom mode
          const delBtn = chip.querySelector('.pal-card-del-btn');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.removeCustomColor(idx);
            });
          }

          chipsContainer.appendChild(chip);
        });
      }
    }

    // 3. Render 2D Pairwise Mixing Matrix
    const matrixGrid = document.getElementById('palStudioMatrixGrid');
    if (matrixGrid) {
      matrixGrid.innerHTML = '';
      const matrix = this.generateMixMatrix(data.colors);

      if (matrix.length === 0) {
        matrixGrid.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); padding:10px;">Se requieren al menos 2 colores para generar la matriz de mezclas.</div>';
      } else {
        matrix.forEach(pair => {
          const row = document.createElement('div');
          row.className = 'pal-matrix-row';

          const title = document.createElement('div');
          title.className = 'pal-matrix-title';
          title.title = `${pair.colorA.name} + ${pair.colorB.name}`;
          title.innerHTML = `<strong>${pair.colorA.ci || pair.colorA.name.slice(0, 10)}</strong> + <strong>${pair.colorB.ci || pair.colorB.name.slice(0, 10)}</strong>`;

          const ramp = document.createElement('div');
          ramp.className = 'pal-matrix-ramp';

          pair.steps.forEach(step => {
            const isAtmo = AtmosphereEngine.state.enabled;
            const dispRgb = isAtmo ? AtmosphereEngine.transformColor(step.rgb) : step.rgb;
            const dispHex = ColorMath.rgbToHex(dispRgb.r, dispRgb.g, dispRgb.b);

            const sw = document.createElement('div');
            sw.className = 'pal-matrix-swatch';
            sw.style.backgroundColor = dispHex;
            sw.title = `${pair.colorA.name} (${step.ratioA}%) + ${pair.colorB.name} (${step.ratioB}%)\n${dispHex} • Click para activar`;
            sw.draggable = true;
            sw.dataset.swatchHex = dispHex;

            sw.addEventListener('click', () => {
              if (this.app) {
                this.app.setColorDirectly(step.rgb);
                this.app.showToast(`Mezcla: ${step.ratioA}% ${pair.colorA.name} + ${step.ratioB}% ${pair.colorB.name} (${dispHex})`);
              }
            });

            ramp.appendChild(sw);
          });

          row.appendChild(title);
          row.appendChild(ramp);
          matrixGrid.appendChild(row);
        });
      }
    }

    // 4. Render Chromatic Intelligence Diagnostics
    const diag = this.calculateGamutDiagnostics(data.colors);
    
    const tonalCard = document.getElementById('palMetricTonal');
    if (tonalCard) {
      tonalCard.innerHTML = `
        <div class="metric-row"><span>Contraste Tonal:</span> <strong style="color:#FFFFFF; font-family:var(--font-mono);">${diag.tonal.contrastRatio}</strong></div>
        <div class="metric-row"><span>Valor Medio:</span> <span>${diag.tonal.meanLum}%</span></div>
        <div style="display:flex; gap:6px; align-items:center; margin-top:4px;">
          <div style="width:14px; height:14px; border-radius:3px; background:${diag.tonal.highlightColor}; border:1px solid rgba(255,255,255,0.3);" title="Luz: ${diag.tonal.highlightColor}"></div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Max: ${diag.tonal.maxLum}%</span>
          <span style="color:var(--text-muted); font-size:0.68rem;">➔</span>
          <div style="width:14px; height:14px; border-radius:3px; background:${diag.tonal.shadowColor}; border:1px solid rgba(255,255,255,0.3);" title="Sombra: ${diag.tonal.shadowColor}"></div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Min: ${diag.tonal.minLum}%</span>
        </div>
      `;
    }

    const chromaCard = document.getElementById('palMetricChroma');
    if (chromaCard) {
      chromaCard.innerHTML = `
        <div class="metric-row"><span>Croma Promedio:</span> <strong style="color:var(--accent-cyan); font-family:var(--font-mono);">${diag.chroma.meanSat}%</strong></div>
        <div class="metric-row"><span>Pico de Saturación:</span> <span>${diag.chroma.maxSat}%</span></div>
        <div class="metric-pill-tag">${diag.chroma.classification}</div>
      `;
    }

    const thermalCard = document.getElementById('palMetricThermal');
    if (thermalCard) {
      thermalCard.innerHTML = `
        <div class="metric-row"><span>Tendencia:</span> <strong style="color:#F59E0B;">${diag.thermal.dominant}</strong></div>
        <div class="pal-thermal-bar">
          <div style="width:${diag.thermal.warmPct}%; background:#EF4444;" title="Cálidos: ${diag.thermal.warmPct}%"></div>
          <div style="width:${diag.thermal.coolPct}%; background:#3B82F6;" title="Fríos: ${diag.thermal.coolPct}%"></div>
          <div style="width:${diag.thermal.neutralPct}%; background:#9CA3AF;" title="Neutros: ${diag.thermal.neutralPct}%"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-top:2px;">
          <span>🔥 ${diag.thermal.warmPct}%</span>
          <span>❄️ ${diag.thermal.coolPct}%</span>
          <span>⚖️ ${diag.thermal.neutralPct}%</span>
        </div>
      `;
    }

    const spanCard = document.getElementById('palMetricSpan');
    if (spanCard) {
      spanCard.innerHTML = `
        <div class="metric-row"><span>Apertura Angular:</span> <strong style="color:#A78BFA; font-family:var(--font-mono);">${diag.span.angleDegrees}°</strong></div>
        <div class="metric-pill-tag" style="background:rgba(167,139,250,0.15); color:#C4B5FD; border-color:rgba(167,139,250,0.3);">${diag.span.classification}</div>
      `;
    }

    const adviceText = document.getElementById('palStudioAdviceText');
    if (adviceText) {
      adviceText.innerHTML = diag.advice;
    }

    // 5. Render Tonal Ramps (Luces & Sombras)
    const rampsContainer = document.getElementById('palStudioTonalRampsContainer');
    if (rampsContainer) {
      rampsContainer.innerHTML = '';
      const ramps = this.generateTonalRamps(data.colors);
      ramps.forEach(r => {
        const row = document.createElement('div');
        row.className = 'pal-tonal-row';

        const label = document.createElement('div');
        label.className = 'pal-tonal-label';
        label.title = r.color.name;
        label.textContent = r.color.name;

        const strip = document.createElement('div');
        strip.className = 'pal-tonal-strip';

        // Dark shades
        r.shades.forEach(step => {
          const sw = document.createElement('div');
          sw.className = 'pal-tonal-swatch';
          sw.style.backgroundColor = step.hex;
          sw.title = `${step.label}: ${step.hex}`;
          sw.onclick = () => this.app?.setColorDirectly(step.rgb);
          strip.appendChild(sw);
        });

        // Center pure mass tone
        const centerSw = document.createElement('div');
        centerSw.className = 'pal-tonal-swatch center-tone';
        centerSw.style.backgroundColor = r.color.hex;
        centerSw.title = `Puro: ${r.color.hex}`;
        centerSw.onclick = () => this.app?.setColorDirectly(r.color.rgb);
        strip.appendChild(centerSw);

        // Light tints
        r.tints.forEach(step => {
          const sw = document.createElement('div');
          sw.className = 'pal-tonal-swatch';
          sw.style.backgroundColor = step.hex;
          sw.title = `${step.label}: ${step.hex}`;
          sw.onclick = () => this.app?.setColorDirectly(step.rgb);
          strip.appendChild(sw);
        });

        row.appendChild(label);
        row.appendChild(strip);
        rampsContainer.appendChild(row);
      });
    }

    // 6. Draw Gamut Hull Radar on Canvas
    const canvas = document.getElementById('palStudioGamutCanvas');
    if (canvas) {
      this.drawGamutRadar(canvas, data.colors);
    }
  },

  // Draws Gamut Radar Wheel & Polygon Hull
  drawGamutRadar(canvas, colors) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.44;

    ctx.clearRect(0, 0, w, h);

    // Draw Subtle Concentric Hue Wheel Rings
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach(ratio => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.stroke();

    // Center Neutral Dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    if (!colors || colors.length === 0) return;

    // Map each color to (x, y) coordinates based on Hue and Saturation
    const points = colors.map(col => {
      const hsv = ColorMath.rgbToHsv(col.rgb.r, col.rgb.g, col.rgb.b);
      // Hue angle in radians (Coolorus / standard orientation)
      const rad = (hsv.h * Math.PI) / 180;
      // Saturation determines radial distance (0 = center, 1 = radius)
      const rDist = Math.max(0.08, hsv.s) * radius;
      return {
        x: cx + rDist * Math.cos(rad),
        y: cy + rDist * Math.sin(rad),
        rad,
        color: col
      };
    });

    // Sort points by angle around center to draw closed convex polygon
    if (points.length >= 3) {
      const sorted = [...points].sort((a, b) => a.rad - b.rad);

      ctx.beginPath();
      sorted.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();

      // Translucent polygon fill
      ctx.fillStyle = 'rgba(99, 102, 241, 0.22)';
      ctx.fill();

      // Glowing border
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Colored Vertex Dots for each color in the palette
    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pt.color.hex;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    });
  },

  // Suite Integrations
  saveToLibrary() {
    const data = this.getActiveData();
    if (!data.colors || data.colors.length === 0) {
      if (this.app) this.app.showToast('No hay colores en la paleta para guardar', 'warning');
      return;
    }
    const hexList = data.colors.map(c => c.hex);
    const createFn = this.app?.swatchManager?.createPalette || this.app?.swatchManager?.addPalette;
    if (createFn) {
      createFn.call(this.app.swatchManager, `${data.name}`, hexList);
      this.app.renderSwatchesCollection?.();
      this.app.renderQuickPalette?.();
      this.app.showToast(`Paleta "${data.name}" guardada en tus Bibliotecas`, 'success');
      this._refreshLibrarySelect();
    }
  },

  sendToWetMixer() {
    const data = this.getActiveData();
    if (!data.colors || data.colors.length === 0) {
      if (this.app) this.app.showToast('No hay colores en la paleta para transferir', 'warning');
      return;
    }
    if (this.app) {
      this.app.switchTab('wetmixer');
      if (!this.app.wetMixer) this.app._initWetMixer();
      if (this.app.wetMixer) {
        const cx = this.app.wetMixer.width * 0.5;
        const cy = this.app.wetMixer.height * 0.5;
        const rad = Math.min(this.app.wetMixer.width, this.app.wetMixer.height) * 0.32;
        const n = data.colors.length;

        data.colors.forEach((col, idx) => {
          const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(angle) * rad;
          const py = cy + Math.sin(angle) * rad;
          this.app.wetMixer.depositDab(px, py, col.rgb, 42);
        });

        this.app.showToast(`${data.colors.length} colores de la paleta depositados en el lienzo de mezclas`, 'success');
      }
    }
  },

  applyAsGamutMask() {
    const data = this.getActiveData();
    if (!data.colors || data.colors.length < 3) {
      if (this.app) this.app.showToast('Se requieren al menos 3 colores para crear una máscara de gama', 'warning');
      return;
    }

    // Configure James Gurney Gamut Mask to match the palette's dominant angle and span
    const diag = this.calculateGamutDiagnostics(data.colors);
    GamutMaskEngine.state.enabled = true;
    GamutMaskEngine.state.shape = data.colors.length >= 4 ? 'diamond' : 'triangle';
    GamutMaskEngine.state.scale = Math.max(0.4, Math.min(0.85, (diag.span.angleDegrees / 360) * 1.1));

    if (this.app) {
      this.app.switchTab('studio');
      this.app.colorWheel?.render();
      this.app.showToast(`Máscara de gama activa en Coolorus: ${data.name}`, 'info');
    }
  },

  copySheet() {
    const data = this.getActiveData();
    const diag = this.calculateGamutDiagnostics(data.colors);

    let sheet = `🎭 FICHA TÉCNICA: ESTUDIO DE PALETA & MATRIZ DE MEZCLAS\n`;
    sheet += `══════════════════════════════════════════════════════════════\n`;
    sheet += `🎨 Paleta: ${data.name}\n`;
    sheet += `🏛️ Época / Estilo: ${data.era}\n`;
    sheet += `📝 Filosofía: ${data.desc}\n\n`;
    sheet += `📊 DIAGNÓSTICO CROMÁTICO:\n`;
    sheet += `  • Contraste Tonal: ${diag.tonal.contrastRatio} (Luz: ${diag.tonal.highlightColor} | Sombra: ${diag.tonal.shadowColor})\n`;
    sheet += `  • Croma: ${diag.chroma.classification} (Promedio: ${diag.chroma.meanSat}%)\n`;
    sheet += `  • Balance Térmico: ${diag.thermal.dominant} (${diag.thermal.warmPct}% Cálido, ${diag.thermal.coolPct}% Frío, ${diag.thermal.neutralPct}% Neutro)\n`;
    sheet += `  • Apertura en Rueda: ${diag.span.angleDegrees}° (${diag.span.classification})\n\n`;
    sheet += `📦 COLORES BASE DE LA PALETA:\n`;
    data.colors.forEach((c, idx) => {
      sheet += `  ${idx + 1}. ${c.name} [CI: ${c.ci || 'N/A'}] ➔ ${c.hex}\n`;
    });
    sheet += `\n💡 CONSEJO DIDÁCTICO:\n`;
    sheet += `  ${diag.advice.replace(/<[^>]*>/g, '')}\n`;
    sheet += `══════════════════════════════════════════════════════════════\n`;

    navigator.clipboard.writeText(sheet).then(() => {
      if (this.app) this.app.showToast('📋 Ficha técnica copiada al portapapeles', 'success');
    }).catch(() => {
      if (this.app) this.app.showToast('Error al copiar al portapapeles', 'error');
    });
  }
};
