import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  TimelineAiInsight,
  TimelineInsightsService,
  PIN_CATEGORY_META,
  OrbitShareableNotebook,
} from "../services/timelineInsightsService";
import {
  Film,
  Download,
  Share2,
  Check,
  Copy,
  Upload,
  Loader2,
  X,
  FileJson,
} from "lucide-react";

interface SmartClipExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  activeInsight: TimelineAiInsight | null;
  onImportNotebookInsights: (imported: TimelineAiInsight[]) => void;
}

export const SmartClipExporterModal: React.FC<SmartClipExporterModalProps> = ({
  isOpen,
  onClose,
  video,
  insights,
  activeInsight,
  onImportNotebookInsights,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedInsightId, setSelectedInsightId] = useState<string>(
    activeInsight?.id || insights[0]?.id || ""
  );
  const [clipFormat, setClipFormat] = useState<"9-16" | "16-9">("9-16");
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeInsight?.id) {
      setSelectedInsightId(activeInsight.id);
    } else if (insights[0]?.id) {
      setSelectedInsightId(insights[0].id);
    }
  }, [activeInsight, insights]);

  const targetInsight =
    insights.find((i) => i.id === selectedInsightId) ||
    activeInsight ||
    insights[0] ||
    null;

  const drawSmartClipFrame = useCallback(
    (animProgress = 1) => {
      const canvas = previewCanvasRef.current;
      if (!canvas || !targetInsight) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = clipFormat === "9-16" ? 540 : 800;
      const height = clipFormat === "9-16" ? 960 : 450;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const catMeta =
        PIN_CATEGORY_META[targetInsight.category] ||
        PIN_CATEGORY_META.technique;

      // Fond atmosphérique Obsidian
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#050811");
      bgGrad.addColorStop(0.5, "#0d1528");
      bgGrad.addColorStop(1, "#060913");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Bordure signature Orbit
      ctx.strokeStyle = catMeta.hex;
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // En-tête de marque ORBIT STUDIO
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText(
        `ORBIT STUDIO · SMART CLIP [${targetInsight.timestampFormatted}]`,
        36,
        52
      );

      ctx.fillStyle = catMeta.hex;
      ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        `CATÉGORIE : ${catMeta.label.toUpperCase()} · CONCEPT : ${targetInsight.keyConceptTag.toUpperCase()}`,
        36,
        76
      );

      // Titre de la vidéo
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
      const maxTitleChars = clipFormat === "9-16" ? 36 : 58;
      const cleanVideoTitle =
        video.title.length > maxTitleChars
          ? `${video.title.slice(0, maxTitleChars)}…`
          : video.title;
      ctx.fillText(cleanVideoTitle, 36, 112);

      // Zone d'aperçu de la frame annotée
      const frameBoxY = 132;
      const frameBoxH = clipFormat === "9-16" ? 270 : 145;
      ctx.fillStyle = "#090f1d";
      ctx.fillRect(36, frameBoxY, width - 72, frameBoxH);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(36, frameBoxY, width - 72, frameBoxH);

      // Question utilisateur
      const textStartY = frameBoxY + frameBoxH + 34;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 14px 'Plus Jakarta Sans', sans-serif";
      const promptExcerpt =
        targetInsight.userPrompt.length > 64
          ? `« ${targetInsight.userPrompt.slice(0, 64)}… »`
          : `« ${targetInsight.userPrompt} »`;
      ctx.fillText(promptExcerpt, 36, textStartY);

      // Headline de l'analyse IA
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
      const headLimit = clipFormat === "9-16" ? 42 : 66;
      ctx.fillText(
        targetInsight.headline.length > headLimit
          ? `${targetInsight.headline.slice(0, headLimit)}…`
          : targetInsight.headline,
        36,
        textStartY + 32
      );

      // Réponse synthétique multi-lignes
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      const words = targetInsight.answer.split(" ");
      let line = "";
      let lineY = textStartY + 62;
      const maxLineWidth = width - 76;
      const maxLines = clipFormat === "9-16" ? 8 : 3;
      let linesDrawn = 0;

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxLineWidth) {
          if (linesDrawn < maxLines) {
            ctx.fillText(line, 36, lineY);
            line = word;
            lineY += 22;
            linesDrawn++;
          }
        } else {
          line = testLine;
        }
      }
      if (line && linesDrawn < maxLines) {
        ctx.fillText(line, 36, lineY);
      }

      // Barre de progression dynamique en pied de carte
      const barY = height - 56;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(36, barY, width - 72, 6);
      ctx.fillStyle = catMeta.hex;
      ctx.fillRect(36, barY, (width - 72) * animProgress, 6);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText(
        `EXTRAIT ANNOTÉ : ${targetInsight.timestampFormatted} · GÉNÉRÉ AVEC ORBIT AI STUDIO`,
        36,
        height - 28
      );

      // Dessiner l'image de la frame si présente
      const imgSrc =
        targetInsight.annotatedFrameDataUrl || targetInsight.frameDataUrl;
      if (imgSrc) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 36, frameBoxY, width - 72, frameBoxH);
        };
        img.src = imgSrc;
      }
    },
    [targetInsight, clipFormat, video.title]
  );

  useEffect(() => {
    if (!isOpen) return;
    drawSmartClipFrame(1);
  }, [isOpen, drawSmartClipFrame]);

  const handleDownloadPngPoster = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !targetInsight) return;
    drawSmartClipFrame(1);
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `orbit-clip-${targetInsight.timestampFormatted.replace(
      ":",
      "m"
    )}s.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusNotice("Affiche Smart Clip HD (.png) téléchargée.");
  };

  const handleExportAnimatedWebmClip = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !targetInsight || isRecordingWebm) return;
    if (typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      handleDownloadPngPoster();
      return;
    }

    setIsRecordingWebm(true);
    setStatusNotice("Génération de l'extrait vidéo animé (.webm)...");

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orbit-smart-clip-${targetInsight.timestampFormatted.replace(
          ":",
          "m"
        )}s.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecordingWebm(false);
        setStatusNotice("Extrait vidéo dynamique (.webm) exporté avec succès.");
      };

      recorder.start();
      const totalFrames = 60;
      for (let f = 1; f <= totalFrames; f++) {
        drawSmartClipFrame(f / totalFrames);
        await new Promise((r) => setTimeout(r, 35));
      }
      recorder.stop();
    } catch {
      setIsRecordingWebm(false);
      handleDownloadPngPoster();
    }
  };

  const handleGenerateShareLink = async () => {
    setIsGeneratingLink(true);
    setStatusNotice(null);
    try {
      const { shareUrl } =
        await TimelineInsightsService.publishSharedOrbitNotebook(
          video,
          insights,
          "Valentin R."
        );
      setShareLink(shareUrl);
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopiedLink(true);
      setStatusNotice("Lien unique .orbit généré et copié dans le presse-papiers.");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      setStatusNotice(
        err instanceof Error ? err.message : "Erreur de génération du lien."
      );
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleImportOrbitFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(
          String(reader.result)
        ) as OrbitShareableNotebook;
        if (parsed && Array.isArray(parsed.insights)) {
          onImportNotebookInsights(parsed.insights);
          setStatusNotice(
            `Carnet .orbit importé (${parsed.insights.length} repères restaurés).`
          );
        }
      } catch {
        setStatusNotice("Fichier .orbit invalide.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Film className="w-4 h-4 text-cyan-400" />
            <span>
              Carnets Partageables (.orbit) & Export de Clips Intelligents
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Colonne Gauche : Aperçu Canvas du Smart Clip */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Aperçu de l&apos;extrait annoté
              </span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setClipFormat("9-16")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    clipFormat === "9-16"
                      ? "bg-cyan-400 text-slate-950 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  Vertical 9:16
                </button>
                <button
                  type="button"
                  onClick={() => setClipFormat("16-9")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    clipFormat === "16-9"
                      ? "bg-cyan-400 text-slate-950 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  Paysage 16:9
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-black border border-slate-800 p-2 flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[300px] w-auto rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportAnimatedWebmClip}
                disabled={isRecordingWebm || !targetInsight}
                className="px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRecordingWebm ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Encodage .webm...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5" />
                    <span>Exporter Clip (.webm)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadPngPoster}
                disabled={!targetInsight}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Carte HD (.png)</span>
              </button>
            </div>
          </div>

          {/* Colonne Droite : Sélection du moment & Carnet Partageable (.orbit) */}
          <div className="md:col-span-6 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Passage annoté à mettre en avant :
                </label>
                <select
                  value={selectedInsightId}
                  onChange={(e) => setSelectedInsightId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                >
                  {insights.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      [{ins.timestampFormatted}] {ins.headline}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Carnets et Liens Partageables (.orbit) */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Carnet Interactif & Lien Partageable (.orbit)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compilez la vidéo, les {insights.length} repères temporels, vos
                  croquis sur frame et les réponses de l&apos;IA dans un lien
                  unique ou un fichier <code className="text-cyan-300">.orbit</code>.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  disabled={isGeneratingLink}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingLink ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>Générer un lien web interactif unique</span>
                </button>

                {shareLink && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                      title="Copier le lien"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      TimelineInsightsService.exportOrbitNotebookFile(
                        video,
                        insights,
                        "Valentin R."
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Télécharger .orbit</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".orbit,.json"
                    onChange={handleImportOrbitFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ouvrir un .orbit</span>
                  </button>
                </div>
              </div>
            </div>

            {statusNotice && (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-300">
                {statusNotice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
