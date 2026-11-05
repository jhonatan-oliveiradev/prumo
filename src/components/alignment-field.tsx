'use client';
import {useEffect,useRef} from 'react';
/** A local, original 2D field. Stops when hidden, offscreen or reduced motion is enabled. */
export function AlignmentField(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{
 const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');let width=0,height=0,raf=0,last=0,t=0,visible=false;let pointer={x:.5,y:.5};
 function draw(){ctx!.clearRect(0,0,width,height);const columns=Math.max(15,Math.floor(width/25));const rows=Math.max(5,Math.floor(height/24));
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
   const x=(column+.5)*width/columns,y=(row+.5)*height/rows;const wave=Math.sin(column*.13+t*.35)*Math.cos(row*.38+t*.2);const distance=Math.abs(y-height*.5-Math.sin(column*.08+t*.22)*height*.19);const focus=Math.max(0,1-distance/(height*.5));const near=!coarse.matches?Math.max(0,1-Math.hypot(x-width*pointer.x,y-height*pointer.y)/180):0;
   ctx!.strokeStyle=`rgba(145,181,156,${.08+focus*.32+near*.2})`;ctx!.lineWidth=1;
   ctx!.beginPath();const length=2+focus*6;ctx!.moveTo(x-length/2,y+wave*5);ctx!.lineTo(x+length/2,y+wave*5);ctx!.stroke();
  }
  ctx!.strokeStyle='rgba(145,181,156,.35)';ctx!.beginPath();ctx!.moveTo(0,height*.5);ctx!.lineTo(width,height*.5);ctx!.stroke();
 }
 function loop(now:number){if(now-last>33){t+=.018;last=now;draw();}raf=requestAnimationFrame(loop);}
 function update(){cancelAnimationFrame(raf);if(visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(loop);else draw();}
 const resize=new ResizeObserver(()=>{const rect=canvas!.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas!.width=width*dpr;canvas!.height=height*dpr;ctx!.setTransform(dpr,0,0,dpr,0,0);draw();});resize.observe(canvas);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();});observer.observe(canvas);
 const move=(e:PointerEvent)=>{const rect=canvas!.getBoundingClientRect();pointer={x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height};};canvas.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
 return()=>{cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();canvas.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);};
 },[]);return <div className="alignment-field" aria-hidden="true"><canvas ref={ref}/><span>ENTRADAS · ESCOLHAS · NOVOS CAMINHOS</span></div>}
