import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { OrbitVideo } from "../data/orbitData";
import {
  TimelineInsightsService,
  TimelineAiInsight,
  TimelinePinCategory,
  PIN_CATEGORY_META,
  formatInsightTimestamp,
} from "../services/timelineInsightsService";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Camera,
  Send,
  X,
  Clock,
  Trash2,
  Loader2,
  AlertTriangle,
  Sparkles,
  Upload,
  Film,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface InteractiveVideoExplorerModalProps {
  video: OrbitVideo | null;
  allVideos?: OrbitVideo[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (video: OrbitVideo) => void;
}

interface HostedVideoStream {
  id: string;
  title: string;
  domain: string;
  subdomain: string;
  url: string;
}

const HOSTED_MP4_STREAMS: HostedVideoStream[] = [
  {
    id: "stream-cosmos",
    title: "Séquence Optique & Cinématique HD (Flux MP4 CORS)",
    domain: "Sciences & Tech",
    subdomain: "Optique & Mouvement",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "stream-escapes",
    title: "Exploration Grand Angle & Lumière Naturelle (Flux MP4 CORS)",
    domain: "Création Numérique",
    subdomain: "Réalisation & Plans",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    id: "stream-fun",
    title: "Dynamique de Scène & Rythme Visuel (Flux MP4 CORS)",
    domain: "Cinéma & Séries",
    subdomain: "Analyse Filmique",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
];

const QUICK_PROMPTS = [
  "Décris précisément ce qui est visible à l'écran sur cette frame.",
  "Analyse la composition visuelle, la lumière et le cadrage de ce plan.",
  "Quel est l'élément technique ou conceptuel clé à ce timestamp ?",
];

export const InteractiveVideoExplorerModal: React.FC<
  InteractiveVideoExplorerModalProps
> = ({ video, isOpen, onClose }) => {
  // Références DOM strictes (<video> et <canvas> masqué) — Zéro re-render parasite
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  // Source vidéo active (fichier local, URL .mp4 de la vidéo Orbit, ou flux HD hébergé)
  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    HOSTED_MP4_STREAMS[0].id
  );
  const [localVideoObjectUrl, setLocalVideoObjectUrl] = useState<string | null>(
    null
  );
  const [localVideoName, setLocalVideoName] = useState<string>("");
  const [customMp4Url, setCustomMp4Url] = useState<string>("");

  // État du lecteur HTML5
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoReady, setVideoReady] = useState<boolean>(false);

  // État de capture Canvas & HUD Contextuel
  const [capturedFrameBase64, setCapturedFrameBase64] = useState<string | null>(
    null
  );
  const [capturedTimestampSec, setCapturedTimestampSec] = useState<number>(0);
  const [frameDimensions, setFrameDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [hudVisible, setHudVisible] = useState<boolean>(false);

  // État du prompt & appel API Gemini
  const [promptText, setPromptText] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<TimelinePinCategory>("technique");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastApiSource, setLastApiSource] = useState<"gemini" | "local" | null>(
    null
  );

  // Liste des marqueurs (Pins) et réponses IA associées aux timestamps
  const effectiveVideoId = useMemo(() => video?.id || 99001, [video?.id]);
  const [insights, setInsights] = useState<TimelineAiInsight[]>([]);
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);

  // Résolution de l'URL vidéo HTML5 réelle à lire
  const activeStreamMeta = useMemo(() => {
    if (localVideoObjectUrl) {
      return {
        title: localVideoName || "Fichier vidéo local",
        domain: video?.domain || "Production Locale",
        subdomain: video?.subdomain || "Inspection Frame",
        url: localVideoObjectUrl,
      };
    }
    if (customMp4Url.trim()) {
      return {
        title: video?.title || "Flux MP4 personnalisé",
        domain: video?.domain || "Sciences & Tech",
        subdomain: video?.subdomain || "Exploration IA",
        url: customMp4Url.trim(),
      };
    }
    if (
      video?.mp4Url &&
      !video.mp4Url.includes("proxy-mp4") &&
      selectedStreamId === "orbit-video"
    ) {
      return {
        title: video.title,
        domain: video.domain,
        subdomain: video.subdomain,
        url: video.mp4Url,
      };
    }
    const found =
      HOSTED_MP4_STREAMS.find((s) => s.id === selectedStreamId) ||
      HOSTED_MP4_STREAMS[0];
    return {
      title: video?.title ? `${video.title} (${found.title})` : found.title,
      domain: video?.domain || found.domain,
      subdomain: video?.subdomain || found.subdomain,
      url: found.url,
    };
  }, [
    localVideoObjectUrl,
    localVideoName,
    customMp4Url,
    video,
    selectedStreamId,
  ]);

  // Chargement des pins existants à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    const saved = TimelineInsightsService.getInsightsForVideo(effectiveVideoId);
    setInsights(saved);
    if (saved.length > 0) {
      setActiveInsightId(saved[0].id);
    }
    setApiError(null);
  }, [isOpen, effectiveVideoId]);

  // Nettoyage de l'ObjectURL local au démontage
  useEffect(() => {
    return () => {
      if (localVideoObjectUrl) {
        URL.revokeObjectURL(localVideoObjectUrl);
      }
    };
  }, [localVideoObjectUrl]);

  /**
   * 2. CAPTURE EXACTE DE LA FRAME VIA LE <canvas> MASQUÉ
   * Exécutée de manière synchrone et légère au moment précis de la pause.
   */
  const captureExactFrameFromVideo = useCallback((): string | null => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return null;

    const rawWidth = videoEl.videoWidth || 1280;
    const rawHeight = videoEl.videoHeight || 720;

    // Normalisation HD 720p max pour un envoi rapide et net à Gemini
    const scale = Math.min(1, 1280 / Math.max(1, rawWidth));
    const targetWidth = Math.max(320, Math.round(rawWidth * scale));
    const targetHeight = Math.max(180, Math.round(rawHeight * scale));

    canvasEl.width = targetWidth;
    canvasEl.height = targetHeight;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return null;

    try {
      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
      } else {
        // Fond de secours si la métadonnée vidéo n'est pas encore prête
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Incrustation discrète du repère temporel en bas à droite du frame
      const sec = Math.floor(videoEl.currentTime || 0);
      const timeLabel = formatInsightTimestamp(sec);
      ctx.fillStyle = "rgba(6, 10, 19, 0.82)";
      ctx.fillRect(targetWidth - 110, targetHeight - 34, 98, 24);
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`⏱ ${timeLabel}`, targetWidth - 100, targetHeight - 17);

      const dataUrl = canvasEl.toDataURL("image/jpeg", 0.86);
      setCapturedFrameBase64(dataUrl);
      setCapturedTimestampSec(sec);
      setFrameDimensions({ width: targetWidth, height: targetHeight });
      return dataUrl;
    } catch {
      // Si un flux externe bloque l'extraction CORS, on génère une mire technique propre sur le canvas
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, targetWidth - 32, targetHeight - 32);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(activeStreamMeta.title.slice(0, 48), 36, 64);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 15px monospace";
      const sec = Math.floor(videoEl.currentTime || 0);
      ctx.fillText(
        `TIMESTAMP CAPTURÉ : ${formatInsightTimestamp(sec)}`,
        36,
        100
      );
      const fallbackUrl = canvasEl.toDataURL("image/jpeg", 0.85);
      setCapturedFrameBase64(fallbackUrl);
      setCapturedTimestampSec(sec);
      setFrameDimensions({ width: targetWidth, height: targetHeight });
      return fallbackUrl;
    }
  }, [activeStreamMeta.title]);

  /**
   * 1. CONTRÔLE LECTURE / PAUSE FLUIDE
   */
  const togglePlayPause = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused || videoEl.ended) {
      setHudVisible(false);
      videoEl.play().catch(() => {
        setApiError(
          "La lecture automatique a été bloquée par le navigateur. Cliquez sur le bouton Lecture."
        );
      });
    } else {
      videoEl.pause();
    }
  }, []);

  // Gestionnaires d'événements natifs de la balise <video>
  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    setApiError(null);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
    captureExactFrameFromVideo();
    setHudVisible(true);
    window.setTimeout(() => {
      promptInputRef.current?.focus();
    }, 60);
  }, [captureExactFrameFromVideo]);

  const handleTimeUpdate = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setCurrentTime(videoEl.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setDuration(videoEl.duration || 0);
    setVideoReady(true);
    setCurrentTime(videoEl.currentTime || 0);
  }, []);

  // Déplacement précis sur la frise temporelle (Seek)
  const seekToSeconds = useCallback(
    (targetSeconds: number, pauseAndCapture = false) => {
      const videoEl = videoRef.current;
      if (!videoEl) return;
      const maxDur = videoEl.duration || duration || 300;
      const clamped = Math.max(0, Math.min(maxDur, targetSeconds));
      videoEl.currentTime = clamped;
      setCurrentTime(clamped);

      if (pauseAndCapture) {
        videoEl.pause();
        window.setTimeout(() => {
          captureExactFrameFromVideo();
          setHudVisible(true);
        }, 80);
      }
    },
    [duration, captureExactFrameFromVideo]
  );

  // Raccourci clavier immersif (Espace pour Pause/Lecture, Flèches pour -5s/+5s)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        if (e.key === "Escape") {
          target?.blur();
        }
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekToSeconds(currentTime - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekToSeconds(currentTime + 5);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, togglePlayPause, seekToSeconds, currentTime, onClose]);

  // Import d'un fichier vidéo local (.mp4, .webm, .mov)
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localVideoObjectUrl) {
      URL.revokeObjectURL(localVideoObjectUrl);
    }
    const objUrl = URL.createObjectURL(file);
    setLocalVideoObjectUrl(objUrl);
    setLocalVideoName(file.name);
    setCustomMp4Url("");
    setVideoReady(false);
    setHudVisible(false);
    setApiError(null);
  };

  /**
   * 3. ENVOI DU CONTEXTE (TIMESTAMP + PROMPT + FRAME BASE64) À GEMINI
   * Avec gestion stricte des erreurs réseau / quota / clé API.
   */
  const handleSendToGemini = useCallback(
    async (overridePrompt?: string) => {
      const cleanPrompt = (overridePrompt ?? promptText).trim();
      if (!cleanPrompt || isAnalyzing) return;

      // Garantir que la vidéo est en pause et que la frame est capturée
      const videoEl = videoRef.current;
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }

      const sec = Math.floor(videoEl?.currentTime ?? currentTime);
      const formattedTime = formatInsightTimestamp(sec);
      const base64Frame =
        capturedFrameBase64 || captureExactFrameFromVideo() || "";

      setIsAnalyzing(true);
      setApiError(null);

      try {
        const response = await fetch("/api/orbit/frame-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: activeStreamMeta.title,
            domain: activeStreamMeta.domain,
            subdomain: activeStreamMeta.subdomain,
            timestampSeconds: sec,
            timestampFormatted: formattedTime,
            prompt: cleanPrompt,
            frameBase64: base64Frame,
            mimeType: "image/jpeg",
            preferredCategory: selectedCategory,
          }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          if (response.status === 429) {
            throw new Error(
              "Quota API Gemini atteint (HTTP 429). Veuillez patienter quelques secondes avant de relancer l'analyse."
            );
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Clé API Gemini invalide ou non autorisée (HTTP 401/403). Vérifiez la variable GEMINI_API_KEY du serveur."
            );
          }
          throw new Error(
            errJson.error ||
              `Erreur lors de l'appel au serveur d'analyse IA (HTTP ${response.status}).`
          );
        }

        const data = await response.json();
        setLastApiSource(data.source === "gemini" ? "gemini" : "local");

        const validCategories: TimelinePinCategory[] = [
          "technique",
          "creatif",
          "bug",
          "concept",
        ];
        const resolvedCat: TimelinePinCategory = validCategories.includes(
          data.category
        )
          ? data.category
          : selectedCategory;

        const headlineText =
          data.headline || `Analyse à ${formattedTime} · ${cleanPrompt}`;
        const answerText =
          data.answer ||
          `Analyse générée pour la frame capturée à ${formattedTime}.`;
        const observationsList = Array.isArray(data.visualObservations)
          ? data.visualObservations
          : [];
        const followUpsList = Array.isArray(data.suggestedFollowUps)
          ? data.suggestedFollowUps
          : [];

        const newInsight: TimelineAiInsight =
          TimelineInsightsService.normalizeInsight({
            id: `pin-${effectiveVideoId}-${sec}-${Date.now()
              .toString(36)
              .slice(-4)}`,
            videoId: effectiveVideoId,
            videoTitle: activeStreamMeta.title,
            timestampSeconds: sec,
            timestampFormatted: formattedTime,
            userPrompt: cleanPrompt,
            headline: headlineText,
            answer: answerText,
            visualObservations: observationsList,
            suggestedFollowUps: followUpsList,
            aiHeadline: headlineText,
            aiAnalysis: answerText,
            keyTakeaways: observationsList,
            followUpSuggestions: followUpsList,
            frameDataUrl: base64Frame,
            createdAt: new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            source: data.source === "gemini" ? "gemini" : "local-fallback",
            category: resolvedCat,
            keyConceptTag: data.keyConceptTag || activeStreamMeta.subdomain,
            relatedConcepts: Array.isArray(data.relatedConcepts)
              ? data.relatedConcepts
              : [activeStreamMeta.domain],
            semanticKeywords: Array.isArray(data.semanticKeywords)
              ? data.semanticKeywords
              : [formattedTime],
          });

        // Persistance locale unifiée via TimelineInsightsService
        const updatedList = TimelineInsightsService.saveInsight(newInsight);

        setInsights(updatedList);
        setActiveInsightId(newInsight.id);
        setPromptText("");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur réseau lors de la communication avec le service Gemini.";
        setApiError(message);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      promptText,
      isAnalyzing,
      currentTime,
      capturedFrameBase64,
      captureExactFrameFromVideo,
      activeStreamMeta,
      selectedCategory,
      effectiveVideoId,
    ]
  );

  const handleDeletePin = useCallback(
    (insightId: string) => {
      TimelineInsightsService.deleteInsight(effectiveVideoId, insightId);
      const refreshed =
        TimelineInsightsService.getInsightsForVideo(effectiveVideoId);
      setInsights(refreshed);
      if (activeInsightId === insightId) {
        setActiveInsightId(refreshed[0]?.id || null);
      }
    },
    [effectiveVideoId, activeInsightId]
  );

  const activeInsight = useMemo(
    () =>
      insights.find((item) => item.id === activeInsightId) ||
      insights[0] ||
      null,
    [insights, activeInsightId]
  );

  if (!isOpen) return null;

  const effectiveDuration = Math.max(1, duration || 60);
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / effectiveDuration) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-slate-100 flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Station d'exploration vidéo interactive Orbit"
    >
      {/* ÉLÉMENT <canvas> MASQUÉ POUR L'EXTRACTION DE FRAME SANS BLOQUER LE RENDU */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* INPUT FICHIER VIDÉO LOCAL MASQUÉ */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleLocalFileChange}
        className="hidden"
      />

      {/* ====================================================================
          BARRE SUPÉRIEURE DE LA STATION DE TRAVAIL (SÉLECTEUR DE SOURCE & STATUT)
          ==================================================================== */}
      <header className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-300">
                ORBIT HUD · Exploration Vidéo & Capture Frame IA
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isPlaying
                    ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/40 text-amber-300"
                }`}
              >
                {isPlaying
                  ? "▶ EN LECTURE"
                  : `⏸ PAUSE (${formatInsightTimestamp(currentTime)})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeStreamMeta.title} · Appuyez sur{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">
                Espace
              </kbd>{" "}
              pour mettre en pause et capturer la frame via Canvas
            </p>
          </div>
        </div>

        {/* Sélecteur de flux vidéo HTML5 natif ou import de fichier local */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={localVideoObjectUrl ? "local" : selectedStreamId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "local") {
                  fileInputRef.current?.click();
                  return;
                }
                setLocalVideoObjectUrl(null);
                setCustomMp4Url("");
                setSelectedStreamId(val);
                setHudVisible(false);
              }}
              aria-label="Choisir la source vidéo"
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              {HOSTED_MP4_STREAMS.map((stream) => (
                <option
                  key={stream.id}
                  value={stream.id}
                  className="bg-slate-900 text-white"
                >
                  {stream.title}
                </option>
              ))}
              {video?.mp4Url && !video.mp4Url.includes("proxy-mp4") && (
                <option
                  value="orbit-video"
                  className="bg-slate-900 text-cyan-300"
                >
                  Vidéo Orbit active : {video.title.slice(0, 38)}
                </option>
              )}
              {localVideoObjectUrl && (
                <option value="local" className="bg-slate-900 text-emerald-300">
                  Fichier local : {localVideoName}
                </option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Charger un fichier vidéo .mp4 ou .webm depuis votre appareil"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fichier local (.mp4)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-xs font-bold text-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fermer</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          GRILLE PRINCIPALE : LECTEUR VIDÉO + HUD (GAUCHE) | RÉPONSES IA & PINS (DROITE)
          ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-0 overflow-hidden">
        {/* COLONNE GAUCHE : SCÈNE VIDÉO HTML5 + HUD DE PAUSE + FRISE TEMPORELLE À PINS */}
        <div className="flex flex-col bg-black min-h-0 relative justify-between overflow-y-auto lg:overflow-hidden">
          {/* SCÈNE VIDÉO PRINCIPALE */}
          <div className="relative flex-1 flex items-center justify-center bg-black min-h-[260px] overflow-hidden">
            <video
              ref={videoRef}
              src={activeStreamMeta.url}
              crossOrigin="anonymous"
              playsInline
              muted={isMuted}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlayPause}
              className="w-full h-full max-h-[calc(100dvh-210px)] object-contain cursor-pointer select-none"
            />

            {/* Badge d'état discret en haut à gauche de la vidéo */}
            <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-950/85 border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                ⏱ {formatInsightTimestamp(currentTime)} /{" "}
                {formatInsightTimestamp(effectiveDuration)}
              </span>
              {!isPlaying && capturedFrameBase64 && (
                <span className="px-2.5 py-1 rounded-md bg-cyan-950/90 border border-cyan-400/40 text-[11px] font-mono font-bold text-cyan-300 backdrop-blur-md flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Frame capturée (
                    {frameDimensions
                      ? `${frameDimensions.width}×${frameDimensions.height}`
                      : "Canvas HD"}
                    )
                  </span>
                </span>
              )}
            </div>

            {/* Bouton flottant pour réafficher le HUD si l'utilisateur l'a réduit pendant la pause */}
            {!isPlaying && !hudVisible && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    captureExactFrameFromVideo();
                    setHudVisible(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Interroger Gemini sur cette frame (
                    {formatInsightTimestamp(currentTime)})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xl"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>Reprendre</span>
                </button>
              </div>
            )}

            {/* ================================================================
                PANNEAU HUD EN SURIMPRESSION (AFFICHÉ AUTOMATIQUEMENT À LA PAUSE)
                ================================================================ */}
            {hudVisible && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-3 sm:inset-x-8 bottom-3 z-30 max-w-2xl mx-auto rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl p-4 space-y-3"
              >
                {/* En-tête du HUD : Miniature de la frame extraite + Timestamp + Catégorie du Pin */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {capturedFrameBase64 ? (
                      <img
                        src={capturedFrameBase64}
                        alt={`Frame à ${formatInsightTimestamp(
                          capturedTimestampSec
                        )}`}
                        className="w-24 h-14 rounded-lg object-cover border border-cyan-400/50 bg-black shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                        Canvas prêt
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300">
                          ⏱ {formatInsightTimestamp(capturedTimestampSec)}
                        </span>
                        <span className="text-xs font-bold text-white">
                          Inspection Multimodale de la Frame
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        La capture Canvas Base64 et le timestamp exact seront
                        transmis à Gemini.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        captureExactFrameFromVideo();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                      title="Actualiser la capture de la frame actuelle"
                    >
                      <RefreshCw className="w-3 h-3 text-cyan-400" />
                      <span>Recapturer</span>
                    </button>
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Reprendre</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHudVisible(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      title="Masquer le panneau HUD"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sélecteur de couleur / thématique du Pin sur la timeline */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">
                    Type de marqueur :
                  </span>
                  {(
                    Object.keys(PIN_CATEGORY_META) as TimelinePinCategory[]
                  ).map((catKey) => {
                    const meta = PIN_CATEGORY_META[catKey];
                    const isSelected = selectedCategory === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setSelectedCategory(catKey)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: isSelected
                            ? meta.bgSoft
                            : "rgba(15, 23, 42, 0.8)",
                          color: isSelected ? meta.color : "#94a3b8",
                          border: `1px solid ${
                            isSelected
                              ? meta.border
                              : "rgba(148, 163, 184, 0.18)"
                          }`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Formulaire de saisie du prompt contextuel */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendToGemini();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={promptInputRef}
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    disabled={isAnalyzing}
                    placeholder="Posez votre question ou consigne sur cet instant précis de la vidéo..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs sm:text-sm text-white outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzing || !promptText.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyse...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Envoyer à Gemini</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Suggestions rapides en 1 clic */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp}
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => {
                        setPromptText(qp);
                        void handleSendToGemini(qp);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 whitespace-nowrap cursor-pointer shrink-0 transition-colors"
                    >
                      ⚡ {qp}
                    </button>
                  ))}
                </div>

                {/* Affichage clair des erreurs API (Quota, Clé invalide, Réseau) */}
                {apiError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{apiError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSendToGemini()}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[11px] font-bold text-rose-200 cursor-pointer shrink-0"
                    >
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================================================================
              3. FRISE TEMPORELLE INTELLIGENTE (SMART TIMELINE & PINS CLIQUABLES)
              ================================================================ */}
          <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 space-y-2.5 shrink-0">
            {/* Barre de progression interactive avec Pins codés par couleur */}
            <div className="relative flex items-center py-1.5">
              <input
                type="range"
                min={0}
                max={effectiveDuration}
                step={0.1}
                value={Math.min(effectiveDuration, currentTime)}
                onChange={(e) => seekToSeconds( parseFloat(e.target.value) )}
                aria-label="Position temporelle dans la vidéo"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`,
                }}
              />

              {/* Marqueurs cliquables (Pins) sur la timeline */}
              {(Array.isArray(insights) ? insights : []).map((pin) => {
                const leftPct = Math.min(
                  98.5,
                  Math.max(1.5, (pin.timestampSeconds / effectiveDuration) * 100)
                );
                const catMeta =
                  PIN_CATEGORY_META[pin.category || "technique"] ||
                  PIN_CATEGORY_META.technique;
                const isSelected = pin.id === activeInsight?.id;
                const pinTitle =
                  pin.headline || pin.aiHeadline || "Pin IA";
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => {
                      setActiveInsightId(pin.id);
                      seekToSeconds(pin.timestampSeconds, true);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      backgroundColor: catMeta.color,
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-slate-950 cursor-pointer transition-transform z-20 ${
                      isSelected
                        ? "w-4 h-4 scale-125 ring-2 ring-white"
                        : "w-3 h-3 hover:scale-125"
                    }`}
                    title={`${pin.timestampFormatted} · ${pinTitle}`}
                  />
                );
              })}
            </div>

            {/* Contrôles de transport & actions rapides */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isPlaying
                      ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause & Capturer (Espace)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Lecture (Espace)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => seekToSeconds(currentTime - 5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  title="Reculer de 5 secondes (Flèche gauche)"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>-5s</span>
                </button>

                <button
                  type="button"
                  onClick={() => seekToSeconds(currentTime + 5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  title="Avancer de 5 secondes (Flèche droite)"
                >
                  <span>+5s</span>
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted;
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
                  title={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>

                <span className="text-xs font-mono text-slate-300 pl-1">
                  <strong className="text-cyan-300">
                    {formatInsightTimestamp(currentTime)}
                  </strong>{" "}
                  / {formatInsightTimestamp(effectiveDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current && !videoRef.current.paused) {
                      videoRef.current.pause();
                    } else {
                      captureExactFrameFromVideo();
                      setHudVisible(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-xs font-bold text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ouvrir le HUD à {formatInsightTimestamp(currentTime)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            4. PANNEAU LATÉRAL SYNCHRONISÉ : RÉPONSES DE L'IA & LISTE DES PINS
            ==================================================================== */}
        <aside className="bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col min-h-0 overflow-hidden">
          {/* En-tête du panneau latéral */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                Analyses IA & Pins ({insights.length})
              </h2>
            </div>
            {lastApiSource && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono text-cyan-300">
                {lastApiSource === "gemini"
                  ? "Gemini Multimodal"
                  : "Synthèse Locale"}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Carte détaillée de l'analyse sélectionnée */}
            {activeInsight ? (
              <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/35 p-3.5 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        seekToSeconds(activeInsight.timestampSeconds, true)
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold inline-flex items-center gap-1 cursor-pointer"
                      style={{
                        backgroundColor:
                          PIN_CATEGORY_META[
                            activeInsight.category || "technique"
                          ].bgSoft,
                        color:
                          PIN_CATEGORY_META[
                            activeInsight.category || "technique"
                          ].color,
                        border: `1px solid ${
                          PIN_CATEGORY_META[
                            activeInsight.category || "technique"
                          ].border
                        }`,
                      }}
                      title="Cliquer pour sauter à ce timestamp dans la vidéo"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{activeInsight.timestampFormatted}</span>
                    </button>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {
                        PIN_CATEGORY_META[activeInsight.category || "technique"]
                          .label
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePin(activeInsight.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                    title="Supprimer ce marqueur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Aperçu de la frame capturée associée à ce timestamp */}
                {activeInsight.frameDataUrl && (
                  <div
                    onClick={() =>
                      seekToSeconds(activeInsight.timestampSeconds, true)
                    }
                    className="relative rounded-xl overflow-hidden border border-slate-800 bg-black cursor-pointer group"
                  >
                    <img
                      src={activeInsight.frameDataUrl}
                      alt={`Frame à ${activeInsight.timestampFormatted}`}
                      className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] font-mono text-cyan-300">
                      Revoir à {activeInsight.timestampFormatted}
                    </div>
                  </div>
                )}

                {/* Question posée par l'utilisateur */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Question / Consigne
                  </div>
                  <p className="text-slate-200 font-medium">
                    « {activeInsight.userPrompt} »
                  </p>
                </div>

                {/* Réponse structurée de Gemini */}
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {activeInsight.headline || activeInsight.aiHeadline}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeInsight.answer || activeInsight.aiAnalysis}
                  </p>
                </div>

                {/* Observations visuelles clés */}
                {(() => {
                  const takeaways = Array.isArray(
                    activeInsight.visualObservations
                  )
                    ? activeInsight.visualObservations
                    : Array.isArray(activeInsight.keyTakeaways)
                    ? activeInsight.keyTakeaways
                    : [];
                  if (takeaways.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Points observés sur la frame
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-slate-300">
                        {takeaways.map((obs, idx) => (
                          <li key={idx}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Relances suggérées en 1 clic */}
                {(() => {
                  const followUps = Array.isArray(
                    activeInsight.suggestedFollowUps
                  )
                    ? activeInsight.suggestedFollowUps
                    : Array.isArray(activeInsight.followUpSuggestions)
                    ? activeInsight.followUpSuggestions
                    : [];
                  if (followUps.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Approfondir ce moment
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {followUps.map((followUp) => (
                          <button
                            key={followUp}
                            type="button"
                            disabled={isAnalyzing}
                            onClick={() => {
                              seekToSeconds(
                                activeInsight.timestampSeconds,
                                true
                              );
                              setPromptText(followUp);
                              void handleSendToGemini(followUp);
                            }}
                            className="text-left px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 cursor-pointer transition-colors"
                          >
                            ↳ {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-5 text-center space-y-2">
                <Camera className="w-6 h-6 text-cyan-400 mx-auto" />
                <div className="text-xs font-bold text-white">
                  Aucun marqueur temporel pour l&apos;instant
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Mettez la vidéo en pause (touche{" "}
                  <strong className="text-slate-200">Espace</strong> ou clic sur
                  la vidéo) pour capturer la frame exacte et interroger Gemini.
                </p>
              </div>
            )}

            {/* Liste chronologique de tous les Pins de la vidéo */}
            {Array.isArray(insights) && insights.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Frise des marqueurs ({insights.length})
                </div>
                <div className="space-y-1.5">
                  {insights.map((item) => {
                    const catMeta =
                      PIN_CATEGORY_META[item.category || "technique"] ||
                      PIN_CATEGORY_META.technique;
                    const isSelected = item.id === activeInsight?.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveInsightId(item.id);
                          seekToSeconds(item.timestampSeconds, true);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-900 border-cyan-400/50"
                            : "bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80"
                        }`}
                      >
                        {item.frameDataUrl && (
                          <img
                            src={item.frameDataUrl}
                            alt=""
                            className="w-14 h-9 rounded object-cover bg-black border border-slate-700 shrink-0 mt-0.5"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                              style={{
                                backgroundColor: catMeta.bgSoft,
                                color: catMeta.color,
                              }}
                            >
                              {item.timestampFormatted}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {item.headline || item.aiHeadline}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.userPrompt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
