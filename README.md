# 🎨 GOM Color Picker Pro

<div align="center">

![GOM Color Picker Pro Banner](assets/icon.png)

### La Suite Definitiva de Teoría del Color, Armonía y Composición para Adobe Photoshop y Artistas Digitales

[![Version](https://img.shields.io/badge/version-1.0.0-indigo.svg?style=for-the-badge)](https://github.com/GomSamurai/gom-picker)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Photoshop%20UXP-emerald.svg?style=for-the-badge)](https://github.com/GomSamurai/gom-picker)
[![Offline](https://img.shields.io/badge/offline-100%25%20Local%20%26%20Private-purple.svg?style=for-the-badge)](https://github.com/GomSamurai/gom-picker)

*Diseñado y desarrollado por **Fran Gómez**.*

</div>

---

## 🌟 Resumen Ejecutivo

**GOM Color Picker Pro** es una estación de trabajo cromática de calibre profesional concebida para superar las limitaciones de los selectores de color convencionales. Inspirada en la fluidez del mítico *Coolorus*, pero expandida con ciencia del color avanzada: **mezcla física de pigmentos mediante ecuaciones de Kubelka-Munk**, **conversión matemática bidireccional RGB ↔ CMYK con aviso de fuera de gama para imprenta**, **sistema de notación Munsell**, **máscaras de Gamut de James Gurney**, **descomposición atmosférica de luz en 6 etapas**, y un **motor de inteligencia cromática local para composición 60-30-10**.

Funciona tanto como **aplicación web ultra-rápida y ligera**, como **ventana flotante independiente para multimonitor**, o como **plugin nativo UXP para Adobe Photoshop (CC 2021+)**.

---

## 🚀 Inicio Rápido

### Opción 1: Inicio en 1 Clic (Recomendado) 🌟
Haz doble clic en:
```bash
INICIAR_GOM_PICKER.bat
```
*(o en `start.bat`)*. Esto levantará automáticamente el servidor local con módulos ES, soporte CORS y abrirá tu navegador predeterminado en `http://localhost:5050`.

### Opción 2: Desde la Terminal
```bash
# Clonar el repositorio
git clone https://github.com/GomSamurai/gom-picker.git

# Entrar al directorio
cd gom-picker

# Iniciar servidor local
npm start
# (o: node server.js)
```
Abre en tu navegador: **`http://localhost:5050`**

### Opción 3: Como Extensión Nativa UXP en Adobe Photoshop (CC 2021+)
El proyecto incluye el estándar `manifest.json` preparado para Adobe UXP:
1. Abre **Adobe UXP Developer Tool** (incluido gratuitamente con Adobe Creative Cloud).
2. Haz clic en **"Add Existing Plugin"** y selecciona la carpeta del proyecto.
3. Haz clic en **"Load"** con Photoshop abierto.
4. El panel aparecerá disponible en el menú `Ventana > Extensiones (UXP) > GOM Color Picker`, con sincronización automática de muestras frontal y trasera en tiempo real.

---

## 💎 Características Principales

### 🎯 1. Rueda Cromática de Precisión (4 Modos de Color)
* **Modo Triángulo (Coolorus Style)**: Anillo exterior de matiz (*Hue*) con triángulo equilátero giratorio para saturación y valor.
* **Modo Cuadrado / Caja (Photoshop & Procreate)**: Mapeo rectangular tradicional.
* **Modo Rueda de Pintor (RYB)**: Espacio sustractivo primario clásico (Rojo-Amarillo-Azul).
* **Modo OKLCH Perceptual**: Distribución lumínica perceptualmente uniforme que elimina los saltos cromáticos no lineales.
* **Selector Hero & Bandas Compañeras**: Visualización en gran formato de la muestra activa acompañada de bandas armónicas relativas configurables.

### 🖨️ 2. Espacio Dual RGB ↔ CMYK con Gamut Guard
* Control numérico en tiempo real en espacios **RGB**, **CMYK** (con simulación UCR de tintas de imprenta) y **HSL**.
* **Alerta Automática de Fuera de Gamut**: Detecta inmediatamente cuando una combinación RGB no puede imprimirse en cuatricromía estándar sin saturar el límite de tinta.
* **Botón "Corregir Gamut"**: Ajusta el color al límite cromático imprimible más cercano sin alterar la intención artística.

### 🧪 3. Mezclador Óptico de Pigmentos (Física Kubelka-Munk)
* A diferencia de los mezcladores aditivos estándar donde mezclar amarillo y azul produce un gris desaturado, **GOM Color Picker Pro** implementa la física sustractiva real: **amarillo + azul genera verde orgánico vibrante**, idéntico a mezclar tubos de óleo o acrílico en la paleta tradicional.

### 🧠 4. Asesor Cromático IA (Estudio de Composición 60 • 30 • 10)
* **100% Local y Privado**: Zero APIs externas, latencia cero y total privacidad.
* **Proyección Semántica Multidimensional**: Analiza conceptos, criaturas, atmósferas y emociones analizando vectores de temperatura, clave tonal, saturación, tensión armónica y organicidad.
* **6 Maquetas Vectoriales en Tiempo Real**:
  1. 🐉 *Criatura / Dragón en Caverna de Obsidiana*
  2. 🏞️ *Paisaje Natural y Domo Celeste*
  3. 👤 *Retrato y Figura Humana*
  4. 📐 *Cartel Gráfico y Branding Bauhaus*
  5. 🌃 *Escena Sci-Fi / Cyberpunk Nocturna*
  6. 🏺 *Bodegón Clásico / Naturaleza Muerta*
* **Desglose de Proporciones 60-30-10**: Barra de proporciones interactiva con leyenda vinculada y selección inmediata de colores.
* **Fichas de Muestras Integradas**: Tarjetas completas de muestras con códigos HEX, botones para color principal (FG) y fondo (BG), copia rápida y botón para **Guardar en Biblioteca personal**.
* **Diagnóstico Académico & Dirección de Arte**: Evaluaciones de rango dinámico, balance térmico y consejos profesionales de iluminación.

### 🌅 5. Estudio de Atmósfera & Descomposición de Shading
* **Modificador Global de Escena**: Aplica filtros de color a toda la interfaz con control de intensidad lumínica y tinte cromático (Cálido, Frío, Crepúsculo, Niebla, Nocturno).
* **Descomposición del Sombreado en 6 Etapas**:
  1. *Luz Directa (Key Light)*
  2. *Color Local (Midtone)*
  3. *Terminador (Transición SSS / Subsurface Scattering)*
  4. *Sombra de Oclusión (Ambience)*
  5. *Luz Rebotada (Bounce Light)*
  6. *Brillo Especular (Specular Highlight)*

### 🏛️ 6. Paletas Históricas de Grandes Maestros
Paletas meticulosamente investigadas y calibradas a partir de obras maestras originales:
* **Claude Monet** (*Nenúfares* — Impresionismo)
* **Vincent van Gogh** (*La Noche Estrellada* — Postimpresionismo)
* **Rembrandt van Rijn** (*Retrato de Anciano* — Claroscuro Barroco)
* **Joaquín Sorolla** (*Paseo a Orillas del Mar* — Luminismo)
* **John Singer Sargent** (*Madame X* — Retrato Realista)
* **Johannes Vermeer** (*La Joven de la Perla* — Siglo de Oro)
* **Katsushika Hokusai** (*La Gran Ola de Kanagawa* — Ukiyo-e)
* **Gustav Klimt** (*El Beso* — Simbolismo Dorado)
* **Alphonse Mucha** (*Las Estaciones* — Art Nouveau)

### 🎨 7. Catálogos Profesionales & Bibliotecas de Marca
* Catálogo **Copic Markers** completo con nomenclatura original (BV, V, RV, R, YR, Y, YG, G, BG, B, E, C, W, N, T).
* Catálogo **Pantone Formula Guide** con coordenadas cromáticas.
* Pigmentos tradicionales y marcas de bellas artes (Rembrandt, Winsor & Newton, Holbein).

### 🔍 8. Extractor de Paletas K-Means & Cuentagotas en Vivo
* Importa cualquier imagen (JPG, PNG, WebP) mediante drag-and-drop.
* Extracción matemática por agrupamiento de K-Means de los colores dominantes.
* Cuentagotas con lupa digital en tiempo real sobre la imagen.

### 💾 9. Exportación Universal Multi-Formato
* **Adobe Swatch Exchange (`.ase`)**: Archivo binario compatible nativamente con Photoshop, Illustrator e InDesign.
* **GIMP Palette (`.gpl`)**: Compatible con Krita, GIMP, Aseprite y Clip Studio Paint.
* **Variables CSS (`:root`)**: Lista de tokens CSS para diseñadores web e interfaces.
* **JSON**: Estructura de datos completa con nombres, valores RGB, HEX y roles.
* **Tarjetas SVG**: Tarjetas gráficas listas para presentaciones de dirección de arte.

### 🪟 10. Ventana Flotante Multimonitor Sincronizada
* Botón **"Panel Flotante"**: Abre una ventana ligera e independiente que puedes colocar sobre Photoshop, Blender o Krita.
* Sincronización instantánea bidireccional mediante la API `BroadcastChannel`.

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| :---: | :--- |
| **`X`** | Intercambiar color frontal (FG) y de fondo (BG). |
| **`D`** | Restablecer colores por defecto (Frontal: Índigo / Fondo: Carmesí). |
| **`V`** | Alternar modo de comprobación de valores tonales en Blanco y Negro. |
| **`P`** | Fijar o desanclar el cuadro flotante con información de la muestra activa. |
| **`Tab`** | Alternar visibilidad de las columnas de herramientas. |
| **`Enter`** | Sintetizar esquema cromático en el Asesor IA tras escribir un prompt. |

---

## 📁 Estructura del Proyecto

```
gom-picker/
├── index.html                   # Interfaz principal de la suite
├── popup.html                   # Ventana flotante compacta sincronizada
├── server.js                    # Servidor local Node.js (soporte ES Modules y CORS)
├── INICIAR_GOM_PICKER.bat       # Lanzador en 1 clic para Windows
├── start.bat                    # Script alternativo de inicio
├── package.json                 # Metadatos del proyecto y scripts
├── manifest.json                # Manifiesto UXP para Adobe Photoshop
├── .gitignore                   # Exclusiones de Git
├── assets/                      # Iconos y recursos gráficos
├── styles/
│   └── main.css                 # Sistema de diseño, temas oscuros y animaciones
└── scripts/
    ├── app.js                   # Orquestador principal de la suite
    ├── colorMath.js             # Motor matemático de conversión cromática (RGB, CMYK, HSL, LAB, OKLCH)
    ├── colorWheel.js            # Renderizado de la rueda de color (Triángulo, Caja, RYB, OKLCH)
    ├── harmonies.js             # Motor de armonías cromáticas
    ├── atmosphereEngine.js      # Motor atmosférico y descomposición de shading
    ├── aiAdvisor.js             # Motor de inteligencia cromática local (Vectores y diagnóstico)
    ├── aiAssistant.js           # Escenas de composición visual 60-30-10 en SVG
    ├── paintMixerChromilla.js   # Mezclador óptico de pigmentos (Kubelka-Munk)
    ├── gamutMask.js             # Máscaras de Gamut de James Gurney
    ├── munsellSystem.js         # Notación Munsell Hue/Value/Chroma
    ├── masterPalettes.js        # Galería histórica de Grandes Maestros
    ├── paletteCatalogs.js       # Catálogos Copic y Pantone
    ├── swatches.js              # Gestor y exportador de paletas (.ASE, .GPL, CSS, JSON)
    ├── imageExtractor.js        # Extractor K-Means y cuentagotas
    ├── companionBands.js        # Bandas compañeras del color activo
    ├── tooltipEngine.js         # Motor de popups flotantes avanzados
    └── uxpBridge.js             # Puente de comunicación para Adobe Photoshop UXP
```

---

## 📜 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

<div align="center">

Hecho con pasión por el color y el arte por **Fran Gómez** ([@GomSamurai](https://github.com/GomSamurai)).

</div>
