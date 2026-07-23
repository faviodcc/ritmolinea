'use client';
import { useEffect } from 'react';
export function ThemeBoot(){useEffect(()=>{const stored=localStorage.getItem('rl-theme')||'dark';document.documentElement.dataset.appearance=stored;},[]);return null;}
