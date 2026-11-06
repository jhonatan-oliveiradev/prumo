'use client';

import {useEffect, useRef} from 'react';

const glyphs = ' .,:;i1tfLCG08@';

/**
 * A lightweight, pointer-reactive ASCII treatment sampled from the playing video.
 * Only a tiny offscreen pixel grid is read (not full-resolution video frames).
 */
export function AuthVideoASCII() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', {alpha: true});
    const sample = document.createElement('canvas');
    const sampleContext = sample.getContext('2d', {willReadFrequently: true});
    if (!root || !video || !canvas || !context || !sampleContext) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)');
    let visible = true;
    let raf = 0;
    let previous = 0;
    let width = 0;
    let height = 0;
    let cellsAcross = 0;
    let cellsDown = 0;
    const pointer = {x: -1000, y: -1000, touched: 0};

    function resize() {
      const bounds = root!.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const cell = coarse.matches ? 18 : 14;
      cellsAcross = Math.max(1, Math.ceil(width / cell));
      cellsDown = Math.max(1, Math.ceil(height / cell));
      canvas!.width = width;
      canvas!.height = height;
      sample.width = cellsAcross;
      sample.height = cellsDown;
    }

    function draw(now: number) {
      raf = 0;
      if (reduced.matches || document.hidden || !visible || video!.readyState < 2) return;
      if (now - previous >= (coarse.matches ? 145 : 88)) {
        previous = now;
        const vw = video!.videoWidth, vh = video!.videoHeight;
        if (vw > 0 && vh > 0 && width > 0 && height > 0) {
          // Replicate object-fit: cover so the glyphs match the cropped footage.
          const ratio = width / height;
          const cropWidth = Math.min(vw, vh * ratio);
          const cropHeight = Math.min(vh, vw / ratio);
          const cropX = (vw - cropWidth) / 2;
          const cropY = (vh - cropHeight) / 2;
          try {
            sampleContext!.drawImage(video!, cropX, cropY, cropWidth, cropHeight, 0, 0, cellsAcross, cellsDown);
            const pixels = sampleContext!.getImageData(0, 0, cellsAcross, cellsDown).data;
            context!.clearRect(0, 0, width, height);
            const cellWidth = width / cellsAcross;
            const cellHeight = height / cellsDown;
            context!.font = '500 ' + Math.max(10, cellHeight * .84) + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
            context!.textAlign = 'center';
            context!.textBaseline = 'middle';
            const pointerFresh = now - pointer.touched < 1500;
            for (let row = 0; row < cellsDown; row++) {
              for (let col = 0; col < cellsAcross; col++) {
                const index = (row * cellsAcross + col) * 4;
                const light = (pixels[index] * .22 + pixels[index + 1] * .68 + pixels[index + 2] * .10) / 255;
                const x = (col + .5) * cellWidth, y = (row + .5) * cellHeight;
                const radius = coarse.matches ? 0 : 145;
                const proximity = pointerFresh && radius > 0 ?
                  Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / radius) : 0;
                const seed = (col * 13 + row * 7) % 17;
                const flicker = proximity * Math.sin(now * .012 + seed) * 2;
                const glyph = glyphs[Math.max(0, Math.min(glyphs.length - 1,
                  Math.floor(light * (glyphs.length - 1) + flicker)))];
                if (glyph === ' ') continue;
                const alpha = Math.min(.87, .16 + light * .32 + proximity * .48);
                context!.fillStyle = 'rgba(178, 225, 189, ' + alpha + ')';
                context!.fillText(glyph, x, y);
              }
            }
          } catch {
            // Unreadable or unsupported video frames: retain the poster fallback.
            context!.clearRect(0, 0, width, height);
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function sync() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduced.matches || document.hidden || !visible) {
        video!.pause();
        context!.clearRect(0, 0, width, height);
        return;
      }
      void video!.play().catch(() => {/* Autoplay may be blocked; keep the poster. */});
      if (video!.readyState >= 2) raf = requestAnimationFrame(draw);
    }

    function move(event: PointerEvent) {
      if (coarse.matches || reduced.matches) return;
      const bounds = root!.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.touched = performance.now();
      root!.style.setProperty('--portal-pointer-x', pointer.x + 'px');
      root!.style.setProperty('--portal-pointer-y', pointer.y + 'px');
    }
    function leave() {
      pointer.touched = 0;
      pointer.x = -1000;
      pointer.y = -1000;
      root!.style.removeProperty('--portal-pointer-x');
      root!.style.removeProperty('--portal-pointer-y');
    }
    function onMotion() { sync(); }

    const sizes = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0.01});
    sizes.observe(root);
    intersection.observe(root);
    resize();
    video.addEventListener('loadeddata', sync);
    root.addEventListener('pointermove', move, {passive: true});
    root.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', onMotion);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      video.pause();
      sizes.disconnect();
      intersection.disconnect();
      video.removeEventListener('loadeddata', sync);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', onMotion);
      leave();
    };
  }, []);

  return <div className="portal-video-stage" ref={rootRef}>
    <video ref={videoRef} className="portal-video" autoPlay muted loop playsInline
      preload="metadata" poster="/images/prumo-forest.webp" aria-hidden="true" tabIndex={-1}>
      <source src="/videos/prumo-login.mp4" type="video/mp4" />
      <source src="/videos/prumo-login.webm" type="video/webm" />
    </video>
    <canvas className="portal-video-ascii" ref={canvasRef} aria-hidden="true" />
    <div className="portal-video-pointer" aria-hidden="true" />
    <div className="portal-video-grid" aria-hidden="true" />
  </div>;
}
