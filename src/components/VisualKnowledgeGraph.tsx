import React, { useMemo } from "react";
import {
  TimelineAiInsight,
  buildKnowledgeGraph,
  PIN_CATEGORY_META,
} from "../services/timelineInsightsService";
import { Network, Play } from "lucide-react";

interface VisualKnowledgeGraphProps {
  insights: TimelineAiInsight[];
  activeInsightId: string | null;
  onSelectNode: (timestampSeconds: number, insightId: string) => void;
}

export const VisualKnowledgeGraph: React.FC<VisualKnowledgeGraphProps> = ({
  insights,
  activeInsightId,
  onSelectNode,
}) => {
  const { nodes, edges } = useMemo(
    () => buildKnowledgeGraph(insights),
    [insights]
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof nodes)[number]>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  if (insights.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
        <Network className="w-6 h-6 text-cyan-400 mx-auto" />
        <div className="text-xs font-bold text-white">
          Graphe de Connaissance Visuel vide
        </div>
        <p className="text-[11px] text-slate-400">
          Mettez la vidéo en pause et posez une question pour générer les
          premiers nœuds conceptuels.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Network className="w-4 h-4 text-cyan-400" />
          <span>Graphe de Connaissance Visuel ({nodes.length} nœuds)</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {(["technique", "creatif", "bug", "concept"] as const).map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PIN_CATEGORY_META[cat].hex }}
              />
              <span>{PIN_CATEGORY_META[cat].shortLabel}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative w-full aspect-[16/8] min-h-[220px] bg-slate-950">
        <svg
          viewBox="0 0 680 320"
          className="w-full h-full select-none"
          role="img"
          aria-label="Graphe interactif des concepts de la vidéo"
        >
          <defs>
            <pattern
              id="orbitGraphGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(148, 163, 184, 0.07)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="680" height="320" fill="url(#orbitGraphGrid)" />

          {/* Arêtes reliant les concepts à travers la timeline */}
          {edges.map((edge) => {
            const src = nodeMap.get(edge.sourceId);
            const dst = nodeMap.get(edge.targetId);
            if (!src || !dst) return null;
            const isHighlighted =
              src.insightId === activeInsightId ||
              dst.insightId === activeInsightId;
            return (
              <g key={edge.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke={
                    isHighlighted
                      ? "rgba(56, 189, 248, 0.75)"
                      : "rgba(148, 163, 184, 0.25)"
                  }
                  strokeWidth={isHighlighted ? 2.2 : 1.2}
                  strokeDasharray={
                    edge.relationLabel === "Concept lié" ? "4 4" : undefined
                  }
                />
              </g>
            );
          })}

          {/* Nœuds cliquables pour sauter au timestamp */}
          {nodes.map((node) => {
            const meta =
              PIN_CATEGORY_META[node.category] || PIN_CATEGORY_META.technique;
            const isSelected = node.insightId === activeInsightId;
            const radius = node.isPrimaryConcept ? (isSelected ? 18 : 15) : 10;

            return (
              <g
                key={node.id}
                onClick={() =>
                  onSelectNode(node.timestampSeconds, node.insightId)
                }
                className="cursor-pointer group"
              >
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 7}
                    fill="none"
                    stroke={meta.hex}
                    strokeWidth="1.5"
                    strokeOpacity="0.55"
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill="#090d1a"
                  stroke={meta.hex}
                  strokeWidth={isSelected ? 3 : 2}
                />
                {node.isPrimaryConcept && (
                  <text
                    x={node.x}
                    y={node.y + 3.5}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    {node.timestampFormatted}
                  </text>
                )}
                <rect
                  x={node.x - 64}
                  y={node.y + radius + 5}
                  width="128"
                  height="18"
                  rx="4"
                  fill="rgba(2, 6, 23, 0.88)"
                />
                <text
                  x={node.x}
                  y={node.y + radius + 17}
                  textAnchor="middle"
                  fill={isSelected ? "#38bdf8" : "#cbd5e1"}
                  fontSize={node.isPrimaryConcept ? "10.5" : "9.5"}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight={node.isPrimaryConcept ? "700" : "500"}
                >
                  {node.label.length > 20
                    ? `${node.label.slice(0, 20)}…`
                    : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Barre inférieure d'accès direct par nœud temporel */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-slate-400 shrink-0">
          Sauter au concept :
        </span>
        {insights.map((ins) => {
          const meta =
            PIN_CATEGORY_META[ins.category] || PIN_CATEGORY_META.technique;
          const active = ins.id === activeInsightId;
          return (
            <button
              key={ins.id}
              type="button"
              onClick={() => onSelectNode(ins.timestampSeconds, ins.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 cursor-pointer shrink-0 border transition-colors ${
                active
                  ? "bg-slate-800 text-white border-cyan-400/60 font-bold"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.hex }}
              />
              <span className="font-mono tabular-nums text-cyan-300">
                {ins.timestampFormatted}
              </span>
              <span>·</span>
              <span className="truncate max-w-[140px]">
                {ins.keyConceptTag}
              </span>
              <Play className="w-2.5 h-2.5 opacity-70" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
