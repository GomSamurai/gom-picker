/**
 * GOM Picker - AI Art Master & Color Conversation Studio
 * Hybrid Architecture: Built-in 100% Offline Academic Art Intelligence Engine
 * + Optional Cloud LLM Enhancement (Google Gemini / OpenAI compatible)
 * Includes live context awareness (active studio colors, gamut, Munsell)
 * and interactive color chip injectors.
 */

import { ColorMath } from './colorMath.js';
import { MunsellSystem } from './munsellSystem.js';

export class AIChatStudio {
  constructor(app) {
    this.app = app;
    this.messages = [];
    this.provider = (typeof localStorage !== 'undefined' ? localStorage.getItem('gom_ai_provider') : null) || 'local'; // 'local' | 'gemini' | 'openai'
    this.apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('gom_ai_api_key') : null) || '';
    this.isGenerating = false;
  }

  init() {
    this._bindUI();
    this._loadInitialGreeting();
  }

  _bindUI() {
    const chatInput = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('btnAiChatSend');
    const quickChips = document.querySelectorAll('.chat-quick-q');
    const injectActiveBtn = document.getElementById('btnChatInjectActiveColor');
    const btnConfig = document.getElementById('btnAiConfigKey');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.q || chip.textContent.trim();
        if (chatInput) chatInput.value = q;
        this.handleSendMessage();
      });
    });

    if (injectActiveBtn) {
      injectActiveBtn.addEventListener('click', () => {
        const hex = this.app.fgColor ? this.app.fgColor.hex : '#6366F1';
        const q = `¿Cómo puedo armonizar este color activo (${hex}) en mi pintura y qué tono recomiendas para sus sombras y luces?`;
        if (chatInput) chatInput.value = q;
        this.handleSendMessage();
      });
    }

    // Modal de configuración de proveedor / API Key
    this._bindConfigModal();
    this._updateProviderBadge();
  }

  _bindConfigModal() {
    const modal = document.getElementById('aiConfigModal');
    const btnOpen = document.getElementById('btnAiConfigKey');
    const btnClose = document.getElementById('btnCloseAiConfigModal');
    const btnCancel = document.getElementById('btnCancelAiConfig');
    const btnSave = document.getElementById('btnSaveAiConfig');
    const providerSelect = document.getElementById('aiProviderSelect');
    const keyField = document.getElementById('aiApiKeyField');
    const keyInput = document.getElementById('aiApiKeyInput');

    if (!modal) return;

    const open = () => {
      if (providerSelect) providerSelect.value = this.provider;
      if (keyInput) keyInput.value = this.apiKey;
      if (keyField) keyField.style.display = this.provider === 'local' ? 'none' : 'block';
      modal.style.display = 'flex';
    };

    const close = () => {
      modal.style.display = 'none';
    };

    if (btnOpen) btnOpen.onclick = open;
    if (btnClose) btnClose.onclick = close;
    if (btnCancel) btnCancel.onclick = close;

    if (providerSelect) {
      providerSelect.onchange = (e) => {
        if (keyField) {
          keyField.style.display = e.target.value === 'local' ? 'none' : 'block';
        }
      };
    }

    if (btnSave) {
      btnSave.onclick = () => {
        this.provider = providerSelect ? providerSelect.value : 'local';
        this.apiKey = keyInput ? keyInput.value.trim() : '';
        localStorage.setItem('gom_ai_provider', this.provider);
        localStorage.setItem('gom_ai_api_key', this.apiKey);
        this._updateProviderBadge();
        close();
        if (this.app && this.app.showToast) {
          const name = this.provider === 'local' ? 'Motor Experto Local' : (this.provider === 'gemini' ? 'Google Gemini AI' : 'OpenAI');
          this.app.showToast(`Proveedor configurado: ${name}`, 'success');
        }
      };
    }
  }

  _updateProviderBadge() {
    const badge = document.getElementById('aiEngineLabel');
    if (!badge) return;
    if (this.provider === 'gemini') {
      badge.textContent = 'Gemini Cloud';
      badge.style.color = '#38BDF8';
    } else if (this.provider === 'openai') {
      badge.textContent = 'OpenAI Cloud';
      badge.style.color = '#34D399';
    } else {
      badge.textContent = 'Local Offline';
      badge.style.color = '#A5B4FC';
    }
  }

  _loadInitialGreeting() {
    const container = document.getElementById('aiChatMessages');
    if (!container || this.messages.length > 0) return;

    const initial = {
      role: 'assistant',
      text: `¡Hola, maestro! Soy tu **Asesor & Crítico de Arte y Color**.
      
Puedo ayudarte a resolver cualquier duda sobre:
- **Técnicas de mezcla de pigmentos** (óleo, acrílico, acuarela, digital) y cómo evitar colores barro.
- **Armonización de tu color activo** en la rueda cromática.
- **Luz, sombras coloreadas y temperatura** (Joaquín Sorolla, Rembrandt, Velázquez, James Gurney).
- **Gamut Masking y la regla 60-30-10** para dar equilibrio a tus lienzos.

*Haz clic en cualquiera de las sugerencias rápidas abajo o escribe tu pregunta.*`
    };

    this.messages.push(initial);
    this._renderMessage(initial);
  }

  updateContextDisplay() {
    const pill = document.getElementById('chatActiveColorPill');
    const hexEl = document.getElementById('chatActiveHex');
    if (this.app && this.app.fgColor) {
      const hex = this.app.fgColor.hex;
      if (pill) pill.style.backgroundColor = hex;
      if (hexEl) hexEl.textContent = hex;
    }
  }

  async handleSendMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input || this.isGenerating) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Render user message
    const userMsg = { role: 'user', text };
    this.messages.push(userMsg);
    this._renderMessage(userMsg);

    // Scroll to bottom
    this._scrollToBottom();

    // Show thinking indicator
    this.isGenerating = true;
    const thinkingId = this._showThinkingIndicator();

    try {
      let responseText = '';
      if (this.provider === 'gemini' && this.apiKey) {
        responseText = await this._callGeminiAPI(text);
      } else if (this.provider === 'openai' && this.apiKey) {
        responseText = await this._callOpenAIAPI(text);
      } else {
        responseText = await this._generateLocalExpertResponse(text);
      }

      this._removeThinkingIndicator(thinkingId);
      const assistantMsg = { role: 'assistant', text: responseText };
      this.messages.push(assistantMsg);
      this._renderMessage(assistantMsg);
    } catch (err) {
      console.warn('[AIChatStudio] Error consultando IA en la nube, recurriendo al motor local:', err);
      this._removeThinkingIndicator(thinkingId);
      const fallbackText = await this._generateLocalExpertResponse(text);
      const fallbackMsg = {
        role: 'assistant',
        text: `*(Modo local autónomo - ${err.message || 'API no disponible'})*\n\n` + fallbackText
      };
      this.messages.push(fallbackMsg);
      this._renderMessage(fallbackMsg);
    } finally {
      this.isGenerating = false;
      this._scrollToBottom();
    }
  }

  _renderMessage(msg) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const item = document.createElement('div');
    item.className = `ai-chat-msg ai-chat-msg--${msg.role}`;

    const isUser = msg.role === 'user';
    const avatar = isUser ? '👤' : '🎨';
    const authorName = isUser ? 'Tú' : 'Maestro de Arte IA';

    // Parse Markdown basic (bold, italic, code, lists, color chips)
    const formattedHtml = this._formatMessageText(msg.text);

    item.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-msg-avatar">${avatar}</span>
        <span class="chat-msg-author">${authorName}</span>
      </div>
      <div class="chat-msg-body">
        ${formattedHtml}
      </div>
    `;

    // Bind color chips click to apply into workspace
    item.querySelectorAll('.chat-color-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = chip.dataset.hex;
        if (hex && this.app) {
          const rgb = ColorMath.hexToRgb(hex);
          this.app.setColorDirectly(rgb);
          if (this.app.showToast) {
            this.app.showToast(`Color ${hex} cargado en la Rueda Cromática`, 'success');
          }
        }
      });
    });

    container.appendChild(item);
  }

  _formatMessageText(text) {
    let out = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Lists
    out = out.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Line breaks
    out = out.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    // Convert hex color codes into interactive visual chips
    out = out.replace(/(#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}))\b/g, (match, hex) => {
      return `<button class="chat-color-chip" data-hex="${hex}" title="Click para cargar ${hex} en la rueda cromática">
        <span class="chat-chip-swatch" style="background-color: ${hex};"></span>
        <span class="chat-chip-code">${hex}</span>
        <span class="chat-chip-action">↗</span>
      </button>`;
    });

    return out;
  }

  _showThinkingIndicator() {
    const container = document.getElementById('aiChatMessages');
    if (!container) return null;
    const id = 'thinking_' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'ai-chat-msg ai-chat-msg--assistant thinking';
    el.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-msg-avatar">🎨</span>
        <span class="chat-msg-author">Maestro de Arte IA</span>
      </div>
      <div class="chat-msg-body" style="display: flex; gap: 6px; align-items: center; color: var(--text-muted); font-size: 0.78rem;">
        <span class="thinking-dot">●</span>
        <span class="thinking-dot" style="animation-delay: 0.2s;">●</span>
        <span class="thinking-dot" style="animation-delay: 0.4s;">●</span>
        <span>Analizando teoría del color y relaciones cromáticas...</span>
      </div>
    `;
    container.appendChild(el);
    return id;
  }

  _removeThinkingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  _scrollToBottom() {
    const container = document.getElementById('aiChatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // --- MOTOR EXPERTO LOCAL EN JAVASCRIPT (100% OFFLINE, ROBUSTO Y ACADÉMICO) ---

  async _generateLocalExpertResponse(userQuery) {
    // Artificial small delay for natural conversational cadence
    await new Promise(r => setTimeout(r, 450));

    const q = userQuery.toLowerCase();
    const curFg = this.app.fgColor || { r: 99, g: 102, b: 241, hex: '#6366F1' };
    const curBg = this.app.bgColor || { r: 244, g: 63, b: 94, hex: '#F43F5E' };
    const curMunsell = MunsellSystem.rgbToMunsell(curFg.r, curFg.g, curFg.b);
    const curHsv = ColorMath.rgbToHsv(curFg.r, curFg.g, curFg.b);
    const isWarm = (curHsv.h >= 0 && curHsv.h <= 75) || curHsv.h >= 320;

    // 1. Preguntas sobre armonizar el color activo
    if (/armoni|color activo|mi color|actual|este color/.test(q)) {
      const compHue = (curHsv.h + 180) % 360;
      const compRgb = ColorMath.hsvToRgb(compHue, Math.min(1, curHsv.s * 1.1), Math.max(0.2, curHsv.v * 0.9));
      const compHex = ColorMath.rgbToHex(compRgb.r, compRgb.g, compRgb.b);

      const triad1Hue = (curHsv.h + 120) % 360;
      const triad1Rgb = ColorMath.hsvToRgb(triad1Hue, curHsv.s, curHsv.v * 0.85);
      const triad1Hex = ColorMath.rgbToHex(triad1Rgb.r, triad1Rgb.g, triad1Rgb.b);

      const triad2Hue = (curHsv.h + 240) % 360;
      const triad2Rgb = ColorMath.hsvToRgb(triad2Hue, curHsv.s * 0.8, Math.min(0.95, curHsv.v * 1.1));
      const triad2Hex = ColorMath.rgbToHex(triad2Rgb.r, triad2Rgb.g, triad2Rgb.b);

      const shadowHue = isWarm ? (curHsv.h + 210) % 360 : (curHsv.h + 40) % 360;
      const shadowRgb = ColorMath.hsvToRgb(shadowHue, 0.45, 0.18);
      const shadowHex = ColorMath.rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b);

      return `Tu color activo actual es **${curFg.hex}** (Munsell: **${curMunsell.notation}**, ${isWarm ? 'tendencia cálida' : 'tendencia fría'}).

Para armonizarlo con maestría en tu obra:
- **Complementario Directo (Foco de contraste)**: Utiliza **${compHex}**. Colócalo en el centro de interés para crear máxima vibración por contraste simultáneo.
- **Tríada Clásica de Soporte**:
  - Tono secundario: **${triad1Hex}**
  - Tono de transición: **${triad2Hex}**
- **Sombra Atmosférica Recomendada**: Evita el negro puro. Usa **${shadowHex}** (${isWarm ? 'un azul crepuscular frío' : 'una tierra cálida ambarina'}) para que la sombra conserve profundidad y transparencia sin crear barro.

*Haz clic en cualquiera de los códigos de color arriba para cargarlo al instante en tu estudio.*`;
    }

    // 2. Joaquín Sorolla y la luz
    if (/sorolla|playa|luminis|mediterr[aá]neo/.test(q)) {
      return `**La técnica de Joaquín Sorolla (Luminismo Valenciano):**
Sorolla revolucionó el tratamiento de la luz solar en el exterior (*plein air*). Sus claves magistrales son:

1. **Sombras Coloreadas (Nunca negras)**: Bajo el sol mediterráneo de mediodía, las sombras sobre la arena y la piel mojada no son oscuras ni neutras; son de un violeta malva vibrante (**#8A6B94**) y azul cobalto (**#4B6B94**).
2. **Luces Altas Empastadas**: Utilizaba Blanco de Plomo/Titanio tintado con Ocre Amarillo (**#E8C87A**) y Amarillo de Cadmio (**#F7E04D**) con pinceladas cargadas que atrapan la luz física.
3. **Reflejos de Cielo en la Piel**: La piel húmeda actúa como espejo del domo celeste, incorporando toques fríos de azul cerúleo (**#6FA8DC**) en las partes orientadas hacia arriba.`;
    }

    // 3. Rembrandt y el claroscuro
    if (/rembrandt|claroscuro|tenebrismo|caravaggio/.test(q)) {
      return `**El Claroscuro de Rembrandt & Caravaggio:**
El tenebrismo no consiste simplemente en "hacer el fondo negro", sino en orquestar una **jerarquía dramática de valores tonales**:

- **Fondo Atmosférico**: Tierra de sombra tostada (**#1E1610**) y Betún de Judea (**#2B1E17**). El fondo conserva un matiz térmico cálido y transparente, no es un corte digital.
- **Transición Halftone**: Ocre Oro (**#9E6B28**) y Siena Natural (**#B87333**) con bordes perdidos (*sfumato*) para que la figura emerja de la penumbra.
- **Luz Especular Focal**: Bermellón con Blanco cálido (**#F7D08A**) aplicado con empaste grueso exclusivamente en la frente, nariz y mejilla (el famoso *triángulo de Rembrandt*).`;
    }

    // 4. Evitar colores barro ("Muddy Colors")
    if (/barro|muddy|sucio|ensuciar|mezcla limpia/.test(q)) {
      return `**Cómo evitar los Colores Barro ("Muddy Colors"):**
El "barro" aparece casi siempre por una de estas tres razones:

1. **Mezclar complementarios con el mismo valor tonal**: Cuando mezclas, por ejemplo, un rojo y un verde de igual brillo y saturación, se neutralizan en un gris apagado. Para neutralizar con elegancia, uno debe dominar en valor sobre el otro.
2. **Usar Negro para oscurecer colores cálidos**: Si añades negro al amarillo, obtendrás un verde oliva apagado y sucio. Para oscurecer el amarillo con riqueza, usa **Ocre Amarillo (#C28D32)**, **Siena Tostada (#733816)** o un toque de **Violeta Dioxazina (#4A2040)**.
3. **Mezclar demasiados pigmentos en la paleta**: Limita cada mezcla a un máximo de 2 o 3 colores base. Entre más pigmentos mezcles físicamente, más luz se absorbe sustractivamente.`;
    }

    // 5. Tonos de Piel (Flesh tones)
    if (/piel|flesh|retrato|rostro|cara/.test(q)) {
      return `**Fórmula Clásica para Mezclar Tonos de Piel:**
La piel humana es un material translúcido con *Subsurface Scattering* (dispersión subsuperficial). Nunca uses un solo color:

- **Zonas de la Cara**:
  - **Frente y Sienes (Luz solar / Amarilla)**: Ocre con blanco (**#F5D6A8**).
  - **Mejillas, Nariz y Orejas (Riego sanguíneo / Roja)**: Bermellón, carmín y siena (**#D97D64** y acentos en **#BF4343**).
  - **Mandíbula y Barba (Sombras / Fría)**: Tonos verdosos o azulados sutiles (**#9E9885** o **#6D7A73**).
- **Zorn Palette para Retrato**: Con solo 4 colores puedes pintar cualquier piel: **Blanco de Titanio (#FFFFFF)**, **Negro Marfil (#121214)**, **Ocre Amarillo (#D4A042)** y **Bermellón / Rojo Cadmio (#C73B28)**.`;
    }

    // 6. Gamut Masking de James Gurney
    if (/gurney|gamut mask|m[aá]scara de gama/.test(q)) {
      return `**El Sistema de Gamut Masking (James Gurney):**
James Gurney popularizó recortar una forma geométrica (triángulo o rombo) sobre la rueda cromática completa:

1. **Unidad Atmosférica Inquebrantable**: Todo color fuera de la máscara queda estrictamente prohibido en el cuadro. Esto garantiza que la obra parezca iluminada por una sola fuente de luz coherente.
2. **Relación Subjetiva de Color**: Un gris dentro de una máscara azulada parecerá cálido si está cerca del borde opuesto, permitiendo engañar al ojo con saturaciones mínimas pero creíbles.
3. Puedes experimentar esto en la pestaña **"Máscaras & Munsell"** de la barra lateral de GOM Picker.`;
    }

    // 7. Regla 60-30-10
    if (/60.*30.*10|regla|composici[oó]n|proporci[oó]n/.test(q)) {
      return `**La Regla de Composición 60 • 30 • 10:**
Es el estándar de oro en dirección de arte, ilustración y diseño de producción:

- **60% Dominante (Fondo / Atmósfera)**: Suele ser el tono más extenso y de saturación moderada o baja. Establece la clave tonal y el espacio.
- **30% Secundario (Estructura / Masa anatómica)**: Da volumen y carácter a las siluetas principales. Armoniza con el dominante.
- **10% Acento Focal (Punto de máxima atracción)**: Saturación alta o contraste complementario puro. Debe reservarse **únicamente** para el foco narrativo (los ojos del personaje, la empuñadura de la espada, la joya). Si usas el acento en más del 10%, el cuadro pierde jerarquía.`;
    }

    // 8. Respuesta pedagógica general sobre arte y color
    return `**Análisis del Maestro de Arte:**
Respecto a *"**${userQuery}**"*:

En pintura y teoría cromática, el secreto de una pieza memorable no radica en la saturación absoluta, sino en las **relaciones de valor tonal y temperatura**:

1. **Jerarquía Tonal**: Si entrecerras los ojos y tu imagen pierde legibilidad, el problema no es el color sino los valores. Haz una prueba con el botón **Valor B/N (V)** de la barra lateral.
2. **Contraste de Temperatura**: Haz dialogar tonos cálidos (sol, fuego, piel) con sombras frías (azul cerúleo **#4A7BB0**, violeta profundo **#38243E**).
3. **Color Activo**: Recuerda que tienes seleccionado **${curFg.hex}** en tu estudio. Puedes usar colores análogos como **#E6A040** o complementarios como **#3A60D0** para estructurar tu composición.

*¿Deseas una recomendación sobre mezclas de tubos, una paleta histórica de maestros o ayuda con un género específico (paisaje, retrato, sci-fi)?*`;
  }

  // --- LLM EN LA NUBE CON GOOGLE GEMINI (API OFICIAL) ---

  async _callGeminiAPI(userQuery) {
    const curHex = this.app.fgColor ? this.app.fgColor.hex : '#6366F1';
    const bgHex = this.app.bgColor ? this.app.bgColor.hex : '#F43F5E';
    const munsell = MunsellSystem.rgbToMunsell(this.app.fgColor.r, this.app.fgColor.g, this.app.fgColor.b);

    const systemPrompt = `Eres el Maestro de Arte y Asesor Cromático de élite de la suite GOM Color Picker Pro. Eres un experto consumado en teoría del color (Munsell, Johannes Itten, James Gurney, Florent Farges, Anders Zorn), química de pigmentos tradicionales (óleo, acrílico, acuarela) y arte digital. Conoces a fondo la obra de los grandes maestros (Sorolla, Rembrandt, Velázquez, Monet, Sargent, Vermeer, Caravaggio).
Contexto del usuario en la suite en este momento:
- Color Frontal activo en la rueda: ${curHex} (Notación Albert Munsell: ${munsell.notation})
- Color de Fondo secundario: ${bgHex}

Instrucciones:
1. Responde de forma elocuente, técnica, pedagógica y práctica para pintores e ilustradores.
2. Siempre que recomiendes o menciones colores concretos, escribe su código hexadecimal en formato #RRGGBB para que la suite genere automáticamente botones interactivos para el usuario.
3. Si el usuario pregunta sobre cómo aplicar o armonizar su color actual, analiza ${curHex} y ofrécele combinaciones armónicas exactas.
4. Mantén tus respuestas concisas, dinámicas y fáciles de leer con viñetas en Markdown.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userQuery }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Error HTTP ${res.status} de Gemini`);
    }

    const data = await res.json();
    const candidate = data.candidates && data.candidates[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía del modelo Gemini');
    return text;
  }

  // --- LLM EN LA NUBE CON OPENAI COMPATIBLE ---

  async _callOpenAIAPI(userQuery) {
    const curHex = this.app.fgColor ? this.app.fgColor.hex : '#6366F1';
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const systemPrompt = `Eres el Maestro de Arte y Asesor Cromático de GOM Picker Pro. Experto en color, pintura y maestros. Color activo actual del usuario: ${curHex}. Incluye siempre códigos hexadecimales #RRGGBB cuando recomiendes colores.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.7,
      max_tokens: 700
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Error HTTP ${res.status} de OpenAI`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Sin respuesta';
  }
}
