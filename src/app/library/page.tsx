import { AppShell } from '@/components/ui/AppShell'; import { SongManager } from '@/components/library/SongManager';
export const metadata={title:'Biblioteca'};
export default function LibraryPage(){return <AppShell wide><div className="pageHead"><div><span className="eyebrow">Centro de contenido</span><h1>Biblioteca musical</h1><p>Administra canciones, metadatos, modos y enlaces de Spotify. Importa o exporta lotes en JSON.</p></div></div><SongManager/></AppShell>}
