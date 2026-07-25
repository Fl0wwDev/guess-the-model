"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Sketchfab?: any;
  }
}

const API_SRC = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";

/** Load the Sketchfab Viewer API script once. */
function loadApi(): Promise<any> {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  return new Promise((resolve, reject) => {
    let s = document.querySelector<HTMLScriptElement>("script[data-sketchfab]");
    if (!s) {
      s = document.createElement("script");
      s.src = API_SRC;
      s.async = true;
      s.dataset.sketchfab = "1";
      document.head.appendChild(s);
    }
    if (window.Sketchfab) return resolve(window.Sketchfab);
    s.addEventListener("load", () => resolve(window.Sketchfab));
    s.addEventListener("error", reject);
  });
}

type Props = {
  uid: string;
  title?: string;
  /** Pull the camera back by this factor on load (1 = author's framing). */
  zoomOut?: number;
  className?: string;
};

/**
 * Sketchfab viewer via the Viewer API — Sketchfab renders/streams at full
 * quality (no local GLB, no lag). The API lets us **pull the camera back** on
 * load so models don't start uncomfortably zoomed-in (their default framing is
 * often too tight). Falls back to a plain iframe embed if the API is blocked.
 */
export function SketchfabEmbed({
  uid,
  title = "Modèle 3D",
  zoomOut = 0.7,
  className,
}: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const iframe = ref.current;
    if (!iframe) return;

    const fallback = () => {
      if (!cancelled && iframe) {
        iframe.src = `https://sketchfab.com/models/${uid}/embed?ui_theme=light&autostart=1&preload=1&dnt=1`;
        setLoaded(true);
      }
    };

    loadApi()
      .then((Sketchfab) => {
        if (cancelled || !iframe) return;
        const client = new Sketchfab(iframe);
        client.init(uid, {
          autostart: 1,
          preload: 1,
          ui_theme: "light",
          ui_infos: 1,
          ui_controls: 1,
          ui_stop: 0,
          ui_annotations: 0,
          autospin: 0.2,
          dnt: 1,
          success(api: any) {
            if (cancelled) return;
            api.start();
            api.addEventListener("viewerready", () => {
              if (cancelled) return;
              setLoaded(true);
              api.getCameraLookAt((err: any, camera: any) => {
                if (err || cancelled) return;
                const p = camera.position;
                const t = camera.target;
                const eye = [
                  t[0] + (p[0] - t[0]) * zoomOut,
                  t[1] + (p[1] - t[1]) * zoomOut,
                  t[2] + (p[2] - t[2]) * zoomOut,
                ];
                api.setCameraLookAt(eye, t, 1.2);
              });
            });
          },
          error: fallback,
        });
      })
      .catch(fallback);

    return () => {
      cancelled = true;
    };
  }, [uid, zoomOut]);

  return (
    <div className={`relative bg-[#eceae7] ${className ?? ""}`}>
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-pulse text-xs uppercase tracking-[0.3em] text-neutral-400">
            Chargement du modèle 3D…
          </span>
        </div>
      )}
      <iframe
        ref={ref}
        key={uid}
        title={title}
        allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
