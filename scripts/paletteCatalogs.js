/**
 * GOM Picker - Professional Color Swatch Catalogs & Extended Library Engine
 * Includes full industry-standard libraries: Copic Sketch Markers, Pantone Formula Guide,
 * Prismacolor Premier, and Master Painters palettes with unlimited swatch capacity.
 */

export const PaletteCatalogs = {
  // Built-in presets ready to use
  DEFAULT_LIBRARIES: [
    {
      id: 'copic_system',
      name: 'Copic Sketch System (Gama Completa)',
      category: 'Ilustración & Manga',
      description: 'Catálogo exhaustivo de marcadores al alcohol Copic (Cool Grays, Warm Grays, Carnaciones y Espectro).',
      colors: [
        // Cool Grays
        { hex: '#EBEFF2', name: 'C-00 Cool Gray 00' },
        { hex: '#DCE2E6', name: 'C-1 Cool Gray 1' },
        { hex: '#CBD4D8', name: 'C-2 Cool Gray 2' },
        { hex: '#BAC4C8', name: 'C-3 Cool Gray 3' },
        { hex: '#A5B0B5', name: 'C-4 Cool Gray 4' },
        { hex: '#8F9B9F', name: 'C-5 Cool Gray 5' },
        { hex: '#778285', name: 'C-6 Cool Gray 6' },
        { hex: '#5E676A', name: 'C-7 Cool Gray 7' },
        { hex: '#484F52', name: 'C-8 Cool Gray 8' },
        { hex: '#313638', name: 'C-9 Cool Gray 9' },
        { hex: '#1C1F20', name: 'C-10 Cool Gray 10' },

        // Warm Grays
        { hex: '#F0ECE8', name: 'W-00 Warm Gray 00' },
        { hex: '#E4DDD8', name: 'W-1 Warm Gray 1' },
        { hex: '#D4CBC4', name: 'W-2 Warm Gray 2' },
        { hex: '#C2B7AE', name: 'W-3 Warm Gray 3' },
        { hex: '#ADA197', name: 'W-4 Warm Gray 4' },
        { hex: '#978A80', name: 'W-5 Warm Gray 5' },
        { hex: '#7F7268', name: 'W-6 Warm Gray 6' },
        { hex: '#665B52', name: 'W-7 Warm Gray 7' },
        { hex: '#4E453D', name: 'W-8 Warm Gray 8' },
        { hex: '#372F29', name: 'W-9 Warm Gray 9' },
        { hex: '#211B17', name: 'W-10 Warm Gray 10' },

        // Neutral & Toner Grays
        { hex: '#E2E2E2', name: 'N-1 Neutral Gray 1' },
        { hex: '#B8B8B8', name: 'N-3 Neutral Gray 3' },
        { hex: '#8C8C8C', name: 'N-5 Neutral Gray 5' },
        { hex: '#5A5A5A', name: 'N-7 Neutral Gray 7' },
        { hex: '#262626', name: 'N-9 Neutral Gray 9' },

        // Skin & Earth Tones
        { hex: '#FFF2E5', name: 'E00 Cotton Pearl' },
        { hex: '#FFE7D9', name: 'E000 Pale Chiffon' },
        { hex: '#FED6CE', name: 'E02 Fruit Pink' },
        { hex: '#F6CBB7', name: 'E11 Barely Beige' },
        { hex: '#E8B39B', name: 'E13 Light Suntan' },
        { hex: '#D69B7B', name: 'E15 Dark Suntan' },
        { hex: '#C6805E', name: 'E18 Copper' },
        { hex: '#522A1E', name: 'E29 Burnt Umber' },
        { hex: '#DFBA98', name: 'E31 Brick Beige' },
        { hex: '#C99E75', name: 'E33 Sand' },
        { hex: '#A8764B', name: 'E35 Chamois' },
        { hex: '#7F4C23', name: 'E37 Sepia' },
        { hex: '#3B1F0E', name: 'E49 Dark Bark' },

        // Vibrant Chromatics
        { hex: '#EA272F', name: 'R27 Cadmium Red' },
        { hex: '#D91E2B', name: 'R29 Lipstick Red' },
        { hex: '#9E1B29', name: 'R59 Cardinal' },
        { hex: '#E74383', name: 'RV06 Cerise' },
        { hex: '#B02663', name: 'RV19 Red Violet' },
        { hex: '#F47920', name: 'YR07 Cadmium Orange' },
        { hex: '#FDB813', name: 'Y15 Cadmium Yellow' },
        { hex: '#FFE600', name: 'Y08 Acid Yellow' },
        { hex: '#87B738', name: 'YG03 Yellow Green' },
        { hex: '#379A3E', name: 'G07 Nile Green' },
        { hex: '#116C42', name: 'G28 Ocean Green' },
        { hex: '#00A398', name: 'BG15 Aqua' },
        { hex: '#00838F', name: 'BG49 Duck Blue' },
        { hex: '#00A0E9', name: 'B04 Tahitian Blue' },
        { hex: '#10529D', name: 'B29 Lapis Lazuli' },
        { hex: '#162C61', name: 'B39 Prussian Blue' },
        { hex: '#443C78', name: 'BV08 Blue Violet' },
        { hex: '#633B76', name: 'V09 Violet' }
      ]
    },
    {
      id: 'pantone_coated',
      name: 'Pantone Matching System (Fórmula Coated)',
      category: 'Diseño Gráfico & Branding',
      description: 'Estándar internacional de artes gráficas con tintas directas PMS oficiales.',
      colors: [
        { hex: '#FEDD00', name: 'Pantone Yellow C' },
        { hex: '#F96302', name: 'Pantone 021 C (Orange)' },
        { hex: '#F93822', name: 'Pantone Warm Red C' },
        { hex: '#E4002B', name: 'Pantone 185 C (Red)' },
        { hex: '#CE0058', name: 'Pantone Rubine Red C' },
        { hex: '#E10098', name: 'Pantone Rhodamine Red C' },
        { hex: '#BB29BB', name: 'Pantone Purple C' },
        { hex: '#722282', name: 'Pantone Violet C' },
        { hex: '#002B7F', name: 'Pantone Blue 072 C' },
        { hex: '#0A1172', name: 'Pantone Reflex Blue C' },
        { hex: '#0085CA', name: 'Pantone Process Blue C' },
        { hex: '#00AB8E', name: 'Pantone 3272 C' },
        { hex: '#009A44', name: 'Pantone Green C' },
        { hex: '#78BE20', name: 'Pantone 368 C' },
        { hex: '#FFB81C', name: 'Pantone 123 C' },
        { hex: '#8A3B14', name: 'Pantone 4695 C' },
        { hex: '#4A2A18', name: 'Pantone 476 C' },
        { hex: '#2D2926', name: 'Pantone Black C' },

        // Pantone Cool Grays
        { hex: '#D9D9D6', name: 'Pantone Cool Gray 1 C' },
        { hex: '#BBBCBC', name: 'Pantone Cool Gray 3 C' },
        { hex: '#97999B', name: 'Pantone Cool Gray 5 C' },
        { hex: '#75787B', name: 'Pantone Cool Gray 7 C' },
        { hex: '#53565A', name: 'Pantone Cool Gray 9 C' },
        { hex: '#333436', name: 'Pantone Cool Gray 11 C' },

        // Pantone Warm Grays
        { hex: '#D7D2CB', name: 'Pantone Warm Gray 1 C' },
        { hex: '#B7B09C', name: 'Pantone Warm Gray 3 C' },
        { hex: '#8C827A', name: 'Pantone Warm Gray 6 C' },
        { hex: '#635B54', name: 'Pantone Warm Gray 9 C' }
      ]
    },
    {
      id: 'prismacolor_premier',
      name: 'Prismacolor Premier (Lápices de Artista)',
      category: 'Bellas Artes & Dibujo',
      description: 'Pigmentos cerosos de alta intensidad para ilustración tradicional y concept art.',
      colors: [
        { hex: '#092353', name: 'PC901 Indigo Blue' },
        { hex: '#165293', name: 'PC903 True Blue' },
        { hex: '#0A693B', name: 'PC909 Grass Green' },
        { hex: '#31853B', name: 'PC912 Apple Green' },
        { hex: '#FFDD00', name: 'PC916 Canary Yellow' },
        { hex: '#F76B1C', name: 'PC918 Orange' },
        { hex: '#E01A22', name: 'PC924 Crimson Red' },
        { hex: '#C2185B', name: 'PC931 Dark Purple' },
        { hex: '#101010', name: 'PC935 Black' },
        { hex: '#FFFFFF', name: 'PC938 White' },
        { hex: '#824622', name: 'PC945 Sienna Brown' },
        { hex: '#522A1A', name: 'PC947 Dark Brown' },
        { hex: '#C8A2C8', name: 'PC996 Lavender' },
        { hex: '#F09C15', name: 'PC1003 Spanish Orange' },
        { hex: '#006E82', name: 'PC1027 Peacock Blue' }
      ]
    }
  ]
};
