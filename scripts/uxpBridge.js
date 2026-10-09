/**
 * GOM Picker - Photoshop UXP / CEP Integration Bridge
 * Connects directly to Adobe Photoshop's internal APIs when running as a UXP Plugin panel,
 * falls back gracefully to CEP (CSInterface) or Standalone Web application mode.
 */

export const UXPBridge = {
  isUXP: false,
  isCEP: false,
  psApp: null,

  init() {
    try {
      // Check for Adobe Photoshop UXP environment
      if (typeof window !== 'undefined' && typeof window.require === 'function') {
        const photoshop = window.require('photoshop');
        if (photoshop && photoshop.app) {
          this.isUXP = true;
          this.psApp = photoshop.app;
          console.log('[GOM Picker] Conectado a Adobe Photoshop vía UXP');
          this._setupUXPListeners();
          return;
        }
      }
    } catch (e) {
      // Not UXP
    }

    // Check for Adobe CEP environment
    if (typeof window !== 'undefined' && window.__adobe_cep__) {
      this.isCEP = true;
      console.log('[GOM Picker] Conectado a Adobe Photoshop vía CEP');
      return;
    }

    console.log('[GOM Picker] Modo Standalone Activo (Web / PWA / Companion Window)');
  },

  // Set Photoshop foreground color
  async setForegroundColor(r, g, b) {
    if (this.isUXP && this.psApp) {
      try {
        const photoshop = window.require('photoshop');
        await photoshop.core.executeAsModal(async () => {
          const sColor = new this.psApp.SolidColor();
          sColor.rgb.red = r;
          sColor.rgb.green = g;
          sColor.rgb.blue = b;
          this.psApp.foregroundColor = sColor;
        }, { commandName: 'GOM Picker: Color Frontal' });
        return true;
      } catch (err) {
        console.error('[GOM UXP Error] setForegroundColor', err);
      }
    } else if (this.isCEP && window.__adobe_cep__) {
      const script = `var c = new SolidColor(); c.rgb.red = ${r}; c.rgb.green = ${g}; c.rgb.blue = ${b}; app.foregroundColor = c;`;
      window.__adobe_cep__.evalScript(script);
      return true;
    }

    // Standalone fallback: notify console / event
    window.dispatchEvent(new CustomEvent('gom:ps_color_change', {
      detail: { type: 'foreground', r, g, b }
    }));
    return false;
  },

  // Set Photoshop background color
  async setBackgroundColor(r, g, b) {
    if (this.isUXP && this.psApp) {
      try {
        const photoshop = window.require('photoshop');
        await photoshop.core.executeAsModal(async () => {
          const sColor = new this.psApp.SolidColor();
          sColor.rgb.red = r;
          sColor.rgb.green = g;
          sColor.rgb.blue = b;
          this.psApp.backgroundColor = sColor;
        }, { commandName: 'GOM Picker: Color Fondo' });
        return true;
      } catch (err) {
        console.error('[GOM UXP Error] setBackgroundColor', err);
      }
    } else if (this.isCEP && window.__adobe_cep__) {
      const script = `var c = new SolidColor(); c.rgb.red = ${r}; c.rgb.green = ${g}; c.rgb.blue = ${b}; app.backgroundColor = c;`;
      window.__adobe_cep__.evalScript(script);
      return true;
    }

    window.dispatchEvent(new CustomEvent('gom:ps_color_change', {
      detail: { type: 'background', r, g, b }
    }));
    return false;
  },

  // Listen to external color changes from Photoshop if inside UXP
  _setupUXPListeners() {
    try {
      const photoshop = window.require('photoshop');
      photoshop.action.addNotificationListener(['select'], (event, descriptor) => {
        // Handle external color selection sync
      });
    } catch (e) {
      // Notification listener optional
    }
  }
};
