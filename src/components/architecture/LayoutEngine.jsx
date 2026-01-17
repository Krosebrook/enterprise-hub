// Force-directed graph layout algorithm
export function forceDirectedLayout(services, connections, iterations = 50) {
  const layoutServices = services.map(s => ({
    ...s,
    vx: 0,
    vy: 0,
    x: s.canvas_position_x,
    y: s.canvas_position_y
  }));

  const k = Math.sqrt((2000 * 1500) / layoutServices.length); // Optimal distance
  const damping = 0.99;

  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    layoutServices.forEach(s => {
      s.fx = 0;
      s.fy = 0;
    });

    // Repulsive forces (keep services apart)
    for (let i = 0; i < layoutServices.length; i++) {
      for (let j = i + 1; j < layoutServices.length; j++) {
        const dx = layoutServices[j].x - layoutServices[i].x;
        const dy = layoutServices[j].y - layoutServices[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (k * k) / distance;
        
        layoutServices[i].fx -= (dx / distance) * force;
        layoutServices[i].fy -= (dy / distance) * force;
        layoutServices[j].fx += (dx / distance) * force;
        layoutServices[j].fy += (dy / distance) * force;
      }
    }

    // Attractive forces (pull connected services closer)
    connections.forEach(conn => {
      const source = layoutServices.find(s => s.id === conn.source_service_id);
      const target = layoutServices.find(s => s.id === conn.target_service_id);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance * distance) / k;
        
        source.fx += (dx / distance) * force;
        source.fy += (dy / distance) * force;
        target.fx -= (dx / distance) * force;
        target.fy -= (dy / distance) * force;
      }
    });

    // Apply forces and damping
    layoutServices.forEach(s => {
      s.vx = (s.vx + s.fx) * damping;
      s.vy = (s.vy + s.fy) * damping;
      s.x += s.vx;
      s.y += s.vy;

      // Keep within bounds
      s.x = Math.max(50, Math.min(1850, s.x));
      s.y = Math.max(50, Math.min(1400, s.y));
    });
  }

  return layoutServices.map(s => ({
    id: s.id,
    canvas_position_x: Math.round(s.x),
    canvas_position_y: Math.round(s.y)
  }));
}

// Hierarchical layout (top-down)
export function hierarchicalLayout(services, connections) {
  const levelMap = new Map();
  
  const getLevel = (serviceId, visited = new Set()) => {
    if (visited.has(serviceId)) return 0;
    if (levelMap.has(serviceId)) return levelMap.get(serviceId);
    
    visited.add(serviceId);
    const incomingConns = connections.filter(c => c.target_service_id === serviceId);
    
    if (incomingConns.length === 0) {
      levelMap.set(serviceId, 0);
      return 0;
    }
    
    const maxLevel = Math.max(...incomingConns.map(c => getLevel(c.source_service_id, visited)));
    levelMap.set(serviceId, maxLevel + 1);
    return maxLevel + 1;
  };

  // Calculate levels
  services.forEach(s => getLevel(s.id));

  // Group by level
  const levelGroups = new Map();
  services.forEach(s => {
    const level = levelMap.get(s.id) || 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level).push(s);
  });

  // Position services
  const layoutServices = [];
  const levelArray = Array.from(levelGroups.entries()).sort((a, b) => a[0] - b[0]);
  
  levelArray.forEach(([level, levelServices], levelIndex) => {
    const yPos = 150 + levelIndex * 300;
    const totalWidth = (levelServices.length - 1) * 300 + 200;
    const startX = Math.max(50, (1900 - totalWidth) / 2);

    levelServices.forEach((service, index) => {
      const xPos = startX + index * 300;
      layoutServices.push({
        id: service.id,
        canvas_position_x: Math.round(xPos),
        canvas_position_y: Math.round(yPos)
      });
    });
  });

  return layoutServices;
}