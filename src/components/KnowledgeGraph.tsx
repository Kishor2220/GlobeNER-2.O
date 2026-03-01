import * as React from "react";
import * as d3 from "d3";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Loader2, Share2, RefreshCw, Network, ZoomIn, ZoomOut, Maximize, Target, Info, Shield, MapPin, Building2, User } from "lucide-react";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";

export function KnowledgeGraph() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = React.useState<any>(null);
  const [hoverPosition, setHoverPosition] = React.useState({ x: 0, y: 0 });
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const isFocusModeRef = React.useRef(isFocusMode);

  React.useEffect(() => {
    isFocusModeRef.current = isFocusMode;
  }, [isFocusMode]);

  const { data: graphData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['knowledgeGraph'],
    queryFn: async () => {
      const response = await axios.get("/api/analytics", { timeout: 5000 });
      if (response.data?.relationships && Array.isArray(response.data.relationships.nodes) && response.data.relationships.nodes.length > 0) {
        return response.data.relationships;
      }
      return { nodes: [], links: [] };
    },
    staleTime: 30000,
  });

  const data = graphData;
  const error = queryError ? (queryError as Error).message : null;
  const fetchData = () => refetch();

  React.useEffect(() => {
    if (!data || !svgRef.current || !Array.isArray(data.nodes) || data.nodes.length === 0) return;

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

    // Define Glow Filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Expose zoom functions to window for buttons
    (window as any).zoomIn = () => svg.transition().duration(300).call((zoom as any).scaleBy, 1.3);
    (window as any).zoomOut = () => svg.transition().duration(300).call((zoom as any).scaleBy, 1 / 1.3);
    (window as any).zoomFit = () => svg.transition().duration(750).call((zoom as any).transform, d3.zoomIdentity);

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(Array.isArray(data.links) ? data.links : []).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.rank * 3) + 40));

    const link = g.append("g")
      .selectAll("line")
      .data(Array.isArray(data.links) ? data.links : [])
      .join("line")
      .attr("stroke", (d: any) => {
        if (d.trend === 'NEW') return "#34d399"; // emerald-400 for new
        if (d.trend === 'STRENGTHENING') return "#818cf8"; // indigo-400 for strengthening
        if (d.trend === 'WEAKENING') return "#fbbf24"; // amber-400 for weakening
        if (d.trend === 'FADING') return "#f87171"; // red-400 for fading
        return "#3f3f46";
      })
      .attr("stroke-opacity", (d: any) => {
        const lastSeenTime = new Date(d.last_seen).getTime();
        const daysSince = (new Date().getTime() - lastSeenTime) / (1000 * 60 * 60 * 24);
        const fadeFactor = Math.max(0.1, 1 - (daysSince / 7)); // fade over 7 days
        return Math.min(fadeFactor * (0.2 + (d.strength * 0.1)), 0.8);
      })
      .attr("stroke-width", (d: any) => Math.min(1 + (d.strength * 0.8), 8))
      .attr("stroke-dasharray", (d: any) => d.trend === 'NEW' ? "4,4" : "0");

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any)
      .on("mouseover", (event, d: any) => {
        setHoveredNode(d);
        setHoverPosition({ x: event.pageX, y: event.pageY });
        
        // Highlight connections on hover
        if (!isFocusModeRef.current) {
          node.style("opacity", (n: any) => {
            const isConnected = data.links.some((l: any) => 
              (l.source.id === d.id && l.target.id === n.id) || 
              (l.target.id === d.id && l.source.id === n.id) ||
              n.id === d.id
            );
            return isConnected ? 1 : 0.15;
          });
          
          link.style("opacity", (l: any) => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05
          );
        }
      })
      .on("mousemove", (event) => {
        setHoverPosition({ x: event.pageX, y: event.pageY });
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        if (!isFocusModeRef.current) {
          node.style("opacity", 1);
          link.style("opacity", (d: any) => {
            const lastSeenTime = new Date(d.last_seen).getTime();
            const daysSince = (new Date().getTime() - lastSeenTime) / (1000 * 60 * 60 * 24);
            const fadeFactor = Math.max(0.1, 1 - (daysSince / 7));
            return Math.min(fadeFactor * (0.2 + (d.strength * 0.1)), 0.8);
          });
        }
      })
      .on("click", (event, d: any) => {
        // Central Focus Mode
        setIsFocusMode(true);
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.5)
          .translate(-d.x, -d.y);
        
        svg.transition().duration(750).call(zoom.transform as any, transform);
        
        // Highlight connections
        node.style("opacity", (n: any) => {
          const isConnected = data.links.some((l: any) => 
            (l.source.id === d.id && l.target.id === n.id) || 
            (l.target.id === d.id && l.source.id === n.id) ||
            n.id === d.id
          );
          return isConnected ? 1 : 0.05;
        });
        
        link.style("opacity", (l: any) => 
          (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.02
        );

        event.stopPropagation();
      });

    // Reset focus on background click
    svg.on("click", () => {
      setIsFocusMode(false);
      node.style("opacity", 1);
      link.style("opacity", (d: any) => {
        const lastSeenTime = new Date(d.last_seen).getTime();
        const daysSince = (new Date().getTime() - lastSeenTime) / (1000 * 60 * 60 * 24);
        const fadeFactor = Math.max(0.1, 1 - (daysSince / 7));
        return Math.min(fadeFactor * (0.2 + (d.strength * 0.1)), 0.8);
      });
    });

    // Node Circle
    node.append("circle")
      .attr("r", (d: any) => Math.max(10, Math.min(30, d.rank * 2 + 8)))
      .attr("fill", (d: any) => {
        const opacity = Math.min(0.3 + (d.activity * 0.1), 1);
        if (d.label === "PER") return `rgba(99, 102, 241, ${opacity})`;
        if (d.label === "LOC") return `rgba(16, 185, 129, ${opacity})`;
        if (d.label === "ORG") return `rgba(168, 85, 247, ${opacity})`;
        return `rgba(113, 113, 122, ${opacity})`;
      })
      .attr("stroke", (d: any) => {
        if (d.label === "PER") return "#818cf8";
        if (d.label === "LOC") return "#34d399";
        if (d.label === "ORG") return "#c084fc";
        return "#a1a1aa";
      })
      .attr("stroke-width", (d: any) => d.rank > 5 ? 3 : 1.5)
      .style("filter", (d: any) => d.rank > 7 ? "url(#glow)" : "none");

    // Frequency Count on Node
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", (d: any) => Math.max(8, Math.min(12, d.rank + 6)))
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .text((d: any) => d.frequency > 9 ? d.frequency : "");

    const label = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#a1a1aa")
      .attr("dx", (d: any) => Math.max(12, d.rank * 2 + 10))
      .attr("dy", 4)
      .text((d: any) => d.name.toUpperCase())
      .style("pointer-events", "none")
      .style("opacity", (d: any) => d.rank > 5 ? 1 : 0.4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

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
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Knowledge Network</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Visualizing complex behavioral relationships and intelligence co-occurrences.</p>
        </div>
        <div className="flex items-center gap-2">
          {isFocusMode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFocusMode(false)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Clear Focus
            </Button>
          )}
          <Tooltip content="Refresh graph data" position="top">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 shadow-sm">
              <RefreshCw className={isLoading ? "animate-spin h-4 w-4 text-indigo-400" : "h-4 w-4 text-indigo-400"} />
              Refresh Network
            </Button>
          </Tooltip>
        </div>
      </div>

      <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#0a0a0a]/80 backdrop-blur-xl overflow-hidden flex flex-col min-h-[700px]">
        <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Network className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-zinc-100">Intelligence Topology</CardTitle>
                <CardDescription className="text-xs mt-1 text-zinc-400">Interactive force-directed graph with behavioral intelligence cues</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-indigo-400" /> Person</div>
              <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-emerald-400" /> Location</div>
              <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-purple-400" /> Organization</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-[#050505] relative flex-1" ref={containerRef}>
          {isLoading && (
            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-sm text-zinc-400 font-medium animate-pulse">Scanning intelligence nodes...</p>
            </div>
          )}
          
          {hoveredNode && (
            <div 
              className="fixed z-50 pointer-events-none intel-card p-4 w-64 space-y-3"
              style={{ 
                left: hoverPosition.x + 20, 
                top: hoverPosition.y - 20,
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{hoveredNode.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{hoveredNode.label}</p>
                </div>
                <div className="h-6 w-6 rounded bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                  {hoveredNode.label === 'PER' ? <User className="h-3 w-3 text-indigo-400" /> :
                   hoveredNode.label === 'LOC' ? <MapPin className="h-3 w-3 text-emerald-400" /> :
                   <Building2 className="h-3 w-3 text-purple-400" />}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold">Rank Score</p>
                  <p className="text-xs font-mono text-indigo-400">{hoveredNode.rank.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold">Frequency</p>
                  <p className="text-xs font-mono text-emerald-400">{hoveredNode.frequency}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/50">
                <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Last Intelligence Signal</p>
                <p className="text-[10px] text-zinc-400 font-mono">{new Date(hoveredNode.last_seen).toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-2 text-[8px] text-zinc-600 italic">
                <Info className="h-2 w-2" />
                Click to focus intelligence
              </div>
            </div>
          )}

          {(!data || !Array.isArray(data.nodes) || data.nodes.length === 0) && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 text-zinc-500">
              <div className="h-16 w-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No relationships detected yet</p>
              <p className="text-xs mt-1">Process documents to build the knowledge graph</p>
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3">
             <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400" />
                 <span className="text-[10px] font-mono text-zinc-500 uppercase">New Signal</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-400" />
                 <span className="text-[10px] font-mono text-zinc-500 uppercase">Strengthening</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <span className="text-[10px] font-mono text-zinc-500 uppercase">Weakening</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-400" />
                 <span className="text-[10px] font-mono text-zinc-500 uppercase">Fading</span>
               </div>
             </div>
          </div>

          <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800/60 shadow-2xl">
            <Tooltip content="Zoom In" position="left">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg" onClick={() => (window as any).zoomIn?.()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Zoom Out" position="left">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg" onClick={() => (window as any).zoomOut?.()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="h-px w-full bg-zinc-800 my-0.5" />
            <Tooltip content="Fit to Screen" position="left">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg" onClick={() => (window as any).zoomFit?.()}>
                <Maximize className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="h-px w-full bg-zinc-800 my-0.5" />
            <Tooltip content="Focus Mode" position="left">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 rounded-lg ${isFocusMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`} 
              >
                <Target className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <svg 
            ref={svgRef} 
            width="100%" 
            height="700" 
            className="cursor-grab active:cursor-grabbing w-full h-full min-h-[700px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
