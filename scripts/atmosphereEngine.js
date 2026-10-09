/**
 * GOM Picker - Atmospheric Light, Time of Day & Shadow Physics Engine
 * Implements scientific lighting transformations for digital artists:
 * - Time of Day chromatic shifts (Dawn, Noon, Golden Hour, Blue Hour, Moonlight)
 * - Scientific shadow calculation (Skylight fill, Ambient bounce, Terminator SSS boost)
 * - Purkinje Effect (scotopic human vision shift at low light)
 * - Aerial Perspective (atmospheric haze/distance fading)
 * - Gamut Masking & Tint Overlays
 */

import { ColorMath } from './colorMath.js';

export const AtmosphereEngine = {
  // Global modifier state
  state: {
    enabled: false,
    timeOfDay: 14.0, // 0.0 to 24.0 hours (14:00 = 2 PM daylight)
    sunTempK: 5500, // Kelvin (2000K sunset - 6500K noon - 10000K overcast)
    skyAmbientHue: 215, // Degrees (Blue sky ambient)
    skyAmbientSat: 0.5,
    bounceIntensity: 0.35, // Floor/environment bounce
    sssIntensity: 0.4, // Subsurface scattering / Terminator saturation boost
    purkinjeShift: false, // Night vision rod cell shift
    aerialHaze: 0.0, // 0 to 1 distance haze
    aerialHazeColor: { r: 160, g: 190, b: 230 },
    tintWashColor: null, // Custom color gel
    tintWashAmount: 0.0, // 0 to 1
    intensity: 1.0 // Master modifier strength
  },

  // Presets for Time of Day & Light Scenarios
  TIME_PRESETS: [
    {
      id: 'dawn',
      name: 'Amanecer / Aurora (06:30)',
      time: 6.5,
      sunTempK: 3200,
      skyHue: 240,
      skySat: 0.6,
      bounce: 0.2,
      sss: 0.6,
      description: 'Luz rasante cálida rosada con cielo añil profundo y sombras frías translúcidas.'
    },
    {
      id: 'noon',
      name: 'Mediodía Solar (12:00)',
      time: 12.0,
      sunTempK: 5800,
      skyHue: 210,
      skySat: 0.7,
      bounce: 0.45,
      sss: 0.3,
      description: 'Luz directa cenital neutra intensa; sombras recortadas dominadas por el azul del cielo.'
    },
    {
      id: 'golden_hour',
      name: 'Golden Hour (18:45)',
      time: 18.75,
      sunTempK: 2600,
      skyHue: 260,
      skySat: 0.65,
      bounce: 0.5,
      sss: 0.85,
      description: 'Sol ámbar/naranja rasante con saturación máxima en el terminador y sombras violetas.'
    },
    {
      id: 'blue_hour',
      name: 'Hora Azul / Crepúsculo (20:00)',
      time: 20.0,
      sunTempK: 4000,
      skyHue: 225,
      skySat: 0.85,
      bounce: 0.25,
      sss: 0.2,
      description: 'El sol ha caído tras el horizonte. El domo celeste azul cobalto ilumina la totalidad de la escena.'
    },
    {
      id: 'moonlight',
      name: 'Noche de Luna Llena (00:30)',
      time: 0.5,
      sunTempK: 4500,
      skyHue: 220,
      skySat: 0.4,
      bounce: 0.15,
      sss: 0.1,
      purkinje: true,
      description: 'Baja luminancia escotópica: efecto Purkinje que apaga los rojos y resalta verdes/azules gélidos.'
    },
    {
      id: 'overcast',
      name: 'Día Nublado / Difuso (14:00)',
      time: 14.0,
      sunTempK: 7200,
      skyHue: 210,
      skySat: 0.15,
      bounce: 0.5,
      sss: 0.2,
      description: 'Gran caja de luz difusa suave; sombras apenas perceptibles de oclusión ambiental.'
    }
  ],

  // Convert Color Temperature in Kelvin (1000K - 12000K) to approximate RGB
  kelvinToRgb(kelvin) {
    const temp = kelvin / 100;
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

  // Calculate Sun and Sky color for current state
  getSunAndSkyColors() {
    const isNight = (this.state.timeOfDay < 5.5 || this.state.timeOfDay > 21.0);
    const sunRgb = isNight 
      ? { r: 215, g: 228, b: 248 } // Silvery moon
      : this.kelvinToRgb(this.state.sunTempK);
    const skyRgb = ColorMath.hsvToRgb(this.state.skyAmbientHue, this.state.skyAmbientSat, 0.9);

    let sunAltitude = Math.sin(((this.state.timeOfDay - 6) / 13) * Math.PI);
    if (sunAltitude < 0) sunAltitude = 0;

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
      sunIntensity: isNight ? 0.4 : sunAltitude,
      skyColor: skyRgb,
      filterF,
      isNight
    };
  },

  /**
   * Scientific Calculation of Shading Stages for a given local color:
   * 1. Color Local (Neutro)
   * 2. Brillo Especular (Reflejo del sol/fuente directa)
   * 3. Luz Directa (Color afectado por fotones directos con compensación de exposición)
   * 4. Terminador con SSS (Dispersión subsuperficial, pico cromático de saturación)
   * 5. Sombra Propia (Domo celeste + rebote térmico del suelo)
   * 6. Oclusión Ambiental (Grietas y hendiduras profundas)
   */
  calculateLightingStages(localRgb) {
    const { sunColor, skyColor, filterF, isNight } = this.getSunAndSkyColors();
    const localHsv = ColorMath.rgbToHsv(localRgb.r, localRgb.g, localRgb.b);

    // 1. Direct Light stage: Local color lit by normalized atmospheric illuminant
    const directLightRgb = {
      r: ColorMath.clamp255(localRgb.r * filterF.r),
      g: ColorMath.clamp255(localRgb.g * filterF.g),
      b: ColorMath.clamp255(localRgb.b * filterF.b)
    };

    // 2. Highlight / Specular: High glint reflecting direct light source
    const highlightRgb = {
      r: ColorMath.clamp255(localRgb.r * 0.25 + sunColor.r * 0.65 + 38),
      g: ColorMath.clamp255(localRgb.g * 0.25 + sunColor.g * 0.65 + 38),
      b: ColorMath.clamp255(localRgb.b * 0.25 + sunColor.b * 0.65 + 38)
    };

    // 3. Terminator with Subsurface Scattering (SSS):
    // Peak saturation band where light grazes the surface
    const targetWarmHue = 25;
    const hueDiff = ((targetWarmHue - localHsv.h + 540) % 360) - 180;
    const termHue = (localHsv.h + hueDiff * 0.15 + 360) % 360;
    const termSat = Math.min(1.0, localHsv.s * (1.15 + this.state.sssIntensity * 0.4));
    const termVal = Math.max(0.18, localHsv.v * 0.78);
    const terminatorRgb = ColorMath.hsvToRgb(termHue, termSat, termVal);

    // 4. Form / Cast Shadow: Lit by sky dome + warm ground bounce
    const groundBounceRgb = { r: 215, g: 165, b: 120 };
    const bounceW = this.state.bounceIntensity;
    const shadowLight = {
      r: skyColor.r * (1 - bounceW) + groundBounceRgb.r * bounceW,
      g: skyColor.g * (1 - bounceW) + groundBounceRgb.g * bounceW,
      b: skyColor.b * (1 - bounceW) + groundBounceRgb.b * bounceW
    };
    const maxShad = Math.max(shadowLight.r, shadowLight.g, shadowLight.b, 1);
    const shadFactor = 0.55;
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

    // 5. Ambient Occlusion (Crevices where even skylight cannot reach)
    let occlusionRgb = {
      r: ColorMath.clamp255(shadowRgb.r * 0.32),
      g: ColorMath.clamp255(shadowRgb.g * 0.32),
      b: ColorMath.clamp255(shadowRgb.b * 0.32)
    };

    // Apply Purkinje Effect if active or night
    if (this.state.purkinjeShift || isNight) {
      shadowRgb = this.applyPurkinje(shadowRgb);
      occlusionRgb = this.applyPurkinje(occlusionRgb);
    }

    return {
      local: {
        name: 'Color Local',
        rgb: localRgb,
        hex: ColorMath.rgbToHex(localRgb.r, localRgb.g, localRgb.b),
        desc: 'El color intrínseco del objeto bajo iluminación neutra de estudio.'
      },
      highlight: {
        name: 'Brillo Especular',
        rgb: highlightRgb,
        hex: ColorMath.rgbToHex(highlightRgb.r, highlightRgb.g, highlightRgb.b),
        desc: 'Reflejo de la fuente de luz directa sobre el material.'
      },
      directLight: {
        name: 'Luz Directa',
        rgb: directLightRgb,
        hex: ColorMath.rgbToHex(directLightRgb.r, directLightRgb.g, directLightRgb.b),
        desc: 'Color afectado por los fotones directos del sol o fuente principal.'
      },
      terminator: {
        name: 'Terminador (Banda SSS)',
        rgb: terminatorRgb,
        hex: ColorMath.rgbToHex(terminatorRgb.r, terminatorRgb.g, terminatorRgb.b),
        desc: 'Frontera de transición luz-sombra: pico de saturación por dispersión subsuperficial.'
      },
      shadow: {
        name: 'Sombra Propia (Cielo)',
        rgb: shadowRgb,
        hex: ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b),
        desc: 'Área no expuesta al sol; teñida por el color del domo celeste y el rebote del suelo.'
      },
      occlusion: {
        name: 'Oclusión Ambiental',
        rgb: occlusionRgb,
        hex: ColorMath.rgbToHex(occlusionRgb.r, occlusionRgb.g, occlusionRgb.b),
        desc: 'Grietas y puntos de contacto donde ningún fotón ambiental puede penetrar.'
      }
    };
  },

  // Purkinje Shift: In dim light, human rod cells shift sensitivity toward green/blue (~505 nm)
  // while red sensitivity drops drastically.
  applyPurkinje(rgb) {
    const lum = ColorMath.getLuminance(rgb.r, rgb.g, rgb.b);
    // Attenuate red, elevate blue/green relative brightness
    const r = rgb.r * 0.45;
    const g = rgb.g * 0.95;
    const b = Math.min(255, rgb.b * 1.35 + 20);
    // Blend with cool monochrome based on low luminance
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
    const f = ColorMath.clamp(distance, 0, 0.9);
    return {
      r: ColorMath.clamp255(rgb.r * (1 - f) + haze.r * f),
      g: ColorMath.clamp255(rgb.g * (1 - f) + haze.g * f),
      b: ColorMath.clamp255(rgb.b * (1 - f) + haze.b * f)
    };
  },

  // Apply Tint Gel / Color Filter
  applyTintWash(rgb, tintRgb = this.state.tintWashColor, amount = this.state.tintWashAmount) {
    if (!tintRgb || amount <= 0) return rgb;
    const f = ColorMath.clamp(amount, 0, 1);
    // Overlay / Soft light mix
    const mixChan = (base, tint) => {
      const b = base / 255;
      const t = tint / 255;
      const res = b < 0.5 ? (2 * b * t) : (1 - 2 * (1 - b) * (1 - t));
      return ColorMath.clamp255((b * (1 - f) + res * f) * 255);
    };
    return {
      r: mixChan(rgb.r, tintRgb.r),
      g: mixChan(rgb.g, tintRgb.g),
      b: mixChan(rgb.b, tintRgb.b)
    };
  },

  // Master Color Transformer: converts any input RGB using the active atmosphere engine
  transformColor(baseRgb) {
    if (!this.state.enabled) return baseRgb;

    // Calculate direct lighting stage or shadow based on overall scene factor
    const stages = this.calculateLightingStages(baseRgb);
    let result = stages.directLight.rgb;

    // Apply Purkinje shift if active
    if (this.state.purkinjeShift || this.state.timeOfDay < 5.5 || this.state.timeOfDay > 21.0) {
      result = this.applyPurkinje(result);
    }

    // Apply Aerial Haze
    if (this.state.aerialHaze > 0) {
      result = this.applyAerialHaze(result, this.state.aerialHaze);
    }

    // Apply Tint Wash
    if (this.state.tintWashAmount > 0 && this.state.tintWashColor) {
      result = this.applyTintWash(result, this.state.tintWashColor, this.state.tintWashAmount);
    }

    // Blend with original baseRgb according to master intensity
    const intensity = (typeof this.state.intensity === 'number') ? this.state.intensity : 1.0;
    return {
      r: ColorMath.clamp255(baseRgb.r * (1 - intensity) + result.r * intensity),
      g: ColorMath.clamp255(baseRgb.g * (1 - intensity) + result.g * intensity),
      b: ColorMath.clamp255(baseRgb.b * (1 - intensity) + result.b * intensity)
    };
  }
};
