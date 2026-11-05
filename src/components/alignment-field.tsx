'use client';
import {useEffect,useRef} from 'react';
import {createAlignmentRenderer} from '@/lib/alignment-shader';
export function AlignmentField(){const ref=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const root=ref.current,canvas=canvasRef.current;if(!root||!canvas)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');let renderer:ReturnType<typeof createAlignmentRenderer>=null,raf=0,last=0,seconds=0,dpr=1,visible=false,disposed=false;let pointer={x:.5,y:.5};
  function draw(){renderer?.draw(seconds,dpr,pointer.x,pointer.y);}
  function loop(now:number){if(now-last>=33){seconds+=Math.min((now-last)/1000,.05);last=now;draw();}raf=requestAnimationFrame(loop);}
  function update(){cancelAnimationFrame(raf);if(renderer&&visible&&!document.hidden&&!reduced.matches){last=performance.now();raf=requestAnimationFrame(loop);}else draw();}
  function resize(){const rect=canvas!.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,coarse.matches?1:1.25);canvas!.width=Math.max(1,Math.round(rect.width*dpr));canvas!.height=Math.max(1,Math.round(rect.height*dpr));draw();}
  function initialize(){renderer?.dispose();renderer=createAlignmentRenderer(canvas!);root!.dataset.shader=renderer?'ready':'fallback';resize();update();}
  const size=new ResizeObserver(resize);size.observe(canvas);const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();});observer.observe(root);
  const move=(event:PointerEvent)=>{if(coarse.matches)return;const rect=canvas!.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/rect.width,y:1-(event.clientY-rect.top)/rect.height};};
  const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);root!.dataset.shader='fallback';renderer=null;};
  root.addEventListener('pointermove',move,{passive:true});canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',initialize);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  document.fonts.ready.then(()=>{if(!disposed)initialize();});
  return()=>{disposed=true;cancelAnimationFrame(raf);size.disconnect();observer.disconnect();root.removeEventListener('pointermove',move);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',initialize);document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);renderer?.dispose();};
 },[]);
 return <div ref={ref} className="alignment-field shader-field" aria-hidden="true"><pre className="shader-fallback">{Array.from({length:18},(_,i)=>(i%2?'R $ / +  ·  ':'· / $ R  + ').repeat(32)).join('\n')}</pre><canvas ref={canvasRef}/><span>ENTRADAS · ESCOLHAS · NOVOS CAMINHOS</span></div>;
}
