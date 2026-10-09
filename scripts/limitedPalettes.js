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
      name: 'Paleta Zorn (Anders Zorn)',
      era: 'Siglo XIX / Realismo Sueco',
      desc: 'La paleta limitada más célebre de la historia: 4 tubos (Blanco, Ocre, Rojo Cadmio y Negro Marfil). El Negro Marfil actúa como azul frío al mezclarse con blanco, creando verdes oliva naturales con el ocre y violetas apacibles con el rojo.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
        { name: 'Rojo Cadmio', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
        { name: 'Negro Marfil (Azul frío)', ci: 'PBk9', hex: '#1C1B1A', rgb: { r: 28, g: 27, b: 26 } }
      ]
    },
    {
      id: 'primary_triad',
      name: 'Tríada Primaria Clásica',
      era: 'Color Tradicional de Estudio',
      desc: 'Tríada sustractiva pura de alta pureza cromática. Permite recorrer el círculo cromático completo manteniendo saturación brillante en secundarios.',
      tubes: [
        { name: 'Blanco de Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Amarillo Cadmio', ci: 'PY35', hex: '#FFD300', rgb: { r: 255, g: 211, b: 0 } },
        { name: 'Rojo Cadmio', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
        { name: 'Azul Ultramar', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } }
      ]
    },
    {
      id: 'renaissance_earth',
      name: 'Paleta Tierra Renacentista',
      era: 'Renacimiento & Siglo de Oro',
      desc: 'Tierras ricas en óxidos de hierro para retratos y paisajes atmosféricos. Produce armonías orgánicas imposibles de desentonar.',
      tubes: [
        { name: 'Blanco de Plomo/Titanio', ci: 'PW6', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
        { name: 'Ocre Amarillo', ci: 'PY43', hex: '#C89332', rgb: { r: 200, g: 147, b: 50 } },
        { name: 'Tierra Siena Tostada', ci: 'PBr7', hex: '#8A3324', rgb: { r: 138, g: 51, b: 36 } },
        { name: 'Tierra Sombra Tostada', ci: 'PBr7', hex: '#482D20', rgb: { r: 72, g: 45, b: 32 } },
        { name: 'Azul Ultramar Natural', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } }
      ]
    },
    {
      id: 'split_primary',
      name: 'Split-Primary (6 Primarios)',
      era: 'Ilustración & Paisajismo Moderno',
      desc: 'Un primario cálido y uno frío para cada color básico (Amarillo Cálido/Frío, Rojo Cálido/Frío, Azul Cálido/Frío). Elimina la desaturación involuntaria al mezclar tonos afines.',
      tubes: [
        { name: 'Amarillo Limón (Frío)', ci: 'PY3', hex: '#FFF44F', rgb: { r: 255, g: 244, b: 79 } },
        { name: 'Amarillo Cadmio (Cálido)', ci: 'PY35', hex: '#FFAE42', rgb: { r: 255, g: 174, b: 66 } },
        { name: 'Rojo Cadmio (Cálido)', ci: 'PR108', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 } },
        { name: 'Carmesí Alizarina (Frío)', ci: 'PR83', hex: '#A31934', rgb: { r: 163, g: 25, b: 52 } },
        { name: 'Azul Ultramar (Cálido)', ci: 'PB29', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 } },
        { name: 'Azul Ftalo (Frío)', ci: 'PB15:3', hex: '#000F89', rgb: { r: 0, g: 15, b: 137 } }
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
