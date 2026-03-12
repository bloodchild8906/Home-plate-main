import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Copy, GitBranchPlus, RotateCcw, Trash2 } from "lucide-react";
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

type GraphNode = {
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

type GraphEdge = {
  id: string;
  fromNodeId: string;
  fromPort: number;
  toNodeId: string;
  toPort: number;
};

type DragState = { nodeId: string; offsetX: number; offsetY: number };
type LinkDraft = { fromNodeId: string; fromPort: number; x: number; y: number };

const NODE_WIDTH = 248;
const PORT_TOP = 64;
const PORT_GAP = 20;
const MAX_PORTS = 4;
const STORAGE_KEY = "homeplate:function-graph:v1";

const TEMPLATES: Template[] = [
  {
    id: "trigger",
    label: "Trigger",
    description: "Graph entry. Initialize state for downstream functions.",
    inputs: 0,
    outputs: 1,
    code: "state.startedAt = new Date().toISOString();",
  },
  {
    id: "effect",
    label: "CommonJS Effect",
    description: "Custom business logic function.",
    inputs: 1,
    outputs: 1,
    code: "state.points = (state.points ?? 0) + 50;",
  },
  {
    id: "api",
    label: "API Function",
    description: "Call endpoint and map response.",
    inputs: 1,
    outputs: 1,
    code:
      'const response = await fetch("/api/ping", { method: "GET" });\nstate.lastApi = await response.json().catch(() => null);',
  },
  {
    id: "condition",
    label: "Condition Gate",
    description: "Stop pipeline when condition fails.",
    inputs: 1,
    outputs: 1,
    code:
      'if (!(state.member?.active)) {\n  return { stop: true, reason: "Member inactive" };\n}',
  },
  {
    id: "delay",
    label: "Delay",
    description: "Pause before next node.",
    inputs: 1,
    outputs: 1,
    code: "await new Promise((resolve) => setTimeout(resolve, 250));",
  },
  {
    id: "end",
    label: "End",
    description: "Finalize state before return.",
    inputs: 1,
    outputs: 0,
    code: "state.completed = true;",
  },
];

const START_NODES: GraphNode[] = [
  createNode("trigger", 120, 240),
  createNode("effect", 420, 240),
  createNode("api", 720, 240),
  createNode("end", 1020, 240),
];

const START_EDGES: GraphEdge[] = [
  { id: uid("edge"), fromNodeId: START_NODES[0].id, fromPort: 0, toNodeId: START_NODES[1].id, toPort: 0 },
  { id: uid("edge"), fromNodeId: START_NODES[1].id, fromPort: 0, toNodeId: START_NODES[2].id, toPort: 0 },
  { id: uid("edge"), fromNodeId: START_NODES[2].id, fromPort: 0, toNodeId: START_NODES[3].id, toPort: 0 },
];

export default function FunctionBuilder() {
  const [nodes, setNodes] = useState<GraphNode[]>(START_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(START_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState(START_NODES[1].id);
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [draft, setDraft] = useState<LinkDraft | null>(null);
  const [query, setQuery] = useState("");
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { nodes?: unknown; edges?: unknown };
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return;
      }

      const nextNodes = parsed.nodes.filter(isGraphNode) as GraphNode[];
      const nextEdges = parsed.edges.filter(isGraphEdge) as GraphEdge[];
      if (nextNodes.length === 0) {
        return;
      }

      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(nextNodes[0]?.id ?? "");
      setSelectedEdgeId("");
    } catch {
      // Ignore invalid persisted graph payloads.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const point = canvasPoint(event.clientX, event.clientY, viewportRef.current);
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
    const onUp = () => {
      setDragging(null);
      setDraft(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
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

  useEffect(() => {
    if (!selectedEdgeId) return;
    if (edges.some((edge) => edge.id === selectedEdgeId)) return;
    setSelectedEdgeId("");
  }, [edges, selectedEdgeId]);

  const ordered = useMemo(() => executionOrder(nodes, edges), [nodes, edges]);
  const generated = useMemo(() => generateCommonJs(ordered, edges, nodeMap), [ordered, edges, nodeMap]);

  const addTemplateNode = (templateId: string, x: number, y: number) => {
    const next = createNode(templateId, x, y);
    setNodes((current) => [...current, next]);
    setSelectedNodeId(next.id);
    setSelectedEdgeId("");
  };

  const onCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const templateId =
      event.dataTransfer.getData("application/x-homeplate-function-node") ||
      event.dataTransfer.getData("text/plain");
    if (!TEMPLATES.some((entry) => entry.id === templateId)) return;
    const point = canvasPoint(event.clientX, event.clientY, viewportRef.current);
    if (!point) return;
    addTemplateNode(templateId, Math.max(24, point.x - NODE_WIDTH / 2), Math.max(24, point.y - 48));
  };

  const connectToInput = (event: React.PointerEvent<HTMLButtonElement>, toNode: GraphNode, toPort: number) => {
    event.stopPropagation();
    if (!draft || draft.fromNodeId === toNode.id) return;

    const nextEdge = {
      id: uid("edge"),
      fromNodeId: draft.fromNodeId,
      fromPort: draft.fromPort,
      toNodeId: toNode.id,
      toPort,
    } satisfies GraphEdge;

    setEdges((current) => {
      const clean = current.filter((edge) => !(edge.toNodeId === toNode.id && edge.toPort === toPort));
      return [...clean, nextEdge];
    });
    setSelectedEdgeId(nextEdge.id);
    setSelectedNodeId("");
    setDraft(null);
  };

  const updateSelected = (updater: (node: GraphNode) => GraphNode) => {
    if (!selectedNode) return;
    setNodes((current) => current.map((node) => (node.id === selectedNode.id ? updater(node) : node)));
  };

  const removeNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId));
    setSelectedNodeId("");
    setSelectedEdgeId("");
  };

  const removeEdge = (edgeId: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== edgeId));
    setSelectedEdgeId("");
  };

  const resetGraph = () => {
    const nextNodes = START_NODES.map((node) => ({ ...node }));
    const nextEdges = START_EDGES.map((edge) => ({ ...edge }));
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(nextNodes[1]?.id ?? nextNodes[0]?.id ?? "");
    setSelectedEdgeId("");
    setDragging(null);
    setDraft(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (selectedEdgeId) {
        event.preventDefault();
        removeEdge(selectedEdgeId);
        return;
      }

      if (selectedNodeId) {
        event.preventDefault();
        removeNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, selectedNodeId]);

  return (
    <AppShell
      title="Function Builder"
      description="Drag CommonJS functions from toolbox onto canvas and connect ports to chain effects."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">{nodes.length} nodes</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">{edges.length} links</Badge>
          <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={resetGraph}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader><CardTitle className="text-base font-black">CommonJS Toolbox</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search functions..." className="h-9 text-xs" />
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-homeplate-function-node", template.id);
                    event.dataTransfer.setData("text/plain", template.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => addTemplateNode(template.id, 180 + nodes.length * 18, 140 + nodes.length * 16)}
                  className="w-full rounded-2xl border border-border/60 bg-background/80 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{template.label}</span>
                    <Badge variant="outline" className="px-2 py-0 text-[10px]">{template.inputs} in / {template.outputs} out</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <GitBranchPlus className="h-4 w-4 text-primary" />
              Node Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={viewportRef}
              className="relative h-[62vh] min-h-[420px] overflow-auto rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.15),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))] lg:h-[680px]"
              onDrop={onCanvasDrop}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onClick={() => {
                setSelectedNodeId("");
                setSelectedEdgeId("");
              }}
            >
              <div className="relative" style={{ minWidth: 1650, minHeight: 1080 }}>
                <svg className="absolute inset-0 h-full w-full">
                  <defs>
                    <marker id="function-edge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(100,116,139,0.9)" />
                    </marker>
                    <marker id="function-edge-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
                    </marker>
                  </defs>
                  {edges.map((edge) => {
                    const from = nodeMap.get(edge.fromNodeId);
                    const to = nodeMap.get(edge.toNodeId);
                    if (!from || !to) return null;
                    const active = selectedEdgeId === edge.id;
                    const path = curve(port(from, "out", edge.fromPort), port(to, "in", edge.toPort));
                    return (
                      <g key={edge.id}>
                        <path
                          d={path}
                          stroke="transparent"
                          strokeWidth={14}
                          fill="none"
                          className="cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedNodeId("");
                            setSelectedEdgeId(edge.id);
                          }}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            removeEdge(edge.id);
                          }}
                        />
                        <path
                          d={path}
                          stroke={active ? "hsl(var(--primary))" : "rgba(100,116,139,0.9)"}
                          strokeWidth={active ? 3 : 2}
                          fill="none"
                          markerEnd={active ? "url(#function-edge-arrow-active)" : "url(#function-edge-arrow)"}
                          pointerEvents="none"
                        />
                      </g>
                    );
                  })}
                  {draft ? (() => {
                    const from = nodeMap.get(draft.fromNodeId);
                    if (!from) return null;
                    return <path d={curve(port(from, "out", draft.fromPort), { x: draft.x, y: draft.y })} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 4" fill="none" />;
                  })() : null}
                </svg>
                {nodes.map((node) => (
                  <div key={node.id} className={selectedNodeId === node.id ? "absolute rounded-2xl border border-primary/50 bg-card shadow-xl" : "absolute rounded-2xl border border-border/60 bg-card shadow-lg"} style={{ left: node.x, top: node.y, width: NODE_WIDTH, minHeight: nodeHeight(node) }}>
                    <div
                      className="flex cursor-move items-center justify-between rounded-t-2xl border-b border-border/60 bg-muted/30 px-3 py-2"
                      onPointerDown={(event) => {
                        const point = canvasPoint(event.clientX, event.clientY, viewportRef.current);
                        if (!point) return;
                        setDragging({ nodeId: node.id, offsetX: point.x - node.x, offsetY: point.y - node.y });
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId("");
                      }}
                    >
                      <div className="text-xs font-bold">{node.name}</div>
                      <Badge variant="outline" className="px-2 py-0 text-[10px]">{node.inputs}:{node.outputs}</Badge>
                    </div>
                    <div className="px-3 py-2 text-[11px] text-muted-foreground" onClick={(event) => { event.stopPropagation(); setSelectedNodeId(node.id); setSelectedEdgeId(""); }}>
                      {node.description}
                    </div>
                    {Array.from({ length: node.inputs }).map((_, index) => (
                      <button key={`in-${node.id}-${index}`} type="button" className="absolute -left-2 h-4 w-4 rounded-full border border-background bg-slate-300 shadow" style={{ top: PORT_TOP + index * PORT_GAP }} onPointerUp={(event) => connectToInput(event, node, index)} onPointerDown={(event) => event.stopPropagation()} />
                    ))}
                    {Array.from({ length: node.outputs }).map((_, index) => (
                      <button key={`out-${node.id}-${index}`} type="button" className="absolute -right-2 h-4 w-4 rounded-full border border-background bg-primary shadow" style={{ top: PORT_TOP + index * PORT_GAP }} onPointerDown={(event) => { event.stopPropagation(); setSelectedNodeId(node.id); setSelectedEdgeId(""); setDraft({ fromNodeId: node.id, fromPort: index, x: port(node, "out", index).x, y: port(node, "out", index).y }); }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:col-span-1 xl:block xl:space-y-4">
          <Card className="border-border/60 bg-card/90 shadow-xl">
            <CardHeader><CardTitle className="text-base font-black">Inspector</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedNode ? (
                <>
                  <Field label="Name"><Input value={selectedNode.name} onChange={(event) => updateSelected((node) => ({ ...node, name: event.target.value }))} /></Field>
                  <Field label="Description"><Input value={selectedNode.description} onChange={(event) => updateSelected((node) => ({ ...node, description: event.target.value }))} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Input ports"><Input type="number" min={0} max={MAX_PORTS} value={selectedNode.inputs} onChange={(event) => updateSelected((node) => ({ ...node, inputs: clamp(Number(event.target.value), 0, MAX_PORTS) }))} /></Field>
                    <Field label="Output ports"><Input type="number" min={0} max={MAX_PORTS} value={selectedNode.outputs} onChange={(event) => updateSelected((node) => ({ ...node, outputs: clamp(Number(event.target.value), 0, MAX_PORTS) }))} /></Field>
                  </div>
                  <Field label="CommonJS body">
                    <Textarea value={selectedNode.code} onChange={(event) => updateSelected((node) => ({ ...node, code: event.target.value }))} className="min-h-[200px] font-mono text-xs" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const clone: GraphNode = { ...selectedNode, id: uid("node"), name: `${selectedNode.name} Copy`, x: selectedNode.x + 24, y: selectedNode.y + 24 };
                      setNodes((current) => [...current, clone]);
                      setSelectedNodeId(clone.id);
                      setSelectedEdgeId("");
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                      removeNode(selectedNode.id);
                    }}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </>
              ) : selectedEdge ? (
                <>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
                    <div className="font-semibold">Connection selected</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {nodeMap.get(selectedEdge.fromNodeId)?.name ?? "Unknown"} (out {selectedEdge.fromPort + 1}) {"->"}{" "}
                      {nodeMap.get(selectedEdge.toNodeId)?.name ?? "Unknown"} (in {selectedEdge.toPort + 1})
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      removeEdge(selectedEdge.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove connection
                  </Button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                  Select a node or connection to edit properties.
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tip: press Delete or Backspace to remove the current selection.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-xl">
            <CardHeader><CardTitle className="text-base font-black">Generated CommonJS</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border/60 bg-black p-3">
                <pre className="max-h-[360px] overflow-auto text-[11px] text-slate-200">{generated}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function createNode(templateId: string, x: number, y: number): GraphNode {
  const template = TEMPLATES.find((entry) => entry.id === templateId) ?? TEMPLATES[1];
  return {
    id: uid("node"),
    templateId: template.id,
    name: template.label,
    description: template.description,
    code: template.code,
    inputs: template.inputs,
    outputs: template.outputs,
    x,
    y,
  };
}

function nodeHeight(node: Pick<GraphNode, "inputs" | "outputs">) {
  return Math.max(116, PORT_TOP + Math.max(node.inputs, node.outputs) * PORT_GAP + 18);
}

function port(node: Pick<GraphNode, "x" | "y">, side: "in" | "out", index: number) {
  return { x: node.x + (side === "out" ? NODE_WIDTH : 0), y: node.y + PORT_TOP + index * PORT_GAP + 8 };
}

function curve(start: { x: number; y: number }, end: { x: number; y: number }) {
  const d = Math.max(56, Math.abs(end.x - start.x) * 0.42);
  return `M ${start.x} ${start.y} C ${start.x + d} ${start.y}, ${end.x - d} ${end.y}, ${end.x} ${end.y}`;
}

function canvasPoint(clientX: number, clientY: number, viewport: HTMLDivElement | null) {
  if (!viewport) return null;
  const rect = viewport.getBoundingClientRect();
  return { x: clientX - rect.left + viewport.scrollLeft, y: clientY - rect.top + viewport.scrollTop };
}

function executionOrder(nodes: GraphNode[], edges: GraphEdge[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, GraphEdge[]>();
  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  });
  edges.forEach((edge) => {
    if (!byId.has(edge.fromNodeId) || !byId.has(edge.toNodeId)) return;
    incoming.set(edge.toNodeId, (incoming.get(edge.toNodeId) ?? 0) + 1);
    outgoing.get(edge.fromNodeId)?.push(edge);
  });
  outgoing.forEach((list) => list.sort((a, b) => a.fromPort - b.fromPort || a.toPort - b.toPort));

  const order: GraphNode[] = [];
  const visited = new Set<string>();
  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = byId.get(nodeId);
    if (!node) return;
    order.push(node);
    (outgoing.get(nodeId) ?? []).forEach((edge) => visit(edge.toNodeId));
  };

  nodes
    .filter((node) => (incoming.get(node.id) ?? 0) === 0)
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .forEach((node) => visit(node.id));
  nodes.filter((node) => !visited.has(node.id)).forEach((node) => visit(node.id));

  return order;
}

function generateCommonJs(nodes: GraphNode[], edges: GraphEdge[], byId: Map<string, GraphNode>) {
  const fnNames = nodes.map((node, index) => ({ nodeId: node.id, fn: `node_${index + 1}_${sanitize(node.name)}` }));
  const nameByNode = new Map(fnNames.map((entry) => [entry.nodeId, entry.fn]));

  const fns = nodes.map((node, index) => {
    const fn = fnNames[index].fn;
    const body = node.code.trim() || "// no-op";
    return `async function ${fn}(state, context) {\n${indent(body, 2)}\n  return { stop: false };\n}`;
  });

  const wire = edges
    .map((edge) => {
      const from = byId.get(edge.fromNodeId);
      const to = byId.get(edge.toNodeId);
      if (!from || !to) return null;
      return ` * ${nameByNode.get(from.id)}[out:${edge.fromPort + 1}] -> ${nameByNode.get(to.id)}[in:${edge.toPort + 1}]`;
    })
    .filter(Boolean)
    .join("\n");

  return `/**
 * Auto-generated from Function Builder.
 * Wiring:
${wire || " * (no links)"}
 */
${fns.join("\n\n")}

module.exports = async function runEffectGraph(context = {}) {
  const state = { ...context };
  const steps = [
${fnNames.map((entry) => `    ${entry.fn},`).join("\n")}
  ];

  for (const step of steps) {
    const result = await step(state, context);
    if (result?.stop) {
      state.__stoppedBy = step.name;
      state.__stopReason = result.reason ?? "Stopped";
      break;
    }
  }

  return state;
};
`;
}

function sanitize(value: string) {
  const out = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return out || "step";
}

function indent(code: string, spaces: number) {
  const pad = " ".repeat(spaces);
  return code.split("\n").map((line) => `${pad}${line}`).join("\n");
}

function isGraphNode(value: unknown): value is GraphNode {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<GraphNode>;
  return (
    typeof item.id === "string" &&
    typeof item.templateId === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.code === "string" &&
    typeof item.inputs === "number" &&
    typeof item.outputs === "number" &&
    typeof item.x === "number" &&
    typeof item.y === "number"
  );
}

function isGraphEdge(value: unknown): value is GraphEdge {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<GraphEdge>;
  return (
    typeof item.id === "string" &&
    typeof item.fromNodeId === "string" &&
    typeof item.fromPort === "number" &&
    typeof item.toNodeId === "string" &&
    typeof item.toPort === "number"
  );
}
