import * as React from "react";
import * as d3 from "d3";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Loader2, Share2, RefreshCw, Network, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "./ui/Button";

export function KnowledgeGraph() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/analytics");
      if (response.data.relationships && response.data.relationships.nodes.length > 0) {
        setData(response.data.relationships);
      } else {
        setData({ nodes: [], links: [] });
      }
    } catch (error: any) {
      console.error("Failed to fetch relationships", error);
      setError("Unable to load knowledge graph data.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add zoom capabilities
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const g = svg.append("g");

    // Expose zoom functions to window for buttons
    (window as any).zoomIn = () => svg.transition().duration(300).call((zoom as any).scaleBy, 1.3);
    (window as any).zoomOut = () => svg.transition().duration(300).call((zoom as any).scaleBy, 1 / 1.3);
    (window as any).zoomFit = () => svg.transition().duration(750).call((zoom as any).transform, d3.zoomIdentity);

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    const link = g.append("g")
      .attr("stroke", "#3f3f46")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.max(1, Math.sqrt(d.value)));

    const node = g.append("g")
      .attr("stroke", "#18181b")
      .attr("stroke-width", 2)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d: any) => Math.max(6, Math.min(16, d.value * 2 || 8)))
      .attr("fill", (d: any) => {
        if (d.label === "PER") return "#6366f1"; // indigo-500
        if (d.label === "LOC") return "#10b981"; // emerald-500
        if (d.label === "ORG") return "#a855f7"; // purple-500
        return "#71717a";
      })
      .call(drag(simulation) as any);

    node.append("title")
      .text((d: any) => `${d.name} (${d.label}) - ${d.value || 1} occurrences`);

    const label = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", "500")
      .attr("fill", "#d4d4d8")
      .attr("dx", 14)
      .attr("dy", 4)
      .text((d: any) => d.name)
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
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
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, [data]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Knowledge Graph</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Visualizing complex relationships and co-occurrences between extracted entities.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 shadow-sm">
          <RefreshCw className={isLoading ? "animate-spin h-4 w-4 text-indigo-400" : "h-4 w-4 text-indigo-400"} />
          Refresh Graph
        </Button>
      </div>

      <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
                <Network className="h-4 w-4 text-indigo-400" />
                Entity Network
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-zinc-400">Interactive force-directed graph of entity connections</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" /> Person</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Location</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> Organization</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-[#0a0a0a] relative flex-1" ref={containerRef}>
          {isLoading && (
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-sm text-zinc-400 font-medium animate-pulse">Rendering network topology...</p>
            </div>
          )}
          {data?.nodes.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 text-zinc-500">
              <div className="h-16 w-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No relationships detected yet</p>
              <p className="text-xs mt-1">Process documents to build the knowledge graph</p>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-lg border border-zinc-800/60 shadow-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" title="Zoom In" onClick={() => (window as any).zoomIn?.()}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" title="Zoom Out" onClick={() => (window as any).zoomOut?.()}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="h-px w-full bg-zinc-800 my-0.5" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" title="Fit to Screen" onClick={() => (window as any).zoomFit?.()}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <svg 
            ref={svgRef} 
            width="100%" 
            height="600" 
            className="cursor-grab active:cursor-grabbing w-full h-full min-h-[600px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
