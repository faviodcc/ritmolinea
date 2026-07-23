export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
export function avatarEmoji(id: string) {
  const map: Record<string,string> = {
    'pulse-fox':'🦊','neon-panda':'🐼','disco-cat':'🐱','beat-dog':'🐶','laser-koala':'🐨','vinyl-frog':'🐸',
    'groove-bear':'🐻','party-llama':'🦙','cosmic-owl':'🦉','synth-tiger':'🐯','funk-monkey':'🐵','retro-shark':'🦈'
  };
  return map[id] ?? '🎧';
}
export function formatMode(mode: string) {
  return ({classic:'Clásico',reggaeton:'Reggaetón',rock:'Rock',pop:'Pop',peru:'Perú',latino:'Latino',tiktok:'TikTok',disney:'Disney',anime:'Anime','90s':'90s','2000s':'2000s','2010s':'2010s',women:'Solo mujeres',bands:'Solo bandas',random:'Aleatorio'} as Record<string,string>)[mode] ?? mode;
}
export function secondsLeft(target?: string | null) {
  if (!target) return 0;
  return Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 1000));
}
