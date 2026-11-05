'use client';

import {createContext, useContext, useEffect, useState} from 'react';

const LaunchContext = createContext(false);
export const useLaunchReady = () => useContext(LaunchContext);

/** One launch per document, shared by landing and app. No persisted splash flag. */
export function LaunchProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let disposed = false;
    let exitTimer: ReturnType<typeof setTimeout>;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function finish() {
      if (disposed) return;
      document.documentElement.classList.remove('prumo-boot');
      setReady(true);
    }
    function exit() {
      if (disposed) return;
      setLeaving(true);
      exitTimer = setTimeout(finish, reduced.matches ? 0 : 240);
    }
    // Fonts/load readiness with a hard upper bound; no artificial minimum wait.
    const timeout = setTimeout(() => beginExit(), 1100);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let loadHandler: (() => void) | undefined;
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>(resolve => {
      loadHandler = resolve;
      window.addEventListener('load', loadHandler, {once: true});
    });
    let exiting = false;
    const beginExit = () => { if (!exiting && !disposed) { exiting = true; clearTimeout(timeout); exit(); } };
    // Both routes leave the same symbol; the app retains its own data skeleton.
    Promise.all([fonts, loaded]).then(beginExit, beginExit);
    const onReduced = () => { if (reduced.matches) { clearTimeout(exitTimer); finish(); } };
    reduced.addEventListener('change', onReduced);
    return () => {
      disposed = true;
      clearTimeout(timeout); clearTimeout(exitTimer);
      if (loadHandler) window.removeEventListener('load', loadHandler);
      reduced.removeEventListener('change', onReduced);
      document.documentElement.classList.remove('prumo-boot');
    };
  }, []);
  return <LaunchContext.Provider value={ready}>
    {!ready && <div className="prumo-launch" data-leaving={leaving} role="status" aria-label="Preparando o Prumo">
      <div className="prumo-launch-mark" aria-hidden="true"><svg viewBox="0 0 65 65" width="65" height="65" fill="none"><rect x=".5" y=".5" width="64" height="64" rx="18" stroke="#28513b"/><path className="launch-stroke" d="M19 46V16H34.5C45 16 50 19 50 28S44 37 34.5 37H29" stroke="#91b59c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1"/><circle className="launch-point" cx="46" cy="46" r="3.25" fill="#91b59c"/></svg><span>prumo.</span></div>
    </div>}
    {children}
  </LaunchContext.Provider>;
}
