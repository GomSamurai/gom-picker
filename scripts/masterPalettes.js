/**
 * GOM Picker - Master Painters Reference Palettes & Multi-Catalog Engine
 * Curated color palettes extracted from iconic artworks of legendary painters,
 * complete with high-res previews, historical pigment notes, compositional analysis,
 * full-screen modal viewing, and custom user catalogs management.
 */

export const DEFAULT_CATALOGS = [
  {
    id: 'all',
    name: '🖼️ Todas las Obras Maestras',
    icon: '🏛️',
    description: 'Catálogo universal completo de Grandes Maestros históricos.'
  },
  {
    id: 'baroque_renaissance',
    name: '🏛️ Renacimiento & Barroco',
    icon: '👑',
    description: 'Claroscuro, tenebrismo y veladuras (Rembrandt, Da Vinci, Velázquez, Caravaggio, Vermeer).'
  },
  {
    id: 'impressionism_light',
    name: '🌅 Impresionismo & Luz Plein Air',
    icon: '☀️',
    description: 'Luz natural mediterránea, agua y sombras cromáticas (Monet, Sorolla, Turner).'
  },
  {
    id: 'symbolism_oriental',
    name: '🌌 Simbolismo, Romanticismo & Ukiyo-e',
    icon: '🌊',
    description: 'Emoción vibrante, pan de oro y grabado clásico (Van Gogh, Klimt, Mucha, Hokusai, Friedrich).'
  }
];

export const MASTER_PALETTES = [
  {
    id: 'monet_waterlilies',
    catalogId: 'impressionism_light',
    artist: 'Claude Monet',
    title: 'Nenúfares (Water Lilies)',
    year: '1906',
    movement: 'Impresionismo Francés',
    image: 'assets/samples/monet.png',
    description: 'Paleta impresionista dominada por verdes serenos de agua, reflejos violetas y destellos rosa pastel en sombras líquidas sin rastro de negro acromático.',
    pigmentsUsed: 'Verde Viridian (PG18), Azul Cobalto (PB28), Amarillo Cadmio (PY35), Carmesí Alizarina (PR83), Blanco de Zinc (PW4)',
    technique: 'Sombras Cromáticas Puras: Monet destierra el pigmento negro. Las sombras de agua son reflejos complementarios cargados de azul cobalto y violetas vibrantes.',
    digitalTip: 'Nunca uses negro puro para sombrear vegetación o agua; mezcla el tono del cielo rebotado con el color complementario de la superficie para conseguir transparencia viva.',
    colors: [
      { hex: '#1C3A35', name: 'Verde Agua Profundo', weight: 35, role: 'Base de Sombra Líquida' },
      { hex: '#3B6E67', name: 'Azul Turquesa Moteado', weight: 25, role: 'Masa de Agua Mid-tone' },
      { hex: '#639A88', name: 'Verde Nenúfar', weight: 20, role: 'Follaje Flotante' },
      { hex: '#C28CA5', name: 'Rosa Nenúfar', weight: 12, role: 'Pétalos e Iluminación' },
      { hex: '#E8D3DC', name: 'Blanco Violeta Reflejo', weight: 8, role: 'Luz Especular del Sol' }
    ]
  },
  {
    id: 'van_gogh_starry',
    catalogId: 'symbolism_oriental',
    artist: 'Vincent van Gogh',
    title: 'La Noche Estrellada (The Starry Night)',
    year: '1889',
    movement: 'Postimpresionismo Expresivo',
    image: 'assets/samples/vangogh.png',
    description: 'Contraste vibrante y cargado de emoción entre azules cobalto profundos y amarillos cadmio puros en giros cósmicos de alta carga matérica.',
    pigmentsUsed: 'Azul Cobalto (PB28), Azul Ultramar (PB29), Amarillo Cadmio Claro (PY35), Amarillo Cromo (PY34), Blanco de Plomo (PW1)',
    technique: 'Impasto Expresionista y Contraste Simultáneo: Pinceladas direccionales gruesas de pigmento puro sin mezclar en paleta, generando vibración óptica retiniana.',
    digitalTip: 'Aplica el color complementario en pinceladas adyacentes de alta saturación para guiar el flujo visual con energía kinésica.',
    colors: [
      { hex: '#0F2537', name: 'Azul Cobalto Nocturno', weight: 40, role: 'Cielo Profundo y Sombras' },
      { hex: '#225070', name: 'Azul Índigo Remolino', weight: 25, role: 'Movimiento Celestial' },
      { hex: '#5893B8', name: 'Azul Celeste Liso', weight: 15, role: 'Aura Estelar' },
      { hex: '#F0B634', name: 'Amarillo Cadmio Estela', weight: 12, role: 'Luz de Luna y Estrellas' },
      { hex: '#F7E779', name: 'Amarillo Limón Resplandor', weight: 8, role: 'Núcleo Estelar' }
    ]
  },
  {
    id: 'rembrandt_chiaroscuro',
    catalogId: 'baroque_renaissance',
    artist: 'Rembrandt van Rijn',
    title: 'Retrato de Anciano (Baroque Chiaroscuro)',
    year: '1654',
    movement: 'Barroco Holandés',
    image: 'assets/samples/rembrandt.png',
    description: 'Máximo exponente del claroscuro: sombras profundas en tierra de sombra tostada y luces cálidas en ocre dorado y bermellón velado.',
    pigmentsUsed: 'Negro Marfil (PBk9), Tierra de Sombra Tostada (PBr7), Ocre Amarillo (PY43), Bermellón (PR106), Blanco de Plomo (PW1)',
    technique: 'Imprimatura Parda y Veladuras Transparentes: Toda la obra emerge de un fondo umbrío; las luces son densas y táctiles mientras que las sombras permanecen líquidas y translúcidas.',
    digitalTip: 'Mantén los valores oscuros en un rango comprimido y reserva los medios tonos cálidos para los planos faciales expuestos a la luz focal.',
    colors: [
      { hex: '#140E0A', name: 'Negro Marfil Umbra', weight: 45, role: 'Sombra Absoluta' },
      { hex: '#3B2314', name: 'Sombra Tostada Profunda', weight: 25, role: 'Fondo Atmosférico' },
      { hex: '#7A4822', name: 'Siena Tostada', weight: 15, role: 'Medio Tono Piel' },
      { hex: '#C2843A', name: 'Ocre Dorado Cálido', weight: 10, role: 'Luz Principal' },
      { hex: '#ECC47E', name: 'Amarillo Nápoles Alto', weight: 5, role: 'Brillo en Frente/Nariz' }
    ]
  },
  {
    id: 'sorolla_beach',
    catalogId: 'impressionism_light',
    artist: 'Joaquín Sorolla',
    title: 'Paseo a Orillas del Mar',
    year: '1909',
    movement: 'Luminismo / Impresionismo Español',
    image: 'assets/samples/sorolla.png',
    description: 'Captura magistral de la luz mediterránea: blancos cegadores empastados, reflejos violetas transparentes y azules marinos vibrantes.',
    pigmentsUsed: 'Blanco de Zinc (PW4), Violeta Cobalto (PV14), Azul Ultramar Francés (PB29), Ocre Claro (PY43), Tierra Rosa (PR102)',
    technique: 'Luz Cenital Directa y Reflejo Especular: La arena actúa como un reflector gigantesco proyectando luz cálida sobre las sombras de los vestidos blancos.',
    digitalTip: 'Al pintar telas blancas bajo luz solar, nunca uses blanco puro salvo en el brillo especular; los medios tonos deben vibrar entre ocre pálido y lavanda sutil.',
    colors: [
      { hex: '#F5F2EB', name: 'Blanco Marfil Sol', weight: 35, role: 'Túnicas y Reflejo Solar' },
      { hex: '#D1C4D9', name: 'Violeta Sombrilla', weight: 20, role: 'Sombras Transparentes' },
      { hex: '#1B5B7D', name: 'Azul Mediterráneo', weight: 20, role: 'Mar de Valencia' },
      { hex: '#D99B6A', name: 'Arena Cálida', weight: 15, role: 'Orilla y Piel' },
      { hex: '#72A8B3', name: 'Espuma Celadón', weight: 10, role: 'Reflejos en Agua' }
    ]
  },
  {
    id: 'sargent_portrait',
    catalogId: 'baroque_renaissance',
    artist: 'John Singer Sargent',
    title: 'Madame X (Virginie Gautreau)',
    year: '1884',
    movement: 'Realismo Académico / Retrato Clásico',
    image: 'assets/samples/sargent.png',
    description: 'Elegancia aristocrática caracterizada por el contraste dramático entre la piel de alabastro pálida y vestidos de raso negro suntuoso.',
    pigmentsUsed: 'Negro Hueso (PBk9), Tierra de Sombra Natural (PBr7), Blanco de Plomo (PW1), Bermellón (PR106), Ocre Rojo (PR102)',
    technique: 'Bordes Perdidos y Encontrados (Lost & Found Edges): El contorno de la silueta se funde misteriosamente con el fondo oscuro en las zonas de sombra.',
    digitalTip: 'Modula la nitidez del borde de la figura; los bordes duros atraen la mirada al punto focal (hombro, perfil), mientras que los bordes suaves dan profundidad.',
    colors: [
      { hex: '#121216', name: 'Satin Negro Marfil', weight: 50, role: 'Vestido de Noche' },
      { hex: '#63493D', name: 'Nogal de Fondo', weight: 20, role: 'Pared de Estudio' },
      { hex: '#EBE3DB', name: 'Piel Alabastro', weight: 18, role: 'Tez de Madame X' },
      { hex: '#B8A499', name: 'Sombra Rosa Piel', weight: 7, role: 'Contorno de Rostro' },
      { hex: '#C49A45', name: 'Oro de Tirantes', weight: 5, role: 'Accesorios y Joyas' }
    ]
  },
  {
    id: 'hokusai_wave',
    catalogId: 'symbolism_oriental',
    artist: 'Katsushika Hokusai',
    title: 'La Gran Ola de Kanagawa',
    year: '1831',
    movement: 'Ukiyo-e / Grabado Clásico Japonés',
    image: 'assets/samples/hokusai.png',
    description: 'Obra maestra del grabado en madera con el primer uso célebre del Azul de Prusia importado en conjunción con el añil tradicional japonés.',
    pigmentsUsed: 'Azul de Prusia (PB27), Añil Índigo Natural (NB1), Ocre Amarillo Tostado (PY43), Blanco Concha Gofun (PW18)',
    technique: 'Bokashi (Gradación Impresa): Transición continua de saturación de azul en la cresta de la ola que confiere dramatismo y escala monumental.',
    digitalTip: 'Utiliza una paleta limitada de dos azules de distinta temperatura combinados con un fondo crema cálido para crear profundidad infinita.',
    colors: [
      { hex: '#0D2B45', name: 'Azul de Prusia Profundo', weight: 40, role: 'Cuerpo de la Cresta' },
      { hex: '#20639B', name: 'Azul Índigo Japonés', weight: 25, role: 'Masa de Ola' },
      { hex: '#F4E8C1', name: 'Papel Arroz Envejecido', weight: 20, role: 'Cielo y Fondo' },
      { hex: '#E8F1F5', name: 'Espuma de Garra', weight: 10, role: 'Espuma de Mar' },
      { hex: '#D68936', name: 'Madera de Barca', weight: 5, role: 'Pescadores y Fujisan' }
    ]
  },
  {
    id: 'vermeer_pearl',
    catalogId: 'baroque_renaissance',
    artist: 'Johannes Vermeer',
    title: 'La Joven de la Perla',
    year: '1665',
    movement: 'Siglo de Oro Holandés',
    image: 'assets/samples/vermeer.png',
    description: 'Armonía íntima y luz envolvente basada en el rarísimo Azul Ultramar natural (Lapislázuli genuino) y Amarillo Plomo-Estaño luminoso.',
    pigmentsUsed: 'Lapislázuli Ultramar Natural (PB29), Amarillo Plomo-Estaño (NY1), Tierra Sombra Natural (PBr7), Blanco de Plomo (PW1)',
    technique: 'Grisalla Óptica y Especular de Perla: Vermeer pintó la perla con solo dos pinceladas sueltas: un reflejo curvo inferior y un punto de luz pura superior.',
    digitalTip: 'Los objetos metálicos o perlas no necesitan contornos negros; se definen exclusivamente por los reflejos de la luz de la estancia y el color rebotado de la piel.',
    colors: [
      { hex: '#090C10', name: 'Fondo Oscuro Suave', weight: 45, role: 'Vacío Atmosférico' },
      { hex: '#1E4375', name: 'Lapislázuli Ultramar', weight: 20, role: 'Turbante Turco' },
      { hex: '#D9A74A', name: 'Amarillo Plomo-Estaño', weight: 15, role: 'Chaqueta de Paño' },
      { hex: '#E6D3C1', name: 'Piel Nácar', weight: 12, role: 'Rostro y Reflejo' },
      { hex: '#D6D6D6', name: 'Brillo de la Perla', weight: 8, role: 'Perla y Collar' }
    ]
  },
  {
    id: 'klimt_kiss',
    catalogId: 'symbolism_oriental',
    artist: 'Gustav Klimt',
    title: 'El Beso (The Kiss)',
    year: '1907',
    movement: 'Simbolismo / Fase Dorada',
    image: 'assets/samples/klimt.png',
    description: 'Opulencia decorativa mosaica donde láminas de pan de oro conviven con espirales negras, bronce oscuro y acentos florales turquesa.',
    pigmentsUsed: 'Pan de Oro Genuino de 24k, Ocre Dorado (PY43), Negro Carbón (PBk8), Turquesa Cobalto (PG50), Bermellón (PR106)',
    technique: 'Aplanamiento Decorativo y Textura Mosaica: Los ropajes forman un solo bloque decorativo bidimensional del que emergen tridimensionalmente los rostros y manos.',
    digitalTip: 'Combina superficies planas con patrones geométricos ricos para envolver figuras figurativas con un aire místico y atemporal.',
    colors: [
      { hex: '#D4AF37', name: 'Pan de Oro Real', weight: 45, role: 'Manto de los Amantes' },
      { hex: '#8B6B23', name: 'Bronce Metálico', weight: 20, role: 'Tonalidad de Fondo' },
      { hex: '#1E6F5C', name: 'Turquesa Mosaico', weight: 15, role: 'Flores y Adornos' },
      { hex: '#1C1B1F', name: 'Rectángulo Negro Marfil', weight: 12, role: 'Patrones Masculinos' },
      { hex: '#E25B45', name: 'Rojo Carmín Adorno', weight: 8, role: 'Detalles Circulares' }
    ]
  },
  {
    id: 'mucha_art_nouveau',
    catalogId: 'symbolism_oriental',
    artist: 'Alphonse Mucha',
    title: 'Las Estaciones (Art Nouveau)',
    year: '1896',
    movement: 'Art Nouveau / Modernismo',
    image: 'assets/samples/mucha.png',
    description: 'Líneas fluidas y tonos pastel terrosos enriquecidos con toques dorados, terracota empolvado y verde oliva en armonía orgánica perfecta.',
    pigmentsUsed: 'Ocre de Oro (PY42), Rosa de Alizarina Pastel (PR83), Verde Oliva Cromo (PG17), Castaño Tostado (PBr7)',
    technique: 'Línea de Contorno Dinámica (Clochard) y Relleno Litográfico: Colores desaturados en medios tonos que realzan la gracia anatómica.',
    digitalTip: 'Para lograr una atmósfera Art Nouveau auténtica, reduce la saturación general al 40% y emplea una línea de arte castaña en lugar de negro puro.',
    colors: [
      { hex: '#E8D4BE', name: 'Marfil Antiguo', weight: 35, role: 'Fondo y Piel' },
      { hex: '#C27D72', name: 'Rosa Terracota Empolvado', weight: 25, role: 'Ropajes Orgánicos' },
      { hex: '#738363', name: 'Verde Oliva Art Nouveau', weight: 20, role: 'Vegetación Arabesco' },
      { hex: '#D4AA55', name: 'Oro Viejo Ocre', weight: 12, role: 'Marcos y Cabello' },
      { hex: '#52433D', name: 'Castaño Delineado', weight: 8, role: 'Línea de Contorno' }
    ]
  },
  {
    id: 'caravaggio_calling',
    catalogId: 'baroque_renaissance',
    artist: 'Caravaggio',
    title: 'La Vocación de San Mateo (Tenebrismo)',
    year: '1600',
    movement: 'Barroco Tenebrista Italiano',
    image: 'assets/samples/caravaggio.png',
    description: 'Tenebrismo dramático absoluto con un haz diagonal implacable de luz divina que irrumpe en una taberna romana en penumbra.',
    pigmentsUsed: 'Tierra de Sombra Tostada (PBr7), Negro Humo (PBk6), Ocre Amarillo de Roma (PY43), Bermellón Cinabrio (PR106), Blanco de Plomo (PW1)',
    technique: 'Luz Teatral Focalizada (Luce alla Cantina): La luz no es natural sino un foco selectivo que ilumina solo rostros y manos cargados de emoción.',
    digitalTip: 'En concept art dramático, utiliza un solo foco duro direccional y sumerge el 70% de la composición en sombras de oclusión profundas.',
    colors: [
      { hex: '#0B0A08', name: 'Tenebroso Oscuro Fondo', weight: 50, role: 'Vacío Sombrío de Taberna' },
      { hex: '#3C2618', name: 'Tierra de Sombra Romana', weight: 20, role: 'Ropas y Sombras Cálidas' },
      { hex: '#8F5428', name: 'Cuero y Madera Envejecida', weight: 15, role: 'Mesa y Cuerpos' },
      { hex: '#DDA04B', name: 'Haz Dorado de Luz Divina', weight: 10, role: 'Luz en Rostro de Mateo' },
      { hex: '#EFE0C2', name: 'Luz Alta en Pliegue', weight: 5, role: 'Brillo en Cuello y Manga' }
    ]
  },
  {
    id: 'velazquez_meninas',
    catalogId: 'baroque_renaissance',
    artist: 'Diego Velázquez',
    title: 'Las Meninas (La Familia Real)',
    year: '1656',
    movement: 'Siglo de Oro Español',
    image: 'assets/samples/velazquez.png',
    description: 'Pintura del aire y la atmósfera: grises plateados, rojos almagre sutiles y sedas nacaradas en el taller del Alcázar de Madrid.',
    pigmentsUsed: 'Blanco de Plomo (PW1), Negro Carbón (PBk8), Ocre Amarillo (PY43), Almagre Español (PR102), Azurita Natural (PB30)',
    technique: 'Alla Prima y Perspectiva Aérea: Velázquez no pinta objetos definidos, pinta la masa de aire luminosa que separa al espectador de los personajes.',
    digitalTip: 'Para dar naturalidad a una escena interior, unifica los reflejos con una veladura gris plateada sutil que ligue figuras y fondo.',
    colors: [
      { hex: '#1F1B17', name: 'Penumbras del Taller Real', weight: 40, role: 'Techo y Cuadros del Fondo' },
      { hex: '#4A3E33', name: 'Pardo Sevillano Suave', weight: 25, role: 'Guardainfante y Madera' },
      { hex: '#94836B', name: 'Gris Perla Atmosférico', weight: 15, role: 'Aire y Luz Difusa' },
      { hex: '#C29845', name: 'Cabellos Áureos de la Infanta', weight: 12, role: 'Luz Cenital en Niña' },
      { hex: '#B83226', name: 'Rojo Carmín de la Rosa', weight: 8, role: 'Lazo y Jarrita de Bucaro' }
    ]
  },
  {
    id: 'turner_temeraire',
    catalogId: 'impressionism_light',
    artist: 'J.M.W. Turner',
    title: 'El Temerario Remolcado',
    year: '1838',
    movement: 'Romanticismo Sublime Británico',
    image: 'assets/samples/turner.png',
    description: 'Apoteosis de luz y vapor: un atardecer ardiente donde el cielo se funde con el mar en amarillos sulfúreos y carmines crepusculares.',
    pigmentsUsed: 'Amarillo Cromo (PY34), Rojo Escarlata Iodo (PR108), Azul Cobalto (PB28), Blanco de Plomo (PW1)',
    technique: 'Disolución de la Forma en Pura Luz: Las siluetas se convierten en espectros translúcidos dentro de un torbellino de partículas luminosas.',
    digitalTip: 'En composiciones crepusculares o de ciencia ficción, funde la línea de horizonte con un gradiente radial cálido para evocar inmensidad cósmica.',
    colors: [
      { hex: '#1C2432', name: 'Azul Carbón del Remolcador', weight: 25, role: 'Humo y Silueta de Acero' },
      { hex: '#3E4F63', name: 'Cielo Frío Superior', weight: 20, role: 'Atmósfera Alta' },
      { hex: '#7D4734', name: 'Rojo Crepúsculo Humoso', weight: 20, role: 'Nubes Bajas' },
      { hex: '#E58535', name: 'Fuego Solar Poniente', weight: 20, role: 'Horizonte en Llamas' },
      { hex: '#FBE089', name: 'Resplandor Dorado en Agua', weight: 15, role: 'Reflejo Especular Marino' }
    ]
  },
  {
    id: 'davinci_monalisa',
    catalogId: 'baroque_renaissance',
    artist: 'Leonardo da Vinci',
    title: 'La Gioconda (Mona Lisa)',
    year: '1503',
    movement: 'Alto Renacimiento Italiano',
    image: 'assets/samples/davinci.png',
    description: 'El ápice del Sfumato renacentista: transiciones imperceptibles sin líneas divisorias entre luz y sombra en el rostro más enigmático de la historia.',
    pigmentsUsed: 'Blanco de Plomo (PW1), Ocre Amarillo (PY43), Tierra Sombra Tostada (PBr7), Malaquita Verde (PG39), Azurita (PB30)',
    technique: 'Sfumato de Capas Microscópicas: Hasta 30 capas finísimas de barniz teñido que difuminan los bordes de la comisura de los labios y ojos.',
    digitalTip: 'Nunca utilices un borde duro en los pliegues de los ojos y la sonrisa; difumina los tonos suavemente para dotar al personaje de vida y ambigüedad.',
    colors: [
      { hex: '#1D211A', name: 'Manto Umbrío de Terciopelo', weight: 35, role: 'Vestido y Velo' },
      { hex: '#3D4130', name: 'Verde Sombra de Estudio', weight: 25, role: 'Paisaje Próximo' },
      { hex: '#727457', name: 'Tierra Caliza del Valle', weight: 20, role: 'Ríos y Puentes Lejanos' },
      { hex: '#C1A77E', name: 'Tez Sfumato Nacarada', weight: 12, role: 'Rostro y Escote' },
      { hex: '#4B6B78', name: 'Azul Glaciar del Horizonte', weight: 8, role: 'Montañas Lejanas' }
    ]
  },
  {
    id: 'friedrich_wanderer',
    catalogId: 'symbolism_oriental',
    artist: 'Caspar David Friedrich',
    title: 'El Caminante sobre el Mar de Niebla',
    year: '1818',
    movement: 'Romanticismo Alemán / Lo Sublime',
    image: 'assets/samples/friedrich.png',
    description: 'La quintaesencia del Romanticismo contemplativo: una figura solitaria en la cima de un risco rocoso observando un mar infinito de niebla.',
    pigmentsUsed: 'Negro Hueso (PBk9), Azul de Prusia Pálido (PB27), Gris de Payne (PBk9/PB29), Ocre Dorado Suave (PY43)',
    technique: 'Rückenfigur (Figura de Espaldas): La figura actúa como avatar del espectador, invitándolo a contemplar la vastedad del mundo en tonos fríos atmosféricos.',
    digitalTip: 'Usa una silueta en clave baja muy nítida en el primer plano contrastada con un fondo de clave alta desaturado para amplificar la sensación de escala colosal.',
    colors: [
      { hex: '#16191D', name: 'Roca Volcánica y Levita', weight: 35, role: 'Primer Plano y Silueta' },
      { hex: '#3B434C', name: 'Peñascos en Niebla', weight: 25, role: 'Cimas Medias' },
      { hex: '#6D7784', name: 'Bruma Alpina Pizarra', weight: 20, role: 'Mar de Nubes Denso' },
      { hex: '#B2BAC4', name: 'Vapor de Agua Lleno de Luz', weight: 12, role: 'Cielo y Viento' },
      { hex: '#E1E6EC', name: 'Cielo Frío Glacial', weight: 8, role: 'Luz Superior' }
    ]
  }
];

/**
 * Master Catalog Manager: handles default master collections and user custom catalogs
 */
export class MasterCatalogManager {
  constructor() {
    this.storageKey = 'gom_master_custom_catalogs_v1';
    this.customCatalogs = this.loadCustomCatalogs();
  }

  loadCustomCatalogs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error loading custom master catalogs', e);
      return [];
    }
  }

  saveCustomCatalogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.customCatalogs));
    } catch (e) {
      console.warn('Error saving custom master catalogs', e);
    }
  }

  getAllCatalogs() {
    const list = [...DEFAULT_CATALOGS];
    this.customCatalogs.forEach(cat => {
      list.push({
        id: cat.id,
        name: `📁 ${cat.name}`,
        icon: cat.icon || '📁',
        description: cat.description || 'Catálogo personalizado del usuario.',
        isCustom: true
      });
    });
    return list;
  }

  createCatalog(name, description = '') {
    const newCat = {
      id: 'cat_' + Date.now(),
      name: name.trim() || 'Mi Catálogo Personalizado',
      icon: '📁',
      description: description.trim() || 'Colección creada por el usuario.',
      artworks: []
    };
    this.customCatalogs.push(newCat);
    this.saveCustomCatalogs();
    return newCat;
  }

  deleteCatalog(catalogId) {
    this.customCatalogs = this.customCatalogs.filter(c => c.id !== catalogId);
    this.saveCustomCatalogs();
  }

  getArtworksByCatalog(catalogId = 'all') {
    if (catalogId === 'all') {
      const customs = this.customCatalogs.flatMap(c => c.artworks || []);
      return [...MASTER_PALETTES, ...customs];
    }

    // Check default catalogs
    const defaultMatches = MASTER_PALETTES.filter(p => p.catalogId === catalogId);
    if (defaultMatches.length > 0) return defaultMatches;

    // Check custom catalogs
    const customCat = this.customCatalogs.find(c => c.id === catalogId);
    return customCat ? (customCat.artworks || []) : [];
  }

  addArtworkToCatalog(catalogId, artwork) {
    const customCat = this.customCatalogs.find(c => c.id === catalogId);
    if (!customCat) return null;

    const newArt = {
      id: 'art_' + Date.now(),
      catalogId,
      artist: artwork.artist || 'Artista Desconocido',
      title: artwork.title || 'Sin Título',
      year: artwork.year || 'Contemporáneo',
      movement: artwork.movement || 'Personalizado',
      image: artwork.image || '',
      description: artwork.description || 'Obra añadida por el usuario.',
      pigmentsUsed: artwork.pigmentsUsed || 'Paleta extraída digitalmente.',
      technique: artwork.technique || 'Estudio cromático personal.',
      digitalTip: artwork.digitalTip || 'Aplica estos tonos en composiciones digitales.',
      colors: artwork.colors || [
        { hex: '#222222', name: 'Base', weight: 40, role: 'Fondo' },
        { hex: '#666666', name: 'Medio', weight: 35, role: 'Estructura' },
        { hex: '#CCCCCC', name: 'Luz', weight: 25, role: 'Acento' }
      ],
      isCustom: true
    };

    customCat.artworks = customCat.artworks || [];
    customCat.artworks.unshift(newArt);
    this.saveCustomCatalogs();
    return newArt;
  }

  deleteArtwork(artworkId) {
    this.customCatalogs.forEach(cat => {
      if (cat.artworks) {
        cat.artworks = cat.artworks.filter(a => a.id !== artworkId);
      }
    });
    this.saveCustomCatalogs();
  }

  getArtworkById(id) {
    const foundDefault = MASTER_PALETTES.find(p => p.id === id);
    if (foundDefault) return foundDefault;

    for (const cat of this.customCatalogs) {
      const found = (cat.artworks || []).find(a => a.id === id);
      if (found) return found;
    }
    return null;
  }
}
