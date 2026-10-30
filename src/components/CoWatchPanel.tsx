import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TimelineAiInsight,
  TimelineInsightsService,
  formatInsightTimestamp,
} from "../services/timelineInsightsService";
import {
  Users,
  Send,
  Radio,
  Sparkles,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

interface CoWatchParticipant {
  clientId: string;
  name: string;
  color: string;
  joinedAt: number;
}

interface CoWatchChatMessage {
  id: string;
  author: string;
  color: string;
  text: string;
  timestampSeconds: number;
  createdAt: string;
  isAiResponse?: boolean;
}

interface CoWatchPanelProps {
  video: {
    id: number;
    title: string;
    domain?: string;
    subdomain?: string;
  };
  playing: boolean;
  currentTime: number;
  insights: TimelineAiInsight[];
  capturedFrameDataUrl?: string;
  onRemotePlaybackSync: (playing: boolean, currentTime: number) => void;
  onRemoteInsightReceived: (insight: TimelineAiInsight) => void;
}

const USER_COLORS = ["#38bdf8", "#a3e635", "#f59e0b", "#f43f5e", "#a855f7"];

export const CoWatchPanel: React.FC<CoWatchPanelProps> = ({
  video,
  playing,
  currentTime,
  insights,
  capturedFrameDataUrl,
  onRemotePlaybackSync,
  onRemoteInsightReceived,
}) => {
  const [roomId, setRoomId] = useState<string>(`orbit-salon-${video.id}`);
  const [userName, setUserName] = useState<string>("Valentin R.");
  const [connected, setConnected] = useState<boolean>(false);
  const [participants, setParticipants] = useState<CoWatchParticipant[]>([]);
  const [messages, setMessages] = useState<CoWatchChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAskingCollectiveAi, setIsAskingCollectiveAi] =
    useState<boolean>(false);
  const [copiedRoom, setCopiedRoom] = useState<boolean>(false);
  const [lastSyncBanner, setLastSyncBanner] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(
    `client-${Math.random().toString(36).slice(2, 9)}`
  );
  const userColorRef = useRef<string>(
    USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );
  const isApplyingRemoteRef = useRef<boolean>(false);

  const connectToRoom = useCallback(
    (targetRoomId: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${proto}//${window.location.host}/ws/cowatch`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(
          JSON.stringify({
            type: "room:join",
            roomId: targetRoomId,
            clientId: clientIdRef.current,
            name: userName,
            color: userColorRef.current,
            videoId: video.id,
            videoTitle: video.title,
            currentTime: Math.floor(currentTime),
            initialInsights: insights,
          })
        );
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(String(evt.data));
          if (data.type === "room:state" && data.state) {
            setParticipants(
              Array.isArray(data.state.participants)
                ? data.state.participants
                : []
            );
            setMessages(
              Array.isArray(data.state.chatMessages)
                ? data.state.chatMessages
                : []
            );
            if (Array.isArray(data.state.sharedInsights)) {
              data.state.sharedInsights.forEach((ins: TimelineAiInsight) => {
                if (ins && ins.id) onRemoteInsightReceived(ins);
              });
            }
          } else if (
            data.type === "user:joined" ||
            data.type === "user:left"
          ) {
            if (Array.isArray(data.participants)) {
              setParticipants(data.participants);
            }
          } else if (data.type === "playback:synced") {
            isApplyingRemoteRef.current = true;
            onRemotePlaybackSync(
              Boolean(data.playing),
              Number(data.currentTime) || 0
            );
            setLastSyncBanner(
              `${data.actorName || "Un membre"} a ${
                data.playing ? "relancé la lecture" : "mis en pause"
              } à ${formatInsightTimestamp(Number(data.currentTime) || 0)}`
            );
            window.setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 400);
          } else if (data.type === "insight:created" && data.insight) {
            onRemoteInsightReceived(data.insight as TimelineAiInsight);
          } else if (data.type === "chat:message" && data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
      };
    },
    [
      userName,
      video.id,
      video.title,
      currentTime,
      insights,
      onRemotePlaybackSync,
      onRemoteInsightReceived,
    ]
  );

  useEffect(() => {
    connectToRoom(roomId);
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  // Diffuser automatiquement les changements locaux de lecture/pause au salon
  useEffect(() => {
    if (isApplyingRemoteRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "playback:sync",
          playing,
          currentTime: Math.floor(currentTime),
        })
      );
    }
  }, [playing]);

  const handleBroadcastCurrentTime = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "playback:sync",
          playing,
          currentTime: Math.floor(currentTime),
        })
      );
      setLastSyncBanner(
        `Position ${formatInsightTimestamp(currentTime)} synchronisée avec le salon.`
      );
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const msgObj: CoWatchChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: userName,
      color: userColorRef.current,
      text: trimmed,
      timestampSeconds: Math.floor(currentTime),
      createdAt: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Optimistic update + idempotent server broadcast
    setMessages((prev) => [...prev, msgObj]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat:send",
          ...msgObj,
        })
      );
    }
    setChatInput("");
  };

  const handleAskCollectiveGemini = async () => {
    const question =
      chatInput.trim() ||
      "Synthétise les points clés de cette séquence pour notre salon de co-visionnage.";
    if (isAskingCollectiveAi) return;

    setIsAskingCollectiveAi(true);
    try {
      const created = await TimelineInsightsService.analyzePausedMoment({
        videoId: video.id,
        videoTitle: video.title,
        domain: video.domain,
        subdomain: video.subdomain,
        timestampSeconds: Math.floor(currentTime),
        prompt: question,
        frameDataUrl: capturedFrameDataUrl,
        authorName: userName,
      });

      onRemoteInsightReceived(created);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "insight:broadcast",
            insight: created,
          })
        );
        const aiChatMsg: CoWatchChatMessage = {
          id: `ai-${created.id}`,
          author: "Gemini Co-Watch IA",
          color: "#38bdf8",
          text: `[${created.timestampFormatted}] ${created.headline} — ${created.answer}`,
          timestampSeconds: created.timestampSeconds,
          createdAt: created.createdAt,
          isAiResponse: true,
        };
        setMessages((prev) => [...prev, aiChatMsg]);
        wsRef.current.send(
          JSON.stringify({
            type: "chat:send",
            ...aiChatMsg,
          })
        );
      }
      setChatInput("");
    } finally {
      setIsAskingCollectiveAi(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col gap-3">
      {/* En-tête du salon WebSocket temps réel */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span className="text-xs font-bold text-white">
            Salon Co-Visionnage Temps Réel
          </span>
          <span className="text-[11px] font-mono text-cyan-300">
            ({participants.length} participant
            {participants.length > 1 ? "s" : ""})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            aria-label="Identifiant du salon"
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 w-36 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopiedRoom(true);
              setTimeout(() => setCopiedRoom(false), 1800);
            }}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            title="Copier le code du salon"
          >
            {copiedRoom ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleBroadcastCurrentTime}
            className="px-2.5 py-1 rounded bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/40 text-cyan-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <Radio className="w-3 h-3" />
            <span>Sync {formatInsightTimestamp(currentTime)}</span>
          </button>
        </div>
      </div>

      {/* Liste des participants présents */}
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Votre pseudo"
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-white w-28 outline-none"
        />
        {participants.map((p) => (
          <span
            key={p.clientId}
            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 inline-flex items-center gap-1.5"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.name}</span>
          </span>
        ))}
      </div>

      {lastSyncBanner && (
        <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-cyan-300">
          {lastSyncBanner}
        </div>
      )}

      {/* Fil de discussion collaboratif + Réponses IA partagées */}
      <div className="h-44 overflow-y-auto rounded-lg bg-slate-900/50 border border-slate-800 p-2.5 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-lg text-xs ${
              m.isAiResponse
                ? "bg-cyan-950/40 border border-cyan-400/30 text-slate-100"
                : "bg-slate-900/90 text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-0.5">
              <span className="font-bold" style={{ color: m.color }}>
                {m.author}
              </span>
              <span className="font-mono tabular-nums">
                ⏱ {formatInsightTimestamp(m.timestampSeconds)} · {m.createdAt}
              </span>
            </div>
            <p className="leading-relaxed">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Saisie collective : Message au salon ou Question collective à Gemini */}
      <form onSubmit={handleSendChatMessage} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Annoter en direct ou poser une question collective à l'IA..."
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Envoyer</span>
          </button>
          <button
            type="button"
            onClick={handleAskCollectiveGemini}
            disabled={isAskingCollectiveAi}
            className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            {isAskingCollectiveAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>IA Collective</span>
          </button>
        </div>
      </form>
    </div>
  );
};
