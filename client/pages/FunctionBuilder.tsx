import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Copy, GitBranchPlus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Template = {
  id: string;
  label: string;
  description: string;
  inputs: number;
  outputs: number;
  code: string;
};

type Node = {
  id: string;
  templateId: string;
  name: string;
  description: string;
  code: string;
  inputs: number;
  outputs: number;
  x: number;
  y: number;
};

type Edge = {
  id: string;
  fromNodeId: string;
  fromPort: number;
  toNodeId: string;
  toPort: number;
};

type NodeDrag = { nodeId: string; offsetX: number; offsetY: number };
type Draft = { fromNodeId: string; fromPort: number; x: number; y: number };

const NODE_W = 248;
const PORT_START = 60;
const PORT_GAP = 20;
const MAX_PORTS = 4;

const TEMPLATES: Template[] = [
  {
    id: "trigger",
    label: "Trigger",
    description: "Initialize state before executing downstream functions.",
    inputs: 0,
    outputs: 1,
    code: "state.startedAt = new Date().toISOString();",
  },
  {
    id: "effect",
    label: "CommonJS Effect",
    description: "Run custom CommonJS function logic.",
    inputs: 1,
    outputs: 1,
    code: "state.points = (state.points ?? 0) + 50;",
  },
  {
    id: "api",
    label: "API Function",
    description: "Fetch data and map response into state.",
    inputs: 1,
    outputs: 1,
    code:
      'const response = await fetch("/api/ping", { method: "GET" });\nstate.lastApi = await response.json().catch(() => null);',
  },
  {
    id: "condition",
    label: "Condition Gate",
    description: "Stop execution when a condition fails.",
    inputs: 1,
    outputs: 1,
    code:
      'if (!(state.member?.active)) {\n  return { stop: true, reason: "Inactive member" };\n}',
  },
  {
    id: "delay",
    label: "Delay",
    description: "Pause between side effects.",
    inputs: 1,
    outputs: 1,
    code: "await new Promise((resolve) => setTimeout(resolve, 250));",
  },
  {
    id: "end",
    label: "End",
    description: "Finalize and return state.",
    inputs: 1,
    outputs: 0,
    code: "state.completed = true;",
  },
];

const NODES: Node[] = [
  fromTemplate("trigger", 120, 260),
  fromTemplate("effect", 410, 260),
  fromTemplate("api", 700, 260),
  fromTemplate("end", 990, 260),
];

const EDGES: Edge[] = [
  { id: uid("e"), fromNodeId: NODES[0].id, fromPort: 0, toNodeId: NODES[1].id, toPort: 0 },
  { id: uid("e"), fromNodeId: NODES[1].id, fromPort: 0, toNodeId: NODES[2].id, toPort: 0 },
  { id: uid("e"), fromNodeId: NODES[2].id, fromPort: 0, toNodeId: NODES[3].id, toPort: 0 },
];

export default function FunctionBuilder() {
  const [nodes, setNodes] = useState<Node[]>(NODES);
  const [edges, setEdges] = useState<Edge[]>(EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState(NODES[1].id);
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [dragging, setDragging] = useState<NodeDrag | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [query, setQuery] = useState("");
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const visibleTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.code.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const point = toCanvasPoint(event.clientX, event.clientY, viewportRef.current);
      if (!point) return;

      if (dragging) {
        setNodes((current) =>
          current.map((node) =>
            node.id === dragging.nodeId
              ? { ...node, x: Math.max(24, point.x - dragging.offsetX), y: Math.max(24, point.y - dragging.offsetY) }
              : node,
          ),
        );
      }
      if (draft) {
        setDraft((current) => (current ? { ...current, x: point.x, y: point.y } : null));
      }
    };

    const up = () => {
      setDragging(null);
      setDraft(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, draft]);

  useEffect(() => {
    setEdges((current) =>
      current.filter((edge) => {
        const from = nodeMap.get(edge.fromNodeId);
        const to = nodeMap.get(edge.toNodeId);
        return !!from && !!to && edge.fromPort < from.outputs && edge.toPort < to.inputs;
      }),
    );
  }, [nodeMap]);

  const orderedNodes = useMemo(() => executionOrder(nodes, edges), [nodes, edges]);
  const commonJs = useMemo(() => generateCommonJs(orderedNodes, edges, nodeMap), [orderedNodes, edges, nodeMap]);

  const onDropCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const templateId =
      event.dataTransfer.getData("application/x-homeplate-function-node") ||
      event.dataTransfer.getData("text/plain");
    const template = TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) return;

    const point = toCanvasPoint(event.clientX, event.clientY, viewportRef.current);
    if (!point) return;

    const next = fromTemplate(template.id, Math.max(24, point.x - NODE_W / 2), Math.max(24, point.y - 48));
    setNodes((current) => [...current, next]);
    setSelectedNodeId(next.id);
    setSelectedEdgeId("");
  };

  const onConnectToInput = (event: React.PointerEvent<HTMLButtonElement>, toNode: Node, toPort: number) => {
    event.stopPropagation();
    if (!draft || draft.fromNodeId === toNode.id) return;
    setEdges((current) => {
      const withoutTarget = current.filter((edge) => !(edge.toNodeId === toNode.id && edge.toPort === toPort));
      return [
        ...withoutTarget,
        { id: uid("e"), fromNodeId: draft.fromNodeId, fromPort: draft.fromPort, toNodeId: toNode.id, toPort },
      ];
    });
    setDraft(null);
  };

  const removeNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId("");
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    const next: Node = { ...selectedNode, id: uid("n"), name: `${selectedNode.name} Copy`, x: selectedNode.x + 28, y: selectedNode.y + 28 };
    setNodes((current) => [...current, next]);
    setSelectedNodeId(next.id);
    setSelectedEdgeId("");
  };

  return (
    <AppShell
      title="Function Builder"
      description="Drag CommonJS function nodes onto canvas, connect ports, and generate effect-chain code."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">{nodes.length} nodes</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">{edges.length} links</Badge>
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader><CardTitle className="text-base font-black">CommonJS Toolbox</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." className="h-9 text-xs" />
            <div className="space-y-2">
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-homeplate-function-node", template.id);
                    event.dataTransfer.setData("text/plain", template.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => {
                    const next = fromTemplate(template.id, 160 + nodes.length * 20, 140 + nodes.length * 16);
                    setNodes((current) => [...current, next]);
                    setSelectedNodeId(next.id);
                    setSelectedEdgeId("");
                  }}
                  className="w-full rounded-2xl border border-border/60 bg-background/80 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{template.label}</span>
                    <Badge variant="outline" className="px-2 py-0 text-[10px]">{template.inputs} in / {template.outputs} out</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{template.description}</p>
                  <pre className="mt-2 max-h-14 overflow-hidden rounded-xl border border-border/60 bg-black p-2 text-[10px] text-slate-200">{template.code}</pre>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <GitBranchPlus className="h-4 w-4 text-primary" />
              Drag-and-Drop Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={viewportRef} className="relative h-[680px] overflow-auto rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.15),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]" onDrop={onDropCanvas} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onClick={() => { setSelectedNodeId(""); setSelectedEdgeId(""); }}>
              <div className="relative" style={{ minWidth: 1650, minHeight: 1080 }}>
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                  {edges.map((edge) => {
                    const from = nodeMap.get(edge.fromNodeId);
                    const to = nodeMap.get(edge.toNodeId);
                    if (!from || !to) return null;
                    const start = port(from, "out", edge.fromPort);
                    const end = port(to, "in", edge.toPort);
                    const active = selectedEdgeId === edge.id;
                    return (
                      <path key={edge.id} d={curve(start, end)} className={active ? "pointer-events-auto cursor-pointer stroke-primary" : "pointer-events-auto cursor-pointer stroke-slate-500/80"} strokeWidth={active ? 3 : 2} fill="none" onClick={(event) => { event.stopPropagation(); setSelectedNodeId(""); setSelectedEdgeId(edge.id); }} />
                    );
                  })}
                  {draft ? (() => {
                    const from = nodeMap.get(draft.fromNodeId);
                    if (!from) return null;
                    return <path d={curve(port(from, "out", draft.fromPort), { x: draft.x, y: draft.y })} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 4" fill="none" />;
                  })() : null}
                </svg>
*** End Patch
