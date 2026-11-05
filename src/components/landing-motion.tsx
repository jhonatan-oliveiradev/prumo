'use client';
import {useEffect} from 'react';

/** Motion enhances the document: no JS, reduced motion and keyboard access stay immediate. */
export function LandingMotion(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>('.reference-landing');if(!root)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const pending=new Set<HTMLElement>(),animations=new Map<HTMLElement,Animation>();
  let observer:IntersectionObserver|null=null;
  const selector=[
   '.ref-capabilities > a','.timeline-copy > .eyebrow','.timeline-copy > h2',
   '.use-case-copy > .eyebrow','.use-case-copy > h2','.use-case-accordion > div',
   '.ref-product-directory h2','.ref-product-directory .eyebrow','.directory-group',
   '.ref-advisor-copy > *','.ref-advisor-art','.ref-start-section h2',
   '.ref-start-section .eyebrow','.ref-start-links > a','.ref-closing > *',
   '.prumo-footer-brand','.prumo-footer-nav > div','.prumo-footer-bottom',
  ].join(',');
  const reset=()=>{observer?.disconnect();animations.forEach(a=>a.cancel());animations.clear();pending.forEach(el=>{el.style.removeProperty('opacity');});pending.clear();};
  const reveal=(el:HTMLElement,delay=0)=>{
   if(!pending.delete(el))return;
   observer?.unobserve(el);el.style.removeProperty('opacity');
   const animation=el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:720,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
   animations.set(el,animation);animation.onfinish=()=>{animation.cancel();animations.delete(el);};
  };
  const setup=()=>{
   reset();if(reduced.matches)return;
   observer=new IntersectionObserver(entries=>{
    const entering=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
    entering.forEach((entry,index)=>reveal(entry.target as HTMLElement,Math.min(index,4)*65));
   },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
   root.querySelectorAll<HTMLElement>(selector).forEach(el=>{
    // Leave the initial viewport and restored scroll position readable on hydration.
    if(el.getBoundingClientRect().top<innerHeight)return;
    pending.add(el);el.style.opacity='0';observer!.observe(el);
   });
  };
  const focus=(event:FocusEvent)=>{const target=event.target;if(target instanceof Element)pending.forEach(el=>{if(el.contains(target))reveal(el);});};
  setup();root.addEventListener('focusin',focus);reduced.addEventListener('change',setup);
  return()=>{reset();root.removeEventListener('focusin',focus);reduced.removeEventListener('change',setup);};
 },[]);
 return null;
}
