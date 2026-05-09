"use client";

import type { ConnectionStatus, GameSnapshot } from "@repo/types";
import { useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { spectatingAgentAtom, gameSnapshotAtom } from "@/lib/store";
import { advanceCamera, drawFrame, pickCameraTarget } from "../lib/renderer";

const MAX_DEVICE_PIXEL_RATIO = 1.5;

const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:3001";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectatorRef = useRef<string | null>(null);
  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const setGameSnapshot = useSetAtom(gameSnapshotAtom);
  const snapshotRef = useRef<GameSnapshot | null>(null);
  const [, setConnectionStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const tile = new Image();
    tile.src = "/images/tile.png";

    const circle = new Image();
    circle.src = "/images/circle.png";

    const shadow = new Image();
    shadow.src = "/images/white-shadow.png";

    const eyeWhite = new Image();
    eyeWhite.src = "/images/eye-white.png";

    const eyeBlack = new Image();
    eyeBlack.src = "/images/eye-black.png";

    let viewport = { width: 0, height: 0, ratio: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO
      );
      viewport = { width, height, ratio };

      const targetW = Math.floor(width * ratio);
      const targetH = Math.floor(height * ratio);
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let animationFrame = 0;

    const renderLatest = (snapshot: GameSnapshot) => {
      const camera = pickCameraTarget(snapshot, spectatorRef.current);

      if (camera.followingId !== spectatorRef.current) {
        spectatorRef.current = camera.followingId;
        setSpectatingAgent(camera.followingId);
      }

      advanceCamera(camera, viewport, snapshot.world);
      drawFrame(
        ctx,
        viewport,
        snapshot,
        camera,
        tile,
        circle,
        shadow,
        eyeWhite,
        eyeBlack
      );
    };

    setConnectionStatus("connecting");

    const socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
      socket.send(JSON.stringify({ type: "hello" }));
    });

    socket.addEventListener("message", (event) => {
      try {
        const game = JSON.parse(event.data) as GameSnapshot;
        snapshotRef.current = game;
        setGameSnapshot(game);
        animationFrame = window.requestAnimationFrame(() => renderLatest(game));
      } catch {
        return;
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      socket.close();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      socket.close();
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
