import { existsSync, readFileSync } from 'node:fs';

const required = [
  'src/app/page.tsx',
  'src/app/host/[code]/page.tsx',
  'src/app/play/[code]/page.tsx',
  'src/app/api/games/create/route.ts',
  'src/app/api/games/[code]/state/route.ts',
  'src/app/api/library/image/route.ts',
  'supabase/migrations/001_initial.sql',
  'supabase/migrations/002_hardening_and_achievements.sql',
  'supabase/seed.sql',
  'docs/SUPABASE_SETUP.md',
  'docs/DEPLOY_VERCEL.md'
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Falta archivo requerido: ${file}`);
}

const initialSql = readFileSync('supabase/migrations/001_initial.sql', 'utf8');
const roundsBlock = initialSql.slice(initialSql.indexOf('create table public.game_rounds'), initialSql.indexOf('create table public.game_round_scan_tokens'));
if (roundsBlock.includes('scan_token')) throw new Error('El token DJ no debe vivir en game_rounds.');
if (!initialSql.includes('alter table public.game_round_scan_tokens enable row level security')) throw new Error('Falta RLS para tokens DJ.');
if (initialSql.includes('alter publication supabase_realtime add table public.game_round_scan_tokens')) throw new Error('Los tokens DJ no deben publicarse por Realtime.');

const env = readFileSync('.env.example', 'utf8');
if (/NEXT_PUBLIC_.*SERVICE_ROLE/.test(env)) throw new Error('Service role expuesta como variable pública.');
if (!env.includes('SUPABASE_SERVICE_ROLE_KEY=')) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY.');

const stateRoute = readFileSync('src/app/api/games/[code]/state/route.ts', 'utf8');
if (stateRoute.includes('{ ...round,')) throw new Error('El endpoint de estado no debe propagar la fila de ronda completa.');

console.log(`Estructura válida: ${required.length} archivos críticos y controles de seguridad OK.`);
