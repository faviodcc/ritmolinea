'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>console.error(error),[error]);return <div className="gamePage" style={{display:'grid',placeItems:'center'}}><div className="formCard glass" style={{textAlign:'center'}}><h1>El ritmo se interrumpió</h1><p style={{color:'var(--muted)'}}>Ocurrió un error inesperado. Puedes reintentar sin perder la sala.</p><Button onClick={reset}>Reintentar</Button></div></div>}
