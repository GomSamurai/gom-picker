/**
 * GOM Picker - Artist Profile Backup & Restore System
 * 1-click full JSON profile export and import.
 * Backs up all custom user palettes, master catalogs, color history,
 * AI configuration keys, and studio preferences across machines and Photoshop UXP.
 */

export const ProfileBackup = {
  // Export all application studio data as a downloadable JSON file
  exportBackup(app) {
    const data = {
      app: 'GOM Color Picker Pro',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      author: 'Fran Gómez',
      palettes: [],
      masterCatalogs: [],
      history: [],
      settings: {}
    };

    // 1. User Palettes
    try {
      const pRaw = localStorage.getItem('gom_user_palettes') || localStorage.getItem('gom_palettes_v2');
      if (pRaw) data.palettes = JSON.parse(pRaw);
    } catch (e) {
      console.warn('[ProfileBackup] Error leyendo paletas:', e);
    }

    // 2. Custom Master Catalogs
    try {
      const cRaw = localStorage.getItem('gom_custom_master_catalogs');
      if (cRaw) data.masterCatalogs = JSON.parse(cRaw);
    } catch (e) {
      console.warn('[ProfileBackup] Error leyendo catálogos:', e);
    }

    // 3. Color History
    try {
      const hRaw = localStorage.getItem('gom_color_history');
      if (hRaw) data.history = JSON.parse(hRaw);
    } catch (e) {
      console.warn('[ProfileBackup] Error leyendo historial:', e);
    }

    // 4. Studio Settings
    data.settings = {
      wheelMode: localStorage.getItem('gom_wheel_mode') || 'triangle',
      activeTab: localStorage.getItem('gom_active_tab') || 'studio',
      popupsEnabled: localStorage.getItem('gom_swatch_popups_enabled') !== 'false',
      aiProvider: localStorage.getItem('gom_ai_provider') || 'local',
      aiApiKey: localStorage.getItem('gom_ai_api_key') || ''
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `gom_picker_backup_${dateStr}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);

    if (app && app.showToast) {
      app.showToast('✓ Copia de seguridad exportada con éxito', 'success');
    }
  },

  // Import JSON profile backup and restore all data
  async importBackup(file, app) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.app && !data.palettes) {
        throw new Error('Archivo de copia de seguridad no válido o dañado.');
      }

      let restoredItemsCount = 0;

      // 1. Restore User Palettes
      if (Array.isArray(data.palettes) && data.palettes.length > 0) {
        const existingRaw = localStorage.getItem('gom_user_palettes') || '[]';
        let existing = [];
        try { existing = JSON.parse(existingRaw); } catch (_) {}
        
        // Merge without duplicate IDs
        const existingIds = new Set(existing.map(p => p.id));
        data.palettes.forEach(p => {
          if (!existingIds.has(p.id)) {
            existing.unshift(p);
            restoredItemsCount++;
          }
        });
        localStorage.setItem('gom_user_palettes', JSON.stringify(existing));
        localStorage.setItem('gom_palettes_v2', JSON.stringify(existing));
      }

      // 2. Restore Master Catalogs
      if (Array.isArray(data.masterCatalogs) && data.masterCatalogs.length > 0) {
        localStorage.setItem('gom_custom_master_catalogs', JSON.stringify(data.masterCatalogs));
      }

      // 3. Restore History
      if (Array.isArray(data.history) && data.history.length > 0) {
        localStorage.setItem('gom_color_history', JSON.stringify(data.history));
      }

      // 4. Restore Settings
      if (data.settings) {
        if (data.settings.wheelMode) localStorage.setItem('gom_wheel_mode', data.settings.wheelMode);
        if (data.settings.aiProvider) localStorage.setItem('gom_ai_provider', data.settings.aiProvider);
        if (data.settings.aiApiKey) localStorage.setItem('gom_ai_api_key', data.settings.aiApiKey);
      }

      // Trigger app UI reloads
      if (app) {
        if (typeof app.renderSwatchesCollection === 'function') app.renderSwatchesCollection();
        if (typeof app.renderQuickPalette === 'function') app.renderQuickPalette();
        if (typeof app.renderHistoryRibbon === 'function') app.renderHistoryRibbon();
        if (app.aiChat && typeof app.aiChat._bindConfigModal === 'function') {
          app.aiChat.provider = data.settings?.aiProvider || 'local';
          app.aiChat.apiKey = data.settings?.aiApiKey || '';
          app.aiChat._updateProviderBadge();
        }
        if (app.showToast) {
          app.showToast(`✓ Perfil restaurado con éxito (+${restoredItemsCount} paletas)`, 'success');
        }
      }

      return true;
    } catch (err) {
      console.error('[ProfileBackup] Error importando perfil:', err);
      if (app && app.showToast) {
        app.showToast(`Error al importar: ${err.message}`, 'error');
      }
      return false;
    }
  }
};
