import { SEED_50_VIDEOS } from "./seedVideos50";

export interface OrbitDomain {
  id: number;
  icon: string;
  name: string;
  affinity: number;
  secret: boolean;
  keywords: string[];
  subs: string[];
}

export type DebateStance = "pour" | "nuance" | "source";

export interface VideoComment {
  author: string;
  text: string;
  lang?: string;
  translatedText?: string;
  // Fonctionnalité 19 : Débat Structuré (Pour / Contre & Nuances / Sources & Vérifications)
  stance?: DebateStance;
  sourceUrl?: string;
  verifiedLabel?: string;
  timestampSeconds?: number;
  timestampFormatted?: string;
}

export type ReactionType = "pepite" | "choc" | "genial" | "beau" | "coeur";

export interface LiveReactionOption {
  id: ReactionType;
  emoji: string;
  label: string;
  accent: string;
}

export const LIVE_REACTIONS: LiveReactionOption[] = [
  { id: "pepite", emoji: "🔥", label: "Pépite", accent: "#ffab00" },
  { id: "choc", emoji: "⚡", label: "Choc", accent: "#00e5ff" },
  { id: "genial", emoji: "🧠", label: "Génial", accent: "#a855f7" },
  { id: "beau", emoji: "🎨", label: "Beau", accent: "#00e676" },
  { id: "coeur", emoji: "❤️", label: "Coup de cœur", accent: "#ff3d71" },
];

export interface VideoHighlightMoment {
  id: string;
  reactionId?: ReactionType;
  emoji: string;
  label: string;
  timestampSeconds: number;
  timestampFormatted: string;
  author?: string;
  votes?: number;
}

export interface VideoAiSummary {
  bullets: string[];
  verdict: string;
  estimatedSavedMinutes: number;
}

export type PantheonArchiveEra =
  | "live"
  | "week"
  | "month"
  | "6months"
  | "1year"
  | "founder";

export interface PantheonArchiveEraMeta {
  id: PantheonArchiveEra;
  label: string;
  periodBadge: string;
  description: string;
  isFrozenArchive: boolean;
}

export type GeoRadius = "10km" | "50km" | "region";

export interface GeoZonePreset {
  id: string;
  name: string;
  label10km: string;
  label50km: string;
  labelRegion: string;
  anonymizedHash: string;
}

export interface QuickImportBridgeItem {
  id: string;
  source: "telegram" | "discord" | "whatsapp" | "clipboard";
  sender: string;
  channelName: string;
  rawText: string;
  extractedUrl: string;
  suggestedTitle: string;
  suggestedComment: string;
  detectedDomain: string;
  detectedSubdomain: string;
  receivedAt: string;
}

// Fonctionnalité 16 : Mode 'Portfolio Créateur' sur la Page 2
export type PortfolioCategory =
  | "all"
  | "light-painting"
  | "video"
  | "music"
  | "tech-art";

export interface CreatorPortfolioItem {
  id: string;
  title: string;
  category: Exclude<PortfolioCategory, "all">;
  mediumLabel: string;
  specs: string;
  year: string;
  description: string;
  thumb: string;
  youtubeId?: string;
  externalUrl?: string;
  dimensionsOrDuration: string;
  featured?: boolean;
}

export interface CreatorExternalLink {
  id: string;
  label: string;
  handle: string;
  url: string;
}

export interface OrbitVideo {
  id: number;
  title: string;
  platform: "youtube" | "tiktok" | "instagram" | "twitch" | "facebook";
  ratio: "16-9" | "9-16";
  domain: string;
  subdomain: string;
  user: string;
  isFriend: boolean;
  comment: string;
  score: number;
  votes: number;
  hoursAgo: number;
  youtubeId: string;
  rawUrl: string;
  thumb: string;
  mp4Url?: string;
  hasLocalMp4Blob?: boolean;
  commentsList: VideoComment[];
  // Idée 3 : Badge d'Éclaireur (premiers curateurs)
  isScout?: boolean;
  scoutRank?: number;
  // Idée 4 : Résumé IA des vidéos longues
  aiSummary?: VideoAiSummary;
  durationMinutes?: number;
  // Idée 7 : Participation à un défi hebdomadaire
  challengeTag?: string;
  // Idée 9 : Time-Capsule (timestamp de déverrouillage programmé)
  unlockAt?: number;
  // Idée 11 : Panthéon Historique (Machine à remonter le temps)
  archiveEras?: PantheonArchiveEra[];
  archiveDateLabel?: string;
  certifiedArchive?: boolean;
  // Idée 13 : Radar Géolocalisé Privé (Tendances Locales par zone)
  localGeo?: {
    zoneId: string;
    radius10km: boolean;
    radius50km: boolean;
    region: boolean;
    areaBadge: string;
    localScore: number;
    localVoters: number;
  };
  // Idée 15 : Source d'import rapide (Telegram / Discord / Presse-Papiers)
  importedVia?: "telegram" | "discord" | "whatsapp" | "clipboard" | string;
  // Idée 18 : Réactions Éphémères Flottantes en Direct + Timestamps des moments forts
  highlightMoments?: VideoHighlightMoment[];
  reactionCounts?: Partial<Record<ReactionType | string, number>>;
  sourceConnectorId?: string;
  // Système Algorithmique Autonome de Découverte selon les Goûts
  algoDiscovered?: boolean;
  algoAffinityMatch?: number;
  algoReason?: string;
  algoQueryUsed?: string;
}

export interface SocialConnector {
  id: string;
  name: string;
  desc: string;
  active: boolean;
  realConsentVerified?: boolean;
  importedVideosCount?: number;
  importedChannelsCount?: number;
  importedContactsCount?: number;
  importedProofText?: string;
  importedVideoIds?: number[];
  importedTwinNames?: string[];
  importedChannelList?: { title: string; domain: string; videoCount: number }[];
  affinityDeltas?: Record<string, number>;
  lastSyncedAt?: string;
  methodUsed?: string;
}

export interface CulturalTwin {
  name: string;
  match: number;
  domains: string;
  lastPick: string;
  phone?: string;
  email?: string;
  sourceNetwork?: string;
  isRealImported?: boolean;
}

export interface OrbitProfile {
  name: string;
  initials: string;
  bio: string;
  scoutPoints?: number;
  scoutBadges?: number;
  titleRole?: string;
  contactEmail?: string;
  locationLabel?: string;
  availabilityText?: string;
}

export interface JukeboxTrack {
  id: number;
  videoId: number;
  title: string;
  youtubeId: string;
  domain: string;
  addedBy: string;
  boosts: number;
  thumb: string;
}

export interface JukeboxChatMessage {
  id: number;
  author: string;
  text: string;
  time: string;
}

export interface WeeklyChallenge {
  id: string;
  weekLabel: string;
  title: string;
  description: string;
  targetDomain: string;
  rewardBadge: string;
  participantsCount: number;
  userProgress: number;
  targetCount: number;
}

export type MoodId = "all" | "focus" | "chill" | "energy" | "debate" | "smile";

export interface MoodPreset {
  id: MoodId;
  label: string;
  subtitle: string;
  domains: string[];
  accentColor: string;
}

export const DEFAULT_CREATOR_LINKS: CreatorExternalLink[] = [
  {
    id: "alphabette",
    label: "Écosystème Alphabette",
    handle: "alphabette.fr",
    url: "https://alphabette.fr",
  },
  {
    id: "infoperso",
    label: "Studio & Labo",
    handle: "infoperso.fr",
    url: "https://infoperso.fr",
  },
  {
    id: "github",
    label: "GitHub Open-Source",
    handle: "@valentin-orbit",
    url: "https://github.com",
  },
  {
    id: "instagram",
    label: "Galerie Light Painting",
    handle: "@valentin.light.art",
    url: "https://instagram.com",
  },
  {
    id: "youtube",
    label: "Chaîne Réalisations 4K",
    handle: "Studio Valentin HD",
    url: "https://youtube.com",
  },
];

export const DEFAULT_PORTFOLIO_ITEMS: CreatorPortfolioItem[] = [
  {
    id: "pf-1",
    title: "Série « Calligraphies Nocturnes sur le Littoral » — Pose Longue Pure",
    category: "light-painting",
    mediumLabel: "Light Painting & Optique",
    specs: "Pose unique 28s · f/8 · ISO 100 · Fibres optiques & tubes néon · 0% CGI / 0% IA",
    year: "2026",
    description:
      "Sculpture lumineuse réalisée de nuit face aux étangs méditerranéens en une seule prise de vue mécanique, sans post-traitement génératif.",
    thumb: "https://i.ytimg.com/vi/EmKQsSDlaa4/hqdefault.jpg",
    youtubeId: "EmKQsSDlaa4",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "6000 × 4000 px · Tirage FineArt + Making-of 4K",
    featured: true,
  },
  {
    id: "pf-2",
    title: "Court-Métrage « Horizon Cévenol & Autonomie Solaire »",
    category: "video",
    mediumLabel: "Réalisation Vidéo & Étalonnage",
    specs: "Cinema 4K 60fps · Optiques Anamorphiques 35mm · Étalonnage DaVinci Resolve",
    year: "2026",
    description:
      "Documentaire immersif tourné entre les crêtes cévenoles et le bassin de Thau, explorant le lien entre artisanat local et autonomie énergétique.",
    thumb: "https://i.ytimg.com/vi/WhWc3b3KhnY/hqdefault.jpg",
    youtubeId: "WhWc3b3KhnY",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "14 min 20s · Master ProRes 422 HQ",
    featured: true,
  },
  {
    id: "pf-3",
    title: "Session Live « Boom-Bap Analogique & Synthèse Modulaire »",
    category: "music",
    mediumLabel: "Composition Musicale & Sound Design",
    specs: "MPC Sampler + Eurorack Modulaire · Enregistrement multipiste 96kHz/24-bit",
    year: "2026",
    description:
      "Composition instrumentale mêlant grains vinyles classiques, accords acoustiques et textures modulaires spatialisées pour le cinéma.",
    thumb: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    youtubeId: "jfKfPfyJRdk",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "08 min 45s · Audio Lossless + Captation Live",
    featured: false,
  },
  {
    id: "pf-4",
    title: "Architecture Souveraine « Alphabette & Cartographie Solaire LiDAR 3D »",
    category: "tech-art",
    mediumLabel: "Architecture Logicielle & Visualisation 3D",
    specs: "Nuages de points LiDAR IGN HD · WebGL / Three.js · Cluster Docker Coolify",
    year: "2026",
    description:
      "Conception de l'écosystème unifié Alphabette (15 domaines .fr, SSO centralisé) et moteur de visualisation solaire 3D en temps réel.",
    thumb: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    youtubeId: "aircAruvnKk",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "Architecture Production · 15 Applications Connectées",
    featured: true,
  },
  {
    id: "pf-5",
    title: "Installation Visuelle « Prismes & Réfractions Acoustiques »",
    category: "light-painting",
    mediumLabel: "Light Painting & Scénographie",
    specs: "Pose longue 19s · Prisme optique cristal · Synchronisation flash stroboscopique",
    year: "2025",
    description:
      "Série photographique capturant la décomposition spectrale de faisceaux lumineux projetés à travers des verres optiques anciens.",
    thumb: "https://i.ytimg.com/vi/d4EgbgTm0Bg/hqdefault.jpg",
    youtubeId: "d4EgbgTm0Bg",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "Triptyque HD · Exposition & Galerie",
    featured: false,
  },
  {
    id: "pf-6",
    title: "Direction Artistique & Game Design « Synergies Tactiques »",
    category: "tech-art",
    mediumLabel: "Direction Artistique & Système Interactif",
    specs: "Illustrations vectorielles · Équilibrage mathématique de courbe d'action",
    year: "2025",
    description:
      "Création d'un système complet de cartes stratégiques alliant direction artistique haute couture et mécanique compétitive équilibrée.",
    thumb: "https://i.ytimg.com/vi/UXqq0ZvbOnk/hqdefault.jpg",
    youtubeId: "UXqq0ZvbOnk",
    externalUrl: "https://alphabette.fr",
    dimensionsOrDuration: "Deck 120 Cartes + Prototype Jouable",
    featured: false,
  },
];

export const PANTHEON_ARCHIVE_ERAS: PantheonArchiveEraMeta[] = [
  {
    id: "live",
    label: "Temps Réel (Live)",
    periodBadge: "Flux Actif 24h",
    description: "Classement vivant calculé en temps réel par gravité temporelle.",
    isFrozenArchive: false,
  },
  {
    id: "week",
    label: "Cette semaine",
    periodBadge: "Archive Hebdo · Oct. 2026",
    description: "Instantané figé des pépites ayant dominé les 7 derniers jours.",
    isFrozenArchive: true,
  },
  {
    id: "month",
    label: "Ce mois-ci",
    periodBadge: "Archive Mensuelle · Automne 2026",
    description: "Classement consolidé des meilleures œuvres du mois sur les 15 domaines.",
    isFrozenArchive: true,
  },
  {
    id: "6months",
    label: "Il y a 6 mois",
    periodBadge: "Archive Certifiée · Avril 2026",
    description: "Machine à remonter le temps : les pépites qui régnaient il y a 6 mois.",
    isFrozenArchive: true,
  },
  {
    id: "1year",
    label: "Il y a 1 an",
    periodBadge: "Archive Certifiée · Octobre 2025",
    description: "Capsules historiques : le sommet culturel d'Orbit il y a exactement 1 an.",
    isFrozenArchive: true,
  },
  {
    id: "founder",
    label: "Panthéon Fondateur",
    periodBadge: "Scellé Fondateur · Origines",
    description: "Les œuvres fondatrices intemporelles scellées lors de la genèse des 15 piliers.",
    isFrozenArchive: true,
  },
];

export const GEO_ZONE_PRESETS: GeoZonePreset[] = [
  {
    id: "montpellier-occitanie",
    name: "Montpellier / Littoral / Occitanie",
    label10km: "Montpellier Centre, Lez & Écusson (Rayon 10 km)",
    label50km: "Montpellier · Sète · Cévennes & Littoral (Rayon 50 km)",
    labelRegion: "Grande Région Occitanie / Pyrénées-Méditerranée",
    anonymizedHash: "GEO-HASH-34-MPL-OCC",
  },
  {
    id: "lyon-aura",
    name: "Lyon / Rhône / Auvergne-Rhône-Alpes",
    label10km: "Lyon Presqu'île, Croix-Rousse & Confluence (10 km)",
    label50km: "Grand Lyon · Monts d'Or & Viennois (50 km)",
    labelRegion: "Région Auvergne-Rhône-Alpes",
    anonymizedHash: "GEO-HASH-69-LYN-ARA",
  },
  {
    id: "paris-idf",
    name: "Paris / Petite Couronne / Île-de-France",
    label10km: "Paris Intra-Muros & Seine Créative (10 km)",
    label50km: "Grand Paris · Saclay & Vallée de la Marne (50 km)",
    labelRegion: "Région Île-de-France",
    anonymizedHash: "GEO-HASH-75-PAR-IDF",
  },
];

export const DEFAULT_QUICK_IMPORTS: QuickImportBridgeItem[] = [
  {
    id: "tg-1",
    source: "telegram",
    sender: "@Karim_Beats",
    channelName: "Telegram · Canal Veille Son & Synthés",
    rawText:
      "Regardez cette session modulaire analogique enregistrée en une seule prise ! https://www.youtube.com/watch?v=spUNpyF58BY",
    extractedUrl: "https://www.youtube.com/watch?v=spUNpyF58BY",
    suggestedTitle: "Session Synthé Modulaire & Acoustique — Prise Directe Sans Retouche",
    suggestedComment: "Partagé sur Telegram par @Karim_Beats : grain analogique exceptionnel.",
    detectedDomain: "Musique & Son",
    detectedSubdomain: "Électro & Synthés",
    receivedAt: "Il y a 3 min",
  },
  {
    id: "dc-1",
    source: "discord",
    sender: "Thomas_AI#0404",
    channelName: "Discord · #infra-docker-coolify",
    rawText:
      "Drop du guide complet sur le durcissement UFW + PostgreSQL 16 isolé sous Coolify : https://www.youtube.com/watch?v=Gjnup-PuquQ",
    extractedUrl: "https://www.youtube.com/watch?v=Gjnup-PuquQ",
    suggestedTitle: "Durcissement VPS Ubuntu 24.04, Coolify & Isolation PostgreSQL par Domaine",
    suggestedComment: "Pépite issue du salon Discord #infra-docker-coolify.",
    detectedDomain: "Dev & Open Source",
    detectedSubdomain: "Auto-hébergement",
    receivedAt: "Il y a 11 min",
  },
  {
    id: "wa-1",
    source: "whatsapp",
    sender: "Anne-Sophie",
    channelName: "WhatsApp · Groupe Cercle Culturel",
    rawText:
      "À voir absolument ce soir, un court-métrage poétique en 4K : https://www.youtube.com/watch?v=WhWc3b3KhnY",
    extractedUrl: "https://www.youtube.com/watch?v=WhWc3b3KhnY",
    suggestedTitle: "Spring — Court-Métrage Poétique & Visuel 4K",
    suggestedComment: "Recommandé par Anne-Sophie via WhatsApp pour la séance du soir.",
    detectedDomain: "Cinéma & Séries",
    detectedSubdomain: "Courts-Métrages",
    receivedAt: "Il y a 24 min",
  },
];

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "all",
    label: "Toutes Humeurs (51+)",
    subtitle: "Équilibre naturel de vos 15 domaines",
    domains: [],
    accentColor: "#7c5cff",
  },
  {
    id: "focus",
    label: "Focus & Deep Tech",
    subtitle: "Concentration, code, sciences & souveraineté",
    domains: ["Sciences & Tech", "Dev & Open Source", "Architecture & Design"],
    accentColor: "#00e5ff",
  },
  {
    id: "chill",
    label: "Contemplation & Son",
    subtitle: "Esthétique visuelle, vinyles & grands espaces",
    domains: ["Musique & Son", "Création Numérique", "Arts Visuels & Plastiques", "Nature & Écologie", "Bien-être & Quotidien"],
    accentColor: "#a855f7",
  },
  {
    id: "energy",
    label: "Adrénaline & Stratégie",
    subtitle: "Performance sportive, game design & défis",
    domains: ["Sport & Aventure", "Jeux & Mondes Virtuels"],
    accentColor: "#ff3d71",
  },
  {
    id: "debate",
    label: "Esprit Critique & Histoire",
    subtitle: "Philosophie, civilisations & grandes archives",
    domains: ["Culture & Idées", "Histoire & Civilisations"],
    accentColor: "#ffab00",
  },
  {
    id: "smile",
    label: "Détente & Art de Vivre",
    subtitle: "Stand-up, cinéma d'auteur & gastronomie",
    domains: ["Humour & Scène", "Cinéma & Séries", "Artisanat & Cuisine"],
    accentColor: "#00e676",
  },
];

export const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  {
    id: "defi-s44",
    weekLabel: "Défi Hebdo #44",
    title: "Souveraineté & Artisanat Numérique",
    description:
      "Dénichez 3 vidéos démontrant un savoir-faire local, open-source ou artisanal notées ≥ 9.5/10.",
    targetDomain: "Dev & Open Source",
    rewardBadge: "Éclaireur d'Or · S44",
    participantsCount: 348,
    userProgress: 2,
    targetCount: 3,
  },
  {
    id: "defi-lumiere",
    weekLabel: "Défi Créatif",
    title: "Maîtres de la Lumière & Acoustique",
    description:
      "Partagez 2 performances live ou créations visuelles réalisées sans artifice numérique.",
    targetDomain: "Création Numérique",
    rewardBadge: "Œil de Lynx",
    participantsCount: 215,
    userProgress: 1,
    targetCount: 2,
  },
];

export const DEFAULT_JUKEBOX: JukeboxTrack[] = [
  {
    id: 1,
    videoId: 1201,
    title: "Lofi Hip-Hop Radio & Synthés Analogiques — Session Nocturne",
    youtubeId: "jfKfPfyJRdk",
    domain: "Musique & Son",
    addedBy: "Anne-Sophie",
    boosts: 14,
    thumb: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
  },
  {
    id: 2,
    videoId: 1001,
    title: "Réseaux de Neurones & Architecture Deep Learning expliqués visuellement",
    youtubeId: "aircAruvnKk",
    domain: "Sciences & Tech",
    addedBy: "Nicolas",
    boosts: 11,
    thumb: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
  },
  {
    id: 3,
    videoId: 1403,
    title: "Sculpter la Lumière : Optique, Hologrammes & Light Painting",
    youtubeId: "EmKQsSDlaa4",
    domain: "Création Numérique",
    addedBy: "Babass",
    boosts: 9,
    thumb: "https://i.ytimg.com/vi/EmKQsSDlaa4/hqdefault.jpg",
  },
];

export const DEFAULT_DOMAINS: OrbitDomain[] = [
  { id: 1, icon: "🔭", name: "Sciences & Tech", affinity: 96, secret: false, keywords: ["ia", "ai", "neurone", "llm", "transformer", "math", "physique", "cosmos", "espace", "science", "fourier", "algorithme", "quantique", "jwst"], subs: ["IA & Robotique", "Mathématiques & Logique", "Physique & Cosmos", "Espace & Astronomie", "Biologie & Vivant"] },
  { id: 2, icon: "🎵", name: "Musique & Son", affinity: 95, secret: false, keywords: ["musique", "lofi", "synth", "modulaire", "audio", "concert", "live", "sample", "beat", "guitare", "piano", "acoustique", "mao", "vinyl"], subs: ["Électro & Synthés", "Production & MAO", "Sessions Live", "Instruments & Luthier", "Rap & Boom-Bap", "Classique & Jazz"] },
  { id: 3, icon: "🎬", name: "Cinéma & Séries", affinity: 91, secret: false, keywords: ["film", "cinema", "serie", "realisateur", "court-metrage", "plan", "caméra", "montage", "blender", "scénario", "animation"], subs: ["Réalisation & Plans", "Courts-Métrages", "Analyse Filmique", "Histoire du Cinéma", "Documentaires"] },
  { id: 4, icon: "🎨", name: "Création Numérique", affinity: 94, secret: false, keywords: ["3d", "shader", "vfx", "light painting", "photo", "lumiere", "optique", "motion", "design", "fractale", "procédural", "graphisme"], subs: ["VFX & Shaders", "Motion Design 3D", "Light Painting & Photo", "Design Graphique", "Scénographie"] },
  { id: 5, icon: "🏀", name: "Sport & Aventure", affinity: 86, secret: false, keywords: ["sport", "basket", "nba", "escalade", "montagne", "endurance", "athlé", "course", "aventure", "physique", "stratégie"], subs: ["Collectifs & Stratégie", "Montagne & Escalade", "Endurance & Athlé", "Glisse & Océan", "Analyse Tactique"] },
  { id: 6, icon: "🍲", name: "Artisanat & Cuisine", affinity: 84, secret: false, keywords: ["cuisine", "pain", "levain", "patisserie", "bois", "menuiserie", "artisanat", "recette", "terroir", "gastronomie", "savoir-faire"], subs: ["Pâtisserie & Pain", "Travail du Bois", "Cuisine du Monde", "Terroir & Savoir-Faire", "Forge & Matière"] },
  { id: 7, icon: "🌿", name: "Nature & Écologie", affinity: 88, secret: false, keywords: ["nature", "forêt", "arbre", "océan", "abysse", "permaculture", "jardin", "sol", "écologie", "biodiversité", "climat"], subs: ["Forêts & Biodiversité", "Océans & Abysses", "Permaculture & Jardin", "Climat & Énergie", "Faune Sauvage"] },
  { id: 8, icon: "🗣️", name: "Culture & Idées", affinity: 82, secret: false, keywords: ["philosophie", "société", "média", "langue", "étymologie", "idée", "débat", "entropie", "information", "attention", "lecture"], subs: ["Philosophie", "Société & Médias", "Langues & Étymologie", "Éloquence & Débats", "Littérature"] },
  { id: 9, icon: "🏛️", name: "Architecture & Design", affinity: 80, secret: false, keywords: ["architecture", "design", "urbanisme", "ville", "acoustique", "objet", "habitat", "minimalisme", "espace"], subs: ["Architecture", "Design d'Objet", "Urbanisme & Habitat", "Éco-construction", "Patrimoine"] },
  { id: 10, icon: "💻", name: "Dev & Open Source", affinity: 97, secret: false, keywords: ["dev", "code", "open-source", "docker", "sqlite", "postgresql", "linux", "vps", "coolify", "cybersécurité", "cryptographie", "web", "auto-hébergement"], subs: ["Web & Mobile", "Auto-hébergement", "Logiciels Libres", "Cybersécurité", "Serveurs & Docker"] },
  { id: 11, icon: "♟️", name: "Jeux & Mondes Virtuels", affinity: 79, secret: false, keywords: ["jeu", "game design", "gaming", "indé", "rétrogaming", "ray tracing", "console", "stratégie", "échecs", "level design"], subs: ["Game Design", "Jeux Indépendants", "Rétrogaming", "Stratégie & Échecs", "Simulations"] },
  { id: 12, icon: "🖌️", name: "Arts Visuels & Plastiques", affinity: 85, secret: false, keywords: ["peinture", "sculpture", "musée", "exposition", "pigment", "couleur", "clair-obscur", "dessin", "art plastique"], subs: ["Peinture & Dessin", "Sculpture & Matière", "Expositions & Musées", "BD & Illustration", "Calligraphie"] },
  { id: 13, icon: "🏺", name: "Histoire & Civilisations", affinity: 78, secret: false, keywords: ["histoire", "antiquité", "rome", "archéologie", "civilisation", "anticythère", "alexandrie", "moyen-âge", "technique"], subs: ["Antiquité & Moyen-Âge", "Histoire des Techniques", "Archéologie", "Grandes Explorations", "Archives"] },
  { id: 14, icon: "🎤", name: "Humour & Scène", affinity: 74, secret: false, keywords: ["humour", "stand-up", "sketch", "comédie", "rire", "parodie", "cartoon", "scène", "impro"], subs: ["Sketchs & Parodies", "Classiques de l'Humour", "Stand-Up", "Improvisation", "Satire"] },
  { id: 15, icon: "🌱", name: "Bien-être & Quotidien", affinity: 83, secret: false, keywords: ["bien-être", "chien", "animal", "entraide", "voisin", "minimalisme", "sommeil", "bonheur", "quotidien", "lien social"], subs: ["Animaux & Compagnons", "Entraide & Lien Local", "Minimalisme", "Méditation & Sommeil", "Organisation"] }
];

export interface VerifiedSocialStreamItem {
  domain: string;
  mp4Url: string;
  thumb: string;
  durationSeconds: number;
}

export const VERIFIED_SOCIAL_STREAMS_POOL: VerifiedSocialStreamItem[] = [
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Galaxy_Collision_Animation-_James_Webb_Space_Telescope_Science.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Galaxy_Collision_Animation-_James_Webb_Space_Telescope_Science.webm/960px--Galaxy_Collision_Animation-_James_Webb_Space_Telescope_Science.webm.jpg",
    durationSeconds: 101,
  },
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/James-Webb-Space-Telescope-Deployment-Sequence-_Nominal.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/James-Webb-Space-Telescope-Deployment-Sequence-_Nominal.webm/960px--James-Webb-Space-Telescope-Deployment-Sequence-_Nominal.webm.jpg",
    durationSeconds: 107,
  },
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Animation_Of_Webb%27s_Orbit.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Animation_Of_Webb%27s_Orbit.webm/960px--Animation_Of_Webb%27s_Orbit.webm.jpg",
    durationSeconds: 19,
  },
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Laplacian_Eigenvectors.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Laplacian_Eigenvectors.webm/960px--Laplacian_Eigenvectors.webm.jpg",
    durationSeconds: 10,
  },
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/0/09/Franck-Hertz_experiment_Physics_for_Abitur.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Franck-Hertz_experiment_Physics_for_Abitur.webm/960px--Franck-Hertz_experiment_Physics_for_Abitur.webm.jpg",
    durationSeconds: 432,
  },
  {
    domain: "Sciences & Tech",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Multi-Contact_Balancing_for_Torque-Controlled_Humanoid_Robots.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Multi-Contact_Balancing_for_Torque-Controlled_Humanoid_Robots.webm/500px--Multi-Contact_Balancing_for_Torque-Controlled_Humanoid_Robots.webm.jpg",
    durationSeconds: 277,
  },
  {
    domain: "Musique & Son",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/7/72/Hyperbubble_-_A_Synthesizer_for_Christmas.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Hyperbubble_-_A_Synthesizer_for_Christmas.webm/960px--Hyperbubble_-_A_Synthesizer_for_Christmas.webm.jpg",
    durationSeconds: 119,
  },
  {
    domain: "Musique & Son",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Chitarra_es_preparatorio_strumming_6.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Chitarra_es_preparatorio_strumming_6.webm/330px--Chitarra_es_preparatorio_strumming_6.webm.jpg",
    durationSeconds: 11,
  },
  {
    domain: "Musique & Son",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/La_Argentinita_-_Alegrias_%28ca._1935%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/La_Argentinita_-_Alegrias_%28ca._1935%29.webm/330px--La_Argentinita_-_Alegrias_%28ca._1935%29.webm.jpg",
    durationSeconds: 207,
  },
  {
    domain: "Cinéma & Séries",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/7/79/Blender_Crowd_Simulation.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Blender_Crowd_Simulation.webm/500px--Blender_Crowd_Simulation.webm.jpg",
    durationSeconds: 100,
  },
  {
    domain: "Cinéma & Séries",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Aprenda_Blender_Game_Engine_%28BGE%29_Connosco%21.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Aprenda_Blender_Game_Engine_%28BGE%29_Connosco%21.webm/960px--Aprenda_Blender_Game_Engine_%28BGE%29_Connosco%21.webm.jpg",
    durationSeconds: 789,
  },
  {
    domain: "Création Numérique",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/6/63/Digital_Painting_-_Speed_painting_process_-_Golden_Griffin_Creature_-_Concept_art_in_photoshop.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Digital_Painting_-_Speed_painting_process_-_Golden_Griffin_Creature_-_Concept_art_in_photoshop.webm/960px--Digital_Painting_-_Speed_painting_process_-_Golden_Griffin_Creature_-_Concept_art_in_photoshop.webm.jpg",
    durationSeconds: 353,
  },
  {
    domain: "Création Numérique",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Following_the_Aurora_Borealis_Across_North_America_%28CIRA_2024-09-17_-_nolabels%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Following_the_Aurora_Borealis_Across_North_America_%28CIRA_2024-09-17_-_nolabels%29.webm/960px--Following_the_Aurora_Borealis_Across_North_America_%28CIRA_2024-09-17_-_nolabels%29.webm.jpg",
    durationSeconds: 14,
  },
  {
    domain: "Sport & Aventure",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Wheelchair_basketball_2.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Wheelchair_basketball_2.webm/960px--Wheelchair_basketball_2.webm.jpg",
    durationSeconds: 12,
  },
  {
    domain: "Sport & Aventure",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Wheelchair_basketball_3.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Wheelchair_basketball_3.webm/960px--Wheelchair_basketball_3.webm.jpg",
    durationSeconds: 15,
  },
  {
    domain: "Sport & Aventure",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Wheelchair_basketball_4.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Wheelchair_basketball_4.webm/960px--Wheelchair_basketball_4.webm.jpg",
    durationSeconds: 13,
  },
  {
    domain: "Artisanat & Cuisine",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Afgan_Bread_Production.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Afgan_Bread_Production.webm/330px--Afgan_Bread_Production.webm.jpg",
    durationSeconds: 18,
  },
  {
    domain: "Artisanat & Cuisine",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Making_of_Aikuchi_by_Marc_Newson.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Making_of_Aikuchi_by_Marc_Newson.webm/960px--Making_of_Aikuchi_by_Marc_Newson.webm.jpg",
    durationSeconds: 170,
  },
  {
    domain: "Nature & Écologie",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Waterfall-1013190%2C_Dingle_Peninsula%2C_Co._Kerry%2C_Ireland.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Waterfall-1013190%2C_Dingle_Peninsula%2C_Co._Kerry%2C_Ireland.webm/960px--Waterfall-1013190%2C_Dingle_Peninsula%2C_Co._Kerry%2C_Ireland.webm.jpg",
    durationSeconds: 11,
  },
  {
    domain: "Nature & Écologie",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Waterfall_on_Falls_Creek%2C_south_of_Augusta%2C_Montana_%2852974925584%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Waterfall_on_Falls_Creek%2C_south_of_Augusta%2C_Montana_%2852974925584%29.webm/960px--Waterfall_on_Falls_Creek%2C_south_of_Augusta%2C_Montana_%2852974925584%29.webm.jpg",
    durationSeconds: 21,
  },
  {
    domain: "Nature & Écologie",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/5/54/Halema%CA%BBuma%CA%BBu_lava_lake_USGS_multimediaFile-1585.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Halema%CA%BBuma%CA%BBu_lava_lake_USGS_multimediaFile-1585.webm/960px--Halema%CA%BBuma%CA%BBu_lava_lake_USGS_multimediaFile-1585.webm.jpg",
    durationSeconds: 41,
  },
  {
    domain: "Culture & Idées",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/0/05/Annular_Solar_Eclipse%2C_Reno%2C_NV%2C_USA_05_21_2012.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Annular_Solar_Eclipse%2C_Reno%2C_NV%2C_USA_05_21_2012.webm/960px--Annular_Solar_Eclipse%2C_Reno%2C_NV%2C_USA_05_21_2012.webm.jpg",
    durationSeconds: 92,
  },
  {
    domain: "Culture & Idées",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Solar_eclipse_Jan._2019.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Solar_eclipse_Jan._2019.webm/960px--Solar_eclipse_Jan._2019.webm.jpg",
    durationSeconds: 19,
  },
  {
    domain: "Architecture & Design",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Finland_railway_bridge_train_ride.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Finland_railway_bridge_train_ride.webm/960px--Finland_railway_bridge_train_ride.webm.jpg",
    durationSeconds: 90,
  },
  {
    domain: "Architecture & Design",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Train_ferry_-_Villa_San_Giovanni_%28Battipaglia%E2%80%93Reggio_di_Calabria_railway%2C_Italy%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Train_ferry_-_Villa_San_Giovanni_%28Battipaglia%E2%80%93Reggio_di_Calabria_railway%2C_Italy%29.webm/960px--Train_ferry_-_Villa_San_Giovanni_%28Battipaglia%E2%80%93Reggio_di_Calabria_railway%2C_Italy%29.webm.jpg",
    durationSeconds: 88,
  },
  {
    domain: "Dev & Open Source",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Robot_package_handling.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Robot_package_handling.webm/960px--Robot_package_handling.webm.jpg",
    durationSeconds: 8,
  },
  {
    domain: "Dev & Open Source",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Operation_of_the_%27Spiral_Wave_Discharge%27_plasma_experiment_at_IPP_Greifswald_%281%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Operation_of_the_%27Spiral_Wave_Discharge%27_plasma_experiment_at_IPP_Greifswald_%281%29.webm/960px--Operation_of_the_%27Spiral_Wave_Discharge%27_plasma_experiment_at_IPP_Greifswald_%281%29.webm.jpg",
    durationSeconds: 8,
  },
  {
    domain: "Jeux & Mondes Virtuels",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/d/de/Joaquin_Perkins_blitz_chess_vs_USCF_expert.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Joaquin_Perkins_blitz_chess_vs_USCF_expert.webm/500px--Joaquin_Perkins_blitz_chess_vs_USCF_expert.webm.jpg",
    durationSeconds: 20,
  },
  {
    domain: "Jeux & Mondes Virtuels",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/9/90/Byrne_vs_Fischer_-_The_Game_of_the_Century.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Byrne_vs_Fischer_-_The_Game_of_the_Century.webm/500px--Byrne_vs_Fischer_-_The_Game_of_the_Century.webm.jpg",
    durationSeconds: 108,
  },
  {
    domain: "Arts Visuels & Plastiques",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/9/90/Getting_started_with_fine_art_landscape_painting_-_Adding_Detail.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Getting_started_with_fine_art_landscape_painting_-_Adding_Detail.webm/960px--Getting_started_with_fine_art_landscape_painting_-_Adding_Detail.webm.jpg",
    durationSeconds: 662,
  },
  {
    domain: "Arts Visuels & Plastiques",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Creating_Art_on_Blackrock_Summit_%2834642012564%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Creating_Art_on_Blackrock_Summit_%2834642012564%29.webm/960px--Creating_Art_on_Blackrock_Summit_%2834642012564%29.webm.jpg",
    durationSeconds: 58,
  },
  {
    domain: "Histoire & Civilisations",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Archaeology_Roadshow_2017_%E2%80%93_Harney_County_%2835264035802%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Archaeology_Roadshow_2017_%E2%80%93_Harney_County_%2835264035802%29.webm/960px--Archaeology_Roadshow_2017_%E2%80%93_Harney_County_%2835264035802%29.webm.jpg",
    durationSeconds: 29,
  },
  {
    domain: "Histoire & Civilisations",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/3/39/Two_Orreries_%28Derby_Museum_%26_Art_Gallery%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Two_Orreries_%28Derby_Museum_%26_Art_Gallery%29.webm/500px--Two_Orreries_%28Derby_Museum_%26_Art_Gallery%29.webm.jpg",
    durationSeconds: 23,
  },
  {
    domain: "Humour & Scène",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Cat_Playing_with_Straw_1_2017-06-08.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Cat_Playing_with_Straw_1_2017-06-08.webm/960px--Cat_Playing_with_Straw_1_2017-06-08.webm.jpg",
    durationSeconds: 22,
  },
  {
    domain: "Bien-être & Quotidien",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Larry_the_cat_and_Chlo%C3%A9_playing_%28100111224612%29.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Larry_the_cat_and_Chlo%C3%A9_playing_%28100111224612%29.webm/500px--Larry_the_cat_and_Chlo%C3%A9_playing_%28100111224612%29.webm.jpg",
    durationSeconds: 117,
  },
  {
    domain: "Bien-être & Quotidien",
    mp4Url: "https://upload.wikimedia.org/wikipedia/commons/2/21/Cat_playing_with_a_lizard.webm",
    thumb: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Cat_playing_with_a_lizard.webm/960px--Cat_playing_with_a_lizard.webm.jpg",
    durationSeconds: 14,
  },
];

export function getVerifiedSocialStreamForVideo(
  domain: string,
  seedIndex: number
): VerifiedSocialStreamItem {
  const domainMatches = VERIFIED_SOCIAL_STREAMS_POOL.filter(
    (s) => s.domain === domain
  );
  if (domainMatches.length > 0) {
    return domainMatches[Math.abs(seedIndex) % domainMatches.length];
  }
  return VERIFIED_SOCIAL_STREAMS_POOL[
    Math.abs(seedIndex) % VERIFIED_SOCIAL_STREAMS_POOL.length
  ];
}

export const DEFAULT_VIDEOS: OrbitVideo[] = SEED_50_VIDEOS.map((v, idx) => {
  const balancedPlatforms: Array<"youtube" | "facebook" | "tiktok"> = [
    "youtube",
    "facebook",
    "tiktok",
  ];
  const assignedPlatform = balancedPlatforms[idx % 3];

  if (assignedPlatform === "youtube") {
    return {
      ...v,
      platform: "youtube",
      sourceConnectorId: "youtube",
    };
  }

  const socialStream = getVerifiedSocialStreamForVideo(v.domain, idx);
  const creatorHandle =
    (v.user || "orbit")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "") || "orbit";

  if (assignedPlatform === "facebook") {
    const fbReelId = String(108450000000000 + v.id);
    return {
      ...v,
      platform: "facebook",
      ratio: idx % 2 === 1 ? "9-16" : v.ratio,
      sourceConnectorId: "facebook",
      youtubeId: "",
      rawUrl: `https://www.facebook.com/reel/${fbReelId}`,
      mp4Url: socialStream.mp4Url,
      thumb: socialStream.thumb,
    };
  }

  // TikTok 9:16
  const tiktokVideoId = String(7390000000000000000 + v.id);
  return {
    ...v,
    platform: "tiktok",
    ratio: "9-16",
    sourceConnectorId: "tiktok",
    youtubeId: "",
    rawUrl: `https://www.tiktok.com/@${creatorHandle}/video/${tiktokVideoId}`,
    mp4Url: socialStream.mp4Url,
    thumb: socialStream.thumb,
  };
});

export const DEFAULT_SOCIALS: SocialConnector[] = [
  {
    id: "youtube",
    name: "YouTube (Takeout / API v3 / OAuth2)",
    desc: "Historique watch-history.json, abonnements CSV, playlists & vidéos likées",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 17,
    importedChannelsCount: 18,
    importedContactsCount: 0,
    importedProofText: "Connecté — 17 pépites YouTube & 18 chaînes synchronisées",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Google Takeout + API YouTube v3",
  },
  {
    id: "facebook",
    name: "Facebook & Meta (Historique DYI / Graph API)",
    desc: "Vidéos enregistrées, Reels, Pages suivies, Groupes d'entraide & Archives JSON/HTML",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 17,
    importedChannelsCount: 16,
    importedContactsCount: 12,
    importedProofText: "Connecté — 17 pépites Facebook Reels/Watch & Groupes synchronisés",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Archive Meta DYI + Graph API",
  },
  {
    id: "tiktok",
    name: "TikTok (Données & Favoris)",
    desc: "Formats courts 9:16, favoris user_data.json & comptes suivis",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 17,
    importedChannelsCount: 16,
    importedContactsCount: 0,
    importedProofText: "Connecté — 17 pépites verticales TikTok 9:16 & 16 créateurs suivis",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Export TikTok JSON + Liens",
  },
  {
    id: "instagram",
    name: "Instagram & Reels (Archive Meta)",
    desc: "Reels enregistrés, saved_posts.json, photographie & studios visuels",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 5,
    importedChannelsCount: 5,
    importedContactsCount: 0,
    importedProofText: "Connecté — 5 Reels créatifs & 5 studios suivis",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Centre Comptes Meta + Reels",
  },
  {
    id: "twitch",
    name: "Twitch & X (Twitter)",
    desc: "Lives, VODs, signets X/Twitter & chaînes suivies",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 2,
    importedChannelsCount: 3,
    importedContactsCount: 0,
    importedProofText: "Connecté — 2 VODs live & 3 chaînes suivies",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Twitch Helix API + Archives",
  },
  {
    id: "whatsapp",
    name: "Contacts & WhatsApp",
    desc: "Anne-Sophie, Ronny, Nicolas, Séverine & Babass (Carnet d'adresses)",
    active: true,
    realConsentVerified: true,
    importedVideosCount: 0,
    importedChannelsCount: 0,
    importedContactsCount: 5,
    importedProofText: "Connecté — 5 amis vérifiés (Anne-Sophie, Ronny, Nicolas, Séverine, Babass)",
    lastSyncedAt: "Actif · Temps réel",
    methodUsed: "Cercle d'Amis Orbit (SHA-256 local)",
  },
];

export const DEFAULT_TWINS: CulturalTwin[] = [
  {
    name: "Anne-Sophie (WhatsApp)",
    match: 97,
    domains: "Musique & Son · Tech & IA · Arts Visuels",
    lastPick: "A noté 9.9/10 l'analyse Boom-Bap & l'architecture IA 70B",
    sourceNetwork: "whatsapp",
    isRealImported: true,
  },
  {
    name: "Ronny (Répertoire)",
    match: 94,
    domains: "Arts Visuels & Light Painting · Sport NBA · Humour",
    lastPick: "A commenté la session Light Painting et l'analyse Wembanyama",
    sourceNetwork: "whatsapp",
    isRealImported: true,
  },
  {
    name: "Nicolas (Contact)",
    match: 92,
    domains: "Cinéma & Sci-Fi · Sciences & Astronomie · Gaming",
    lastPick: "Partage la même passion pour Denis Villeneuve, le JWST et le LiDAR",
    sourceNetwork: "whatsapp",
    isRealImported: true,
  },
  {
    name: "Séverine (Contact)",
    match: 90,
    domains: "Voyage & Cévennes · Nature · Cuisine & Terroir",
    lastPick: "A adoré la traversée des Cévennes et les recettes des Halles",
    sourceNetwork: "whatsapp",
    isRealImported: true,
  },
  {
    name: "Babass (WhatsApp)",
    match: 93,
    domains: "Musique & Vinyles · Bricolage & Solaire · Sport",
    lastPick: "A validé le studio autonome LiFePO4 et le classique d'IAM",
    sourceNetwork: "whatsapp",
    isRealImported: true,
  },
];

export function createPlatformCoverSvg(
  platform: "youtube" | "tiktok" | "instagram" | "twitch" | "facebook" | string,
  title = "Pépite Vidéo Partagée",
  subtitle = "Cliquez sur ▶ pour lancer le lecteur intégré"
): string {
  const palette: Record<string, { bg1: string; bg2: string; accent: string; badge: string }> = {
    facebook: {
      bg1: "#09152B",
      bg2: "#102A56",
      accent: "#1877F2",
      badge: "FACEBOOK WATCH / REEL",
    },
    instagram: {
      bg1: "#230B2E",
      bg2: "#4A153B",
      accent: "#E1306C",
      badge: "INSTAGRAM REELS",
    },
    tiktok: {
      bg1: "#091E26",
      bg2: "#1F0D29",
      accent: "#00F2FE",
      badge: "TIKTOK 9:16",
    },
    twitch: {
      bg1: "#180E29",
      bg2: "#2E1654",
      accent: "#9146FF",
      badge: "TWITCH LIVE / CLIP",
    },
    youtube: {
      bg1: "#1F0B0B",
      bg2: "#381212",
      accent: "#FF0033",
      badge: "YOUTUBE HD",
    },
  };
  const cfg = palette[platform] || palette.facebook;
  const safeTitle = (title || "Vidéo partagée sur Orbit")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 62);
  const safeSub = subtitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 70);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${cfg.bg1}"/>
        <stop offset="100%" stop-color="${cfg.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="680" cy="90" r="180" fill="${cfg.accent}" opacity="0.14"/>
    <circle cx="120" cy="380" r="160" fill="${cfg.accent}" opacity="0.1"/>
    <rect x="48" y="42" rx="12" ry="12" width="230" height="34" fill="${cfg.accent}" opacity="0.92"/>
    <text x="163" y="64" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.2">${cfg.badge}</text>
    <text x="48" y="210" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="27" font-weight="800">${safeTitle}</text>
    <text x="48" y="252" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="16" font-weight="600">${safeSub}</text>
    <rect x="48" y="340" rx="10" ry="10" width="275" height="42" fill="#FFFFFF" opacity="0.12"/>
    <text x="185" y="366" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">▶ LECTEUR INTÉGRÉ PRÊT</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getVideoEmbedConfig(video: {
  platform?: string;
  rawUrl?: string;
  youtubeId?: string;
  title?: string;
}): {
  embedUrl: string;
  detectedPlatform: "youtube" | "tiktok" | "instagram" | "twitch" | "facebook";
  platformLabel: string;
  externalActionLabel: string;
  isFacebook: boolean;
} {
  const raw = (video.rawUrl || "").trim();
  const lower = raw.toLowerCase();
  const hasRealFacebookUrl =
    lower.includes("facebook.com") ||
    lower.includes("fb.watch") ||
    lower.includes("fb.com");

  // 1. Native Facebook URL or Facebook platform detection (never falls back to YouTube)
  if (hasRealFacebookUrl || video.platform === "facebook") {
    let cleanFbUrl = raw;
    const hrefMatch = raw.match(/[?&]href=([^&"'\s>]+)/i);
    if (hrefMatch && hrefMatch[1]) {
      try {
        cleanFbUrl = decodeURIComponent(hrefMatch[1]);
      } catch {
        cleanFbUrl = hrefMatch[1];
      }
    } else {
      const httpMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
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

    const targetHref =
      cleanFbUrl &&
      (cleanFbUrl.toLowerCase().includes("facebook.com") ||
        cleanFbUrl.toLowerCase().includes("fb.watch") ||
        cleanFbUrl.toLowerCase().includes("fb.com"))
        ? cleanFbUrl
        : "https://www.facebook.com/watch/";
    return {
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        targetHref
      )}&show_text=false&autoplay=true`,
      detectedPlatform: "facebook",
      platformLabel:
        targetHref.toLowerCase().includes("/reel/") ||
        targetHref.toLowerCase().includes("/share/r/")
          ? "FACEBOOK REEL"
          : "FACEBOOK WATCH",
      externalActionLabel: "Ouvrir sur Facebook ↗",
      isFacebook: true,
    };
  }

  // 2. Instagram detection
  if (
    lower.includes("instagram.com/reel/") ||
    lower.includes("instagram.com/p/") ||
    lower.includes("instagram.com/tv/") ||
    video.platform === "instagram"
  ) {
    const match = raw.match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    const code = match && match[2] ? match[2] : "C8orbit";
    const kind = match && match[1] ? match[1] : "reel";
    return {
      embedUrl: `https://www.instagram.com/${kind}/${code}/embed`,
      detectedPlatform: "instagram",
      platformLabel: "INSTAGRAM REEL",
      externalActionLabel: "Ouvrir sur Instagram ↗",
      isFacebook: false,
    };
  }

  // 3. TikTok detection (never falls back to YouTube)
  if (lower.includes("tiktok.com") || video.platform === "tiktok") {
    const match = raw.match(/\/video\/(\d+)/);
    const tikId = match && match[1] ? match[1] : "7390000000000001001";
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${tikId}`,
      detectedPlatform: "tiktok",
      platformLabel: "TIKTOK 9:16",
      externalActionLabel: "Ouvrir sur TikTok ↗",
      isFacebook: false,
    };
  }

  // 4. YouTube stream embed
  const ytId = video.youtubeId || "aircAruvnKk";
  const detectedPlatform =
    (video.platform as "youtube" | "tiktok" | "instagram" | "twitch" | "facebook") || "youtube";
  return {
    embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    detectedPlatform,
    platformLabel: detectedPlatform === "twitch" ? "TWITCH" : "YOUTUBE",
    externalActionLabel: "Ouvrir sur YouTube ↗",
    isFacebook: false,
  };
}

