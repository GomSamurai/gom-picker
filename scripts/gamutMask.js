/**
 * GOM Picker - James Gurney Gamut Masking Engine
 * Creates geometric gamut limiters over the color wheel to guarantee
 * unified atmospheric mood, eliminate chromatic discordance, and enforce limited color schemes.
 */

import { ColorMath } from './colorMath.js';

export const GamutMaskEngine = {
  state: {
    enabled: false,
    shape: 'triangle', // 'triangle' | 'diamond' | 'slit' | 'sector' | 'ellipse'
    rotation: 45, // Angle in degrees
    scale: 0.65, // Size relative to inner circle
    centerOffset: 0.25, // Shift toward warm or cool side (0 = neutral center)
    opacity: 0.72 // Darkness of masked-out area
  },

  // Historic and Artistic Gamut Presets popularized by James Gurney
  PRESETS: [
    {
      id: 'triad_warm',
      name: 'Tríada Cálida (Gurney)',
      shape: 'triangle',
      rotation: 40,
      scale: 0.65,
      centerOffset: 0.2,
      desc: 'Dominancia ocre y siena con acento turquesa contenido.'
    },
    {
      id: 'complementary_slit',
      name: 'Hendidura Complementaria',
      shape: 'slit',
      rotation: 30,
      scale: 0.8,
      centerOffset: 0.0,
      desc: 'Banda estrecha entre dos extremos opuestos para máximo drama.'
    },
    {
      id: 'twilight_blue',
      name: 'Crepúsculo Azul Marino',
      shape: 'diamond',
      rotation: 220,
      scale: 0.55,
      centerOffset: 0.35,
      desc: 'Atmósfera fría nocturna donde los rojos se vuelven casi neutros.'
    },
    {
      id: 'desert_amber',
      name: 'Desierto Ámbar & Terracota',
      shape: 'triangle',
      rotation: 45,
      scale: 0.6,
      centerOffset: 0.4,
      desc: 'Sol abrasador y polvo; elimina totalmente los azules y verdes vívidos.'
    },
    {
      id: 'mood_diamond',
      name: 'Diamante Armónico Equilibrado',
      shape: 'diamond',
      rotation: 120,
      scale: 0.7,
      centerOffset: 0.1,
      desc: 'Equilibrio armónico con medios tonos ricos y saturación controlada.'
    },
    {
      id: 'muted_analogous',
      name: 'Sector Análogo Apacible',
      shape: 'sector',
      rotation: 90,
      scale: 0.6,
      centerOffset: 0.3,
      desc: 'Gama suave restringida a verdes y amarillos para paisajes bucólicos.'
    }
  ],

  // Renders the gamut mask overlay onto the Color Wheel Canvas context
  drawMask(ctx, center, innerRadius) {
    if (!this.state.enabled) return;

    ctx.save();

    // 1. Clip to the inner wheel area
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    // 2. Compute mask polygon vertices in polar coordinates
    const vertices = this.getMaskPolygonVertices(center, innerRadius);

    // 3. Draw the dark translucent shroud over the wheel, cutting out the mask aperture
    ctx.beginPath();
    // Outer bounding rectangle
    ctx.rect(center - innerRadius, center - innerRadius, innerRadius * 2, innerRadius * 2);

    // Inner cutout aperture (counter-clockwise winding to subtract)
    if (this.state.shape === 'ellipse') {
      const rotRad = (this.state.rotation * Math.PI) / 180;
      const offDist = innerRadius * this.state.centerOffset;
      const cx = center + offDist * Math.cos(rotRad);
      const cy = center + offDist * Math.sin(rotRad);
      const rx = innerRadius * this.state.scale * 0.75;
      const ry = innerRadius * this.state.scale * 0.45;
      ctx.ellipse(cx, cy, rx, ry, rotRad, Math.PI * 2, 0, true);
    } else if (vertices.length > 2) {
      for (let i = vertices.length - 1; i >= 0; i--) {
        const v = vertices[i];
        if (i === vertices.length - 1) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
    }

    ctx.fillStyle = `rgba(11, 11, 15, ${this.state.opacity})`;
    ctx.fill();

    // 4. Draw glowing luminous boundary contour around the aperture
    ctx.beginPath();
    if (this.state.shape === 'ellipse') {
      const rotRad = (this.state.rotation * Math.PI) / 180;
      const offDist = innerRadius * this.state.centerOffset;
      const cx = center + offDist * Math.cos(rotRad);
      const cy = center + offDist * Math.sin(rotRad);
      const rx = innerRadius * this.state.scale * 0.75;
      const ry = innerRadius * this.state.scale * 0.45;
      ctx.ellipse(cx, cy, rx, ry, rotRad, 0, Math.PI * 2);
    } else if (vertices.length > 2) {
      vertices.forEach((v, idx) => {
        if (idx === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
    }
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
  },

  // Compute vertices for polygon mask shapes
  getMaskPolygonVertices(center, radius) {
    const rotRad = (this.state.rotation * Math.PI) / 180;
    const offDist = radius * this.state.centerOffset;
    const cx = center + offDist * Math.cos(rotRad);
    const cy = center + offDist * Math.sin(rotRad);
    const sz = radius * this.state.scale;

    const vertices = [];

    if (this.state.shape === 'triangle') {
      // Equilateral triangle oriented by rotation
      for (let i = 0; i < 3; i++) {
        const a = rotRad + (i * 2 * Math.PI) / 3;
        vertices.push({
          x: cx + sz * Math.cos(a),
          y: cy + sz * Math.sin(a)
        });
      }
    } else if (this.state.shape === 'diamond') {
      // Diamond oriented with major and minor axes
      const a = rotRad;
      const major = sz;
      const minor = sz * 0.5;
      vertices.push({ x: cx + major * Math.cos(a), y: cy + major * Math.sin(a) });
      vertices.push({ x: cx + minor * Math.cos(a + Math.PI / 2), y: cy + minor * Math.sin(a + Math.PI / 2) });
      vertices.push({ x: cx + major * Math.cos(a + Math.PI), y: cy + major * Math.sin(a + Math.PI) });
      vertices.push({ x: cx + minor * Math.cos(a - Math.PI / 2), y: cy + minor * Math.sin(a - Math.PI / 2) });
    } else if (this.state.shape === 'slit') {
      // Narrow rectangular slit across wheel
      const a = rotRad;
      const len = radius * 0.95;
      const w = sz * 0.22;
      const p1 = { x: -len, y: -w };
      const p2 = { x: len, y: -w };
      const p3 = { x: len, y: w };
      const p4 = { x: -len, y: w };

      [p1, p2, p3, p4].forEach(p => {
        const rx = p.x * Math.cos(a) - p.y * Math.sin(a);
        const ry = p.x * Math.sin(a) + p.y * Math.cos(a);
        vertices.push({ x: center + rx, y: center + ry });
      });
    } else if (this.state.shape === 'sector') {
      // Circular pie sector
      const startAngle = rotRad - 0.55;
      const endAngle = rotRad + 0.55;
      vertices.push({ x: center, y: center });
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const ang = startAngle + (i / steps) * (endAngle - startAngle);
        vertices.push({ x: center + sz * Math.cos(ang), y: center + sz * Math.sin(ang) });
      }
    }

    return vertices;
  },

  // Check if point (x, y) is inside polygon aperture
  isPointInMask(x, y, center, radius) {
    if (!this.state.enabled) return true;
    const vertices = this.getMaskPolygonVertices(center, radius);
    if (vertices.length < 3) return true;

    // Ray-casting algorithm
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
};
