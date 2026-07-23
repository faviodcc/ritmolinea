import { AppShell } from '@/components/ui/AppShell';
import { Button } from '@/components/ui/Button';
import { Music2 } from 'lucide-react';
import Link from 'next/link';
export default function NotFound(){return <AppShell><div className="formCard glass" style={{textAlign:'center',marginTop:'10vh'}}><Music2 size={54}/><h1>Esta pista no existe</h1><p style={{color:'var(--muted)'}}>La página o la partida que buscas ya no está disponible.</p><Link href="/"><Button>Volver al inicio</Button></Link></div></AppShell>}
