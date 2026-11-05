'use client';
import {useEffect} from 'react';
/** Native scroll with consistent anchor offsets. No wheel/touch interception. */
export function LandingScroll(){useEffect(()=>{document.documentElement.classList.add('prumo-landing-scroll');return()=>document.documentElement.classList.remove('prumo-landing-scroll');},[]);return null;}
