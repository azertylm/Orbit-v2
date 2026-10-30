import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  VisualAnnotationShape,
  VisualAnnotationTool,
  VisualAnnotationPoint,
  drawAnnotationShapesOnCanvas,
} from "../services/timelineInsightsService";
import {
  ArrowUpRight,
  Circle,
  Square,
  Pencil,
  Undo2,
  Trash2,
} from "lucide-react";

interface VisualAnnotationCanvasProps {
  shapes: VisualAnnotationShape[];
  onChangeShapes: (shapes: VisualAnnotationShape[]) => void;
  active: boolean;
  backgroundDataUrl?: string;
  className?: string;
  showToolbar?: boolean;
}

const ANNOTATION_COLORS = [
  { id: "cyan", hex: "#38bdf8", label: "Technique (Cyan)" },
  { id: "rose", hex: "#f43f5e", label: "Critique / Bug (Rose)" },
  { id: "amber", hex: "#f59e0b", label: "Créatif (Ambre)" },
  { id: "emerald", hex: "#10b981", label: "Concept (Émeraude)" },
];

export const VisualAnnotationCanvas: React.FC<VisualAnnotationCanvasProps> = ({
  shapes,
  onChangeShapes,
  active,
  backgroundDataUrl,
  className = "",
  showToolbar = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] =
    useState<VisualAnnotationTool>("arrow");
  const [selectedColor, setSelectedColor] = useState<string>("#38bdf8");
  const [draftShape, setDraftShape] = useState<VisualAnnotationShape | null>(
    null
  );
  const isDrawingRef = useRef<boolean>(false);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const allShapes = draftShape ? [...shapes, draftShape] : shapes;
    drawAnnotationShapesOnCanvas(ctx, allShapes, width, height);
  }, [shapes, draftShape]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getNormalizedPoint = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): VisualAnnotationPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width))
    );
    const y = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height))
    );
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    setDraftShape({
      id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool: selectedTool,
      color: selectedColor,
      points: [pt, pt],
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !isDrawingRef.current || !draftShape) return;
    e.stopPropagation();
    const pt = getNormalizedPoint(e);
    setDraftShape((prev) => {
      if (!prev) return null;
      if (prev.tool === "freehand") {
        return { ...prev, points: [...prev.points, pt] };
      }
      return { ...prev, points: [prev.points[0], pt] };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !isDrawingRef.current) return;
    e.stopPropagation();
    isDrawingRef.current = false;
    if (draftShape && draftShape.points.length >= 2) {
      onChangeShapes([...shapes, draftShape]);
    }
    setDraftShape(null);
  };

  const handleUndo = () => {
    if (shapes.length === 0) return;
    onChangeShapes(shapes.slice(0, -1));
  };

  const handleClear = () => {
    onChangeShapes([]);
  };

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      {backgroundDataUrl && (
        <img
          src={backgroundDataUrl}
          alt="Frame vidéo sous-jacente"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: active ? "none" : "auto" }}
        className={`w-full h-full block ${
          active ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
        }`}
      />

      {active && showToolbar && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-xs"
        >
          {/* Outils de tracé vectoriel */}
          <div className="flex items-center gap-1">
            {[
              {
                id: "arrow" as VisualAnnotationTool,
                label: "Flèche",
                icon: ArrowUpRight,
              },
              {
                id: "circle" as VisualAnnotationTool,
                label: "Cercle",
                icon: Circle,
              },
              {
                id: "rect" as VisualAnnotationTool,
                label: "Zone",
                icon: Square,
              },
              {
                id: "freehand" as VisualAnnotationTool,
                label: "Croquis",
                icon: Pencil,
              },
            ].map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedTool(tool.id)}
                  className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-400 text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Couleurs & Annulation */}
          <div className="flex items-center gap-1.5">
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                  selectedColor === c.hex
                    ? "scale-125 ring-2 ring-white"
                    : "opacity-75 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}

            <div className="w-px h-4 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={handleUndo}
              disabled={shapes.length === 0}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 cursor-pointer"
              title="Annuler le dernier tracé"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={shapes.length === 0}
              className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 disabled:opacity-40 text-slate-300 hover:text-rose-300 cursor-pointer"
              title="Effacer tous les dessins"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
