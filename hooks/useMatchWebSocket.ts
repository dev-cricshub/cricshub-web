import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchMatchState } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function useMatchWebSocket(matchId: string) {
  const [matchState, setMatchState] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState<string>("none");

  useEffect(() => {
    if (!matchId) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket");

      // Listen for Live Score Updates
      stompClient.subscribe(`/topic/match/${matchId}`, async (msg) => {
        try {
          const parsed = JSON.parse(msg.body);

          // Unwrap the payload and eventName
          const eventName = parsed.eventName;
          const data = parsed.payload ? parsed.payload : parsed;

          // Only process match-state related events
          if (
            !eventName || // Fallback just in case backend hasn't updated yet
            eventName === "live-score-board" ||
            eventName === "ball-update" ||
            eventName === "undo-ball-update" ||
            eventName === "innings-complete" ||
            eventName === "match-complete"
          ) {
            // 🔥 Anti-Crash Check: Is it the FULL MatchState?
            if (data && data.team1 && data.team2) {
              setMatchState(data);
            } else {
              // It's a partial DTO update! Fetch the full state to prevent UI crash.
              console.log(
                "Received partial update, fetching full MatchState safely...",
              );
              const fullState = await fetchMatchState(matchId);
              setMatchState(fullState.data || fullState);
            }
          }
        } catch (err) {
          console.error("Error parsing match WebSocket message:", err);
        }
      });

      // Listen for OBS Banner Overlay Updates
      stompClient.subscribe(`/topic/stream/${matchId}`, (msg) => {
        try {
          const parsed = JSON.parse(msg.body);
          // Safely handle both wrapped and unwrapped for Stream updates too
          const payload = parsed.payload ? parsed.payload : parsed;

          if (payload && payload.activeBanner) {
            setActiveBanner(payload.activeBanner);
          }
        } catch (err) {
          console.error("Error parsing stream WebSocket message:", err);
        }
      });
    };

    stompClient.activate();

    // Cleanup on unmount
    return () => {
      stompClient.deactivate();
    };
  }, [matchId]);

  return { matchState, activeBanner };
}
