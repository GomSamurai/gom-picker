/**
 * GOM Picker - Limited Palettes Studio (Master Painters)
 * Historic master limited palettes (Zorn, Primary Triad, Earth Renaissance, Split-Primary)
 * and interactive 2D mixing grid matrix generator.
 */

import { ColorMath } from './colorMath.js';

export const LimitedPalettes = {
  PALETTES: [
    {
      id: 'zorn',
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
      id: 'primary_triad',
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
      id: 'renaissance_earth',
      name: 'Paleta Tierra Renacentista (Ocre, Sombra, Almagre)',
      era: 'Renacimiento & Siglo de Oro',
      desc: 'Tierras ricas en óxidos de hierro para retratos y paisajes atmosféricos. Produce armonías orgánicas orgánicamente unificadas.',
      tubes: [
        { name: 'Blanco de Plomo/Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Ocre Amarillo Natural', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
        { name: 'Tierra Siena Tostada', ci: 'PBr7', hex: '#8A3324', rgb: { r: 138, g: 51, b: 36 } },
        { name: 'Tierra Sombra Tostada', ci: 'PBr7', hex: '#482D20', rgb: { r: 72, g: 45, b: 32 } },
        { name: 'Azul Ultramar Lapis', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } }
      ]
    },
    {
      id: 'split_primary',
      name: 'Split-Primary (6 Primarios Cálidos & Fríos)',
      era: 'Ilustración & Paisajismo Moderno',
      desc: 'Un primario cálido y uno frío para cada color primario. Evita la desaturación involuntaria o "barrizal" al mezclar primarios que incluyan un tercer matiz complementario.',
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
      id: 'apelles_tetrachrome',
      name: 'Tetracromatismo de Apeles (Grecia Clásica)',
      era: 'Antigüedad Clásica (Plinio el Viejo)',
      desc: 'Los 4 pigmentos primigenios con los que según Plinio pintaban Apeles y Zeuxis: Leukon (Blanco Melos), Ochra (Ocre ático), Sinopis (Rojo póntico) y Melas (Negro carbón de vid). La madre de la paleta Zorn.',
      tubes: [
        { name: 'Blanco de Melos (Leukon)', ci: 'PW18', hex: '#FDFBF7', rgb: { r: 253, g: 251, b: 247 } },
        { name: 'Ocre Ático Dorado (Ochra)', ci: 'PY43', hex: '#CF9B38', rgb: { r: 207, g: 155, b: 56 } },
        { name: 'Rojo Sinopia / Póntico (Milphos)', ci: 'PR102', hex: '#A93226', rgb: { r: 169, g: 50, b: 38 } },
        { name: 'Negro de Sarmientos (Melas)', ci: 'PBk8', hex: '#1B1C1D', rgb: { r: 27, g: 28, b: 29 } }
      ]
    },
    {
      id: 'caravaggio_tenebrism',
      name: 'Tenebrismo Caravaggesco (Chiaroscuro Extremo)',
      era: 'Barroco Temprano (Roma 1600)',
      desc: 'Fondo oscuro con imprimatura de bol de Armenia y tierras densas. La luz focal incide con potencia esculpiendo las figuras sobre un vacío misterioso.',
      tubes: [
        { name: 'Blanco de Plomo', ci: 'PW1', hex: '#F8F6F0', rgb: { r: 248, g: 246, b: 240 } },
        { name: 'Ocre Rojo de Pozzuoli', ci: 'PR102', hex: '#9E382A', rgb: { r: 158, g: 56, b: 42 } },
        { name: 'Tierra de Siena Natural', ci: 'PBr7', hex: '#BD762A', rgb: { r: 189, g: 118, b: 42 } },
        { name: 'Tierra de Colonia (Asfalto)', ci: 'N/A', hex: '#3B271A', rgb: { r: 59, g: 39, b: 26 } },
        { name: 'Negro Carbón de Hueso', ci: 'PBk9', hex: '#141414', rgb: { r: 20, g: 20, b: 20 } }
      ]
    },
    {
      id: 'velazquez_court',
      name: 'Paleta Regia de Velázquez (Siglo de Oro Español)',
      era: 'Barroco Madrileño (c. 1650)',
      desc: 'Maestría atmosférica y pincelada fluida con pigmentos sobrios. El esmalte azul (vidrio potásico con cobalto) y las tierras de Sevilla creaban grises plateados inigualables.',
      tubes: [
        { name: 'Blanco de Albayalde', ci: 'PW1', hex: '#FAF7EE', rgb: { r: 250, g: 247, b: 238 } },
        { name: 'Ocre de Sevilla', ci: 'PY43', hex: '#B88630', rgb: { r: 184, g: 134, b: 48 } },
        { name: 'Bermellón de Cinabrio', ci: 'PR106', hex: '#C23B22', rgb: { r: 194, g: 59, b: 34 } },
        { name: 'Esmalte Azul (Smalt)', ci: 'PB32', hex: '#3C5A85', rgb: { r: 60, g: 90, b: 133 } },
        { name: 'Tierra de Sombras Natural', ci: 'PBr7', hex: '#4A3B32', rgb: { r: 74, g: 59, b: 50 } },
        { name: 'Negro de Carbón Vegetal', ci: 'PBk8', hex: '#1E1E1E', rgb: { r: 30, g: 30, b: 30 } }
      ]
    },
    {
      id: 'rembrandt_chiaroscuro',
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
      id: 'monet_impressionist',
      name: 'Paleta Impresionista de Claude Monet (Sin Negro)',
      era: 'Impresionismo Francés (Giverny 1890)',
      desc: 'Los impresionistas expulsaron el negro de la paleta. Las sombras nunca son oscuras sino violetas, azules y complementarias creadas por la refracción lumínica en la retina.',
      tubes: [
        { name: 'Blanco de Plomo/Cinc', ci: 'PW4', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cadmio Claro', ci: 'PY35', hex: '#FBE844', rgb: { r: 251, g: 232, b: 68 } },
        { name: 'Verde Esmeralda (Viridian)', ci: 'PG18', hex: '#007F5C', rgb: { r: 0, g: 127, b: 92 } },
        { name: 'Azul Cobalto', ci: 'PB28', hex: '#0047AB', rgb: { r: 0, g: 71, b: 171 } },
        { name: 'Violeta de Cobalto', ci: 'PV14', hex: '#72397B', rgb: { r: 114, g: 57, b: 123 } },
        { name: 'Laca de Alizarina', ci: 'PR83', hex: '#B82846', rgb: { r: 184, g: 40, b: 70 } }
      ]
    },
    {
      id: 'sorolla_luminism',
      name: 'Luminismo Mediterráneo de Joaquín Sorolla',
      era: 'Post-Impresionismo / Luminismo Valenciano (c. 1910)',
      desc: 'El pintor de la luz. Capta el sol abrasador con toques de blancos con reflejos violáceos, turquesas y sombras coloreadas por el rebote solar en la arena.',
      tubes: [
        { name: 'Blanco de Cinc Extra', ci: 'PW4', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cromo / Nápoles', ci: 'PY34', hex: '#F5D76E', rgb: { r: 245, g: 215, b: 110 } },
        { name: 'Azul Cerúleo Genuino', ci: 'PB35', hex: '#2A82BE', rgb: { r: 42, g: 130, b: 190 } },
        { name: 'Violeta Cobalto Profundo', ci: 'PV14', hex: '#683679', rgb: { r: 104, g: 54, b: 121 } },
        { name: 'Rosa Garance / Alizarina', ci: 'PR83', hex: '#D7385E', rgb: { r: 215, g: 56, b: 94 } },
        { name: 'Ocre Dorado Valenciano', ci: 'PY43', hex: '#C28938', rgb: { r: 194, g: 137, b: 56 } }
      ]
    },
    {
      id: 'farges_academic_portrait',
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
      name: 'Grisalla y Verdaccio Florentino (Bottega Quintoceño)',
      era: 'Renacimiento Temprano (Giotto & Leonardo)',
      desc: 'El Verdaccio es la mezcla de tierra verde, ocre y blanco usada en el Renacimiento italiano para pintar la subcapa de las figuras. Los matices rosáceos translúcidos cobran vida vibrante sobre esta base neutra verdosa.',
      tubes: [
        { name: 'Blanco de San Juan (Caliza)', ci: 'PW18', hex: '#FAF9F5', rgb: { r: 250, g: 249, b: 245 } },
        { name: 'Tierra Verde de Verona', ci: 'PG23', hex: '#586A55', rgb: { r: 88, g: 106, b: 85 } },
        { name: 'Ocre Amarillo Tosco', ci: 'PY43', hex: '#C2963B', rgb: { r: 194, g: 150, b: 59 } },
        { name: 'Tierra Sombra Cipriota', ci: 'PBr7', hex: '#443A32', rgb: { r: 68, g: 58, b: 50 } },
        { name: 'Negro Carbón de Vid', ci: 'PBk8', hex: '#191817', rgb: { r: 25, g: 24, b: 23 } }
      ]
    },
    {
      id: 'turner_atmospheric',
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
      name: 'Grabado Ukiyo-e Tradicional (Katsushika Hokusai)',
      era: 'Período Edo Japonés (c. 1830)',
      desc: 'La paleta de las 36 vistas del Monte Fuji. El empleo revolucionario del Azul de Berlín (Prusia importado de Holanda) combinado con índigo y bermejo vegetal.',
      tubes: [
        { name: 'Blanco Gofun (Concha Marina)', ci: 'PW18', hex: '#F5F5ED', rgb: { r: 245, g: 245, b: 237 } },
        { name: 'Azul de Berlín / Prusia (Aizuri-e)', ci: 'PB27', hex: '#0B3A64', rgb: { r: 11, g: 58, b: 100 } },
        { name: 'Rojo Bermellón Mineral (Shu)', ci: 'PR106', hex: '#D23724', rgb: { r: 210, g: 55, b: 36 } },
        { name: 'Amarillo Cúrcuma / Ocre (Ki)', ci: 'PY43', hex: '#CBA048', rgb: { r: 203, g: 160, b: 72 } },
        { name: 'Tinta Sumi Carbón de Pino', ci: 'PBk6', hex: '#18191A', rgb: { r: 24, g: 25, b: 26 } }
      ]
    },
    {
      id: 'gurney_triad_mask',
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
      id: 'matisse_fauve',
      name: 'Fauvismo Expresivo Puro (Henri Matisse)',
      era: 'Vanguardias / Fauvismo (Collioure 1905)',
      desc: 'Color directo del tubo. Liberación total del color respecto al objeto representado: "Cuando pongo verde no es hierba, cuando pongo azul no es cielo". Máximo choque cromático.',
      tubes: [
        { name: 'Blanco Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Rojo Cadmio Puro', ci: 'PR108', hex: '#E61E28', rgb: { r: 230, g: 30, b: 40 } },
        { name: 'Amarillo Limón Puro', ci: 'PY3', hex: '#FFF200', rgb: { r: 255, g: 242, b: 0 } },
        { name: 'Azul Cobalto Eléctrico', ci: 'PB28', hex: '#0047AB', rgb: { r: 0, g: 71, b: 171 } },
        { name: 'Verde Viridián Intenso', ci: 'PG18', hex: '#008C5A', rgb: { r: 0, g: 140, b: 90 } },
        { name: 'Violeta Manganeso', ci: 'PV16', hex: '#8B2252', rgb: { r: 139, g: 34, b: 82 } }
      ]
    },
    {
      id: 'cyberpunk_neo_limited',
      name: 'Sci-Fi Neón Synth (Digital Concept Art)',
      era: 'Arte Digital Contemporáneo',
      desc: 'Tríada neón saturada sobre base de grafito profundo. El choque violento entre cian eléctrico y magenta sobre fondos oscuros simula iluminación de ciudades cyberpunk bajo lluvia ácida.',
      tubes: [
        { name: 'Blanco Lumínico', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Cian Neón', ci: 'PB15:3', hex: '#00E5FF', rgb: { r: 0, g: 229, b: 255 } },
        { name: 'Magenta Eléctrico', ci: 'PR122', hex: '#FF007F', rgb: { r: 255, g: 0, b: 127 } },
        { name: 'Ámbar Radiactivo', ci: 'PY110', hex: '#FFB300', rgb: { r: 255, g: 179, b: 0 } },
        { name: 'Negro Carbón Grafito', ci: 'PBk7', hex: '#0D0F14', rgb: { r: 13, g: 15, b: 20 } }
      ]
    }
  ],

  // Generates complete 2D mixing grid matrix between tubes of the limited palette
  generateMixMatrix(paletteId = 'zorn') {
    const pal = this.PALETTES.find(p => p.id === paletteId) || this.PALETTES[0];
    const tubes = pal.tubes;
    const matrix = [];

    for (let i = 0; i < tubes.length; i++) {
      for (let j = i + 1; j < tubes.length; j++) {
        const tubeA = tubes[i];
        const tubeB = tubes[j];
        const steps = [];

        // Mix 5 physical pigment steps between tubeA and tubeB
        for (let s = 0; s <= 4; s++) {
          const w = s / 4;
          const blendedRgb = ColorMath.mixPigments(tubeA.rgb, tubeB.rgb, w);
          steps.push({
            ratioA: Math.round((1 - w) * 100),
            ratioB: Math.round(w * 100),
            rgb: blendedRgb,
            hex: ColorMath.rgbToHex(blendedRgb.r, blendedRgb.g, blendedRgb.b)
          });
        }

        matrix.push({
          tubeA,
          tubeB,
          steps
        });
      }
    }

    return {
      palette: pal,
      matrix
    };
  }
};
