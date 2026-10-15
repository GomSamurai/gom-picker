/**
 * GOM Picker - Atmospheric Light, Time of Day & Shadow Physics Engine
 * Implements scientific lighting transformations for digital artists:
 * - Time of Day chromatic shifts (Dawn, Noon, Golden Hour, Blue Hour, Moonlight)
 * - Scientific shadow calculation (Skylight fill, Ground bounce terrain, Terminator SSS boost)
 * - Purkinje Effect (scotopic human vision shift at low light)
 * - Aerial Perspective (atmospheric haze/distance fading)
 * - Global Color Tint, Glaze & Split-Toning Studio
 * - Atmospheric Sky Dome Continuous Gradients
 * - Interactive 3D Optical Sphere Lighting Renderer
 * 
 * 100% Offline, Zero external dependencies.
 */

import { ColorMath } from './colorMath.js';

export const AtmosphereEngine = {
  // Global modifier state
  state: {
    enabled: false,
    timeOfDay: 14.0, // 0.0 to 24.0 hours (14:00 = 2 PM daylight)
    sunTempK: 5500, // Kelvin (2000K sunset - 6500K noon - 10000K overcast)
    sunElevation: 65, // Degrees (0° horizon to 90° zenith)
    sunAzimuth: 140, // Degrees (compass azimuth)
    skyAmbientHue: 215, // Degrees (Blue sky ambient)
    skyAmbientSat: 0.5,
    bounceIntensity: 0.35, // Floor/environment bounce ratio (0-1)
    groundType: 'earth', // 'earth' | 'grass' | 'sand' | 'snow' | 'asphalt' | 'water' | 'custom'
    customGroundRgb: { r: 195, g: 145, b: 100 },
    sssIntensity: 0.4, // Subsurface scattering / Terminator saturation boost (0-1)
    purkinjeShift: false, // Night vision rod cell shift
    aerialHaze: 0.0, // 0 to 1 distance haze
    aerialHazeColor: { r: 165, g: 195, b: 235 }, // Pale atmospheric blue
    // GLOBAL TINT & COLOR CAST STUDIO
    tintEnabled: false,
    tintColor: '#F59E0B', // Solar amber default
    tintRgb: { r: 245, g: 158, b: 11 },
    tintAmount: 0.0, // 0 to 1 (0% to 100%)
    tintTarget: 'all', // 'all' (Homogéneo/Glaze) | 'highlights' (Luces) | 'shadows' (Sombras) | 'split' (Split-toning)
    tintBlendMode: 'soft_light', // 'soft_light' | 'multiply' | 'overlay' | 'color' | 'screen'
    tintSecondaryColor: '#38BDF8', // Cool cyan for split-toning shadows
    tintSecondaryRgb: { r: 56, g: 189, b: 248 },
    intensity: 1.0 // Master modifier strength (0 to 1)
  },

  // Presets for Time of Day & Light Scenarios
  TIME_PRESETS: [
    {
      id: 'dawn',
      name: 'Amanecer / Aurora (06:30)',
      time: 6.5,
      sunTempK: 3200,
      sunElevation: 15,
      sunAzimuth: 75,
      skyHue: 240,
      skySat: 0.6,
      bounce: 0.25,
      sss: 0.65,
      groundType: 'earth',
      description: 'Luz rasante cálida rosada con cielo añil profundo y sombras frías translúcidas.'
    },
    {
      id: 'noon',
      name: 'Mediodía Solar (12:00)',
      time: 12.0,
      sunTempK: 5800,
      sunElevation: 75,
      sunAzimuth: 180,
      skyHue: 210,
      skySat: 0.7,
      bounce: 0.45,
      sss: 0.35,
      groundType: 'earth',
      description: 'Luz directa cenital neutra intensa; sombras recortadas dominadas por el azul del cielo.'
    },
    {
      id: 'golden_hour',
      name: 'Golden Hour (18:45)',
      time: 18.75,
      sunTempK: 2600,
      sunElevation: 12,
      sunAzimuth: 275,
      skyHue: 260,
      skySat: 0.75,
      bounce: 0.55,
      sss: 0.85,
      groundType: 'sand',
      description: 'Sol ámbar/naranja rasante con saturación máxima en el terminador y sombras violetas.'
    },
    {
      id: 'blue_hour',
      name: 'Hora Azul / Crepúsculo (20:00)',
      time: 20.0,
      sunTempK: 4200,
      sunElevation: 4,
      sunAzimuth: 295,
      skyHue: 225,
      skySat: 0.85,
      bounce: 0.25,
      sss: 0.2,
      groundType: 'asphalt',
      description: 'El sol ha caído tras el horizonte. El domo celeste azul cobalto ilumina la totalidad de la escena.'
    },
    {
      id: 'moonlight',
      name: 'Noche de Luna Llena (00:30)',
      time: 0.5,
      sunTempK: 6500,
      sunElevation: 55,
      sunAzimuth: 25,
      skyHue: 220,
      skySat: 0.45,
      bounce: 0.15,
      sss: 0.15,
      groundType: 'snow',
      purkinje: true,
      description: 'Baja luminancia escotópica: efecto Purkinje que apaga los rojos y resalta verdes/azules gélidos.'
    },
    {
      id: 'overcast',
      name: 'Día Nublado / Difuso (14:00)',
      time: 14.0,
      sunTempK: 7200,
      sunElevation: 55,
      sunAzimuth: 210,
      skyHue: 210,
      skySat: 0.15,
      bounce: 0.5,
      sss: 0.2,
      groundType: 'grass',
      description: 'Gran caja de luz difusa suave; sombras apenas perceptibles de oclusión ambiental.'
    }
  ],

  // Terrain Types for Ground Bounce Simulation
  TERRAIN_TYPES: {
    earth: { id: 'earth', name: 'Tierra / Arcilla', rgb: { r: 195, g: 145, b: 100 }, hex: '#C39164' },
    grass: { id: 'grass', name: 'Hierba / Vegetación', rgb: { r: 95, g: 165, b: 70 }, hex: '#5FA546' },
    sand: { id: 'sand', name: 'Arena / Playa', rgb: { r: 235, g: 195, b: 130 }, hex: '#EBC382' },
    snow: { id: 'snow', name: 'Nieve / Hielo', rgb: { r: 215, g: 235, b: 252 }, hex: '#D7EBFC' },
    asphalt: { id: 'asphalt', name: 'Asfalto / Ciudad', rgb: { r: 110, g: 115, b: 125 }, hex: '#6E737D' },
    water: { id: 'water', name: 'Agua / Marino', rgb: { r: 45, g: 135, b: 185 }, hex: '#2D87B9' },
    custom: { id: 'custom', name: 'Personalizado', rgb: { r: 215, g: 165, b: 120 }, hex: '#D7A578' }
  },

  // Cinematic Global Tint Presets
  TINT_PRESETS: [
    { id: 'amber', name: '🌅 Ámbar Solar', hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, mode: 'soft_light' },
    { id: 'sepia', name: '☕ Sepia Vintage', hex: '#A16207', rgb: { r: 161, g: 98, b: 7 }, mode: 'multiply' },
    { id: 'scifi', name: '🌌 Cyan Sci-Fi', hex: '#06B6D4', rgb: { r: 6, g: 182, b: 212 }, mode: 'screen' },
    { id: 'emerald', name: '🌲 Esmeralda Místico', hex: '#10B981', rgb: { r: 16, g: 185, b: 129 }, mode: 'soft_light' },
    { id: 'crimson', name: '🩸 Carmín Tenebrista', hex: '#E11D48', rgb: { r: 225, g: 29, b: 72 }, mode: 'multiply' },
    { id: 'violet', name: '🔮 Violeta Mágico', hex: '#8B5CF6', rgb: { r: 139, g: 92, b: 246 }, mode: 'overlay' },
    { id: 'glacial', name: '🌕 Azul Glacial', hex: '#38BDF8', rgb: { r: 56, g: 189, b: 248 }, mode: 'soft_light' }
  ],

  // Convert Color Temperature in Kelvin (1000K - 12000K) to approximate RGB
  kelvinToRgb(kelvin) {
    const k = Math.max(1000, Math.min(12000, kelvin));
    const temp = k / 100;
    let r, g, b;

    // Red
    if (temp <= 66) {
      r = 255;
    } else {
      r = temp - 60;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      r = ColorMath.clamp255(r);
    }

    // Green
    if (temp <= 66) {
      g = temp;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
      g = ColorMath.clamp255(g);
    } else {
      g = temp - 60;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
      g = ColorMath.clamp255(g);
    }

    // Blue
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = ColorMath.clamp255(b);
    }

    return { r, g, b };
  },

  // Calculate Sun and Sky color for current state - Always dynamic and responsive
  getSunAndSkyColors() {
    const t = this.state.timeOfDay;
    const isNight = (t < 5.5 || t > 21.0);

    // Compute direct light color from Kelvin temperature
    const rawLightColor = this.kelvinToRgb(this.state.sunTempK);

    let sunRgb;
    if (isNight) {
      // Moonlight: modulates raw Kelvin with lunar albedo and cool airglow
      sunRgb = {
        r: ColorMath.clamp255(rawLightColor.r * 0.72 + 25),
        g: ColorMath.clamp255(rawLightColor.g * 0.82 + 35),
        b: ColorMath.clamp255(rawLightColor.b * 1.05 + 50)
      };
    } else {
      sunRgb = rawLightColor;
    }

    // Sky ambient color
    const skySat = ColorMath.clamp(this.state.skyAmbientSat, 0.05, 1.0);
    const skyVal = isNight ? 0.35 : 0.88;
    const skyRgb = ColorMath.hsvToRgb(this.state.skyAmbientHue, skySat, skyVal);

    // Sun solar elevation (0 = horizon, 1 = zenith)
    let sunAltitude = 0;
    if (t >= 5.5 && t <= 21.0) {
      sunAltitude = Math.sin(((t - 5.5) / 15.5) * Math.PI);
    } else {
      // Moon altitude
      const nightT = t > 21.0 ? (t - 21.0) : (t + 3.0);
      sunAltitude = Math.max(0.1, Math.sin((nightT / 8.5) * Math.PI) * 0.45);
    }

    const wDir = isNight ? 0.35 : Math.max(0.3, Math.min(0.85, 0.45 + sunAltitude * 0.4));
    const wSky = 1 - wDir;

    const combined = {
      r: wDir * sunRgb.r + wSky * skyRgb.r,
      g: wDir * sunRgb.g + wSky * skyRgb.g,
      b: wDir * sunRgb.b + wSky * skyRgb.b
    };

    const maxC = Math.max(combined.r, combined.g, combined.b, 1);
    const filterF = {
      r: combined.r / maxC,
      g: combined.g / maxC,
      b: combined.b / maxC
    };

    return {
      sunColor: sunRgb,
      sunIntensity: isNight ? 0.35 : Math.max(0.2, sunAltitude),
      skyColor: skyRgb,
      filterF,
      isNight
    };
  },

  // Returns current ground bounce terrain color
  getGroundBounceColor() {
    const terrain = this.TERRAIN_TYPES[this.state.groundType] || this.TERRAIN_TYPES.earth;
    if (this.state.groundType === 'custom' && this.state.customGroundRgb) {
      return this.state.customGroundRgb;
    }
    return terrain.rgb;
  },

  /**
   * Scientific Calculation of Shading Stages for a given local color:
   * 1. Color Local (Neutro de estudio)
   * 2. Brillo Especular (Reflejo directo del sol/fuente)
   * 3. Luz Directa (Color afectado por fotones directos con temperatura Kelvin)
   * 4. Terminador con SSS (Dispersión subsuperficial, pico cromático de saturación)
   * 5. Sombra Propia (Domo celeste + rebote térmico del suelo seleccionado)
   * 6. Oclusión Ambiental (Grietas y hendiduras profundas)
   */
  calculateLightingStages(localRgb) {
    const { sunColor, skyColor, filterF, isNight } = this.getSunAndSkyColors();
    const localHsv = ColorMath.rgbToHsv(localRgb.r, localRgb.g, localRgb.b);
    const masterIntensity = (typeof this.state.intensity === 'number') ? this.state.intensity : 1.0;

    // 1. Direct Light stage: Local color lit by normalized atmospheric illuminant
    const sunNormalized = {
      r: sunColor.r / 255,
      g: sunColor.g / 255,
      b: sunColor.b / 255
    };

    let directLightRgb = {
      r: ColorMath.clamp255(localRgb.r * (filterF.r * 0.6 + sunNormalized.r * 0.4)),
      g: ColorMath.clamp255(localRgb.g * (filterF.g * 0.6 + sunNormalized.g * 0.4)),
      b: ColorMath.clamp255(localRgb.b * (filterF.b * 0.6 + sunNormalized.b * 0.4))
    };

    // 2. Highlight / Specular: High glint reflecting direct light source
    let highlightRgb = {
      r: ColorMath.clamp255(localRgb.r * 0.22 + sunColor.r * 0.68 + 32),
      g: ColorMath.clamp255(localRgb.g * 0.22 + sunColor.g * 0.68 + 32),
      b: ColorMath.clamp255(localRgb.b * 0.22 + sunColor.b * 0.68 + 32)
    };

    // 3. Terminator with Subsurface Scattering (SSS):
    // Peak saturation band where light grazes the surface
    const targetWarmHue = 25; // Warm Rayleigh scatter angle
    const hueDiff = ((targetWarmHue - localHsv.h + 540) % 360) - 180;
    const termHue = (localHsv.h + hueDiff * 0.18 + 360) % 360;
    const sssBoost = 1.15 + this.state.sssIntensity * 0.55;
    const termSat = Math.min(1.0, localHsv.s * sssBoost);
    const termVal = Math.max(0.18, localHsv.v * (0.75 + this.state.sssIntensity * 0.1));
    let terminatorRgb = ColorMath.hsvToRgb(termHue, termSat, termVal);

    // 4. Form / Cast Shadow: Lit by sky dome + ground bounce terrain
    const groundBounceRgb = this.getGroundBounceColor();
    const bounceW = this.state.bounceIntensity;
    const shadowLight = {
      r: skyColor.r * (1 - bounceW) + groundBounceRgb.r * bounceW,
      g: skyColor.g * (1 - bounceW) + groundBounceRgb.g * bounceW,
      b: skyColor.b * (1 - bounceW) + groundBounceRgb.b * bounceW
    };
    const maxShad = Math.max(shadowLight.r, shadowLight.g, shadowLight.b, 1);
    const shadFactor = 0.58;
    const shadowF = {
      r: (shadowLight.r / maxShad) * shadFactor,
      g: (shadowLight.g / maxShad) * shadFactor,
      b: (shadowLight.b / maxShad) * shadFactor
    };
    let shadowRgb = {
      r: ColorMath.clamp255(localRgb.r * shadowF.r),
      g: ColorMath.clamp255(localRgb.g * shadowF.g),
      b: ColorMath.clamp255(localRgb.b * shadowF.b)
    };

    // 5. Ambient Occlusion (Crevices where ambient light cannot reach)
    let occlusionRgb = {
      r: ColorMath.clamp255(shadowRgb.r * 0.35),
      g: ColorMath.clamp255(shadowRgb.g * 0.35),
      b: ColorMath.clamp255(shadowRgb.b * 0.35)
    };

    // 6. Apply Purkinje Effect if active or night
    if (this.state.purkinjeShift || isNight) {
      shadowRgb = this.applyPurkinje(shadowRgb);
      occlusionRgb = this.applyPurkinje(occlusionRgb);
    }

    // 7. Apply Aerial Haze (Distance perspective fading)
    if (this.state.aerialHaze > 0) {
      highlightRgb = this.applyAerialHaze(highlightRgb, this.state.aerialHaze * 0.2);
      directLightRgb = this.applyAerialHaze(directLightRgb, this.state.aerialHaze * 0.35);
      terminatorRgb = this.applyAerialHaze(terminatorRgb, this.state.aerialHaze * 0.45);
      shadowRgb = this.applyAerialHaze(shadowRgb, this.state.aerialHaze * 0.7);
      occlusionRgb = this.applyAerialHaze(occlusionRgb, this.state.aerialHaze * 0.5);
    }

    // 8. Apply Global Tint / Glaze Studio
    if (this.state.tintEnabled && this.state.tintAmount > 0) {
      const tCol = this.state.tintRgb;
      const tAmt = this.state.tintAmount;
      const tMode = this.state.tintBlendMode;
      const tTarget = this.state.tintTarget;
      const tSecCol = this.state.tintSecondaryRgb;

      if (tTarget === 'all') {
        highlightRgb = this.blendTint(highlightRgb, tCol, tAmt, tMode);
        directLightRgb = this.blendTint(directLightRgb, tCol, tAmt, tMode);
        terminatorRgb = this.blendTint(terminatorRgb, tCol, tAmt, tMode);
        shadowRgb = this.blendTint(shadowRgb, tCol, tAmt, tMode);
        occlusionRgb = this.blendTint(occlusionRgb, tCol, tAmt, tMode);
      } else if (tTarget === 'highlights') {
        highlightRgb = this.blendTint(highlightRgb, tCol, tAmt, tMode);
        directLightRgb = this.blendTint(directLightRgb, tCol, tAmt, tMode);
        terminatorRgb = this.blendTint(terminatorRgb, tCol, tAmt * 0.5, tMode);
      } else if (tTarget === 'shadows') {
        terminatorRgb = this.blendTint(terminatorRgb, tCol, tAmt * 0.5, tMode);
        shadowRgb = this.blendTint(shadowRgb, tCol, tAmt, tMode);
        occlusionRgb = this.blendTint(occlusionRgb, tCol, tAmt, tMode);
      } else if (tTarget === 'split') {
        // Warm lights + Cool shadows
        highlightRgb = this.blendTint(highlightRgb, tCol, tAmt, tMode);
        directLightRgb = this.blendTint(directLightRgb, tCol, tAmt, tMode);
        shadowRgb = this.blendTint(shadowRgb, tSecCol, tAmt, tMode);
        occlusionRgb = this.blendTint(occlusionRgb, tSecCol, tAmt, tMode);
      }
    }

    // 9. Blend with pure studio local color based on master intensity
    const blendWithIntensity = (rgb) => ({
      r: ColorMath.clamp255(localRgb.r * (1 - masterIntensity) + rgb.r * masterIntensity),
      g: ColorMath.clamp255(localRgb.g * (1 - masterIntensity) + rgb.g * masterIntensity),
      b: ColorMath.clamp255(localRgb.b * (1 - masterIntensity) + rgb.b * masterIntensity)
    });

    directLightRgb = blendWithIntensity(directLightRgb);
    highlightRgb = blendWithIntensity(highlightRgb);
    terminatorRgb = blendWithIntensity(terminatorRgb);
    shadowRgb = blendWithIntensity(shadowRgb);
    occlusionRgb = blendWithIntensity(occlusionRgb);

    return {
      local: {
        id: 'local',
        name: 'Color Local',
        rgb: localRgb,
        hex: ColorMath.rgbToHex(localRgb.r, localRgb.g, localRgb.b),
        desc: 'El color intrínseco del objeto bajo iluminación neutra de estudio.'
      },
      highlight: {
        id: 'highlight',
        name: 'Brillo Especular',
        rgb: highlightRgb,
        hex: ColorMath.rgbToHex(highlightRgb.r, highlightRgb.g, highlightRgb.b),
        desc: `Reflejo directo del sol/fuente (${this.state.sunTempK}K).`
      },
      directLight: {
        id: 'directLight',
        name: 'Luz Directa',
        rgb: directLightRgb,
        hex: ColorMath.rgbToHex(directLightRgb.r, directLightRgb.g, directLightRgb.b),
        desc: 'Color afectado por fotones solares directos con balance atmosférico.'
      },
      terminator: {
        id: 'terminator',
        name: 'Terminador (Banda SSS)',
        rgb: terminatorRgb,
        hex: ColorMath.rgbToHex(terminatorRgb.r, terminatorRgb.g, terminatorRgb.b),
        desc: 'Frontera luz-sombra: pico de saturación por dispersión subsuperficial.'
      },
      shadow: {
        id: 'shadow',
        name: 'Sombra Propia (Cielo)',
        rgb: shadowRgb,
        hex: ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b),
        desc: `Teñida por el domo celeste (${this.state.skyAmbientHue}°) y rebote de ${this.TERRAIN_TYPES[this.state.groundType]?.name || 'suelo'}.`
      },
      occlusion: {
        id: 'occlusion',
        name: 'Oclusión Ambiental',
        rgb: occlusionRgb,
        hex: ColorMath.rgbToHex(occlusionRgb.r, occlusionRgb.g, occlusionRgb.b),
        desc: 'Grietas y pliegues donde la luz ambiental apenas penetra.'
      }
    };
  },

  calculateShadowPhysics(localRgb) {
    return this.calculateLightingStages(localRgb);
  },

  // Purkinje Shift: In dim light, human rod cells shift sensitivity toward green/blue (~505 nm)
  applyPurkinje(rgb) {
    const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
    const r = rgb.r * 0.45;
    const g = rgb.g * 0.95;
    const b = Math.min(255, rgb.b * 1.35 + 20);
    const gray = (r * 0.15 + g * 0.55 + b * 0.3);
    const blend = ColorMath.clamp(1 - lum * 2, 0, 0.7);

    return {
      r: ColorMath.clamp255(r * (1 - blend) + (gray * 0.7) * blend),
      g: ColorMath.clamp255(g * (1 - blend) + (gray * 0.9) * blend),
      b: ColorMath.clamp255(b * (1 - blend) + (gray * 1.25) * blend)
    };
  },

  // Apply Atmospheric Aerial Haze / Distance Fading
  applyAerialHaze(rgb, distance = this.state.aerialHaze) {
    if (distance <= 0) return rgb;
    const haze = this.state.aerialHazeColor;
    const f = ColorMath.clamp(distance, 0, 0.85);
    return {
      r: ColorMath.clamp255(rgb.r * (1 - f) + haze.r * f),
      g: ColorMath.clamp255(rgb.g * (1 - f) + haze.g * f),
      b: ColorMath.clamp255(rgb.b * (1 - f) + haze.b * f)
    };
  },

  // Blend Tint using Artistic & Photographic Blend Modes
  blendTint(baseRgb, tintRgb, amount, blendMode = 'soft_light') {
    if (!tintRgb || amount <= 0) return { ...baseRgb };
    const f = ColorMath.clamp(amount, 0, 1);
    const br = baseRgb.r / 255;
    const bg = baseRgb.g / 255;
    const bb = baseRgb.b / 255;
    const tr = tintRgb.r / 255;
    const tg = tintRgb.g / 255;
    const tb = tintRgb.b / 255;

    let resR, resG, resB;

    switch (blendMode) {
      case 'multiply':
        // Subtractive physical gel / oil glaze
        resR = br * tr;
        resG = bg * tg;
        resB = bb * tb;
        break;
      case 'screen':
        // Additive volumetric fog / glow
        resR = 1 - (1 - br) * (1 - tr);
        resG = 1 - (1 - bg) * (1 - tg);
        resB = 1 - (1 - bb) * (1 - tb);
        break;
      case 'overlay':
        resR = br < 0.5 ? (2 * br * tr) : (1 - 2 * (1 - br) * (1 - tr));
        resG = bg < 0.5 ? (2 * bg * tg) : (1 - 2 * (1 - bg) * (1 - tg));
        resB = bb < 0.5 ? (2 * bb * tb) : (1 - 2 * (1 - bb) * (1 - tb));
        break;
      case 'color':
        // Preserves base luminance, transfers tint hue and saturation
        const baseHsv = ColorMath.rgbToHsv(baseRgb.r, baseRgb.g, baseRgb.b);
        const tintHsv = ColorMath.rgbToHsv(tintRgb.r, tintRgb.g, tintRgb.b);
        const colRgb = ColorMath.hsvToRgb(tintHsv.h, Math.max(baseHsv.s, tintHsv.s * 0.7), baseHsv.v);
        resR = colRgb.r / 255;
        resG = colRgb.g / 255;
        resB = colRgb.b / 255;
        break;
      case 'soft_light':
      default:
        // Smooth artistic photographic toning
        const sl = (b, t) => (1 - 2 * t) * (b * b) + 2 * t * b;
        resR = sl(br, tr);
        resG = sl(bg, tg);
        resB = sl(bb, tb);
        break;
    }

    return {
      r: ColorMath.clamp255((br * (1 - f) + resR * f) * 255),
      g: ColorMath.clamp255((bg * (1 - f) + resG * f) * 255),
      b: ColorMath.clamp255((bb * (1 - f) + resB * f) * 255)
    };
  },

  // Master Color Transformer: converts any input RGB using the active atmosphere engine
  transformColor(baseRgb) {
    if (!this.state.enabled) return baseRgb;
    const stages = this.calculateLightingStages(baseRgb);
    return stages.directLight.rgb;
  },

  /**
   * Generates continuous Atmospheric Sky Dome Gradient stops:
   * 1. Zenith (Deep sky dome)
   * 2. Mid-Sky
   * 3. Horizon (Rayleigh scattering glow)
   * 4. Ground Bounce / Terrain
   */
  getAtmosphereGradient() {
    const { sunColor, skyColor, isNight } = this.getSunAndSkyColors();
    const groundRgb = this.getGroundBounceColor();
    const t = this.state.timeOfDay;

    // Horizon color: warm orange/gold at sunrise/sunset, pale cyan/white at noon, deep indigo at night
    let horizonRgb;
    if (isNight) {
      horizonRgb = { r: 18, g: 25, b: 42 };
    } else {
      const sunsetFactor = Math.pow(Math.cos(((t - 12) / 12) * Math.PI), 2);
      horizonRgb = {
        r: ColorMath.clamp255(sunColor.r * 0.8 + 40),
        g: ColorMath.clamp255(sunColor.g * 0.6 + skyColor.g * 0.3),
        b: ColorMath.clamp255(skyColor.b * 0.75 + 20)
      };
    }

    const zenithHex = ColorMath.rgbToHex(skyColor.r, skyColor.g, skyColor.b);
    const horizonHex = ColorMath.rgbToHex(horizonRgb.r, horizonRgb.g, horizonRgb.b);
    const sunHex = ColorMath.rgbToHex(sunColor.r, sunColor.g, sunColor.b);
    const groundHex = ColorMath.rgbToHex(groundRgb.r, groundRgb.g, groundRgb.b);

    return {
      zenith: { rgb: skyColor, hex: zenithHex, label: 'Zenith Domo' },
      horizon: { rgb: horizonRgb, hex: horizonHex, label: 'Horizonte Rayleigh' },
      sun: { rgb: sunColor, hex: sunHex, label: isNight ? 'Luna Llena' : 'Sol Directo' },
      ground: { rgb: groundRgb, hex: groundHex, label: this.TERRAIN_TYPES[this.state.groundType]?.name || 'Terreno' },
      cssGradient: `linear-gradient(180deg, ${zenithHex} 0%, ${horizonHex} 52%, ${groundHex} 100%)`
    };
  },

  /**
   * Renders an interactive, physically-lit 3D sphere on a Canvas.
   * Shows highlight, direct light, SSS terminator ring, sky shadow, and ground bounce in real-time.
   */
  renderSphere(canvas, localRgb) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.42;

    ctx.clearRect(0, 0, width, height);

    // Background atmospheric vignette
    const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, width * 0.7);
    const atmoGrad = this.getAtmosphereGradient();
    bgGrad.addColorStop(0, 'rgba(18, 20, 29, 0.95)');
    bgGrad.addColorStop(1, 'rgba(10, 11, 16, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Compute stages
    const stages = this.calculateLightingStages(localRgb);
    const { sunIntensity, isNight } = this.getSunAndSkyColors();

    // Solar vector in 3D: elevation and azimuth
    const azimDeg = (this.state.sunAzimuth !== undefined && this.state.sunAzimuth !== null) 
      ? this.state.sunAzimuth 
      : (((this.state.timeOfDay - 6) / 12) * 180 + 360) % 360;
    const elevDeg = (this.state.sunElevation !== undefined && this.state.sunElevation !== null) 
      ? this.state.sunElevation 
      : Math.max(8, Math.sin(((this.state.timeOfDay - 6) / 12) * Math.PI) * 75);
    
    const azimRad = azimDeg * (Math.PI / 180);
    const elevRad = Math.max(0.05, elevDeg * (Math.PI / 180));
    
    // Light direction pointing towards center of sphere
    const lx = -Math.cos(elevRad) * Math.cos(azimRad);
    const ly = -Math.sin(elevRad);
    const lz = Math.cos(elevRad) * Math.sin(azimRad) * 0.5 + 0.5;
    const lenL = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    const L = [lx / lenL, ly / lenL, lz / lenL];

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const rsq = radius * radius;
    const locR = localRgb.r;
    const locG = localRgb.g;
    const locB = localRgb.b;

    const hlR = stages.highlight.rgb.r;
    const hlG = stages.highlight.rgb.g;
    const hlB = stages.highlight.rgb.b;

    const dlR = stages.directLight.rgb.r;
    const dlG = stages.directLight.rgb.g;
    const dlB = stages.directLight.rgb.b;

    const termR = stages.terminator.rgb.r;
    const termG = stages.terminator.rgb.g;
    const termB = stages.terminator.rgb.b;

    const shR = stages.shadow.rgb.r;
    const shG = stages.shadow.rgb.g;
    const shB = stages.shadow.rgb.b;

    const occR = stages.occlusion.rgb.r;
    const occG = stages.occlusion.rgb.g;
    const occB = stages.occlusion.rgb.b;

    for (let py = 0; py < height; py++) {
      const dy = py - cy;
      for (let px = 0; px < width; px++) {
        const dx = px - cx;
        const distSq = dx * dx + dy * dy;

        if (distSq <= rsq) {
          const dz = Math.sqrt(Math.max(0, rsq - distSq));
          const nx = dx / radius;
          const ny = dy / radius;
          const nz = dz / radius;

          // Dot product N . L (Lambertian diffuse)
          const nDotL = nx * L[0] + ny * L[1] + nz * L[2];

          // Specular reflection R = 2(N.L)N - L, Dot with View V=(0,0,1)
          const rx = 2 * nDotL * nx - L[0];
          const ry = 2 * nDotL * ny - L[1];
          const rz = 2 * nDotL * nz - L[2];
          const spec = Math.pow(Math.max(0, rz), 24);

          // SSS Terminator factor: peaks when nDotL is near 0 (-0.2 to +0.25)
          const sssFactor = Math.exp(-Math.pow(nDotL - 0.05, 2) / 0.08) * this.state.sssIntensity;

          // Sky ambient (top hemispherical fill from +ny)
          const skyFactor = Math.max(0, -ny) * 0.35;

          // Ground bounce (bottom reflection from -ny)
          const bounceFactor = Math.max(0, ny) * this.state.bounceIntensity * 0.7;

          // Base shading interpolation
          let pr, pg, pb;
          if (nDotL > 0) {
            // Lit side: blend from terminator to direct light + specular
            const t = Math.min(1, nDotL * 1.4);
            pr = termR * (1 - t) + dlR * t;
            pg = termG * (1 - t) + dlG * t;
            pb = termB * (1 - t) + dlB * t;

            // Add specular highlight
            pr += (hlR - dlR) * spec;
            pg += (hlG - dlG) * spec;
            pb += (hlB - dlB) * spec;
          } else {
            // Shadow side: blend from terminator to ambient shadow + ground bounce
            const t = Math.min(1, -nDotL * 1.5);
            pr = termR * (1 - t) + shR * t;
            pg = termG * (1 - t) + shG * t;
            pb = termB * (1 - t) + shB * t;

            // Ambient occlusion on bottom rim contact
            if (ny > 0.6) {
              const occW = (ny - 0.6) / 0.4;
              pr = pr * (1 - occW) + occR * occW;
              pg = pg * (1 - occW) + occG * occW;
              pb = pb * (1 - occW) + occB * occW;
            }
          }

          // Inject SSS chromatic glow
          if (sssFactor > 0.05) {
            pr = pr * (1 - sssFactor) + termR * sssFactor;
            pg = pg * (1 - sssFactor) + termG * sssFactor;
            pb = pb * (1 - sssFactor) + termB * sssFactor;
          }

          // Ground bounce rim injection
          if (bounceFactor > 0.05) {
            const gb = stages.shadow.rgb;
            pr = pr * (1 - bounceFactor) + gb.r * bounceFactor;
            pg = pg * (1 - bounceFactor) + gb.g * bounceFactor;
            pb = pb * (1 - bounceFactor) + gb.b * bounceFactor;
          }

          const idx = (py * width + px) * 4;
          data[idx] = ColorMath.clamp255(pr);
          data[idx + 1] = ColorMath.clamp255(pg);
          data[idx + 2] = ColorMath.clamp255(pb);
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw soft contact shadow under sphere
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.98, radius * 0.75, radius * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.filter = 'blur(6px)';
    ctx.fill();
    ctx.restore();

    // Draw light direction vector guide ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Light origin indicator dot
    const sunDotX = cx + L[0] * (radius + 12);
    const sunDotY = cy + L[1] * (radius + 12);
    ctx.beginPath();
    ctx.arc(sunDotX, sunDotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = stages.highlight.hex;
    ctx.shadowColor = stages.highlight.hex;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
};
