'use client';

import {useEffect, useRef} from 'react';

const GLYPHS = ' .,:;i1tfLCG08@';
const POSTER = '/videos/prumo-login-poster.webp';
const FALLBACK = '/images/prumo-forest.webp';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * The actual footage is sampled to a small pixel grid and reconstructed with
 * characters, rather than placing faint text over the original video.
 * While loading (or when autoplay is blocked), the poster is ASCII-rendered too.
 */
export function AuthVideoASCII() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', {alpha: true});
    const sample = document.createElement('canvas');
    const sampler = sample.getContext('2d', {willReadFrequently: true});
    if (!stage || !video || !canvas || !context || !sampler) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)');
    const poster = new Image();
    let posterReady = false;
    let fallbackAttempted = false;
    let disposed = false;
    let visible = true;
    let frame = 0;
    let lastPaint = 0;
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let pixelRatio = 1;
    const pointer = {x: -1000, y: -1000, movedAt: -10000};

    function resize() {
      const bounds = stage!.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(bounds.width));
      const nextHeight = Math.max(1, Math.round(bounds.height));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * pixelRatio);
      canvas!.height = Math.round(height * pixelRatio);
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const cell = coarse.matches ? 17 : 13;
      columns = Math.max(1, Math.ceil(width / cell));
      rows = Math.max(1, Math.ceil(height / cell));
      sample.width = columns;
      sample.height = rows;
      draw(performance.now());
    }

    function draw(now: number) {
      if (width <= 1 || height <= 1 || columns === 0) return;
      const live = !reduced.matches && video!.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !video!.paused && video!.videoWidth > 0;
      const source: HTMLVideoElement | HTMLImageElement | null =
        live ? video! : posterReady ? poster : null;

      if (!source) return;
      const sourceWidth = live ? video!.videoWidth : poster.naturalWidth;
      const sourceHeight = live ? video!.videoHeight : poster.naturalHeight;
      if (!sourceWidth || !sourceHeight) return;

      const ratio = width / height;
      const cropWidth = Math.min(sourceWidth, sourceHeight * ratio);
      const cropHeight = Math.min(sourceHeight, sourceWidth / ratio);
      const xOffset = (sourceWidth - cropWidth) / 2;
      const yOffset = (sourceHeight - cropHeight) * 0.45;

      try {
        sampler!.drawImage(source, xOffset, yOffset, cropWidth, cropHeight, 0, 0, columns, rows);
        const rgba = sampler!.getImageData(0, 0, columns, rows).data;

        // The forest is dark: local normalization avoids a field of invisible dots.
        let min = 255, max = 0;
        const lightness = new Float32Array(columns * rows);
        for (let i = 0; i < lightness.length; i++) {
          const offset = i * 4;
          const luminance = rgba[offset] * 0.22 + rgba[offset + 1] * 0.68 + rgba[offset + 2] * 0.10;
          lightness[i] = luminance;
          min = Math.min(min, luminance);
          max = Math.max(max, luminance);
        }
        const low = min + (max - min) * 0.09;
        const range = Math.max(24, (max - min) * 0.77);
        const cellWidth = width / columns;
        const cellHeight = height / rows;
        const pointerFresh = !coarse.matches && now - pointer.movedAt < 1700;

        context!.clearRect(0, 0, width, height);
        // Opaque-enough dark ink makes ASCII readable over moving footage.
        context!.fillStyle = 'rgba(2, 8, 4, 0.60)';
        context!.fillRect(0, 0, width, height);
        context!.font = '500 ' + Math.max(10, Math.min(15, cellHeight * 0.9)) +
          'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        context!.textAlign = 'center';
        context!.textBaseline = 'middle';

        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const index = row * columns + column;
            const x = (column + 0.5) * cellWidth;
            const y = (row + 0.5) * cellHeight;
            const distance = pointerFresh ? Math.hypot(x - pointer.x, y - pointer.y) : 1000;
            const influence = clamp(1 - distance / 165, 0, 1);
            const normalized = clamp((lightness[index] - low) / range, 0, 1);
            const tone = Math.pow(normalized, 0.75);
            const shimmer = influence * (Math.sin(now * .015 + column * 1.79 + row * .51) * 2.4);
            const glyphIndex = clamp(
              Math.round(tone * (GLYPHS.length - 1) + shimmer),
              0,
              GLYPHS.length - 1
            );
            const glyph = GLYPHS[glyphIndex];
            if (glyph === ' ') continue;
            const opacity = clamp(0.37 + tone * 0.55 + influence * 0.42, 0, 1);
            const red = Math.round(153 + influence * 48);
            const green = Math.round(194 + influence * 43);
            const blue = Math.round(160 + influence * 50);
            context!.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + opacity.toFixed(3) + ')';
            context!.fillText(glyph, x, y);
          }
        }
      } catch {
        // A failed video decode still leaves a CSS poster behind the canvas.
        context!.clearRect(0, 0, width, height);
      }
    }

    function tick(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || reduced.matches) return;
      if (now - lastPaint >= (coarse.matches ? 125 : 80)) {
        lastPaint = now;
        draw(now);
      }
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (disposed) return;
      if (reduced.matches || !visible || document.hidden) {
        video!.pause();
        if (reduced.matches) draw(performance.now());
        return;
      }
      // Play is best effort. The poster remains an ASCII fallback on rejection.
      void video!.play().catch(() => { if (!disposed) draw(performance.now()); });
      lastPaint = 0;
      frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      if (coarse.matches || reduced.matches) return;
      const bounds = stage!.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.movedAt = performance.now();
      stage!.style.setProperty('--portal-pointer-x', pointer.x + 'px');
      stage!.style.setProperty('--portal-pointer-y', pointer.y + 'px');
    }
    function onPointerLeave() {
      pointer.movedAt = -10000;
      stage!.style.removeProperty('--portal-pointer-x');
      stage!.style.removeProperty('--portal-pointer-y');
    }

    poster.onload = () => {
      if (disposed) return;
      posterReady = true;
      draw(performance.now());
    };
    poster.onerror = () => {
      if (disposed || fallbackAttempted) return;
      fallbackAttempted = true;
      poster.src = FALLBACK;
    };
    poster.decoding = 'async';
    poster.src = POSTER;

    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0.01});
    observer.observe(stage);
    intersection.observe(stage);
    resize();

    const onFrameReady = () => draw(performance.now());
    video.addEventListener('loadeddata', onFrameReady);
    video.addEventListener('playing', onFrameReady);
    stage.addEventListener('pointermove', onPointerMove, {passive: true});
    stage.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      video.pause();
      observer.disconnect();
      intersection.disconnect();
      video.removeEventListener('loadeddata', onFrameReady);
      video.removeEventListener('playing', onFrameReady);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      poster.onload = null;
      poster.onerror = null;
      onPointerLeave();
    };
  }, []);

  return <div className="portal-video-stage" ref={stageRef}>
    <video ref={videoRef} className="portal-video" autoPlay muted loop playsInline
      preload="metadata" poster={POSTER} aria-hidden="true" tabIndex={-1}>
      <source src="/videos/prumo-login.webm" type="video/webm" />
      <source src="/videos/prumo-login.mp4" type="video/mp4" />
    </video>
    <canvas className="portal-video-ascii" ref={canvasRef} aria-hidden="true" />
    <div className="portal-video-pointer" aria-hidden="true" />
    <div className="portal-video-grid" aria-hidden="true" />
  </div>;
}
