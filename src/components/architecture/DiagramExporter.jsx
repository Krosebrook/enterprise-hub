import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportAsPNG(canvasRef, filename = 'architecture-diagram.png') {
  try {
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: '#f3f4f6',
      scale: 2,
      useCORS: true
    });
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('PNG export failed:', error);
    throw error;
  }
}

export async function exportAsSVG(services, connections, filename = 'architecture-diagram.svg') {
  try {
    const svgContent = generateSVG(services, connections);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('SVG export failed:', error);
    throw error;
  }
}

export async function exportAsPDF(canvasRef, filename = 'architecture-diagram.pdf') {
  try {
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: '#f3f4f6',
      scale: 2,
      useCORS: true
    });

    const imgWidth = 297; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

export function exportAsMermaid(services, connections, filename = 'architecture-diagram.mmd') {
  try {
    let mermaid = 'graph TD\n';
    
    services.forEach(service => {
      const icon = service.has_api ? '🔌' : '📦';
      mermaid += `  ${service.id}["${icon} ${service.name}<br/>(${service.language || 'unknown'})"]\n`;
    });
    
    connections.forEach(conn => {
      const source = services.find(s => s.id === conn.source_service_id);
      const target = services.find(s => s.id === conn.target_service_id);
      if (source && target) {
        const style = conn.connection_type === 'async' ? '-.->|async|' : '-->';
        mermaid += `  ${source.id}${style}${target.id}\n`;
      }
    });
    
    const blob = new Blob([mermaid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Mermaid export failed:', error);
    throw error;
  }
}

export function exportAsPlantUML(services, connections, filename = 'architecture-diagram.puml') {
  try {
    let plantuml = '@startuml Architecture\n';
    plantuml += 'skinparam backgroundColor #FEFEFE\n\n';
    
    services.forEach(service => {
      const stereotype = service.database_type && service.database_type !== 'none' ? 'database' : 'component';
      plantuml += `[${service.name}] <<${stereotype}>>\n`;
    });
    
    plantuml += '\n';
    
    connections.forEach(conn => {
      const source = services.find(s => s.id === conn.source_service_id);
      const target = services.find(s => s.id === conn.target_service_id);
      if (source && target) {
        const arrow = conn.connection_type === 'async' ? '..>' : '-->';
        const label = conn.protocol || 'HTTP';
        plantuml += `[${source.name}] ${arrow} [${target.name}] : ${label}\n`;
      }
    });
    
    plantuml += '\n@enduml\n';
    
    const blob = new Blob([plantuml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PlantUML export failed:', error);
    throw error;
  }
}

function generateSVG(services, connections) {
  const width = 2000;
  const height = 1500;
  const serviceWidth = 200;
  const serviceHeight = 130;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #f3f4f6;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
    </marker>
  </defs>`;

  // Draw connections
  connections.forEach((conn) => {
    const source = services.find(s => s.id === conn.source_service_id);
    const target = services.find(s => s.id === conn.target_service_id);
    
    if (source && target) {
      const x1 = source.canvas_position_x + serviceWidth / 2;
      const y1 = source.canvas_position_y + serviceHeight / 2;
      const x2 = target.canvas_position_x + serviceWidth / 2;
      const y2 = target.canvas_position_y + serviceHeight / 2;

      const color = conn.connection_type === 'sync' ? '#3b82f6' : 
                   conn.connection_type === 'async' ? '#a855f7' : '#10b981';
      const strokeDasharray = conn.connection_type === 'async' ? '5,5' : 'none';

      svg += `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-dasharray="${strokeDasharray}" marker-end="url(#arrowhead)" />`;
    }
  });

  // Draw services
  services.forEach((service) => {
    const x = service.canvas_position_x;
    const y = service.canvas_position_y;
    const color = service.database_type !== 'none' ? '#10b981' : '#3b82f6';

    svg += `
  <rect x="${x}" y="${y}" width="${serviceWidth}" height="${serviceHeight}" rx="8" fill="white" stroke="${color}" stroke-width="2" />
  <text x="${x + serviceWidth / 2}" y="${y + 45}" text-anchor="middle" font-weight="600" font-size="14" fill="#1e293b">${service.name}</text>
  <text x="${x + serviceWidth / 2}" y="${y + 70}" text-anchor="middle" font-size="12" fill="#64748b">${service.language}</text>
  <text x="${x + serviceWidth / 2}" y="${y + 95}" text-anchor="middle" font-size="11" fill="#94a3b8">${service.api_type || 'API'}</text>`;
  });

  svg += `
</svg>`;

  return svg;
}