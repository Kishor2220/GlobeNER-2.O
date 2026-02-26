import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphData {
  nodes: any[];
  links: any[];
}

export const KnowledgeGraph = ({ data }: { data: GraphData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = React.useState<any>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", (d: any) => Math.min(0.2 + (d.strength * 0.1), 0.8))
      .attr("stroke-width", (d: any) => Math.min(1 + (d.strength * 0.5), 5));

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
        highlightNeighborhood(d);
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => 10 + (d.mentions_count || 0) * 0.5)
      .attr("fill", (d: any) => {
        switch (d.type) {
          case 'PER': return '#10b981';
          case 'LOC': return '#3b82f6';
          case 'ORG': return '#f59e0b';
          default: return '#6366f1';
        }
      })
      .attr("stroke", "#09090b")
      .attr("stroke-width", 2);

    node.append("text")
      .text((d: any) => d.name)
      .attr("x", 14)
      .attr("y", 4)
      .attr("fill", "#a1a1aa")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("font-family", "Inter, sans-serif");

    function highlightNeighborhood(d: any) {
      node.style("opacity", (n: any) => {
        const isNeighbor = data.links.some(l => 
          (l.source.id === d.id && l.target.id === n.id) || 
          (l.target.id === d.id && l.source.id === n.id) ||
          n.id === d.id
        );
        return isNeighbor ? 1 : 0.1;
      });
      link.style("opacity", (l: any) => {
        return (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05;
      });
    }

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data]);

  return (
    <div className="w-full h-full relative bg-zinc-950/20 rounded-xl border border-zinc-800/50 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Person</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Location</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Organization</div>
      </div>
    </div>
  );
};
