/**
 * GOM Picker - AI Color Assistant & 60-30-10 Composition Studio
 * Generates thematic color palettes using semantic heuristics and color theory,
 * assigns composition roles (60% Base, 30% Secondary, 10% Accent),
 * and provides live vector composition preview mockups across 5 artistic scenes.
 */

import { ColorMath } from './colorMath.js';
import { AIAdvisor } from './aiAdvisor.js';

export const AIAssistant = {
  activeSceneType: 'creature', // 'creature' | 'landscape' | 'portrait' | 'poster' | 'cyberpunk' | 'still_life'

  // Preset mood themes
  PRESETS: [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neo-Tokyo',
      tags: ['neon', 'tecnología', 'noche', 'sci-fi', 'futurista'],
      baseColors: ['#0A0915', '#161938', '#00F0FF', '#FF007F', '#FFE600'],
      description: 'Contrastes eléctricos de cian y magenta sobre fondos oscuros ultra saturados.'
    },
    {
      id: 'autumn_forest',
      name: 'Bosque de Otoño Acogedor',
      tags: ['cálido', 'naturaleza', 'tierra', 'otoño', 'bosque'],
      baseColors: ['#2B1B17', '#5C2C16', '#C25925', '#E69C24', '#F4D06F'],
      description: 'Gradación orgánica de hojas secas, sombras ambarinas y luz dorada crepuscular.'
    },
    {
      id: 'dark_fantasy',
      name: 'Dark Fantasy & Alquimia',
      tags: ['oscuro', 'gótico', 'misterio', 'magia', 'sombras'],
      baseColors: ['#0D0B0E', '#2A2030', '#54324E', '#9E4770', '#E4B363'],
      description: 'Atmósferas sombrías con toques místicos de runas doradas y púrpuras profundos.'
    },
    {
      id: 'ghibli_meadow',
      name: 'Pradera Studio Ghibli',
      tags: ['naturaleza', 'luz', 'fresco', 'nostalgia', 'verano'],
      baseColors: ['#1F4027', '#4E8752', '#97C97C', '#F3E9B5', '#6FA4E5'],
      description: 'Verdes exuberantes, cielos añiles claros y luz estival radiante.'
    },
    {
      id: 'golden_hour',
      name: 'Atardecer Golden Hour',
      tags: ['cálido', 'sol', 'romántico', 'luz', 'atardecer'],
      baseColors: ['#2E112D', '#540032', '#820333', '#C9283E', '#F0A202'],
      description: 'Transición dramática desde el violeta crepuscular hasta el fuego anaranjado del horizonte.'
    },
    {
      id: 'deep_ocean',
      name: 'Abismo Oceánico',
      tags: ['frío', 'mar', 'profundo', 'bioluminiscente', 'océano'],
      baseColors: ['#030C1A', '#0B2545', '#134074', '#8DA9C4', '#5CF2BD'],
      description: 'Gradientes ultramarinos con destellos bioluminiscentes de turquesa esmeralda.'
    },
    {
      id: 'vaporwave',
      name: 'Vaporwave Sunset 1984',
      tags: ['retro', 'sintetizador', '80s', 'nostalgia', 'vaporwave'],
      baseColors: ['#1D1135', '#461E52', '#DD517F', '#E68E36', '#556DAC'],
      description: 'Estética retro-futurista con gradientes pastel atardecer y nostalgia analógica.'
    },
    {
      id: 'scandinavian',
      name: 'Minimalismo Nórdico',
      tags: ['neutro', 'calma', 'elegante', 'moderno', 'diseño'],
      baseColors: ['#1E2022', '#52616B', '#C9D6DF', '#F0F5F9', '#C5A880'],
      description: 'Tonos neutros equilibrados con maderas claras y aire minimalista sereno.'
    }
  ],

  // Generate palette dynamically using neural semantic vector synthesis
  generateFromPrompt(promptText) {
    return AIAdvisor.synthesizePalette(promptText);
  },

  _formatPalette(title, hexColors, description) {
    const roles = [
      { name: 'Dominante (60% Fondo)', roleKey: 'dominant', percentage: 60 },
      { name: 'Secundario (30% Formas)', roleKey: 'secondary', percentage: 30 },
      { name: 'Acento (10% Foco)', roleKey: 'accent', percentage: 10 },
      { name: 'Luz Especular', roleKey: 'highlight', percentage: 0 },
      { name: 'Atmósfera / Rebote', roleKey: 'atmosphere', percentage: 0 }
    ];

    const items = hexColors.map((hex, idx) => {
      const rgb = ColorMath.hexToRgb(hex);
      const role = roles[idx] || roles[roles.length - 1];
      return {
        hex,
        rgb,
        hsv: ColorMath.rgbToHsv(rgb.r, rgb.g, rgb.b),
        roleName: role.name,
        roleKey: role.roleKey,
        percentage: role.percentage
      };
    });

    return {
      title,
      description,
      colors: items,
      dominant: items[0],
      secondary: items[1],
      accent: items[2]
    };
  },

  // Apply modifiers to existing palette
  modifyPalette(palette, modificationType) {
    if (!palette || !palette.colors) return palette;

    const modified = palette.colors.map(c => {
      const hsv = c.hsv ? { ...c.hsv } : ColorMath.rgbToHsv(c.rgb.r, c.rgb.g, c.rgb.b);
      let { h, s, v } = hsv;
      if (modificationType === 'warm') {
        // Shift hue towards 35° (golden amber)
        h = (h * 0.65 + 35 * 0.35 + 360) % 360;
        s = Math.min(1, s * 1.15);
      } else if (modificationType === 'cool') {
        // Shift hue towards 220° (cobalt blue)
        h = (h * 0.65 + 220 * 0.35 + 360) % 360;
        s = Math.min(1, s * 1.05);
      } else if (modificationType === 'invert_values') {
        // Invert brightness smoothly
        v = Math.max(0.08, Math.min(0.98, 1 - v));
      } else if (modificationType === 'vibrant') {
        // Boost saturation
        s = Math.min(1, s * 1.35 + 0.15);
      } else if (modificationType === 'mute') {
        // Desaturate & cinematic fade
        s = Math.max(0.05, s * 0.55);
        v = Math.min(0.85, v * 0.95);
      }

      const rgb = ColorMath.hsvToRgb(h, s, v);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      return {
        ...c,
        hex,
        rgb,
        hsv: { h: Math.round(h), s, v }
      };
    });

    const newVector = palette.semanticVector ? { ...palette.semanticVector } : { thermal: 0.1, valueKey: 0.5, saturation: 0.6, tension: 0.4, organicity: 0.5 };
    if (modificationType === 'warm') newVector.thermal = Math.min(1, newVector.thermal + 0.35);
    else if (modificationType === 'cool') newVector.thermal = Math.max(-1, newVector.thermal - 0.35);
    else if (modificationType === 'vibrant') newVector.saturation = Math.min(1, newVector.saturation + 0.3);
    else if (modificationType === 'mute') newVector.saturation = Math.max(0.1, newVector.saturation - 0.35);
    else if (modificationType === 'invert_values') newVector.valueKey = 1 - newVector.valueKey;

    const newCritique = AIAdvisor.diagnosePalette(modified.map(c => c.rgb));

    return {
      ...palette,
      title: `${palette.title.split('(')[0].trim()} (${modificationType.toUpperCase()})`,
      colors: modified,
      dominant: modified[0],
      secondary: modified[1],
      accent: modified[2],
      highlight: modified[3],
      terminator: modified[4],
      semanticVector: newVector,
      critique: newCritique
    };
  },

  // Generates SVG Scene preview showing the palette applied in 60-30-10 distribution across 6 scenes
  generatePreviewSvg(palette, sceneType = this.activeSceneType) {
    this.activeSceneType = sceneType;
    const colors = palette.colors || [];
    const c0 = colors[0]?.hex || '#1a1a24'; // 60% Dominant Base
    const c1 = colors[1]?.hex || '#3a3d52'; // 30% Secondary Elements
    const c2 = colors[2]?.hex || '#e63946'; // 10% Accent Dynamic
    const c3 = colors[3]?.hex || '#f1faee'; // Highlight / Specular
    const c4 = colors[4]?.hex || '#457b9d'; // Atmosphere / Bridge

    const legendPill = `
      <g transform="translate(14, 14)">
        <rect width="115" height="24" rx="12" fill="rgba(0,0,0,0.65)" />
        <circle cx="16" cy="12" r="5" fill="${c0}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
        <circle cx="32" cy="12" r="5" fill="${c1}" />
        <circle cx="48" cy="12" r="5" fill="${c2}" />
        <text x="62" y="16" fill="#fff" font-size="10" font-family="system-ui, sans-serif" font-weight="600">60 • 30 • 10</text>
      </g>
    `;

    switch (sceneType) {
      // 1. CREATURE & DRAGON IN OBSIDIAN CAVERN
      case 'creature': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <defs>
              <radialGradient id="cavernGlow" cx="65%" cy="50%" r="60%">
                <stop offset="0%" stop-color="${c2}" stop-opacity="0.3" />
                <stop offset="60%" stop-color="${c4}" stop-opacity="0.12" />
                <stop offset="100%" stop-color="${c0}" stop-opacity="0" />
              </radialGradient>
              <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <!-- 60% Dominante: Cueva de obsidiana y fondo de penumbra -->
            <rect width="400" height="240" fill="${c0}" />
            <rect width="400" height="240" fill="url(#cavernGlow)" />
            <!-- Estalactitas y rocas de fondo -->
            <polygon points="0,0 45,70 90,0" fill="${c0}" opacity="0.9" stroke="${c1}" stroke-width="1" />
            <polygon points="120,0 155,50 180,0" fill="${c0}" opacity="0.8" />
            <polygon points="310,0 350,85 390,0" fill="${c0}" opacity="0.9" stroke="${c1}" stroke-width="1" />
            <path d="M0,240 L50,180 L140,210 L250,165 L360,220 L400,195 L400,240 Z" fill="${c1}" opacity="0.5" />

            <!-- 30% Secundario: Anatomía del Dragón (Cuerpo, alas, cuernos) -->
            <!-- Ala desplegada en penumbra -->
            <path d="M120 180 Q190 70 310 40 Q260 90 230 130 Q180 155 120 180 Z" fill="${c1}" opacity="0.85" />
            <path d="M310 40 Q280 80 280 110" stroke="${c3}" stroke-width="2" fill="none" opacity="0.7" />
            <path d="M230 130 Q220 80 310 40" stroke="${c1}" stroke-width="2" fill="none" />

            <!-- Cabeza y cuello del Dragón -->
            <path d="M40 240 Q100 210 140 180 Q170 150 190 120 Q240 110 270 125 Q285 135 270 145 Q240 150 220 160 Q170 210 140 240 Z" fill="${c1}" />
            <!-- Mandíbula inferior -->
            <path d="M225 155 Q265 152 255 165 Q235 170 215 168 Z" fill="${c0}" stroke="${c1}" stroke-width="1.5" />

            <!-- Cuernos y crestas dorsales -->
            <polygon points="190,115 150,60 175,115" fill="${c1}" stroke="${c3}" stroke-width="1" />
            <polygon points="175,125 130,85 160,130" fill="${c1}" opacity="0.9" />
            <polygon points="145,175 110,140 135,185" fill="${c1}" />
            <polygon points="115,205 85,175 105,215" fill="${c1}" />

            <!-- Transición SSS orgánica en garganta y pecho caliente -->
            <path d="M160 170 Q195 145 220 155 Q190 185 155 210 Z" fill="${c4}" opacity="0.65" />
            <!-- Fisuras de magma en el pecho -->
            <path d="M150 205 Q175 185 185 195 Q195 180 210 185" stroke="${c2}" stroke-width="2.5" fill="none" filter="url(#eyeGlow)" />
            <path d="M165 215 Q180 205 200 212" stroke="${c2}" stroke-width="1.8" fill="none" />

            <!-- 10% Acento Focal: Ojo de fuego ardiente y núcleo de brasa -->
            <ellipse cx="238" cy="128" rx="6" ry="4" fill="${c2}" filter="url(#eyeGlow)" />
            <ellipse cx="238" cy="128" rx="2" ry="3.5" fill="${c3}" />
            <!-- Vaho ardiente / chispa en fauces -->
            <circle cx="282" cy="140" r="3" fill="${c2}" filter="url(#eyeGlow)" />
            <circle cx="295" cy="138" r="2" fill="${c2}" opacity="0.8" />
            <circle cx="310" cy="132" r="1.5" fill="${c3}" />

            <!-- Luz especular de recorte (Cuernos) -->
            <path d="M190 115 L150 60" stroke="${c3}" stroke-width="2" stroke-linecap="round" opacity="0.9" />

            ${legendPill}
          </svg>
        `;
      }

      // 2. LANDSCAPE & CELESTIAL DOME
      case 'landscape': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <rect width="400" height="240" fill="${c0}" />
            <circle cx="290" cy="75" r="45" fill="${c3}" opacity="0.9" filter="drop-shadow(0 0 25px ${c2})" />
            <circle cx="290" cy="75" r="60" fill="${c2}" opacity="0.25" />
            <path d="M0 160 L65 115 L140 155 L225 90 L310 160 L400 115 L400 240 L0 240 Z" fill="${c1}" opacity="0.8" />
            <path d="M-20 200 Q80 145 180 185 T380 170 L420 240 L-20 240 Z" fill="${c0}" opacity="0.95" />
            <polygon points="120,80 150,190 90,190" fill="${c1}" />
            <polygon points="135,50 145,80 125,80" fill="${c2}" />
            <circle cx="135" cy="45" r="8" fill="${c2}" filter="drop-shadow(0 0 12px ${c2})" />
            <circle cx="135" cy="45" r="3" fill="${c3}" />
            <rect x="0" y="210" width="400" height="30" fill="${c4}" opacity="0.5" />
            <line x1="100" y1="218" x2="170" y2="218" stroke="${c2}" stroke-width="2" opacity="0.6" />
            <line x1="240" y1="225" x2="320" y2="225" stroke="${c3}" stroke-width="1.5" opacity="0.8" />
            ${legendPill}
          </svg>
        `;
      }

      // 2. PORTRAIT & HUMAN FIGURE
      case 'portrait': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <rect width="400" height="240" fill="${c0}" />
            <circle cx="200" cy="120" r="110" fill="${c4}" opacity="0.15" />
            <!-- Silhouette Head & Shoulders (Secondary 30%) -->
            <path d="M90 240 C100 190 130 180 150 170 C140 145 140 90 200 90 C260 90 260 145 250 170 C270 180 300 190 310 240 Z" fill="${c1}" />
            <!-- Face Plane Mask (Terminator & Light) -->
            <ellipse cx="200" cy="135" rx="38" ry="50" fill="${c4}" opacity="0.85" />
            <!-- High-Contrast Accent Focal Eyes & Lips (10% Accent) -->
            <circle cx="186" cy="130" r="5" fill="${c2}" filter="drop-shadow(0 0 6px ${c2})" />
            <circle cx="214" cy="130" r="5" fill="${c2}" filter="drop-shadow(0 0 6px ${c2})" />
            <circle cx="187" cy="129" r="1.5" fill="${c3}" />
            <circle cx="215" cy="129" r="1.5" fill="${c3}" />
            <path d="M190 162 Q200 168 210 162" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round" />
            <!-- Hair Specular Highlights -->
            <path d="M165 95 Q200 85 235 95" stroke="${c3}" stroke-width="3" fill="none" opacity="0.9" filter="drop-shadow(0 0 4px ${c3})" />
            <!-- Earring / Jewelry Gem Accent -->
            <circle cx="158" cy="148" r="4.5" fill="${c2}" />
            <circle cx="158" cy="148" r="1.5" fill="${c3}" />
            ${legendPill}
          </svg>
        `;
      }

      // 3. GRAPHIC POSTER & BAUHAUS BRANDING
      case 'poster': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <rect width="400" height="240" fill="${c0}" />
            <!-- Large Geometric Shapes (Secondary 30%) -->
            <rect x="40" y="40" width="140" height="160" rx="4" fill="${c1}" />
            <circle cx="260" cy="120" r="70" fill="${c1}" opacity="0.6" />
            <path d="M260 50 A70 70 0 0 1 260 190 Z" fill="${c4}" />
            <!-- Dynamic Accent Ribbon (10% Accent) -->
            <polygon points="120,20 220,220 180,220 80,20" fill="${c2}" filter="drop-shadow(0 0 16px ${c2})" />
            <circle cx="260" cy="120" r="28" fill="${c2}" />
            <circle cx="260" cy="120" r="10" fill="${c3}" />
            <!-- Geometric Typography Mockup -->
            <rect x="56" y="60" width="50" height="6" fill="${c3}" />
            <rect x="56" y="74" width="90" height="3" fill="${c3}" opacity="0.8" />
            <rect x="56" y="82" width="70" height="3" fill="${c3}" opacity="0.8" />
            ${legendPill}
          </svg>
        `;
      }

      // 4. CYBERPUNK / SCI-FI NIGHT SCENE
      case 'cyberpunk': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <rect width="400" height="240" fill="${c0}" />
            <!-- City Skyline (Secondary 30%) -->
            <rect x="30" y="60" width="45" height="180" fill="${c1}" />
            <rect x="90" y="30" width="55" height="210" fill="${c1}" />
            <rect x="160" y="80" width="70" height="160" fill="${c1}" />
            <rect x="245" y="45" width="50" height="195" fill="${c1}" />
            <rect x="310" y="90" width="60" height="150" fill="${c1}" />
            <!-- Windows Matrix (Atmospheric Glow) -->
            <g fill="${c4}" opacity="0.4">
              <rect x="100" y="50" width="6" height="4" /><rect x="115" y="50" width="6" height="4" />
              <rect x="100" y="70" width="6" height="4" /><rect x="115" y="70" width="6" height="4" />
              <rect x="255" y="65" width="6" height="4" /><rect x="270" y="65" width="6" height="4" />
            </g>
            <!-- High-Voltage Neon Hologram Billboard (10% Accent) -->
            <rect x="175" y="105" width="42" height="28" rx="3" fill="${c2}" filter="drop-shadow(0 0 14px ${c2})" />
            <text x="183" y="123" fill="${c3}" font-size="11" font-weight="900" font-family="monospace">NEO</text>
            <!-- Wet Asphalt Reflections -->
            <rect x="0" y="200" width="400" height="40" fill="${c0}" />
            <ellipse cx="196" cy="215" rx="55" ry="4" fill="${c2}" opacity="0.6" filter="blur(2px)" />
            <ellipse cx="115" cy="225" rx="30" ry="3" fill="${c3}" opacity="0.7" filter="blur(1px)" />
            ${legendPill}
          </svg>
        `;
      }

      // 5. CLASSICAL STILL LIFE (NATURALEZA MUERTA)
      case 'still_life': {
        return `
          <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden;">
            <rect width="400" height="240" fill="${c0}" />
            <!-- Studio Wall & Tablecloth Plane (Secondary 30%) -->
            <polygon points="0,150 400,140 400,240 0,240" fill="${c1}" />
            <path d="M40 160 Q180 180 360 160 L380 240 L20 240 Z" fill="${c4}" opacity="0.3" />
            <!-- Ceramic Jug (Shadow & Form) -->
            <path d="M130 90 Q110 130 115 170 L175 170 Q180 130 160 90 Z" fill="${c1}" stroke="${c0}" stroke-width="2" />
            <path d="M125 100 Q145 100 145 165" stroke="${c4}" stroke-width="8" opacity="0.6" fill="none" />
            <path d="M112 110 Q95 125 115 145" stroke="${c1}" stroke-width="6" fill="none" />
            <!-- Focal Fruit / Accent Object (10% Accent) -->
            <circle cx="210" cy="165" r="26" fill="${c2}" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))" />
            <!-- Terminator Shadow & SSS Ring on Fruit -->
            <path d="M190 175 Q210 195 230 175 Q220 188 200 188 Z" fill="${c0}" opacity="0.5" />
            <!-- Specular Highlight Dot -->
            <circle cx="202" cy="154" r="5" fill="${c3}" opacity="0.9" />
            <circle cx="203" cy="154" r="2" fill="#FFFFFF" />
            <!-- Second Pear / Accent Element -->
            <ellipse cx="255" cy="172" rx="18" ry="16" fill="${c4}" />
            <circle cx="250" cy="166" r="3" fill="${c3}" opacity="0.8" />
            ${legendPill}
          </svg>
        `;
      }

      default:
        return this.generatePreviewSvg(palette, 'landscape');
    }
  }
};
