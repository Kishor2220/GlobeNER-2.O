import * as React from "react";
import * as d3 from "d3";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Loader2, Share2, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

export function KnowledgeGraph() {
  const svgRef = React.useRef<SVGSVGElement>(null);
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

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => {
        if (d.label === "PER") return "#3b82f6";
        if (d.label === "LOC") return "#22c55e";
        if (d.label === "ORG") return "#a855f7";
        return "#71717a";
      })
      .call(drag(simulation) as any);

    node.append("title")
      .text((d: any) => `${d.name} (${d.label})`);

    const label = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("font-size", "10px")
      .attr("fill", "#3f3f46")
      .attr("dx", 12)
      .attr("dy", 4)
      .text((d: any) => d.name);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Knowledge Graph</h1>
          <p className="text-zinc-500">Visualizing relationships and co-occurrences between entities.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className={isLoading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
          Refresh Graph
        </Button>
      </div>

      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-4 w-4 text-zinc-500" />
              Entity Network
            </CardTitle>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Person</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Location</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Organization</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
          {data?.nodes.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 text-zinc-400">
              <Share2 className="h-12 w-12 opacity-20 mb-4" />
              <p className="text-sm">No relationships detected yet. Process some documents to see the graph.</p>
            </div>
          )}
          <svg 
            ref={svgRef} 
            width="100%" 
            height="600" 
            viewBox="0 0 800 600" 
            className="cursor-move"
          />
        </CardContent>
      </Card>
    </div>
  );
}
