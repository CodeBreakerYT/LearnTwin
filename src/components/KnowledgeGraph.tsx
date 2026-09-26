"use client";

import "@xyflow/react/dist/style.css";
import { memo, useMemo } from "react";
import { Background, BackgroundVariant, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { Lock, TrendingDown, TrendingUp } from "lucide-react";
import { DOMAIN_POS, conceptsOfSubject, domainsOfSubject, subjectById } from "@/lib/curriculum";
import { conceptOf, conceptStatus, domainMastery, pct } from "@/lib/engine";
import type { ConceptStatus, LearningTwin } from "@/lib/types";
import { STATUS } from "./ui";

type ConceptData = { name: string; mastery: number; status: ConceptStatus; issues: number; delta: number | null; selected: boolean };
type GroupData = { name: string; mastery: number; root?: boolean };

const handle = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0 };

const ConceptNode = memo(function ConceptNode({ data }: NodeProps<Node<ConceptData>>) {
  const s = STATUS[data.status];
  const locked = data.status === "locked";
  return (
    <div
      className={`relative w-[172px] rounded-2xl border px-3.5 py-3 text-left backdrop-blur transition-all ${data.delta !== null ? "animate-[ringpulse_1.8s_ease-out_3]" : ""}`}
      style={{
        borderColor: data.selected ? s.color : `color-mix(in srgb, ${s.color} 45%, transparent)`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${s.color} ${locked ? 5 : 14}%, #0b0d17), #0b0d17)`,
        boxShadow: data.selected ? `0 0 0 1px ${s.color}, 0 0 32px -6px ${s.color}` : locked ? "none" : `0 0 24px -12px ${s.color}`,
        opacity: locked ? 0.7 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={handle} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.82rem] font-semibold leading-tight text-ink">{data.name}</span>
        {locked ? <Lock className="size-3.5 shrink-0 text-locked" /> : <span className="tabnum text-sm font-semibold" style={{ color: s.color }}>{pct(data.mastery)}</span>}
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(data.mastery * 100)}%`, background: s.color }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.66rem] text-muted">
        <span>{s.label}</span>
        <span className="flex items-center gap-1.5">
                    {data.delta !== null && data.delta > 0 && (
            <span className="flex items-center gap-0.5 font-semibold" style={{ color: data.delta >= 0 ? "var(--mastered)" : "var(--weak)" }}>
              {data.delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(Math.round(data.delta * 100))}%
            </span>
          )}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={handle} />
    </div>
  );
});

const GroupNode = memo(function GroupNode({ data }: NodeProps<Node<GroupData>>) {
  return (
    <div className={`rounded-full border border-line bg-white/[0.05] text-center backdrop-blur ${data.root ? "px-6 py-2.5" : "px-4 py-2"}`}>
      <Handle type="target" position={Position.Top} style={handle} />
      <div className={`${data.root ? "text-base" : "text-sm"} font-semibold`}>{data.name}</div>
      <div className="tabnum text-[0.68rem] text-muted">{pct(data.mastery)} mastery</div>
      <Handle type="source" position={Position.Bottom} style={handle} />
    </div>
  );
});

const nodeTypes = { concept: ConceptNode, cluster: GroupNode };

/** Mastery movement in the last half hour, so a fresh AI analysis is visible on the graph. */
export function recentDeltas(t: LearningTwin): Record<string, number> {
  const out: Record<string, number> = {};
  const cutoff = Date.now() - 30 * 60_000;
  for (const e of t.recentActivity) {
    if (new Date(e.at).getTime() < cutoff) continue;
    out[e.conceptId] = (out[e.conceptId] ?? 0) + (e.masteryAfter - e.masteryBefore);
  }
  return out;
}

export default function KnowledgeGraph({ twin, selected, onSelect, subject }: { twin: LearningTwin; selected: string | null; onSelect: (id: string) => void; subject: string }) {
  const { nodes, edges } = useMemo(() => {
    const CONCEPTS = conceptsOfSubject(subject);
    const DOMAINS = domainsOfSubject(subject);
    const rootMastery = CONCEPTS.length ? CONCEPTS.reduce((a, c) => a + conceptOf(twin, c.id).mastery, 0) / CONCEPTS.length : 0;
    const deltas = recentDeltas(twin);
    const nodes: Node[] = [
      { id: "root", type: "cluster", position: DOMAIN_POS.root, data: { name: subjectById(subject).name, mastery: rootMastery, root: true }, draggable: false, selectable: false },
      ...DOMAINS.map<Node>((d) => ({ id: d.id, type: "cluster", position: DOMAIN_POS[d.id], data: { name: d.name, mastery: domainMastery(twin, d.id) }, draggable: false, selectable: false })),
      ...CONCEPTS.map<Node>((c) => {
        const cs = conceptOf(twin, c.id);
        const status = conceptStatus(twin, c.id);
        const issues = cs.misconceptions.filter((m) => twin.misconceptionLog[m] && !twin.misconceptionLog[m].resolved).length;
        const d = deltas[c.id];
        return { id: c.id, type: "concept", position: c.pos, data: { name: c.name, mastery: cs.mastery, status, issues, delta: d !== undefined && Math.abs(d) >= 0.005 ? d : null, selected: selected === c.id }, draggable: false };
      }),
    ];
    const edges: Edge[] = [
      ...DOMAINS.map((d) => ({ id: `root-${d.id}`, source: "root", target: d.id, style: { stroke: "rgba(255,255,255,0.18)", strokeWidth: 1.5 } })),
    ];
    for (const c of CONCEPTS) {
      const status = conceptStatus(twin, c.id);
      const color = STATUS[status].color;
      if (c.prereqs.length === 0) {
        edges.push({ id: `${c.domain}-${c.id}`, source: c.domain, target: c.id, style: { stroke: color, strokeOpacity: 0.55, strokeWidth: 1.6 } });
        continue;
      }
      c.prereqs.forEach((p, i) => {
        const missing = conceptOf(twin, p).mastery < 0.35;
        edges.push({ id: `${p}-${c.id}`, source: p, target: c.id, animated: !missing && status === "weak", style: { stroke: missing ? "var(--locked)" : color, strokeOpacity: missing ? 0.7 : 0.55, strokeWidth: 1.6, strokeDasharray: i > 0 || missing ? "5 5" : undefined } });
      });
    }
    return { nodes, edges };
  }, [twin, selected, subject]);

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.04 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        zoomOnScroll={false}
        preventScrolling={false}
        minZoom={0.4}
        maxZoom={1.4}
        onNodeClick={(_, n) => n.type === "concept" && onSelect(n.id)}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.09)" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      <div className="pointer-events-none absolute right-3 top-3 flex flex-wrap justify-end gap-x-3 gap-y-1 rounded-xl bg-black/40 px-3 py-2 text-[0.68rem] backdrop-blur">
        {(Object.keys(STATUS) as ConceptStatus[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-muted"><span className="size-2 rounded-full" style={{ background: STATUS[k].color }} />{STATUS[k].label}</span>
        ))}
      </div>
    </div>
  );
}
