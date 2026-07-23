import { PlayerGame } from '@/components/game/PlayerGame';
export default async function PlayPage({params}:{params:Promise<{code:string}>}){const{code}=await params;return <PlayerGame code={code.toUpperCase()}/>}
