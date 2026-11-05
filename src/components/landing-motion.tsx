'use client';

import {useEffect} from 'react';

const revealTargets = [
  '.ref-capabilities > a', '.use-case-copy > .eyebrow', '.use-case-copy > h2',
  '.use-case-accordion > div', '.use-case-visual',
  '.ref-product-directory h2', '.ref-product-directory .eyebrow', '.directory-group > *',
  '.ref-advisor-copy > *', '.ref-advisor-art', '.ref-start-section h2',
  '.ref-start-section .eyebrow', '.ref-start-links > a', '.ref-closing > *',
  '.prumo-footer-brand', '.prumo-footer-nav > div', '.prumo-footer-bottom',
].join(',');
const ease = 'cubic-bezier(.16,1,.3,1)';
const cipherGlyphs = '01/+#!:PRUMO';

function observeReveals(root: HTMLElement) {
  const targets = Array.from(root.querySelectorAll<HTMLElement>(revealTargets));
  const animations = new Map<HTMLElement, Animation>();

  function clear(element: HTMLElement) {
    animations.get(element)?.cancel();
    animations.delete(element);
    delete element.dataset.motionView;
  }

  function animate(element: HTMLElement, state: 'enter' | 'above' | 'below', delay = 0) {
    const previous = element.dataset.motionView;
    const opacity = getComputedStyle(element).opacity;
    clear(element);
    const entering = state === 'enter';
    if (!entering) element.dataset.motionView = state;
    const visual = element.matches('.use-case-visual,.ref-advisor-art');
    const animation = element.animate([
      {opacity, translate: entering && previous === 'below' ? `0 ${visual ? 22 : 14}px` : '0 0'},
      {opacity: entering ? 1 : state === 'above' ? .68 : 0, translate: entering ? '0 0' : state === 'above' ? '0 -8px' : '0 10px'},
    ], {duration: entering ? (visual ? 880 : 650) : 240, delay, easing: ease, fill: 'backwards'});
    animations.set(element, animation);
    animation.onfinish = () => { if (animations.get(element) === animation) animations.delete(element); };
  }

  const observer = new IntersectionObserver(entries => {
    let order = 0;
    entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach(entry => {
      const element = entry.target as HTMLElement;
      if (element.contains(document.activeElement)) { clear(element); return; }
      // A running reveal moves its own bounds. Ignore the brief crossing it creates.
      if (!entry.isIntersecting && animations.has(element) && entry.boundingClientRect.bottom > 30 && entry.boundingClientRect.top < innerHeight + 30) return;
      if (entry.isIntersecting) {
        if (element.dataset.motionView) animate(element, 'enter', Math.min(order++, 3) * 55);
      } else if (entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 60)) {
        if (!element.dataset.motionView) animate(element, 'above');
        else { clear(element); element.dataset.motionView = 'above'; }
      } else if (entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? innerHeight)) {
        if (!element.dataset.motionView) animate(element, 'below');
        else { clear(element); element.dataset.motionView = 'below'; }
      }
    });
  }, {rootMargin: '-58px 0px -32px 0px'});

  for (const element of targets) {
    if (element.getBoundingClientRect().top >= innerHeight) element.dataset.motionView = 'below';
    observer.observe(element);
  }
  const onFocus = (event: FocusEvent) => {
    if (event.target instanceof Node) for (const element of targets) {
      if (element.contains(event.target)) clear(element);
    }
  };
  root.addEventListener('focusin', onFocus);
  return () => {
    observer.disconnect();
    targets.forEach(clear);
    root.removeEventListener('focusin', onFocus);
  };
}

function observeCipher(root: HTMLElement) {
  const active = new Map<HTMLElement, {text: string; letters: string[]; started: number}>();
  const hover = matchMedia('(any-hover: hover)');
  let frame = 0;
  let lastPaint = 0;

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const layer of active.keys()) layer.removeAttribute('data-cipher');
    active.clear();
  }

  function tick(now: number) {
    frame = 0;
    if (document.hidden) { reset(); return; }
    if (now - lastPaint >= 34) {
      lastPaint = now;
      for (const [layer, {text, letters, started}] of active) {
        const elapsed = Math.max(0, now - started);
        if (!layer.isConnected || elapsed >= 380 || layer.previousElementSibling?.textContent !== text) {
          layer.removeAttribute('data-cipher');
          active.delete(layer);
          continue;
        }
        const cipherAmount = elapsed < 85 ? elapsed / 85 : 1 - (elapsed - 85) / 295;
        const scrambled = letters.map((letter, index) => {
          const position = ((index * 0.618) % 1);
          if (!/[\p{L}\p{N}]/u.test(letter) || position > cipherAmount) return letter;
          return cipherGlyphs[(index * 7 + Math.floor(elapsed / 38)) % cipherGlyphs.length];
        }).join('');
        layer.setAttribute('data-cipher', scrambled);
      }
    }
    if (active.size) frame = requestAnimationFrame(tick);
  }

  function controlFor(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;
    const control = target.closest('a,button,summary');
    if (!control || (!root.contains(control) && !control.closest('.ref-nav-menu'))) return null;
    return control;
  }

  function enter(event: PointerEvent | FocusEvent) {
    const control = controlFor(event.target);
    if (!control || control.matches(':disabled,[aria-disabled="true"]')) return;
    if (event instanceof PointerEvent) {
      if (!hover.matches || event.pointerType === 'touch' || controlFor(event.relatedTarget) === control) return;
    } else if (!control.matches(':focus-visible')) return;
    for (const label of control.querySelectorAll('.motion-label')) {
      const layer = label.lastElementChild;
      const text = label.firstElementChild?.textContent;
      if (layer instanceof HTMLElement && text && label.getClientRects().length) {
        active.set(layer, {text, letters: Array.from(text), started: performance.now()});
      }
    }
    if (active.size && !frame) frame = requestAnimationFrame(tick);
  }

  function leave(event: PointerEvent | FocusEvent) {
    const control = controlFor(event.target);
    if (!control || controlFor(event.relatedTarget) === control) return;
    if (event instanceof PointerEvent && control.matches(':focus-visible')) return;
    for (const layer of control.querySelectorAll<HTMLElement>('.motion-label > :last-child')) {
      layer.removeAttribute('data-cipher');
      active.delete(layer);
    }
  }

  document.addEventListener('pointerover', enter);
  document.addEventListener('pointerout', leave);
  document.addEventListener('focusin', enter);
  document.addEventListener('focusout', leave);
  document.addEventListener('visibilitychange', reset);
  return () => {
    reset();
    document.removeEventListener('pointerover', enter);
    document.removeEventListener('pointerout', leave);
    document.removeEventListener('focusin', enter);
    document.removeEventListener('focusout', leave);
    document.removeEventListener('visibilitychange', reset);
  };
}

function observeFooter(art: SVGSVGElement) {
  let visible = false;
  let frame = 0;
  let pointerX: number | null = null;

  function paint() {
    frame = 0;
    if (!visible || document.hidden) return;
    const {top, height, left, width} = art.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight - top) / (innerHeight + height)));
    const tilt = pointerX === null ? 0 : Math.max(-1, Math.min(1, (pointerX - left) / width * 2 - 1));
    art.style.setProperty('--footer-drift', `${(progress - .5) * 22}px`);
    art.style.setProperty('--footer-tilt', `${tilt * 2.8}deg`);
  }
  function schedule() {
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(paint);
  }
  function sync() {
    art.toggleAttribute('data-live', visible && !document.hidden);
    if (visible && !document.hidden) schedule();
    else { cancelAnimationFrame(frame); frame = 0; pointerX = null; }
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(art);
  const move = (event: PointerEvent) => { if (event.pointerType !== 'touch') { pointerX = event.clientX; schedule(); } };
  const leave = () => { pointerX = null; schedule(); };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  document.addEventListener('visibilitychange', sync);
  art.addEventListener('pointermove', move, {passive: true});
  art.addEventListener('pointerleave', leave);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    art.removeAttribute('data-live');
    art.style.removeProperty('--footer-drift');
    art.style.removeProperty('--footer-tilt');
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', sync);
    art.removeEventListener('pointermove', move);
    art.removeEventListener('pointerleave', leave);
  };
}

/** Motion is scoped to the landing and responds to changes in system preference. */
export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.reference-landing');
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup: (() => void)[] = [];
    function setup() {
      cleanup.forEach(stop => stop());
      cleanup = [];
      if (reduced.matches || !root) return;
      cleanup.push(observeCipher(root));
      if (!('IntersectionObserver' in window)) return;
      if ('animate' in HTMLElement.prototype) cleanup.push(observeReveals(root));
      const art = root.querySelector<SVGSVGElement>('.prumo-footer-art');
      if (art) cleanup.push(observeFooter(art));
    }
    setup();
    reduced.addEventListener('change', setup);
    return () => { cleanup.forEach(stop => stop()); reduced.removeEventListener('change', setup); };
  }, []);
  return null;
}
