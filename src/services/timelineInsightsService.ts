export type TimelinePinCategory = "technique" | "creatif" | "bug" | "concept";

export interface VisualAnnotationPoint {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
}

export type VisualAnnotationTool = "arrow" | "circle" | "rect" | "freehand";

export interface VisualAnnotationShape {
  id: string;
  tool: VisualAnnotationTool;
  color: string;
  points: VisualAnnotationPoint[];
}

export interface TimelineAiInsight {
  id: string;
  videoId: number;
  videoTitle: string;
  timestampSeconds: number;
  timestampFormatted: string;
  userPrompt: string;
  frameDataUrl?: string;
  annotatedFrameDataUrl?: string;
  annotationShapes?: VisualAnnotationShape[];
  category: TimelinePinCategory;
  headline: string;
  answer: string;
  visualObservations: string[];
  suggestedFollowUps: string[];
  keyConceptTag: string;
  relatedConcepts: string[];
  semanticKeywords: string[];
  source: "gemini" | "local-fallback";
  createdAt: string;
  authorName?: string;
  // Optional aliases for compatibility
  aiHeadline?: string;
  aiAnalysis?: string;
  keyTakeaways?: string[];
  followUpSuggestions?: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  timestampSeconds: number;
  timestampFormatted: string;
  category: TimelinePinCategory;
  insightId: string;
  isPrimaryConcept: boolean;
  x: number;
  y: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationLabel: string;
}

export interface OrbitShareableNotebook {
  format: "orbit-interactive-notebook-v2";
  id: string;
  createdAt: string;
  author: string;
  video: {
    id: number;
    title: string;
    domain: string;
    subdomain: string;
    platform: string;
    youtubeId?: string;
    rawUrl?: string;
    durationMinutes?: number;
  };
  insights: TimelineAiInsight[];
}

export const PIN_CATEGORY_META: Record<
  TimelinePinCategory,
  {
    label: string;
    shortLabel: string;
    hex: string;
    color: string;
    bgSoft: string;
    border: string;
    dotClass: string;
    badgeClass: string;
  }
> = {
  technique: {
    label: "Technique & Architecture",
    shortLabel: "Technique",
    hex: "#38bdf8",
    color: "#38bdf8",
    bgSoft: "rgba(56, 189, 248, 0.16)",
    border: "rgba(56, 189, 248, 0.45)",
    dotClass: "bg-cyan-400",
    badgeClass: "bg-cyan-400/15 text-cyan-300 border-cyan-400/40",
  },
  creatif: {
    label: "Créatif & Mise en scène",
    shortLabel: "Créatif",
    hex: "#f59e0b",
    color: "#f59e0b",
    bgSoft: "rgba(245, 158, 11, 0.16)",
    border: "rgba(245, 158, 11, 0.45)",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  },
  bug: {
    label: "Anomalie & Point critique",
    shortLabel: "Critique / Bug",
    hex: "#f43f5e",
    color: "#f43f5e",
    bgSoft: "rgba(244, 63, 94, 0.16)",
    border: "rgba(244, 63, 94, 0.45)",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  },
  concept: {
    label: "Concept & Théorie",
    shortLabel: "Concept",
    hex: "#10b981",
    color: "#10b981",
    bgSoft: "rgba(16, 185, 129, 0.16)",
    border: "rgba(16, 185, 129, 0.45)",
    dotClass: "bg-emerald-400",
    badgeClass: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  },
};

const STORAGE_KEY = "ORBIT_TIMELINE_INSIGHTS_V2";

export function formatInsightTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Dessine les formes d'annotation visuelle (flèches, cercles, rectangles, tracés libres)
 * sur un contexte Canvas 2D donné.
 */
export function drawAnnotationShapesOnCanvas(
  ctx: CanvasRenderingContext2D,
  shapes: VisualAnnotationShape[],
  width: number,
  height: number
): void {
  if (!Array.isArray(shapes) || shapes.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const shape of shapes) {
    if (!shape.points || shape.points.length === 0) continue;
    ctx.strokeStyle = shape.color || "#38bdf8";
    ctx.fillStyle = shape.color || "#38bdf8";
    ctx.lineWidth = Math.max(2.5, Math.round(width * 0.005));

    if (shape.tool === "freehand") {
      ctx.beginPath();
      shape.points.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    } else if (shape.points.length >= 2) {
      const start = shape.points[0];
      const end = shape.points[shape.points.length - 1];
      const x1 = start.x * width;
      const y1 = start.y * height;
      const x2 = end.x * width;
      const y2 = end.y * height;

      if (shape.tool === "rect") {
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = `${shape.color}18`;
        ctx.fillRect(rx, ry, rw, rh);
      } else if (shape.tool === "circle") {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.max(6, Math.abs(x2 - x1) / 2);
        const ry = Math.max(6, Math.abs(y2 - y1) / 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `${shape.color}18`;
        ctx.fill();
      } else if (shape.tool === "arrow") {
        const headLen = Math.max(12, Math.round(width * 0.024));
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Fusionne la frame vidéo capturée (dataUrl) et les formes d'annotation visuelle
 * en une seule image JPEG Base64 destinée au modèle multimodal Gemini.
 */
export async function compositeFrameWithAnnotations(
  baseFrameDataUrl: string,
  shapes: VisualAnnotationShape[]
): Promise<string> {
  if (!baseFrameDataUrl || !shapes || shapes.length === 0) {
    return baseFrameDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = img.naturalWidth || 640;
      const height = img.naturalHeight || 360;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(baseFrameDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      drawAnnotationShapesOnCanvas(ctx, shapes, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(baseFrameDataUrl);
    img.src = baseFrameDataUrl;
  });
}

/**
 * Capture la frame exacte d'un élément <video> via un <canvas> HTML5.
 * Si la source est dans une iframe tierce (YouTube/TikTok) ou protégée par CORS,
 * génère une vignette composite haute lisibilité sur le canvas incluant le repère temporel.
 */
export function captureVideoFrameToCanvas(options?: {
  videoElement?: HTMLVideoElement | null;
  timestampSeconds?: number;
  videoTitle?: string;
  domain?: string;
  subdomain?: string;
} | null): { dataUrl: string; capturedFromNativeVideo: boolean } {
  const {
    videoElement = null,
    timestampSeconds = 0,
    videoTitle = "Vidéo Orbit",
    domain = "Sciences & Tech",
    subdomain = "Exploration IA",
  } = options || {};
  const formattedTime = formatInsightTimestamp(timestampSeconds);

  const canvas = document.createElement("canvas");
  const targetWidth = 640;
  const targetHeight = 360;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return { dataUrl: "", capturedFromNativeVideo: false };
  }

  // 1. Tenter la capture directe des pixels du flux <video> HTML5
  if (
    videoElement &&
    videoElement.readyState >= 2 &&
    videoElement.videoWidth > 0 &&
    videoElement.videoHeight > 0
  ) {
    try {
      ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
      ctx.fillStyle = "rgba(6, 10, 19, 0.82)";
      ctx.fillRect(targetWidth - 118, targetHeight - 36, 106, 26);
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`⏱ ${formattedTime}`, targetWidth - 108, targetHeight - 18);

      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      if (jpegDataUrl && jpegDataUrl.startsWith("data:image/jpeg")) {
        return { dataUrl: jpegDataUrl, capturedFromNativeVideo: true };
      }
    } catch {
      // SecurityError (canvas tainted par flux cross-origin) -> repli vers rendu analytique
    }
  }

  // 2. Repli : Générer une frame analytique horodatée sur un nouveau canvas propre
  const fallbackCanvas = document.createElement("canvas");
  fallbackCanvas.width = targetWidth;
  fallbackCanvas.height = targetHeight;
  const fCtx = fallbackCanvas.getContext("2d");
  if (!fCtx) {
    return { dataUrl: "", capturedFromNativeVideo: false };
  }

  const grad = fCtx.createLinearGradient(0, 0, targetWidth, targetHeight);
  grad.addColorStop(0, "#070b16");
  grad.addColorStop(0.55, "#111a30");
  grad.addColorStop(1, "#090d1a");
  fCtx.fillStyle = grad;
  fCtx.fillRect(0, 0, targetWidth, targetHeight);

  fCtx.strokeStyle = "rgba(56, 189, 248, 0.14)";
  fCtx.lineWidth = 1;
  for (let x = 64; x < targetWidth; x += 64) {
    fCtx.beginPath();
    fCtx.moveTo(x, 0);
    fCtx.lineTo(x, targetHeight);
    fCtx.stroke();
  }
  for (let y = 60; y < targetHeight; y += 60) {
    fCtx.beginPath();
    fCtx.moveTo(0, y);
    fCtx.lineTo(targetWidth, y);
    fCtx.stroke();
  }

  fCtx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  fCtx.lineWidth = 2;
  fCtx.strokeRect(24, 24, targetWidth - 48, targetHeight - 48);

  fCtx.fillStyle = "#38bdf8";
  fCtx.font = "bold 13px 'JetBrains Mono', monospace";
  fCtx.fillText(`FRAME SNAPSHOT · TIMESTAMP ${formattedTime}`, 44, 62);

  fCtx.fillStyle = "#ffffff";
  fCtx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  const cleanTitle =
    videoTitle.length > 46 ? `${videoTitle.slice(0, 46)}…` : videoTitle;
  fCtx.fillText(cleanTitle, 44, 110);

  fCtx.fillStyle = "#94a3b8";
  fCtx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
  fCtx.fillText(`${domain} · ${subdomain}`, 44, 142);

  fCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
  fCtx.fillRect(44, targetHeight - 64, targetWidth - 88, 6);
  const progressRatio = Math.min(
    0.92,
    Math.max(0.08, (timestampSeconds % 300) / 300)
  );
  fCtx.fillStyle = "#38bdf8";
  fCtx.fillRect(44, targetHeight - 64, (targetWidth - 88) * progressRatio, 6);

  return {
    dataUrl: fallbackCanvas.toDataURL("image/jpeg", 0.84),
    capturedFromNativeVideo: false,
  };
}

/**
 * Construit dynamiquement le Graphe de Connaissance Visuel (nœuds + arêtes)
 * reliant les concepts abordés au fil des pauses de la vidéo.
 */
export function buildKnowledgeGraph(insights: TimelineAiInsight[]): {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
} {
  const sorted = [...insights].sort(
    (a, b) => a.timestampSeconds - b.timestampSeconds
  );
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const conceptNodeMap = new Map<string, string>();

  const count = Math.max(1, sorted.length);

  sorted.forEach((item, idx) => {
    // Disposition radiale/organique équilibrée dans un espace 680x320
    const progress = count === 1 ? 0.5 : idx / (count - 1);
    const x = Math.round(90 + progress * 500);
    const y = Math.round(
      160 + Math.sin(idx * 1.45) * 72 + (idx % 2 === 0 ? -18 : 18)
    );

    const primaryNodeId = `node-primary-${item.id}`;
    nodes.push({
      id: primaryNodeId,
      label: item.keyConceptTag || item.headline.slice(0, 24),
      timestampSeconds: item.timestampSeconds,
      timestampFormatted: item.timestampFormatted,
      category: item.category || "technique",
      insightId: item.id,
      isPrimaryConcept: true,
      x,
      y,
    });

    const normKey = (item.keyConceptTag || "").toLowerCase().trim();
    if (normKey) {
      if (conceptNodeMap.has(normKey)) {
        const prevNodeId = conceptNodeMap.get(normKey)!;
        edges.push({
          id: `edge-recur-${prevNodeId}-${primaryNodeId}`,
          sourceId: prevNodeId,
          targetId: primaryNodeId,
          relationLabel: "Récurrence conceptuelle",
        });
      }
      conceptNodeMap.set(normKey, primaryNodeId);
    }

    // Relier séquentiellement les étapes clés de la timeline
    if (idx > 0) {
      const prevPrimaryId = `node-primary-${sorted[idx - 1].id}`;
      edges.push({
        id: `edge-seq-${prevPrimaryId}-${primaryNodeId}`,
        sourceId: prevPrimaryId,
        targetId: primaryNodeId,
        relationLabel: "Progression temporelle",
      });
    }

    // Ajouter un nœud satellite par concept connexe et créer les ponts sémantiques
    const satellites = (item.relatedConcepts || []).slice(0, 2);
    satellites.forEach((rel, sIdx) => {
      const relKey = rel.toLowerCase().trim();
      if (!relKey || relKey === normKey) return;

      const existingNodeId = conceptNodeMap.get(relKey);
      if (existingNodeId && existingNodeId !== primaryNodeId) {
        edges.push({
          id: `edge-sem-${existingNodeId}-${primaryNodeId}-${sIdx}`,
          sourceId: existingNodeId,
          targetId: primaryNodeId,
          relationLabel: rel,
        });
      } else {
        const satNodeId = `node-sat-${item.id}-${sIdx}`;
        const satAngle = sIdx === 0 ? -1.1 : 1.1;
        const satX = Math.max(55, Math.min(625, Math.round(x + Math.cos(satAngle) * 58)));
        const satY = Math.max(36, Math.min(284, Math.round(y + Math.sin(satAngle) * 58)));

        nodes.push({
          id: satNodeId,
          label: rel.length > 22 ? `${rel.slice(0, 22)}…` : rel,
          timestampSeconds: item.timestampSeconds,
          timestampFormatted: item.timestampFormatted,
          category: item.category || "concept",
          insightId: item.id,
          isPrimaryConcept: false,
          x: satX,
          y: satY,
        });
        conceptNodeMap.set(relKey, satNodeId);
        edges.push({
          id: `edge-sat-${primaryNodeId}-${satNodeId}`,
          sourceId: primaryNodeId,
          targetId: satNodeId,
          relationLabel: "Concept lié",
        });
      }
    });
  });

  return { nodes, edges };
}

/**
 * Recherche sémantique profonde dans les repères de la timeline.
 * Retourne les identifiants des repères correspondants et leur score de pertinence.
 */
export function semanticSearchInsights(
  insights: TimelineAiInsight[],
  rawQuery: string
): { matchedIds: Set<string>; scores: Record<string, number> } {
  const query = rawQuery.trim().toLowerCase();
  const matchedIds = new Set<string>();
  const scores: Record<string, number> = {};

  if (!query) {
    return { matchedIds, scores };
  }

  const tokens = query.split(/\s+/).filter((t) => t.length >= 2);

  for (const item of insights) {
    const corpus = [
      item.headline,
      item.answer,
      item.userPrompt,
      item.keyConceptTag,
      item.timestampFormatted,
      item.category,
      ...(item.visualObservations || []),
      ...(item.relatedConcepts || []),
      ...(item.semanticKeywords || []),
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (corpus.includes(query)) {
      score += 5;
    }
    for (const tok of tokens) {
      if (corpus.includes(tok)) {
        score += 2;
      }
      if ((item.keyConceptTag || "").toLowerCase().includes(tok)) {
        score += 3;
      }
    }

    if (score > 0) {
      matchedIds.add(item.id);
      scores[item.id] = score;
    }
  }

  return { matchedIds, scores };
}

export class TimelineInsightsService {
  static normalizeInsight(raw: Partial<TimelineAiInsight> & Record<string, unknown>): TimelineAiInsight {
    const headline =
      (typeof raw.headline === "string" && raw.headline) ||
      (typeof raw.aiHeadline === "string" && raw.aiHeadline) ||
      "Analyse Temporelle IA";
    const answer =
      (typeof raw.answer === "string" && raw.answer) ||
      (typeof raw.aiAnalysis === "string" && raw.aiAnalysis) ||
      "";
    const visualObservations = Array.isArray(raw.visualObservations)
      ? raw.visualObservations
      : Array.isArray(raw.keyTakeaways)
      ? raw.keyTakeaways
      : [];
    const suggestedFollowUps = Array.isArray(raw.suggestedFollowUps)
      ? raw.suggestedFollowUps
      : Array.isArray(raw.followUpSuggestions)
      ? (raw.followUpSuggestions as string[])
      : [];
    const relatedConcepts = Array.isArray(raw.relatedConcepts)
      ? raw.relatedConcepts
      : [];
    const semanticKeywords = Array.isArray(raw.semanticKeywords)
      ? raw.semanticKeywords
      : [];
    const tsSec = typeof raw.timestampSeconds === "number" ? raw.timestampSeconds : 0;

    return {
      id: typeof raw.id === "string" ? raw.id : `insight-${Date.now()}`,
      videoId: typeof raw.videoId === "number" ? raw.videoId : 0,
      videoTitle: typeof raw.videoTitle === "string" ? raw.videoTitle : "Vidéo Orbit",
      timestampSeconds: tsSec,
      timestampFormatted:
        typeof raw.timestampFormatted === "string"
          ? raw.timestampFormatted
          : formatInsightTimestamp(tsSec),
      userPrompt: typeof raw.userPrompt === "string" ? raw.userPrompt : "",
      frameDataUrl: typeof raw.frameDataUrl === "string" ? raw.frameDataUrl : undefined,
      annotatedFrameDataUrl:
        typeof raw.annotatedFrameDataUrl === "string" ? raw.annotatedFrameDataUrl : undefined,
      annotationShapes: Array.isArray(raw.annotationShapes) ? raw.annotationShapes : [],
      category:
        raw.category === "technique" ||
        raw.category === "creatif" ||
        raw.category === "bug" ||
        raw.category === "concept"
          ? raw.category
          : "technique",
      headline,
      answer,
      visualObservations,
      suggestedFollowUps,
      keyConceptTag:
        typeof raw.keyConceptTag === "string" ? raw.keyConceptTag : headline.slice(0, 24),
      relatedConcepts,
      semanticKeywords,
      source: raw.source === "gemini" ? "gemini" : "local-fallback",
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "14:00",
      authorName: typeof raw.authorName === "string" ? raw.authorName : undefined,
      aiHeadline: headline,
      aiAnalysis: answer,
      keyTakeaways: visualObservations,
      followUpSuggestions: suggestedFollowUps,
    };
  }

  static getAllInsights(): Record<number, TimelineAiInsight[]> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      const normalized: Record<number, TimelineAiInsight[]> = {};
      for (const [k, val] of Object.entries(parsed)) {
        const numKey = Number(k);
        if (!Number.isNaN(numKey) && Array.isArray(val)) {
          normalized[numKey] = val.map((item) =>
            this.normalizeInsight(item as Partial<TimelineAiInsight> & Record<string, unknown>)
          );
        }
      }
      return normalized;
    } catch {
      return {};
    }
  }

  static getInsightsForVideo(
    videoId: number,
    videoTitle = "Vidéo Orbit",
    domain = "Sciences & Tech",
    subdomain = "Découverte"
  ): TimelineAiInsight[] {
    const all = this.getAllInsights();
    const list = all[videoId];
    if (Array.isArray(list) && list.length > 0) {
      return [...list]
        .map((item) => this.normalizeInsight(item as Partial<TimelineAiInsight> & Record<string, unknown>))
        .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    }

    // Repères initiaux multi-catégories pour illustrer la Smart Timeline, les Pins colorés et le Graphe de Connaissances
    return [
      this.normalizeInsight({
        id: `seed-insight-${videoId}-18`,
        videoId,
        videoTitle,
        timestampSeconds: 18,
        timestampFormatted: "00:18",
        userPrompt: "Quel est le principe architectural introduit dans cette ouverture ?",
        category: "technique",
        headline: `Architecture & Cadre Initial — ${subdomain}`,
        answer: `À 00:18 dans « ${videoTitle} », la séquence pose les fondations techniques du sujet (${domain} › ${subdomain}) en isolant les paramètres critiques du système.`,
        visualObservations: [
          `Ouverture méthodologique à 00:18`,
          `Paramètres techniques : ${domain} · ${subdomain}`,
        ],
        suggestedFollowUps: [
          "Comment ce modèle passe-t-il à l'échelle ?",
          "Quels sont les compromis de performance associés ?",
        ],
        keyConceptTag: subdomain,
        relatedConcepts: [domain, "Architecture Système"],
        semanticKeywords: ["architecture", "ouverture", subdomain.toLowerCase(), "00:18"],
        source: "local-fallback",
        createdAt: "14:15",
      }),
      this.normalizeInsight({
        id: `seed-insight-${videoId}-45`,
        videoId,
        videoTitle,
        timestampSeconds: 45,
        timestampFormatted: "00:45",
        userPrompt: "Analyse la composition visuelle et l'intention créative de ce plan.",
        category: "creatif",
        headline: `Mise en scène & Dynamique Visuelle à 00:45`,
        answer: `À 00:45, la construction visuelle guide l'attention vers le point focal pour renforcer l'impact narratif et faciliter la mémorisation du concept clé.`,
        visualObservations: [
          "Contraste directionnel marqué sur le sujet central",
          "Transition rythmique soutenant la démonstration",
        ],
        suggestedFollowUps: [
          "Quelle technique optique permet d'obtenir ce rendu ?",
          "Comment reproduire cet éclairage en conditions réelles ?",
        ],
        keyConceptTag: "Direction Visuelle",
        relatedConcepts: [subdomain, "Composition Optique"],
        semanticKeywords: ["créatif", "visuel", "lumière", "composition", "00:45"],
        source: "local-fallback",
        createdAt: "14:20",
      }),
      this.normalizeInsight({
        id: `seed-insight-${videoId}-82`,
        videoId,
        videoTitle,
        timestampSeconds: 82,
        timestampFormatted: "01:22",
        userPrompt: "Quel est le point de friction ou cas limite démontré ici ?",
        category: "bug",
        headline: `Point Critique & Résolution d'Anomalie (01:22)`,
        answer: `À 01:22, la démonstration met en évidence un goulot d'étranglement classique et présente le correctif structurel permettant de stabiliser le flux.`,
        visualObservations: [
          "Identification du cas limite à 01:22",
          "Mécanisme de validation et garde-fou appliqué",
        ],
        suggestedFollowUps: [
          "Comment automatiser la détection de cette anomalie ?",
          "Quel test unitaire couvre ce scénario ?",
        ],
        keyConceptTag: "Validation & Résilience",
        relatedConcepts: ["Architecture Système", subdomain],
        semanticKeywords: ["bug", "critique", "anomalie", "résilience", "01:22"],
        source: "local-fallback",
        createdAt: "14:24",
      }),
    ];
  }

  static saveInsight(insight: TimelineAiInsight): TimelineAiInsight[] {
    const normalized = this.normalizeInsight(
      insight as Partial<TimelineAiInsight> & Record<string, unknown>
    );
    try {
      const all = this.getAllInsights();
      const existing = Array.isArray(all[normalized.videoId])
        ? all[normalized.videoId]
        : this.getInsightsForVideo(normalized.videoId, normalized.videoTitle);
      const updated = [
        normalized,
        ...existing.filter((item) => item.id !== normalized.id),
      ].sort((a, b) => a.timestampSeconds - b.timestampSeconds);

      all[normalized.videoId] = updated;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return updated;
    } catch {
      return [normalized];
    }
  }

  static replaceInsightsForVideo(
    videoId: number,
    insights: TimelineAiInsight[]
  ): TimelineAiInsight[] {
    try {
      const all = this.getAllInsights();
      const sorted = [...insights]
        .map((item) =>
          this.normalizeInsight(item as Partial<TimelineAiInsight> & Record<string, unknown>)
        )
        .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
      all[videoId] = sorted;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return sorted;
    } catch {
      return insights;
    }
  }

  static deleteInsight(videoId: number, insightId: string): TimelineAiInsight[] {
    try {
      const all = this.getAllInsights();
      const existing = Array.isArray(all[videoId]) ? all[videoId] : [];
      const updated = existing.filter((item) => item.id !== insightId);
      all[videoId] = updated;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return updated;
    } catch {
      return [];
    }
  }

  static async generateFrameInsight(params: {
    video: {
      id: number;
      title: string;
      domain?: string;
      subdomain?: string;
    };
    timestampSeconds: number;
    userPrompt: string;
    frameDataUrl?: string | null;
    category?: TimelinePinCategory;
    annotationShapes?: VisualAnnotationShape[];
  }): Promise<TimelineAiInsight> {
    return this.analyzePausedMoment({
      videoId: params.video.id,
      videoTitle: params.video.title,
      domain: params.video.domain,
      subdomain: params.video.subdomain,
      timestampSeconds: params.timestampSeconds,
      prompt: params.userPrompt,
      frameDataUrl: params.frameDataUrl || undefined,
      annotationShapes: params.annotationShapes,
      preferredCategory: params.category,
    });
  }

  static async analyzePausedMoment(params: {
    videoId: number;
    videoTitle: string;
    domain?: string;
    subdomain?: string;
    timestampSeconds: number;
    prompt: string;
    frameDataUrl?: string;
    annotationShapes?: VisualAnnotationShape[];
    preferredCategory?: TimelinePinCategory;
    authorName?: string;
  }): Promise<TimelineAiInsight> {
    const timestampSeconds = Math.max(
      0,
      Math.round(params.timestampSeconds || 0)
    );
    const timestampFormatted = formatInsightTimestamp(timestampSeconds);

    const hasAnnotations =
      Array.isArray(params.annotationShapes) &&
      params.annotationShapes.length > 0;

    const effectiveFrameDataUrl =
      params.frameDataUrl && hasAnnotations
        ? await compositeFrameWithAnnotations(
            params.frameDataUrl,
            params.annotationShapes!
          )
        : params.frameDataUrl;

    const response = await fetch("/api/orbit/frame-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.videoTitle,
        domain: params.domain || "Sciences & Tech",
        subdomain: params.subdomain || "Exploration IA",
        timestampSeconds,
        timestampFormatted,
        prompt: params.prompt,
        frameBase64: effectiveFrameDataUrl || "",
        mimeType: "image/jpeg",
        hasVisualAnnotation: hasAnnotations,
        annotationShapesCount: params.annotationShapes?.length || 0,
        preferredCategory: params.preferredCategory || "",
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API (${response.status})`);
    }

    const data = await response.json();
    const nowStr = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const validCategories: TimelinePinCategory[] = [
      "technique",
      "creatif",
      "bug",
      "concept",
    ];
    const resolvedCategory: TimelinePinCategory = validCategories.includes(
      data.category
    )
      ? data.category
      : params.preferredCategory || "technique";

    const headline =
      data.headline ||
      `Analyse à ${timestampFormatted} — ${params.subdomain || params.domain}`;
    const answer =
      data.answer ||
      `Analyse générée pour l'instant ${timestampFormatted}.`;
    const visualObservations = Array.isArray(data.visualObservations)
      ? data.visualObservations
      : [];

    const newInsight: TimelineAiInsight = this.normalizeInsight({
      id: `insight-${params.videoId}-${timestampSeconds}-${Date.now()}`,
      videoId: params.videoId,
      videoTitle: params.videoTitle,
      timestampSeconds,
      timestampFormatted,
      userPrompt: params.prompt,
      frameDataUrl: params.frameDataUrl,
      annotatedFrameDataUrl: hasAnnotations ? effectiveFrameDataUrl : undefined,
      annotationShapes: params.annotationShapes,
      category: resolvedCategory,
      headline,
      answer,
      visualObservations,
      suggestedFollowUps: Array.isArray(data.suggestedFollowUps)
        ? data.suggestedFollowUps
        : [],
      keyConceptTag:
        data.keyConceptTag || params.subdomain || params.domain || "Insight",
      relatedConcepts: Array.isArray(data.relatedConcepts)
        ? data.relatedConcepts
        : [params.domain || "Sciences & Tech"],
      semanticKeywords: Array.isArray(data.semanticKeywords)
        ? data.semanticKeywords
        : [resolvedCategory, timestampFormatted],
      source: data.source === "gemini" ? "gemini" : "local-fallback",
      createdAt: nowStr,
      authorName: params.authorName,
      aiHeadline: headline,
      aiAnalysis: answer,
      keyTakeaways: visualObservations,
    });

    this.saveInsight(newInsight);
    return newInsight;
  }

  /**
   * Exporte un Carnet Interactif (.orbit) téléchargeable contenant la vidéo,
   * les timestamps, les dessins vectoriels et les analyses Gemini.
   */
  static exportOrbitNotebookFile(
    video: {
      id: number;
      title: string;
      domain: string;
      subdomain: string;
      platform: string;
      youtubeId?: string;
      rawUrl?: string;
      durationMinutes?: number;
    },
    insights: TimelineAiInsight[],
    author = "Explorateur Orbit"
  ): void {
    const payload: OrbitShareableNotebook = {
      format: "orbit-interactive-notebook-v2",
      id: `orb-local-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      author,
      video,
      insights,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = video.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36);
    a.href = url;
    a.download = `carnet-${slug || "video"}.orbit`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Publie le carnet sur le serveur et retourne un lien partageable unique (?orbitNotebook=...).
   */
  static async publishSharedOrbitNotebook(
    video: {
      id: number;
      title: string;
      domain: string;
      subdomain: string;
      platform: string;
      youtubeId?: string;
      rawUrl?: string;
      durationMinutes?: number;
    },
    insights: TimelineAiInsight[],
    author = "Explorateur Orbit"
  ): Promise<{ id: string; shareUrl: string }> {
    const res = await fetch("/api/orbit/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, video, insights }),
    });
    if (!res.ok) {
      throw new Error("Impossible de générer le lien .orbit partageable.");
    }
    const data = await res.json();
    const shareUrl = `${window.location.origin}${window.location.pathname}?orbitNotebook=${encodeURIComponent(
      data.id
    )}`;
    return { id: data.id, shareUrl };
  }
}
