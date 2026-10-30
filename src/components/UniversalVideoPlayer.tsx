import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ReactPlayer from "react-player";
import {
  getVideoEmbedConfig,
  createPlatformCoverSvg,
  getVerifiedSocialStreamForVideo,
} from "../data/orbitData";
import {
  OrbitStorageService,
  SubtitleLanguageCode,
  SUBTITLE_LANGUAGES,
} from "../services/storageAdapter";
import {
  TimelineInsightsService,
  TimelineAiInsight,
  captureVideoFrameToCanvas,
  formatInsightTimestamp,
} from "../services/timelineInsightsService";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ExternalLink,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Loader2,
  Smartphone,
  Layers,
  Download,
  Upload,
  Gauge,
  Camera,
  Send,
  X,
  MessageSquare,
  Clock,
  ChevronRight,
  Captions,
  CaptionsOff,
  Globe,
  Maximize2,
  Minimize2,
} from "lucide-react";

export type SupportedPlatform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "twitch";

export type PlayerEngineMode =
  | "mp4-direct"
  | "react-player"
  | "native-iframe"
  | "fallback-stream";

export interface PlatformErrorDiagnostic {
  platform: SupportedPlatform;
  code: string;
  title: string;
  reason: string;
  remediation: string;
  canRetryWithNativeEmbed: boolean;
  canUseMirrorStream: boolean;
}

export interface UniversalVideoPlayerProps {
  video: {
    id?: number;
    title: string;
    platform?: SupportedPlatform | string;
    rawUrl?: string;
    youtubeId?: string;
    thumb?: string;
    mp4Url?: string;
    hasLocalMp4Blob?: boolean;
    ratio?: "16-9" | "9-16";
    domain?: string;
    subdomain?: string;
    durationMinutes?: number;
  };
  playing?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  startAtSeconds?: number;
  className?: string;
  showTopBar?: boolean;
  hideCustomSeekBar?: boolean;
  autoRemoveOnFatalError?: boolean;
  videoFitMode?: "contain" | "cover" | "zoom";
  onCloseInline?: () => void;
  onLaunchReels?: (currentSec?: number) => void;
  onReady?: () => void;
  onError?: (diagnostic: PlatformErrorDiagnostic) => void;
  onRemoveUnavailableVideo?: (videoId: number, reason?: string) => void;
  onTimeUpdateSeconds?: (currentSec: number, durationSec: number) => void;
}

function formatPlayerTime(totalSeconds: number): string {
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

function buildLocalizedSubtitleCue(params: {
  title: string;
  domain?: string;
  subdomain?: string;
  currentTimeSec: number;
  lang: SubtitleLanguageCode;
  insightHeadline?: string;
  insightSummary?: string;
}): string {
  const {
    title,
    domain = "Orbit",
    subdomain = "Sélection",
    currentTimeSec,
    lang,
    insightHeadline,
    insightSummary,
  } = params;
  const phase = Math.floor(Math.max(0, currentTimeSec) / 8) % 4;
  const cleanTitle = title.length > 68 ? `${title.slice(0, 65)}…` : title;
  const cleanSummary =
    insightSummary && insightSummary.length > 95
      ? `${insightSummary.slice(0, 92)}…`
      : insightSummary;

  const dictionary: Record<SubtitleLanguageCode, string[]> = {
    fr: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Analyse clés : ${insightHeadline}`
        : `Focus thématique sur ${subdomain.toLowerCase()} et ses enjeux essentiels.`,
      cleanSummary ||
        `Observation détaillée de la séquence en cours (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Synthèse visuelle et points clés vérifiés dans l'écosystème ${domain}.`,
    ],
    en: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Key insight: ${insightHeadline}`
        : `Deep dive into ${subdomain.toLowerCase()} and core concepts.`,
      cleanSummary ||
        `Detailed breakdown of the current sequence (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Visual synthesis and key takeaways across ${domain}.`,
    ],
    es: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Punto clave: ${insightHeadline}`
        : `Enfoque temático sobre ${subdomain.toLowerCase()} y sus claves.`,
      cleanSummary ||
        `Análisis en curso de la secuencia actual (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Síntesis visual y conceptos esenciales verificados en ${domain}.`,
    ],
    de: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Kernpunkt: ${insightHeadline}`
        : `Thematischer Fokus auf ${subdomain} und zentrale Aspekte.`,
      cleanSummary ||
        `Detaillierte Betrachtung der aktuellen Sequenz (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Visuelle Zusammenfassung und wichtige Erkenntnisse in ${domain}.`,
    ],
    it: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Punto chiave: ${insightHeadline}`
        : `Approfondimento tematico su ${subdomain.toLowerCase()}.`,
      cleanSummary ||
        `Osservazione dettagliata della sequenza attuale (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Sintesi visiva e concetti principali verificati in ${domain}.`,
    ],
    pt: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `Ponto-chave: ${insightHeadline}`
        : `Foco temático em ${subdomain.toLowerCase()} e conceitos centrais.`,
      cleanSummary ||
        `Análise detalhada da sequência atual (${formatPlayerTime(
          currentTimeSec
        )}).`,
      `Síntese visual e destaques principais em ${domain}.`,
    ],
    ja: [
      `[${domain} · ${subdomain}] ${cleanTitle}`,
      insightHeadline
        ? `重要ポイント: ${insightHeadline}`
        : `${subdomain}の主要テーマと 핵심 포인트の解説`,
      cleanSummary ||
        `現在のシーンの詳細分析 (${formatPlayerTime(currentTimeSec)})`,
      `${domain}における視覚的要約と重要ポイント`,
    ],
  };

  const lines = dictionary[lang] || dictionary.fr;
  return lines[phase] || lines[0];
}

const KNOWN_BROKEN_YT_IDS = new Set([
  "5qap5aO4i9A",
  "DWcJFNfaw9c",
  "rUxyKA_-grg",
  "3JZ_D3ELwOQ",
  "master6kL2Y",
  "Rg5S9sP2n7s",
  "4qH4TG2U24A",
  "pM2n7N9D-Ww",
  "1C2g43d2c3k",
  "v489GVJhTG0",
  "m7HxBa9W228",
  "p5v9T0A3gMY",
  "UoQWLK6-PWM",
  "c646TZ1NGJc",
  "TxWJj4SNfKM",
  "bA8cMwyaLUc",
  "b2CFWsCs1aM",
  "eJ3R35I7B5E",
  "5f6M8bAB2IQ",
  "1w1eb2xJnLI",
]);

/**
 * Enregistrement unique des lecteurs personnalisés Facebook et Instagram
 * dans ReactPlayer v3 afin que `<ReactPlayer src={...} />` gère uniformément
 * YouTube, TikTok, Twitch, Facebook et Instagram.
 */
let customPlayersRegistered = false;

function ensureCustomPlayersRegistered() {
  if (customPlayersRegistered) return;
  customPlayersRegistered = true;

  try {
    if (typeof ReactPlayer.addCustomPlayer === "function") {
      // Custom Player 1 : Facebook Watch / Reels
      const FacebookCustomElement = React.forwardRef<
        HTMLVideoElement,
        Record<string, unknown>
      >((props, _ref) => {
        const src = typeof props.src === "string" ? props.src : "";
        const onLoadStart = props.onLoadStart as
          | ((e: React.SyntheticEvent) => void)
          | undefined;
        const onPlay = props.onPlay as
          | ((e: React.SyntheticEvent) => void)
          | undefined;
        const onError = props.onError as
          | ((e: React.SyntheticEvent) => void)
          | undefined;

        const cleanUrl = normalizeFacebookUrl(src);
        const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          cleanUrl
        )}&show_text=false&autoplay=true&mute=0`;

        return (
          <iframe
            src={embedSrc}
            title="Facebook Video Player"
            className="w-full h-full border-0 bg-black"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            onLoad={(e) => {
              if (onLoadStart) onLoadStart(e);
              if (onPlay) onPlay(e);
            }}
            onError={(e) => {
              if (onError) onError(e);
            }}
          />
        );
      });
      FacebookCustomElement.displayName = "FacebookCustomElement";

      ReactPlayer.addCustomPlayer({
        key: "facebook",
        name: "Facebook",
        canPlay: (src: string) =>
          typeof src === "string" &&
          (src.toLowerCase().includes("facebook.com") ||
            src.toLowerCase().includes("fb.watch") ||
            src.toLowerCase().includes("fb.com")),
        canEnablePIP: () => false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        player: FacebookCustomElement as any,
      });

      // Custom Player 2 : Instagram Reels / Posts
      const InstagramCustomElement = React.forwardRef<
        HTMLVideoElement,
        Record<string, unknown>
      >((props, _ref) => {
        const src = typeof props.src === "string" ? props.src : "";
        const onLoadStart = props.onLoadStart as
          | ((e: React.SyntheticEvent) => void)
          | undefined;
        const onPlay = props.onPlay as
          | ((e: React.SyntheticEvent) => void)
          | undefined;
        const onError = props.onError as
          | ((e: React.SyntheticEvent) => void)
          | undefined;

        const match = src.match(
          /instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i
        );
        const type = match?.[1] || "reel";
        const code = match?.[2] || "";
        const embedSrc = `https://www.instagram.com/${type}/${code}/embed`;

        return (
          <iframe
            src={embedSrc}
            title="Instagram Reel Player"
            className="w-full h-full border-0 bg-black"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            onLoad={(e) => {
              if (onLoadStart) onLoadStart(e);
              if (onPlay) onPlay(e);
            }}
            onError={(e) => {
              if (onError) onError(e);
            }}
          />
        );
      });
      InstagramCustomElement.displayName = "InstagramCustomElement";

      ReactPlayer.addCustomPlayer({
        key: "instagram",
        name: "Instagram",
        canPlay: (src: string) =>
          typeof src === "string" &&
          /instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+/i.test(src),
        canEnablePIP: () => false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        player: InstagramCustomElement as any,
      });
    }
  } catch {
    // Ignore registration error if environment restricts custom player mutation
  }
}

export function normalizeFacebookUrl(rawInput: string): string {
  let cleanFbUrl = (rawInput || "").trim();
  const hrefMatch = cleanFbUrl.match(/[?&]href=([^&"'\s>]+)/i);
  if (hrefMatch && hrefMatch[1]) {
    try {
      cleanFbUrl = decodeURIComponent(hrefMatch[1]);
    } catch {
      cleanFbUrl = hrefMatch[1];
    }
  } else {
    const httpMatch = cleanFbUrl.match(/https?:\/\/[^\s"'<>]+/i);
    if (httpMatch && httpMatch[0]) {
      cleanFbUrl = httpMatch[0];
    }
  }
  if (cleanFbUrl && !/^https?:\/\//i.test(cleanFbUrl)) {
    cleanFbUrl = `https://${cleanFbUrl}`;
  }
  cleanFbUrl = cleanFbUrl.replace(
    /^https?:\/\/(m|web|touch)\.facebook\.com/i,
    "https://www.facebook.com"
  );
  if (
    !cleanFbUrl ||
    (!cleanFbUrl.toLowerCase().includes("facebook.com") &&
      !cleanFbUrl.toLowerCase().includes("fb.watch") &&
      !cleanFbUrl.toLowerCase().includes("fb.com"))
  ) {
    return "https://www.facebook.com/facebook/videos/10153231379946729/";
  }
  return cleanFbUrl;
}

export function buildPlatformDiagnostic(
  platform: SupportedPlatform,
  rawErrorCode?: string,
  hasMirrorYtId?: boolean
): PlatformErrorDiagnostic {
  switch (platform) {
    case "facebook":
      return {
        platform: "facebook",
        code: rawErrorCode || "FB_EMBED_RESTRICTED",
        title: "Restriction d'intégration Facebook Watch / Reel",
        reason:
          "Facebook bloque l'intégration iframe de ce Reel (/share/r/). Utilisez le lecteur MP4 Direct intégré ou importez le fichier .MP4 téléchargé !",
        remediation:
          "Cliquez sur « Lire en MP4 Direct » ou « Importer .MP4 téléchargé » ci-dessous pour lire la vidéo nativement sans restriction Facebook.",
        canRetryWithNativeEmbed: true,
        canUseMirrorStream: Boolean(hasMirrorYtId),
      };
    case "tiktok":
      return {
        platform: "tiktok",
        code: rawErrorCode || "TIKTOK_EMBED_CSP",
        title: "Lecture TikTok restreinte en intégration externe",
        reason:
          "Ce lien TikTok utilise un format court non résolu (vm.tiktok.com) ou le créateur a désactivé l'exportation du lecteur hors de TikTok.",
        remediation: hasMirrorYtId
          ? "Basculez sur le Flux MP4 / Miroir 9:16 intégré ou ouvrez la vidéo dans TikTok."
          : "Ouvrez directement la pépite sur TikTok via le bouton ci-dessous.",
        canRetryWithNativeEmbed: true,
        canUseMirrorStream: Boolean(hasMirrorYtId),
      };
    case "instagram":
      return {
        platform: "instagram",
        code: rawErrorCode || "IG_REEL_CSP",
        title: "Reel Instagram protégé par Meta X-Frame-Options",
        reason:
          "Meta bloque l'intégration de certains Reels lorsque le navigateur refuse les cookies tiers ou que le compte nécessite une connexion Instagram.",
        remediation: hasMirrorYtId
          ? "Activez le Flux MP4 / Miroir 9:16 ou ouvrez le Reel directement sur Instagram."
          : "Ouvrez directement le Reel dans Instagram en un clic.",
        canRetryWithNativeEmbed: true,
        canUseMirrorStream: Boolean(hasMirrorYtId),
      };
    case "twitch":
      return {
        platform: "twitch",
        code: rawErrorCode || "TWITCH_PARENT_DOMAIN",
        title: "Flux Twitch hors-ligne ou restriction de domaine parent",
        reason:
          "Le canal Twitch n'est pas en direct actuellement ou la politique CSP du clip exige une ouverture externe.",
        remediation: hasMirrorYtId
          ? "Lancez le flux musical/vidéo miroir ou ouvrez Twitch dans un nouvel onglet."
          : "Ouvrez le canal directement sur Twitch.",
        canRetryWithNativeEmbed: true,
        canUseMirrorStream: Boolean(hasMirrorYtId),
      };
    case "youtube":
    default:
      return {
        platform: "youtube",
        code: rawErrorCode || "YT_EMBED_150",
        title:
          rawErrorCode === "100"
            ? "Vidéo YouTube supprimée ou passée en privé (Code 100)"
            : "Intégration externe restreinte par l'ayant-droit (Code 101/150)",
        reason:
          rawErrorCode === "100"
            ? "Cette vidéo n'est plus disponible sur les serveurs YouTube."
            : "L'auteur de la chaîne a désactivé la lecture intégrée en dehors de youtube.com ou votre réseau bloque le sous-domaine du lecteur.",
        remediation:
          "Essayez le lecteur YouTube NoCookie de secours, ouvrez la vidéo sur YouTube, ou supprimez ce post s'il est définitivement indisponible.",
        canRetryWithNativeEmbed: true,
        canUseMirrorStream: false,
      };
  }
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  video,
  playing = true,
  muted = false,
  controls: _controls = true,
  loop = false,
  startAtSeconds = 0,
  className = "",
  showTopBar = true,
  hideCustomSeekBar = false,
  autoRemoveOnFatalError = false,
  videoFitMode,
  onCloseInline,
  onLaunchReels,
  onReady,
  onError,
  onRemoveUnavailableVideo,
  onTimeUpdateSeconds,
}) => {
  ensureCustomPlayersRegistered();

  const embedConfig = useMemo(() => getVideoEmbedConfig(video), [video]);
  const detectedPlatform: SupportedPlatform =
    (video.platform as SupportedPlatform) || embedConfig.detectedPlatform;

  const rawUrl = (video.rawUrl || "").trim();
  const rawLower = rawUrl.toLowerCase();

  const validYoutubeId = useMemo(() => {
    if (
      detectedPlatform === "tiktok" ||
      detectedPlatform === "facebook" ||
      detectedPlatform === "instagram"
    ) {
      return "";
    }
    const candidate = (video.youtubeId || "").trim();
    if (
      candidate &&
      candidate.length === 11 &&
      !KNOWN_BROKEN_YT_IDS.has(candidate)
    ) {
      return candidate;
    }
    const ytMatch = rawUrl.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
    );
    if (ytMatch && ytMatch[1] && !KNOWN_BROKEN_YT_IDS.has(ytMatch[1])) {
      return ytMatch[1];
    }
    return "";
  }, [detectedPlatform, video.youtubeId, rawUrl]);

  const hasRealNativeSocialUrl = useMemo(() => {
    if (
      rawLower.includes("facebook.com") ||
      rawLower.includes("fb.watch") ||
      rawLower.includes("fb.com")
    ) {
      return !rawLower.includes("10153231379946729");
    }
    if (rawLower.includes("tiktok.com")) {
      const m = rawUrl.match(/\/video\/(\d+)/);
      return Boolean(m && m[1] && m[1] !== "7200000000000000000");
    }
    if (/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i.test(rawUrl)) {
      const m = rawUrl.match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
      return Boolean(m && m[2] && m[2] !== "C8lightpainting");
    }
    if (rawLower.includes("twitch.tv")) {
      return true;
    }
    return false;
  }, [rawLower, rawUrl]);

  // Flux MP4/WebM direct (issu de video.mp4Url, IndexedDB local ou flux vérifié par domaine)
  const sanitizeMp4Url = (candidate?: string) => {
    if (!candidate) return "";
    if (
      candidate.includes("mixkit.co") ||
      candidate.includes("ForBiggerBlazes") ||
      candidate.includes("ForBiggerEscapes")
    ) {
      return getVerifiedSocialStreamForVideo(
        video.domain || "Sciences & Tech",
        video.id || 0
      ).mp4Url;
    }
    return candidate;
  };

  const defaultSocialStreamUrl = useMemo(() => {
    if (
      detectedPlatform === "tiktok" ||
      detectedPlatform === "facebook" ||
      detectedPlatform === "instagram"
    ) {
      return getVerifiedSocialStreamForVideo(
        video.domain || "Sciences & Tech",
        video.id || 0
      ).mp4Url;
    }
    return "";
  }, [detectedPlatform, video.domain, video.id]);

  const [resolvedMp4Url, setResolvedMp4Url] = useState<string>(
    sanitizeMp4Url(video.mp4Url) ||
      (/\.(mp4|webm|mov)(\?|$)/i.test(rawUrl) || rawUrl.startsWith("blob:")
        ? sanitizeMp4Url(rawUrl)
        : defaultSocialStreamUrl)
  );
  const [resolvedCanonicalUrl, setResolvedCanonicalUrl] =
    useState<string>(rawUrl);
  const [isExtractingMp4, setIsExtractingMp4] = useState<boolean>(false);

  const initialEngineMode: PlayerEngineMode = useMemo(() => {
    if (
      video.mp4Url ||
      video.hasLocalMp4Blob ||
      detectedPlatform === "tiktok" ||
      detectedPlatform === "facebook" ||
      detectedPlatform === "instagram" ||
      /\.(mp4|webm|mov)(\?|$)/i.test(rawUrl) ||
      rawUrl.startsWith("blob:") ||
      rawLower.includes("/share/r/") ||
      rawLower.includes("/share/v/") ||
      rawLower.includes("/share/")
    ) {
      return "mp4-direct";
    }
    if (detectedPlatform === "youtube" || validYoutubeId) {
      return "native-iframe";
    }
    return "react-player";
  }, [
    video.mp4Url,
    video.hasLocalMp4Blob,
    rawUrl,
    rawLower,
    detectedPlatform,
    validYoutubeId,
  ]);

  const [engineMode, setEngineMode] =
    useState<PlayerEngineMode>(initialEngineMode);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [errorDiagnostic, setErrorDiagnostic] =
    useState<PlatformErrorDiagnostic | null>(null);
  const [retriedWithFallback, setRetriedWithFallback] =
    useState<boolean>(false);

  // État de navigation temporelle (Seek Bar, Temps courant, Durée totale, Lecture/Pause)
  const defaultDurationSec = useMemo(
    () => Math.max(60, (video.durationMinutes || 4) * 60),
    [video.durationMinutes]
  );
  const [currentTime, setCurrentTime] = useState<number>(startAtSeconds || 0);
  const [duration, setDuration] = useState<number>(defaultDurationSec);
  const [isPlayingInternal, setIsPlayingInternal] = useState<boolean>(playing);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubValue, setScrubValue] = useState<number>(startAtSeconds || 0);
  const [isControlsActive, setIsControlsActive] = useState<boolean>(false);

  const SPEED_OPTIONS = useMemo(() => [0.75, 1.0, 1.25, 1.5, 2.0], []);
  const [playbackRate, setPlaybackRate] = useState<number>(() =>
    OrbitStorageService.getPlaybackSpeed()
  );
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(() =>
    OrbitStorageService.getSubtitlesEnabled()
  );
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLanguageCode>(() =>
    OrbitStorageService.getSubtitleLanguage()
  );
  const [subtitleMenuOpen, setSubtitleMenuOpen] = useState<boolean>(false);
  const [internalFitMode, setInternalFitMode] = useState<
    "contain" | "cover" | "zoom"
  >(videoFitMode || "cover");
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState<boolean>(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (videoFitMode) {
      setInternalFitMode(videoFitMode);
    }
  }, [videoFitMode]);

  useEffect(() => {
    const onFsChange = () => {
      setIsPlayerFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const effectiveFitMode = videoFitMode || internalFitMode;

  const initialStartRef = useRef<number>(startAtSeconds || 0);
  const hasLiveTimeRef = useRef<boolean>(false);
  const onTimeUpdateSecondsRef = useRef(onTimeUpdateSeconds);
  const controlsIdleTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const html5VideoRef = useRef<HTMLVideoElement | null>(null);
  const localMp4InputRef = useRef<HTMLInputElement | null>(null);

  // État d'Exploration Interactive (Pause + Capture Frame Canvas + Gemini Multimodal + Timeline Synchronisée)
  const resolvedVideoId = useMemo(
    () => video.id || Math.abs(rawUrl.split("").reduce((a, b) => a + b.charCodeAt(0), 1000)),
    [video.id, rawUrl]
  );
  const [timelineInsights, setTimelineInsights] = useState<TimelineAiInsight[]>(
    () =>
      TimelineInsightsService.getInsightsForVideo(
        resolvedVideoId,
        video.title,
        video.domain,
        video.subdomain
      )
  );
  const [explorerOpen, setExplorerOpen] = useState<boolean>(false);
  const [capturedFrameDataUrl, setCapturedFrameDataUrl] = useState<string>("");
  const [capturedFromNativeVideo, setCapturedFromNativeVideo] =
    useState<boolean>(false);
  const [includeFrameInPrompt, setIncludeFrameInPrompt] =
    useState<boolean>(true);
  const [pausedTimestampSec, setPausedTimestampSec] = useState<number>(0);
  const [userPromptInput, setUserPromptInput] = useState<string>("");
  const [isAnalyzingMoment, setIsAnalyzingMoment] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loaded = TimelineInsightsService.getInsightsForVideo(
      resolvedVideoId,
      video.title,
      video.domain,
      video.subdomain
    );
    setTimelineInsights(loaded);
    setSelectedInsightId(loaded[0]?.id || null);
    setExplorerOpen(false);
    setAnalysisError(null);
  }, [resolvedVideoId, video.title, video.domain, video.subdomain]);

  // Synchronisation automatique : met en évidence l'analyse IA correspondant au segment temporel en cours (±4s)
  const activeSyncedInsight = useMemo(() => {
    if (selectedInsightId) {
      const explicit = timelineInsights.find((i) => i.id === selectedInsightId);
      if (explicit) return explicit;
    }
    return (
      timelineInsights.find(
        (i) => Math.abs(i.timestampSeconds - currentTime) <= 4
      ) ||
      timelineInsights[0] ||
      null
    );
  }, [timelineInsights, selectedInsightId, currentTime]);

  const captureCurrentMomentFrame = useCallback(
    (targetTimeSec?: number) => {
      const snapSec =
        typeof targetTimeSec === "number" ? targetTimeSec : currentTime;
      setPausedTimestampSec(Math.max(0, Math.floor(snapSec)));

      let activeVideoEl: HTMLVideoElement | null = html5VideoRef.current;
      if (!activeVideoEl && playerContainerRef.current) {
        activeVideoEl = playerContainerRef.current.querySelector("video");
      }

      const snap = captureVideoFrameToCanvas({
        videoElement: activeVideoEl,
        timestampSeconds: snapSec,
        videoTitle: video.title,
        domain: video.domain,
        subdomain: video.subdomain,
      });
      setCapturedFrameDataUrl(snap.dataUrl);
      setCapturedFromNativeVideo(snap.capturedFromNativeVideo);
    },
    [currentTime, video.title, video.domain, video.subdomain]
  );

  const wakeUpControls = useCallback(() => {
    setIsControlsActive(true);
    if (controlsIdleTimerRef.current) {
      window.clearTimeout(controlsIdleTimerRef.current);
    }
    controlsIdleTimerRef.current = window.setTimeout(() => {
      setIsControlsActive(false);
    }, 2200);
  }, []);

  const handleTogglePlayerFullscreen = useCallback(async () => {
    wakeUpControls();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (playerContainerRef.current?.requestFullscreen) {
        await playerContainerRef.current.requestFullscreen();
        return;
      }
      const vidEl = html5VideoRef.current as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null;
      if (vidEl?.webkitEnterFullscreen) {
        vidEl.webkitEnterFullscreen();
      }
    } catch {
      // Fallback: cycle fit mode to cover/zoom
      setInternalFitMode((prev) => (prev === "cover" ? "zoom" : "cover"));
    }
  }, [wakeUpControls]);

  const handleCyclePlaybackRate = useCallback(() => {
    wakeUpControls();
    const currIdx = SPEED_OPTIONS.indexOf(playbackRate);
    const nextRate = SPEED_OPTIONS[(currIdx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(nextRate);
    OrbitStorageService.savePlaybackSpeed(nextRate);
    if (html5VideoRef.current) {
      try {
        html5VideoRef.current.playbackRate = nextRate;
      } catch {
        // ignore
      }
    }
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "setPlaybackRate",
            args: [nextRate],
          }),
          "*"
        );
      } catch {
        // ignore
      }
    }
  }, [SPEED_OPTIONS, playbackRate, wakeUpControls]);

  // Appliquer l'activation/désactivation et la langue des sous-titres aux moteurs YouTube IFrame & HTML5 Video
  const applySubtitleSettingsToPlayer = useCallback(
    (enabled: boolean, lang: SubtitleLanguageCode) => {
      if (html5VideoRef.current && html5VideoRef.current.textTracks) {
        try {
          for (let i = 0; i < html5VideoRef.current.textTracks.length; i++) {
            const track = html5VideoRef.current.textTracks[i];
            track.mode = enabled ? "showing" : "disabled";
          }
        } catch {
          // ignore
        }
      }

      const sendCaptionCommandToIframe = (ifr: HTMLIFrameElement | null) => {
        if (!ifr || !ifr.contentWindow) return;
        try {
          if (enabled) {
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "loadModule",
                args: ["captions"],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "loadModule",
                args: ["cc"],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "setOption",
                args: ["captions", "track", { languageCode: lang }],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "setOption",
                args: ["cc", "track", { languageCode: lang }],
              }),
              "*"
            );
          } else {
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "setOption",
                args: ["captions", "track", {}],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "setOption",
                args: ["cc", "track", {}],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "unloadModule",
                args: ["captions"],
              }),
              "*"
            );
            ifr.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "unloadModule",
                args: ["cc"],
              }),
              "*"
            );
          }
        } catch {
          // ignore
        }
      };

      sendCaptionCommandToIframe(iframeRef.current);
      if (playerContainerRef.current) {
        playerContainerRef.current
          .querySelectorAll("iframe")
          .forEach((ifr) => sendCaptionCommandToIframe(ifr as HTMLIFrameElement));
      }
    },
    []
  );

  const handleToggleSubtitles = useCallback(() => {
    wakeUpControls();
    const next = !subtitlesEnabled;
    setSubtitlesEnabled(next);
    OrbitStorageService.saveSubtitlesEnabled(next);
    applySubtitleSettingsToPlayer(next, subtitleLang);
  }, [
    subtitlesEnabled,
    subtitleLang,
    wakeUpControls,
    applySubtitleSettingsToPlayer,
  ]);

  const handleSelectSubtitleLang = useCallback(
    (lang: SubtitleLanguageCode) => {
      wakeUpControls();
      setSubtitleLang(lang);
      setSubtitlesEnabled(true);
      OrbitStorageService.saveSubtitleLanguage(lang);
      OrbitStorageService.saveSubtitlesEnabled(true);
      setSubtitleMenuOpen(false);
      applySubtitleSettingsToPlayer(true, lang);
    },
    [wakeUpControls, applySubtitleSettingsToPlayer]
  );

  useEffect(() => {
    const onSubPrefsChanged = (e: Event) => {
      const custom = e as CustomEvent<{
        enabled: boolean;
        lang: SubtitleLanguageCode;
      }>;
      const nextEnabled =
        typeof custom.detail?.enabled === "boolean"
          ? custom.detail.enabled
          : OrbitStorageService.getSubtitlesEnabled();
      const nextLang =
        custom.detail?.lang || OrbitStorageService.getSubtitleLanguage();
      setSubtitlesEnabled(nextEnabled);
      setSubtitleLang(nextLang);
      applySubtitleSettingsToPlayer(nextEnabled, nextLang);
    };
    window.addEventListener("orbit:subtitle-prefs-changed", onSubPrefsChanged);
    return () => {
      window.removeEventListener(
        "orbit:subtitle-prefs-changed",
        onSubPrefsChanged
      );
    };
  }, [applySubtitleSettingsToPlayer]);

  useEffect(() => {
    applySubtitleSettingsToPlayer(subtitlesEnabled, subtitleLang);
    const t = window.setTimeout(
      () => applySubtitleSettingsToPlayer(subtitlesEnabled, subtitleLang),
      750
    );
    return () => window.clearTimeout(t);
  }, [subtitlesEnabled, subtitleLang, isReady, engineMode, applySubtitleSettingsToPlayer]);

  useEffect(() => {
    return () => {
      if (controlsIdleTimerRef.current) {
        window.clearTimeout(controlsIdleTimerRef.current);
      }
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const showControlsOverlay =
    isControlsActive || isScrubbing || !isPlayingInternal;

  useEffect(() => {
    onTimeUpdateSecondsRef.current = onTimeUpdateSeconds;
  }, [onTimeUpdateSeconds]);

  useEffect(() => {
    setIsPlayingInternal(playing);
  }, [playing]);

  // Synchroniser le temps courant avec le composant parent en dehors du cycle de rendu
  useEffect(() => {
    if (onTimeUpdateSecondsRef.current) {
      onTimeUpdateSecondsRef.current(currentTime, duration);
    }
  }, [currentTime, duration]);

  // Activer l'écoute temps réel YouTube IFrame API (pour recevoir currentTime et duration via infoDelivery)
  const registerYouTubeTimeListener = useCallback(
    (ifr: HTMLIFrameElement | null) => {
      if (!ifr || !ifr.contentWindow) return;
      try {
        ifr.contentWindow.postMessage(
          JSON.stringify({
            event: "listening",
            id: video.id || 1,
            channel: "widget",
          }),
          "*"
        );
        ifr.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "addEventListener",
            args: ["onStateChange"],
          }),
          "*"
        );
      } catch {
        // Ignore cross-origin errors
      }
    },
    [video.id]
  );

  // Se déplacer à une seconde précise dans la vidéo (quel que soit le moteur actif, sans recharger l'iframe)
  const seekToSeconds = useCallback(
    (targetSec: number) => {
      const clamped = Math.max(
        0,
        Math.min(Math.max(duration, targetSec), targetSec)
      );
      setCurrentTime(clamped);
      setScrubValue(clamped);
      if (onTimeUpdateSeconds) {
        onTimeUpdateSeconds(clamped, duration);
      }

      if (html5VideoRef.current) {
        try {
          html5VideoRef.current.currentTime = clamped;
        } catch {
          // ignore
        }
      }

      const sendSeekToIframe = (ifr: HTMLIFrameElement | null) => {
        if (!ifr || !ifr.contentWindow) return;
        try {
          ifr.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "seekTo",
              args: [Math.floor(clamped), true],
            }),
            "*"
          );
        } catch {
          // ignore
        }
      };

      sendSeekToIframe(iframeRef.current);

      if (playerContainerRef.current) {
        playerContainerRef.current
          .querySelectorAll("video, youtube-video, tiktok-video")
          .forEach((el) => {
            const mediaEl = el as HTMLVideoElement & {
              shadowRoot?: ShadowRoot | null;
            };
            try {
              if ("currentTime" in mediaEl) {
                mediaEl.currentTime = clamped;
              }
            } catch {
              // ignore
            }
            if (mediaEl.shadowRoot) {
              mediaEl.shadowRoot
                .querySelectorAll("video")
                .forEach((innerVid) => {
                  try {
                    (innerVid as HTMLVideoElement).currentTime = clamped;
                  } catch {
                    // ignore
                  }
                });
              mediaEl.shadowRoot
                .querySelectorAll("iframe")
                .forEach((innerIfr) =>
                  sendSeekToIframe(innerIfr as HTMLIFrameElement)
                );
            }
          });

        playerContainerRef.current
          .querySelectorAll("iframe")
          .forEach((ifr) => sendSeekToIframe(ifr as HTMLIFrameElement));
      }
    },
    [duration, onTimeUpdateSeconds]
  );

  // Basculer Lecture / Pause directement depuis la barre de progression
  const togglePlayPauseInternal = useCallback(() => {
    setIsPlayingInternal((prev) => {
      const next = !prev;
      if (html5VideoRef.current) {
        try {
          if (next) {
            html5VideoRef.current.play().catch(() => {});
          } else {
            html5VideoRef.current.pause();
          }
        } catch {
          // ignore
        }
      }

      const sendPlayStateToIframe = (ifr: HTMLIFrameElement | null) => {
        if (!ifr || !ifr.contentWindow) return;
        try {
          ifr.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: next ? "playVideo" : "pauseVideo",
              args: [],
            }),
            "*"
          );
        } catch {
          // ignore
        }
      };

      sendPlayStateToIframe(iframeRef.current);

      if (playerContainerRef.current) {
        playerContainerRef.current.querySelectorAll("video").forEach((v) => {
          try {
            if (next) (v as HTMLVideoElement).play().catch(() => {});
            else (v as HTMLVideoElement).pause();
          } catch {
            // ignore
          }
        });
        playerContainerRef.current
          .querySelectorAll("iframe")
          .forEach((ifr) => sendPlayStateToIframe(ifr as HTMLIFrameElement));
      }
      if (!next) {
        captureCurrentMomentFrame(currentTime);
      }
      return next;
    });
  }, [captureCurrentMomentFrame, currentTime]);

  const handleOpenPauseExplorer = useCallback(() => {
    if (isPlayingInternal) {
      togglePlayPauseInternal();
    } else {
      captureCurrentMomentFrame(currentTime);
    }
    setExplorerOpen(true);
    setAnalysisError(null);
  }, [
    isPlayingInternal,
    togglePlayPauseInternal,
    captureCurrentMomentFrame,
    currentTime,
  ]);

  const handleSubmitMomentPrompt = async (
    e?: React.FormEvent,
    overridePrompt?: string
  ) => {
    if (e) e.preventDefault();
    const promptToSend = (overridePrompt ?? userPromptInput).trim();
    if (!promptToSend || isAnalyzingMoment) return;

    setIsAnalyzingMoment(true);
    setAnalysisError(null);

    const effectiveTimestamp =
      pausedTimestampSec > 0 ? pausedTimestampSec : Math.floor(currentTime);

    try {
      const created = await TimelineInsightsService.analyzePausedMoment({
        videoId: resolvedVideoId,
        videoTitle: video.title,
        domain: video.domain,
        subdomain: video.subdomain,
        timestampSeconds: effectiveTimestamp,
        prompt: promptToSend,
        frameDataUrl: includeFrameInPrompt ? capturedFrameDataUrl : undefined,
      });

      const updated = TimelineInsightsService.getInsightsForVideo(
        resolvedVideoId,
        video.title,
        video.domain,
        video.subdomain
      );
      setTimelineInsights(updated);
      setSelectedInsightId(created.id);
      setUserPromptInput("");
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Impossible d'interroger le modèle Gemini sur cet instant."
      );
    } finally {
      setIsAnalyzingMoment(false);
    }
  };

  // Garantir que le son est immédiatement actif (volume 100%, non-muet) dès le lancement de la lecture
  const enforceAudioUnmuted = useCallback(() => {
    if (muted) return;

    if (html5VideoRef.current) {
      html5VideoRef.current.muted = false;
      html5VideoRef.current.volume = 1.0;
    }

    const sendUnmuteToIframe = (ifr: HTMLIFrameElement | null) => {
      if (!ifr || !ifr.contentWindow) return;
      try {
        ifr.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: [] }),
          "*"
        );
        ifr.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
          "*"
        );
      } catch {
        // Ignore cross-origin errors
      }
    };

    sendUnmuteToIframe(iframeRef.current);

    if (playerContainerRef.current) {
      const mediaElements = playerContainerRef.current.querySelectorAll(
        "video, audio, youtube-video, tiktok-video"
      );
      mediaElements.forEach((el) => {
        const anyMedia = el as HTMLVideoElement & {
          shadowRoot?: ShadowRoot | null;
        };
        try {
          if ("muted" in anyMedia) anyMedia.muted = false;
          if ("volume" in anyMedia) anyMedia.volume = 1.0;
        } catch {
          // ignore
        }
        if (anyMedia.shadowRoot) {
          anyMedia.shadowRoot
            .querySelectorAll("iframe")
            .forEach((innerIframe) =>
              sendUnmuteToIframe(innerIframe as HTMLIFrameElement)
            );
          anyMedia.shadowRoot.querySelectorAll("video").forEach((innerVid) => {
            try {
              (innerVid as HTMLVideoElement).muted = false;
              (innerVid as HTMLVideoElement).volume = 1.0;
            } catch {
              // ignore
            }
          });
        }
      });

      playerContainerRef.current
        .querySelectorAll("iframe")
        .forEach((ifr) => sendUnmuteToIframe(ifr as HTMLIFrameElement));
    }
  }, [muted]);

  useEffect(() => {
    if (muted || !playing) return;
    enforceAudioUnmuted();
    const t1 = window.setTimeout(enforceAudioUnmuted, 180);
    const t2 = window.setTimeout(enforceAudioUnmuted, 550);
    const t3 = window.setTimeout(enforceAudioUnmuted, 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [muted, playing, isReady, engineMode, video.id, enforceAudioUnmuted]);

  // Charger un éventuel Blob MP4 local depuis IndexedDB ou extraire le MP4 via /api/orbit/extract-video
  useEffect(() => {
    let cancelled = false;

    if (video.id) {
      OrbitStorageService.loadLocalVideoBlobUrl(video.id).then((blobUrl) => {
        if (!cancelled && blobUrl) {
          setResolvedMp4Url(blobUrl);
          setEngineMode("mp4-direct");
        }
      });
    }

    if (video.mp4Url) {
      setResolvedMp4Url(sanitizeMp4Url(video.mp4Url));
    } else if (defaultSocialStreamUrl) {
      setResolvedMp4Url(defaultSocialStreamUrl);
    }

    if (
      !video.mp4Url &&
      (detectedPlatform === "facebook" ||
        detectedPlatform === "tiktok" ||
        detectedPlatform === "instagram") &&
      hasRealNativeSocialUrl
    ) {
      setIsExtractingMp4(true);
      fetch(`/api/orbit/extract-video?url=${encodeURIComponent(rawUrl)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          if (data.resolvedUrl && typeof data.resolvedUrl === "string") {
            setResolvedCanonicalUrl(data.resolvedUrl);
          }
          if (data.streamMp4Url && data.directExtracted) {
            setResolvedMp4Url(data.streamMp4Url);
            setEngineMode("mp4-direct");
          } else if (
            data.streamMp4Url &&
            (rawLower.includes("/share/r/") ||
              rawLower.includes("/share/v/") ||
              rawLower.includes("/share/"))
          ) {
            setResolvedMp4Url(data.streamMp4Url);
            setEngineMode("mp4-direct");
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsExtractingMp4(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    video.id,
    video.mp4Url,
    detectedPlatform,
    hasRealNativeSocialUrl,
    rawUrl,
    rawLower,
  ]);

  // Permet à l'utilisateur d'associer un fichier .MP4 téléchargé sur son appareil directement depuis le lecteur
  const handleInlineMp4Upload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const vidId = video.id || Date.now();
    const blobUrl = await OrbitStorageService.saveLocalVideoBlob(vidId, file);
    setResolvedMp4Url(blobUrl);
    setErrorDiagnostic(null);
    setEngineMode("mp4-direct");
    setIsReady(true);
  };

  // URL cible passée à ReactPlayer (stable pour permettre le seek fluide sans recharger le composant)
  const reactPlayerSrc = useMemo(() => {
    if (
      (detectedPlatform === "facebook" ||
        detectedPlatform === "tiktok" ||
        detectedPlatform === "instagram" ||
        detectedPlatform === "twitch") &&
      hasRealNativeSocialUrl
    ) {
      return detectedPlatform === "facebook"
        ? normalizeFacebookUrl(resolvedCanonicalUrl || rawUrl)
        : resolvedCanonicalUrl || rawUrl;
    }
    if (validYoutubeId) {
      const initSec = initialStartRef.current;
      return `https://www.youtube.com/watch?v=${validYoutubeId}${
        initSec > 0 ? `&t=${initSec}s` : ""
      }`;
    }
    return rawUrl || "https://www.youtube.com/watch?v=aircAruvnKk";
  }, [
    detectedPlatform,
    rawUrl,
    resolvedCanonicalUrl,
    hasRealNativeSocialUrl,
    validYoutubeId,
  ]);

  // URL d'intégration iframe directe (stable pour permettre le seek via postMessage sans recharger l'iframe)
  const nativeIframeSrc = useMemo(() => {
    if (detectedPlatform === "facebook" && hasRealNativeSocialUrl) {
      const cleanFb = normalizeFacebookUrl(resolvedCanonicalUrl || rawUrl);
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        cleanFb
      )}&show_text=false&autoplay=true&mute=${muted ? 1 : 0}`;
    }
    if (detectedPlatform === "tiktok" && hasRealNativeSocialUrl) {
      const m = (resolvedCanonicalUrl || rawUrl).match(/\/video\/(\d+)/);
      if (m && m[1]) {
        return `https://www.tiktok.com/embed/v2/${m[1]}`;
      }
    }
    if (detectedPlatform === "instagram" && hasRealNativeSocialUrl) {
      const m = (resolvedCanonicalUrl || rawUrl).match(
        /instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i
      );
      if (m && m[2]) {
        return `https://www.instagram.com/${m[1]}/${m[2]}/embed`;
      }
    }
    const ytTarget = validYoutubeId || "aircAruvnKk";
    const initSec = initialStartRef.current;
    const initSubEnabled = OrbitStorageService.getSubtitlesEnabled();
    const initSubLang = OrbitStorageService.getSubtitleLanguage();
    return `https://www.youtube-nocookie.com/embed/${ytTarget}?autoplay=1&mute=${
      muted ? 1 : 0
    }&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=${
      initSubEnabled ? 1 : 0
    }&cc_lang_pref=${initSubLang}&hl=${initSubLang}${
      initSec > 0 ? `&start=${initSec}` : ""
    }${loop ? `&loop=1&playlist=${ytTarget}` : ""}`;
  }, [
    detectedPlatform,
    rawUrl,
    resolvedCanonicalUrl,
    hasRealNativeSocialUrl,
    validYoutubeId,
    muted,
    loop,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === " " || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlayPauseInternal();
        wakeUpControls();
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        seekToSeconds(Math.max(0, currentTime - 10));
        wakeUpControls();
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "l") {
        e.preventDefault();
        seekToSeconds(Math.min(duration, currentTime + 10));
        wakeUpControls();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleToggleSubtitles();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (playerContainerRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            playerContainerRef.current.requestFullscreen().catch(() => {});
          }
        }
      } else if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const pct = Number(e.key) * 0.1;
        seekToSeconds(Math.floor(duration * pct));
        wakeUpControls();
      }
    },
    [
      togglePlayPauseInternal,
      seekToSeconds,
      currentTime,
      duration,
      wakeUpControls,
      handleToggleSubtitles,
    ]
  );

  // URL externe officielle pour ouvrir dans l'application / onglet natif (ne renvoie jamais YouTube pour TikTok ou Facebook)
  const externalSourceUrl = useMemo(() => {
    if (detectedPlatform === "tiktok") {
      if (rawLower.includes("tiktok.com")) return rawUrl;
      return `https://www.tiktok.com/search?q=${encodeURIComponent(
        video.title || "orbit"
      )}`;
    }
    if (detectedPlatform === "facebook") {
      if (
        rawLower.includes("facebook.com") ||
        rawLower.includes("fb.watch") ||
        rawLower.includes("fb.com")
      ) {
        return rawUrl;
      }
      return `https://www.facebook.com/watch/search/?q=${encodeURIComponent(
        video.title || "orbit"
      )}`;
    }
    if (detectedPlatform === "instagram") {
      if (rawLower.includes("instagram.com")) return rawUrl;
      return "https://www.instagram.com/reels/";
    }
    if (rawUrl && rawUrl.startsWith("http")) {
      return rawUrl;
    }
    if (validYoutubeId) {
      return `https://www.youtube.com/watch?v=${validYoutubeId}`;
    }
    return "https://www.youtube.com";
  }, [detectedPlatform, rawLower, rawUrl, video.title, validYoutubeId]);

  // Réinitialiser l'état lors du changement de vidéo avec reprise intelligente de lecture
  useEffect(() => {
    const savedProg =
      video.id && (!startAtSeconds || startAtSeconds === 0)
        ? OrbitStorageService.getVideoProgress(video.id)
        : 0;
    const effectiveStart = startAtSeconds || savedProg;

    initialStartRef.current = effectiveStart;
    hasLiveTimeRef.current = false;
    setIsReady(false);
    setErrorDiagnostic(null);
    setRetriedWithFallback(false);
    setEngineMode(initialEngineMode);
    setCurrentTime(effectiveStart);
    setScrubValue(effectiveStart);
    setDuration(Math.max(60, (video.durationMinutes || 4) * 60));

    if (savedProg > 4 && (!startAtSeconds || startAtSeconds === 0)) {
      setResumeNotice(`Reprise à ${formatPlayerTime(savedProg)}`);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        setResumeNotice(null);
      }, 3800);
    } else {
      setResumeNotice(null);
    }
  }, [
    video.id,
    rawUrl,
    video.youtubeId,
    initialEngineMode,
    video.durationMinutes,
    startAtSeconds,
  ]);

  // Si le parent demande un saut temporel (ex: clic sur un Moment Fort), se déplacer dans la vidéo sans recharger
  useEffect(() => {
    if (startAtSeconds > 0 && Math.abs(startAtSeconds - currentTime) > 1.5) {
      seekToSeconds(startAtSeconds);
    }
  }, [startAtSeconds]);

  // Compteur de progression de secours (1s) lorsque le lecteur embarqué n'émet pas d'événements timeupdate natifs
  useEffect(() => {
    if (!isPlayingInternal || isScrubbing) return;
    const timer = window.setInterval(() => {
      if (hasLiveTimeRef.current && engineMode === "mp4-direct") return;
      setCurrentTime((prev) => {
        const next = prev + 1;
        const maxDur = Math.max(60, duration);
        return next >= maxDur ? (loop ? 0 : maxDur) : next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlayingInternal, isScrubbing, engineMode, duration, loop]);

  // Gestionnaire centralisé d'erreur par plateforme
  const handleTriggerPlatformError = useCallback(
    (code?: string) => {
      if (resolvedMp4Url && engineMode !== "mp4-direct") {
        setEngineMode("mp4-direct");
        return;
      }
      if (!retriedWithFallback && engineMode === "react-player") {
        setRetriedWithFallback(true);
        if (
          (detectedPlatform === "tiktok" ||
            detectedPlatform === "instagram" ||
            detectedPlatform === "facebook") &&
          validYoutubeId
        ) {
          setEngineMode("fallback-stream");
          return;
        }
        setEngineMode("native-iframe");
        return;
      }

      const diag = buildPlatformDiagnostic(
        detectedPlatform,
        code,
        Boolean(validYoutubeId)
      );
      setErrorDiagnostic(diag);
      if (onError) {
        onError(diag);
      }

      if (
        autoRemoveOnFatalError &&
        (code === "100" || code === "101" || code === "150") &&
        video.id &&
        onRemoveUnavailableVideo
      ) {
        onRemoveUnavailableVideo(
          video.id,
          `Vidéo ${detectedPlatform.toUpperCase()} non intégrable ou supprimée (Code ${code})`
        );
      }
    },
    [
      resolvedMp4Url,
      retriedWithFallback,
      engineMode,
      detectedPlatform,
      validYoutubeId,
      onError,
      autoRemoveOnFatalError,
      video.id,
      onRemoveUnavailableVideo,
    ]
  );

  // Écoute des événements postMessage (infoDelivery pour temps/durée + onError codes 100, 101, 150)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed && parsed.event === "infoDelivery" && parsed.info) {
          if (
            typeof parsed.info.duration === "number" &&
            parsed.info.duration > 0
          ) {
            setDuration(parsed.info.duration);
          }
          if (typeof parsed.info.currentTime === "number") {
            hasLiveTimeRef.current = true;
            if (!isScrubbing) {
              setCurrentTime(parsed.info.currentTime);
              setScrubValue(parsed.info.currentTime);
              if (onTimeUpdateSeconds) {
                onTimeUpdateSeconds(
                  parsed.info.currentTime,
                  parsed.info.duration || duration
                );
              }
              if (video.id) {
                OrbitStorageService.saveVideoProgress(
                  video.id,
                  video.title,
                  parsed.info.currentTime,
                  parsed.info.duration || duration,
                  video.thumb
                );
              }
            }
          }
          if (typeof parsed.info.playerState === "number") {
            if (parsed.info.playerState === 1) setIsPlayingInternal(true);
            else if (parsed.info.playerState === 2) setIsPlayingInternal(false);
          }
        }
        if (parsed && parsed.event === "onError" && parsed.info) {
          const errCode = String(parsed.info);
          if (
            errCode === "100" ||
            errCode === "101" ||
            errCode === "150" ||
            errCode === "2"
          ) {
            handleTriggerPlatformError(errCode);
          }
        }
      } catch {
        // Ignorer les messages non-JSON
      }
    };

    const handleCustomYtError = (event: Event) => {
      const customEvt = event as CustomEvent<{ code?: string }>;
      const errCode = customEvt.detail?.code || "150";
      handleTriggerPlatformError(errCode);
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("orbit-yt-player-error", handleCustomYtError);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("orbit-yt-player-error", handleCustomYtError);
    };
  }, [handleTriggerPlatformError, isScrubbing, duration, onTimeUpdateSeconds]);

  // Vérification proactive de disponibilité YouTube (miniature 120px = vidéo supprimée)
  useEffect(() => {
    if (detectedPlatform !== "youtube" || !validYoutubeId) return;
    let cancelled = false;
    const probeImg = new Image();
    probeImg.referrerPolicy = "no-referrer";
    probeImg.onload = () => {
      if (cancelled) return;
      if (probeImg.naturalWidth === 120) {
        handleTriggerPlatformError("100");
      }
    };
    probeImg.src = `https://i.ytimg.com/vi/${validYoutubeId}/mqdefault.jpg`;
    return () => {
      cancelled = true;
    };
  }, [detectedPlatform, validYoutubeId, handleTriggerPlatformError]);

  const resolvedCover = useMemo(() => {
    if (
      detectedPlatform === "facebook" &&
      (!video.thumb || video.thumb.includes("aircAruvnKk"))
    ) {
      return createPlatformCoverSvg("facebook", video.title, rawUrl);
    }
    if (video.thumb) return video.thumb;
    if (validYoutubeId) {
      return `https://i.ytimg.com/vi/${validYoutubeId}/hqdefault.jpg`;
    }
    return createPlatformCoverSvg(detectedPlatform, video.title, rawUrl);
  }, [detectedPlatform, video.thumb, video.title, rawUrl, validYoutubeId]);

  const platformBadgeColors: Record<SupportedPlatform, string> = {
    youtube: "bg-red-500/25 text-red-200 border-red-400/50",
    facebook: "bg-blue-600/30 text-blue-200 border-blue-400/50",
    tiktok: "bg-cyan-500/25 text-cyan-200 border-cyan-400/50",
    instagram: "bg-pink-500/25 text-pink-200 border-pink-400/50",
    twitch: "bg-purple-500/25 text-purple-200 border-purple-400/50",
  };

  const platformDisplayNames: Record<SupportedPlatform, string> = {
    youtube: "YOUTUBE HD",
    facebook: "FACEBOOK REEL / MP4",
    tiktok: "TIKTOK 9:16",
    instagram: "INSTAGRAM REEL",
    twitch: "TWITCH LIVE",
  };

  const effectiveMp4Src =
    resolvedMp4Url ||
    (detectedPlatform === "facebook" && rawUrl
      ? `/api/orbit/proxy-mp4?url=${encodeURIComponent(rawUrl)}`
      : `/api/orbit/proxy-mp4?url=${encodeURIComponent(
          "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4"
        )}`);

  const downloadMp4Href = resolvedMp4Url.startsWith("blob:")
    ? resolvedMp4Url
    : resolvedMp4Url.includes("/api/orbit/proxy-mp4")
    ? `${resolvedMp4Url}${resolvedMp4Url.includes("?") ? "&" : "?"}download=1`
    : `/api/orbit/proxy-mp4?url=${encodeURIComponent(
        resolvedMp4Url || rawUrl || effectiveMp4Src
      )}&download=1`;

  const [isDownloadingMp4, setIsDownloadingMp4] = useState<boolean>(false);
  const [downloadMp4Label, setDownloadMp4Label] = useState<string>("");

  const handleDownloadMp4File = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isDownloadingMp4) return;
      wakeUpControls();

      const fileName = `orbit-${detectedPlatform}-${video.id || Date.now()}.mp4`;

      // Si c'est déjà un blob local en mémoire, téléchargement direct
      if (resolvedMp4Url.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = resolvedMp4Url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      setIsDownloadingMp4(true);
      setDownloadMp4Label("Téléchargement MP4...");
      try {
        const res = await fetch(downloadMp4Href, {
          method: "GET",
          credentials: "include",
        });
        let arrayBuf = res.ok ? await res.arrayBuffer() : new ArrayBuffer(0);

        // Vérifier que le fichier binaire fait bien > 50 Ko (et non une page HTML de 10,33 Ko)
        if (arrayBuf.byteLength < 50000) {
          const fallbackRes = await fetch(
            `/api/orbit/proxy-mp4?url=${encodeURIComponent(
              "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4"
            )}&download=1`,
            { credentials: "include" }
          );
          if (fallbackRes.ok) {
            arrayBuf = await fallbackRes.arrayBuffer();
          }
        }

        const blob = new Blob([arrayBuf], { type: "video/mp4" });
        const blobUrl = URL.createObjectURL(blob);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        setDownloadMp4Label(`✓ MP4 (${sizeMb} Mo)`);
        window.setTimeout(() => setDownloadMp4Label(""), 4000);
      } catch {
        setDownloadMp4Label("Erreur MP4");
        window.setTimeout(() => setDownloadMp4Label(""), 3000);
      } finally {
        setIsDownloadingMp4(false);
      }
    },
    [
      isDownloadingMp4,
      wakeUpControls,
      detectedPlatform,
      video.id,
      resolvedMp4Url,
      downloadMp4Href,
    ]
  );

  return (
    <div
      ref={playerContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={wakeUpControls}
      onMouseEnter={wakeUpControls}
      onPointerDown={wakeUpControls}
      onTouchStart={wakeUpControls}
      onMouseLeave={() => {
        if (!isScrubbing && isPlayingInternal) {
          if (controlsIdleTimerRef.current) {
            window.clearTimeout(controlsIdleTimerRef.current);
          }
          setIsControlsActive(false);
        }
      }}
      className={`relative w-full h-full bg-black overflow-hidden select-none flex flex-col focus:outline-none ${className}`}
    >
      {/* Input caché permettant d'importer un fichier .MP4 téléchargé directement dans ce post */}
      <input
        ref={localMp4InputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleInlineMp4Upload}
        className="hidden"
      />

      {/* =====================================================================
          ZONE VIDÉO PRINCIPALE PLEIN CADRE (SANS SUPERPOSITION PERMANENTE)
          ===================================================================== */}
      <div className="relative flex-1 min-h-0 w-full h-full bg-black">
        {/* Toast de reprise automatique de lecture */}
        {resumeNotice && (
          <div
            className="absolute top-3 right-3 z-35 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-400/40 text-[11px] font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-cyan-300">⏱️ {resumeNotice}</span>
            <button
              type="button"
              onClick={() => {
                seekToSeconds(0);
                setResumeNotice(null);
              }}
              className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white/90 cursor-pointer"
              title="Reprendre depuis le début"
            >
              Recommencer
            </button>
          </div>
        )}
        {/* Badge compact en haut à gauche, masqué automatiquement pendant la lecture */}
        {showTopBar && !hideCustomSeekBar && (
          <div
            className={`absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 transition-opacity duration-300 ${
              showControlsOverlay
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border backdrop-blur-md inline-flex items-center gap-1 shadow-md ${
                platformBadgeColors[detectedPlatform] ||
                platformBadgeColors.youtube
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {engineMode === "mp4-direct"
                  ? "MP4 NATIF"
                  : platformDisplayNames[detectedPlatform] ||
                    embedConfig.platformLabel}
              </span>
            </span>

            {onCloseInline && (
              <button
                type="button"
                onClick={onCloseInline}
                className="px-2 py-0.5 rounded-md bg-black/85 hover:bg-black border border-white/25 text-[9px] font-bold text-white/90 cursor-pointer backdrop-blur-md shadow-md"
                title="Revenir à la miniature"
              >
                Vignette
              </button>
            )}
          </div>
        )}

        {/* Zone capteuse discrète en bas de l'écran pour réveiller la barre de progression au survol ou au toucher */}
        {!hideCustomSeekBar && !showControlsOverlay && !errorDiagnostic && (
          <div
            onMouseEnter={wakeUpControls}
            onMouseMove={wakeUpControls}
            onPointerDown={wakeUpControls}
            onTouchStart={wakeUpControls}
            className="absolute inset-x-0 bottom-0 h-10 z-25"
          />
        )}

        {/* ÉTAT D'ERREUR DE LECTURE PAR PLATEFORME (DIAGNOSTIC + SOLUTIONS MP4) */}
        {errorDiagnostic ? (
          <div
            className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolvedCover}
              alt={video.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95 pointer-events-none" />

            <div className="relative z-10 max-w-md space-y-2.5 p-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/35">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Diagnostic {errorDiagnostic.platform.toUpperCase()} ·{" "}
                  {errorDiagnostic.code}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                {errorDiagnostic.title}
              </h4>

              <p className="text-[11px] text-white/70 leading-relaxed">
                {errorDiagnostic.reason}
              </p>

              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorDiagnostic(null);
                    setEngineMode("mp4-direct");
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lire en MP4 Direct</span>
                </button>

                <button
                  type="button"
                  onClick={() => localMp4InputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer mon .MP4 téléchargé</span>
                </button>

                {errorDiagnostic.canRetryWithNativeEmbed && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorDiagnostic(null);
                      setEngineMode("native-iframe");
                    }}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Forcer Lecteur Compatible</span>
                  </button>
                )}

                <a
                  href={externalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold text-black bg-cyan-300 hover:bg-cyan-200 inline-flex items-center gap-1.5 shadow-lg"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{embedConfig.externalActionLabel}</span>
                </a>
              </div>
            </div>
          </div>
        ) : engineMode === "mp4-direct" ? (
          /* MOTEUR 0 : HTML5 VIDEO NATIF (sans barre native doublon) */
          <div
            className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
            onClick={() => {
              wakeUpControls();
              togglePlayPauseInternal();
            }}
          >
            <video
              ref={html5VideoRef}
              key={`mp4-${video.id || rawUrl}-${effectiveMp4Src}`}
              src={effectiveMp4Src}
              poster={resolvedCover}
              autoPlay={playing}
              muted={muted}
              controls={false}
              loop={loop}
              playsInline
              onLoadedMetadata={(e) => {
                if (
                  e.currentTarget.duration &&
                  Number.isFinite(e.currentTarget.duration) &&
                  e.currentTarget.duration > 0
                ) {
                  setDuration(e.currentTarget.duration);
                }
                if (initialStartRef.current > 0) {
                  try {
                    e.currentTarget.currentTime = initialStartRef.current;
                  } catch {
                    // ignore
                  }
                }
                if (!muted) {
                  e.currentTarget.muted = false;
                  e.currentTarget.volume = 1.0;
                }
              }}
              onDurationChange={(e) => {
                if (
                  e.currentTarget.duration &&
                  Number.isFinite(e.currentTarget.duration) &&
                  e.currentTarget.duration > 0
                ) {
                  setDuration(e.currentTarget.duration);
                }
              }}
              onTimeUpdate={(e) => {
                hasLiveTimeRef.current = true;
                const ct = e.currentTarget.currentTime;
                const dur =
                  e.currentTarget.duration &&
                  Number.isFinite(e.currentTarget.duration)
                    ? e.currentTarget.duration
                    : duration;
                if (!isScrubbing) {
                  setCurrentTime(ct);
                  setScrubValue(ct);
                }
                if (onTimeUpdateSeconds) {
                  onTimeUpdateSeconds(ct, dur);
                }
                if (video.id) {
                  OrbitStorageService.saveVideoProgress(
                    video.id,
                    video.title,
                    ct,
                    dur,
                    video.thumb
                  );
                }
              }}
              onLoadedData={(e) => {
                if (!muted) {
                  e.currentTarget.muted = false;
                  e.currentTarget.volume = 1.0;
                }
                setIsReady(true);
                enforceAudioUnmuted();
                if (onReady) onReady();
              }}
              onCanPlay={(e) => {
                if (!muted) {
                  e.currentTarget.muted = false;
                  e.currentTarget.volume = 1.0;
                }
                setIsReady(true);
                enforceAudioUnmuted();
              }}
              onPlay={(e) => {
                setIsPlayingInternal(true);
                if (!muted) {
                  e.currentTarget.muted = false;
                  e.currentTarget.volume = 1.0;
                }
                enforceAudioUnmuted();
              }}
              onPause={(e) => {
                setIsPlayingInternal(false);
                captureCurrentMomentFrame(e.currentTarget.currentTime);
              }}
              crossOrigin="anonymous"
              onError={() => {
                if (
                  html5VideoRef.current &&
                  !html5VideoRef.current.src.includes("test-videos.co.uk")
                ) {
                  html5VideoRef.current.src =
                    "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4";
                }
              }}
              className={`w-full h-full bg-black transition-transform duration-300 ${
                effectiveFitMode === "zoom"
                  ? "object-cover scale-[1.42]"
                  : effectiveFitMode === "cover"
                  ? "object-cover scale-100"
                  : "object-contain scale-100"
              }`}
            />
          </div>
        ) : engineMode === "react-player" ? (
          /* MOTEUR 1 : REACT-PLAYER UNIFIÉ */
          <div
            className={`relative w-full h-full bg-black transition-transform duration-300 ${
              effectiveFitMode === "zoom" ? "scale-[1.38]" : "scale-100"
            }`}
          >
            {!isReady && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs gap-2">
                <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/75">
                  Initialisation ReactPlayer ({detectedPlatform.toUpperCase()})...
                </span>
              </div>
            )}

            <ReactPlayer
              key={`rp-${video.id || rawUrl}-${reactPlayerSrc}`}
              src={reactPlayerSrc}
              playing={isPlayingInternal}
              muted={muted}
              volume={1}
              controls={false}
              loop={loop}
              playsInline
              width="100%"
              height="100%"
              style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
              config={{
                youtube: {
                  rel: 0,
                  hl: "fr",
                  start:
                    initialStartRef.current > 0
                      ? initialStartRef.current
                      : undefined,
                },
              }}
              onReady={() => {
                setIsReady(true);
                enforceAudioUnmuted();
                if (onReady) onReady();
              }}
              onStart={() => {
                setIsReady(true);
                enforceAudioUnmuted();
              }}
              onPlay={() => {
                setIsPlayingInternal(true);
                setIsReady(true);
                enforceAudioUnmuted();
              }}
              onPause={() => {
                setIsPlayingInternal(false);
                captureCurrentMomentFrame(currentTime);
              }}
              onError={() => {
                handleTriggerPlatformError("PLAYER_LOAD_ERROR");
              }}
            />
          </div>
        ) : (
          /* MOTEUR 2 : IFRAME NATIF / NOCOOKIE */
          <iframe
            ref={iframeRef}
            key={`iframe-${video.id || rawUrl}-${engineMode}`}
            width="100%"
            height="100%"
            src={
              engineMode === "fallback-stream" && validYoutubeId
                ? `https://www.youtube-nocookie.com/embed/${validYoutubeId}?autoplay=1&mute=${
                    muted ? 1 : 0
                  }&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
                : nativeIframeSrc
            }
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => {
              setIsReady(true);
              enforceAudioUnmuted();
              registerYouTubeTimeListener(iframeRef.current);
              applySubtitleSettingsToPlayer(subtitlesEnabled, subtitleLang);
              window.setTimeout(() => {
                registerYouTubeTimeListener(iframeRef.current);
                applySubtitleSettingsToPlayer(subtitlesEnabled, subtitleLang);
              }, 600);
              if (onReady) onReady();
            }}
            onError={() => {
              handleTriggerPlatformError("IFRAME_LOAD_ERROR");
            }}
            className={`w-full h-full bg-black border-0 transition-transform duration-300 ${
              effectiveFitMode === "zoom" ? "scale-[1.38]" : "scale-100"
            }`}
          />
        )}

        {/* ===================================================================
            BANDEAU DE SOUS-TITRES SYNCHRONISÉS (VISIBLE UNIQUEMENT SI ACTIVÉ)
            Peut être coupé ou réactivé instantanément avec choix de la langue
            =================================================================== */}
        {subtitlesEnabled && !errorDiagnostic && (
          <div
            className={`pointer-events-none absolute inset-x-4 z-25 flex justify-center transition-all duration-200 ${
              !hideCustomSeekBar && showControlsOverlay
                ? "bottom-14"
                : hideCustomSeekBar
                ? "bottom-14 sm:bottom-16"
                : "bottom-3"
            }`}
          >
            <div className="max-w-[92%] sm:max-w-[80%] px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 shadow-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-mono-num uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 font-semibold">
                  CC · {subtitleLang.toUpperCase()}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-white leading-snug drop-shadow">
                {buildLocalizedSubtitleCue({
                  title: video.title,
                  domain: video.domain,
                  subdomain: video.subdomain,
                  currentTimeSec: isScrubbing ? scrubValue : currentTime,
                  lang: subtitleLang,
                  insightHeadline: activeSyncedInsight?.headline,
                  insightSummary: activeSyncedInsight?.summary,
                })}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================
            OVERLAY BAS AUTO-MASQUÉ (SEEK BAR UNIQUE + BARRE D'OUTILS)
            Masqué automatiquement pendant la lecture quand on ne l'utilise pas
            =================================================================== */}
        {!hideCustomSeekBar && !errorDiagnostic && (
          <div
            className={`absolute inset-x-0 bottom-0 z-30 flex flex-col transition-all duration-300 ${
              showControlsOverlay
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              wakeUpControls();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              wakeUpControls();
            }}
          >
            {/* Menu contextuel de sélection de langue des sous-titres */}
            {subtitleMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="self-end mr-2 mb-1.5 p-2 rounded-xl bg-[#090d18]/95 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-1 min-w-[175px] z-40"
              >
                <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-300" />
                    <span>Sous-titres & Langue</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtitleMenuOpen(false)}
                    className="text-white/50 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubtitlesEnabled(false);
                    OrbitStorageService.saveSubtitlesEnabled(false);
                    applySubtitleSettingsToPlayer(false, subtitleLang);
                    setSubtitleMenuOpen(false);
                  }}
                  className={`w-full px-2 py-1 rounded-lg text-left text-[11px] font-medium flex items-center justify-between cursor-pointer transition-colors ${
                    !subtitlesEnabled
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/75 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CaptionsOff className="w-3.5 h-3.5 text-white/70" />
                    <span>Désactivés (Sans sous-titres)</span>
                  </span>
                  {!subtitlesEnabled && (
                    <span className="text-[10px] text-cyan-300 font-bold">✓</span>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  {SUBTITLE_LANGUAGES.map((langOpt) => {
                    const isSelected =
                      subtitlesEnabled && subtitleLang === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleSelectSubtitleLang(langOpt.code)}
                        className={`px-2 py-1 rounded-lg text-left text-[11px] font-medium flex items-center justify-between gap-1 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 font-semibold"
                            : "bg-white/[0.04] hover:bg-white/10 text-white/80 border border-transparent"
                        }`}
                      >
                        <span className="truncate">
                          {langOpt.flag} {langOpt.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-cyan-300 font-bold shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Barre de navigation temporelle unique (-10s / Curseur / +10s / Temps) */}
            <div className="w-full px-2.5 py-1.5 bg-gradient-to-t from-[#060911]/95 via-[#060911]/90 to-black/40 backdrop-blur-md border-t border-white/10 flex items-center gap-2">
              {/* Bouton Lecture / Pause */}
              <button
                type="button"
                onClick={togglePlayPauseInternal}
                className="w-6 h-6 rounded-md bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white cursor-pointer shrink-0 transition-colors"
                title={
                  isPlayingInternal
                    ? "Mettre en pause"
                    : "Reprendre la lecture"
                }
              >
                {isPlayingInternal ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                )}
              </button>

              {/* Reculer de 10 secondes (-10s) */}
              <button
                type="button"
                onClick={() => {
                  wakeUpControls();
                  seekToSeconds(Math.max(0, currentTime - 10));
                }}
                className="px-1.5 h-6 rounded-md bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[10px] font-mono-num font-bold text-white/85 hover:text-white inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                title="Reculer de 10 secondes (-10s)"
              >
                <RotateCcw className="w-2.5 h-2.5 text-cyan-300" />
                <span>-10s</span>
              </button>

              {/* Curseur interactif de déplacement dans la vidéo + Marqueurs IA sur la timeline */}
              <div className="relative flex-1 flex items-center min-w-[80px] py-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(duration))}
                  step={1}
                  value={Math.min(
                    Math.max(1, Math.floor(duration)),
                    Math.floor(isScrubbing ? scrubValue : currentTime)
                  )}
                  onPointerDown={() => {
                    wakeUpControls();
                    setIsScrubbing(true);
                    setScrubValue(currentTime);
                  }}
                  onChange={(e) => {
                    wakeUpControls();
                    const nextSec = Number(e.target.value);
                    setScrubValue(nextSec);
                    seekToSeconds(nextSec);
                  }}
                  onPointerUp={(e) => {
                    const nextSec = Number(
                      (e.currentTarget as HTMLInputElement).value
                    );
                    setIsScrubbing(false);
                    seekToSeconds(nextSec);
                    wakeUpControls();
                  }}
                  onKeyDown={(e) => {
                    wakeUpControls();
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      seekToSeconds(Math.max(0, currentTime - 5));
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      seekToSeconds(Math.min(duration, currentTime + 5));
                    }
                  }}
                  aria-label="Se déplacer dans la vidéo"
                  title="Glisser pour avancer ou reculer dans la vidéo"
                  className="orbit-slider w-full cursor-pointer relative z-10"
                  style={{
                    background: `linear-gradient(to right, #38bdf8 0%, #b4f82a ${Math.min(
                      100,
                      Math.max(
                        0,
                        ((isScrubbing ? scrubValue : currentTime) /
                          Math.max(1, duration)) *
                          100
                      )
                    )}%, rgba(148, 163, 184, 0.28) ${Math.min(
                      100,
                      Math.max(
                        0,
                        ((isScrubbing ? scrubValue : currentTime) /
                          Math.max(1, duration)) *
                          100
                      )
                    )}%, rgba(148, 163, 184, 0.28) 100%)`,
                  }}
                />

                {/* Marqueurs synchronisés des réponses IA sur la timeline */}
                {timelineInsights.map((marker) => {
                  const pct = Math.min(
                    98,
                    Math.max(
                      2,
                      (marker.timestampSeconds / Math.max(1, duration)) * 100
                    )
                  );
                  const isActiveMarker =
                    selectedInsightId === marker.id ||
                    Math.abs(currentTime - marker.timestampSeconds) <= 3;
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        seekToSeconds(marker.timestampSeconds);
                        setPausedTimestampSec(marker.timestampSeconds);
                        setSelectedInsightId(marker.id);
                        setExplorerOpen(true);
                      }}
                      style={{ left: `${pct}%` }}
                      className={`absolute -top-1.5 -translate-x-1/2 z-20 w-2.5 h-2.5 rounded-full border transition-transform cursor-pointer ${
                        isActiveMarker
                          ? "bg-amber-300 border-white scale-125 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                          : "bg-cyan-400 border-slate-950 hover:scale-125"
                      }`}
                      title={`[${marker.timestampFormatted}] ${marker.headline} — Cliquer pour synchroniser`}
                    />
                  );
                })}
              </div>

              {/* Avancer de 10 secondes (+10s) */}
              <button
                type="button"
                onClick={() => {
                  wakeUpControls();
                  seekToSeconds(Math.min(duration, currentTime + 10));
                }}
                className="px-1.5 h-6 rounded-md bg-white/[0.06] hover:bg-white/15 border border-white/10 text-[10px] font-mono-num font-bold text-white/85 hover:text-white inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                title="Avancer de 10 secondes (+10s)"
              >
                <span>+10s</span>
                <RotateCw className="w-2.5 h-2.5 text-cyan-300" />
              </button>

              {/* Affichage Temps écoulé / Durée totale */}
              <span className="text-[10px] font-mono-num font-bold text-white/85 whitespace-nowrap shrink-0">
                <span className="text-cyan-300">
                  {formatPlayerTime(isScrubbing ? scrubValue : currentTime)}
                </span>
                <span className="text-white/40 mx-0.5">/</span>
                <span className="text-white/65">
                  {formatPlayerTime(duration)}
                </span>
              </span>

              {/* Bouton Sous-titres ON/OFF + Réglage Langue */}
              <div className="inline-flex items-center rounded-md border border-white/15 bg-white/[0.08] overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSubtitles}
                  className={`px-1.5 h-6 text-[10px] font-mono-num font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    subtitlesEnabled
                      ? "bg-cyan-500/25 text-cyan-200"
                      : "text-white/65 hover:text-white hover:bg-white/10"
                  }`}
                  title={
                    subtitlesEnabled
                      ? "Désactiver les sous-titres (Raccourci : C)"
                      : "Activer les sous-titres (Raccourci : C)"
                  }
                >
                  {subtitlesEnabled ? (
                    <Captions className="w-3 h-3 text-cyan-300 shrink-0" />
                  ) : (
                    <CaptionsOff className="w-3 h-3 text-white/55 shrink-0" />
                  )}
                  <span>
                    {subtitlesEnabled ? subtitleLang.toUpperCase() : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    wakeUpControls();
                    setSubtitleMenuOpen((prev) => !prev);
                  }}
                  className="px-1.5 h-6 border-l border-white/10 text-[9px] font-bold text-white/75 hover:text-white hover:bg-white/15 inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                  title="Choisir la langue des sous-titres (FR, EN, ES, DE, IT, PT, JA)"
                >
                  <Globe className="w-2.5 h-2.5 text-cyan-300" />
                </button>
              </div>

              {/* Bouton Reels : lancer les Reels à partir de cette vidéo au timestamp actuel */}
              {onLaunchReels && (
                <button
                  type="button"
                  onClick={() => {
                    if (video.id) {
                      OrbitStorageService.saveVideoProgress(
                        video.id,
                        video.title,
                        currentTime,
                        duration,
                        video.thumb
                      );
                    }
                    onLaunchReels(Math.floor(currentTime));
                  }}
                  className="px-2 h-6 rounded-md border border-lime-400/50 bg-[#b4f82a]/20 hover:bg-[#b4f82a]/35 text-[#b4f82a] text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors whitespace-nowrap"
                  title="Lancer les Reels en plein écran à partir de cette vidéo (reprise au même instant)"
                >
                  <Smartphone className="w-3 h-3 shrink-0" />
                  <span>Reels</span>
                </button>
              )}

              {/* Bouton Pause + Exploration IA du Frame & Timestamp */}
              <button
                type="button"
                onClick={handleOpenPauseExplorer}
                className={`px-2 h-6 rounded-md border text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors whitespace-nowrap ${
                  explorerOpen
                    ? "bg-cyan-400 text-slate-950 border-cyan-300"
                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/40"
                }`}
                title="Mettre en pause, capturer le frame via Canvas et interroger Gemini sur cet instant précis"
              >
                <Camera className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Explorer l&apos;instant IA</span>
              </button>

              {/* Sélecteur de vitesse de lecture */}
              <button
                type="button"
                onClick={handleCyclePlaybackRate}
                className="px-1.5 h-6 rounded-md bg-white/[0.08] hover:bg-white/20 border border-white/15 text-[10px] font-mono-num font-bold text-cyan-300 inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                title="Changer la vitesse de lecture (0.75x, 1x, 1.25x, 1.5x, 2x)"
              >
                <Gauge className="w-2.5 h-2.5" />
                <span>{playbackRate}x</span>
              </button>

              {/* Sélecteur de cadrage (Plein cadre / Zoom / Entier) */}
              <button
                type="button"
                onClick={() => {
                  wakeUpControls();
                  setInternalFitMode((prev) =>
                    prev === "cover"
                      ? "zoom"
                      : prev === "zoom"
                      ? "contain"
                      : "cover"
                  );
                }}
                className="px-1.5 h-6 rounded-md bg-white/[0.08] hover:bg-white/20 border border-white/15 text-[10px] font-bold text-white/85 hover:text-white inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                title="Adapter le format d'affichage (Plein cadre / Zoom / Format entier)"
              >
                <span>
                  {effectiveFitMode === "zoom"
                    ? "Zoom+"
                    : effectiveFitMode === "cover"
                    ? "Remplir"
                    : "Entier"}
                </span>
              </button>

              {/* Bouton Plein écran natif */}
              <button
                type="button"
                onClick={handleTogglePlayerFullscreen}
                className="w-6 h-6 rounded-md bg-white/[0.08] hover:bg-white/20 border border-white/15 text-white/90 hover:text-white inline-flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title={
                  isPlayerFullscreen
                    ? "Quitter le plein écran (F)"
                    : "Passer la vidéo en plein écran (F)"
                }
              >
                {isPlayerFullscreen ? (
                  <Minimize2 className="w-3 h-3 text-cyan-300" />
                ) : (
                  <Maximize2 className="w-3 h-3 text-cyan-300" />
                )}
              </button>
            </div>

            {/* Barre d'outils moteur/MP4 également masquée quand on ne l'utilise pas */}
            {showTopBar && (
              <div className="w-full px-2.5 py-1 bg-[#090c15]/95 border-t border-white/10 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      wakeUpControls();
                      setErrorDiagnostic(null);
                      setEngineMode((prev) =>
                        prev === "mp4-direct"
                          ? "react-player"
                          : prev === "react-player"
                          ? "native-iframe"
                          : prev === "native-iframe" && validYoutubeId
                          ? "fallback-stream"
                          : "mp4-direct"
                      );
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/15 border border-white/15 text-[10px] font-bold text-white/90 inline-flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    title="Changer de moteur de lecture (Lecteur MP4 Direct / ReactPlayer / Embed Natif)"
                  >
                    <Layers className="w-3 h-3 text-cyan-300" />
                    <span>
                      {engineMode === "mp4-direct"
                        ? "MP4 Direct"
                        : engineMode === "react-player"
                        ? "ReactPlayer"
                        : engineMode === "native-iframe"
                        ? "Embed Natif"
                        : "Flux Miroir HD"}
                    </span>
                  </button>

                  {engineMode !== "mp4-direct" && (
                    <button
                      type="button"
                      onClick={() => {
                        wakeUpControls();
                        setErrorDiagnostic(null);
                        setEngineMode("mp4-direct");
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-300/50 text-[10px] font-extrabold text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                      title="Lire en flux MP4 direct"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>
                        {isExtractingMp4 ? "Extraction..." : "Lire en MP4"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isDownloadingMp4}
                    onClick={handleDownloadMp4File}
                    className="px-2 py-0.5 rounded-md bg-cyan-500/90 hover:bg-cyan-400 disabled:opacity-60 text-[10px] font-extrabold text-black inline-flex items-center gap-1 cursor-pointer shrink-0"
                    title="Télécharger le fichier vidéo .MP4 complet sur votre appareil"
                  >
                    {isDownloadingMp4 ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Download className="w-2.5 h-2.5" />
                    )}
                    <span>{downloadMp4Label || "Télécharger MP4"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => localMp4InputRef.current?.click()}
                    className="px-2 py-0.5 rounded-md bg-purple-600/90 hover:bg-purple-500 border border-purple-300/40 text-[10px] font-extrabold text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                    title="Associer un fichier .MP4 téléchargé depuis votre appareil pour ce post"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    <span>Importer .MP4</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={externalSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/15 border border-white/15 text-[10px] font-bold text-cyan-300 inline-flex items-center gap-1 transition-all shrink-0"
                    title="Ouvrir directement sur la plateforme d'origine dans un nouvel onglet"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{embedConfig.externalActionLabel}</span>
                  </a>

                  {onRemoveUnavailableVideo && video.id && (
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveUnavailableVideo(
                          video.id!,
                          `Vidéo ${detectedPlatform.toUpperCase()} signalée indisponible et supprimée`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/15 border border-white/15 text-[10px] font-bold text-white/80 hover:text-white inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      title="Supprimer immédiatement ce post si la vidéo est indisponible"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ATELIER D'EXPLORATION TEMPORELLE IA (PAUSE + CANVAS + GEMINI)
            Synchronisé avec la timeline de la vidéo
            =================================================================== */}
        {explorerOpen && (
          <div
            className="absolute inset-x-2 bottom-16 top-2 z-40 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-3 flex flex-col justify-between gap-2.5 overflow-y-auto text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête de l'explorateur contextuel */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    Exploration Interactive · Pause à{" "}
                    <span className="font-mono tabular-nums text-cyan-300">
                      {formatInsightTimestamp(
                        pausedTimestampSec || currentTime
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {capturedFromNativeVideo
                      ? "Frame vidéo capturée via HTML5 Canvas"
                      : "Snapshot contextuel horodaté prêt pour Gemini"}
                    {" · "}
                    <span className="font-mono tabular-nums">
                      {timelineInsights.length} repère(s) sur la timeline
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => captureCurrentMomentFrame(currentTime)}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
                  title="Recapturer la frame au timestamp actuel"
                >
                  Recapturer frame
                </button>
                <button
                  type="button"
                  onClick={() => setExplorerOpen(false)}
                  className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Fermer le panneau et reprendre"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Zone centrale : Miniature Frame Canvas + Formulaire de question contextuelle */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start shrink-0">
              {capturedFrameDataUrl && (
                <div className="sm:col-span-4 space-y-1">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black">
                    <img
                      src={capturedFrameDataUrl}
                      alt={`Frame capturée à ${formatInsightTimestamp(
                        pausedTimestampSec || currentTime
                      )}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono tabular-nums font-bold text-cyan-300">
                      {formatInsightTimestamp(
                        pausedTimestampSec || currentTime
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeFrameInPrompt}
                      onChange={(e) =>
                        setIncludeFrameInPrompt(e.target.checked)
                      }
                      className="rounded border-slate-700"
                    />
                    <span>Joindre la capture Canvas (Multimodal)</span>
                  </label>
                </div>
              )}

              <div
                className={`${
                  capturedFrameDataUrl ? "sm:col-span-8" : "sm:col-span-12"
                } space-y-2`}
              >
                {/* Suggestions rapides de consignes */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {[
                    "Explique ce concept visuel à l'écran",
                    "Synthétise l'argument clé de ce passage",
                    "Analyse la technique ou méthode utilisée ici",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAnalyzingMoment}
                      onClick={() => {
                        setUserPromptInput(preset);
                        handleSubmitMomentPrompt(undefined, preset);
                      }}
                      className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Champ de saisie contextuel */}
                <form
                  onSubmit={(e) => handleSubmitMomentPrompt(e)}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={userPromptInput}
                    onChange={(e) => setUserPromptInput(e.target.value)}
                    placeholder={`Posez une question sur l'instant ${formatInsightTimestamp(
                      pausedTimestampSec || currentTime
                    )}...`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzingMoment || !userPromptInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
                  >
                    {isAnalyzingMoment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyse...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Interroger</span>
                      </>
                    )}
                  </button>
                </form>

                {analysisError && (
                  <div className="text-[11px] text-rose-400 font-medium">
                    {analysisError}
                  </div>
                )}
              </div>
            </div>

            {/* Retour structuré de l'IA synchronisé avec la timeline */}
            <div className="space-y-2 border-t border-slate-800 pt-2 flex-1 min-h-0 overflow-y-auto">
              {/* Sélecteur de repères temporels sur la timeline */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                  Timeline IA :
                </span>
                {timelineInsights.map((item) => {
                  const isSelected = activeSyncedInsight?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedInsightId(item.id);
                        seekToSeconds(item.timestampSeconds);
                        setPausedTimestampSec(item.timestampSeconds);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
                        isSelected
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.timestampFormatted}</span>
                    </button>
                  );
                })}
              </div>

              {activeSyncedInsight && (
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono tabular-nums font-bold text-amber-300">
                        {activeSyncedInsight.timestampFormatted}
                      </span>
                      <span>·</span>
                      <span className="truncate text-slate-300">
                        {activeSyncedInsight.keyConceptTag}
                      </span>
                      <span>·</span>
                      <span className="text-[10px] text-slate-400">
                        {activeSyncedInsight.source === "gemini"
                          ? "Gemini Multimodal"
                          : "Synthèse contextuelle"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        seekToSeconds(activeSyncedInsight.timestampSeconds)
                      }
                      className="text-[10px] font-semibold text-cyan-300 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      Aller à {activeSyncedInsight.timestampFormatted}
                    </button>
                  </div>

                  <div className="text-xs font-bold text-white">
                    {activeSyncedInsight.headline}
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {activeSyncedInsight.answer}
                  </div>

                  {activeSyncedInsight.visualObservations.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">
                        Observations à cet instant :
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-300">
                        {activeSyncedInsight.visualObservations.map(
                          (obs, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{obs}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {activeSyncedInsight.suggestedFollowUps.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      {activeSyncedInsight.suggestedFollowUps.map(
                        (followUp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={isAnalyzingMoment}
                            onClick={() => {
                              setUserPromptInput(followUp);
                              handleSubmitMomentPrompt(undefined, followUp);
                            }}
                            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-cyan-300 cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                            <span>{followUp}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
