"use client";

import type { GameSnapshot, ServerMessage } from "@repo/types";
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { advanceCamera, drawFrame, pickCameraTarget } from "@/lib/renderer";
import {
  spectatingAgentAtom,
  gameSnapshotAtom,
  connectionStatusAtom,
  matchWinnerAtom,
  gameMetadataAtom,
  matchStartCountdownAtom,
} from "@/lib/store";

const MAX_DEVICE_PIXEL_RATIO = 1.5;

const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:3001";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectatorRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const spectatingAgent = useAtomValue(spectatingAgentAtom);

  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const setGameSnapshot = useSetAtom(gameSnapshotAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const setMatchWinner = useSetAtom(matchWinnerAtom);
  const setGameMetadata = useSetAtom(gameMetadataAtom);
  const setMatchStartCountdown = useSetAtom(matchStartCountdownAtom);

  useEffect(() => {
    spectatorRef.current = spectatingAgent;
  }, [spectatingAgent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: false });
    if (!canvas || !ctx) return;

    let viewport = { width: 0, height: 0, ratio: 0 };
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      viewport = { width, height, ratio };

      const targetW = Math.floor(width * ratio);
      const targetH = Math.floor(height * ratio);
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
    };

    const cancelRender = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const renderGame = (snapshot: GameSnapshot) => {
      const camera = pickCameraTarget(snapshot, spectatorRef.current);
      if (camera.followingId !== spectatorRef.current) {
        spectatorRef.current = camera.followingId;
        setSpectatingAgent(camera.followingId);
      }
      advanceCamera(camera, viewport, snapshot.world);
      drawFrame(ctx, viewport, snapshot, camera);
    };

    setConnectionStatus("connecting");
    const socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case "snapshot":
            setGameSnapshot(message.data);
            cancelRender();
            animationFrame = window.requestAnimationFrame(() => renderGame(message.data));
            break;

          case "status":
            setMatchWinner(null);
            setGameMetadata(message.data);
            if (message.data.status === "LIVE") {
              setMatchStartCountdown(null);
              if (audioRef.current?.paused) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            } else {
              setGameSnapshot(null);
              ctx.reset();
              audioRef.current?.pause();
              setMatchStartCountdown(message.data.remainingSeconds ?? null);
            }
            break;

          case "winner":
            setMatchWinner(message.data);
            setGameSnapshot(null);
            ctx.reset();
            audioRef.current?.pause();
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      socket?.close();
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      cancelRender();
      socket?.close();
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="block h-full w-full bg-background" />
      <audio ref={audioRef} src="/music.mp3" loop />
    </>
  );
}
