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
  /**
   * Multiplies the author's saved camera distance on load. `< 1` moves the eye
   * CLOSER to the subject, `> 1` pulls it BACK. Default 0.7 = the museum's
   * tighter editorial framing. Pass 1 to keep the author's framing untouched.
   */
  cameraDistance?: number;
  /** Sketchfab chrome theme (its own UI, not the 3D background). */
  uiTheme?: "light" | "dark";
  /** Continuous slow spin, in Sketchfab units (0 = off). */
  autospin?: number;
  /** Play Sketchfab's animated camera entrance. Off = show the model at once. */
  entranceAnimation?: boolean;
  /** Cap every texture's longest side, in px (power of two). Lower = faster boot. */
  maxTextureSize?: number;
  /** Fires with the uid whose viewer has just rendered its first frame. */
  onReady?: (uid: string) => void;
  className?: string;
};

/**
 * Sketchfab viewer via the Viewer API — Sketchfab renders/streams at full
 * quality (no local GLB, no lag). The API lets us reframe the camera on load
 * (authors' saved framings are wildly inconsistent) and tells us when the first
 * frame is up, so callers can crossfade a poster over the boot time. Falls back
 * to a plain iframe embed if the API script is blocked.
 *
 * ⚠️ Only **free-tier** embed parameters are used here. Per Sketchfab's own
 * parameter reference every `ui_*` option except `ui_stop` and `ui_theme` is
 * gated behind a **Premium** plan, and the ToS additionally forbids hiding the
 * watermark below Premium. So: no `ui_infos: 0` (the model-name bar stays — it
 * also carries the CC attribution), no `ui_controls: 0`, no `ui_annotations: 0`
 * (the free `annotations_visible: 0` does that job), no `transparent: 1` (Pro).
 * Consequence for the quiz: the viewer WILL show the model's name, so a
 * Sketchfab embed cannot host a "guess the model" question as-is.
 * `preload` stays 0 — Sketchfab documents `preload: 1` as not recommended
 * (slower time-to-interaction, known to crash mobile Safari).
 */
export function SketchfabEmbed({
  uid,
  title = "Modèle 3D",
  cameraDistance = 0.7,
  uiTheme = "light",
  autospin = 0.2,
  entranceAnimation = true,
  maxTextureSize,
  onReady,
  className,
}: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  // Which uid is actually on screen — derived, so switching model implicitly
  // goes back to "not loaded" without resetting state from an effect.
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const loaded = loadedUid === uid;

  // Keep the callback in a ref so a re-rendering parent never re-inits the viewer.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let cancelled = false;
    /** Our Sketchfab instance, kept for teardown (see the cleanup below). */
    let instance: any = null;
    const iframe = ref.current;
    if (!iframe) return;

    const options: Record<string, string | number> = {
      autostart: 1,
      preload: 0,
      camera: entranceAnimation ? 1 : 0,
      ui_stop: 0,
      annotations_visible: 0,
      dof_circle: 0,
      autospin,
      dnt: 1,
      ...(uiTheme === "dark" ? { ui_theme: "dark" } : {}),
      ...(maxTextureSize ? { max_texture_size: maxTextureSize } : {}),
    };

    const fallback = () => {
      if (cancelled || !iframe) return;
      const qs = new URLSearchParams(
        Object.entries(options).map(([k, v]) => [k, String(v)])
      );
      iframe.src = `https://sketchfab.com/models/${uid}/embed?${qs}`;
      setLoadedUid(uid);
      onReadyRef.current?.(uid);
    };

    loadApi()
      .then((Sketchfab) => {
        if (cancelled || !iframe) return;
        instance = new Sketchfab(iframe);
        instance.init(uid, {
          ...options,
          success(api: any) {
            if (cancelled) return;
            api.start();
            api.addEventListener("viewerready", () => {
              if (cancelled) return;
              setLoadedUid(uid);
              onReadyRef.current?.(uid);
              if (cameraDistance === 1) return;
              api.getCameraLookAt((err: any, camera: any) => {
                if (err || cancelled) return;
                const p = camera.position;
                const t = camera.target;
                const eye = [
                  t[0] + (p[0] - t[0]) * cameraDistance,
                  t[1] + (p[1] - t[1]) * cameraDistance,
                  t[2] + (p[2] - t[2]) * cameraDistance,
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
      // sketchfab-viewer-1.12.1 removes its own bootstrap `message` listener
      // once the handshake lands, but NEVER the API client's — and it only
      // unbinds a client when the SAME Sketchfab instance is re-inited, which
      // it also logs as unsupported. Creating one instance per model (the
      // supported flow) therefore leaks one window listener per car viewed —
      // 118 of them on a full pass through the garage. Unbind it ourselves.
      // Version-pinned private field, optional-chained: if a future bundle
      // renames it we silently fall back to the old (leaky) behaviour instead
      // of throwing.
      const bound = instance?._client?._serverReceiveMessageBinded;
      if (bound) window.removeEventListener("message", bound);
    };
  }, [uid, cameraDistance, uiTheme, autospin, entranceAnimation, maxTextureSize]);

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
