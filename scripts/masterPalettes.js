/**
 * GOM Picker - Master Painters Reference Palettes
 * Curated color palettes extracted from iconic artworks of legendary painters,
 * complete with historical notes, color usage weights, and high-res previews.
 */

export const MASTER_PALETTES = [
  {
    id: 'monet_waterlilies',
    artist: 'Claude Monet',
    title: 'Nenúfares (Water Lilies)',
    year: '1906',
    movement: 'Impresionismo',
    image: 'assets/samples/monet.png',
    description: 'Paleta impresionista dominada por verdes serenos de agua, reflejos violetas y destellos rosa pastel en sombras líquidas.',
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
    artist: 'Vincent van Gogh',
    title: 'La Noche Estrellada (The Starry Night)',
    year: '1889',
    movement: 'Postimpresionismo',
    image: 'assets/samples/vangogh.png',
    description: 'Contraste vibrante y cargado de emoción entre azules cobalto profundos y amarillos cadmio en giros cósmicos.',
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
    artist: 'Rembrandt van Rijn',
    title: 'Retrato de Anciano (Baroque Chiaroscuro)',
    year: '1654',
    movement: 'Barroco Holandés',
    image: 'assets/samples/rembrandt.png',
    description: 'Máximo exponente del claroscuro: sombras profundas en tierra de sombra tostada y luces cálidas en ocre dorado.',
    colors: [
      { hex: '#140E0A', name: 'Negro Marfil Umbra', weight: 45, role: 'Sombra Absoluta' },
      { hex: '#3B2314', name: 'Sombra Tostada Profunda', weight: 25, role: 'Fondo Atmosférico' },
      { hex: '#7A4822', name: 'Siena Tostada', weight: 15, role: 'Medio Tono Piel' },
      { hex: '#C2843A', name: 'Ocre Dorado Cálido', weight: 10, role: 'Luz Principal' },
      { hex: '#ECC47E', name: 'Amarillo Nápoles Alto', weight: 5, role: 'Brillo en Frente/Nari' }
    ]
  },
  {
    id: 'sorolla_beach',
    artist: 'Joaquín Sorolla',
    title: 'Paseo a Orillas del Mar',
    year: '1909',
    movement: 'Luminismo / Impresionismo Español',
    image: 'assets/samples/sorolla.png',
    description: 'Captura magistral de la luz mediterránea: blancos cegadores, reflejos violetas y azules marinos vibrantes.',
    colors: [
      { hex: '#F5F2EB', name: 'Blanco Marfil Sol', weight: 35, role: 'Túnicas y Reflejo Solar' },
      { hex: '#D1C4D9', name: 'Violeta Sombrilla', weight: 20, role: 'Sombras Transparente' },
      { hex: '#1B5B7D', name: 'Azul Mediterráneo', weight: 20, role: 'Mar de Valencia' },
      { hex: '#D99B6A', name: 'Arena Cálida', weight: 15, role: 'Orilla y Piel' },
      { hex: '#72A8B3', name: 'Espuma Celadón', weight: 10, role: 'Reflejos en Agua' }
    ]
  },
  {
    id: 'sargent_portrait',
    artist: 'John Singer Sargent',
    title: 'Madame X (Virginie Amélie Avegno Gautreau)',
    year: '1884',
    movement: 'Realismo / Retrato de Alta Sociedad',
    image: '',
    description: 'Elegancia aristocrática caracterizada por el contraste dramático entre la piel alabastro y vestidos de raso negro.',
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
    artist: 'Katsushika Hokusai',
    title: 'La Gran Ola de Kanagawa',
    year: '1831',
    movement: 'Ukiyo-e / Grabado Japonés',
    image: '',
    description: 'Obra maestra del grabado en madera con el primer uso célebre del Azul de Prusia en el arte japonés.',
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
    artist: 'Johannes Vermeer',
    title: 'La Joven de la Perla',
    year: '1665',
    movement: 'Siglo de Oro Holandés',
    image: '',
    description: 'Armonía íntima y luz envolvente basada en el rarísimo Azul Ultramar natural (Lapislázuli) y Amarillo Plomo-Estaño.',
    colors: [
      { hex: '#090C10', name: 'Fondo Oscuro Suave', weight: 45, role: 'Vacío Atmosférico' },
      { hex: '#1E4375', name: 'Lapislázuli Ultramar', weight: 20, role: 'Turbante Turco' },
      { hex: '#D9A74A', name: 'Amarillo Plomo-Estaño', weight: 15, role: 'Chaqueta de Paño' },
      { hex: '#E6D3C1', name: 'Piel Nácar', weight: 12, role: 'Rostro y Reflejo' },
      { hex: '#D6D6D6', name: 'Brillo de la Perla', weight: 8, role: 'Perla y Collar' }
    ]
  },
  {
    id: 'mucha_art_nouveau',
    artist: 'Alphonse Mucha',
    title: 'Las Estaciones (Art Nouveau)',
    year: '1896',
    movement: 'Art Nouveau',
    image: '',
    description: 'Líneas fluidas y tonos pastel terrosos enriquecidos con toques dorados, rosa empolvado y oliva.',
    colors: [
      { hex: '#E8D4BE', name: 'Marfil Antiguo', weight: 35, role: 'Fondo y Piel' },
      { hex: '#C27D72', name: 'Rosa Terracota Empolvado', weight: 25, role: 'Ropajes Orgánicos' },
      { hex: '#738363', name: 'Verde Oliva Art Nouveau', weight: 20, role: 'Vegetación Arabesco' },
      { hex: '#D4AA55', name: 'Oro Viejo Ocre', weight: 12, role: 'Marcos y Cabello' },
      { hex: '#52433D', name: 'Castaño Delineado', weight: 8, role: 'Línea de Contorno' }
    ]
  },
  {
    id: 'klimt_kiss',
    artist: 'Gustav Klimt',
    title: 'El Beso (The Kiss)',
    year: '1907',
    movement: 'Simbolismo / Fase Dorada',
    image: '',
    description: 'Opulencia decorativa mosaica donde láminas de pan de oro conviven con espirales negras, bronce y turquesas.',
    colors: [
      { hex: '#D4AF37', name: 'Pan de Oro Real', weight: 45, role: 'Manto de los Amantes' },
      { hex: '#8B6B23', name: 'Bronce Metálico', weight: 20, role: 'Tonalidad de Fondo' },
      { hex: '#1E6F5C', name: 'Turquesa Mosaico', weight: 15, role: 'Flores y Adornos' },
      { hex: '#1C1B1F', name: 'Rectángulo Negro Marfil', weight: 12, role: 'Patrones Masculinos' },
      { hex: '#E25B45', name: 'Rojo Carmín Adorno', weight: 8, role: 'Detalles Circulares' }
    ]
  }
];
