'use client';
import {useEffect} from 'react';
/** Progressive enhancement: server content is always visible without JS or motion. */
export function LandingMotion(){useEffect(()=>{
 const root=document.querySelector<HTMLElement>('.landing');if(!root)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let observer:IntersectionObserver|null=null;const animations:Animation[]=[];
 function setup(){observer?.disconnect();animations.splice(0).forEach(a=>a.cancel());if(reduced.matches)return;
  observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;observer?.unobserve(entry.target);animations.push(entry.target.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'}));});},{threshold:.12});
  root!.querySelectorAll('[data-reveal]').forEach(el=>observer!.observe(el));
 }
 setup();reduced.addEventListener('change',setup);return()=>{observer?.disconnect();animations.forEach(a=>a.cancel());reduced.removeEventListener('change',setup);};
 },[]);return null;}
